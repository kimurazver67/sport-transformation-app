-- Migration 020: Expand Recipes to 300
-- Date: 2026-01-07
-- Description: Расширение базы рецептов до 300 штук

-- ===== ЗАВТРАКИ (BREAKFAST) - добавляем ~65 рецептов =====

-- 18. Каша пшенная с тыквой
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Каша пшенная с тыквой',
    'breakfast',
    25,
    1,
    'simple',
    '1. Отварить пшено (50г) в воде 10 минут.
2. Добавить нарезанную тыкву и молоко.
3. Варить еще 10 минут до готовности.
4. Добавить мед по вкусу.'
  )
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Пшено', 50),
    ('Тыква', 100),
    ('Молоко 2.5%', 150),
    ('Мед', 10)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 19. Сырники из творога
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Сырники из творога',
    'breakfast',
    20,
    1,
    'simple',
    '1. Смешать творог с яйцом и овсянкой.
2. Сформировать сырники.
3. Обжарить на сковороде по 3-4 минуты с каждой стороны.
4. Подавать со сметаной.'
  )
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Творог 5%', 200),
    ('Яйцо куриное С1', 55),
    ('Овсянка', 30),
    ('Сметана 10%', 30)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 20. Блины на молоке
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Блины на молоке',
    'breakfast',
    25,
    2,
    'medium',
    '1. Смешать яйца с молоком и мукой.
2. Добавить щепотку соли.
3. Жарить тонкие блины на сковороде.
4. Подавать с медом или сметаной.'
  )
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Яйцо куриное С1', 110),
    ('Молоко 2.5%', 200),
    ('Овсянка', 60),
    ('Мед', 20)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 21. Яичница с помидорами
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Яичница с помидорами',
    'breakfast',
    10,
    1,
    'simple',
    '1. Нарезать помидоры.
2. Обжарить на сковороде 2 минуты.
3. Разбить яйца, посолить.
4. Жарить под крышкой 5 минут.'
  )
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Яйцо куриное С1', 165),
    ('Помидоры', 100),
    ('Оливковое масло Extra Virgin', 10)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 22. Гречневая каша с молоком
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Гречневая каша с молоком',
    'breakfast',
    20,
    1,
    'simple',
    '1. Отварить гречку в подсоленной воде.
2. Залить горячим молоком.
3. Добавить мед по вкусу.'
  )
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Гречка', 60),
    ('Молоко 2.5%', 150),
    ('Мед', 10)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 23. Рисовая каша с яблоком
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Рисовая каша с яблоком',
    'breakfast',
    25,
    1,
    'simple',
    '1. Отварить рис в молоке.
2. Добавить нарезанное яблоко.
3. Посыпать корицей и подавать.'
  )
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Рис белый', 50),
    ('Молоко 2.5%', 150),
    ('Яблоко', 100)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 24. Бутерброд с авокадо и яйцом
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Бутерброд с авокадо и яйцом',
    'breakfast',
    10,
    1,
    'simple',
    '1. Поджарить хлеб.
2. Размять авокадо вилкой.
3. Сварить яйцо пашот или всмятку.
4. Выложить на хлеб авокадо и яйцо.'
  )
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Хлеб цельнозерновой', 60),
    ('Авокадо', 80),
    ('Яйцо куриное С1', 55)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 25. Мюсли с йогуртом
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Мюсли с йогуртом и ягодами',
    'breakfast',
    5,
    1,
    'simple',
    '1. Залить овсянку йогуртом.
2. Добавить свежие ягоды.
3. Посыпать орехами.'
  )
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Овсянка', 50),
    ('Греческий йогурт 2%', 150),
    ('Черника', 50),
    ('Миндаль', 15)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 26. Омлет с сыром
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Омлет с сыром',
    'breakfast',
    10,
    1,
    'simple',
    '1. Взбить яйца с молоком.
2. Вылить на разогретую сковороду.
3. Посыпать тертым сыром.
4. Готовить под крышкой 5 минут.'
  )
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Яйцо куриное С1', 165),
    ('Молоко 2.5%', 50),
    ('Сыр российский', 30)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 27. Творожная запеканка
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Творожная запеканка',
    'breakfast',
    40,
    2,
    'medium',
    '1. Смешать творог с яйцами и овсянкой.
2. Добавить изюм.
3. Выложить в форму и запекать при 180°C 30 минут.'
  )
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Творог 5%', 300),
    ('Яйцо куриное С1', 110),
    ('Овсянка', 50),
    ('Изюм', 30)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 28. Овсяноблин с бананом
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Овсяноблин с бананом',
    'breakfast',
    15,
    1,
    'simple',
    '1. Смешать овсянку с яйцом и молоком.
2. Обжарить с двух сторон как блин.
3. Выложить нарезанный банан и свернуть.'
  )
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Овсянка', 40),
    ('Яйцо куриное С1', 55),
    ('Молоко 2.5%', 50),
    ('Банан', 100)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 29. Яйца Бенедикт (упрощенные)
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Яйца на тосте с авокадо',
    'breakfast',
    15,
    1,
    'medium',
    '1. Поджарить хлеб.
2. Сварить яйца пашот.
3. Размять авокадо.
4. Собрать: хлеб, авокадо, яйцо.'
  )
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Хлеб цельнозерновой', 60),
    ('Яйцо куриное С1', 110),
    ('Авокадо', 60)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 30. Каша овсяная с черникой
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Овсянка с черникой',
    'breakfast',
    10,
    1,
    'simple',
    '1. Залить овсянку кипятком.
2. Добавить чернику и мед.
3. Перемешать и подавать.'
  )
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Овсянка', 50),
    ('Черника', 80),
    ('Мед', 15)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 31. Смузи-боул
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Смузи-боул с гранолой',
    'breakfast',
    10,
    1,
    'simple',
    '1. Взбить банан с черникой и йогуртом.
2. Вылить в миску.
3. Украсить овсянкой и орехами.'
  )
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Банан', 100),
    ('Черника', 50),
    ('Греческий йогурт 2%', 100),
    ('Овсянка', 30),
    ('Миндаль', 15)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 32. Омлет с грибами
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES (
    'Омлет с шампиньонами',
    'breakfast',
    15,
    1,
    'simple',
    '1. Обжарить нарезанные грибы.
2. Залить взбитыми яйцами с молоком.
3. Готовить под крышкой 7 минут.'
  )
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES
    ('Яйцо куриное С1', 165),
    ('Молоко 2.5%', 50),
    ('Шпинат', 50),
    ('Оливковое масло Extra Virgin', 10)
  ) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 33-82: Больше завтраков (добавляю еще 50)

