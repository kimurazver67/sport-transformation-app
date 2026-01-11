import { Router, Request, Response } from 'express';
import { userService } from '../services/userService';
import { taskService } from '../services/taskService';
import { statsService } from '../services/statsService';
import { measurementService } from '../services/measurementService';
import { checkinService } from '../services/checkinService';
import { achievementService } from '../services/achievementService';
import { progressBonusService } from '../services/progressBonusService';
import { broadcastMessage, sendReminder } from '../bot';
import { getCurrentWeek } from '../config';
import { googleSheetsService } from '../services/googleSheetsService';

const router = Router();

// ===== ДАШБОРД =====

// Общая статистика курса
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const participants = await userService.getAllParticipants();
    const today = new Date().toISOString().split('T')[0];
    const weekNumber = getCurrentWeek();

    // Кто не внёс чекин сегодня
    const withoutCheckin = await userService.getWithoutCheckinToday();

    // Кто не внёс замеры на этой неделе
    const withoutMeasurement = await userService.getWithoutMeasurementThisWeek(weekNumber);

    // Средние показатели
    let totalWeightChange = 0;
    let weightChangeCount = 0;
    let totalStreak = 0;

    for (const p of participants) {
      const comparison = await measurementService.getProgressComparison(p.id);
      if (comparison.weightChange !== null) {
        totalWeightChange += comparison.weightChange;
        weightChangeCount++;
      }

      const stats = await statsService.getUserStats(p.id);
      if (stats) {
        totalStreak += stats.current_streak;
      }
    }

    res.json({
      success: true,
      data: {
        total_participants: participants.length,
        active_today: participants.length - withoutCheckin.length,
        missing_checkin_today: withoutCheckin,
        missing_measurement_this_week: withoutMeasurement,
        average_weight_change: weightChangeCount > 0 ? totalWeightChange / weightChangeCount : 0,
        average_streak: participants.length > 0 ? totalStreak / participants.length : 0,
        course_week: weekNumber,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Список всех участников с метриками
router.get('/participants', async (req: Request, res: Response) => {
  try {
    const participants = await userService.getAllParticipants();
    const result = [];

    for (const p of participants) {
      const stats = await statsService.getUserStats(p.id);
      const comparison = await measurementService.getProgressComparison(p.id);
      const todayCheckin = await checkinService.getTodayCheckin(p.id);

      result.push({
        user: p,
        stats,
        weight_start: comparison.start?.weight || null,
        weight_current: comparison.current?.weight || null,
        weight_change: comparison.weightChange,
        has_checkin_today: !!todayCheckin,
      });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get participants error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Прогресс конкретного участника
router.get('/participant/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;

    const user = await userService.findByTelegramId(parseInt(userId));
    if (!user) {
      // Попробуем по UUID
      const participants = await userService.getAllParticipants();
      const found = participants.find(p => p.id === userId);
      if (!found) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
    }

    const actualUserId = user?.id || userId;

    const stats = await statsService.getUserStats(actualUserId);
    const measurements = await measurementService.getAllByUser(actualUserId);
    const checkins = await checkinService.getAllByUser(actualUserId);
    const achievements = await achievementService.getUserAchievements(actualUserId);
    const tasks = await taskService.getTasksWithProgress(actualUserId);

    res.json({
      success: true,
      data: {
        user: user || { id: actualUserId },
        stats,
        measurements,
        checkins,
        achievements,
        tasks,
      },
    });
  } catch (error) {
    console.error('Get participant error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ===== ЗАДАНИЯ =====

// Получить все задания (опционально по неделе)
router.get('/tasks', async (req: Request, res: Response) => {
  try {
    const weekNumber = req.query.week ? parseInt(req.query.week as string) : undefined;
    const tasks = weekNumber !== undefined
      ? await taskService.getByWeek(weekNumber)
      : await taskService.getAll();
    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Создать задание
router.post('/tasks', async (req: Request, res: Response) => {
  try {
    const { week_number, title, description, goal, is_bonus } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    const week = week_number || getCurrentWeek();
    const task = await taskService.create(week, title, description, goal, is_bonus);

    res.json({ success: true, data: task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Обновить задание
router.put('/tasks/:taskId', async (req: Request, res: Response) => {
  try {
    const { title, description, goal, is_bonus } = req.body;
    const task = await taskService.update(req.params.taskId, { title, description, goal, is_bonus });
    res.json({ success: true, data: task });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Удалить задание
router.delete('/tasks/:taskId', async (req: Request, res: Response) => {
  try {
    await taskService.delete(req.params.taskId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Статистика выполнения заданий
router.get('/tasks/stats', async (req: Request, res: Response) => {
  try {
    const weekNumber = req.query.week ? parseInt(req.query.week as string) : undefined;
    const stats = await taskService.getCompletionStats(weekNumber);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Сбросить выполнение заданий для всех пользователей
router.post('/tasks/reset-completions', async (req: Request, res: Response) => {
  try {
    const { query: dbQuery } = await import('../db/postgres');

    // Удаляем все записи о выполнении заданий
    const result = await dbQuery('DELETE FROM task_completions RETURNING *');
    const deletedCount = result.rowCount || 0;

    console.log(`Reset task completions: deleted ${deletedCount} records`);

    res.json({
      success: true,
      data: {
        deletedCount,
        message: `Сброшено ${deletedCount} выполненных заданий`
      }
    });
  } catch (error) {
    console.error('Reset task completions error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ===== УВЕДОМЛЕНИЯ =====

// Отправить напоминание одному участнику
router.post('/remind/:userId', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const userId = req.params.userId;

    // Получаем telegram_id
    const participants = await userService.getAllParticipants();
    const user = participants.find(p => p.id === userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const defaultMessage = '👋 Привет! Не забудь отметить сегодняшний чекин в приложении!';
    const success = await sendReminder(user.telegram_id, message || defaultMessage);

    res.json({ success });
  } catch (error) {
    console.error('Send reminder error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Массовая рассылка
router.post('/broadcast', async (req: Request, res: Response) => {
  try {
    const { message, role } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const result = await broadcastMessage(message, role || 'participant');
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ===== GOOGLE SHEETS =====

// Синхронизировать с Google Sheets
router.post('/sync-sheets', async (req: Request, res: Response) => {
  try {
    await googleSheetsService.syncAll();
    res.json({ success: true, message: 'Synchronization completed' });
  } catch (error) {
    console.error('Sync sheets error:', error);
    res.status(500).json({ success: false, error: 'Failed to sync with Google Sheets' });
  }
});

// Получить ссылку на Google Sheets
router.get('/sheets-url', (req: Request, res: Response) => {
  const url = googleSheetsService.getSpreadsheetUrl();
  res.json({ success: true, data: { url } });
});

// ===== РАЗБЛОКИРОВКА ЗАМЕРОВ =====

// Открыть замеры для участника на определённое время
router.post('/unlock-measurement/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const { hours = 24 } = req.body; // По умолчанию 24 часа

    // Получаем пользователя
    const participants = await userService.getAllParticipants();
    const user = participants.find(p => p.id === userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Устанавливаем время разблокировки
    const unlockUntil = await userService.unlockMeasurement(userId, hours);

    res.json({
      success: true,
      data: {
        userId,
        userName: user.first_name,
        unlocked_until: unlockUntil,
      },
    });
  } catch (error) {
    console.error('Unlock measurement error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Закрыть замеры для участника (отменить разблокировку)
router.post('/lock-measurement/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;

    await userService.lockMeasurement(userId);

    res.json({ success: true });
  } catch (error) {
    console.error('Lock measurement error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ===== БОНУСЫ ЗА ПРОГРЕСС =====

// Запустить начисление бонусов за прогресс вручную
router.post('/award-progress-bonuses', async (req: Request, res: Response) => {
  try {
    const weekNumber = req.body.week || getCurrentWeek();
    const result = await progressBonusService.awardProgressBonuses(weekNumber);

    res.json({
      success: true,
      data: {
        week: weekNumber,
        awarded: result.awarded,
        totalPoints: result.totalPoints,
        details: result.details,
      },
    });
  } catch (error) {
    console.error('Award progress bonuses error:', error);
    res.status(500).json({ success: false, error: 'Failed to award progress bonuses' });
  }
});

// Просмотр прогресса за неделю (без начисления)
router.get('/weekly-progress/:week?', async (req: Request, res: Response) => {
  try {
    const weekNumber = parseInt(req.params.week || '') || getCurrentWeek();
    const progressList = await progressBonusService.calculateWeeklyProgress(weekNumber);

    // Добавляем уровень бонуса для каждого
    const withTiers = progressList.map(p => ({
      ...p,
      tier: progressBonusService.getProgressTier(p.totalProgressPercent),
    }));

    res.json({
      success: true,
      data: {
        week: weekNumber,
        participants: withTiers.sort((a, b) => b.totalProgressPercent - a.totalProgressPercent),
      },
    });
  } catch (error) {
    console.error('Get weekly progress error:', error);
    res.status(500).json({ success: false, error: 'Failed to get weekly progress' });
  }
});

// ===== СБРОС БАЛЛОВ =====

// Сбросить баллы всем пользователям
router.post('/reset-points', async (req: Request, res: Response) => {
  try {
    const { points = 100 } = req.body;

    const result = await statsService.resetAllPoints(points);

    res.json({
      success: true,
      data: {
        message: `Points reset to ${points} for all users`,
        updated: result
      }
    });
  } catch (error) {
    console.error('Reset points error:', error);
    res.status(500).json({ success: false, error: 'Failed to reset points' });
  }
});

// ===== DEBUG: Проверка замеров пользователя =====

// Получить все замеры пользователя по telegram_id
router.get('/debug/user-measurements/:telegramId', async (req: Request, res: Response) => {
  try {
    const telegramId = parseInt(req.params.telegramId, 10);

    // Найти пользователя
    const participants = await userService.getAllParticipants();
    const user = participants.find(p => p.telegram_id === telegramId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: `User with telegram_id ${telegramId} not found`
      });
    }

    // Получить все замеры
    const measurements = await measurementService.getAllByUser(user.id);

    // Проверить дубликаты недель
    const weekNumbers = measurements.map(m => m.week_number);
    const duplicates = weekNumbers.filter((w, i) => weekNumbers.indexOf(w) !== i);
    const hasDuplicates = duplicates.length > 0;

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          telegram_id: user.telegram_id,
          first_name: user.first_name,
          last_name: user.last_name,
          start_weight: user.start_weight
        },
        measurements_count: measurements.length,
        has_duplicate_weeks: hasDuplicates,
        duplicate_weeks: hasDuplicates ? [...new Set(duplicates)] : [],
        measurements: measurements.map(m => ({
          id: m.id,
          week_number: m.week_number,
          date: m.date,
          weight: m.weight,
          chest: m.chest,
          waist: m.waist,
          hips: m.hips,
          created_at: m.created_at
        }))
      }
    });
  } catch (error) {
    console.error('Debug user measurements error:', error);
    res.status(500).json({ success: false, error: 'Failed to get user measurements' });
  }
});

// ===== ВРЕМЕННОЕ: Компенсация за баг с еженедельными заданиями =====

// Начислить всем пользователям XP за баг
router.post('/compensate-weekly-tasks-bug', async (req: Request, res: Response) => {
  try {
    const { xp = 50 } = req.body;

    const participants = await userService.getAllParticipants();
    const results = [];

    for (const user of participants) {
      try {
        await statsService.addPoints(user.id, xp);
        results.push({ userId: user.id, name: user.first_name, xp });
      } catch (error) {
        console.error(`Failed to add XP for user ${user.id}:`, error);
      }
    }

    res.json({
      success: true,
      data: {
        message: `Added ${xp} XP to ${results.length} users as compensation`,
        users: results
      }
    });
  } catch (error) {
    console.error('Compensate bug error:', error);
    res.status(500).json({ success: false, error: 'Failed to compensate' });
  }
});

export default router;
