import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useTelegram } from '../hooks/useTelegram'
import { api } from '../services/api'

type TriggerType = 'stress' | 'boredom' | 'social' | 'emotional' | 'habitual'
type ActionTaken = 'resisted' | 'gave_in' | 'alternative'

interface MindfulnessEntry {
  id: string
  date: string
  gratitude?: string
  wins?: string
  challenges?: string
  lessons?: string
  mood_note?: string
}

interface ImpulseStats {
  total: number
  resisted: number
  gave_in: number
  alternative: number
  by_trigger: Record<string, number>
  resistance_rate: number
}

const triggerOptions: { value: TriggerType; label: string; emoji: string }[] = [
  { value: 'stress', label: 'Стресс', emoji: '😰' },
  { value: 'boredom', label: 'Скука', emoji: '😐' },
  { value: 'social', label: 'Социальное', emoji: '👥' },
  { value: 'emotional', label: 'Эмоции', emoji: '😢' },
  { value: 'habitual', label: 'Привычка', emoji: '🔄' },
]

const actionOptions: { value: ActionTaken; label: string; emoji: string; color: string }[] = [
  { value: 'resisted', label: 'Устоял', emoji: '💪', color: 'neon-lime' },
  { value: 'alternative', label: 'Альтернатива', emoji: '🔄', color: 'neon-cyan' },
  { value: 'gave_in', label: 'Сдался', emoji: '😔', color: 'neon-orange' },
]

