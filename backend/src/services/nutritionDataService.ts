// backend/src/services/nutritionDataService.ts

import axios from 'axios';
import { query } from '../db/postgres';
import type { Product, ProductCategory } from '../types';

// OpenFoodFacts API types
interface OpenFoodFactsProduct {
  code: string;
  product_name: string;
  product_name_ru?: string;
  brands?: string;
  nutriments: {
    'energy-kcal_100g'?: number;
    proteins_100g?: number;
    fat_100g?: number;
    carbohydrates_100g?: number;
    fiber_100g?: number;
  };
  categories_tags?: string[];
}

interface OpenFoodFactsSearchResponse {
  count: number;
  page: number;
  page_size: number;
  products: OpenFoodFactsProduct[];
}

export class NutritionDataService {
  private readonly openFoodFactsUrl = 'https://world.openfoodfacts.org/cgi/search.pl';

  constructor() {
    console.log('[NutritionDataService] Initialized with OpenFoodFacts API');
  }

  /**
   * Поиск продуктов в OpenFoodFacts API
   */
  async searchOpenFoodFacts(searchQuery: string, maxResults: number = 20): Promise<Array<Product & { source: 'openfoodfacts' }>> {
    try {
      console.log('[OpenFoodFacts] Поиск продуктов:', searchQuery);

      const response = await axios.get<OpenFoodFactsSearchResponse>(this.openFoodFactsUrl, {
        params: {
          search_terms: searchQuery,
          search_simple: 1,
          action: 'process',
          json: 1,
          page_size: maxResults,
          cc: 'ru',  // Российский регион
          lc: 'ru',  // Русский язык
          fields: 'code,product_name,product_name_ru,brands,nutriments,categories_tags'
        },
        timeout: 10000
      });

      const products = response.data.products || [];
      console.log('[OpenFoodFacts] Найдено продуктов:', products.length);

      // Преобразуем в формат Product
      return products
        .filter(p => p.product_name && p.nutriments) // Только с названием и КБЖУ
        .map(p => ({
          id: '',
          openfoodfacts_code: p.code,
          name: p.product_name_ru || p.product_name,
          brand: p.brands || null,
          calories: Math.round(p.nutriments['energy-kcal_100g'] || 0),
          protein: Math.round((p.nutriments.proteins_100g || 0) * 10) / 10,
          fat: Math.round((p.nutriments.fat_100g || 0) * 10) / 10,
          carbs: Math.round((p.nutriments.carbohydrates_100g || 0) * 10) / 10,
          fiber: Math.round((p.nutriments.fiber_100g || 0) * 10) / 10,
          category: this.detectCategory(p.categories_tags || []),
          is_perishable: true,
          cooking_ratio: 1.0,
          unit: 'г',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          source: 'openfoodfacts' as const
        }));
    } catch (error) {
      console.error('[OpenFoodFacts] Ошибка поиска:', error);
      return [];
    }
  }

  /**
   * Определить категорию по тегам OpenFoodFacts
   */
  private detectCategory(tags: string[]): ProductCategory {
    const tagStr = tags.join(' ').toLowerCase();

    if (tagStr.includes('poultry') || tagStr.includes('chicken') || tagStr.includes('курица')) return 'poultry';
    if (tagStr.includes('meat') || tagStr.includes('beef') || tagStr.includes('pork') || tagStr.includes('мясо')) return 'meat';
    if (tagStr.includes('fish') || tagStr.includes('рыба') || tagStr.includes('seafood')) return 'fish';
    if (tagStr.includes('dairy') || tagStr.includes('milk') || tagStr.includes('молоко') || tagStr.includes('молочн')) return 'dairy';
    if (tagStr.includes('egg') || tagStr.includes('яйц')) return 'eggs';
    if (tagStr.includes('grain') || tagStr.includes('cereal') || tagStr.includes('круп')) return 'grains';
    if (tagStr.includes('pasta') || tagStr.includes('макарон')) return 'pasta';
    if (tagStr.includes('bread') || tagStr.includes('хлеб')) return 'bread';
    if (tagStr.includes('fruit') || tagStr.includes('фрукт')) return 'fruits';
    if (tagStr.includes('vegetable') || tagStr.includes('овощ')) return 'vegetables';
    if (tagStr.includes('nut') || tagStr.includes('орех')) return 'nuts';
    if (tagStr.includes('oil') || tagStr.includes('масло')) return 'oils';
    if (tagStr.includes('beverage') || tagStr.includes('напиток')) return 'beverages';

    return 'other';
  }

  /**
   * Поиск в локальной БД
   */
  async searchLocal(searchQuery: string, limit: number = 20): Promise<Product[]> {
    const result = await query<Product>(`
      SELECT DISTINCT ON (name) * FROM products
      WHERE name ILIKE $1
      ORDER BY name ASC, id ASC
      LIMIT $2
    `, [`%${searchQuery}%`, limit]);

    return result.rows;
  }

