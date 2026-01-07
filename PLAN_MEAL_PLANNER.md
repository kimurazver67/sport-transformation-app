# План реализации: Генератор планов питания 🍽

**Дата:** 2026-01-07
**Методология:** Spec-Driven Development
**Цель:** Интеграция персонализированных планов питания в приложение sport_kt

---

## 📋 Обзор

Интеграция системы автоматической генерации персонализированных планов питания с учётом:
- Целевых КБЖУ пользователя (уже рассчитываются в app)
- Цели пользователя (weight_loss / muscle_gain)
- Аллергий и исключений продуктов
- Диетических предпочтений (веган, вегетарианец, без глютена и т.д.)
- Разнообразия меню на 4 недели

## 🎯 Адаптация под текущее приложение

### Что УЖЕ есть в приложении:
1. **Пользователи с целями** (User.goal: 'weight_loss' | 'muscle_gain')
2. **Расчет КБЖУ** - автоматический расчет калорий на основе веса и цели:
   - weight_loss: вес × 29
   - muscle_gain: вес × 36 + 500 ккал
3. **Ежедневные чекины** - отслеживание питания (DailyCheckin.nutrition)
4. **Еженедельные замеры** - вес, объемы (WeeklyMeasurement)
5. **Курс на 16 недель** (MAX_COURSE_WEEKS = 16)
6. **Telegram бот** с Telegram Mini App интеграцией
7. **Brutal cyberpunk дизайн** (dark void, neon colors)

### Что НЕ нужно из архива:
1. ❌ Собственный TDEE калькулятор (используем существующий расчет КБЖУ)
2. ❌ Отдельная таблица clients (используем существующую users)
3. ❌ PDF генерация (пока не нужна, можно добавить позже)
4. ❌ Бюджетные уровни (пока не нужны)
5. ❌ Telegram HTTP клиент из архива (у нас свой бот)

### Что БЕРЕМ из архива:
1. ✅ База продуктов с КБЖУ (products)
2. ✅ Рецепты (recipes + recipe_items)
3. ✅ Теги (tags) - аллергены, диеты, предпочтения
4. ✅ Алгоритм генерации планов (meal_generator.py → TypeScript)
5. ✅ Структура планов (meal_plans, meal_days, meals)
6. ✅ Распределение макросов по приёмам пищи
7. ✅ Автоматический список покупок

---

## 📊 Гибридная архитектура с FatSecret API

### **Источники данных**

```
┌─────────────────────────────────────────────────────────────────┐
│                    ИСТОЧНИКИ ПРОДУКТОВ                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. USDA FoodData Central (начальная база)                     │
│     └─ 500-1000 базовых продуктов                              │
│     └─ Импорт через CSV один раз                               │
│     └─ 100% бесплатно, без API                                 │
│                                                                 │
│  2. FatSecret API (поиск пользователями) ⭐                     │
│     └─ Пользователи ищут продукты в real-time                  │
│     └─ Автоматический импорт в БД при выборе                   │
│     └─ Кэширование результатов                                 │
│     └─ 5,000 запросов/день (бесплатно)                         │
│                                                                 │
│  3. Локальная БД PostgreSQL (кэш + хранилище)                  │
│     └─ База растёт автоматически                               │
│     └─ Быстрый доступ без внешних API                          │
│     └─ Дедупликация одинаковых продуктов                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### **Общая архитектура**

```
┌─────────────────────────────────────────────────────────────────┐
│                    TELEGRAM MINI APP (Frontend)                 │
├─────────────────────────────────────────────────────────────────┤
│  - Просмотр плана питания (таблица 4 недели)                   │
│  - 🔍 ПОИСК продуктов (FatSecret API)                          │
│  - Выбор исключений/аллергий + поиск продуктов                 │
│  - Просмотр рецептов с заменой ингредиентов                    │
│  - Список покупок (месячный + понедельно)                      │
│  - Генерация/регенерация плана                                 │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Express Backend (Node.js)                    │
├─────────────────────────────────────────────────────────────────┤
│  /api/nutrition/meal-plans          - CRUD планов              │
│  /api/nutrition/generate            - генерация плана          │
│  /api/nutrition/recipes             - просмотр рецептов        │
│  /api/nutrition/products/search     - 🔍 поиск (FatSecret)     │
│  /api/nutrition/products/local      - локальная БД             │
│  /api/nutrition/tags                - теги (аллергии/диеты)    │
│  /api/nutrition/shopping-list/:id   - список покупок           │
│  /api/nutrition/exclusions          - управление исключениями  │
└─────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┴─────────────────┐
            │                                   │
            ▼                                   ▼
┌───────────────────────────┐    ┌─────────────────────────────┐
│  Meal Plan Generator      │    │  Nutrition Data Service     │
├───────────────────────────┤    ├─────────────────────────────┤
│  1. Macro Distributor     │    │  - FatSecret OAuth 2.0      │
│  2. Recipe Selector       │    │  - Product search           │
│  3. Portion Optimizer     │    │  - Auto-import to DB        │
│  4. Diversity Checker     │    │  - Cache management         │
│  5. Shopping Aggregator   │    │  - Deduplication            │
└───────────────────────────┘    └─────────────────────────────┘
            │                                   │
            └─────────────────┬─────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              PostgreSQL Database (Railway)                      │
├─────────────────────────────────────────────────────────────────┤
│  Продукты:                                                      │
│  - products (локальная БД, растёт автоматически)                │
│  - tags, product_tags                                           │
│  - fatsecret_cache (кэш результатов поиска)                     │
│                                                                 │
│  Рецепты:                                                       │
│  - recipes, recipe_items, recipe_tags                           │
│                                                                 │
│  Планы:                                                         │
│  - meal_plans, meal_days, meals                                 │
│  - user_excluded_tags, user_excluded_products                   │
│  - shopping_list_items                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄 Схема базы данных (Новые таблицы)

