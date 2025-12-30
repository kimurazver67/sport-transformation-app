-- =============================================
-- МИГРАЦИЯ 006: Шаги в чекине + расширение онбординга
-- =============================================

-- Добавляем поле шагов в ежедневный чекин
ALTER TABLE daily_checkins
ADD COLUMN IF NOT EXISTS steps INTEGER CHECK (steps >= 0 AND steps <= 100000);

-- Добавляем поля онбординга в users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS height INTEGER CHECK (height >= 100 AND height <= 250),
ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age >= 14 AND age <= 100),
ADD COLUMN IF NOT EXISTS target_weight DECIMAL(5,2) CHECK (target_weight > 0 AND target_weight < 500);

-- Комментарии
COMMENT ON COLUMN daily_checkins.steps IS 'Количество шагов за день';
COMMENT ON COLUMN users.height IS 'Рост в см';
COMMENT ON COLUMN users.age IS 'Возраст';
COMMENT ON COLUMN users.target_weight IS 'Целевой вес';
