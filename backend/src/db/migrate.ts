import fs from 'fs';
import path from 'path';
import { query, closePool } from './postgres';

async function runMigrations() {
  console.log('🚀 Запуск миграций...\n');

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    console.log(`📄 Выполняю: ${file}`);

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

    try {
      await query(sql);
      console.log(`✅ ${file} выполнен успешно\n`);
    } catch (error) {
      console.error(`\n❌ Ошибка при выполнении ${file}:`);
      console.error((error as Error).message);
      console.log(`\n📋 Файл: ${path.join(migrationsDir, file)}\n`);
      await closePool();
      process.exit(1);
    }
  }

  console.log('🎉 Все миграции выполнены!');
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
