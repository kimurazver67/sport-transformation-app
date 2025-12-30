import { query } from '../db/postgres';
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
      const existingResult = await query<{ id: string }>(
        'SELECT id FROM daily_checkins WHERE user_id = $1 AND date = $2',
        [userId, today]
      );

      const existing = existingResult.rows[0];

      let result: DailyCheckin;

      if (existing) {
        // Обновляем существующий
        const updateResult = await query<DailyCheckin>(
          `UPDATE daily_checkins SET
            workout = $1,
            workout_type = $2,
            nutrition = $3,
            water = $4,
            water_liters = $5,
            sleep_hours = $6,
            mood = $7,
            steps = $8
          WHERE id = $9
          RETURNING *`,
          [
            data.workout,
            data.workout_type || null,
            data.nutrition,
            data.water,
            data.water_liters || null,
            data.sleep_hours,
            data.mood,
            data.steps || null,
            existing.id,
          ]
        );

        result = updateResult.rows[0];
      } else {
        // Создаём новый
        const insertResult = await query<DailyCheckin>(
          `INSERT INTO daily_checkins
            (user_id, date, workout, workout_type, nutrition, water, water_liters, sleep_hours, mood, steps)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *`,
          [
            userId,
            today,
            data.workout,
            data.workout_type || null,
            data.nutrition,
            data.water,
            data.water_liters || null,
            data.sleep_hours,
            data.mood,
            data.steps || null,
          ]
        );

        result = insertResult.rows[0];

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

    const result = await query<DailyCheckin>(
      'SELECT * FROM daily_checkins WHERE user_id = $1 AND date = $2',
      [userId, today]
    );

    return result.rows[0] || null;
  },

  // Получить чекины за период
  async getByDateRange(userId: string, startDate: string, endDate: string): Promise<DailyCheckin[]> {
    const result = await query<DailyCheckin>(
      `SELECT * FROM daily_checkins
       WHERE user_id = $1 AND date >= $2 AND date <= $3
       ORDER BY date ASC`,
      [userId, startDate, endDate]
    );

    return result.rows;
  },

  // Получить все чекины пользователя
  async getAllByUser(userId: string): Promise<DailyCheckin[]> {
    const result = await query<DailyCheckin>(
      'SELECT * FROM daily_checkins WHERE user_id = $1 ORDER BY date DESC',
      [userId]
    );

    return result.rows;
  },

  // Статистика чекинов
  async getStats(userId: string): Promise<{
    totalCheckins: number;
    workoutDays: number;
    nutritionDays: number;
    avgSleep: number;
    avgMood: number;
    avgSteps: number;
  }> {
    const result = await query<DailyCheckin>(
      'SELECT * FROM daily_checkins WHERE user_id = $1',
      [userId]
    );

    const checkins = result.rows;
    const total = checkins.length;

    if (total === 0) {
      return {
        totalCheckins: 0,
        workoutDays: 0,
        nutritionDays: 0,
        avgSleep: 0,
        avgMood: 0,
        avgSteps: 0,
      };
    }

    const workoutDays = checkins.filter(c => c.workout).length;
    const nutritionDays = checkins.filter(c => c.nutrition).length;
    const avgSleep = checkins.reduce((sum, c) => sum + c.sleep_hours, 0) / total;
    const avgMood = checkins.reduce((sum, c) => sum + c.mood, 0) / total;

    // Считаем средние шаги только по чекинам где есть шаги
    const checkinsWithSteps = checkins.filter(c => c.steps != null && c.steps > 0);
    const avgSteps = checkinsWithSteps.length > 0
      ? checkinsWithSteps.reduce((sum, c) => sum + (c.steps || 0), 0) / checkinsWithSteps.length
      : 0;

    return {
      totalCheckins: total,
      workoutDays,
      nutritionDays,
      avgSleep: Math.round(avgSleep * 10) / 10,
      avgMood: Math.round(avgMood * 10) / 10,
      avgSteps: Math.round(avgSteps),
    };
  },
};
