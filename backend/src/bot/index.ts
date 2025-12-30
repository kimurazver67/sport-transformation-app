import { Telegraf, Markup, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { config, getCurrentWeek } from '../config';
import { userService } from '../services/userService';
import { checkinService } from '../services/checkinService';
import { measurementService } from '../services/measurementService';
import { statsService } from '../services/statsService';
import { taskService } from '../services/taskService';
import { achievementService } from '../services/achievementService';
import { adminNotifier } from '../services/adminNotifierService';
import { User, WorkoutType, MoodLevel, CheckinForm } from '../types';
import { query } from '../db/postgres';
import { setDebugMode, getDebugMode } from '../routes/api';

// Расширяем контекст
interface BotContext extends Context {
  user?: User;
}

// Создаём бота
export const bot = new Telegraf<BotContext>(config.bot.token);

// ===== ГЛОБАЛЬНЫЙ ОБРАБОТЧИК ОШИБОК БОТА =====
bot.catch(async (err: unknown, ctx) => {
  const error = err instanceof Error ? err : new Error(String(err));
  const errorMessage = error.message || '';

  // Игнорируем 409 ошибки - это нормально при деплое (смена инстанса)
  if (errorMessage.includes('409') || errorMessage.includes('Conflict')) {
    console.log('[Bot] Ignoring 409 conflict error (expected during deploy)');
    return;
  }

  console.error('Bot error:', error);

  // Извлекаем информацию о команде с типизацией
  const message = ctx.message as { text?: string } | undefined;
  const callbackQuery = ctx.callbackQuery as { data?: string } | undefined;
  const command = message?.text || callbackQuery?.data || 'N/A';

  // Отправляем уведомление в админский чат
  await adminNotifier.error(error, {
    endpoint: 'Telegram Bot',
    method: ctx.updateType,
    userId: ctx.from?.id?.toString(),
    additionalInfo: `Command: ${command}`,
  });

  // Пытаемся уведомить пользователя
  try {
    await ctx.reply('❌ Произошла ошибка. Попробуй ещё раз или обратись к тренеру.');
  } catch {
    // Игнорируем ошибку отправки
  }
});

// Middleware: привязка пользователя к контексту
bot.use(async (ctx, next) => {
  if (ctx.from) {
    const existingUser = await userService.findByTelegramId(ctx.from.id);
    const isNewUser = !existingUser;

    ctx.user = await userService.findOrCreate({
      telegram_id: ctx.from.id,
      username: ctx.from.username,
      first_name: ctx.from.first_name,
      last_name: ctx.from.last_name,
    });

    // Уведомляем о новом пользователе
    if (isNewUser && ctx.user) {
      await adminNotifier.newUser({
        telegramId: ctx.from.id,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
        username: ctx.from.username,
      });
    }
  }
  return next();
});

// ===== КОМАНДА /start =====
bot.start(async (ctx) => {
  const user = ctx.user!;
  const isTrainer = user.role === 'trainer';

  const welcomeText = isTrainer
    ? `👋 Привет, тренер ${user.first_name}!\n\nТы управляешь курсом "Трансформация тела".`
    : `💪 Добро пожаловать в курс "Трансформация тела", ${user.first_name}!\n\nЗдесь ты будешь отслеживать свой прогресс, выполнять задания и соревноваться с другими участниками.`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.webApp('📱 Открыть приложение', config.app.webappUrl)],
    [Markup.button.callback('📊 Мой прогресс', 'my_progress')],
    [Markup.button.callback('✅ Чекин сегодня', 'quick_checkin')],
    [Markup.button.callback('📸 Загрузить фото', 'start_photo_session')],
  ]);

  await ctx.reply(welcomeText, keyboard);
});

// ===== КОМАНДА /checkin =====
bot.command('checkin', async (ctx) => {
  await startCheckinFlow(ctx);
});

