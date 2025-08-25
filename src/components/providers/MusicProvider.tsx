// 簡素化: 複雑な音楽管理システムを削除
// 基本的な音量調整のみ実装

import { createContext, useContext, useState } from 'react'

interface SimpleMusicContextType {
  volume: number
  setVolume: (volume: number) => void
  isMuted: boolean
  toggleMute: () => void
  updateGameContext: (context: any) => void
  playGameEvent: (event: string) => void
}

const MusicContext = createContext<SimpleMusicContextType | undefined>(undefined)

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [volume, setVolumeState] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)

  const setVolume = (newVolume: number) => {
    setVolumeState(Math.max(0, Math.min(1, newVolume)))
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const updateGameContext = () => {
    // ダミー実装
  }

  const playGameEvent = () => {
    // ダミー実装
  }

  return (
    <MusicContext.Provider value={{
      volume: isMuted ? 0 : volume,
      setVolume,
      isMuted,
      toggleMute,
      updateGameContext,
      playGameEvent
    }}>
      {children}
    </MusicContext.Provider>
  )
}

export function useMusic() {
  const context = useContext(MusicContext)
  if (!context) {
    // 音楽機能はオプションなので、エラーではなくデフォルト値を返す
    return {
      volume: 0.7,
      setVolume: () => {},
      isMuted: false,
      toggleMute: () => {},
      updateGameContext: () => {},
      playGameEvent: () => {}
    }
  }
  return context
}