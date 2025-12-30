import { query } from '../db/postgres';
import { MindfulnessEntry, ImpulseLog, ImpulseTrigger, ImpulseAction } from '../types';

export interface MindfulnessEntryForm {
  gratitude?: string;
  wins?: string;
  challenges?: string;
  lessons?: string;
  mood_note?: string;
}

export interface ImpulseLogForm {
  trigger_type: ImpulseTrigger;
  intensity: number;
  action_taken: ImpulseAction;
  notes?: string;
}

export const mindfulnessService = {
  // ===== ДНЕВНИК ОСОЗНАННОСТИ =====

  // Создать или обновить запись за сегодня
  async createOrUpdateEntry(userId: string, data: MindfulnessEntryForm): Promise<MindfulnessEntry> {
    const today = new Date().toISOString().split('T')[0];

    // Проверяем существующую запись
    const existingResult = await query<{ id: string }>(
      'SELECT id FROM mindfulness_entries WHERE user_id = $1 AND date = $2',
      [userId, today]
    );

    const existing = existingResult.rows[0];

    if (existing) {
      // Обновляем
      const result = await query<MindfulnessEntry>(
        `UPDATE mindfulness_entries SET
          gratitude = COALESCE($1, gratitude),
          wins = COALESCE($2, wins),
          challenges = COALESCE($3, challenges),
          lessons = COALESCE($4, lessons),
          mood_note = COALESCE($5, mood_note),
          updated_at = NOW()
        WHERE id = $6
        RETURNING *`,
        [data.gratitude, data.wins, data.challenges, data.lessons, data.mood_note, existing.id]
      );
      return result.rows[0];
    } else {
      // Создаём новую
      const result = await query<MindfulnessEntry>(
        `INSERT INTO mindfulness_entries (user_id, date, gratitude, wins, challenges, lessons, mood_note)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [userId, today, data.gratitude, data.wins, data.challenges, data.lessons, data.mood_note]
      );
      return result.rows[0];
    }
  },

  // Получить запись за сегодня
  async getTodayEntry(userId: string): Promise<MindfulnessEntry | null> {
    const today = new Date().toISOString().split('T')[0];
    const result = await query<MindfulnessEntry>(
      'SELECT * FROM mindfulness_entries WHERE user_id = $1 AND date = $2',
      [userId, today]
    );
    return result.rows[0] || null;
  },

  // Получить записи за период
  async getEntriesByRange(userId: string, startDate: string, endDate: string): Promise<MindfulnessEntry[]> {
    const result = await query<MindfulnessEntry>(
      `SELECT * FROM mindfulness_entries
       WHERE user_id = $1 AND date >= $2 AND date <= $3
       ORDER BY date DESC`,
      [userId, startDate, endDate]
    );
    return result.rows;
  },

  // Получить последние N записей
  async getRecentEntries(userId: string, limit: number = 7): Promise<MindfulnessEntry[]> {
    const result = await query<MindfulnessEntry>(
      `SELECT * FROM mindfulness_entries
       WHERE user_id = $1
       ORDER BY date DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  },

  // ===== ТРЕКЕР ИМПУЛЬСОВ =====

  // Залогировать импульс
  async logImpulse(userId: string, data: ImpulseLogForm): Promise<ImpulseLog> {
    const result = await query<ImpulseLog>(
      `INSERT INTO impulse_logs (user_id, trigger_type, intensity, action_taken, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, data.trigger_type, data.intensity, data.action_taken, data.notes || null]
    );
    return result.rows[0];
  },

  // Получить логи импульсов за период
  async getImpulseLogsByRange(userId: string, startDate: string, endDate: string): Promise<ImpulseLog[]> {
    const result = await query<ImpulseLog>(
      `SELECT * FROM impulse_logs
       WHERE user_id = $1 AND DATE(logged_at) >= $2 AND DATE(logged_at) <= $3
       ORDER BY logged_at DESC`,
      [userId, startDate, endDate]
    );
    return result.rows;
  },

  // Получить последние N логов импульсов
  async getRecentImpulses(userId: string, limit: number = 10): Promise<ImpulseLog[]> {
    const result = await query<ImpulseLog>(
      `SELECT * FROM impulse_logs
       WHERE user_id = $1
       ORDER BY logged_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  },

  // Статистика импульсов за неделю
  async getImpulseStats(userId: string): Promise<{
    totalThisWeek: number;
    resistedCount: number;
    gaveInCount: number;
    alternativeCount: number;
    avgIntensity: number;
    topTriggers: { trigger: ImpulseTrigger; count: number }[];
  }> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const result = await query<ImpulseLog>(
      `SELECT * FROM impulse_logs
       WHERE user_id = $1 AND DATE(logged_at) >= $2
       ORDER BY logged_at DESC`,
      [userId, weekAgoStr]
    );

    const logs = result.rows;
    const total = logs.length;

    if (total === 0) {
      return {
        totalThisWeek: 0,
        resistedCount: 0,
        gaveInCount: 0,
        alternativeCount: 0,
        avgIntensity: 0,
        topTriggers: [],
      };
    }

    const resistedCount = logs.filter(l => l.action_taken === 'resisted').length;
    const gaveInCount = logs.filter(l => l.action_taken === 'gave_in').length;
    const alternativeCount = logs.filter(l => l.action_taken === 'alternative').length;
    const avgIntensity = logs.reduce((sum, l) => sum + l.intensity, 0) / total;

    // Подсчёт триггеров
    const triggerCounts = new Map<ImpulseTrigger, number>();
    for (const log of logs) {
      triggerCounts.set(log.trigger_type, (triggerCounts.get(log.trigger_type) || 0) + 1);
    }

    const topTriggers = Array.from(triggerCounts.entries())
      .map(([trigger, count]) => ({ trigger, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      totalThisWeek: total,
      resistedCount,
      gaveInCount,
      alternativeCount,
      avgIntensity: Math.round(avgIntensity * 10) / 10,
      topTriggers,
    };
  },

  // Удалить лог импульса
  async deleteImpulse(userId: string, impulseId: string): Promise<void> {
    await query(
      'DELETE FROM impulse_logs WHERE id = $1 AND user_id = $2',
      [impulseId, userId]
    );
  },
};
