import { Router, Request, Response } from 'express';
import { userService } from '../services/userService';
import { checkinService } from '../services/checkinService';
import { measurementService } from '../services/measurementService';
import { statsService } from '../services/statsService';
import { taskService } from '../services/taskService';
import { achievementService } from '../services/achievementService';
import { getCurrentWeek, getDaysUntilStart, isCourseStarted } from '../config';
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

// Создать/обновить замер
router.post('/measurement/:userId', async (req: Request, res: Response) => {
  try {
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

export default router;
