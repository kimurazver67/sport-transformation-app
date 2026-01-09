-- Migration 021: Replace Recipes with Real Dishes
-- Date: 2026-01-08
-- Description: Замена простых рецептов на полноценные блюда с приготовлением

-- ===== ОЧИСТКА СТАРЫХ ДАННЫХ =====

-- Явно удаляем recipe_items и recipe_tags сначала (на случай если каскад не работает)
DELETE FROM recipe_items;
DELETE FROM recipe_tags;
-- Удаляем все существующие рецепты
DELETE FROM recipes;

-- ===== ЗАВТРАКИ (15 рецептов) =====

-- 1. Каша ячменная с молоком, творогом и медом
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Каша ячменная на молоке с творогом',
    'Каша с творогом',
    'breakfast',
    25,
    '1. Залейте ячневую крупу водой (1:2) и варите 15 минут. 2. Добавьте молоко и варите еще 5 минут до готовности. 3. Снимите с огня, добавьте творог и перемешайте. 4. Подавайте со сметаной и медом.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Ячневая крупа', 175),
  ('Молоко 2.5%', 350),
  ('Творог 5%', 50),
  ('Сметана 15%', 10),
  ('Мед', 30)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 2. Омлет с молоком и зеленью + лаваш
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Омлет с молоком и зеленью с лавашем',
    'Омлет с лавашем',
    'breakfast',
    15,
    '1. Взбейте яйца с молоком, солью и перцем. 2. Разогрейте сковороду с маслом. 3. Вылейте яичную смесь и жарьте на среднем огне 5-7 минут. 4. Добавьте нарезанную зелень за минуту до готовности. 5. Подавайте с лавашем.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Яйцо куриное С1', 165),
  ('Молоко 2.5%', 50),
  ('Лук зелёный (перо)', 10),
  ('Лаваш тонкий', 150),
  ('Подсолнечное масло', 5)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 3. Сырники со сметаной и медом
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Сырники из творога со сметаной',
    'Сырники',
    'breakfast',
    20,
    '1. Смешайте творог, яйцо, муку и щепотку соли. 2. Сформируйте небольшие лепешки. 3. Обжарьте на масле с двух сторон до золотистой корочки (по 3-4 минуты). 4. Подавайте со сметаной и медом.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Творог 5%', 120),
  ('Яйцо куриное С1', 55),
  ('Хлеб белый', 30),
  ('Сметана 15%', 10),
  ('Мед', 30),
  ('Подсолнечное масло', 10)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 4. Бутерброд с тунцом и яйцом
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Бутерброд с тунцом, яйцом и творожным сыром',
    'Бутерброд с тунцом',
    'breakfast',
    10,
    '1. Отварите яйца вкрутую (8-10 минут). 2. Нарежьте хлеб ломтиками. 3. Намажьте творожным сыром. 4. Выложите тунец и нарезанные яйца. 5. Посолите и поперчите по вкусу.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Хлеб ржаной', 175),
  ('Тунец консервированный в воде', 70),
  ('Яйцо куриное С1', 110),
  ('Творожный сыр Альметте', 70)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 5. Овсяная каша с бананом и орехами
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Овсяная каша на молоке с бананом и грецким орехом',
    'Овсянка с бананом',
    'breakfast',
    15,
    '1. Залейте овсянку молоком (1:2) и варите 7-10 минут, помешивая. 2. Добавьте нарезанный банан и варите еще 2 минуты. 3. Снимите с огня, добавьте измельченные орехи. 4. Полейте медом по желанию.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Овсянка', 80),
  ('Молоко 2.5%', 300),
  ('Банан', 100),
  ('Грецкий орех', 20),
  ('Мед', 15)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 6. Гречневая каша с молоком
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Гречневая каша на молоке с маслом',
    'Гречневая каша',
    'breakfast',
    20,
    '1. Промойте гречку и залейте водой (1:2). 2. Варите 15 минут до готовности. 3. Добавьте молоко и сливочное масло. 4. Прогрейте еще 2-3 минуты. 5. Подавайте с медом или сахаром по желанию.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Гречка', 100),
  ('Молоко 2.5%', 200),
  ('Сливочное масло 82%', 10),
  ('Мед', 20)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 7. Творожная запеканка
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Творожная запеканка с изюмом',
    'Творожная запеканка',
    'breakfast',
    40,
    '1. Смешайте творог, яйца, манную крупу, сахар и изюм. 2. Выложите в форму, смазанную маслом. 3. Запекайте при 180°C 30-35 минут до золотистой корочки. 4. Подавайте со сметаной.',
    'medium',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Творог 5%', 200),
  ('Яйцо куриное С1', 110),
  ('Манная крупа', 30),
  ('Сахар белый', 25),
  ('Изюм', 30),
  ('Сметана 15%', 30),
  ('Сливочное масло 82%', 5)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 8. Яичница с помидорами и сыром
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Яичница-глазунья с помидорами и сыром',
    'Яичница с помидорами',
    'breakfast',
    10,
    '1. Разогрейте сковороду с маслом. 2. Нарежьте помидоры кружочками и обжарьте 2 минуты. 3. Разбейте яйца на сковороду. 4. Посыпьте тертым сыром. 5. Жарьте до готовности белка (3-5 минут).',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Яйцо куриное С1', 165),
  ('Помидоры', 100),
  ('Сыр российский', 30),
  ('Подсолнечное масло', 10),
  ('Хлеб ржаной', 80)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 9. Панкейки с медом
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Панкейки на кефире с медом',
    'Панкейки',
    'breakfast',
    25,
    '1. Смешайте кефир, яйцо, муку (из хлеба), сахар и соду. 2. Дайте тесту постоять 5 минут. 3. Жарьте на масле небольшие оладьи с двух сторон. 4. Подавайте с медом и сметаной.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Кефир 2.5%', 150),
  ('Яйцо куриное С1', 55),
  ('Хлеб белый', 80),
  ('Сахар белый', 15),
  ('Мед', 30),
  ('Подсолнечное масло', 10)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 10. Тост с авокадо и яйцом
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Тост с авокадо и яйцом пашот',
    'Тост с авокадо',
    'breakfast',
    15,
    '1. Подсушите хлеб в тостере или на сковороде. 2. Разомните авокадо вилкой с солью и лимонным соком. 3. Отварите яйцо пашот (3-4 минуты в кипящей воде). 4. Намажьте тост авокадо, сверху яйцо. Посолите и поперчите.',
    'medium',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Хлеб цельнозерновой', 100),
  ('Авокадо', 100),
  ('Яйцо куриное С1', 55),
  ('Оливковое масло Extra Virgin', 5)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 11. Рисовая каша с яблоком и корицей
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Рисовая каша на молоке с яблоком',
    'Рисовая каша',
    'breakfast',
    30,
    '1. Отварите рис в воде до полуготовности (10 минут). 2. Добавьте молоко и нарезанное яблоко. 3. Варите еще 15 минут до мягкости. 4. Добавьте масло и мед. 5. Посыпьте корицей.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Рис белый', 80),
  ('Молоко 2.5%', 300),
  ('Яблоко', 100),
  ('Сливочное масло 82%', 10),
  ('Мед', 20)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 12. Блины с творогом
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Блины на молоке с творожной начинкой',
    'Блины с творогом',
    'breakfast',
    30,
    '1. Смешайте молоко, яйца, муку (из хлеба) и соль для теста. 2. Выпекайте тонкие блины. 3. Смешайте творог со сметаной и сахаром. 4. Заверните начинку в блины. 5. Подавайте со сметаной.',
    'medium',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Молоко 2.5%', 200),
  ('Яйцо куриное С1', 110),
  ('Хлеб белый', 100),
  ('Творог 5%', 150),
  ('Сметана 15%', 30),
  ('Сахар белый', 15),
  ('Подсолнечное масло', 15)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 13. Омлет со шпинатом и сыром
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Омлет со шпинатом и моцареллой',
    'Омлет со шпинатом',
    'breakfast',
    15,
    '1. Обжарьте шпинат на масле 2 минуты. 2. Взбейте яйца с молоком. 3. Вылейте на шпинат и готовьте на среднем огне. 4. Посыпьте тертым сыром за минуту до готовности. 5. Накройте крышкой до расплавления сыра.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Яйцо куриное С1', 165),
  ('Молоко 2.5%', 50),
  ('Шпинат', 50),
  ('Сыр моцарелла', 40),
  ('Подсолнечное масло', 5)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 14. Мюсли с йогуртом и ягодами
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Мюсли с греческим йогуртом и ягодами',
    'Мюсли с йогуртом',
    'breakfast',
    5,
    '1. Смешайте овсянку с орехами и изюмом. 2. Добавьте йогурт. 3. Сверху выложите свежие ягоды. 4. Полейте медом. 5. Дайте постоять 2-3 минуты перед подачей.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Овсянка', 60),
  ('Греческий йогурт 2%', 150),
  ('Грецкий орех', 15),
  ('Изюм', 20),
  ('Клубника', 50),
  ('Мед', 15)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 15. Бутерброд с курицей и овощами
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Бутерброд с куриной грудкой и овощами',
    'Бутерброд с курицей',
    'breakfast',
    20,
    '1. Отварите куриную грудку с солью (15 минут). 2. Нарежьте хлеб, курицу, помидор и огурец. 3. Намажьте хлеб творожным сыром. 4. Выложите слоями курицу и овощи. 5. Приправьте по вкусу.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Хлеб цельнозерновой', 120),
  ('Куриная грудка', 80),
  ('Помидоры', 50),
  ('Огурцы', 50),
  ('Творожный сыр Альметте', 30),
  ('Салат листовой', 20)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;


