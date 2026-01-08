// backend/src/routes/nutrition.ts

import { Router, Request, Response } from 'express';
import { NutritionDataService } from '../services/nutritionDataService';
import { MealPlanGenerator } from '../services/mealPlanGenerator';
import { pool } from '../db/postgres';

const router = Router();

// Инициализируем сервис (теперь без внешних зависимостей - OpenFoodFacts бесплатный)
const nutritionService = new NutritionDataService();
console.log('[Nutrition API] OpenFoodFacts integration enabled');

/**
 * GET /api/nutrition/products/search
 * Поиск продуктов (локальная БД + OpenFoodFacts API)
 */
router.get('/products/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const source = (req.query.source as 'local' | 'openfoodfacts' | 'all') || 'all';
    const limit = parseInt(req.query.limit as string) || 20;

    if (!query || query.length < 2) {
      return res.status(400).json({
        error: 'Query must be at least 2 characters long'
      });
    }

    const result = await nutritionService.searchProducts(query, source, limit);
    return res.json({
      products: result.products,
      total: result.products.length,
      cached: result.cached
    });
  } catch (error) {
    console.error('[Nutrition API] Search error:', error);
    res.status(500).json({
      error: 'Failed to search products'
    });
  }
});

/**
 * POST /api/nutrition/products/import
 * Импортировать продукт из OpenFoodFacts в локальную БД
 */
router.post('/products/import', async (req: Request, res: Response) => {
  try {
    const { openfoodfacts_code, user_id } = req.body;

    if (!openfoodfacts_code) {
      return res.status(400).json({
        error: 'openfoodfacts_code is required'
      });
    }

    const result = await nutritionService.importProduct(openfoodfacts_code, user_id);

    res.json({
      product_id: result.product_id,
      imported: !result.already_exists,
      already_exists: result.already_exists
    });
  } catch (error) {
    console.error('[Nutrition API] Import error:', error);
    res.status(500).json({
      error: 'Failed to import product'
    });
  }
});

/**
 * GET /api/nutrition/tags
 * Получить все теги (аллергены, диеты, предпочтения) - работает без FatSecret
 */
router.get('/tags', async (req: Request, res: Response) => {
  try {
    // Загружаем теги напрямую из БД
    const result = await pool.query(`
      SELECT id, name, name_ru, type, description
      FROM tags
      ORDER BY type, name
    `);

    res.json({
      tags: result.rows
    });
  } catch (error) {
    console.error('[Nutrition API] Get tags error:', error);
    res.status(500).json({
      error: 'Failed to get tags'
    });
  }
});

/**
 * GET /api/nutrition/exclusions/:userId
 * Получить исключения пользователя - работает без FatSecret
 */
router.get('/exclusions/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Загружаем исключённые продукты
    const productsResult = await pool.query(`
      SELECT p.*
      FROM user_excluded_products uep
      JOIN products p ON uep.product_id = p.id
      WHERE uep.user_id = $1
    `, [userId]);

    // Загружаем исключённые теги
    const tagsResult = await pool.query(`
      SELECT t.*
      FROM user_excluded_tags uet
      JOIN tags t ON uet.tag_id = t.id
      WHERE uet.user_id = $1
    `, [userId]);

    res.json({
      products: productsResult.rows,
      tags: tagsResult.rows
    });
  } catch (error) {
    console.error('[Nutrition API] Get exclusions error:', error);
    res.status(500).json({
      error: 'Failed to get exclusions'
    });
  }
});

/**
 * POST /api/nutrition/exclusions/:userId/products
 * Добавить продукт в исключения - работает без FatSecret
 */
router.post('/exclusions/:userId/products', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({
        error: 'product_id is required'
      });
    }

    await pool.query(`
      INSERT INTO user_excluded_products (user_id, product_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, product_id) DO NOTHING
    `, [userId, product_id]);

    res.json({
      success: true
    });
  } catch (error) {
    console.error('[Nutrition API] Add product exclusion error:', error);
    res.status(500).json({
      error: 'Failed to add product exclusion'
    });
  }
});

/**
 * POST /api/nutrition/exclusions/:userId/tags
 * Добавить тег в исключения - работает без FatSecret
 */
router.post('/exclusions/:userId/tags', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { tag_id } = req.body;

    if (!tag_id) {
      return res.status(400).json({
        error: 'tag_id is required'
      });
    }

    await pool.query(`
      INSERT INTO user_excluded_tags (user_id, tag_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, tag_id) DO NOTHING
    `, [userId, tag_id]);

    res.json({
      success: true
    });
  } catch (error) {
    console.error('[Nutrition API] Add tag exclusion error:', error);
    res.status(500).json({
      error: 'Failed to add tag exclusion'
    });
  }
});

