-- Migration 025: Add unique constraint on products.name
-- Date: 2026-01-09
-- Description: Remove duplicate products/recipes and add unique constraints

-- Step 1: Remove duplicate products (keep the one with lowest id)
-- First, update recipe_items to point to canonical product
WITH duplicates AS (
  SELECT name, MIN(id) as keep_id
  FROM products
  GROUP BY name
  HAVING COUNT(*) > 1
),
mapping AS (
  SELECT p.id as old_id, d.keep_id as new_id
  FROM products p
  JOIN duplicates d ON p.name = d.name
  WHERE p.id != d.keep_id
)
UPDATE recipe_items ri
SET product_id = m.new_id
FROM mapping m
WHERE ri.product_id = m.old_id;

-- Delete duplicate products
DELETE FROM products
WHERE id NOT IN (
  SELECT MIN(id) FROM products GROUP BY name
);

-- Step 2: Remove duplicate recipes (keep the one with lowest id)
-- First, update meals to point to canonical recipe
WITH duplicates AS (
  SELECT name, MIN(id) as keep_id
  FROM recipes
  GROUP BY name
  HAVING COUNT(*) > 1
),
mapping AS (
  SELECT r.id as old_id, d.keep_id as new_id
  FROM recipes r
  JOIN duplicates d ON r.name = d.name
  WHERE r.id != d.keep_id
)
UPDATE meals m
SET recipe_id = mapping.new_id
FROM mapping
WHERE m.recipe_id = mapping.old_id;

-- Delete duplicate recipe_items for recipes that will be deleted
DELETE FROM recipe_items
WHERE recipe_id NOT IN (
  SELECT MIN(id) FROM recipes GROUP BY name
);

-- Delete duplicate recipes
DELETE FROM recipes
WHERE id NOT IN (
  SELECT MIN(id) FROM recipes GROUP BY name
);

-- Step 3: Also remove duplicate recipe_items (same recipe_id + product_id)
DELETE FROM recipe_items ri1
USING recipe_items ri2
WHERE ri1.ctid > ri2.ctid
  AND ri1.recipe_id = ri2.recipe_id
  AND ri1.product_id = ri2.product_id;

-- Step 4: Add unique constraint on product name
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_name_unique'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_name_unique UNIQUE (name);
  END IF;
END $$;

-- Step 5: Add unique constraint on recipes.name
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recipes_name_unique'
  ) THEN
    ALTER TABLE recipes ADD CONSTRAINT recipes_name_unique UNIQUE (name);
  END IF;
END $$;

-- Step 6: Add unique constraint on recipe_items (recipe_id + product_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recipe_items_recipe_product_unique'
  ) THEN
    ALTER TABLE recipe_items ADD CONSTRAINT recipe_items_recipe_product_unique UNIQUE (recipe_id, product_id);
  END IF;
END $$;
