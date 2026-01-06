import { create } from 'zustand'
import { api } from '../services/api'
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
} from '../types'

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
}

interface TaskWithProgress {
  id: string
  week_number: number
  title: string
  description?: string
  completed: boolean
}

interface Store {
  // Telegram пользователь
  telegramUser: TelegramUser | null
  setTelegramUser: (user: TelegramUser) => void

  // Пользователь из БД
  user: User | null
  isLoading: boolean
  error: string | null
  fetchUser: (telegramId: number) => Promise<void>
  setUserGoal: (goal: UserGoal) => Promise<void>
  updateOnboarding: (data: { goal?: UserGoal; height?: number; age?: number; target_weight?: number }) => Promise<void>

  // Чекины
  todayCheckin: DailyCheckin | null
  checkins: DailyCheckin[]
  fetchTodayCheckin: () => Promise<void>
  fetchCheckins: () => Promise<void>
  submitCheckin: (data: CheckinForm) => Promise<void>

  // Замеры
  currentMeasurement: WeeklyMeasurement | null
  measurements: WeeklyMeasurement[]
  canSubmitMeasurement: boolean
  measurementWindowInfo: { reason?: string; nextWindow?: { day: string; time: string } } | null
  fetchCurrentMeasurement: () => Promise<void>
  fetchMeasurements: () => Promise<void>
  checkMeasurementWindow: () => Promise<void>
  submitMeasurement: (data: MeasurementForm) => Promise<void>

  // Статистика
  stats: UserStats | null
  fetchStats: () => Promise<void>

  // Рейтинг
  leaderboard: LeaderboardEntry[]
  weeklyLeaderboard: LeaderboardEntry[]
  fetchLeaderboard: () => Promise<void>
  fetchWeeklyLeaderboard: () => Promise<void>

  // Достижения
  achievements: Achievement[]
  fetchAchievements: () => Promise<void>

  // Задания
  tasks: TaskWithProgress[]
  fetchTasks: () => Promise<void>
  completeTask: (taskId: string) => Promise<void>
  uncompleteTask: (taskId: string) => Promise<void>

  // Неделя курса
  courseWeek: number
  isCourseStarted: boolean
  daysUntilStart: number
  fetchCourseWeek: () => Promise<void>
}

