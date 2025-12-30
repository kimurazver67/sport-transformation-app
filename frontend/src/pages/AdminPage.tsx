import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTelegram } from '../hooks/useTelegram'
import { useStore } from '../store'
import { api } from '../services/api'

interface ParticipantData {
  user: {
    id: string
    telegram_id: number
    first_name: string
    last_name?: string
  }
  stats: {
    total_points: number
    current_streak: number
    rank_overall: number
  } | null
  weight_start: number | null
  weight_current: number | null
  weight_change: number | null
  has_checkin_today: boolean
}

interface DashboardData {
  total_participants: number
  active_today: number
  missing_checkin_today: any[]
  missing_measurement_this_week: any[]
  average_weight_change: number
  average_streak: number
  course_week: number
}

export default function AdminPage() {
  const { hapticFeedback, showAlert, showConfirm } = useTelegram()
  const { courseWeek } = useStore()

  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [participants, setParticipants] = useState<ParticipantData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'participants' | 'tasks'>('dashboard')

  // Форма нового задания
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isCreatingTask, setIsCreatingTask] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setError(null)
      const [dashData, partData] = await Promise.all([
        api.getAdminDashboard(),
        api.getAdminParticipants(),
      ])

      setDashboard(dashData)
      setParticipants(partData)
    } catch (err) {
      console.error('Failed to fetch admin data:', err)
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных')
    } finally {
      setIsLoading(false)
    }
  }

  const sendReminder = async (userId: string, userName: string) => {
    const confirmed = await showConfirm(`Отправить напоминание ${userName}?`)
    if (!confirmed) return

    try {
      await api.sendAdminReminder(userId)
      hapticFeedback('success')
      showAlert('Напоминание отправлено!')
    } catch (err) {
      hapticFeedback('error')
      showAlert('Ошибка при отправке')
    }
  }

  const sendBroadcast = async () => {
    const message = prompt('Введите сообщение для рассылки:')
    if (!message) return

    const confirmed = await showConfirm('Отправить сообщение всем участникам?')
    if (!confirmed) return

    try {
      const result = await api.sendAdminBroadcast(message, 'participant')
      hapticFeedback('success')
      showAlert(`Отправлено: ${result.sent}, ошибок: ${result.failed}`)
    } catch (err) {
      hapticFeedback('error')
      showAlert('Ошибка при рассылке')
    }
  }

  const createTask = async () => {
    if (!newTaskTitle.trim()) return

    setIsCreatingTask(true)
    try {
      await api.createAdminTask(courseWeek, newTaskTitle)
      hapticFeedback('success')
      setNewTaskTitle('')
      showAlert('Задание создано!')
    } catch (err) {
      hapticFeedback('error')
      showAlert('Ошибка при создании')
    } finally {
      setIsCreatingTask(false)
    }
  }

  const syncSheets = async () => {
    hapticFeedback('light')
    try {
      await api.syncAdminSheets()
      hapticFeedback('success')
      showAlert('Синхронизация завершена!')
    } catch (err) {
      hapticFeedback('error')
      showAlert('Ошибка синхронизации')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-neon-lime border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-void-200 border-2 border-red-500 p-6 max-w-sm w-full" style={{ boxShadow: '6px 6px 0 0 #EF4444' }}>
          <div className="font-mono text-sm text-red-400 uppercase mb-2">Ошибка доступа</div>
          <p className="font-mono text-steel-300 text-sm mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="btn-brutal w-full"
          >
            Повторить
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-4 px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="blob -top-32 -right-32 opacity-20" />
      <div className="blob -bottom-32 -left-32 opacity-10" style={{ animationDelay: '-4s' }} />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-6 pb-4"
      >
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="font-mono text-xs text-steel-500 uppercase tracking-widest"
        >
          Панель_управления // Тренер
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="font-display text-3xl font-bold text-steel-100 mt-1"
        >
          АДМИН
        </motion.h1>
      </motion.header>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex gap-1 mb-6 border-b-2 border-void-400"
      >
        {[
          { id: 'dashboard', label: 'Дашборд' },
          { id: 'participants', label: 'Участники' },
          { id: 'tasks', label: 'Задания' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              hapticFeedback('light')
              setActiveTab(tab.id as any)
            }}
            className={`flex-1 py-3 font-mono text-sm uppercase tracking-wider transition-all relative ${
              activeTab === tab.id
                ? 'text-neon-lime'
                : 'text-steel-500 hover:text-steel-300'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-lime"
              />
            )}
          </button>
        ))}
      </motion.div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && dashboard && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="brutal-card"
            >
              <div className="font-mono text-[10px] text-steel-500 uppercase tracking-widest mb-1">
                Участников
              </div>
              <div className="font-display text-4xl font-bold text-neon-lime">
                {dashboard.total_participants}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="brutal-card-cyan"
            >
              <div className="font-mono text-[10px] text-steel-500 uppercase tracking-widest mb-1">
                Активны сегодня
              </div>
              <div className="font-display text-4xl font-bold text-neon-cyan">
                {dashboard.active_today}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-void-200 border-2 border-neon-orange p-4"
              style={{ boxShadow: '8px 8px 0 0 #FF6B00' }}
            >
              <div className="font-mono text-[10px] text-steel-500 uppercase tracking-widest mb-1">
                Ср. изменение
              </div>
              <div className="font-display text-3xl font-bold text-neon-orange">
                {typeof dashboard.average_weight_change === 'number'
                  ? dashboard.average_weight_change.toFixed(1)
                  : '0.0'} кг
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="brutal-card-magenta"
            >
              <div className="font-mono text-[10px] text-steel-500 uppercase tracking-widest mb-1">
                Ср. streak
              </div>
              <div className="font-display text-3xl font-bold text-neon-magenta flex items-center gap-2">
                {typeof dashboard.average_streak === 'number'
                  ? dashboard.average_streak.toFixed(1)
                  : '0.0'}
                <span className="text-2xl">🔥</span>
              </div>
            </motion.div>
          </div>

          {/* Missing Checkins */}
          {dashboard.missing_checkin_today.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-void-200 border-2 border-red-500 p-4"
              style={{ boxShadow: '6px 6px 0 0 #EF4444' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">⚠️</span>
                <span className="font-mono text-sm text-red-400 uppercase">
                  Без чекина ({dashboard.missing_checkin_today.length})
                </span>
              </div>
              <div className="space-y-2">
                {dashboard.missing_checkin_today.slice(0, 5).map((user: any) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between py-2 border-b border-void-400 last:border-0"
                  >
                    <span className="font-mono text-sm text-steel-300">
                      {user.first_name} {user.last_name}
                    </span>
                    <button
                      onClick={() => sendReminder(user.id, user.first_name)}
                      className="font-mono text-xs text-neon-cyan hover:text-neon-lime transition-colors"
                    >
                      [НАПОМНИТЬ]
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 gap-3"
          >
            <button
              onClick={sendBroadcast}
              className="btn-brutal-outline text-sm"
            >
              📢 Рассылка
            </button>
            <button
              onClick={syncSheets}
              className="btn-brutal-outline text-sm"
            >
              📊 Синхронизация
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Participants Tab */}
      {activeTab === 'participants' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {participants.map((p, index) => (
            <motion.div
              key={p.user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-void-200 border-2 border-void-400 p-4 hover:border-neon-lime transition-colors"
              style={{ boxShadow: '4px 4px 0 0 rgba(191, 255, 0, 0.2)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display font-bold text-steel-100">
                    {p.user.first_name} {p.user.last_name}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="font-mono text-xs text-steel-500">
                      <span className="text-neon-lime">{p.stats?.total_points || 0}</span> pts
                    </span>
                    <span className="font-mono text-xs text-steel-500">
                      🔥 <span className="text-neon-orange">{p.stats?.current_streak || 0}</span>
                    </span>
                    {typeof p.weight_change === 'number' && (
                      <span
                        className={`font-mono text-xs ${
                          p.weight_change < 0 ? 'text-neon-lime' : 'text-red-400'
                        }`}
                      >
                        {p.weight_change > 0 ? '+' : ''}{p.weight_change.toFixed(1)} кг
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {p.has_checkin_today ? (
                    <div className="w-8 h-8 flex items-center justify-center border-2 border-neon-lime text-neon-lime">
                      ✓
                    </div>
                  ) : (
                    <button
                      onClick={() => sendReminder(p.user.id, p.user.first_name)}
                      className="font-mono text-[10px] px-2 py-1 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-void transition-all"
                    >
                      НАПОМНИТЬ
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* Create Task Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="brutal-card"
          >
            <div className="font-mono text-[10px] text-steel-500 uppercase tracking-widest mb-3">
              Новое задание // Неделя_{String(courseWeek).padStart(2, '0')}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Название задания..."
                className="input-brutal flex-1"
              />
              <button
                onClick={createTask}
                disabled={isCreatingTask || !newTaskTitle.trim()}
                className="btn-brutal px-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-mono text-xs text-steel-500 text-center"
          >
            Задания отображаются у участников после создания.
          </motion.p>
        </motion.div>
      )}
    </div>
  )
}
