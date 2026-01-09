-- Migration 015a: Add UNIQUE constraints to products and recipes
-- Date: 2026-01-09
-- Description: Must run BEFORE seed migrations (016, 017) to enable ON CONFLICT

-- Step 1: Update recipe_items to point to canonical products (lowest id for each name)
UPDATE recipe_items ri
SET product_id = canonical.min_id
FROM (
  SELECT name, MIN(id) as min_id FROM products GROUP BY name
) canonical
JOIN products p ON p.name = canonical.name AND p.id != canonical.min_id
WHERE ri.product_id = p.id;

-- Step 2: Remove duplicate products BEFORE adding constraint
DELETE FROM products p
WHERE EXISTS (
  SELECT 1 FROM products p2
  WHERE p2.name = p.name AND p2.id < p.id
);

-- Step 3: Add unique constraint on products.name (if not exists)
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

-- Step 4: Update meals to point to canonical recipes (lowest id for each name)
UPDATE meals m
SET recipe_id = canonical.min_id
FROM (
  SELECT name, MIN(id) as min_id FROM recipes GROUP BY name
) canonical
JOIN recipes r ON r.name = canonical.name AND r.id != canonical.min_id
WHERE m.recipe_id = r.id;

-- Step 5: Delete recipe_items for recipes that will be deleted
DELETE FROM recipe_items ri
WHERE EXISTS (
  SELECT 1 FROM recipes r
  WHERE ri.recipe_id = r.id
  AND EXISTS (SELECT 1 FROM recipes r2 WHERE r2.name = r.name AND r2.id < r.id)
);

-- Step 6: Remove duplicate recipes BEFORE adding constraint
DELETE FROM recipes r
WHERE EXISTS (
  SELECT 1 FROM recipes r2
  WHERE r2.name = r.name AND r2.id < r.id
);

-- Step 7: Add unique constraint on recipes.name (if not exists)
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
