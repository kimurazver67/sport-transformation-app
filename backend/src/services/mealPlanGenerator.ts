// backend/src/services/mealPlanGenerator.ts

import { Pool } from 'pg';
import { UserGoal, MealType, Recipe, Product, RecipeItem, MealPlan } from '../types';
import { nutritionService } from './nutritionService';

interface GenerateMealPlanParams {
  userId: string;
  weeks: number;
  allowRepeatDays: number;
  preferSimple: boolean;
  useInventory?: boolean;  // Использовать продукты из инвентаря пользователя
}

interface InventoryItem {
  product_id: string;
  quantity_grams: number;
  product_name: string;
}

interface RecipeWithItems extends Recipe {
  items: Array<RecipeItem & { product: Product }>;
}

interface DayPlan {
  breakfast: RecipeWithItems;
  lunch: RecipeWithItems;
  dinner: RecipeWithItems;
  snack: RecipeWithItems;
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
}

const MEAL_DISTRIBUTION = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.30,
  snack: 0.10,
} as const;

export class MealPlanGenerator {
  constructor(private pool: Pool) {}

  /**
   * Генерация плана питания
   */
  async generate(params: GenerateMealPlanParams): Promise<string> {
    const { userId, weeks, allowRepeatDays, preferSimple, useInventory = false } = params;

    // 1. Получаем данные пользователя
    const user = await this.getUserData(userId);
    if (!user) throw new Error('User not found');

    // 2. Рассчитываем целевые КБЖУ
    const targets = nutritionService.calculate(user.start_weight, user.goal);

    // 3. Получаем доступные рецепты (исключая user exclusions)
    const availableRecipes = await this.getAvailableRecipes(userId, user.goal);

    // 3.5 Если useInventory - получаем инвентарь и ранжируем рецепты
    let userInventory: InventoryItem[] = [];
    if (useInventory) {
      userInventory = await this.getUserInventory(userId);
      console.log(`[MealPlanGenerator] User inventory: ${userInventory.length} items`);
    }

    // 4. Группируем рецепты по типу приёма пищи
    const recipesByMeal = this.groupRecipesByMealType(availableRecipes);

    // 5. Создаём запись плана питания
    const mealPlanId = await this.createMealPlan(userId, weeks, targets, allowRepeatDays, preferSimple);

    // 6. Генерируем дни (weeks × 7)
    const totalDays = weeks * 7;
    const generatedDays: DayPlan[] = [];

    for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
      const weekNumber = Math.floor(dayIndex / 7) + 1;
      const dayNumber = (dayIndex % 7) + 1;

      // Проверяем возможность повтора
      const canRepeat = this.canRepeatDay(generatedDays, dayIndex, allowRepeatDays);

      let dayPlan: DayPlan;

      if (canRepeat && generatedDays.length > 0) {
        // Повторяем существующий день
        const sourceDay = generatedDays[Math.floor(Math.random() * Math.min(generatedDays.length, 7))];
        dayPlan = sourceDay;
      } else {
        // Генерируем новый день
        dayPlan = await this.generateDay(recipesByMeal, targets, preferSimple, generatedDays, userInventory);
      }

      // Сохраняем день в БД
      await this.saveDayPlan(mealPlanId, weekNumber, dayNumber, dayPlan);

      generatedDays.push(dayPlan);
    }

    // 7. Обновляем средние значения КБЖУ плана
    await this.updateMealPlanAverages(mealPlanId, generatedDays);

    // 8. Генерируем список покупок (с учётом инвентаря)
    await this.generateShoppingList(mealPlanId, weeks, useInventory ? userId : undefined);

