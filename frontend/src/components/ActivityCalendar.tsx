import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { DailyCheckin } from '../types'

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

    // Create map for quick checkin lookup
    const checkinMap = new Map<string, DailyCheckin>()
    checkins.forEach((c) => {
      // Normalize date to YYYY-MM-DD format
      const dateStr = c.date.split('T')[0]
      checkinMap.set(dateStr, c)
    })

    return days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const checkin = checkinMap.get(dateStr)

      let level = 0
      if (checkin) {
        // Calculate activity score
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

  // Group by weeks
  const weeks = useMemo(() => {
    const result: typeof calendarData[] = []
    let currentWeek: typeof calendarData = []

    calendarData.forEach((day, index) => {
      const dayOfWeek = day.date.getDay()

      // Start of new week (Monday)
      if (dayOfWeek === 1 && currentWeek.length > 0) {
        result.push(currentWeek)
        currentWeek = []
      }

      currentWeek.push(day)

      // Last day
      if (index === calendarData.length - 1) {
        result.push(currentWeek)
      }
    })

    return result
  }, [calendarData])

  const levelColors = [
    'bg-void-400 border-void-400',     // level 0 - no activity
    'bg-neon-lime/20 border-neon-lime/30',  // level 1
    'bg-neon-lime/40 border-neon-lime/50',  // level 2
    'bg-neon-lime/60 border-neon-lime/70',  // level 3
    'bg-neon-lime border-neon-lime',        // level 4 - full activity
  ]

  return (
    <div className="border-2 border-neon-cyan bg-void-200 p-4" style={{ boxShadow: '4px 4px 0 0 #00F5FF' }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📅</span>
        <h3 className="font-display font-bold text-steel-100 uppercase">
          Activity_Map
        </h3>
        <div className="flex-1 h-px bg-gradient-to-r from-neon-cyan/30 to-transparent" />
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex gap-1 min-w-max">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <motion.div
                  key={day.dateStr}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: (weekIndex * 7 + dayIndex) * 0.005 }}
                  className={`w-3 h-3 border ${levelColors[day.level]} transition-all hover:scale-150 cursor-pointer`}
                  title={`${format(day.date, 'd MMMM', { locale: ru })}${
                    day.checkin ? ' - Checkin done' : ''
                  }`}
                  style={{
                    boxShadow: day.level === 4 ? '0 0 8px rgba(191, 255, 0, 0.5)' : 'none'
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4">
        <span className="font-mono text-[10px] text-steel-500 uppercase">Less</span>
        {levelColors.map((color, i) => (
          <div key={i} className={`w-3 h-3 border ${color}`} />
        ))}
        <span className="font-mono text-[10px] text-steel-500 uppercase">More</span>
      </div>
    </div>
  )
}
