import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { useTelegram } from '../hooks/useTelegram'
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

  const statCards = [
    { label: 'Total_XP', value: stats?.total_points || 0, color: 'neon-lime' },
    { label: 'Rank', value: `#${stats?.rank_overall || '-'}`, color: 'neon-cyan' },
    { label: 'Max_Streak', value: stats?.max_streak || 0, color: 'neon-magenta' },
    { label: 'Checkins', value: checkins.length, color: 'neon-orange' },
  ]

  return (
    <div className="min-h-screen pb-24 px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="blob -top-32 -left-32 opacity-10" />
      <div className="blob -bottom-32 -right-32 opacity-10" style={{ animationDelay: '-4s' }} />

      {/* Profile Header */}
      <motion.header
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-6 pb-6"
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-20 h-20 border-2 border-neon-lime bg-neon-lime/10 flex items-center justify-center relative"
            style={{ boxShadow: '6px 6px 0 0 #BFFF00' }}
          >
            <span className="font-display text-3xl font-bold text-neon-lime">
              {user.first_name[0]}
            </span>
            {stats && stats.current_streak > 0 && (
              <motion.div
                className="absolute -top-2 -right-2 text-2xl"
                animate={{ y: [0, -3, 0], rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                🔥
              </motion.div>
            )}
          </motion.div>

          {/* Info */}
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="font-mono text-xs text-steel-500 uppercase tracking-widest mb-1">
                Athlete_Profile
              </div>
              <h1 className="font-display text-2xl font-bold text-steel-100 uppercase">
                {user.first_name} {user.last_name}
              </h1>
              {telegramUser.username && (
                <p className="font-mono text-xs text-neon-cyan">@{telegramUser.username}</p>
              )}
            </motion.div>

            {/* Streak Badge */}
            {stats && stats.current_streak > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-2 inline-flex items-center gap-2 px-3 py-1 border border-neon-orange bg-neon-orange/10"
              >
                <span className="text-sm">🔥</span>
                <span className="font-mono text-xs font-bold text-neon-orange">
                  {stats.current_streak} DAY STREAK
                </span>
              </motion.div>
            )}
          </div>
        </div>
      </motion.header>

      {/* Stats Grid */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <div className="font-mono text-xs text-steel-500 uppercase tracking-widest mb-3">
          Statistics_Overview
        </div>
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className={`p-4 border-2 border-${stat.color} bg-${stat.color}/5 relative`}
              style={{ boxShadow: `4px 4px 0 0 var(--${stat.color})` }}
            >
              <div className="font-mono text-[10px] text-steel-500 uppercase tracking-wider mb-1">
                {stat.label}
              </div>
              <div className={`font-display text-3xl font-bold text-${stat.color}`}>
                {stat.value}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Activity Calendar */}
      {checkins.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <ActivityCalendar checkins={checkins} />
        </motion.section>
      )}

      {/* Achievements */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🏅</span>
          <h2 className="font-display text-lg font-bold text-steel-100 uppercase">
            Achievements
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-neon-lime/50 to-transparent ml-2" />
        </div>
        <AchievementsList unlockedAchievements={achievements} />
      </motion.section>

      {/* Close Button */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <button
          onClick={close}
          className="w-full py-4 border-2 border-void-400 bg-void-200 font-mono text-sm font-bold text-steel-400 uppercase tracking-wider hover:border-neon-lime hover:text-neon-lime transition-all"
        >
          [ Close_App ]
        </button>
      </motion.section>
    </div>
  )
}
