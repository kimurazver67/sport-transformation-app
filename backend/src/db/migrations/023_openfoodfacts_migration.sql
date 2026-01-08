-- Migration 023: Rename fatsecret_id to openfoodfacts_code
-- Date: 2026-01-08
-- Description: Replace FatSecret with OpenFoodFacts API

-- Rename column in products table (if not already renamed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'fatsecret_id'
  ) THEN
    ALTER TABLE products RENAME COLUMN fatsecret_id TO openfoodfacts_code;
  END IF;
END $$;

-- Rename index
DROP INDEX IF EXISTS idx_products_fatsecret;
CREATE INDEX IF NOT EXISTS idx_products_openfoodfacts ON products(openfoodfacts_code);

-- Rename cache table (if not already renamed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'fatsecret_search_cache'
  ) THEN
    ALTER TABLE fatsecret_search_cache RENAME TO openfoodfacts_search_cache;
  END IF;
END $$;

-- Update indexes for cache table
DROP INDEX IF EXISTS idx_fatsecret_cache_query;
DROP INDEX IF EXISTS idx_fatsecret_cache_expires;

-- Create new indexes only if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'openfoodfacts_search_cache'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_openfoodfacts_cache_query ON openfoodfacts_search_cache(search_query);
    CREATE INDEX IF NOT EXISTS idx_openfoodfacts_cache_expires ON openfoodfacts_search_cache(expires_at);
  END IF;
END $$;

-- Update comments
COMMENT ON TABLE products IS 'Продукты с КБЖУ (локальная БД + OpenFoodFacts импорты)';