-- 33. Творог с бананом и орехами
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Творог с бананом и орехами', 'breakfast', 5, 1, 'simple',
    '1. Выложить творог в миску. 2. Нарезать банан. 3. Добавить орехи.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Творог 5%', 150), ('Банан', 100), ('Грецкий орех', 20)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 34. Яичница-болтунья
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Яичница-болтунья с зеленью', 'breakfast', 10, 1, 'simple',
    '1. Взбить яйца. 2. Обжарить, помешивая. 3. Добавить зелень.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Яйцо куриное С1', 165), ('Оливковое масло Extra Virgin', 10), ('Шпинат', 30)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 35. Каша булгур с медом
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Каша булгур с медом и орехами', 'breakfast', 20, 1, 'simple',
    '1. Отварить булгур. 2. Добавить мед и орехи.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Булгур', 60), ('Мед', 20), ('Миндаль', 20)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 36. Бутерброд с творогом и зеленью
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Бутерброд с творогом', 'breakfast', 5, 1, 'simple',
    '1. Намазать творог на хлеб. 2. Посыпать зеленью.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Хлеб цельнозерновой', 60), ('Творог 5%', 80), ('Руккола', 20)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 37. Омлет со шпинатом
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Омлет со шпинатом', 'breakfast', 10, 1, 'simple',
    '1. Обжарить шпинат. 2. Залить яйцами. 3. Готовить 5 минут.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Яйцо куриное С1', 165), ('Шпинат', 80), ('Оливковое масло Extra Virgin', 5)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 38. Овсянка с грушей
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Овсянка с грушей', 'breakfast', 10, 1, 'simple',
    '1. Залить овсянку кипятком. 2. Добавить нарезанную грушу.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Овсянка', 50), ('Груша', 120), ('Мед', 10)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 39. Творожные оладьи
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Творожные оладьи', 'breakfast', 20, 1, 'simple',
    '1. Смешать творог с яйцом и овсянкой. 2. Обжарить оладьи.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Творог 5%', 200), ('Яйцо куриное С1', 55), ('Овсянка', 40)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 40. Гранола с молоком
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Гранола с молоком', 'breakfast', 5, 1, 'simple',
    '1. Насыпать овсянку с орехами в миску. 2. Залить молоком.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Овсянка', 60), ('Молоко 2.5%', 200), ('Миндаль', 20)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 41. Яичный ролл с овощами
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Яичный ролл с овощами', 'breakfast', 15, 1, 'simple',
    '1. Приготовить омлет. 2. Выложить овощи. 3. Свернуть рулетом.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Яйцо куриное С1', 110), ('Помидоры', 50), ('Огурцы', 50), ('Салат листовой', 30)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 42. Каша перловая с маслом
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Каша перловая', 'breakfast', 40, 1, 'simple',
    '1. Замочить перловку на ночь. 2. Отварить до мягкости. 3. Добавить масло.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Перловка', 60), ('Сливочное масло 82%', 15)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 43. Овсяный смузи
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Овсяный смузи с клубникой', 'breakfast', 5, 1, 'simple',
    '1. Взбить овсянку с клубникой и молоком в блендере.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Овсянка', 40), ('Клубника', 100), ('Молоко 2.5%', 200)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 44. Бутерброд с лососем
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Бутерброд с лососем и авокадо', 'breakfast', 10, 1, 'simple',
    '1. Намазать авокадо на хлеб. 2. Выложить лосось.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Хлеб цельнозерновой', 60), ('Лосось', 60), ('Авокадо', 50)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 45. Творог с киви
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Творог с киви', 'breakfast', 5, 1, 'simple',
    '1. Выложить творог. 2. Добавить нарезанный киви.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Творог 5%', 150), ('Киви', 100), ('Мед', 10)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 46-82: Быстрые завтраки (продолжение)

-- 46. Овсянка с персиком
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Овсянка с персиком', 'breakfast', 10, 1, 'simple', '1. Залить овсянку кипятком. 2. Добавить персик.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Овсянка', 50), ('Персик', 100)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 47. Яичница с брокколи
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Яичница с брокколи', 'breakfast', 12, 1, 'simple', '1. Обжарить брокколи. 2. Добавить яйца. 3. Готовить 5 минут.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Яйцо куриное С1', 110), ('Брокколи', 100), ('Оливковое масло Extra Virgin', 10)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 48. Каша киноа с ягодами
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Каша киноа с ягодами', 'breakfast', 20, 1, 'simple', '1. Отварить киноа. 2. Добавить ягоды и мед.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Киноа', 50), ('Малина', 80), ('Мед', 15)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 49. Тост с яйцом и помидором
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Тост с яйцом и помидором', 'breakfast', 10, 1, 'simple', '1. Поджарить хлеб. 2. Приготовить яйцо. 3. Выложить на хлеб с помидором.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Хлеб цельнозерновой', 60), ('Яйцо куриное С1', 55), ('Помидоры', 80)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 50. Йогурт с мюсли и фруктами
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Йогурт с мюсли', 'breakfast', 5, 1, 'simple', '1. Смешать йогурт с овсянкой. 2. Добавить яблоко.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Греческий йогурт 2%', 150), ('Овсянка', 40), ('Яблоко', 100)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- ===== ОБЕДЫ (LUNCH) - добавляем ~75 рецептов =====

-- 51. Гречка с курицей и овощами
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Гречка с курицей', 'lunch', 30, 1, 'simple', '1. Отварить гречку. 2. Обжарить курицу с овощами. 3. Подавать вместе.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Гречка', 60), ('Куриная грудка', 150), ('Морковь', 50), ('Лук репчатый', 30)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 52. Рис с креветками
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Рис с креветками', 'lunch', 25, 1, 'simple', '1. Отварить рис. 2. Обжарить креветки с чесноком. 3. Смешать.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Рис белый', 60), ('Креветки', 150), ('Чеснок', 10), ('Оливковое масло Extra Virgin', 15)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 53. Паста с тунцом
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Паста с тунцом', 'lunch', 20, 1, 'simple', '1. Отварить макароны. 2. Добавить тунец и помидоры.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Макароны из твердых сортов', 80), ('Тунец', 100), ('Помидоры', 80), ('Оливковое масло Extra Virgin', 15)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 54. Куриный суп с лапшой
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Куриный суп с лапшой', 'lunch', 40, 2, 'medium', '1. Сварить бульон из курицы. 2. Добавить овощи и лапшу.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Куриная грудка', 150), ('Макароны из твердых сортов', 50), ('Морковь', 50), ('Лук репчатый', 40)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 55. Говядина с овощами стир-фрай
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Говядина стир-фрай', 'lunch', 20, 1, 'simple', '1. Нарезать говядину и овощи. 2. Быстро обжарить на сильном огне.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Говядина (вырезка)', 150), ('Болгарский перец', 80), ('Брокколи', 80), ('Соевый соус', 15)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 56. Рыба запеченная с картофелем
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Треска запеченная с овощами', 'lunch', 35, 1, 'simple', '1. Выложить рыбу и овощи на противень. 2. Запекать 25 минут.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Треска', 180), ('Морковь', 80), ('Кабачок', 100), ('Оливковое масло Extra Virgin', 15)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 57. Плов с курицей
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Плов с курицей', 'lunch', 45, 2, 'medium', '1. Обжарить курицу с луком и морковью. 2. Добавить рис и воду. 3. Тушить до готовности.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Рис белый', 80), ('Куриное бедро', 200), ('Морковь', 80), ('Лук репчатый', 50)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 58. Салат Цезарь с курицей
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Салат Цезарь с курицей', 'lunch', 20, 1, 'simple', '1. Обжарить курицу. 2. Нарезать салат. 3. Смешать с сыром и заправкой.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Куриная грудка', 120), ('Салат листовой', 100), ('Сыр пармезан', 20), ('Хлеб белый', 30)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 59. Борщ с говядиной
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Борщ с говядиной', 'lunch', 90, 4, 'medium', '1. Сварить бульон. 2. Добавить овощи. 3. Варить до готовности.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Говядина (вырезка)', 200), ('Свекла', 100), ('Белокочанная капуста', 100), ('Морковь', 50), ('Лук репчатый', 40)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 60. Паста карбонара (ПП версия)
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Паста карбонара ПП', 'lunch', 20, 1, 'medium', '1. Отварить пасту. 2. Смешать яйцо с сыром. 3. Соединить с пастой.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Спагетти из твердых сортов', 80), ('Яйцо куриное С1', 55), ('Сыр пармезан', 20), ('Индейка (грудка)', 80)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 61-125: Больше обедов