export default function MindfulnessPage() {
  const { user } = useStore()
  const { hapticFeedback, showAlert } = useTelegram()

  const [activeTab, setActiveTab] = useState<'diary' | 'impulse'>('diary')

  // Diary state
  const [diaryForm, setDiaryForm] = useState({
    gratitude: '',
    wins: '',
    challenges: '',
    lessons: '',
    mood_note: '',
  })
  const [todayEntry, setTodayEntry] = useState<MindfulnessEntry | null>(null)
  const [recentEntries, setRecentEntries] = useState<MindfulnessEntry[]>([])
  const [isSavingDiary, setIsSavingDiary] = useState(false)

  // Impulse state
  const [showImpulseModal, setShowImpulseModal] = useState(false)
  const [impulseForm, setImpulseForm] = useState({
    trigger_type: 'stress' as TriggerType,
    intensity: 5,
    action_taken: 'resisted' as ActionTaken,
    notes: '',
  })
  const [impulseStats, setImpulseStats] = useState<ImpulseStats | null>(null)
  const [isSavingImpulse, setIsSavingImpulse] = useState(false)

  useEffect(() => {
    if (user?.id) {
      fetchData()
    }
  }, [user?.id])

  const fetchData = async () => {
    if (!user?.id) return

    try {
      const [today, recent, stats] = await Promise.all([
        api.getTodayMindfulness(user.id).catch(() => null),
        api.getRecentMindfulness(user.id, 7).catch(() => []),
        api.getImpulseStats(user.id, 7).catch(() => null),
      ])

      if (today) {
        setTodayEntry(today)
        setDiaryForm({
          gratitude: today.gratitude || '',
          wins: today.wins || '',
          challenges: today.challenges || '',
          lessons: today.lessons || '',
          mood_note: today.mood_note || '',
        })
      }

      setRecentEntries(recent)
      setImpulseStats(stats)
    } catch (err) {
      console.error('Failed to fetch mindfulness data:', err)
    }
  }

  const saveDiary = async () => {
    if (!user?.id) return

    setIsSavingDiary(true)
    try {
      await api.saveMindfulness(user.id, diaryForm)
      hapticFeedback('success')
      showAlert('Запись сохранена!')
      fetchData()
    } catch (err) {
      hapticFeedback('error')
      showAlert('Ошибка сохранения')
    } finally {
      setIsSavingDiary(false)
    }
  }

  const logImpulse = async () => {
    if (!user?.id) return

    setIsSavingImpulse(true)
    try {
      await api.logImpulse(user.id, impulseForm)
      hapticFeedback('success')
      showAlert('Импульс записан!')
      setShowImpulseModal(false)
      setImpulseForm({
        trigger_type: 'stress',
        intensity: 5,
        action_taken: 'resisted',
        notes: '',
      })
      fetchData()
    } catch (err) {
      hapticFeedback('error')
      showAlert('Ошибка записи')
    } finally {
      setIsSavingImpulse(false)
    }
  }

  const hasDiaryContent = Object.values(diaryForm).some(v => v.trim())

  return (
    <div className="min-h-screen pb-4 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="blob -top-32 -right-32 opacity-10" style={{ background: 'radial-gradient(circle, #FF00FF 0%, transparent 70%)' }} />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-6 pb-4"
      >
        <div className="font-mono text-xs text-steel-500 uppercase tracking-widest mb-1">
          Психология // Осознанность
        </div>
        <h1 className="font-display text-3xl font-bold text-steel-100 uppercase tracking-wider">
          Дневник_ума
        </h1>
      </motion.header>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-1 mb-6 border-b-2 border-void-400"
      >
        {[
          { id: 'diary', label: 'Дневник', emoji: '📝' },
          { id: 'impulse', label: 'Импульсы', emoji: '🎯' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              hapticFeedback('light')
              setActiveTab(tab.id as 'diary' | 'impulse')
            }}
            className={`flex-1 py-3 font-mono text-sm uppercase tracking-wider transition-all relative ${
              activeTab === tab.id
                ? 'text-neon-magenta'
                : 'text-steel-500 hover:text-steel-300'
            }`}
          >
            {tab.emoji} {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTabMind"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-magenta"
              />
            )}
          </button>
        ))}
      </motion.div>

      {/* Diary Tab */}
      {activeTab === 'diary' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* Today's Entry */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-void-200 border-2 border-neon-magenta p-4"
            style={{ boxShadow: '6px 6px 0 0 #FF00FF' }}
          >
            <div className="font-mono text-xs text-steel-500 uppercase tracking-widest mb-4">
              Запись на сегодня {todayEntry ? '(редактирование)' : '(новая)'}
            </div>

            {/* Gratitude */}
            <div className="mb-4">
              <label className="flex items-center gap-2 font-mono text-xs text-steel-400 uppercase mb-2">
                <span>🙏</span> За что благодарен сегодня?
              </label>
              <textarea
                value={diaryForm.gratitude}
                onChange={(e) => setDiaryForm({ ...diaryForm, gratitude: e.target.value })}
                placeholder="Напиши 1-3 вещи..."
                rows={2}
                className="input-brutal w-full resize-none text-sm"
              />
            </div>

            {/* Wins */}
            <div className="mb-4">
              <label className="flex items-center gap-2 font-mono text-xs text-steel-400 uppercase mb-2">
                <span>🏆</span> Маленькие победы дня
              </label>
              <textarea
                value={diaryForm.wins}
                onChange={(e) => setDiaryForm({ ...diaryForm, wins: e.target.value })}
                placeholder="Чем гордишься сегодня?"
                rows={2}
                className="input-brutal w-full resize-none text-sm"
              />
            </div>

            {/* Challenges */}
            <div className="mb-4">
              <label className="flex items-center gap-2 font-mono text-xs text-steel-400 uppercase mb-2">
                <span>💪</span> С чем было сложно?
              </label>
              <textarea
                value={diaryForm.challenges}
                onChange={(e) => setDiaryForm({ ...diaryForm, challenges: e.target.value })}
                placeholder="Какие трудности преодолел?"
                rows={2}
                className="input-brutal w-full resize-none text-sm"
              />
            </div>

            {/* Lessons */}
            <div className="mb-4">
              <label className="flex items-center gap-2 font-mono text-xs text-steel-400 uppercase mb-2">
                <span>💡</span> Что понял/узнал?
              </label>
              <textarea
                value={diaryForm.lessons}
                onChange={(e) => setDiaryForm({ ...diaryForm, lessons: e.target.value })}
                placeholder="Инсайты и уроки дня..."
                rows={2}
                className="input-brutal w-full resize-none text-sm"
              />
            </div>

            {/* Mood Note */}
            <div className="mb-4">
              <label className="flex items-center gap-2 font-mono text-xs text-steel-400 uppercase mb-2">
                <span>🎭</span> Заметка о настроении
              </label>
              <input
                type="text"
                value={diaryForm.mood_note}
                onChange={(e) => setDiaryForm({ ...diaryForm, mood_note: e.target.value })}
                placeholder="Как себя чувствуешь?"
                className="input-brutal w-full text-sm"
              />
            </div>

            <button
              onClick={saveDiary}
              disabled={isSavingDiary || !hasDiaryContent}
              className="btn-brutal w-full disabled:opacity-50"
            >
              {isSavingDiary ? 'Сохранение...' : todayEntry ? 'Обновить запись' : 'Сохранить запись'}
            </button>
          </motion.div>

          {/* Recent Entries */}
          {recentEntries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="font-mono text-xs text-steel-500 uppercase tracking-widest mb-3">
                Последние записи
              </div>
              <div className="space-y-2">
                {recentEntries.slice(0, 5).map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-void-200 border border-void-400 p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs text-neon-magenta">
                        {new Date(entry.date).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <div className="flex gap-1">
                        {entry.gratitude && <span title="Благодарность">🙏</span>}
                        {entry.wins && <span title="Победы">🏆</span>}
                        {entry.challenges && <span title="Трудности">💪</span>}
                        {entry.lessons && <span title="Уроки">💡</span>}
                      </div>
                    </div>
                    {entry.mood_note && (
                      <p className="font-mono text-xs text-steel-400 truncate">
                        {entry.mood_note}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Impulse Tab */}
      {activeTab === 'impulse' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* Quick Log Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => {
              hapticFeedback('light')
              setShowImpulseModal(true)
            }}
            className="w-full bg-void-200 border-2 border-neon-orange p-6 text-center"
            style={{ boxShadow: '6px 6px 0 0 #FF6B00' }}
          >
            <div className="text-4xl mb-2">🎯</div>
            <div className="font-display text-xl font-bold text-neon-orange uppercase">
              Записать импульс
            </div>
            <p className="font-mono text-xs text-steel-400 mt-2">
              Когда хочется сорваться — запиши
            </p>
          </motion.button>

          {/* Stats */}
          {impulseStats && impulseStats.total > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-void-200 border-2 border-void-400 p-4"
              style={{ boxShadow: '4px 4px 0 0 rgba(191, 255, 0, 0.2)' }}
            >
              <div className="font-mono text-xs text-steel-500 uppercase tracking-widest mb-4">
                Статистика за 7 дней
              </div>

              {/* Resistance Rate */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-sm text-steel-300">Сила воли</span>
                  <span className="font-display text-2xl font-bold text-neon-lime">
                    {Math.round(impulseStats.resistance_rate)}%
                  </span>
                </div>
                <div className="h-3 bg-void-400 border border-void-300 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${impulseStats.resistance_rate}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full"
                    style={{
                      background: 'repeating-linear-gradient(-45deg, #BFFF00, #BFFF00 4px, #9FCC00 4px, #9FCC00 8px)'
                    }}
                  />
                </div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 border border-neon-lime/30">
                  <div className="font-display text-xl font-bold text-neon-lime">
                    {impulseStats.resisted}
                  </div>
                  <div className="font-mono text-[9px] text-steel-500">УСТОЯЛ</div>
                </div>
                <div className="text-center p-2 border border-neon-cyan/30">
                  <div className="font-display text-xl font-bold text-neon-cyan">
                    {impulseStats.alternative}
                  </div>
                  <div className="font-mono text-[9px] text-steel-500">АЛЬТЕРН.</div>
                </div>
                <div className="text-center p-2 border border-neon-orange/30">
                  <div className="font-display text-xl font-bold text-neon-orange">
                    {impulseStats.gave_in}
                  </div>
                  <div className="font-mono text-[9px] text-steel-500">СДАЛСЯ</div>
                </div>
              </div>

              {/* By Trigger */}
              {Object.keys(impulseStats.by_trigger).length > 0 && (
                <div className="mt-4 pt-4 border-t border-void-400">
                  <div className="font-mono text-[10px] text-steel-500 uppercase mb-2">
                    По триггерам
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(impulseStats.by_trigger).map(([trigger, count]) => {
                      const opt = triggerOptions.find(t => t.value === trigger)
                      return (
                        <span
                          key={trigger}
                          className="px-2 py-1 bg-void-300 border border-void-400 font-mono text-xs text-steel-300"
                        >
                          {opt?.emoji} {count}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Empty State */}
          {(!impulseStats || impulseStats.total === 0) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="text-4xl mb-2">🧘</div>
              <p className="font-mono text-sm text-steel-500">
                Пока нет записей об импульсах
              </p>
              <p className="font-mono text-xs text-steel-600 mt-2">
                Записывай, когда хочется сорваться
              </p>
            </motion.div>
          )}

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-void-200 border border-void-400 p-4"
          >
            <div className="font-mono text-xs text-steel-500 uppercase tracking-widest mb-3">
              Как использовать
            </div>
            <ul className="space-y-2 font-mono text-xs text-steel-400">
              <li className="flex items-start gap-2">
                <span className="text-neon-lime">1.</span>
                Почувствовал желание сорваться? Нажми кнопку
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neon-lime">2.</span>
                Выбери что вызвало импульс (триггер)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neon-lime">3.</span>
                Оцени силу желания (1-10)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neon-lime">4.</span>
                Запиши что сделал: устоял, альтернатива или сдался
              </li>
            </ul>
          </motion.div>
        </motion.div>
      )}

      {/* Impulse Modal */}
      <AnimatePresence>
        {showImpulseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-void/80 flex items-center justify-center p-4 z-50"
            onClick={() => setShowImpulseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-void-200 border-2 border-neon-orange p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
              style={{ boxShadow: '8px 8px 0 0 #FF6B00' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="font-mono text-xs text-steel-500 uppercase tracking-widest mb-4">
                Записать импульс
              </div>

              {/* Trigger Type */}
              <div className="mb-4">
                <label className="font-mono text-xs text-steel-400 uppercase block mb-2">
                  Что вызвало?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {triggerOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setImpulseForm({ ...impulseForm, trigger_type: opt.value })}
                      className={`p-2 text-center border-2 transition-all ${
                        impulseForm.trigger_type === opt.value
                          ? 'border-neon-orange bg-neon-orange/10'
                          : 'border-void-400 hover:border-steel-500'
                      }`}
                    >
                      <span className="text-xl block">{opt.emoji}</span>
                      <span className="font-mono text-[9px] text-steel-400">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Intensity */}
              <div className="mb-4">
                <label className="font-mono text-xs text-steel-400 uppercase block mb-2">
                  Сила желания: <span className="text-neon-orange">{impulseForm.intensity}/10</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={impulseForm.intensity}
                  onChange={(e) => setImpulseForm({ ...impulseForm, intensity: parseInt(e.target.value) })}
                  className="w-full accent-neon-orange"
                />
                <div className="flex justify-between font-mono text-[10px] text-steel-500">
                  <span>Слабое</span>
                  <span>Сильное</span>
                </div>
              </div>

              {/* Action Taken */}
              <div className="mb-4">
                <label className="font-mono text-xs text-steel-400 uppercase block mb-2">
                  Что сделал?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {actionOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setImpulseForm({ ...impulseForm, action_taken: opt.value })}
                      className={`p-3 text-center border-2 transition-all ${
                        impulseForm.action_taken === opt.value
                          ? `border-${opt.color} bg-${opt.color}/10`
                          : 'border-void-400 hover:border-steel-500'
                      }`}
                    >
                      <span className="text-2xl block">{opt.emoji}</span>
                      <span className="font-mono text-[10px] text-steel-400">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="font-mono text-xs text-steel-400 uppercase block mb-2">
                  Заметка (опционально)
                </label>
                <textarea
                  value={impulseForm.notes}
                  onChange={(e) => setImpulseForm({ ...impulseForm, notes: e.target.value })}
                  placeholder="Что помогло устоять? Что было сложно?"
                  rows={2}
                  className="input-brutal w-full resize-none text-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowImpulseModal(false)}
                  className="btn-brutal-outline flex-1"
                  disabled={isSavingImpulse}
                >
                  Отмена
                </button>
                <button
                  onClick={logImpulse}
                  className="btn-brutal flex-1"
                  disabled={isSavingImpulse}
                >
                  {isSavingImpulse ? '...' : 'Записать'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
