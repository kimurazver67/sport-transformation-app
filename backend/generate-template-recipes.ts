// Generate recipes from templates to reach 500+ recipes
import { pool } from './src/db/postgres';

interface Product {
  id: string;
  name: string;
  category: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  cooking_ratio: number;
}

interface RecipeTemplate {
  name_pattern: string;
  name_short_pattern: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  components: {
    protein?: { category: string[]; amount: [number, number] };
    carb?: { category: string[]; amount: [number, number] };
    vegetable?: { category: string[]; amount: [number, number] };
    fat?: { category: string[]; amount: [number, number] };
    extra?: { category: string[]; amount: [number, number] };
  };
  instructions_template: string;
  cooking_time: number;
  complexity: 'simple' | 'medium' | 'complex';
  target_calories: [number, number];
}

const RECIPE_TEMPLATES: RecipeTemplate[] = [
  // === ЗАВТРАКИ ===

  // Омлеты
  {
    name_pattern: 'Омлет с {vegetable}',
    name_short_pattern: 'Омлет с {vegetable}',
    meal_type: 'breakfast',
    components: {
      protein: { category: ['eggs', 'dairy'], amount: [120, 150] },
      vegetable: { category: ['vegetables'], amount: [80, 120] },
      fat: { category: ['oils'], amount: [5, 10] },
    },
    instructions_template: 'Взбить яйца, добавить нарезанные овощи. Жарить на сковороде до готовности.',
    cooking_time: 15,
    complexity: 'simple',
    target_calories: [250, 350],
  },

  // Каши
  {
    name_pattern: 'Овсянка с {extra}',
    name_short_pattern: 'Овсянка {extra}',
    meal_type: 'breakfast',
    components: {
      carb: { category: ['grains'], amount: [60, 80] },
      extra: { category: ['fruits', 'nuts', 'dried_fruits'], amount: [30, 50] },
      fat: { category: ['dairy'], amount: [50, 100] },
    },
    instructions_template: 'Отварить овсянку на молоке или воде. Добавить топпинг.',
    cooking_time: 10,
    complexity: 'simple',
    target_calories: [300, 400],
  },

  // Тосты/сэндвичи
  {
    name_pattern: 'Тост с {protein} и {vegetable}',
    name_short_pattern: 'Тост {protein}',
    meal_type: 'breakfast',
    components: {
      protein: { category: ['dairy', 'eggs', 'fish'], amount: [50, 100] },
      carb: { category: ['bread'], amount: [60, 80] },
      vegetable: { category: ['vegetables'], amount: [50, 80] },
      fat: { category: ['oils'], amount: [5, 10] },
    },
    instructions_template: 'Поджарить хлеб. Выложить начинку и подавать.',
    cooking_time: 10,
    complexity: 'simple',
    target_calories: [250, 350],
  },

  // Смузи-боулы
  {
    name_pattern: 'Смузи-боул с {extra}',
    name_short_pattern: 'Смузи {extra}',
    meal_type: 'breakfast',
    components: {
      extra: { category: ['fruits'], amount: [150, 200] },
      carb: { category: ['grains'], amount: [30, 50] },
      protein: { category: ['dairy', 'nuts'], amount: [50, 80] },
    },
    instructions_template: 'Взбить ингредиенты в блендере. Украсить топпингами.',
    cooking_time: 5,
    complexity: 'simple',
    target_calories: [300, 400],
  },

  // === ОБЕДЫ ===

  // Гречка/рис с мясом
  {
    name_pattern: '{protein} с {carb} и {vegetable}',
    name_short_pattern: '{protein} с {carb}',
    meal_type: 'lunch',
    components: {
      protein: { category: ['meat', 'poultry', 'fish'], amount: [150, 200] },
      carb: { category: ['grains'], amount: [80, 120] },
      vegetable: { category: ['vegetables'], amount: [150, 200] },
      fat: { category: ['oils'], amount: [10, 15] },
    },
    instructions_template: 'Отварить крупу. Обжарить белок. Потушить овощи. Подавать вместе.',
    cooking_time: 40,
    complexity: 'simple',
    target_calories: [500, 700],
  },

  // Супы
  {
    name_pattern: 'Суп с {protein} и {vegetable}',
    name_short_pattern: 'Суп {protein}',
    meal_type: 'lunch',
    components: {
      protein: { category: ['meat', 'poultry', 'fish', 'legumes'], amount: [100, 150] },
      vegetable: { category: ['vegetables'], amount: [200, 300] },
      carb: { category: ['grains', 'pasta'], amount: [40, 60] },
      fat: { category: ['oils'], amount: [10, 15] },
    },
    instructions_template: 'Сварить бульон. Добавить овощи и крупу. Варить до готовности.',
    cooking_time: 60,
    complexity: 'medium',
    target_calories: [300, 450],
  },

  // Рагу
  {
    name_pattern: 'Рагу из {protein} с {vegetable}',
    name_short_pattern: 'Рагу {protein}',
    meal_type: 'lunch',
    components: {
      protein: { category: ['meat', 'poultry'], amount: [150, 200] },
      vegetable: { category: ['vegetables'], amount: [250, 350] },
      carb: { category: ['vegetables'], amount: [100, 150] }, // Картофель
      fat: { category: ['oils'], amount: [15, 20] },
    },
    instructions_template: 'Обжарить мясо. Добавить овощи и тушить до готовности.',
    cooking_time: 50,
    complexity: 'medium',
    target_calories: [450, 650],
  },

  // === УЖИНЫ ===

  // Запечённое мясо/рыба
  {
    name_pattern: '{protein} запечённый с {vegetable}',
    name_short_pattern: '{protein} запечённый',
    meal_type: 'dinner',
    components: {
      protein: { category: ['fish', 'poultry', 'meat'], amount: [180, 220] },
      vegetable: { category: ['vegetables'], amount: [200, 300] },
      fat: { category: ['oils'], amount: [10, 15] },
    },
    instructions_template: 'Замариновать белок. Выложить с овощами на противень. Запекать при 180°C.',
    cooking_time: 45,
    complexity: 'simple',
    target_calories: [400, 550],
  },

  // Стейки с гарниром
  {
    name_pattern: 'Стейк из {protein} с {vegetable}',
    name_short_pattern: 'Стейк {protein}',
    meal_type: 'dinner',
    components: {
      protein: { category: ['fish', 'meat'], amount: [180, 220] },
      vegetable: { category: ['vegetables'], amount: [150, 200] },
      fat: { category: ['oils'], amount: [10, 15] },
    },
    instructions_template: 'Обжарить стейк до нужной прожарки. Приготовить гарнир из овощей.',
    cooking_time: 25,
    complexity: 'simple',
    target_calories: [400, 550],
  },

  // Салаты с белком
  {
    name_pattern: 'Салат с {protein} и {vegetable}',
    name_short_pattern: 'Салат {protein}',
    meal_type: 'dinner',
    components: {
      protein: { category: ['poultry', 'fish', 'seafood', 'eggs'], amount: [120, 150] },
      vegetable: { category: ['vegetables'], amount: [200, 250] },
      extra: { category: ['nuts', 'dairy'], amount: [30, 50] },
      fat: { category: ['oils'], amount: [15, 20] },
    },
    instructions_template: 'Приготовить белок. Нарезать овощи. Смешать с заправкой.',
    cooking_time: 20,
    complexity: 'simple',
    target_calories: [350, 500],
  },

  // === ПЕРЕКУСЫ ===

  // Протеиновые коктейли
  {
    name_pattern: 'Протеиновый смузи с {extra}',
    name_short_pattern: 'Смузи {extra}',
    meal_type: 'snack',
    components: {
      protein: { category: ['dairy'], amount: [200, 250] },
      extra: { category: ['fruits'], amount: [100, 150] },
      fat: { category: ['nuts'], amount: [20, 30] },
    },
    instructions_template: 'Взбить все ингредиенты в блендере до однородности.',
    cooking_time: 5,
    complexity: 'simple',
    target_calories: [200, 300],
  },

  // Орехово-фруктовые батончики
  {
    name_pattern: 'Энергетический батончик {extra}',
    name_short_pattern: 'Батончик {extra}',
    meal_type: 'snack',
    components: {
      extra: { category: ['dried_fruits'], amount: [40, 60] },
      fat: { category: ['nuts'], amount: [40, 60] },
      carb: { category: ['grains'], amount: [30, 40] },
    },
    instructions_template: 'Измельчить орехи и сухофрукты. Смешать с овсянкой и мёдом. Сформовать батончики.',
    cooking_time: 10,
    complexity: 'simple',
    target_calories: [250, 350],
  },

  // Йогурты с топпингами
  {
    name_pattern: 'Греческий йогурт с {extra}',
    name_short_pattern: 'Йогурт {extra}',
    meal_type: 'snack',
    components: {
      protein: { category: ['dairy'], amount: [150, 200] },
      extra: { category: ['fruits', 'nuts', 'dried_fruits'], amount: [50, 80] },
    },
    instructions_template: 'Выложить йогурт в пиалу. Добавить топпинг.',
    cooking_time: 3,
    complexity: 'simple',
    target_calories: [150, 250],
  },
];