### 1. products (Продукты)
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,                 -- Название продукта
  name_short VARCHAR(50),                     -- Короткое название

  -- КБЖУ на 100г
  calories DECIMAL(6,2) NOT NULL,             -- ккал
  protein DECIMAL(5,2) NOT NULL,              -- белок (г)
  fat DECIMAL(5,2) NOT NULL,                  -- жир (г)
  carbs DECIMAL(5,2) NOT NULL,                -- углеводы (г)
  fiber DECIMAL(5,2) DEFAULT 0,               -- клетчатка (г)

  category VARCHAR(50) NOT NULL,              -- meat, poultry, fish, grains...
  is_perishable BOOLEAN DEFAULT true,         -- скоропортящийся
  cooking_ratio DECIMAL(3,2) DEFAULT 1.0,     -- коэф. готовки (гречка ×3)

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;
```

### 2. tags (Теги: аллергены, диеты)
```sql
CREATE TYPE tag_type AS ENUM ('allergen', 'diet', 'preference');

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,           -- lactose, gluten, vegan...
  name_ru VARCHAR(100) NOT NULL,              -- Лактоза, Глютен, Веган...
  type tag_type NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Связь продукт-тег
CREATE TABLE product_tags (
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);

CREATE INDEX idx_product_tags_tag ON product_tags(tag_id);
```

### 3. recipes (Рецепты)
```sql
CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
CREATE TYPE recipe_complexity AS ENUM ('simple', 'medium', 'complex');

CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  name_short VARCHAR(100),                    -- Короткое для меню

  meal_type meal_type NOT NULL,               -- тип приёма пищи
  cooking_time INT,                           -- минуты
  instructions TEXT,                          -- инструкция приготовления

  servings INT DEFAULT 1,                     -- порций
  is_scalable BOOLEAN DEFAULT true,           -- можно масштабировать
  complexity recipe_complexity DEFAULT 'simple',

  -- Кэшированные КБЖУ на 1 порцию (автообновление)
  cached_calories DECIMAL(7,2),
  cached_protein DECIMAL(6,2),
  cached_fat DECIMAL(6,2),
  cached_carbs DECIMAL(6,2),

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE INDEX idx_recipes_meal_type ON recipes(meal_type);
CREATE INDEX idx_recipes_active ON recipes(is_active) WHERE is_active = true;

-- Ингредиенты рецепта
CREATE TABLE recipe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),

  amount_grams DECIMAL(7,2) NOT NULL,         -- количество в граммах
  is_optional BOOLEAN DEFAULT false,
  notes VARCHAR(200),                         -- "в сухом виде"

  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE INDEX idx_recipe_items_recipe ON recipe_items(recipe_id);

-- Связь рецепт-тег
CREATE TABLE recipe_tags (
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, tag_id)
);

CREATE INDEX idx_recipe_tags_tag ON recipe_tags(tag_id);
```

### 4. user_exclusions (Исключения пользователя)
```sql
-- Исключённые теги (аллергии/диеты)
CREATE TABLE user_excluded_tags (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, tag_id)
);

-- Исключённые продукты (конкретные)
CREATE TABLE user_excluded_products (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);
```

### 5. meal_plans (Планы питания)
```sql
CREATE TYPE meal_plan_status AS ENUM ('draft', 'active', 'archived');

CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  weeks INT DEFAULT 4,                        -- количество недель
  status meal_plan_status DEFAULT 'draft',

  -- Целевые макросы (на момент генерации)
  target_calories INT NOT NULL,
  target_protein INT NOT NULL,
  target_fat INT NOT NULL,
  target_carbs INT NOT NULL,

  -- Статистика плана
  avg_calories INT,
  avg_protein DECIMAL(5,2),
  avg_fat DECIMAL(5,2),
  avg_carbs DECIMAL(5,2),
  unique_recipes INT,                         -- количество уникальных рецептов

  created_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_meal_plans_user ON meal_plans(user_id);
CREATE INDEX idx_meal_plans_status ON meal_plans(status);
```

### 6. meal_days (Дни в плане)
```sql
CREATE TABLE meal_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,

  week_number INT NOT NULL,                   -- 1-4
  day_number INT NOT NULL,                    -- 1-7 (пн-вс)

  -- Итоговые значения дня
  total_calories INT,
  total_protein DECIMAL(5,2),
  total_fat DECIMAL(5,2),
  total_carbs DECIMAL(5,2),

  UNIQUE (meal_plan_id, week_number, day_number)
);

CREATE INDEX idx_meal_days_plan ON meal_days(meal_plan_id);
```

### 7. meals (Приёмы пищи)
```sql
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_day_id UUID REFERENCES meal_days(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id),

  meal_type meal_type NOT NULL,               -- breakfast/lunch/dinner/snack
  portion_multiplier DECIMAL(4,2) DEFAULT 1.0,  -- множитель порции

  -- Рассчитанные КБЖУ для этого приёма
  calories INT,
  protein DECIMAL(5,2),
  fat DECIMAL(5,2),
  carbs DECIMAL(5,2)
);

CREATE INDEX idx_meals_day ON meals(meal_day_id);
CREATE INDEX idx_meals_recipe ON meals(recipe_id);
```

### 8. shopping_list_items (Список покупок)
```sql
CREATE TABLE shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),

  total_amount_grams DECIMAL(8,2) NOT NULL,   -- всего на месяц
  week_1_amount DECIMAL(8,2),                 -- неделя 1
  week_2_amount DECIMAL(8,2),                 -- неделя 2
  week_3_amount DECIMAL(8,2),                 -- неделя 3
  week_4_amount DECIMAL(8,2),                 -- неделя 4

  category VARCHAR(50),                       -- для группировки в UI
  is_perishable BOOLEAN,                      -- скоропортящийся

  FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id) ON DELETE CASCADE
);

CREATE INDEX idx_shopping_list_plan ON shopping_list_items(meal_plan_id);
```

---

## 📝 TypeScript типы (Spec-Driven Development)

### backend/src/types/index.ts

```typescript
// ===== КАТЕГОРИИ ПРОДУКТОВ =====
export type ProductCategory =
  | 'meat'          // мясо
  | 'poultry'       // птица
  | 'fish'          // рыба
  | 'seafood'       // морепродукты
  | 'dairy'         // молочные
  | 'eggs'          // яйца
  | 'grains'        // крупы
  | 'pasta'         // макароны
  | 'bread'         // хлеб
  | 'vegetables'    // овощи
  | 'fruits'        // фрукты
  | 'nuts'          // орехи
  | 'dried_fruits'  // сухофрукты
  | 'oils'          // масла
  | 'condiments'    // соусы/приправы
  | 'legumes'       // бобовые
  | 'beverages';    // напитки

