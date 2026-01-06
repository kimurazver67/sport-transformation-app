import { query } from '../src/db/postgres';

/**
 * Скрипт для пересчёта стриков всех пользователей
 * Проходит по истории чекинов и правильно вычисляет текущий стрик
 */

interface User {
  id: string;
  first_name: string;
}

interface Checkin {
  date: string;
}

async function recalculateStreaks() {
  try {
    // Получаем всех участников
    const usersResult = await query<User>(
      `SELECT id, first_name FROM users WHERE role = 'participant'`
    );

    console.log(`Found ${usersResult.rows.length} participants`);

    for (const user of usersResult.rows) {
      // Получаем все чекины пользователя, отсортированные по дате
      const checkinsResult = await query<Checkin>(
        `SELECT DISTINCT date::text as date
         FROM daily_checkins
         WHERE user_id = $1
         ORDER BY date DESC`,
        [user.id]
      );

      if (checkinsResult.rows.length === 0) {
        console.log(`${user.first_name}: No checkins`);
        continue;
      }

      const checkins = checkinsResult.rows.map(c => c.date.split('T')[0]);
      const today = new Date().toISOString().split('T')[0];

      // Вычисляем текущий стрик
      let currentStreak = 0;
      let checkDate = today;

      for (const checkinDate of checkins) {
        if (checkinDate === checkDate) {
          currentStreak++;
          // Переходим к вчерашнему дню
          const date = new Date(checkDate);
          date.setDate(date.getDate() - 1);
          checkDate = date.toISOString().split('T')[0];
        } else {
          // Пропуск в чекинах - стрик прервался
          break;
        }
      }

      const lastCheckinDate = checkins[0];
      const maxStreakResult = await query<{ max_streak: number }>(
        'SELECT max_streak FROM user_stats WHERE user_id = $1',
        [user.id]
      );

      const currentMaxStreak = maxStreakResult.rows[0]?.max_streak || 0;
      const newMaxStreak = Math.max(currentStreak, currentMaxStreak);

      // Обновляем статистику
      await query(
        `UPDATE user_stats
         SET current_streak = $1,
             max_streak = $2,
             last_checkin_date = $3,
             updated_at = NOW()
         WHERE user_id = $4`,
        [currentStreak, newMaxStreak, lastCheckinDate, user.id]
      );

      console.log(`${user.first_name}: ${currentStreak} days (max: ${newMaxStreak})`);
    }

    console.log('\n✅ Streaks recalculated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error recalculating streaks:', error);
    process.exit(1);
  }
}

recalculateStreaks();
