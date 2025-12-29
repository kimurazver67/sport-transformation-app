import type {
  User,
  DailyCheckin,
  WeeklyMeasurement,
  UserStats,
  LeaderboardEntry,
  Achievement,
  CheckinForm,
  MeasurementForm,
  ApiResponse,
} from '../../shared/types'

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

  createMeasurement: (userId: string, data: MeasurementForm) =>
    request<WeeklyMeasurement>(`/api/measurement/${userId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

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
    request<number>(`/api/course/week`).then((data: any) => data.week),
}
