// Временный скрипт для проверки замеров пользователя Павла Скородумова
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkUserMeasurements() {
  try {
    // Ищем пользователя по имени
    const userResult = await pool.query(
      `SELECT id, telegram_id, first_name, last_name, created_at
       FROM users
       WHERE first_name ILIKE '%Павел%' AND last_name ILIKE '%Скородумов%'`
    );

    if (userResult.rows.length === 0) {
      console.log('❌ Пользователь "Павел Скородумов" не найден');
      process.exit(0);
    }

    const user = userResult.rows[0];
    console.log('\n✅ Пользователь найден:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Telegram ID: ${user.telegram_id}`);
    console.log(`   Имя: ${user.first_name} ${user.last_name || ''}`);
    console.log(`   Регистрация: ${user.created_at}`);

    // Получаем все замеры
    const measurementsResult = await pool.query(
      `SELECT id, week_number, date, weight, chest, waist, hips,
              bicep_left, bicep_right, thigh_left, thigh_right,
              body_fat_percent, created_at
       FROM weekly_measurements
       WHERE user_id = $1
       ORDER BY week_number ASC`,
      [user.id]
    );

    console.log(`\n📊 Всего замеров: ${measurementsResult.rows.length}`);

    if (measurementsResult.rows.length === 0) {
      console.log('   Замеры отсутствуют');
    } else {
      console.log('\n📋 Список замеров:');
      measurementsResult.rows.forEach((m, index) => {
        console.log(`\n   ${index + 1}. Неделя ${m.week_number} (${m.date})`);
        console.log(`      Вес: ${m.weight} кг`);
        console.log(`      Грудь: ${m.chest || '—'} см`);
        console.log(`      Талия: ${m.waist || '—'} см`);
        console.log(`      Бедра: ${m.hips || '—'} см`);
        console.log(`      Создано: ${m.created_at}`);
      });

      // Проверяем дубликаты по неделям
      const weekNumbers = measurementsResult.rows.map(m => m.week_number);
      const duplicateWeeks = weekNumbers.filter((w, i) => weekNumbers.indexOf(w) !== i);

      if (duplicateWeeks.length > 0) {
        console.log(`\n⚠️  ВНИМАНИЕ: Найдены дубликаты недель: ${[...new Set(duplicateWeeks)].join(', ')}`);
      }

      // Проверяем записи с одинаковым весом
      const weights = measurementsResult.rows.map(m => parseFloat(m.weight));
      const duplicateWeights = weights.filter((w, i) => weights.indexOf(w) !== i && weights.lastIndexOf(w) !== i);

      if (duplicateWeights.length > 0) {
        console.log(`\n⚠️  Одинаковый вес (${duplicateWeights[0]} кг) в нескольких записях`);
      }
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkUserMeasurements();