-- ===== ПЕРЕКУСЫ (15 рецептов) =====

-- 16. Творог с ягодами и медом
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Творог с клубникой, орехами и медом',
    'Творог с ягодами',
    'snack',
    5,
    '1. Выложите творог в миску. 2. Добавьте нарезанную клубнику. 3. Посыпьте измельченными орехами. 4. Полейте медом.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Творог 5%', 150),
  ('Клубника', 80),
  ('Грецкий орех', 20),
  ('Мед', 15)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 17. Банан с арахисовым маслом
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Банан с арахисовой пастой',
    'Банан с арахисом',
    'snack',
    3,
    '1. Нарежьте банан кружочками. 2. Выложите на тарелку. 3. Сделайте пасту из измельченного арахиса. 4. Полейте банан арахисовой пастой.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Банан', 120),
  ('Арахис', 30)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 18. Греческий йогурт с орехами
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Греческий йогурт с миндалем и медом',
    'Йогурт с орехами',
    'snack',
    3,
    '1. Выложите йогурт в миску. 2. Добавьте измельченный миндаль. 3. Полейте медом. 4. По желанию добавьте корицу.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Греческий йогурт 2%', 150),
  ('Миндаль', 25),
  ('Мед', 15)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 19. Яблоко с сыром
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Яблоко с сыром чеддер',
    'Яблоко с сыром',
    'snack',
    5,
    '1. Нарежьте яблоко дольками. 2. Нарежьте сыр тонкими ломтиками. 3. Подавайте вместе. 4. По желанию добавьте орехи.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Яблоко', 150),
  ('Сыр чеддер', 40),
  ('Грецкий орех', 15)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 20. Хумус с овощами
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Хумус из нута с овощными палочками',
    'Хумус с овощами',
    'snack',
    15,
    '1. Отварите нут до мягкости (или используйте консервированный). 2. Измельчите блендером с чесноком, оливковым маслом и лимонным соком. 3. Нарежьте овощи соломкой. 4. Подавайте с хумусом.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Нут', 60),
  ('Чеснок', 5),
  ('Оливковое масло Extra Virgin', 10),
  ('Морковь', 50),
  ('Огурцы', 50),
  ('Болгарский перец', 50)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 21. Сухофрукты с орехами
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Микс из сухофруктов и орехов',
    'Сухофрукты с орехами',
    'snack',
    2,
    '1. Смешайте курагу, чернослив и изюм. 2. Добавьте миндаль, грецкие орехи и кешью. 3. Храните в герметичном контейнере.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Курага', 30),
  ('Чернослив', 20),
  ('Изюм', 20),
  ('Миндаль', 20),
  ('Грецкий орех', 20)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 22. Смузи с бананом и клубникой
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Смузи с бананом, клубникой и йогуртом',
    'Ягодный смузи',
    'snack',
    5,
    '1. Положите в блендер банан, клубнику и йогурт. 2. Добавьте молоко для консистенции. 3. Взбейте до однородности. 4. По желанию добавьте мед.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Банан', 100),
  ('Клубника', 80),
  ('Греческий йогурт 2%', 100),
  ('Молоко 2.5%', 100),
  ('Мед', 10)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 23. Хлебцы с творожным сыром и авокадо
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Хлебцы с творожным сыром и авокадо',
    'Хлебцы с авокадо',
    'snack',
    5,
    '1. Намажьте хлебцы творожным сыром. 2. Нарежьте авокадо тонкими ломтиками. 3. Выложите на хлебцы. 4. Посолите и поперчите. 5. По желанию добавьте семена чиа.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Хлебцы гречневые', 40),
  ('Творожный сыр Альметте', 40),
  ('Авокадо', 60),
  ('Семена чиа', 5)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 24. Вареное яйцо с огурцом
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Яйца вкрутую с огурцом и помидором',
    'Яйца с овощами',
    'snack',
    12,
    '1. Отварите яйца вкрутую (10 минут). 2. Нарежьте огурцы и помидоры. 3. Подавайте вместе с солью и зеленью.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Яйцо куриное С1', 110),
  ('Огурцы', 100),
  ('Помидоры', 80)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 25. Тост с сыром и помидором
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Тост с моцареллой и помидором',
    'Тост с моцареллой',
    'snack',
    10,
    '1. Нарежьте хлеб и помидор. 2. Выложите на хлеб сыр и помидор. 3. Запеките в духовке или микроволновке до расплавления сыра (3-5 минут). 4. Посыпьте зеленью.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Хлеб ржаной', 80),
  ('Сыр моцарелла', 40),
  ('Помидоры', 60),
  ('Лук зелёный (перо)', 5)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 26. Роллы из лаваша с курицей
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Роллы из лаваша с курицей и овощами',
    'Роллы с курицей',
    'snack',
    15,
    '1. Отварите куриную грудку. 2. Нарежьте курицу, огурец и помидор. 3. Намажьте лаваш творожным сыром. 4. Выложите начинку и сверните рулетом. 5. Нарежьте на порции.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Лаваш тонкий', 100),
  ('Куриная грудка', 60),
  ('Огурцы', 50),
  ('Помидоры', 50),
  ('Творожный сыр Альметте', 30),
  ('Салат листовой', 20)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 27. Овощной салат с фетой
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Греческий салат с фетой и оливками',
    'Салат с фетой',
    'snack',
    10,
    '1. Нарежьте помидоры, огурцы и перец кубиками. 2. Добавьте оливки и нарезанную фету. 3. Заправьте оливковым маслом и лимонным соком. 4. Посолите и добавьте орегано.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Помидоры', 100),
  ('Огурцы', 80),
  ('Болгарский перец', 50),
  ('Сыр Фета', 40),
  ('Оливки зелёные', 20),
  ('Оливковое масло Extra Virgin', 10)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 28. Яблоки запеченные с творогом
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Яблоки запеченные с творогом и медом',
    'Печеные яблоки',
    'snack',
    25,
    '1. Вырежьте сердцевину из яблок. 2. Смешайте творог с медом и изюмом. 3. Наполните яблоки начинкой. 4. Запекайте при 180°C 20 минут.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Яблоко', 200),
  ('Творог 5%', 60),
  ('Мед', 15),
  ('Изюм', 15)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 29. Морковь с хумусом
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Морковные палочки с хумусом из нута',
    'Морковь с хумусом',
    'snack',
    10,
    '1. Нарежьте морковь и огурец палочками. 2. Смешайте нут с чесноком и оливковым маслом в блендере. 3. Подавайте овощи с хумусом.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Морковь', 100),
  ('Огурцы', 50),
  ('Нут', 50),
  ('Чеснок', 5),
  ('Оливковое масло Extra Virgin', 10)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 30. Кефир с ягодами
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Кефир с клубникой и семенами чиа',
    'Кефир с ягодами',
    'snack',
    5,
    '1. Налейте кефир в стакан. 2. Добавьте нарезанную клубнику. 3. Посыпьте семенами чиа. 4. По желанию добавьте мед.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Кефир 2.5%', 200),
  ('Клубника', 80),
  ('Семена чиа', 10),
  ('Мед', 10)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;


