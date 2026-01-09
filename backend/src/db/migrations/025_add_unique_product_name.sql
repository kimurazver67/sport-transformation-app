-- Migration 025: Final cleanup and additional constraints
-- Date: 2026-01-09
-- Description: Originally handled deduplication, but now a no-op
-- Note: Deduplication and constraint creation moved to earlier migrations (015a)

-- This migration is now a no-op since:
-- 1. 015a adds all UNIQUE constraints (products.name, recipes.name, recipe_items(recipe_id, product_id))
-- 2. 015a handles deduplication before adding constraints
-- 3. All seed migrations (016-021) use ON CONFLICT for idempotency

-- Keeping this file for migration history compatibility
SELECT 1;
