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
      chartjs.Filler
    )
    chartLoaded = true
    return true
  } catch (error) {
    console.error('Failed to load chart.js:', error)
    return false
  }
}

interface WeightChartProps {
  measurements: WeeklyMeasurement[]
}

export default function WeightChart({ measurements }: WeightChartProps) {
  const [isChartReady, setIsChartReady] = useState(chartLoaded)
  const [hasError, setHasError] = useState(false)

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

  const chartData = useMemo(() => {
    try {
      const sorted = [...measurements].sort((a, b) => a.week_number - b.week_number)

      return {
        labels: sorted.map((m) => `W${m.week_number}`),
        datasets: [
          {
            label: 'Weight (kg)',
            data: sorted.map((m) => m.weight),
            fill: true,
            borderColor: '#BFFF00',
            backgroundColor: 'rgba(191, 255, 0, 0.1)',
            tension: 0.4,
            pointBackgroundColor: '#BFFF00',
            pointBorderColor: '#050505',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: '#00F5FF',
            pointHoverBorderColor: '#050505',
          },
        ],
      }
    } catch (error) {
      console.error('Error creating chart data:', error)
      setHasError(true)
      return null
    }
  }, [measurements])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#111111',
        titleColor: '#BFFF00',
        bodyColor: '#F5F5F5',
        borderColor: '#BFFF00',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        titleFont: {
          family: 'JetBrains Mono',
          size: 10,
          weight: 'bold' as const,
        },
        bodyFont: {
          family: 'Space Mono',
          size: 14,
          weight: 'bold' as const,
        },
        callbacks: {
          title: (context: any) => `WEEK_${context[0].label.replace('W', '')}`,
          label: (context: any) => `${context.parsed.y} kg`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(191, 255, 0, 0.1)',
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
          color: 'rgba(191, 255, 0, 0.1)',
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

  if (measurements.length === 0) {
    return (
      <div className="border-2 border-void-400 p-8 text-center">
        <span className="text-4xl block mb-3">📊</span>
        <p className="font-mono text-sm text-steel-500">NO_DATA_AVAILABLE</p>
      </div>
    )
  }

  // Показываем ошибку если chart.js не загрузился
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
          Не удалось загрузить график. Данные замеров сохранены.
        </p>
      </div>
    )
  }

  // Показываем загрузку пока chart.js грузится
  if (!isChartReady || !Line) {
    return (
      <div className="border-2 border-void-400 bg-void-200 p-4" style={{ boxShadow: '4px 4px 0 0 #333' }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📈</span>
          <h3 className="font-display font-bold text-steel-100 uppercase">
            Weight_Progress
          </h3>
        </div>
        <div className="h-48 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-neon-lime border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="border-2 border-neon-lime bg-void-200 p-4" style={{ boxShadow: '4px 4px 0 0 #BFFF00' }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📈</span>
        <h3 className="font-display font-bold text-steel-100 uppercase">
          Weight_Progress
        </h3>
        <div className="flex-1 h-px bg-gradient-to-r from-neon-lime/30 to-transparent" />
      </div>
      <div className="h-48">
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
}
