-- Migration 014: Nutrition System - Products, Recipes, Meal Plans
-- Date: 2026-01-07
-- Description: Complete nutrition database schema with FatSecret integration

-- ===== ENUMS =====

-- Product categories
DO $$ BEGIN
  CREATE TYPE product_category AS ENUM (
    'meat',           -- Мясо
    'poultry',        -- Птица
    'fish',           -- Рыба
    'seafood',        -- Морепродукты
    'dairy',          -- Молочные продукты
    'eggs',           -- Яйца
    'grains',         -- Крупы
    'pasta',          -- Макароны
    'bread',          -- Хлеб
    'vegetables',     -- Овощи
    'fruits',         -- Фрукты
    'nuts',           -- Орехи
    'dried_fruits',   -- Сухофрукты
    'oils',           -- Масла
    'condiments',     -- Приправы/соусы
    'legumes',        -- Бобовые
    'beverages',      -- Напитки
    'other'           -- Прочее
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Meal types
DO $$ BEGIN
  CREATE TYPE meal_type AS ENUM (
    'breakfast',      -- Завтрак
    'lunch',          -- Обед
    'dinner',         -- Ужин
    'snack'           -- Перекус
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tag types
DO $$ BEGIN
  CREATE TYPE tag_type AS ENUM (
    'allergen',       -- Аллерген (лактоза, глютен, орехи)
    'diet',           -- Диета (веган, вегетарианец)
    'preference'      -- Предпочтение (без сахара, низкокалорийное)
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Meal plan status
DO $$ BEGIN
  CREATE TYPE meal_plan_status AS ENUM (
    'draft',          -- Черновик
    'active',         -- Активный план
    'completed',      -- Завершён
    'archived'        -- Архивирован
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;


-- ===== PRODUCTS TABLE =====

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- OpenFoodFacts integration
  openfoodfacts_code VARCHAR(50) UNIQUE,
  imported_by_user_id UUID REFERENCES users(id),

  -- Basic info
  name VARCHAR(200) NOT NULL,
  name_short VARCHAR(50),

  -- Nutrition per 100g
  calories DECIMAL(6,2) NOT NULL,
  protein DECIMAL(5,2) NOT NULL,
  fat DECIMAL(5,2) NOT NULL,
  carbs DECIMAL(5,2) NOT NULL,
  fiber DECIMAL(5,2) DEFAULT 0,

  -- Product properties
  category product_category NOT NULL,
  is_perishable BOOLEAN DEFAULT true,
  cooking_ratio DECIMAL(3,2) DEFAULT 1.0,  -- коэффициент усушки/уварки

  -- Pricing (optional)
  price_per_kg DECIMAL(8,2),

  -- Unit info
  unit VARCHAR(20) DEFAULT 'г',
  unit_weight DECIMAL(8,2),  -- вес одной единицы (для штучных продуктов)

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_openfoodfacts ON products(openfoodfacts_code);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);


-- ===== TAGS TABLE =====

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  name_ru VARCHAR(100) NOT NULL,
  type tag_type NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tags_type ON tags(type);


-- ===== PRODUCT TAGS (many-to-many) =====

CREATE TABLE IF NOT EXISTS product_tags (
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_product_tags_product ON product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag ON product_tags(tag_id);


-- ===== RECIPES TABLE =====

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name VARCHAR(200) NOT NULL,
  name_short VARCHAR(100),
  meal_type meal_type NOT NULL,

  -- Instructions
  cooking_time INT,  -- minutes
  instructions TEXT,

  -- Portions
  servings INT DEFAULT 1,
  is_scalable BOOLEAN DEFAULT true,
  min_portion DECIMAL(3,2) DEFAULT 0.5,
  max_portion DECIMAL(3,2) DEFAULT 2.0,

  -- Complexity
  complexity VARCHAR(20) DEFAULT 'simple',  -- simple, medium, complex

  -- Cached nutrition (для оптимизации, пересчитывается при изменении ингредиентов)
  cached_calories DECIMAL(7,2),
  cached_protein DECIMAL(6,2),
  cached_fat DECIMAL(6,2),
  cached_carbs DECIMAL(6,2),
  cached_fiber DECIMAL(6,2),

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipes_meal_type ON recipes(meal_type);
CREATE INDEX IF NOT EXISTS idx_recipes_complexity ON recipes(complexity);
CREATE INDEX IF NOT EXISTS idx_recipes_active ON recipes(is_active);


-- ===== RECIPE ITEMS (ingredients) =====

CREATE TABLE IF NOT EXISTS recipe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,

  amount_grams DECIMAL(8,2) NOT NULL,
  is_optional BOOLEAN DEFAULT false,
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_items_recipe ON recipe_items(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_items_product ON recipe_items(product_id);


-- ===== RECIPE TAGS (many-to-many) =====

CREATE TABLE IF NOT EXISTS recipe_tags (
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_recipe_tags_recipe ON recipe_tags(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_tag ON recipe_tags(tag_id);


-- ===== MEAL PLANS =====

CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Plan parameters
  weeks INT DEFAULT 4,
  status meal_plan_status DEFAULT 'active',

  -- Target nutrition (from user's KBJU)
  target_calories INT NOT NULL,
  target_protein INT NOT NULL,
  target_fat INT NOT NULL,
  target_carbs INT NOT NULL,

  -- Stats (пересчитываются при генерации)
  avg_calories INT,
  avg_protein DECIMAL(6,2),
  avg_fat DECIMAL(6,2),
  avg_carbs DECIMAL(6,2),

  -- Settings
  allow_repeat_days INT DEFAULT 3,
  prefer_simple BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meal_plans_user ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_status ON meal_plans(status);


-- ===== MEAL DAYS =====

CREATE TABLE IF NOT EXISTS meal_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,

  -- Day info
  week_number INT NOT NULL,
  day_number INT NOT NULL,  -- 1-7 (Пн-Вс)

  -- Day totals
  total_calories INT,
  total_protein DECIMAL(6,2),
  total_fat DECIMAL(6,2),
  total_carbs DECIMAL(6,2),

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(meal_plan_id, week_number, day_number)
);

CREATE INDEX IF NOT EXISTS idx_meal_days_plan ON meal_days(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_days_week ON meal_days(week_number);


-- ===== MEALS =====

CREATE TABLE IF NOT EXISTS meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_day_id UUID REFERENCES meal_days(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,

  meal_type meal_type NOT NULL,
  portion_multiplier DECIMAL(4,2) DEFAULT 1.0,

  -- Calculated nutrition
  calories INT,
  protein DECIMAL(6,2),
  fat DECIMAL(6,2),
  carbs DECIMAL(6,2),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meals_day ON meals(meal_day_id);
CREATE INDEX IF NOT EXISTS idx_meals_recipe ON meals(recipe_id);
CREATE INDEX IF NOT EXISTS idx_meals_type ON meals(meal_type);


-- ===== USER EXCLUSIONS =====

-- Excluded tags (allergens, diets)
CREATE TABLE IF NOT EXISTS user_excluded_tags (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_user_excluded_tags_user ON user_excluded_tags(user_id);

-- Excluded products
CREATE TABLE IF NOT EXISTS user_excluded_products (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_user_excluded_products_user ON user_excluded_products(user_id);


-- ===== SHOPPING LIST =====

CREATE TABLE IF NOT EXISTS shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,

  -- Aggregated amount
  total_grams DECIMAL(10,2) NOT NULL,

  -- Shopping frequency
  is_monthly BOOLEAN DEFAULT false,  -- true = покупать раз в месяц (нескоропортящиеся)
  week_numbers INT[],  -- для weekly items: [1,2,3,4]

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shopping_list_plan ON shopping_list_items(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_product ON shopping_list_items(product_id);


-- ===== OPENFOODFACTS CACHE =====

CREATE TABLE IF NOT EXISTS openfoodfacts_search_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_query VARCHAR(255) NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX IF NOT EXISTS idx_openfoodfacts_cache_query ON openfoodfacts_search_cache(search_query);
CREATE INDEX IF NOT EXISTS idx_openfoodfacts_cache_expires ON openfoodfacts_search_cache(expires_at);


-- ===== FUNCTIONS =====

-- Trigger для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recipes_updated_at ON recipes;
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meal_plans_updated_at ON meal_plans;
CREATE TRIGGER update_meal_plans_updated_at BEFORE UPDATE ON meal_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ===== COMMENTS =====

COMMENT ON TABLE products IS 'Продукты с КБЖУ (локальная БД + OpenFoodFacts импорты)';
COMMENT ON TABLE tags IS 'Теги: аллергены, диеты, предпочтения';
COMMENT ON TABLE recipes IS 'Рецепты блюд с инструкциями';
COMMENT ON TABLE recipe_items IS 'Ингредиенты рецептов';
COMMENT ON TABLE meal_plans IS 'Планы питания пользователей (4 недели)';
COMMENT ON TABLE meal_days IS 'Дни в плане питания';
COMMENT ON TABLE meals IS 'Приёмы пищи (завтрак, обед, ужин, перекус)';
COMMENT ON TABLE user_excluded_tags IS 'Исключения пользователя: аллергены и диеты';
COMMENT ON TABLE user_excluded_products IS 'Исключения пользователя: конкретные продукты';
COMMENT ON TABLE shopping_list_items IS 'Список покупок (агрегированный)';
COMMENT ON TABLE openfoodfacts_search_cache IS 'Кэш результатов поиска OpenFoodFacts API';