// ===== ТИПЫ ПРИЁМОВ ПИЩИ =====
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// ===== ТИПЫ ТЕГОВ =====
export type TagType = 'allergen' | 'diet' | 'preference';

// ===== СЛОЖНОСТЬ РЕЦЕПТА =====
export type RecipeComplexity = 'simple' | 'medium' | 'complex';

// ===== СТАТУС ПЛАНА ПИТАНИЯ =====
export type MealPlanStatus = 'draft' | 'active' | 'archived';

// ===== ПРОДУКТ =====
export interface Product {
  id: string;
  name: string;
  name_short?: string;

  // КБЖУ на 100г
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;

  category: ProductCategory;
  is_perishable: boolean;
  cooking_ratio: number;

  is_active: boolean;
  created_at: string;
  updated_at?: string;

  // Relations (когда загружены)
  tags?: Tag[];
}

// ===== ТЕГ =====
export interface Tag {
  id: string;
  name: string;          // lactose, gluten, vegan...
  name_ru: string;       // Лактоза, Глютен, Веган...
  type: TagType;
  description?: string;
  created_at: string;
}

// ===== ИНГРЕДИЕНТ РЕЦЕПТА =====
export interface RecipeItem {
  id: string;
  recipe_id: string;
  product_id: string;
  amount_grams: number;
  is_optional: boolean;
  notes?: string;

  // Relations (когда загружены)
  product?: Product;
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
  complexity: RecipeComplexity;

  // Кэшированные КБЖУ на 1 порцию
  cached_calories?: number;
  cached_protein?: number;
  cached_fat?: number;
  cached_carbs?: number;

  is_active: boolean;
  created_at: string;
  updated_at?: string;

  // Relations (когда загружены)
  items?: RecipeItem[];
  tags?: Tag[];
}

// ===== ПРИЁМ ПИЩИ =====
export interface Meal {
  id: string;
  meal_day_id: string;
  recipe_id: string;
  meal_type: MealType;
  portion_multiplier: number;

  // Рассчитанные КБЖУ
  calories: number;
  protein: number;
  fat: number;
  carbs: number;

  // Relations (когда загружены)
  recipe?: Recipe;
}

// ===== ДЕНЬ В ПЛАНЕ =====
export interface MealDay {
  id: string;
  meal_plan_id: string;
  week_number: number;  // 1-4
  day_number: number;   // 1-7

  // Итоговые значения дня
  total_calories: number;
  total_protein: number;
  total_fat: number;
  total_carbs: number;

  // Relations (когда загружены)
  meals?: Meal[];
}

// ===== ПЛАН ПИТАНИЯ =====
export interface MealPlan {
  id: string;
  user_id: string;
  weeks: number;
  status: MealPlanStatus;

  // Целевые макросы
  target_calories: number;
  target_protein: number;
  target_fat: number;
  target_carbs: number;

  // Статистика
  avg_calories?: number;
  avg_protein?: number;
  avg_fat?: number;
  avg_carbs?: number;
  unique_recipes?: number;

  created_at: string;

  // Relations (когда загружены)
  days?: MealDay[];
  user?: User;
}

// ===== ПОЗИЦИЯ В СПИСКЕ ПОКУПОК =====
export interface ShoppingListItem {
  id: string;
  meal_plan_id: string;
  product_id: string;

  total_amount_grams: number;
  week_1_amount?: number;
  week_2_amount?: number;
  week_3_amount?: number;
  week_4_amount?: number;

  category: ProductCategory;
  is_perishable: boolean;

  // Relations (когда загружены)
  product?: Product;
}

// ===== СПИСОК ПОКУПОК (группированный) =====
export interface ShoppingList {
  meal_plan_id: string;
  monthly: Array<{
    product: Product;
    amount_grams: number;
    amount_display: string;  // "500 г" или "5 шт"
  }>;
  weekly: {
    week_1: Array<{
      product: Product;
      amount_grams: number;
      amount_display: string;
    }>;
    week_2: Array<{ product: Product; amount_grams: number; amount_display: string }>;
    week_3: Array<{ product: Product; amount_grams: number; amount_display: string }>;
    week_4: Array<{ product: Product; amount_grams: number; amount_display: string }>;
  };
}

// ===== ИСКЛЮЧЕНИЯ ПОЛЬЗОВАТЕЛЯ =====
export interface UserExclusions {
  tags: string[];        // ID тегов
  products: string[];    // ID продуктов
}

// ===== ЗАПРОС НА ГЕНЕРАЦИЮ ПЛАНА =====
export interface GenerateMealPlanRequest {
  user_id: string;
  weeks?: number;                        // по умолчанию 4
  allow_repeat_days?: number;            // не повторять рецепт N дней подряд (по умолчанию 3)
  prefer_simple?: boolean;               // предпочитать простые рецепты
  exclusions?: UserExclusions;           // исключения (если не заданы, берём из user_excluded_tags/products)
}

// ===== РЕЗУЛЬТАТ ГЕНЕРАЦИИ =====
export interface GenerateMealPlanResponse {
  meal_plan_id: string;
  status: MealPlanStatus;
  summary: {
    avg_calories: number;
    avg_protein: number;
    avg_fat: number;
    avg_carbs: number;
    unique_recipes: number;
    deviation_percent: number;           // отклонение от целевых калорий (%)
  };
  warnings?: string[];                   // предупреждения (недостаточно рецептов и т.д.)
}

// ===== РАСПРЕДЕЛЕНИЕ МАКРОСОВ ПО ПРИЁМАМ =====
export interface MealDistribution {
  breakfast: { calories: number; protein: number; fat: number; carbs: number };
  lunch: { calories: number; protein: number; fat: number; carbs: number };
  dinner: { calories: number; protein: number; fat: number; carbs: number };
  snack: { calories: number; protein: number; fat: number; carbs: number };
}
```

---

## 🔧 Backend Services (TypeScript)

### 1. backend/src/services/mealPlanGenerator.ts

Главный сервис генерации плана:

```typescript
import { query } from '../db/postgres';
import type {
  MealPlan,
  MealDay,
  Meal,
  Recipe,
  User,
  UserExclusions,
  GenerateMealPlanRequest,
  GenerateMealPlanResponse,
  MealDistribution,
  MealType
} from '../types';

/**
 * Стандартное распределение макросов по приёмам пищи
 */
