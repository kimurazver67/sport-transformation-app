-- ===== СОЗДАНИЕ ТАБЛИЦ =====

-- Расширение для UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Пользователи
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'participant' CHECK (role IN ('participant', 'trainer')),
  start_weight DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ежедневные чекины
CREATE TABLE IF NOT EXISTS daily_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  workout BOOLEAN NOT NULL DEFAULT false,
  workout_type VARCHAR(50) CHECK (workout_type IN ('strength', 'cardio', 'rest')),
  nutrition BOOLEAN NOT NULL DEFAULT false,
  water BOOLEAN NOT NULL DEFAULT false,
  water_liters DECIMAL(3,1),
  sleep_hours DECIMAL(3,1) NOT NULL,
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Еженедельные замеры
CREATE TABLE IF NOT EXISTS weekly_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number >= 0),
  date DATE NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  chest DECIMAL(5,1),
  waist DECIMAL(5,1),
  hips DECIMAL(5,1),
  bicep_left DECIMAL(5,1),
  bicep_right DECIMAL(5,1),
  thigh_left DECIMAL(5,1),
  thigh_right DECIMAL(5,1),
  body_fat_percent DECIMAL(4,1),
  photo_front_file_id TEXT,
  photo_side_file_id TEXT,
  photo_back_file_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_number)
);

-- Задания недели
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Выполнение заданий
CREATE TABLE IF NOT EXISTS task_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, task_id)
);

-- Достижения
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_type VARCHAR(50) NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

-- Статистика пользователей
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  max_streak INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  weekly_points INTEGER NOT NULL DEFAULT 0,
  last_checkin_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== ИНДЕКСЫ =====
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON daily_checkins(user_id, date);
CREATE INDEX IF NOT EXISTS idx_weekly_measurements_user_week ON weekly_measurements(user_id, week_number);
CREATE INDEX IF NOT EXISTS idx_tasks_week ON tasks(week_number);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);

-- ===== VIEW для рейтинга =====
DROP VIEW IF EXISTS leaderboard;
CREATE VIEW leaderboard AS
SELECT
  u.id,
  u.telegram_id,
  u.username,
  u.first_name,
  u.last_name,
  COALESCE(s.total_points, 0) as total_points,
  COALESCE(s.weekly_points, 0) as weekly_points,
  COALESCE(s.current_streak, 0) as current_streak,
  RANK() OVER (ORDER BY COALESCE(s.total_points, 0) DESC) as rank_overall,
  RANK() OVER (ORDER BY COALESCE(s.weekly_points, 0) DESC) as rank_weekly
FROM users u
LEFT JOIN user_stats s ON u.id = s.user_id
WHERE u.role = 'participant'
ORDER BY total_points DESC;