// ===== КОМАНДА /stats =====
bot.command('stats', async (ctx) => {
  const user = ctx.user!;
  const stats = await statsService.getUserStats(user.id);
  const checkinStats = await checkinService.getStats(user.id);

  if (!stats) {
    return ctx.reply('📊 Статистика пока недоступна. Начни с чекина!');
  }

  const moodEmojis = ['😢', '😕', '😐', '🙂', '😃'];
  const avgMoodEmoji = moodEmojis[Math.round(checkinStats.avgMood) - 1] || '😐';

  const text = `
📊 *Твоя статистика*

🔥 Текущий streak: ${stats.current_streak} дней
🏆 Максимальный streak: ${stats.max_streak} дней

⭐ Очки всего: ${stats.total_points}
📅 Очки за неделю: ${stats.weekly_points}

📈 Позиция в общем рейтинге: #${stats.rank_overall}
📊 Позиция за неделю: #${stats.rank_weekly}

*Детали чекинов:*
✅ Всего чекинов: ${checkinStats.totalCheckins}
🏋️ Дней с тренировкой: ${checkinStats.workoutDays}
🥗 Дней с правильным питанием: ${checkinStats.nutritionDays}
😴 Средний сон: ${checkinStats.avgSleep} ч
${avgMoodEmoji} Среднее настроение: ${checkinStats.avgMood}/5
  `.trim();

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.webApp('📱 Подробнее в приложении', config.app.webappUrl)],
    [Markup.button.callback('🏆 Рейтинг', 'leaderboard')],
  ]);

  await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
});

// ===== КОМАНДА /photo =====
bot.command('photo', async (ctx) => {
  const user = ctx.user!;

  // Проверяем, есть ли замер текущей недели
  const measurement = await measurementService.getCurrentWeekMeasurement(user.id);

  if (!measurement) {
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.webApp('📱 Внести замеры', config.app.webappUrl)],
    ]);
    return ctx.reply(
      '📸 Чтобы загрузить фото прогресса, сначала внеси данные о весе в приложении.',
      keyboard
    );
  }

  // Начинаем фото-сессию
  photoSessionState.set(ctx.from!.id, {
    step: 'front',
    measurementId: measurement.id,
    photos: {},
  });

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('⏭️ Пропустить', 'photo_skip')],
    [Markup.button.callback('❌ Отмена', 'photo_cancel')],
  ]);

  await ctx.reply(
    `📸 *Загрузка фото прогресса*\n\n` +
    `Шаг 1/3: Отправь фото *СПЕРЕДИ*\n\n` +
    `💡 Совет: встань ровно, руки вдоль тела, хорошее освещение`,
    { parse_mode: 'Markdown', ...keyboard }
  );
});

// ===== КОМАНДА /chatid =====
bot.command('chatid', async (ctx) => {
  const chatId = ctx.chat?.id;
  const chatType = ctx.chat?.type;
  const chatTitle = (ctx.chat as any)?.title || 'Личный чат';

  await ctx.reply(
    `📋 *Информация о чате*\n\n` +
    `🆔 Chat ID: \`${chatId}\`\n` +
    `📝 Тип: ${chatType}\n` +
    `💬 Название: ${chatTitle}\n\n` +
    `Скопируйте Chat ID и добавьте в переменные Railway:\n` +
    `\`ADMIN_CHAT_ID=${chatId}\``,
    { parse_mode: 'Markdown' }
  );
});

// ===== КОМАНДА /setrole - установить роль (одноразовая для первого тренера) =====
bot.command('setrole', async (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  const targetRole = args[0]?.toLowerCase();

  if (targetRole !== 'trainer') {
    return ctx.reply('Использование: /setrole trainer');
  }

  // Проверяем, есть ли уже тренеры
  const trainersResult = await query<{ count: string }>(
    "SELECT COUNT(*) as count FROM users WHERE role = 'trainer'"
  );
  const trainersCount = parseInt(trainersResult.rows[0]?.count || '0');

  // Если тренеров нет - разрешаем стать первым
  // Если есть - только тренер может назначать других
  if (trainersCount > 0 && ctx.user?.role !== 'trainer') {
    return ctx.reply('❌ Тренер уже есть. Только тренер может назначать других тренеров.');
  }

  // Назначаем роль
  await query(
    'UPDATE users SET role = $1 WHERE telegram_id = $2',
    ['trainer', ctx.from!.id]
  );

  // Обновляем ctx.user
  if (ctx.user) {
    ctx.user.role = 'trainer';
  }

  await ctx.reply(
    '✅ *Вы назначены тренером!*\n\n' +
    'Теперь вам доступны команды:\n' +
    '• `/debug` - управление debug логами\n' +
    '• Админ-панель в приложении',
    { parse_mode: 'Markdown' }
  );
});

