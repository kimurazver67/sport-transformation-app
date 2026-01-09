-- Migration 017: Seed Recipes (15-20 Simple Recipes)
-- Date: 2026-01-07
-- Description: Базовые простые рецепты для генератора планов питания
-- Note: Idempotent - uses ON CONFLICT DO NOTHING for existing recipes

-- Временная таблица для хранения UUID продуктов (для удобства)
-- Вместо UUID будем использовать subqueries для получения ID по имени

-- ===== ЗАВТРАКИ (BREAKFAST) =====

-- 1. Овсянка с бананом и орехами
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Овсянка с бананом и орехами',
    'breakfast',
    10,
    1,
    'simple',
    '1. Залить овсянку кипятком (250мл) и дать настояться 5 минут.
2. Добавить нарезанный банан и горсть орехов.
3. Перемешать и подавать.'
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Овсянка', 50),
    ('Банан', 100),
    ('Грецкий орех', 20)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name
ON CONFLICT DO NOTHING;

-- 2. Омлет с овощами
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Омлет с овощами',
    'breakfast',
    15,
    1,
    'simple',
    '1. Взбить 3 яйца с 50мл молока.
2. Обжарить нарезанные помидоры и шпинат на сковороде (1-2 мин).
3. Залить яичной смесью, готовить под крышкой 5-7 минут.'
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Яйцо куриное С1', 165),  -- 3 яйца по 55г
    ('Молоко 2.5%', 50),
    ('Помидоры', 80),
    ('Шпинат', 50),
    ('Оливковое масло Extra Virgin', 5)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name
ON CONFLICT DO NOTHING;

-- 3. Творог с ягодами и медом
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Творог с ягодами',
    'breakfast',
    5,
    1,
    'simple',
    '1. Выложить творог в миску.
2. Добавить свежую клубнику.
3. Полить медом, перемешать.'
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Творог 5%', 150),
    ('Клубника', 100),
    ('Мед', 15)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name
ON CONFLICT DO NOTHING;

-- 4. Яичница с авокадо
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Яичница с авокадо',
    'breakfast',
    10,
    1,
    'simple',
    '1. Обжарить 2 яйца на оливковом масле.
2. Нарезать авокадо ломтиками.
3. Подавать вместе, посыпать солью и перцем.'
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Яйцо куриное С1', 110),  -- 2 яйца
    ('Авокадо', 100),
    ('Оливковое масло Extra Virgin', 5)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name
ON CONFLICT DO NOTHING;

-- ===== ОБЕДЫ (LUNCH) =====

-- 5. Куриная грудка с гречкой и овощами
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Куриная грудка с гречкой и овощами',
    'lunch',
    30,
    1,
    'simple',
    '1. Отварить гречку (50г сухой крупы).
2. Обжарить куриную грудку на сковороде 7-10 минут с каждой стороны.
3. Приготовить овощи на пару или обжарить.
4. Подавать вместе.'
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Куриная грудка', 150),
    ('Гречка', 50),
    ('Брокколи', 100),
    ('Морковь', 50),
    ('Оливковое масло Extra Virgin', 10)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name
ON CONFLICT DO NOTHING;

-- 6. Лосось с киноа и шпинатом
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Лосось с киноа и шпинатом',
    'lunch',
    25,
    1,
    'medium',
    '1. Отварить киноа (50г сухой крупы).
2. Запечь лосось в духовке 180°C 15 минут.
3. Обжарить шпинат на оливковом масле 2-3 минуты.
4. Подавать вместе.'
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Лосось', 150),
    ('Киноа', 50),
    ('Шпинат', 100),
    ('Лук репчатый', 30),
    ('Оливковое масло Extra Virgin', 10)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name
ON CONFLICT DO NOTHING;

-- 7. Говядина с рисом и овощами
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Говядина с рисом и овощами',
    'lunch',
    35,
    1,
    'simple',
    '1. Отварить рис (50г сухой крупы).
2. Обжарить говядину кусочками на сковороде.
3. Добавить болгарский перец и кабачок, тушить 10 минут.
4. Подавать с рисом.'
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Говядина (вырезка)', 150),
    ('Рис белый', 50),
    ('Болгарский перец', 100),
    ('Кабачок', 100),
    ('Оливковое масло Extra Virgin', 10)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name
ON CONFLICT DO NOTHING;

-- 8. Индейка с булгуром
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Индейка с булгуром и овощами',
    'lunch',
    25,
    1,
    'simple',
    '1. Залить булгур кипятком, дать настояться 15 минут.
2. Обжарить индейку на гриле или сковороде.
3. Приготовить салат из помидоров, огурцов и зелени.
4. Подавать вместе.'
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Индейка (грудка)', 150),
    ('Булгур', 50),
    ('Помидоры', 80),
    ('Огурцы', 80),
    ('Салат листовой', 30),
    ('Оливковое масло Extra Virgin', 10)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name
ON CONFLICT DO NOTHING;

-- 9. Чечевичный суп с курицей
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Чечевичный суп с курицей',
    'lunch',
    40,
    2,
    'medium',
    '1. Обжарить лук и морковь на масле.
2. Добавить куриную грудку кусочками, обжарить.
3. Добавить чечевицу и воду (600мл), варить 25 минут.
4. Добавить помидоры за 5 минут до готовности.'
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Куриная грудка', 150),
    ('Чечевица красная', 80),
    ('Морковь', 60),
    ('Лук репчатый', 50),
    ('Помидоры', 100),
    ('Оливковое масло Extra Virgin', 10)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name