/**
 * DELETE /api/nutrition/exclusions/:userId/products/:productId
 * Удалить продукт из исключений - работает без FatSecret
 */
router.delete('/exclusions/:userId/products/:productId', async (req: Request, res: Response) => {
  try {
    const { userId, productId } = req.params;

    await pool.query(`
      DELETE FROM user_excluded_products
      WHERE user_id = $1 AND product_id = $2
    `, [userId, productId]);

    res.json({
      success: true
    });
  } catch (error) {
    console.error('[Nutrition API] Remove product exclusion error:', error);
    res.status(500).json({
      error: 'Failed to remove product exclusion'
    });
  }
});

/**
 * DELETE /api/nutrition/exclusions/:userId/tags/:tagId
 * Удалить тег из исключений - работает без FatSecret
 */
router.delete('/exclusions/:userId/tags/:tagId', async (req: Request, res: Response) => {
  try {
    const { userId, tagId } = req.params;

    await pool.query(`
      DELETE FROM user_excluded_tags
      WHERE user_id = $1 AND tag_id = $2
    `, [userId, tagId]);

    res.json({
      success: true
    });
  } catch (error) {
    console.error('[Nutrition API] Remove tag exclusion error:', error);
    res.status(500).json({
      error: 'Failed to remove tag exclusion'
    });
  }
});

/**
 * GET /api/nutrition/meal-plans/user/:userId
 * Получить активный план питания пользователя
 */
