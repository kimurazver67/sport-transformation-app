import { query } from '../db/postgres';
import { config, getCurrentWeek } from '../config';
import {
  DailyCheckin,
  MindfulnessEntry,
  ImpulseLog,
  TaskCompletion,
  Task,
  WeeklyMeasurement,
  WeeklyData,
  WeeklyDataSummary,
  User,
} from '../types';

/**
 * Сервис для сбора недельных данных пользователя
 *
 * Spec:
 * - Собирает все данные пользователя за указанную неделю
 * - Вычисляет статистику и метрики
 * - Валидирует достаточность данных для анализа
 */

// Минимальные требования для анализа
const MIN_CHECKINS_FOR_ANALYSIS = 3;
const MIN_DATA_POINTS = 5; // Общее количество записей (чекины + дневник + импульсы)

/**
 * Вычисляет диапазон дат для указанной недели курса
 */
function getWeekDateRange(weekNumber: number): { startDate: Date; endDate: Date } {
  const courseStart = config.course.startDate;

  // Неделя 0 = неделя до старта курса
  const weekOffset = weekNumber === 0 ? -1 : weekNumber - 1;

  const startDate = new Date(courseStart);
  startDate.setDate(courseStart.getDate() + weekOffset * 7);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6); // 7 дней включительно

  return { startDate, endDate };
}

/**
 * Форматирует дату в YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Получает ежедневные чекины за период
 */
