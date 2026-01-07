// Add missing products based on TheMealDB ingredients analysis
import { pool } from './src/db/postgres';

interface ProductToAdd {
  name: string;
  name_ru: string;
  category: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  unit: string;
  unit_weight: number | null;
  cooking_ratio: number;
  price_per_kg: number;
}

// Топ-100 недостающих ингредиентов с расчётными КБЖУ (на 100г)
const PRODUCTS_TO_ADD: ProductToAdd[] = [
  // Травы и специи
  { name: 'bay_leaf', name_ru: 'Лавровый лист', category: 'condiments', calories: 313, protein: 7.6, fat: 8.4, carbs: 48.7, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 800 },
  { name: 'mint', name_ru: 'Мята свежая', category: 'vegetables', calories: 70, protein: 3.8, fat: 0.9, carbs: 8.4, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 500 },
  { name: 'dill', name_ru: 'Укроп', category: 'vegetables', calories: 43, protein: 3.5, fat: 1.1, carbs: 7, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 300 },
  { name: 'basil_leaves', name_ru: 'Листья базилика', category: 'vegetables', calories: 23, protein: 3.2, fat: 0.6, carbs: 2.7, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 600 },
  { name: 'cayenne_pepper', name_ru: 'Кайенский перец', category: 'condiments', calories: 318, protein: 12, fat: 17.3, carbs: 56.6, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 1500 },
  { name: 'cumin_seeds', name_ru: 'Семена зиры', category: 'condiments', calories: 375, protein: 17.8, fat: 22.3, carbs: 44.2, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 1000 },
  { name: 'cardamom', name_ru: 'Кардамон', category: 'condiments', calories: 311, protein: 10.8, fat: 6.7, carbs: 68.5, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 3000 },
  { name: 'saffron', name_ru: 'Шафран', category: 'condiments', calories: 310, protein: 11.4, fat: 5.9, carbs: 65.4, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 15000 },
  { name: 'nutmeg', name_ru: 'Мускатный орех', category: 'condiments', calories: 525, protein: 5.8, fat: 36.3, carbs: 49.3, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 2000 },
  { name: 'ground_cumin', name_ru: 'Молотый зиру', category: 'condiments', calories: 375, protein: 17.8, fat: 22.3, carbs: 44.2, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 800 },
  { name: 'ground_cinnamon', name_ru: 'Молотая корица', category: 'condiments', calories: 247, protein: 4, fat: 1.2, carbs: 80.6, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 600 },
  { name: 'garlic_powder', name_ru: 'Чесночный порошок', category: 'condiments', calories: 331, protein: 16.6, fat: 0.7, carbs: 72.7, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 500 },

  // Мясо и колбасы
  { name: 'chorizo', name_ru: 'Чоризо', category: 'meat', calories: 455, protein: 24.1, fat: 38.3, carbs: 2.0, unit: 'г', unit_weight: null, cooking_ratio: 0.85, price_per_kg: 1200 },
  { name: 'lamb', name_ru: 'Баранина', category: 'meat', calories: 294, protein: 16.5, fat: 25.0, carbs: 0, unit: 'г', unit_weight: null, cooking_ratio: 0.75, price_per_kg: 800 },

  // Овощи (дополнительные)
  { name: 'tomato', name_ru: 'Томат', category: 'vegetables', calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 150 },
  { name: 'cherry_tomatoes', name_ru: 'Черри помидоры', category: 'vegetables', calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 300 },
  { name: 'plum_tomatoes', name_ru: 'Сливовидные помидоры', category: 'vegetables', calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 200 },
  { name: 'red_onions', name_ru: 'Красный лук', category: 'vegetables', calories: 40, protein: 1.1, fat: 0.1, carbs: 9.3, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 80 },
  { name: 'spring_onions', name_ru: 'Зелёный лук', category: 'vegetables', calories: 32, protein: 1.8, fat: 0.2, carbs: 7.3, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 250 },
  { name: 'leek', name_ru: 'Лук-порей', category: 'vegetables', calories: 61, protein: 1.5, fat: 0.3, carbs: 14.2, unit: 'г', unit_weight: null, cooking_ratio: 0.9, price_per_kg: 200 },
  { name: 'beetroot', name_ru: 'Свёкла', category: 'vegetables', calories: 43, protein: 1.6, fat: 0.2, carbs: 9.6, unit: 'г', unit_weight: null, cooking_ratio: 0.95, price_per_kg: 50 },
  { name: 'fennel', name_ru: 'Фенхель', category: 'vegetables', calories: 31, protein: 1.2, fat: 0.2, carbs: 7.3, unit: 'г', unit_weight: null, cooking_ratio: 0.9, price_per_kg: 300 },
  { name: 'green_chilli', name_ru: 'Зелёный чили', category: 'vegetables', calories: 40, protein: 2, fat: 0.2, carbs: 9.5, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 400 },

  // Масла и соусы
  { name: 'oil', name_ru: 'Растительное масло (общее)', category: 'oils', calories: 884, protein: 0, fat: 100, carbs: 0, unit: 'мл', unit_weight: 920, cooking_ratio: 1, price_per_kg: 150 },
  { name: 'extra_virgin_olive_oil', name_ru: 'Оливковое масло Extra Virgin', category: 'oils', calories: 884, protein: 0, fat: 100, carbs: 0, unit: 'мл', unit_weight: 920, cooking_ratio: 1, price_per_kg: 800 },
  { name: 'peanut_butter', name_ru: 'Арахисовая паста', category: 'nuts', calories: 588, protein: 25.8, fat: 50, carbs: 20, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 600 },
  { name: 'hotsauce', name_ru: 'Острый соус', category: 'condiments', calories: 30, protein: 1, fat: 0.5, carbs: 6, unit: 'мл', unit_weight: 1020, cooking_ratio: 1, price_per_kg: 400 },
  { name: 'tomato_sauce', name_ru: 'Томатный соус', category: 'condiments', calories: 29, protein: 1.3, fat: 0.1, carbs: 6.7, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 150 },

  // Молочные (дополнительные)
  { name: 'sour_cream', name_ru: 'Сметана 20%', category: 'dairy', calories: 193, protein: 2.8, fat: 20, carbs: 3.2, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 250 },
  { name: 'heavy_cream', name_ru: 'Жирные сливки 33%', category: 'dairy', calories: 345, protein: 2.2, fat: 37, carbs: 2.8, unit: 'мл', unit_weight: 1020, cooking_ratio: 1, price_per_kg: 400 },
  { name: 'parmesan_cheese', name_ru: 'Сыр пармезан (отдельный)', category: 'dairy', calories: 431, protein: 38, fat: 29, carbs: 4.1, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 1500 },
  { name: 'unsalted_butter', name_ru: 'Сливочное масло несолёное', category: 'dairy', calories: 717, protein: 0.9, fat: 81.1, carbs: 0.8, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 600 },

  // Алкоголь и напитки
  { name: 'red_wine', name_ru: 'Красное вино', category: 'beverages', calories: 85, protein: 0.1, fat: 0, carbs: 2.6, unit: 'мл', unit_weight: 990, cooking_ratio: 1, price_per_kg: 800 },
  { name: 'white_wine', name_ru: 'Белое вино', category: 'beverages', calories: 82, protein: 0.1, fat: 0, carbs: 2.6, unit: 'мл', unit_weight: 990, cooking_ratio: 1, price_per_kg: 700 },
  { name: 'lemon_juice', name_ru: 'Лимонный сок', category: 'condiments', calories: 22, protein: 0.4, fat: 0, carbs: 6.9, unit: 'мл', unit_weight: 1020, cooking_ratio: 1, price_per_kg: 200 },
  { name: 'coconut_milk', name_ru: 'Кокосовое молоко', category: 'dairy', calories: 230, protein: 2.3, fat: 24, carbs: 6, unit: 'мл', unit_weight: 970, cooking_ratio: 1, price_per_kg: 400 },

  // Мука и крахмал
  { name: 'cornstarch', name_ru: 'Кукурузный крахмал', category: 'grains', calories: 381, protein: 0.3, fat: 0.1, carbs: 91.3, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 150 },
  { name: 'icing_sugar', name_ru: 'Сахарная пудра', category: 'grains', calories: 389, protein: 0, fat: 0, carbs: 99.8, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 200 },
  { name: 'caster_sugar', name_ru: 'Сахар мелкий (кастор)', category: 'grains', calories: 387, protein: 0, fat: 0, carbs: 99.8, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 80 },
  { name: 'powdered_sugar', name_ru: 'Сахарная пудра', category: 'grains', calories: 389, protein: 0, fat: 0, carbs: 99.8, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 200 },

  // Консервы и маринады
  { name: 'black_olives', name_ru: 'Чёрные оливки', category: 'vegetables', calories: 115, protein: 0.8, fat: 10.7, carbs: 6.3, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 600 },
  { name: 'green_olives', name_ru: 'Зелёные оливки', category: 'vegetables', calories: 145, protein: 1, fat: 15.3, carbs: 3.8, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 500 },
  { name: 'capers', name_ru: 'Каперсы', category: 'condiments', calories: 23, protein: 2.4, fat: 0.9, carbs: 4.9, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 800 },
  { name: 'sherry_vinegar', name_ru: 'Хересный уксус', category: 'condiments', calories: 19, protein: 0, fat: 0, carbs: 0.3, unit: 'мл', unit_weight: 1010, cooking_ratio: 1, price_per_kg: 600 },
  { name: 'white_wine_vinegar', name_ru: 'Винный уксус белый', category: 'condiments', calories: 19, protein: 0, fat: 0, carbs: 0.3, unit: 'мл', unit_weight: 1010, cooking_ratio: 1, price_per_kg: 300 },
  { name: 'red_wine_vinegar', name_ru: 'Винный уксус красный', category: 'condiments', calories: 19, protein: 0, fat: 0, carbs: 0.3, unit: 'мл', unit_weight: 1010, cooking_ratio: 1, price_per_kg: 300 },

  // Хлеб и выпечка
  { name: 'pita_bread', name_ru: 'Пита', category: 'grains', calories: 275, protein: 9.1, fat: 1.2, carbs: 55.7, unit: 'шт', unit_weight: 60, cooking_ratio: 1, price_per_kg: 200 },
  { name: 'tortilla', name_ru: 'Тортилья', category: 'grains', calories: 304, protein: 8.2, fat: 7.7, carbs: 51, unit: 'шт', unit_weight: 50, cooking_ratio: 1, price_per_kg: 300 },
  { name: 'naan_bread', name_ru: 'Наан', category: 'grains', calories: 262, protein: 8.7, fat: 5.1, carbs: 45, unit: 'шт', unit_weight: 90, cooking_ratio: 1, price_per_kg: 400 },

  // Бобовые (дополнительно)
  { name: 'red_lentils', name_ru: 'Красная чечевица', category: 'legumes', calories: 116, protein: 9, fat: 0.4, carbs: 20.1, unit: 'г', unit_weight: null, cooking_ratio: 2.5, price_per_kg: 150 },
  { name: 'green_lentils', name_ru: 'Зелёная чечевица', category: 'legumes', calories: 116, protein: 9, fat: 0.4, carbs: 20.1, unit: 'г', unit_weight: null, cooking_ratio: 2.5, price_per_kg: 150 },
  { name: 'cannellini_beans', name_ru: 'Фасоль каннеллини', category: 'legumes', calories: 127, protein: 9.7, fat: 0.5, carbs: 23.6, unit: 'г', unit_weight: null, cooking_ratio: 2.3, price_per_kg: 200 },
  { name: 'butter_beans', name_ru: 'Масляная фасоль', category: 'legumes', calories: 115, protein: 7.8, fat: 0.4, carbs: 20.9, unit: 'г', unit_weight: null, cooking_ratio: 2.3, price_per_kg: 250 },

  // Специи и приправы (экзотические)
  { name: 'harissa_spice', name_ru: 'Хариса (специя)', category: 'condiments', calories: 70, protein: 2, fat: 4, carbs: 8, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 1500 },
  { name: 'garam_masala', name_ru: 'Гарам масала', category: 'condiments', calories: 379, protein: 14, fat: 15, carbs: 48, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 1200 },
  { name: 'smoked_paprika', name_ru: 'Копчёная паприка', category: 'condiments', calories: 282, protein: 14.1, fat: 12.9, carbs: 53.9, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 800 },
  { name: 'chinese_five_spice', name_ru: 'Китайская приправа 5 специй', category: 'condiments', calories: 347, protein: 11, fat: 8, carbs: 65, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 1000 },

  // Консервы рыбные
  { name: 'anchovies', name_ru: 'Анчоусы консервированные', category: 'fish', calories: 210, protein: 28.9, fat: 9.7, carbs: 0, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 800 },
  { name: 'sardines', name_ru: 'Сардины консервированные', category: 'fish', calories: 208, protein: 24.6, fat: 11.5, carbs: 0, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 400 },

  // Морепродукты дополнительные
  { name: 'mussels', name_ru: 'Мидии', category: 'fish', calories: 86, protein: 11.9, fat: 2.2, carbs: 3.7, unit: 'г', unit_weight: null, cooking_ratio: 0.7, price_per_kg: 600 },
  { name: 'squid', name_ru: 'Кальмары', category: 'fish', calories: 92, protein: 15.6, fat: 1.4, carbs: 3.1, unit: 'г', unit_weight: null, cooking_ratio: 0.7, price_per_kg: 500 },
  { name: 'clams', name_ru: 'Моллюски', category: 'fish', calories: 86, protein: 14.7, fat: 1, carbs: 3.6, unit: 'г', unit_weight: null, cooking_ratio: 0.6, price_per_kg: 800 },

  // Сыры дополнительные
  { name: 'feta_cheese', name_ru: 'Сыр фета', category: 'dairy', calories: 264, protein: 14.2, fat: 21.3, carbs: 4.1, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 700 },
  { name: 'goat_cheese', name_ru: 'Козий сыр', category: 'dairy', calories: 364, protein: 21.6, fat: 29.8, carbs: 2.2, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 900 },
  { name: 'ricotta', name_ru: 'Рикотта', category: 'dairy', calories: 174, protein: 11.3, fat: 13, carbs: 3, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 500 },
  { name: 'cream_cheese', name_ru: 'Сливочный сыр', category: 'dairy', calories: 342, protein: 5.9, fat: 34.2, carbs: 4.1, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 600 },

  // Яйца (варианты)
  { name: 'egg_white', name_ru: 'Яичный белок', category: 'dairy', calories: 52, protein: 11, fat: 0.2, carbs: 0.7, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 200 },
  { name: 'free_range_egg', name_ru: 'Яйца фермерские', category: 'dairy', calories: 155, protein: 12.6, fat: 10.6, carbs: 1.1, unit: 'шт', unit_weight: 60, cooking_ratio: 1, price_per_kg: 250 },

  // Орехи и семена (дополнительно)
  { name: 'pine_nuts', name_ru: 'Кедровые орехи', category: 'nuts', calories: 673, protein: 13.7, fat: 68.4, carbs: 13.1, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 2500 },
  { name: 'pistachios', name_ru: 'Фисташки', category: 'nuts', calories: 560, protein: 20.2, fat: 45.3, carbs: 27.2, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 1500 },
  { name: 'pecans', name_ru: 'Орехи пекан', category: 'nuts', calories: 691, protein: 9.2, fat: 72, carbs: 13.9, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 2000 },
  { name: 'sunflower_seeds', name_ru: 'Семена подсолнечника', category: 'nuts', calories: 584, protein: 20.8, fat: 51.5, carbs: 20, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 300 },
  { name: 'pumpkin_seeds', name_ru: 'Семена тыквы', category: 'nuts', calories: 559, protein: 30.2, fat: 49, carbs: 10.7, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 500 },
  { name: 'sesame_seeds', name_ru: 'Семена кунжута', category: 'nuts', calories: 573, protein: 17.7, fat: 49.7, carbs: 23.5, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 400 },
  { name: 'flaxseed', name_ru: 'Семена льна', category: 'nuts', calories: 534, protein: 18.3, fat: 42.2, carbs: 28.9, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 250 },
  { name: 'chia_seeds', name_ru: 'Семена чиа', category: 'nuts', calories: 486, protein: 16.5, fat: 30.7, carbs: 42.1, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 800 },

  // Соусы азиатские
  { name: 'fish_sauce', name_ru: 'Рыбный соус', category: 'condiments', calories: 35, protein: 5.1, fat: 0, carbs: 3.8, unit: 'мл', unit_weight: 1060, cooking_ratio: 1, price_per_kg: 400 },
  { name: 'oyster_sauce', name_ru: 'Устричный соус', category: 'condiments', calories: 51, protein: 1.4, fat: 0.2, carbs: 11.4, unit: 'мл', unit_weight: 1200, cooking_ratio: 1, price_per_kg: 500 },
  { name: 'hoisin_sauce', name_ru: 'Хойсин соус', category: 'condiments', calories: 220, protein: 2.6, fat: 4.5, carbs: 45, unit: 'мл', unit_weight: 1150, cooking_ratio: 1, price_per_kg: 600 },
  { name: 'sriracha', name_ru: 'Шрирача', category: 'condiments', calories: 93, protein: 1.8, fat: 0.9, carbs: 20, unit: 'мл', unit_weight: 1080, cooking_ratio: 1, price_per_kg: 500 },
  { name: 'tahini', name_ru: 'Тахини (кунжутная паста)', category: 'condiments', calories: 595, protein: 17, fat: 53.8, carbs: 21.2, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 800 },

  // Крупы (дополнительно)
  { name: 'wild_rice', name_ru: 'Дикий рис', category: 'grains', calories: 101, protein: 4, fat: 0.3, carbs: 21.3, unit: 'г', unit_weight: null, cooking_ratio: 3, price_per_kg: 600 },
  { name: 'arborio_rice', name_ru: 'Рис арборио', category: 'grains', calories: 130, protein: 2.7, fat: 0.2, carbs: 28, unit: 'г', unit_weight: null, cooking_ratio: 2.5, price_per_kg: 300 },
  { name: 'jasmine_rice', name_ru: 'Рис жасмин', category: 'grains', calories: 129, protein: 2.7, fat: 0.3, carbs: 28, unit: 'г', unit_weight: null, cooking_ratio: 2.5, price_per_kg: 250 },

  // Грибы (дополнительно)
  { name: 'shiitake_mushrooms', name_ru: 'Грибы шиитаке', category: 'vegetables', calories: 34, protein: 2.2, fat: 0.5, carbs: 6.8, unit: 'г', unit_weight: null, cooking_ratio: 0.8, price_per_kg: 800 },
  { name: 'oyster_mushrooms', name_ru: 'Вешенки', category: 'vegetables', calories: 33, protein: 3.3, fat: 0.4, carbs: 6.1, unit: 'г', unit_weight: null, cooking_ratio: 0.85, price_per_kg: 400 },
  { name: 'porcini_mushrooms', name_ru: 'Белые грибы', category: 'vegetables', calories: 26, protein: 3.5, fat: 0.3, carbs: 3.1, unit: 'г', unit_weight: null, cooking_ratio: 0.7, price_per_kg: 1500 },

  // Овощи экзотические
  { name: 'bok_choy', name_ru: 'Бок-чой', category: 'vegetables', calories: 13, protein: 1.5, fat: 0.2, carbs: 2.2, unit: 'г', unit_weight: null, cooking_ratio: 0.85, price_per_kg: 350 },
  { name: 'kale', name_ru: 'Кале', category: 'vegetables', calories: 50, protein: 3.3, fat: 1.5, carbs: 10, unit: 'г', unit_weight: null, cooking_ratio: 0.9, price_per_kg: 500 },
  { name: 'rocket', name_ru: 'Руккола', category: 'vegetables', calories: 25, protein: 2.6, fat: 0.7, carbs: 3.7, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 600 },
  { name: 'watercress', name_ru: 'Кресс-салат', category: 'vegetables', calories: 11, protein: 2.3, fat: 0.1, carbs: 1.3, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 400 },
  { name: 'artichoke', name_ru: 'Артишок', category: 'vegetables', calories: 47, protein: 3.3, fat: 0.2, carbs: 10.5, unit: 'г', unit_weight: null, cooking_ratio: 0.8, price_per_kg: 700 },
  { name: 'asparagus', name_ru: 'Спаржа', category: 'vegetables', calories: 20, protein: 2.2, fat: 0.1, carbs: 3.9, unit: 'г', unit_weight: null, cooking_ratio: 0.9, price_per_kg: 800 },
  { name: 'brussels_sprouts', name_ru: 'Брюссельская капуста', category: 'vegetables', calories: 43, protein: 3.4, fat: 0.3, carbs: 8.9, unit: 'г', unit_weight: null, cooking_ratio: 0.85, price_per_kg: 300 },
  { name: 'butternut_squash', name_ru: 'Мускатная тыква', category: 'vegetables', calories: 45, protein: 1, fat: 0.1, carbs: 11.7, unit: 'г', unit_weight: null, cooking_ratio: 0.9, price_per_kg: 150 },

  // Фрукты (дополнительно)
  { name: 'dates', name_ru: 'Финики', category: 'fruits', calories: 282, protein: 2.5, fat: 0.4, carbs: 75, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 500 },
  { name: 'figs', name_ru: 'Инжир', category: 'fruits', calories: 74, protein: 0.8, fat: 0.3, carbs: 19.2, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 600 },
  { name: 'pomegranate', name_ru: 'Гранат', category: 'fruits', calories: 83, protein: 1.7, fat: 1.2, carbs: 18.7, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 300 },
  { name: 'dragon_fruit', name_ru: 'Питайя', category: 'fruits', calories: 60, protein: 1.2, fat: 0, carbs: 13, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 800 },

  // Сухофрукты
  { name: 'raisins', name_ru: 'Изюм', category: 'fruits', calories: 299, protein: 3.1, fat: 0.5, carbs: 79.2, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 300 },
  { name: 'dried_apricots', name_ru: 'Курага', category: 'fruits', calories: 241, protein: 3.4, fat: 0.5, carbs: 62.6, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 500 },
  { name: 'prunes', name_ru: 'Чернослив', category: 'fruits', calories: 240, protein: 2.2, fat: 0.4, carbs: 63.9, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 400 },

  // Соль и специальные виды
  { name: 'sea_salt', name_ru: 'Морская соль', category: 'condiments', calories: 0, protein: 0, fat: 0, carbs: 0, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 150 },
  { name: 'himalayan_salt', name_ru: 'Гималайская соль', category: 'condiments', calories: 0, protein: 0, fat: 0, carbs: 0, unit: 'г', unit_weight: null, cooking_ratio: 1, price_per_kg: 300 },

  // Экстракты и ароматизаторы
  { name: 'almond_extract', name_ru: 'Миндальный экстракт', category: 'condiments', calories: 40, protein: 0, fat: 0, carbs: 10, unit: 'мл', unit_weight: 880, cooking_ratio: 1, price_per_kg: 800 },
  { name: 'rose_water', name_ru: 'Розовая вода', category: 'condiments', calories: 1, protein: 0, fat: 0, carbs: 0.2, unit: 'мл', unit_weight: 1000, cooking_ratio: 1, price_per_kg: 500 },

  // Бульоны (кубики)
  { name: 'chicken_stock_cube', name_ru: 'Бульонный кубик куриный', category: 'condiments', calories: 258, protein: 12, fat: 16, carbs: 18, unit: 'шт', unit_weight: 10, cooking_ratio: 1, price_per_kg: 400 },
  { name: 'beef_stock_cube', name_ru: 'Бульонный кубик говяжий', category: 'condiments', calories: 258, protein: 12, fat: 16, carbs: 18, unit: 'шт', unit_weight: 10, cooking_ratio: 1, price_per_kg: 400 },
  { name: 'vegetable_stock_cube', name_ru: 'Бульонный кубик овощной', category: 'condiments', calories: 258, protein: 6, fat: 18, carbs: 20, unit: 'шт', unit_weight: 10, cooking_ratio: 1, price_per_kg: 350 },
];