router.get('/meal-plans/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Получаем активный план пользователя
    const planResult = await pool.query(
      `SELECT * FROM meal_plans
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (planResult.rows.length === 0) {
      return res.json({
        plan: null,
        days: []
      });
    }

    const plan = planResult.rows[0];

    // Получаем все дни с приёмами пищи
    const daysResult = await pool.query(`
      SELECT
        md.*,
        json_agg(
          json_build_object(
            'id', m.id,
            'meal_type', m.meal_type,
            'portion_multiplier', m.portion_multiplier,
            'portion_grams', ROUND((
              SELECT COALESCE(SUM(ri.amount_grams), 0)
              FROM recipe_items ri
              WHERE ri.recipe_id = r.id
            ) * m.portion_multiplier),
            'calories', m.calories,
            'protein', m.protein,
            'fat', m.fat,
            'carbs', m.carbs,
            'recipe', json_build_object(
              'id', r.id,
              'name', r.name,
              'name_short', r.name_short,
              'cooking_time', r.cooking_time,
              'complexity', r.complexity,
              'instructions', r.instructions,
              'ingredients', (
                SELECT json_agg(
                  json_build_object(
                    'product_name', product_name,
                    'amount_grams', total_grams,
                    'is_optional', is_optional
                  )
                  ORDER BY is_optional, product_name
                )
                FROM (
                  SELECT
                    p.name as product_name,
                    ROUND(SUM(ri.amount_grams * m.portion_multiplier)) as total_grams,
                    bool_or(ri.is_optional) as is_optional
                  FROM recipe_items ri
                  JOIN products p ON ri.product_id = p.id
                  WHERE ri.recipe_id = r.id
                  GROUP BY p.name
                ) grouped_ingredients
              )
            )
          )
          ORDER BY
            CASE m.meal_type
              WHEN 'breakfast' THEN 1
              WHEN 'lunch' THEN 2
              WHEN 'dinner' THEN 3
              WHEN 'snack' THEN 4
            END
        ) as meals
      FROM meal_days md
      JOIN meals m ON md.id = m.meal_day_id
      JOIN recipes r ON m.recipe_id = r.id
      WHERE md.meal_plan_id = $1
      GROUP BY md.id
      ORDER BY md.week_number, md.day_number
    `, [plan.id]);

    res.json({
      plan,
      days: daysResult.rows
    });
  } catch (error) {
    console.error('[Nutrition API] Get user meal plan error:', error);
    res.status(500).json({
      error: 'Failed to get meal plan'
    });
  }
});

/**
 * POST /api/nutrition/meal-plans/generate
 * Генерация плана питания (не требует FatSecret)
 */
router.post('/meal-plans/generate', async (req: Request, res: Response) => {
  try {
    const { user_id, weeks, allow_repeat_days, prefer_simple, use_inventory } = req.body;

    if (!user_id) {
      return res.status(400).json({
        error: 'user_id is required'
      });
    }

    if (!weeks || weeks < 1 || weeks > 4) {
      return res.status(400).json({
        error: 'weeks must be between 1 and 4'
      });
    }

    const generator = new MealPlanGenerator(pool);

    const mealPlanId = await generator.generate({
      userId: user_id,
      weeks: weeks || 4,
      allowRepeatDays: allow_repeat_days ?? 3,
      preferSimple: prefer_simple ?? true,
      useInventory: use_inventory ?? false,  // Использовать продукты из инвентаря
    });

    res.json({
      meal_plan_id: mealPlanId,
      success: true
    });
  } catch (error) {
    console.error('[Nutrition API] Generate meal plan error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate meal plan'
    });
  }
});

/**
 * GET /api/nutrition/meal-plans/:mealPlanId
 * Получить план питания со всеми днями и приёмами пищи (не требует FatSecret)
 */
router.get('/meal-plans/:mealPlanId', async (req: Request, res: Response) => {
  try {
    const { mealPlanId } = req.params;

    // Получаем план питания
    const planResult = await pool.query(
      'SELECT * FROM meal_plans WHERE id = $1',
      [mealPlanId]
    );

    if (planResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Meal plan not found'
      });
    }

    const plan = planResult.rows[0];

    // Получаем все дни с приёмами пищи
    const daysResult = await pool.query(`
      SELECT
        md.*,
        json_agg(
          json_build_object(
            'id', m.id,
            'meal_type', m.meal_type,
            'portion_multiplier', m.portion_multiplier,
            'calories', m.calories,
            'protein', m.protein,
            'fat', m.fat,
            'carbs', m.carbs,
            'recipe', json_build_object(
              'id', r.id,
              'name', r.name,
              'name_short', r.name_short,
              'cooking_time', r.cooking_time,
              'complexity', r.complexity,
              'items', (
                SELECT json_agg(
                  json_build_object(
                    'product_id', ri.product_id,
                    'amount_grams', ri.amount_grams,
                    'is_optional', ri.is_optional,
                    'product', json_build_object(
                      'id', p.id,
                      'name', p.name,
                      'calories', p.calories,
                      'protein', p.protein,
                      'fat', p.fat,
                      'carbs', p.carbs,
                      'cooking_ratio', p.cooking_ratio,
                      'unit', p.unit
                    )
                  )
                )
                FROM recipe_items ri
                JOIN products p ON ri.product_id = p.id
                WHERE ri.recipe_id = r.id
              )
            )
          )
          ORDER BY
            CASE m.meal_type
              WHEN 'breakfast' THEN 1
              WHEN 'lunch' THEN 2
              WHEN 'dinner' THEN 3
              WHEN 'snack' THEN 4
            END
        ) as meals
      FROM meal_days md
      JOIN meals m ON md.id = m.meal_day_id
      JOIN recipes r ON m.recipe_id = r.id
      WHERE md.meal_plan_id = $1
      GROUP BY md.id
      ORDER BY md.week_number, md.day_number
    `, [mealPlanId]);

    res.json({
      plan,
      days: daysResult.rows
    });
  } catch (error) {
    console.error('[Nutrition API] Get meal plan error:', error);
    res.status(500).json({
      error: 'Failed to get meal plan'
    });
  }
});

/**
 * GET /api/nutrition/meal-plans/:mealPlanId/shopping-list
 * Получить список покупок для плана питания (не требует FatSecret)
 */
router.get('/meal-plans/:mealPlanId/shopping-list', async (req: Request, res: Response) => {
  try {
    const { mealPlanId } = req.params;

    const result = await pool.query(`
      SELECT
        sl.*,
        json_build_object(
          'id', p.id,
          'name', p.name,
          'category', p.category,
          'unit', p.unit,
          'unit_weight', p.unit_weight,
          'price_per_kg', p.price_per_kg
        ) as product
      FROM shopping_list_items sl
      JOIN products p ON sl.product_id = p.id
      WHERE sl.meal_plan_id = $1
      ORDER BY p.category, p.name
    `, [mealPlanId]);

    // Группируем по месячным и недельным
    const monthly = result.rows.filter((r: any) => r.is_monthly);
    const weekly = result.rows.filter((r: any) => !r.is_monthly);

    // Группируем недельные по неделям
    const weeklyByWeek: Record<number, typeof weekly> = {};
    for (const item of weekly) {
      for (const weekNum of item.week_numbers) {
        if (!weeklyByWeek[weekNum]) {
          weeklyByWeek[weekNum] = [];
        }
        weeklyByWeek[weekNum].push(item);
      }
    }

    res.json({
      monthly,
      weekly: weeklyByWeek
    });
  } catch (error) {
    console.error('[Nutrition API] Get shopping list error:', error);
    res.status(500).json({
      error: 'Failed to get shopping list'
    });
  }
});

/**
 * POST /api/nutrition/run-migrations
 * Запустить критические миграции (только schema и tags)
 * Этот эндпоинт временный, для первоначальной настройки БД
 */
router.post('/run-migrations', async (req: Request, res: Response) => {
  try {
    const results: string[] = [];

    // Миграция 014: Schema (создание таблиц)
    const fs = await import('fs');
    const path = await import('path');

    const migrationsDir = path.join(__dirname, '../db/migrations');

    // Проверяем есть ли уже таблица tags
    const tagsExist = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'tags'
      )
    `);

    if (tagsExist.rows[0].exists) {
      results.push('Таблицы уже существуют, пропускаем 014_nutrition_schema.sql');
    } else {
      // Запускаем schema миграцию
      const schemaFile = path.join(migrationsDir, '014_nutrition_schema.sql');
      if (fs.existsSync(schemaFile)) {
        const schemaSql = fs.readFileSync(schemaFile, 'utf8');
        await pool.query(schemaSql);
        results.push('014_nutrition_schema.sql выполнена');
      } else {
        results.push('014_nutrition_schema.sql не найдена');
      }
    }

    // Миграция 015: Seed tags
    const tagsCount = await pool.query('SELECT COUNT(*) FROM tags');
    if (parseInt(tagsCount.rows[0].count) > 0) {
      results.push('Tags уже заполнены, пропускаем 015_seed_tags.sql');
    } else {
      const tagsFile = path.join(migrationsDir, '015_seed_tags.sql');
      if (fs.existsSync(tagsFile)) {
        const tagsSql = fs.readFileSync(tagsFile, 'utf8');
        await pool.query(tagsSql);
        results.push('015_seed_tags.sql выполнена');
      } else {
        results.push('015_seed_tags.sql не найдена');
      }
    }

    // Миграция 016: Seed products (базовые продукты)
    const productsCount = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(productsCount.rows[0].count) > 0) {
      results.push('Products уже заполнены, пропускаем 016_seed_products.sql');
    } else {
      const productsFile = path.join(migrationsDir, '016_seed_products.sql');
      if (fs.existsSync(productsFile)) {
        const productsSql = fs.readFileSync(productsFile, 'utf8');
        await pool.query(productsSql);
        results.push('016_seed_products.sql выполнена');
      } else {
        results.push('016_seed_products.sql не найдена');
      }
    }

    // Миграция 018: Expand products (дополнительные продукты для рецептов)
    // Проверяем наличие специфичного продукта из 018
    const expandProductsCheck = await pool.query("SELECT EXISTS(SELECT 1 FROM products WHERE name = 'Ячневая крупа')");
    if (expandProductsCheck.rows[0].exists) {
      results.push('Расширенные продукты уже есть, пропускаем 018_expand_products.sql');
    } else {
      const expandProductsFile = path.join(migrationsDir, '018_expand_products.sql');
      if (fs.existsSync(expandProductsFile)) {
        const expandProductsSql = fs.readFileSync(expandProductsFile, 'utf8');
        await pool.query(expandProductsSql);
        results.push('018_expand_products.sql выполнена');
      } else {
        results.push('018_expand_products.sql не найдена');
      }
    }

    // Миграция 019: Final products (финальные продукты)
    const finalProductsCheck = await pool.query("SELECT EXISTS(SELECT 1 FROM products WHERE name = 'Кедровый орех')");
    if (finalProductsCheck.rows[0].exists) {
      results.push('Финальные продукты уже есть, пропускаем 019_final_products.sql');
    } else {
      const finalProductsFile = path.join(migrationsDir, '019_final_products.sql');
      if (fs.existsSync(finalProductsFile)) {
        const finalProductsSql = fs.readFileSync(finalProductsFile, 'utf8');
        await pool.query(finalProductsSql);
        results.push('019_final_products.sql выполнена');
      } else {
        results.push('019_final_products.sql не найдена');
      }
    }

    // Миграция 021: Replace recipes
    const replaceRecipesFile = path.join(migrationsDir, '021_replace_recipes.sql');
    if (fs.existsSync(replaceRecipesFile)) {
      const replaceRecipesSql = fs.readFileSync(replaceRecipesFile, 'utf8');
      await pool.query(replaceRecipesSql);
      results.push('021_replace_recipes.sql выполнена - заменены рецепты на 60 полноценных блюд');
    } else {
      results.push('021_replace_recipes.sql не найдена');
    }

    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('[Nutrition API] Run migrations error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Migration failed'
    });
  }
});

