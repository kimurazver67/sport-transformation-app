import { Router, Request, Response } from 'express';
import { userService } from '../services/userService';
import { checkinService } from '../services/checkinService';
import { measurementService } from '../services/measurementService';
import { statsService } from '../services/statsService';
import { taskService } from '../services/taskService';
import { achievementService } from '../services/achievementService';
import { getCurrentWeek, getDaysUntilStart, isCourseStarted, canSubmitMeasurement, config } from '../config';
import { CheckinForm, MeasurementForm } from '../types';

const router = Router();

// ===== ПОЛЬЗОВАТЕЛЬ =====

// Получить текущего пользователя по telegram_id
router.get('/user/:telegramId', async (req: Request, res: Response) => {
  try {
    const telegramId = parseInt(req.params.telegramId);
    const user = await userService.findByTelegramId(telegramId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ===== ЧЕКИНЫ =====

// Получить чекин за сегодня
router.get('/checkin/today/:userId', async (req: Request, res: Response) => {
  try {
    const checkin = await checkinService.getTodayCheckin(req.params.userId);
    res.json({ success: true, data: checkin });
  } catch (error) {
    console.error('Get today checkin error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Создать/обновить чекин
router.post('/checkin/:userId', async (req: Request, res: Response) => {
  try {
    const data: CheckinForm = req.body;
    const checkin = await checkinService.createOrUpdate(req.params.userId, data);
    res.json({ success: true, data: checkin });
  } catch (error) {
    console.error('Create checkin error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// История чекинов
router.get('/checkins/:userId', async (req: Request, res: Response) => {
  try {
    const checkins = await checkinService.getAllByUser(req.params.userId);
    res.json({ success: true, data: checkins });
  } catch (error) {
    console.error('Get checkins error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Статистика чекинов
router.get('/checkins/:userId/stats', async (req: Request, res: Response) => {
  try {
    const stats = await checkinService.getStats(req.params.userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get checkin stats error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ===== ЗАМЕРЫ =====

// Получить замер текущей недели
router.get('/measurement/current/:userId', async (req: Request, res: Response) => {
  try {
    const measurement = await measurementService.getCurrentWeekMeasurement(req.params.userId);
    res.json({ success: true, data: measurement });
  } catch (error) {
    console.error('Get current measurement error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Все замеры пользователя
router.get('/measurements/:userId', async (req: Request, res: Response) => {
  try {
    const measurements = await measurementService.getAllByUser(req.params.userId);
    res.json({ success: true, data: measurements });
  } catch (error) {
    console.error('Get measurements error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Проверка, можно ли вносить замеры
router.get('/measurement/can-submit', async (req: Request, res: Response) => {
  try {
    const timezoneOffset = req.query.tz ? parseInt(req.query.tz as string) : undefined;
    const result = canSubmitMeasurement(timezoneOffset);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Check measurement window error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Создать/обновить замер
router.post('/measurement/:userId', async (req: Request, res: Response) => {
  try {
    // Проверяем временное окно
    const timezoneOffset = req.body.timezoneOffset;
    const canSubmit = canSubmitMeasurement(timezoneOffset);

    if (!canSubmit.allowed) {
      return res.status(403).json({
        success: false,
        error: canSubmit.reason,
        nextWindow: canSubmit.nextWindow,
      });
    }

    const data: MeasurementForm = req.body;
    const measurement = await measurementService.createOrUpdate(req.params.userId, data);
    res.json({ success: true, data: measurement });
  } catch (error) {
    console.error('Create measurement error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Прогресс веса
router.get('/measurements/:userId/weight', async (req: Request, res: Response) => {
  try {
    const progress = await measurementService.getWeightProgress(req.params.userId);
    res.json({ success: true, data: progress });
  } catch (error) {
    console.error('Get weight progress error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Сравнение прогресса
router.get('/measurements/:userId/comparison', async (req: Request, res: Response) => {
  try {
    const comparison = await measurementService.getProgressComparison(req.params.userId);
    res.json({ success: true, data: comparison });
  } catch (error) {
    console.error('Get comparison error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ===== СТАТИСТИКА =====

// Статистика пользователя
router.get('/stats/:userId', async (req: Request, res: Response) => {
  try {
    const stats = await statsService.getUserStats(req.params.userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Рейтинг
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const leaderboard = await statsService.getLeaderboard(limit);
    res.json({ success: true, data: leaderboard });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Недельный рейтинг
router.get('/leaderboard/weekly', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const leaderboard = await statsService.getWeeklyLeaderboard(limit);
    res.json({ success: true, data: leaderboard });
  } catch (error) {
    console.error('Get weekly leaderboard error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ===== ЗАДАНИЯ =====

// Задания текущей недели
router.get('/tasks', async (req: Request, res: Response) => {
  try {
    const tasks = await taskService.getCurrentWeekTasks();
    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Задания с прогрессом для пользователя
router.get('/tasks/:userId', async (req: Request, res: Response) => {
  try {
    const weekNumber = req.query.week ? parseInt(req.query.week as string) : undefined;
    const tasks = await taskService.getTasksWithProgress(req.params.userId, weekNumber);
    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Get tasks with progress error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Отметить задание выполненным
router.post('/tasks/:taskId/complete/:userId', async (req: Request, res: Response) => {
  try {
    const completion = await taskService.complete(req.params.userId, req.params.taskId);
    res.json({ success: true, data: completion });
  } catch (error: any) {
    if (error.message === 'Task already completed') {
      return res.status(400).json({ success: false, error: 'Task already completed' });
    }
    console.error('Complete task error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Отменить выполнение задания
router.delete('/tasks/:taskId/complete/:userId', async (req: Request, res: Response) => {
  try {
    await taskService.uncomplete(req.params.userId, req.params.taskId);
    res.json({ success: true });
  } catch (error) {
    console.error('Uncomplete task error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ===== ДОСТИЖЕНИЯ =====

// Достижения пользователя
router.get('/achievements/:userId', async (req: Request, res: Response) => {
  try {
    const achievements = await achievementService.getUserAchievements(req.params.userId);
    res.json({ success: true, data: achievements });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ===== ОБЩЕЕ =====

// Текущая неделя курса и статус
router.get('/course/week', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      week: getCurrentWeek(),
      isStarted: isCourseStarted(),
      daysUntilStart: getDaysUntilStart()
    }
  });
});

// Триггер уведомления о деплое (для тестирования)
router.post('/notify-deploy', async (req: Request, res: Response) => {
  try {
    const { adminNotifier } = await import('../services/adminNotifierService');
    await adminNotifier.deploy();
    res.json({ success: true, message: 'Deploy notification sent' });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ===== ФОТО =====

// Получить временный URL фото по Telegram file_id
// URL действителен ~1 час, потом нужно запросить снова
router.get('/photo/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;

    // Получаем информацию о файле через Telegram API
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${config.bot.token}/getFile?file_id=${fileId}`
    );
    const telegramData = await telegramResponse.json() as { ok: boolean; result?: { file_path: string }; description?: string };

    if (!telegramData.ok || !telegramData.result?.file_path) {
      return res.status(404).json({
        success: false,
        error: 'Photo not found',
        details: telegramData.description
      });
    }

    // Формируем временный URL для скачивания
    const photoUrl = `https://api.telegram.org/file/bot${config.bot.token}/${telegramData.result.file_path}`;

    res.json({
      success: true,
      data: {
        url: photoUrl,
        expiresIn: '~1 hour'
      }
    });
  } catch (error) {
    console.error('Get photo URL error:', error);
    res.status(500).json({ success: false, error: 'Failed to get photo URL' });
  }
});

// Проксирование фото (чтобы не светить токен бота в URL на фронте)
router.get('/photo/:fileId/proxy', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;

    // Получаем информацию о файле через Telegram API
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${config.bot.token}/getFile?file_id=${fileId}`
    );
    const telegramData = await telegramResponse.json() as { ok: boolean; result?: { file_path: string }; description?: string };

    if (!telegramData.ok || !telegramData.result?.file_path) {
      return res.status(404).json({ success: false, error: 'Photo not found' });
    }

    // Скачиваем фото и отдаём напрямую
    const photoUrl = `https://api.telegram.org/file/bot${config.bot.token}/${telegramData.result.file_path}`;
    const photoResponse = await fetch(photoUrl);

    if (!photoResponse.ok) {
      return res.status(404).json({ success: false, error: 'Failed to fetch photo' });
    }

    // Устанавливаем заголовки для изображения
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Кешируем на 1 час

    // Стримим изображение
    const buffer = await photoResponse.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Proxy photo error:', error);
    res.status(500).json({ success: false, error: 'Failed to proxy photo' });
  }
});

// ===== DEBUG LOGGING =====
import { adminNotifier } from '../services/adminNotifierService';

// Глобальное состояние debug режима (экспортируем для бота)
export let debugModeEnabled = false;

export function setDebugMode(enabled: boolean): void {
  debugModeEnabled = enabled;
}

export function getDebugMode(): boolean {
  return debugModeEnabled;
}

router.post('/debug/log', async (req: Request, res: Response) => {
  try {
    // Если debug отключен - просто возвращаем success без отправки
    if (!debugModeEnabled) {
      return res.json({ success: true, debugEnabled: false });
    }

    const { message, data } = req.body;
    const logMessage = `🔍 <b>Frontend Debug</b>\n\n📝 ${message}\n${data ? `\n<pre>${JSON.stringify(data, null, 2)}</pre>` : ''}`;

    // Отправляем в телеграм через fetch
    await fetch(`https://api.telegram.org/bot${config.bot.token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.admin.chatId,
        text: logMessage,
        parse_mode: 'HTML',
      }),
    });

    res.json({ success: true, debugEnabled: true });
  } catch (error) {
    console.error('Debug log error:', error);
    res.status(500).json({ success: false, error: 'Failed to send debug log' });
  }
});

// Проверить статус debug режима
router.get('/debug/status', async (_req: Request, res: Response) => {
  res.json({ success: true, debugEnabled: debugModeEnabled });
});

export default router;
