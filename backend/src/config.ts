import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // Telegram
  BOT_TOKEN: z.string().min(1, 'BOT_TOKEN is required'),

  // Database (Railway PostgreSQL)
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Redis (Railway Redis)
  REDIS_URL: z.string().optional(),

  // Google Sheets (optional)
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().optional(),
  GOOGLE_PRIVATE_KEY: z.string().optional(),
  GOOGLE_SPREADSHEET_ID: z.string().optional(),

  // App
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  WEBAPP_URL: z.string().optional(),

  // Course
  COURSE_START_DATE: z.string().default('2026-01-05'),
  TRAINER_TELEGRAM_ID: z.string().optional(),

  // Admin Chat
  ADMIN_CHAT_ID: z.string().optional(),

  // AI Psychologist (Anthropic Claude)
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_PSYCHOLOGIST_ENABLED: z.string().default('false'),
  AI_PSYCHOLOGIST_MODEL: z.string().default('claude-sonnet-4-5-20250929'),
  AI_PSYCHOLOGIST_MAX_TOKENS: z.string().default('4000'),
  AI_PSYCHOLOGIST_TEMPERATURE: z.string().default('0.7'),
  MIN_CHECKINS_FOR_ANALYSIS: z.string().default('3'),
  MIN_MINDFULNESS_FOR_ANALYSIS: z.string().default('2'),

  // FatSecret API
  FATSECRET_CLIENT_ID: z.string().optional(),
  FATSECRET_CLIENT_SECRET: z.string().optional(),
  FATSECRET_ENABLED: z.string().default('false'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const config = {
  bot: {
    token: parsed.data.BOT_TOKEN,
  },
  database: {
    url: parsed.data.DATABASE_URL,
  },
  redis: {
    url: parsed.data.REDIS_URL,
  },
  google: {
    serviceAccountEmail: parsed.data.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    privateKey: parsed.data.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    spreadsheetId: parsed.data.GOOGLE_SPREADSHEET_ID,
  },
  app: {
    port: parseInt(parsed.data.PORT, 10),
    nodeEnv: parsed.data.NODE_ENV,
    frontendUrl: parsed.data.FRONTEND_URL,
    // Добавляем версию для сброса кэша Telegram WebView
    webappUrl: `${parsed.data.WEBAPP_URL || parsed.data.FRONTEND_URL}?v=${Date.now()}`,
  },
  course: {
    startDate: new Date(parsed.data.COURSE_START_DATE),
    trainerTelegramId: parsed.data.TRAINER_TELEGRAM_ID
      ? parseInt(parsed.data.TRAINER_TELEGRAM_ID, 10)
      : undefined,
  },
  admin: {
    chatId: parsed.data.ADMIN_CHAT_ID,
  },
  ai: {
    anthropicApiKey: parsed.data.ANTHROPIC_API_KEY,
    psychologist: {
      enabled: parsed.data.AI_PSYCHOLOGIST_ENABLED === 'true',
      model: parsed.data.AI_PSYCHOLOGIST_MODEL,
      maxTokens: parseInt(parsed.data.AI_PSYCHOLOGIST_MAX_TOKENS, 10),
      temperature: parseFloat(parsed.data.AI_PSYCHOLOGIST_TEMPERATURE),
      minCheckinsForAnalysis: parseInt(parsed.data.MIN_CHECKINS_FOR_ANALYSIS, 10),
      minMindfulnessForAnalysis: parseInt(parsed.data.MIN_MINDFULNESS_FOR_ANALYSIS, 10),
    },
  },
  fatsecret: {
    clientId: parsed.data.FATSECRET_CLIENT_ID,
    clientSecret: parsed.data.FATSECRET_CLIENT_SECRET,
    enabled: parsed.data.FATSECRET_ENABLED === 'true',
  },
};

// Максимальная длительность курса (4 месяца = 16 недель)
export const MAX_COURSE_WEEKS = 16;

// Вычисление текущей недели курса
export function getCurrentWeek(): number {
  const now = new Date();
  const start = config.course.startDate;
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 0; // Курс ещё не начался
  const week = Math.floor(diffDays / 7) + 1;
  // Ограничиваем максимум 16 неделями (курс 4 месяца)
  return Math.min(week, MAX_COURSE_WEEKS);
}

// Дней до старта курса (если курс не начался)
export function getDaysUntilStart(): number {
  const now = new Date();
  const start = config.course.startDate;
  const diffTime = start.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// Проверка, начался ли курс
export function isCourseStarted(): boolean {
  return new Date() >= config.course.startDate;
}

// Проверка, является ли сегодня воскресенье (день замеров)
export function isMeasurementDay(): boolean {
  return new Date().getDay() === 0;
}

// Проверка, можно ли вносить замеры (воскресенье 6:00-10:00 по таймзоне клиента)
// timezoneOffset - смещение в минутах от UTC (как в JavaScript Date.getTimezoneOffset())
export function canSubmitMeasurement(timezoneOffset?: number): {
  allowed: boolean;
  reason?: string;
  nextWindow?: { day: string; time: string };
} {
  // До старта курса - разрешаем всегда (стартовые замеры)
  if (!isCourseStarted()) {
    return { allowed: true };
  }

  const now = new Date();

  // Если передан offset клиента, вычисляем его локальное время
  // timezoneOffset: отрицательный для восточных часовых поясов (Москва = -180)
  let clientHour: number;
  let clientDay: number;

  if (timezoneOffset !== undefined) {
    // Получаем UTC время и добавляем offset клиента
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const clientTime = new Date(utcTime - (timezoneOffset * 60000));
    clientHour = clientTime.getHours();
    clientDay = clientTime.getDay();
  } else {
    // Если offset не передан, используем серверное время
    clientHour = now.getHours();
    clientDay = now.getDay();
  }

  // Воскресенье = 0
  const isSunday = clientDay === 0;
  const isInTimeWindow = clientHour >= 6 && clientHour < 13;

  if (isSunday && isInTimeWindow) {
    return { allowed: true };
  }

  // Вычисляем когда будет следующее окно
  const daysUntilSunday = (7 - clientDay) % 7 || 7;

  return {
    allowed: false,
    reason: isSunday
      ? 'Замеры можно вносить только с 6:00 до 13:00'
      : 'Замеры можно вносить только в воскресенье',
    nextWindow: {
      day: daysUntilSunday === 0 ? 'сегодня' : daysUntilSunday === 1 ? 'завтра' : `через ${daysUntilSunday} дн.`,
      time: '6:00 - 13:00'
    }
  };
}