    return mealPlanId;
  }

  /**
   * Получение инвентаря пользователя
   */
  private async getUserInventory(userId: string): Promise<InventoryItem[]> {
    const result = await this.pool.query(`
      SELECT
        ui.product_id,
        ui.quantity_grams,
        p.name as product_name
      FROM user_inventory ui
      JOIN products p ON ui.product_id = p.id
      WHERE ui.user_id = $1 AND ui.quantity_grams > 0
    `, [userId]);
    return result.rows;
  }

  /**
   * Рассчитать насколько рецепт можно приготовить из инвентаря
   * Возвращает число от 0 до 1 (1 = все ингредиенты есть)
   */
  private calculateInventoryCoverage(recipe: RecipeWithItems, inventory: InventoryItem[]): number {
    if (!recipe.items || recipe.items.length === 0) return 0;

    const inventoryMap = new Map<string, number>();
    for (const item of inventory) {
      inventoryMap.set(item.product_id, item.quantity_grams);
    }

    let coveredItems = 0;
    for (const item of recipe.items) {
      const haveGrams = inventoryMap.get(item.product_id) || 0;
      // Считаем покрытым если есть хотя бы 50% нужного количества
      if (haveGrams >= item.grams * 0.5) {
        coveredItems++;
      }
    }

    return coveredItems / recipe.items.length;
  }

  /**
   * Получение данных пользователя
   */
  private async getUserData(userId: string) {
    const result = await this.pool.query(
      'SELECT id, goal, start_weight FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0];
  }

  /**
   * Получение доступных рецептов (исключая user exclusions)
   */
  private async getAvailableRecipes(userId: string, goal: UserGoal): Promise<RecipeWithItems[]> {
    // Используем подзапрос чтобы избежать дублирования items
    const result = await this.pool.query(`
      SELECT
        r.*,
        (
          SELECT json_agg(item_data)
          FROM (
            SELECT DISTINCT ON (ri.id)
              json_build_object(
                'id', ri.id,
                'recipe_id', ri.recipe_id,
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
                  'fiber', p.fiber,
                  'category', p.category,
                  'cooking_ratio', p.cooking_ratio
                )
              ) as item_data
            FROM recipe_items ri
            JOIN products p ON ri.product_id = p.id
            WHERE ri.recipe_id = r.id AND p.is_active = true
          ) sub
        ) as items
      FROM recipes r
      WHERE r.is_active = true
        -- Исключаем рецепты с продуктами в user exclusions
        AND NOT EXISTS (
          SELECT 1 FROM recipe_items ri2
          JOIN user_excluded_products uep ON uep.product_id = ri2.product_id
          WHERE ri2.recipe_id = r.id AND uep.user_id = $1
        )
        -- Исключаем рецепты с тегами в user exclusions
        AND NOT EXISTS (
          SELECT 1 FROM recipe_items ri3
          JOIN product_tags pt ON pt.product_id = ri3.product_id
          JOIN user_excluded_tags uet ON uet.tag_id = pt.tag_id
          WHERE ri3.recipe_id = r.id AND uet.user_id = $1
        )
      ORDER BY r.complexity, r.cooking_time
    `, [userId]);

    return result.rows;
  }

  /**
   * Группировка рецептов по типу приёма пищи
   */
  private groupRecipesByMealType(recipes: RecipeWithItems[]): Record<MealType, RecipeWithItems[]> {
    return {
      breakfast: recipes.filter(r => r.meal_type === 'breakfast'),
      lunch: recipes.filter(r => r.meal_type === 'lunch'),
      dinner: recipes.filter(r => r.meal_type === 'dinner'),
      snack: recipes.filter(r => r.meal_type === 'snack'),
    };
  }

  /**
   * Создание записи плана питания
   */
  private async createMealPlan(
    userId: string,
    weeks: number,
    targets: { calories: number; protein: number; fat: number; carbs: number },
    allowRepeatDays: number,
    preferSimple: boolean
  ): Promise<string> {
    const result = await this.pool.query(`
      INSERT INTO meal_plans (
        user_id, weeks, status,
        target_calories, target_protein, target_fat, target_carbs,
        allow_repeat_days, prefer_simple
      )
      VALUES ($1, $2, 'active', $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [
      userId, weeks,
      targets.calories, targets.protein, targets.fat, targets.carbs,
      allowRepeatDays, preferSimple
    ]);

    return result.rows[0].id;
  }

  /**
   * Проверка возможности повтора дня
   */
  private canRepeatDay(generatedDays: DayPlan[], currentIndex: number, allowRepeatDays: number): boolean {
    if (allowRepeatDays === 0) return false;
    if (generatedDays.length === 0) return false;

    // Разрешаем повтор с вероятностью на основе allowRepeatDays
    const repeatProbability = allowRepeatDays / 7; // 0-7 дней -> 0-1 вероятность
    return Math.random() < repeatProbability;
  }

  /**
   * Генерация одного дня питания
   * Подбираем комбинацию рецептов, чтобы итоговые БЖУ были максимально близки к целевым
   */
  private async generateDay(
    recipesByMeal: Record<MealType, RecipeWithItems[]>,
    targets: { calories: number; protein: number; fat: number; carbs: number },
    preferSimple: boolean,
    existingDays: DayPlan[],
    inventory: InventoryItem[] = []
  ): Promise<DayPlan> {
    // Целевые соотношения БЖУ (в % от калорий)
    const targetFatRatio = (targets.fat * 9) / targets.calories;      // ~18% для похудения
    const targetCarbsRatio = (targets.carbs * 4) / targets.calories;  // ~54% для похудения
    const targetProteinRatio = (targets.protein * 4) / targets.calories; // ~28% для похудения

    // Целевые калории для каждого приёма пищи
    const mealTargetCalories = {
      breakfast: targets.calories * MEAL_DISTRIBUTION.breakfast,
      lunch: targets.calories * MEAL_DISTRIBUTION.lunch,
      dinner: targets.calories * MEAL_DISTRIBUTION.dinner,
      snack: targets.calories * MEAL_DISTRIBUTION.snack,
    };

    // Пробуем несколько комбинаций и выбираем лучшую
    let bestDayPlan: DayPlan | null = null;
    let bestScore = Infinity;
    const MAX_ATTEMPTS = 10;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      // Выбираем рецепты случайно (с учётом разнообразия и инвентаря)
      const breakfast = this.selectRecipeWithBJURatio(
        recipesByMeal.breakfast,
        targetFatRatio,
        targetCarbsRatio,
        preferSimple,
        existingDays.map(d => d.breakfast.id),
        inventory
      );

      const lunch = this.selectRecipeWithBJURatio(
        recipesByMeal.lunch,
        targetFatRatio,
        targetCarbsRatio,
        preferSimple,
        existingDays.map(d => d.lunch.id),
        inventory
      );

      const dinner = this.selectRecipeWithBJURatio(
        recipesByMeal.dinner,
        targetFatRatio,
        targetCarbsRatio,
        preferSimple,
        existingDays.map(d => d.dinner.id),
        inventory
      );

      const snack = this.selectRecipeWithBJURatio(
        recipesByMeal.snack,
        targetFatRatio,
        targetCarbsRatio,
        preferSimple,
        existingDays.map(d => d.snack.id),
        inventory
      );

      // Рассчитываем КБЖУ базовых рецептов
      const breakfastNutrition = this.calculateRecipeNutrition(breakfast);
      const lunchNutrition = this.calculateRecipeNutrition(lunch);
      const dinnerNutrition = this.calculateRecipeNutrition(dinner);
      const snackNutrition = this.calculateRecipeNutrition(snack);

      // Рассчитываем порции по КАЛОРИЯМ
      const breakfastPortion = this.calculatePortionByCalories(breakfastNutrition.calories, mealTargetCalories.breakfast);
      const lunchPortion = this.calculatePortionByCalories(lunchNutrition.calories, mealTargetCalories.lunch);
      const dinnerPortion = this.calculatePortionByCalories(dinnerNutrition.calories, mealTargetCalories.dinner);
      const snackPortion = this.calculatePortionByCalories(snackNutrition.calories, mealTargetCalories.snack);

      // Итоговые БЖУ дня
      const totalCalories =
        breakfastNutrition.calories * breakfastPortion +
        lunchNutrition.calories * lunchPortion +
        dinnerNutrition.calories * dinnerPortion +
        snackNutrition.calories * snackPortion;

      const totalProtein =
        breakfastNutrition.protein * breakfastPortion +
        lunchNutrition.protein * lunchPortion +
        dinnerNutrition.protein * dinnerPortion +
        snackNutrition.protein * snackPortion;

      const totalFat =
        breakfastNutrition.fat * breakfastPortion +
        lunchNutrition.fat * lunchPortion +
        dinnerNutrition.fat * dinnerPortion +
        snackNutrition.fat * snackPortion;

      const totalCarbs =
        breakfastNutrition.carbs * breakfastPortion +
        lunchNutrition.carbs * lunchPortion +
        dinnerNutrition.carbs * dinnerPortion +
        snackNutrition.carbs * snackPortion;

      // Оцениваем отклонение от целевых БЖУ
      // Жиры важнее всего для похудения, потом углеводы
      const fatDeviation = Math.abs(totalFat - targets.fat) / targets.fat;
      const carbsDeviation = Math.abs(totalCarbs - targets.carbs) / targets.carbs;
      const proteinDeviation = Math.abs(totalProtein - targets.protein) / targets.protein;

      // Взвешенная оценка: жиры х3, углеводы х2, белки х1
      const score = fatDeviation * 3 + carbsDeviation * 2 + proteinDeviation;

      if (score < bestScore) {
        bestScore = score;
        bestDayPlan = {
          breakfast: { ...breakfast, portion: breakfastPortion, nutrition: breakfastNutrition },
          lunch: { ...lunch, portion: lunchPortion, nutrition: lunchNutrition },
          dinner: { ...dinner, portion: dinnerPortion, nutrition: dinnerNutrition },
          snack: { ...snack, portion: snackPortion, nutrition: snackNutrition },
          totalCalories: Math.round(totalCalories),
          totalProtein: Math.round(totalProtein),
          totalFat: Math.round(totalFat),
          totalCarbs: Math.round(totalCarbs),
        } as DayPlan;
      }

      // Если отклонение меньше 20% - достаточно хорошо
      if (score < 0.6) break;
    }

    return bestDayPlan!;
  }

  /**
   * Выбор рецепта с учётом соотношения БЖУ и инвентаря
   */
  private selectRecipeWithBJURatio(
    recipes: RecipeWithItems[],
    targetFatRatio: number,
    targetCarbsRatio: number,
    preferSimple: boolean,
    recentlyUsedIds: string[],
    inventory: InventoryItem[] = []
  ): RecipeWithItems {
    if (recipes.length === 0) {
      throw new Error('No recipes available for meal type');
    }

    // Берём только последние 6 использованных
    const last6Used = recentlyUsedIds.slice(-6);
    let availableRecipes = recipes.filter(r => !last6Used.includes(r.id));

    if (availableRecipes.length === 0) {
      availableRecipes = recipes;
    }

    // Рассчитываем БЖУ соотношение и покрытие инвентарём для каждого рецепта
    const recipesWithRatio = availableRecipes.map(r => {
      const nutrition = this.calculateRecipeNutrition(r);
      const totalCals = nutrition.calories || 1;
      const fatRatio = (nutrition.fat * 9) / totalCals;
      const carbsRatio = (nutrition.carbs * 4) / totalCals;

      // Оценка близости к целевому соотношению
      const fatDiff = Math.abs(fatRatio - targetFatRatio);
      const carbsDiff = Math.abs(carbsRatio - targetCarbsRatio);
      let score = fatDiff * 2 + carbsDiff; // Жиры важнее

      // Бонус за использование продуктов из инвентаря (если инвентарь не пустой)
      let inventoryCoverage = 0;
      if (inventory.length > 0) {
        inventoryCoverage = this.calculateInventoryCoverage(r, inventory);
        // Чем больше покрытие инвентарём, тем меньше score (лучше)
        // Покрытие 100% даёт бонус -0.5 к score
        score -= inventoryCoverage * 0.5;
      }

      return { recipe: r, score, nutrition, inventoryCoverage };
    });

    // Перемешиваем для разнообразия
    this.shuffleArray(recipesWithRatio);

    // Сортируем по близости к целевому соотношению (с учётом инвентаря)
    recipesWithRatio.sort((a, b) => {
      let scoreA = a.score;
      let scoreB = b.score;

      if (preferSimple) {
        scoreA += (a.recipe.complexity === 'simple' ? 0 : 0.1);
        scoreB += (b.recipe.complexity === 'simple' ? 0 : 0.1);
      }

      return scoreA - scoreB;
    });

    // Выбираем из топ-5 случайно
    const topRecipes = recipesWithRatio.slice(0, Math.min(5, recipesWithRatio.length));
    return topRecipes[Math.floor(Math.random() * topRecipes.length)].recipe;
  }

  /**
   * Расчёт порции по КАЛОРИЯМ
   * Калории - главный показатель для контроля веса
   */
  private calculatePortionByCalories(recipeCalories: number, targetCalories: number): number {
    if (recipeCalories <= 0) return 1.0;

    const portion = targetCalories / recipeCalories;

    // Округляем до 0.1 для читаемости
    return Math.round(portion * 10) / 10;
  }

  /**
   * Выбор рецепта для приёма пищи (по калориям)
   * Рецепт не должен повторяться в течение 7 дней
   */
  private selectRecipe(
    recipes: RecipeWithItems[],
    targetCalories: number,
    preferSimple: boolean,
    recentlyUsedIds: string[] // ID рецептов за последние 6 дней
  ): RecipeWithItems {
    if (recipes.length === 0) {
      throw new Error('No recipes available for meal type');
    }

    // Берём только последние 6 использованных (чтобы не повторяться 7 дней)
    const last6Used = recentlyUsedIds.slice(-6);

    // Фильтруем рецепты которые НЕ использовались последние 6 дней
    let availableRecipes = recipes.filter(r => !last6Used.includes(r.id));

    // Если все рецепты использованы за последние 6 дней, берём наименее недавние
    if (availableRecipes.length === 0) {
      // Берём рецепты которые использовались раньше всех
      const oldestUsed = recentlyUsedIds.slice(0, Math.max(1, recentlyUsedIds.length - 3));
      availableRecipes = recipes.filter(r => oldestUsed.includes(r.id));

      // Если всё ещё пусто, берём все
      if (availableRecipes.length === 0) {
        availableRecipes = recipes;
      }
    }

    // Рассчитываем калории для каждого рецепта из ингредиентов
    const recipesWithCalories = availableRecipes.map(r => {
      const nutrition = this.calculateRecipeNutrition(r);
      return { recipe: r, calories: nutrition.calories };
    });

    // Перемешиваем для случайности
    this.shuffleArray(recipesWithCalories);

    // Сортируем по близости калорий к целевым
    recipesWithCalories.sort((a, b) => {
      const diffA = Math.abs(a.calories - targetCalories);
      const diffB = Math.abs(b.calories - targetCalories);

      // Если предпочитаем простые - учитываем сложность
      if (preferSimple) {
        const complexityWeight = 50; // вес сложности (в ккал)
        return (diffA + (a.recipe.complexity === 'simple' ? 0 : complexityWeight)) -
               (diffB + (b.recipe.complexity === 'simple' ? 0 : complexityWeight));
      }

      return diffA - diffB;
    });

    // Выбираем из топ-5 случайно (больше разнообразия)
    const topRecipes = recipesWithCalories.slice(0, Math.min(5, recipesWithCalories.length));
    return topRecipes[Math.floor(Math.random() * topRecipes.length)].recipe;
  }

  /**
   * Перемешивание массива (Fisher-Yates)
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Расчёт КБЖУ рецепта из ингредиентов
   */
  private calculateRecipeNutrition(recipe: RecipeWithItems): { calories: number; protein: number; fat: number; carbs: number } {
    // Проверяем что items - это массив с реальными данными
    // PostgreSQL json_agg возвращает массив напрямую, но нужно убедиться
    let rawItems = recipe.items;

    // Если items - строка, парсим её
    if (typeof rawItems === 'string') {
      try {
        rawItems = JSON.parse(rawItems);
      } catch {
        rawItems = [];
      }
    }

    const items = Array.isArray(rawItems) ? rawItems.filter(item => item && item.product) : [];

    if (items.length === 0) {
      return {
        calories: recipe.cached_calories || 0,
        protein: recipe.cached_protein || 0,
        fat: recipe.cached_fat || 0,
        carbs: recipe.cached_carbs || 0,
      };
    }

    const nutrition = items.reduce((acc, item) => {
      const product = item.product;
      const ratio = (item.amount_grams || 0) / 100;
      return {
        calories: acc.calories + ((product.calories || 0) * ratio),
        protein: acc.protein + ((product.protein || 0) * ratio),
        fat: acc.fat + ((product.fat || 0) * ratio),
        carbs: acc.carbs + ((product.carbs || 0) * ratio),
      };
    }, { calories: 0, protein: 0, fat: 0, carbs: 0 });

    return nutrition;
  }

  /**
   * Сохранение дня плана в БД
   */
  private async saveDayPlan(
    mealPlanId: string,
    weekNumber: number,
    dayNumber: number,
    dayPlan: DayPlan
  ): Promise<void> {
    // Создаём запись дня
    const dayResult = await this.pool.query(`
      INSERT INTO meal_days (
        meal_plan_id, week_number, day_number,
        total_calories, total_protein, total_fat, total_carbs
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      mealPlanId, weekNumber, dayNumber,
      dayPlan.totalCalories, dayPlan.totalProtein, dayPlan.totalFat, dayPlan.totalCarbs
    ]);

    const mealDayId = dayResult.rows[0].id;

    // Сохраняем приёмы пищи
    const meals = [
      { type: 'breakfast', recipe: dayPlan.breakfast },
      { type: 'lunch', recipe: dayPlan.lunch },
      { type: 'dinner', recipe: dayPlan.dinner },
      { type: 'snack', recipe: dayPlan.snack },
    ];

    for (const meal of meals) {
      // Получаем точную порцию для соответствия целевым БЖУ
      const portion = (meal.recipe as any).portion || 1;

      const nutrition = (meal.recipe as any).nutrition || {
        calories: meal.recipe.cached_calories || 0,
        protein: meal.recipe.cached_protein || 0,
        fat: meal.recipe.cached_fat || 0,
        carbs: meal.recipe.cached_carbs || 0,
      };

      await this.pool.query(`
        INSERT INTO meals (
          meal_day_id, recipe_id, meal_type, portion_multiplier,
          calories, protein, fat, carbs
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        mealDayId,
        meal.recipe.id,
        meal.type,
        portion,
        Math.round(nutrition.calories * portion),
        Math.round(nutrition.protein * portion),
        Math.round(nutrition.fat * portion),
        Math.round(nutrition.carbs * portion),
      ]);
    }
  }

  /**
   * Обновление средних значений КБЖУ плана
   */
  private async updateMealPlanAverages(mealPlanId: string, days: DayPlan[]): Promise<void> {
    const avgCalories = days.reduce((sum, d) => sum + d.totalCalories, 0) / days.length;
    const avgProtein = days.reduce((sum, d) => sum + d.totalProtein, 0) / days.length;
    const avgFat = days.reduce((sum, d) => sum + d.totalFat, 0) / days.length;
    const avgCarbs = days.reduce((sum, d) => sum + d.totalCarbs, 0) / days.length;

    await this.pool.query(`
      UPDATE meal_plans
      SET avg_calories = $1, avg_protein = $2, avg_fat = $3, avg_carbs = $4
      WHERE id = $5
    `, [
      Math.round(avgCalories),
      Math.round(avgProtein),
      Math.round(avgFat),
      Math.round(avgCarbs),
      mealPlanId
    ]);
  }

  /**
   * Генерация списка покупок (с учётом инвентаря если userId передан)
   */
  private async generateShoppingList(mealPlanId: string, weeks: number, userId?: string): Promise<void> {
    // Агрегируем все продукты из всех приёмов пищи
    const result = await this.pool.query(`
      SELECT
        ri.product_id,
        p.is_perishable,
        SUM(ri.amount_grams * m.portion_multiplier) as total_grams,
        array_agg(DISTINCT md.week_number) as week_numbers
      FROM meals m
      JOIN meal_days md ON m.meal_day_id = md.id
      JOIN recipe_items ri ON m.recipe_id = ri.recipe_id
      JOIN products p ON ri.product_id = p.id
      WHERE md.meal_plan_id = $1
      GROUP BY ri.product_id, p.is_perishable
    `, [mealPlanId]);

    // Если есть userId - получаем инвентарь для вычитания
    let inventoryMap = new Map<string, number>();
    if (userId) {
      const inventoryResult = await this.pool.query(`
        SELECT product_id, quantity_grams
        FROM user_inventory
        WHERE user_id = $1 AND quantity_grams > 0
      `, [userId]);
      for (const item of inventoryResult.rows) {
        inventoryMap.set(item.product_id, parseFloat(item.quantity_grams) || 0);
      }
      console.log(`[MealPlanGenerator] Subtracting inventory: ${inventoryMap.size} items`);
    }

    // Сохраняем в shopping_list
    for (const row of result.rows) {
      const isMonthly = !row.is_perishable; // Не портящиеся покупаем раз в месяц
      let totalGrams = parseFloat(row.total_grams);

      // Вычитаем то что есть в инвентаре
      const haveInInventory = inventoryMap.get(row.product_id) || 0;
      totalGrams = Math.max(0, totalGrams - haveInInventory);

      // Не добавляем продукты которые уже есть в достаточном количестве
      if (totalGrams <= 0) {
        continue;
      }

      await this.pool.query(`
        INSERT INTO shopping_list_items (
          meal_plan_id, product_id, total_grams, is_monthly, week_numbers
        )
        VALUES ($1, $2, $3, $4, $5)
      `, [
        mealPlanId,
        row.product_id,
        Math.ceil(totalGrams),
        isMonthly,
        row.week_numbers
      ]);
    }
  }
}