// ===== КОМАНДА /debug - управление debug логами (только для тренера) =====
bot.command('debug', async (ctx) => {
  const user = ctx.user;

  // Проверяем права (только тренер)
  if (!user || user.role !== 'trainer') {
    return ctx.reply('❌ Эта команда доступна только тренеру.');
  }

  const args = ctx.message.text.split(' ').slice(1);
  const action = args[0]?.toLowerCase();

  if (action === 'on') {
    setDebugMode(true);
    await ctx.reply(
      '✅ *Debug режим включён*\n\n' +
      'Теперь вы будете получать debug логи от фронтенда.\n' +
      'Используйте `/debug off` чтобы отключить.',
      { parse_mode: 'Markdown' }
    );
  } else if (action === 'off') {
    setDebugMode(false);
    await ctx.reply(
      '🔇 *Debug режим отключён*\n\n' +
      'Debug логи от фронтенда не будут отправляться.\n' +
      'Используйте `/debug on` чтобы включить.',
      { parse_mode: 'Markdown' }
    );
  } else {
    // Показываем текущий статус
    const isEnabled = getDebugMode();
    const statusEmoji = isEnabled ? '✅' : '🔇';
    const statusText = isEnabled ? 'включён' : 'отключён';

    const keyboard = Markup.inlineKeyboard([
      isEnabled
        ? [Markup.button.callback('🔇 Отключить', 'debug_off')]
        : [Markup.button.callback('✅ Включить', 'debug_on')],
    ]);

    await ctx.reply(
      `🔧 *Debug режим: ${statusEmoji} ${statusText}*\n\n` +
      'Команды:\n' +
      '• `/debug on` - включить логи\n' +
      '• `/debug off` - отключить логи\n\n' +
      'Когда включён, вы будете получать debug сообщения от фронтенда в этот чат.',
      { parse_mode: 'Markdown', ...keyboard }
    );
  }
});

// Callbacks для кнопок debug
bot.action('debug_on', async (ctx) => {
  const user = ctx.user;
  if (!user || user.role !== 'trainer') {
    await ctx.answerCbQuery('❌ Только для тренера');
    return;
  }

  setDebugMode(true);
  await ctx.answerCbQuery('✅ Debug включён');
  await ctx.editMessageText(
    '✅ *Debug режим включён*\n\n' +
    'Теперь вы будете получать debug логи от фронтенда.\n' +
    'Используйте `/debug off` чтобы отключить.',
    { parse_mode: 'Markdown' }
  );
});

bot.action('debug_off', async (ctx) => {
  const user = ctx.user;
  if (!user || user.role !== 'trainer') {
    await ctx.answerCbQuery('❌ Только для тренера');
    return;
  }

  setDebugMode(false);
  await ctx.answerCbQuery('🔇 Debug отключён');
  await ctx.editMessageText(
    '🔇 *Debug режим отключён*\n\n' +
    'Debug логи от фронтенда не будут отправляться.\n' +
    'Используйте `/debug on` чтобы включить.',
    { parse_mode: 'Markdown' }
  );
});

// ===== КОМАНДА /app =====
bot.command('app', async (ctx) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.webApp('📱 Открыть Mini App', config.app.webappUrl)],
  ]);
  await ctx.reply('Нажми кнопку, чтобы открыть приложение:', keyboard);
});

// ===== БЫСТРЫЙ ЧЕКИН =====
async function startCheckinFlow(ctx: BotContext) {
  // Проверяем, есть ли уже чекин сегодня
  const todayCheckin = await checkinService.getTodayCheckin(ctx.user!.id);

  if (todayCheckin) {
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('✏️ Изменить чекин', 'edit_checkin')],
      [Markup.button.webApp('📱 Открыть приложение', config.app.webappUrl)],
    ]);
    return ctx.reply('✅ Ты уже сделал чекин сегодня!', keyboard);
  }

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('💪 Силовая', 'workout_strength'),
      Markup.button.callback('🏃 Кардио', 'workout_cardio'),
    ],
    [
      Markup.button.callback('😴 Отдых', 'workout_rest'),
      Markup.button.callback('❌ Пропуск', 'workout_skip'),
    ],
  ]);

  await ctx.reply('🏋️ Была ли тренировка сегодня?', keyboard);
}