  /**
   * Комбинированный поиск (локальная БД + OpenFoodFacts)
   */
  async searchProducts(
    searchQuery: string,
    source: 'local' | 'openfoodfacts' | 'all' = 'all',
    limit: number = 20
  ): Promise<{ products: Array<Product & { source: 'local' | 'openfoodfacts' }>; cached: boolean }> {
    const results: Array<Product & { source: 'local' | 'openfoodfacts' }> = [];

    // Поиск в локальной БД
    if (source === 'local' || source === 'all') {
      const localProducts = await this.searchLocal(searchQuery, limit);
      results.push(...localProducts.map(p => ({ ...p, source: 'local' as const })));
    }

    // Поиск в OpenFoodFacts (только если нужно и лимит не достигнут)
    if ((source === 'openfoodfacts' || source === 'all') && results.length < limit) {
      const offProducts = await this.searchOpenFoodFacts(searchQuery, limit - results.length);
      results.push(...offProducts);
    }

    return {
      products: results.slice(0, limit),
      cached: source === 'local'
    };
  }

  /**
   * Импортировать продукт из OpenFoodFacts в локальную БД
   */
  async importProduct(code: string, userId?: string): Promise<{ product_id: string; already_exists: boolean }> {
    // Проверяем, не импортирован ли уже
    const existing = await query<{ id: string }>(`
      SELECT id FROM products WHERE openfoodfacts_code = $1
    `, [code]);

    if (existing.rows.length > 0) {
      console.log('[Import] Продукт уже существует:', code);
      return {
        product_id: existing.rows[0].id,
        already_exists: true
      };
    }

    // Получаем данные из OpenFoodFacts
    const response = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
    const product = response.data.product;

    if (!product) {
      throw new Error('Product not found in OpenFoodFacts');
    }

    // Сохраняем в БД
    const result = await query<{ id: string }>(`
      INSERT INTO products (
        openfoodfacts_code, name, calories, protein, fat, carbs, fiber,
        category, is_perishable, cooking_ratio, imported_by_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [
      code,
      product.product_name_ru || product.product_name,
      Math.round(product.nutriments['energy-kcal_100g'] || 0),
      Math.round((product.nutriments.proteins_100g || 0) * 10) / 10,
      Math.round((product.nutriments.fat_100g || 0) * 10) / 10,
      Math.round((product.nutriments.carbohydrates_100g || 0) * 10) / 10,
      Math.round((product.nutriments.fiber_100g || 0) * 10) / 10,
      this.detectCategory(product.categories_tags || []),
      true,
      1.0,
      userId || null
    ]);

    console.log('[Import] Продукт импортирован:', product.product_name, '→', result.rows[0].id);

    return {
      product_id: result.rows[0].id,
      already_exists: false
    };
  }

  /**
   * Получить все теги
   */
  async getAllTags() {
    const result = await query(`
      SELECT * FROM tags
      ORDER BY type, name_ru
    `);

    return result.rows;
  }

  /**
   * Добавить исключение продукта для пользователя
   */
  async addProductExclusion(userId: string, productId: string) {
    await query(`
      INSERT INTO user_excluded_products (user_id, product_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, product_id) DO NOTHING
    `, [userId, productId]);
  }

  /**
   * Добавить исключение тега для пользователя
   */
  async addTagExclusion(userId: string, tagId: string) {
    await query(`
      INSERT INTO user_excluded_tags (user_id, tag_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, tag_id) DO NOTHING
    `, [userId, tagId]);
  }

  /**
   * Получить исключения пользователя
   */
  async getUserExclusions(userId: string) {
    const excludedProducts = await query(`
      SELECT p.* FROM products p
      JOIN user_excluded_products uep ON p.id = uep.product_id
      WHERE uep.user_id = $1
    `, [userId]);

    const excludedTags = await query(`
      SELECT t.* FROM tags t
      JOIN user_excluded_tags uet ON t.id = uet.tag_id
      WHERE uet.user_id = $1
    `, [userId]);

    return {
      products: excludedProducts.rows,
      tags: excludedTags.rows
    };
  }

  /**
   * Удалить исключение продукта
   */
  async removeProductExclusion(userId: string, productId: string) {
    await query(`
      DELETE FROM user_excluded_products
      WHERE user_id = $1 AND product_id = $2
    `, [userId, productId]);
  }

  /**
   * Удалить исключение тега
   */
  async removeTagExclusion(userId: string, tagId: string) {
    await query(`
      DELETE FROM user_excluded_tags
      WHERE user_id = $1 AND tag_id = $2
    `, [userId, tagId]);
  }
}
