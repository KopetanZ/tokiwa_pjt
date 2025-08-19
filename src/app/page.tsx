'use client'

import { GameBoyScreen } from '@/components/layout/GameBoyScreen'
import { AuthWelcomeScreen } from '@/components/welcome/AuthWelcomeScreen'

export default function HomePage() {
  return (
    <GameBoyScreen>
      <div className="min-h-screen flex items-center justify-center">
        <AuthWelcomeScreen />
      </div>
    </GameBoyScreen>
  )
}