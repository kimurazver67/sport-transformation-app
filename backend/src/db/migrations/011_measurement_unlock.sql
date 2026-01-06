-- Миграция: Разблокировка замеров для участников
-- Позволяет тренеру открывать возможность внесения замеров вне обычного окна

-- Добавляем поле для хранения времени, до которого открыты замеры
ALTER TABLE users
ADD COLUMN IF NOT EXISTS measurement_unlocked_until TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN users.measurement_unlocked_until IS 'До какого времени участнику разрешено вносить замеры вне обычного окна';
