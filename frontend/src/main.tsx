import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Глобальный обработчик ошибок - отправляет в Telegram
const ADMIN_CHAT_ID = '-1003380571535'
const BOT_TOKEN = '8189539417:AAGki4aTKHCxgFpvMxOsDL9zdNcFaO2i6fA'

async function sendErrorToTelegram(error: string, stack?: string) {
  try {
    const message = `🚨 <b>Frontend Error</b>\n\n` +
      `📱 <b>URL:</b> ${window.location.href}\n` +
      `📅 <b>Time:</b> ${new Date().toISOString()}\n` +
      `❌ <b>Error:</b> ${error.slice(0, 500)}\n` +
      (stack ? `\n<pre>${stack.slice(0, 1000)}</pre>` : '')

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    })
  } catch (e) {
    console.error('Failed to send error to Telegram:', e)
  }
}

// Ловим необработанные ошибки
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global error:', { message, source, lineno, colno, error })
  sendErrorToTelegram(
    String(message),
    error?.stack || `at ${source}:${lineno}:${colno}`
  )
  return false
}

// Ловим необработанные промисы
window.onunhandledrejection = (event) => {
  console.error('Unhandled rejection:', event.reason)
  sendErrorToTelegram(
    `Unhandled Promise Rejection: ${String(event.reason)}`,
    event.reason?.stack
  )
}

// Ловим кастомные ошибки из store
window.addEventListener('app-error', ((event: CustomEvent) => {
  const { message, stack } = event.detail
  sendErrorToTelegram(message, stack)
}) as EventListener)

// Отправляем лог при старте
sendErrorToTelegram('App starting...', `User Agent: ${navigator.userAgent}`)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
