import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useTelegram } from '../hooks/useTelegram'
import type { UserGoal } from '../types'

interface OnboardingData {
  goal?: UserGoal
  height?: number
  age?: number
  target_weight?: number
}

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

const HEIGHT_OPTIONS = [155, 160, 165, 170, 175, 180, 185, 190]
const AGE_OPTIONS = [18, 25, 30, 35, 40, 45, 50, 55]

export default function OnboardingFlow() {
  const { updateOnboarding, user } = useStore()
  const { hapticFeedback } = useTelegram()
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [data, setData] = useState<OnboardingData>({
    goal: user?.goal || undefined,
    height: user?.height || undefined,
    age: user?.age || undefined,
    target_weight: user?.target_weight || undefined,
  })

  const steps = [
    { key: 'goal', title: 'ЦЕЛЬ', icon: '🎯' },
    { key: 'height', title: 'РОСТ', icon: '📏' },
    { key: 'age', title: 'ВОЗРАСТ', icon: '🎂' },
    { key: 'target', title: 'ЦЕЛЕВОЙ ВЕС', icon: '⚖️' },
  ]

  const handleGoalSelect = (goal: UserGoal) => {
    hapticFeedback('light')
    setData({ ...data, goal })
    setStep(1)
  }

  const handleHeightSelect = (height: number) => {
    hapticFeedback('light')
    setData({ ...data, height })
    setStep(2)
  }

  const handleAgeSelect = (age: number) => {
    hapticFeedback('light')
    setData({ ...data, age })
    setStep(3)
  }

  const handleTargetWeightSubmit = async (targetWeight: number) => {
    hapticFeedback('medium')
    setIsSubmitting(true)

    try {
      await updateOnboarding({
        goal: data.goal,
        height: data.height,
        age: data.age,
        target_weight: targetWeight,
      })
      hapticFeedback('success')
    } catch (error) {
      console.error('Failed to save onboarding:', error)
      hapticFeedback('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = async () => {
    hapticFeedback('light')
    setIsSubmitting(true)

    try {
      await updateOnboarding({
        goal: data.goal,
        height: data.height,
        age: data.age,
      })
      hapticFeedback('success')
    } catch (error) {
      console.error('Failed to save onboarding:', error)
      hapticFeedback('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const goBack = () => {
    if (step > 0) {
      hapticFeedback('light')
      setStep(step - 1)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-2 border-neon-cyan bg-void-200 p-4"
      style={{ boxShadow: '4px 4px 0 0 #00F5FF' }}
    >
      {/* Progress */}
      <div className="flex gap-1 mb-4">
        {steps.map((s, i) => (
          <div
            key={s.key}
            className={`flex-1 h-1 ${i <= step ? 'bg-neon-cyan' : 'bg-void-400'}`}
          />
        ))}
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{steps[step].icon}</span>
          <span className="font-mono text-xs text-steel-500 uppercase tracking-wider">
            Шаг_{step + 1}/4 // {steps[step].title}
          </span>
        </div>
        {step > 0 && (
          <button
            onClick={goBack}
            className="font-mono text-xs text-steel-400 hover:text-neon-lime transition-colors"
          >
            [НАЗАД]
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Goal */}
        {step === 0 && (
          <motion.div
            key="goal"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="font-display font-bold text-steel-100 uppercase mb-2">
              Выбери_цель
            </h2>
            <p className="font-mono text-xs text-steel-400 mb-4">
              Это определит программу тренировок и питания
            </p>
            <div className="space-y-3">
              {GOAL_OPTIONS.map((option) => (
                <motion.button
                  key={option.value}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleGoalSelect(option.value)}
                  className={`w-full p-4 border-2 text-left transition-all ${
                    data.goal === option.value
                      ? `border-${option.color} bg-${option.color}/10`
                      : 'border-void-400 bg-void-300 hover:border-steel-500'
                  }`}
                  style={{
                    boxShadow: data.goal === option.value ? `4px 4px 0 0 ${option.shadowColor}` : '4px 4px 0 0 #333',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{option.icon}</span>
                    <div>
                      <h3 className={`font-display font-bold uppercase ${
                        data.goal === option.value ? `text-${option.color}` : 'text-steel-100'
                      }`}>
                        {option.title}
                      </h3>
                      <p className="font-mono text-xs text-steel-400">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Height */}
        {step === 1 && (
          <motion.div
            key="height"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="font-display font-bold text-steel-100 uppercase mb-2">
              Твой_рост
            </h2>
            <p className="font-mono text-xs text-steel-400 mb-4">
              Нужен для расчёта показателей
            </p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {HEIGHT_OPTIONS.map((height) => (
                <motion.button
                  key={height}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleHeightSelect(height)}
                  className={`p-3 text-center border-2 transition-all ${
                    data.height === height
                      ? 'border-neon-cyan bg-neon-cyan/10'
                      : 'border-void-400 bg-void-300 hover:border-steel-500'
                  }`}
                >
                  <span className="font-display text-lg font-bold text-steel-100">{height}</span>
                  <span className="font-mono text-[9px] text-steel-500 block">СМ</span>
                </motion.button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Другой рост..."
                min={100}
                max={250}
                className="flex-1 bg-void-300 border-2 border-void-400 px-3 py-2 font-mono text-sm text-steel-100 focus:border-neon-cyan outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = parseInt((e.target as HTMLInputElement).value)
                    if (value >= 100 && value <= 250) {
                      handleHeightSelect(value)
                    }
                  }
                }}
              />
            </div>
          </motion.div>
        )}

        {/* Step 3: Age */}
        {step === 2 && (
          <motion.div
            key="age"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="font-display font-bold text-steel-100 uppercase mb-2">
              Твой_возраст
            </h2>
            <p className="font-mono text-xs text-steel-400 mb-4">
              Для персонализации программы
            </p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {AGE_OPTIONS.map((age) => (
                <motion.button
                  key={age}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAgeSelect(age)}
                  className={`p-3 text-center border-2 transition-all ${
                    data.age === age
                      ? 'border-neon-magenta bg-neon-magenta/10'
                      : 'border-void-400 bg-void-300 hover:border-steel-500'
                  }`}
                >
                  <span className="font-display text-lg font-bold text-steel-100">{age}</span>
                  <span className="font-mono text-[9px] text-steel-500 block">ЛЕТ</span>
                </motion.button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Другой возраст..."
                min={14}
                max={100}
                className="flex-1 bg-void-300 border-2 border-void-400 px-3 py-2 font-mono text-sm text-steel-100 focus:border-neon-magenta outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = parseInt((e.target as HTMLInputElement).value)
                    if (value >= 14 && value <= 100) {
                      handleAgeSelect(value)
                    }
                  }
                }}
              />
            </div>
          </motion.div>
        )}

        {/* Step 4: Target Weight */}
        {step === 3 && (
          <motion.div
            key="target"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="font-display font-bold text-steel-100 uppercase mb-2">
              Целевой_вес
            </h2>
            <p className="font-mono text-xs text-steel-400 mb-4">
              К какому весу стремишься? (опционально)
            </p>
            <div className="space-y-4">
              <input
                type="number"
                placeholder="Введи целевой вес в кг..."
                min={30}
                max={200}
                step={0.1}
                defaultValue={data.target_weight}
                className="w-full bg-void-300 border-2 border-void-400 px-4 py-3 font-mono text-lg text-steel-100 focus:border-neon-lime outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSubmitting) {
                    const value = parseFloat((e.target as HTMLInputElement).value)
                    if (value > 0 && value < 500) {
                      handleTargetWeightSubmit(value)
                    }
                  }
                }}
                id="target-weight-input"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="flex-1 py-3 font-mono text-sm text-steel-400 border-2 border-void-400 hover:border-steel-500 transition-all disabled:opacity-50"
                >
                  ПРОПУСТИТЬ
                </button>
                <button
                  onClick={() => {
                    const input = document.getElementById('target-weight-input') as HTMLInputElement
                    const value = parseFloat(input.value)
                    if (value > 0 && value < 500) {
                      handleTargetWeightSubmit(value)
                    }
                  }}
                  disabled={isSubmitting}
                  className="flex-1 py-3 font-mono font-bold text-sm bg-neon-lime text-void-100 hover:bg-neon-lime/90 transition-all disabled:opacity-50"
                  style={{ boxShadow: '4px 4px 0 0 #9FCC00' }}
                >
                  {isSubmitting ? 'СОХРАНЕНИЕ...' : 'ГОТОВО'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
