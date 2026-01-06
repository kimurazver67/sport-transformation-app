import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { useTelegram } from '../hooks/useTelegram'

export default function TasksPage() {
  const { courseWeek, tasks, fetchTasks, completeTask } = useStore()
  const { hapticFeedback } = useTelegram()

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleToggle = async (taskId: string, completed: boolean) => {
    // Запрещаем отмену выполнения — задание нельзя "развыполнить"
    if (completed) {
      return
    }

    hapticFeedback('light')
    try {
      await completeTask(taskId)
      hapticFeedback('success')
    } catch (error) {
      console.error('Failed to complete task:', error)
      hapticFeedback('error')
    }
  }

  const completedCount = tasks.filter((t) => t.completed).length
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0

  return (
    <div className="min-h-screen pb-4 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="blob -top-32 -left-32 opacity-10" />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-6 pb-4"
      >
        <div className="font-mono text-xs text-steel-500 uppercase tracking-widest mb-1">
          Неделя_{String(courseWeek).padStart(2, '0')} // Задания
        </div>
        <h1 className="font-display text-3xl font-bold text-steel-100 uppercase tracking-wider">
          Задания_недели
        </h1>
      </motion.header>

      {/* Progress Card */}
      {tasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-2 border-neon-magenta bg-neon-magenta/5 p-4 mb-6 relative overflow-hidden"
          style={{ boxShadow: '4px 4px 0 0 #FF00FF' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-xs text-steel-500 uppercase tracking-wider">
              Прогресс_заданий
            </span>
            <span className="font-display text-lg font-bold text-neon-magenta">
              {completedCount}/{tasks.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="progress-brutal">
            <motion.div
              className="progress-brutal-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>

          {progress === 100 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 text-center"
            >
              <span className="font-mono text-sm text-neon-lime">
                🎉 ВСЕ ЗАДАНИЯ ВЫПОЛНЕНЫ!
              </span>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Tasks List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <div className="font-mono text-xs text-steel-500 uppercase tracking-widest mb-3">
          Список_заданий
        </div>

        {tasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * index }}
            onClick={() => handleToggle(task.id, task.completed)}
            className={`p-4 border-2 transition-all relative overflow-hidden ${
              task.completed
                ? 'border-neon-lime bg-neon-lime/5'
                : 'border-void-400 bg-void-200 hover:border-steel-500 cursor-pointer'
            }`}
            style={{
              boxShadow: task.completed ? '4px 4px 0 0 #BFFF00' : 'none'
            }}
          >
            <div className="flex items-start gap-4">
              {/* Checkbox */}
              <motion.div
                className={`w-6 h-6 border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                  task.completed
                    ? 'border-neon-lime bg-neon-lime'
                    : 'border-steel-500 hover:border-neon-lime'
                }`}
                whileTap={{ scale: 0.9 }}
              >
                {task.completed && (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-4 h-4 text-void"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </motion.svg>
                )}
              </motion.div>

              {/* Task Content */}
              <div className="flex-1">
                <p className={`font-display font-bold uppercase ${
                  task.completed ? 'text-steel-500 line-through' : 'text-steel-100'
                }`}>
                  {task.title}
                </p>
                {task.description && (
                  <p className="font-mono text-xs text-steel-500 mt-1">
                    {task.description}
                  </p>
                )}
              </div>

              {/* Points Badge */}
              {task.completed && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-2 py-1 border border-neon-lime bg-neon-lime/10"
                >
                  <span className="font-mono text-xs font-bold text-neon-lime">+15</span>
                </motion.div>
              )}
            </div>

            {/* Completed indicator line */}
            {task.completed && (
              <motion.div
                className="absolute left-0 top-0 bottom-0 w-1 bg-neon-lime"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
              />
            )}
          </motion.div>
        ))}

        {tasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-2 border-void-400 p-8 text-center"
          >
            <span className="text-4xl block mb-3">📋</span>
            <p className="font-mono text-sm text-steel-500">НЕТ_ЗАДАНИЙ</p>
            <p className="font-mono text-xs text-steel-600 mt-1">
              Тренер добавит задания после вебинара
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 border-2 border-void-400 p-4 bg-void-200/50"
      >
        <div className="flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div>
            <p className="font-mono text-xs text-steel-400">
              За каждое задание ты получаешь <span className="text-neon-lime font-bold">+15 XP</span>
            </p>
            <p className="font-mono text-[10px] text-steel-500 mt-1">
              Выполни все до следующего вебинара!
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
