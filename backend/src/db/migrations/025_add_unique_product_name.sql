-- Migration 025: Add unique constraint on products.name
-- Date: 2026-01-09
-- Description: Remove duplicate products/recipes and add unique constraints

-- Step 1: Update recipe_items to point to canonical products (lowest id for each name)
UPDATE recipe_items ri
SET product_id = canonical.min_id
FROM (
  SELECT name, MIN(id) as min_id FROM products GROUP BY name
) canonical
JOIN products p ON p.name = canonical.name AND p.id != canonical.min_id
WHERE ri.product_id = p.id;

-- Step 2: Delete duplicate products (keep lowest id for each name)
DELETE FROM products p
WHERE EXISTS (
  SELECT 1 FROM products p2
  WHERE p2.name = p.name AND p2.id < p.id
);

-- Step 3: Update meals to point to canonical recipes
UPDATE meals m
SET recipe_id = canonical.min_id
FROM (
  SELECT name, MIN(id) as min_id FROM recipes GROUP BY name
) canonical
JOIN recipes r ON r.name = canonical.name AND r.id != canonical.min_id
WHERE m.recipe_id = r.id;

-- Step 4: Delete recipe_items for duplicate recipes
DELETE FROM recipe_items ri
WHERE EXISTS (
  SELECT 1 FROM recipes r
  JOIN (SELECT name, MIN(id) as min_id FROM recipes GROUP BY name) canonical
  ON r.name = canonical.name AND r.id != canonical.min_id
  WHERE ri.recipe_id = r.id
);

-- Step 5: Delete duplicate recipes
DELETE FROM recipes r
WHERE EXISTS (
  SELECT 1 FROM recipes r2
  WHERE r2.name = r.name AND r2.id < r.id
);

-- Step 6: Remove duplicate recipe_items (same recipe_id + product_id)
DELETE FROM recipe_items ri1
WHERE EXISTS (
  SELECT 1 FROM recipe_items ri2
  WHERE ri2.recipe_id = ri1.recipe_id
    AND ri2.product_id = ri1.product_id
    AND ri2.ctid < ri1.ctid
);

-- Step 7: Add unique constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_name_unique') THEN
    ALTER TABLE products ADD CONSTRAINT products_name_unique UNIQUE (name);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recipes_name_unique') THEN
    ALTER TABLE recipes ADD CONSTRAINT recipes_name_unique UNIQUE (name);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recipe_items_recipe_product_unique') THEN
    ALTER TABLE recipe_items ADD CONSTRAINT recipe_items_recipe_product_unique UNIQUE (recipe_id, product_id);
  END IF;
END $$;
