-- =============================================
-- МИГРАЦИЯ 013: Психологический AI-анализ
-- Дата: 2026-01-06
-- Описание: Таблица для хранения еженедельных психологических анализов от Claude AI
-- =============================================

-- Таблица для хранения психологических анализов
CREATE TABLE IF NOT EXISTS psychology_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number >= 0 AND week_number <= 20),

  -- AI анализ (JSONB для гибкости и индексации)
  analysis JSONB NOT NULL,

  -- Сводка данных за неделю (для контекста и отладки)
  data_summary JSONB NOT NULL,

  -- Метаданные
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Один анализ на неделю на пользователя
  UNIQUE(user_id, week_number)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_psychology_user_week
  ON psychology_analyses(user_id, week_number DESC);

CREATE INDEX IF NOT EXISTS idx_psychology_created_at
  ON psychology_analyses(created_at DESC);

-- GIN индекс для поиска внутри JSONB
CREATE INDEX IF NOT EXISTS idx_psychology_analysis_gin
  ON psychology_analyses USING GIN (analysis);

-- Триггер для auto-update updated_at
CREATE OR REPLACE FUNCTION update_psychology_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_psychology_analyses_updated_at_trigger ON psychology_analyses;
CREATE TRIGGER update_psychology_analyses_updated_at_trigger
    BEFORE UPDATE ON psychology_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_psychology_analyses_updated_at();

-- Комментарии к таблице
COMMENT ON TABLE psychology_analyses IS 'Еженедельные психологические анализы от Claude AI на основе поведенческих данных пользователя';
COMMENT ON COLUMN psychology_analyses.analysis IS 'Полный психологический анализ в формате JSON (behavioral_patterns, insights, recommendations)';
COMMENT ON COLUMN psychology_analyses.data_summary IS 'Сводка исходных данных за неделю (статистика чекинов, импульсов, замеров)';
COMMENT ON COLUMN psychology_analyses.week_number IS 'Номер недели курса (0 = до старта, 1-16 = недели курса)';

-- RLS (Row Level Security)
ALTER TABLE psychology_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON psychology_analyses;
CREATE POLICY "Service role full access" ON psychology_analyses FOR ALL USING (true);
