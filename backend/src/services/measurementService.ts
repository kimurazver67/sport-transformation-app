import { supabaseAdmin } from '../db/supabase';
import { WeeklyMeasurement, MeasurementForm, POINTS } from '../types';
import { getCurrentWeek } from '../config';
import { statsService } from './statsService';
import { achievementService } from './achievementService';
import { userService } from './userService';

export const measurementService = {
  // Создать или обновить замер недели
  async createOrUpdate(
    userId: string,
    data: MeasurementForm,
    photos?: { front?: string; side?: string; back?: string }
  ): Promise<WeeklyMeasurement> {
    const weekNumber = getCurrentWeek();
    const today = new Date().toISOString().split('T')[0];

    // Проверяем существующий замер
    const { data: existing } = await supabaseAdmin
      .from('weekly_measurements')
      .select('id')
      .eq('user_id', userId)
      .eq('week_number', weekNumber)
      .single();

    const measurementData = {
      user_id: userId,
      week_number: weekNumber,
      date: today,
      weight: data.weight,
      chest: data.chest || null,
      waist: data.waist || null,
      hips: data.hips || null,
      bicep_left: data.bicep_left || null,
      bicep_right: data.bicep_right || null,
      thigh_left: data.thigh_left || null,
      thigh_right: data.thigh_right || null,
      body_fat_percent: data.body_fat_percent || null,
      photo_front_url: photos?.front || null,
      photo_side_url: photos?.side || null,
      photo_back_url: photos?.back || null,
    };

    let result: WeeklyMeasurement;
    let isNew = false;

    if (existing) {
      const { data: updated, error } = await supabaseAdmin
        .from('weekly_measurements')
        .update(measurementData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw new Error(`Failed to update measurement: ${error.message}`);
      result = updated as WeeklyMeasurement;
    } else {
      const { data: created, error } = await supabaseAdmin
        .from('weekly_measurements')
        .insert(measurementData)
        .select()
        .single();

      if (error) throw new Error(`Failed to create measurement: ${error.message}`);
      result = created as WeeklyMeasurement;
      isNew = true;

      // Начисляем очки за новый замер
      await statsService.addPoints(userId, POINTS.WEEKLY_MEASUREMENT);
    }

    // Обновляем стартовый вес, если это первый замер
    if (weekNumber === 1) {
      await userService.updateStartWeight(userId, data.weight);
    }

    // Проверяем достижения
    await achievementService.checkAndUnlock(userId);

    return result;
  },

  // Получить замер текущей недели
  async getCurrentWeekMeasurement(userId: string): Promise<WeeklyMeasurement | null> {
    const weekNumber = getCurrentWeek();

    const { data, error } = await supabaseAdmin
      .from('weekly_measurements')
      .select('*')
      .eq('user_id', userId)
      .eq('week_number', weekNumber)
      .single();

    if (error || !data) return null;
    return data as WeeklyMeasurement;
  },

  // Получить все замеры пользователя
  async getAllByUser(userId: string): Promise<WeeklyMeasurement[]> {
    const { data, error } = await supabaseAdmin
      .from('weekly_measurements')
      .select('*')
      .eq('user_id', userId)
      .order('week_number', { ascending: true });

    if (error) throw new Error(`Failed to get measurements: ${error.message}`);
    return (data || []) as WeeklyMeasurement[];
  },

  // Получить прогресс веса
  async getWeightProgress(userId: string): Promise<{ week: number; weight: number }[]> {
    const measurements = await this.getAllByUser(userId);
    return measurements.map(m => ({
      week: m.week_number,
      weight: m.weight,
    }));
  },

  // Сравнение первого и последнего замера
  async getProgressComparison(userId: string): Promise<{
    start: WeeklyMeasurement | null;
    current: WeeklyMeasurement | null;
    weightChange: number | null;
  }> {
    const measurements = await this.getAllByUser(userId);

    if (measurements.length === 0) {
      return { start: null, current: null, weightChange: null };
    }

    const start = measurements[0];
    const current = measurements[measurements.length - 1];
    const weightChange = current.weight - start.weight;

    return { start, current, weightChange };
  },

  // Обновить URL фото
  async updatePhotos(
    measurementId: string,
    photos: { front?: string; side?: string; back?: string }
  ): Promise<void> {
    const updateData: Record<string, string> = {};
    if (photos.front) updateData.photo_front_url = photos.front;
    if (photos.side) updateData.photo_side_url = photos.side;
    if (photos.back) updateData.photo_back_url = photos.back;

    const { error } = await supabaseAdmin
      .from('weekly_measurements')
      .update(updateData)
      .eq('id', measurementId);

    if (error) throw new Error(`Failed to update photos: ${error.message}`);
  },
};
