// ===== РОЛИ ПОЛЬЗОВАТЕЛЕЙ =====
export type UserRole = 'participant' | 'trainer';

// ===== ЦЕЛИ УЧАСТНИКА =====
export type UserGoal = 'weight_loss' | 'muscle_gain';

// ===== ТИПЫ ТРЕНИРОВОК =====
export type WorkoutType = 'strength' | 'cardio' | 'rest';

// ===== НАСТРОЕНИЕ (1-5) =====
export type MoodLevel = 1 | 2 | 3 | 4 | 5;

// ===== ТИПЫ ДОСТИЖЕНИЙ =====
export type AchievementType =
  | 'first_week'           // 7 чекинов подряд
  | 'iron_discipline'      // 30 дней без пропусков
  | 'minus_5kg'            // Потеря 5 кг от старта
  | 'progress_visible'     // Фото 4 недели подряд
  | 'week_leader';         // Топ-1 по очкам за неделю

// ===== ПОЛЬЗОВАТЕЛЬ =====
export interface User {
  id: string;
  telegram_id: number;
  username?: string;
  first_name: string;
  last_name?: string;
  role: UserRole;
  goal?: UserGoal;
  start_weight?: number;
  target_weight?: number;
  height?: number;
  age?: number;
  avatar_file_id?: string;
  measurement_unlocked_until?: string;
  created_at: string;
  updated_at: string;
}

// ===== ЕЖЕДНЕВНЫЙ ЧЕКИН =====
export interface DailyCheckin {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  workout: boolean;
  workout_type?: WorkoutType;
  nutrition: boolean;
  water: boolean;
  water_liters?: number;
  sleep_hours: number;
  mood: MoodLevel;
  steps?: number;
  created_at: string;
}

// ===== ЕЖЕНЕДЕЛЬНЫЕ ЗАМЕРЫ =====
export interface WeeklyMeasurement {
  id: string;
  user_id: string;
  week_number: number;
  date: string;
  weight: number;
  chest?: number;
  waist?: number;
  hips?: number;
  bicep_left?: number;
  bicep_right?: number;
  thigh_left?: number;
  thigh_right?: number;
  body_fat_percent?: number;
  photo_front_file_id?: string;
  photo_side_file_id?: string;
  photo_back_file_id?: string;
  created_at: string;
}

// ===== ЗАДАНИЯ НЕДЕЛИ =====
export interface Task {
  id: string;
  week_number: number;
  title: string;
  description?: string;
  goal?: UserGoal; // null = для всех, иначе только для указанной цели
  is_bonus?: boolean;
  created_at: string;
}

// ===== КОНЦЕПЦИИ НЕДЕЛИ =====
export interface WeeklyConcept {
  id: string;
  week_number: number;
  title: string;
  content: string;
  goal?: UserGoal; // null = для всех
  created_at: string;
}

// ===== ВЫПОЛНЕНИЕ ЗАДАНИЙ =====
export interface TaskCompletion {
  id: string;
  user_id: string;
  task_id: string;
  completed_at: string;
}

// ===== ДНЕВНИК ОСОЗНАННОСТИ =====
export interface MindfulnessEntry {
  id: string;
  user_id: string;
  date: string;
  gratitude?: string; // За что благодарен
  wins?: string; // Маленькие победы
  challenges?: string; // Трудности
  lessons?: string; // Уроки
  mood_note?: string; // Заметка о настроении
  created_at: string;
  updated_at: string;
}

// ===== ТРЕКЕР ИМПУЛЬСОВ =====
export type ImpulseTrigger = 'stress' | 'boredom' | 'social' | 'emotional' | 'habitual';
export type ImpulseAction = 'resisted' | 'gave_in' | 'alternative';

export interface ImpulseLog {
  id: string;
  user_id: string;
  logged_at: string;
  trigger_type: ImpulseTrigger;
  intensity: number; // 1-10
  action_taken: ImpulseAction;
  notes?: string;
  created_at: string;
}

// ===== ДОСТИЖЕНИЯ =====
export interface Achievement {
  id: string;
  user_id: string;
  achievement_type: AchievementType;
  unlocked_at: string;
}

// ===== СТАТИСТИКА УЧАСТНИКА =====
export interface UserStats {
  user_id: string;
  current_streak: number;
  max_streak: number;
  total_points: number;
  weekly_points: number;
  total_checkins: number;
  total_measurements: number;
  tasks_completed: number;
  rank_overall: number;
  rank_weekly: number;
}

// ===== РЕЙТИНГ =====
export interface LeaderboardEntry {
  user_id: string;
  user: User;
  total_points: number;
  weekly_points: number;
  current_streak: number;
  rank: number;
}