-- ===== ОБЕДЫ (15 рецептов) =====

-- 31. Запеченная курица в томатном соусе с чечевицей
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Куриная грудка запеченная в томатном соусе с чечевицей',
    'Курица с чечевицей',
    'lunch',
    35,
    '1. Обжарьте куриную грудку до золотистой корочки (5 минут). 2. Добавьте томатную пасту, воду и прованские травы. 3. Тушите под крышкой 15 минут. 4. Отварите чечевицу отдельно (20 минут). 5. Подавайте курицу с чечевицей, заправленной маслом.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Куриная грудка', 80),
  ('Томатная паста', 25),
  ('Чечевица красная', 80),
  ('Подсолнечное масло', 10),
  ('Лук репчатый', 30)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 32. Тушеная куриная печень с бататом
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Куриная печень тушеная с морковью и луком + батат',
    'Печень с бататом',
    'lunch',
    35,
    '1. Обжарьте лук и морковь на масле (5 минут). 2. Добавьте печень и обжарьте 7-10 минут. 3. Добавьте немного воды и тушите 10 минут. 4. Запеките батат в духовке при 200°C (20 минут) или отварите. 5. Подавайте вместе.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Куриная печень', 130),
  ('Морковь', 70),
  ('Лук репчатый', 50),
  ('Батат (сладкий картофель)', 200),
  ('Подсолнечное масло', 5)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 33. Куриный суп с макаронами
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Суп куриный с макаронами и овощами',
    'Куриный суп',
    'lunch',
    40,
    '1. Отварите куриную грудку в подсоленной воде (20 минут). 2. Достаньте курицу, в бульон добавьте нарезанные овощи. 3. Варите 10 минут, добавьте макароны. 4. Варите еще 7-10 минут. 5. Добавьте нарезанную курицу и зелень.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Куриная грудка', 80),
  ('Макароны из твердых сортов', 60),
  ('Лук репчатый', 30),
  ('Морковь', 70),
  ('Картофель молодой', 100),
  ('Лук зелёный (перо)', 10)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 34. Паста с куриным фаршем и сыром
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Паста Болоньезе с куриным фаршем и пармезаном',
    'Паста Болоньезе',
    'lunch',
    30,
    '1. Обжарьте лук и морковь на масле (5 минут). 2. Добавьте фарш, обжарьте до готовности (10 минут). 3. Добавьте томатную пасту и тушите 10 минут. 4. Отварите пасту. 5. Смешайте с соусом, посыпьте сыром.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Куриный фарш', 80),
  ('Спагетти из твердых сортов', 80),
  ('Лук репчатый', 30),
  ('Морковь', 50),
  ('Томатная паста', 30),
  ('Сыр пармезан', 20),
  ('Подсолнечное масло', 10)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 35. Запеченная рыба с овощами
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Лосось запеченный с брокколи и морковью',
    'Лосось с овощами',
    'lunch',
    30,
    '1. Нарежьте овощи. 2. Выложите на противень рыбу и овощи, сбрызните маслом. 3. Посолите, поперчите, добавьте лимонный сок. 4. Запекайте при 180°C 20-25 минут.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Лосось', 120),
  ('Брокколи', 150),
  ('Морковь', 80),
  ('Оливковое масло Extra Virgin', 10)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 36. Гречка с тушеной говядиной
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Гречка с тушеной говядиной и луком',
    'Гречка с говядиной',
    'lunch',
    40,
    '1. Нарежьте говядину кусочками, обжарьте до корочки (5 минут). 2. Добавьте лук, обжарьте 3 минуты. 3. Добавьте воду и тушите 25 минут. 4. Отварите гречку отдельно. 5. Подавайте мясо с гречкой.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Говядина (вырезка)', 100),
  ('Гречка', 80),
  ('Лук репчатый', 50),
  ('Морковь', 50),
  ('Подсолнечное масло', 10)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 37. Рис с индейкой и овощами
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Рис с индейкой и овощами в соевом соусе',
    'Рис с индейкой',
    'lunch',
    30,
    '1. Отварите рис (20 минут). 2. Нарежьте индейку кусочками, обжарьте (7 минут). 3. Добавьте нарезанные овощи, обжарьте 5 минут. 4. Добавьте соевый соус. 5. Смешайте с рисом.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Индейка (грудка)', 100),
  ('Рис белый', 80),
  ('Болгарский перец', 80),
  ('Морковь', 50),
  ('Лук репчатый', 40),
  ('Соевый соус', 15),
  ('Подсолнечное масло', 10)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 38. Котлеты из курицы с картофельным пюре
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Куриные котлеты с картофельным пюре',
    'Котлеты с пюре',
    'lunch',
    35,
    '1. Смешайте куриный фарш с луком, яйцом и хлебом (размоченным). 2. Сформируйте котлеты, обжарьте с двух сторон (по 7 минут). 3. Отварите картофель, сделайте пюре с молоком и маслом. 4. Подавайте вместе.',
    'medium',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Куриный фарш', 120),
  ('Лук репчатый', 30),
  ('Яйцо куриное С1', 55),
  ('Хлеб белый', 30),
  ('Картофель молодой', 200),
  ('Молоко 2.5%', 50),
  ('Сливочное масло 82%', 10),
  ('Подсолнечное масло', 15)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 39. Плов с курицей
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Плов с куриной грудкой и овощами',
    'Плов с курицей',
    'lunch',
    40,
    '1. Обжарьте курицу кусочками (5 минут). 2. Добавьте лук и морковь, обжарьте 5 минут. 3. Добавьте рис, залейте водой (1:2). 4. Добавьте специи, тушите под крышкой 25 минут. 5. Дайте настояться 5 минут.',
    'medium',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Куриная грудка', 100),
  ('Рис белый', 80),
  ('Морковь', 80),
  ('Лук репчатый', 60),
  ('Чеснок', 10),
  ('Подсолнечное масло', 15)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 40. Треска с перловкой и овощами
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Треска запеченная с перловкой и овощами',
    'Треска с перловкой',
    'lunch',
    40,
    '1. Отварите перловку (30 минут). 2. Обжарьте овощи на масле (7 минут). 3. Выложите рыбу на противень с овощами. 4. Запекайте при 180°C 15-20 минут. 5. Подавайте с перловкой.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Треска', 130),
  ('Перловка', 70),
  ('Морковь', 70),
  ('Лук репчатый', 50),
  ('Помидоры', 80),
  ('Оливковое масло Extra Virgin', 10)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 41. Говяжий гуляш с макаронами
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Гуляш из говядины с макаронами',
    'Говяжий гуляш',
    'lunch',
    50,
    '1. Нарежьте говядину кубиками, обжарьте до корочки (7 минут). 2. Добавьте лук и морковь, обжарьте 5 минут. 3. Добавьте томатную пасту и воду, тушите 30 минут. 4. Отварите макароны. 5. Подавайте гуляш с макаронами.',
    'medium',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Говядина (вырезка)', 120),
  ('Макароны из твердых сортов', 80),
  ('Лук репчатый', 50),
  ('Морковь', 50),
  ('Томатная паста', 30),
  ('Подсолнечное масло', 10)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 42. Минтай с картофелем в духовке
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Минтай запеченный с картофелем и луком',
    'Минтай с картофелем',
    'lunch',
    40,
    '1. Нарежьте картофель кружочками, лук - полукольцами. 2. Выложите на противень слоями: картофель, рыба, лук. 3. Сбрызните маслом, посолите. 4. Запекайте при 180°C 35 минут.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Минтай', 150),
  ('Картофель молодой', 200),
  ('Лук репчатый', 50),
  ('Морковь', 50),
  ('Оливковое масло Extra Virgin', 10)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 43. Куриное филе с киноа и овощами
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Куриное филе с киноа и запеченными овощами',
    'Курица с киноа',
    'lunch',
    35,
    '1. Отварите киноа (15 минут). 2. Обжарьте куриное филе на гриле или сковороде (10 минут). 3. Запеките овощи в духовке при 200°C (20 минут). 4. Подавайте все вместе.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Куриная грудка', 100),
  ('Киноа', 70),
  ('Брокколи', 100),
  ('Болгарский перец', 80),
  ('Морковь', 50),
  ('Оливковое масло Extra Virgin', 10)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 44. Свинина с гречкой и грибами
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Свинина с гречкой и грибами',
    'Свинина с гречкой',
    'lunch',
    40,
    '1. Обжарьте свинину кусочками (7 минут). 2. Добавьте лук, обжарьте 3 минуты. 3. Отварите гречку отдельно. 4. Смешайте все вместе. 5. Подавайте горячим.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Свинина (вырезка)', 100),
  ('Гречка', 80),
  ('Лук репчатый', 50),
  ('Морковь', 50),
  ('Подсолнечное масло', 10)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 45. Рыбный суп с овощами
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Уха из трески с овощами',
    'Рыбный суп',
    'lunch',
    35,
    '1. Доведите воду до кипения, добавьте нарезанный картофель. 2. Через 10 минут добавьте морковь и лук. 3. Через 5 минут добавьте рыбу. 4. Варите 10 минут. 5. Добавьте зелень, дайте настояться.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Треска', 120),
  ('Картофель молодой', 150),
  ('Морковь', 50),
  ('Лук репчатый', 40),
  ('Лук зелёный (перо)', 10)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;