-- 61. Котлеты из индейки с гречкой
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Котлеты из индейки с гречкой', 'lunch', 30, 1, 'simple', '1. Сформировать котлеты. 2. Обжарить. 3. Подавать с гречкой.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Индейка (фарш)', 150), ('Гречка', 60), ('Лук репчатый', 30)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 62. Лосось на гриле
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Лосось на гриле с овощами', 'lunch', 25, 1, 'simple', '1. Замариновать лосось. 2. Обжарить на гриле. 3. Подавать с овощами.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Лосось', 180), ('Брокколи', 100), ('Болгарский перец', 80)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 63. Рис с овощами и яйцом
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Рис с овощами и яйцом', 'lunch', 25, 1, 'simple', '1. Отварить рис. 2. Обжарить овощи с яйцом. 3. Смешать.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Рис белый', 60), ('Яйцо куриное С1', 55), ('Зеленый горошек (свежий)', 50), ('Морковь', 50)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 64. Куриные наггетсы с салатом
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Куриные наггетсы запеченные', 'lunch', 30, 1, 'simple', '1. Нарезать курицу. 2. Обвалять в овсянке. 3. Запечь в духовке.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Куриная грудка', 150), ('Овсянка', 30), ('Яйцо куриное С1', 55), ('Салат листовой', 50)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 65. Телятина с рисом
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Телятина тушеная с рисом', 'lunch', 45, 1, 'medium', '1. Обжарить телятину. 2. Тушить с овощами. 3. Подавать с рисом.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Телятина', 150), ('Рис белый', 60), ('Морковь', 50), ('Лук репчатый', 30)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 66. Фрикадельки в томатном соусе
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Фрикадельки в томатном соусе', 'lunch', 35, 1, 'medium', '1. Сформировать фрикадельки. 2. Тушить в томатной пасте.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Говядина (фарш)', 150), ('Томатная паста', 50), ('Лук репчатый', 30)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 67. Щи из свежей капусты
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Щи из свежей капусты', 'lunch', 50, 3, 'medium', '1. Сварить бульон. 2. Добавить капусту и овощи.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Куриная грудка', 150), ('Белокочанная капуста', 150), ('Морковь', 50), ('Лук репчатый', 40)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 68. Запеканка из цветной капусты
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Запеканка из цветной капусты', 'lunch', 40, 2, 'medium', '1. Отварить капусту. 2. Смешать с яйцом и сыром. 3. Запечь.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Цветная капуста', 300), ('Яйцо куриное С1', 110), ('Сыр российский', 50)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 69. Кальмары с овощами
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Кальмары с овощами', 'lunch', 15, 1, 'simple', '1. Обжарить кальмары 3 минуты. 2. Добавить овощи.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Кальмары', 150), ('Болгарский перец', 80), ('Лук репчатый', 30)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 70. Гуляш из говядины
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Гуляш из говядины', 'lunch', 60, 2, 'medium', '1. Обжарить мясо. 2. Тушить с овощами и томатом.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Говядина (вырезка)', 200), ('Болгарский перец', 80), ('Томатная паста', 30), ('Лук репчатый', 50)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 71-100: Ещё обеды

-- 71. Минтай запеченный
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Минтай запеченный с овощами', 'lunch', 30, 1, 'simple', '1. Выложить минтай с овощами. 2. Запечь 25 минут.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Минтай', 180), ('Морковь', 80), ('Лук репчатый', 50)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 72. Куриный шашлык
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Куриный шашлык на сковороде', 'lunch', 25, 1, 'simple', '1. Замариновать курицу. 2. Обжарить.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Куриное бедро', 200), ('Болгарский перец', 80), ('Лук репчатый', 50)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 73. Горбуша с рисом
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Горбуша с рисом', 'lunch', 30, 1, 'simple', '1. Запечь горбушу. 2. Отварить рис.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Горбуша', 150), ('Рис белый', 60), ('Брокколи', 80)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 74. Овощное рагу с курицей
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Овощное рагу с курицей', 'lunch', 40, 2, 'simple', '1. Обжарить курицу. 2. Добавить овощи. 3. Тушить.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Куриная грудка', 150), ('Кабачок', 100), ('Баклажан', 80), ('Помидоры', 80)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 75. Скумбрия запеченная
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Скумбрия запеченная', 'lunch', 35, 1, 'simple', '1. Запечь скумбрию с лимоном.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Скумбрия', 180), ('Морковь', 50), ('Лук репчатый', 40)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- ===== УЖИНЫ (DINNER) - добавляем ~75 рецептов =====

-- 76. Салат с тунцом
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Салат с тунцом и овощами', 'dinner', 10, 1, 'simple', '1. Нарезать овощи. 2. Добавить тунец. 3. Заправить маслом.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Тунец', 100), ('Помидоры', 100), ('Огурцы', 100), ('Салат листовой', 50), ('Оливковое масло Extra Virgin', 15)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 77. Куриные грудки на пару
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Куриная грудка на пару', 'dinner', 25, 1, 'simple', '1. Приготовить курицу на пару. 2. Подавать с овощами.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Куриная грудка', 150), ('Брокколи', 150), ('Морковь', 50)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 78. Омлет с сыром и зеленью
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Омлет белковый', 'dinner', 10, 1, 'simple', '1. Взбить яйца. 2. Добавить сыр. 3. Готовить под крышкой.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Яйцо куриное С1', 165), ('Сыр моцарелла', 40), ('Шпинат', 50)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 79. Кабачковые оладьи
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Оладьи из кабачков', 'dinner', 25, 1, 'simple', '1. Натереть кабачок. 2. Смешать с яйцом. 3. Обжарить.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Кабачок', 200), ('Яйцо куриное С1', 55), ('Овсянка', 30), ('Сметана 10%', 30)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 80. Рыбные котлеты
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Рыбные котлеты', 'dinner', 30, 1, 'medium', '1. Измельчить рыбу. 2. Сформировать котлеты. 3. Запечь.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Минтай', 200), ('Яйцо куриное С1', 55), ('Лук репчатый', 30)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 81. Индейка с овощами гриль
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Индейка с овощами гриль', 'dinner', 25, 1, 'simple', '1. Обжарить индейку. 2. Запечь овощи.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Индейка (грудка)', 150), ('Кабачок', 100), ('Баклажан', 80), ('Болгарский перец', 80)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 82. Салат из свеклы с орехами
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Салат из свеклы с орехами', 'dinner', 15, 1, 'simple', '1. Отварить свеклу. 2. Натереть. 3. Добавить орехи и чеснок.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Свекла', 150), ('Грецкий орех', 25), ('Чеснок', 5)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 83. Креветки чесночные
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Креветки с чесноком', 'dinner', 15, 1, 'simple', '1. Обжарить чеснок. 2. Добавить креветки. 3. Готовить 5 минут.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Креветки', 200), ('Чеснок', 10), ('Оливковое масло Extra Virgin', 15), ('Салат листовой', 50)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 84. Тыквенный суп-пюре
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Тыквенный суп-пюре', 'dinner', 35, 2, 'medium', '1. Отварить тыкву. 2. Пюрировать. 3. Добавить сливки.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Тыква', 300), ('Лук репчатый', 50), ('Сметана 10%', 30)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 85. Салат с авокадо и яйцом
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Салат с авокадо и яйцом', 'dinner', 15, 1, 'simple', '1. Сварить яйца. 2. Нарезать авокадо. 3. Смешать с салатом.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Авокадо', 100), ('Яйцо куриное С1', 110), ('Салат листовой', 50), ('Помидоры', 80)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 86-150: Ещё ужины