// Обработка выбора тренировки
bot.action(/workout_(.+)/, async (ctx) => {
  const workoutType = ctx.match[1] as 'strength' | 'cardio' | 'rest' | 'skip';
  const hasWorkout = workoutType !== 'skip';

  // Сохраняем в сессию (используем callback_query.data как временное хранилище)
  (ctx as any).session = {
    workout: hasWorkout,
    workout_type: hasWorkout ? workoutType : undefined,
  };

  await ctx.answerCbQuery();

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ Да', 'nutrition_yes'),
      Markup.button.callback('❌ Нет', 'nutrition_no'),
    ],
  ]);

  await ctx.editMessageText('🥗 Питание было в норме сегодня?', keyboard);
});

// Состояние чекина для каждого пользователя
const checkinState = new Map<number, Partial<CheckinForm>>();

// Состояние фото-сессии для каждого пользователя
interface PhotoSession {
  step: 'front' | 'side' | 'back' | 'done';
  measurementId: string;
  photos: {
    front?: string;
    side?: string;
    back?: string;
  };
}
const photoSessionState = new Map<number, PhotoSession>();

// Обновлённые обработчики с сохранением состояния
bot.action(/workout_(.+)/, async (ctx) => {
  const workoutType = ctx.match[1] as 'strength' | 'cardio' | 'rest' | 'skip';
  const hasWorkout = workoutType !== 'skip';

  checkinState.set(ctx.from!.id, {
    workout: hasWorkout,
    workout_type: hasWorkout ? workoutType as WorkoutType : undefined,
  });

  await ctx.answerCbQuery();

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ Да', 'nutrition_yes'),
      Markup.button.callback('❌ Нет', 'nutrition_no'),
    ],
  ]);

  await ctx.editMessageText('🥗 Питание было в норме сегодня?', keyboard);
});

bot.action(/nutrition_(yes|no)/, async (ctx) => {
  const nutrition = ctx.match[1] === 'yes';
  const state = checkinState.get(ctx.from!.id) || {};
  state.nutrition = nutrition;
  checkinState.set(ctx.from!.id, state);

  await ctx.answerCbQuery();

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ Да', 'water_yes'),
      Markup.button.callback('❌ Нет', 'water_no'),
    ],
  ]);

  await ctx.editMessageText('💧 Выпил достаточно воды?', keyboard);
});

bot.action(/water_(yes|no)/, async (ctx) => {
  const water = ctx.match[1] === 'yes';
  const state = checkinState.get(ctx.from!.id) || {};
  state.water = water;
  checkinState.set(ctx.from!.id, state);

  await ctx.answerCbQuery();

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('5', 'sleep_5'),
      Markup.button.callback('6', 'sleep_6'),
      Markup.button.callback('7', 'sleep_7'),
      Markup.button.callback('8', 'sleep_8'),
    ],
    [
      Markup.button.callback('9', 'sleep_9'),
      Markup.button.callback('10+', 'sleep_10'),
    ],
  ]);

  await ctx.editMessageText('😴 Сколько часов спал?', keyboard);
});

bot.action(/sleep_(\d+)/, async (ctx) => {
  const sleep = parseInt(ctx.match[1]);
  const state = checkinState.get(ctx.from!.id) || {};
  state.sleep_hours = sleep;
  checkinState.set(ctx.from!.id, state);

  await ctx.answerCbQuery();

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('😢 1', 'mood_1'),
      Markup.button.callback('😕 2', 'mood_2'),
      Markup.button.callback('😐 3', 'mood_3'),
      Markup.button.callback('🙂 4', 'mood_4'),
      Markup.button.callback('😃 5', 'mood_5'),
    ],
  ]);

  await ctx.editMessageText('🎭 Как самочувствие сегодня?', keyboard);
});

