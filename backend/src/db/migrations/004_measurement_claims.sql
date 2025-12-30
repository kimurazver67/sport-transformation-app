-- Таблица для отслеживания "обещаний" внести замеры
-- Когда пользователь нажимает "Уже внёс замеры" но замера ещё нет

CREATE TABLE IF NOT EXISTS measurement_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, week_number)
);

-- Индекс для быстрого поиска по неделе
CREATE INDEX IF NOT EXISTS idx_measurement_claims_week ON measurement_claims(week_number);