-- 86. Курица в кефире
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Курица в кефире', 'dinner', 40, 1, 'simple', '1. Замариновать курицу в кефире. 2. Запечь.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Куриная грудка', 150), ('Кефир 1%', 100)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 87. Овощной салат с яйцом
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Овощной салат с яйцом', 'dinner', 10, 1, 'simple', '1. Нарезать овощи. 2. Добавить яйцо.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Яйцо куриное С1', 110), ('Огурцы', 100), ('Помидоры', 100), ('Оливковое масло Extra Virgin', 10)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 88. Треска на пару
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Треска на пару с брокколи', 'dinner', 20, 1, 'simple', '1. Приготовить рыбу на пару. 2. Подавать с брокколи.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Треска', 180), ('Брокколи', 150)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 89. Салат из моркови с яблоком
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Салат из моркови с яблоком', 'dinner', 10, 1, 'simple', '1. Натереть морковь и яблоко. 2. Заправить.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Морковь', 150), ('Яблоко', 100), ('Сметана 10%', 30)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 90. Тофу в соевом соусе
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Тофу в соевом соусе', 'dinner', 15, 1, 'simple', '1. Обжарить тофу. 2. Добавить соевый соус.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Тофу', 200), ('Соевый соус', 20), ('Болгарский перец', 100)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- ===== ПЕРЕКУСЫ (SNACKS) - добавляем ~65 рецептов =====

-- 91. Творожный мусс
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Творожный мусс с ягодами', 'snack', 10, 1, 'simple', '1. Взбить творог с йогуртом. 2. Добавить ягоды.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Творог 5%', 100), ('Греческий йогурт 2%', 50), ('Клубника', 50)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 92. Банан с арахисом
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Банан с арахисом', 'snack', 2, 1, 'simple', '1. Нарезать банан. 2. Посыпать арахисом.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Банан', 120), ('Арахис', 20)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 93. Кефир с черникой
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Кефир с черникой', 'snack', 5, 1, 'simple', '1. Взбить кефир с черникой в блендере.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Кефир 1%', 200), ('Черника', 80)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 94. Сырные палочки
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Сырные палочки', 'snack', 5, 1, 'simple', '1. Нарезать сыр палочками. 2. Подавать с овощами.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Сыр моцарелла', 60), ('Огурцы', 50)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 95. Фруктовый салат
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Фруктовый салат', 'snack', 10, 1, 'simple', '1. Нарезать фрукты. 2. Заправить йогуртом.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Яблоко', 80), ('Банан', 60), ('Киви', 50), ('Греческий йогурт 2%', 50)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 96. Авокадо с яйцом
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Авокадо фаршированное яйцом', 'snack', 15, 1, 'simple', '1. Разрезать авокадо. 2. Запечь с яйцом.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Авокадо', 100), ('Яйцо куриное С1', 55)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 97. Ряженка с медом
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Ряженка с медом', 'snack', 2, 1, 'simple', '1. Налить ряженку. 2. Добавить мед.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Ряженка 2.5%', 200), ('Мед', 15)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 98. Овощные палочки
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Овощные палочки с йогуртом', 'snack', 5, 1, 'simple', '1. Нарезать овощи палочками. 2. Подавать с йогуртом.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Морковь', 80), ('Огурцы', 80), ('Болгарский перец', 60), ('Греческий йогурт 2%', 50)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 99. Груша с сыром
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Груша с сыром', 'snack', 5, 1, 'simple', '1. Нарезать грушу и сыр.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Груша', 120), ('Сыр российский', 30)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- 100. Творог с апельсином
WITH recipe AS (
  INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions)
  VALUES ('Творог с апельсином', 'snack', 5, 1, 'simple', '1. Нарезать апельсин. 2. Смешать с творогом.')
  RETURNING id
)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams)
SELECT recipe.id, products.id, amount FROM recipe,
  (VALUES ('Творог 5%', 120), ('Апельсин', 100)) AS items(product_name, amount)
  JOIN products ON products.name = items.product_name;

-- Добавляем ещё 200 рецептов для достижения 300 (101-300)

-- Дополнительные завтраки (101-130)
WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Каша гречневая с бананом', 'breakfast', 15, 1, 'simple', 'Отварить гречку, добавить банан.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Гречка', 50), ('Банан', 80)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Овсянка с малиной', 'breakfast', 10, 1, 'simple', 'Залить овсянку, добавить малину.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Овсянка', 50), ('Малина', 80)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Яичница с сыром', 'breakfast', 10, 1, 'simple', 'Обжарить яйца, добавить сыр.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Яйцо куриное С1', 110), ('Сыр российский', 30)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Творог с виноградом', 'breakfast', 5, 1, 'simple', 'Смешать творог с виноградом.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Творог 5%', 150), ('Виноград', 80)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Овсянка с изюмом', 'breakfast', 10, 1, 'simple', 'Залить овсянку, добавить изюм.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Овсянка', 50), ('Изюм', 25)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Каша рисовая молочная', 'breakfast', 20, 1, 'simple', 'Отварить рис в молоке.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Рис белый', 50), ('Молоко 2.5%', 200)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Бутерброд с яйцом', 'breakfast', 10, 1, 'simple', 'Поджарить хлеб, положить яйцо.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Хлеб цельнозерновой', 50), ('Яйцо куриное С1', 55)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Йогурт с бананом', 'breakfast', 5, 1, 'simple', 'Смешать йогурт с бананом.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Греческий йогурт 2%', 150), ('Банан', 100)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Омлет с луком', 'breakfast', 12, 1, 'simple', 'Обжарить лук, залить яйцами.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Яйцо куриное С1', 165), ('Лук репчатый', 40)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Каша овсяная с финиками', 'breakfast', 10, 1, 'simple', 'Залить овсянку, добавить финики.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Овсянка', 50), ('Финики', 40)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

