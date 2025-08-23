'use client'

import { useState, useEffect } from 'react'
import { GameBoyScreen } from '@/components/layout/GameBoyScreen'
import dynamic from 'next/dynamic'

// AuthWelcomeScreenを動的インポートしてSSRを無効化
const AuthWelcomeScreen = dynamic(
  () => import('@/components/welcome/AuthWelcomeScreen').then(mod => ({ default: mod.AuthWelcomeScreen })),
  { 
    ssr: false,
    loading: () => (
      <div className="text-center space-y-6">
        <div className="font-pixel-xl text-retro-gb-dark">
          トキワシティ訓練所
        </div>
        <div className="font-pixel text-retro-gb-mid">
          読み込み中...
        </div>
        <div className="animate-pulse">
          <div className="w-16 h-2 bg-retro-gb-mid mx-auto"></div>
        </div>
      </div>
    )
  }
)

// このページはクライアントサイドでのみレンダリング
export const dynamicConfig = 'force-dynamic'
export const revalidate = 0

export default function HomePage() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <GameBoyScreen>
      <div className="min-h-screen flex items-center justify-center">
        {isClient ? <AuthWelcomeScreen /> : (
          <div className="text-center space-y-6">
            <div className="font-pixel-xl text-retro-gb-dark">
              トキワシティ訓練所
            </div>
            <div className="font-pixel text-retro-gb-mid">
              読み込み中...
            </div>
            <div className="animate-pulse">
              <div className="w-16 h-2 bg-retro-gb-mid mx-auto"></div>
            </div>
          </div>
        )}
      </div>
    </GameBoyScreen>
  )
}