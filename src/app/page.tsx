'use client'

import { useState, useEffect } from 'react'
import { GameBoyScreen } from '@/components/layout/GameBoyScreen'
import { AuthWelcomeScreen } from '@/components/welcome/AuthWelcomeScreen'

// このページはクライアントサイドでのみレンダリング
export const dynamic = 'force-dynamic'

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