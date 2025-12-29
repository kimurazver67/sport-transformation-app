import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useTelegram } from '../hooks/useTelegram'
import CheckinForm from '../components/CheckinForm'
import StreakBadge from '../components/StreakBadge'

export default function HomePage() {
  const { user, stats, todayCheckin, courseWeek, fetchTodayCheckin } = useStore()
  const { hapticFeedback } = useTelegram()
  const [showCheckinForm, setShowCheckinForm] = useState(false)

  const handleCheckinComplete = () => {
    hapticFeedback('success')
    setShowCheckinForm(false)
    fetchTodayCheckin()
  }

  if (!user) return null

  return (
    <div className="space-y-4">
      {/* Приветствие */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">
            Привет, {user.first_name}! 👋
          </h1>
          <p className="text-dark-400 text-sm">
            Неделя {courseWeek} • Трансформация тела
          </p>
        </div>
        {stats && <StreakBadge streak={stats.current_streak} size="lg" />}
      </motion.div>

      {/* Статистика */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3"
      >
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-400">
            {stats?.total_points || 0}
          </p>
          <p className="text-xs text-dark-400">Очков</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-accent-orange">
            #{stats?.rank_overall || '-'}
          </p>
          <p className="text-xs text-dark-400">Место</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-accent-blue">
            {stats?.weekly_points || 0}
          </p>
          <p className="text-xs text-dark-400">За неделю</p>
        </div>
      </motion.div>

      {/* Чекин сегодня */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <AnimatePresence mode="wait">
          {showCheckinForm ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <button
                onClick={() => setShowCheckinForm(false)}
                className="text-dark-400 text-sm mb-2 flex items-center gap-1"
              >
                ← Отмена
              </button>
              <CheckinForm onComplete={handleCheckinComplete} />
            </motion.div>
          ) : todayCheckin ? (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card bg-gradient-to-br from-primary-900/50 to-dark-800 border-primary-700"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="text-primary-400">✅</span>
                  Чекин выполнен
                </h3>
                <button
                  onClick={() => setShowCheckinForm(true)}
                  className="text-xs text-dark-400 hover:text-white"
                >
                  Изменить
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2 text-center text-sm">
                <div>
                  <span className="text-xl block">
                    {todayCheckin.workout ? '💪' : '❌'}
                  </span>
                  <span className="text-xs text-dark-400">Тренировка</span>
                </div>
                <div>
                  <span className="text-xl block">
                    {todayCheckin.nutrition ? '🥗' : '❌'}
                  </span>
                  <span className="text-xs text-dark-400">Питание</span>
                </div>
                <div>
                  <span className="text-xl block">
                    {todayCheckin.water ? '💧' : '❌'}
                  </span>
                  <span className="text-xs text-dark-400">Вода</span>
                </div>
                <div>
                  <span className="text-xl block">
                    {todayCheckin.sleep_hours}ч
                  </span>
                  <span className="text-xs text-dark-400">Сон</span>
                </div>
                <div>
                  <span className="text-xl block">
                    {['😢', '😕', '😐', '🙂', '😃'][todayCheckin.mood - 1]}
                  </span>
                  <span className="text-xs text-dark-400">Настрой</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="button"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => {
                hapticFeedback('light')
                setShowCheckinForm(true)
              }}
              className="w-full card card-hover bg-gradient-to-br from-primary-600/20 to-dark-800 border-primary-500/30 animate-pulse-green"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-500/30 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">✍️</span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Ежедневный чекин</h3>
                    <p className="text-sm text-dark-400">
                      Отметь свой прогресс сегодня
                    </p>
                  </div>
                </div>
                <span className="text-primary-400 text-2xl">→</span>
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Быстрые действия */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 gap-3"
      >
        <Link to="/measurements" className="card card-hover">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-blue/20 rounded-xl flex items-center justify-center">
              <span className="text-xl">📏</span>
            </div>
            <div>
              <h4 className="font-medium text-sm">Замеры</h4>
              <p className="text-xs text-dark-400">Вес и обхваты</p>
            </div>
          </div>
        </Link>

        <Link to="/tasks" className="card card-hover">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-orange/20 rounded-xl flex items-center justify-center">
              <span className="text-xl">📋</span>
            </div>
            <div>
              <h4 className="font-medium text-sm">Задания</h4>
              <p className="text-xs text-dark-400">Неделя {courseWeek}</p>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Мотивация */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card bg-gradient-to-r from-primary-900/30 to-accent-purple/10 border-primary-700/30"
      >
        <p className="text-sm text-dark-200 italic">
          "Каждый день — это возможность стать лучшей версией себя."
        </p>
        <p className="text-xs text-dark-500 mt-2">— Мотивация дня</p>
      </motion.div>
    </div>
  )
}
