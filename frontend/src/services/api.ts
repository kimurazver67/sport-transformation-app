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
  PsychologyAnalysisRecord,
  AnalysisHistory,
  AnalysisAvailability,
} from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Debug logging - отправляет лог в телеграм
async function sendDebugLog(message: string) {
  try {
    await fetch(`${API_URL}/api/debug/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `[API] ${message}` }),
    })
  } catch (e) {
    // ignore
  }
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
  const method = options.method || 'GET'
  const startTime = Date.now()

  // Логируем начало запроса
  sendDebugLog(`${method} ${endpoint} started`)

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Telegram-Init-Data': getInitData(),
    ...options.headers,
  }

  try {
    // Для локальной разработки добавляем telegram_id
    if (!getInitData() && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
      const telegramId = window.Telegram.WebApp.initDataUnsafe.user.id
      const separator = endpoint.includes('?') ? '&' : '?'
      const newUrl = `${url}${separator}telegram_id=${telegramId}`

      const response = await fetch(newUrl, { ...options, headers })
      const data: ApiResponse<T> = await response.json()
      const duration = Date.now() - startTime

      if (!data.success) {
        sendDebugLog(`${method} ${endpoint} FAILED (${duration}ms): ${data.error}`)
        throw new Error(data.error || 'Request failed')
      }

      sendDebugLog(`${method} ${endpoint} OK (${duration}ms)`)
      return data.data as T
    }

    const response = await fetch(url, { ...options, headers })
    const data: ApiResponse<T> = await response.json()
    const duration = Date.now() - startTime

    if (!data.success) {
      sendDebugLog(`${method} ${endpoint} FAILED (${duration}ms): ${data.error}`)
      throw new Error(data.error || 'Request failed')
    }

    sendDebugLog(`${method} ${endpoint} OK (${duration}ms)`)
    return data.data as T
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)
    sendDebugLog(`${method} ${endpoint} ERROR (${duration}ms): ${errorMessage}`)
    throw error
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
    }>(`/api/user-nutrition/${userId}`),

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

  // ===== PSYCHOLOGY (AI Психолог) =====

  // Получить психологический анализ за неделю (или сгенерировать новый)
  getPsychologyAnalysis: (userId: string, weekNumber: number, force: boolean = false) =>
    request<PsychologyAnalysisRecord>(
      `/api/psychology/analysis/${userId}/${weekNumber}?force=${force}`
    ),

  // Получить историю анализов пользователя
  getPsychologyHistory: (userId: string, limit: number = 10) =>
    request<AnalysisHistory>(`/api/psychology/history/${userId}?limit=${limit}`),

  // Проверить доступность анализа для недели
  checkPsychologyAvailability: (userId: string, weekNumber: number) =>
    request<AnalysisAvailability>(
      `/api/psychology/availability/${userId}/${weekNumber}`
    ),

  // Принудительно регенерировать анализ (только тренер)
  regeneratePsychologyAnalysis: (userId: string, weekNumber: number) =>
    request<PsychologyAnalysisRecord>(
      `/api/psychology/regenerate/${userId}/${weekNumber}`,
      { method: 'POST' }
    ),

  // Удалить анализ (только тренер)
  deletePsychologyAnalysis: (userId: string, weekNumber: number) =>
    request<void>(
      `/api/psychology/analysis/${userId}/${weekNumber}`,
      { method: 'DELETE' }
    ),

  // Получить все анализы за неделю для всех пользователей (только тренер)
  getPsychologyWeekAnalyses: (weekNumber: number) =>
    request<PsychologyAnalysisRecord[]>(`/api/psychology/week/${weekNumber}`),

  // Получить статистику по анализам (только тренер)
  getPsychologyStats: () =>
    request<{
      total_analyses: number
      analyses_this_week: number
      unique_users: number
      avg_per_user: number
    }>('/api/psychology/stats'),

  // ===== NUTRITION (Питание) =====

  // Поиск продуктов
  searchProducts: (query: string, source: 'local' | 'openfoodfacts' | 'all' = 'all', limit = 20) =>
    fetch(`${API_URL}/api/nutrition/products/search?q=${encodeURIComponent(query)}&source=${source}&limit=${limit}`, {
      headers: {
        'X-Telegram-Init-Data': getInitData(),
      },
    }).then(async (res) => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Search failed')
      return data
    }),

  // Импортировать продукт из OpenFoodFacts
  importProduct: (openFoodFactsCode: string, userId?: string) =>
    fetch(`${API_URL}/api/nutrition/products/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': getInitData(),
      },
      body: JSON.stringify({ openfoodfacts_code: openFoodFactsCode, user_id: userId }),
    }).then(async (res) => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')
      return data
    }),

  // Получить все теги (аллергены, диеты, предпочтения)
  getTags: () =>
    fetch(`${API_URL}/api/nutrition/tags`, {
      headers: {
        'X-Telegram-Init-Data': getInitData(),
      },
    }).then(async (res) => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to get tags')
      return data.tags
    }),

  // Получить исключения пользователя
  getUserExclusions: (userId: string) =>
    fetch(`${API_URL}/api/nutrition/exclusions/${userId}`, {
      headers: {
        'X-Telegram-Init-Data': getInitData(),
      },
    }).then(async (res) => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to get exclusions')
      return data
    }),

  // Добавить продукт в исключения
  addProductExclusion: (userId: string, productId: string) =>
    fetch(`${API_URL}/api/nutrition/exclusions/${userId}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': getInitData(),
      },
      body: JSON.stringify({ product_id: productId }),
    }).then(async (res) => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add exclusion')
      return data
    }),

  // Добавить тег в исключения
  addTagExclusion: (userId: string, tagId: string) =>
    fetch(`${API_URL}/api/nutrition/exclusions/${userId}/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': getInitData(),
      },
      body: JSON.stringify({ tag_id: tagId }),
    }).then(async (res) => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add tag exclusion')
      return data
    }),

  // Удалить продукт из исключений
  removeProductExclusion: (userId: string, productId: string) =>
    fetch(`${API_URL}/api/nutrition/exclusions/${userId}/products/${productId}`, {
      method: 'DELETE',
      headers: {
        'X-Telegram-Init-Data': getInitData(),
      },
    }).then(async (res) => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to remove exclusion')
      return data
    }),

  // Удалить тег из исключений
  removeTagExclusion: (userId: string, tagId: string) =>
    fetch(`${API_URL}/api/nutrition/exclusions/${userId}/tags/${tagId}`, {
      method: 'DELETE',
      headers: {
        'X-Telegram-Init-Data': getInitData(),
      },
    }).then(async (res) => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to remove tag exclusion')
      return data
    }),

  // Сгенерировать план питания
  generateMealPlan: (userId: string, weeks: number, allowRepeatDays: number, preferSimple: boolean, useInventory: boolean = false) =>
    fetch(`${API_URL}/api/nutrition/meal-plans/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': getInitData(),
      },
      body: JSON.stringify({
        user_id: userId,
        weeks,
        allow_repeat_days: allowRepeatDays,
        prefer_simple: preferSimple,
        use_inventory: useInventory,
      }),
    }).then(async (res) => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate meal plan')
      return data
    }),

  // Получить активный план питания пользователя
  getUserMealPlan: (userId: string) =>
    fetch(`${API_URL}/api/nutrition/meal-plans/user/${userId}`, {
      headers: {
        'X-Telegram-Init-Data': getInitData(),
      },
    }).then(async (res) => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to get user meal plan')
      return data
    }),

  // Получить план питания
  getMealPlan: (mealPlanId: string) =>
    fetch(`${API_URL}/api/nutrition/meal-plans/${mealPlanId}`, {
      headers: {
        'X-Telegram-Init-Data': getInitData(),
      },
    }).then(async (res) => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to get meal plan')
      return data
    }),

  // Получить список покупок
  getShoppingList: (mealPlanId: string) =>
    fetch(`${API_URL}/api/nutrition/meal-plans/${mealPlanId}/shopping-list`, {
      headers: {
        'X-Telegram-Init-Data': getInitData(),
      },
    }).then(async (res) => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to get shopping list')
      return data
    }),

  // ==========================================
  // INVENTORY (Инвентарь пользователя)
  // ==========================================

  // Получить инвентарь пользователя
  getInventory: (userId: string) =>
    fetch(`${API_URL}/api/nutrition/inventory/${userId}`, {
      headers: {
        'X-Telegram-Init-Data': getInitData(),
      },
    }).then(async (res) => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to get inventory')
      return data
    }),

  // Добавить продукт в инвентарь
  addInventoryItem: (userId: string, item: {
    productId: string;
    quantityGrams?: number;
    quantityUnits?: number;
    location?: 'fridge' | 'freezer' | 'pantry' | 'other';
    expiryDate?: string;
  }) =>
    fetch(`${API_URL}/api/nutrition/inventory/${userId}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': getInitData(),
      },
      body: JSON.stringify(item),
    }).then(async (res) => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add inventory item')
      return data
    }),

  // Обновить продукт в инвентаре
  updateInventoryItem: (userId: string, itemId: string, updates: {
    quantityGrams?: number;
    quantityUnits?: number;
    location?: string;
    expiryDate?: string;
  }) =>
    fetch(`${API_URL}/api/nutrition/inventory/${userId}/items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': getInitData(),
      },
      body: JSON.stringify(updates),
    }).then(async (res) => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update inventory item')
      return data
    }),

  // Удалить продукт из инвентаря
  deleteInventoryItem: (userId: string, itemId: string) =>
    fetch(`${API_URL}/api/nutrition/inventory/${userId}/items/${itemId}`, {
      method: 'DELETE',
      headers: {
        'X-Telegram-Init-Data': getInitData(),
      },
    }).then(async (res) => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete inventory item')
      return data
    }),

  // Массовое добавление продуктов в инвентарь
  bulkAddInventory: (userId: string, items: Array<{
    productId: string;
    quantityGrams?: number;
    quantityUnits?: number;
    location?: string;
  }>) =>
    fetch(`${API_URL}/api/nutrition/inventory/${userId}/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': getInitData(),
      },
      body: JSON.stringify({ items }),
    }).then(async (res) => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to bulk add inventory')
      return data
    }),

  // Получить разницу между списком покупок и инвентарём
  getShoppingDiff: (userId: string, mealPlanId: string) =>
    fetch(`${API_URL}/api/nutrition/inventory/${userId}/shopping-diff/${mealPlanId}`, {
      headers: {
        'X-Telegram-Init-Data': getInitData(),
      },
    }).then(async (res) => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to get shopping diff')
      return data
    }),
}