async function addMissingProducts() {
  console.log('📦 Добавление недостающих продуктов в БД\n');

  let added = 0;
  let skipped = 0;

  for (const product of PRODUCTS_TO_ADD) {
    try {
      // Проверяем, существует ли уже (по русскому названию)
      const existing = await pool.query(
        'SELECT id FROM products WHERE name = $1',
        [product.name_ru]
      );

      if (existing.rows.length > 0) {
        console.log(`⏭️  Пропущен: ${product.name_ru} (уже существует)`);
        skipped++;
        continue;
      }

      // Добавляем (используем name_ru в поле name)
      await pool.query(`
        INSERT INTO products (
          name, category,
          calories, protein, fat, carbs,
          unit, unit_weight, cooking_ratio, price_per_kg
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        product.name_ru,  // Русское название
        product.category,
        product.calories,
        product.protein,
        product.fat,
        product.carbs,
        product.unit,
        product.unit_weight,
        product.cooking_ratio,
        product.price_per_kg,
      ]);

      console.log(`✅ Добавлен: ${product.name_ru} (${product.calories} ккал)`);
      added++;
    } catch (error) {
      console.error(`❌ Ошибка при добавлении ${product.name_ru}:`, error);
    }
  }

  console.log(`\n📊 Итого:`);
  console.log(`   Добавлено: ${added}`);
  console.log(`   Пропущено: ${skipped}`);
  console.log(`   Всего продуктов в списке: ${PRODUCTS_TO_ADD.length}\n`);

  // Статистика по БД
  const totalResult = await pool.query('SELECT COUNT(*) as count FROM products');
  console.log(`   Всего продуктов в БД: ${totalResult.rows[0].count}\n`);

  await pool.end();
}

addMissingProducts().catch(console.error);
