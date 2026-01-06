import { query } from '../db/postgres';
import { User, UserRole, UserGoal } from '../types';
import { config } from '../config';

export interface CreateUserData {
  telegram_id: number;
  username?: string;
  first_name: string;
  last_name?: string;
  role?: UserRole;
}

export const userService = {
  // Найти пользователя по Telegram ID
  async findByTelegramId(telegramId: number): Promise<User | null> {
    const result = await query<User>(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId]
    );

    return result.rows[0] || null;
  },

  // Найти пользователя по ID
  async findById(userId: string): Promise<User | null> {
    const result = await query<User>(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    return result.rows[0] || null;
  },

  // Создать нового пользователя
  async create(userData: CreateUserData): Promise<User> {
    // Проверяем, является ли пользователь тренером
    const role: UserRole =
      config.course.trainerTelegramId === userData.telegram_id
        ? 'trainer'
        : userData.role || 'participant';

    const result = await query<User>(
      `INSERT INTO users (telegram_id, username, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        userData.telegram_id,
        userData.username || null,
        userData.first_name,
        userData.last_name || null,
        role,
      ]
    );

    if (!result.rows[0]) {
      throw new Error('Failed to create user');
    }

    // Создаём запись статистики для пользователя
    await query(
      `INSERT INTO user_stats (user_id, current_streak, max_streak, total_points, weekly_points)
       VALUES ($1, 0, 0, 0, 0)
       ON CONFLICT (user_id) DO NOTHING`,
      [result.rows[0].id]
    );

    return result.rows[0];
  },

  // Найти или создать пользователя
  async findOrCreate(userData: CreateUserData): Promise<User> {
    const existing = await this.findByTelegramId(userData.telegram_id);
    if (existing) return existing;
    return this.create(userData);
  },

  // Обновить стартовый вес
  async updateStartWeight(userId: string, weight: number): Promise<void> {
    await query(
      'UPDATE users SET start_weight = $1, updated_at = NOW() WHERE id = $2',
      [weight, userId]
    );
  },

  // Получить всех участников
  async getAllParticipants(): Promise<User[]> {
    const result = await query<User>(
      `SELECT * FROM users WHERE role = 'participant' ORDER BY created_at ASC`
    );

    return result.rows;
  },

  // Получить участников без чекина сегодня
  async getWithoutCheckinToday(): Promise<User[]> {
    const today = new Date().toISOString().split('T')[0];

    const result = await query<User>(
      `SELECT u.* FROM users u
       WHERE u.role = 'participant'
       AND NOT EXISTS (
         SELECT 1 FROM daily_checkins dc
         WHERE dc.user_id = u.id AND dc.date = $1
       )`,
      [today]
    );

    return result.rows;
  },

  // Получить участников без замеров на текущей неделе
  async getWithoutMeasurementThisWeek(weekNumber: number): Promise<User[]> {
    const result = await query<User>(
      `SELECT u.* FROM users u
       WHERE u.role = 'participant'
       AND NOT EXISTS (
         SELECT 1 FROM weekly_measurements wm
         WHERE wm.user_id = u.id AND wm.week_number = $1
       )`,
      [weekNumber]
    );

    return result.rows;
  },

  // Установить цель участника
  async setGoal(userId: string, goal: UserGoal): Promise<User | null> {
    const result = await query<User>(
      `UPDATE users SET goal = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [goal, userId]
    );

    return result.rows[0] || null;
  },

  // Обновить данные онбординга
  async updateOnboardingData(
    userId: string,
    data: {
      goal?: UserGoal;
      height?: number;
      age?: number;
      target_weight?: number;
    }
  ): Promise<User | null> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.goal !== undefined) {
      updates.push(`goal = $${paramIndex++}`);
      values.push(data.goal);
    }
    if (data.height !== undefined) {
      updates.push(`height = $${paramIndex++}`);
      values.push(data.height);
    }
    if (data.age !== undefined) {
      updates.push(`age = $${paramIndex++}`);
      values.push(data.age);
    }
    if (data.target_weight !== undefined) {
      updates.push(`target_weight = $${paramIndex++}`);
      values.push(data.target_weight);
    }

    if (updates.length === 0) {
      return this.findById(userId);
    }

    updates.push('updated_at = NOW()');
    values.push(userId);

    const result = await query<User>(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  },

  // Получить участников без установленной цели
  async getWithoutGoal(): Promise<User[]> {
    const result = await query<User>(
      `SELECT * FROM users WHERE role = 'participant' AND goal IS NULL`
    );

    return result.rows;
  },

  // Разблокировать замеры для пользователя на определённое количество часов
  async unlockMeasurement(userId: string, hours: number = 24): Promise<Date> {
    const unlockUntil = new Date(Date.now() + hours * 60 * 60 * 1000);

    await query(
      `UPDATE users SET measurement_unlocked_until = $1, updated_at = NOW() WHERE id = $2`,
      [unlockUntil.toISOString(), userId]
    );

    return unlockUntil;
  },

  // Заблокировать замеры (убрать разблокировку)
  async lockMeasurement(userId: string): Promise<void> {
    await query(
      `UPDATE users SET measurement_unlocked_until = NULL, updated_at = NOW() WHERE id = $1`,
      [userId]
    );
  },

  // Проверить, разблокированы ли замеры для пользователя
  async isMeasurementUnlocked(userId: string): Promise<boolean> {
    const result = await query<{ measurement_unlocked_until: string | null }>(
      `SELECT measurement_unlocked_until FROM users WHERE id = $1`,
      [userId]
    );

    const unlockUntil = result.rows[0]?.measurement_unlocked_until;
    if (!unlockUntil) return false;

    return new Date(unlockUntil) > new Date();
  },

  // Получить время разблокировки замеров
  async getMeasurementUnlockTime(userId: string): Promise<Date | null> {
    const result = await query<{ measurement_unlocked_until: string | null }>(
      `SELECT measurement_unlocked_until FROM users WHERE id = $1`,
      [userId]
    );

    const unlockUntil = result.rows[0]?.measurement_unlocked_until;
    if (!unlockUntil) return null;

    const unlockDate = new Date(unlockUntil);
    return unlockDate > new Date() ? unlockDate : null;
  },
};