bot.action(/mood_(\d)/, async (ctx) => {
  const mood = parseInt(ctx.match[1]) as MoodLevel;
  const state = checkinState.get(ctx.from!.id) || {};
  state.mood = mood;

  await ctx.answerCbQuery();

  try {
    // Создаём чекин
    const checkin = await checkinService.createOrUpdate(ctx.user!.id, {
      workout: state.workout || false,
      workout_type: state.workout_type,
      nutrition: state.nutrition || false,
      water: state.water || false,
      sleep_hours: state.sleep_hours || 7,
      mood: mood,
    });

    // Получаем обновлённый streak
    const stats = await statsService.getUserStats(ctx.user!.id);

    // Проверяем новые достижения
    const achievements = await achievementService.checkAndUnlock(ctx.user!.id);

    let text = `✅ Чекин записан!\n\n🔥 Твой streak: ${stats?.current_streak || 1} дней\n⭐ Получено очков: +10`;

    if (achievements.length > 0) {
      text += '\n\n🎉 Новые достижения:';
      for (const a of achievements) {
        const info = achievementService.getAchievementInfo(a.achievement_type as any);
        text += `\n${info.icon} ${info.title}`;
      }
    }

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.webApp('📱 Открыть приложение', config.app.webappUrl)],
    ]);

    await ctx.editMessageText(text, keyboard);

    // Уведомляем админа о чекине
    const moodNames: Record<number, string> = { 1: 'bad', 2: 'tired', 3: 'okay', 4: 'good', 5: 'great' };
    await adminNotifier.checkin(
      { firstName: ctx.user!.first_name, username: ctx.user!.username || undefined },
      {
        mood: moodNames[mood] || 'okay',
        workout: state.workout || false,
        nutrition: state.nutrition || false,
        points: 10,
        streak: stats?.current_streak || 1,
      }
    );

    // Уведомляем о новых достижениях
    for (const a of achievements) {
      const info = achievementService.getAchievementInfo(a.achievement_type as any);
      await adminNotifier.achievement(
        { firstName: ctx.user!.first_name, username: ctx.user!.username || undefined },
        { name: info.title, description: info.description }
      );
    }

    // Очищаем состояние
    checkinState.delete(ctx.from!.id);
  } catch (error) {
    console.error('Checkin error:', error);
    await adminNotifier.error(error as Error, { additionalInfo: 'Bot checkin flow' });
    await ctx.editMessageText('❌ Ошибка при сохранении чекина. Попробуй ещё раз.');
  }
});

// ===== РЕЙТИНГ =====
bot.action('leaderboard', async (ctx) => {
  await ctx.answerCbQuery();

  const leaderboard = await statsService.getLeaderboard(10);
  const user = ctx.user!;

  let text = '🏆 *Рейтинг участников*\n\n';

  const medals = ['🥇', '🥈', '🥉'];

  leaderboard.forEach((entry, index) => {
    const medal = index < 3 ? medals[index] : `${index + 1}.`;
    const isCurrentUser = entry.user_id === user.id;
    const highlight = isCurrentUser ? '→ ' : '';

    text += `${highlight}${medal} ${entry.user.first_name}: ${entry.total_points} очков (🔥${entry.current_streak})\n`;
  });

  // Если пользователь не в топ-10, показываем его позицию
  const userInTop = leaderboard.find(e => e.user_id === user.id);
  if (!userInTop) {
    const stats = await statsService.getUserStats(user.id);
    if (stats) {
      text += `\n...\n→ ${stats.rank_overall}. ${user.first_name}: ${stats.total_points} очков`;
    }
  }

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('📅 Рейтинг недели', 'weekly_leaderboard')],
    [Markup.button.webApp('📱 Подробнее', config.app.webappUrl)],
  ]);

  await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
});

bot.action('weekly_leaderboard', async (ctx) => {
  await ctx.answerCbQuery();

  const leaderboard = await statsService.getWeeklyLeaderboard(10);
  const user = ctx.user!;

  let text = '📅 *Рейтинг недели*\n\n';

  const medals = ['🥇', '🥈', '🥉'];

  leaderboard.forEach((entry, index) => {
    const medal = index < 3 ? medals[index] : `${index + 1}.`;
    const isCurrentUser = entry.user_id === user.id;
    const highlight = isCurrentUser ? '→ ' : '';

    text += `${highlight}${medal} ${entry.user.first_name}: ${entry.weekly_points} очков\n`;
  });

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🏆 Общий рейтинг', 'leaderboard')],
    [Markup.button.webApp('📱 Подробнее', config.app.webappUrl)],
  ]);

  await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
});