// ===== ОЧКИ =====
export const POINTS = {
  DAILY_CHECKIN: 10,
  WEEKLY_MEASUREMENT: 20,
  TASK_COMPLETED: 15,
  STREAK_BONUS_7: 5,
  STREAK_BONUS_14: 10,
  STREAK_BONUS_30: 20,
  // Бонусы за еженедельный прогресс (по проценту изменения)
  PROGRESS_MINIMAL: 10,      // 0.5-1% изменения
  PROGRESS_GOOD: 25,         // 1-2% изменения
  PROGRESS_EXCELLENT: 50,    // 2-3% изменения
  PROGRESS_OUTSTANDING: 100, // >3% изменения
} as const;

// ===== ГРАДАЦИЯ ПРОГРЕССА =====
export const PROGRESS_TIERS = [
  { minPercent: 3.0, points: 100, label: 'Невероятный прогресс!', emoji: '🔥' },
  { minPercent: 2.0, points: 50, label: 'Отличный прогресс!', emoji: '⭐' },
  { minPercent: 1.0, points: 25, label: 'Хороший прогресс!', emoji: '💪' },
  { minPercent: 0.5, points: 10, label: 'Есть прогресс!', emoji: '✨' },
] as const;

// ===== ДОСТИЖЕНИЯ КОНФИГ =====
export const ACHIEVEMENTS_CONFIG: Record<AchievementType, {
  title: string;
  description: string;
  icon: string;
}> = {
  first_week: {
    title: 'Первая неделя',
    description: '7 чекинов подряд',
    icon: '🏃'
  },
  iron_discipline: {
    title: 'Железная дисциплина',
    description: '30 дней без пропусков',
    icon: '💪'
  },
  minus_5kg: {
    title: 'Минус 5 кг',
    description: 'Потеря 5 кг от старта',
    icon: '⚖️'
  },
  progress_visible: {
    title: 'Прогресс виден',
    description: 'Фото 4 недели подряд',
    icon: '📸'
  },
  week_leader: {
    title: 'Лидер недели',
    description: 'Топ-1 по очкам за неделю',
    icon: '🏆'
  }
};

// ===== API ОТВЕТЫ =====
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ===== ФОРМЫ ДЛЯ FRONTEND =====
export interface CheckinForm {
  workout: boolean;
  workout_type?: WorkoutType;
  nutrition: boolean;
  water: boolean;
  water_liters?: number;
  sleep_hours: number;
  mood: MoodLevel;
  steps?: number;
}

export interface MeasurementForm {
  weight: number;
  chest?: number;
  waist?: number;
  hips?: number;
  bicep_left?: number;
  bicep_right?: number;
  thigh_left?: number;
  thigh_right?: number;
  body_fat_percent?: number;
}

// ===== ДАШБОРД ТРЕНЕРА =====
export interface TrainerDashboard {
  total_participants: number;
  active_today: number;
  missing_checkin_today: User[];
  missing_measurement_this_week: User[];
  average_weight_change: number;
  average_streak: number;
  course_week: number;
}

// ===== ПРОГРЕСС УЧАСТНИКА =====
export interface ParticipantProgress {
  user: User;
  measurements: WeeklyMeasurement[];
  checkins: DailyCheckin[];
  achievements: Achievement[];
  stats: UserStats;
}

// =============================================
// AI ПСИХОЛОГ - ТИПЫ
// =============================================

// ===== ПРИОРИТЕТЫ =====
export type PsychologyPriority = 'high' | 'medium' | 'low';

// ===== ТИПЫ ИНСАЙТОВ =====
export type InsightType = 'warning' | 'positive' | 'neutral';

// ===== КАТЕГОРИИ РЕКОМЕНДАЦИЙ =====
export type RecommendationCategory = 'sleep' | 'nutrition' | 'training' | 'mindset' | 'stress' | 'recovery';

// ===== ПАТТЕРН ПОВЕДЕНИЯ =====
export interface BehavioralPattern {
  score: number; // 1-10
  observation: string;
  evidence: string[];
}

// ===== КЛЮЧЕВОЙ ИНСАЙТ =====
export interface KeyInsight {
  type: InsightType;
  title: string;
  description: string;
  priority: PsychologyPriority;
}

// ===== ВЫЯВЛЕННАЯ ПРОБЛЕМА =====
export interface IdentifiedProblem {
  problem: string;
  root_cause: string;
  impact: string;
  evidence: string[];
}

// ===== РЕКОМЕНДАЦИЯ =====
export interface Recommendation {
  category: RecommendationCategory;
  priority: PsychologyPriority;
  action: string;
  why: string;
  how: string[];
  expected_result: string;
}