const MEAL_DISTRIBUTION_RATIOS: Record<MealType, number> = {
  breakfast: 0.25,  // 25%
  lunch: 0.35,      // 35%
  dinner: 0.30,     // 30%
  snack: 0.10       // 10%
};

/**
 * Сервис генерации планов питания
 */
export class MealPlanGenerator {
  /**
   * Генерация плана питания для пользователя
   */
  async generate(request: GenerateMealPlanRequest): Promise<GenerateMealPlanResponse> {
    const { user_id, weeks = 4, allow_repeat_days = 3, prefer_simple = true } = request;

    // 1. Получаем пользователя и его целевые макросы
    const user = await this.getUserWithMacros(user_id);

    // 2. Получаем исключения пользователя
    const exclusions = request.exclusions || await this.getUserExclusions(user_id);

    // 3. Вычисляем распределение макросов по приёмам пищи
    const mealDistribution = this.distributeMacros({
      calories: user.target_calories,
      protein: user.target_protein,
      fat: user.target_fat,
      carbs: user.target_carbs
    });

    // 4. Создаём план в БД
    const mealPlan = await this.createMealPlan(user, weeks);

    // 5. Генерируем дни и приёмы пищи
    const warnings: string[] = [];
    let totalCalories = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;
    const usedRecipes = new Set<string>();
    const recentRecipes: string[] = [];  // последние N рецептов для diversity check

    for (let week = 1; week <= weeks; week++) {
      for (let day = 1; day <= 7; day++) {
        // Создаём день
        const mealDay = await this.createMealDay(mealPlan.id, week, day);

        let dayCalories = 0;
        let dayProtein = 0;
        let dayFat = 0;
        let dayCarbs = 0;

        // Генерируем приёмы пищи
        for (const mealType of ['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]) {
          const target = mealDistribution[mealType];

          // Подбираем рецепт
          const recipe = await this.selectRecipe({
            mealType,
            target,
            exclusions,
            recentRecipes: recentRecipes.slice(-allow_repeat_days),
            preferSimple: prefer_simple
          });

          if (!recipe) {
            warnings.push(`Не найден рецепт для ${mealType} (неделя ${week}, день ${day})`);
            continue;
          }

          // Оптимизируем порцию
          const portionMultiplier = this.optimizePortion(recipe, target);

          // Создаём приём пищи
          const meal = await this.createMeal({
            meal_day_id: mealDay.id,
            recipe_id: recipe.id,
            meal_type: mealType,
            portion_multiplier: portionMultiplier
          });

          dayCalories += meal.calories;
          dayProtein += meal.protein;
          dayFat += meal.fat;
          dayCarbs += meal.carbs;

          usedRecipes.add(recipe.id);
          recentRecipes.push(recipe.id);
        }

        // Обновляем итоги дня
        await this.updateMealDayTotals(mealDay.id, {
          total_calories: dayCalories,
          total_protein: dayProtein,
          total_fat: dayFat,
          total_carbs: dayCarbs
        });

        totalCalories += dayCalories;
        totalProtein += dayProtein;
        totalFat += dayFat;
        totalCarbs += dayCarbs;
      }
    }

    // 6. Обновляем статистику плана
    const totalDays = weeks * 7;
    await this.updateMealPlanStats(mealPlan.id, {
      avg_calories: Math.round(totalCalories / totalDays),
      avg_protein: Math.round(totalProtein / totalDays),
      avg_fat: Math.round(totalFat / totalDays),
      avg_carbs: Math.round(totalCarbs / totalDays),
      unique_recipes: usedRecipes.size,
      status: 'active'
    });

    // 7. Генерируем список покупок
    await this.generateShoppingList(mealPlan.id, weeks);

    // 8. Возвращаем результат
    const avgCalories = Math.round(totalCalories / totalDays);
    const deviation = Math.abs((avgCalories - user.target_calories) / user.target_calories * 100);

    return {
      meal_plan_id: mealPlan.id,
      status: 'active',
      summary: {
        avg_calories: avgCalories,
        avg_protein: Math.round(totalProtein / totalDays),
        avg_fat: Math.round(totalFat / totalDays),
        avg_carbs: Math.round(totalCarbs / totalDays),
        unique_recipes: usedRecipes.size,
        deviation_percent: Math.round(deviation * 10) / 10
      },
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Распределение макросов по приёмам пищи
   */
  private distributeMacros(target: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  }): MealDistribution {
    const distribution: MealDistribution = {} as any;

    for (const [mealType, ratio] of Object.entries(MEAL_DISTRIBUTION_RATIOS)) {
      distribution[mealType as MealType] = {
        calories: Math.round(target.calories * ratio),
        protein: Math.round(target.protein * ratio),
        fat: Math.round(target.fat * ratio),
        carbs: Math.round(target.carbs * ratio)
      };
    }

    return distribution;
  }

  /**
   * Подбор рецепта под целевые макросы
   */
  private async selectRecipe(params: {
    mealType: MealType;
    target: { calories: number; protein: number; fat: number; carbs: number };
    exclusions: UserExclusions;
    recentRecipes: string[];
    preferSimple: boolean;
  }): Promise<Recipe | null> {
    // SQL запрос с фильтрацией по:
    // - типу приёма пищи
    // - исключённым тегам
    // - исключённым продуктам (через recipe_items)
    // - недавним рецептам (diversity)
    // Сортировка по близости к целевым макросам

    // Псевдокод (реальный SQL будет сложнее):
    const result = await query<Recipe>(`
      SELECT r.*,
        -- Расстояние до целевых макросов (упрощённая метрика)
        ABS(r.cached_calories - $1) +
        ABS(r.cached_protein - $2) * 4 +  -- белок важнее
        ABS(r.cached_carbs - $3) as distance
      FROM recipes r
      WHERE r.meal_type = $4
        AND r.is_active = true
        AND r.id NOT IN (SELECT UNNEST($5::uuid[]))  -- recent recipes
        AND NOT EXISTS (
          SELECT 1 FROM recipe_tags rt
          WHERE rt.recipe_id = r.id AND rt.tag_id = ANY($6::uuid[])
        )
        AND NOT EXISTS (
          SELECT 1 FROM recipe_items ri
          WHERE ri.recipe_id = r.id AND ri.product_id = ANY($7::uuid[])
        )
      ORDER BY
        ${params.preferSimple ? 'r.complexity ASC,' : ''}
        distance ASC
      LIMIT 10
    `, [
      params.target.calories,
      params.target.protein,
      params.target.carbs,
      params.mealType,
      params.recentRecipes,
      params.exclusions.tags,
      params.exclusions.products
    ]);

    // Случайный выбор из топ-10 для разнообразия
    if (result.rows.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * Math.min(3, result.rows.length));
    return result.rows[randomIndex];
  }

  /**
   * Оптимизация размера порции
   */
  private optimizePortion(
    recipe: Recipe,
    target: { calories: number; protein: number; fat: number; carbs: number }
  ): number {
    // Оптимизируем по белку (важнее всего)
    const multiplier = target.protein / (recipe.cached_protein || 1);

    // Ограничиваем разумным диапазоном (0.5x - 2.0x)
    return Math.max(0.5, Math.min(2.0, multiplier));
  }

  // ... остальные приватные методы для работы с БД
}
```

---

## 🎨 Frontend Components

### 1. frontend/src/pages/MealPlanPage.tsx

Главная страница плана питания:

```tsx
import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { api } from '../services/api';
import type { MealPlan, MealDay } from '../types';

/**
 * Страница плана питания
 *
 * Спецификация:
 * - Показывает текущий активный план питания пользователя
 * - Таблица 7 дней × 4 приёма пищи
 * - Переключение между неделями (W_01, W_02, W_03, W_04)
 * - Клик на блюдо → модальное окно с рецептом
 * - Кнопка "Сгенерировать новый план" (подтверждение)
 * - Кнопка "Список покупок"
 * - Показ КБЖУ итогов дня
 * - Brutal cyberpunk стиль
 */

const MealPlanPage = () => {
  const user = useStore((state) => state.user);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const loadMealPlan = async () => {
      try {
        setLoading(true);
        const plan = await api.getActiveMealPlan(user.id);
        setMealPlan(plan);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки плана');
      } finally {
        setLoading(false);
      }
    };

    loadMealPlan();
  }, [user?.id]);

