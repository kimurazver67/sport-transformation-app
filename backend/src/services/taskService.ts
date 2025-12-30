import { query } from '../db/postgres';
import { Task, TaskCompletion, WeeklyConcept, POINTS, UserGoal } from '../types';
import { getCurrentWeek } from '../config';
import { statsService } from './statsService';

export const taskService = {
  // Создать задание (только тренер)
  async create(
    weekNumber: number,
    title: string,
    description?: string,
    goal?: UserGoal,
    isBonus?: boolean
  ): Promise<Task> {
    const result = await query<Task>(
      `INSERT INTO tasks (week_number, title, description, goal, is_bonus)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [weekNumber, title, description || null, goal || null, isBonus || false]
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

  // Получить все задания
  async getAll(): Promise<Task[]> {
    const result = await query<Task>(
      'SELECT * FROM tasks ORDER BY week_number ASC, is_bonus ASC, created_at ASC'
    );
    return result.rows;
  },

  // Получить задания по неделе
  async getByWeek(weekNumber: number): Promise<Task[]> {
    const result = await query<Task>(
      'SELECT * FROM tasks WHERE week_number = $1 ORDER BY is_bonus ASC, created_at ASC',
      [weekNumber]
    );

    return result.rows;
  },

  // Обновить задание
  async update(
    taskId: string,
    data: { title?: string; description?: string; goal?: UserGoal | null; is_bonus?: boolean }
  ): Promise<Task> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.goal !== undefined) {
      updates.push(`goal = $${paramIndex++}`);
      values.push(data.goal);
    }
    if (data.is_bonus !== undefined) {
      updates.push(`is_bonus = $${paramIndex++}`);
      values.push(data.is_bonus);
    }

    if (updates.length === 0) {
      const result = await query<Task>('SELECT * FROM tasks WHERE id = $1', [taskId]);
      if (!result.rows[0]) throw new Error('Task not found');
      return result.rows[0];
    }

    values.push(taskId);
    const result = await query<Task>(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (!result.rows[0]) throw new Error('Task not found');
    return result.rows[0];
  },

  // Получить задания по неделе, отфильтрованные по цели пользователя
  async getByWeekForGoal(weekNumber: number, userGoal?: UserGoal): Promise<Task[]> {
    // Если цель не указана, возвращаем только общие задания
    if (!userGoal) {
      const result = await query<Task>(
        'SELECT * FROM tasks WHERE week_number = $1 AND goal IS NULL ORDER BY is_bonus ASC, created_at ASC',
        [weekNumber]
      );
      return result.rows;
    }

    // Возвращаем задания без цели + задания для указанной цели
    const result = await query<Task>(
      `SELECT * FROM tasks
       WHERE week_number = $1 AND (goal IS NULL OR goal = $2)
       ORDER BY is_bonus ASC, created_at ASC`,
      [weekNumber, userGoal]
    );

    return result.rows;
  },

  // Получить задания с прогрессом выполнения для пользователя
  async getTasksWithProgress(
    userId: string,
    weekNumber?: number,
    userGoal?: UserGoal
  ): Promise<(Task & { completed: boolean })[]> {
    const week = weekNumber || getCurrentWeek();

    // Если указана цель, фильтруем по ней
    const tasks = userGoal
      ? await this.getByWeekForGoal(week, userGoal)
      : await this.getByWeek(week);

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

    // Проверяем, является ли задание бонусным
    const taskResult = await query<{ is_bonus: boolean }>(
      'SELECT is_bonus FROM tasks WHERE id = $1',
      [taskId]
    );

    const insertResult = await query<TaskCompletion>(
      `INSERT INTO task_completions (user_id, task_id)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, taskId]
    );

    if (!insertResult.rows[0]) {
      throw new Error('Failed to complete task');
    }

    // Начисляем очки (бонусные задания дают больше)
    const isBonus = taskResult.rows[0]?.is_bonus;
    const points = isBonus ? POINTS.TASK_COMPLETED * 2 : POINTS.TASK_COMPLETED;
    await statsService.addPoints(userId, points);

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
    goal?: UserGoal;
    isBonus?: boolean;
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
        goal: task.goal,
        isBonus: task.is_bonus,
        completedCount,
        totalParticipants: participantCount,
      });
    }

    return result;
  },

  // ===== КОНЦЕПЦИИ НЕДЕЛИ =====

  // Создать концепцию недели
  async createConcept(
    weekNumber: number,
    title: string,
    content: string,
    goal?: UserGoal
  ): Promise<WeeklyConcept> {
    const result = await query<WeeklyConcept>(
      `INSERT INTO weekly_concepts (week_number, title, content, goal)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [weekNumber, title, content, goal || null]
    );

    if (!result.rows[0]) {
      throw new Error('Failed to create concept');
    }
    return result.rows[0];
  },

  // Получить концепции недели для пользователя
  async getConceptsForWeek(weekNumber: number, userGoal?: UserGoal): Promise<WeeklyConcept[]> {
    if (!userGoal) {
      const result = await query<WeeklyConcept>(
        'SELECT * FROM weekly_concepts WHERE week_number = $1 AND goal IS NULL ORDER BY created_at ASC',
        [weekNumber]
      );
      return result.rows;
    }

    const result = await query<WeeklyConcept>(
      `SELECT * FROM weekly_concepts
       WHERE week_number = $1 AND (goal IS NULL OR goal = $2)
       ORDER BY created_at ASC`,
      [weekNumber, userGoal]
    );
    return result.rows;
  },

  // Удалить концепцию
  async deleteConcept(conceptId: string): Promise<void> {
    await query('DELETE FROM weekly_concepts WHERE id = $1', [conceptId]);
  },
};