/**
 * GET /api/nutrition/debug/user-targets/:userId
 * Проверка целевых КБЖУ пользователя vs фактических в плане
 */
router.get('/debug/user-targets/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Получаем данные пользователя
    const userResult = await pool.query(
      'SELECT id, goal, start_weight FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Рассчитываем целевые КБЖУ
    const { calculateNutrition } = await import('../services/nutritionService');
    const targets = calculateNutrition(user.start_weight, user.goal);

    // Получаем последний план питания
    const planResult = await pool.query(`
      SELECT
        mp.id,
        mp.target_calories, mp.target_protein, mp.target_fat, mp.target_carbs,
        mp.avg_calories, mp.avg_protein, mp.avg_fat, mp.avg_carbs
      FROM meal_plans mp
      WHERE mp.user_id = $1 AND mp.status = 'active'
      ORDER BY mp.created_at DESC
      LIMIT 1
    `, [userId]);

    // Получаем первый день плана
    let firstDay = null;
    if (planResult.rows.length > 0) {
      const dayResult = await pool.query(`
        SELECT
          md.total_calories, md.total_protein, md.total_fat, md.total_carbs,
          json_agg(
            json_build_object(
              'meal_type', m.meal_type,
              'recipe_name', r.name,
              'portion', m.portion_multiplier,
              'calories', m.calories,
              'protein', m.protein
            )
          ) as meals
        FROM meal_days md
        JOIN meals m ON md.id = m.meal_day_id
        JOIN recipes r ON m.recipe_id = r.id
        WHERE md.meal_plan_id = $1 AND md.day_number = 1 AND md.week_number = 1
        GROUP BY md.id
      `, [planResult.rows[0].id]);
      firstDay = dayResult.rows[0] || null;
    }

    res.json({
      user: {
        id: user.id,
        goal: user.goal,
        weight: user.start_weight,
      },
      calculated_targets: targets,
      plan_targets: planResult.rows[0] || null,
      first_day: firstDay,
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Failed', details: error instanceof Error ? error.message : 'Unknown' });
  }
});

/**
 * GET /api/nutrition/debug/portions
 * Временный эндпоинт для проверки portion_multiplier в БД
 */
router.get('/debug/portions', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        m.meal_type,
        r.name as recipe_name,
        m.portion_multiplier,
        m.calories,
        m.protein
      FROM meals m
      JOIN recipes r ON m.recipe_id = r.id
      ORDER BY m.created_at DESC
      LIMIT 20
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get portions' });
  }
});

