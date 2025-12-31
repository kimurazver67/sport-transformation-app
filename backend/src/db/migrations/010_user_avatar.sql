-- =============================================
-- МИГРАЦИЯ 010: Аватарка пользователя
-- =============================================

-- Добавляем колонку для хранения file_id аватарки из Telegram
ALTER TABLE users
ADD COLUMN IF NOT EXISTS avatar_file_id TEXT;

-- Комментарий
COMMENT ON COLUMN users.avatar_file_id IS 'Telegram file_id аватарки пользователя';
