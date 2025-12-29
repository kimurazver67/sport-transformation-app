import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTelegram } from '../hooks/useTelegram'
import { useStore } from '../store'

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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function AdminPage() {
  const { hapticFeedback, showAlert, showConfirm } = useTelegram()
  const { courseWeek } = useStore()

  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [participants, setParticipants] = useState<ParticipantData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'participants' | 'tasks'>('dashboard')

  // Форма нового задания
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isCreatingTask, setIsCreatingTask] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [dashRes, partRes] = await Promise.all([
        fetch(`${API_URL}/admin/dashboard`),
        fetch(`${API_URL}/admin/participants`),
      ])

      const dashData = await dashRes.json()
      const partData = await partRes.json()

      if (dashData.success) setDashboard(dashData.data)
      if (partData.success) setParticipants(partData.data)
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendReminder = async (userId: string, userName: string) => {
    const confirmed = await showConfirm(`Отправить напоминание ${userName}?`)
    if (!confirmed) return

    try {
      const res = await fetch(`${API_URL}/admin/remind/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()
      if (data.success) {
        hapticFeedback('success')
        showAlert('Напоминание отправлено!')
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
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
      const res = await fetch(`${API_URL}/admin/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, role: 'participant' }),
      })

      const data = await res.json()
      if (data.success) {
        hapticFeedback('success')
        showAlert(`Отправлено: ${data.data.sent}, ошибок: ${data.data.failed}`)
      }
    } catch (error) {
      hapticFeedback('error')
      showAlert('Ошибка при рассылке')
    }
  }

  const createTask = async () => {
    if (!newTaskTitle.trim()) return

    setIsCreatingTask(true)
    try {
      const res = await fetch(`${API_URL}/admin/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week_number: courseWeek,
          title: newTaskTitle,
        }),
      })

      const data = await res.json()
      if (data.success) {
        hapticFeedback('success')
        setNewTaskTitle('')
        showAlert('Задание создано!')
      }
    } catch (error) {
      hapticFeedback('error')
      showAlert('Ошибка при создании')
    } finally {
      setIsCreatingTask(false)
    }
  }

  const syncSheets = async () => {
    hapticFeedback('light')
    try {
      const res = await fetch(`${API_URL}/admin/sync-sheets`, {
        method: 'POST',
      })

      const data = await res.json()
      if (data.success) {
        hapticFeedback('success')
        showAlert('Синхронизация завершена!')
      }
    } catch (error) {
      hapticFeedback('error')
      showAlert('Ошибка синхронизации')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-dark-400">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold">⚙️ Админ-панель</h1>
        <p className="text-dark-400 text-sm">Управление курсом</p>
      </motion.div>

      {/* Табы */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2 bg-dark-800 p-1 rounded-xl overflow-x-auto"
      >
        {[
          { id: 'dashboard', label: 'Дашборд' },
          { id: 'participants', label: 'Участники' },
          { id: 'tasks', label: 'Задания' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white'
                : 'text-dark-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Дашборд */}
      {activeTab === 'dashboard' && dashboard && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Статистика */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card text-center">
              <p className="text-3xl font-bold text-primary-400">
                {dashboard.total_participants}
              </p>
              <p className="text-sm text-dark-400">Участников</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-accent-blue">
                {dashboard.active_today}
              </p>
              <p className="text-sm text-dark-400">Активны сегодня</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-accent-orange">
                {dashboard.average_weight_change.toFixed(1)} кг
              </p>
              <p className="text-sm text-dark-400">Ср. изменение</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-accent-purple">
                {dashboard.average_streak.toFixed(1)}
              </p>
              <p className="text-sm text-dark-400">Ср. streak</p>
            </div>
          </div>

          {/* Без чекина */}
          {dashboard.missing_checkin_today.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-3 text-red-400">
                ⚠️ Без чекина сегодня ({dashboard.missing_checkin_today.length})
              </h3>
              <div className="space-y-2">
                {dashboard.missing_checkin_today.slice(0, 5).map((user: any) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0"
                  >
                    <span>{user.first_name} {user.last_name}</span>
                    <button
                      onClick={() => sendReminder(user.id, user.first_name)}
                      className="text-xs text-primary-400"
                    >
                      Напомнить
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Действия */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={sendBroadcast}
              className="btn btn-secondary"
            >
              📢 Рассылка
            </button>
            <button
              onClick={syncSheets}
              className="btn btn-secondary"
            >
              📊 Синхронизация
            </button>
          </div>
        </motion.div>
      )}

      {/* Участники */}
      {activeTab === 'participants' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {participants.map((p) => (
            <div key={p.user.id} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {p.user.first_name} {p.user.last_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-dark-400">
                      {p.stats?.total_points || 0} очков
                    </span>
                    <span className="text-xs text-dark-400">
                      🔥 {p.stats?.current_streak || 0}
                    </span>
                    {p.weight_change !== null && (
                      <span
                        className={`text-xs ${
                          p.weight_change < 0 ? 'text-primary-400' : 'text-red-400'
                        }`}
                      >
                        {p.weight_change > 0 ? '+' : ''}{p.weight_change.toFixed(1)} кг
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {p.has_checkin_today ? (
                    <span className="text-primary-400">✓</span>
                  ) : (
                    <button
                      onClick={() => sendReminder(p.user.id, p.user.first_name)}
                      className="text-xs bg-dark-700 px-2 py-1 rounded"
                    >
                      Напомнить
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Задания */}
      {activeTab === 'tasks' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Форма создания */}
          <div className="card">
            <h3 className="font-semibold mb-3">Новое задание (неделя {courseWeek})</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Название задания..."
                className="input flex-1"
              />
              <button
                onClick={createTask}
                disabled={isCreatingTask || !newTaskTitle.trim()}
                className="btn btn-primary"
              >
                +
              </button>
            </div>
          </div>

          <p className="text-sm text-dark-400">
            Задания отображаются у участников после создания.
          </p>
        </motion.div>
      )}
    </div>
  )
}