/**
 * POST /api/nutrition/debug/fix-duplicates
 * ПОЛНОСТЬЮ пересоздаёт все данные: products, recipes, recipe_items
 */
router.post('/debug/fix-duplicates', async (req: Request, res: Response) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const migrationsDir = path.join(__dirname, '../db/migrations');

    // 1. Очищаем ВСЁ в правильном порядке (учитываем FK)
    await pool.query('DELETE FROM shopping_list_items');
    await pool.query('DELETE FROM meals');
    await pool.query('DELETE FROM meal_days');
    await pool.query('DELETE FROM meal_plans');
    await pool.query('DELETE FROM recipe_items');
    await pool.query('DELETE FROM recipe_tags');
    await pool.query('DELETE FROM recipes');
    await pool.query('DELETE FROM product_tags');
    await pool.query('DELETE FROM user_excluded_products');
    await pool.query('DELETE FROM products');

    const results: string[] = [];

    // 2. Запускаем миграцию 016 (базовые продукты)
    const file016 = path.join(migrationsDir, '016_seed_products.sql');
    if (fs.existsSync(file016)) {
      await pool.query(fs.readFileSync(file016, 'utf8'));
      results.push('016_seed_products.sql OK');
    }

    // 3. Запускаем миграцию 018 (расширенные продукты)
    const file018 = path.join(migrationsDir, '018_expand_products.sql');
    if (fs.existsSync(file018)) {
      await pool.query(fs.readFileSync(file018, 'utf8'));
      results.push('018_expand_products.sql OK');
    }

    // 4. Запускаем миграцию 019 (финальные продукты)
    const file019 = path.join(migrationsDir, '019_final_products.sql');
    if (fs.existsSync(file019)) {
      await pool.query(fs.readFileSync(file019, 'utf8'));
      results.push('019_final_products.sql OK');
    }

    // 4.5 ДЕДУПЛИКАЦИЯ ПРОДУКТОВ - удаляем дубликаты, оставляя только один продукт с каждым именем
    const dedupeResult = await pool.query(`
      DELETE FROM products a
      USING products b
      WHERE a.id > b.id AND a.name = b.name
    `);
    results.push(`Deduplicated products: removed ${dedupeResult.rowCount} duplicates`);

    // Проверяем что дубликатов нет
    const checkDupes = await pool.query(`
      SELECT name, COUNT(*) as cnt FROM products GROUP BY name HAVING COUNT(*) > 1
    `);
    if (checkDupes.rows.length > 0) {
      results.push(`WARNING: Still have ${checkDupes.rows.length} duplicate product names`);
    } else {
      results.push('All products are unique');
    }

    // 5. Запускаем миграцию 021 (рецепты)
    const file021 = path.join(migrationsDir, '021_replace_recipes.sql');
    if (fs.existsSync(file021)) {
      await pool.query(fs.readFileSync(file021, 'utf8'));
      results.push('021_replace_recipes.sql OK');
    }

    // 6. Запускаем миграцию 022 (инвентарь пользователя)
    const file022 = path.join(migrationsDir, '022_user_inventory.sql');
    if (fs.existsSync(file022)) {
      await pool.query(fs.readFileSync(file022, 'utf8'));
      results.push('022_user_inventory.sql OK');
    }

    // 7. Проверяем результат
    const countProducts = await pool.query('SELECT COUNT(*) FROM products');
    const countRecipes = await pool.query('SELECT COUNT(*) FROM recipes');
    const countItems = await pool.query('SELECT COUNT(*) FROM recipe_items');

    // Проверяем дубликаты продуктов
    const duplicates = await pool.query(`
      SELECT name, COUNT(*) as cnt FROM products GROUP BY name HAVING COUNT(*) > 1 LIMIT 5
    `);

    // Проверяем рецепт с тунцом
    const testRecipe = await pool.query(`
      SELECT r.name, COUNT(ri.id) as items_count
      FROM recipes r
      LEFT JOIN recipe_items ri ON r.id = ri.recipe_id
      WHERE r.name ILIKE '%тунц%'
      GROUP BY r.id, r.name
    `);

    res.json({
      success: true,
      migrations: results,
      products_count: parseInt(countProducts.rows[0].count),
      recipes_count: parseInt(countRecipes.rows[0].count),
      recipe_items_count: parseInt(countItems.rows[0].count),
      duplicate_products: duplicates.rows,
      test_recipe: testRecipe.rows[0] || null
    });
  } catch (error) {
    console.error('Fix duplicates error:', error);
    res.status(500).json({
      error: 'Failed to fix duplicates',
      details: error instanceof Error ? error.message : 'Unknown'
    });
  }
});

