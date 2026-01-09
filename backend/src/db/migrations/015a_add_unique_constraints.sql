-- Migration 015a: Add UNIQUE constraints to products and recipes
-- Date: 2026-01-09
-- Description: Must run BEFORE seed migrations (016, 017) to enable ON CONFLICT
-- Note: Using subqueries with ORDER BY instead of MIN() because UUID doesn't support MIN

-- Products: Delete duplicates if exist, add constraint if not exists
DELETE FROM shopping_list_items WHERE product_id IN (
  SELECT p.id FROM products p
  WHERE p.id != (SELECT p2.id FROM products p2 WHERE p2.name = p.name ORDER BY p2.created_at, p2.id LIMIT 1)
);

DELETE FROM user_excluded_products WHERE product_id IN (
  SELECT p.id FROM products p
  WHERE p.id != (SELECT p2.id FROM products p2 WHERE p2.name = p.name ORDER BY p2.created_at, p2.id LIMIT 1)
);

-- Update recipe_items to point to canonical (first) products
UPDATE recipe_items ri
SET product_id = (SELECT p2.id FROM products p2 WHERE p2.name = p.name ORDER BY p2.created_at, p2.id LIMIT 1)
FROM products p
WHERE ri.product_id = p.id
AND p.id != (SELECT p2.id FROM products p2 WHERE p2.name = p.name ORDER BY p2.created_at, p2.id LIMIT 1);

-- Delete duplicate products (keep first by created_at)
DELETE FROM products p
WHERE p.id != (SELECT p2.id FROM products p2 WHERE p2.name = p.name ORDER BY p2.created_at, p2.id LIMIT 1);

-- Add unique constraint on products
DO $$ BEGIN
  ALTER TABLE products ADD CONSTRAINT products_name_key UNIQUE (name);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Recipes: Delete duplicates if exist, add constraint if not exists
UPDATE meals m
SET recipe_id = (SELECT r2.id FROM recipes r2 WHERE r2.name = r.name ORDER BY r2.created_at, r2.id LIMIT 1)
FROM recipes r
WHERE m.recipe_id = r.id
AND r.id != (SELECT r2.id FROM recipes r2 WHERE r2.name = r.name ORDER BY r2.created_at, r2.id LIMIT 1);

DELETE FROM recipe_items WHERE recipe_id IN (
  SELECT r.id FROM recipes r
  WHERE r.id != (SELECT r2.id FROM recipes r2 WHERE r2.name = r.name ORDER BY r2.created_at, r2.id LIMIT 1)
);

DELETE FROM recipe_tags WHERE recipe_id IN (
  SELECT r.id FROM recipes r
  WHERE r.id != (SELECT r2.id FROM recipes r2 WHERE r2.name = r.name ORDER BY r2.created_at, r2.id LIMIT 1)
);

DELETE FROM recipes r
WHERE r.id != (SELECT r2.id FROM recipes r2 WHERE r2.name = r.name ORDER BY r2.created_at, r2.id LIMIT 1);

-- Add unique constraint on recipes
DO $$ BEGIN
  ALTER TABLE recipes ADD CONSTRAINT recipes_name_key UNIQUE (name);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
