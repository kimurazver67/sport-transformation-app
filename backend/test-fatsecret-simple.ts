// Simple FatSecret API test (standalone, no config dependencies)

import axios from 'axios';

const CLIENT_ID = '54f1eebc60864584bbe6529ff549ed58';
const CLIENT_SECRET = 'b596986f18ba469da864c0b37c1c775f';
const TOKEN_URL = 'https://oauth.fatsecret.com/connect/token';
const API_URL = 'https://platform.fatsecret.com/rest/foods/search/v1';

async function getAccessToken() {
  console.log('[1/4] Получение access token...');

  const response = await axios.post(
    TOKEN_URL,
    new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'basic'
    }),
    {
      auth: {
        username: CLIENT_ID,
        password: CLIENT_SECRET
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );

  console.log('   ✅ Token получен, expires in:', response.data.expires_in, 'сек');
  return response.data.access_token;
}

async function searchFood(token: string, query: string) {
  console.log(`[2/4] Поиск продуктов: "${query}"...`);

  const response = await axios.get(
    API_URL,
    {
      params: {
        search_expression: query,
        format: 'json',
        max_results: 5
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  console.log('   Raw response:', JSON.stringify(response.data, null, 2).substring(0, 500));

  const foods = response.data.foods?.food || [];
  console.log(`   ✅ Найдено ${foods.length} продуктов`);

  return foods;
}

async function getFoodDetail(token: string, foodId: string) {
  console.log(`[3/4] Получение деталей продукта ${foodId}...`);

  const response = await axios.post(
    API_URL,
    new URLSearchParams({
      method: 'food.get.v2',
      food_id: foodId,
      format: 'json'
    }),
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );

  console.log('   ✅ Детали получены');
  return response.data.food;
}

async function main() {
  console.log('\n🧪 Тестирование FatSecret API\n');

  try {
    // Step 1: Get access token
    const token = await getAccessToken();

    // Step 2: Search for "chicken"
    const foods = await searchFood(token, 'chicken');

    if (foods.length > 0) {
      console.log('\n📋 Результаты поиска:');
      foods.forEach((food: any, i: number) => {
        console.log(`   ${i + 1}. ${food.food_name}`);
        console.log(`      ${food.food_description.substring(0, 80)}...`);
      });

      // Step 3: Get details for first result
      const firstFood = foods[0];
      const details = await getFoodDetail(token, firstFood.food_id);

      console.log('\n[4/4] Детали первого продукта:');
      console.log(`   Название: ${details.food_name}`);
      console.log(`   ID: ${details.food_id}`);
      console.log(`   Порций: ${Array.isArray(details.servings.serving) ? details.servings.serving.length : 1}`);

      const serving = Array.isArray(details.servings.serving)
        ? details.servings.serving[0]
        : details.servings.serving;

      console.log(`   Первая порция:`);
      console.log(`     Калории: ${serving.calories}`);
      console.log(`     Белки: ${serving.protein}г`);
      console.log(`     Жиры: ${serving.fat}г`);
      console.log(`     Углеводы: ${serving.carbohydrate}г`);

      console.log('\n✅ Все тесты пройдены успешно!\n');
    } else {
      console.log('\n⚠️ Продуктов не найдено\n');
    }

  } catch (error: any) {
    console.error('\n❌ Ошибка:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

main();
