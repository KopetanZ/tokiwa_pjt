'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useGameState } from '@/lib/game-state/hooks'

// シンプルなゲームコンテキスト
interface SimpleGameContextType {
  // ゲームデータのみ管理
  gameData: any | null
  isLoading: boolean
  error: string | null
}

const SimpleGameContext = createContext<SimpleGameContextType | undefined>(undefined)

export function SimpleGameProvider({ children }: { children: React.ReactNode }) {
  const [gameData, setGameData] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // ゲーム状態管理フックを使用
  const gameStateHook = useGameState()

  useEffect(() => {
    try {
      setGameData(gameStateHook.gameData)
      setIsLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ゲームデータの読み込みに失敗')
      setIsLoading(false)
    }
  }, [gameStateHook.gameData])

  return (
    <SimpleGameContext.Provider value={{
      gameData,
      isLoading,
      error
    }}>
      {children}
    </SimpleGameContext.Provider>
  )
}

export function useSimpleGame() {
  const context = useContext(SimpleGameContext)
  if (!context) {
    throw new Error('useSimpleGame must be used within a SimpleGameProvider')
  }
  return context
}

// 互換性のため、元のGameProviderからの移行を容易にする
export const GameProvider = SimpleGameProvider