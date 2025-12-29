import Redis from 'ioredis';
import { config } from '../config';

// Создаём клиента Redis
let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (!config.redis.url) {
    console.log('Redis: URL not configured, FSM will use in-memory storage');
    return null;
  }

  if (!redis) {
    redis = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redis.on('connect', () => {
      console.log('Redis: Connected');
    });

    redis.on('error', (err) => {
      console.error('Redis error:', err);
    });

    redis.on('close', () => {
      console.log('Redis: Connection closed');
    });
  }

  return redis;
}

// FSM State Storage для бота
// Хранит состояние диалога пользователя (например, ввод замеров)
export const botState = {
  // Получить состояние пользователя
  async get(userId: number): Promise<BotUserState | null> {
    const r = getRedis();
    if (!r) {
      // Fallback на in-memory
      return inMemoryState.get(userId) || null;
    }

    const data = await r.get(`bot:state:${userId}`);
    return data ? JSON.parse(data) : null;
  },

  // Сохранить состояние пользователя
  async set(userId: number, state: BotUserState, ttlSeconds = 3600): Promise<void> {
    const r = getRedis();
    if (!r) {
      // Fallback на in-memory
      inMemoryState.set(userId, state);
      return;
    }

    await r.setex(`bot:state:${userId}`, ttlSeconds, JSON.stringify(state));
  },

  // Удалить состояние пользователя
  async delete(userId: number): Promise<void> {
    const r = getRedis();
    if (!r) {
      inMemoryState.delete(userId);
      return;
    }

    await r.del(`bot:state:${userId}`);
  },

  // Очистить все состояния
  async clear(): Promise<void> {
    const r = getRedis();
    if (!r) {
      inMemoryState.clear();
      return;
    }

    const keys = await r.keys('bot:state:*');
    if (keys.length > 0) {
      await r.del(...keys);
    }
  },
};

// In-memory fallback (для разработки без Redis)
const inMemoryState = new Map<number, BotUserState>();

// Типы состояний бота
export interface BotUserState {
  // Текущий шаг диалога
  step: BotStep;
  // Данные, собранные в процессе диалога
  data: Record<string, unknown>;
  // ID замера (для фото)
  measurementId?: string;
  // Timestamp создания состояния
  createdAt: number;
}

export type BotStep =
  | 'idle'
  // Checkin flow
  | 'checkin:workout'
  | 'checkin:workout_type'
  | 'checkin:nutrition'
  | 'checkin:water'
  | 'checkin:water_liters'
  | 'checkin:sleep'
  | 'checkin:mood'
  // Measurement flow
  | 'measurement:weight'
  | 'measurement:chest'
  | 'measurement:waist'
  | 'measurement:hips'
  | 'measurement:photo_front'
  | 'measurement:photo_side'
  | 'measurement:photo_back';

// Проверка подключения
export async function testRedisConnection(): Promise<boolean> {
  const r = getRedis();
  if (!r) {
    console.log('Redis: Not configured');
    return false;
  }

  try {
    await r.ping();
    console.log('Redis: Connection successful');
    return true;
  } catch (error) {
    console.error('Redis connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    console.log('Redis: Connection closed');
  }
}
