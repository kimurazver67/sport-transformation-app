-- Миграция: Переход на хранение фото в Telegram
-- Добавляем колонки для Telegram file_id вместо URL

-- Добавляем колонки для file_id (Telegram хранит фото бесплатно)
ALTER TABLE weekly_measurements
ADD COLUMN IF NOT EXISTS photo_front_file_id TEXT,
ADD COLUMN IF NOT EXISTS photo_side_file_id TEXT,
ADD COLUMN IF NOT EXISTS photo_back_file_id TEXT;

-- Комментарии для документации
COMMENT ON COLUMN weekly_measurements.photo_front_file_id IS 'Telegram file_id для фото спереди';
COMMENT ON COLUMN weekly_measurements.photo_side_file_id IS 'Telegram file_id для фото сбоку';
COMMENT ON COLUMN weekly_measurements.photo_back_file_id IS 'Telegram file_id для фото сзади';

-- Старые колонки photo_*_url можно удалить позже после миграции данных
-- ALTER TABLE weekly_measurements DROP COLUMN photo_front_url;
-- ALTER TABLE weekly_measurements DROP COLUMN photo_side_url;
-- ALTER TABLE weekly_measurements DROP COLUMN photo_back_url;
