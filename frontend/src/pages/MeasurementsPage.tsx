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
      showAlert('Enter weight value')
      return
    }

    setIsSubmitting(true)
    try {
      await submitMeasurement(formData)
      hapticFeedback('success')
      setIsEditing(false)
      showAlert('Measurements saved!')
    } catch (error) {
      console.error('Failed to submit measurement:', error)
      hapticFeedback('error')
      showAlert('Error saving data')
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
    <div className="min-h-screen pb-24 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="blob -top-32 -right-32 opacity-10" />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-6 pb-4"
      >
        <div className="font-mono text-xs text-steel-500 uppercase tracking-widest mb-1">
          Week_{String(courseWeek).padStart(2, '0')} // Tracking
        </div>
        <h1 className="font-display text-3xl font-bold text-steel-100 uppercase tracking-wider">
          Body_Data
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
                Weight_Delta
              </div>
              <div className={`font-display text-3xl font-bold ${
                weightChange < 0 ? 'text-neon-lime' : weightChange > 0 ? 'text-neon-orange' : 'text-neon-cyan'
              }`}>
                {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] text-steel-500 uppercase">Start → Now</div>
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
            {currentMeasurement ? `Week_${courseWeek}_Data` : 'New_Entry'}
          </h3>
          {currentMeasurement && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="font-mono text-xs text-neon-lime hover:underline"
            >
              [EDIT]
            </button>
          )}
        </div>

        {isEditing || !currentMeasurement ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Weight - Required */}
            <div>
              <label className="block font-mono text-xs text-steel-500 uppercase tracking-wider mb-2">
                Weight (kg) *
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

            {/* Body measurements grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-[10px] text-steel-500 uppercase mb-1">
                  Chest (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.chest || ''}
                  onChange={(e) => handleInputChange('chest', e.target.value)}
                  className="input-brutal"
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] text-steel-500 uppercase mb-1">
                  Waist (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.waist || ''}
                  onChange={(e) => handleInputChange('waist', e.target.value)}
                  className="input-brutal"
                  placeholder="85"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] text-steel-500 uppercase mb-1">
                  Hips (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.hips || ''}
                  onChange={(e) => handleInputChange('hips', e.target.value)}
                  className="input-brutal"
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] text-steel-500 uppercase mb-1">
                  Body Fat %
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.body_fat_percent || ''}
                  onChange={(e) => handleInputChange('body_fat_percent', e.target.value)}
                  className="input-brutal"
                  placeholder="20"
                />
              </div>
            </div>

            {/* Biceps */}
            <div>
              <label className="block font-mono text-[10px] text-steel-500 uppercase mb-1">
                Biceps (cm) - Left / Right
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.5"
                  value={formData.bicep_left || ''}
                  onChange={(e) => handleInputChange('bicep_left', e.target.value)}
                  className="input-brutal"
                  placeholder="L"
                />
                <input
                  type="number"
                  step="0.5"
                  value={formData.bicep_right || ''}
                  onChange={(e) => handleInputChange('bicep_right', e.target.value)}
                  className="input-brutal"
                  placeholder="R"
                />
              </div>
            </div>

            {/* Thighs */}
            <div>
              <label className="block font-mono text-[10px] text-steel-500 uppercase mb-1">
                Thighs (cm) - Left / Right
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.5"
                  value={formData.thigh_left || ''}
                  onChange={(e) => handleInputChange('thigh_left', e.target.value)}
                  className="input-brutal"
                  placeholder="L"
                />
                <input
                  type="number"
                  step="0.5"
                  value={formData.thigh_right || ''}
                  onChange={(e) => handleInputChange('thigh_right', e.target.value)}
                  className="input-brutal"
                  placeholder="R"
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
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 btn-brutal disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save_Data'}
              </button>
            </div>
          </form>
        ) : (
          /* Display current measurements */
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-void-400">
              <span className="font-mono text-xs text-steel-500 uppercase">Weight</span>
              <span className="font-display font-bold text-neon-lime">{currentMeasurement.weight} kg</span>
            </div>
            {currentMeasurement.chest && (
              <div className="flex justify-between py-2 border-b border-void-400">
                <span className="font-mono text-xs text-steel-500 uppercase">Chest</span>
                <span className="font-mono text-steel-200">{currentMeasurement.chest} cm</span>
              </div>
            )}
            {currentMeasurement.waist && (
              <div className="flex justify-between py-2 border-b border-void-400">
                <span className="font-mono text-xs text-steel-500 uppercase">Waist</span>
                <span className="font-mono text-steel-200">{currentMeasurement.waist} cm</span>
              </div>
            )}
            {currentMeasurement.hips && (
              <div className="flex justify-between py-2 border-b border-void-400">
                <span className="font-mono text-xs text-steel-500 uppercase">Hips</span>
                <span className="font-mono text-steel-200">{currentMeasurement.hips} cm</span>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Photo Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="border-2 border-void-400 p-4 bg-void-200/50"
      >
        <div className="flex items-start gap-3">
          <span className="text-xl">📸</span>
          <div>
            <p className="font-mono text-xs text-steel-400">
              To add progress photos, send them to the bot in Telegram.
            </p>
            <p className="font-mono text-[10px] text-steel-500 mt-1">
              Label: "front", "side" or "back"
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
