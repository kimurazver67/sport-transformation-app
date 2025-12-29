import { supabaseAdmin } from '../db/supabase';
import { DailyCheckin, CheckinForm, POINTS } from '../types';
import { statsService } from './statsService';
import { achievementService } from './achievementService';
import { adminNotifier } from './adminNotifierService';

export const checkinService = {
  // Создать или обновить чекин за сегодня
  async createOrUpdate(userId: string, data: CheckinForm): Promise<DailyCheckin> {
    try {
      const today = new Date().toISOString().split('T')[0];

    // Проверяем существующий чекин
    const { data: existing } = await supabaseAdmin
      .from('daily_checkins')
      .select('id')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    const checkinData = {
      user_id: userId,
      date: today,
      workout: data.workout,
      workout_type: data.workout_type || null,
      nutrition: data.nutrition,
      water: data.water,
      water_liters: data.water_liters || null,
      sleep_hours: data.sleep_hours,
      mood: data.mood,
    };

    let result: DailyCheckin;

    if (existing) {
      // Обновляем существующий
      const { data: updated, error } = await supabaseAdmin
        .from('daily_checkins')
        .update(checkinData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw new Error(`Failed to update checkin: ${error.message}`);
      result = updated as DailyCheckin;
    } else {
      // Создаём новый
      const { data: created, error } = await supabaseAdmin
        .from('daily_checkins')
        .insert(checkinData)
        .select()
        .single();

      if (error) throw new Error(`Failed to create checkin: ${error.message}`);
      result = created as DailyCheckin;

      // Начисляем очки только за новый чекин
      await statsService.addPoints(userId, POINTS.DAILY_CHECKIN);
      await statsService.updateStreak(userId);

      // Проверяем достижения
      await achievementService.checkAndUnlock(userId);
    }

    return result;
    } catch (error) {
      await adminNotifier.error(error as Error, {
        endpoint: 'checkinService.createOrUpdate',
        userId,
        additionalInfo: `Data: ${JSON.stringify(data)}`,
      });
      throw error;
    }
  },

  // Получить чекин за сегодня
  async getTodayCheckin(userId: string): Promise<DailyCheckin | null> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('daily_checkins')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (error || !data) return null;
    return data as DailyCheckin;
  },

  // Получить чекины за период
  async getByDateRange(userId: string, startDate: string, endDate: string): Promise<DailyCheckin[]> {
    const { data, error } = await supabaseAdmin
      .from('daily_checkins')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw new Error(`Failed to get checkins: ${error.message}`);
    return (data || []) as DailyCheckin[];
  },

  // Получить все чекины пользователя
  async getAllByUser(userId: string): Promise<DailyCheckin[]> {
    const { data, error } = await supabaseAdmin
      .from('daily_checkins')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw new Error(`Failed to get checkins: ${error.message}`);
    return (data || []) as DailyCheckin[];
  },

  // Статистика чекинов
  async getStats(userId: string): Promise<{
    totalCheckins: number;
    workoutDays: number;
    nutritionDays: number;
    avgSleep: number;
    avgMood: number;
  }> {
    const { data, error } = await supabaseAdmin
      .from('daily_checkins')
      .select('*')
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to get checkin stats: ${error.message}`);

    const checkins = data || [];
    const total = checkins.length;

    if (total === 0) {
      return {
        totalCheckins: 0,
        workoutDays: 0,
        nutritionDays: 0,
        avgSleep: 0,
        avgMood: 0,
      };
    }

    const workoutDays = checkins.filter(c => c.workout).length;
    const nutritionDays = checkins.filter(c => c.nutrition).length;
    const avgSleep = checkins.reduce((sum, c) => sum + c.sleep_hours, 0) / total;
    const avgMood = checkins.reduce((sum, c) => sum + c.mood, 0) / total;

    return {
      totalCheckins: total,
      workoutDays,
      nutritionDays,
      avgSleep: Math.round(avgSleep * 10) / 10,
      avgMood: Math.round(avgMood * 10) / 10,
    };
  },
};
