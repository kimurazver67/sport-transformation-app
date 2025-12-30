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

// Получаем initData из Telegram WebApp
function getInitData(): string {
  return window.Telegram?.WebApp?.initData || ''
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`

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

    const response = await fetch(newUrl, { ...options, headers })
    const data: ApiResponse<T> = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Request failed')
    }

    return data.data as T
  }

  const response = await fetch(url, { ...options, headers })
  const data: ApiResponse<T> = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Request failed')
  }

  return data.data as T
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

  canSubmitMeasurement: () => {
    const tz = new Date().getTimezoneOffset()
    return request<{
      allowed: boolean
      reason?: string
      nextWindow?: { day: string; time: string }
    }>(`/api/measurement/can-submit?tz=${tz}`)
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
}