  if (loading) return <LoadingScreen />;

  if (!mealPlan) {
    return (
      <div className="min-h-screen bg-void p-4">
        <div className="brutal-card p-6 text-center">
          <div className="text-4xl mb-4">🍽</div>
          <h2 className="font-display font-bold text-steel-100 text-xl mb-2">
            НЕТ_ПЛАНА_ПИТАНИЯ
          </h2>
          <p className="font-mono text-sm text-steel-500 mb-6">
            Сгенерируйте персональный план питания на 4 недели
          </p>
          <button
            onClick={() => handleGeneratePlan()}
            className="brutal-button w-full"
          >
            <span className="font-mono text-sm">СГЕНЕРИРОВАТЬ_ПЛАН</span>
          </button>
        </div>
      </div>
    );
  }

  // Фильтруем дни выбранной недели
  const weekDays = mealPlan.days?.filter(d => d.week_number === selectedWeek) || [];

  return (
    <div className="min-h-screen bg-void p-4">
      {/* Header */}
      <div className="brutal-card p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-steel-100 text-xl">
              ПЛАН_ПИТАНИЯ
            </h1>
            <p className="font-mono text-xs text-steel-500">
              Цель: {mealPlan.target_calories} ккал / день
            </p>
          </div>
          <button
            onClick={() => navigate('/meal-plan/shopping-list')}
            className="brutal-button-sm"
          >
            <span className="text-lg">🛒</span>
          </button>
        </div>
      </div>

      {/* Week Selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {[1, 2, 3, 4].map(week => (
          <button
            key={week}
            onClick={() => setSelectedWeek(week)}
            className={`brutal-button-sm flex-shrink-0 ${
              selectedWeek === week ? 'border-neon-lime text-neon-lime' : ''
            }`}
          >
            W_{String(week).padStart(2, '0')}
          </button>
        ))}
      </div>

      {/* Meal Table */}
      <div className="space-y-2">
        {weekDays.map(day => (
          <DayCard key={day.id} day={day} />
        ))}
      </div>

      {/* Actions */}
      <div className="mt-6 brutal-card p-4">
        <button
          onClick={() => handleRegenerate()}
          className="brutal-button w-full mb-2"
        >
          СГЕНЕРИРОВАТЬ_ЗАНОВО
        </button>
        <p className="font-mono text-xs text-steel-500 text-center">
          Текущий план будет заменён
        </p>
      </div>
    </div>
  );
};
```

### 2. frontend/src/components/RecipeModal.tsx

Модальное окно с рецептом:

```tsx
/**
 * Модальное окно рецепта
 *
 * Показывает:
 * - Название блюда
 * - КБЖУ на порцию
 * - Список ингредиентов с граммовкой
 * - Инструкцию приготовления
 * - Время приготовления
 */
```

### 3. frontend/src/pages/ShoppingListPage.tsx

Список покупок:

```tsx
/**
 * Список покупок
 *
 * Группировка:
 * - На месяц (нескоропортящиеся)
 * - Неделя 1 (скоропортящиеся)
 * - Неделя 2
 * - Неделя 3
 * - Неделя 4
 *
 * Категории:
 * - Мясо/Птица
 * - Рыба
 * - Молочные
 * - Крупы
 * - Овощи
 * - Фрукты
 * - Прочее
 */
