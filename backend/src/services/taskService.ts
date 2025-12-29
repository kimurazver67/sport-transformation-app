import { supabaseAdmin } from '../db/supabase';
import { Task, TaskCompletion, POINTS } from '../../shared/types';
import { getCurrentWeek } from '../config';
import { statsService } from './statsService';

export const taskService = {
  // Создать задание (только тренер)
  async create(weekNumber: number, title: string, description?: string): Promise<Task> {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert({
        week_number: weekNumber,
        title,
        description: description || null,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create task: ${error.message}`);
    return data as Task;
  },

  // Получить задания текущей недели
  async getCurrentWeekTasks(): Promise<Task[]> {
    const weekNumber = getCurrentWeek();
    return this.getByWeek(weekNumber);
  },

  // Получить задания по неделе
  async getByWeek(weekNumber: number): Promise<Task[]> {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('week_number', weekNumber)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to get tasks: ${error.message}`);
    return (data || []) as Task[];
  },

  // Получить задания с прогрессом выполнения для пользователя
  async getTasksWithProgress(userId: string, weekNumber?: number): Promise<(Task & { completed: boolean })[]> {
    const week = weekNumber || getCurrentWeek();
    const tasks = await this.getByWeek(week);

    // Получаем выполненные задания
    const { data: completions } = await supabaseAdmin
      .from('task_completions')
      .select('task_id')
      .eq('user_id', userId);

    const completedIds = new Set((completions || []).map(c => c.task_id));

    return tasks.map(task => ({
      ...task,
      completed: completedIds.has(task.id),
    }));
  },

  // Отметить задание выполненным
  async complete(userId: string, taskId: string): Promise<TaskCompletion> {
    // Проверяем, не выполнено ли уже
    const { data: existing } = await supabaseAdmin
      .from('task_completions')
      .select('id')
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .single();

    if (existing) {
      throw new Error('Task already completed');
    }

    const { data, error } = await supabaseAdmin
      .from('task_completions')
      .insert({
        user_id: userId,
        task_id: taskId,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to complete task: ${error.message}`);

    // Начисляем очки
    await statsService.addPoints(userId, POINTS.TASK_COMPLETED);

    return data as TaskCompletion;
  },

  // Отменить выполнение задания
  async uncomplete(userId: string, taskId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('task_completions')
      .delete()
      .eq('user_id', userId)
      .eq('task_id', taskId);

    if (error) throw new Error(`Failed to uncomplete task: ${error.message}`);
  },

  // Удалить задание (только тренер)
  async delete(taskId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw new Error(`Failed to delete task: ${error.message}`);
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
    const { count: participantCount } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact' })
      .eq('role', 'participant');

    const result = [];

    for (const task of tasks) {
      const { count } = await supabaseAdmin
        .from('task_completions')
        .select('id', { count: 'exact' })
        .eq('task_id', task.id);

      result.push({
        taskId: task.id,
        title: task.title,
        completedCount: count || 0,
        totalParticipants: participantCount || 0,
      });
    }

    return result;
  },
};
