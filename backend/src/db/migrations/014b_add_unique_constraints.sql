-- Migration 014b: Add UNIQUE constraints to products and recipes
-- Date: 2026-01-09
-- Description: Must run BEFORE seed migrations (016, 017) to enable ON CONFLICT

-- Step 1: Remove duplicate products BEFORE adding constraint
DELETE FROM products p
WHERE EXISTS (
  SELECT 1 FROM products p2
  WHERE p2.name = p.name AND p2.id < p.id
);

-- Step 2: Add unique constraint on products.name (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_name_key'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_name_unique'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_name_key UNIQUE (name);
  END IF;
END $$;

-- Step 3: Remove duplicate recipes BEFORE adding constraint
DELETE FROM recipes r
WHERE EXISTS (
  SELECT 1 FROM recipes r2
  WHERE r2.name = r.name AND r2.id < r.id
);

-- Step 4: Add unique constraint on recipes.name (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recipes_name_key'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recipes_name_unique'
  ) THEN
    ALTER TABLE recipes ADD CONSTRAINT recipes_name_key UNIQUE (name);
  END IF;
END $$;
