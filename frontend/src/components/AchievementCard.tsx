import { motion } from 'framer-motion'
import type { Achievement, AchievementType } from '../types'
import { ACHIEVEMENTS_CONFIG } from '../types'

interface AchievementCardProps {
  achievement: Achievement
}

export default function AchievementCard({ achievement }: AchievementCardProps) {
  const config = ACHIEVEMENTS_CONFIG[achievement.achievement_type as AchievementType]

  if (!config) return null

  return (
    <motion.div
      className="p-4 border-2 border-neon-lime bg-neon-lime/5 flex items-center gap-4"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ x: 4 }}
      style={{ boxShadow: '4px 4px 0 0 #BFFF00' }}
    >
      <div className="w-14 h-14 border-2 border-neon-lime bg-neon-lime/10 flex items-center justify-center">
        <span className="text-2xl">{config.icon}</span>
      </div>
      <div className="flex-1">
        <h4 className="font-display font-bold text-steel-100 uppercase">{config.title}</h4>
        <p className="font-mono text-[10px] text-steel-500 mt-1">{config.description}</p>
      </div>
      <motion.div
        className="text-neon-lime"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      </motion.div>
    </motion.div>
  )
}

// Achievement list component with locked/unlocked states
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
      {allTypes.map((type, index) => {
        const config = ACHIEVEMENTS_CONFIG[type]
        const isUnlocked = unlockedSet.has(type)

        return (
          <motion.div
            key={type}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-4 border-2 flex items-center gap-4 transition-all ${
              isUnlocked
                ? 'border-neon-lime bg-neon-lime/5'
                : 'border-void-400 bg-void-200 opacity-50'
            }`}
            style={{
              boxShadow: isUnlocked ? '4px 4px 0 0 #BFFF00' : 'none'
            }}
            whileHover={isUnlocked ? { x: 4 } : {}}
          >
            <div className={`w-12 h-12 border-2 flex items-center justify-center ${
              isUnlocked
                ? 'border-neon-lime bg-neon-lime/10'
                : 'border-void-400 bg-void-300'
            }`}>
              <span className={`text-xl ${!isUnlocked ? 'grayscale' : ''}`}>
                {config.icon}
              </span>
            </div>
            <div className="flex-1">
              <h4 className={`font-display font-bold uppercase ${
                isUnlocked ? 'text-steel-100' : 'text-steel-500'
              }`}>
                {config.title}
              </h4>
              <p className="font-mono text-[10px] text-steel-500 mt-1">
                {config.description}
              </p>
            </div>
            {isUnlocked ? (
              <motion.div
                className="text-neon-lime"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </motion.div>
            ) : (
              <div className="text-steel-600">
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
