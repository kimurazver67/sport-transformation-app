import { query } from '../db/postgres';
import { WeeklyMeasurement, MeasurementForm, POINTS } from '../types';
import { getCurrentWeek, isCourseStarted } from '../config';
import { statsService } from './statsService';
import { achievementService } from './achievementService';
import { userService } from './userService';
import { adminNotifier } from './adminNotifierService';

export const measurementService = {
  // Создать или обновить замер недели
  async createOrUpdate(
    userId: string,
    data: MeasurementForm
  ): Promise<WeeklyMeasurement> {
    try {
      // Если курс не начался, используем неделю 1 (подготовительная/стартовая)
      const weekNumber = isCourseStarted() ? getCurrentWeek() : 1;
      const today = new Date().toISOString().split('T')[0];

      // Проверяем существующий замер
      const existingResult = await query<{ id: string }>(
        'SELECT id FROM weekly_measurements WHERE user_id = $1 AND week_number = $2',
        [userId, weekNumber]
      );

      const existing = existingResult.rows[0];
      let result: WeeklyMeasurement;
      let isNew = false;

      if (existing) {
        const updateResult = await query<WeeklyMeasurement>(
          `UPDATE weekly_measurements SET
            date = $1,
            weight = $2,
            chest = $3,
            waist = $4,
            hips = $5,
            bicep_left = $6,
            bicep_right = $7,
            thigh_left = $8,
            thigh_right = $9,
            body_fat_percent = $10
          WHERE id = $11
          RETURNING *`,
          [
            today,
            data.weight,
            data.chest || null,
            data.waist || null,
            data.hips || null,
            data.bicep_left || null,
            data.bicep_right || null,
            data.thigh_left || null,
            data.thigh_right || null,
            data.body_fat_percent || null,
            existing.id,
          ]
        );

        result = updateResult.rows[0];
      } else {
        const insertResult = await query<WeeklyMeasurement>(
          `INSERT INTO weekly_measurements
            (user_id, week_number, date, weight, chest, waist, hips, bicep_left, bicep_right, thigh_left, thigh_right, body_fat_percent)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *`,
          [
            userId,
            weekNumber,
            today,
            data.weight,
            data.chest || null,
            data.waist || null,
            data.hips || null,
            data.bicep_left || null,
            data.bicep_right || null,
            data.thigh_left || null,
            data.thigh_right || null,
            data.body_fat_percent || null,
          ]
        );

        result = insertResult.rows[0];
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
    } catch (error) {
      // Отправляем ошибку в админ чат
      await adminNotifier.error(error as Error, {
        endpoint: 'measurementService.createOrUpdate',
        userId,
        additionalInfo: `Data: ${JSON.stringify(data)}`,
      });
      throw error;
    }
  },

  // Получить замер текущей недели
  async getCurrentWeekMeasurement(userId: string): Promise<WeeklyMeasurement | null> {
    const weekNumber = isCourseStarted() ? getCurrentWeek() : 1;

    const result = await query<WeeklyMeasurement>(
      'SELECT * FROM weekly_measurements WHERE user_id = $1 AND week_number = $2',
      [userId, weekNumber]
    );

    return result.rows[0] || null;
  },

  // Получить все замеры пользователя
  async getAllByUser(userId: string): Promise<WeeklyMeasurement[]> {
    const result = await query<WeeklyMeasurement>(
      'SELECT * FROM weekly_measurements WHERE user_id = $1 ORDER BY week_number ASC',
      [userId]
    );

    return result.rows;
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

  // Сохранить Telegram file_id для фото
  async updatePhotoFileIds(
    measurementId: string,
    fileIds: { front?: string; side?: string; back?: string }
  ): Promise<void> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (fileIds.front) {
      updates.push(`photo_front_file_id = $${paramIndex++}`);
      values.push(fileIds.front);
    }
    if (fileIds.side) {
      updates.push(`photo_side_file_id = $${paramIndex++}`);
      values.push(fileIds.side);
    }
    if (fileIds.back) {
      updates.push(`photo_back_file_id = $${paramIndex++}`);
      values.push(fileIds.back);
    }

    if (updates.length === 0) return;

    values.push(measurementId);

    await query(
      `UPDATE weekly_measurements SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
  },
};
