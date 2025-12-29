import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import StreakBadge from '../components/StreakBadge'

type TabType = 'all' | 'weekly'

export default function LeaderboardPage() {
  const {
    user,
    leaderboard,
    weeklyLeaderboard,
    fetchLeaderboard,
    fetchWeeklyLeaderboard,
  } = useStore()

  const [activeTab, setActiveTab] = useState<TabType>('all')

  useEffect(() => {
    fetchLeaderboard()
    fetchWeeklyLeaderboard()
  }, [])

  const data = activeTab === 'all' ? leaderboard : weeklyLeaderboard
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold">🏆 Рейтинг</h1>
        <p className="text-dark-400 text-sm">Соревнуйся с участниками курса</p>
      </motion.div>

      {/* Табы */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2 bg-dark-800 p-1 rounded-xl"
      >
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-primary-500 text-white'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          Общий
        </button>
        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'weekly'
              ? 'bg-primary-500 text-white'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          За неделю
        </button>
      </motion.div>

      {/* Топ-3 */}
      {data.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center items-end gap-3 py-4"
        >
          {/* 2 место */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mb-2 border-2 border-gray-400">
              <span className="text-2xl">🥈</span>
            </div>
            <p className="text-sm font-medium text-center max-w-[80px] truncate">
              {data[1]?.user.first_name}
            </p>
            <p className="text-xs text-dark-400">
              {activeTab === 'all' ? data[1]?.total_points : data[1]?.weekly_points}
            </p>
          </div>

          {/* 1 место */}
          <div className="flex flex-col items-center -mt-4">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mb-2 shadow-lg shadow-yellow-500/30">
              <span className="text-3xl">🥇</span>
            </div>
            <p className="text-sm font-semibold text-center max-w-[80px] truncate">
              {data[0]?.user.first_name}
            </p>
            <p className="text-xs text-primary-400 font-medium">
              {activeTab === 'all' ? data[0]?.total_points : data[0]?.weekly_points}
            </p>
          </div>

          {/* 3 место */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mb-2 border-2 border-orange-700">
              <span className="text-2xl">🥉</span>
            </div>
            <p className="text-sm font-medium text-center max-w-[80px] truncate">
              {data[2]?.user.first_name}
            </p>
            <p className="text-xs text-dark-400">
              {activeTab === 'all' ? data[2]?.total_points : data[2]?.weekly_points}
            </p>
          </div>
        </motion.div>
      )}

      {/* Список участников */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        {data.map((entry, index) => {
          const isCurrentUser = entry.user_id === user?.id
          const points = activeTab === 'all' ? entry.total_points : entry.weekly_points

          return (
            <motion.div
              key={entry.user_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * index }}
              className={`card flex items-center gap-3 ${
                isCurrentUser
                  ? 'bg-primary-500/10 border-primary-500/50'
                  : ''
              }`}
            >
              {/* Позиция */}
              <div className="w-8 text-center">
                {index < 3 ? (
                  <span className="text-xl">{medals[index]}</span>
                ) : (
                  <span className="text-dark-400 font-medium">{index + 1}</span>
                )}
              </div>

              {/* Аватар */}
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {entry.user.first_name[0]}
                </span>
              </div>

              {/* Имя и streak */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${isCurrentUser ? 'text-primary-400' : ''}`}>
                    {entry.user.first_name}
                    {entry.user.last_name ? ` ${entry.user.last_name[0]}.` : ''}
                  </span>
                  {isCurrentUser && (
                    <span className="text-xs text-primary-400">(вы)</span>
                  )}
                </div>
                <StreakBadge streak={entry.current_streak} size="sm" />
              </div>

              {/* Очки */}
              <div className="text-right">
                <p className="font-semibold text-primary-400">{points}</p>
                <p className="text-xs text-dark-400">очков</p>
              </div>
            </motion.div>
          )
        })}

        {data.length === 0 && (
          <div className="card text-center text-dark-400 py-8">
            Рейтинг пока пуст
          </div>
        )}
      </motion.div>
    </div>
  )
}
