// backend/src/test-fatsecret.ts
// Тестовый скрипт для проверки FatSecret API

import { NutritionDataService } from './services/nutritionDataService';
import dotenv from 'dotenv';

dotenv.config();

const CLIENT_ID = process.env.FATSECRET_CLIENT_ID || '54f1eebc60864584bbe6529ff549ed58';
const CLIENT_SECRET = process.env.FATSECRET_CLIENT_SECRET || 'b596986f18ba469da864c0b37c1c775f';

async function testFatSecret() {
  console.log('\n🧪 Тестирование FatSecret API\n');
  console.log('Client ID:', CLIENT_ID);
  console.log('Client Secret:', CLIENT_SECRET.substring(0, 10) + '...\n');

  const service = new NutritionDataService(CLIENT_ID, CLIENT_SECRET);

  try {
    // Тест 1: Поиск "chicken"
    console.log('📋 Тест 1: Поиск "chicken"');
    const searchResults = await service.searchFatSecret('chicken', 5);
    console.log(`✅ Найдено ${searchResults.length} продуктов:`);
    searchResults.forEach((product, i) => {
      console.log(`   ${i + 1}. ${product.food_name}`);
      console.log(`      ${product.food_description.substring(0, 80)}...`);
    });

    // Тест 2: Комбинированный поиск "курица"
    console.log('\n📋 Тест 2: Комбинированный поиск "курица" (local + fatsecret)');
    const combined = await service.searchProducts('курица', 'all', 10);
    console.log(`✅ Найдено ${combined.products.length} продуктов:`);
    combined.products.forEach((product, i) => {
      const source = product.source === 'local' ? '🗄️ БД' : '🌐 API';
      console.log(`   ${i + 1}. ${source} ${product.name} - ${product.calories} ккал`);
    });

    // Тест 3: Импорт продукта (если есть результаты)
    if (searchResults.length > 0) {
      console.log('\n📋 Тест 3: Импорт первого продукта');
      const firstProduct = searchResults[0];
      console.log(`   Импортируем: ${firstProduct.food_name}`);
      const imported = await service.importProduct(firstProduct.food_id);
      console.log(`   ✅ Product ID: ${imported.product_id}`);
      console.log(`   Already exists: ${imported.already_exists}`);
    }

    console.log('\n✅ Все тесты пройдены успешно!\n');
  } catch (error) {
    console.error('\n❌ Ошибка при тестировании:', error);
    if (error instanceof Error) {
      console.error('   Сообщение:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }

  process.exit(0);
}

testFatSecret();
