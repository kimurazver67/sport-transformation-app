import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTelegram } from '../hooks/useTelegram'
import { useStore } from '../store'
import type { CheckinForm as CheckinFormData, WorkoutType, MoodLevel } from '../types'

interface CheckinFormProps {
  onComplete?: () => void
}

const workoutOptions: { type: WorkoutType | 'skip'; label: string; icon: string; color: string }[] = [
  { type: 'strength', label: 'СИЛОВАЯ', icon: '💪', color: 'neon-lime' },
  { type: 'cardio', label: 'КАРДИО', icon: '🏃', color: 'neon-cyan' },
  { type: 'rest', label: 'ОТДЫХ', icon: '😴', color: 'neon-magenta' },
  { type: 'skip', label: 'ПРОПУСК', icon: '❌', color: 'neon-orange' },
]

const moodOptions: { value: MoodLevel; emoji: string; label: string }[] = [
  { value: 1, emoji: '😢', label: 'ПЛОХО' },
  { value: 2, emoji: '😕', label: 'ТАК' },
  { value: 3, emoji: '😐', label: 'ОК' },
  { value: 4, emoji: '🙂', label: 'ХОРОШО' },
  { value: 5, emoji: '😃', label: 'СУПЕР' },
]

const sleepOptions = [5, 6, 7, 8, 9, 10]

