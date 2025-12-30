-- =============================================
-- МИГРАЦИЯ 007: Задания по целям + концепции недели
-- =============================================

-- Добавляем поле goal в задания (null = для всех, 'weight_loss' или 'muscle_gain' = только для этой цели)
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS goal VARCHAR(20) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_bonus BOOLEAN DEFAULT FALSE;

-- Создаём таблицу концепций/теории недели
CREATE TABLE IF NOT EXISTS weekly_concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_number INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    goal VARCHAR(20) DEFAULT NULL, -- null = для всех
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT weekly_concepts_goal_check CHECK (goal IN ('weight_loss', 'muscle_gain') OR goal IS NULL)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_weekly_concepts_week ON weekly_concepts(week_number);

-- Комментарии
COMMENT ON COLUMN tasks.goal IS 'Цель для которой это задание (null = для всех)';
COMMENT ON COLUMN tasks.is_bonus IS 'Бонусное задание (за доп. очки)';
COMMENT ON TABLE weekly_concepts IS 'Концепции и теория недели';
COMMENT ON COLUMN weekly_concepts.goal IS 'Цель для которой эта концепция (null = для всех)';
