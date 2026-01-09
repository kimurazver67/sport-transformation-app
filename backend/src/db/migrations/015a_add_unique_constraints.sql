-- Migration 015a: Add UNIQUE constraints to products and recipes
-- Date: 2026-01-09
-- SKIP: Complex deduplication moved to migration 025
-- This migration only adds constraints if they don't exist

-- Add unique constraint on products (will fail silently if exists or duplicates present)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname IN ('products_name_key', 'products_name_unique')) THEN
    -- Check if duplicates exist
    IF NOT EXISTS (SELECT name FROM products GROUP BY name HAVING COUNT(*) > 1) THEN
      ALTER TABLE products ADD CONSTRAINT products_name_key UNIQUE (name);
    END IF;
  END IF;
END $$;

-- Add unique constraint on recipes (will fail silently if exists or duplicates present)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname IN ('recipes_name_key', 'recipes_name_unique')) THEN
    -- Check if duplicates exist
    IF NOT EXISTS (SELECT name FROM recipes GROUP BY name HAVING COUNT(*) > 1) THEN
      ALTER TABLE recipes ADD CONSTRAINT recipes_name_key UNIQUE (name);
    END IF;
  END IF;
END $$;

-- Add unique constraint on recipe_items (recipe_id, product_id)
-- First, remove duplicates if any exist
DELETE FROM recipe_items ri1
WHERE EXISTS (
  SELECT 1 FROM recipe_items ri2
  WHERE ri2.recipe_id = ri1.recipe_id
    AND ri2.product_id = ri1.product_id
    AND ri2.ctid < ri1.ctid
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recipe_items_recipe_product_unique') THEN
    ALTER TABLE recipe_items ADD CONSTRAINT recipe_items_recipe_product_unique UNIQUE (recipe_id, product_id);
  END IF;
END $$;