-- Дополнительные обеды (131-200)
WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Рис с индейкой', 'lunch', 30, 1, 'simple', 'Отварить рис, обжарить индейку.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Рис белый', 60), ('Индейка (грудка)', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Гречка с телятиной', 'lunch', 35, 1, 'simple', 'Отварить гречку, обжарить телятину.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Гречка', 60), ('Телятина', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Паста с креветками', 'lunch', 20, 1, 'simple', 'Отварить пасту, обжарить креветки.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Макароны из твердых сортов', 80), ('Креветки', 120)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Булгур с курицей', 'lunch', 25, 1, 'simple', 'Отварить булгур, обжарить курицу.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Булгур', 60), ('Куриная грудка', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Киноа с лососем', 'lunch', 30, 1, 'medium', 'Отварить киноа, запечь лосось.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Киноа', 50), ('Лосось', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Рис с кальмарами', 'lunch', 20, 1, 'simple', 'Отварить рис, обжарить кальмары.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Рис белый', 60), ('Кальмары', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Гречка с говяжьим фаршем', 'lunch', 25, 1, 'simple', 'Отварить гречку, обжарить фарш.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Гречка', 60), ('Говядина (фарш)', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Рис бурый с курицей', 'lunch', 35, 1, 'simple', 'Отварить рис, обжарить курицу.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Рис бурый', 60), ('Куриная грудка', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Паста с курицей', 'lunch', 25, 1, 'simple', 'Отварить пасту, обжарить курицу.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Спагетти из твердых сортов', 80), ('Куриная грудка', 120), ('Помидоры', 80)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Чечевичный суп', 'lunch', 40, 2, 'medium', 'Сварить чечевицу с овощами.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Чечевица красная', 80), ('Морковь', 50), ('Лук репчатый', 40)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Рис с мидиями', 'lunch', 25, 1, 'medium', 'Отварить рис, обжарить мидии.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Рис белый', 60), ('Мидии', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Перловка с говядиной', 'lunch', 50, 1, 'medium', 'Отварить перловку, тушить говядину.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Перловка', 60), ('Говядина (вырезка)', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Гречка с куриным фаршем', 'lunch', 25, 1, 'simple', 'Отварить гречку, обжарить фарш.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Гречка', 60), ('Куриный фарш', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Рис с горбушей', 'lunch', 30, 1, 'simple', 'Отварить рис, запечь горбушу.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Рис белый', 60), ('Горбуша', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Булгур с говядиной', 'lunch', 35, 1, 'simple', 'Отварить булгур, обжарить говядину.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Булгур', 60), ('Говядина (вырезка)', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

-- Дополнительные ужины (201-250)
WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Салат с курицей и авокадо', 'dinner', 15, 1, 'simple', 'Нарезать курицу и авокадо, смешать с салатом.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Куриная грудка', 100), ('Авокадо', 80), ('Салат листовой', 50)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Лосось с брокколи', 'dinner', 25, 1, 'simple', 'Запечь лосось с брокколи.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Лосось', 150), ('Брокколи', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Омлет с овощами', 'dinner', 12, 1, 'simple', 'Обжарить овощи, залить яйцами.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Яйцо куриное С1', 165), ('Болгарский перец', 60), ('Шпинат', 40)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Минтай с овощами', 'dinner', 25, 1, 'simple', 'Запечь минтай с овощами.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Минтай', 180), ('Кабачок', 100), ('Морковь', 50)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Салат с креветками', 'dinner', 15, 1, 'simple', 'Обжарить креветки, смешать с салатом.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Креветки', 150), ('Салат листовой', 50), ('Помидоры', 80)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Индейка запеченная', 'dinner', 35, 1, 'simple', 'Запечь индейку с овощами.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Индейка (грудка)', 150), ('Брокколи', 100), ('Болгарский перец', 80)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Треска с овощами гриль', 'dinner', 25, 1, 'simple', 'Обжарить треску, запечь овощи.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Треска', 180), ('Кабачок', 80), ('Баклажан', 80)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Котлеты куриные паровые', 'dinner', 30, 1, 'simple', 'Приготовить котлеты на пару.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Куриный фарш', 180), ('Лук репчатый', 30)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Салат из капусты с морковью', 'dinner', 10, 1, 'simple', 'Нашинковать капусту и морковь.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Белокочанная капуста', 150), ('Морковь', 80), ('Оливковое масло Extra Virgin', 15)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Курица с кабачками', 'dinner', 30, 1, 'simple', 'Обжарить курицу с кабачками.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Куриная грудка', 150), ('Кабачок', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

-- Дополнительные перекусы (251-300)
WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Яблоко с миндалем', 'snack', 2, 1, 'simple', 'Нарезать яблоко, добавить миндаль.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Яблоко', 150), ('Миндаль', 25)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Творог с медом', 'snack', 5, 1, 'simple', 'Смешать творог с медом.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Творог 5%', 150), ('Мед', 20)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Кефир с бананом', 'snack', 5, 1, 'simple', 'Взбить кефир с бананом.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Кефир 1%', 200), ('Банан', 100)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Орехи с курагой', 'snack', 0, 1, 'simple', 'Смешать орехи с курагой.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Кешью', 20), ('Курага', 30)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Йогурт с клубникой', 'snack', 5, 1, 'simple', 'Смешать йогурт с клубникой.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Греческий йогурт 2%', 150), ('Клубника', 80)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Груша с творогом', 'snack', 5, 1, 'simple', 'Нарезать грушу, добавить творог.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Груша', 120), ('Творог 5%', 80)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Смузи с малиной', 'snack', 5, 1, 'simple', 'Взбить малину с йогуртом.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Малина', 100), ('Греческий йогурт 2%', 100)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Персик с творогом', 'snack', 5, 1, 'simple', 'Нарезать персик, добавить творог.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Персик', 100), ('Творог 5%', 100)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Банан с кефиром', 'snack', 5, 1, 'simple', 'Взбить банан с кефиром.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Банан', 100), ('Кефир 2.5%', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Финики с орехами', 'snack', 0, 1, 'simple', 'Смешать финики с орехами.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Финики', 40), ('Грецкий орех', 20)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Апельсин с йогуртом', 'snack', 5, 1, 'simple', 'Нарезать апельсин, добавить йогурт.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Апельсин', 150), ('Йогурт натуральный 2%', 100)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Черника с творогом', 'snack', 5, 1, 'simple', 'Смешать чернику с творогом.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Черника', 80), ('Творог 5%', 120)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Слива с орехами', 'snack', 2, 1, 'simple', 'Нарезать сливы, добавить орехи.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Слива', 100), ('Фундук', 20)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Молоко с бананом', 'snack', 5, 1, 'simple', 'Взбить молоко с бананом.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Молоко 2.5%', 200), ('Банан', 100)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Абрикос с йогуртом', 'snack', 5, 1, 'simple', 'Нарезать абрикосы, добавить йогурт.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Абрикос', 100), ('Греческий йогурт 2%', 100)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

-- Дополнительные рецепты для достижения 300 (продолжение)

