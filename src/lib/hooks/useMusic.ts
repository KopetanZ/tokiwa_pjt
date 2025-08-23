// 音楽管理React Hook

'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { musicManager, updateGameMusic, GameContext } from '../game-logic/MusicManager'
import { soundSystem } from '../game-logic/sound-system'

interface MusicHookOptions {
  enablePageTracking?: boolean
  enableTimeTracking?: boolean
  enableAutoUpdate?: boolean
  updateInterval?: number
}

interface MusicState {
  isInitialized: boolean
  currentTrack: string | null
  isEnabled: boolean
  volume: number
  applicableRules: string[]
}

export function useMusic(options: MusicHookOptions = {}) {
  const {
    enablePageTracking = true,
    enableTimeTracking = true,
    enableAutoUpdate = true,
    updateInterval = 10000
  } = options

  const [musicState, setMusicState] = useState<MusicState>({
    isInitialized: false,
    currentTrack: null,
    isEnabled: true,
    volume: 0.7,
    applicableRules: []
  })

  const router = useRouter()
  const currentPage = useRef<string>('dashboard')
  const updateTimer = useRef<NodeJS.Timeout | null>(null)

  // 音楽システムの初期化
  useEffect(() => {
    const initializeMusic = async () => {
      try {
        await soundSystem.initialize()
        const status = soundSystem.getStatus()
        const config = soundSystem.getConfig()
        
        setMusicState(prev => ({
          ...prev,
          isInitialized: status.initialized,
          isEnabled: config.enabled,
          volume: config.volume
        }))

        // 初期コンテキストの設定
        updateGameMusic({
          currentPage: currentPage.current,
          playerLevel: 1,
          mood: 'neutral'
        })

        console.log('🎵 useMusic: 音楽システム初期化完了')
      } catch (error) {
        console.error('🎵 useMusic: 初期化エラー:', error)
      }
    }

    initializeMusic()

    return () => {
      if (updateTimer.current) {
        clearInterval(updateTimer.current)
      }
    }
  }, [])

  // ページ追跡の設定
  useEffect(() => {
    if (!enablePageTracking || !musicState.isInitialized) return

    const handleRouteChange = (url: string) => {
      const pageName = extractPageName(url)
      currentPage.current = pageName
      
      updateGameMusic({
        currentPage: pageName
      })

      console.log(`🎵 useMusic: ページ変更 → ${pageName}`)
    }

    // Next.js router events は現在のバージョンでは直接利用できないため、
    // pathname の変化を監視
    const currentPath = window.location.pathname
    const initialPage = extractPageName(currentPath)
    currentPage.current = initialPage
    
    updateGameMusic({
      currentPage: initialPage
    })
  }, [enablePageTracking, musicState.isInitialized])

  // 定期的な状態更新
  useEffect(() => {
    if (!enableAutoUpdate || !musicState.isInitialized) return

    updateTimer.current = setInterval(() => {
      const musicInfo = musicManager.getCurrentMusicInfo()
      
      setMusicState(prev => ({
        ...prev,
        currentTrack: musicInfo.currentTrack,
        applicableRules: musicInfo.applicableRules
      }))
    }, updateInterval)

    return () => {
      if (updateTimer.current) {
        clearInterval(updateTimer.current)
      }
    }
  }, [enableAutoUpdate, musicState.isInitialized, updateInterval])

  // 時間追跡の設定
  useEffect(() => {
    if (!enableTimeTracking || !musicState.isInitialized) return

    // 1分ごとに時間帯をチェック
    const timeTimer = setInterval(() => {
      const now = new Date()
      const hour = now.getHours()
      
      let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
      if (hour >= 6 && hour < 12) timeOfDay = 'morning'
      else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon'
      else if (hour >= 17 && hour < 21) timeOfDay = 'evening'
      else timeOfDay = 'night'

      updateGameMusic({ timeOfDay })
    }, 60000)

    return () => clearInterval(timeTimer)
  }, [enableTimeTracking, musicState.isInitialized])

  // ゲームコンテキストの更新
  const updateContext = (context: Partial<GameContext>) => {
    updateGameMusic(context)
  }

  // 手動での音楽制御
  const playTrack = (trackId: string, fade: boolean = true) => {
    musicManager.playTrack(trackId, fade)
  }

  const playPlaylist = (playlistId: string) => {
    musicManager.playPlaylist(playlistId)
  }

  // 音量制御
  const setVolume = (volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume))
    soundSystem.updateConfig({ volume: clampedVolume })
    
    setMusicState(prev => ({
      ...prev,
      volume: clampedVolume
    }))
  }

  // ミュート制御
  const toggleMute = () => {
    const newEnabled = !musicState.isEnabled
    soundSystem.updateConfig({ enabled: newEnabled })
    
    if (!newEnabled) {
      soundSystem.stopAll()
    }
    
    setMusicState(prev => ({
      ...prev,
      isEnabled: newEnabled
    }))
  }

  // BGM制御
  const toggleBGM = () => {
    const config = soundSystem.getConfig()
    const newBGMEnabled = !config.bgmEnabled
    soundSystem.updateConfig({ bgmEnabled: newBGMEnabled })
    
    if (!newBGMEnabled) {
      soundSystem.stopBGM()
    } else {
      // BGMを再開
      updateGameMusic({
        currentPage: currentPage.current
      })
    }
  }

  // 効果音制御
  const toggleSFX = () => {
    const config = soundSystem.getConfig()
    soundSystem.updateConfig({ sfxEnabled: !config.sfxEnabled })
  }

  // 音楽情報の取得
  const getMusicInfo = () => {
    return musicManager.getCurrentMusicInfo()
  }

  // 音楽状態の取得
  const getMusicStatus = () => {
    return musicManager.getStatus()
  }

  // ゲームイベント用のヘルパー
  const playGameEvent = (eventType: 'achievement' | 'expedition_start' | 'expedition_end' | 'training_start' | 'training_end' | 'breeding_start' | 'breeding_end' | 'research_start' | 'research_end') => {
    switch (eventType) {
      case 'achievement':
        updateContext({ recentAchievement: true })
        setTimeout(() => updateContext({ recentAchievement: false }), 5000)
        break
      case 'expedition_start':
        updateContext({ activeExpeditions: 1, mood: 'excited' })
        break
      case 'expedition_end':
        updateContext({ activeExpeditions: 0, mood: 'neutral' })
        break
      case 'training_start':
        updateContext({ ongoingTraining: true, mood: 'focused' })
        break
      case 'training_end':
        updateContext({ ongoingTraining: false, mood: 'neutral' })
        break
      case 'breeding_start':
        updateContext({ inBreeding: true, mood: 'relaxed' })
        break
      case 'breeding_end':
        updateContext({ inBreeding: false, mood: 'neutral' })
        break
      case 'research_start':
        updateContext({ inResearch: true, mood: 'focused' })
        break
      case 'research_end':
        updateContext({ inResearch: false, mood: 'neutral' })
        break
    }
  }

  return {
    // 状態
    ...musicState,
    
    // コンテキスト制御
    updateContext,
    
    // 手動制御
    playTrack,
    playPlaylist,
    
    // 音量制御
    setVolume,
    toggleMute,
    toggleBGM,
    toggleSFX,
    
    // 情報取得
    getMusicInfo,
    getMusicStatus,
    
    // ゲームイベント
    playGameEvent
  }
}

// ページ名の抽出
function extractPageName(url: string): string {
  const path = url.split('?')[0].split('#')[0]
  const segments = path.split('/').filter(Boolean)
  
  if (segments.length === 0) return 'welcome'
  
  const page = segments[segments.length - 1]
  
  // 特別なページ名のマッピング
  const pageMapping: Record<string, string> = {
    '': 'dashboard',
    'dashboard': 'dashboard',
    'pokemon': 'pokemon',
    'trainers': 'trainers',
    'facilities': 'facilities',
    'expeditions': 'expeditions',
    'research': 'research',
    'breeding': 'breeding',
    'settings': 'settings'
  }
  
  return pageMapping[page] || page
}

// 音楽制御用のカスタムホック（簡易版）
export function useMusicControl() {
  const [isEnabled, setIsEnabled] = useState(true)
  const [volume, setVolumeState] = useState(0.7)

  useEffect(() => {
    const config = soundSystem.getConfig()
    setIsEnabled(config.enabled)
    setVolumeState(config.volume)
  }, [])

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
    }
  }

  return {
    isEnabled,
    volume,
    setVolume,
    toggleMute
  }
}