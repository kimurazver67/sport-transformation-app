// Import recipes from TheMealDB API and adapt to our product database
import axios from 'axios';
import { pool } from './src/db/postgres';

const THEMEALDB_API = 'https://www.themealdb.com/api/json/v1/1';

interface TheMealDBRecipe {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strTags: string | null;
  [key: `strIngredient${number}`]: string;
  [key: `strMeasure${number}`]: string;
}

// Маппинг TheMealDB ингредиентов на наши продукты
const INGREDIENT_MAPPING: Record<string, { product: string; ratio?: number }> = {
  // Мясо и птица
  'chicken': { product: 'Куриная грудка' },
  'chicken breast': { product: 'Куриная грудка' },
  'chicken breasts': { product: 'Куриная грудка' },
  'chicken thighs': { product: 'Куриное бедро' },
  'beef': { product: 'Говядина (вырезка)' },
  'beef mince': { product: 'Говяжий фарш' },
  'ground beef': { product: 'Говяжий фарш' },
  'pork': { product: 'Свинина (вырезка)' },
  'bacon': { product: 'Бекон' },
  'sausage': { product: 'Куриная колбаса' },
  'turkey': { product: 'Индейка (филе)' },

  // Рыба
  'salmon': { product: 'Лосось' },
  'tuna': { product: 'Тунец консервированный' },
  'cod': { product: 'Треска' },
  'white fish': { product: 'Треска' },
  'prawns': { product: 'Креветки' },
  'shrimp': { product: 'Креветки' },

  // Молочные
  'milk': { product: 'Молоко 2.5%' },
  'cheese': { product: 'Сыр твёрдый' },
  'cheddar cheese': { product: 'Сыр твёрдый' },
  'parmesan': { product: 'Сыр пармезан' },
  'mozzarella': { product: 'Сыр моцарелла' },
  'butter': { product: 'Сливочное масло' },
  'cream': { product: 'Сливки 20%' },
  'double cream': { product: 'Сливки 20%' },
  'yogurt': { product: 'Йогурт натуральный' },
  'greek yogurt': { product: 'Йогурт греческий' },

  // Яйца
  'eggs': { product: 'Яйца куриные' },
  'egg': { product: 'Яйца куриные' },
  'egg yolks': { product: 'Яйца куриные', ratio: 0.3 },
  'egg whites': { product: 'Яйца куриные', ratio: 0.6 },

  // Крупы и злаки
  'rice': { product: 'Рис белый' },
  'basmati rice': { product: 'Рис белый' },
  'pasta': { product: 'Макароны (пшеничные)' },
  'spaghetti': { product: 'Макароны (пшеничные)' },
  'noodles': { product: 'Макароны (пшеничные)' },
  'oats': { product: 'Овсянка' },
  'porridge oats': { product: 'Овсянка' },
  'quinoa': { product: 'Киноа' },
  'bulgur': { product: 'Булгур' },
  'couscous': { product: 'Кускус' },

  // Хлеб
  'bread': { product: 'Хлеб цельнозерновой' },
  'white bread': { product: 'Хлеб белый' },
  'breadcrumbs': { product: 'Хлеб белый', ratio: 0.8 },

  // Овощи
  'tomatoes': { product: 'Помидоры' },
  'tinned tomatos': { product: 'Томаты консервированные' },
  'tomato puree': { product: 'Томатная паста' },
  'onion': { product: 'Лук репчатый' },
  'onions': { product: 'Лук репчатый' },
  'garlic': { product: 'Чеснок' },
  'garlic clove': { product: 'Чеснок' },
  'carrot': { product: 'Морковь' },
  'carrots': { product: 'Морковь' },
  'potato': { product: 'Картофель' },
  'potatoes': { product: 'Картофель' },
  'sweet potato': { product: 'Батат' },
  'bell pepper': { product: 'Перец болгарский' },
  'red pepper': { product: 'Перец болгарский' },
  'broccoli': { product: 'Брокколи' },
  'spinach': { product: 'Шпинат' },
  'lettuce': { product: 'Салат листовой' },
  'cucumber': { product: 'Огурцы' },
  'zucchini': { product: 'Кабачки' },
  'courgette': { product: 'Кабачки' },
  'mushrooms': { product: 'Шампиньоны' },
  'celery': { product: 'Сельдерей' },
  'cabbage': { product: 'Капуста белокочанная' },
  'cauliflower': { product: 'Цветная капуста' },

  // Фрукты
  'banana': { product: 'Бананы' },
  'apple': { product: 'Яблоки' },
  'lemon': { product: 'Лимоны' },
  'lime': { product: 'Лаймы' },
  'orange': { product: 'Апельсины' },
  'berries': { product: 'Ягоды микс' },
  'strawberries': { product: 'Клубника' },

  // Бобовые
  'chickpeas': { product: 'Нут' },
  'lentils': { product: 'Чечевица красная' },
  'red lentils': { product: 'Чечевица красная' },
  'beans': { product: 'Фасоль красная' },
  'kidney beans': { product: 'Фасоль красная' },

  // Орехи
  'almonds': { product: 'Миндаль' },
  'walnuts': { product: 'Грецкие орехи' },
  'peanuts': { product: 'Арахис' },
  'cashews': { product: 'Кешью' },

  // Масла
  'olive oil': { product: 'Оливковое масло' },
  'vegetable oil': { product: 'Подсолнечное масло' },
  'coconut oil': { product: 'Кокосовое масло' },

  // Приправы
  'salt': { product: 'Соль', ratio: 0 },
  'sea salt': { product: 'Морская соль', ratio: 0 },
  'pepper': { product: 'Перец чёрный', ratio: 0 },
  'black pepper': { product: 'Перец чёрный', ratio: 0 },
  'cayenne pepper': { product: 'Кайенский перец', ratio: 0.1 },
  'paprika': { product: 'Паприка' },
  'smoked paprika': { product: 'Копчёная паприка' },
  'cumin': { product: 'Зира' },
  'cumin seeds': { product: 'Семена зиры', ratio: 0.1 },
  'ground cumin': { product: 'Молотый зиру', ratio: 0.1 },
  'cardamom': { product: 'Кардамон', ratio: 0.1 },
  'saffron': { product: 'Шафран', ratio: 0.05 },
  'nutmeg': { product: 'Мускатный орех', ratio: 0.05 },
  'cinnamon': { product: 'Корица', ratio: 0.1 },
  'ground cinnamon': { product: 'Молотая корица', ratio: 0.1 },
  'oregano': { product: 'Орегано' },
  'basil': { product: 'Базилик' },
  'basil leaves': { product: 'Листья базилика' },
  'parsley': { product: 'Петрушка' },
  'coriander': { product: 'Кинза' },
  'ginger': { product: 'Имбирь' },
  'garlic powder': { product: 'Чесночный порошок', ratio: 0.05 },
  'bay leaf': { product: 'Лавровый лист', ratio: 0 },
  'bay leaves': { product: 'Лавровый лист', ratio: 0 },
  'mint': { product: 'Мята свежая' },
  'dill': { product: 'Укроп' },
  'harissa spice': { product: 'Хариса (специя)', ratio: 0.1 },
  'garam masala': { product: 'Гарам масала', ratio: 0.1 },
  'chinese five spice': { product: 'Китайская приправа 5 специй', ratio: 0.05 },

  // Соусы и приправы
  'soy sauce': { product: 'Соевый соус' },
  'fish sauce': { product: 'Рыбный соус' },
  'oyster sauce': { product: 'Устричный соус' },
  'hoisin sauce': { product: 'Хойсин соус' },
  'hotsauce': { product: 'Острый соус' },
  'sriracha': { product: 'Шрирача' },
  'tomato sauce': { product: 'Томатный соус' },
  'tahini': { product: 'Тахини (кунжутная паста)' },
  'mustard': { product: 'Горчица' },
  'worcestershire sauce': { product: 'Вустерширский соус' },
  'vinegar': { product: 'Уксус столовый' },
  'balsamic vinegar': { product: 'Бальзамический уксус' },
  'sherry vinegar': { product: 'Хересный уксус' },
  'white wine vinegar': { product: 'Винный уксус белый' },
  'red wine vinegar': { product: 'Винный уксус красный' },
  'ketchup': { product: 'Кетчуп' },
  'mayonnaise': { product: 'Майонез' },

  // Сахар
  'honey': { product: 'Мёд' },
  'sugar': { product: 'Сахар белый' },
  'brown sugar': { product: 'Сахар коричневый' },
  'caster sugar': { product: 'Сахар мелкий (кастор)' },
  'icing sugar': { product: 'Сахарная пудра' },
  'powdered sugar': { product: 'Сахарная пудра' },

  // Мука и крахмал
  'flour': { product: 'Мука пшеничная' },
  'plain flour': { product: 'Мука пшеничная' },
  'self-raising flour': { product: 'Мука пшеничная' },
  'cornstarch': { product: 'Кукурузный крахмал' },
  'baking powder': { product: 'Разрыхлитель', ratio: 0 },

  // Дополнительное мясо
  'chorizo': { product: 'Чоризо' },
  'lamb': { product: 'Баранина' },

  // Дополнительные овощи
  'tomato': { product: 'Томат' },
  'cherry tomatoes': { product: 'Черри помидоры' },
  'plum tomatoes': { product: 'Сливовидные помидоры' },
  'red onions': { product: 'Красный лук' },
  'spring onions': { product: 'Зелёный лук' },
  'leek': { product: 'Лук-порей' },
  'beetroot': { product: 'Свёкла' },
  'fennel': { product: 'Фенхель' },
  'green chilli': { product: 'Зелёный чили' },
  'black olives': { product: 'Чёрные оливки' },
  'green olives': { product: 'Зелёные оливки' },
  'capers': { product: 'Каперсы' },
  'corn': { product: 'Кукуруза' },
  'green beans': { product: 'Стручковая фасоль' },
  'peas': { product: 'Горох зелёный' },
  'aubergine': { product: 'Баклажаны' },
  'eggplant': { product: 'Баклажаны' },
  'kale': { product: 'Кале' },
  'rocket': { product: 'Руккола' },
  'watercress': { product: 'Кресс-салат' },
  'artichoke': { product: 'Артишок' },
  'asparagus': { product: 'Спаржа' },
  'brussels sprouts': { product: 'Брюссельская капуста' },
  'butternut squash': { product: 'Мускатная тыква' },
  'bok choy': { product: 'Бок-чой' },

  // Дополнительные масла
  'oil': { product: 'Растительное масло (общее)' },
  'extra virgin olive oil': { product: 'Оливковое масло Extra Virgin' },
  'sunflower oil': { product: 'Подсолнечное масло' },

  // Дополнительные молочные
  'sour cream': { product: 'Сметана 20%' },
  'heavy cream': { product: 'Жирные сливки 33%' },
  'parmesan cheese': { product: 'Сыр пармезан (отдельный)' },
  'unsalted butter': { product: 'Сливочное масло несолёное' },
  'feta cheese': { product: 'Сыр фета' },
  'goat cheese': { product: 'Козий сыр' },
  'ricotta': { product: 'Рикотта' },
  'cream cheese': { product: 'Сливочный сыр' },

  // Дополнительные яйца
  'egg white': { product: 'Яичный белок', ratio: 0.6 },
  'free-range egg, beaten': { product: 'Яйца фермерские' },
  'free-range egg': { product: 'Яйца фермерские' },

  // Алкоголь
  'red wine': { product: 'Красное вино' },
  'white wine': { product: 'Белое вино' },

  // Соки и напитки
  'lemon juice': { product: 'Лимонный сок' },
  'coconut milk': { product: 'Кокосовое молоко' },

  // Дополнительные бобовые
  'red lentils': { product: 'Красная чечевица' },
  'green lentils': { product: 'Зелёная чечевица' },
  'cannellini beans': { product: 'Фасоль каннеллини' },
  'butter beans': { product: 'Масляная фасоль' },

  // Хлеб
  'pita bread': { product: 'Пита' },
  'tortilla': { product: 'Тортилья' },
  'naan bread': { product: 'Наан' },

  // Дополнительные орехи
  'peanut butter': { product: 'Арахисовая паста' },
  'pine nuts': { product: 'Кедровые орехи' },
  'pistachios': { product: 'Фисташки' },
  'pecans': { product: 'Орехи пекан' },
  'sunflower seeds': { product: 'Семена подсолнечника' },
  'pumpkin seeds': { product: 'Семена тыквы' },
  'sesame seeds': { product: 'Семена кунжута' },
  'flaxseed': { product: 'Семена льна' },
  'chia seeds': { product: 'Семена чиа' },

  // Морепродукты
  'anchovies': { product: 'Анчоусы консервированные' },
  'sardines': { product: 'Сардины консервированные' },
  'mussels': { product: 'Мидии' },
  'squid': { product: 'Кальмары' },
  'clams': { product: 'Моллюски' },

  // Грибы
  'shiitake mushrooms': { product: 'Грибы шиитаке' },
  'oyster mushrooms': { product: 'Вешенки' },
  'porcini mushrooms': { product: 'Белые грибы' },

  // Крупы
  'wild rice': { product: 'Дикий рис' },
  'arborio rice': { product: 'Рис арборио' },
  'jasmine rice': { product: 'Рис жасмин' },

  // Фрукты
  'apples': { product: 'Яблоки' },
  'bananas': { product: 'Бананы' },
  'avocado': { product: 'Авокадо' },
  'mango': { product: 'Манго' },
  'pineapple': { product: 'Ананас' },
  'blueberries': { product: 'Голубика' },
  'raspberries': { product: 'Малина' },
  'dates': { product: 'Финики' },
  'figs': { product: 'Инжир' },
  'pomegranate': { product: 'Гранат' },
  'dragon fruit': { product: 'Питайя' },
  'raisins': { product: 'Изюм' },
  'dried apricots': { product: 'Курага' },
  'prunes': { product: 'Чернослив' },

  // Бульоны
  'chicken stock cube': { product: 'Бульонный кубик куриный' },
  'beef stock cube': { product: 'Бульонный кубик говяжий' },
  'stock': { product: 'Бульонный кубик овощной' },
  'chicken stock': { product: 'Бульонный кубик куриный' },
  'beef stock': { product: 'Бульонный кубик говяжий' },
  'vegetable stock': { product: 'Бульонный кубик овощной' },

  // Экстракты
  'vanilla': { product: 'Ваниль', ratio: 0 },
  'vanilla extract': { product: 'Ваниль', ratio: 0 },
  'almond extract': { product: 'Миндальный экстракт', ratio: 0.1 },
  'rose water': { product: 'Розовая вода', ratio: 0 },

  // Вода
  'water': { product: 'Вода', ratio: 0 },
};

