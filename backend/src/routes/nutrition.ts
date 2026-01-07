// backend/src/routes/nutrition.ts

import { Router, Request, Response } from 'express';
import { NutritionDataService } from '../services/nutritionDataService';
import { MealPlanGenerator } from '../services/mealPlanGenerator';
import { config } from '../config';
import { pool } from '../db/postgres';

const router = Router();

// Инициализируем сервис
let nutritionService: NutritionDataService | null = null;

if (config.fatsecret.enabled && config.fatsecret.clientId && config.fatsecret.clientSecret) {
  nutritionService = new NutritionDataService(
    config.fatsecret.clientId,
    config.fatsecret.clientSecret
  );
  console.log('[Nutrition API] FatSecret integration enabled');
} else {
  console.log('[Nutrition API] FatSecret integration disabled (missing credentials)');
}

/**
 * GET /api/nutrition/products/search
 * Поиск продуктов (локальная БД + FatSecret API)
 */
router.get('/products/search', async (req: Request, res: Response) => {
  try {
    if (!nutritionService) {
      return res.status(503).json({
        error: 'Nutrition service is not available'
      });
    }

    const query = req.query.q as string;
    const source = (req.query.source as 'local' | 'fatsecret' | 'all') || 'all';
    const limit = parseInt(req.query.limit as string) || 20;

    if (!query || query.length < 2) {
      return res.status(400).json({
        error: 'Query must be at least 2 characters long'
      });
    }

    const result = await nutritionService.searchProducts(query, source, limit);

    res.json({
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
 * Импортировать продукт из FatSecret в локальную БД
 */
router.post('/products/import', async (req: Request, res: Response) => {
  try {
    if (!nutritionService) {
      return res.status(503).json({
        error: 'Nutrition service is not available'
      });
    }

    const { fatsecret_id, user_id } = req.body;

    if (!fatsecret_id) {
      return res.status(400).json({
        error: 'fatsecret_id is required'
      });
    }

    const result = await nutritionService.importProduct(fatsecret_id, user_id);

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
 * Получить все теги (аллергены, диеты, предпочтения)
 */
router.get('/tags', async (req: Request, res: Response) => {
  try {
    if (!nutritionService) {
      return res.status(503).json({
        error: 'Nutrition service is not available'
      });
    }

    const tags = await nutritionService.getAllTags();

    res.json({
      tags
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
 * Получить исключения пользователя
 */
router.get('/exclusions/:userId', async (req: Request, res: Response) => {
  try {
    if (!nutritionService) {
      return res.status(503).json({
        error: 'Nutrition service is not available'
      });
    }

    const { userId } = req.params;
    const exclusions = await nutritionService.getUserExclusions(userId);

    res.json(exclusions);
  } catch (error) {
    console.error('[Nutrition API] Get exclusions error:', error);
    res.status(500).json({
      error: 'Failed to get exclusions'
    });
  }
});

/**
 * POST /api/nutrition/exclusions/:userId/products
 * Добавить продукт в исключения
 */
router.post('/exclusions/:userId/products', async (req: Request, res: Response) => {
  try {
    if (!nutritionService) {
      return res.status(503).json({
        error: 'Nutrition service is not available'
      });
    }

    const { userId } = req.params;
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({
        error: 'product_id is required'
      });
    }

    await nutritionService.addProductExclusion(userId, product_id);

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
 * Добавить тег в исключения
 */
router.post('/exclusions/:userId/tags', async (req: Request, res: Response) => {
  try {
    if (!nutritionService) {
      return res.status(503).json({
        error: 'Nutrition service is not available'
      });
    }

    const { userId } = req.params;
    const { tag_id } = req.body;

    if (!tag_id) {
      return res.status(400).json({
        error: 'tag_id is required'
      });
    }

    await nutritionService.addTagExclusion(userId, tag_id);

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
 * Удалить продукт из исключений
 */
router.delete('/exclusions/:userId/products/:productId', async (req: Request, res: Response) => {
  try {
    if (!nutritionService) {
      return res.status(503).json({
        error: 'Nutrition service is not available'
      });
    }

    const { userId, productId } = req.params;
    await nutritionService.removeProductExclusion(userId, productId);

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
 * Удалить тег из исключений
 */
router.delete('/exclusions/:userId/tags/:tagId', async (req: Request, res: Response) => {
  try {
    if (!nutritionService) {
      return res.status(503).json({
        error: 'Nutrition service is not available'
      });
    }

    const { userId, tagId } = req.params;
    await nutritionService.removeTagExclusion(userId, tagId);

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
 * POST /api/nutrition/meal-plans/generate
 * Генерация плана питания (не требует FatSecret)
 */
router.post('/meal-plans/generate', async (req: Request, res: Response) => {
  try {
    const { user_id, weeks, allow_repeat_days, prefer_simple } = req.body;

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
      FROM shopping_list sl
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

export default router;