// ===== МОЙ ПРОГРЕСС =====
bot.action('my_progress', async (ctx) => {
  await ctx.answerCbQuery();

  const user = ctx.user!;
  const progress = await measurementService.getProgressComparison(user.id);

  let text = '📈 *Твой прогресс*\n\n';

  if (progress.start && progress.current) {
    text += `Начальный вес: ${progress.start.weight} кг\n`;
    text += `Текущий вес: ${progress.current.weight} кг\n`;

    const change = progress.weightChange || 0;
    const emoji = change < 0 ? '📉' : change > 0 ? '📈' : '➡️';
    text += `${emoji} Изменение: ${change > 0 ? '+' : ''}${change.toFixed(1)} кг\n`;

    text += `\nНеделя курса: ${getCurrentWeek()}`;
  } else {
    text += 'Замеры пока не внесены.\nВнеси первый замер в приложении!';
  }

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.webApp('📱 Внести замеры', config.app.webappUrl)],
    [Markup.button.callback('📊 Статистика', 'my_stats')],
  ]);

  await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
});

// ===== ПРИЁМ ФОТО =====
bot.on(message('photo'), async (ctx) => {
  const user = ctx.user!;
  // Берём фото максимального качества
  const photo = ctx.message.photo[ctx.message.photo.length - 1];
  const fileId = photo.file_id;

  try {
    // Проверяем, есть ли активная фото-сессия
    const session = photoSessionState.get(ctx.from!.id);

    if (session && session.step !== 'done') {
      // Работаем в режиме фото-сессии
      const currentStep = session.step;
      session.photos[currentStep] = fileId;

      // Сохраняем file_id в БД (не загружаем никуда - Telegram хранит бесплатно)
      await measurementService.updatePhotoFileIds(session.measurementId, {
        [currentStep]: fileId,
      });

      // Переходим к следующему шагу
      const stepOrder: Array<'front' | 'side' | 'back'> = ['front', 'side', 'back'];
      const currentIndex = stepOrder.indexOf(currentStep);
      const stepNames = { front: 'СПЕРЕДИ', side: 'СБОКУ', back: 'СЗАДИ' };

      if (currentIndex < 2) {
        // Есть следующий шаг
        const nextStep = stepOrder[currentIndex + 1];
        session.step = nextStep;

        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback('⏭️ Пропустить', 'photo_skip')],
          [Markup.button.callback('✅ Завершить', 'photo_finish')],
        ]);

        await ctx.reply(
          `✅ Фото ${stepNames[currentStep]} сохранено!\n\n` +
          `📸 Шаг ${currentIndex + 2}/3: Отправь фото *${stepNames[nextStep]}*`,
          { parse_mode: 'Markdown', ...keyboard }
        );
      } else {
        // Это было последнее фото
        session.step = 'done';
        photoSessionState.delete(ctx.from!.id);

        const keyboard = Markup.inlineKeyboard([
          [Markup.button.webApp('📱 Посмотреть в приложении', config.app.webappUrl)],
        ]);

        await ctx.reply(
          `✅ Фото ${stepNames[currentStep]} сохранено!\n\n` +
          `🎉 *Все фото загружены!*\n` +
          `Ты можешь посмотреть их в приложении на странице замеров.`,
          { parse_mode: 'Markdown', ...keyboard }
        );
      }
      return;
    }

    // Обычный режим (без фото-сессии)
    let measurement = await measurementService.getCurrentWeekMeasurement(user.id);

    if (!measurement) {
      await ctx.reply(
        '📸 Фото получено!\n\nЧтобы сохранить его к замерам, сначала внеси данные о весе в приложении.',
        Markup.inlineKeyboard([
          [Markup.button.webApp('📱 Внести замеры', config.app.webappUrl)],
          [Markup.button.callback('📸 Загрузить фото', 'start_photo_session')],
        ])
      );
      return;
    }

    // Определяем тип фото по подписи или автоматически
    const caption = ctx.message.caption?.toLowerCase() || '';
    let photoType: 'front' | 'side' | 'back' = 'front';

    if (caption.includes('бок') || caption.includes('сбоку') || caption.includes('side')) {
      photoType = 'side';
    } else if (caption.includes('спина') || caption.includes('сзади') || caption.includes('back')) {
      photoType = 'back';
    } else if (caption.includes('фронт') || caption.includes('спереди') || caption.includes('front')) {
      photoType = 'front';
    } else {
      // Автоопределение по уже загруженным (проверяем file_id)
      if (!measurement.photo_front_file_id) photoType = 'front';
      else if (!measurement.photo_side_file_id) photoType = 'side';
      else if (!measurement.photo_back_file_id) photoType = 'back';
    }

    await measurementService.updatePhotoFileIds(measurement.id, {
      [photoType]: fileId,
    });

    const photoNames = { front: 'Спереди', side: 'Сбоку', back: 'Сзади' };
    await ctx.reply(
      `✅ Фото "${photoNames[photoType]}" сохранено!\n\n` +
      `💡 Используй /photo для пошаговой загрузки всех фото.`
    );
  } catch (error) {
    console.error('Photo upload error:', error);
    await ctx.reply('❌ Ошибка при сохранении фото. Попробуй ещё раз.');
  }
});

