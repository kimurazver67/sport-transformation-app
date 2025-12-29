import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // Telegram
  BOT_TOKEN: z.string().min(1, 'BOT_TOKEN is required'),

  // Supabase
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

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
  COURSE_START_DATE: z.string().default('2025-01-01'),
  TRAINER_TELEGRAM_ID: z.string().optional(),

  // Admin Chat
  ADMIN_CHAT_ID: z.string().optional(),
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
  supabase: {
    url: parsed.data.SUPABASE_URL,
    anonKey: parsed.data.SUPABASE_ANON_KEY,
    serviceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
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
    webappUrl: parsed.data.WEBAPP_URL || parsed.data.FRONTEND_URL,
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
};

// Вычисление текущей недели курса
export function getCurrentWeek(): number {
  const now = new Date();
  const start = config.course.startDate;
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.floor(diffDays / 7) + 1);
}

// Проверка, является ли сегодня воскресенье (день замеров)
export function isMeasurementDay(): boolean {
  return new Date().getDay() === 0;
}