ON CONFLICT DO NOTHING;

-- ===== УЖИНЫ (DINNER) =====

-- 10. Запеченная треска с овощами
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Запеченная треска с овощами',
    'dinner',
    30,
    1,
    'simple',
    '1. Выложить треску и овощи (брокколи, цветная капуста) на противень.
2. Сбрызнуть оливковым маслом, посыпать специями.
3. Запекать при 180°C 20-25 минут.'
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Треска', 180),
    ('Брокколи', 150),
    ('Цветная капуста', 100),
    ('Оливковое масло Extra Virgin', 10)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name
ON CONFLICT DO NOTHING;

-- 11. Куриные котлеты с овощным салатом
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Куриные котлеты с салатом',
    'dinner',
    25,
    1,
    'simple',
    '1. Сформировать котлеты из куриного фарша с яйцом.
2. Обжарить на сковороде или запечь в духовке.
3. Приготовить салат из помидоров, огурцов и салата.
4. Заправить маслом.'
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Куриный фарш', 150),
    ('Яйцо куриное С1', 55),
    ('Помидоры', 100),
    ('Огурцы', 100),
    ('Салат листовой', 50),
    ('Оливковое масло Extra Virgin', 10)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name
ON CONFLICT DO NOTHING;

-- 12. Тофу с овощами
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Тофу с овощами на сковороде',
    'dinner',
    20,
    1,
    'simple',
    '1. Нарезать тофу кубиками, обжарить на масле до золотистой корочки.
2. Добавить нарезанные овощи (болгарский перец, брокколи).
3. Тушить 10 минут, добавить соевый соус.
4. Подавать горячим.'
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Тофу', 150),
    ('Брокколи', 100),
    ('Болгарский перец', 100),
    ('Соевый соус', 15),
    ('Оливковое масло Extra Virgin', 10)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name
ON CONFLICT DO NOTHING;

-- 13. Греческий салат с курицей
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Греческий салат с курицей',
    'dinner',
    15,
    1,
    'simple',
    '1. Нарезать помидоры, огурцы, болгарский перец.
2. Добавить оливки, сыр фета (моцарелла).
3. Добавить отварную куриную грудку кусочками.
4. Заправить оливковым маслом и лимонным соком.'
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Куриная грудка', 120),
    ('Помидоры', 100),
    ('Огурцы', 100),
    ('Болгарский перец', 80),
    ('Сыр моцарелла', 50),
    ('Оливковое масло Extra Virgin', 15)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name
ON CONFLICT DO NOTHING;

-- ===== ПЕРЕКУСЫ (SNACKS) =====

-- 14. Протеиновый смузи
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Протеиновый смузи',
    'snack',
    5,
    1,
    'simple',
    '1. Смешать в блендере банан, ягоды, протеин, молоко.
2. Взбить до однородности.
3. Подавать холодным.'
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Банан', 100),
    ('Клубника', 80),
    ('Протеин сывороточный', 30),
    ('Молоко 2.5%', 200)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name
ON CONFLICT DO NOTHING;

-- 15. Горсть орехов с сухофруктами
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Орехово-фруктовая смесь',
    'snack',
    0,
    1,
    'simple',
    'Смешать миндаль, грецкие орехи, курагу и чернослив. Готово!'
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Миндаль', 20),
    ('Грецкий орех', 15),
    ('Курага', 20),
    ('Чернослив', 15)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name
ON CONFLICT DO NOTHING;

-- 16. Греческий йогурт с орехами и медом
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Греческий йогурт с орехами',
    'snack',
    2,
    1,
    'simple',
    '1. Выложить йогурт в миску.
2. Добавить измельченные орехи и мед.
3. Перемешать.'
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Греческий йогурт 2%', 150),
    ('Грецкий орех', 20),
    ('Мед', 10)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name
ON CONFLICT DO NOTHING;

-- 17. Яблоко с арахисовой пастой (используем арахис)
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Яблоко с орехами',
    'snack',
    2,
    1,
    'simple',
    '1. Нарезать яблоко дольками.
2. Подавать с горстью арахиса.'
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Яблоко', 150),
    ('Арахис', 25)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name
ON CONFLICT DO NOTHING;

-- ===== ОБНОВЛЕНИЕ КЭШИРОВАННЫХ КБЖУ =====
-- Рассчитываем КБЖУ для каждого рецепта на основе ингредиентов

UPDATE recipes r
SET
  cached_calories = subq.total_calories,
  cached_protein = subq.total_protein,
  cached_fat = subq.total_fat,
  cached_carbs = subq.total_carbs,
  cached_fiber = subq.total_fiber
FROM (
  SELECT
    ri.recipe_id,
    SUM(p.calories * ri.amount_grams / 100) as total_calories,
    SUM(p.protein * ri.amount_grams / 100) as total_protein,
    SUM(p.fat * ri.amount_grams / 100) as total_fat,
    SUM(p.carbs * ri.amount_grams / 100) as total_carbs,
    SUM(p.fiber * ri.amount_grams / 100) as total_fiber
  FROM recipe_items ri
  JOIN products p ON p.id = ri.product_id
  GROUP BY ri.recipe_id
) as subq
WHERE r.id = subq.recipe_id;
