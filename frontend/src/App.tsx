import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
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

// Debug function
async function sendDebug(msg: string) {
  try {
    await fetch('https://api.telegram.org/bot8189539417:AAGki4aTKHCxgFpvMxOsDL9zdNcFaO2i6fA/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: '-1003380571535', text: `🔍 App: ${msg}` }),
    })
  } catch (e) { /* ignore */ }
}

function App() {
  const location = useLocation()
  const { webApp, user: tgUser, ready } = useTelegram()
  const { user, isLoading, fetchUser, setTelegramUser } = useStore()

  // Debug: log route changes
  useEffect(() => {
    sendDebug(`Route: ${location.pathname}, ready=${ready}, isLoading=${isLoading}, tgUser=${!!tgUser}`)
  }, [location.pathname, ready, isLoading, tgUser])

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
    if (ready) {
      if (tgUser) {
        setTelegramUser(tgUser)
        fetchUser(tgUser.id)
      } else {
        console.error('No Telegram user available')
      }
    }
  }, [tgUser, ready, setTelegramUser, fetchUser])

  // Показываем лоадер пока не готовы или загружаем данные
  if (!ready || (isLoading && tgUser)) {
    return <LoadingScreen />
  }

  // Если нет пользователя Telegram - ошибка
  if (!tgUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void-100 text-steel-100 p-4">
        <div className="text-center">
          <p className="text-xl mb-2">⚠️ Ошибка</p>
          <p className="text-steel-400">Откройте приложение через Telegram</p>
        </div>
      </div>
    )
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
