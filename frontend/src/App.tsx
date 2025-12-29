import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useTelegram } from './hooks/useTelegram'
import { useStore } from './store'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import MeasurementsPage from './pages/MeasurementsPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ProfilePage from './pages/ProfilePage'
import TasksPage from './pages/TasksPage'
import AdminPage from './pages/AdminPage'
import LoadingScreen from './components/LoadingScreen'

function App() {
  const { webApp, user: tgUser, ready } = useTelegram()
  const { user, isLoading, fetchUser, setTelegramUser } = useStore()

  useEffect(() => {
    if (webApp) {
      // Настройка темы Mini App
      webApp.setHeaderColor('#0f172a')
      webApp.setBackgroundColor('#0f172a')
      webApp.expand()
      webApp.ready()
    }
  }, [webApp])

  useEffect(() => {
    if (tgUser && ready) {
      setTelegramUser(tgUser)
      fetchUser(tgUser.id)
    }
  }, [tgUser, ready, setTelegramUser, fetchUser])

  if (isLoading || !ready) {
    return <LoadingScreen />
  }

  // Если пользователь - тренер, показываем админку
  const isTrainer = user?.role === 'trainer'

  return (
    <Layout isTrainer={isTrainer}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/measurements" element={<MeasurementsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/tasks" element={<TasksPage />} />
        {isTrainer && <Route path="/admin" element={<AdminPage />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
