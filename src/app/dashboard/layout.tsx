'use client'

import { useAuth } from '@/contexts/GameContext'
import { GameBoyScreen } from '@/components/layout/GameBoyScreen'
import { PixelNavigation } from '@/components/layout/PixelNavigation'
import { StatusBar } from '@/components/layout/StatusBar'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, user, isMockMode } = useAuth()
  const isLoading = false // 一時的にfalse固定
  const router = useRouter()

  console.log('🏗️ DashboardLayout: レンダリング', { isAuthenticated, isLoading })

  // 開発モード: 認証をスキップ
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  useEffect(() => {
    console.log('🏗️ DashboardLayout: useEffect実行', { isAuthenticated, isLoading, isDevelopment })
    if (!isDevelopment && !isLoading && !isAuthenticated) {
      console.log('🏗️ DashboardLayout: 認証されていない、ホームにリダイレクト')
      router.push('/')
    }
  }, [isAuthenticated, isLoading, router, isDevelopment])

  // ローディング中の表示
  if (isLoading) {
    console.log('🏗️ DashboardLayout: ローディング中を表示')
    return (
      <GameBoyScreen>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="font-pixel text-retro-gb-dark">トキワシティ訓練所を起動中...</div>
            <div className="w-16 h-2 bg-retro-gb-mid mx-auto animate-pulse"></div>
            <div className="font-pixel text-xs text-retro-gb-mid">しばらくお待ちください</div>
          </div>
        </div>
      </GameBoyScreen>
    )
  }

  // 認証されていない場合（本番環境のみ）
  if (!isDevelopment && !isAuthenticated) {
    console.log('🏗️ DashboardLayout: 認証されていない、エラー表示')
    return (
      <GameBoyScreen>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="font-pixel text-retro-gb-dark">認証が必要です</div>
            <div className="font-pixel text-xs text-retro-gb-mid">ホーム画面にリダイレクトしています...</div>
          </div>
        </div>
      </GameBoyScreen>
    )
  }

  console.log('🏗️ DashboardLayout: メインレイアウトを表示')
  return (
    <GameBoyScreen>
      <div className="min-h-screen flex flex-col">
        {/* ステータスバー */}
        <StatusBar />
        
        {/* メインコンテンツ */}
        <div className="flex flex-1">
          {/* ナビゲーション */}
          <PixelNavigation />
          
          {/* ページコンテンツ */}
          <main className="flex-1 p-4">
            {children}
          </main>
        </div>
      </div>
    </GameBoyScreen>
  )
}