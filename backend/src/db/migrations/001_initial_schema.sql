-- =============================================
-- МИГРАЦИЯ 001: Начальная схема базы данных
-- Проект: Трансформация тела - Telegram Mini App
-- =============================================

-- Включаем расширение для UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ТАБЛИЦА: users (Пользователи)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'participant' CHECK (role IN ('participant', 'trainer')),
    start_weight DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для быстрого поиска по telegram_id
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =============================================
-- ТАБЛИЦА: daily_checkins (Ежедневные чекины)
-- =============================================
CREATE TABLE IF NOT EXISTS daily_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    workout BOOLEAN NOT NULL DEFAULT false,
    workout_type VARCHAR(20) CHECK (workout_type IN ('strength', 'cardio', 'rest')),
    nutrition BOOLEAN NOT NULL DEFAULT false,
    water BOOLEAN NOT NULL DEFAULT false,
    water_liters DECIMAL(3,1),
    sleep_hours DECIMAL(3,1) NOT NULL CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
    mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Один чекин в день на пользователя
    UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON daily_checkins(user_id, date);
CREATE INDEX IF NOT EXISTS idx_checkins_date ON daily_checkins(date);

-- =============================================
-- ТАБЛИЦА: weekly_measurements (Еженедельные замеры)
-- =============================================
CREATE TABLE IF NOT EXISTS weekly_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 20),
    date DATE NOT NULL,
    weight DECIMAL(5,2) NOT NULL CHECK (weight > 0 AND weight < 500),
    chest DECIMAL(5,1) CHECK (chest > 0 AND chest < 300),
    waist DECIMAL(5,1) CHECK (waist > 0 AND waist < 300),
    hips DECIMAL(5,1) CHECK (hips > 0 AND hips < 300),
    bicep_left DECIMAL(4,1) CHECK (bicep_left > 0 AND bicep_left < 100),
    bicep_right DECIMAL(4,1) CHECK (bicep_right > 0 AND bicep_right < 100),
    thigh_left DECIMAL(5,1) CHECK (thigh_left > 0 AND thigh_left < 150),
    thigh_right DECIMAL(5,1) CHECK (thigh_right > 0 AND thigh_right < 150),
    body_fat_percent DECIMAL(4,1) CHECK (body_fat_percent >= 0 AND body_fat_percent <= 100),
    photo_front_url TEXT,
    photo_side_url TEXT,
    photo_back_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Один замер в неделю на пользователя
    UNIQUE(user_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_measurements_user_week ON weekly_measurements(user_id, week_number);

-- =============================================
-- ТАБЛИЦА: tasks (Задания недели)
-- =============================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 20),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_week ON tasks(week_number);

-- =============================================
-- ТАБЛИЦА: task_completions (Выполнение заданий)
-- =============================================
CREATE TABLE IF NOT EXISTS task_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Одно выполнение задания на пользователя
    UNIQUE(user_id, task_id)
);

CREATE INDEX IF NOT EXISTS idx_task_completions_user ON task_completions(user_id);

-- =============================================
-- ТАБЛИЦА: achievements (Достижения)
-- =============================================
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(50) NOT NULL CHECK (
        achievement_type IN (
            'first_week',
            'iron_discipline',
            'minus_5kg',
            'progress_visible',
            'week_leader'
        )
    ),
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Одно достижение каждого типа на пользователя
    UNIQUE(user_id, achievement_type)
);

CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);

-- =============================================
-- ТАБЛИЦА: user_stats (Статистика пользователей)
-- =============================================
CREATE TABLE IF NOT EXISTS user_stats (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    max_streak INTEGER NOT NULL DEFAULT 0,
    total_points INTEGER NOT NULL DEFAULT 0,
    weekly_points INTEGER NOT NULL DEFAULT 0,
    last_checkin_date DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ФУНКЦИЯ: Автообновление updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Триггер для user_stats
DROP TRIGGER IF EXISTS update_user_stats_updated_at ON user_stats;
CREATE TRIGGER update_user_stats_updated_at
    BEFORE UPDATE ON user_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ФУНКЦИЯ: Создание user_stats при создании user
-- =============================================
CREATE OR REPLACE FUNCTION create_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_stats (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS create_user_stats_trigger ON users;
CREATE TRIGGER create_user_stats_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_stats();

-- =============================================
-- VIEW: leaderboard (Рейтинг участников)
-- =============================================
DROP VIEW IF EXISTS leaderboard;
CREATE VIEW leaderboard AS
SELECT
    u.id,
    u.telegram_id,
    u.username,
    u.first_name,
    u.last_name,
    us.total_points,
    us.weekly_points,
    us.current_streak,
    us.max_streak,
    RANK() OVER (ORDER BY us.total_points DESC) as rank_overall,
    RANK() OVER (ORDER BY us.weekly_points DESC) as rank_weekly
FROM users u
JOIN user_stats us ON u.id = us.user_id
WHERE u.role = 'participant'
ORDER BY us.total_points DESC;

-- =============================================
-- RLS (Row Level Security)
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Политики для service_role (полный доступ для backend)
DROP POLICY IF EXISTS "Service role full access" ON users;
DROP POLICY IF EXISTS "Service role full access" ON daily_checkins;
DROP POLICY IF EXISTS "Service role full access" ON weekly_measurements;
DROP POLICY IF EXISTS "Service role full access" ON tasks;
DROP POLICY IF EXISTS "Service role full access" ON task_completions;
DROP POLICY IF EXISTS "Service role full access" ON achievements;
DROP POLICY IF EXISTS "Service role full access" ON user_stats;

CREATE POLICY "Service role full access" ON users FOR ALL USING (true);
CREATE POLICY "Service role full access" ON daily_checkins FOR ALL USING (true);
CREATE POLICY "Service role full access" ON weekly_measurements FOR ALL USING (true);
CREATE POLICY "Service role full access" ON tasks FOR ALL USING (true);
CREATE POLICY "Service role full access" ON task_completions FOR ALL USING (true);
CREATE POLICY "Service role full access" ON achievements FOR ALL USING (true);
CREATE POLICY "Service role full access" ON user_stats FOR ALL USING (true);

-- =============================================
-- STORAGE: Bucket для фото прогресса
-- =============================================
-- Выполните в Supabase Dashboard -> Storage:
-- 1. Создать bucket "progress-photos" (public: false)
-- 2. Добавить политику для загрузки авторизованным пользователям
