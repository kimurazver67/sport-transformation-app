import { query } from '../db/postgres';
import { Task, TaskCompletion, POINTS } from '../types';
import { getCurrentWeek } from '../config';
import { statsService } from './statsService';

export const taskService = {
  // Создать задание (только тренер)
  async create(weekNumber: number, title: string, description?: string): Promise<Task> {
    const result = await query<Task>(
      `INSERT INTO tasks (week_number, title, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [weekNumber, title, description || null]
    );

    if (!result.rows[0]) {
      throw new Error('Failed to create task');
    }
    return result.rows[0];
  },

  // Получить задания текущей недели
  async getCurrentWeekTasks(): Promise<Task[]> {
    const weekNumber = getCurrentWeek();
    return this.getByWeek(weekNumber);
  },

  // Получить задания по неделе
  async getByWeek(weekNumber: number): Promise<Task[]> {
    const result = await query<Task>(
      'SELECT * FROM tasks WHERE week_number = $1 ORDER BY created_at ASC',
      [weekNumber]
    );

    return result.rows;
  },

  // Получить задания с прогрессом выполнения для пользователя
  async getTasksWithProgress(userId: string, weekNumber?: number): Promise<(Task & { completed: boolean })[]> {
    const week = weekNumber || getCurrentWeek();
    const tasks = await this.getByWeek(week);

    // Получаем выполненные задания
    const completionsResult = await query<{ task_id: string }>(
      'SELECT task_id FROM task_completions WHERE user_id = $1',
      [userId]
    );

    const completedIds = new Set(completionsResult.rows.map(c => c.task_id));

    return tasks.map(task => ({
      ...task,
      completed: completedIds.has(task.id),
    }));
  },

  // Отметить задание выполненным
  async complete(userId: string, taskId: string): Promise<TaskCompletion> {
    // Проверяем, не выполнено ли уже
    const existingResult = await query<{ id: string }>(
      'SELECT id FROM task_completions WHERE user_id = $1 AND task_id = $2',
      [userId, taskId]
    );

    if (existingResult.rows[0]) {
      throw new Error('Task already completed');
    }

    const insertResult = await query<TaskCompletion>(
      `INSERT INTO task_completions (user_id, task_id)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, taskId]
    );

    if (!insertResult.rows[0]) {
      throw new Error('Failed to complete task');
    }

    // Начисляем очки
    await statsService.addPoints(userId, POINTS.TASK_COMPLETED);

    return insertResult.rows[0];
  },

  // Отменить выполнение задания
  async uncomplete(userId: string, taskId: string): Promise<void> {
    await query(
      'DELETE FROM task_completions WHERE user_id = $1 AND task_id = $2',
      [userId, taskId]
    );
  },

  // Удалить задание (только тренер)
  async delete(taskId: string): Promise<void> {
    await query('DELETE FROM tasks WHERE id = $1', [taskId]);
  },

  // Получить статистику выполнения заданий по участникам
  async getCompletionStats(weekNumber?: number): Promise<{
    taskId: string;
    title: string;
    completedCount: number;
    totalParticipants: number;
  }[]> {
    const week = weekNumber || getCurrentWeek();
    const tasks = await this.getByWeek(week);

    // Получаем количество участников
    const participantCountResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM users WHERE role = 'participant'`
    );
    const participantCount = parseInt(participantCountResult.rows[0]?.count || '0', 10);

    const result = [];

    for (const task of tasks) {
      const completionCountResult = await query<{ count: string }>(
        'SELECT COUNT(*) as count FROM task_completions WHERE task_id = $1',
        [task.id]
      );
      const completedCount = parseInt(completionCountResult.rows[0]?.count || '0', 10);

      result.push({
        taskId: task.id,
        title: task.title,
        completedCount,
        totalParticipants: participantCount,
      });
    }

    return result;
  },
};
