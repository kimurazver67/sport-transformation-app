import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { useTelegram } from '../hooks/useTelegram'

export default function TasksPage() {
  const { courseWeek, tasks, fetchTasks, completeTask, uncompleteTask } = useStore()
  const { hapticFeedback } = useTelegram()

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleToggle = async (taskId: string, completed: boolean) => {
    hapticFeedback('light')
    try {
      if (completed) {
        await uncompleteTask(taskId)
      } else {
        await completeTask(taskId)
        hapticFeedback('success')
      }
    } catch (error) {
      console.error('Failed to toggle task:', error)
      hapticFeedback('error')
    }
  }

  const completedCount = tasks.filter((t) => t.completed).length
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold">📋 Задания недели</h1>
        <p className="text-dark-400 text-sm">Неделя {courseWeek}</p>
      </motion.div>

      {/* Прогресс */}
      {tasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-dark-400">Прогресс</span>
            <span className="text-sm font-medium">
              {completedCount} / {tasks.length}
            </span>
          </div>
          <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          {progress === 100 && (
            <p className="text-center text-primary-400 text-sm mt-2">
              🎉 Все задания выполнены!
            </p>
          )}
        </motion.div>
      )}

      {/* Список заданий */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        {tasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * index }}
            className={`card card-hover flex items-start gap-3 cursor-pointer transition-all ${
              task.completed ? 'bg-primary-500/10 border-primary-500/30' : ''
            }`}
            onClick={() => handleToggle(task.id, task.completed)}
          >
            {/* Чекбокс */}
            <div
              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                task.completed
                  ? 'bg-primary-500 border-primary-500'
                  : 'border-dark-500 hover:border-primary-500'
              }`}
            >
              {task.completed && (
                <svg
                  className="w-4 h-4 text-white"
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
                </svg>
              )}
            </div>

            {/* Текст задания */}
            <div className="flex-1">
              <p
                className={`font-medium ${
                  task.completed ? 'text-dark-400 line-through' : 'text-white'
                }`}
              >
                {task.title}
              </p>
              {task.description && (
                <p className="text-sm text-dark-400 mt-1">{task.description}</p>
              )}
            </div>

            {/* Очки */}
            {task.completed && (
              <span className="badge badge-green">+15</span>
            )}
          </motion.div>
        ))}

        {tasks.length === 0 && (
          <div className="card text-center text-dark-400 py-8">
            <p className="text-4xl mb-3">📋</p>
            <p>Заданий на эту неделю пока нет</p>
            <p className="text-sm mt-1">Тренер добавит их после вебинара</p>
          </div>
        )}
      </motion.div>

      {/* Подсказка */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card bg-dark-800/50"
      >
        <p className="text-sm text-dark-400">
          💡 За каждое выполненное задание начисляется 15 очков.
          Старайся выполнить все до следующего вебинара!
        </p>
      </motion.div>
    </div>
  )
}