```

---

## 🚀 План реализации

### Phase 1: База данных и типы (2-3 дня)
- [ ] Создать миграцию 014_nutrition_schema.sql
- [ ] Добавить типы в backend/src/types/index.ts
- [ ] Добавить типы в frontend/src/types/index.ts
- [ ] Seed базовой базы продуктов (50-100 продуктов)
- [ ] Seed базовых рецептов (20-30 на каждый тип приёма)

### Phase 2: Backend Services (3-4 дня)
- [ ] MealPlanGenerator service
- [ ] MacroDistributor helper
- [ ] RecipeSelector с SQL оптимизацией
- [ ] PortionOptimizer helper
- [ ] ShoppingListGenerator service
- [ ] API endpoints (/api/nutrition/*)

### Phase 3: Frontend Components (3-4 дня)
- [ ] MealPlanPage.tsx
- [ ] DayCard.tsx component
- [ ] MealCard.tsx component
- [ ] RecipeModal.tsx
- [ ] ShoppingListPage.tsx
- [ ] ExclusionsModal.tsx (выбор аллергий/диет)
- [ ] Интеграция в Layout.tsx (добавить таб ПИТАНИЕ)

### Phase 4: Интеграция (2 дня)
- [ ] Связать с существующим расчётом КБЖУ
- [ ] Обновлять КБЖУ при изменении веса
- [ ] Уведомления в Telegram при генерации плана
- [ ] Админка тренера (просмотр планов участников)

### Phase 5: Тестирование и Деплой (2 дня)
- [ ] Тестирование генерации планов
- [ ] Тестирование списка покупок
- [ ] Проверка производительности SQL запросов
- [ ] Деплой на Railway
- [ ] Smoke testing

**Итого:** ~12-15 дней

---

## 🎯 Ключевые отличия от архива

1. **Интеграция с User вместо Client**
   - Используем существующую таблицу users
   - Целевые макросы берутся из автоматического расчёта КБЖУ

2. **Адаптация под цели курса**
   - weight_loss → дефицит калорий (вес × 30)
   - muscle_gain → профицит калорий (вес × 32)

3. **Курс на 16 недель вместо универсального**
   - Планы на 4 недели (1 месяц)
   - Автоматическое обновление при новых замерах веса

4. **Brutal cyberpunk дизайн**
   - Dark void background (#0f172a, #1e293b)
   - Neon colors (lime, cyan, magenta)
   - Mono fonts (font-mono)
   - Brutal cards with borders

5. **Нет PDF экспорта**
   - Вся информация в Mini App
   - Можно добавить позже если потребуется

6. **Telegram бот интеграция**
   - Уведомления о готовности плана
   - Команды /meal_plan, /shopping_list в боте

---

## 📊 SQL Запросы (оптимизация)

### Критические индексы:
```sql
-- Продукты
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;

-- Рецепты
CREATE INDEX idx_recipes_meal_type ON recipes(meal_type);
CREATE INDEX idx_recipes_active ON recipes(is_active) WHERE is_active = true;
CREATE INDEX idx_recipe_items_recipe ON recipe_items(recipe_id);

-- Планы
CREATE INDEX idx_meal_plans_user ON meal_plans(user_id);
CREATE INDEX idx_meal_plans_status ON meal_plans(status);
CREATE INDEX idx_meal_days_plan ON meal_days(meal_plan_id);
CREATE INDEX idx_meals_day ON meals(meal_day_id);

-- Теги
CREATE INDEX idx_product_tags_tag ON product_tags(tag_id);
CREATE INDEX idx_recipe_tags_tag ON recipe_tags(tag_id);
```

---

## 🔍 Пользовательский поиск продуктов через FatSecret API

### **Flow для пользователя**

#### **1. Настройка исключений**

```tsx
// Пользователь настраивает план питания

┌─────────────────────────────────────────────────────────────┐
│ НАСТРОЙКА_ПЛАНА_ПИТАНИЯ                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Целевые калории: 2100 ккал/день                             │
│ (автоматически из веса и цели)                              │
│                                                             │
│ ☑ У меня есть аллергии/диеты                                │
│   Выбрано: 🥛 Лактоза, 🌾 Глютен                            │
│                                                             │
│ ☑ Исключить определённые продукты                           │
│   ┌───────────────────────────────────────────────────────┐ │
│   │ [🔍 Найти продукт для исключения...        ] [Поиск]  │ │
│   │                                                       │ │
│   │ Результаты FatSecret:                                 │ │
│   │ • Куриная грудка (165 ккал, Б:31г)  [+ Исключить]    │ │
│   │ • Гречка (123 ккал, Б:4.5г, У:25г)  [+ Исключить]    │ │
│   │ • Брокколи (34 ккал, Б:2.8г)        [+ Исключить]    │ │
│   │                                                       │ │
│   │ Исключено:                                            │ │
│   │ • ❌ Молоко                                            │ │
│   │ • ❌ Творог                                            │ │
│   └───────────────────────────────────────────────────────┘ │
│                                                             │
│ [СГЕНЕРИРОВАТЬ_ПЛАН]  [ОТМЕНА]                              │
└─────────────────────────────────────────────────────────────┘
```

#### **2. Просмотр и замена ингредиентов в рецепте**

```tsx
// Пользователь кликает на блюдо в плане

┌─────────────────────────────────────────────────────────────┐
│ РЕЦЕПТ: Омлет с овощами                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ КБЖУ: 320 ккал | Б: 22г | Ж: 18г | У: 15г                  │
│                                                             │
│ Ингредиенты:                                                │
│ • Яйца куриные - 3 шт (150г)                                │
│   [🔍 Найти замену]                                         │
│                                                             │
│ • Молоко - 50мл                                             │
│   [🔍 Найти замену]  ← Клик                                 │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ Поиск замены для "Молоко":                          │   │
│   │ [🔍 Введите продукт...              ] [Поиск]       │   │
│   │                                                     │   │
│   │ • Миндальное молоко (15 ккал)  [✓ Заменить]        │   │
│   │ • Кокосовое молоко (230 ккал)  [✓ Заменить]        │   │
│   │ • Соевое молоко (54 ккал)      [✓ Заменить]        │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│ • Помидоры - 100г                                           │
│ • Шпинат - 50г                                              │
│                                                             │
│ Приготовление:                                              │
│ 1. Взбить яйца с молоком...                                 │
│                                                             │
│ [СОХРАНИТЬ_ИЗМЕНЕНИЯ]  [ОТМЕНИТЬ_РЕЦЕПТ]                    │
└─────────────────────────────────────────────────────────────┘
```

### **Backend API Endpoints**

```typescript
// ===== ПОИСК ПРОДУКТОВ =====

/**
 * Поиск продуктов через FatSecret API
 * 1. Проверяем локальную БД (кэш)
 * 2. Если не найдено → запрос к FatSecret
 * 3. Кэшируем результаты
 */
GET /api/nutrition/products/search
Query: {
  q: string;            // поисковый запрос
  limit?: number;       // по умолчанию 20
  source?: 'local' | 'fatsecret' | 'all';  // источник поиска
}

Response: {
  products: Array<{
    id?: string;                    // если из локальной БД
    fatsecret_id?: string;          // если из FatSecret
    name: string;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber?: number;
    source: 'local' | 'fatsecret';  // откуда взят
  }>;
  total: number;
  cached: boolean;                  // из кэша или live запрос
}

