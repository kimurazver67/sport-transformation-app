-- Migration 023: Rename fatsecret_id to openfoodfacts_code
-- Date: 2026-01-08
-- Description: Replace FatSecret with OpenFoodFacts API

-- Rename column in products table
ALTER TABLE products
RENAME COLUMN fatsecret_id TO openfoodfacts_code;

-- Rename index
DROP INDEX IF EXISTS idx_products_fatsecret;
CREATE INDEX IF NOT EXISTS idx_products_openfoodfacts ON products(openfoodfacts_code);

-- Rename cache table
ALTER TABLE fatsecret_search_cache
RENAME TO openfoodfacts_search_cache;

-- Update indexes for cache table
DROP INDEX IF EXISTS idx_fatsecret_cache_query;
DROP INDEX IF EXISTS idx_fatsecret_cache_expires;
CREATE INDEX IF NOT EXISTS idx_openfoodfacts_cache_query ON openfoodfacts_search_cache(search_query);
CREATE INDEX IF NOT EXISTS idx_openfoodfacts_cache_expires ON openfoodfacts_search_cache(expires_at);

-- Update comments
COMMENT ON TABLE products IS 'Продукты с КБЖУ (локальная БД + OpenFoodFacts импорты)';
COMMENT ON TABLE openfoodfacts_search_cache IS 'Кэш результатов поиска OpenFoodFacts API';
