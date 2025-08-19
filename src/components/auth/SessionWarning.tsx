'use client'

import { useState, useEffect } from 'react'
import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { authSessionManager } from '@/lib/auth-integration'
import { useAuth } from '@/contexts/GameContext'

interface SessionWarningProps {
  isVisible: boolean
  message: string
  minutesInactive: number
  onExtend: () => void
  onSignOut: () => void
}

export function SessionWarning({ 
  isVisible, 
  message, 
  minutesInactive, 
  onExtend, 
  onSignOut 
}: SessionWarningProps) {
  const [timeRemaining, setTimeRemaining] = useState(5 * 60) // 5分

  useEffect(() => {
    if (!isVisible) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // 時間切れで自動サインアウト
          onSignOut()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isVisible, onSignOut])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <PixelCard>
        <div className="p-6 max-w-md">
          <div className="text-center space-y-4">
            <div className="text-4xl">⏰</div>
            <h2 className="font-pixel text-lg text-retro-gb-dark">
              セッション警告
            </h2>
            <div className="space-y-2">
              <p className="font-pixel text-sm text-retro-gb-mid">
                {message}
              </p>
              <p className="font-pixel text-xs text-retro-gb-mid">
                {minutesInactive}分間の非活動を検出しました
              </p>
              <div className="font-pixel text-xl text-red-600">
                {formatTime(timeRemaining)}
              </div>
              <p className="font-pixel text-xs text-red-600">
                残り時間後に自動的にサインアウトされます
              </p>
            </div>
            <div className="flex space-x-2 justify-center">
              <PixelButton onClick={onExtend} size="sm">
                セッション延長
              </PixelButton>
              <PixelButton onClick={onSignOut} variant="secondary" size="sm">
                サインアウト
              </PixelButton>
            </div>
          </div>
        </div>
      </PixelCard>
    </div>
  )
}

// セッション警告を統合したコンポーネント
export function SessionWarningManager() {
  const [warning, setWarning] = useState<{
    isVisible: boolean
    message: string
    minutesInactive: number
  }>({
    isVisible: false,
    message: '',
    minutesInactive: 0
  })

  const { logout } = useAuth()

  useEffect(() => {
    // セッション警告の監視を設定
    const checkSessionWarning = () => {
      try {
        const sessionState = localStorage.getItem('tokiwa-session-state')
        if (sessionState) {
          const parsed = JSON.parse(sessionState)
          if (parsed.sessionExpiry && new Date(parsed.sessionExpiry) < new Date()) {
            setWarning({
              isVisible: true,
              message: 'セッションが期限切れです',
              minutesInactive: 0
            })
          }
        }
      } catch (error) {
        console.warn('セッション警告チェックエラー:', error)
        // エラーの場合は警告を非表示にする
        setWarning({
          isVisible: false,
          message: '',
          minutesInactive: 0
        })
      }
    }

    // 初期チェック
    checkSessionWarning()

    // 定期的にチェック
    const interval = setInterval(checkSessionWarning, 30000) // 30秒ごと

    return () => clearInterval(interval)
  }, [])

  const handleExtend = () => {
    // セッション延長処理
    try {
      const sessionState = localStorage.getItem('tokiwa-session-state')
      if (sessionState) {
        const parsed = JSON.parse(sessionState)
        parsed.lastActivity = new Date().toISOString()
        parsed.sessionExpiry = new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30分延長
        localStorage.setItem('tokiwa-session-state', JSON.stringify(parsed))
      }
    } catch (error) {
      console.warn('セッション延長エラー:', error)
    }
    
    setWarning({
      isVisible: false,
      message: '',
      minutesInactive: 0
    })
  }

  const handleSignOut = () => {
    // セッション情報をクリア
    try {
      localStorage.removeItem('tokiwa-session-state')
      sessionStorage.clear()
    } catch (error) {
      console.warn('セッションクリアエラー:', error)
    }
    
    setWarning({
      isVisible: false,
      message: '',
      minutesInactive: 0
    })
    
    logout()
  }

  // 警告が非表示の場合は何も表示しない
  if (!warning.isVisible) {
    return null
  }

  return (
    <SessionWarning
      isVisible={warning.isVisible}
      message={warning.message}
      minutesInactive={warning.minutesInactive}
      onExtend={handleExtend}
      onSignOut={handleSignOut}
    />
  )
}