// Определение типа приёма пищи по категории
function detectMealType(category: string, tags: string | null): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  const catLower = category.toLowerCase();
  const tagsLower = (tags || '').toLowerCase();

  // Завтрак
  if (catLower.includes('breakfast') || tagsLower.includes('breakfast')) {
    return 'breakfast';
  }

  // Десерты и выпечка - перекус
  if (catLower.includes('dessert') || catLower.includes('baking') ||
      catLower.includes('cake') || tagsLower.includes('sweet')) {
    return 'snack';
  }

  // Основные блюда - обед или ужин (случайно)
  const isLunch = Math.random() > 0.5;
  return isLunch ? 'lunch' : 'dinner';
}

// Определение сложности рецепта
function detectComplexity(instructions: string, ingredientCount: number): 'simple' | 'medium' | 'complex' {
  const words = instructions.split(' ').length;

  if (ingredientCount <= 5 && words < 100) return 'simple';
  if (ingredientCount <= 10 && words < 200) return 'medium';
  return 'complex';
}

// Парсинг количества ингредиента
function parseAmount(measure: string): number {
  if (!measure || measure.trim() === '') return 100; // Default

  const text = measure.toLowerCase().trim();

  // Удаляем описания (chopped, diced, etc)
  const cleaned = text.replace(/(chopped|diced|sliced|minced|crushed|grated|fresh|dried|ground)/gi, '').trim();

  // Граммы
  if (cleaned.includes('g')) {
    const match = cleaned.match(/(\d+)\s*g/);
    if (match) return parseInt(match[1]);
  }

  // Килограммы
  if (cleaned.includes('kg')) {
    const match = cleaned.match(/(\d+\.?\d*)\s*kg/);
    if (match) return parseFloat(match[1]) * 1000;
  }

  // Миллилитры (приравниваем к граммам)
  if (cleaned.includes('ml')) {
    const match = cleaned.match(/(\d+)\s*ml/);
    if (match) return parseInt(match[1]);
  }

  // Столовые ложки (15г)
  if (cleaned.includes('tbs') || cleaned.includes('tbsp') || cleaned.includes('tablespoon')) {
    const match = cleaned.match(/(\d+)/);
    if (match) return parseInt(match[1]) * 15;
  }

  // Чайные ложки (5г)
  if (cleaned.includes('tsp') || cleaned.includes('teaspoon')) {
    const match = cleaned.match(/(\d+)/);
    if (match) return parseInt(match[1]) * 5;
  }

  // Чашки (200г)
  if (cleaned.includes('cup')) {
    const match = cleaned.match(/(\d+\.?\d*)/);
    if (match) return parseFloat(match[1]) * 200;
  }

  // Штуки (для яиц, луковиц и т.д.)
  const numMatch = cleaned.match(/^(\d+)/);
  if (numMatch) {
    return parseInt(numMatch[1]) * 50; // Примерный вес одной штуки
  }

  return 100; // Default
}

