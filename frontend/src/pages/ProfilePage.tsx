import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { useTelegram } from '../hooks/useTelegram'
import StreakBadge from '../components/StreakBadge'
import { AchievementsList } from '../components/AchievementCard'
import ActivityCalendar from '../components/ActivityCalendar'

export default function ProfilePage() {
  const {
    user,
    telegramUser,
    stats,
    achievements,
    checkins,
    fetchAchievements,
    fetchCheckins,
  } = useStore()
  const { close } = useTelegram()

  useEffect(() => {
    fetchAchievements()
    fetchCheckins()
  }, [])

  if (!user || !telegramUser) return null

  return (
    <div className="space-y-4">
      {/* Профиль */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card flex items-center gap-4"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/30">
          <span className="text-2xl text-white font-bold">
            {user.first_name[0]}
          </span>
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold">
            {user.first_name} {user.last_name}
          </h1>
          {telegramUser.username && (
            <p className="text-dark-400 text-sm">@{telegramUser.username}</p>
          )}
          <div className="mt-1">
            <StreakBadge streak={stats?.current_streak || 0} />
          </div>
        </div>
      </motion.div>

      {/* Статистика */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="card text-center">
          <p className="text-3xl font-bold text-primary-400">
            {stats?.total_points || 0}
          </p>
          <p className="text-sm text-dark-400">Всего очков</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-accent-orange">
            #{stats?.rank_overall || '-'}
          </p>
          <p className="text-sm text-dark-400">Место в рейтинге</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-accent-blue">
            {stats?.max_streak || 0}
          </p>
          <p className="text-sm text-dark-400">Макс. streak</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-accent-purple">
            {checkins.length}
          </p>
          <p className="text-sm text-dark-400">Всего чекинов</p>
        </div>
      </motion.div>

      {/* Календарь активности */}
      {checkins.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ActivityCalendar checkins={checkins} />
        </motion.div>
      )}

      {/* Достижения */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-lg font-semibold mb-3">🏅 Достижения</h2>
        <AchievementsList unlockedAchievements={achievements} />
      </motion.div>

      {/* Закрыть приложение */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="pt-4"
      >
        <button
          onClick={close}
          className="w-full btn btn-secondary"
        >
          Закрыть приложение
        </button>
      </motion.div>
    </div>
  )
}
