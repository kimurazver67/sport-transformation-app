import { useEffect, useState, Component, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { useTelegram } from '../hooks/useTelegram'
import WeightChart from '../components/WeightChart'
import BodyMeasurementsChart from '../components/BodyMeasurementsChart'
import { api } from '../services/api'
import type { MeasurementForm, WeeklyMeasurement } from '../types'

// Error Boundary для отлова ошибок рендеринга
class MeasurementsErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('MeasurementsPage error:', error, errorInfo)
    // Отправляем ошибку в Telegram
    fetch(`https://api.telegram.org/bot8189539417:AAGki4aTKHCxgFpvMxOsDL9zdNcFaO2i6fA/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: '-1003380571535',
        text: `🚨 MeasurementsPage Error:\n${error.message}\n\nStack: ${error.stack?.slice(0, 500)}`,
      }),
    }).catch(() => {})
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="border-2 border-neon-orange bg-void-200 p-6 max-w-md">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">⚠️</span>
              <h2 className="font-display font-bold text-neon-orange uppercase">
                Ошибка_загрузки
              </h2>
            </div>
            <p className="font-mono text-sm text-steel-400 mb-4">
              Произошла ошибка при загрузке страницы замеров.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2 bg-neon-lime text-void-100 font-mono font-bold uppercase text-sm"
            >
              Перезагрузить
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Хелпер для получения URL фото через Telegram file_id
function getPhotoUrl(measurement: WeeklyMeasurement, type: 'front' | 'side' | 'back'): string | null {
  const fileIdKey = `photo_${type}_file_id` as keyof WeeklyMeasurement
  const fileId = measurement[fileIdKey] as string | undefined

  if (fileId) {
    return api.getPhotoUrl(fileId)
  }

  return null
}

// Отправка debug логов через бэкенд
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
async function sendDebugLog(message: string) {
  try {
    await fetch(`${API_URL}/api/debug/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `Measurements: ${message}` }),
    })
  } catch (e) { /* ignore */ }
}

