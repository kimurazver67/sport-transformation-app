import { query } from '../db/postgres';
import { WeeklyMeasurement, MeasurementForm, POINTS } from '../types';
import { getCurrentWeek, isCourseStarted } from '../config';
import { statsService } from './statsService';
import { achievementService } from './achievementService';
import { userService } from './userService';
import { adminNotifier } from './adminNotifierService';

export const measurementService = {
  // Создать новый замер (всегда создаёт новую запись)
  async createOrUpdate(
    userId: string,
    data: MeasurementForm
  ): Promise<WeeklyMeasurement> {
    try {
      // ВАЖНО: Замеры до старта курса = неделя 0 (стартовый замер)
      // После старта курса = текущая неделя (1, 2, 3...)
      const weekNumber = isCourseStarted() ? getCurrentWeek() : 0;
      const today = new Date().toISOString().split('T')[0];

      // Проверяем разблокировку от админа
      const isUnlocked = await userService.isMeasurementUnlocked(userId);

      // Если разблокирован админом - используем разблокировку
      if (isUnlocked) {
        await userService.consumeMeasurementUnlock(userId);
      }

      // Всегда создаём новую запись
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

      const result = insertResult.rows[0];

      // Начисляем очки за каждый замер
      await statsService.addPoints(userId, POINTS.WEEKLY_MEASUREMENT);

      // Обновляем стартовый вес, если это стартовый замер (неделя 0)
      if (weekNumber === 0) {
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

  // Получить последний замер текущей недели
  async getCurrentWeekMeasurement(userId: string): Promise<WeeklyMeasurement | null> {
    const weekNumber = isCourseStarted() ? getCurrentWeek() : 0;

    const result = await query<WeeklyMeasurement>(
      'SELECT * FROM weekly_measurements WHERE user_id = $1 AND week_number = $2 ORDER BY created_at DESC LIMIT 1',
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

  // Получить последний замер по пользователю и неделе
  async getByUserAndWeek(userId: string, weekNumber: number): Promise<WeeklyMeasurement | null> {
    const result = await query<WeeklyMeasurement>(
      'SELECT * FROM weekly_measurements WHERE user_id = $1 AND week_number = $2 ORDER BY created_at DESC LIMIT 1',
      [userId, weekNumber]
    );

    return result.rows[0] || null;
  },

  // Отметить что пользователь "обещал" что внёс замеры
  async markAsClaimed(userId: string, weekNumber: number): Promise<void> {
    // Проверяем, есть ли уже запись в таблице claimed
    const existing = await query(
      'SELECT 1 FROM measurement_claims WHERE user_id = $1 AND week_number = $2',
      [userId, weekNumber]
    );

    if (existing.rows.length === 0) {
      await query(
        'INSERT INTO measurement_claims (user_id, week_number, claimed_at) VALUES ($1, $2, NOW())',
        [userId, weekNumber]
      );
    }
  },

  // Получить пользователей которые обещали внести замеры но не внесли
  async getLiars(weekNumber: number): Promise<Array<{ telegram_id: number; first_name: string }>> {
    const result = await query<{ telegram_id: number; first_name: string }>(
      `SELECT u.telegram_id, u.first_name
       FROM measurement_claims mc
       JOIN users u ON u.id = mc.user_id
       WHERE mc.week_number = $1
       AND NOT EXISTS (
         SELECT 1 FROM weekly_measurements wm
         WHERE wm.user_id = mc.user_id AND wm.week_number = $1
       )`,
      [weekNumber]
    );

    return result.rows;
  },

  // Сбросить флаги claimed после проверки
  async resetClaimedFlags(weekNumber: number): Promise<void> {
    await query(
      'DELETE FROM measurement_claims WHERE week_number = $1',
      [weekNumber]
    );
  },
};
