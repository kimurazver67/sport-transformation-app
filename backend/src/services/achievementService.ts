import { supabaseAdmin } from '../db/supabase';
import { Achievement, AchievementType, ACHIEVEMENTS_CONFIG } from '../types';

export const achievementService = {
  // Получить все достижения пользователя
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    const { data, error } = await supabaseAdmin
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (error) throw new Error(`Failed to get achievements: ${error.message}`);
    return (data || []) as Achievement[];
  },

  // Разблокировать достижение
  async unlock(userId: string, type: AchievementType): Promise<Achievement | null> {
    // Проверяем, не получено ли уже
    const { data: existing } = await supabaseAdmin
      .from('achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_type', type)
      .single();

    if (existing) return null; // Уже есть

    const { data, error } = await supabaseAdmin
      .from('achievements')
      .insert({
        user_id: userId,
        achievement_type: type,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to unlock achievement: ${error.message}`);
    return data as Achievement;
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
    const { data: stats } = await supabaseAdmin
      .from('user_stats')
      .select('current_streak')
      .eq('user_id', userId)
      .single();

    if (stats && stats.current_streak >= 7) {
      return this.unlock(userId, 'first_week');
    }
    return null;
  },

  // Проверка: 30 дней подряд
  async checkIronDiscipline(userId: string): Promise<Achievement | null> {
    const { data: stats } = await supabaseAdmin
      .from('user_stats')
      .select('current_streak')
      .eq('user_id', userId)
      .single();

    if (stats && stats.current_streak >= 30) {
      return this.unlock(userId, 'iron_discipline');
    }
    return null;
  },

  // Проверка: потеря 5 кг
  async checkMinus5kg(userId: string): Promise<Achievement | null> {
    // Получаем стартовый вес
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('start_weight')
      .eq('id', userId)
      .single();

    if (!user?.start_weight) return null;

    // Получаем последний замер
    const { data: measurements } = await supabaseAdmin
      .from('weekly_measurements')
      .select('weight')
      .eq('user_id', userId)
      .order('week_number', { ascending: false })
      .limit(1);

    if (!measurements || measurements.length === 0) return null;

    const weightLoss = user.start_weight - measurements[0].weight;
    if (weightLoss >= 5) {
      return this.unlock(userId, 'minus_5kg');
    }
    return null;
  },

  // Проверка: 4 недели с фото подряд
  async checkProgressVisible(userId: string): Promise<Achievement | null> {
    const { data: measurements } = await supabaseAdmin
      .from('weekly_measurements')
      .select('week_number, photo_front_url')
      .eq('user_id', userId)
      .not('photo_front_url', 'is', null)
      .order('week_number', { ascending: true });

    if (!measurements || measurements.length < 4) return null;

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
    const { data: leader } = await supabaseAdmin
      .from('leaderboard')
      .select('id')
      .order('weekly_points', { ascending: false })
      .limit(1)
      .single();

    if (!leader) return null;
    return this.unlock(leader.id, 'week_leader');
  },

  // Получить инфо о достижении
  getAchievementInfo(type: AchievementType) {
    return ACHIEVEMENTS_CONFIG[type];
  },
};
