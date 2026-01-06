import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../services/api'
import type { PsychologyAnalysisRecord, BehavioralPattern, KeyInsight, IdentifiedProblem, Recommendation } from '../types'
import { useStore } from '../store'

/**
 * Страница психологического анализа в Brutal Cyberpunk стиле
 */

const PsychologyPage = () => {
  const navigate = useNavigate()
  const user = useStore((state) => state.user)
  const courseWeek = useStore((state) => state.courseWeek)

  const [selectedWeek, setSelectedWeek] = useState(courseWeek || 1)
  const [analysis, setAnalysis] = useState<PsychologyAnalysisRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id || selectedWeek === undefined) return

    const fetchAnalysis = async () => {
      try {
        setLoading(true)
        setError(null)

        const availability = await api.checkPsychologyAvailability(user.id, selectedWeek)

        if (!availability.available) {
          setError(availability.reason || 'Недостаточно данных для анализа')
          return
        }

        const result = await api.getPsychologyAnalysis(user.id, selectedWeek, false)
        setAnalysis(result)
      } catch (err) {
        console.error('Failed to fetch psychology analysis:', err)
        setError(err instanceof Error ? err.message : 'Ошибка загрузки анализа')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysis()
  }, [user?.id, selectedWeek])

  if (!user) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-neon-lime border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-void pb-20">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-void-200 border-b-2 border-void-400 px-4 py-4 relative"
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-lime/50 to-transparent" />

        <button
          onClick={() => navigate('/')}
          className="mb-4 flex items-center gap-2 text-steel-400 hover:text-neon-lime transition-colors font-mono text-xs"
        >
          <span className="text-neon-lime">[</span> НАЗАД <span className="text-neon-lime">]</span>
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="text-4xl">🧠</div>
          <div>
            <h1 className="font-display text-2xl font-bold text-steel-100 uppercase tracking-wider">
              AI_Психолог
            </h1>
            <p className="font-mono text-xs text-steel-500 uppercase">Анализ_поведения</p>
          </div>
        </div>

        {/* Week Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {Array.from({ length: courseWeek || 1 }, (_, i) => i + 1).map((week) => (
            <button
              key={week}
              onClick={() => setSelectedWeek(week)}
              className={`px-4 py-2 border-2 font-mono text-xs font-bold uppercase whitespace-nowrap transition-all ${
                selectedWeek === week
                  ? 'border-neon-lime bg-neon-lime/10 text-neon-lime'
                  : 'border-void-400 bg-void-300 text-steel-400 hover:border-steel-400'
              }`}
            >
              W_{String(week).padStart(2, '0')}
            </button>
          ))}
        </div>
      </motion.header>

      {/* Content */}
      <div className="px-4 py-6 space-y-4">
        {loading && (
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="inline-block w-12 h-12 border-4 border-neon-lime border-t-transparent rounded-full"
            />
            <p className="mt-4 font-mono text-xs text-steel-400 uppercase">Генерация_анализа...</p>
          </div>
        )}

        {error && (
          <div className="brutal-card border-2 border-yellow-400 bg-yellow-400/5 p-6 text-center">
            <div className="text-4xl mb-3">📊</div>
            <p className="font-display font-bold text-steel-100 mb-1 uppercase">Недостаточно_данных</p>
            <p className="font-mono text-xs text-steel-500">{error}</p>
          </div>
        )}

        {analysis && (
          <>
            <BehavioralPatternsSection patterns={analysis.analysis.behavioral_patterns} />
            <KeyInsightsSection insights={analysis.analysis.key_insights} />
            {analysis.analysis.identified_problems.length > 0 && (
              <IdentifiedProblemsSection problems={analysis.analysis.identified_problems} />
            )}
            <RecommendationsSection recommendations={analysis.analysis.recommendations} />
            <ProgressRecognitionSection progress={analysis.analysis.progress_recognition} />
            <NextWeekFocusSection focus={analysis.analysis.next_week_focus} />
            <DataSummarySection summary={analysis.data_summary} createdAt={analysis.created_at} />
          </>
        )}
      </div>
    </div>
  )
}

// ========== SUB-COMPONENTS ==========

