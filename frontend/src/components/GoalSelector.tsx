import { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { useTelegram } from '../hooks/useTelegram'
import type { UserGoal } from '../types'

interface GoalOption {
  value: UserGoal
  title: string
  description: string
  icon: string
  color: string
  shadowColor: string
}

const GOAL_OPTIONS: GoalOption[] = [
  {
    value: 'weight_loss',
    title: 'Похудение',
    description: 'Снижение веса и жировой массы',
    icon: '🔥',
    color: 'neon-orange',
    shadowColor: '#FF6B00',
  },
  {
    value: 'muscle_gain',
    title: 'Набор массы',
    description: 'Набор мышечной массы и силы',
    icon: '💪',
    color: 'neon-lime',
    shadowColor: '#BFFF00',
  },
]

export default function GoalSelector() {
  const { setUserGoal } = useStore()
  const { hapticFeedback } = useTelegram()
  const [selectedGoal, setSelectedGoal] = useState<UserGoal | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSelectGoal = (goal: UserGoal) => {
    hapticFeedback('light')
    setSelectedGoal(goal)
  }

  const handleConfirm = async () => {
    if (!selectedGoal) return

    setIsSubmitting(true)
    try {
      await setUserGoal(selectedGoal)
      hapticFeedback('success')
    } catch (error) {
      console.error('Failed to set goal:', error)
      hapticFeedback('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-2 border-neon-cyan bg-void-200 p-4"
      style={{ boxShadow: '4px 4px 0 0 #00F5FF' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🎯</span>
        <h2 className="font-display font-bold text-steel-100 uppercase">
          Выбери_цель
        </h2>
      </div>

      <p className="font-mono text-xs text-steel-400 mb-4">
        Это определит, как будет отслеживаться твой прогресс на курсе.
      </p>

      <div className="space-y-3 mb-4">
        {GOAL_OPTIONS.map((option) => {
          const isSelected = selectedGoal === option.value
          return (
            <motion.button
              key={option.value}
              onClick={() => handleSelectGoal(option.value)}
              whileTap={{ scale: 0.98 }}
              className={`w-full p-4 border-2 text-left transition-all ${
                isSelected
                  ? `border-${option.color} bg-${option.color}/10`
                  : 'border-void-400 bg-void-300 hover:border-steel-500'
              }`}
              style={{
                boxShadow: isSelected ? `4px 4px 0 0 ${option.shadowColor}` : '4px 4px 0 0 #333',
              }}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{option.icon}</span>
                <div className="flex-1">
                  <h3 className={`font-display font-bold uppercase ${
                    isSelected ? `text-${option.color}` : 'text-steel-100'
                  }`}>
                    {option.title}
                  </h3>
                  <p className="font-mono text-xs text-steel-400 mt-1">
                    {option.description}
                  </p>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`w-6 h-6 flex items-center justify-center border-2 border-${option.color}`}
                  >
                    <span className={`text-${option.color}`}>✓</span>
                  </motion.div>
                )}
              </div>
            </motion.button>
          )
        })}
      </div>

      <button
        onClick={handleConfirm}
        disabled={!selectedGoal || isSubmitting}
        className={`w-full py-3 font-mono font-bold uppercase text-sm transition-all ${
          selectedGoal
            ? 'bg-neon-cyan text-void-100 hover:bg-neon-cyan/90'
            : 'bg-void-400 text-steel-500 cursor-not-allowed'
        }`}
        style={{
          boxShadow: selectedGoal ? '4px 4px 0 0 #00F5FF' : '4px 4px 0 0 #333',
        }}
      >
        {isSubmitting ? 'Сохранение...' : 'Подтвердить выбор'}
      </button>

      <p className="font-mono text-[10px] text-steel-500 text-center mt-3">
        Цель можно будет изменить позже в настройках
      </p>
    </motion.div>
  )
}
