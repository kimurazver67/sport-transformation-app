import fs from 'fs';
import path from 'path';
import { query, closePool } from './postgres';

async function runMigrations() {
  console.log('🚀 Запуск миграций...\n');

  const migrationsDir = path.join(__dirname, 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    console.log('📁 Директория миграций не найдена');
    await closePool();
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`📂 Найдено ${files.length} SQL миграций\n`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

    try {
      await query(sql);
      console.log(`✅ ${file}`);
    } catch (error: any) {
      // Игнорируем ошибки "уже существует" - миграции идемпотентны
      const isAlreadyExists =
        error.code === '42P07' || // relation already exists
        error.code === '42710' || // duplicate object
        error.code === '23505' || // unique violation (INSERT ON CONFLICT)
        error.code === '42701' || // duplicate column
        error.message?.includes('already exists') ||
        error.message?.includes('duplicate key');

      if (isAlreadyExists) {
        console.log(`⏭️  ${file} (уже применена)`);
      } else {
        console.error(`❌ ${file}: ${error.message}`);
        // Продолжаем с другими миграциями, не падаем
      }
    }
  }

  console.log('\n🎉 Миграции завершены!');
  await closePool();
}

// Альтернативный способ: вывести SQL для ручного выполнения
async function printMigrations() {
  console.log('📋 SQL миграции для PostgreSQL:\n');
  console.log('Скопируйте и выполните в вашей БД\n');
  console.log('='.repeat(60) + '\n');

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`-- Файл: ${file}`);
    console.log(sql);
    console.log('\n' + '='.repeat(60) + '\n');
  }
}

// Запуск
const args = process.argv.slice(2);

if (args.includes('--print')) {
  printMigrations();
} else {
  runMigrations().catch(console.error);
}
