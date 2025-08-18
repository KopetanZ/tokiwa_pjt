'use client'

import { useAuth } from '@/components/providers/AuthProvider'
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
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <GameBoyScreen>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="font-pixel text-retro-gb-dark">ロード中...</div>
            <div className="w-16 h-2 bg-retro-gb-mid mx-auto animate-pulse"></div>
          </div>
        </div>
      </GameBoyScreen>
    )
  }

  if (!isAuthenticated) {
    return null
  }

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