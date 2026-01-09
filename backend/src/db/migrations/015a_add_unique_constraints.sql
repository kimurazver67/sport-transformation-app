-- Migration 015a: Add UNIQUE constraints to products and recipes
-- Date: 2026-01-09
-- Description: Must run BEFORE seed migrations (016, 017) to enable ON CONFLICT

-- Simple idempotent approach: try to add constraints, ignore if exists

-- Products: Delete duplicates if exist, add constraint if not exists
DELETE FROM shopping_list_items WHERE product_id IN (
  SELECT p.id FROM products p
  WHERE EXISTS (SELECT 1 FROM products p2 WHERE p2.name = p.name AND p2.id < p.id)
);

DELETE FROM user_excluded_products WHERE product_id IN (
  SELECT p.id FROM products p
  WHERE EXISTS (SELECT 1 FROM products p2 WHERE p2.name = p.name AND p2.id < p.id)
);

UPDATE recipe_items ri
SET product_id = canonical.min_id
FROM (SELECT name, MIN(id) as min_id FROM products GROUP BY name) canonical
JOIN products p ON p.name = canonical.name AND p.id != canonical.min_id
WHERE ri.product_id = p.id;

DELETE FROM products p
WHERE EXISTS (SELECT 1 FROM products p2 WHERE p2.name = p.name AND p2.id < p.id);

DO $$ BEGIN
  ALTER TABLE products ADD CONSTRAINT products_name_key UNIQUE (name);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- Recipes: Delete duplicates if exist, add constraint if not exists
UPDATE meals m
SET recipe_id = canonical.min_id
FROM (SELECT name, MIN(id) as min_id FROM recipes GROUP BY name) canonical
JOIN recipes r ON r.name = canonical.name AND r.id != canonical.min_id
WHERE m.recipe_id = r.id;

DELETE FROM recipe_items WHERE recipe_id IN (
  SELECT r.id FROM recipes r
  WHERE EXISTS (SELECT 1 FROM recipes r2 WHERE r2.name = r.name AND r2.id < r.id)
);

DELETE FROM recipe_tags WHERE recipe_id IN (
  SELECT r.id FROM recipes r
  WHERE EXISTS (SELECT 1 FROM recipes r2 WHERE r2.name = r.name AND r2.id < r.id)
);

DELETE FROM recipes r
WHERE EXISTS (SELECT 1 FROM recipes r2 WHERE r2.name = r.name AND r2.id < r.id);

DO $$ BEGIN
  ALTER TABLE recipes ADD CONSTRAINT recipes_name_key UNIQUE (name);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
