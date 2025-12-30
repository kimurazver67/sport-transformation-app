import { Telegraf } from 'telegraf';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { config } from '../config';

let bot: Telegraf | null = null;

// ===== RATE LIMITING ДЛЯ ОШИБОК =====
// Не спамим одинаковыми ошибками
interface ErrorEntry {
  count: number;
  firstSeen: number;
  lastSent: number;
}

const errorCache = new Map<string, ErrorEntry>();
const ERROR_COOLDOWN = 60000; // 1 минута между одинаковыми ошибками
const MAX_ERRORS_PER_MINUTE = 10; // Максимум 10 уведомлений в минуту

let errorCountThisMinute = 0;
let minuteResetTime = Date.now();

function shouldSendError(errorKey: string): { send: boolean; count?: number } {
  const now = Date.now();

  // Сбрасываем счётчик каждую минуту
  if (now - minuteResetTime > 60000) {
    errorCountThisMinute = 0;
    minuteResetTime = now;
  }

  // Превышен лимит ошибок в минуту
  if (errorCountThisMinute >= MAX_ERRORS_PER_MINUTE) {
    return { send: false };
  }

  const entry = errorCache.get(errorKey);

  if (!entry) {
    // Новая ошибка
    errorCache.set(errorKey, {
      count: 1,
      firstSeen: now,
      lastSent: now,
    });
    errorCountThisMinute++;
    return { send: true };
  }

  // Ошибка уже была
  entry.count++;

  if (now - entry.lastSent < ERROR_COOLDOWN) {
    // Ещё не прошёл cooldown
    return { send: false };
  }

  // Отправляем с информацией о количестве
  const count = entry.count;
  entry.count = 0;
  entry.lastSent = now;
  errorCountThisMinute++;

  return { send: true, count };
}

// Очистка старых записей каждые 10 минут (unref чтобы не блокировать graceful shutdown)
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of errorCache.entries()) {
    if (now - entry.firstSeen > 600000) { // 10 минут
      errorCache.delete(key);
    }
  }
}, 600000);
cleanupInterval.unref();

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