async function getDailyCheckins(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<DailyCheckin[]> {
  const result = await query<DailyCheckin>(
    `SELECT * FROM daily_checkins
     WHERE user_id = $1
       AND date >= $2
       AND date <= $3
     ORDER BY date ASC`,
    [userId, formatDate(startDate), formatDate(endDate)]
  );

  return result.rows;
}

/**
 * Получает записи дневника осознанности за период
 */
async function getMindfulnessEntries(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<MindfulnessEntry[]> {
  const result = await query<MindfulnessEntry>(
    `SELECT * FROM mindfulness_entries
     WHERE user_id = $1
       AND date >= $2
       AND date <= $3
     ORDER BY date ASC`,
    [userId, formatDate(startDate), formatDate(endDate)]
  );

  return result.rows;
}

/**
 * Получает логи импульсов за период
 */
async function getImpulseLogs(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<ImpulseLog[]> {
  const result = await query<ImpulseLog>(
    `SELECT * FROM impulse_logs
     WHERE user_id = $1
       AND logged_at >= $2::timestamp
       AND logged_at < $3::timestamp + INTERVAL '1 day'
     ORDER BY logged_at ASC`,
    [userId, formatDate(startDate), formatDate(endDate)]
  );

  return result.rows;
}

/**
 * Получает выполненные задания за неделю
 */
async function getTaskCompletions(
  userId: string,
  weekNumber: number
): Promise<{ completed: TaskCompletion[]; available: Task[] }> {
  // Получаем доступные задания недели
  const tasksResult = await query<Task>(
    `SELECT * FROM tasks
     WHERE week_number = $1
     ORDER BY created_at ASC`,
    [weekNumber]
  );

  const tasks = tasksResult.rows;
  const taskIds = tasks.map(t => t.id);

  if (taskIds.length === 0) {
    return { completed: [], available: [] };
  }

  // Получаем выполненные задания пользователя
  const completionsResult = await query<TaskCompletion>(
    `SELECT * FROM task_completions
     WHERE user_id = $1
       AND task_id = ANY($2)
     ORDER BY completed_at ASC`,
    [userId, taskIds]
  );

  return {
    completed: completionsResult.rows,
    available: tasks
  };
}

/**
 * Получает замер текущей недели
 */
async function getWeeklyMeasurement(
  userId: string,
  weekNumber: number
): Promise<WeeklyMeasurement | undefined> {
  const result = await query<WeeklyMeasurement>(
    `SELECT * FROM weekly_measurements
     WHERE user_id = $1
       AND week_number = $2`,
    [userId, weekNumber]
  );

  return result.rows[0];
}

/**
 * Получает замер предыдущей недели (для сравнения)
 * Неделя 0 = стартовый замер (baseline), неделя 1+ = еженедельные замеры
 * Для недели 1 предыдущий замер = неделя 0 (стартовый)
 */
async function getPreviousMeasurement(
  userId: string,
  weekNumber: number
): Promise<WeeklyMeasurement | undefined> {
  // Для недели 0 (стартовый) - нет предыдущего замера
  // Для недели 1 - предыдущий это неделя 0 (стартовый)
  // Для недели 2+ - предыдущий это неделя N-1

  const result = await query<WeeklyMeasurement>(
    `SELECT * FROM weekly_measurements
     WHERE user_id = $1
       AND week_number < $2
     ORDER BY week_number DESC
     LIMIT 1`,
    [userId, weekNumber]
  );

  return result.rows[0];
}

/**
 * Вычисляет сводку данных за неделю
 */
function generateDataSummary(
  checkins: DailyCheckin[],
  mindfulness: MindfulnessEntry[],
  impulses: ImpulseLog[],
  tasks: { completed: TaskCompletion[]; available: Task[] },
  measurement?: WeeklyMeasurement,
  previousMeasurement?: WeeklyMeasurement
): WeeklyDataSummary {
  const totalCheckins = checkins.length;
  const totalWorkouts = checkins.filter(c => c.workout).length;

  const avgSleepHours = totalCheckins > 0
    ? checkins.reduce((sum, c) => sum + c.sleep_hours, 0) / totalCheckins
    : 0;

  const avgMood = totalCheckins > 0
    ? checkins.reduce((sum, c) => sum + c.mood, 0) / totalCheckins
    : 0;

  const waterCheckins = checkins.filter(c => c.water && c.water_liters);
  const avgWaterLiters = waterCheckins.length > 0
    ? waterCheckins.reduce((sum, c) => sum + (c.water_liters || 0), 0) / waterCheckins.length
    : 0;

  const nutritionDays = checkins.filter(c => c.nutrition).length;
  const nutritionAdherence = totalCheckins > 0
    ? (nutritionDays / totalCheckins) * 100
    : 0;

  const totalImpulses = impulses.length;
  const impulsesResisted = impulses.filter(i => i.action_taken === 'resisted').length;
  const impulsesGaveIn = impulses.filter(i => i.action_taken === 'gave_in').length;

  const tasksCompleted = tasks.completed.length;
  const tasksTotal = tasks.available.length;

  const mindfulnessEntries = mindfulness.length;

  const weightChange = measurement && previousMeasurement
    ? measurement.weight - previousMeasurement.weight
    : undefined;

  return {
    total_checkins: totalCheckins,
    total_workouts: totalWorkouts,
    avg_sleep_hours: Math.round(avgSleepHours * 10) / 10,
    avg_mood: Math.round(avgMood * 10) / 10,
    avg_water_liters: Math.round(avgWaterLiters * 10) / 10,
    nutrition_adherence: Math.round(nutritionAdherence),
    total_impulses: totalImpulses,
    impulses_resisted: impulsesResisted,
    impulses_gave_in: impulsesGaveIn,
    tasks_completed: tasksCompleted,
    tasks_total: tasksTotal,
    mindfulness_entries: mindfulnessEntries,
    weight_change: weightChange,
    has_measurement: !!measurement
  };
}

/**
 * Проверяет достаточно ли данных для психологического анализа
 */
function hasEnoughDataForAnalysis(summary: WeeklyDataSummary): { sufficient: boolean; reason?: string } {
  const totalDataPoints =
    summary.total_checkins +
    summary.mindfulness_entries +
    summary.total_impulses;

  if (summary.total_checkins < MIN_CHECKINS_FOR_ANALYSIS) {
    return {
      sufficient: false,
      reason: `Недостаточно чекинов: ${summary.total_checkins} из минимум ${MIN_CHECKINS_FOR_ANALYSIS}`
    };
  }

  if (totalDataPoints < MIN_DATA_POINTS) {
    return {
      sufficient: false,
      reason: `Недостаточно данных для анализа: ${totalDataPoints} записей из минимум ${MIN_DATA_POINTS}`
    };
  }

  return { sufficient: true };
}

/**
 * Основной экспорт: сервис для работы с недельными данными
 */
export const weeklyDataService = {
  /**
   * Собирает все данные пользователя за указанную неделю
   *
   * @param userId - ID пользователя
   * @param weekNumber - Номер недели курса (0 = до старта, 1-16 = недели курса)
   * @returns Полный набор данных за неделю с метриками
   * @throws Error если недостаточно данных для анализа
   */
  async collectWeeklyData(userId: string, weekNumber: number): Promise<WeeklyData> {
    // Валидация входных параметров
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (weekNumber < 0 || weekNumber > 20) {
      throw new Error('Week number must be between 0 and 20');
    }

    // Получаем диапазон дат
    const { startDate, endDate } = getWeekDateRange(weekNumber);

    console.log(`Collecting weekly data for user ${userId}, week ${weekNumber}`, {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate)
    });

    // Собираем все данные параллельно
    const [
      checkins,
      mindfulness,
      impulses,
      tasks,
      measurement,
      previousMeasurement
    ] = await Promise.all([
      getDailyCheckins(userId, startDate, endDate),
      getMindfulnessEntries(userId, startDate, endDate),
      getImpulseLogs(userId, startDate, endDate),
      getTaskCompletions(userId, weekNumber),
      getWeeklyMeasurement(userId, weekNumber),
      getPreviousMeasurement(userId, weekNumber)
    ]);

    // Генерируем сводку
    const summary = generateDataSummary(
      checkins,
      mindfulness,
      impulses,
      tasks,
      measurement,
      previousMeasurement
    );

    // Проверяем достаточность данных
    const dataCheck = hasEnoughDataForAnalysis(summary);
    if (!dataCheck.sufficient) {
      throw new Error(dataCheck.reason);
    }

    return {
      checkins,
      mindfulness,
      impulses,
      tasks,
      measurement,
      previous_measurement: previousMeasurement,
      summary
    };
  },

  /**
   * Проверяет доступность данных для анализа без их загрузки
   */
  async checkDataAvailability(userId: string, weekNumber: number): Promise<{
    available: boolean;
    summary?: WeeklyDataSummary;
    reason?: string;
  }> {
    try {
      const data = await this.collectWeeklyData(userId, weekNumber);
      return {
        available: true,
        summary: data.summary
      };
    } catch (error) {
      return {
        available: false,
        reason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Получает текущую неделю курса для пользователя
   */
  getCurrentWeekNumber(): number {
    return getCurrentWeek();
  },

  /**
   * Вспомогательная функция для получения диапазона дат (экспорт для тестов)
   */
  getWeekDateRange
};