async function getProductsByCategory(category: string): Promise<Product[]> {
  const result = await pool.query<Product>(`
    SELECT id, name, category, calories, protein, fat, carbs, cooking_ratio
    FROM products
    WHERE category = $1 AND is_active = true
    ORDER BY RANDOM()
  `, [category]);
  return result.rows;
}

function selectRandomProduct(products: Product[]): Product {
  return products[Math.floor(Math.random() * products.length)];
}

function getRandomAmount(range: [number, number]): number {
  const [min, max] = range;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function extractProductName(fullName: string): string {
  // Извлекаем короткое название (например, "Куриная грудка" -> "грудка")
  const parts = fullName.toLowerCase().split(' ');
  return parts[parts.length - 1];
}

async function generateRecipes(targetCount: number) {
  console.log(`\n🔧 Генерация рецептов по шаблонам (цель: ${targetCount} рецептов)\n`);

  // Получаем текущее количество рецептов
  const currentCountResult = await pool.query(
    'SELECT COUNT(*) as count FROM recipes WHERE is_active = true'
  );
  const currentCount = parseInt(currentCountResult.rows[0].count);
  console.log(`   Текущее количество: ${currentCount} рецептов`);

  const neededCount = targetCount - currentCount;
  if (neededCount <= 0) {
    console.log(`   ✅ Цель уже достигнута!\n`);
    return;
  }

  console.log(`   Нужно сгенерировать: ${neededCount} рецептов\n`);

  // Кэшируем продукты по категориям
  const productCache: Record<string, Product[]> = {};
  const categories = ['meat', 'poultry', 'fish', 'seafood', 'dairy', 'eggs', 'grains', 'pasta', 'bread', 'vegetables', 'fruits', 'nuts', 'dried_fruits', 'oils', 'legumes'];

  for (const category of categories) {
    productCache[category] = await getProductsByCategory(category);
    console.log(`   Загружено продуктов категории "${category}": ${productCache[category].length}`);
  }

  console.log('\n');

  let generated = 0;
  let skipped = 0;

  while (generated < neededCount) {
    // Выбираем случайный шаблон
    const template = RECIPE_TEMPLATES[Math.floor(Math.random() * RECIPE_TEMPLATES.length)];

    try {
      // Собираем ингредиенты
      const ingredients: { product: Product; amount: number; type: string }[] = [];
      const selectedNames: Record<string, string> = {};

      for (const [type, config] of Object.entries(template.components)) {
        const availableProducts: Product[] = [];

        for (const category of config.category) {
          if (productCache[category]) {
            availableProducts.push(...productCache[category]);
          }
        }

        if (availableProducts.length === 0) {
          throw new Error(`No products in categories: ${config.category.join(', ')}`);
        }

        const product = selectRandomProduct(availableProducts);
        const amount = getRandomAmount(config.amount);

        ingredients.push({ product, amount, type });
        selectedNames[type] = extractProductName(product.name);
      }

      // Генерируем название
      let recipeName = template.name_pattern;
      let recipeNameShort = template.name_short_pattern;

      for (const [type, name] of Object.entries(selectedNames)) {
        recipeName = recipeName.replace(`{${type}}`, name);
        recipeNameShort = recipeNameShort.replace(`{${type}}`, name);
      }

      // Проверяем, не существует ли уже такой рецепт
      const existingRecipe = await pool.query(
        'SELECT id FROM recipes WHERE name = $1',
        [recipeName]
      );

      if (existingRecipe.rows.length > 0) {
        skipped++;
        continue;
      }

      // Рассчитываем КБЖУ
      let totalCalories = 0;
      let totalProtein = 0;
      let totalFat = 0;
      let totalCarbs = 0;

      for (const ing of ingredients) {
        const factor = (ing.amount / 100) * ing.product.cooking_ratio;
        totalCalories += ing.product.calories * factor;
        totalProtein += ing.product.protein * factor;
        totalFat += ing.product.fat * factor;
        totalCarbs += ing.product.carbs * factor;
      }

      // Создаём рецепт
      const recipeResult = await pool.query(`
        INSERT INTO recipes (
          name, name_short, instructions, meal_type,
          cooking_time, complexity, is_active,
          cached_calories, cached_protein, cached_fat, cached_carbs
        ) VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, $9, $10)
        RETURNING id
      `, [
        recipeName,
        recipeNameShort,
        template.instructions_template,
        template.meal_type,
        template.cooking_time,
        template.complexity,
        Math.round(totalCalories),
        Math.round(totalProtein * 10) / 10,
        Math.round(totalFat * 10) / 10,
        Math.round(totalCarbs * 10) / 10,
      ]);

      const recipeId = recipeResult.rows[0].id;

      // Добавляем ингредиенты
      for (const ing of ingredients) {
        await pool.query(`
          INSERT INTO recipe_items (recipe_id, product_id, amount_grams, is_optional)
          VALUES ($1, $2, $3, false)
        `, [recipeId, ing.product.id, ing.amount]);
      }

      generated++;
      console.log(`   ✅ ${generated}/${neededCount}: "${recipeName}" (${template.meal_type}, ${Math.round(totalCalories)} ккал)`);

    } catch (error) {
      skipped++;
      if (skipped > 100) {
        console.error(`\n❌ Слишком много пропусков (${skipped}). Остановка.`);
        break;
      }
    }
  }

  console.log(`\n📊 Итого:`);
  console.log(`   Сгенерировано: ${generated}`);
  console.log(`   Пропущено: ${skipped}`);

  // Финальная статистика
  const finalResult = await pool.query(`
    SELECT meal_type, COUNT(*) as count
    FROM recipes
    WHERE is_active = true
    GROUP BY meal_type
    ORDER BY meal_type
  `);

  console.log(`\n   Распределение по типам:`);
  finalResult.rows.forEach((row: any) => {
    console.log(`   - ${row.meal_type}: ${row.count}`);
  });

  const totalResult = await pool.query('SELECT COUNT(*) as count FROM recipes WHERE is_active = true');
  console.log(`\n   ✅ Всего активных рецептов: ${totalResult.rows[0].count}\n`);

  await pool.end();
}

// Запуск генерации
const targetCount = parseInt(process.argv[2] || '500');
generateRecipes(targetCount).catch(console.error);
