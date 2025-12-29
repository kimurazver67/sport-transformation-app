import { motion } from 'framer-motion'

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-dark-950">
      <div className="flex flex-col items-center gap-6">
        {/* Анимированный логотип */}
        <motion.div
          className="relative"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
            <span className="text-4xl">💪</span>
          </div>
        </motion.div>

        {/* Текст */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-white mb-2">
            Трансформация тела
          </h1>
          <motion.p
            className="text-dark-400 text-sm"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Загрузка...
          </motion.p>
        </div>

        {/* Индикатор загрузки */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-primary-500 rounded-full"
              animate={{
                y: [-4, 4, -4],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