/**
 * Импортировать продукт из FatSecret в локальную БД
 * Вызывается автоматически при выборе пользователем
 */
POST /api/nutrition/products/import
Body: {
  fatsecret_id: string;
  user_id: string;  // кто импортирует (для статистики)
}

Response: {
  product_id: string;  // ID в локальной БД
  imported: boolean;
  already_exists: boolean;
}

/**
 * Добавить продукт в исключения пользователя
 */
POST /api/nutrition/exclusions/:userId/products
Body: {
  product_id?: string;           // локальный ID
  fatsecret_id?: string;         // или FatSecret ID (автоимпорт)
  product_name: string;
}

Response: {
  exclusion_id: string;
  product_id: string;  // импортирован если нужно было
}
```

### **Frontend Components**

#### **ProductSearchModal.tsx**

```typescript
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Product } from '../types';

interface ProductSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
  mode: 'exclude' | 'replace';  // исключить или заменить
  title?: string;
}

const ProductSearchModal = ({
  isOpen,
  onClose,
  onSelect,
  mode,
  title = 'Поиск продуктов'
}: ProductSearchModalProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<'all' | 'local' | 'fatsecret'>('all');

  const handleSearch = async () => {
    if (query.length < 2) return;

    setLoading(true);
    try {
      const data = await api.searchProducts(query, source);
      setResults(data.products);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (product: Product) => {
    // Если продукт из FatSecret, импортируем в БД
    if (product.source === 'fatsecret' && product.fatsecret_id) {
      const imported = await api.importProduct(product.fatsecret_id);
      product.id = imported.product_id;
    }

    onSelect(product);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-void/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="brutal-card max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b-2 border-void-400">
          <h2 className="font-display font-bold text-steel-100 text-xl uppercase">
            {title}
          </h2>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-void-400">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Введите название продукта..."
              className="flex-1 bg-void-300 border-2 border-steel-600 text-steel-100
                         px-4 py-2 font-mono text-sm focus:border-neon-lime outline-none"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="brutal-button px-6"
            >
              {loading ? 'ПОИСК...' : '🔍 ПОИСК'}
            </button>
          </div>

          {/* Source Filter */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setSource('all')}
              className={`font-mono text-xs px-3 py-1 border ${
                source === 'all'
                  ? 'border-neon-lime text-neon-lime'
                  : 'border-steel-600 text-steel-500'
              }`}
            >
              ВСЕ
            </button>
            <button
              onClick={() => setSource('local')}
              className={`font-mono text-xs px-3 py-1 border ${
                source === 'local'
                  ? 'border-neon-lime text-neon-lime'
                  : 'border-steel-600 text-steel-500'
              }`}
            >
              ЛОКАЛЬНАЯ_БД
            </button>
            <button
              onClick={() => setSource('fatsecret')}
              className={`font-mono text-xs px-3 py-1 border ${
                source === 'fatsecret'
                  ? 'border-neon-lime text-neon-lime'
                  : 'border-steel-600 text-steel-500'
              }`}
            >
              FATSECRET
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="p-4 space-y-2">
          {results.length === 0 && !loading && (
            <p className="font-mono text-sm text-steel-500 text-center py-8">
              Введите запрос для поиска продуктов
            </p>
          )}

          {results.map((product, index) => (
            <div
              key={product.id || product.fatsecret_id || index}
              className="bg-void-300 border border-void-400 p-3 hover:border-neon-lime transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono text-sm font-bold text-steel-100">
                      {product.name}
                    </h3>
                    <span className={`font-mono text-xs px-2 py-0.5 ${
                      product.source === 'local'
                        ? 'bg-neon-lime/20 text-neon-lime'
                        : 'bg-neon-cyan/20 text-neon-cyan'
                    }`}>
                      {product.source === 'local' ? 'БД' : 'API'}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-steel-400 mt-1">
                    {product.calories} ккал |
                    Б: {product.protein}г |
                    Ж: {product.fat}г |
                    У: {product.carbs}г
                  </p>
                </div>
                <button
                  onClick={() => handleSelect(product)}
                  className="brutal-button-sm ml-4"
                >
                  {mode === 'exclude' ? '+ ИСКЛЮЧИТЬ' : '✓ ЗАМЕНИТЬ'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-void-400">
          <button onClick={onClose} className="brutal-button w-full">
            ЗАКРЫТЬ
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductSearchModal;
```

### **Backend Service: NutritionDataService**

```typescript
// backend/src/services/nutritionDataService.ts

import axios from 'axios';
import { query } from '../db/postgres';
import type { Product } from '../types';

interface FatSecretProduct {
  food_id: string;
  food_name: string;
  food_description: string;  // "Per 100g - Calories: 165kcal | Fat: 3.6g | Carbs: 0g | Protein: 31g"
}

export class NutritionDataService {
  private clientId: string;
  private clientSecret: string;
  private accessToken?: string;
  private tokenExpiry?: Date;
  private readonly baseUrl = 'https://platform.fatsecret.com/rest';
  private readonly tokenUrl = 'https://oauth.fatsecret.com/connect/token';

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  /**
   * Получить OAuth 2.0 токен
   */
  private async getAccessToken(): Promise<string> {
    // Проверяем кэшированный токен
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Получаем новый токен
    const response = await axios.post(
      this.tokenUrl,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'basic'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    this.accessToken = response.data.access_token;
    this.tokenExpiry = new Date(Date.now() + (response.data.expires_in - 60) * 1000);

    return this.accessToken;
  }

  /**
   * Поиск продуктов в FatSecret API
   */
  async searchFatSecret(searchQuery: string, maxResults: number = 20): Promise<FatSecretProduct[]> {
    const token = await this.getAccessToken();

    const response = await axios.get(`${this.baseUrl}/foods/search/v4`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        search_expression: searchQuery,
        format: 'json',
        max_results: maxResults
      }
    });

    return response.data.foods?.food || [];
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
      SELECT * FROM products
      WHERE name ILIKE $1
        AND is_active = true
      ORDER BY name ASC
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
          fatsecret_id: fsProduct.food_id,
          name: fsProduct.food_name,
          ...macros,
          fiber: 0,
          category: 'other' as any,
          is_perishable: true,
          cooking_ratio: 1.0,
          is_active: true,
          created_at: new Date().toISOString(),
          source: 'fatsecret' as const
        });
      }
    }

    return {
      products: results.slice(0, limit),
      cached: source === 'local'
    };
  }

  /**
   * Импортировать продукт из FatSecret в локальную БД
   */
  async importProduct(fatSecretId: string, userId?: string): Promise<{ product_id: string; already_exists: boolean }> {
    // Проверяем, не импортирован ли уже
    const existing = await query<Product>(`
      SELECT id FROM products WHERE fatsecret_id = $1
    `, [fatSecretId]);

    if (existing.rows.length > 0) {
      return {
        product_id: existing.rows[0].id,
        already_exists: true
      };
    }

    // Получаем детальную информацию
    const token = await this.getAccessToken();
    const response = await axios.get(`${this.baseUrl}/food/v5`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        food_id: fatSecretId,
        format: 'json'
      }
    });

    const food = response.data.food;

    // Берём метрическую порцию (100г)
    const serving = food.servings.serving.find(
      (s: any) => s.metric_serving_amount === '100.0' && s.metric_serving_unit === 'g'
    ) || food.servings.serving[0];

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
      parseFloat(serving.fiber || 0),
      this.detectCategory(food.food_name),
      this.detectPerishable(food.food_name),
      1.0,
      userId
    ]);

    return {
      product_id: result.rows[0].id,
      already_exists: false
    };
  }

  private detectCategory(name: string): string {
    // Простая эвристика по ключевым словам
    const lower = name.toLowerCase();

    if (lower.includes('chicken') || lower.includes('курица')) return 'poultry';
    if (lower.includes('beef') || lower.includes('говядина')) return 'meat';
    if (lower.includes('fish') || lower.includes('рыба')) return 'fish';
    if (lower.includes('milk') || lower.includes('молоко') || lower.includes('cheese') || lower.includes('сыр')) return 'dairy';
    if (lower.includes('egg') || lower.includes('яйц')) return 'eggs';
    if (lower.includes('rice') || lower.includes('рис') || lower.includes('oat') || lower.includes('овс')) return 'grains';
    if (lower.includes('bread') || lower.includes('хлеб')) return 'bread';

    return 'other';
  }

  private detectPerishable(name: string): boolean {
    const lower = name.toLowerCase();
    const nonPerishable = ['rice', 'pasta', 'oat', 'flour', 'sugar', 'oil', 'рис', 'макарон', 'мука', 'сахар', 'масло'];
    return !nonPerishable.some(word => lower.includes(word));
  }
}
```

### **Database Schema: FatSecret Cache**

```sql
-- Кэш результатов поиска FatSecret
CREATE TABLE fatsecret_search_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_query VARCHAR(255) NOT NULL,
  results JSONB NOT NULL,  -- массив продуктов
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX idx_fatsecret_cache_query ON fatsecret_search_cache(search_query);
CREATE INDEX idx_fatsecret_cache_expires ON fatsecret_search_cache(expires_at);