// ===== CALLBACKS: Фото-сессия =====
bot.action('photo_skip', async (ctx) => {
  await ctx.answerCbQuery();

  const session = photoSessionState.get(ctx.from!.id);
  if (!session || session.step === 'done') {
    return ctx.editMessageText('Фото-сессия не активна. Используй /photo чтобы начать.');
  }

  const stepOrder: Array<'front' | 'side' | 'back'> = ['front', 'side', 'back'];
  const currentIndex = stepOrder.indexOf(session.step);
  const stepNames = { front: 'СПЕРЕДИ', side: 'СБОКУ', back: 'СЗАДИ' };

  if (currentIndex < 2) {
    const nextStep = stepOrder[currentIndex + 1];
    session.step = nextStep;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('⏭️ Пропустить', 'photo_skip')],
      [Markup.button.callback('✅ Завершить', 'photo_finish')],
    ]);

    await ctx.editMessageText(
      `⏭️ Пропущено.\n\n` +
      `📸 Шаг ${currentIndex + 2}/3: Отправь фото *${stepNames[nextStep]}*`,
      { parse_mode: 'Markdown', ...keyboard }
    );
  } else {
    // Пропустили последний шаг
    session.step = 'done';
    photoSessionState.delete(ctx.from!.id);

    const uploadedCount = Object.values(session.photos).filter(Boolean).length;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.webApp('📱 Посмотреть в приложении', config.app.webappUrl)],
    ]);

    await ctx.editMessageText(
      `✅ Фото-сессия завершена!\n\n` +
      `📸 Загружено фото: ${uploadedCount}/3`,
      { ...keyboard }
    );
  }
});

bot.action('photo_finish', async (ctx) => {
  await ctx.answerCbQuery();

  const session = photoSessionState.get(ctx.from!.id);
  photoSessionState.delete(ctx.from!.id);

  const uploadedCount = session ? Object.values(session.photos).filter(Boolean).length : 0;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.webApp('📱 Посмотреть в приложении', config.app.webappUrl)],
  ]);

  await ctx.editMessageText(
    `✅ Фото-сессия завершена!\n\n` +
    `📸 Загружено фото: ${uploadedCount}/3`,
    { ...keyboard }
  );
});

bot.action('photo_cancel', async (ctx) => {
  await ctx.answerCbQuery();
  photoSessionState.delete(ctx.from!.id);
  await ctx.editMessageText('❌ Загрузка фото отменена.');
});

