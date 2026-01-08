-- Migration 024: Reseed Products after OpenFoodFacts migration
-- Date: 2026-01-08
-- Description: Восстановление продуктов после изменения схемы

-- Проверяем есть ли продукты
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM products) < 10 THEN
    -- ===== МЯСО (MEAT) =====
    INSERT INTO products (name, calories, protein, fat, carbs, fiber, category, is_perishable, cooking_ratio) VALUES
    ('Говядина (вырезка)', 250, 26.0, 16.0, 0, 0, 'meat', true, 0.75),
    ('Говядина (фарш)', 254, 17.2, 20.0, 0, 0, 'meat', true, 0.70),
    ('Свинина (вырезка)', 316, 16.0, 27.8, 0, 0, 'meat', true, 0.70),
    ('Баранина', 209, 16.3, 15.3, 0, 0, 'meat', true, 0.70),
    ('Телятина', 172, 19.7, 7.8, 0, 0, 'meat', true, 0.75)
    ON CONFLICT DO NOTHING;

    -- ===== ПТИЦА (POULTRY) =====
    INSERT INTO products (name, calories, protein, fat, carbs, fiber, category, is_perishable, cooking_ratio) VALUES
    ('Куриная грудка', 165, 31.0, 3.6, 0, 0, 'poultry', true, 0.75),
    ('Куриное бедро', 211, 18.4, 15.3, 0, 0, 'poultry', true, 0.70),
    ('Куриный фарш', 143, 17.4, 8.1, 0, 0, 'poultry', true, 0.70),
    ('Индейка (грудка)', 157, 29.9, 3.5, 0, 0, 'poultry', true, 0.75),
    ('Индейка (фарш)', 161, 20.0, 8.0, 0.5, 0, 'poultry', true, 0.70)
    ON CONFLICT DO NOTHING;

    -- ===== РЫБА (FISH) =====
    INSERT INTO products (name, calories, protein, fat, carbs, fiber, category, is_perishable, cooking_ratio) VALUES
    ('Лосось', 142, 19.8, 6.3, 0, 0, 'fish', true, 0.80),
    ('Треска', 82, 17.7, 0.7, 0, 0, 'fish', true, 0.80),
    ('Тунец', 144, 23.3, 4.9, 0, 0, 'fish', true, 0.80),
    ('Минтай', 72, 15.9, 0.9, 0, 0, 'fish', true, 0.80),
    ('Горбуша', 140, 20.5, 6.5, 0, 0, 'fish', true, 0.80),
    ('Скумбрия', 191, 18.0, 13.2, 0, 0, 'fish', true, 0.75)
    ON CONFLICT DO NOTHING;

    -- ===== МОРЕПРОДУКТЫ (SEAFOOD) =====
    INSERT INTO products (name, calories, protein, fat, carbs, fiber, category, is_perishable, cooking_ratio) VALUES
    ('Креветки', 99, 20.9, 1.7, 0.2, 0, 'seafood', true, 0.85),
    ('Кальмары', 92, 18.0, 2.2, 0, 0, 'seafood', true, 0.75),
    ('Мидии', 77, 11.5, 2.0, 3.3, 0, 'seafood', true, 0.80)
    ON CONFLICT DO NOTHING;

    -- ===== МОЛОЧНЫЕ ПРОДУКТЫ (DAIRY) =====
    INSERT INTO products (name, calories, protein, fat, carbs, fiber, category, is_perishable, cooking_ratio) VALUES
    ('Молоко 2.5%', 52, 2.8, 2.5, 4.7, 0, 'dairy', true, 1.0),
    ('Молоко 3.2%', 60, 2.9, 3.2, 4.7, 0, 'dairy', true, 1.0),
    ('Кефир 1%', 40, 3.0, 1.0, 4.0, 0, 'dairy', true, 1.0),
    ('Кефир 2.5%', 53, 2.9, 2.5, 4.0, 0, 'dairy', true, 1.0),
    ('Ряженка 2.5%', 54, 2.9, 2.5, 4.2, 0, 'dairy', true, 1.0),
    ('Творог 0%', 71, 16.5, 0, 1.3, 0, 'dairy', true, 1.0),
    ('Творог 5%', 121, 17.2, 5.0, 1.8, 0, 'dairy', true, 1.0),
    ('Творог 9%', 159, 16.7, 9.0, 2.0, 0, 'dairy', true, 1.0),
    ('Сметана 10%', 115, 3.0, 10.0, 2.9, 0, 'dairy', true, 1.0),
    ('Сметана 20%', 206, 2.8, 20.0, 3.2, 0, 'dairy', true, 1.0),
    ('Йогурт натуральный 2%', 60, 4.3, 2.0, 6.2, 0, 'dairy', true, 1.0),
    ('Греческий йогурт 2%', 66, 5.0, 2.0, 5.5, 0, 'dairy', true, 1.0),
    ('Сыр моцарелла', 280, 28.0, 17.0, 2.2, 0, 'dairy', true, 1.0),
    ('Сыр чеддер', 402, 23.0, 33.0, 1.3, 0, 'dairy', true, 1.0),
    ('Сыр российский', 364, 24.1, 29.5, 0.3, 0, 'dairy', true, 1.0),
    ('Сыр пармезан', 431, 38.0, 29.0, 4.1, 0, 'dairy', true, 1.0),
    ('Сливочное масло 82%', 748, 0.5, 82.5, 0.8, 0, 'dairy', true, 1.0)
    ON CONFLICT DO NOTHING;

    -- ===== ЯЙЦА (EGGS) =====
    INSERT INTO products (name, calories, protein, fat, carbs, fiber, category, is_perishable, cooking_ratio, unit, unit_weight) VALUES
    ('Яйцо куриное С1', 157, 12.7, 11.5, 0.7, 0, 'eggs', true, 0.95, 'шт', 55),
    ('Яйцо куриное С0', 157, 12.7, 11.5, 0.7, 0, 'eggs', true, 0.95, 'шт', 65),
    ('Перепелиное яйцо', 168, 11.9, 13.1, 0.6, 0, 'eggs', true, 0.95, 'шт', 12)
    ON CONFLICT DO NOTHING;

    -- ===== КРУПЫ (GRAINS) =====
    INSERT INTO products (name, calories, protein, fat, carbs, fiber, category, is_perishable, cooking_ratio) VALUES
    ('Гречка', 313, 12.6, 3.3, 62.1, 11.3, 'grains', false, 2.5),
    ('Овсянка', 366, 11.9, 7.2, 69.3, 10.6, 'grains', false, 2.5),
    ('Рис белый', 344, 6.7, 0.7, 78.9, 0.4, 'grains', false, 2.3),
    ('Рис бурый', 337, 7.4, 1.8, 72.9, 3.5, 'grains', false, 2.5),
    ('Перловка', 320, 9.3, 1.1, 73.7, 15.6, 'grains', false, 2.5),
    ('Пшено', 348, 11.5, 3.3, 69.3, 8.5, 'grains', false, 2.5),
    ('Киноа', 368, 14.1, 6.1, 57.2, 7.0, 'grains', false, 2.5),
    ('Булгур', 342, 12.3, 1.3, 75.9, 12.5, 'grains', false, 2.5)
    ON CONFLICT DO NOTHING;

    -- ===== МАКАРОНЫ (PASTA) =====
    INSERT INTO products (name, calories, protein, fat, carbs, fiber, category, is_perishable, cooking_ratio) VALUES
    ('Макароны из твердых сортов', 344, 10.7, 1.1, 71.5, 3.7, 'pasta', false, 2.2),
    ('Спагетти из твердых сортов', 344, 10.4, 1.5, 71.2, 3.2, 'pasta', false, 2.2),
    ('Макароны цельнозерновые', 339, 11.5, 2.5, 71.0, 10.7, 'pasta', false, 2.2)
    ON CONFLICT DO NOTHING;

    -- ===== ХЛЕБ (BREAD) =====
    INSERT INTO products (name, calories, protein, fat, carbs, fiber, category, is_perishable, cooking_ratio) VALUES
    ('Хлеб белый', 266, 7.6, 2.9, 50.1, 2.7, 'bread', true, 1.0),
    ('Хлеб ржаной', 250, 6.6, 1.2, 49.8, 8.3, 'bread', true, 1.0),
    ('Хлеб цельнозерновой', 247, 10.7, 3.3, 43.9, 7.4, 'bread', true, 1.0),
    ('Лаваш тонкий', 277, 8.1, 1.0, 57.1, 2.2, 'bread', true, 1.0),
    ('Хлебцы гречневые', 308, 12.6, 3.3, 57.1, 2.0, 'bread', false, 1.0)
    ON CONFLICT DO NOTHING;

    -- ===== ОВОЩИ (VEGETABLES) =====
    INSERT INTO products (name, calories, protein, fat, carbs, fiber, category, is_perishable, cooking_ratio) VALUES
    ('Брокколи', 34, 2.8, 0.4, 6.6, 2.6, 'vegetables', true, 0.90),
    ('Цветная капуста', 25, 1.9, 0.3, 4.9, 2.1, 'vegetables', true, 0.90),
    ('Белокочанная капуста', 27, 1.8, 0.1, 4.7, 2.0, 'vegetables', true, 0.85),
    ('Помидоры', 20, 0.9, 0.2, 4.2, 1.2, 'vegetables', true, 0.95),
    ('Огурцы', 15, 0.8, 0.1, 2.8, 0.5, 'vegetables', true, 0.98),
    ('Болгарский перец', 27, 1.3, 0.0, 5.3, 1.9, 'vegetables', true, 0.90),
    ('Морковь', 41, 0.9, 0.2, 9.6, 2.8, 'vegetables', true, 0.85),
    ('Свекла', 43, 1.6, 0.2, 8.8, 2.8, 'vegetables', true, 0.80),
    ('Кабачок', 24, 0.6, 0.3, 4.6, 1.0, 'vegetables', true, 0.85),
    ('Баклажан', 24, 1.2, 0.1, 4.5, 3.0, 'vegetables', true, 0.80),
    ('Шпинат', 23, 2.9, 0.4, 3.6, 2.2, 'vegetables', true, 0.90),
    ('Салат листовой', 15, 1.5, 0.2, 2.3, 1.3, 'vegetables', true, 0.95),
    ('Руккола', 25, 2.6, 0.7, 3.7, 1.6, 'vegetables', true, 0.95),
    ('Лук репчатый', 40, 1.4, 0.0, 10.4, 1.7, 'vegetables', true, 0.85),
    ('Чеснок', 149, 6.5, 0.5, 33.1, 2.1, 'vegetables', true, 0.90),
    ('Тыква', 26, 1.0, 0.1, 6.5, 0.5, 'vegetables', true, 0.80),
    ('Авокадо', 160, 2.0, 14.7, 8.5, 6.7, 'vegetables', true, 1.0),
    ('Зеленый горошек (свежий)', 81, 5.4, 0.4, 14.5, 5.1, 'vegetables', true, 0.90)
    ON CONFLICT DO NOTHING;

    -- ===== ФРУКТЫ (FRUITS) =====
    INSERT INTO products (name, calories, protein, fat, carbs, fiber, category, is_perishable, cooking_ratio) VALUES
    ('Яблоко', 52, 0.4, 0.4, 13.8, 2.4, 'fruits', true, 1.0),
    ('Банан', 89, 1.1, 0.3, 22.8, 2.6, 'fruits', true, 1.0),
    ('Апельсин', 47, 0.9, 0.2, 11.8, 2.4, 'fruits', true, 1.0),
    ('Грейпфрут', 35, 0.7, 0.2, 8.4, 1.6, 'fruits', true, 1.0),
    ('Киви', 61, 1.1, 0.5, 14.7, 3.0, 'fruits', true, 1.0),
    ('Груша', 57, 0.4, 0.1, 15.5, 3.1, 'fruits', true, 1.0),
    ('Персик', 39, 0.9, 0.3, 9.5, 1.5, 'fruits', true, 1.0),
    ('Абрикос', 48, 0.9, 0.4, 11.1, 2.0, 'fruits', true, 1.0),
    ('Слива', 46, 0.7, 0.3, 11.4, 1.4, 'fruits', true, 1.0),
    ('Клубника', 32, 0.7, 0.3, 7.7, 2.0, 'fruits', true, 1.0),
    ('Черника', 57, 0.7, 0.3, 14.5, 2.4, 'fruits', true, 1.0),
    ('Малина', 52, 1.2, 0.7, 11.9, 6.5, 'fruits', true, 1.0),
    ('Виноград', 69, 0.7, 0.2, 18.1, 0.9, 'fruits', true, 1.0),
    ('Арбуз', 30, 0.6, 0.2, 7.6, 0.4, 'fruits', true, 1.0),
    ('Дыня', 34, 0.6, 0.3, 8.6, 0.9, 'fruits', true, 1.0)
    ON CONFLICT DO NOTHING;

    -- ===== ОРЕХИ (NUTS) =====
    INSERT INTO products (name, calories, protein, fat, carbs, fiber, category, is_perishable, cooking_ratio) VALUES
    ('Миндаль', 579, 21.2, 49.9, 21.6, 12.5, 'nuts', false, 1.0),
    ('Грецкий орех', 654, 15.2, 65.2, 13.7, 6.7, 'nuts', false, 1.0),
    ('Кешью', 553, 18.2, 43.9, 30.2, 3.3, 'nuts', false, 1.0),
    ('Фундук', 628, 15.0, 60.8, 16.7, 9.7, 'nuts', false, 1.0),
    ('Арахис', 567, 26.3, 49.2, 16.1, 8.5, 'nuts', false, 1.0)
    ON CONFLICT DO NOTHING;

    -- ===== СУХОФРУКТЫ (DRIED_FRUITS) =====
    INSERT INTO products (name, calories, protein, fat, carbs, fiber, category, is_perishable, cooking_ratio) VALUES
    ('Курага', 241, 3.4, 0.5, 62.6, 7.3, 'dried_fruits', false, 1.0),
    ('Чернослив', 240, 2.2, 0.7, 63.9, 7.1, 'dried_fruits', false, 1.0),
    ('Изюм', 299, 3.1, 0.6, 79.2, 3.7, 'dried_fruits', false, 1.0),
    ('Финики', 277, 1.8, 0.2, 74.9, 6.7, 'dried_fruits', false, 1.0)
    ON CONFLICT DO NOTHING;

    -- ===== МАСЛА (OILS) =====
    INSERT INTO products (name, calories, protein, fat, carbs, fiber, category, is_perishable, cooking_ratio) VALUES
    ('Оливковое масло Extra Virgin', 884, 0, 100.0, 0, 0, 'oils', false, 1.0),
    ('Подсолнечное масло', 899, 0, 99.9, 0, 0, 'oils', false, 1.0),
    ('Кокосовое масло', 892, 0, 99.9, 0, 0, 'oils', false, 1.0),
    ('Льняное масло', 898, 0, 99.8, 0, 0, 'oils', false, 1.0)
    ON CONFLICT DO NOTHING;

    -- ===== ПРИПРАВЫ/СОУСЫ (CONDIMENTS) =====
    INSERT INTO products (name, calories, protein, fat, carbs, fiber, category, is_perishable, cooking_ratio) VALUES
    ('Соевый соус', 53, 5.6, 0.0, 6.7, 0.8, 'condiments', false, 1.0),
    ('Томатная паста', 102, 4.8, 0, 19.0, 2.3, 'condiments', true, 1.0),
    ('Горчица', 143, 5.7, 6.4, 19.8, 5.2, 'condiments', true, 1.0),
    ('Мед', 304, 0.3, 0, 82.4, 0.2, 'condiments', false, 1.0),
    ('Уксус яблочный', 21, 0, 0, 0.9, 0, 'condiments', false, 1.0)
    ON CONFLICT DO NOTHING;

    -- ===== БОБОВЫЕ (LEGUMES) =====
    INSERT INTO products (name, calories, protein, fat, carbs, fiber, category, is_perishable, cooking_ratio) VALUES
    ('Чечевица красная', 318, 24.0, 1.5, 56.3, 11.5, 'legumes', false, 2.5),
    ('Чечевица зеленая', 323, 25.0, 1.6, 60.0, 10.7, 'legumes', false, 2.5),
    ('Нут', 364, 19.0, 6.0, 60.7, 17.4, 'legumes', false, 2.5),
    ('Фасоль красная', 337, 22.5, 1.7, 61.3, 15.2, 'legumes', false, 2.5),
    ('Фасоль белая', 333, 23.4, 1.6, 60.3, 15.7, 'legumes', false, 2.5),
    ('Горох колотый', 298, 20.5, 2.0, 53.3, 11.0, 'legumes', false, 2.5)
    ON CONFLICT DO NOTHING;

    -- ===== НАПИТКИ (BEVERAGES) =====
    INSERT INTO products (name, calories, protein, fat, carbs, fiber, category, is_perishable, cooking_ratio) VALUES
    ('Вода', 0, 0, 0, 0, 0, 'beverages', false, 1.0),
    ('Чай зеленый (без сахара)', 1, 0, 0, 0, 0, 'beverages', false, 1.0),
    ('Кофе черный (без сахара)', 2, 0.2, 0, 0, 0, 'beverages', false, 1.0),
    ('Миндальное молоко', 15, 0.6, 1.1, 0.3, 0.2, 'beverages', true, 1.0),
    ('Соевое молоко', 54, 3.3, 1.8, 6.3, 0.6, 'beverages', true, 1.0)
    ON CONFLICT DO NOTHING;

    -- ===== ПРОЧЕЕ (OTHER) =====
    INSERT INTO products (name, calories, protein, fat, carbs, fiber, category, is_perishable, cooking_ratio) VALUES
    ('Семена чиа', 486, 16.5, 30.7, 42.1, 34.4, 'other', false, 1.0),
    ('Семена льна', 534, 18.3, 42.2, 28.9, 27.3, 'other', false, 1.0),
    ('Тофу', 76, 8.0, 4.8, 1.9, 0.3, 'other', true, 1.0),
    ('Протеин сывороточный', 370, 80.0, 3.0, 7.0, 0, 'other', false, 1.0)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Products reseeded successfully';
  ELSE
    RAISE NOTICE 'Products already exist, skipping reseed';
  END IF;
END $$;
