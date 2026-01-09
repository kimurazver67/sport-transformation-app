-- Migration 025: Add unique constraint on products.name
-- Date: 2026-01-09
-- Description: Remove duplicate products/recipes and add unique constraints

-- Step 1: Create temp table with product id mapping (old_id -> new_id)
CREATE TEMP TABLE IF NOT EXISTS product_mapping AS
SELECT p.id as old_id, (
  SELECT MIN(p2.id) FROM products p2 WHERE p2.name = p.name
) as new_id
FROM products p
WHERE p.id != (SELECT MIN(p2.id) FROM products p2 WHERE p2.name = p.name);

-- Step 2: Update recipe_items to point to canonical products
UPDATE recipe_items ri
SET product_id = pm.new_id
FROM product_mapping pm
WHERE ri.product_id = pm.old_id;

-- Step 3: Delete duplicate products
DELETE FROM products
WHERE id IN (SELECT old_id FROM product_mapping);

-- Step 4: Drop temp table
DROP TABLE IF EXISTS product_mapping;

-- Step 5: Create temp table for recipe mapping
CREATE TEMP TABLE IF NOT EXISTS recipe_mapping AS
SELECT r.id as old_id, (
  SELECT MIN(r2.id) FROM recipes r2 WHERE r2.name = r.name
) as new_id
FROM recipes r
WHERE r.id != (SELECT MIN(r2.id) FROM recipes r2 WHERE r2.name = r.name);

-- Step 6: Update meals to point to canonical recipes
UPDATE meals m
SET recipe_id = rm.new_id
FROM recipe_mapping rm
WHERE m.recipe_id = rm.old_id;

-- Step 7: Delete recipe_items for recipes that will be deleted
DELETE FROM recipe_items
WHERE recipe_id IN (SELECT old_id FROM recipe_mapping);

-- Step 8: Delete duplicate recipes
DELETE FROM recipes
WHERE id IN (SELECT old_id FROM recipe_mapping);

-- Step 9: Drop temp table
DROP TABLE IF EXISTS recipe_mapping;

-- Step 10: Remove duplicate recipe_items (same recipe_id + product_id)
DELETE FROM recipe_items ri1
USING recipe_items ri2
WHERE ri1.ctid > ri2.ctid
  AND ri1.recipe_id = ri2.recipe_id
  AND ri1.product_id = ri2.product_id;

-- Step 11: Add unique constraint on product name
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_name_unique'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_name_unique UNIQUE (name);
  END IF;
END $$;

-- Step 12: Add unique constraint on recipes.name
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recipes_name_unique'
  ) THEN
    ALTER TABLE recipes ADD CONSTRAINT recipes_name_unique UNIQUE (name);
  END IF;
END $$;

-- Step 13: Add unique constraint on recipe_items (recipe_id + product_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recipe_items_recipe_product_unique'
  ) THEN
    ALTER TABLE recipe_items ADD CONSTRAINT recipe_items_recipe_product_unique UNIQUE (recipe_id, product_id);
  END IF;
END $$;
