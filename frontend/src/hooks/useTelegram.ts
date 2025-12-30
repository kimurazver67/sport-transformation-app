import { useEffect, useState, useCallback } from 'react'

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
}

interface WebApp {
  initData: string
  initDataUnsafe: {
    user?: TelegramUser
    query_id?: string
    auth_date?: number
    hash?: string
  }
  version: string
  platform: string
  colorScheme: 'light' | 'dark'
  themeParams: {
    bg_color?: string
    text_color?: string
    hint_color?: string
    link_color?: string
    button_color?: string
    button_text_color?: string
    secondary_bg_color?: string
  }
  isExpanded: boolean
  viewportHeight: number
  viewportStableHeight: number
  headerColor: string
  backgroundColor: string
  ready: () => void
  expand: () => void
  close: () => void
  setHeaderColor: (color: string) => void
  setBackgroundColor: (color: string) => void
  showPopup: (params: { title?: string; message: string; buttons?: any[] }) => void
  showAlert: (message: string, callback?: () => void) => void
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
    selectionChanged: () => void
  }
  MainButton: {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    isActive: boolean
    isProgressVisible: boolean
    setText: (text: string) => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
    show: () => void
    hide: () => void
    enable: () => void
    disable: () => void
    showProgress: (leaveActive?: boolean) => void
    hideProgress: () => void
  }
  BackButton: {
    isVisible: boolean
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
    show: () => void
    hide: () => void
  }
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: WebApp
    }
  }
}

export function useTelegram() {
  const [webApp, setWebApp] = useState<WebApp | null>(null)
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const initTelegram = () => {
      const tg = window.Telegram?.WebApp

      if (tg) {
        setWebApp(tg)
        setUser(tg.initDataUnsafe.user || null)
        setReady(true)
        return true
      }
      return false
    }

    // Попробуем сразу
    if (initTelegram()) return

    // Если не получилось - ждём загрузки скрипта
    let attempts = 0
    const maxAttempts = 50 // 5 секунд максимум
    const interval = setInterval(() => {
      attempts++
      if (initTelegram() || attempts >= maxAttempts) {
        clearInterval(interval)
        if (attempts >= maxAttempts && !window.Telegram?.WebApp) {
          // Для локальной разработки без Telegram
          console.warn('Telegram WebApp not available after timeout, using mock data')
          setUser({
            id: 123456789,
            first_name: 'Test',
            last_name: 'User',
            username: 'testuser',
          })
          setReady(true)
        }
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  const hapticFeedback = useCallback((type: 'success' | 'warning' | 'error' | 'light' | 'medium' | 'heavy') => {
    if (!webApp) return

    if (['success', 'warning', 'error'].includes(type)) {
      webApp.HapticFeedback.notificationOccurred(type as 'success' | 'warning' | 'error')
    } else {
      webApp.HapticFeedback.impactOccurred(type as 'light' | 'medium' | 'heavy')
    }
  }, [webApp])

  const showConfirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!webApp) {
        resolve(window.confirm(message))
        return
      }
      webApp.showConfirm(message, resolve)
    })
  }, [webApp])

  const showAlert = useCallback((message: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!webApp) {
        window.alert(message)
        resolve()
        return
      }
      webApp.showAlert(message, resolve)
    })
  }, [webApp])

  const close = useCallback(() => {
    webApp?.close()
  }, [webApp])

  return {
    webApp,
    user,
    ready,
    initData: webApp?.initData || '',
    colorScheme: webApp?.colorScheme || 'dark',
    hapticFeedback,
    showConfirm,
    showAlert,
    close,
    MainButton: webApp?.MainButton,
    BackButton: webApp?.BackButton,
  }
}
