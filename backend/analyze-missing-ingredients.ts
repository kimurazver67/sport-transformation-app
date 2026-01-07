// Analyze which ingredients from TheMealDB are missing in our mapping
import axios from 'axios';

const THEMEALDB_API = 'https://www.themealdb.com/api/json/v1/1';

interface TheMealDBRecipe {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  [key: `strIngredient${number}`]: string;
  [key: `strMeasure${number}`]: string;
}

// Current mapping (копируем из import-recipes-themealdb.ts для анализа)
const INGREDIENT_MAPPING: Record<string, boolean> = {
  'chicken': true,
  'chicken breast': true,
  'chicken breasts': true,
  'chicken thighs': true,
  'beef': true,
  'beef mince': true,
  'ground beef': true,
  'pork': true,
  'bacon': true,
  'sausage': true,
  'turkey': true,
  'salmon': true,
  'tuna': true,
  'cod': true,
  'white fish': true,
  'prawns': true,
  'shrimp': true,
  'milk': true,
  'cheese': true,
  'cheddar cheese': true,
  'parmesan': true,
  'mozzarella': true,
  'butter': true,
  'cream': true,
  'double cream': true,
  'yogurt': true,
  'greek yogurt': true,
  'eggs': true,
  'egg': true,
  'egg yolks': true,
  'egg whites': true,
  'rice': true,
  'basmati rice': true,
  'pasta': true,
  'spaghetti': true,
  'noodles': true,
  'oats': true,
  'porridge oats': true,
  'quinoa': true,
  'bulgur': true,
  'couscous': true,
  'bread': true,
  'white bread': true,
  'breadcrumbs': true,
  'tomatoes': true,
  'tinned tomatos': true,
  'tomato puree': true,
  'onion': true,
  'onions': true,
  'garlic': true,
  'garlic clove': true,
  'carrot': true,
  'carrots': true,
  'potato': true,
  'potatoes': true,
  'sweet potato': true,
  'bell pepper': true,
  'red pepper': true,
  'broccoli': true,
  'spinach': true,
  'lettuce': true,
  'cucumber': true,
  'zucchini': true,
  'courgette': true,
  'mushrooms': true,
  'celery': true,
  'cabbage': true,
  'corn': true,
  'green beans': true,
  'peas': true,
  'cauliflower': true,
  'eggplant': true,
  'aubergine': true,
  'apple': true,
  'apples': true,
  'banana': true,
  'bananas': true,
  'orange': true,
  'lemon': true,
  'lime': true,
  'strawberries': true,
  'blueberries': true,
  'raspberries': true,
  'mango': true,
  'pineapple': true,
  'avocado': true,
  'olive oil': true,
  'vegetable oil': true,
  'sunflower oil': true,
  'coconut oil': true,
  'salt': true,
  'black pepper': true,
  'pepper': true,
  'paprika': true,
  'cumin': true,
  'coriander': true,
  'chilli': true,
  'chilli powder': true,
  'ginger': true,
  'turmeric': true,
  'oregano': true,
  'basil': true,
  'parsley': true,
  'thyme': true,
  'rosemary': true,
  'cinnamon': true,
  'vanilla': true,
  'vanilla extract': true,
  'honey': true,
  'sugar': true,
  'brown sugar': true,
  'flour': true,
  'plain flour': true,
  'self-raising flour': true,
  'baking powder': true,
  'soy sauce': true,
  'worcestershire sauce': true,
  'vinegar': true,
  'balsamic vinegar': true,
  'mustard': true,
  'mayonnaise': true,
  'ketchup': true,
  'nuts': true,
  'almonds': true,
  'walnuts': true,
  'peanuts': true,
  'cashews': true,
  'chickpeas': true,
  'lentils': true,
  'kidney beans': true,
  'black beans': true,
  'water': true,
  'stock': true,
  'chicken stock': true,
  'beef stock': true,
  'vegetable stock': true,
};

