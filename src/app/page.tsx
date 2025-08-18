import { GameBoyScreen } from '@/components/layout/GameBoyScreen'
import { WelcomeScreen } from '@/components/welcome/WelcomeScreen'

export default function HomePage() {
  return (
    <GameBoyScreen>
      <div className="min-h-screen flex items-center justify-center">
        <WelcomeScreen />
      </div>
    </GameBoyScreen>
  )
}