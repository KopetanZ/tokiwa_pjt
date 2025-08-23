'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { soundSystem } from '@/lib/game-logic/sound-system'
import { musicManager, updateGameMusic, GameContext } from '@/lib/game-logic/MusicManager'

interface MusicContextType {
  isInitialized: boolean
  currentTrack: string | null
  isEnabled: boolean
  volume: number
  updateGameContext: (context: Partial<GameContext>) => void
  playGameEvent: (eventType: string) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  playTrack: (trackId: string) => void
}

const MusicContext = createContext<MusicContextType | undefined>(undefined)

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<string | null>(null)
  const [isEnabled, setIsEnabled] = useState(true)
  const [volume, setVolumeState] = useState(0.7)

  useEffect(() => {
    const initializeMusic = async () => {
      try {
        console.log('🎵 MusicProvider: 音楽システム初期化開始')
        
        // 音響システムの初期化
        await soundSystem.initialize()
        
        // 設定の読み込み
        const config = soundSystem.getConfig()
        setIsEnabled(config.enabled)
        setVolumeState(config.volume)
        
        // 初期音楽コンテキストの設定
        updateGameMusic({
          currentPage: 'dashboard',
          playerLevel: 1,
          mood: 'neutral'
        })
        
        setIsInitialized(true)
        
        console.log('🎵 MusicProvider: 音楽システム初期化完了')
      } catch (error) {
        console.error('🎵 MusicProvider: 初期化エラー:', error)
      }
    }

    initializeMusic()

    // 音楽状態の定期更新
    const updateTimer = setInterval(() => {
      if (isInitialized) {
        const musicInfo = musicManager.getCurrentMusicInfo()
        setCurrentTrack(musicInfo.currentTrack)
      }
    }, 5000)

    return () => {
      clearInterval(updateTimer)
    }
  }, [])

  const updateGameContext = (context: Partial<GameContext>) => {
    updateGameMusic(context)
  }

  const playGameEvent = (eventType: string) => {
    switch (eventType) {
      case 'achievement':
        updateGameContext({ recentAchievement: true })
        setTimeout(() => updateGameContext({ recentAchievement: false }), 5000)
        break
      case 'expedition_start':
        updateGameContext({ activeExpeditions: 1, mood: 'excited' })
        break
      case 'expedition_end':
        updateGameContext({ activeExpeditions: 0, mood: 'neutral' })
        break
      case 'training_start':
        updateGameContext({ ongoingTraining: true, mood: 'focused' })
        break
      case 'training_end':
        updateGameContext({ ongoingTraining: false, mood: 'neutral' })
        break
      case 'breeding_start':
        updateGameContext({ inBreeding: true, mood: 'relaxed' })
        break
      case 'breeding_end':
        updateGameContext({ inBreeding: false, mood: 'neutral' })
        break
      case 'research_start':
        updateGameContext({ inResearch: true, mood: 'focused' })
        break
      case 'research_end':
        updateGameContext({ inResearch: false, mood: 'neutral' })
        break
    }
  }

  const setVolume = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume))
    soundSystem.updateConfig({ volume: clampedVolume })
    setVolumeState(clampedVolume)
  }

  const toggleMute = () => {
    const newEnabled = !isEnabled
    soundSystem.updateConfig({ enabled: newEnabled })
    setIsEnabled(newEnabled)
    
    if (!newEnabled) {
      soundSystem.stopAll()
    } else {
      // 音楽を再開
      updateGameContext({ currentPage: 'dashboard' })
    }
  }

  const playTrack = (trackId: string) => {
    musicManager.playTrack(trackId, true)
  }

  return (
    <MusicContext.Provider
      value={{
        isInitialized,
        currentTrack,
        isEnabled,
        volume,
        updateGameContext,
        playGameEvent,
        setVolume,
        toggleMute,
        playTrack
      }}
    >
      {children}
    </MusicContext.Provider>
  )
}

export function useMusic() {
  const context = useContext(MusicContext)
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider')
  }
  return context
}