async function fetchAllRecipes(): Promise<TheMealDBRecipe[]> {
  const categories = [
    'Beef', 'Chicken', 'Dessert', 'Lamb', 'Pasta',
    'Pork', 'Seafood', 'Vegetarian', 'Breakfast'
  ];

  const recipes: TheMealDBRecipe[] = [];

  for (const category of categories) {
    try {
      const response = await axios.get(`${THEMEALDB_API}/filter.php?c=${category}`);
      const meals = response.data.meals || [];

      console.log(`Категория ${category}: ${meals.length} рецептов`);

      // Берём первые 15 рецептов из категории
      for (const meal of meals.slice(0, 15)) {
        const detailResponse = await axios.get(`${THEMEALDB_API}/lookup.php?i=${meal.idMeal}`);
        const recipe = detailResponse.data.meals?.[0];
        if (recipe) {
          recipes.push(recipe);
        }
      }
    } catch (error) {
      console.error(`Ошибка загрузки категории ${category}:`, error);
    }
  }

  return recipes;
}

async function analyzeIngredients() {
  console.log('🔍 Анализ недостающих ингредиентов из TheMealDB\n');

  const recipes = await fetchAllRecipes();
  console.log(`\n📊 Загружено ${recipes.length} рецептов\n`);

  const missingIngredients = new Map<string, number>();
  const mappedIngredients = new Map<string, number>();
  let totalIngredients = 0;

  for (const recipe of recipes) {
    for (let i = 1; i <= 20; i++) {
      const ingredient = recipe[`strIngredient${i}` as keyof TheMealDBRecipe];
      const measure = recipe[`strMeasure${i}` as keyof TheMealDBRecipe];

      if (!ingredient || ingredient.trim() === '') break;

      totalIngredients++;
      const normalized = ingredient.trim().toLowerCase();

      if (INGREDIENT_MAPPING[normalized]) {
        mappedIngredients.set(normalized, (mappedIngredients.get(normalized) || 0) + 1);
      } else {
        missingIngredients.set(normalized, (missingIngredients.get(normalized) || 0) + 1);
      }
    }
  }

  console.log(`\n📈 Статистика:`);
  console.log(`   Всего ингредиентов в рецептах: ${totalIngredients}`);
  console.log(`   Уникальных ингредиентов: ${missingIngredients.size + mappedIngredients.size}`);
  console.log(`   Найдено в маппинге: ${mappedIngredients.size} (${Math.round(mappedIngredients.size / (missingIngredients.size + mappedIngredients.size) * 100)}%)`);
  console.log(`   Отсутствует в маппинге: ${missingIngredients.size}\n`);

  // Сортируем недостающие ингредиенты по частоте использования
  const sortedMissing = Array.from(missingIngredients.entries())
    .sort((a, b) => b[1] - a[1]);

  console.log(`\n❌ ТОП-50 недостающих ингредиентов (по частоте):\n`);
  sortedMissing.slice(0, 50).forEach(([ingredient, count], index) => {
    console.log(`${index + 1}. ${ingredient} - используется ${count} раз`);
  });

  console.log(`\n\n💡 Рекомендации:`);
  console.log(`   1. Добавить ${sortedMissing.slice(0, 100).length} самых частых ингредиентов`);
  console.log(`   2. Это покроет ~${Math.round(sortedMissing.slice(0, 100).reduce((sum, [_, count]) => sum + count, 0) / totalIngredients * 100)}% всех ингредиентов`);

  // Сохраняем в файл для дальнейшей работы
  const fs = require('fs');
  const output = {
    stats: {
      totalRecipes: recipes.length,
      totalIngredients,
      uniqueIngredients: missingIngredients.size + mappedIngredients.size,
      mapped: mappedIngredients.size,
      missing: missingIngredients.size,
    },
    missingIngredients: sortedMissing,
  };

  fs.writeFileSync(
    '/tmp/missing-ingredients.json',
    JSON.stringify(output, null, 2)
  );

  console.log(`\n✅ Детальный анализ сохранён в /tmp/missing-ingredients.json\n`);
}

analyzeIngredients().catch(console.error);
