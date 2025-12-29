import express from 'express';
import cors from 'cors';
import { config } from './config';
import { startBot, stopBot } from './bot';
import { schedulerService } from './services/schedulerService';
import { telegramAuthMiddleware, trainerOnly } from './middleware/auth';
import apiRoutes from './routes/api';
import adminRoutes from './routes/admin';

const app = express();

// Middleware
app.use(cors({
  origin: [config.app.frontendUrl, config.app.webappUrl],
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
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
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
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Получен SIGINT, завершение работы...');
  stopBot();
  schedulerService.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Получен SIGTERM, завершение работы...');
  stopBot();
  schedulerService.stop();
  process.exit(0);
});

// Запуск приложения
start();
