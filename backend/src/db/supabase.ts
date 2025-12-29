import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

// Клиент с ограниченными правами (для API)
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

// Клиент с полными правами (для сервисных операций)
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey
);

// Типы для базы данных
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          telegram_id: number;
          username: string | null;
          first_name: string;
          last_name: string | null;
          role: 'participant' | 'trainer';
          start_weight: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      daily_checkins: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          workout: boolean;
          workout_type: 'strength' | 'cardio' | 'rest' | null;
          nutrition: boolean;
          water: boolean;
          water_liters: number | null;
          sleep_hours: number;
          mood: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['daily_checkins']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['daily_checkins']['Insert']>;
      };
      weekly_measurements: {
        Row: {
          id: string;
          user_id: string;
          week_number: number;
          date: string;
          weight: number;
          chest: number | null;
          waist: number | null;
          hips: number | null;
          bicep_left: number | null;
          bicep_right: number | null;
          thigh_left: number | null;
          thigh_right: number | null;
          body_fat_percent: number | null;
          photo_front_url: string | null;
          photo_side_url: string | null;
          photo_back_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['weekly_measurements']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['weekly_measurements']['Insert']>;
      };
      tasks: {
        Row: {
          id: string;
          week_number: number;
          title: string;
          description: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>;
      };
      task_completions: {
        Row: {
          id: string;
          user_id: string;
          task_id: string;
          completed_at: string;
        };
        Insert: Omit<Database['public']['Tables']['task_completions']['Row'], 'id' | 'completed_at'>;
        Update: Partial<Database['public']['Tables']['task_completions']['Insert']>;
      };
      achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_type: string;
          unlocked_at: string;
        };
        Insert: Omit<Database['public']['Tables']['achievements']['Row'], 'id' | 'unlocked_at'>;
        Update: Partial<Database['public']['Tables']['achievements']['Insert']>;
      };
      user_stats: {
        Row: {
          user_id: string;
          current_streak: number;
          max_streak: number;
          total_points: number;
          weekly_points: number;
          last_checkin_date: string | null;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_stats']['Row'], 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_stats']['Insert']>;
      };
    };
  };
};