// Отправка сообщения в админский чат (через fetch для надёжности)
async function sendToAdmin(message: string): Promise<void> {
  console.log('[AdminNotifier] sendToAdmin called, chatId:', config.admin.chatId);

  if (!config.admin.chatId) {
    console.log('[AdminNotifier] Skipping notification (no admin chat configured)');
    return;
  }

  try {
    console.log('[AdminNotifier] Sending to chat via fetch:', config.admin.chatId);

    const response = await fetch(`https://api.telegram.org/bot${config.bot.token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.admin.chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const result = await response.json() as { ok: boolean; description?: string };
    if (result.ok) {
      console.log('[AdminNotifier] Message sent successfully');
    } else {
      console.error('[AdminNotifier] Telegram API error:', result);
    }
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

// Уведомление об ошибке (с rate limiting)
export async function notifyError(
  error: Error,
  context?: {
    endpoint?: string;
    method?: string;
    userId?: string;
    additionalInfo?: string;
  }
): Promise<void> {
  // Игнорируем 409 ошибки - это нормально при деплое
  const errorMessage = error.message || '';
  if (errorMessage.includes('409') || errorMessage.includes('Conflict')) {
    console.log('[AdminNotifier] Ignoring 409 conflict error');
    return;
  }

  // Создаём ключ для дедупликации ошибок
  const errorKey = `${error.message}:${context?.endpoint || ''}`;
  const { send, count } = shouldSendError(errorKey);

  if (!send) {
    console.log(`[AdminNotifier] Error rate-limited: ${error.message}`);
    return;
  }

  let contextInfo = '';
  if (context) {
    if (context.endpoint) contextInfo += `\n🔗 <b>Endpoint:</b> ${context.method || 'GET'} ${context.endpoint}`;
    if (context.userId) contextInfo += `\n👤 <b>User ID:</b> ${context.userId}`;
    if (context.additionalInfo) contextInfo += `\n📝 <b>Доп. инфо:</b> ${context.additionalInfo}`;
  }

  // Добавляем информацию о повторах
  const repeatInfo = count && count > 1 ? `\n🔄 <b>Повторов:</b> ${count}x за последнюю минуту` : '';

  const stackPreview = error.stack
    ? error.stack.split('\n').slice(0, 5).join('\n')
    : 'No stack trace';

  const message = `
🚨 <b>ОШИБКА</b>

📅 <b>Время:</b> ${formatDate()}
❌ <b>Сообщение:</b> ${escapeHtml(error.message)}
${contextInfo}${repeatInfo}

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

// Перевод префиксов коммитов на русский
function translateCommitMessage(msg: string): string {
  // Переводим стандартные conventional commit префиксы
  const prefixes: Record<string, string> = {
    'fix': 'Исправлено',
    'feat': 'Добавлено',
    'add': 'Добавлено',
    'update': 'Обновлено',
    'refactor': 'Рефакторинг',
    'docs': 'Документация',
    'style': 'Стиль',
    'test': 'Тесты',
    'chore': 'Обслуживание',
    'perf': 'Оптимизация',
    'remove': 'Удалено',
    'delete': 'Удалено',
  };

  for (const [en, ru] of Object.entries(prefixes)) {
    const regex = new RegExp(`^${en}(\\([^)]*\\))?:\\s*`, 'i');
    if (regex.test(msg)) {
      return msg.replace(regex, `${ru}: `);
    }
  }

  return msg;
}

// Читаем changelog из файла (fallback для CLI deploy)
function readChangelogFile(): string | null {
  const possiblePaths = [
    join(process.cwd(), 'DEPLOY_CHANGELOG.txt'),
    join(process.cwd(), 'backend', 'DEPLOY_CHANGELOG.txt'),
    '/app/DEPLOY_CHANGELOG.txt',
    '/app/backend/DEPLOY_CHANGELOG.txt',
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      try {
        return readFileSync(path, 'utf-8').trim();
      } catch {
        continue;
      }
    }
  }
  return null;
}

// Уведомление о деплое (использует Railway env variables или файл changelog)
export async function notifyDeploy(): Promise<void> {
  console.log('[Deploy] notifyDeploy called');
  console.log('[Deploy] ADMIN_CHAT_ID:', config.admin.chatId);
  console.log('[Deploy] BOT_TOKEN exists:', !!config.bot.token);

  const commit = process.env.RAILWAY_GIT_COMMIT_SHA;
  const branch = process.env.RAILWAY_GIT_BRANCH;
  const commitMessage = process.env.RAILWAY_GIT_COMMIT_MESSAGE;
  const author = process.env.RAILWAY_GIT_AUTHOR;

  console.log('[Deploy] Railway env:', { commit, branch, commitMessage, author });

  let message: string;

  if (commitMessage) {
    // Есть Railway env - используем их
    const translatedMessage = translateCommitMessage(commitMessage);

    message = `🚀 <b>Деплой выполнен!</b>

📅 <b>Время:</b> ${formatDate()}
🌍 <b>Окружение:</b> ${config.app.nodeEnv}
${branch ? `🌿 <b>Ветка:</b> ${branch}` : ''}
${commit ? `🔗 <b>Коммит:</b> <code>${commit.slice(0, 7)}</code>` : ''}
${author ? `👤 <b>Автор:</b> ${escapeHtml(author)}` : ''}
📝 <b>Изменения:</b> ${escapeHtml(translatedMessage)}

✅ Backend запущен`;
  } else {
    // Fallback на файл changelog
    console.log('[Deploy] No Railway env, trying changelog file...');
    const changelog = readChangelogFile();
    console.log('[Deploy] Changelog from file:', changelog ? 'found' : 'not found');

    if (changelog) {
      message = `🚀 <b>Деплой выполнен!</b>

${escapeHtml(changelog)}`;
    } else {
      // Минимальное сообщение
      message = `🚀 <b>Деплой выполнен!</b>

📅 <b>Время:</b> ${formatDate()}
🌍 <b>Окружение:</b> ${config.app.nodeEnv}

✅ Backend запущен`;
    }
  }

  console.log('[Deploy] Message prepared, sending to admin...');
  console.log('[Deploy] Message length:', message.length);

  try {
    await sendToAdmin(message);
    console.log('[Deploy] Message sent successfully');
  } catch (error) {
    console.error('[Deploy] Failed to send message:', error);
    throw error;
  }
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
  sendToAdmin: sendToAdmin,
};
