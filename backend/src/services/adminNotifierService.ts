import { Telegraf } from 'telegraf';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { config } from '../config';

let bot: Telegraf | null = null;

// Инициализация сервиса с ботом
export function initAdminNotifier(telegrafBot: Telegraf) {
  bot = telegrafBot;
}

// Форматирование даты
function formatDate(): string {
  return new Date().toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// Отправка сообщения в админский чат
async function sendToAdmin(message: string): Promise<void> {
  if (!bot || !config.admin.chatId) {
    console.log('[AdminNotifier] Skipping notification (no bot or admin chat configured)');
    return;
  }

  try {
    await bot.telegram.sendMessage(config.admin.chatId, message, {
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
    });
  } catch (error) {
    console.error('[AdminNotifier] Failed to send message:', error);
  }
}

// Уведомление о запуске сервера
export async function notifyStartup(): Promise<void> {
  const message = `
🚀 <b>Сервер запущен</b>

📅 <b>Время:</b> ${formatDate()}
🌍 <b>Окружение:</b> ${config.app.nodeEnv}
🔗 <b>Порт:</b> ${config.app.port}
🌐 <b>Frontend:</b> ${config.app.frontendUrl}

✅ Все сервисы работают нормально
`;
  await sendToAdmin(message);
}

// Уведомление об остановке сервера
export async function notifyShutdown(reason: string = 'Штатное завершение'): Promise<void> {
  const message = `
🛑 <b>Сервер остановлен</b>

📅 <b>Время:</b> ${formatDate()}
📝 <b>Причина:</b> ${reason}
`;
  await sendToAdmin(message);
}

// Уведомление об ошибке
export async function notifyError(
  error: Error,
  context?: {
    endpoint?: string;
    method?: string;
    userId?: string;
    additionalInfo?: string;
  }
): Promise<void> {
  let contextInfo = '';
  if (context) {
    if (context.endpoint) contextInfo += `\n🔗 <b>Endpoint:</b> ${context.method || 'GET'} ${context.endpoint}`;
    if (context.userId) contextInfo += `\n👤 <b>User ID:</b> ${context.userId}`;
    if (context.additionalInfo) contextInfo += `\n📝 <b>Доп. инфо:</b> ${context.additionalInfo}`;
  }

  const stackPreview = error.stack
    ? error.stack.split('\n').slice(0, 5).join('\n')
    : 'No stack trace';

  const message = `
🚨 <b>ОШИБКА</b>

📅 <b>Время:</b> ${formatDate()}
❌ <b>Сообщение:</b> ${escapeHtml(error.message)}
${contextInfo}

<b>Stack trace:</b>
<pre>${escapeHtml(stackPreview)}</pre>
`;
  await sendToAdmin(message);
}

// Уведомление о критической ошибке
export async function notifyCriticalError(error: Error, source: string): Promise<void> {
  const message = `
🔥🔥🔥 <b>КРИТИЧЕСКАЯ ОШИБКА</b> 🔥🔥🔥

📅 <b>Время:</b> ${formatDate()}
📍 <b>Источник:</b> ${source}
❌ <b>Сообщение:</b> ${escapeHtml(error.message)}

<b>Stack trace:</b>
<pre>${escapeHtml(error.stack?.split('\n').slice(0, 8).join('\n') || 'No stack trace')}</pre>

⚠️ Требуется немедленное вмешательство!
`;
  await sendToAdmin(message);
}

// Уведомление о деплое (читает DEPLOY_CHANGELOG.txt)
export async function notifyDeploy(): Promise<void> {
  // Пробуем найти changelog файл
  const possiblePaths = [
    join(process.cwd(), 'DEPLOY_CHANGELOG.txt'),
    join(process.cwd(), '..', 'DEPLOY_CHANGELOG.txt'),
    '/app/DEPLOY_CHANGELOG.txt',
  ];

  let changelog = '';
  for (const path of possiblePaths) {
    if (existsSync(path)) {
      try {
        changelog = readFileSync(path, 'utf-8').trim();
        break;
      } catch (e) {
        // continue
      }
    }
  }

  let message: string;
  if (changelog) {
    message = `🚀 <b>Деплой выполнен!</b>

${escapeHtml(changelog)}`;
  } else {
    // Fallback если changelog не найден
    const commit = process.env.RAILWAY_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA;
    const branch = process.env.RAILWAY_GIT_BRANCH || process.env.VERCEL_GIT_COMMIT_REF;

    message = `🚀 <b>Деплой выполнен!</b>

📅 <b>Время:</b> ${formatDate()}
🌍 <b>Окружение:</b> ${config.app.nodeEnv}
${branch ? `🌿 <b>Ветка:</b> ${branch}` : ''}
${commit ? `🔗 <b>Коммит:</b> <code>${commit.slice(0, 7)}</code>` : ''}

✅ Backend запущен`;
  }

  await sendToAdmin(message);
}

// Уведомление о новом пользователе
export async function notifyNewUser(user: {
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
}): Promise<void> {
  const message = `
👤 <b>Новый пользователь</b>

📅 <b>Время:</b> ${formatDate()}
🆔 <b>Telegram ID:</b> <code>${user.telegramId}</code>
📛 <b>Имя:</b> ${escapeHtml(user.firstName)}${user.lastName ? ` ${escapeHtml(user.lastName)}` : ''}
${user.username ? `📱 <b>Username:</b> @${user.username}` : ''}
`;
  await sendToAdmin(message);
}

// Уведомление о чекине
export async function notifyCheckin(user: {
  firstName: string;
  username?: string;
}, checkin: {
  mood: string;
  workout: boolean;
  nutrition: boolean;
  points: number;
  streak: number;
}): Promise<void> {
  const moodEmoji: Record<string, string> = {
    great: '🔥',
    good: '💪',
    okay: '👌',
    tired: '😴',
    bad: '😔',
  };

  const message = `
✅ <b>Чекин</b>

👤 ${escapeHtml(user.firstName)}${user.username ? ` (@${user.username})` : ''}
${moodEmoji[checkin.mood] || '📊'} Настроение: ${checkin.mood}
🏋️ Тренировка: ${checkin.workout ? '✅' : '❌'}
🥗 Питание: ${checkin.nutrition ? '✅' : '❌'}
⭐ Очки: +${checkin.points}
🔥 Streak: ${checkin.streak} дней
`;
  await sendToAdmin(message);
}

// Уведомление о достижении
export async function notifyAchievement(user: {
  firstName: string;
  username?: string;
}, achievement: {
  name: string;
  description: string;
}): Promise<void> {
  const message = `
🏆 <b>Новое достижение!</b>

👤 ${escapeHtml(user.firstName)}${user.username ? ` (@${user.username})` : ''}
🎖 ${escapeHtml(achievement.name)}
📝 ${escapeHtml(achievement.description)}
`;
  await sendToAdmin(message);
}

// Экранирование HTML
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Экспорт всех функций
export const adminNotifier = {
  init: initAdminNotifier,
  startup: notifyStartup,
  shutdown: notifyShutdown,
  error: notifyError,
  critical: notifyCriticalError,
  deploy: notifyDeploy,
  newUser: notifyNewUser,
  checkin: notifyCheckin,
  achievement: notifyAchievement,
};
