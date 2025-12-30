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

  // Получить участников без установленной цели
  async getWithoutGoal(): Promise<User[]> {
    const result = await query<User>(
      `SELECT * FROM users WHERE role = 'participant' AND goal IS NULL`
    );

    return result.rows;
  },
};
