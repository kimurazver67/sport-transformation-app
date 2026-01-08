// backend/src/services/nutritionDataService.ts

import axios, { AxiosRequestConfig } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { query } from '../db/postgres';
import type { Product, FatSecretProduct } from '../types';

interface FatSecretTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface FatSecretSearchResponse {
  foods?: {
    food?: FatSecretProduct[];
  };
}

interface FatSecretFoodDetail {
  food: {
    food_id: string;
    food_name: string;
    servings: {
      serving: Array<{
        serving_id: string;
        metric_serving_amount?: string;
        metric_serving_unit?: string;
        calories: string;
        protein: string;
        fat: string;
        carbohydrate: string;
        fiber?: string;
      }>;
    };
  };
}

export class NutritionDataService {
  private clientId: string;
  private clientSecret: string;
  private accessToken?: string;
  private tokenExpiry?: Date;
  private readonly baseUrl = 'https://platform.fatsecret.com/rest/server.api';
  private readonly tokenUrl = 'https://oauth.fatsecret.com/connect/token';
  private proxyAgent?: HttpsProxyAgent<string>;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;

    // Поддержка HTTP прокси для обхода IP-ограничений FatSecret
    const proxyUrl = process.env.FATSECRET_PROXY_URL || process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    if (proxyUrl) {
      this.proxyAgent = new HttpsProxyAgent(proxyUrl);
      console.log('[FatSecret] Using proxy:', proxyUrl.replace(/:[^:@]+@/, ':***@'));
    }
  }

  /**
   * Получить конфиг axios с прокси (если настроен)
   */
  private getAxiosConfig(config: AxiosRequestConfig = {}): AxiosRequestConfig {
    if (this.proxyAgent) {
      return {
        ...config,
        httpsAgent: this.proxyAgent,
        proxy: false // Отключаем встроенный прокси axios, используем agent
      };
    }
    return config;
  }

  /**
   * Получить OAuth 2.0 токен
   */
  private async getAccessToken(): Promise<string> {
    // Проверяем кэшированный токен
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    console.log('[FatSecret] Получение нового access token...');

    // Получаем новый токен
    const response = await axios.post<FatSecretTokenResponse>(
      this.tokenUrl,
      new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'basic'
      }),
      this.getAxiosConfig({
        auth: {
          username: this.clientId,
          password: this.clientSecret
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
    );

    this.accessToken = response.data.access_token;
    this.tokenExpiry = new Date(Date.now() + (response.data.expires_in - 60) * 1000);

    console.log('[FatSecret] Access token получен, expires in', response.data.expires_in, 'секунд');

    return this.accessToken;
  }

  /**
   * Поиск продуктов в FatSecret API
   */
  async searchFatSecret(searchQuery: string, maxResults: number = 20): Promise<FatSecretProduct[]> {
    try {
      const token = await this.getAccessToken();

      console.log('[FatSecret] Поиск продуктов:', searchQuery);

      const response = await axios.post<FatSecretSearchResponse>(
        this.baseUrl,
        new URLSearchParams({
          method: 'foods.search',
          search_expression: searchQuery,
          format: 'json',
          max_results: maxResults.toString(),
          region: 'RU',  // Поддержка русского языка
          language: 'ru'
        }),
        this.getAxiosConfig({
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
      );

      const foods = response.data.foods?.food || [];
      console.log('[FatSecret] Найдено продуктов:', foods.length);

      return foods;
    } catch (error) {
      console.error('[FatSecret] Ошибка поиска:', error);
      throw new Error('Failed to search FatSecret API');
    }
  }

  /**
   * Парсинг КБЖУ из food_description
   * "Per 100g - Calories: 165kcal | Fat: 3.6g | Carbs: 0g | Protein: 31g"
   */
  private parseFoodDescription(description: string): {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  } {
    const caloriesMatch = description.match(/Calories:\s*([\d.]+)kcal/i);
    const proteinMatch = description.match(/Protein:\s*([\d.]+)g/i);
    const fatMatch = description.match(/Fat:\s*([\d.]+)g/i);
    const carbsMatch = description.match(/Carbs:\s*([\d.]+)g/i);

    return {
      calories: caloriesMatch ? parseFloat(caloriesMatch[1]) : 0,
      protein: proteinMatch ? parseFloat(proteinMatch[1]) : 0,
      fat: fatMatch ? parseFloat(fatMatch[1]) : 0,
      carbs: carbsMatch ? parseFloat(carbsMatch[1]) : 0,
    };
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
   * Комбинированный поиск (локальная БД + FatSecret)
   */
  async searchProducts(
    searchQuery: string,
    source: 'local' | 'fatsecret' | 'all' = 'all',
    limit: number = 20
  ): Promise<{ products: Array<Product & { source: 'local' | 'fatsecret' }>; cached: boolean }> {
    const results: Array<Product & { source: 'local' | 'fatsecret' }> = [];

    // Поиск в локальной БД
    if (source === 'local' || source === 'all') {
      const localProducts = await this.searchLocal(searchQuery, limit);
      results.push(...localProducts.map(p => ({ ...p, source: 'local' as const })));
    }

    // Поиск в FatSecret (только если нужно и лимит не достигнут)
    if ((source === 'fatsecret' || source === 'all') && results.length < limit) {
      const fsProducts = await this.searchFatSecret(searchQuery, limit - results.length);

      for (const fsProduct of fsProducts) {
        const macros = this.parseFoodDescription(fsProduct.food_description);
        results.push({
          id: '', // Будет заполнено при импорте
          fatsecret_id: fsProduct.food_id,
          name: fsProduct.food_name,
          ...macros,
          fiber: 0,
          category: 'other',
          is_perishable: true,
          cooking_ratio: 1.0,
          unit: 'г',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          source: 'fatsecret' as const
        } as Product & { source: 'fatsecret' });
      }
    }

    return {
      products: results.slice(0, limit),
      cached: source === 'local'
    };
  }

  /**
   * Получить детальную информацию о продукте из FatSecret
   */
  async getFatSecretFoodDetail(foodId: string): Promise<FatSecretFoodDetail['food']> {
    try {
      const token = await this.getAccessToken();

      console.log('[FatSecret] Получение деталей продукта:', foodId);

      const response = await axios.post<FatSecretFoodDetail>(
        this.baseUrl,
        new URLSearchParams({
          method: 'food.get.v2',
          food_id: foodId,
          format: 'json'
        }),
        this.getAxiosConfig({
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
      );

      return response.data.food;
    } catch (error) {
      console.error('[FatSecret] Ошибка получения деталей:', error);
      throw new Error('Failed to get food details from FatSecret');
    }
  }

  /**
   * Импортировать продукт из FatSecret в локальную БД
   */
  async importProduct(fatSecretId: string, userId?: string): Promise<{ product_id: string; already_exists: boolean }> {
    // Проверяем, не импортирован ли уже
    const existing = await query<{ id: string }>(`
      SELECT id FROM products WHERE fatsecret_id = $1
    `, [fatSecretId]);

    if (existing.rows.length > 0) {
      console.log('[Import] Продукт уже существует:', fatSecretId);
      return {
        product_id: existing.rows[0].id,
        already_exists: true
      };
    }

    // Получаем детальную информацию
    const food = await this.getFatSecretFoodDetail(fatSecretId);

    // Берём метрическую порцию (100г) или первую доступную
    const servings = Array.isArray(food.servings.serving)
      ? food.servings.serving
      : [food.servings.serving];

    const serving = servings.find(
      (s) => s.metric_serving_amount === '100.000' && s.metric_serving_unit === 'g'
    ) || servings[0];

    // Сохраняем в БД
    const result = await query<{ id: string }>(`
      INSERT INTO products (
        fatsecret_id, name, calories, protein, fat, carbs, fiber,
        category, is_perishable, cooking_ratio, imported_by_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [
      fatSecretId,
      food.food_name,
      parseFloat(serving.calories),
      parseFloat(serving.protein),
      parseFloat(serving.fat),
      parseFloat(serving.carbohydrate),
      parseFloat(serving.fiber || '0'),
      this.detectCategory(food.food_name),
      this.detectPerishable(food.food_name),
      1.0,
      userId || null
    ]);

    console.log('[Import] Продукт импортирован:', food.food_name, '→', result.rows[0].id);

    return {
      product_id: result.rows[0].id,
      already_exists: false
    };
  }

  /**
   * Определить категорию продукта по названию (эвристика)
   */
  private detectCategory(name: string): string {
    const lower = name.toLowerCase();

    if (lower.includes('chicken') || lower.includes('курица') || lower.includes('куриц')) return 'poultry';
    if (lower.includes('turkey') || lower.includes('индейка')) return 'poultry';
    if (lower.includes('beef') || lower.includes('говядина') || lower.includes('говяж')) return 'meat';
    if (lower.includes('pork') || lower.includes('свинина') || lower.includes('свин')) return 'meat';
    if (lower.includes('lamb') || lower.includes('баранина')) return 'meat';
    if (lower.includes('fish') || lower.includes('рыба') || lower.includes('лосось') || lower.includes('salmon')) return 'fish';
    if (lower.includes('shrimp') || lower.includes('креветк')) return 'seafood';
    if (lower.includes('milk') || lower.includes('молоко')) return 'dairy';
    if (lower.includes('cheese') || lower.includes('сыр')) return 'dairy';
    if (lower.includes('yogurt') || lower.includes('йогурт')) return 'dairy';
    if (lower.includes('egg') || lower.includes('яйц')) return 'eggs';
    if (lower.includes('rice') || lower.includes('рис')) return 'grains';
    if (lower.includes('oat') || lower.includes('овс')) return 'grains';
    if (lower.includes('pasta') || lower.includes('макарон')) return 'pasta';
    if (lower.includes('bread') || lower.includes('хлеб')) return 'bread';
    if (lower.includes('apple') || lower.includes('яблок')) return 'fruits';
    if (lower.includes('banana') || lower.includes('банан')) return 'fruits';
    if (lower.includes('orange') || lower.includes('апельсин')) return 'fruits';
    if (lower.includes('tomato') || lower.includes('помидор')) return 'vegetables';
    if (lower.includes('cucumber') || lower.includes('огурец')) return 'vegetables';
    if (lower.includes('potato') || lower.includes('картофель')) return 'vegetables';
    if (lower.includes('almond') || lower.includes('миндал')) return 'nuts';
    if (lower.includes('walnut') || lower.includes('грецк')) return 'nuts';
    if (lower.includes('oil') || lower.includes('масло')) return 'oils';

    return 'other';
  }

  /**
   * Определить, является ли продукт скоропортящимся
   */
  private detectPerishable(name: string): boolean {
    const lower = name.toLowerCase();
    const nonPerishable = [
      'rice', 'pasta', 'oat', 'flour', 'sugar', 'oil', 'honey', 'dried',
      'рис', 'макарон', 'мука', 'сахар', 'масло', 'мёд', 'суш'
    ];
    return !nonPerishable.some(word => lower.includes(word));
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
