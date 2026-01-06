import { query } from '../db/postgres';
import { weeklyDataService } from './weeklyDataService';
import { claudeService } from './claudeService';
import { userService } from './userService';
import {
  PsychologyAnalysis,
  PsychologyAnalysisRecord,
  WeeklyDataSummary,
  AnalysisHistory,
} from '../types';

/**
 * Сервис для управления AI психологическим анализом
 *
 * Spec:
 * - Генерирует новый анализ через Claude AI
 * - Сохраняет анализ в БД
 * - Извлекает существующие анализы
 * - Управляет историей анализов
 * - Кеширует результаты для оптимизации
 */

interface SaveAnalysisParams {
  user_id: string;
  week_number: number;
  analysis: PsychologyAnalysis;
  data_summary: WeeklyDataSummary;
}

/**
 * Сохраняет психологический анализ в БД
 */
async function savePsychologyAnalysis(
  params: SaveAnalysisParams
): Promise<PsychologyAnalysisRecord> {
  const { user_id, week_number, analysis, data_summary } = params;

  const result = await query<PsychologyAnalysisRecord>(
    `INSERT INTO psychology_analyses
      (user_id, week_number, analysis, data_summary)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, week_number)
     DO UPDATE SET
       analysis = EXCLUDED.analysis,
       data_summary = EXCLUDED.data_summary,
       updated_at = NOW()
     RETURNING *`,
    [user_id, week_number, JSON.stringify(analysis), JSON.stringify(data_summary)]
  );

  const record = result.rows[0];

  // Парсим JSONB обратно в объекты
  return {
    ...record,
    analysis: typeof record.analysis === 'string'
      ? JSON.parse(record.analysis)
      : record.analysis,
    data_summary: typeof record.data_summary === 'string'
      ? JSON.parse(record.data_summary)
      : record.data_summary,
  };
}

/**
 * Получает анализ из БД
 */
