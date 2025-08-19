'use client'

import { useEffect, useState } from 'react'
import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { useAuth, useNotifications } from '@/contexts/GameContext'

interface DatabaseErrorBoundaryProps {
  children: React.ReactNode
}

export function DatabaseErrorBoundary({ children }: DatabaseErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)
  const [errorCount, setErrorCount] = useState(0)
  const { isMockMode, enableMockMode } = useAuth()
  const { addNotification } = useNotifications()

  useEffect(() => {
    // グローバルエラーハンドラー
    const handleError = (event: ErrorEvent) => {
      const error = event.error
      if (error?.message?.includes('400') || 
          error?.code === 'PGRST116' ||
          error?.message?.includes('Bad Request')) {
        setErrorCount(prev => prev + 1)
        console.warn('📊 データベースエラーを検出:', error.message)
      }
    }

    // Promise rejection handler
    const handleRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason
      if (error?.message?.includes('400') || 
          error?.code === 'PGRST116' ||
          error?.message?.includes('Bad Request')) {
        setErrorCount(prev => prev + 1)
        console.warn('📊 データベースエラーを検出 (Promise):', error.message)
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  useEffect(() => {
    // 複数のエラーが発生したら警告を表示
    if (errorCount >= 3 && !isMockMode && !hasError) {
      setHasError(true)
    }
  }, [errorCount, isMockMode, hasError])

  const handleEnableMockMode = () => {
    console.log('🎮 データベースエラー回避: モックモード有効化')
    enableMockMode()
    addNotification({
      type: 'success',
      message: '🎮 モックモードを有効化しました！開発用データでゲームを開始します。'
    })
    setHasError(false)
    setErrorCount(0)
  }

  const handleDismiss = () => {
    setHasError(false)
    setErrorCount(0)
  }

  if (hasError && !isMockMode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <PixelCard className="max-w-md">
          <div className="text-center space-y-4">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="font-pixel-large text-retro-gb-dark">
              データベース接続エラー
            </h2>
            <p className="font-pixel text-sm text-retro-gb-mid leading-relaxed">
              Supabaseデータベースのテーブルが見つかりません。
              以下のいずれかを選択してください：
            </p>
            
            <div className="space-y-3">
              <PixelButton 
                onClick={handleEnableMockMode}
                className="w-full"
              >
                🎮 モックモードで開始
                <div className="font-pixel text-xs text-retro-gb-mid">
                  開発用データでゲームをプレイ
                </div>
              </PixelButton>
              
              <PixelButton 
                variant="secondary"
                onClick={handleDismiss}
                className="w-full"
              >
                ⚙️ データベースを設定済み
                <div className="font-pixel text-xs text-retro-gb-mid">
                  再度接続を試行
                </div>
              </PixelButton>
            </div>

            <div className="text-xs font-pixel text-retro-gb-mid space-y-1">
              <p>💡 ヒント:</p>
              <p>• モックモードは完全な機能でゲームを体験できます</p>
              <p>• データベース設定は SUPABASE_SETUP_INSTRUCTIONS.md を参照</p>
            </div>
          </div>
        </PixelCard>
      </div>
    )
  }

  return <>{children}</>
}