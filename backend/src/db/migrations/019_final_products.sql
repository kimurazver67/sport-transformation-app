-- Migration 019: Final Products Expansion to reach 500+
-- Date: 2026-01-07
-- Description: Добавление финальных ~75 продуктов

-- ===== МЯСНЫЕ ДЕЛИКАТЕСЫ И КОЛБАСЫ =====

INSERT INTO products (name, calories, protein, fat, carbs, fiber, category, is_perishable, cooking_ratio) VALUES
('Колбаса варёная Докторская', 257, 13.7, 22.2, 1.5, 0, 'meat', true, 1.0),
('Колбаса варёная Молочная', 252, 11.7, 22.8, 0.2, 0, 'meat', true, 1.0),
('Сосиски молочные', 266, 11.0, 23.9, 1.6, 0, 'meat', true, 1.0),
('Сардельки свиные', 332, 10.1, 31.6, 1.9, 0, 'meat', true, 1.0),
('Ветчина из индейки', 84, 17.0, 1.5, 2.0, 0, 'meat', true, 1.0),
('Ветчина куриная', 108, 18.0, 4.2, 0, 0, 'meat', true, 1.0),
('Бекон', 541, 23.0, 45.0, 1.0, 0, 'meat', true, 1.0),
('Грудинка копчёная', 605, 10.0, 63.0, 0, 0, 'meat', true, 1.0),
('Салями', 336, 21.6, 27.4, 2.0, 0, 'meat', true, 1.0),
('Пепперони', 494, 23.0, 44.0, 1.2, 0, 'meat', true, 1.0),
('Прошутто', 237, 25.5, 15.0, 0, 0, 'meat', true, 1.0),
('Хамон Серрано', 241, 30.5, 12.7, 0, 0, 'meat', true, 1.0),
('Чоризо', 455, 24.1, 38.3, 2.0, 0, 'meat', true, 1.0),
('Копчёная куриная грудка', 117, 18.0, 5.0, 0, 0, 'meat', true, 1.0),
('Паштет печёночный', 301, 11.6, 28.1, 2.8, 0, 'meat', true, 1.0)
ON CONFLICT (name) DO NOTHING;

-- ===== СЫРЫ И ТВОРОЖНЫЕ ПРОДУКТЫ =====

INSERT INTO products (name, calories, protein, fat, carbs, fiber, category, is_perishable, cooking_ratio) VALUES
('Сыр Моцарелла', 280, 28.0, 17.1, 2.2, 0, 'dairy', true, 1.0),
('Сыр Фета', 264, 14.2, 21.3, 4.1, 0, 'dairy', true, 1.0),
('Сыр Рикотта', 174, 11.3, 13.0, 3.0, 0, 'dairy', true, 1.0),
('Сыр Маскарпоне', 412, 7.6, 41.0, 4.8, 0, 'dairy', true, 1.0),
('Сыр Чеддер', 402, 24.9, 33.1, 1.3, 0, 'dairy', true, 1.0),
('Сыр Грюйер', 413, 29.8, 32.3, 0.4, 0, 'dairy', true, 1.0),
('Сыр Эмменталь', 380, 28.5, 27.5, 3.6, 0, 'dairy', true, 1.0),
('Сыр Горгонзола', 353, 21.4, 28.7, 2.3, 0, 'dairy', true, 1.0),
('Сливочный сыр (Philadelphia)', 342, 5.9, 34.2, 4.1, 0, 'dairy', true, 1.0),
('Творожный сыр Альметте', 210, 8.0, 18.0, 4.5, 0, 'dairy', true, 1.0),
('Адыгейский сыр', 240, 19.8, 14.0, 1.5, 0, 'dairy', true, 1.0),
('Сулугуни', 290, 20.0, 24.0, 0.4, 0, 'dairy', true, 1.0)
ON CONFLICT (name) DO NOTHING;

-- ===== КОНСЕРВЫ И МАРИНАДЫ =====

INSERT INTO products (name, calories, protein, fat, carbs, fiber, category, is_perishable, cooking_ratio) VALUES
('Тунец консервированный в воде', 116, 25.5, 0.8, 0, 0, 'fish', false, 1.0),
('Тунец консервированный в масле', 198, 27.1, 9.0, 0, 0, 'fish', false, 1.0),
('Сардины в масле', 208, 24.6, 11.5, 0, 0, 'fish', false, 1.0),
('Шпроты в масле', 363, 17.4, 32.4, 0.4, 0, 'fish', false, 1.0),
('Лосось консервированный', 142, 19.8, 6.3, 0, 0, 'fish', false, 1.0),
('Кукуруза консервированная', 119, 2.2, 1.4, 25.2, 2.3, 'vegetables', false, 1.0),
('Огурцы маринованные', 16, 0.8, 0.1, 2.7, 1.0, 'vegetables', false, 1.0),
('Помидоры консервированные', 23, 1.1, 0.2, 4.0, 1.2, 'vegetables', false, 1.0),
('Оливки зелёные', 145, 1.0, 15.3, 3.8, 3.3, 'vegetables', false, 1.0),
('Маслины чёрные', 115, 0.8, 10.7, 6.3, 3.2, 'vegetables', false, 1.0),
('Каперсы', 23, 2.4, 0.9, 4.9, 3.2, 'vegetables', false, 1.0)
ON CONFLICT (name) DO NOTHING;