async function getAnalysisFromDB(
  userId: string,
  weekNumber: number
): Promise<PsychologyAnalysisRecord | null> {
  const result = await query<PsychologyAnalysisRecord>(
    `SELECT * FROM psychology_analyses
     WHERE user_id = $1 AND week_number = $2`,
    [userId, weekNumber]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const record = result.rows[0];

  // Парсим JSONB
  return {
    ...record,
    analysis: typeof record.analysis === 'string'
      ? JSON.parse(record.analysis)
      : record.analysis,
    data_summary: typeof record.data_summary === 'string'
      ? JSON.parse(record.data_summary)
      : record.data_summary,
  };
}

/**
 * Удаляет анализ из БД (для регенерации)
 */
async function deleteAnalysis(userId: string, weekNumber: number): Promise<void> {
  await query(
    `DELETE FROM psychology_analyses
     WHERE user_id = $1 AND week_number = $2`,
    [userId, weekNumber]
  );
}

/**
 * Основной экспорт: сервис AI-психолога
 */
export const aiPsychologistService = {
  /**
   * Генерирует новый психологический анализ
   *
   * @param userId - ID пользователя
   * @param weekNumber - Номер недели курса
   * @returns Сохранённый анализ
   * @throws Error если недостаточно данных или AI недоступен
   */
  async generateWeeklyAnalysis(
    userId: string,
    weekNumber: number
  ): Promise<PsychologyAnalysisRecord> {
    console.log(`Generating psychology analysis for user ${userId}, week ${weekNumber}`);

    // 1. Проверяем доступность Claude AI
    if (!claudeService.isAvailable()) {
      throw new Error('AI Psychologist is not enabled or configured. Please set ANTHROPIC_API_KEY and AI_PSYCHOLOGIST_ENABLED=true');
    }

    // 2. Собираем недельные данные
    const weeklyData = await weeklyDataService.collectWeeklyData(userId, weekNumber);

    console.log('Weekly data collected:', {
      checkins: weeklyData.checkins.length,
      mindfulness: weeklyData.mindfulness.length,
      impulses: weeklyData.impulses.length,
      tasks: `${weeklyData.tasks.completed.length}/${weeklyData.tasks.available.length}`,
    });

    // 3. Получаем информацию о пользователе
    const user = await userService.findById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // 4. Генерируем анализ через Claude AI
    console.log('Calling Claude AI for analysis...');
    const analysis = await claudeService.analyzeWeeklyBehavior(weeklyData, user);

    // 5. Сохраняем в БД
    const saved = await savePsychologyAnalysis({
      user_id: userId,
      week_number: weekNumber,
      analysis,
      data_summary: weeklyData.summary,
    });

    console.log(`Analysis saved successfully for user ${userId}, week ${weekNumber}`);

    return saved;
  },

  /**
   * Получает анализ (из кеша или генерирует новый)
   *
   * @param userId - ID пользователя
   * @param weekNumber - Номер недели курса
   * @param force - Принудительная регенерация (игнорировать кеш)
   * @returns Психологический анализ
   */
  async getAnalysis(
    userId: string,
    weekNumber: number,
    force: boolean = false
  ): Promise<PsychologyAnalysisRecord> {
    // Проверяем существующий анализ
    if (!force) {
      const existing = await getAnalysisFromDB(userId, weekNumber);
      if (existing) {
        console.log(`Using cached analysis for user ${userId}, week ${weekNumber}`);
        return existing;
      }
    } else {
      console.log(`Force regeneration requested for user ${userId}, week ${weekNumber}`);
      // Удаляем старый анализ
      await deleteAnalysis(userId, weekNumber);
    }

    // Генерируем новый анализ
    return this.generateWeeklyAnalysis(userId, weekNumber);
  },

  /**
   * Получает историю анализов пользователя
   *
   * @param userId - ID пользователя
   * @param limit - Максимальное количество записей
   * @returns История анализов
   */
  async getAnalysisHistory(userId: string, limit: number = 10): Promise<AnalysisHistory> {
    const result = await query<PsychologyAnalysisRecord>(
      `SELECT * FROM psychology_analyses
       WHERE user_id = $1
       ORDER BY week_number DESC
       LIMIT $2`,
      [userId, limit]
    );

    // Подсчитываем общее количество анализов
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM psychology_analyses
       WHERE user_id = $1`,
      [userId]
    );

    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    // Парсим JSONB
    const analyses = result.rows.map(record => ({
      ...record,
      analysis: typeof record.analysis === 'string'
        ? JSON.parse(record.analysis)
        : record.analysis,
      data_summary: typeof record.data_summary === 'string'
        ? JSON.parse(record.data_summary)
        : record.data_summary,
    }));

    return {
      analyses,
      total,
    };
  },

  /**
   * Проверяет доступность анализа для недели
   *
   * @param userId - ID пользователя
   * @param weekNumber - Номер недели курса
   * @returns Информация о доступности
   */
  async checkAvailability(userId: string, weekNumber: number): Promise<{
    available: boolean;
    has_cached: boolean;
    reason?: string;
  }> {
    // Проверяем наличие кешированного анализа
    const existing = await getAnalysisFromDB(userId, weekNumber);

    if (existing) {
      return {
        available: true,
        has_cached: true,
      };
    }

    // Проверяем доступность Claude AI
    if (!claudeService.isAvailable()) {
      return {
        available: false,
        has_cached: false,
        reason: 'AI Psychologist is not enabled',
      };
    }

    // Проверяем наличие данных для анализа
    const dataCheck = await weeklyDataService.checkDataAvailability(userId, weekNumber);

    if (!dataCheck.available) {
      return {
        available: false,
        has_cached: false,
        reason: dataCheck.reason,
      };
    }

    return {
      available: true,
      has_cached: false,
    };
  },

  /**
   * Удаляет анализ (для тренера или администратора)
   *
   * @param userId - ID пользователя
   * @param weekNumber - Номер недели курса
   */
  async deleteAnalysis(userId: string, weekNumber: number): Promise<void> {
    await deleteAnalysis(userId, weekNumber);
    console.log(`Analysis deleted for user ${userId}, week ${weekNumber}`);
  },

  /**
   * Получает все анализы для всех пользователей за неделю (для тренера)
   *
   * @param weekNumber - Номер недели курса
   * @returns Массив анализов
   */
  async getWeekAnalysesForAllUsers(weekNumber: number): Promise<PsychologyAnalysisRecord[]> {
    const result = await query<PsychologyAnalysisRecord>(
      `SELECT pa.*, u.first_name, u.last_name, u.username
       FROM psychology_analyses pa
       JOIN users u ON pa.user_id = u.id
       WHERE pa.week_number = $1
       ORDER BY pa.created_at DESC`,
      [weekNumber]
    );

    // Парсим JSONB
    return result.rows.map(record => ({
      ...record,
      analysis: typeof record.analysis === 'string'
        ? JSON.parse(record.analysis)
        : record.analysis,
      data_summary: typeof record.data_summary === 'string'
        ? JSON.parse(record.data_summary)
        : record.data_summary,
    }));
  },

  /**
   * Статистика по анализам (для мониторинга)
   */
  async getStatistics(): Promise<{
    total_analyses: number;
    analyses_this_week: number;
    unique_users: number;
    avg_per_user: number;
  }> {
    const currentWeek = weeklyDataService.getCurrentWeekNumber();

    const result = await query<{
      total: string;
      this_week: string;
      unique_users: string;
    }>(
      `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE week_number = $1) as this_week,
         COUNT(DISTINCT user_id) as unique_users
       FROM psychology_analyses`,
      [currentWeek]
    );

    const stats = result.rows[0];
    const total = parseInt(stats?.total || '0', 10);
    const thisWeek = parseInt(stats?.this_week || '0', 10);
    const uniqueUsers = parseInt(stats?.unique_users || '0', 10);
    const avgPerUser = uniqueUsers > 0 ? total / uniqueUsers : 0;

    return {
      total_analyses: total,
      analyses_this_week: thisWeek,
      unique_users: uniqueUsers,
      avg_per_user: Math.round(avgPerUser * 10) / 10,
    };
  },
};
