-- Migration 022: User Inventory (продукты в холодильнике/на полках)
-- Позволяет пользователю указать, какие продукты у него есть

-- Таблица инвентаря пользователя
CREATE TABLE IF NOT EXISTS user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Количество продукта (в граммах или штуках в зависимости от типа)
  quantity_grams DECIMAL(10,2),  -- NULL если измеряется штуками
  quantity_units INT,            -- NULL если измеряется граммами

  -- Местоположение
  location VARCHAR(50) DEFAULT 'fridge', -- fridge, freezer, pantry, other

  -- Срок годности (опционально)
  expiry_date DATE,

  -- Метаданные
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Один продукт на пользователя (можно обновлять количество)
  UNIQUE(user_id, product_id)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_user_inventory_user ON user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_product ON user_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_expiry ON user_inventory(expiry_date) WHERE expiry_date IS NOT NULL;

-- Комментарии
COMMENT ON TABLE user_inventory IS 'Продукты, которые есть у пользователя дома';
COMMENT ON COLUMN user_inventory.location IS 'Где хранится: fridge (холодильник), freezer (морозилка), pantry (полка), other (другое)';
COMMENT ON COLUMN user_inventory.quantity_grams IS 'Количество в граммах (для весовых продуктов)';
COMMENT ON COLUMN user_inventory.quantity_units IS 'Количество в штуках (для штучных продуктов: яйца, бананы и т.д.)';
