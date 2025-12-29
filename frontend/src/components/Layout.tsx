import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

interface LayoutProps {
  children: React.ReactNode
  isTrainer?: boolean
}

const navItems = [
  { path: '/', icon: '🏠', label: 'Главная' },
  { path: '/measurements', icon: '📏', label: 'Замеры' },
  { path: '/leaderboard', icon: '🏆', label: 'Рейтинг' },
  { path: '/profile', icon: '👤', label: 'Профиль' },
]

const trainerNavItems = [
  ...navItems,
  { path: '/admin', icon: '⚙️', label: 'Админ' },
]

export default function Layout({ children, isTrainer = false }: LayoutProps) {
  const location = useLocation()
  const items = isTrainer ? trainerNavItems : navItems

  return (
    <div className="flex flex-col min-h-screen bg-dark-950">
      {/* Основной контент */}
      <main className="flex-1 pb-20 overflow-y-auto">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="px-4 py-4"
        >
          {children}
        </motion.div>
      </main>

      {/* Нижняя навигация */}
      <nav className="fixed bottom-0 left-0 right-0 bg-dark-900/95 backdrop-blur-lg border-t border-dark-800 safe-bottom">
        <div className="flex justify-around items-center h-16 px-2">
          {items.map((item) => {
            const isActive = location.pathname === item.path

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center flex-1 h-full"
              >
                <motion.div
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-primary-500/20'
                      : 'hover:bg-dark-800'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span
                    className={`text-[10px] font-medium ${
                      isActive ? 'text-primary-400' : 'text-dark-400'
                    }`}
                  >
                    {item.label}
                  </span>
                </motion.div>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
