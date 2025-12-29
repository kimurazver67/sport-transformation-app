import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

interface LayoutProps {
  children: React.ReactNode
  isTrainer?: boolean
}

const navItems = [
  { path: '/', icon: '🏠', label: 'ГЛАВНАЯ', activeIcon: '⚡' },
  { path: '/measurements', icon: '📏', label: 'ЗАМЕРЫ', activeIcon: '📊' },
  { path: '/leaderboard', icon: '🏆', label: 'РЕЙТИНГ', activeIcon: '👑' },
  { path: '/profile', icon: '👤', label: 'ПРОФИЛЬ', activeIcon: '🔥' },
]

const trainerNavItems = [
  ...navItems,
  { path: '/admin', icon: '⚙️', label: 'АДМИН', activeIcon: '🎛️' },
]

export default function Layout({ children, isTrainer = false }: LayoutProps) {
  const location = useLocation()
  const items = isTrainer ? trainerNavItems : navItems

  return (
    <div className="flex flex-col min-h-screen bg-void">
      {/* Main Content */}
      <main className="flex-1 pb-24 overflow-y-auto">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom Navigation - Brutal Style */}
      <nav className="fixed bottom-0 left-0 right-0 bg-void-200/95 backdrop-blur-xl border-t-2 border-void-400 safe-bottom z-50">
        {/* Glowing line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-lime/50 to-transparent" />

        <div className="flex justify-around items-center h-16 px-2">
          {items.map((item, index) => {
            const isActive = location.pathname === item.path

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex-1 h-full flex items-center justify-center relative"
              >
                <motion.div
                  className={`flex flex-col items-center gap-1 px-3 py-2 relative ${
                    isActive ? 'text-neon-lime' : 'text-steel-500'
                  }`}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Active Background */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 border border-neon-lime bg-neon-lime/10"
                      style={{ boxShadow: '0 0 20px rgba(191, 255, 0, 0.2)' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}

                  {/* Icon */}
                  <motion.span
                    className="text-xl relative z-10"
                    animate={isActive ? {
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0]
                    } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {isActive ? item.activeIcon : item.icon}
                  </motion.span>

                  {/* Label */}
                  <span className={`font-mono text-[9px] tracking-wider relative z-10 ${
                    isActive ? 'font-bold' : 'font-normal'
                  }`}>
                    {item.label}
                  </span>

                  {/* Active Indicator Line */}
                  {isActive && (
                    <motion.div
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-neon-lime"
                      layoutId="activeIndicator"
                      style={{ boxShadow: '0 0 10px #BFFF00' }}
                    />
                  )}
                </motion.div>
              </NavLink>
            )
          })}
        </div>

        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-neon-lime" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-neon-lime" />
      </nav>
    </div>
  )
}