async function fetchAllRecipes(): Promise<TheMealDBRecipe[]> {
  console.log('\n[1/4] Загрузка всех рецептов из TheMealDB...');

  const allRecipes: TheMealDBRecipe[] = [];
  const categories = ['Beef', 'Chicken', 'Dessert', 'Lamb', 'Pasta', 'Pork', 'Seafood', 'Vegetarian', 'Breakfast'];

  for (const category of categories) {
    try {
      console.log(`   Загрузка категории: ${category}...`);
      const response = await axios.get(`${THEMEALDB_API}/filter.php?c=${category}`);
      const meals = response.data.meals || [];

      console.log(`   Найдено рецептов: ${meals.length}`);

      // Загружаем детали каждого рецепта
      for (const meal of meals.slice(0, 15)) { // Ограничим 15 рецептов на категорию
        try {
          const detailResponse = await axios.get(`${THEMEALDB_API}/lookup.php?i=${meal.idMeal}`);
          if (detailResponse.data.meals) {
            allRecipes.push(detailResponse.data.meals[0]);
          }
          await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
        } catch (error) {
          console.error(`   ⚠️ Ошибка загрузки рецепта ${meal.idMeal}`);
        }
      }
    } catch (error) {
      console.error(`   ⚠️ Ошибка загрузки категории ${category}`);
    }
  }

  console.log(`   ✅ Всего загружено: ${allRecipes.length} рецептов\n`);
  return allRecipes;
}

