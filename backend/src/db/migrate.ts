import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from './supabase';

async function runMigrations() {
  console.log('🚀 Запуск миграций...\n');

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    console.log(`📄 Выполняю: ${file}`);

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

    const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Если функция exec_sql не существует, выводим инструкцию
      console.error(`\n❌ Ошибка при выполнении ${file}:`);
      console.error(error.message);
      console.log('\n📋 Скопируйте содержимое файла миграции и выполните в Supabase SQL Editor:');
      console.log(`   Файл: ${path.join(migrationsDir, file)}\n`);
      process.exit(1);
    }

    console.log(`✅ ${file} выполнен успешно\n`);
  }

  console.log('🎉 Все миграции выполнены!');
}

// Альтернативный способ: вывести SQL для ручного выполнения
async function printMigrations() {
  console.log('📋 SQL миграции для Supabase:\n');
  console.log('Скопируйте и выполните в Supabase Dashboard -> SQL Editor\n');
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
