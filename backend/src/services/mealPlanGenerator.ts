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
    const result = await this.pool.query(`
      SELECT
        r.*,
        json_agg(
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
          )
        ) as items
      FROM recipes r
      JOIN recipe_items ri ON r.id = ri.recipe_id
      JOIN products p ON ri.product_id = p.id
      WHERE r.is_active = true
        AND p.is_active = true
        -- Исключаем рецепты с продуктами в user exclusions
        AND NOT EXISTS (
          SELECT 1 FROM user_excluded_products uep
          WHERE uep.user_id = $1 AND uep.product_id = ri.product_id
        )
        -- Исключаем рецепты с тегами в user exclusions
        AND NOT EXISTS (
          SELECT 1 FROM product_tags pt
          JOIN user_excluded_tags uet ON pt.tag_id = uet.tag_id
          WHERE uet.user_id = $1 AND pt.product_id = ri.product_id
        )
      GROUP BY r.id
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
   */
  private async generateDay(
    recipesByMeal: Record<MealType, RecipeWithItems[]>,
    targets: { calories: number; protein: number; fat: number; carbs: number },
    preferSimple: boolean,
    existingDays: DayPlan[]
  ): Promise<DayPlan> {
    // Целевые калории для каждого приёма пищи
    const targetCalories = {
      breakfast: targets.calories * MEAL_DISTRIBUTION.breakfast,
      lunch: targets.calories * MEAL_DISTRIBUTION.lunch,
      dinner: targets.calories * MEAL_DISTRIBUTION.dinner,
      snack: targets.calories * MEAL_DISTRIBUTION.snack,
    };

    // Выбираем рецепты для каждого приёма пищи
    const breakfast = this.selectRecipe(
      recipesByMeal.breakfast,
      targetCalories.breakfast,
      preferSimple,
      existingDays.map(d => d.breakfast.id)
    );

    const lunch = this.selectRecipe(
      recipesByMeal.lunch,
      targetCalories.lunch,
      preferSimple,
      existingDays.map(d => d.lunch.id)
    );

    const dinner = this.selectRecipe(
      recipesByMeal.dinner,
      targetCalories.dinner,
      preferSimple,
      existingDays.map(d => d.dinner.id)
    );

    const snack = this.selectRecipe(
      recipesByMeal.snack,
      targetCalories.snack,
      preferSimple,
      existingDays.map(d => d.snack.id)
    );

    // Рассчитываем порции для точного попадания в КБЖУ
    const breakfastPortion = this.calculatePortion(breakfast, targetCalories.breakfast);
    const lunchPortion = this.calculatePortion(lunch, targetCalories.lunch);
    const dinnerPortion = this.calculatePortion(dinner, targetCalories.dinner);
    const snackPortion = this.calculatePortion(snack, targetCalories.snack);

    // Итоговые КБЖУ дня
    const totalCalories =
      (breakfast.cached_calories || 0) * breakfastPortion +
      (lunch.cached_calories || 0) * lunchPortion +
      (dinner.cached_calories || 0) * dinnerPortion +
      (snack.cached_calories || 0) * snackPortion;

    const totalProtein =
      (breakfast.cached_protein || 0) * breakfastPortion +
      (lunch.cached_protein || 0) * lunchPortion +
      (dinner.cached_protein || 0) * dinnerPortion +
      (snack.cached_protein || 0) * snackPortion;

    const totalFat =
      (breakfast.cached_fat || 0) * breakfastPortion +
      (lunch.cached_fat || 0) * lunchPortion +
      (dinner.cached_fat || 0) * dinnerPortion +
      (snack.cached_fat || 0) * snackPortion;

    const totalCarbs =
      (breakfast.cached_carbs || 0) * breakfastPortion +
      (lunch.cached_carbs || 0) * lunchPortion +
      (dinner.cached_carbs || 0) * dinnerPortion +
      (snack.cached_carbs || 0) * snackPortion;

    return {
      breakfast: { ...breakfast, portion: breakfastPortion },
      lunch: { ...lunch, portion: lunchPortion },
      dinner: { ...dinner, portion: dinnerPortion },
      snack: { ...snack, portion: snackPortion },
      totalCalories: Math.round(totalCalories),
      totalProtein: Math.round(totalProtein),
      totalFat: Math.round(totalFat),
      totalCarbs: Math.round(totalCarbs),
    } as DayPlan;
  }

  /**
   * Выбор рецепта для приёма пищи
   */
  private selectRecipe(
    recipes: RecipeWithItems[],
    targetCalories: number,
    preferSimple: boolean,
    usedRecipeIds: string[]
  ): RecipeWithItems {
    if (recipes.length === 0) {
      throw new Error('No recipes available for meal type');
    }

    // Фильтруем неиспользованные рецепты (для разнообразия)
    let availableRecipes = recipes.filter(r => !usedRecipeIds.includes(r.id));

    // Если все рецепты уже использованы, берём все
    if (availableRecipes.length === 0) {
      availableRecipes = recipes;
    }

    // Сортируем по близости калорий к целевым
    availableRecipes.sort((a, b) => {
      const diffA = Math.abs((a.cached_calories || 0) - targetCalories);
      const diffB = Math.abs((b.cached_calories || 0) - targetCalories);

      // Если предпочитаем простые - учитываем сложность
      if (preferSimple) {
        const complexityWeight = 100; // вес сложности
        return (diffA + (a.complexity === 'simple' ? 0 : complexityWeight)) -
               (diffB + (b.complexity === 'simple' ? 0 : complexityWeight));
      }

      return diffA - diffB;
    });

    // Выбираем из топ-3 случайно (для разнообразия)
    const topRecipes = availableRecipes.slice(0, Math.min(3, availableRecipes.length));
    return topRecipes[Math.floor(Math.random() * topRecipes.length)];
  }

  /**
   * Расчёт множителя порции для попадания в целевые калории
   */
  private calculatePortion(recipe: RecipeWithItems, targetCalories: number): number {
    const recipeCalories = recipe.cached_calories || 1;
    const portion = targetCalories / recipeCalories;

    // Ограничиваем порцию в пределах min_portion и max_portion
    return Math.max(
      recipe.min_portion,
      Math.min(recipe.max_portion, Math.round(portion * 10) / 10)
    );
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
      const portion = (meal.recipe as any).portion || 1;
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
        Math.round((meal.recipe.cached_calories || 0) * portion),
        Math.round((meal.recipe.cached_protein || 0) * portion),
        Math.round((meal.recipe.cached_fat || 0) * portion),
        Math.round((meal.recipe.cached_carbs || 0) * portion),
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
