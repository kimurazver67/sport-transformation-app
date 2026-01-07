// Test meal plan generation
import { MealPlanGenerator } from './src/services/mealPlanGenerator';
import { pool } from './src/db/postgres';

const TEST_USER_ID = 'e97b5556-1722-4823-b14a-dfde8477b9ea'; // Руслан Рахимов

async function testGeneration() {
  console.log('\n🧪 Тестирование генерации плана питания\n');

  try {
    // 1. Проверяем данные пользователя
    console.log('[1/5] Проверка данных пользователя...');
    const userResult = await pool.query(
      'SELECT first_name, goal, start_weight FROM users WHERE id = $1',
      [TEST_USER_ID]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];
    console.log(`   ✅ Пользователь: ${user.first_name}`);
    console.log(`   ✅ Цель: ${user.goal}`);
    console.log(`   ✅ Вес: ${user.start_weight} кг`);

    // 2. Проверяем доступные рецепты
    console.log('\n[2/5] Проверка доступных рецептов...');
    const recipesResult = await pool.query(`
      SELECT meal_type, COUNT(*) as count
      FROM recipes
      WHERE is_active = true
      GROUP BY meal_type
      ORDER BY meal_type
    `);

    console.log('   Рецепты по типам:');
    recipesResult.rows.forEach((row: any) => {
      console.log(`   - ${row.meal_type}: ${row.count}`);
    });

    // 3. Генерируем план питания (1 неделя для быстрого теста)
    console.log('\n[3/5] Генерация плана питания (1 неделя)...');
    const generator = new MealPlanGenerator(pool);

    const startTime = Date.now();
    const mealPlanId = await generator.generate({
      userId: TEST_USER_ID,
      weeks: 1,
      allowRepeatDays: 2,
      preferSimple: true,
    });
    const duration = Date.now() - startTime;

    console.log(`   ✅ План создан за ${duration}ms`);
    console.log(`   ✅ ID плана: ${mealPlanId}`);

    // 4. Проверяем созданный план
    console.log('\n[4/5] Проверка созданного плана...');
    const planResult = await pool.query(
      'SELECT * FROM meal_plans WHERE id = $1',
      [mealPlanId]
    );

    const plan = planResult.rows[0];
    console.log(`   Целевые КБЖУ:`);
    console.log(`   - Калории: ${plan.target_calories} ккал`);
    console.log(`   - Белки: ${plan.target_protein}г`);
    console.log(`   - Жиры: ${plan.target_fat}г`);
    console.log(`   - Углеводы: ${plan.target_carbs}г`);

    console.log(`\n   Фактические средние КБЖУ:`);
    console.log(`   - Калории: ${plan.avg_calories} ккал (разница: ${Math.abs(plan.avg_calories - plan.target_calories)} ккал)`);
    console.log(`   - Белки: ${plan.avg_protein}г (разница: ${Math.abs(plan.avg_protein - plan.target_protein)}г)`);
    console.log(`   - Жиры: ${plan.avg_fat}г (разница: ${Math.abs(plan.avg_fat - plan.target_fat)}г)`);
    console.log(`   - Углеводы: ${plan.avg_carbs}г (разница: ${Math.abs(plan.avg_carbs - plan.target_carbs)}г)`);

    // 5. Показываем примеры дней
    console.log('\n[5/5] Примеры сгенерированных дней...');
    const daysResult = await pool.query(`
      SELECT
        md.week_number,
        md.day_number,
        md.total_calories,
        md.total_protein,
        md.total_fat,
        md.total_carbs,
        json_agg(
          json_build_object(
            'meal_type', m.meal_type,
            'recipe_name', r.name,
            'portion', m.portion_multiplier,
            'calories', m.calories
          )
          ORDER BY
            CASE m.meal_type
              WHEN 'breakfast' THEN 1
              WHEN 'lunch' THEN 2
              WHEN 'dinner' THEN 3
              WHEN 'snack' THEN 4
            END
        ) as meals
      FROM meal_days md
      JOIN meals m ON md.id = m.meal_day_id
      JOIN recipes r ON m.recipe_id = r.id
      WHERE md.meal_plan_id = $1
      GROUP BY md.id
      ORDER BY md.week_number, md.day_number
      LIMIT 2
    `, [mealPlanId]);

    daysResult.rows.forEach((day: any, index: number) => {
      console.log(`\n   День ${day.day_number}:`);
      console.log(`   КБЖУ: ${day.total_calories} ккал | Б: ${day.total_protein}г | Ж: ${day.total_fat}г | У: ${day.total_carbs}г`);
      console.log(`   Приёмы пищи:`);
      day.meals.forEach((meal: any) => {
        console.log(`     - ${meal.meal_type}: ${meal.recipe_name} (порция: ${meal.portion}x, ${meal.calories} ккал)`);
      });
    });

    // Проверяем список покупок
    console.log('\n📋 Список покупок:');
    const shoppingResult = await pool.query(`
      SELECT
        p.name,
        sl.total_grams,
        p.category,
        sl.is_monthly
      FROM shopping_list sl
      JOIN products p ON sl.product_id = p.id
      WHERE sl.meal_plan_id = $1
      ORDER BY sl.is_monthly DESC, p.category, p.name
      LIMIT 10
    `, [mealPlanId]);

    console.log(`   Найдено ${shoppingResult.rowCount} продуктов`);
    console.log('   Первые 10 продуктов:');
    shoppingResult.rows.forEach((item: any) => {
      const type = item.is_monthly ? 'месяц' : 'неделя';
      console.log(`   - ${item.name}: ${Math.round(item.total_grams)}г (${type})`);
    });

    console.log('\n✅ Тест успешно завершён!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Ошибка:', error);
    if (error instanceof Error) {
      console.error('   Детали:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testGeneration();