-- ===== УЖИНЫ (15 рецептов) =====

-- 46. Тунец с овощным салатом
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Тунец с салатом из рукколы и овощей',
    'Тунец с салатом',
    'dinner',
    15,
    '1. Обжарьте или запеките тунец (7-10 минут). 2. Нарежьте морковь тонкими слайсами. 3. Смешайте рукколу, морковь, лимонный сок и оливковое масло. 4. Подавайте тунец с салатом.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Тунец', 100),
  ('Руккола', 50),
  ('Морковь', 70),
  ('Лук зелёный (перо)', 10),
  ('Чеснок', 10),
  ('Оливковое масло Extra Virgin', 10)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 47. Морепродукты с салатом и бататом
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Креветки с салатом из рукколы и запеченным бататом',
    'Креветки с бататом',
    'dinner',
    30,
    '1. Запеките батат в духовке при 200°C (25 минут). 2. Обжарьте креветки с чесноком на масле (5-7 минут). 3. Сбрызните лимонным соком. 4. Подавайте с рукколой и бататом.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Креветки', 100),
  ('Руккола', 50),
  ('Чеснок', 10),
  ('Батат (сладкий картофель)', 165),
  ('Оливковое масло Extra Virgin', 10)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 48. Курица запеченная с овощами и фунчозой
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Куриная грудка запеченная с овощами и фунчозой',
    'Курица с фунчозой',
    'dinner',
    35,
    '1. Нарежьте курицу и овощи. 2. Выложите на противень, сбрызните маслом. 3. Запекайте при 180°C 25 минут. 4. Залейте фунчозу кипятком на 5 минут. 5. Смешайте все вместе.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Куриная грудка', 90),
  ('Морковь', 70),
  ('Болгарский перец', 50),
  ('Лук репчатый', 40),
  ('Фунчоза (стеклянная)', 35),
  ('Подсолнечное масло', 5)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 49. Куриные котлеты с сыром и салатом
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Куриные котлеты с моцареллой, салатом и фунчозой',
    'Котлеты с сыром',
    'dinner',
    25,
    '1. Смешайте куриный фарш с луком и чесноком. 2. Сформируйте котлеты, внутрь положите кусочек сыра. 3. Обжарьте с двух сторон (по 7 минут). 4. Залейте фунчозу кипятком. 5. Подавайте с салатом из рукколы.',
    'medium',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Куриный фарш', 100),
  ('Лук репчатый', 30),
  ('Чеснок', 10),
  ('Сыр моцарелла', 30),
  ('Руккола', 30),
  ('Фунчоза (стеклянная)', 25),
  ('Подсолнечное масло', 10)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 50. Лосось с брокколи на пару
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Лосось на пару с брокколи и лимоном',
    'Лосось на пару',
    'dinner',
    20,
    '1. Приготовьте лосось на пару или запеките (12-15 минут). 2. Отварите брокколи на пару (7 минут). 3. Сбрызните лимонным соком и оливковым маслом. 4. Посолите и поперчите.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Лосось', 120),
  ('Брокколи', 200),
  ('Оливковое масло Extra Virgin', 10),
  ('Чеснок', 5)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 51. Индейка с киноа и салатом
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Индейка на гриле с киноа и овощным салатом',
    'Индейка с киноа',
    'dinner',
    30,
    '1. Обжарьте индейку на гриле или сковороде (10-12 минут). 2. Отварите киноа (15 минут). 3. Приготовьте салат из помидоров, огурцов и рукколы. 4. Заправьте оливковым маслом. 5. Подавайте все вместе.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Индейка (грудка)', 100),
  ('Киноа', 60),
  ('Помидоры', 80),
  ('Огурцы', 50),
  ('Руккола', 30),
  ('Оливковое масло Extra Virgin', 10)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 52. Треска с овощами в фольге
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Треска с овощами запеченная в фольге',
    'Треска в фольге',
    'dinner',
    30,
    '1. Нарежьте овощи кружочками. 2. Выложите на фольгу рыбу и овощи. 3. Сбрызните маслом, посолите, добавьте специи. 4. Заверните в фольгу. 5. Запекайте при 180°C 25 минут.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Треска', 130),
  ('Помидоры', 100),
  ('Болгарский перец', 80),
  ('Лук репчатый', 40),
  ('Оливковое масло Extra Virgin', 10)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 53. Куриная грудка с цветной капустой
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Куриная грудка с цветной капустой и зеленью',
    'Курица с капустой',
    'dinner',
    25,
    '1. Обжарьте куриную грудку на масле (10-12 минут). 2. Отварите цветную капусту на пару (10 минут). 3. Обжарьте капусту с чесноком на масле (3 минуты). 4. Посыпьте зеленью и подавайте.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Куриная грудка', 100),
  ('Цветная капуста', 200),
  ('Чеснок', 10),
  ('Лук зелёный (перо)', 10),
  ('Оливковое масло Extra Virgin', 10)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 54. Омлет с овощами
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Омлет с помидорами, перцем и шпинатом',
    'Овощной омлет',
    'dinner',
    15,
    '1. Обжарьте нарезанные овощи на масле (5 минут). 2. Взбейте яйца с молоком. 3. Вылейте на овощи. 4. Жарьте под крышкой до готовности (7-10 минут). 5. Посыпьте зеленью.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Яйцо куриное С1', 165),
  ('Молоко 2.5%', 50),
  ('Помидоры', 80),
  ('Болгарский перец', 50),
  ('Шпинат', 30),
  ('Подсолнечное масло', 5)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 55. Говядина с овощами на гриле
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Говядина на гриле с запеченными овощами',
    'Говядина на гриле',
    'dinner',
    30,
    '1. Обжарьте говядину на гриле до желаемой степени прожарки (7-10 минут). 2. Нарежьте овощи, сбрызните маслом. 3. Запеките овощи в духовке при 200°C (15-20 минут). 4. Подавайте вместе.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Говядина (вырезка)', 110),
  ('Брокколи', 100),
  ('Болгарский перец', 80),
  ('Кабачок', 100),
  ('Оливковое масло Extra Virgin', 10)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 56. Минтай с салатом
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Минтай жареный с салатом из свежих овощей',
    'Минтай с салатом',
    'dinner',
    20,
    '1. Обжарьте минтай на масле с двух сторон (по 5-7 минут). 2. Приготовьте салат из помидоров, огурцов и листового салата. 3. Заправьте оливковым маслом и лимонным соком. 4. Подавайте рыбу с салатом.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Минтай', 130),
  ('Помидоры', 100),
  ('Огурцы', 80),
  ('Салат листовой', 40),
  ('Оливковое масло Extra Virgin', 10),
  ('Подсолнечное масло', 5)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 57. Творожная запеканка с ягодами
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Творожная запеканка с клубникой на ужин',
    'Творожная запеканка',
    'dinner',
    40,
    '1. Смешайте творог, яйца, манку и сахар. 2. Добавьте нарезанную клубнику. 3. Выложите в форму. 4. Запекайте при 180°C 30-35 минут. 5. Подавайте теплой или холодной.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Творог 5%', 200),
  ('Яйцо куриное С1', 110),
  ('Манная крупа', 30),
  ('Сахар белый', 20),
  ('Клубника', 80)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 58. Кальмары с овощами
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Кальмары жареные с овощами и чесноком',
    'Кальмары с овощами',
    'dinner',
    20,
    '1. Отварите кальмары в кипящей воде 2-3 минуты, нарежьте кольцами. 2. Обжарьте овощи на масле (5 минут). 3. Добавьте кальмары и чеснок, обжарьте 2-3 минуты. 4. Приправьте соевым соусом.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Кальмары', 120),
  ('Болгарский перец', 80),
  ('Лук репчатый', 50),
  ('Морковь', 50),
  ('Чеснок', 10),
  ('Соевый соус', 10),
  ('Подсолнечное масло', 10)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 59. Куриное филе с салатом Цезарь
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Куриное филе на гриле с салатом Цезарь',
    'Салат Цезарь',
    'dinner',
    20,
    '1. Обжарьте куриную грудку на гриле (10 минут). 2. Нарежьте салат и курицу. 3. Приготовьте заправку из йогурта, чеснока и пармезана. 4. Смешайте все ингредиенты. 5. Подавайте с гренками.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Куриная грудка', 100),
  ('Салат листовой', 100),
  ('Сыр пармезан', 20),
  ('Греческий йогурт 2%', 30),
  ('Чеснок', 5),
  ('Хлеб белый', 40),
  ('Оливковое масло Extra Virgin', 10)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;