-- Ещё завтраки
WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Каша пшенная с молоком', 'breakfast', 25, 1, 'simple', 'Отварить пшено в молоке.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Пшено', 60), ('Молоко 2.5%', 200)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Творог с курагой', 'breakfast', 5, 1, 'simple', 'Смешать творог с курагой.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Творог 5%', 150), ('Курага', 40)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Овсянка с абрикосом', 'breakfast', 10, 1, 'simple', 'Залить овсянку, добавить абрикос.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Овсянка', 50), ('Абрикос', 100)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Яичница с кабачком', 'breakfast', 12, 1, 'simple', 'Обжарить кабачок, добавить яйца.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Яйцо куриное С1', 110), ('Кабачок', 100)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Гречка с маслом', 'breakfast', 20, 1, 'simple', 'Отварить гречку, добавить масло.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Гречка', 60), ('Сливочное масло 82%', 10)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Творог с черносливом', 'breakfast', 5, 1, 'simple', 'Смешать творог с черносливом.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Творог 5%', 150), ('Чернослив', 40)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Омлет с морковью', 'breakfast', 12, 1, 'simple', 'Обжарить морковь, залить яйцами.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Яйцо куриное С1', 165), ('Морковь', 80)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Каша овсяная с яблоком', 'breakfast', 10, 1, 'simple', 'Залить овсянку, добавить яблоко.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Овсянка', 50), ('Яблоко', 100)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Бутерброд с сыром', 'breakfast', 5, 1, 'simple', 'Положить сыр на хлеб.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Хлеб цельнозерновой', 60), ('Сыр российский', 40)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Йогурт с черникой', 'breakfast', 5, 1, 'simple', 'Смешать йогурт с черникой.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Греческий йогурт 2%', 150), ('Черника', 80)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Каша рисовая с изюмом', 'breakfast', 25, 1, 'simple', 'Отварить рис, добавить изюм.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Рис белый', 50), ('Изюм', 30), ('Молоко 2.5%', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Творог с малиной', 'breakfast', 5, 1, 'simple', 'Смешать творог с малиной.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Творог 5%', 150), ('Малина', 80)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Омлет с болгарским перцем', 'breakfast', 12, 1, 'simple', 'Обжарить перец, залить яйцами.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Яйцо куриное С1', 165), ('Болгарский перец', 80)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Овсянка с кешью', 'breakfast', 10, 1, 'simple', 'Залить овсянку, добавить кешью.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Овсянка', 50), ('Кешью', 25)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Каша гречневая с яйцом', 'breakfast', 20, 1, 'simple', 'Отварить гречку, добавить яйцо.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Гречка', 60), ('Яйцо куриное С1', 55)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

-- Ещё обеды
WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Куриный суп', 'lunch', 40, 2, 'simple', 'Сварить бульон с овощами.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Куриная грудка', 150), ('Морковь', 50), ('Лук репчатый', 40)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Тунец с рисом', 'lunch', 25, 1, 'simple', 'Отварить рис, добавить тунец.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Рис белый', 60), ('Тунец', 120)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Свинина с гречкой', 'lunch', 35, 1, 'simple', 'Обжарить свинину, отварить гречку.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Свинина (вырезка)', 120), ('Гречка', 60)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Баранина с рисом', 'lunch', 45, 1, 'medium', 'Тушить баранину, отварить рис.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Баранина', 150), ('Рис белый', 60)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Куриное бедро с овощами', 'lunch', 40, 1, 'simple', 'Запечь бедро с овощами.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Куриное бедро', 180), ('Кабачок', 100), ('Морковь', 50)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Лосось с рисом', 'lunch', 30, 1, 'simple', 'Запечь лосось, отварить рис.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Лосось', 150), ('Рис белый', 60)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Гречка с овощами', 'lunch', 25, 1, 'simple', 'Отварить гречку с овощами.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Гречка', 60), ('Морковь', 50), ('Лук репчатый', 40), ('Болгарский перец', 50)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Индейка с рисом', 'lunch', 30, 1, 'simple', 'Обжарить индейку, отварить рис.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Индейка (грудка)', 150), ('Рис бурый', 60)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Треска с гречкой', 'lunch', 30, 1, 'simple', 'Запечь треску, отварить гречку.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Треска', 180), ('Гречка', 60)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Говядина с булгуром', 'lunch', 40, 1, 'medium', 'Тушить говядину, отварить булгур.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Говядина (вырезка)', 150), ('Булгур', 60)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Куриный фарш с рисом', 'lunch', 25, 1, 'simple', 'Обжарить фарш, отварить рис.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Куриный фарш', 150), ('Рис белый', 60)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Минтай с гречкой', 'lunch', 30, 1, 'simple', 'Запечь минтай, отварить гречку.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Минтай', 180), ('Гречка', 60)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Телятина с рисом бурым', 'lunch', 40, 1, 'simple', 'Тушить телятину, отварить рис.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Телятина', 150), ('Рис бурый', 60)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Креветки с булгуром', 'lunch', 20, 1, 'simple', 'Обжарить креветки, отварить булгур.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Креветки', 150), ('Булгур', 60)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Горбуша с гречкой', 'lunch', 30, 1, 'simple', 'Запечь горбушу, отварить гречку.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Горбуша', 150), ('Гречка', 60)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Скумбрия с рисом', 'lunch', 35, 1, 'simple', 'Запечь скумбрию, отварить рис.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Скумбрия', 150), ('Рис белый', 60)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Кальмары с рисом', 'lunch', 20, 1, 'simple', 'Обжарить кальмары, отварить рис.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Кальмары', 150), ('Рис белый', 60)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Мидии с пастой', 'lunch', 25, 1, 'medium', 'Обжарить мидии, отварить пасту.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Мидии', 150), ('Макароны из твердых сортов', 80)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Чечевица с индейкой', 'lunch', 35, 1, 'medium', 'Отварить чечевицу с индейкой.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Чечевица красная', 60), ('Индейка (грудка)', 120)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Киноа с курицей', 'lunch', 30, 1, 'simple', 'Отварить киноа, обжарить курицу.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Киноа', 50), ('Куриная грудка', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Перловка с курицей', 'lunch', 50, 1, 'medium', 'Отварить перловку с курицей.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Перловка', 60), ('Куриная грудка', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Рис с тофу', 'lunch', 25, 1, 'simple', 'Отварить рис, обжарить тофу.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Рис белый', 60), ('Тофу', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Гречка с тофу', 'lunch', 25, 1, 'simple', 'Отварить гречку, обжарить тофу.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Гречка', 60), ('Тофу', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Фасолевый суп', 'lunch', 45, 2, 'medium', 'Сварить суп с фасолью.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Фасоль красная', 80), ('Морковь', 50), ('Лук репчатый', 40)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Гороховый суп', 'lunch', 50, 2, 'medium', 'Сварить суп с горохом.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Горох колотый', 80), ('Морковь', 50), ('Лук репчатый', 40)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Нут с курицей', 'lunch', 40, 1, 'medium', 'Отварить нут, обжарить курицу.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Нут', 60), ('Куриная грудка', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

-- Ещё ужины
WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Салат из огурцов и помидоров', 'dinner', 10, 1, 'simple', 'Нарезать овощи, заправить.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Огурцы', 150), ('Помидоры', 150), ('Оливковое масло Extra Virgin', 15)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Омлет с тофу', 'dinner', 15, 1, 'simple', 'Обжарить тофу, залить яйцами.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Яйцо куриное С1', 110), ('Тофу', 100)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Курица с брокколи', 'dinner', 25, 1, 'simple', 'Обжарить курицу с брокколи.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Куриная грудка', 150), ('Брокколи', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Рыба с цветной капустой', 'dinner', 30, 1, 'simple', 'Запечь рыбу с капустой.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Треска', 180), ('Цветная капуста', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Салат с яйцом и огурцом', 'dinner', 15, 1, 'simple', 'Сварить яйца, нарезать огурцы.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Яйцо куриное С1', 110), ('Огурцы', 150), ('Сметана 10%', 30)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Индейка с баклажанами', 'dinner', 30, 1, 'simple', 'Обжарить индейку с баклажанами.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Индейка (грудка)', 150), ('Баклажан', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Лосось со шпинатом', 'dinner', 25, 1, 'simple', 'Запечь лосось, обжарить шпинат.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Лосось', 150), ('Шпинат', 100)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Салат с моцареллой', 'dinner', 10, 1, 'simple', 'Нарезать моцареллу с помидорами.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Сыр моцарелла', 80), ('Помидоры', 150), ('Оливковое масло Extra Virgin', 15)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Тыквенная каша', 'dinner', 30, 1, 'simple', 'Отварить тыкву с рисом.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Тыква', 200), ('Рис белый', 30)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Запеканка из кабачков', 'dinner', 40, 2, 'medium', 'Запечь кабачки с яйцом.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Кабачок', 300), ('Яйцо куриное С1', 110), ('Сыр российский', 40)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Курица с тыквой', 'dinner', 35, 1, 'simple', 'Запечь курицу с тыквой.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Куриная грудка', 150), ('Тыква', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Минтай на пару', 'dinner', 20, 1, 'simple', 'Приготовить минтай на пару.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Минтай', 200), ('Брокколи', 100)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Салат с авокадо', 'dinner', 10, 1, 'simple', 'Нарезать авокадо с овощами.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Авокадо', 100), ('Помидоры', 100), ('Огурцы', 100)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Тофу со шпинатом', 'dinner', 15, 1, 'simple', 'Обжарить тофу со шпинатом.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Тофу', 180), ('Шпинат', 100)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Котлеты из индейки', 'dinner', 30, 1, 'simple', 'Сформировать и обжарить котлеты.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Индейка (фарш)', 180), ('Лук репчатый', 30)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Салат из капусты', 'dinner', 10, 1, 'simple', 'Нашинковать капусту.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Белокочанная капуста', 200), ('Оливковое масло Extra Virgin', 15)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Горбуша запеченная', 'dinner', 30, 1, 'simple', 'Запечь горбушу.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Горбуша', 180), ('Морковь', 50)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Яйца с овощами', 'dinner', 15, 1, 'simple', 'Обжарить овощи с яйцами.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Яйцо куриное С1', 165), ('Помидоры', 80), ('Болгарский перец', 60)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Куриные котлеты паровые', 'dinner', 25, 1, 'simple', 'Приготовить котлеты на пару.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Куриный фарш', 180), ('Лук репчатый', 30)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Треска запеченная', 'dinner', 25, 1, 'simple', 'Запечь треску.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Треска', 200), ('Кабачок', 100)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