bot.action('start_photo_session', async (ctx) => {
  await ctx.answerCbQuery();
  const user = ctx.user!;

  const measurement = await measurementService.getCurrentWeekMeasurement(user.id);

  if (!measurement) {
    return ctx.editMessageText(
      '📸 Сначала внеси данные о весе в приложении.',
      Markup.inlineKeyboard([
        [Markup.button.webApp('📱 Внести замеры', config.app.webappUrl)],
      ])
    );
  }

  photoSessionState.set(ctx.from!.id, {
    step: 'front',
    measurementId: measurement.id,
    photos: {},
  });

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('⏭️ Пропустить', 'photo_skip')],
    [Markup.button.callback('❌ Отмена', 'photo_cancel')],
  ]);

  await ctx.editMessageText(
    `📸 *Загрузка фото прогресса*\n\n` +
    `Шаг 1/3: Отправь фото *СПЕРЕДИ*\n\n` +
    `💡 Совет: встань ровно, руки вдоль тела, хорошее освещение`,
    { parse_mode: 'Markdown', ...keyboard }
  );
});

// ===== CALLBACK: Быстрый чекин =====
bot.action('quick_checkin', async (ctx) => {
  await ctx.answerCbQuery();
  await startCheckinFlow(ctx);
});

bot.action('edit_checkin', async (ctx) => {
  await ctx.answerCbQuery();
  // Удаляем старое состояние и начинаем заново
  checkinState.delete(ctx.from!.id);
  await startCheckinFlow(ctx);
});

// ===== ОТПРАВКА НАПОМИНАНИЙ =====
export async function sendReminder(telegramId: number, message: string): Promise<boolean> {
  try {
    await bot.telegram.sendMessage(telegramId, message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.webApp('📱 Открыть приложение', config.app.webappUrl)],
      ]),
    });
    return true;
  } catch (error) {
    console.error(`Failed to send reminder to ${telegramId}:`, error);
    return false;
  }
}

// ===== МАССОВАЯ РАССЫЛКА =====
export async function broadcastMessage(message: string, role: 'all' | 'participant' | 'trainer' = 'all'): Promise<{ sent: number; failed: number }> {
  let result;

  if (role === 'all') {
    result = await query<{ telegram_id: number }>('SELECT telegram_id FROM users');
  } else {
    result = await query<{ telegram_id: number }>(
      'SELECT telegram_id FROM users WHERE role = $1',
      [role]
    );
  }

  const users = result.rows;

  let sent = 0;
  let failed = 0;

  for (const user of users) {
    const success = await sendReminder(user.telegram_id, message);
    if (success) sent++;
    else failed++;

    // Небольшая задержка для избежания rate limit
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  return { sent, failed };
}

// Запуск бота с retry при конфликте (409)
export async function startBot(): Promise<void> {
  // Инициализируем сервис уведомлений
  adminNotifier.init(bot);

  const maxRetries = 5;
  const retryDelay = 3000; // 3 секунды между попытками

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 Попытка запуска бота (${attempt}/${maxRetries})...`);

      // ВАЖНО: bot.launch() в Telegraf v4.16+ зависает навсегда при await
      // Используем .then() паттерн и небольшую задержку для проверки успешного запуска
      const launchPromise = bot.launch({ dropPendingUpdates: true });

      // Даём боту время на инициализацию (getMe и первый getUpdates)
      await Promise.race([
        new Promise<void>((resolve) => {
          launchPromise.then(() => {
            console.log('🤖 bot.launch() resolved');
            resolve();
          }).catch((err) => {
            console.error('🤖 bot.launch() error:', err);
          });
        }),
        new Promise<void>((resolve) => setTimeout(resolve, 2000)), // 2 секунды таймаут
      ]);

      console.log('🤖 Telegram бот запущен');

      // Уведомляем о запуске
      await adminNotifier.startup();
      return; // Успешно запустились
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Проверяем, это ли 409 конфликт
      if (errorMessage.includes('409') && attempt < maxRetries) {
        console.log(`⏳ Конфликт с другим инстансом, ждём ${retryDelay / 1000}с...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }

      // Другая ошибка или последняя попытка
      console.error('Failed to start bot:', error);
      await adminNotifier.critical(error as Error, 'Bot startup');
      throw error;
    }
  }
}

// Graceful shutdown
export async function stopBot(reason?: string) {
  await adminNotifier.shutdown(reason || 'SIGTERM');
  bot.stop('SIGTERM');
}
