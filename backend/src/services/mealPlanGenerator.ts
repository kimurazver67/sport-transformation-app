// backend/src/services/mealPlanGenerator.ts

import { Pool } from 'pg';
import { UserGoal, MealType, Recipe, Product, RecipeItem, MealPlan } from '../types';
import { nutritionService } from './nutritionService';

interface GenerateMealPlanParams {
  userId: string;
  weeks: number;
  allowRepeatDays: number;
  preferSimple: boolean;
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
    const { userId, weeks, allowRepeatDays, preferSimple } = params;

    // 1. Получаем данные пользователя
    const user = await this.getUserData(userId);
    if (!user) throw new Error('User not found');

    // 2. Рассчитываем целевые КБЖУ
    const targets = nutritionService.calculate(user.start_weight, user.goal);

    // 3. Получаем доступные рецепты (исключая user exclusions)
    const availableRecipes = await this.getAvailableRecipes(userId, user.goal);

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
        dayPlan = await this.generateDay(recipesByMeal, targets, preferSimple, generatedDays);
      }

      // Сохраняем день в БД
      await this.saveDayPlan(mealPlanId, weekNumber, dayNumber, dayPlan);

      generatedDays.push(dayPlan);
    }

    // 7. Обновляем средние значения КБЖУ плана
    await this.updateMealPlanAverages(mealPlanId, generatedDays);

    // 8. Генерируем список покупок
    await this.generateShoppingList(mealPlanId, weeks);

    return mealPlanId;
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
   * Порции рассчитываются так, чтобы СУММА ЗА ДЕНЬ точно соответствовала целевым БЖУ
   */
  private async generateDay(
    recipesByMeal: Record<MealType, RecipeWithItems[]>,
    targets: { calories: number; protein: number; fat: number; carbs: number },
    preferSimple: boolean,
    existingDays: DayPlan[]
  ): Promise<DayPlan> {
    // Целевые БЖУ для каждого приёма пищи
    const mealTargets = {
      breakfast: {
        protein: targets.protein * MEAL_DISTRIBUTION.breakfast,
        fat: targets.fat * MEAL_DISTRIBUTION.breakfast,
        carbs: targets.carbs * MEAL_DISTRIBUTION.breakfast,
        calories: targets.calories * MEAL_DISTRIBUTION.breakfast,
      },
      lunch: {
        protein: targets.protein * MEAL_DISTRIBUTION.lunch,
        fat: targets.fat * MEAL_DISTRIBUTION.lunch,
        carbs: targets.carbs * MEAL_DISTRIBUTION.lunch,
        calories: targets.calories * MEAL_DISTRIBUTION.lunch,
      },
      dinner: {
        protein: targets.protein * MEAL_DISTRIBUTION.dinner,
        fat: targets.fat * MEAL_DISTRIBUTION.dinner,
        carbs: targets.carbs * MEAL_DISTRIBUTION.dinner,
        calories: targets.calories * MEAL_DISTRIBUTION.dinner,
      },
      snack: {
        protein: targets.protein * MEAL_DISTRIBUTION.snack,
        fat: targets.fat * MEAL_DISTRIBUTION.snack,
        carbs: targets.carbs * MEAL_DISTRIBUTION.snack,
        calories: targets.calories * MEAL_DISTRIBUTION.snack,
      },
    };

    // Выбираем рецепты для каждого приёма пищи
    const breakfast = this.selectRecipe(
      recipesByMeal.breakfast,
      mealTargets.breakfast.protein,
      preferSimple,
      existingDays.map(d => d.breakfast.id)
    );

    const lunch = this.selectRecipe(
      recipesByMeal.lunch,
      mealTargets.lunch.protein,
      preferSimple,
      existingDays.map(d => d.lunch.id)
    );

    const dinner = this.selectRecipe(
      recipesByMeal.dinner,
      mealTargets.dinner.protein,
      preferSimple,
      existingDays.map(d => d.dinner.id)
    );

    const snack = this.selectRecipe(
      recipesByMeal.snack,
      mealTargets.snack.protein,
      preferSimple,
      existingDays.map(d => d.snack.id)
    );

    // Рассчитываем КБЖУ базовых рецептов (порция = 1)
    const breakfastNutrition = this.calculateRecipeNutrition(breakfast);
    const lunchNutrition = this.calculateRecipeNutrition(lunch);
    const dinnerNutrition = this.calculateRecipeNutrition(dinner);
    const snackNutrition = this.calculateRecipeNutrition(snack);

    // Рассчитываем порции чтобы ТОЧНО попасть в целевой БЕЛОК
    // Белок - главный показатель, остальные подстроятся
    const breakfastPortion = this.calculateExactPortion(breakfastNutrition.protein, mealTargets.breakfast.protein);
    const lunchPortion = this.calculateExactPortion(lunchNutrition.protein, mealTargets.lunch.protein);
    const dinnerPortion = this.calculateExactPortion(dinnerNutrition.protein, mealTargets.dinner.protein);
    const snackPortion = this.calculateExactPortion(snackNutrition.protein, mealTargets.snack.protein);

    // Итоговые КБЖУ дня с учётом порций
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

    return {
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

  /**
   * Расчёт точной порции для достижения целевого значения
   * Без жёстких ограничений - порция может быть любой для точного соответствия БЖУ
   */
  private calculateExactPortion(recipeValue: number, targetValue: number): number {
    if (recipeValue <= 0) return 1.0;

    const portion = targetValue / recipeValue;

    // Округляем до 0.1 для читаемости
    return Math.round(portion * 10) / 10;
  }

  /**
   * Выбор рецепта для приёма пищи (по белку)
   * Рецепт не должен повторяться в течение 7 дней
   */
  private selectRecipe(
    recipes: RecipeWithItems[],
    targetProtein: number,
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

    // Рассчитываем белок для каждого рецепта из ингредиентов
    const recipesWithProtein = availableRecipes.map(r => {
      const protein = this.calculateRecipeProtein(r);
      return { recipe: r, protein };
    });

    // Перемешиваем для случайности
    this.shuffleArray(recipesWithProtein);

    // Сортируем по близости белка к целевому (но с элементом случайности)
    recipesWithProtein.sort((a, b) => {
      const diffA = Math.abs(a.protein - targetProtein);
      const diffB = Math.abs(b.protein - targetProtein);

      // Если предпочитаем простые - учитываем сложность
      if (preferSimple) {
        const complexityWeight = 5; // вес сложности (в граммах белка)
        return (diffA + (a.recipe.complexity === 'simple' ? 0 : complexityWeight)) -
               (diffB + (b.recipe.complexity === 'simple' ? 0 : complexityWeight));
      }

      return diffA - diffB;
    });

    // Выбираем из топ-5 случайно (больше разнообразия)
    const topRecipes = recipesWithProtein.slice(0, Math.min(5, recipesWithProtein.length));
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
   * Расчёт белка рецепта из ингредиентов
   */
  private calculateRecipeProtein(recipe: RecipeWithItems): number {
    if (!recipe.items || recipe.items.length === 0) {
      return recipe.cached_protein || 0;
    }

    return recipe.items.reduce((sum, item) => {
      const product = item.product;
      if (!product) return sum;
      // protein на 100г, amount_grams - граммы
      return sum + (product.protein * item.amount_grams / 100);
    }, 0);
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
   * Генерация списка покупок
   */
  private async generateShoppingList(mealPlanId: string, weeks: number): Promise<void> {
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

    // Сохраняем в shopping_list
    for (const row of result.rows) {
      const isMonthly = !row.is_perishable; // Не портящиеся покупаем раз в месяц

      await this.pool.query(`
        INSERT INTO shopping_list_items (
          meal_plan_id, product_id, total_grams, is_monthly, week_numbers
        )
        VALUES ($1, $2, $3, $4, $5)
      `, [
        mealPlanId,
        row.product_id,
        Math.ceil(row.total_grams),
        isMonthly,
        row.week_numbers
      ]);
    }
  }
}
