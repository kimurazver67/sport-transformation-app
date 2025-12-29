-- Миграция: Переход на хранение фото в Telegram
-- Telegram хранит фото бесплатно и без лимитов

-- Добавляем колонки для file_id
ALTER TABLE weekly_measurements
ADD COLUMN IF NOT EXISTS photo_front_file_id TEXT,
ADD COLUMN IF NOT EXISTS photo_side_file_id TEXT,
ADD COLUMN IF NOT EXISTS photo_back_file_id TEXT;

-- Удаляем старые колонки URL (Supabase Storage больше не используется)
ALTER TABLE weekly_measurements
DROP COLUMN IF EXISTS photo_front_url,
DROP COLUMN IF EXISTS photo_side_url,
DROP COLUMN IF EXISTS photo_back_url;
