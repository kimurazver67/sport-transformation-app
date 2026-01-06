import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import type { PsychologyAnalysisRecord } from '../types'
import { useStore } from '../store'

/**
 * Компактная карточка психологического инсайта для HomePage
 *
 * Spec:
 * - Показывает ключевой инсайт недели (самый приоритетный)
 * - Иконка в зависимости от типа (warning/positive/neutral)
 * - Клик открывает полный психологический анализ
 * - Лоадер при загрузке
 * - Состояние "нет данных" если недостаточно данных для анализа
 */

const PsychologyInsight = () => {
  const navigate = useNavigate()
  const user = useStore((state) => state.user)
  const courseWeek = useStore((state) => state.courseWeek)

  const [analysis, setAnalysis] = useState<PsychologyAnalysisRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id || courseWeek === undefined) return

    const fetchAnalysis = async () => {
      try {
        setLoading(true)
        setError(null)

        // Сначала проверяем доступность
        const availability = await api.checkPsychologyAvailability(user.id, courseWeek)

        if (!availability.available) {
          setError(availability.reason || 'Недостаточно данных для анализа')
          return
        }

        // Загружаем анализ (из кеша или генерируем)
        const result = await api.getPsychologyAnalysis(user.id, courseWeek, false)
        setAnalysis(result)
      } catch (err) {
        console.error('Failed to fetch psychology analysis:', err)
        setError(err instanceof Error ? err.message : 'Ошибка загрузки анализа')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysis()
  }, [user?.id, courseWeek])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🧠</div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Психологический анализ</p>
            <p className="text-xs text-gray-500 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!analysis) return null

  // Получаем ключевой инсайт с наивысшим приоритетом
  const keyInsight = analysis.analysis.key_insights
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })[0]

  if (!keyInsight) return null

  // Иконка и цвет в зависимости от типа
  const typeConfig = {
    warning: { icon: '⚠️', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
    positive: { icon: '✨', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
    neutral: { icon: '💡', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  }

  const config = typeConfig[keyInsight.type] || typeConfig.neutral

  return (
    <button
      onClick={() => navigate('/psychology')}
      className={`w-full ${config.bgColor} rounded-xl p-4 border ${config.borderColor}
                  hover:shadow-lg transition-all duration-200 active:scale-98 text-left`}
    >
      <div className="flex items-start gap-3">
        <div className="text-3xl flex-shrink-0">{config.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-gray-900">{keyInsight.title}</p>
            <span className="text-xs text-gray-500">Неделя {courseWeek}</span>
          </div>
          <p className="text-xs text-gray-600 line-clamp-2">{keyInsight.description}</p>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-xs font-medium text-blue-600">Подробнее</span>
            <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </button>
  )
}

export default PsychologyInsight
