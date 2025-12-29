import { Router, Request, Response } from 'express';
import { userService } from '../services/userService';
import { taskService } from '../services/taskService';
import { statsService } from '../services/statsService';
import { measurementService } from '../services/measurementService';
import { checkinService } from '../services/checkinService';
import { achievementService } from '../services/achievementService';
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

// Создать задание
router.post('/tasks', async (req: Request, res: Response) => {
  try {
    const { week_number, title, description } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    const week = week_number || getCurrentWeek();
    const task = await taskService.create(week, title, description);

    res.json({ success: true, data: task });
  } catch (error) {
    console.error('Create task error:', error);
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

export default router;
