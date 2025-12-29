import { query } from '../db/postgres';
import { Achievement, AchievementType, ACHIEVEMENTS_CONFIG } from '../types';

export const achievementService = {
  // Получить все достижения пользователя
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    const result = await query<Achievement>(
      'SELECT * FROM achievements WHERE user_id = $1 ORDER BY unlocked_at DESC',
      [userId]
    );

    return result.rows;
  },

  // Разблокировать достижение
  async unlock(userId: string, type: AchievementType): Promise<Achievement | null> {
    // Проверяем, не получено ли уже
    const existingResult = await query<{ id: string }>(
      'SELECT id FROM achievements WHERE user_id = $1 AND achievement_type = $2',
      [userId, type]
    );

    if (existingResult.rows[0]) return null; // Уже есть

    const insertResult = await query<Achievement>(
      `INSERT INTO achievements (user_id, achievement_type)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, type]
    );

    return insertResult.rows[0] || null;
  },

  // Проверить и разблокировать достижения
  async checkAndUnlock(userId: string): Promise<Achievement[]> {
    const unlocked: Achievement[] = [];

    // Проверяем "Первая неделя" - 7 чекинов подряд
    const firstWeek = await this.checkFirstWeek(userId);
    if (firstWeek) unlocked.push(firstWeek);

    // Проверяем "Железная дисциплина" - 30 дней подряд
    const ironDiscipline = await this.checkIronDiscipline(userId);
    if (ironDiscipline) unlocked.push(ironDiscipline);

    // Проверяем "Минус 5 кг"
    const minus5kg = await this.checkMinus5kg(userId);
    if (minus5kg) unlocked.push(minus5kg);

    // Проверяем "Прогресс виден" - 4 недели фото подряд
    const progressVisible = await this.checkProgressVisible(userId);
    if (progressVisible) unlocked.push(progressVisible);

    return unlocked;
  },

  // Проверка: 7 чекинов подряд
  async checkFirstWeek(userId: string): Promise<Achievement | null> {
    const result = await query<{ current_streak: number }>(
      'SELECT current_streak FROM user_stats WHERE user_id = $1',
      [userId]
    );

    const stats = result.rows[0];
    if (stats && stats.current_streak >= 7) {
      return this.unlock(userId, 'first_week');
    }
    return null;
  },

  // Проверка: 30 дней подряд
  async checkIronDiscipline(userId: string): Promise<Achievement | null> {
    const result = await query<{ current_streak: number }>(
      'SELECT current_streak FROM user_stats WHERE user_id = $1',
      [userId]
    );

    const stats = result.rows[0];
    if (stats && stats.current_streak >= 30) {
      return this.unlock(userId, 'iron_discipline');
    }
    return null;
  },

  // Проверка: потеря 5 кг
  async checkMinus5kg(userId: string): Promise<Achievement | null> {
    // Получаем стартовый вес
    const userResult = await query<{ start_weight: number | null }>(
      'SELECT start_weight FROM users WHERE id = $1',
      [userId]
    );

    const user = userResult.rows[0];
    if (!user?.start_weight) return null;

    // Получаем последний замер
    const measurementResult = await query<{ weight: number }>(
      `SELECT weight FROM weekly_measurements
       WHERE user_id = $1
       ORDER BY week_number DESC
       LIMIT 1`,
      [userId]
    );

    const measurement = measurementResult.rows[0];
    if (!measurement) return null;

    const weightLoss = user.start_weight - measurement.weight;
    if (weightLoss >= 5) {
      return this.unlock(userId, 'minus_5kg');
    }
    return null;
  },

  // Проверка: 4 недели с фото подряд
  async checkProgressVisible(userId: string): Promise<Achievement | null> {
    const result = await query<{ week_number: number; photo_front_file_id: string | null }>(
      `SELECT week_number, photo_front_file_id FROM weekly_measurements
       WHERE user_id = $1 AND photo_front_file_id IS NOT NULL
       ORDER BY week_number ASC`,
      [userId]
    );

    const measurements = result.rows;
    if (measurements.length < 4) return null;

    // Проверяем 4 подряд идущих недели с фото
    let consecutive = 1;
    for (let i = 1; i < measurements.length; i++) {
      if (measurements[i].week_number === measurements[i - 1].week_number + 1) {
        consecutive++;
        if (consecutive >= 4) {
          return this.unlock(userId, 'progress_visible');
        }
      } else {
        consecutive = 1;
      }
    }
    return null;
  },

  // Разблокировать "Лидер недели" (вызывается по cron)
  async unlockWeekLeader(): Promise<Achievement | null> {
    const result = await query<{ id: string }>(
      'SELECT id FROM leaderboard ORDER BY weekly_points DESC LIMIT 1'
    );

    const leader = result.rows[0];
    if (!leader) return null;
    return this.unlock(leader.id, 'week_leader');
  },

  // Получить инфо о достижении
  getAchievementInfo(type: AchievementType) {
    return ACHIEVEMENTS_CONFIG[type];
  },
};
