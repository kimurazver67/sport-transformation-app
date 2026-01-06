import { query } from '../db/postgres';
import { UserStats, LeaderboardEntry, POINTS, UserGoal } from '../types';

interface UserStatsRow {
  user_id: string;
  current_streak: number;
  max_streak: number;
  total_points: number;
  weekly_points: number;
  last_checkin_date: string | null;
}

interface LeaderboardRow {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string;
  last_name: string | null;
  avatar_file_id: string | null;
  total_points: number;
  weekly_points: number;
  current_streak: number;
  rank_overall: number;
  rank_weekly: number;
}

export const statsService = {
  // Получить статистику пользователя
  async getUserStats(userId: string): Promise<UserStats | null> {
    const statsResult = await query<UserStatsRow>(
      'SELECT * FROM user_stats WHERE user_id = $1',
      [userId]
    );

    const stats = statsResult.rows[0];
    if (!stats) return null;

    // Получаем позиции в рейтинге через view
    const leaderboardResult = await query<{ rank_overall: number; rank_weekly: number }>(
      'SELECT rank_overall, rank_weekly FROM leaderboard WHERE id = $1',
      [userId]
    );

    const leaderboard = leaderboardResult.rows[0];

    return {
      user_id: userId,
      current_streak: stats.current_streak,
      max_streak: stats.max_streak,
      total_points: stats.total_points,
      weekly_points: stats.weekly_points,
      total_checkins: 0,
      total_measurements: 0,
      tasks_completed: 0,
      rank_overall: leaderboard?.rank_overall || 0,
      rank_weekly: leaderboard?.rank_weekly || 0,
    };
  },

  // Добавить очки
  async addPoints(userId: string, points: number): Promise<void> {
    await query(
      `UPDATE user_stats SET
        total_points = total_points + $1,
        weekly_points = weekly_points + $1,
        updated_at = NOW()
      WHERE user_id = $2`,
      [points, userId]
    );
  },

  // Обновить streak
  async updateStreak(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Получаем текущую статистику
    const result = await query<UserStatsRow>(
      'SELECT * FROM user_stats WHERE user_id = $1',
      [userId]
    );

    const stats = result.rows[0];
    if (!stats) return 0;

    // Преобразуем last_checkin_date в строку формата YYYY-MM-DD
    const lastCheckinDate = stats.last_checkin_date
      ? (typeof stats.last_checkin_date === 'string'
          ? stats.last_checkin_date.split('T')[0]
          : new Date(stats.last_checkin_date).toISOString().split('T')[0])
      : null;

    console.log('[Streak Debug]', {
      userId,
      today,
      yesterday,
      lastCheckinDate,
      currentStreak: stats.current_streak
    });

    let newStreak: number;

    if (lastCheckinDate === yesterday) {
      // Продолжаем streak
      newStreak = stats.current_streak + 1;
      console.log('[Streak] Continuing streak:', newStreak);
    } else if (lastCheckinDate === today) {
      // Уже был чекин сегодня
      newStreak = stats.current_streak;
      console.log('[Streak] Already checked in today');
    } else {
      // Начинаем новый streak
      newStreak = 1;
      console.log('[Streak] Starting new streak');
    }

    const newMaxStreak = Math.max(newStreak, stats.max_streak);

    // Начисляем бонусные очки за streak
    let bonusPoints = 0;
    if (newStreak === 7) bonusPoints = POINTS.STREAK_BONUS_7;
    else if (newStreak === 14) bonusPoints = POINTS.STREAK_BONUS_14;
    else if (newStreak === 30) bonusPoints = POINTS.STREAK_BONUS_30;
    else if (newStreak > 7 && newStreak % 7 === 0) bonusPoints = POINTS.STREAK_BONUS_7;

    await query(
      `UPDATE user_stats SET
        current_streak = $1,
        max_streak = $2,
        last_checkin_date = $3,
        total_points = total_points + $4,
        weekly_points = weekly_points + $4,
        updated_at = NOW()
      WHERE user_id = $5`,
      [newStreak, newMaxStreak, today, bonusPoints, userId]
    );

    return newStreak;
  },

  // Сбросить недельные очки (вызывается по cron в понедельник)
  async resetWeeklyPoints(): Promise<void> {
    await query('UPDATE user_stats SET weekly_points = 0, updated_at = NOW()');
  },

  // Получить рейтинг
  async getLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
    const result = await query<LeaderboardRow>(
      `SELECT l.*, u.avatar_file_id
       FROM leaderboard l
       JOIN users u ON l.id = u.id
       ORDER BY l.total_points DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map((row) => ({
      user_id: row.id,
      user: {
        id: row.id,
        telegram_id: row.telegram_id,
        username: row.username || undefined,
        first_name: row.first_name,
        last_name: row.last_name || undefined,
        avatar_file_id: row.avatar_file_id || undefined,
        role: 'participant' as const,
        created_at: '',
        updated_at: '',
      },
      total_points: row.total_points,
      weekly_points: row.weekly_points,
      current_streak: row.current_streak,
      rank: row.rank_overall,
    }));
  },

  // Получить недельный рейтинг
  async getWeeklyLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
    const result = await query<LeaderboardRow>(
      `SELECT l.*, u.avatar_file_id
       FROM leaderboard l
       JOIN users u ON l.id = u.id
       ORDER BY l.weekly_points DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map((row) => ({
      user_id: row.id,
      user: {
        id: row.id,
        telegram_id: row.telegram_id,
        username: row.username || undefined,
        first_name: row.first_name,
        last_name: row.last_name || undefined,
        avatar_file_id: row.avatar_file_id || undefined,
        role: 'participant' as const,
        created_at: '',
        updated_at: '',
      },
      total_points: row.total_points,
      weekly_points: row.weekly_points,
      current_streak: row.current_streak,
      rank: row.rank_weekly,
    }));
  },

  // Получить рейтинг по цели (🔥 weight_loss / 💪 muscle_gain)
  async getLeaderboardByGoal(goal: UserGoal, limit = 20): Promise<LeaderboardEntry[]> {
    const result = await query<LeaderboardRow & { goal?: UserGoal }>(
      `SELECT l.*, u.goal, u.avatar_file_id
       FROM leaderboard l
       JOIN users u ON l.id = u.id
       WHERE u.goal = $1
       ORDER BY l.total_points DESC
       LIMIT $2`,
      [goal, limit]
    );

    return result.rows.map((row, index) => ({
      user_id: row.id,
      user: {
        id: row.id,
        telegram_id: row.telegram_id,
        username: row.username || undefined,
        first_name: row.first_name,
        last_name: row.last_name || undefined,
        avatar_file_id: row.avatar_file_id || undefined,
        role: 'participant' as const,
        goal: row.goal,
        created_at: '',
        updated_at: '',
      },
      total_points: row.total_points,
      weekly_points: row.weekly_points,
      current_streak: row.current_streak,
      rank: index + 1, // Пересчитываем ранг внутри цели
    }));
  },

  // Получить недельный рейтинг по цели
  async getWeeklyLeaderboardByGoal(goal: UserGoal, limit = 20): Promise<LeaderboardEntry[]> {
    const result = await query<LeaderboardRow & { goal?: UserGoal }>(
      `SELECT l.*, u.goal, u.avatar_file_id
       FROM leaderboard l
       JOIN users u ON l.id = u.id
       WHERE u.goal = $1
       ORDER BY l.weekly_points DESC
       LIMIT $2`,
      [goal, limit]
    );

    return result.rows.map((row, index) => ({
      user_id: row.id,
      user: {
        id: row.id,
        telegram_id: row.telegram_id,
        username: row.username || undefined,
        first_name: row.first_name,
        last_name: row.last_name || undefined,
        avatar_file_id: row.avatar_file_id || undefined,
        role: 'participant' as const,
        goal: row.goal,
        created_at: '',
        updated_at: '',
      },
      total_points: row.total_points,
      weekly_points: row.weekly_points,
      current_streak: row.current_streak,
      rank: index + 1,
    }));
  },

  // Сбросить баллы всем пользователям
  async resetAllPoints(points: number): Promise<number> {
    const result = await query(
      `UPDATE user_stats
       SET total_points = $1,
           weekly_points = $1,
           updated_at = NOW()`,
      [points]
    );
    return result.rowCount || 0;
  },
};
