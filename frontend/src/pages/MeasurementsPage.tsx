import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { useTelegram } from '../hooks/useTelegram'
import WeightChart from '../components/WeightChart'
import type { MeasurementForm } from '../types'

export default function MeasurementsPage() {
  const {
    courseWeek,
    currentMeasurement,
    measurements,
    fetchCurrentMeasurement,
    fetchMeasurements,
    submitMeasurement,
  } = useStore()
  const { hapticFeedback, showAlert } = useTelegram()

  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<MeasurementForm>({
    weight: 0,
    chest: undefined,
    waist: undefined,
    hips: undefined,
    bicep_left: undefined,
    bicep_right: undefined,
    thigh_left: undefined,
    thigh_right: undefined,
    body_fat_percent: undefined,
  })

  useEffect(() => {
    fetchCurrentMeasurement()
    fetchMeasurements()
  }, [])

  useEffect(() => {
    if (currentMeasurement) {
      setFormData({
        weight: currentMeasurement.weight,
        chest: currentMeasurement.chest ?? undefined,
        waist: currentMeasurement.waist ?? undefined,
        hips: currentMeasurement.hips ?? undefined,
        bicep_left: currentMeasurement.bicep_left ?? undefined,
        bicep_right: currentMeasurement.bicep_right ?? undefined,
        thigh_left: currentMeasurement.thigh_left ?? undefined,
        thigh_right: currentMeasurement.thigh_right ?? undefined,
        body_fat_percent: currentMeasurement.body_fat_percent ?? undefined,
      })
    }
  }, [currentMeasurement])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.weight || formData.weight <= 0) {
      showAlert('Укажите вес')
      return
    }

    setIsSubmitting(true)
    try {
      await submitMeasurement(formData)
      hapticFeedback('success')
      setIsEditing(false)
      showAlert('Замеры сохранены!')
    } catch (error) {
      console.error('Failed to submit measurement:', error)
      hapticFeedback('error')
      showAlert('Ошибка при сохранении')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof MeasurementForm, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value)
    setFormData({ ...formData, [field]: numValue })
  }

  // Вычисляем прогресс
  const startWeight = measurements.length > 0 ? measurements[0].weight : null
  const currentWeight = measurements.length > 0 ? measurements[measurements.length - 1].weight : null
  const weightChange = startWeight && currentWeight ? currentWeight - startWeight : null

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold">📏 Замеры</h1>
        <p className="text-dark-400 text-sm">Неделя {courseWeek}</p>
      </motion.div>

      {/* Прогресс веса */}
      {weightChange !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`card ${
            weightChange < 0
              ? 'bg-gradient-to-r from-primary-900/30 to-dark-800 border-primary-700'
              : weightChange > 0
              ? 'bg-gradient-to-r from-red-900/30 to-dark-800 border-red-700'
              : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-400">Изменение веса</p>
              <p className="text-2xl font-bold">
                {weightChange > 0 ? '+' : ''}
                {weightChange.toFixed(1)} кг
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-dark-400">Начало → Сейчас</p>
              <p className="text-lg">
                {startWeight?.toFixed(1)} → {currentWeight?.toFixed(1)} кг
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* График */}
      {measurements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <WeightChart measurements={measurements} />
        </motion.div>
      )}

      {/* Форма замеров */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">
            {currentMeasurement ? 'Замеры недели ' + courseWeek : 'Внести замеры'}
          </h3>
          {currentMeasurement && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-primary-400"
            >
              Изменить
            </button>
          )}
        </div>

        {isEditing || !currentMeasurement ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Вес - обязательное поле */}
            <div>
              <label className="block text-sm text-dark-400 mb-1">
                Вес (кг) *
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.weight || ''}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                className="input"
                placeholder="75.5"
                required
              />
            </div>

            {/* Обхваты */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-dark-400 mb-1">
                  Грудь (см)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.chest || ''}
                  onChange={(e) => handleInputChange('chest', e.target.value)}
                  className="input"
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-1">
                  Талия (см)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.waist || ''}
                  onChange={(e) => handleInputChange('waist', e.target.value)}
                  className="input"
                  placeholder="85"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-1">
                  Бёдра (см)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.hips || ''}
                  onChange={(e) => handleInputChange('hips', e.target.value)}
                  className="input"
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-1">
                  % жира
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.body_fat_percent || ''}
                  onChange={(e) => handleInputChange('body_fat_percent', e.target.value)}
                  className="input"
                  placeholder="20"
                />
              </div>
            </div>

            {/* Бицепсы */}
            <div>
              <label className="block text-sm text-dark-400 mb-1">
                Бицепс (см)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.5"
                  value={formData.bicep_left || ''}
                  onChange={(e) => handleInputChange('bicep_left', e.target.value)}
                  className="input"
                  placeholder="Левый"
                />
                <input
                  type="number"
                  step="0.5"
                  value={formData.bicep_right || ''}
                  onChange={(e) => handleInputChange('bicep_right', e.target.value)}
                  className="input"
                  placeholder="Правый"
                />
              </div>
            </div>

            {/* Бёдра */}
            <div>
              <label className="block text-sm text-dark-400 mb-1">
                Бедро (см)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.5"
                  value={formData.thigh_left || ''}
                  onChange={(e) => handleInputChange('thigh_left', e.target.value)}
                  className="input"
                  placeholder="Левое"
                />
                <input
                  type="number"
                  step="0.5"
                  value={formData.thigh_right || ''}
                  onChange={(e) => handleInputChange('thigh_right', e.target.value)}
                  className="input"
                  placeholder="Правое"
                />
              </div>
            </div>

            <div className="flex gap-3">
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn btn-secondary flex-1"
                >
                  Отмена
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary flex-1"
              >
                {isSubmitting ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </form>
        ) : (
          /* Отображение текущих замеров */
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-dark-700">
              <span className="text-dark-400">Вес</span>
              <span className="font-semibold">{currentMeasurement.weight} кг</span>
            </div>
            {currentMeasurement.chest && (
              <div className="flex justify-between py-2 border-b border-dark-700">
                <span className="text-dark-400">Грудь</span>
                <span>{currentMeasurement.chest} см</span>
              </div>
            )}
            {currentMeasurement.waist && (
              <div className="flex justify-between py-2 border-b border-dark-700">
                <span className="text-dark-400">Талия</span>
                <span>{currentMeasurement.waist} см</span>
              </div>
            )}
            {currentMeasurement.hips && (
              <div className="flex justify-between py-2 border-b border-dark-700">
                <span className="text-dark-400">Бёдра</span>
                <span>{currentMeasurement.hips} см</span>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Инфо о фото */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card bg-dark-800/50"
      >
        <p className="text-sm text-dark-400">
          📸 Чтобы добавить фото прогресса, отправьте их боту в Telegram.
          Подпишите: "фронт", "бок" или "спина".
        </p>
      </motion.div>
    </div>
  )
}
