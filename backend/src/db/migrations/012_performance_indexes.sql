-- Миграция: Добавление индексов для производительности
-- Создано: 2026-01-06
-- Цель: Ускорить запросы к БД, устранить проблемы производительности при росте данных

-- Индексы для user_stats (используется в каждом запросе для получения статистики)
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_total_points ON user_stats(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_weekly_points ON user_stats(weekly_points DESC);

-- Индексы для daily_checkins (фильтрация по user_id и date)
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON daily_checkins(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_date ON daily_checkins(date DESC);

-- Индексы для weekly_measurements (фильтрация по user_id и week_number)
CREATE INDEX IF NOT EXISTS idx_weekly_measurements_user ON weekly_measurements(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_measurements_week ON weekly_measurements(week_number);
CREATE INDEX IF NOT EXISTS idx_weekly_measurements_user_week ON weekly_measurements(user_id, week_number);

-- Индексы для task_completions (JOIN с tasks и фильтрация по user_id)
CREATE INDEX IF NOT EXISTS idx_task_completions_user ON task_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_task ON task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_user_task ON task_completions(user_id, task_id);

-- Индексы для tasks (фильтрация по week_number и goal)
CREATE INDEX IF NOT EXISTS idx_tasks_week_number ON tasks(week_number);
CREATE INDEX IF NOT EXISTS idx_tasks_goal ON tasks(goal);

-- Индексы для achievements (фильтрация по user_id и type)
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(achievement_type);

-- Индексы для users (поиск по telegram_id и role)
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_goal ON users(goal);

-- Анализ таблиц для обновления статистики планировщика
ANALYZE user_stats;
ANALYZE daily_checkins;
ANALYZE weekly_measurements;
ANALYZE task_completions;
ANALYZE tasks;
ANALYZE achievements;
ANALYZE users;