// ===== ПРИЗНАНИЕ ПРОГРЕССА =====
export interface ProgressRecognition {
  wins: string[];
  growth_areas: string[];
}

// ===== ПОЛНЫЙ ПСИХОЛОГИЧЕСКИЙ АНАЛИЗ =====
export interface PsychologyAnalysis {
  behavioral_patterns: {
    consistency?: BehavioralPattern;
    sleep?: BehavioralPattern;
    nutrition?: BehavioralPattern;
    emotional_state?: BehavioralPattern;
    stress_management?: BehavioralPattern;
    discipline?: BehavioralPattern;
  };
  key_insights: KeyInsight[];
  identified_problems: IdentifiedProblem[];
  recommendations: Recommendation[];
  progress_recognition: ProgressRecognition;
  next_week_focus: string[];
}

// ===== НЕДЕЛЬНЫЕ ДАННЫЕ ДЛЯ АНАЛИЗА =====
export interface WeeklyDataSummary {
  total_checkins: number;
  total_workouts: number;
  avg_sleep_hours: number;
  avg_mood: number;
  avg_water_liters: number;
  nutrition_adherence: number; // 0-100%
  total_impulses: number;
  impulses_resisted: number;
  impulses_gave_in: number;
  tasks_completed: number;
  tasks_total: number;
  mindfulness_entries: number;
  weight_change?: number;
  has_measurement: boolean;
}

export interface WeeklyData {
  checkins: DailyCheckin[];
  mindfulness: MindfulnessEntry[];
  impulses: ImpulseLog[];
  tasks: {
    completed: TaskCompletion[];
    available: Task[];
  };
  measurement?: WeeklyMeasurement;
  previous_measurement?: WeeklyMeasurement;
  summary: WeeklyDataSummary;
}

// ===== СОХРАНЁННЫЙ АНАЛИЗ В БД =====
export interface PsychologyAnalysisRecord {
  id: string;
  user_id: string;
  week_number: number;
  analysis: PsychologyAnalysis;
  data_summary: WeeklyDataSummary;
  created_at: string;
}

// ===== ЗАПРОС НА ГЕНЕРАЦИЮ АНАЛИЗА =====
export interface GenerateAnalysisRequest {
  userId: string;
  weekNumber: number;
  force?: boolean; // Принудительная регенерация
}

// ===== ИСТОРИЯ АНАЛИЗОВ =====
export interface AnalysisHistory {
  analyses: PsychologyAnalysisRecord[];
  total: number;
}

// =============================================
// NUTRITION SYSTEM - ТИПЫ
// =============================================

// ===== КАТЕГОРИИ ПРОДУКТОВ =====
export type ProductCategory =
  | 'meat'           // Мясо
  | 'poultry'        // Птица
  | 'fish'           // Рыба
  | 'seafood'        // Морепродукты
  | 'dairy'          // Молочные продукты
  | 'eggs'           // Яйца
  | 'grains'         // Крупы
  | 'pasta'          // Макароны
  | 'bread'          // Хлеб
  | 'vegetables'     // Овощи
  | 'fruits'         // Фрукты
  | 'nuts'           // Орехи
  | 'dried_fruits'   // Сухофрукты
  | 'oils'           // Масла
  | 'condiments'     // Приправы/соусы
  | 'legumes'        // Бобовые
  | 'beverages'      // Напитки
  | 'other';         // Прочее

// ===== ТИПЫ ПРИЁМОВ ПИЩИ =====
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// ===== ТИПЫ ТЕГОВ =====
export type TagType =
  | 'allergen'       // Аллерген (лактоза, глютен, орехи)
  | 'diet'           // Диета (веган, вегетарианец)
  | 'preference';    // Предпочтение (без сахара, низкокалорийное)

// ===== СТАТУС ПЛАНА ПИТАНИЯ =====
export type MealPlanStatus = 'draft' | 'active' | 'completed' | 'archived';