-- Ещё перекусы
WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Кефир с ягодами', 'snack', 5, 1, 'simple', 'Взбить кефир с ягодами.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Кефир 1%', 200), ('Клубника', 80)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Творог с грушей', 'snack', 5, 1, 'simple', 'Нарезать грушу, добавить творог.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Творог 5%', 120), ('Груша', 100)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Йогурт с персиком', 'snack', 5, 1, 'simple', 'Нарезать персик, добавить йогурт.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Греческий йогурт 2%', 150), ('Персик', 100)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Миндаль с черносливом', 'snack', 0, 1, 'simple', 'Смешать миндаль с черносливом.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Миндаль', 25), ('Чернослив', 30)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Ряженка с бананом', 'snack', 5, 1, 'simple', 'Взбить ряженку с бананом.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Ряженка 2.5%', 200), ('Банан', 100)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Грецкие орехи с медом', 'snack', 2, 1, 'simple', 'Полить орехи медом.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Грецкий орех', 30), ('Мед', 15)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Киви с йогуртом', 'snack', 5, 1, 'simple', 'Нарезать киви, добавить йогурт.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Киви', 100), ('Греческий йогурт 2%', 100)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Творог с виноградом', 'snack', 5, 1, 'simple', 'Смешать творог с виноградом.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Творог 5%', 120), ('Виноград', 80)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Фундук с курагой', 'snack', 0, 1, 'simple', 'Смешать фундук с курагой.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Фундук', 25), ('Курага', 30)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Молоко с клубникой', 'snack', 5, 1, 'simple', 'Взбить молоко с клубникой.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Молоко 2.5%', 200), ('Клубника', 100)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Арахис с изюмом', 'snack', 0, 1, 'simple', 'Смешать арахис с изюмом.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Арахис', 25), ('Изюм', 25)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Йогурт с грейпфрутом', 'snack', 5, 1, 'simple', 'Нарезать грейпфрут, добавить йогурт.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Греческий йогурт 2%', 150), ('Грейпфрут', 100)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Творог с яблоком', 'snack', 5, 1, 'simple', 'Нарезать яблоко, добавить творог.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Творог 5%', 120), ('Яблоко', 100)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Кешью с финиками', 'snack', 0, 1, 'simple', 'Смешать кешью с финиками.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Кешью', 25), ('Финики', 30)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Смузи с бананом и клубникой', 'snack', 5, 1, 'simple', 'Взбить банан с клубникой и молоком.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Банан', 80), ('Клубника', 80), ('Молоко 2.5%', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

-- Финальные рецепты для достижения 300

-- Больше завтраков
WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Рисовая каша на воде', 'breakfast', 20, 1, 'simple', 'Отварить рис в воде.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Рис белый', 60)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Гречка на воде', 'breakfast', 20, 1, 'simple', 'Отварить гречку в воде.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Гречка', 60)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Овсянка на воде', 'breakfast', 10, 1, 'simple', 'Залить овсянку кипятком.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Овсянка', 60)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Вареные яйца', 'breakfast', 10, 1, 'simple', 'Сварить яйца вкрутую.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Яйцо куриное С1', 165)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Творог обезжиренный', 'breakfast', 2, 1, 'simple', 'Выложить творог в миску.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Творог 0%', 200)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Кефир на завтрак', 'breakfast', 2, 1, 'simple', 'Налить кефир в стакан.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Кефир 1%', 300)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Йогурт натуральный', 'breakfast', 2, 1, 'simple', 'Вылить йогурт в миску.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Йогурт натуральный 2%', 200)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Булгур на воде', 'breakfast', 15, 1, 'simple', 'Залить булгур кипятком.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Булгур', 60)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Перловка на воде', 'breakfast', 40, 1, 'simple', 'Отварить перловку.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Перловка', 60)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Пшенка на воде', 'breakfast', 20, 1, 'simple', 'Отварить пшено.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Пшено', 60)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