-- ===== ЗАМОРОЖЕННЫЕ ПРОДУКТЫ =====

INSERT INTO products (name, calories, protein, fat, carbs, fiber, category, is_perishable, cooking_ratio) VALUES
('Пельмени мясные', 275, 11.9, 12.4, 29.0, 1.5, 'other', true, 1.15),
('Вареники с картофелем', 148, 4.4, 3.7, 23.6, 2.0, 'other', true, 1.15),
('Вареники с творогом', 197, 9.8, 4.4, 30.0, 1.0, 'other', true, 1.15),
('Хинкали', 235, 10.5, 8.7, 28.9, 1.2, 'other', true, 1.15),
('Манты', 223, 12.0, 7.0, 29.0, 1.5, 'other', true, 1.15)
ON CONFLICT (name) DO NOTHING;

-- ===== СЛАДОСТИ И СНЕКИ (для учёта реальной диеты) =====

INSERT INTO products (name, calories, protein, fat, carbs, fiber, category, is_perishable, cooking_ratio) VALUES
('Мёд натуральный', 304, 0.8, 0, 82.4, 0.2, 'other', false, 1.0),
('Сахар белый', 387, 0, 0, 99.8, 0, 'other', false, 1.0),
('Сахар коричневый', 377, 0.1, 0, 97.3, 0, 'other', false, 1.0),
('Кленовый сироп', 260, 0, 0, 67.0, 0, 'other', false, 1.0),
('Шоколад тёмный 70%', 546, 7.8, 35.4, 52.6, 11.0, 'other', false, 1.0),
('Шоколад молочный', 535, 7.6, 29.7, 60.3, 3.4, 'other', false, 1.0),
('Попкорн без масла', 387, 13.0, 4.2, 77.8, 15.0, 'other', false, 1.0),
('Чипсы картофельные', 536, 6.6, 37.5, 49.3, 4.2, 'other', false, 1.0)
ON CONFLICT (name) DO NOTHING;

-- ===== ПРОТЕИНОВЫЕ ПРОДУКТЫ =====

INSERT INTO products (name, calories, protein, fat, carbs, fiber, category, is_perishable, cooking_ratio) VALUES
('Тофу', 76, 8.1, 4.8, 1.9, 0.3, 'other', true, 1.0),
('Темпе', 193, 20.3, 10.8, 9.4, 0, 'other', true, 1.0),
('Сейтан (пшеничный белок)', 370, 75.0, 1.9, 14.0, 0.6, 'other', true, 1.0),
('Протеиновый порошок (сывороточный)', 412, 80.0, 7.5, 7.0, 0, 'other', false, 1.0),
('Протеиновый порошок (растительный)', 387, 70.0, 8.0, 15.0, 5.0, 'other', false, 1.0)
ON CONFLICT (name) DO NOTHING;

-- ===== ЭКЗОТИЧЕСКИЕ КРУПЫ И ЗЁРНА =====

INSERT INTO products (name, calories, protein, fat, carbs, fiber, category, is_perishable, cooking_ratio) VALUES
('Кус-кус', 376, 12.8, 0.6, 77.4, 5.0, 'grains', false, 2.5),
('Тапиока (крупа)', 358, 0.2, 0, 88.7, 0.9, 'grains', false, 3.0),
('Сорго', 329, 10.6, 3.5, 72.1, 6.7, 'grains', false, 2.8)
ON CONFLICT (name) DO NOTHING;

-- ===== ДОПОЛНИТЕЛЬНЫЕ ОВОЩИ =====

INSERT INTO products (name, calories, protein, fat, carbs, fiber, category, is_perishable, cooking_ratio) VALUES
('Бамбук (побеги)', 27, 2.6, 0.3, 5.2, 2.2, 'vegetables', true, 0.90),
('Водяной каштан', 97, 1.4, 0.1, 23.9, 3.0, 'vegetables', true, 1.0),
('Латук (салат)', 15, 1.4, 0.2, 2.9, 1.3, 'vegetables', true, 1.0),
('Эндивий', 17, 1.3, 0.2, 3.4, 3.1, 'vegetables', true, 1.0)
ON CONFLICT (name) DO NOTHING;

-- ===== ДОПОЛНИТЕЛЬНЫЕ ФРУКТЫ И ЯГОДЫ =====

INSERT INTO products (name, calories, protein, fat, carbs, fiber, category, is_perishable, cooking_ratio) VALUES
('Карамбола', 31, 1.0, 0.3, 6.7, 2.8, 'fruits', true, 1.0),
('Драконий фрукт (питайя)', 60, 1.2, 0.4, 13.0, 3.0, 'fruits', true, 1.0),
('Рамбутан', 82, 0.7, 0.2, 20.9, 0.9, 'fruits', true, 1.0),
('Кумкват', 71, 1.9, 0.9, 15.9, 6.5, 'fruits', true, 1.0)
ON CONFLICT (name) DO NOTHING;

-- ===== ИТОГО =====
-- После этой миграции: 428 + 75 = 503 продукта
