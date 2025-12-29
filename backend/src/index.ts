import express from 'express';
import cors from 'cors';
import { config } from './config';
import { startBot, stopBot, bot } from './bot';
import { schedulerService } from './services/schedulerService';
import { telegramAuthMiddleware, trainerOnly } from './middleware/auth';
import { adminNotifier, initAdminNotifier } from './services/adminNotifierService';
import apiRoutes from './routes/api';
import adminRoutes from './routes/admin';

const app = express();

// Middleware
app.use(cors({
  origin: [
    config.app.frontendUrl,
    config.app.webappUrl.split('?')[0], // Remove query params
    /\.up\.railway\.app$/,
    /\.vercel\.app$/,
  ],
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Telegram auth middleware
app.use(telegramAuthMiddleware);

// API маршруты
app.use('/api', apiRoutes);

// Admin маршруты (только для тренера)
app.use('/admin', trainerOnly, adminRoutes);

// Error handler
app.use(async (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);

  // Отправляем уведомление об ошибке в админский чат
  await adminNotifier.error(err, {
    endpoint: req.path,
    method: req.method,
    userId: (req as any).user?.id,
    additionalInfo: `Query: ${JSON.stringify(req.query)}`,
  });

  res.status(500).json({
    success: false,
    error: config.app.nodeEnv === 'development' ? err.message : 'Internal server error',
  });
});

// Запуск
async function start() {
  try {
    // Запускаем Express сервер
    app.listen(config.app.port, () => {
      console.log(`🚀 Сервер запущен на порту ${config.app.port}`);
      console.log(`   Режим: ${config.app.nodeEnv}`);
      console.log(`   Frontend URL: ${config.app.frontendUrl}`);
    });

    // Запускаем Telegram бота
    await startBot();

    // Запускаем планировщик задач
    schedulerService.start();

    console.log('\n✅ Приложение полностью запущено!\n');

    // Уведомляем о деплое сразу после запуска
    console.log('[Startup] Sending deploy notification...');
    try {
      await adminNotifier.deploy();
      console.log('[Startup] Deploy notification sent successfully');
    } catch (e) {
      console.error('[Startup] Failed to send deploy notification:', e);
    }
  } catch (error) {
    console.error('Failed to start application:', error);
    await adminNotifier.critical(error as Error, 'Application startup');
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Получен SIGINT, завершение работы...');
  await stopBot('SIGINT');
  schedulerService.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Получен SIGTERM, завершение работы...');
  await stopBot('SIGTERM');
  schedulerService.stop();
  process.exit(0);
});

// Обработка необработанных исключений
process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error);
  await adminNotifier.critical(error, 'Uncaught Exception');
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  await adminNotifier.critical(
    reason instanceof Error ? reason : new Error(String(reason)),
    'Unhandled Promise Rejection'
  );
});

// Запуск приложения
start();