-- 60. Тунец с салатом и киноа
WITH new_recipe AS (
  INSERT INTO recipes (name, name_short, meal_type, cooking_time, instructions, complexity, servings)
  VALUES (
    'Тунец консервированный с киноа и овощным салатом',
    'Тунец с киноа',
    'dinner',
    20,
    '1. Отварите киноа (15 минут). 2. Приготовьте салат из помидоров, огурцов и рукколы. 3. Добавьте тунец из банки (слить жидкость). 4. Смешайте с киноа. 5. Заправьте оливковым маслом и лимонным соком.',
    'simple',
    1
  )
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT new_recipe.id, p.id, amounts.grams
FROM new_recipe
CROSS JOIN (VALUES
  ('Тунец консервированный в воде', 100),
  ('Киноа', 60),
  ('Помидоры', 80),
  ('Огурцы', 60),
  ('Руккола', 40),
  ('Оливковое масло Extra Virgin', 10)
) AS amounts(product_name, grams)
JOIN products p ON p.name = amounts.product_name;


-- ===== ОБНОВЛЕНИЕ КЭШИРОВАННЫХ ЗНАЧЕНИЙ КБЖУ =====

-- Пересчитываем cached nutrition для всех рецептов
UPDATE recipes r
SET
  cached_calories = (
    SELECT SUM(
      (p.calories * ri.amount_grams / 100) *
      CASE
        WHEN p.cooking_ratio < 1 THEN p.cooking_ratio
        ELSE 1
      END
    )
    FROM recipe_items ri
    JOIN products p ON p.id = ri.product_id
    WHERE ri.recipe_id = r.id
  ),
  cached_protein = (
    SELECT SUM(
      (p.protein * ri.amount_grams / 100) *
      CASE
        WHEN p.cooking_ratio < 1 THEN p.cooking_ratio
        ELSE 1
      END
    )
    FROM recipe_items ri
    JOIN products p ON p.id = ri.product_id
    WHERE ri.recipe_id = r.id
  ),
  cached_fat = (
    SELECT SUM(
      (p.fat * ri.amount_grams / 100) *
      CASE
        WHEN p.cooking_ratio < 1 THEN p.cooking_ratio
        ELSE 1
      END
    )
    FROM recipe_items ri
    JOIN products p ON p.id = ri.product_id
    WHERE ri.recipe_id = r.id
  ),
  cached_carbs = (
    SELECT SUM(
      (p.carbs * ri.amount_grams / 100) *
      CASE
        WHEN p.cooking_ratio < 1 THEN p.cooking_ratio
        ELSE 1
      END
    )
    FROM recipe_items ri
    JOIN products p ON p.id = ri.product_id
    WHERE ri.recipe_id = r.id
  ),
  cached_fiber = (
    SELECT SUM(
      (p.fiber * ri.amount_grams / 100) *
      CASE
        WHEN p.cooking_ratio < 1 THEN p.cooking_ratio
        ELSE 1
      END
    )
    FROM recipe_items ri
    JOIN products p ON p.id = ri.product_id
    WHERE ri.recipe_id = r.id
  );

-- ===== ИТОГОВАЯ СТАТИСТИКА =====

DO $$
DECLARE
  breakfast_count INT;
  snack_count INT;
  lunch_count INT;
  dinner_count INT;
  total_count INT;
BEGIN
  SELECT COUNT(*) INTO breakfast_count FROM recipes WHERE meal_type = 'breakfast';
  SELECT COUNT(*) INTO snack_count FROM recipes WHERE meal_type = 'snack';
  SELECT COUNT(*) INTO lunch_count FROM recipes WHERE meal_type = 'lunch';
  SELECT COUNT(*) INTO dinner_count FROM recipes WHERE meal_type = 'dinner';
  SELECT COUNT(*) INTO total_count FROM recipes;

  RAISE NOTICE '=== Migration 021 Complete ===';
  RAISE NOTICE 'Завтраки: % рецептов', breakfast_count;
  RAISE NOTICE 'Перекусы: % рецептов', snack_count;
  RAISE NOTICE 'Обеды: % рецептов', lunch_count;
  RAISE NOTICE 'Ужины: % рецептов', dinner_count;
  RAISE NOTICE 'ВСЕГО: % полноценных рецептов с приготовлением', total_count;
END $$;
