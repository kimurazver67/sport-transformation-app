import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTelegram } from '../hooks/useTelegram'
import { useStore } from '../store'
import type { CheckinForm as CheckinFormData, WorkoutType, MoodLevel } from '../types'

interface CheckinFormProps {
  onComplete?: () => void
}

const workoutOptions: { type: WorkoutType | 'skip'; label: string; icon: string }[] = [
  { type: 'strength', label: 'Силовая', icon: '💪' },
  { type: 'cardio', label: 'Кардио', icon: '🏃' },
  { type: 'rest', label: 'Отдых', icon: '😴' },
  { type: 'skip', label: 'Пропуск', icon: '❌' },
]

const moodOptions: { value: MoodLevel; emoji: string }[] = [
  { value: 1, emoji: '😢' },
  { value: 2, emoji: '😕' },
  { value: 3, emoji: '😐' },
  { value: 4, emoji: '🙂' },
  { value: 5, emoji: '😃' },
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
  })

  const steps = [
    { key: 'workout', title: 'Тренировка' },
    { key: 'nutrition', title: 'Питание' },
    { key: 'water', title: 'Вода' },
    { key: 'sleep', title: 'Сон' },
    { key: 'mood', title: 'Самочувствие' },
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
    setStep(4)
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
    <div className="card">
      {/* Прогресс */}
      <div className="flex gap-1 mb-6">
        {steps.map((s, i) => (
          <div
            key={s.key}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= step ? 'bg-primary-500' : 'bg-dark-700'
            }`}
          />
        ))}
      </div>

      {/* Кнопка назад */}
      {step > 0 && (
        <button
          onClick={goBack}
          className="text-dark-400 text-sm mb-4 flex items-center gap-1"
        >
          ← Назад
        </button>
      )}

      <AnimatePresence mode="wait">
        {/* Шаг 1: Тренировка */}
        {step === 0 && (
          <motion.div
            key="workout"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h3 className="text-lg font-semibold mb-4">🏋️ Была ли тренировка?</h3>
            <div className="grid grid-cols-2 gap-3">
              {workoutOptions.map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => handleWorkout(opt.type)}
                  className={`card-hover p-4 text-center transition-all ${
                    formData.workout_type === opt.type || (opt.type === 'skip' && formData.workout === false)
                      ? 'border-primary-500 bg-primary-500/10'
                      : ''
                  }`}
                >
                  <span className="text-2xl block mb-2">{opt.icon}</span>
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Шаг 2: Питание */}
        {step === 1 && (
          <motion.div
            key="nutrition"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h3 className="text-lg font-semibold mb-4">🥗 Питание в норме?</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleYesNo('nutrition', true)}
                className={`card-hover p-6 text-center ${
                  formData.nutrition === true ? 'border-primary-500 bg-primary-500/10' : ''
                }`}
              >
                <span className="text-3xl block mb-2">✅</span>
                <span className="font-medium">Да</span>
              </button>
              <button
                onClick={() => handleYesNo('nutrition', false)}
                className={`card-hover p-6 text-center ${
                  formData.nutrition === false ? 'border-primary-500 bg-primary-500/10' : ''
                }`}
              >
                <span className="text-3xl block mb-2">❌</span>
                <span className="font-medium">Нет</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Шаг 3: Вода */}
        {step === 2 && (
          <motion.div
            key="water"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h3 className="text-lg font-semibold mb-4">💧 Достаточно воды?</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleYesNo('water', true)}
                className={`card-hover p-6 text-center ${
                  formData.water === true ? 'border-primary-500 bg-primary-500/10' : ''
                }`}
              >
                <span className="text-3xl block mb-2">✅</span>
                <span className="font-medium">Да</span>
              </button>
              <button
                onClick={() => handleYesNo('water', false)}
                className={`card-hover p-6 text-center ${
                  formData.water === false ? 'border-primary-500 bg-primary-500/10' : ''
                }`}
              >
                <span className="text-3xl block mb-2">❌</span>
                <span className="font-medium">Нет</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Шаг 4: Сон */}
        {step === 3 && (
          <motion.div
            key="sleep"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h3 className="text-lg font-semibold mb-4">😴 Сколько часов сна?</h3>
            <div className="grid grid-cols-3 gap-3">
              {sleepOptions.map((hours) => (
                <button
                  key={hours}
                  onClick={() => handleSleep(hours)}
                  className={`card-hover p-4 text-center ${
                    formData.sleep_hours === hours ? 'border-primary-500 bg-primary-500/10' : ''
                  }`}
                >
                  <span className="text-2xl font-bold">{hours}</span>
                  <span className="text-xs text-dark-400 block">{hours === 10 ? '+' : ''} ч</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Шаг 5: Настроение */}
        {step === 4 && (
          <motion.div
            key="mood"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h3 className="text-lg font-semibold mb-4">🎭 Как самочувствие?</h3>
            <div className="flex justify-between gap-2">
              {moodOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleMood(opt.value)}
                  disabled={isSubmitting}
                  className={`flex-1 card-hover p-4 text-center transition-all ${
                    formData.mood === opt.value ? 'border-primary-500 bg-primary-500/10' : ''
                  } ${isSubmitting ? 'opacity-50' : ''}`}
                >
                  <span className="text-3xl">{opt.emoji}</span>
                </button>
              ))}
            </div>
            {isSubmitting && (
              <p className="text-center text-dark-400 mt-4">Сохранение...</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
