import { Router, Request, Response } from 'express';
import { userService } from '../services/userService';
import { checkinService } from '../services/checkinService';
import { measurementService } from '../services/measurementService';
import { statsService } from '../services/statsService';
import { taskService } from '../services/taskService';
import { achievementService } from '../services/achievementService';
import { mindfulnessService } from '../services/mindfulnessService';
import { getCurrentWeek, getDaysUntilStart, isCourseStarted, canSubmitMeasurement, config } from '../config';
import { CheckinForm, MeasurementForm } from '../types';
import { query } from '../db/postgres';

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

// Установить цель участника
router.post('/user/:userId/goal', async (req: Request, res: Response) => {
  try {
    const { goal } = req.body;

    if (!goal || !['weight_loss', 'muscle_gain'].includes(goal)) {
      return res.status(400).json({ success: false, error: 'Invalid goal. Must be weight_loss or muscle_gain' });
    }

    const user = await userService.setGoal(req.params.userId, goal);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Set user goal error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Обновить данные онбординга (цель + рост + возраст + целевой вес)
router.post('/user/:userId/onboarding', async (req: Request, res: Response) => {
  try {
    const { goal, height, age, target_weight } = req.body;

    // Валидация
    if (goal && !['weight_loss', 'muscle_gain'].includes(goal)) {
      return res.status(400).json({ success: false, error: 'Invalid goal' });
    }
    if (height !== undefined && (height < 100 || height > 250)) {
      return res.status(400).json({ success: false, error: 'Height must be 100-250 cm' });
    }
    if (age !== undefined && (age < 14 || age > 100)) {
      return res.status(400).json({ success: false, error: 'Age must be 14-100' });
    }
    if (target_weight !== undefined && (target_weight <= 0 || target_weight >= 500)) {
      return res.status(400).json({ success: false, error: 'Target weight must be positive and less than 500 kg' });
    }

    const user = await userService.updateOnboardingData(req.params.userId, {
      goal,
      height,
      age,
      target_weight,
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Update onboarding error:', error);
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

// Задания с прогрессом для пользователя (с фильтрацией по цели)
router.get('/tasks/:userId', async (req: Request, res: Response) => {
  try {
    const weekNumber = req.query.week ? parseInt(req.query.week as string) : undefined;

    // Получаем цель пользователя для фильтрации заданий
    const user = await userService.findById(req.params.userId);
    const userGoal = user?.goal;

    const tasks = await taskService.getTasksWithProgress(req.params.userId, weekNumber, userGoal);
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

// ===== КОНЦЕПЦИИ НЕДЕЛИ =====

// Получить концепции недели для пользователя
router.get('/concepts/:userId', async (req: Request, res: Response) => {
  try {
    const weekNumber = req.query.week ? parseInt(req.query.week as string) : getCurrentWeek();

    // Получаем цель пользователя для фильтрации
    const user = await userService.findById(req.params.userId);
    const userGoal = user?.goal;

    const concepts = await taskService.getConceptsForWeek(weekNumber, userGoal);
    res.json({ success: true, data: concepts });
  } catch (error) {
    console.error('Get concepts error:', error);
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

// ===== ДНЕВНИК ОСОЗНАННОСТИ =====

// Получить запись за сегодня
router.get('/mindfulness/today/:userId', async (req: Request, res: Response) => {
  try {
    const entry = await mindfulnessService.getTodayEntry(req.params.userId);
    res.json({ success: true, data: entry });
  } catch (error) {
    console.error('Get mindfulness entry error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Получить последние записи
router.get('/mindfulness/:userId', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 7;
    const entries = await mindfulnessService.getRecentEntries(req.params.userId, limit);
    res.json({ success: true, data: entries });
  } catch (error) {
    console.error('Get mindfulness entries error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Создать/обновить запись за сегодня
router.post('/mindfulness/:userId', async (req: Request, res: Response) => {
  try {
    const entry = await mindfulnessService.createOrUpdateEntry(req.params.userId, req.body);
    res.json({ success: true, data: entry });
  } catch (error) {
    console.error('Save mindfulness entry error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ===== ТРЕКЕР ИМПУЛЬСОВ =====

// Получить последние импульсы
router.get('/impulses/:userId', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const impulses = await mindfulnessService.getRecentImpulses(req.params.userId, limit);
    res.json({ success: true, data: impulses });
  } catch (error) {
    console.error('Get impulses error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Статистика импульсов
router.get('/impulses/:userId/stats', async (req: Request, res: Response) => {
  try {
    const stats = await mindfulnessService.getImpulseStats(req.params.userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get impulse stats error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Залогировать импульс
router.post('/impulses/:userId', async (req: Request, res: Response) => {
  try {
    const { trigger_type, intensity, action_taken, notes } = req.body;

    // Валидация
    if (!['stress', 'boredom', 'social', 'emotional', 'habitual'].includes(trigger_type)) {
      return res.status(400).json({ success: false, error: 'Invalid trigger_type' });
    }
    if (!['resisted', 'gave_in', 'alternative'].includes(action_taken)) {
      return res.status(400).json({ success: false, error: 'Invalid action_taken' });
    }
    if (intensity < 1 || intensity > 10) {
      return res.status(400).json({ success: false, error: 'Intensity must be 1-10' });
    }

    const impulse = await mindfulnessService.logImpulse(req.params.userId, {
      trigger_type,
      intensity,
      action_taken,
      notes,
    });
    res.json({ success: true, data: impulse });
  } catch (error) {
    console.error('Log impulse error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Удалить импульс
router.delete('/impulses/:userId/:impulseId', async (req: Request, res: Response) => {
  try {
    await mindfulnessService.deleteImpulse(req.params.userId, req.params.impulseId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete impulse error:', error);
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

// DEBUG: Добавить тестовый замер для любой недели (только для тестирования)
router.post('/debug/add-measurement', async (req: Request, res: Response) => {
  try {
    const { telegram_id, week_number, weight, chest, waist, hips, bicep_left, bicep_right, thigh_left, thigh_right } = req.body;

    if (!telegram_id || !week_number || !weight) {
      return res.status(400).json({ success: false, error: 'Required: telegram_id, week_number, weight' });
    }

    // Найти пользователя
    const userResult = await query<{ id: string }>(
      'SELECT id FROM users WHERE telegram_id = $1',
      [telegram_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userId = userResult.rows[0].id;
    const today = new Date().toISOString().split('T')[0];

    // Проверяем существующий замер
    const existingResult = await query<{ id: string }>(
      'SELECT id FROM weekly_measurements WHERE user_id = $1 AND week_number = $2',
      [userId, week_number]
    );

    let result;
    if (existingResult.rows.length > 0) {
      result = await query(
        `UPDATE weekly_measurements SET
          date = $1, weight = $2, chest = $3, waist = $4, hips = $5,
          bicep_left = $6, bicep_right = $7, thigh_left = $8, thigh_right = $9
        WHERE id = $10 RETURNING *`,
        [today, weight, chest || null, waist || null, hips || null,
         bicep_left || null, bicep_right || null, thigh_left || null, thigh_right || null,
         existingResult.rows[0].id]
      );
    } else {
      result = await query(
        `INSERT INTO weekly_measurements
          (user_id, week_number, date, weight, chest, waist, hips, bicep_left, bicep_right, thigh_left, thigh_right)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [userId, week_number, today, weight, chest || null, waist || null, hips || null,
         bicep_left || null, bicep_right || null, thigh_left || null, thigh_right || null]
      );
    }

    res.json({ success: true, measurement: result.rows[0] });
  } catch (error) {
    console.error('Debug add-measurement error:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

// DEBUG: Применить миграцию для goal
router.post('/debug/migrate-goal', async (req: Request, res: Response) => {
  try {
    // Добавляем колонку goal если её нет
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS goal VARCHAR(20) DEFAULT NULL`);

    // Проверяем существование constraint
    const constraintResult = await query(`
      SELECT constraint_name FROM information_schema.table_constraints
      WHERE table_name = 'users' AND constraint_name = 'users_goal_check'
    `);

    if (constraintResult.rows.length === 0) {
      await query(`ALTER TABLE users ADD CONSTRAINT users_goal_check CHECK (goal IN ('weight_loss', 'muscle_gain') OR goal IS NULL)`);
    }

    res.json({ success: true, message: 'Migration applied successfully' });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

// DEBUG: Изменить роль и сбросить цель (для тестирования)
router.post('/debug/set-role/:telegram_id', async (req: Request, res: Response) => {
  try {
    const { telegram_id } = req.params;
    const { role, goal } = req.body;

    const result = await query(
      `UPDATE users SET role = COALESCE($1, role), goal = $2, updated_at = NOW()
       WHERE telegram_id = $3 RETURNING *`,
      [role, goal, telegram_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Debug set-role error:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

// DEBUG: Получить все замеры пользователя
router.get('/debug/measurements/:telegram_id', async (req: Request, res: Response) => {
  try {
    const { telegram_id } = req.params;

    const result = await query(
      `SELECT wm.*, u.first_name FROM weekly_measurements wm
       JOIN users u ON wm.user_id = u.id
       WHERE u.telegram_id = $1
       ORDER BY wm.week_number`,
      [telegram_id]
    );

    res.json({ success: true, measurements: result.rows });
  } catch (error) {
    console.error('Debug measurements error:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

export default router;
