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

    // Миграция 006: Шаги в чекине + расширение онбординга
    await query(`
      ALTER TABLE daily_checkins
      ADD COLUMN IF NOT EXISTS steps INTEGER CHECK (steps >= 0 AND steps <= 100000)
    `);

    await query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS height INTEGER CHECK (height >= 100 AND height <= 250)
    `);

    await query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age >= 14 AND age <= 100)
    `);

    await query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS target_weight DECIMAL(5,2) CHECK (target_weight > 0 AND target_weight < 500)
    `);

    // Запускаем SQL-файлы миграций
    await runSqlMigrations();

    console.log('✅ Миграции выполнены');
  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
  }
}

// Запуск SQL-файлов миграций
async function runSqlMigrations(): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');

  const migrationsDir = path.join(__dirname, 'migrations');

  // Проверяем существует ли директория
  if (!fs.existsSync(migrationsDir)) {
    console.log('📁 Директория миграций не найдена, пропускаем SQL миграции');
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter((f: string) => f.endsWith('.sql'))
    .sort();

  console.log(`📂 Найдено ${files.length} SQL миграций`);

  for (const file of files) {
    try {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await query(sql);
      console.log(`  ✅ ${file}`);
    } catch (error: any) {
      // Игнорируем ошибки "уже существует" - это нормально для идемпотентных миграций
      if (error.code === '42P07' || // relation already exists
          error.code === '42710' || // duplicate object
          error.code === '23505' || // unique violation (для INSERT ON CONFLICT)
          error.message?.includes('already exists') ||
          error.message?.includes('duplicate key')) {
        console.log(`  ⏭️  ${file} (уже применена)`);
      } else {
        console.error(`  ❌ ${file}: ${error.message}`);
        // Не прерываем - продолжаем с другими миграциями
      }
    }
  }
}

// Graceful shutdown
export async function closePool(): Promise<void> {
  await pool.end();
  console.log('PostgreSQL pool closed');
}

export { pool };
