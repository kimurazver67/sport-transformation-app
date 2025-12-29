import { motion } from 'framer-motion'

interface StreakBadgeProps {
  streak: number
  size?: 'sm' | 'md' | 'lg'
}

export default function StreakBadge({ streak, size = 'md' }: StreakBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }

  const fireSize = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  }

  if (streak === 0) {
    return null
  }

  const isHot = streak >= 7
  const isFire = streak >= 14
  const isLegendary = streak >= 30

  return (
    <motion.div
      className={`
        inline-flex items-center gap-1 rounded-full font-semibold
        ${sizeClasses[size]}
        ${isLegendary
          ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/30'
          : isFire
          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
          : isHot
          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
          : 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
        }
      `}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      <motion.span
        className={fireSize[size]}
        animate={isHot ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        🔥
      </motion.span>
      <span>{streak}</span>
      {isLegendary && <span>🌟</span>}
    </motion.div>
  )
}
