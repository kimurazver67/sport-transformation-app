import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { config } from '../config';

// Создаём пул соединений
const pool = new Pool({
  connectionString: config.database.url,
  max: 20,              // максимум соединений в пуле
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Логируем подключение
pool.on('connect', () => {
  console.log('PostgreSQL: New client connected');
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

// Простой запрос
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  const duration = Date.now() - start;

  if (process.env.NODE_ENV === 'development') {
    console.log('Query:', { text, duration, rows: result.rowCount });
  }

  return result;
}

// Получить клиента для транзакций
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

// Выполнить транзакцию
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Проверка подключения
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW()');
    console.log('PostgreSQL connected:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('PostgreSQL connection failed:', error);
    return false;
  }
}

// Автоматические миграции при старте
export async function runMigrations(): Promise<void> {
  console.log('🔄 Запуск миграций...');

  try {
    // Таблица measurement_claims для отслеживания "обещаний"
    await query(`
      CREATE TABLE IF NOT EXISTS measurement_claims (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        week_number INTEGER NOT NULL,
        claimed_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, week_number)
      )
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_measurement_claims_week ON measurement_claims(week_number)
    `);

    // Добавляем колонку goal для хранения цели участника (005_user_goal.sql)
    await query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS goal VARCHAR(20) DEFAULT NULL
    `);

    // Проверяем есть ли уже constraint
    const constraintExists = await query(`
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name = 'users' AND constraint_name = 'users_goal_check'
    `);

    if (constraintExists.rowCount === 0) {
      await query(`
        ALTER TABLE users
        ADD CONSTRAINT users_goal_check CHECK (goal IN ('weight_loss', 'muscle_gain') OR goal IS NULL)
      `);
    }

    console.log('✅ Миграции выполнены');
  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
  }
}

// Graceful shutdown
export async function closePool(): Promise<void> {
  await pool.end();
  console.log('PostgreSQL pool closed');
}

export { pool };
