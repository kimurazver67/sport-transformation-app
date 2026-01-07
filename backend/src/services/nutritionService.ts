import { UserGoal } from '../types';

export interface NutritionPlan {
  calories: number;
  protein: number;  // Белки (г)
  fat: number;      // Жиры (г)
  carbs: number;    // Углеводы (г)
  goal: UserGoal;
  weight: number;
}

/**
 * Расчёт КБЖУ по цели участника
 *
 * Похудение:
 * - Ккал = Вес × 29
 * - Б = Вес × 2
 * - Ж = 50 (фикс)
 * - У = (Ккал − Б×4 − 450) ÷ 4
 *
 * Набор массы:
 * - Ккал = Вес × 36 + 500
 * - Б = Вес × 2
 * - Ж = Вес × 1
 * - У = (Ккал − Б×4 − Ж×9) ÷ 4
 */
export function calculateNutrition(weight: number, goal: UserGoal): NutritionPlan {
  // Валидация веса
  if (!weight || weight <= 0 || weight > 500) {
    throw new Error('Invalid weight: must be between 1 and 500 kg');
  }

  let calories: number;
  let protein: number;
  let fat: number;
  let carbs: number;

  if (goal === 'weight_loss') {
    // Похудение
    calories = Math.round(weight * 29);
    protein = Math.round(weight * 2);
    fat = 50; // фиксированное значение
    carbs = Math.round((calories - protein * 4 - 450) / 4);
  } else {
    // Набор массы (muscle_gain)
    const baseCalories = Math.round(weight * 36);
    calories = baseCalories + 500; // +500 ккал к базовому минимуму
    protein = Math.round(weight * 2);
    fat = Math.round(weight * 1);
    // Углеводы рассчитываются от итоговой калорийности (без доп. +150г)
    carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  }

  // Защита от отрицательных значений
  carbs = Math.max(0, carbs);

  return {
    calories,
    protein,
    fat,
    carbs,
    goal,
    weight
  };
}

export const nutritionService = {
  calculate: calculateNutrition
};
