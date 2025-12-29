import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'

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

  const podiumColors = [
    { border: 'border-yellow-400', bg: 'bg-yellow-400/10', text: 'text-yellow-400' },
    { border: 'border-steel-400', bg: 'bg-steel-400/10', text: 'text-steel-400' },
    { border: 'border-orange-600', bg: 'bg-orange-600/10', text: 'text-orange-600' },
  ]

  return (
    <div className="min-h-screen pb-24 px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="blob -top-32 -right-32 opacity-10" />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-6 pb-4"
      >
        <div className="font-mono text-xs text-steel-500 uppercase tracking-widest mb-1">
          Competition_Mode
        </div>
        <h1 className="font-display text-3xl font-bold text-steel-100 uppercase tracking-wider">
          Leaderboard
        </h1>
      </motion.header>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex mb-6 border-2 border-void-400 p-1"
      >
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-3 px-4 font-mono text-sm font-bold uppercase tracking-wider transition-all relative ${
            activeTab === 'all'
              ? 'text-void bg-neon-lime'
              : 'text-steel-400 hover:text-steel-200'
          }`}
        >
          All_Time
        </button>
        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex-1 py-3 px-4 font-mono text-sm font-bold uppercase tracking-wider transition-all relative ${
            activeTab === 'weekly'
              ? 'text-void bg-neon-cyan'
              : 'text-steel-400 hover:text-steel-200'
          }`}
        >
          This_Week
        </button>
      </motion.div>

      {/* Top 3 Podium */}
      <AnimatePresence mode="wait">
        {data.length >= 3 && (
          <motion.div
            key={activeTab + '-podium'}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex justify-center items-end gap-3 mb-8 h-48"
          >
            {/* 2nd Place */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className={`w-16 h-16 ${podiumColors[1].border} border-2 ${podiumColors[1].bg} flex items-center justify-center mb-2 relative`}>
                <span className="text-2xl">🥈</span>
                <motion.div
                  className="absolute -top-1 -right-1 w-6 h-6 bg-void-200 border border-steel-400 flex items-center justify-center font-mono text-xs font-bold text-steel-300"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  2
                </motion.div>
              </div>
              <p className="font-display text-sm font-bold text-steel-200 text-center max-w-[80px] truncate">
                {data[1]?.user.first_name}
              </p>
              <p className={`font-mono text-xs ${podiumColors[1].text}`}>
                {activeTab === 'all' ? data[1]?.total_points : data[1]?.weekly_points} XP
              </p>
              <div className={`w-16 h-20 ${podiumColors[1].border} border-2 ${podiumColors[1].bg} mt-2`} />
            </motion.div>

            {/* 1st Place */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center -mt-8"
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`w-20 h-20 ${podiumColors[0].border} border-2 ${podiumColors[0].bg} flex items-center justify-center mb-2 relative`}
                style={{ boxShadow: '0 0 30px rgba(255, 215, 0, 0.25)' }}
              >
                <span className="text-3xl">👑</span>
                <motion.div
                  className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 flex items-center justify-center font-mono text-xs font-bold text-void"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  1
                </motion.div>
              </motion.div>
              <p className="font-display text-base font-bold text-yellow-400 text-center max-w-[90px] truncate">
                {data[0]?.user.first_name}
              </p>
              <p className="font-mono text-sm text-yellow-400 font-bold">
                {activeTab === 'all' ? data[0]?.total_points : data[0]?.weekly_points} XP
              </p>
              <div className={`w-20 h-28 ${podiumColors[0].border} border-2 ${podiumColors[0].bg} mt-2`} />
            </motion.div>

            {/* 3rd Place */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center"
            >
              <div className={`w-16 h-16 ${podiumColors[2].border} border-2 ${podiumColors[2].bg} flex items-center justify-center mb-2 relative`}>
                <span className="text-2xl">🥉</span>
                <motion.div
                  className="absolute -top-1 -right-1 w-6 h-6 bg-void-200 border border-orange-600 flex items-center justify-center font-mono text-xs font-bold text-orange-400"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  3
                </motion.div>
              </div>
              <p className="font-display text-sm font-bold text-steel-200 text-center max-w-[80px] truncate">
                {data[2]?.user.first_name}
              </p>
              <p className={`font-mono text-xs ${podiumColors[2].text}`}>
                {activeTab === 'all' ? data[2]?.total_points : data[2]?.weekly_points} XP
              </p>
              <div className={`w-16 h-16 ${podiumColors[2].border} border-2 ${podiumColors[2].bg} mt-2`} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leaderboard List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-2"
      >
        <div className="font-mono text-xs text-steel-500 uppercase tracking-widest mb-3">
          Rankings_List
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-2"
          >
            {data.map((entry, index) => {
              const isCurrentUser = entry.user_id === user?.id
              const points = activeTab === 'all' ? entry.total_points : entry.weekly_points
              const isTop3 = index < 3

              return (
                <motion.div
                  key={entry.user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className={`p-4 border-2 transition-all relative overflow-hidden ${
                    isCurrentUser
                      ? 'border-neon-lime bg-neon-lime/5'
                      : 'border-void-400 bg-void-200'
                  }`}
                  style={{
                    boxShadow: isCurrentUser ? '4px 4px 0 0 #BFFF00' : 'none'
                  }}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="w-10 text-center">
                      {isTop3 ? (
                        <span className="text-xl">
                          {['🥇', '🥈', '🥉'][index]}
                        </span>
                      ) : (
                        <span className="font-display text-xl font-bold text-steel-500">
                          {index + 1}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className={`w-12 h-12 border-2 flex items-center justify-center relative ${
                      isCurrentUser ? 'border-neon-lime bg-neon-lime/20' : 'border-void-400 bg-void-300'
                    }`}>
                      <span className={`font-display text-lg font-bold ${
                        isCurrentUser ? 'text-neon-lime' : 'text-steel-300'
                      }`}>
                        {entry.user.first_name[0]}
                      </span>
                      {entry.current_streak >= 7 && (
                        <motion.div
                          className="absolute -top-1 -right-1"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                        >
                          🔥
                        </motion.div>
                      )}
                    </div>

                    {/* Name & Streak */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-display font-bold uppercase ${
                          isCurrentUser ? 'text-neon-lime' : 'text-steel-100'
                        }`}>
                          {entry.user.first_name}
                          {entry.user.last_name ? ` ${entry.user.last_name[0]}.` : ''}
                        </span>
                        {isCurrentUser && (
                          <span className="font-mono text-[10px] text-neon-lime border border-neon-lime px-1">
                            YOU
                          </span>
                        )}
                      </div>
                      {entry.current_streak > 0 && (
                        <div className="font-mono text-[10px] text-steel-500 flex items-center gap-1">
                          <span>🔥</span>
                          <span>{entry.current_streak} DAY STREAK</span>
                        </div>
                      )}
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <p className={`font-display text-xl font-bold ${
                        isCurrentUser ? 'text-neon-lime' : activeTab === 'weekly' ? 'text-neon-cyan' : 'text-steel-100'
                      }`}>
                        {points}
                      </p>
                      <p className="font-mono text-[10px] text-steel-500 uppercase">XP</p>
                    </div>
                  </div>

                  {/* Current user indicator */}
                  {isCurrentUser && (
                    <motion.div
                      className="absolute left-0 top-0 bottom-0 w-1 bg-neon-lime"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        </AnimatePresence>

        {data.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-2 border-void-400 p-8 text-center"
          >
            <span className="text-4xl block mb-3">🏆</span>
            <p className="font-mono text-sm text-steel-500">NO_DATA_AVAILABLE</p>
            <p className="font-mono text-xs text-steel-600 mt-1">Be the first to compete!</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