-- Добавляем fatsecret_id в products
ALTER TABLE products ADD COLUMN fatsecret_id VARCHAR(50) UNIQUE;
ALTER TABLE products ADD COLUMN imported_by_user_id UUID REFERENCES users(id);
CREATE INDEX idx_products_fatsecret ON products(fatsecret_id);
```

---

---

## 🔐 Конфигурация FatSecret API

### **Environment Variables**

Добавить в `.env`:

```bash
# FatSecret API
FATSECRET_CLIENT_ID=54f1eebc60864584bbe6529ff549ed58
FATSECRET_CLIENT_SECRET=b596986f18ba469da864c0b37c1c775f
FATSECRET_ENABLED=true
```

### **Backend Config**

Обновить `backend/src/config.ts`:

```typescript
const envSchema = z.object({
  // ... existing config

  // FatSecret API
  FATSECRET_CLIENT_ID: z.string().optional(),
  FATSECRET_CLIENT_SECRET: z.string().optional(),
  FATSECRET_ENABLED: z.string().default('false'),
});

export const config = {
  // ... existing config

  fatsecret: {
    clientId: parsed.data.FATSECRET_CLIENT_ID,
    clientSecret: parsed.data.FATSECRET_CLIENT_SECRET,
    enabled: parsed.data.FATSECRET_ENABLED === 'true',
  },
};
```

---

## ✅ Чеклист перед стартом

- [x] Архив распакован и проанализирован
- [x] Существующая архитектура изучена
- [x] TypeScript типы спроектированы
- [x] Схема БД спроектирована
- [x] План реализации составлен
- [x] Гибридная архитектура с FatSecret спроектирована
- [x] UI/UX для пользовательского поиска спроектирован
- [x] Регистрация FatSecret API ✅
- [x] Credentials получены и добавлены в план
- [ ] Утверждение пользователя
- [ ] Начало разработки Phase 1

---

## 🚀 ПЛАН ГОТОВ К РЕАЛИЗАЦИИ!

### **Что у нас есть:**

✅ Полная архитектура с 3 источниками данных:
- USDA FoodData (начальная база 500-1000 продуктов)
- FatSecret API (поиск пользователями в real-time)
- Локальная БД PostgreSQL (кэш, растёт автоматически)

✅ Пользовательский поиск продуктов:
- Исключение продуктов при настройке плана
- Замена ингредиентов в рецептах
- Автоматический импорт в БД
- Фильтрация по источнику (БД/API)

✅ Backend готов к реализации:
- NutritionDataService с OAuth 2.0
- API endpoints для поиска и импорта
- Кэширование и дедупликация
- MealPlanGenerator с оптимизацией

✅ Frontend готов к реализации:
- ProductSearchModal компонент
- Brutal cyberpunk дизайн
- Интеграция с существующим UI

✅ FatSecret API настроен:
- Client ID: 54f1eebc60864584bbe6529ff549ed58
- Client Secret: b596986f18ba469da864c0b37c1c775f
- Лимит: 5,000 запросов/день (бесплатно)

### **Следующие шаги:**

1. **Утверждение плана** ← ВЫ ЗДЕСЬ
2. **Phase 1:** База данных и типы (2-3 дня)
3. **Phase 2:** Backend Services (3-4 дня)
4. **Phase 3:** Frontend Components (3-4 дня)
5. **Phase 4:** Интеграция (2 дня)
6. **Phase 5:** Тестирование и Деплой (2 дня)

**Общее время: ~12-15 дней**

---

**Начинаем реализацию? 🎯**
