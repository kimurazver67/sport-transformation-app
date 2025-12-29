import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../config';
import { userService } from '../services/userService';
import { User } from '../types';

// Расширяем Request для хранения пользователя
declare global {
  namespace Express {
    interface Request {
      user?: User;
      telegramId?: number;
    }
  }
}

// Валидация Telegram WebApp initData
export function validateTelegramAuth(initData: string): {
  valid: boolean;
  data?: Record<string, string>;
} {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    // Сортируем параметры
    const sortedParams = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Создаём секретный ключ
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(config.bot.token)
      .digest();

    // Вычисляем хеш
    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(sortedParams)
      .digest('hex');

    if (computedHash !== hash) {
      return { valid: false };
    }

    // Проверяем время (не старше 24 часов)
    const authDate = parseInt(params.get('auth_date') || '0');
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) {
      return { valid: false };
    }

    // Парсим данные
    const data: Record<string, string> = {};
    params.forEach((value, key) => {
      data[key] = value;
    });

    return { valid: true, data };
  } catch (error) {
    console.error('Telegram auth validation error:', error);
    return { valid: false };
  }
}

// Middleware для аутентификации через Telegram WebApp
export async function telegramAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Пропускаем health check
  if (req.path === '/health') {
    return next();
  }

  const initData = req.headers['x-telegram-init-data'] as string;

  // В development режиме можно использовать telegram_id из query
  if (config.app.nodeEnv === 'development') {
    const devTelegramId = req.query.telegram_id || req.headers['x-telegram-id'];
    if (devTelegramId) {
      req.telegramId = parseInt(devTelegramId as string);
      const user = await userService.findByTelegramId(req.telegramId);
      if (user) {
        req.user = user;
      }
      return next();
    }
  }

  if (!initData) {
    // Разрешаем запросы без авторизации для некоторых эндпоинтов
    return next();
  }

  const validation = validateTelegramAuth(initData);

  if (!validation.valid) {
    return res.status(401).json({
      success: false,
      error: 'Invalid Telegram authentication',
    });
  }

  // Получаем данные пользователя
  if (validation.data?.user) {
    try {
      const telegramUser = JSON.parse(validation.data.user);
      req.telegramId = telegramUser.id;

      const user = await userService.findOrCreate({
        telegram_id: telegramUser.id,
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
      });

      req.user = user;
    } catch (error) {
      console.error('Failed to parse user data:', error);
    }
  }

  next();
}

// Middleware для проверки роли тренера
export function trainerOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'trainer') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Trainer role required.',
    });
  }
  next();
}

// Middleware для проверки авторизации
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }
  next();
}
