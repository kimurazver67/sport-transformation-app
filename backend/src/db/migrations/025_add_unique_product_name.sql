-- Migration 025: Add unique constraint on products.name
-- Date: 2026-01-09
-- Description: Prevent duplicate products by adding unique constraint on name

-- Add unique constraint on product name to prevent duplicates
-- Using CREATE INDEX CONCURRENTLY for minimal lock time
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_name_unique'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_name_unique UNIQUE (name);
  END IF;
END $$;

-- Also add unique constraint on recipes.name
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recipes_name_unique'
  ) THEN
    ALTER TABLE recipes ADD CONSTRAINT recipes_name_unique UNIQUE (name);
  END IF;
END $$;
