-- =============================================
-- МИГРАЦИЯ 008: Дневник осознанности + Трекер импульсов
-- =============================================

-- Дневник осознанности (ежедневные записи)
CREATE TABLE IF NOT EXISTS mindfulness_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    gratitude TEXT, -- За что благодарен сегодня
    wins TEXT, -- Маленькие победы дня
    challenges TEXT, -- С какими трудностями столкнулся
    lessons TEXT, -- Что узнал/понял
    mood_note TEXT, -- Заметка о настроении
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Трекер импульсов (когда хочется сорваться)
CREATE TABLE IF NOT EXISTS impulse_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trigger_type VARCHAR(50) NOT NULL, -- stress, boredom, social, emotional, habitual
    intensity INTEGER CHECK (intensity >= 1 AND intensity <= 10), -- 1-10
    action_taken VARCHAR(50) NOT NULL, -- resisted, gave_in, alternative
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_mindfulness_user_date ON mindfulness_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_impulse_user ON impulse_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_impulse_logged_at ON impulse_logs(logged_at);

-- Комментарии
COMMENT ON TABLE mindfulness_entries IS 'Дневник осознанности - ежедневные рефлексии';
COMMENT ON TABLE impulse_logs IS 'Трекер импульсов - логирование желаний сорваться';
COMMENT ON COLUMN impulse_logs.trigger_type IS 'Тип триггера: stress, boredom, social, emotional, habitual';
COMMENT ON COLUMN impulse_logs.action_taken IS 'Действие: resisted (устоял), gave_in (сдался), alternative (альтернатива)';