/**
 * GET /api/nutrition/debug/duplicate-products
 * Проверяем дубликаты продуктов
 */
router.get('/debug/duplicate-products', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT name, COUNT(*) as cnt
      FROM products
      GROUP BY name
      HAVING COUNT(*) > 1
      ORDER BY cnt DESC
      LIMIT 20
    `);
    res.json({
      duplicate_products: result.rows,
      total_products: (await pool.query('SELECT COUNT(*) FROM products')).rows[0].count
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

/**
 * GET /api/nutrition/debug/recipe-test
 * Тестовый эндпоинт: проверяем расчёт КБЖУ для одного рецепта
 */
router.get('/debug/recipe-test', async (req: Request, res: Response) => {
  try {
    // Получаем один рецепт с ингредиентами (Бутерброд с тунцом)
    const recipeResult = await pool.query(`
      SELECT
        r.id,
        r.name,
        r.cached_calories,
        r.cached_protein
      FROM recipes r
      WHERE r.name ILIKE '%тунц%'
      LIMIT 1
    `);

    if (recipeResult.rows.length === 0) {
      return res.json({ error: 'Recipe not found' });
    }

    const recipe = recipeResult.rows[0];

    // Получаем ингредиенты этого рецепта
    const itemsResult = await pool.query(`
      SELECT
        ri.id,
        ri.amount_grams,
        p.name as product_name,
        p.calories as product_calories,
        p.protein as product_protein
      FROM recipe_items ri
      JOIN products p ON ri.product_id = p.id
      WHERE ri.recipe_id = $1
    `, [recipe.id]);

    // Считаем КБЖУ вручную
    let totalCalories = 0;
    let totalProtein = 0;
    const itemsDebug = itemsResult.rows.map(item => {
      const cal = (item.product_calories * item.amount_grams) / 100;
      const prot = (item.product_protein * item.amount_grams) / 100;
      totalCalories += cal;
      totalProtein += prot;
      return {
        product: item.product_name,
        amount_grams: item.amount_grams,
        product_calories_per_100g: item.product_calories,
        calculated_calories: Math.round(cal),
        calculated_protein: Math.round(prot)
      };
    });

    // Проверяем сколько записей в recipe_items для этого рецепта
    const countResult = await pool.query(`
      SELECT COUNT(*) as cnt FROM recipe_items WHERE recipe_id = $1
    `, [recipe.id]);

    res.json({
      recipe_id: recipe.id,
      recipe_name: recipe.name,
      cached_calories: recipe.cached_calories,
      cached_protein: recipe.cached_protein,
      recipe_items_count: parseInt(countResult.rows[0].cnt),
      items: itemsDebug,
      calculated_total: {
        calories: Math.round(totalCalories),
        protein: Math.round(totalProtein)
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Failed to test recipe', details: error instanceof Error ? error.message : 'Unknown' });
  }
});

// ==========================================
// INVENTORY ENDPOINTS (Инвентарь пользователя)
// ==========================================

/**
 * GET /api/nutrition/inventory/:userId
 * Получить инвентарь пользователя (продукты в холодильнике/на полках)
 */
router.get('/inventory/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(`
      SELECT
        ui.id,
        ui.product_id,
        ui.quantity_grams,
        ui.quantity_units,
        ui.location,
        ui.expiry_date,
        ui.updated_at,
        p.name as product_name,
        p.calories,
        p.protein,
        p.fat,
        p.carbs,
        p.category
      FROM user_inventory ui
      JOIN products p ON ui.product_id = p.id
      WHERE ui.user_id = $1
      ORDER BY
        CASE ui.location
          WHEN 'fridge' THEN 1
          WHEN 'freezer' THEN 2
          WHEN 'pantry' THEN 3
          ELSE 4
        END,
        p.name
    `, [userId]);

    // Группируем по местоположению
    const inventory = {
      fridge: result.rows.filter(r => r.location === 'fridge'),
      freezer: result.rows.filter(r => r.location === 'freezer'),
      pantry: result.rows.filter(r => r.location === 'pantry'),
      other: result.rows.filter(r => r.location === 'other'),
    };

    res.json({
      inventory,
      total_items: result.rows.length
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Failed to get inventory' });
  }
});

/**
 * POST /api/nutrition/inventory/:userId/items
 * Добавить продукт в инвентарь
 */
router.post('/inventory/:userId/items', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const {
      productId,
      quantityGrams,
      quantityUnits,
      location = 'fridge',
      expiryDate
    } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }

    // Используем UPSERT - если продукт уже есть, обновляем количество
    const result = await pool.query(`
      INSERT INTO user_inventory (user_id, product_id, quantity_grams, quantity_units, location, expiry_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET
        quantity_grams = COALESCE(user_inventory.quantity_grams, 0) + COALESCE(EXCLUDED.quantity_grams, 0),
        quantity_units = COALESCE(user_inventory.quantity_units, 0) + COALESCE(EXCLUDED.quantity_units, 0),
        location = EXCLUDED.location,
        expiry_date = COALESCE(EXCLUDED.expiry_date, user_inventory.expiry_date),
        updated_at = NOW()
      RETURNING *
    `, [userId, productId, quantityGrams || null, quantityUnits || null, location, expiryDate || null]);

    // Получаем информацию о продукте
    const productInfo = await pool.query(
      'SELECT name FROM products WHERE id = $1',
      [productId]
    );

    res.json({
      success: true,
      item: {
        ...result.rows[0],
        product_name: productInfo.rows[0]?.name
      }
    });
  } catch (error) {
    console.error('Add inventory item error:', error);
    res.status(500).json({ error: 'Failed to add item to inventory' });
  }
});

/**
 * PUT /api/nutrition/inventory/:userId/items/:itemId
 * Обновить количество продукта в инвентаре
 */
router.put('/inventory/:userId/items/:itemId', async (req: Request, res: Response) => {
  try {
    const { userId, itemId } = req.params;
    const { quantityGrams, quantityUnits, location, expiryDate } = req.body;

    const result = await pool.query(`
      UPDATE user_inventory
      SET
        quantity_grams = COALESCE($3, quantity_grams),
        quantity_units = COALESCE($4, quantity_units),
        location = COALESCE($5, location),
        expiry_date = COALESCE($6, expiry_date),
        updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [itemId, userId, quantityGrams, quantityUnits, location, expiryDate]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ success: true, item: result.rows[0] });
  } catch (error) {
    console.error('Update inventory item error:', error);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

/**
 * DELETE /api/nutrition/inventory/:userId/items/:itemId
 * Удалить продукт из инвентаря
 */
router.delete('/inventory/:userId/items/:itemId', async (req: Request, res: Response) => {
  try {
    const { userId, itemId } = req.params;

    const result = await pool.query(
      'DELETE FROM user_inventory WHERE id = $1 AND user_id = $2 RETURNING *',
      [itemId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    console.error('Delete inventory item error:', error);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});

/**
 * POST /api/nutrition/inventory/:userId/use
 * Использовать продукты из инвентаря (вычесть количество)
 */
router.post('/inventory/:userId/use', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { items } = req.body; // [{ productId, grams }]

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'items array is required' });
    }

    const results = [];
    for (const item of items) {
      const { productId, grams } = item;

      // Получаем текущее количество
      const current = await pool.query(
        'SELECT * FROM user_inventory WHERE user_id = $1 AND product_id = $2',
        [userId, productId]
      );

      if (current.rows.length === 0) {
        results.push({ productId, status: 'not_found' });
        continue;
      }

      const currentGrams = parseFloat(current.rows[0].quantity_grams) || 0;
      const newGrams = Math.max(0, currentGrams - grams);

      if (newGrams <= 0) {
        // Удаляем если закончилось
        await pool.query(
          'DELETE FROM user_inventory WHERE user_id = $1 AND product_id = $2',
          [userId, productId]
        );
        results.push({ productId, status: 'depleted' });
      } else {
        // Обновляем количество
        await pool.query(
          'UPDATE user_inventory SET quantity_grams = $3, updated_at = NOW() WHERE user_id = $1 AND product_id = $2',
          [userId, productId, newGrams]
        );
        results.push({ productId, status: 'updated', remaining: newGrams });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('Use inventory items error:', error);
    res.status(500).json({ error: 'Failed to use inventory items' });
  }
});

/**
 * POST /api/nutrition/inventory/:userId/bulk
 * Массовое добавление продуктов в инвентарь
 */
router.post('/inventory/:userId/bulk', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { items } = req.body; // [{ productId, quantityGrams, location }]

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'items array is required' });
    }

    const results = [];
    for (const item of items) {
      const { productId, quantityGrams, quantityUnits, location = 'fridge' } = item;

      const result = await pool.query(`
        INSERT INTO user_inventory (user_id, product_id, quantity_grams, quantity_units, location)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, product_id)
        DO UPDATE SET
          quantity_grams = COALESCE(user_inventory.quantity_grams, 0) + COALESCE(EXCLUDED.quantity_grams, 0),
          quantity_units = COALESCE(user_inventory.quantity_units, 0) + COALESCE(EXCLUDED.quantity_units, 0),
          location = EXCLUDED.location,
          updated_at = NOW()
        RETURNING *
      `, [userId, productId, quantityGrams || null, quantityUnits || null, location]);

      results.push(result.rows[0]);
    }

    res.json({ success: true, added: results.length });
  } catch (error) {
    console.error('Bulk add inventory error:', error);
    res.status(500).json({ error: 'Failed to add items' });
  }
});