async function importRecipe(recipe: TheMealDBRecipe): Promise<void> {
  try {
    // Извлекаем ингредиенты
    const ingredients: Array<{ name: string; amount: number }> = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = recipe[`strIngredient${i}`];
      const measure = recipe[`strMeasure${i}`];

      if (ingredient && ingredient.trim()) {
        ingredients.push({
          name: ingredient.trim().toLowerCase(),
          amount: parseAmount(measure)
        });
      }
    }

    if (ingredients.length === 0) {
      console.log(`   ⚠️ Пропущен рецепт "${recipe.strMeal}" (нет ингредиентов)`);
      return;
    }

    // Маппим ингредиенты на наши продукты
    const mappedIngredients: Array<{ productId: string; amount: number }> = [];
    let unmappedCount = 0;

    for (const ing of ingredients) {
      const mapping = INGREDIENT_MAPPING[ing.name];

      if (mapping && mapping.ratio !== 0) {
        // Ищем продукт в базе
        const productResult = await pool.query(
          'SELECT id FROM products WHERE name ILIKE $1 LIMIT 1',
          [mapping.product]
        );

        if (productResult.rows.length > 0) {
          mappedIngredients.push({
            productId: productResult.rows[0].id,
            amount: Math.round(ing.amount * (mapping.ratio || 1))
          });
        } else {
          unmappedCount++;
        }
      } else {
        unmappedCount++;
      }
    }

    // Если меньше 50% ингредиентов смаппилось - пропускаем
    if (mappedIngredients.length < ingredients.length * 0.5) {
      console.log(`   ⚠️ Пропущен "${recipe.strMeal}" (мало совпадений: ${mappedIngredients.length}/${ingredients.length})`);
      return;
    }

    // Определяем параметры рецепта
    const mealType = detectMealType(recipe.strCategory, recipe.strTags);
    const complexity = detectComplexity(recipe.strInstructions, mappedIngredients.length);
    const cookingTime = Math.max(15, Math.min(120, recipe.strInstructions.split(' ').length / 3)); // Примерное время

    // Создаём рецепт
    const recipeResult = await pool.query(`
      INSERT INTO recipes (
        name, meal_type, cooking_time, instructions,
        servings, is_scalable, min_portion, max_portion, complexity, is_active
      )
      VALUES ($1, $2, $3, $4, 2, true, 0.5, 2.0, $5, true)
      RETURNING id
    `, [
      recipe.strMeal,
      mealType,
      Math.round(cookingTime),
      recipe.strInstructions.substring(0, 1000), // Ограничим длину
      complexity
    ]);

    const recipeId = recipeResult.rows[0].id;

    // Добавляем ингредиенты
    for (const ing of mappedIngredients) {
      await pool.query(`
        INSERT INTO recipe_items (recipe_id, product_id, amount_grams, is_optional)
        VALUES ($1, $2, $3, false)
      `, [recipeId, ing.productId, ing.amount]);
    }

    // Рассчитываем и кэшируем КБЖУ
    const kbjuResult = await pool.query(`
      SELECT
        SUM(p.calories * ri.amount_grams / 100) as calories,
        SUM(p.protein * ri.amount_grams / 100) as protein,
        SUM(p.fat * ri.amount_grams / 100) as fat,
        SUM(p.carbs * ri.amount_grams / 100) as carbs,
        SUM(p.fiber * ri.amount_grams / 100) as fiber
      FROM recipe_items ri
      JOIN products p ON ri.product_id = p.id
      WHERE ri.recipe_id = $1
    `, [recipeId]);

    const kbju = kbjuResult.rows[0];

    await pool.query(`
      UPDATE recipes SET
        cached_calories = $1,
        cached_protein = $2,
        cached_fat = $3,
        cached_carbs = $4,
        cached_fiber = $5
      WHERE id = $6
    `, [
      Math.round(kbju.calories),
      Math.round(kbju.protein),
      Math.round(kbju.fat),
      Math.round(kbju.carbs),
      Math.round(kbju.fiber),
      recipeId
    ]);

    console.log(`   ✅ Импортирован: "${recipe.strMeal}" (${mealType}, ${mappedIngredients.length} ингредиентов, ${Math.round(kbju.calories)} ккал)`);

  } catch (error) {
    console.error(`   ❌ Ошибка импорта "${recipe.strMeal}":`, error instanceof Error ? error.message : error);
  }
}