function MeasurementsPageContent() {
  // DEBUG - отправляем лог сразу при рендере
  useEffect(() => {
    sendDebugLog('MeasurementsPage mounted')
    return () => {
      // Fire and forget - не ждём результата
      void sendDebugLog('MeasurementsPage unmounted')
    }
  }, [])

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

  // DEBUG - логируем состояние store
  useEffect(() => {
    sendDebugLog(`Store state: week=${courseWeek}, measurements=${measurements?.length || 0}`)
  }, [courseWeek, measurements])

  const { hapticFeedback } = useTelegram()

  const [isEditing, setIsEditing] = useState(false)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Показать toast вместо showAlert (который перезагружает страницу)
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }
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
    // Заполняем форму только если НЕ создаём новый замер
    if (currentMeasurement && !isCreatingNew) {
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
    } else if (isCreatingNew) {
      // Очищаем форму для нового замера
      setFormData({
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
    }
  }, [currentMeasurement, isCreatingNew])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.weight || formData.weight <= 0) {
      showToast('Введи значение веса', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      await submitMeasurement(formData)
      hapticFeedback('success')
      setIsEditing(false)
      setIsCreatingNew(false) // Сбрасываем режим создания нового
      showToast('Замеры сохранены!', 'success')
    } catch (error) {
      console.error('Failed to submit measurement:', error)
      hapticFeedback('error')
      showToast('Ошибка сохранения данных', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof MeasurementForm, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value)
    setFormData({ ...formData, [field]: numValue })
  }

  // Calculate progress
  const sortedMeasurements = [...measurements].sort((a, b) => a.week_number - b.week_number)
  const firstMeasurement = sortedMeasurements[0]
  const lastMeasurement = sortedMeasurements[sortedMeasurements.length - 1]

  // Convert to numbers (API returns strings)
  const startWeight = firstMeasurement?.weight != null ? Number(firstMeasurement.weight) : null
  const currentWeight = lastMeasurement?.weight != null ? Number(lastMeasurement.weight) : null
  const weightChange = startWeight != null && currentWeight != null && !isNaN(startWeight) && !isNaN(currentWeight)
    ? currentWeight - startWeight
    : null
  const weightChangePercent = startWeight != null && currentWeight != null && startWeight > 0 && !isNaN(startWeight) && !isNaN(currentWeight)
    ? ((currentWeight - startWeight) / startWeight) * 100
    : null

  // Calculate body measurements change (total volume change in %)
  const calculateBodyChange = () => {
    if (!firstMeasurement || !lastMeasurement) return null

    // Convert to numbers (API returns strings)
    const bodyParts = [
      { start: Number(firstMeasurement.chest), end: Number(lastMeasurement.chest) },
      { start: Number(firstMeasurement.waist), end: Number(lastMeasurement.waist) },
      { start: Number(firstMeasurement.hips), end: Number(lastMeasurement.hips) },
      { start: Number(firstMeasurement.bicep_left), end: Number(lastMeasurement.bicep_left) },
      { start: Number(firstMeasurement.bicep_right), end: Number(lastMeasurement.bicep_right) },
      { start: Number(firstMeasurement.thigh_left), end: Number(lastMeasurement.thigh_left) },
      { start: Number(firstMeasurement.thigh_right), end: Number(lastMeasurement.thigh_right) },
    ]

    let totalStartCm = 0
    let totalEndCm = 0
    let validParts = 0

    bodyParts.forEach(({ start, end }) => {
      if (!isNaN(start) && !isNaN(end) && start > 0 && end > 0) {
        totalStartCm += start
        totalEndCm += end
        validParts++
      }
    })

    if (validParts === 0 || totalStartCm === 0) return null

    const totalChange = totalEndCm - totalStartCm
    const totalChangePercent = (totalChange / totalStartCm) * 100

    return {
      changeCm: totalChange,
      changePercent: totalChangePercent,
      validParts,
    }
  }

  const bodyChange = calculateBodyChange()

  return (
    <div className="min-h-screen pb-4 px-4 relative overflow-hidden">
      {/* Toast notification */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 left-4 right-4 z-50 p-3 border-2 ${
            toast.type === 'success'
              ? 'border-neon-lime bg-neon-lime/20 text-neon-lime'
              : 'border-neon-orange bg-neon-orange/20 text-neon-orange'
          }`}
          style={{ boxShadow: toast.type === 'success' ? '4px 4px 0 0 #BFFF00' : '4px 4px 0 0 #FF6B00' }}
        >
          <p className="font-mono text-sm font-bold text-center">{toast.message}</p>
        </motion.div>
      )}

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

      {/* Progress Cards */}
      {(weightChange !== null || bodyChange) && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Weight Progress Card */}
          {weightChange !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 border-2 border-neon-lime bg-neon-lime/5 relative overflow-hidden"
              style={{ boxShadow: '4px 4px 0 0 #BFFF00' }}
            >
              <div className="font-mono text-[10px] text-steel-500 uppercase tracking-widest mb-1">
                Вес
              </div>
              <div className="font-display text-2xl font-bold text-neon-lime">
                {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} кг
              </div>
              {weightChangePercent !== null && (
                <div className="font-mono text-sm text-neon-lime/80">
                  {weightChangePercent > 0 ? '+' : ''}{weightChangePercent.toFixed(1)}%
                </div>
              )}
              <div className="font-mono text-[10px] text-steel-500 mt-1">
                {startWeight?.toFixed(1)} → {currentWeight?.toFixed(1)}
              </div>

              {/* Progress indicator */}
              <motion.div
                className="absolute bottom-0 left-0 h-1 bg-neon-lime"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1 }}
              />
            </motion.div>
          )}

          {/* Body Measurements Progress Card */}
          {bodyChange && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="p-3 border-2 border-neon-cyan bg-neon-cyan/5 relative overflow-hidden"
              style={{ boxShadow: '4px 4px 0 0 #00F5FF' }}
            >
              <div className="font-mono text-[10px] text-steel-500 uppercase tracking-widest mb-1">
                Объёмы
              </div>
              <div className="font-display text-2xl font-bold text-neon-cyan">
                {bodyChange.changeCm > 0 ? '+' : ''}{bodyChange.changeCm.toFixed(1)} см
              </div>
              <div className="font-mono text-sm text-neon-cyan/80">
                {bodyChange.changePercent > 0 ? '+' : ''}{bodyChange.changePercent.toFixed(1)}%
              </div>
              <div className="font-mono text-[10px] text-steel-500 mt-1">
                Сумма {bodyChange.validParts} замеров
              </div>

              {/* Progress indicator */}
              <motion.div
                className="absolute bottom-0 left-0 h-1 bg-neon-cyan"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1 }}
              />
            </motion.div>
          )}
        </div>
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

      {/* Body Measurements Chart */}
      {measurements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <BodyMeasurementsChart measurements={measurements} />
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
            {isCreatingNew ? 'Новый_замер' : currentMeasurement ? `Неделя_${courseWeek}_Данные` : 'Новая_запись'}
          </h3>
          {currentMeasurement && !isEditing && !isCreatingNew && canSubmitMeasurement && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsCreatingNew(true)}
                className="font-mono text-xs px-2 py-1 border border-neon-lime text-neon-lime hover:bg-neon-lime hover:text-void transition-all"
              >
                [+ НОВЫЙ]
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="font-mono text-xs text-steel-400 hover:text-neon-lime hover:underline"
              >
                [ИЗМЕНИТЬ]
              </button>
            </div>
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

        {/* Show form only when allowed AND (editing OR creating new OR no data yet) */}
        {canSubmitMeasurement && (isEditing || isCreatingNew || !currentMeasurement) ? (
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
              {(isEditing || isCreatingNew) && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false)
                    setIsCreatingNew(false)
                  }}
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

// Экспортируем с Error Boundary
export default function MeasurementsPage() {
  return (
    <MeasurementsErrorBoundary>
      <MeasurementsPageContent />
    </MeasurementsErrorBoundary>
  )
}
