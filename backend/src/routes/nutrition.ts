// backend/src/routes/nutrition.ts

import { Router, Request, Response } from 'express';
import { NutritionDataService } from '../services/nutritionDataService';
import { config } from '../config';

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

export default router;
