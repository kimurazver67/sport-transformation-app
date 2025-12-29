import { supabaseAdmin } from '../db/supabase';
import { User, UserRole } from '../../shared/types';
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
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();

    if (error || !data) return null;
    return data as User;
  },

  // Создать нового пользователя
  async create(userData: CreateUserData): Promise<User> {
    // Проверяем, является ли пользователь тренером
    const role: UserRole =
      config.course.trainerTelegramId === userData.telegram_id
        ? 'trainer'
        : userData.role || 'participant';

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        telegram_id: userData.telegram_id,
        username: userData.username || null,
        first_name: userData.first_name,
        last_name: userData.last_name || null,
        role,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create user: ${error.message}`);
    return data as User;
  },

  // Найти или создать пользователя
  async findOrCreate(userData: CreateUserData): Promise<User> {
    const existing = await this.findByTelegramId(userData.telegram_id);
    if (existing) return existing;
    return this.create(userData);
  },

  // Обновить стартовый вес
  async updateStartWeight(userId: string, weight: number): Promise<void> {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ start_weight: weight })
      .eq('id', userId);

    if (error) throw new Error(`Failed to update start weight: ${error.message}`);
  },

  // Получить всех участников
  async getAllParticipants(): Promise<User[]> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('role', 'participant')
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to get participants: ${error.message}`);
    return (data || []) as User[];
  },

  // Получить участников без чекина сегодня
  async getWithoutCheckinToday(): Promise<User[]> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        daily_checkins!left(id)
      `)
      .eq('role', 'participant')
      .or(`daily_checkins.date.neq.${today},daily_checkins.is.null`);

    if (error) throw new Error(`Failed to get users without checkin: ${error.message}`);

    // Фильтруем пользователей без чекина
    return (data || []).filter((u: any) =>
      !u.daily_checkins || u.daily_checkins.length === 0
    ) as User[];
  },

  // Получить участников без замеров на текущей неделе
  async getWithoutMeasurementThisWeek(weekNumber: number): Promise<User[]> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        weekly_measurements!left(id)
      `)
      .eq('role', 'participant')
      .or(`weekly_measurements.week_number.neq.${weekNumber},weekly_measurements.is.null`);

    if (error) throw new Error(`Failed to get users without measurement: ${error.message}`);

    return (data || []).filter((u: any) =>
      !u.weekly_measurements || u.weekly_measurements.length === 0
    ) as User[];
  },
};
