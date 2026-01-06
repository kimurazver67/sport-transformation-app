import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import type { PsychologyAnalysisRecord, BehavioralPattern, KeyInsight, IdentifiedProblem, Recommendation } from '../types'
import { useStore } from '../store'

/**
 * Страница психологического анализа
 *
 * Spec:
 * - Селектор недели
 * - Поведенческие паттерны с оценками и индикаторами
 * - Ключевые инсайты с приоритетами
 * - Выявленные проблемы с причинами
 * - Рекомендации с action steps
 * - Признание прогресса
 * - Фокус на следующую неделю
 * - История анализов (предыдущие недели)
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

        // Проверяем доступность
        const availability = await api.checkPsychologyAvailability(user.id, selectedWeek)

        if (!availability.available) {
          setError(availability.reason || 'Недостаточно данных для анализа')
          return
        }

        // Загружаем анализ
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white px-4 py-6">
        <button
          onClick={() => navigate('/')}
          className="mb-4 flex items-center gap-2 text-white/80 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">Назад</span>
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="text-4xl">🧠</div>
          <div>
            <h1 className="text-2xl font-bold">Психологический анализ</h1>
            <p className="text-sm text-white/80">Твой недельный отчёт от AI психолога</p>
          </div>
        </div>

        {/* Week Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {Array.from({ length: courseWeek || 1 }, (_, i) => i + 1).map((week) => (
            <button
              key={week}
              onClick={() => setSelectedWeek(week)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedWeek === week
                  ? 'bg-white text-purple-700'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Неделя {week}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-4">
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent" />
            <p className="mt-4 text-gray-600">Генерирую анализ...</p>
          </div>
        )}

        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-gray-900 font-medium mb-1">Недостаточно данных</p>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        )}

        {analysis && (
          <>
            {/* Behavioral Patterns */}
            <BehavioralPatternsSection patterns={analysis.analysis.behavioral_patterns} />

            {/* Key Insights */}
            <KeyInsightsSection insights={analysis.analysis.key_insights} />

            {/* Identified Problems */}
            {analysis.analysis.identified_problems.length > 0 && (
              <IdentifiedProblemsSection problems={analysis.analysis.identified_problems} />
            )}

            {/* Recommendations */}
            <RecommendationsSection recommendations={analysis.analysis.recommendations} />

            {/* Progress Recognition */}
            <ProgressRecognitionSection progress={analysis.analysis.progress_recognition} />

            {/* Next Week Focus */}
            <NextWeekFocusSection focus={analysis.analysis.next_week_focus} />

            {/* Data Summary */}
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
    consistency: { label: 'Постоянство', icon: '📅' },
    sleep: { label: 'Сон', icon: '😴' },
    nutrition: { label: 'Питание', icon: '🥗' },
    emotional_state: { label: 'Эмоции', icon: '😊' },
    stress_management: { label: 'Стресс', icon: '🧘' },
    discipline: { label: 'Дисциплина', icon: '💪' },
  }

  const entries = Object.entries(patterns).filter(([_, pattern]) => pattern !== undefined) as [string, BehavioralPattern][]

  if (entries.length === 0) return null

  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Поведенческие паттерны</h2>
      <div className="space-y-3">
        {entries.map(([key, pattern]) => {
          const config = patternLabels[key] || { label: key, icon: '📊' }
          return (
            <div key={key} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{config.icon}</span>
                  <span className="font-medium text-gray-900">{config.label}</span>
                </div>
                <ScoreBadge score={pattern.score} />
              </div>
              <p className="text-sm text-gray-700 mb-1">{pattern.observation}</p>
              {pattern.evidence && pattern.evidence.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {pattern.evidence.map((ev, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {ev}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const ScoreBadge = ({ score }: { score: number }) => {
  const getColor = (score: number) => {
    if (score >= 8) return 'bg-green-100 text-green-800'
    if (score >= 6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getColor(score)}`}>
      {score}/10
    </span>
  )
}

const KeyInsightsSection = ({ insights }: { insights: KeyInsight[] }) => {
  if (insights.length === 0) return null

  const typeConfig = {
    warning: { icon: '⚠️', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', textColor: 'text-amber-900' },
    positive: { icon: '✨', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-900' },
    neutral: { icon: '💡', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-900' },
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-gray-900">Ключевые инсайты</h2>
      {insights.map((insight, i) => {
        const config = typeConfig[insight.type] || typeConfig.neutral
        return (
          <div key={i} className={`${config.bgColor} border ${config.borderColor} rounded-xl p-4`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{config.icon}</span>
              <div className="flex-1">
                <h3 className={`font-semibold ${config.textColor} mb-1`}>{insight.title}</h3>
                <p className="text-sm text-gray-700">{insight.description}</p>
                <div className="mt-2">
                  <span className={`text-xs font-medium ${config.textColor}`}>
                    Приоритет: {insight.priority === 'high' ? 'Высокий' : insight.priority === 'medium' ? 'Средний' : 'Низкий'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const IdentifiedProblemsSection = ({ problems }: { problems: IdentifiedProblem[] }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Выявленные проблемы</h2>
      <div className="space-y-4">
        {problems.map((problem, i) => (
          <div key={i} className="border-l-4 border-red-400 pl-4">
            <h3 className="font-semibold text-gray-900 mb-1">🔍 {problem.problem}</h3>
            <p className="text-sm text-gray-700 mb-2">
              <span className="font-medium">Причина:</span> {problem.root_cause}
            </p>
            <p className="text-sm text-gray-700 mb-2">
              <span className="font-medium">Влияние:</span> {problem.impact}
            </p>
            {problem.evidence && problem.evidence.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {problem.evidence.map((ev, j) => (
                  <span key={j} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded">
                    {ev}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const RecommendationsSection = ({ recommendations }: { recommendations: Recommendation[] }) => {
  const categoryLabels: Record<string, { label: string; icon: string }> = {
    sleep: { label: 'Сон', icon: '😴' },
    nutrition: { label: 'Питание', icon: '🥗' },
    training: { label: 'Тренировки', icon: '🏋️' },
    mindset: { label: 'Мышление', icon: '🧠' },
    stress: { label: 'Стресс', icon: '🧘' },
    recovery: { label: 'Восстановление', icon: '🛀' },
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const sorted = [...recommendations].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Рекомендации</h2>
      <div className="space-y-4">
        {sorted.map((rec, i) => {
          const config = categoryLabels[rec.category] || { label: rec.category, icon: '📋' }
          return (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{config.icon}</span>
                  <h3 className="font-semibold text-gray-900">{config.label}</h3>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                  rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {rec.priority === 'high' ? 'Важно' : rec.priority === 'medium' ? 'Средне' : 'Низко'}
                </span>
              </div>

              <p className="text-sm font-medium text-gray-900 mb-2">✅ {rec.action}</p>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Почему:</span> {rec.why}
              </p>

              {rec.how && rec.how.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Как сделать:</p>
                  <ul className="space-y-1">
                    {rec.how.map((step, j) => (
                      <li key={j} className="text-xs text-gray-600 flex items-start gap-2">
                        <span className="text-purple-600 font-bold">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {rec.expected_result && (
                <p className="text-xs text-green-700 mt-2 bg-green-50 px-2 py-1 rounded">
                  🎯 {rec.expected_result}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const ProgressRecognitionSection = ({ progress }: { progress: { wins: string[]; growth_areas: string[] } }) => {
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
      <h2 className="text-lg font-bold text-gray-900 mb-4">🎉 Признание прогресса</h2>

      {progress.wins.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-green-900 mb-2">Твои победы:</h3>
          <ul className="space-y-1">
            {progress.wins.map((win, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>{win}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {progress.growth_areas.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Области роста:</h3>
          <ul className="space-y-1">
            {progress.growth_areas.map((area, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-blue-600 font-bold">→</span>
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

const NextWeekFocusSection = ({ focus }: { focus: string[] }) => {
  if (focus.length === 0) return null

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
      <h2 className="text-lg font-bold text-gray-900 mb-3">🎯 Фокус на следующую неделю</h2>
      <ul className="space-y-2">
        {focus.map((item, i) => (
          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
            <span className="text-purple-600 font-bold text-lg">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
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
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">📊 Данные недели</h3>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">Чекины:</span>
          <span className="font-medium">{summary.total_checkins}/7</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Тренировки:</span>
          <span className="font-medium">{summary.total_workouts}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Сон (ср):</span>
          <span className="font-medium">{summary.avg_sleep_hours}ч</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Настроение:</span>
          <span className="font-medium">{summary.avg_mood}/5</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Питание:</span>
          <span className="font-medium">{summary.nutrition_adherence}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Импульсы:</span>
          <span className="font-medium">{summary.total_impulses}</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
        Анализ создан: {date}
      </p>
    </div>
  )
}

export default PsychologyPage