async function main() {
  console.log('\n🍽️ Импорт рецептов из TheMealDB\n');

  try {
    // 1. Загружаем рецепты из API
    const recipes = await fetchAllRecipes();

    // 2. Импортируем каждый рецепт
    console.log('[2/4] Импорт рецептов в базу данных...\n');
    let imported = 0;

    for (const recipe of recipes) {
      await importRecipe(recipe);
      imported++;
    }

    // 3. Статистика
    console.log('\n[3/4] Статистика импорта:');
    const statsResult = await pool.query(`
      SELECT
        meal_type,
        COUNT(*) as count,
        ROUND(AVG(cached_calories)) as avg_calories,
        ROUND(AVG(cooking_time)) as avg_time
      FROM recipes
      WHERE is_active = true
      GROUP BY meal_type
      ORDER BY meal_type
    `);

    console.log('   Рецепты по типам:');
    statsResult.rows.forEach((row: any) => {
      console.log(`   - ${row.meal_type}: ${row.count} шт. (сред. ${row.avg_calories} ккал, ${row.avg_time} мин)`);
    });

    const totalResult = await pool.query('SELECT COUNT(*) as total FROM recipes WHERE is_active = true');
    console.log(`   \n   Всего активных рецептов: ${totalResult.rows[0].total}`);

    console.log('\n[4/4] ✅ Импорт завершён!\n');

  } catch (error) {
    console.error('\n❌ Ошибка:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
