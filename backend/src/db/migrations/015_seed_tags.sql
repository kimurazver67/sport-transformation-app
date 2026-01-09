-- Migration 015: Seed Tags (Allergens, Diets, Preferences)
-- Date: 2026-01-07
-- Description: Базовые теги для системы питания

-- ===== ALLERGENS (Аллергены) =====

INSERT INTO tags (name, name_ru, type, description) VALUES
('lactose', 'Лактоза', 'allergen', 'Молочные продукты, содержащие лактозу'),
('gluten', 'Глютен', 'allergen', 'Пшеница, рожь, ячмень и продукты из них'),
('nuts', 'Орехи', 'allergen', 'Все виды орехов (арахис, миндаль, грецкие и т.д.)'),
('eggs', 'Яйца', 'allergen', 'Куриные и другие яйца'),
('fish', 'Рыба', 'allergen', 'Все виды рыбы'),
('shellfish', 'Морепродукты', 'allergen', 'Креветки, крабы, моллюски'),
('soy', 'Соя', 'allergen', 'Соевые продукты'),
('sesame', 'Кунжут', 'allergen', 'Семена кунжута и продукты с ними'),
('mustard', 'Горчица', 'allergen', 'Горчица и продукты с ней'),
('celery', 'Сельдерей', 'allergen', 'Сельдерей и продукты с ним')
ON CONFLICT (name) DO NOTHING;

-- ===== DIETS (Диеты) =====

INSERT INTO tags (name, name_ru, type, description) VALUES
('vegan', 'Веганство', 'diet', 'Без продуктов животного происхождения'),
('vegetarian', 'Вегетарианство', 'diet', 'Без мяса и рыбы, но с молочными и яйцами'),
('pescatarian', 'Пескетарианство', 'diet', 'Без мяса, но с рыбой'),
('keto', 'Кето-диета', 'diet', 'Низкоуглеводная, высокожировая диета'),
('paleo', 'Палео-диета', 'diet', 'Без зерновых, бобовых, молочных'),
('halal', 'Халяль', 'diet', 'Разрешено исламом'),
('kosher', 'Кошер', 'diet', 'Разрешено иудаизмом')
ON CONFLICT (name) DO NOTHING;

-- ===== PREFERENCES (Предпочтения) =====

INSERT INTO tags (name, name_ru, type, description) VALUES
('sugar_free', 'Без сахара', 'preference', 'Без добавленного сахара'),
('low_fat', 'Низкожирное', 'preference', 'Менее 3г жира на 100г'),
('low_carb', 'Низкоуглеводное', 'preference', 'Менее 10г углеводов на 100г'),
('high_protein', 'Высокобелковое', 'preference', 'Более 15г белка на 100г'),
('organic', 'Органическое', 'preference', 'Органические продукты'),
('non_gmo', 'Без ГМО', 'preference', 'Продукты без генетической модификации'),
('whole_grain', 'Цельнозерновое', 'preference', 'Из цельного зерна'),
('raw', 'Сырое', 'preference', 'Продукты без термообработки')
ON CONFLICT (name) DO NOTHING;

-- ===== ИНДЕКСЫ УЖЕ СОЗДАНЫ В МИГРАЦИИ 014 =====
-- CREATE INDEX idx_tags_type ON tags(type)
ON CONFLICT (name) DO NOTHING;