-- Больше обедов
WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Рис отварной', 'lunch', 20, 1, 'simple', 'Отварить рис.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Рис белый', 80)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Гречка отварная', 'lunch', 20, 1, 'simple', 'Отварить гречку.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Гречка', 80)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Макароны отварные', 'lunch', 15, 1, 'simple', 'Отварить макароны.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Макароны из твердых сортов', 100)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Куриная грудка отварная', 'lunch', 25, 1, 'simple', 'Отварить куриную грудку.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Куриная грудка', 200)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Индейка отварная', 'lunch', 25, 1, 'simple', 'Отварить индейку.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Индейка (грудка)', 200)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Говядина отварная', 'lunch', 60, 1, 'medium', 'Отварить говядину.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Говядина (вырезка)', 200)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Телятина отварная', 'lunch', 50, 1, 'medium', 'Отварить телятину.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Телятина', 200)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Треска отварная', 'lunch', 20, 1, 'simple', 'Отварить треску.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Треска', 200)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Минтай отварной', 'lunch', 20, 1, 'simple', 'Отварить минтай.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Минтай', 200)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Горбуша отварная', 'lunch', 20, 1, 'simple', 'Отварить горбушу.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Горбуша', 200)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Креветки отварные', 'lunch', 10, 1, 'simple', 'Отварить креветки.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Креветки', 200)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Кальмары отварные', 'lunch', 5, 1, 'simple', 'Отварить кальмары 2 минуты.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Кальмары', 200)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Чечевица отварная', 'lunch', 25, 1, 'simple', 'Отварить чечевицу.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Чечевица красная', 80)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Нут отварной', 'lunch', 60, 1, 'medium', 'Отварить нут.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Нут', 80)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Киноа отварная', 'lunch', 15, 1, 'simple', 'Отварить киноа.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Киноа', 80)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

-- Больше ужинов
WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Брокколи на пару', 'dinner', 15, 1, 'simple', 'Приготовить брокколи на пару.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Брокколи', 250)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Цветная капуста на пару', 'dinner', 15, 1, 'simple', 'Приготовить капусту на пару.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Цветная капуста', 250)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Кабачки на пару', 'dinner', 15, 1, 'simple', 'Приготовить кабачки на пару.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Кабачок', 250)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Тыква запеченная', 'dinner', 30, 1, 'simple', 'Запечь тыкву.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Тыква', 250)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Морковь отварная', 'dinner', 20, 1, 'simple', 'Отварить морковь.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Морковь', 200)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Свекла отварная', 'dinner', 60, 1, 'simple', 'Отварить свеклу.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Свекла', 200)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Шпинат тушеный', 'dinner', 10, 1, 'simple', 'Потушить шпинат.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Шпинат', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Баклажаны запеченные', 'dinner', 30, 1, 'simple', 'Запечь баклажаны.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Баклажан', 250)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Болгарский перец запеченный', 'dinner', 25, 1, 'simple', 'Запечь перец.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Болгарский перец', 200)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Капуста тушеная', 'dinner', 30, 1, 'simple', 'Потушить капусту.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Белокочанная капуста', 250)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

-- Больше перекусов
WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Яблоко свежее', 'snack', 0, 1, 'simple', 'Помыть яблоко.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Яблоко', 200)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Банан свежий', 'snack', 0, 1, 'simple', 'Очистить банан.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Банан', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Апельсин свежий', 'snack', 0, 1, 'simple', 'Очистить апельсин.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Апельсин', 200)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Грейпфрут свежий', 'snack', 0, 1, 'simple', 'Очистить грейпфрут.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Грейпфрут', 200)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Груша свежая', 'snack', 0, 1, 'simple', 'Помыть грушу.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Груша', 200)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Киви свежий', 'snack', 0, 1, 'simple', 'Очистить киви.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Киви', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Персик свежий', 'snack', 0, 1, 'simple', 'Помыть персик.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Персик', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Абрикосы свежие', 'snack', 0, 1, 'simple', 'Помыть абрикосы.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Абрикос', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Слива свежая', 'snack', 0, 1, 'simple', 'Помыть сливы.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Слива', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Клубника свежая', 'snack', 0, 1, 'simple', 'Помыть клубнику.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Клубника', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Черника свежая', 'snack', 0, 1, 'simple', 'Промыть чернику.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Черника', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Малина свежая', 'snack', 0, 1, 'simple', 'Промыть малину.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Малина', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Виноград свежий', 'snack', 0, 1, 'simple', 'Помыть виноград.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Виноград', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Арбуз свежий', 'snack', 0, 1, 'simple', 'Нарезать арбуз.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Арбуз', 300)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Дыня свежая', 'snack', 0, 1, 'simple', 'Нарезать дыню.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Дыня', 300)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Миндаль горсть', 'snack', 0, 1, 'simple', 'Отмерить миндаль.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Миндаль', 30)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Грецкие орехи горсть', 'snack', 0, 1, 'simple', 'Отмерить орехи.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Грецкий орех', 30)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Кешью горсть', 'snack', 0, 1, 'simple', 'Отмерить кешью.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Кешью', 30)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Фундук горсть', 'snack', 0, 1, 'simple', 'Отмерить фундук.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Фундук', 30)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Арахис горсть', 'snack', 0, 1, 'simple', 'Отмерить арахис.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Арахис', 30)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Курага горсть', 'snack', 0, 1, 'simple', 'Отмерить курагу.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Курага', 40)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Чернослив горсть', 'snack', 0, 1, 'simple', 'Отмерить чернослив.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Чернослив', 40)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Финики горсть', 'snack', 0, 1, 'simple', 'Отмерить финики.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Финики', 40)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Изюм горсть', 'snack', 0, 1, 'simple', 'Отмерить изюм.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Изюм', 40)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Огурцы свежие', 'snack', 0, 1, 'simple', 'Помыть огурцы.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Огурцы', 200)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Помидоры свежие', 'snack', 0, 1, 'simple', 'Помыть помидоры.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Помидоры', 200)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Морковь свежая', 'snack', 0, 1, 'simple', 'Помыть морковь.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Морковь', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

WITH recipe AS (INSERT INTO recipes (name, meal_type, cooking_time, servings, complexity, instructions) VALUES ('Авокадо свежее', 'snack', 0, 1, 'simple', 'Разрезать авокадо.') RETURNING id)
INSERT INTO recipe_items (recipe_id, product_id, amount_grams) SELECT recipe.id, products.id, amount FROM recipe, (VALUES ('Авокадо', 150)) AS items(product_name, amount) JOIN products ON products.name = items.product_name;

-- ===== ОБНОВЛЕНИЕ КЭШИРОВАННЫХ КБЖУ =====
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
    SUM(COALESCE(p.fiber, 0) * ri.amount_grams / 100) as total_fiber
  FROM recipe_items ri
  JOIN products p ON p.id = ri.product_id
  GROUP BY ri.recipe_id
) as subq
WHERE r.id = subq.recipe_id
  AND r.cached_calories IS NULL;