const BehavioralPatternsSection = ({ patterns }: { patterns: Record<string, BehavioralPattern | undefined> }) => {
  const patternLabels: Record<string, { label: string; icon: string }> = {
    consistency: { label: 'ПОСТОЯНСТВО', icon: '📅' },
    sleep: { label: 'СОН', icon: '😴' },
    nutrition: { label: 'ПИТАНИЕ', icon: '🥗' },
    emotional_state: { label: 'ЭМОЦИИ', icon: '😊' },
    stress_management: { label: 'СТРЕСС', icon: '🧘' },
    discipline: { label: 'ДИСЦИПЛИНА', icon: '💪' },
  }

  const entries = Object.entries(patterns).filter(([_, pattern]) => pattern !== undefined) as [string, BehavioralPattern][]

  if (entries.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="brutal-card"
    >
      <h2 className="font-display font-bold text-steel-100 uppercase tracking-wider mb-4 text-sm">
        <span className="text-neon-lime">[</span> Поведенческие_паттерны <span className="text-neon-lime">]</span>
      </h2>
      <div className="space-y-3">
        {entries.map(([key, pattern]) => {
          const config = patternLabels[key] || { label: key, icon: '📊' }
          return (
            <div key={key} className="border-b border-void-400 last:border-0 pb-3 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{config.icon}</span>
                  <span className="font-mono text-xs font-bold text-steel-100 uppercase">{config.label}</span>
                </div>
                <ScoreBadge score={pattern.score} />
              </div>
              <p className="font-mono text-xs text-steel-400 mb-1">{pattern.observation}</p>
              {pattern.evidence && pattern.evidence.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {pattern.evidence.map((ev, i) => (
                    <span key={i} className="text-[10px] font-mono bg-void-300 text-steel-500 px-2 py-1 border border-void-400">
                      {ev}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

const ScoreBadge = ({ score }: { score: number }) => {
  const getColor = (score: number) => {
    if (score >= 8) return 'border-neon-lime text-neon-lime bg-neon-lime/10'
    if (score >= 6) return 'border-yellow-400 text-yellow-400 bg-yellow-400/10'
    return 'border-red-400 text-red-400 bg-red-400/10'
  }

  return (
    <span className={`px-2 py-1 border-2 font-mono text-xs font-bold ${getColor(score)}`}>
      {score}/10
    </span>
  )
}

const KeyInsightsSection = ({ insights }: { insights: KeyInsight[] }) => {
  if (insights.length === 0) return null

  const typeConfig = {
    warning: { icon: '⚠️', borderColor: 'border-yellow-400', bgColor: 'bg-yellow-400/5', textColor: 'text-yellow-400' },
    positive: { icon: '✨', borderColor: 'border-neon-lime', bgColor: 'bg-neon-lime/5', textColor: 'text-neon-lime' },
    neutral: { icon: '💡', borderColor: 'border-neon-cyan', bgColor: 'bg-neon-cyan/5', textColor: 'text-neon-cyan' },
  }

  return (
    <div className="space-y-3">
      <h2 className="font-display font-bold text-steel-100 uppercase tracking-wider text-sm">
        <span className="text-neon-lime">[</span> Ключевые_инсайты <span className="text-neon-lime">]</span>
      </h2>
      {insights.map((insight, i) => {
        const config = typeConfig[insight.type] || typeConfig.neutral
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`border-2 ${config.borderColor} ${config.bgColor} p-4`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{config.icon}</span>
              <div className="flex-1">
                <h3 className={`font-display font-bold ${config.textColor} mb-1 uppercase text-xs`}>{insight.title}</h3>
                <p className="font-mono text-xs text-steel-400">{insight.description}</p>
                <div className="mt-2">
                  <span className={`font-mono text-[10px] font-bold ${config.textColor}`}>
                    PRIORITY: {insight.priority.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

const IdentifiedProblemsSection = ({ problems }: { problems: IdentifiedProblem[] }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="brutal-card border-l-4 border-red-400"
    >
      <h2 className="font-display font-bold text-steel-100 uppercase tracking-wider mb-4 text-sm">
        <span className="text-red-400">[</span> Выявленные_проблемы <span className="text-red-400">]</span>
      </h2>
      <div className="space-y-4">
        {problems.map((problem, i) => (
          <div key={i} className="border-l-2 border-red-400 pl-4">
            <h3 className="font-display font-bold text-steel-100 mb-1 text-xs uppercase">🔍 {problem.problem}</h3>
            <p className="font-mono text-xs text-steel-400 mb-2">
              <span className="font-bold text-steel-300">ПРИЧИНА:</span> {problem.root_cause}
            </p>
            <p className="font-mono text-xs text-steel-400 mb-2">
              <span className="font-bold text-steel-300">ВЛИЯНИЕ:</span> {problem.impact}
            </p>
            {problem.evidence && problem.evidence.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {problem.evidence.map((ev, j) => (
                  <span key={j} className="text-[10px] font-mono bg-red-400/10 text-red-400 px-2 py-1 border border-red-400">
                    {ev}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

const RecommendationsSection = ({ recommendations }: { recommendations: Recommendation[] }) => {
  const categoryLabels: Record<string, { label: string; icon: string }> = {
    sleep: { label: 'СОН', icon: '😴' },
    nutrition: { label: 'ПИТАНИЕ', icon: '🥗' },
    training: { label: 'ТРЕНИРОВКИ', icon: '🏋️' },
    mindset: { label: 'МЫШЛЕНИЕ', icon: '🧠' },
    stress: { label: 'СТРЕСС', icon: '🧘' },
    recovery: { label: 'ВОССТАНОВЛЕНИЕ', icon: '🛀' },
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const sorted = [...recommendations].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="brutal-card"
    >
      <h2 className="font-display font-bold text-steel-100 uppercase tracking-wider mb-4 text-sm">
        <span className="text-neon-lime">[</span> Рекомендации <span className="text-neon-lime">]</span>
      </h2>
      <div className="space-y-4">
        {sorted.map((rec, i) => {
          const config = categoryLabels[rec.category] || { label: rec.category, icon: '📋' }
          return (
            <div key={i} className="border-2 border-void-400 bg-void-300 p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{config.icon}</span>
                  <h3 className="font-display font-bold text-steel-100 uppercase text-xs">{config.label}</h3>
                </div>
                <span className={`text-[10px] font-mono px-2 py-1 border ${
                  rec.priority === 'high' ? 'border-red-400 text-red-400 bg-red-400/10' :
                  rec.priority === 'medium' ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10' :
                  'border-steel-400 text-steel-400 bg-steel-400/10'
                }`}>
                  {rec.priority === 'high' ? 'HIGH' : rec.priority === 'medium' ? 'MED' : 'LOW'}
                </span>
              </div>

              <p className="font-mono text-xs font-bold text-steel-100 mb-2">✅ {rec.action}</p>
              <p className="font-mono text-xs text-steel-400 mb-2">
                <span className="font-bold text-steel-300">WHY:</span> {rec.why}
              </p>

              {rec.how && rec.how.length > 0 && (
                <div className="mt-3">
                  <p className="font-mono text-[10px] font-bold text-steel-300 mb-1 uppercase">How:</p>
                  <ul className="space-y-1">
                    {rec.how.map((step, j) => (
                      <li key={j} className="font-mono text-xs text-steel-400 flex items-start gap-2">
                        <span className="text-neon-lime font-bold">→</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {rec.expected_result && (
                <p className="font-mono text-xs text-neon-lime mt-2 bg-neon-lime/10 px-2 py-1 border border-neon-lime">
                  🎯 {rec.expected_result}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

const ProgressRecognitionSection = ({ progress }: { progress: { wins: string[]; growth_areas: string[] } }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="brutal-card border-2 border-neon-lime bg-neon-lime/5"
    >
      <h2 className="font-display font-bold text-steel-100 mb-4 uppercase tracking-wider text-sm">
        🎉 <span className="text-neon-lime">[</span> Признание_прогресса <span className="text-neon-lime">]</span>
      </h2>

      {progress.wins.length > 0 && (
        <div className="mb-4">
          <h3 className="font-mono text-xs font-bold text-neon-lime mb-2 uppercase">Твои_победы:</h3>
          <ul className="space-y-1">
            {progress.wins.map((win, i) => (
              <li key={i} className="font-mono text-xs text-steel-400 flex items-start gap-2">
                <span className="text-neon-lime font-bold">✓</span>
                <span>{win}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {progress.growth_areas.length > 0 && (
        <div>
          <h3 className="font-mono text-xs font-bold text-neon-cyan mb-2 uppercase">Области_роста:</h3>
          <ul className="space-y-1">
            {progress.growth_areas.map((area, i) => (
              <li key={i} className="font-mono text-xs text-steel-400 flex items-start gap-2">
                <span className="text-neon-cyan font-bold">→</span>
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}

const NextWeekFocusSection = ({ focus }: { focus: string[] }) => {
  if (focus.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="brutal-card border-2 border-neon-magenta bg-neon-magenta/5"
    >
      <h2 className="font-display font-bold text-steel-100 mb-3 uppercase tracking-wider text-sm">
        🎯 <span className="text-neon-magenta">[</span> Фокус_на_следующую_неделю <span className="text-neon-magenta">]</span>
      </h2>
      <ul className="space-y-2">
        {focus.map((item, i) => (
          <li key={i} className="font-mono text-xs text-steel-400 flex items-start gap-2">
            <span className="text-neon-magenta font-bold text-lg">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

const DataSummarySection = ({ summary, createdAt }: { summary: any; createdAt: string }) => {
  const date = new Date(createdAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="brutal-card bg-void-300 border-void-400"
    >
      <h3 className="font-mono text-xs font-bold text-steel-100 mb-3 uppercase">
        <span className="text-neon-cyan">[</span> Данные_недели <span className="text-neon-cyan">]</span>
      </h3>
      <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
        <div className="flex justify-between">
          <span className="text-steel-500">ЧЕКИНЫ:</span>
          <span className="font-bold text-steel-100">{summary.total_checkins}/7</span>
        </div>
        <div className="flex justify-between">
          <span className="text-steel-500">ТРЕНЬКИ:</span>
          <span className="font-bold text-steel-100">{summary.total_workouts}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-steel-500">СОН_СР:</span>
          <span className="font-bold text-steel-100">{summary.avg_sleep_hours}ч</span>
        </div>
        <div className="flex justify-between">
          <span className="text-steel-500">НАСТР:</span>
          <span className="font-bold text-steel-100">{summary.avg_mood}/5</span>
        </div>
        <div className="flex justify-between">
          <span className="text-steel-500">ПИТАНИЕ:</span>
          <span className="font-bold text-steel-100">{summary.nutrition_adherence}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-steel-500">ИМПУЛЬСЫ:</span>
          <span className="font-bold text-steel-100">{summary.total_impulses}</span>
        </div>
      </div>
      <p className="font-mono text-[10px] text-steel-500 mt-3 pt-3 border-t border-void-400">
        CREATED: {date}
      </p>
    </motion.div>
  )
}

export default PsychologyPage
