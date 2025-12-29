import { useMemo } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { DailyCheckin } from '../../shared/types'

interface ActivityCalendarProps {
  checkins: DailyCheckin[]
  months?: number
}

export default function ActivityCalendar({ checkins, months = 3 }: ActivityCalendarProps) {
  const calendarData = useMemo(() => {
    const today = new Date()
    const startDate = startOfMonth(subMonths(today, months - 1))
    const endDate = endOfMonth(today)

    const days = eachDayOfInterval({ start: startDate, end: endDate })

    // Создаём map для быстрого поиска чекинов
    const checkinMap = new Map<string, DailyCheckin>()
    checkins.forEach((c) => {
      checkinMap.set(c.date, c)
    })

    return days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const checkin = checkinMap.get(dateStr)

      let level = 0
      if (checkin) {
        // Считаем "активность" на основе выполненных пунктов
        let score = 0
        if (checkin.workout) score += 2
        if (checkin.nutrition) score += 1
        if (checkin.water) score += 1

        if (score >= 4) level = 4
        else if (score >= 3) level = 3
        else if (score >= 2) level = 2
        else level = 1
      }

      return {
        date: day,
        dateStr,
        level,
        checkin,
      }
    })
  }, [checkins, months])

  // Группируем по неделям
  const weeks = useMemo(() => {
    const result: typeof calendarData[] = []
    let currentWeek: typeof calendarData = []

    calendarData.forEach((day, index) => {
      const dayOfWeek = day.date.getDay()

      // Начало новой недели (понедельник)
      if (dayOfWeek === 1 && currentWeek.length > 0) {
        result.push(currentWeek)
        currentWeek = []
      }

      currentWeek.push(day)

      // Последний день
      if (index === calendarData.length - 1) {
        result.push(currentWeek)
      }
    })

    return result
  }, [calendarData])

  const levelColors = [
    'bg-dark-700', // level 0 - нет активности
    'bg-primary-900', // level 1
    'bg-primary-700', // level 2
    'bg-primary-500', // level 3
    'bg-primary-400', // level 4 - полная активность
  ]

  return (
    <div className="card">
      <h3 className="font-semibold mb-4">📅 Календарь активности</h3>

      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day) => (
                <div
                  key={day.dateStr}
                  className={`w-3 h-3 rounded-sm ${levelColors[day.level]} transition-colors hover:ring-2 hover:ring-primary-400`}
                  title={`${format(day.date, 'd MMMM', { locale: ru })}${
                    day.checkin ? ` - Чекин выполнен` : ''
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Легенда */}
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-dark-400">
        <span>Меньше</span>
        {levelColors.map((color, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${color}`} />
        ))}
        <span>Больше</span>
      </div>
    </div>
  )
}
