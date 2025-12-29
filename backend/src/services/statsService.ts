import { supabaseAdmin } from '../db/supabase';
import { UserStats, LeaderboardEntry, POINTS } from '../types';

export const statsService = {
  // Получить статистику пользователя
  async getUserStats(userId: string): Promise<UserStats | null> {
    const { data: stats, error } = await supabaseAdmin
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !stats) return null;

    // Получаем позиции в рейтинге
    const { data: leaderboard } = await supabaseAdmin
      .from('leaderboard')
      .select('id, rank_overall, rank_weekly')
      .eq('id', userId)
      .single();

    return {
      user_id: userId,
      current_streak: stats.current_streak,
      max_streak: stats.max_streak,
      total_points: stats.total_points,
      weekly_points: stats.weekly_points,
      total_checkins: 0, // будет вычислено отдельно при необходимости
      total_measurements: 0,
      tasks_completed: 0,
      rank_overall: leaderboard?.rank_overall || 0,
      rank_weekly: leaderboard?.rank_weekly || 0,
    };
  },

  // Добавить очки
  async addPoints(userId: string, points: number): Promise<void> {
    const { error } = await supabaseAdmin.rpc('add_user_points', {
      p_user_id: userId,
      p_points: points,
    });

    // Если функция не существует, делаем вручную
    if (error) {
      const { data: current } = await supabaseAdmin
        .from('user_stats')
        .select('total_points, weekly_points')
        .eq('user_id', userId)
        .single();

      await supabaseAdmin
        .from('user_stats')
        .update({
          total_points: (current?.total_points || 0) + points,
          weekly_points: (current?.weekly_points || 0) + points,
        })
        .eq('user_id', userId);
    }
  },

  // Обновить streak
  async updateStreak(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Получаем текущую статистику
    const { data: stats } = await supabaseAdmin
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!stats) return 0;

    let newStreak: number;

    if (stats.last_checkin_date === yesterday) {
      // Продолжаем streak
      newStreak = stats.current_streak + 1;
    } else if (stats.last_checkin_date === today) {
      // Уже был чекин сегодня
      newStreak = stats.current_streak;
    } else {
      // Начинаем новый streak
      newStreak = 1;
    }

    const newMaxStreak = Math.max(newStreak, stats.max_streak);

    // Начисляем бонусные очки за streak
    let bonusPoints = 0;
    if (newStreak === 7) bonusPoints = POINTS.STREAK_BONUS_7;
    else if (newStreak === 14) bonusPoints = POINTS.STREAK_BONUS_14;
    else if (newStreak === 30) bonusPoints = POINTS.STREAK_BONUS_30;
    else if (newStreak > 7 && newStreak % 7 === 0) bonusPoints = POINTS.STREAK_BONUS_7;

    await supabaseAdmin
      .from('user_stats')
      .update({
        current_streak: newStreak,
        max_streak: newMaxStreak,
        last_checkin_date: today,
        total_points: stats.total_points + bonusPoints,
        weekly_points: stats.weekly_points + bonusPoints,
      })
      .eq('user_id', userId);

    return newStreak;
  },

  // Сбросить недельные очки (вызывается по cron в понедельник)
  async resetWeeklyPoints(): Promise<void> {
    const { error } = await supabaseAdmin
      .from('user_stats')
      .update({ weekly_points: 0 })
      .neq('user_id', '00000000-0000-0000-0000-000000000000'); // all rows

    if (error) throw new Error(`Failed to reset weekly points: ${error.message}`);
  },

  // Получить рейтинг
  async getLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabaseAdmin
      .from('leaderboard')
      .select('*')
      .limit(limit);

    if (error) throw new Error(`Failed to get leaderboard: ${error.message}`);

    return (data || []).map((row: any, index: number) => ({
      user_id: row.id,
      user: {
        id: row.id,
        telegram_id: row.telegram_id,
        username: row.username,
        first_name: row.first_name,
        last_name: row.last_name,
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
    const { data, error } = await supabaseAdmin
      .from('leaderboard')
      .select('*')
      .order('weekly_points', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to get weekly leaderboard: ${error.message}`);

    return (data || []).map((row: any, index: number) => ({
      user_id: row.id,
      user: {
        id: row.id,
        telegram_id: row.telegram_id,
        username: row.username,
        first_name: row.first_name,
        last_name: row.last_name,
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
};
