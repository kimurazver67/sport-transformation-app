import { useMemo, useState, useEffect } from 'react'
import type { WeeklyMeasurement } from '../types'

// Динамический импорт chart.js для избежания ошибок SSR/hydration
let ChartJS: any = null
let Line: any = null
let chartLoaded = false

async function loadChart() {
  if (chartLoaded) return true
  try {
    const chartjs = await import('chart.js')
    const reactChartjs = await import('react-chartjs-2')

    ChartJS = chartjs.Chart
    Line = reactChartjs.Line

    ChartJS.register(
      chartjs.CategoryScale,
      chartjs.LinearScale,
      chartjs.PointElement,
      chartjs.LineElement,
      chartjs.Title,
      chartjs.Tooltip,
      chartjs.Legend,
      chartjs.Filler
    )
    chartLoaded = true
    return true
  } catch (error) {
    console.error('Failed to load chart.js:', error)
    return false
  }
}

interface BodyMeasurementsChartProps {
  measurements: WeeklyMeasurement[]
}

// Цвета для разных измерений
const MEASUREMENT_COLORS = {
  chest: { border: '#FF6B00', bg: 'rgba(255, 107, 0, 0.1)' },      // orange
  waist: { border: '#00F5FF', bg: 'rgba(0, 245, 255, 0.1)' },      // cyan
  hips: { border: '#FF00FF', bg: 'rgba(255, 0, 255, 0.1)' },       // magenta
  bicep: { border: '#BFFF00', bg: 'rgba(191, 255, 0, 0.1)' },      // lime
  thigh: { border: '#FFD700', bg: 'rgba(255, 215, 0, 0.1)' },      // gold
}

