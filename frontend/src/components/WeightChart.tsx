import { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { WeeklyMeasurement } from '../../shared/types'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
)

interface WeightChartProps {
  measurements: WeeklyMeasurement[]
}

export default function WeightChart({ measurements }: WeightChartProps) {
  const chartData = useMemo(() => {
    const sorted = [...measurements].sort((a, b) => a.week_number - b.week_number)

    return {
      labels: sorted.map((m) => `Нед ${m.week_number}`),
      datasets: [
        {
          label: 'Вес (кг)',
          data: sorted.map((m) => m.weight),
          fill: true,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          pointBackgroundColor: '#22c55e',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
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
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#f8fafc',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context: any) => `${context.parsed.y} кг`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(51, 65, 85, 0.5)',
          drawBorder: false,
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(51, 65, 85, 0.5)',
          drawBorder: false,
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 11,
          },
          callback: (value: any) => `${value} кг`,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  }

  if (measurements.length === 0) {
    return (
      <div className="card flex items-center justify-center h-48 text-dark-400">
        Нет данных для отображения
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="font-semibold mb-4">📈 Динамика веса</h3>
      <div className="h-48">
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
}
