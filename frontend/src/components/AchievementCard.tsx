import { motion } from 'framer-motion'
import type { Achievement, AchievementType } from '../../shared/types'
import { ACHIEVEMENTS_CONFIG } from '../../shared/types'

interface AchievementCardProps {
  achievement: Achievement
}

export default function AchievementCard({ achievement }: AchievementCardProps) {
  const config = ACHIEVEMENTS_CONFIG[achievement.achievement_type as AchievementType]

  if (!config) return null

  return (
    <motion.div
      className="card flex items-center gap-3"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
        <span className="text-2xl">{config.icon}</span>
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-white">{config.title}</h4>
        <p className="text-xs text-dark-400">{config.description}</p>
      </div>
      <div className="text-primary-500">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </motion.div>
  )
}

// Компонент для списка всех достижений (включая незаработанные)
export function AchievementsList({ unlockedAchievements }: { unlockedAchievements: Achievement[] }) {
  const allTypes: AchievementType[] = [
    'first_week',
    'iron_discipline',
    'minus_5kg',
    'progress_visible',
    'week_leader',
  ]

  const unlockedSet = new Set(unlockedAchievements.map((a) => a.achievement_type))

  return (
    <div className="space-y-3">
      {allTypes.map((type) => {
        const config = ACHIEVEMENTS_CONFIG[type]
        const isUnlocked = unlockedSet.has(type)

        return (
          <motion.div
            key={type}
            className={`card flex items-center gap-3 ${
              !isUnlocked ? 'opacity-50' : ''
            }`}
            whileHover={{ scale: 1.02 }}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isUnlocked ? 'bg-primary-500/20' : 'bg-dark-700'
              }`}
            >
              <span className="text-2xl">{config.icon}</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-white">{config.title}</h4>
              <p className="text-xs text-dark-400">{config.description}</p>
            </div>
            {isUnlocked ? (
              <div className="text-primary-500">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            ) : (
              <div className="text-dark-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