export const useStore = create<Store>((set, get) => ({
  // Telegram
  telegramUser: null,
  setTelegramUser: (user) => set({ telegramUser: user }),

  // Пользователь
  user: null,
  isLoading: true,
  error: null,

  fetchUser: async (telegramId) => {
    try {
      set({ isLoading: true, error: null })
      const user = await api.getUser(telegramId)
      set({ user, isLoading: false })

      // Загружаем остальные данные
      const { fetchTodayCheckin, fetchStats, fetchCourseWeek } = get()
      await Promise.all([
        fetchTodayCheckin(),
        fetchStats(),
        fetchCourseWeek(),
      ])
    } catch (error) {
      console.error('Failed to fetch user:', error)
      set({ error: 'Не удалось загрузить данные', isLoading: false })
    }
  },

  setUserGoal: async (goal: UserGoal) => {
    const { user } = get()
    if (!user) return

    try {
      const updatedUser = await api.setUserGoal(user.id, goal)
      set({ user: updatedUser })
    } catch (error) {
      console.error('Failed to set user goal:', error)
      throw error
    }
  },

  updateOnboarding: async (data) => {
    const { user } = get()
    if (!user) return

    try {
      const updatedUser = await api.updateOnboarding(user.id, data)
      set({ user: updatedUser })
    } catch (error) {
      console.error('Failed to update onboarding:', error)
      throw error
    }
  },

  // Чекины
  todayCheckin: null,
  checkins: [],

  fetchTodayCheckin: async () => {
    const { user } = get()
    if (!user) return

    try {
      const checkin = await api.getTodayCheckin(user.id)
      set({ todayCheckin: checkin })
    } catch (error) {
      console.error('Failed to fetch today checkin:', error)
    }
  },

  fetchCheckins: async () => {
    const { user } = get()
    if (!user) return

    try {
      const checkins = await api.getCheckins(user.id)
      set({ checkins })
    } catch (error) {
      console.error('Failed to fetch checkins:', error)
    }
  },

  submitCheckin: async (data) => {
    const { user, fetchTodayCheckin, fetchStats } = get()
    if (!user) throw new Error('User not found')

    await api.createCheckin(user.id, data)
    await Promise.all([fetchTodayCheckin(), fetchStats()])
  },

  // Замеры
  currentMeasurement: null,
  measurements: [],
  canSubmitMeasurement: true,
  measurementWindowInfo: null,

  fetchCurrentMeasurement: async () => {
    const { user } = get()
    if (!user) return

    try {
      const measurement = await api.getCurrentMeasurement(user.id)
      set({ currentMeasurement: measurement || null })
    } catch (error) {
      console.error('Failed to fetch current measurement:', error)
      set({ currentMeasurement: null })
    }
  },

  fetchMeasurements: async () => {
    const { user } = get()
    if (!user) return

    try {
      const measurements = await api.getMeasurements(user.id)
      // Защита от некорректных данных
      set({ measurements: Array.isArray(measurements) ? measurements : [] })
    } catch (error) {
      console.error('Failed to fetch measurements:', error)
      set({ measurements: [] })
    }
  },

  checkMeasurementWindow: async () => {
    try {
      const { user } = get()
      const result = await api.canSubmitMeasurement(user?.id)
      set({
        canSubmitMeasurement: result.allowed,
        measurementWindowInfo: result.allowed ? null : { reason: result.reason, nextWindow: result.nextWindow }
      })
    } catch (error) {
      console.error('Failed to check measurement window:', error)
      // По умолчанию разрешаем (на случай ошибки API)
      set({ canSubmitMeasurement: true, measurementWindowInfo: null })
    }
  },

  submitMeasurement: async (data) => {
    const { user, fetchCurrentMeasurement, fetchMeasurements, fetchStats } = get()
    if (!user) throw new Error('User not found')

    await api.createMeasurement(user.id, data)
    await Promise.all([
      fetchCurrentMeasurement(),
      fetchMeasurements(),
      fetchStats(),
    ])
  },

  // Статистика
  stats: null,

  fetchStats: async () => {
    const { user } = get()
    if (!user) return

    try {
      const stats = await api.getStats(user.id)
      set({ stats })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  },

  // Рейтинг
  leaderboard: [],
  weeklyLeaderboard: [],

  fetchLeaderboard: async () => {
    try {
      const leaderboard = await api.getLeaderboard()
      set({ leaderboard })
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    }
  },

  fetchWeeklyLeaderboard: async () => {
    try {
      const weeklyLeaderboard = await api.getWeeklyLeaderboard()
      set({ weeklyLeaderboard })
    } catch (error) {
      console.error('Failed to fetch weekly leaderboard:', error)
    }
  },

  // Достижения
  achievements: [],

  fetchAchievements: async () => {
    const { user } = get()
    if (!user) return

    try {
      const achievements = await api.getAchievements(user.id)
      set({ achievements })
    } catch (error) {
      console.error('Failed to fetch achievements:', error)
    }
  },

  // Задания
  tasks: [],

  fetchTasks: async () => {
    const { user } = get()
    if (!user) return

    try {
      const tasks = await api.getTasks(user.id)
      set({ tasks })
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    }
  },

  completeTask: async (taskId) => {
    const { user, fetchTasks, fetchStats } = get()
    if (!user) return

    await api.completeTask(user.id, taskId)
    await Promise.all([fetchTasks(), fetchStats()])
  },

  uncompleteTask: async (taskId) => {
    const { user, fetchTasks } = get()
    if (!user) return

    await api.uncompleteTask(user.id, taskId)
    await fetchTasks()
  },

  // Неделя курса
  courseWeek: 1,
  isCourseStarted: false,
  daysUntilStart: 0,

  fetchCourseWeek: async () => {
    try {
      const data = await api.getCourseWeek()
      set({
        courseWeek: data.week,
        isCourseStarted: data.isStarted,
        daysUntilStart: data.daysUntilStart
      })
    } catch (error) {
      console.error('Failed to fetch course week:', error)
    }
  },
}))
