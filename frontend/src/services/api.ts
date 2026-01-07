import type {
  User,
  UserGoal,
  DailyCheckin,
  WeeklyMeasurement,
  UserStats,
  LeaderboardEntry,
  Achievement,
  CheckinForm,
  MeasurementForm,
  ApiResponse,
} from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Debug logging to Telegram
const ADMIN_CHAT_ID = '-1003380571535'
const BOT_TOKEN = '8189539417:AAGki4aTKHCxgFpvMxOsDL9zdNcFaO2i6fA'

async function logToTelegram(msg: string) {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: `🔌 <b>API</b>\n\n${msg}`,
        parse_mode: 'HTML',
      }),
    })
  } catch (e) { /* ignore */ }
}

// Получаем initData из Telegram WebApp
function getInitData(): string {
  return window.Telegram?.WebApp?.initData || ''
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`
  logToTelegram(`Request: ${options.method || 'GET'} ${endpoint}`)

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Telegram-Init-Data': getInitData(),
    ...options.headers,
  }

  // Для локальной разработки добавляем telegram_id
  if (!getInitData() && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
    const telegramId = window.Telegram.WebApp.initDataUnsafe.user.id
    const separator = endpoint.includes('?') ? '&' : '?'
    const newUrl = `${url}${separator}telegram_id=${telegramId}`

    try {
      const response = await fetch(newUrl, { ...options, headers })
      logToTelegram(`Response: ${endpoint} status=${response.status}`)
      const data: ApiResponse<T> = await response.json()

      if (!data.success) {
        logToTelegram(`Error: ${endpoint} - ${data.error}`)
        throw new Error(data.error || 'Request failed')
      }

      return data.data as T
    } catch (e: any) {
      logToTelegram(`Fetch error: ${endpoint} - ${e?.message || String(e)}`)
      throw e
    }
  }

  try {
    const response = await fetch(url, { ...options, headers })
    logToTelegram(`Response: ${endpoint} status=${response.status}`)
    const data: ApiResponse<T> = await response.json()

    if (!data.success) {
      logToTelegram(`Error: ${endpoint} - ${data.error}`)
      throw new Error(data.error || 'Request failed')
    }

    return data.data as T
  } catch (e: any) {
    logToTelegram(`Fetch error: ${endpoint} - ${e?.message || String(e)}`)
    throw e
  }
}

export const api = {
  // Пользователь
  getUser: (telegramId: number) =>
    request<User>(`/api/user/${telegramId}`),

  setUserGoal: (userId: string, goal: UserGoal) =>
    request<User>(`/api/user/${userId}/goal`, {
      method: 'POST',
      body: JSON.stringify({ goal }),
    }),

  // Обновить данные онбординга
  updateOnboarding: (userId: string, data: {
    goal?: UserGoal
    height?: number
    age?: number
    target_weight?: number
  }) =>
    request<User>(`/api/user/${userId}/onboarding`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Чекины
  getTodayCheckin: (userId: string) =>
    request<DailyCheckin | null>(`/api/checkin/today/${userId}`),

  getCheckins: (userId: string) =>
    request<DailyCheckin[]>(`/api/checkins/${userId}`),

  createCheckin: (userId: string, data: CheckinForm) =>
    request<DailyCheckin>(`/api/checkin/${userId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCheckinStats: (userId: string) =>
    request<{
      totalCheckins: number
      workoutDays: number
      nutritionDays: number
      avgSleep: number
      avgMood: number
    }>(`/api/checkins/${userId}/stats`),

  // Замеры
  getCurrentMeasurement: (userId: string) =>
    request<WeeklyMeasurement | null>(`/api/measurement/current/${userId}`),

  getMeasurements: (userId: string) =>
    request<WeeklyMeasurement[]>(`/api/measurements/${userId}`),

  canSubmitMeasurement: (userId?: string) => {
    const tz = new Date().getTimezoneOffset()
    const params = new URLSearchParams({ tz: String(tz) })
    if (userId) params.append('userId', userId)
    return request<{
      allowed: boolean
      reason?: string
      nextWindow?: { day: string; time: string }
      unlocked?: boolean
      unlocked_until?: string
    }>(`/api/measurement/can-submit?${params}`)
  },

  createMeasurement: (userId: string, data: MeasurementForm) => {
    const timezoneOffset = new Date().getTimezoneOffset()
    return request<WeeklyMeasurement>(`/api/measurement/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ ...data, timezoneOffset }),
    })
  },

  getWeightProgress: (userId: string) =>
    request<{ week: number; weight: number }[]>(`/api/measurements/${userId}/weight`),

  getProgressComparison: (userId: string) =>
    request<{
      start: WeeklyMeasurement | null
      current: WeeklyMeasurement | null
      weightChange: number | null
    }>(`/api/measurements/${userId}/comparison`),

  // Статистика
  getStats: (userId: string) =>
    request<UserStats>(`/api/stats/${userId}`),

  // Питание (КБЖУ)
  getNutrition: (userId: string) =>
    request<{
      calories: number
      protein: number
      fat: number
      carbs: number
      goal: 'weight_loss' | 'muscle_gain'
      weight: number
    }>(`/api/nutrition/${userId}`),

  // Рейтинг
  getLeaderboard: (limit = 20) =>
    request<LeaderboardEntry[]>(`/api/leaderboard?limit=${limit}`),

  getWeeklyLeaderboard: (limit = 20) =>
    request<LeaderboardEntry[]>(`/api/leaderboard/weekly?limit=${limit}`),

  // Рейтинг по цели (🔥/💪)
  getLeaderboardByGoal: (goal: 'weight_loss' | 'muscle_gain', limit = 20) =>
    request<LeaderboardEntry[]>(`/api/leaderboard/goal/${goal}?limit=${limit}`),

  getWeeklyLeaderboardByGoal: (goal: 'weight_loss' | 'muscle_gain', limit = 20) =>
    request<LeaderboardEntry[]>(`/api/leaderboard/weekly/goal/${goal}?limit=${limit}`),

  // Достижения
  getAchievements: (userId: string) =>
    request<Achievement[]>(`/api/achievements/${userId}`),

  // Задания
  getTasks: (userId: string) =>
    request<any[]>(`/api/tasks/${userId}`),

  completeTask: (userId: string, taskId: string) =>
    request<any>(`/api/tasks/${taskId}/complete/${userId}`, {
      method: 'POST',
    }),

  uncompleteTask: (userId: string, taskId: string) =>
    request<void>(`/api/tasks/${taskId}/complete/${userId}`, {
      method: 'DELETE',
    }),

  // Курс
  getCourseWeek: () =>
    request<{ week: number; isStarted: boolean; daysUntilStart: number }>(`/api/course/week`),

  // ===== ДНЕВНИК ОСОЗНАННОСТИ =====

  // Получить запись за сегодня
  getTodayMindfulness: (userId: string) =>
    request<any>(`/api/mindfulness/${userId}/today`),

  // Получить последние записи
  getRecentMindfulness: (userId: string, limit = 7) =>
    request<any[]>(`/api/mindfulness/${userId}/recent?limit=${limit}`),

  // Создать/обновить запись
  saveMindfulness: (userId: string, data: {
    gratitude?: string
    wins?: string
    challenges?: string
    lessons?: string
    mood_note?: string
  }) =>
    request<any>(`/api/mindfulness/${userId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ===== ТРЕКЕР ИМПУЛЬСОВ =====

  // Залогировать импульс
  logImpulse: (userId: string, data: {
    trigger_type: 'stress' | 'boredom' | 'social' | 'emotional' | 'habitual'
    intensity: number
    action_taken: 'resisted' | 'gave_in' | 'alternative'
    notes?: string
  }) =>
    request<any>(`/api/impulses/${userId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Получить статистику импульсов
  getImpulseStats: (userId: string, days = 7) =>
    request<{
      total: number
      resisted: number
      gave_in: number
      alternative: number
      by_trigger: Record<string, number>
      resistance_rate: number
    }>(`/api/impulses/${userId}/stats?days=${days}`),

  // Получить последние импульсы
  getRecentImpulses: (userId: string, limit = 10) =>
    request<any[]>(`/api/impulses/${userId}/recent?limit=${limit}`),

  // Фото
  // Получить URL фото по file_id (использует прокси, чтобы не светить токен бота)
  getPhotoUrl: (fileId: string): string => {
    return `${API_URL}/api/photo/${fileId}/proxy`
  },

  // Debug logging - отправляет лог в телеграм бота
  debugLog: async (message: string, data?: unknown): Promise<void> => {
    try {
      await fetch(`${API_URL}/api/debug/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': getInitData(),
        },
        body: JSON.stringify({ message, data }),
      })
    } catch (e) {
      console.error('Debug log failed:', e)
    }
  },

  // ===== ADMIN =====

  // Дашборд
  getAdminDashboard: () =>
    request<{
      total_participants: number
      active_today: number
      missing_checkin_today: any[]
      missing_measurement_this_week: any[]
      average_weight_change: number
      average_streak: number
      course_week: number
    }>('/admin/dashboard'),

  // Список участников
  getAdminParticipants: () =>
    request<any[]>('/admin/participants'),

  // Отправить напоминание
  sendAdminReminder: (userId: string, message?: string) =>
    request<{ success: boolean }>(`/admin/remind/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  // Рассылка
  sendAdminBroadcast: (message: string, role: 'all' | 'participant' | 'trainer' = 'participant') =>
    request<{ sent: number; failed: number }>('/admin/broadcast', {
      method: 'POST',
      body: JSON.stringify({ message, role }),
    }),

  // Создать задание
  createAdminTask: (data: {
    week_number: number
    title: string
    description?: string
    goal?: 'weight_loss' | 'muscle_gain' | null
    is_bonus?: boolean
  }) =>
    request<any>('/admin/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Получить все задания (опционально по неделе)
  getAdminTasks: (weekNumber?: number) =>
    request<any[]>(`/admin/tasks${weekNumber !== undefined ? `?week=${weekNumber}` : ''}`),

  // Удалить задание
  deleteAdminTask: (taskId: string) =>
    request<void>(`/admin/tasks/${taskId}`, {
      method: 'DELETE',
    }),

  // Обновить задание
  updateAdminTask: (taskId: string, data: {
    title?: string
    description?: string
    goal?: 'weight_loss' | 'muscle_gain' | null
    is_bonus?: boolean
  }) =>
    request<any>(`/admin/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Синхронизация с Google Sheets
  syncAdminSheets: () =>
    request<{ message: string }>('/admin/sync-sheets', {
      method: 'POST',
    }),

  // Открыть замеры для участника
  unlockMeasurement: (userId: string, hours = 24) =>
    request<{
      userId: string
      userName: string
      unlocked_until: string
    }>(`/admin/unlock-measurement/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ hours }),
    }),

  // Закрыть замеры для участника
  lockMeasurement: (userId: string) =>
    request<{ success: boolean }>(`/admin/lock-measurement/${userId}`, {
      method: 'POST',
    }),
}