/**
 * GET /api/nutrition/inventory/:userId/shopping-diff/:mealPlanId
 * Получить разницу между списком покупок и инвентарём
 * (что нужно докупить)
 */
router.get('/inventory/:userId/shopping-diff/:mealPlanId', async (req: Request, res: Response) => {
  try {
    const { userId, mealPlanId } = req.params;

    // Получаем список покупок из плана
    const shoppingList = await pool.query(`
      SELECT
        sli.product_id,
        sli.total_grams as needed_grams,
        p.name as product_name,
        p.calories,
        p.protein,
        p.category
      FROM shopping_list_items sli
      JOIN products p ON sli.product_id = p.id
      WHERE sli.meal_plan_id = $1
    `, [mealPlanId]);

    // Получаем инвентарь пользователя
    const inventory = await pool.query(`
      SELECT product_id, quantity_grams, quantity_units
      FROM user_inventory
      WHERE user_id = $1
    `, [userId]);

    // Создаём map инвентаря для быстрого поиска
    const inventoryMap = new Map();
    for (const item of inventory.rows) {
      inventoryMap.set(item.product_id, {
        grams: parseFloat(item.quantity_grams) || 0,
        units: parseInt(item.quantity_units) || 0
      });
    }

    // Рассчитываем что нужно докупить
    const toBuy = [];
    const haveEnough = [];

    for (const item of shoppingList.rows) {
      const needed = parseFloat(item.needed_grams);
      const have = inventoryMap.get(item.product_id);
      const haveGrams = have?.grams || 0;

      if (haveGrams >= needed) {
        haveEnough.push({
          ...item,
          have_grams: haveGrams,
          status: 'have_enough'
        });
      } else {
        toBuy.push({
          ...item,
          have_grams: haveGrams,
          need_to_buy_grams: Math.ceil(needed - haveGrams),
          status: haveGrams > 0 ? 'partial' : 'need_all'
        });
      }
    }

    res.json({
      to_buy: toBuy,
      have_enough: haveEnough,
      summary: {
        total_items: shoppingList.rows.length,
        need_to_buy: toBuy.length,
        already_have: haveEnough.length
      }
    });
  } catch (error) {
    console.error('Shopping diff error:', error);
    res.status(500).json({ error: 'Failed to calculate shopping diff' });
  }
});

export default router;