export default function BodyMeasurementsChart({ measurements }: BodyMeasurementsChartProps) {
  const [isChartReady, setIsChartReady] = useState(chartLoaded)
  const [hasError, setHasError] = useState(false)
  const [visibleLines, setVisibleLines] = useState({
    chest: true,
    waist: true,
    hips: true,
    bicep: true,
    thigh: true,
  })

  useEffect(() => {
    if (!chartLoaded) {
      loadChart()
        .then((success) => {
          setIsChartReady(success)
          if (!success) setHasError(true)
        })
        .catch(() => setHasError(true))
    }
  }, [])

  // Проверяем есть ли данные объёмов
  const hasBodyData = useMemo(() => {
    return measurements.some(m =>
      m.chest || m.waist || m.hips || m.bicep_left || m.bicep_right || m.thigh_left || m.thigh_right
    )
  }, [measurements])

  const chartData = useMemo(() => {
    try {
      const sorted = [...measurements].sort((a, b) => a.week_number - b.week_number)

      const datasets: any[] = []

      if (visibleLines.chest && sorted.some(m => m.chest)) {
        datasets.push({
          label: 'Грудь',
          data: sorted.map((m) => m.chest || null),
          borderColor: MEASUREMENT_COLORS.chest.border,
          backgroundColor: MEASUREMENT_COLORS.chest.bg,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          spanGaps: true,
        })
      }

      if (visibleLines.waist && sorted.some(m => m.waist)) {
        datasets.push({
          label: 'Талия',
          data: sorted.map((m) => m.waist || null),
          borderColor: MEASUREMENT_COLORS.waist.border,
          backgroundColor: MEASUREMENT_COLORS.waist.bg,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          spanGaps: true,
        })
      }

      if (visibleLines.hips && sorted.some(m => m.hips)) {
        datasets.push({
          label: 'Бёдра',
          data: sorted.map((m) => m.hips || null),
          borderColor: MEASUREMENT_COLORS.hips.border,
          backgroundColor: MEASUREMENT_COLORS.hips.bg,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          spanGaps: true,
        })
      }

      if (visibleLines.bicep && sorted.some(m => m.bicep_left || m.bicep_right)) {
        // Среднее бицепсов
        datasets.push({
          label: 'Бицепс (ср.)',
          data: sorted.map((m) => {
            const left = m.bicep_left
            const right = m.bicep_right
            if (left && right) return (left + right) / 2
            return left || right || null
          }),
          borderColor: MEASUREMENT_COLORS.bicep.border,
          backgroundColor: MEASUREMENT_COLORS.bicep.bg,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          spanGaps: true,
        })
      }

      if (visibleLines.thigh && sorted.some(m => m.thigh_left || m.thigh_right)) {
        // Среднее бёдер
        datasets.push({
          label: 'Бедро (ср.)',
          data: sorted.map((m) => {
            const left = m.thigh_left
            const right = m.thigh_right
            if (left && right) return (left + right) / 2
            return left || right || null
          }),
          borderColor: MEASUREMENT_COLORS.thigh.border,
          backgroundColor: MEASUREMENT_COLORS.thigh.bg,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          spanGaps: true,
        })
      }

      return {
        labels: sorted.map((m) => `W${m.week_number}`),
        datasets,
      }
    } catch (error) {
      console.error('Error creating body chart data:', error)
      setHasError(true)
      return null
    }
  }, [measurements, visibleLines])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          color: '#757575',
          font: {
            family: 'JetBrains Mono',
            size: 10,
          },
          boxWidth: 12,
          padding: 8,
        },
      },
      tooltip: {
        backgroundColor: '#111111',
        titleColor: '#00F5FF',
        bodyColor: '#F5F5F5',
        borderColor: '#00F5FF',
        borderWidth: 1,
        padding: 12,
        titleFont: {
          family: 'JetBrains Mono',
          size: 10,
          weight: 'bold' as const,
        },
        bodyFont: {
          family: 'Space Mono',
          size: 12,
        },
        callbacks: {
          title: (context: any) => `WEEK_${context[0].label.replace('W', '')}`,
          label: (context: any) => `${context.dataset.label}: ${context.parsed.y?.toFixed(1) || '—'} см`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 245, 255, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#757575',
          font: {
            family: 'JetBrains Mono',
            size: 10,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 245, 255, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#757575',
          font: {
            family: 'JetBrains Mono',
            size: 10,
          },
          callback: (value: any) => `${value}`,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    animation: {
      duration: 1500,
      easing: 'easeOutQuart' as const,
    },
  }

  // Не показываем если нет данных объёмов
  if (!hasBodyData || measurements.length === 0) {
    return null
  }

  if (hasError || !chartData) {
    return (
      <div className="border-2 border-neon-orange bg-void-200 p-4" style={{ boxShadow: '4px 4px 0 0 #FF6B00' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">⚠️</span>
          <h3 className="font-display font-bold text-neon-orange uppercase">
            График_недоступен
          </h3>
        </div>
        <p className="font-mono text-xs text-steel-500">
          Не удалось загрузить график объёмов.
        </p>
      </div>
    )
  }

  if (!isChartReady || !Line) {
    return (
      <div className="border-2 border-void-400 bg-void-200 p-4" style={{ boxShadow: '4px 4px 0 0 #333' }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📐</span>
          <h3 className="font-display font-bold text-steel-100 uppercase">
            Body_Progress
          </h3>
        </div>
        <div className="h-56 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const toggleLine = (key: keyof typeof visibleLines) => {
    setVisibleLines(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="border-2 border-neon-cyan bg-void-200 p-4" style={{ boxShadow: '4px 4px 0 0 #00F5FF' }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">📐</span>
        <h3 className="font-display font-bold text-steel-100 uppercase">
          Объёмы_тела
        </h3>
        <div className="flex-1 h-px bg-gradient-to-r from-neon-cyan/30 to-transparent" />
      </div>

      {/* Фильтры */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { key: 'chest', label: 'Грудь', color: MEASUREMENT_COLORS.chest.border },
          { key: 'waist', label: 'Талия', color: MEASUREMENT_COLORS.waist.border },
          { key: 'hips', label: 'Бёдра', color: MEASUREMENT_COLORS.hips.border },
          { key: 'bicep', label: 'Бицепс', color: MEASUREMENT_COLORS.bicep.border },
          { key: 'thigh', label: 'Бедро', color: MEASUREMENT_COLORS.thigh.border },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => toggleLine(key as keyof typeof visibleLines)}
            className={`px-2 py-1 font-mono text-[10px] uppercase border transition-all ${
              visibleLines[key as keyof typeof visibleLines]
                ? 'border-current bg-current/10'
                : 'border-void-400 text-steel-500 opacity-50'
            }`}
            style={{
              color: visibleLines[key as keyof typeof visibleLines] ? color : undefined,
              borderColor: visibleLines[key as keyof typeof visibleLines] ? color : undefined,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="h-56">
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
}
