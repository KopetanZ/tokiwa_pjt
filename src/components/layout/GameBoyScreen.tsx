'use client'

import { ReactNode } from 'react'

interface GameBoyScreenProps {
  children: ReactNode
}

export function GameBoyScreen({ children }: GameBoyScreenProps) {
  return (
    <div className="gameboy-screen min-h-screen">
      <div className="relative w-full h-full">
        {children}
      </div>
    </div>
  )
}