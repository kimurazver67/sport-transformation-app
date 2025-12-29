import { Telegraf, Markup, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { config, getCurrentWeek } from '../config';
import { userService } from '../services/userService';
import { checkinService } from '../services/checkinService';
import { measurementService } from '../services/measurementService';
import { statsService } from '../services/statsService';
import { taskService } from '../services/taskService';
import { achievementService } from '../services/achievementService';
import { User, WorkoutType, MoodLevel, CheckinForm } from '../types';
import { supabaseAdmin } from '../db/supabase';

// Расширяем контекст
interface BotContext extends Context {
  user?: User;
}

// Создаём бота
export const bot = new Telegraf<BotContext>(config.bot.token);

// Middleware: привязка пользователя к контексту
bot.use(async (ctx, next) => {
  if (ctx.from) {
    ctx.user = await userService.findOrCreate({
      telegram_id: ctx.from.id,
      username: ctx.from.username,
      first_name: ctx.from.first_name,
      last_name: ctx.from.last_name,
    });
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

    // Очищаем состояние
    checkinState.delete(ctx.from!.id);
  } catch (error) {
    console.error('Checkin error:', error);
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
  const photo = ctx.message.photo[ctx.message.photo.length - 1]; // Максимальное качество

  try {
    // Получаем URL файла
    const file = await ctx.telegram.getFile(photo.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${config.bot.token}/${file.file_path}`;

    // Загружаем в Supabase Storage
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();

    const fileName = `${user.id}/${Date.now()}_${photo.file_id}.jpg`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('progress-photos')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('progress-photos')
      .getPublicUrl(fileName);

    // Получаем или создаём замер текущей недели
    let measurement = await measurementService.getCurrentWeekMeasurement(user.id);

    if (!measurement) {
      await ctx.reply(
        '📸 Фото получено!\n\nЧтобы сохранить его к замерам, сначала внеси данные о весе и обхватах в приложении.',
        Markup.inlineKeyboard([
          [Markup.button.webApp('📱 Внести замеры', config.app.webappUrl)],
        ])
      );
      return;
    }

    // Определяем тип фото (фронт/бок/спина) по тексту сообщения или порядку
    const caption = ctx.message.caption?.toLowerCase() || '';
    let photoType: 'front' | 'side' | 'back' = 'front';

    if (caption.includes('бок') || caption.includes('side')) {
      photoType = 'side';
    } else if (caption.includes('спина') || caption.includes('back')) {
      photoType = 'back';
    } else if (caption.includes('фронт') || caption.includes('front')) {
      photoType = 'front';
    } else {
      // Автоопределение по уже загруженным
      if (!measurement.photo_front_url) photoType = 'front';
      else if (!measurement.photo_side_url) photoType = 'side';
      else if (!measurement.photo_back_url) photoType = 'back';
    }

    await measurementService.updatePhotos(measurement.id, {
      [photoType]: urlData.publicUrl,
    });

    const photoNames = { front: 'Фронт', side: 'Бок', back: 'Спина' };
    await ctx.reply(`✅ Фото "${photoNames[photoType]}" сохранено к замерам недели ${getCurrentWeek()}!`);
  } catch (error) {
    console.error('Photo upload error:', error);
    await ctx.reply('❌ Ошибка при сохранении фото. Попробуй ещё раз.');
  }
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
  let users;

  if (role === 'all') {
    const { data } = await supabaseAdmin.from('users').select('telegram_id');
    users = data || [];
  } else {
    const { data } = await supabaseAdmin.from('users').select('telegram_id').eq('role', role);
    users = data || [];
  }

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

// Запуск бота
export async function startBot() {
  try {
    await bot.launch();
    console.log('🤖 Telegram бот запущен');
  } catch (error) {
    console.error('Failed to start bot:', error);
    throw error;
  }
}

// Graceful shutdown
export function stopBot() {
  bot.stop('SIGTERM');
}
