import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTelegram } from '../hooks/useTelegram'
import { useStore } from '../store'
import { api } from '../services/api'

interface TaskData {
  id: string
  week_number: number
  title: string
  description?: string
  goal?: 'weight_loss' | 'muscle_gain' | null
  is_bonus?: boolean
}

interface ParticipantData {
  user: {
    id: string
    telegram_id: number
    first_name: string
    last_name?: string
    goal?: 'weight_loss' | 'muscle_gain' | null
    measurement_unlocked_until?: string | null
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

  // Задания
  const [tasks, setTasks] = useState<TaskData[]>([])
  const [selectedWeek, setSelectedWeek] = useState(courseWeek || 1)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskData | null>(null)
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    goal: null as 'weight_loss' | 'muscle_gain' | null,
    is_bonus: false,
  })
  const [isSavingTask, setIsSavingTask] = useState(false)

  // Модалка рассылки
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (activeTab === 'tasks') {
      fetchTasks()
    }
  }, [activeTab, selectedWeek])

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

  const fetchTasks = async () => {
    try {
      const data = await api.getAdminTasks(selectedWeek)
      setTasks(data)
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
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

  const openBroadcastModal = () => {
    setBroadcastMessage('')
    setShowBroadcastModal(true)
    hapticFeedback('light')
  }

  const sendBroadcast = async () => {
    if (!broadcastMessage.trim()) return

    const confirmed = await showConfirm('Отправить сообщение всем участникам?')
    if (!confirmed) return

    setIsSendingBroadcast(true)
    try {
      const result = await api.sendAdminBroadcast(broadcastMessage, 'participant')
      hapticFeedback('success')
      showAlert(`Отправлено: ${result.sent}, ошибок: ${result.failed}`)
      setShowBroadcastModal(false)
      setBroadcastMessage('')
    } catch (err) {
      hapticFeedback('error')
      showAlert('Ошибка при рассылке')
    } finally {
      setIsSendingBroadcast(false)
    }
  }

  const openTaskModal = (task?: TaskData) => {
    if (task) {
      setEditingTask(task)
      setTaskForm({
        title: task.title,
        description: task.description || '',
        goal: task.goal || null,
        is_bonus: task.is_bonus || false,
      })
    } else {
      setEditingTask(null)
      setTaskForm({
        title: '',
        description: '',
        goal: null,
        is_bonus: false,
      })
    }
    setShowTaskModal(true)
    hapticFeedback('light')
  }

  const saveTask = async () => {
    if (!taskForm.title.trim()) return

    setIsSavingTask(true)
    try {
      if (editingTask) {
        await api.updateAdminTask(editingTask.id, {
          title: taskForm.title,
          description: taskForm.description || undefined,
          goal: taskForm.goal,
          is_bonus: taskForm.is_bonus,
        })
        hapticFeedback('success')
        showAlert('Задание обновлено!')
      } else {
        await api.createAdminTask({
          week_number: selectedWeek,
          title: taskForm.title,
          description: taskForm.description || undefined,
          goal: taskForm.goal,
          is_bonus: taskForm.is_bonus,
        })
        hapticFeedback('success')
        showAlert('Задание создано!')
      }
      setShowTaskModal(false)
      fetchTasks()
    } catch (err) {
      hapticFeedback('error')
      showAlert('Ошибка при сохранении')
    } finally {
      setIsSavingTask(false)
    }
  }

  const deleteTask = async (task: TaskData) => {
    const confirmed = await showConfirm(`Удалить задание "${task.title}"?`)
    if (!confirmed) return

    try {
      await api.deleteAdminTask(task.id)
      hapticFeedback('success')
      fetchTasks()
    } catch (err) {
      hapticFeedback('error')
      showAlert('Ошибка при удалении')
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

  const unlockMeasurement = async (userId: string, userName: string) => {
    try {
      const result = await api.unlockMeasurement(userId, 24)
      hapticFeedback('success')
      const until = new Date(result.unlocked_until).toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
      showAlert(`Замеры открыты до ${until}`)
      fetchData() // Обновляем список
    } catch (err) {
      hapticFeedback('error')
      showAlert('Ошибка при открытии замеров')
    }
  }

  const lockMeasurement = async (userId: string, userName: string) => {
    try {
      await api.lockMeasurement(userId)
      hapticFeedback('success')
      showAlert('Замеры закрыты')
      fetchData()
    } catch (err) {
      hapticFeedback('error')
      const errorMsg = err instanceof Error ? err.message : 'Неизвестная ошибка'
      showAlert(`Ошибка при закрытии замеров: ${errorMsg}`)
      console.error('Lock measurement error:', err)
    }
  }

  // Проверка, активна ли разблокировка
  const isUnlocked = (unlockUntil?: string | null): boolean => {
    if (!unlockUntil) return false
    return new Date(unlockUntil) > new Date()
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
              onClick={openBroadcastModal}
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
                  <div className="flex items-center gap-2">
                    <p className="font-display font-bold text-steel-100">
                      {p.user.first_name} {p.user.last_name}
                    </p>
                    {p.user.goal && (
                      <span title={p.user.goal === 'weight_loss' ? 'Похудение' : 'Набор массы'}>
                        {p.user.goal === 'weight_loss' ? '🔥' : '💪'}
                      </span>
                    )}
                    {!p.user.goal && (
                      <span className="text-xs text-steel-500" title="Цель не выбрана">❓</span>
                    )}
                  </div>
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
                  {/* Кнопка разблокировки замеров */}
                  {isUnlocked(p.user.measurement_unlocked_until) ? (
                    <button
                      onClick={() => lockMeasurement(p.user.id, p.user.first_name)}
                      className="font-mono text-[10px] px-2 py-1 border border-neon-orange bg-neon-orange/20 text-neon-orange hover:bg-neon-orange hover:text-void transition-all"
                      title="Замеры открыты — нажми чтобы закрыть"
                    >
                      📏✓
                    </button>
                  ) : (
                    <button
                      onClick={() => unlockMeasurement(p.user.id, p.user.first_name)}
                      className="font-mono text-[10px] px-2 py-1 border border-steel-500 text-steel-500 hover:border-neon-orange hover:text-neon-orange transition-all"
                      title="Открыть замеры на 24ч"
                    >
                      📏
                    </button>
                  )}
                  {/* Статус чекина */}
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
          {/* Week Selector + Add Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="flex items-center gap-2 flex-1">
              <button
                onClick={() => setSelectedWeek(Math.max(1, selectedWeek - 1))}
                className="w-10 h-10 border-2 border-void-400 text-steel-300 hover:border-neon-lime hover:text-neon-lime transition-all font-mono"
              >
                ←
              </button>
              <div className="flex-1 text-center">
                <span className="font-mono text-xs text-steel-500 uppercase">Неделя</span>
                <div className="font-display text-2xl font-bold text-neon-lime">
                  {String(selectedWeek).padStart(2, '0')}
                </div>
              </div>
              <button
                onClick={() => setSelectedWeek(Math.min(16, selectedWeek + 1))}
                className="w-10 h-10 border-2 border-void-400 text-steel-300 hover:border-neon-lime hover:text-neon-lime transition-all font-mono"
              >
                →
              </button>
            </div>
            <button
              onClick={() => openTaskModal()}
              className="btn-brutal px-4 py-2 flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              <span className="hidden sm:inline">Добавить</span>
            </button>
          </motion.div>

          {/* Tasks List */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {tasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <div className="text-4xl mb-2">📋</div>
                  <p className="font-mono text-sm text-steel-500">
                    Нет заданий на эту неделю
                  </p>
                  <button
                    onClick={() => openTaskModal()}
                    className="mt-4 font-mono text-sm text-neon-lime hover:underline"
                  >
                    + Добавить первое задание
                  </button>
                </motion.div>
              ) : (
                tasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03 }}
                    className={`bg-void-200 border-2 p-4 ${
                      task.is_bonus
                        ? 'border-neon-orange'
                        : task.goal === 'weight_loss'
                        ? 'border-red-500'
                        : task.goal === 'muscle_gain'
                        ? 'border-blue-500'
                        : 'border-void-400'
                    }`}
                    style={{
                      boxShadow: task.is_bonus
                        ? '4px 4px 0 0 #FF6B00'
                        : task.goal === 'weight_loss'
                        ? '4px 4px 0 0 #EF4444'
                        : task.goal === 'muscle_gain'
                        ? '4px 4px 0 0 #3B82F6'
                        : '4px 4px 0 0 rgba(191, 255, 0, 0.2)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display font-bold text-steel-100 truncate">
                            {task.title}
                          </h3>
                          {task.is_bonus && (
                            <span className="px-2 py-0.5 bg-neon-orange/20 text-neon-orange text-[10px] font-mono uppercase">
                              Бонус
                            </span>
                          )}
                          {task.goal && (
                            <span className="text-lg" title={task.goal === 'weight_loss' ? 'Сушка' : 'Масса'}>
                              {task.goal === 'weight_loss' ? '🔥' : '💪'}
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className="font-mono text-xs text-steel-400 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openTaskModal(task)}
                          className="w-8 h-8 flex items-center justify-center border border-void-400 text-steel-400 hover:border-neon-cyan hover:text-neon-cyan transition-all"
                          title="Редактировать"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteTask(task)}
                          className="w-8 h-8 flex items-center justify-center border border-void-400 text-steel-400 hover:border-red-500 hover:text-red-500 transition-all"
                          title="Удалить"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Stats */}
          {tasks.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center gap-4 pt-2"
            >
              <span className="font-mono text-xs text-steel-500">
                Всего: <span className="text-neon-lime">{tasks.length}</span>
              </span>
              <span className="font-mono text-xs text-steel-500">
                🔥 {tasks.filter(t => t.goal === 'weight_loss').length}
              </span>
              <span className="font-mono text-xs text-steel-500">
                💪 {tasks.filter(t => t.goal === 'muscle_gain').length}
              </span>
              <span className="font-mono text-xs text-steel-500">
                Бонус: {tasks.filter(t => t.is_bonus).length}
              </span>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Task Modal */}
      <AnimatePresence>
        {showTaskModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-void/80 flex items-center justify-center p-4 z-50"
            onClick={() => setShowTaskModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-void-200 border-2 border-neon-lime p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
              style={{ boxShadow: '8px 8px 0 0 #BFFF00' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="font-mono text-xs text-steel-500 uppercase tracking-widest mb-4">
                {editingTask ? 'Редактировать задание' : 'Новое задание'} // Неделя_{String(selectedWeek).padStart(2, '0')}
              </div>

              {/* Title */}
              <div className="mb-4">
                <label className="font-mono text-xs text-steel-400 uppercase block mb-2">
                  Название *
                </label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="Название задания..."
                  className="input-brutal w-full"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="font-mono text-xs text-steel-400 uppercase block mb-2">
                  Описание
                </label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Подробное описание..."
                  rows={3}
                  className="input-brutal w-full resize-none"
                />
              </div>

              {/* Goal */}
              <div className="mb-4">
                <label className="font-mono text-xs text-steel-400 uppercase block mb-2">
                  Для кого
                </label>
                <div className="flex gap-2">
                  {[
                    { value: null, label: 'Все', emoji: '👥' },
                    { value: 'weight_loss' as const, label: 'Сушка', emoji: '🔥' },
                    { value: 'muscle_gain' as const, label: 'Масса', emoji: '💪' },
                  ].map((option) => (
                    <button
                      key={option.value || 'all'}
                      onClick={() => setTaskForm({ ...taskForm, goal: option.value })}
                      className={`flex-1 py-2 border-2 font-mono text-sm transition-all ${
                        taskForm.goal === option.value
                          ? 'border-neon-lime bg-neon-lime/10 text-neon-lime'
                          : 'border-void-400 text-steel-400 hover:border-steel-300'
                      }`}
                    >
                      {option.emoji} {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bonus */}
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    className={`w-6 h-6 border-2 flex items-center justify-center transition-all ${
                      taskForm.is_bonus
                        ? 'border-neon-orange bg-neon-orange text-void'
                        : 'border-void-400'
                    }`}
                    onClick={() => setTaskForm({ ...taskForm, is_bonus: !taskForm.is_bonus })}
                  >
                    {taskForm.is_bonus && '✓'}
                  </div>
                  <div>
                    <span className="font-mono text-sm text-steel-300">Бонусное задание</span>
                    <span className="font-mono text-xs text-steel-500 block">
                      Даёт x2 очков за выполнение
                    </span>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="btn-brutal-outline flex-1"
                  disabled={isSavingTask}
                >
                  Отмена
                </button>
                <button
                  onClick={saveTask}
                  className="btn-brutal flex-1"
                  disabled={isSavingTask || !taskForm.title.trim()}
                >
                  {isSavingTask ? '...' : editingTask ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-void/80 flex items-center justify-center p-4 z-50"
          onClick={() => setShowBroadcastModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-void-200 border-2 border-neon-lime p-6 w-full max-w-sm"
            style={{ boxShadow: '8px 8px 0 0 #BFFF00' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-mono text-xs text-steel-500 uppercase tracking-widest mb-3">
              Рассылка всем участникам
            </div>
            <textarea
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Введите сообщение..."
              rows={4}
              className="input-brutal w-full resize-none mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="btn-brutal-outline flex-1"
                disabled={isSendingBroadcast}
              >
                Отмена
              </button>
              <button
                onClick={sendBroadcast}
                className="btn-brutal flex-1"
                disabled={isSendingBroadcast || !broadcastMessage.trim()}
              >
                {isSendingBroadcast ? '...' : 'Отправить'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
