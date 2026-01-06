import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useTelegram } from '../hooks/useTelegram'
import CheckinForm from '../components/CheckinForm'
import OnboardingFlow from '../components/OnboardingFlow'

// Animated counter component
function AnimatedCounter({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)

      // Easing function
      const easeOutExpo = 1 - Math.pow(2, -10 * progress)
      setDisplayValue(Math.floor(easeOutExpo * value))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration])

  return <span className="counter-value">{displayValue}</span>
}

// Streak fire component
function StreakFire({ streak }: { streak: number }) {
  if (streak === 0) return null

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      className="relative"
    >
      <div className="streak-number">{streak}</div>
      <motion.div
        className="absolute -top-2 -right-2 text-2xl"
        animate={{
          y: [0, -5, 0],
          rotate: [0, 10, -10, 0]
        }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        🔥
      </motion.div>
    </motion.div>
  )
}

export default function HomePage() {
  const { user, stats, todayCheckin, courseWeek, isCourseStarted, daysUntilStart, fetchTodayCheckin, nutrition } = useStore()
  const { hapticFeedback } = useTelegram()
  const [showCheckinForm, setShowCheckinForm] = useState(false)

  const handleCheckinComplete = () => {
    hapticFeedback('success')
    setShowCheckinForm(false)
    fetchTodayCheckin()
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-neon-lime border-t-transparent rounded-full"
        />
      </div>
    )
  }

  const motivationalQuotes = [
    "РАБОТАЙ УСЕРДНЕЕ, ЧЕМ ВЧЕРА",
    "ДИСЦИПЛИНА ПОБЕЖДАЕТ МОТИВАЦИЮ",
    "НИКАКИХ ОПРАВДАНИЙ, ТОЛЬКО РЕЗУЛЬТАТ",
    "МЕНЯЙСЯ ИЛИ ОСТАВАЙСЯ ПРЕЖНИМ",
  ]
  const quote = motivationalQuotes[Math.floor(Date.now() / 86400000) % motivationalQuotes.length]

  return (
    <div className="min-h-screen pb-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="blob -top-32 -left-32 opacity-20" />
      <div className="blob -bottom-32 -right-32 opacity-10" style={{ animationDelay: '-4s' }} />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-2 pb-4"
      >
        <div className="flex items-start justify-between">
          <div>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="font-mono text-xs text-steel-500 uppercase tracking-widest"
            >
              {isCourseStarted
                ? `Неделя_${String(courseWeek).padStart(2, '0')} // Активна`
                : `До старта: ${daysUntilStart} дн.`}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="font-display text-3xl font-bold text-steel-100 mt-1"
            >
              {user.first_name}
            </motion.h1>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="font-mono text-xs text-neon-lime mt-1 glitch"
              data-text="РЕЖИМ_ТРАНСФОРМАЦИИ"
            >
              РЕЖИМ_ТРАНСФОРМАЦИИ
            </motion.div>
          </div>

          {stats && stats.current_streak > 0 && (
            <StreakFire streak={stats.current_streak} />
          )}
        </div>
      </motion.header>

      {/* Stats Grid */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="px-4 mb-6"
      >
        <div className="grid grid-cols-3 gap-3">
          {/* Points */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="brutal-card group"
          >
            <div className="font-mono text-[10px] text-steel-500 uppercase tracking-wider mb-2">
              Всего_XP
            </div>
            <div className="font-display text-2xl font-bold text-neon-lime text-glow">
              <AnimatedCounter value={stats?.total_points || 0} />
            </div>
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-neon-lime"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: 0.8, duration: 0.6 }}
            />
          </motion.div>

          {/* Rank */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="brutal-card-cyan group"
          >
            <div className="font-mono text-[10px] text-steel-500 uppercase tracking-wider mb-2">
              Место
            </div>
            <div className="font-display text-2xl font-bold text-neon-cyan">
              #{stats?.rank_overall || '--'}
            </div>
          </motion.div>

          {/* Weekly */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="brutal-card-magenta group"
          >
            <div className="font-mono text-[10px] text-steel-500 uppercase tracking-wider mb-2">
              За_неделю
            </div>
            <div className="font-display text-2xl font-bold text-neon-magenta">
              <AnimatedCounter value={stats?.weekly_points || 0} duration={1000} />
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Onboarding - показываем до старта курса если цель не выбрана */}
      {!isCourseStarted && !user.goal && user.role === 'participant' && (
        <section className="px-4 mb-6">
          <OnboardingFlow />
        </section>
      )}

      {/* Checkin Section */}
      <section className="px-4 mb-6">
        <AnimatePresence mode="wait">
          {showCheckinForm ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="brutal-card"
            >
              <button
                onClick={() => setShowCheckinForm(false)}
                className="font-mono text-xs text-steel-400 hover:text-neon-lime mb-4 flex items-center gap-2 transition-colors"
              >
                <span className="text-neon-lime">[</span> ОТМЕНА <span className="text-neon-lime">]</span>
              </button>
              <CheckinForm onComplete={handleCheckinComplete} />
            </motion.div>
          ) : todayCheckin ? (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="brutal-card relative overflow-hidden"
            >
              {/* Success indicator */}
              <motion.div
                className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-lime via-neon-cyan to-neon-lime"
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{ backgroundSize: '200% 200%' }}
              />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-2 border-neon-lime flex items-center justify-center"
                  >
                    <span className="text-neon-lime">✓</span>
                  </motion.div>
                  <div>
                    <h3 className="font-display font-bold text-steel-100 uppercase tracking-wider">
                      Чекин выполнен
                    </h3>
                    <p className="font-mono text-[10px] text-steel-500">+10 XP ПОЛУЧЕНО</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCheckinForm(true)}
                  className="btn-ghost text-xs"
                >
                  [ИЗМЕНИТЬ]
                </button>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {[
                  { icon: todayCheckin.workout ? '💪' : '✗', label: 'ЗАЛА', active: todayCheckin.workout },
                  { icon: todayCheckin.nutrition ? '🥗' : '✗', label: 'ЕДА', active: todayCheckin.nutrition },
                  { icon: todayCheckin.water ? '💧' : '✗', label: 'ВОДА', active: todayCheckin.water },
                  { icon: `${todayCheckin.sleep_hours}ч`, label: 'СОН', active: true },
                  { icon: ['😢', '😕', '😐', '🙂', '😃'][todayCheckin.mood - 1], label: 'НАСТР', active: true },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className={`text-center p-2 border ${item.active ? 'border-neon-lime bg-neon-lime/5' : 'border-void-400 bg-void-300'}`}
                  >
                    <span className="text-xl block">{item.icon}</span>
                    <span className="font-mono text-[8px] text-steel-500">{item.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                hapticFeedback('light')
                setShowCheckinForm(true)
              }}
              className="w-full brutal-card animate-glow-pulse cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(191, 255, 0, 0.3)',
                        '0 0 40px rgba(191, 255, 0, 0.6)',
                        '0 0 20px rgba(191, 255, 0, 0.3)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-14 h-14 border-2 border-neon-lime flex items-center justify-center"
                  >
                    <span className="text-3xl">⚡</span>
                  </motion.div>
                  <div className="text-left">
                    <h3 className="font-display font-bold text-steel-100 uppercase tracking-wider">
                      Ежедневный чекин
                    </h3>
                    <p className="font-mono text-xs text-steel-500">
                      ОТМЕТЬ СВОЙ ПРОГРЕСС
                    </p>
                  </div>
                </div>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-neon-lime text-2xl font-bold"
                >
                  →
                </motion.span>
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </section>

      {/* Quick Actions */}
      <section className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Link to="/measurements" className="block brutal-card-cyan hover-lift h-full">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 border-2 border-neon-cyan flex items-center justify-center">
                  <span className="text-2xl">📏</span>
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-steel-100 uppercase">
                    Замеры
                  </h4>
                  <p className="font-mono text-[10px] text-steel-500">
                    ОТСЛЕЖИВАЙ ПРОГРЕСС
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Link to="/tasks" className="block brutal-card-magenta hover-lift h-full">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 border-2 border-neon-magenta flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-steel-100 uppercase">
                    Задания
                  </h4>
                  <p className="font-mono text-[10px] text-steel-500">
                    {isCourseStarted
                      ? `НЕДЕЛЯ_${String(courseWeek).padStart(2, '0')}`
                      : 'СКОРО'}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* КБЖУ Card */}
      {nutrition && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          className="px-4 mb-6"
        >
          <div className="brutal-card relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🍽️</span>
                <h3 className="font-display font-bold text-steel-100 uppercase tracking-wider text-sm">
                  Твой КБЖУ
                </h3>
              </div>
              <div className="font-mono text-[10px] text-steel-500 uppercase">
                {nutrition.goal === 'weight_loss' ? '🔥 Похудение' : '💪 Набор'}
              </div>
            </div>

            {/* Калории */}
            <div className="border-2 border-neon-lime bg-neon-lime/5 p-3 mb-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-steel-400 uppercase">Калории</span>
                <span className="font-display text-2xl font-bold text-neon-lime">
                  {nutrition.calories}
                </span>
              </div>
              <div className="font-mono text-[10px] text-steel-500 mt-1">
                ккал/день • вес {nutrition.weight} кг
              </div>
            </div>

            {/* БЖУ Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="border border-neon-cyan bg-neon-cyan/5 p-2 text-center">
                <div className="font-mono text-[10px] text-steel-500 uppercase mb-1">Белки</div>
                <div className="font-display text-lg font-bold text-neon-cyan">{nutrition.protein}г</div>
              </div>
              <div className="border border-neon-magenta bg-neon-magenta/5 p-2 text-center">
                <div className="font-mono text-[10px] text-steel-500 uppercase mb-1">Жиры</div>
                <div className="font-display text-lg font-bold text-neon-magenta">{nutrition.fat}г</div>
              </div>
              <div className="border border-yellow-400 bg-yellow-400/5 p-2 text-center">
                <div className="font-mono text-[10px] text-steel-500 uppercase mb-1">Углеводы</div>
                <div className="font-display text-lg font-bold text-yellow-400">{nutrition.carbs}г</div>
              </div>
            </div>

            {/* Accent line */}
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-neon-cyan via-neon-lime to-neon-magenta"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: 1, duration: 0.6 }}
            />
          </div>
        </motion.section>
      )}

      {/* Motivation Banner */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="px-4"
      >
        <div className="border-2 border-void-400 p-4 relative corner-decoration bg-void-200">
          <div className="cyber-line absolute top-0 left-4 right-4" />
          <p className="font-display text-lg text-steel-200 text-center tracking-wider">
            "{quote}"
          </p>
          <div className="cyber-line absolute bottom-0 left-4 right-4" />
        </div>
      </motion.section>
    </div>
  )
}
