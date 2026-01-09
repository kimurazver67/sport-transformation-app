-- Migration 015a: Add UNIQUE constraints to products and recipes
-- Date: 2026-01-09
-- Description: Must run BEFORE seed migrations (016, 017) to enable ON CONFLICT

-- Check if constraints already exist and skip if so
DO $$
DECLARE
  products_constraint_exists BOOLEAN;
  recipes_constraint_exists BOOLEAN;
BEGIN
  -- Check for existing products constraint
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname IN ('products_name_key', 'products_name_unique')
  ) INTO products_constraint_exists;

  -- Check for existing recipes constraint
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname IN ('recipes_name_key', 'recipes_name_unique')
  ) INTO recipes_constraint_exists;

  -- If both exist, skip migration
  IF products_constraint_exists AND recipes_constraint_exists THEN
    RAISE NOTICE 'UNIQUE constraints already exist, skipping migration 015a';
    RETURN;
  END IF;

  -- ===== PRODUCTS DEDUPLICATION =====
  IF NOT products_constraint_exists THEN
    -- Delete from shopping_list_items for duplicate products
    DELETE FROM shopping_list_items sli
    WHERE EXISTS (
      SELECT 1 FROM products p
      WHERE sli.product_id = p.id
      AND EXISTS (SELECT 1 FROM products p2 WHERE p2.name = p.name AND p2.id < p.id)
    );

    -- Delete from user_excluded_products for duplicate products
    DELETE FROM user_excluded_products uep
    WHERE EXISTS (
      SELECT 1 FROM products p
      WHERE uep.product_id = p.id
      AND EXISTS (SELECT 1 FROM products p2 WHERE p2.name = p.name AND p2.id < p.id)
    );

    -- Update recipe_items to point to canonical products
    UPDATE recipe_items ri
    SET product_id = (SELECT MIN(p2.id) FROM products p2 WHERE p2.name = p.name)
    FROM products p
    WHERE ri.product_id = p.id
    AND p.id != (SELECT MIN(p2.id) FROM products p2 WHERE p2.name = p.name);

    -- Delete duplicate products
    DELETE FROM products p
    WHERE EXISTS (
      SELECT 1 FROM products p2
      WHERE p2.name = p.name AND p2.id < p.id
    );

    -- Add constraint
    ALTER TABLE products ADD CONSTRAINT products_name_key UNIQUE (name);
    RAISE NOTICE 'Added UNIQUE constraint on products.name';
  END IF;

  -- ===== RECIPES DEDUPLICATION =====
  IF NOT recipes_constraint_exists THEN
    -- Update meals to point to canonical recipes
    UPDATE meals m
    SET recipe_id = (SELECT MIN(r2.id) FROM recipes r2 WHERE r2.name = r.name)
    FROM recipes r
    WHERE m.recipe_id = r.id
    AND r.id != (SELECT MIN(r2.id) FROM recipes r2 WHERE r2.name = r.name);

    -- Delete recipe_items for duplicate recipes
    DELETE FROM recipe_items ri
    WHERE EXISTS (
      SELECT 1 FROM recipes r
      WHERE ri.recipe_id = r.id
      AND EXISTS (SELECT 1 FROM recipes r2 WHERE r2.name = r.name AND r2.id < r.id)
    );

    -- Delete recipe_tags for duplicate recipes
    DELETE FROM recipe_tags rt
    WHERE EXISTS (
      SELECT 1 FROM recipes r
      WHERE rt.recipe_id = r.id
      AND EXISTS (SELECT 1 FROM recipes r2 WHERE r2.name = r.name AND r2.id < r.id)
    );

    -- Delete duplicate recipes
    DELETE FROM recipes r
    WHERE EXISTS (
      SELECT 1 FROM recipes r2
      WHERE r2.name = r.name AND r2.id < r.id
    );

    -- Add constraint
    ALTER TABLE recipes ADD CONSTRAINT recipes_name_key UNIQUE (name);
    RAISE NOTICE 'Added UNIQUE constraint on recipes.name';
  END IF;

END $$;
