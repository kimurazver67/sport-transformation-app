-- Добавляем колонку goal для хранения цели участника
-- weight_loss = похудение, muscle_gain = набор массы

ALTER TABLE users
ADD COLUMN IF NOT EXISTS goal VARCHAR(20) DEFAULT NULL;

-- Добавляем constraint для валидации значений
ALTER TABLE users
ADD CONSTRAINT users_goal_check CHECK (goal IN ('weight_loss', 'muscle_gain') OR goal IS NULL);

-- Комментарий
COMMENT ON COLUMN users.goal IS 'Цель участника: weight_loss (похудение) или muscle_gain (набор массы)';
