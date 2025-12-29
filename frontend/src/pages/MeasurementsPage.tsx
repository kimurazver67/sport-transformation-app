import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { useTelegram } from '../hooks/useTelegram'
import WeightChart from '../components/WeightChart'
import { api } from '../services/api'
import type { MeasurementForm, WeeklyMeasurement } from '../types'

// Хелпер для получения URL фото через Telegram file_id
function getPhotoUrl(measurement: WeeklyMeasurement, type: 'front' | 'side' | 'back'): string | null {
  const fileIdKey = `photo_${type}_file_id` as keyof WeeklyMeasurement
  const fileId = measurement[fileIdKey] as string | undefined

  if (fileId) {
    return api.getPhotoUrl(fileId)
  }

  return null
}

export default function MeasurementsPage() {
  const {
    courseWeek,
    currentMeasurement,
    measurements,
    canSubmitMeasurement,
    measurementWindowInfo,
    fetchCurrentMeasurement,
    fetchMeasurements,
    checkMeasurementWindow,
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
    checkMeasurementWindow()
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
      showAlert('Введи значение веса')
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
      showAlert('Ошибка сохранения данных')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof MeasurementForm, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value)
    setFormData({ ...formData, [field]: numValue })
  }

  // Calculate progress
  const startWeight = measurements.length > 0 ? measurements[0].weight : null
  const currentWeight = measurements.length > 0 ? measurements[measurements.length - 1].weight : null
  const weightChange = startWeight && currentWeight ? currentWeight - startWeight : null

  return (
    <div className="min-h-screen pb-4 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="blob -top-32 -right-32 opacity-10" />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-6 pb-4"
      >
        <div className="font-mono text-xs text-steel-500 uppercase tracking-widest mb-1">
          Неделя_{String(courseWeek).padStart(2, '0')} // Замеры
        </div>
        <h1 className="font-display text-3xl font-bold text-steel-100 uppercase tracking-wider">
          Данные_тела
        </h1>
      </motion.header>

      {/* Weight Progress Card */}
      {weightChange !== null && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 mb-6 border-2 relative overflow-hidden ${
            weightChange < 0
              ? 'border-neon-lime bg-neon-lime/5'
              : weightChange > 0
              ? 'border-neon-orange bg-neon-orange/5'
              : 'border-neon-cyan bg-neon-cyan/5'
          }`}
          style={{
            boxShadow: weightChange < 0
              ? '4px 4px 0 0 #BFFF00'
              : weightChange > 0
              ? '4px 4px 0 0 #FF6B00'
              : '4px 4px 0 0 #00F5FF'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] text-steel-500 uppercase tracking-widest mb-1">
                Изменение_веса
              </div>
              <div className={`font-display text-3xl font-bold ${
                weightChange < 0 ? 'text-neon-lime' : weightChange > 0 ? 'text-neon-orange' : 'text-neon-cyan'
              }`}>
                {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} кг
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] text-steel-500 uppercase">Старт → Сейчас</div>
              <div className="font-mono text-lg text-steel-300">
                {startWeight?.toFixed(1)} → {currentWeight?.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Progress indicator */}
          <motion.div
            className={`absolute bottom-0 left-0 h-1 ${
              weightChange < 0 ? 'bg-neon-lime' : weightChange > 0 ? 'bg-neon-orange' : 'bg-neon-cyan'
            }`}
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1 }}
          />
        </motion.div>
      )}

      {/* Weight Chart */}
      {measurements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <WeightChart measurements={measurements} />
        </motion.div>
      )}

      {/* Measurements Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="border-2 border-void-400 bg-void-200 p-4 mb-6"
        style={{ boxShadow: '4px 4px 0 0 #333' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-steel-100 uppercase">
            {currentMeasurement ? `Неделя_${courseWeek}_Данные` : 'Новая_запись'}
          </h3>
          {currentMeasurement && !isEditing && canSubmitMeasurement && (
            <button
              onClick={() => setIsEditing(true)}
              className="font-mono text-xs text-neon-lime hover:underline"
            >
              [ИЗМЕНИТЬ]
            </button>
          )}
        </div>

        {/* Блокировка формы - показываем только когда курс начался */}
        {!canSubmitMeasurement && measurementWindowInfo && (
          <div className="mb-4 p-3 border-2 border-neon-orange bg-neon-orange/10">
            <div className="flex items-start gap-2">
              <span className="text-lg">🔒</span>
              <div>
                <p className="font-mono text-xs text-neon-orange font-bold uppercase">
                  {measurementWindowInfo.reason}
                </p>
                {measurementWindowInfo.nextWindow && (
                  <p className="font-mono text-[10px] text-steel-400 mt-1">
                    Следующее окно: {measurementWindowInfo.nextWindow.day}, {measurementWindowInfo.nextWindow.time}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Show form only when allowed AND (editing OR no data yet) */}
        {canSubmitMeasurement && (isEditing || !currentMeasurement) ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Weight - Required */}
            <div>
              <label className="block font-mono text-xs text-steel-500 uppercase tracking-wider mb-2">
                Вес (кг) *
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.weight || ''}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                className="input-brutal"
                placeholder="75.5"
                required
              />
            </div>

            {/* Body measurements - Row 1: Грудь, Талия, Попец */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-mono text-[10px] text-steel-500 uppercase mb-1">Грудь</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.chest || ''}
                  onChange={(e) => handleInputChange('chest', e.target.value)}
                  className="input-brutal text-sm"
                  placeholder="см"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] text-steel-500 uppercase mb-1">Талия</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.waist || ''}
                  onChange={(e) => handleInputChange('waist', e.target.value)}
                  className="input-brutal text-sm"
                  placeholder="см"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] text-steel-500 uppercase mb-1">Попец</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.hips || ''}
                  onChange={(e) => handleInputChange('hips', e.target.value)}
                  className="input-brutal text-sm"
                  placeholder="см"
                />
              </div>
            </div>

            {/* Row 2: Бицепсы */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-mono text-[10px] text-steel-500 uppercase mb-1">Бицепс Л</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.bicep_left || ''}
                  onChange={(e) => handleInputChange('bicep_left', e.target.value)}
                  className="input-brutal text-sm"
                  placeholder="см"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] text-steel-500 uppercase mb-1">Бицепс П</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.bicep_right || ''}
                  onChange={(e) => handleInputChange('bicep_right', e.target.value)}
                  className="input-brutal text-sm"
                  placeholder="см"
                />
              </div>
            </div>

            {/* Row 3: Бедра */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-mono text-[10px] text-steel-500 uppercase mb-1">Бедро Л</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.thigh_left || ''}
                  onChange={(e) => handleInputChange('thigh_left', e.target.value)}
                  className="input-brutal text-sm"
                  placeholder="см"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] text-steel-500 uppercase mb-1">Бедро П</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.thigh_right || ''}
                  onChange={(e) => handleInputChange('thigh_right', e.target.value)}
                  className="input-brutal text-sm"
                  placeholder="см"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 border-2 border-void-400 font-mono text-sm font-bold text-steel-400 uppercase hover:border-steel-400 transition-all"
                >
                  Отмена
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 btn-brutal disabled:opacity-50"
              >
                {isSubmitting ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </form>
        ) : currentMeasurement ? (
          /* Display current measurements - shown regardless of canSubmitMeasurement */
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-void-400">
              <span className="font-mono text-xs text-steel-500 uppercase">Вес</span>
              <span className="font-display font-bold text-neon-lime">{currentMeasurement.weight} кг</span>
            </div>
            <div className="grid grid-cols-3 gap-2 py-2 border-b border-void-400">
              <div className="text-center">
                <div className="font-mono text-[10px] text-steel-500 uppercase">Грудь</div>
                <div className="font-mono text-steel-200">{currentMeasurement.chest || '—'}</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-[10px] text-steel-500 uppercase">Талия</div>
                <div className="font-mono text-steel-200">{currentMeasurement.waist || '—'}</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-[10px] text-steel-500 uppercase">Попец</div>
                <div className="font-mono text-steel-200">{currentMeasurement.hips || '—'}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 py-2 border-b border-void-400">
              <div className="text-center">
                <div className="font-mono text-[10px] text-steel-500 uppercase">Бицепс Л</div>
                <div className="font-mono text-steel-200">{currentMeasurement.bicep_left || '—'}</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-[10px] text-steel-500 uppercase">Бицепс П</div>
                <div className="font-mono text-steel-200">{currentMeasurement.bicep_right || '—'}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 py-2">
              <div className="text-center">
                <div className="font-mono text-[10px] text-steel-500 uppercase">Бедро Л</div>
                <div className="font-mono text-steel-200">{currentMeasurement.thigh_left || '—'}</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-[10px] text-steel-500 uppercase">Бедро П</div>
                <div className="font-mono text-steel-200">{currentMeasurement.thigh_right || '—'}</div>
              </div>
            </div>
          </div>
        ) : (
          /* No measurements yet and window closed - show placeholder */
          <div className="text-center py-4">
            <p className="font-mono text-sm text-steel-500">
              Данные замеров пока не внесены
            </p>
          </div>
        )}
      </motion.div>

      {/* Progress Photos */}
      {currentMeasurement && (
        getPhotoUrl(currentMeasurement, 'front') ||
        getPhotoUrl(currentMeasurement, 'side') ||
        getPhotoUrl(currentMeasurement, 'back')
      ) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="border-2 border-void-400 bg-void-200 p-4 mb-6"
          style={{ boxShadow: '4px 4px 0 0 #333' }}
        >
          <h3 className="font-display font-bold text-steel-100 uppercase mb-3">
            Фото_прогресса
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {getPhotoUrl(currentMeasurement, 'front') && (
              <div className="relative">
                <img
                  src={getPhotoUrl(currentMeasurement, 'front')!}
                  alt="Фронт"
                  className="w-full aspect-[3/4] object-cover border border-void-400"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-void/80 text-center py-1">
                  <span className="font-mono text-[10px] text-steel-400 uppercase">Фронт</span>
                </div>
              </div>
            )}
            {getPhotoUrl(currentMeasurement, 'side') && (
              <div className="relative">
                <img
                  src={getPhotoUrl(currentMeasurement, 'side')!}
                  alt="Бок"
                  className="w-full aspect-[3/4] object-cover border border-void-400"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-void/80 text-center py-1">
                  <span className="font-mono text-[10px] text-steel-400 uppercase">Бок</span>
                </div>
              </div>
            )}
            {getPhotoUrl(currentMeasurement, 'back') && (
              <div className="relative">
                <img
                  src={getPhotoUrl(currentMeasurement, 'back')!}
                  alt="Спина"
                  className="w-full aspect-[3/4] object-cover border border-void-400"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-void/80 text-center py-1">
                  <span className="font-mono text-[10px] text-steel-400 uppercase">Спина</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Photo Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="border-2 border-void-400 p-4 bg-void-200/50"
      >
        <div className="flex items-start gap-3">
          <span className="text-xl">📸</span>
          <div>
            <p className="font-mono text-xs text-steel-400">
              Чтобы добавить фото прогресса, отправь их боту в Телеграм.
            </p>
            <p className="font-mono text-[10px] text-steel-500 mt-1">
              Подпись: "фронт", "бок" или "спина"
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
