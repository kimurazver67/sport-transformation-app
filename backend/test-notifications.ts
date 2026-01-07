// Скрипт для тестирования уведомлений в Telegram
import { config } from './src/config';

const BOT_TOKEN = config.bot.token;
const ADMIN_CHAT_ID = config.admin.chatId;

async function testNotification() {
  console.log('🧪 Тестирование Telegram уведомлений\n');

  console.log('Конфигурация:');
  console.log(`  BOT_TOKEN: ${BOT_TOKEN ? '✅ установлен' : '❌ не установлен'}`);
  console.log(`  ADMIN_CHAT_ID: ${ADMIN_CHAT_ID || '❌ не установлен'}\n`);

  if (!BOT_TOKEN) {
    console.error('❌ BOT_TOKEN не найден в переменных окружения');
    process.exit(1);
  }

  if (!ADMIN_CHAT_ID) {
    console.error('❌ ADMIN_CHAT_ID не найден в переменных окружения');
    console.error('   Добавьте переменную ADMIN_CHAT_ID=-1003380571535 в Railway');
    process.exit(1);
  }

  console.log('📤 Отправка тестового сообщения...\n');

  const message = `
🧪 <b>Тестовое уведомление</b>

📅 Время: ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}
✅ ADMIN_CHAT_ID настроен правильно
✅ Уведомления работают

Это тестовое сообщение отправлено из backend/test-notifications.ts
`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const result = await response.json() as { ok: boolean; description?: string; result?: any };

    if (result.ok) {
      console.log('✅ Сообщение отправлено успешно!');
      console.log(`   Message ID: ${result.result?.message_id}`);
      console.log('\n✅ Уведомления работают корректно!\n');
    } else {
      console.error('❌ Ошибка Telegram API:', result.description);
      console.error('\nВозможные причины:');
      console.error('  1. Неверный ADMIN_CHAT_ID');
      console.error('  2. Бот не добавлен в группу');
      console.error('  3. У бота нет прав на отправку сообщений\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Ошибка при отправке:', error);
    process.exit(1);
  }
}

testNotification();
