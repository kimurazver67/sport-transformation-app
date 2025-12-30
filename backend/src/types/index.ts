// ===== РОЛИ ПОЛЬЗОВАТЕЛЕЙ =====
export type UserRole = 'participant' | 'trainer';

// ===== ЦЕЛИ УЧАСТНИКА =====
export type UserGoal = 'weight_loss' | 'muscle_gain';

// ===== ТИПЫ ТРЕНИРОВОК =====
export type WorkoutType = 'strength' | 'cardio' | 'rest';

// ===== НАСТРОЕНИЕ (1-5) =====
export type MoodLevel = 1 | 2 | 3 | 4 | 5;

// ===== ТИПЫ ДОСТИЖЕНИЙ =====
export type AchievementType =
  | 'first_week'           // 7 чекинов подряд
  | 'iron_discipline'      // 30 дней без пропусков
  | 'minus_5kg'            // Потеря 5 кг от старта
  | 'progress_visible'     // Фото 4 недели подряд
  | 'week_leader';         // Топ-1 по очкам за неделю

// ===== ПОЛЬЗОВАТЕЛЬ =====
export interface User {
  id: string;
  telegram_id: number;
  username?: string;
  first_name: string;
  last_name?: string;
  role: UserRole;
  goal?: UserGoal;
  start_weight?: number;
  target_weight?: number;
  height?: number;
  age?: number;
  created_at: string;
  updated_at: string;
}

// ===== ЕЖЕДНЕВНЫЙ ЧЕКИН =====
export interface DailyCheckin {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  workout: boolean;
  workout_type?: WorkoutType;
  nutrition: boolean;
  water: boolean;
  water_liters?: number;
  sleep_hours: number;
  mood: MoodLevel;
  steps?: number;
  created_at: string;
}

// ===== ЕЖЕНЕДЕЛЬНЫЕ ЗАМЕРЫ =====
export interface WeeklyMeasurement {
  id: string;
  user_id: string;
  week_number: number;
  date: string;
  weight: number;
  chest?: number;
  waist?: number;
  hips?: number;
  bicep_left?: number;
  bicep_right?: number;
  thigh_left?: number;
  thigh_right?: number;
  body_fat_percent?: number;
  photo_front_file_id?: string;
  photo_side_file_id?: string;
  photo_back_file_id?: string;
  created_at: string;
}

// ===== ЗАДАНИЯ НЕДЕЛИ =====
export interface Task {
  id: string;
  week_number: number;
  title: string;
  description?: string;
  goal?: UserGoal; // null = для всех, иначе только для указанной цели
  is_bonus?: boolean;
  created_at: string;
}

// ===== КОНЦЕПЦИИ НЕДЕЛИ =====
export interface WeeklyConcept {
  id: string;
  week_number: number;
  title: string;
  content: string;
  goal?: UserGoal; // null = для всех
  created_at: string;
}

// ===== ВЫПОЛНЕНИЕ ЗАДАНИЙ =====
export interface TaskCompletion {
  id: string;
  user_id: string;
  task_id: string;
  completed_at: string;
}

// ===== ДОСТИЖЕНИЯ =====
export interface Achievement {
  id: string;
  user_id: string;
  achievement_type: AchievementType;
  unlocked_at: string;
}

// ===== СТАТИСТИКА УЧАСТНИКА =====
export interface UserStats {
  user_id: string;
  current_streak: number;
  max_streak: number;
  total_points: number;
  weekly_points: number;
  total_checkins: number;
  total_measurements: number;
  tasks_completed: number;
  rank_overall: number;
  rank_weekly: number;
}

// ===== РЕЙТИНГ =====
export interface LeaderboardEntry {
  user_id: string;
  user: User;
  total_points: number;
  weekly_points: number;
  current_streak: number;
  rank: number;
}

// ===== ОЧКИ =====
export const POINTS = {
  DAILY_CHECKIN: 10,
  WEEKLY_MEASUREMENT: 20,
  TASK_COMPLETED: 15,
  STREAK_BONUS_7: 5,
  STREAK_BONUS_14: 10,
  STREAK_BONUS_30: 20,
  // Бонусы за еженедельный прогресс (по проценту изменения)
  PROGRESS_MINIMAL: 10,      // 0.5-1% изменения
  PROGRESS_GOOD: 25,         // 1-2% изменения
  PROGRESS_EXCELLENT: 50,    // 2-3% изменения
  PROGRESS_OUTSTANDING: 100, // >3% изменения
} as const;

// ===== ГРАДАЦИЯ ПРОГРЕССА =====
export const PROGRESS_TIERS = [
  { minPercent: 3.0, points: 100, label: 'Невероятный прогресс!', emoji: '🔥' },
  { minPercent: 2.0, points: 50, label: 'Отличный прогресс!', emoji: '⭐' },
  { minPercent: 1.0, points: 25, label: 'Хороший прогресс!', emoji: '💪' },
  { minPercent: 0.5, points: 10, label: 'Есть прогресс!', emoji: '✨' },
] as const;

// ===== ДОСТИЖЕНИЯ КОНФИГ =====
export const ACHIEVEMENTS_CONFIG: Record<AchievementType, {
  title: string;
  description: string;
  icon: string;
}> = {
  first_week: {
    title: 'Первая неделя',
    description: '7 чекинов подряд',
    icon: '🏃'
  },
  iron_discipline: {
    title: 'Железная дисциплина',
    description: '30 дней без пропусков',
    icon: '💪'
  },
  minus_5kg: {
    title: 'Минус 5 кг',
    description: 'Потеря 5 кг от старта',
    icon: '⚖️'
  },
  progress_visible: {
    title: 'Прогресс виден',
    description: 'Фото 4 недели подряд',
    icon: '📸'
  },
  week_leader: {
    title: 'Лидер недели',
    description: 'Топ-1 по очкам за неделю',
    icon: '🏆'
  }
};

// ===== API ОТВЕТЫ =====
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ===== ФОРМЫ ДЛЯ FRONTEND =====
export interface CheckinForm {
  workout: boolean;
  workout_type?: WorkoutType;
  nutrition: boolean;
  water: boolean;
  water_liters?: number;
  sleep_hours: number;
  mood: MoodLevel;
  steps?: number;
}

export interface MeasurementForm {
  weight: number;
  chest?: number;
  waist?: number;
  hips?: number;
  bicep_left?: number;
  bicep_right?: number;
  thigh_left?: number;
  thigh_right?: number;
  body_fat_percent?: number;
}

// ===== ДАШБОРД ТРЕНЕРА =====
export interface TrainerDashboard {
  total_participants: number;
  active_today: number;
  missing_checkin_today: User[];
  missing_measurement_this_week: User[];
  average_weight_change: number;
  average_streak: number;
  course_week: number;
}

// ===== ПРОГРЕСС УЧАСТНИКА =====
export interface ParticipantProgress {
  user: User;
  measurements: WeeklyMeasurement[];
  checkins: DailyCheckin[];
  achievements: Achievement[];
  stats: UserStats;
}