// ===== ПРОДУКТ =====
export interface Product {
  id: string;
  fatsecret_id?: string;
  openfoodfacts_code?: string;
  imported_by_user_id?: string;
  name: string;
  name_short?: string;
  brand?: string | null;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  category: ProductCategory;
  is_perishable: boolean;
  cooking_ratio: number;
  price_per_kg?: number;
  unit: string;
  unit_weight?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ===== ТЕГ =====
export interface Tag {
  id: string;
  name: string;
  name_ru: string;
  type: TagType;
  description?: string;
  created_at: string;
}

// ===== РЕЦЕПТ =====
export interface Recipe {
  id: string;
  name: string;
  name_short?: string;
  meal_type: MealType;
  cooking_time?: number;
  instructions?: string;
  servings: number;
  is_scalable: boolean;
  min_portion: number;
  max_portion: number;
  complexity: string;
  cached_calories?: number;
  cached_protein?: number;
  cached_fat?: number;
  cached_carbs?: number;
  cached_fiber?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ===== ИНГРЕДИЕНТ РЕЦЕПТА =====
export interface RecipeItem {
  id: string;
  recipe_id: string;
  product_id: string;
  amount_grams: number;
  is_optional: boolean;
  notes?: string;
  created_at: string;
}

// ===== ПЛАН ПИТАНИЯ =====
export interface MealPlan {
  id: string;
  user_id: string;
  weeks: number;
  status: MealPlanStatus;
  target_calories: number;
  target_protein: number;
  target_fat: number;
  target_carbs: number;
  avg_calories?: number;
  avg_protein?: number;
  avg_fat?: number;
  avg_carbs?: number;
  allow_repeat_days: number;
  prefer_simple: boolean;
  created_at: string;
  updated_at: string;
}

// ===== ДЕНЬ ПЛАНА =====
export interface MealDay {
  id: string;
  meal_plan_id: string;
  week_number: number;
  day_number: number;
  total_calories?: number;
  total_protein?: number;
  total_fat?: number;
  total_carbs?: number;
  created_at: string;
}

// ===== ПРИЁМ ПИЩИ =====
export interface Meal {
  id: string;
  meal_day_id: string;
  recipe_id: string;
  meal_type: MealType;
  portion_multiplier: number;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  created_at: string;
}

// ===== ЭЛЕМЕНТ СПИСКА ПОКУПОК =====
export interface ShoppingListItem {
  id: string;
  meal_plan_id: string;
  product_id: string;
  total_grams: number;
  is_monthly: boolean;
  week_numbers?: number[];
  created_at: string;
}

// ===== РАСШИРЕННЫЕ ТИПЫ С ДАННЫМИ =====

export interface RecipeWithItems extends Recipe {
  items?: (RecipeItem & { product?: Product })[];
  tags?: Tag[];
}

export interface MealWithRecipe extends Meal {
  recipe?: RecipeWithItems;
}

export interface MealDayWithMeals extends MealDay {
  meals?: MealWithRecipe[];
}

export interface MealPlanWithDays extends MealPlan {
  days?: MealDayWithMeals[];
  user?: User;
}

export interface ShoppingListItemWithProduct extends ShoppingListItem {
  product?: Product;
}

// ===== FATSECRET API =====

export interface FatSecretProduct {
  food_id: string;
  food_name: string;
  food_description: string;
}

export interface FatSecretSearchResult {
  products: (Product & { source: 'local' | 'fatsecret' })[];
  total: number;
  cached: boolean;
}

// ===== ФОРМЫ И ЗАПРОСЫ =====

export interface GenerateMealPlanRequest {
  userId: string;
  weeks?: number;
  allowRepeatDays?: number;
  preferSimple?: boolean;
}

export interface SearchProductsRequest {
  query: string;
  source?: 'local' | 'fatsecret' | 'all';
  limit?: number;
}

export interface ImportProductRequest {
  fatSecretId: string;
  userId?: string;
}

export interface ImportProductResponse {
  productId: string;
  alreadyExists: boolean;
}

export interface AddExclusionRequest {
  userId: string;
  productId?: string;
  tagId?: string;
}

export interface UpdateMealRequest {
  recipeId: string;
  portionMultiplier?: number;
}

// ===== СТАТИСТИКА И СВОДКИ =====

export interface NutritionStats {
  total_recipes: number;
  total_products: number;
  active_meal_plans: number;
  avg_plan_adherence: number;
}

export interface ShoppingList {
  mealPlanId: string;
  monthly: ShoppingListItemWithProduct[];
  weekly: {
    [weekNumber: number]: ShoppingListItemWithProduct[];
  };
}

// ===== КОНФИГУРАЦИЯ =====

export const MEAL_DISTRIBUTION = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.30,
  snack: 0.10,
} as const;

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  meat: 'Мясо',
  poultry: 'Птица',
  fish: 'Рыба',
  seafood: 'Морепродукты',
  dairy: 'Молочные',
  eggs: 'Яйца',
  grains: 'Крупы',
  pasta: 'Макароны',
  bread: 'Хлеб',
  vegetables: 'Овощи',
  fruits: 'Фрукты',
  nuts: 'Орехи',
  dried_fruits: 'Сухофрукты',
  oils: 'Масла',
  condiments: 'Приправы',
  legumes: 'Бобовые',
  beverages: 'Напитки',
  other: 'Прочее',
};

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
};

export const TAG_TYPE_LABELS: Record<TagType, string> = {
  allergen: 'Аллерген',
  diet: 'Диета',
  preference: 'Предпочтение',
};