export default function CheckinForm({ onComplete }: CheckinFormProps) {
  const { hapticFeedback } = useTelegram()
  const { submitCheckin, todayCheckin } = useStore()

  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Partial<CheckinFormData>>({
    workout: todayCheckin?.workout ?? undefined,
    workout_type: todayCheckin?.workout_type ?? undefined,
    nutrition: todayCheckin?.nutrition ?? undefined,
    water: todayCheckin?.water ?? undefined,
    sleep_hours: todayCheckin?.sleep_hours ?? 7,
    mood: todayCheckin?.mood ?? undefined,
    steps: todayCheckin?.steps ?? undefined,
  })

  const formSteps = [
    { key: 'workout', title: 'ТРЕНИРОВКА', icon: '💪' },
    { key: 'nutrition', title: 'ПИТАНИЕ', icon: '🥗' },
    { key: 'water', title: 'ВОДА', icon: '💧' },
    { key: 'sleep', title: 'СОН', icon: '😴' },
    { key: 'steps', title: 'ШАГИ', icon: '👟' },
    { key: 'mood', title: 'НАСТРОЕНИЕ', icon: '🎭' },
  ]

  const handleWorkout = (type: WorkoutType | 'skip') => {
    hapticFeedback('light')
    setFormData({
      ...formData,
      workout: type !== 'skip',
      workout_type: type !== 'skip' ? type : undefined,
    })
    setStep(1)
  }

  const handleYesNo = (field: 'nutrition' | 'water', value: boolean) => {
    hapticFeedback('light')
    setFormData({ ...formData, [field]: value })
    setStep(step + 1)
  }

  const handleSleep = (hours: number) => {
    hapticFeedback('light')
    setFormData({ ...formData, sleep_hours: hours })
    setStep(4) // переход к шагам
  }

  const handleSteps = (stepsCount: number | undefined) => {
    hapticFeedback('light')
    setFormData({ ...formData, steps: stepsCount })
    setStep(5) // переход к настроению
  }

  const handleMood = async (mood: MoodLevel) => {
    hapticFeedback('medium')
    const data = { ...formData, mood } as CheckinFormData

    setIsSubmitting(true)
    try {
      await submitCheckin(data)
      hapticFeedback('success')
      onComplete?.()
    } catch (error) {
      console.error('Failed to submit checkin:', error)
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
    <div>
      {/* Progress Bar - Brutal Style */}
      <div className="flex gap-1 mb-6">
        {formSteps.map((s, i) => (
          <motion.div
            key={s.key}
            className="flex-1 h-2 relative overflow-hidden"
            style={{
              background: i <= step ? 'transparent' : '#1a1a1a',
              border: i <= step ? '1px solid #BFFF00' : '1px solid #333'
            }}
          >
            {i <= step && (
              <motion.div
                className="absolute inset-0"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                style={{
                  background: 'repeating-linear-gradient(-45deg, #BFFF00, #BFFF00 4px, #9FCC00 4px, #9FCC00 8px)'
                }}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-6">
        <div className="font-mono text-xs text-steel-500 uppercase tracking-widest">
          Шаг_{String(step + 1).padStart(2, '0')} // {formSteps[step]?.title}
        </div>
        {step > 0 && (
          <button
            onClick={goBack}
            className="font-mono text-xs text-steel-400 hover:text-neon-lime transition-colors flex items-center gap-2"
          >
            <span className="text-neon-lime">[</span> НАЗАД <span className="text-neon-lime">]</span>
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Workout */}
        {step === 0 && (
          <motion.div
            key="workout"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="font-display text-xl font-bold text-steel-100 mb-4 uppercase tracking-wider">
              Тренировка_сегодня?
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {workoutOptions.map((opt, i) => (
                <motion.button
                  key={opt.type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleWorkout(opt.type)}
                  className={`p-4 border-2 transition-all duration-200 relative overflow-hidden group
                    ${formData.workout_type === opt.type || (opt.type === 'skip' && formData.workout === false)
                      ? `border-${opt.color} bg-${opt.color}/10`
                      : 'border-void-400 bg-void-200 hover:border-steel-500'
                    }`}
                  style={{
                    boxShadow: formData.workout_type === opt.type || (opt.type === 'skip' && formData.workout === false)
                      ? `4px 4px 0 0 var(--${opt.color})`
                      : 'none'
                  }}
                >
                  <span className="text-3xl block mb-2">{opt.icon}</span>
                  <span className="font-mono text-xs font-bold tracking-wider text-steel-300">
                    {opt.label}
                  </span>
                  <motion.div
                    className="absolute bottom-0 left-0 h-1 bg-neon-lime"
                    initial={{ width: 0 }}
                    whileHover={{ width: '100%' }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Nutrition */}
        {step === 1 && (
          <motion.div
            key="nutrition"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="font-display text-xl font-bold text-steel-100 mb-4 uppercase tracking-wider">
              Питание_по_плану?
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => handleYesNo('nutrition', true)}
                className={`brutal-card p-6 text-center group ${
                  formData.nutrition === true ? 'border-neon-lime' : 'border-void-400 hover:border-neon-lime'
                }`}
              >
                <motion.span
                  className="text-4xl block mb-2"
                  whileHover={{ scale: 1.2, rotate: 10 }}
                >
                  ✅
                </motion.span>
                <span className="font-mono text-sm font-bold text-neon-lime">ДА</span>
              </motion.button>
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 }}
                onClick={() => handleYesNo('nutrition', false)}
                className={`p-6 text-center border-2 transition-all ${
                  formData.nutrition === false
                    ? 'border-neon-orange bg-neon-orange/10'
                    : 'border-void-400 bg-void-200 hover:border-neon-orange'
                }`}
                style={{ boxShadow: formData.nutrition === false ? '4px 4px 0 0 #FF6B00' : 'none' }}
              >
                <motion.span
                  className="text-4xl block mb-2"
                  whileHover={{ scale: 1.2, rotate: -10 }}
                >
                  ❌
                </motion.span>
                <span className="font-mono text-sm font-bold text-neon-orange">НЕТ</span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Water */}
        {step === 2 && (
          <motion.div
            key="water"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="font-display text-xl font-bold text-steel-100 mb-4 uppercase tracking-wider">
              Водный_баланс?
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => handleYesNo('water', true)}
                className={`brutal-card-cyan p-6 text-center ${
                  formData.water === true ? 'border-neon-cyan' : 'border-void-400'
                }`}
              >
                <motion.span
                  className="text-4xl block mb-2"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  💧
                </motion.span>
                <span className="font-mono text-sm font-bold text-neon-cyan">ВЫПИЛ</span>
              </motion.button>
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 }}
                onClick={() => handleYesNo('water', false)}
                className={`p-6 text-center border-2 transition-all ${
                  formData.water === false
                    ? 'border-neon-orange bg-neon-orange/10'
                    : 'border-void-400 bg-void-200 hover:border-neon-orange'
                }`}
                style={{ boxShadow: formData.water === false ? '4px 4px 0 0 #FF6B00' : 'none' }}
              >
                <motion.span
                  className="text-4xl block mb-2"
                  whileHover={{ rotate: 15 }}
                >
                  🏜️
                </motion.span>
                <span className="font-mono text-sm font-bold text-neon-orange">НЕ ВЫПИЛ</span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Sleep */}
        {step === 3 && (
          <motion.div
            key="sleep"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="font-display text-xl font-bold text-steel-100 mb-4 uppercase tracking-wider">
              Сколько_часов_сна?
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {sleepOptions.map((hours, i) => (
                <motion.button
                  key={hours}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleSleep(hours)}
                  className={`p-4 text-center border-2 transition-all relative overflow-hidden ${
                    formData.sleep_hours === hours
                      ? 'border-neon-magenta bg-neon-magenta/10'
                      : 'border-void-400 bg-void-200 hover:border-neon-magenta'
                  }`}
                  style={{
                    boxShadow: formData.sleep_hours === hours ? '4px 4px 0 0 #FF00FF' : 'none'
                  }}
                >
                  <span className="font-display text-3xl font-bold text-steel-100">{hours}</span>
                  <span className="font-mono text-[10px] text-steel-500 block mt-1">
                    {hours === 10 ? '+' : ''} ЧАС
                  </span>
                  {hours >= 7 && hours <= 8 && (
                    <div className="absolute top-1 right-1">
                      <span className="text-xs">✨</span>
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
            <p className="font-mono text-[10px] text-steel-500 mt-3 text-center">
              ОПТИМАЛЬНО: 7-8 ЧАСОВ
            </p>
          </motion.div>
        )}

        {/* Step 5: Steps (шаги) */}
        {step === 4 && (
          <motion.div
            key="steps"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="font-display text-xl font-bold text-steel-100 mb-4 uppercase tracking-wider">
              Шаги_за_день?
            </h3>
            <p className="font-mono text-xs text-steel-500 mb-4">
              ОПЦИОНАЛЬНО — МОЖНО ПРОПУСТИТЬ
            </p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[5000, 7500, 10000, 12000, 15000, 20000].map((stepsCount, i) => (
                <motion.button
                  key={stepsCount}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleSteps(stepsCount)}
                  className={`p-3 text-center border-2 transition-all ${
                    formData.steps === stepsCount
                      ? 'border-neon-cyan bg-neon-cyan/10'
                      : 'border-void-400 bg-void-200 hover:border-neon-cyan'
                  }`}
                  style={{
                    boxShadow: formData.steps === stepsCount ? '3px 3px 0 0 #00E5FF' : 'none'
                  }}
                >
                  <span className="font-display text-lg font-bold text-steel-100">
                    {stepsCount >= 1000 ? `${stepsCount / 1000}K` : stepsCount}
                  </span>
                  <span className="font-mono text-[9px] text-steel-500 block">ШАГОВ</span>
                </motion.button>
              ))}
            </div>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={() => handleSteps(undefined)}
              className="w-full p-3 text-center border-2 border-void-400 bg-void-200 hover:border-steel-500 transition-all"
            >
              <span className="font-mono text-xs text-steel-400">ПРОПУСТИТЬ →</span>
            </motion.button>
          </motion.div>
        )}

        {/* Step 6: Mood */}
        {step === 5 && (
          <motion.div
            key="mood"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="font-display text-xl font-bold text-steel-100 mb-4 uppercase tracking-wider">
              Уровень_энергии?
            </h3>
            <div className="flex justify-between gap-2">
              {moodOptions.map((opt, i) => (
                <motion.button
                  key={opt.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleMood(opt.value)}
                  disabled={isSubmitting}
                  className={`flex-1 p-3 text-center border-2 transition-all ${
                    formData.mood === opt.value
                      ? 'border-neon-lime bg-neon-lime/10'
                      : 'border-void-400 bg-void-200 hover:border-neon-lime'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{
                    boxShadow: formData.mood === opt.value ? '3px 3px 0 0 #BFFF00' : 'none'
                  }}
                >
                  <motion.span
                    className="text-2xl block"
                    whileHover={{ scale: 1.3 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {opt.emoji}
                  </motion.span>
                  <span className="font-mono text-[8px] text-steel-500 mt-1 block">
                    {opt.label}
                  </span>
                </motion.button>
              ))}
            </div>

            {isSubmitting && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 text-center"
              >
                <div className="inline-flex items-center gap-3 px-4 py-2 border border-neon-lime">
                  <motion.div
                    className="w-2 h-2 bg-neon-lime"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                  />
                  <span className="font-mono text-xs text-neon-lime">СОХРАНЕНИЕ...</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
