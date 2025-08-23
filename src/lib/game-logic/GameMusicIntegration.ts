// ゲーム音楽統合システム - ゲームイベントと音楽の自動連携

import { musicManager, updateGameMusic } from './MusicManager'
import { soundSystem } from './sound-system'

export interface GameEventMusicMapping {
  expedition: {
    start: () => void
    progress: () => void
    complete: () => void
    failed: () => void
  }
  pokemon: {
    catch: () => void
    levelUp: () => void
    evolve: () => void
    rare: () => void
    shiny: () => void
  }
  trainer: {
    hire: () => void
    levelUp: () => void
    promote: () => void
  }
  facility: {
    build: () => void
    upgrade: () => void
    complete: () => void
  }
  economy: {
    moneyGain: (amount: number) => void
    majorTransaction: () => void
    milestone: () => void
  }
  achievement: {
    unlock: () => void
    milestone: () => void
    rare: () => void
  }
  seasonal: {
    change: (season: string) => void
    event: () => void
  }
  ui: {
    pageChange: (page: string) => void
    menuOpen: () => void
    notification: () => void
    error: () => void
  }
}

class GameMusicIntegration {
  private initialized: boolean = false
  private currentGameMode: string = 'normal'
  private musicEventHistory: Array<{ event: string; timestamp: number }> = []

  constructor() {
    this.initializeEventListeners()
  }

  private initializeEventListeners(): void {
    // ページ変更の監視
    if (typeof window !== 'undefined') {
      let currentPath = window.location.pathname
      
      const checkPathChange = () => {
        if (window.location.pathname !== currentPath) {
          currentPath = window.location.pathname
          this.handlePageChange(currentPath)
        }
      }

      // MutationObserverでDOM変化を監視（SPAのルート変更対応）
      const observer = new MutationObserver(checkPathChange)
      observer.observe(document, { childList: true, subtree: true })
      
      setInterval(checkPathChange, 1000) // フォールバック
    }

    this.initialized = true
    console.log('🎵 ゲーム音楽統合システム初期化完了')
  }

  private handlePageChange(path: string): void {
    const page = this.extractPageFromPath(path)
    this.events.ui.pageChange(page)
    
    console.log(`🎵 ページ変更: ${page}`)
  }

  private extractPageFromPath(path: string): string {
    const segments = path.split('/').filter(Boolean)
    if (segments.length === 0) return 'welcome'
    if (segments[0] === 'dashboard') {
      return segments[1] || 'dashboard'
    }
    return segments[0]
  }

  private logMusicEvent(event: string): void {
    this.musicEventHistory.push({
      event,
      timestamp: Date.now()
    })

    // 履歴を最新100件に制限
    if (this.musicEventHistory.length > 100) {
      this.musicEventHistory = this.musicEventHistory.slice(-100)
    }
  }

  // 公開API: ゲームイベント音楽制御
  public events: GameEventMusicMapping = {
    expedition: {
      start: () => {
        this.logMusicEvent('expedition.start')
        updateGameMusic({ 
          activeExpeditions: 1, 
          mood: 'excited' 
        })
        soundSystem.playEvent({
          type: 'expedition_start',
          priority: 'medium'
        })
        console.log('🎵 派遣開始音楽')
      },

      progress: () => {
        this.logMusicEvent('expedition.progress')
        soundSystem.playEvent({
          type: 'notification',
          priority: 'low'
        })
      },

      complete: () => {
        this.logMusicEvent('expedition.complete')
        updateGameMusic({ 
          activeExpeditions: 0, 
          mood: 'happy' 
        })
        soundSystem.playEvent({
          type: 'expedition_complete',
          priority: 'medium'
        })
        console.log('🎵 派遣完了音楽')
      },

      failed: () => {
        this.logMusicEvent('expedition.failed')
        updateGameMusic({ 
          activeExpeditions: 0, 
          mood: 'neutral' 
        })
        soundSystem.playEvent({
          type: 'error',
          priority: 'medium'
        })
      }
    },

    pokemon: {
      catch: () => {
        this.logMusicEvent('pokemon.catch')
        soundSystem.playEvent({
          type: 'pokemon_catch',
          priority: 'high'
        })
        updateGameMusic({ mood: 'happy' })
        console.log('🎵 ポケモン捕獲音楽')
      },

      levelUp: () => {
        this.logMusicEvent('pokemon.levelup')
        soundSystem.playEvent({
          type: 'level_up',
          priority: 'high'
        })
        updateGameMusic({ mood: 'excited' })
      },

      evolve: () => {
        this.logMusicEvent('pokemon.evolve')
        soundSystem.playEvent({
          type: 'level_up',
          priority: 'critical',
          volume: 1.2
        })
        updateGameMusic({ mood: 'excited' })
      },

      rare: () => {
        this.logMusicEvent('pokemon.rare')
        soundSystem.playEvent({
          type: 'rare_encounter',
          priority: 'critical'
        })
        updateGameMusic({ mood: 'excited' })
      },

      shiny: () => {
        this.logMusicEvent('pokemon.shiny')
        soundSystem.playEvent({
          type: 'rare_encounter',
          priority: 'critical',
          volume: 1.5
        })
        updateGameMusic({ mood: 'excited' })
        console.log('🎵 色違いポケモン音楽！')
      }
    },

    trainer: {
      hire: () => {
        this.logMusicEvent('trainer.hire')
        soundSystem.playEvent({
          type: 'money_gain',
          priority: 'medium'
        })
        updateGameMusic({ mood: 'happy' })
      },

      levelUp: () => {
        this.logMusicEvent('trainer.levelup')
        soundSystem.playEvent({
          type: 'level_up',
          priority: 'medium'
        })
      },

      promote: () => {
        this.logMusicEvent('trainer.promote')
        soundSystem.playEvent({
          type: 'battle_victory',
          priority: 'high'
        })
        updateGameMusic({ mood: 'excited' })
      }
    },

    facility: {
      build: () => {
        this.logMusicEvent('facility.build')
        soundSystem.playEvent({
          type: 'facility_upgrade',
          priority: 'medium'
        })
        updateGameMusic({ mood: 'focused' })
      },

      upgrade: () => {
        this.logMusicEvent('facility.upgrade')
        soundSystem.playEvent({
          type: 'facility_upgrade',
          priority: 'medium'
        })
      },

      complete: () => {
        this.logMusicEvent('facility.complete')
        soundSystem.playEvent({
          type: 'battle_victory',
          priority: 'high'
        })
        updateGameMusic({ mood: 'happy' })
      }
    },

    economy: {
      moneyGain: (amount: number) => {
        this.logMusicEvent(`economy.money_gain.${amount}`)
        const volume = Math.min(1.0, 0.3 + (amount / 10000) * 0.7)
        soundSystem.playEvent({
          type: 'money_gain',
          priority: 'medium',
          volume
        })
        
        if (amount >= 10000) {
          updateGameMusic({ mood: 'excited' })
        }
      },

      majorTransaction: () => {
        this.logMusicEvent('economy.major_transaction')
        soundSystem.playEvent({
          type: 'money_gain',
          priority: 'high',
          volume: 0.8
        })
      },

      milestone: () => {
        this.logMusicEvent('economy.milestone')
        soundSystem.playEvent({
          type: 'battle_victory',
          priority: 'high'
        })
        updateGameMusic({ mood: 'excited' })
      }
    },

    achievement: {
      unlock: () => {
        this.logMusicEvent('achievement.unlock')
        updateGameMusic({ recentAchievement: true })
        soundSystem.playEvent({
          type: 'battle_victory',
          priority: 'critical'
        })
        
        // 5秒後にアチーブメント状態をリセット
        setTimeout(() => {
          updateGameMusic({ recentAchievement: false, mood: 'happy' })
        }, 5000)
        
        console.log('🎵 アチーブメント解除音楽')
      },

      milestone: () => {
        this.logMusicEvent('achievement.milestone')
        musicManager.enableSeasonalBonus(true)
        soundSystem.playEvent({
          type: 'rare_encounter',
          priority: 'critical'
        })
        
        setTimeout(() => {
          musicManager.enableSeasonalBonus(false)
        }, 30000)
      },

      rare: () => {
        this.logMusicEvent('achievement.rare')
        soundSystem.playEvent({
          type: 'rare_encounter',
          priority: 'critical',
          volume: 1.3
        })
      }
    },

    seasonal: {
      change: (season: string) => {
        this.logMusicEvent(`seasonal.change.${season}`)
        updateGameMusic({ season: season as any })
        musicManager.enableSeasonalBonus(true)
        
        setTimeout(() => {
          musicManager.enableSeasonalBonus(false)
        }, 60000) // 1分間季節音楽を優先
        
        console.log(`🎵 季節変更: ${season}`)
      },

      event: () => {
        this.logMusicEvent('seasonal.event')
        musicManager.enableSeasonalBonus(true)
        soundSystem.playEvent({
          type: 'rare_encounter',
          priority: 'high'
        })
      }
    },

    ui: {
      pageChange: (page: string) => {
        this.logMusicEvent(`ui.page_change.${page}`)
        updateGameMusic({ currentPage: page })
        
        // ページ固有の音楽設定
        switch (page) {
          case 'pokemon':
            updateGameMusic({ mood: 'relaxed' })
            break
          case 'trainers':
            updateGameMusic({ mood: 'focused' })
            break
          case 'expeditions':
            updateGameMusic({ mood: 'excited' })
            break
          case 'facilities':
            updateGameMusic({ mood: 'focused' })
            break
          case 'research':
            updateGameMusic({ inResearch: true, mood: 'focused' })
            break
          default:
            updateGameMusic({ mood: 'neutral' })
        }
      },

      menuOpen: () => {
        this.logMusicEvent('ui.menu_open')
        soundSystem.playEvent({
          type: 'menu_open',
          priority: 'low'
        })
      },

      notification: () => {
        this.logMusicEvent('ui.notification')
        soundSystem.playEvent({
          type: 'notification',
          priority: 'medium'
        })
      },

      error: () => {
        this.logMusicEvent('ui.error')
        soundSystem.playEvent({
          type: 'error',
          priority: 'high'
        })
      }
    }
  }

  // ゲームモードの設定
  public setGameMode(mode: string): void {
    this.currentGameMode = mode
    
    switch (mode) {
      case 'tutorial':
        updateGameMusic({ mood: 'focused' })
        break
      case 'normal':
        updateGameMusic({ mood: 'neutral' })
        break
      case 'expedition':
        updateGameMusic({ activeExpeditions: 1, mood: 'excited' })
        break
      case 'training':
        updateGameMusic({ ongoingTraining: true, mood: 'focused' })
        break
      case 'breeding':
        updateGameMusic({ inBreeding: true, mood: 'relaxed' })
        break
      case 'research':
        updateGameMusic({ inResearch: true, mood: 'focused' })
        break
    }
    
    console.log(`🎵 ゲームモード変更: ${mode}`)
  }

  // 時間帯による音楽変更
  public updateTimeOfDay(): void {
    const hour = new Date().getHours()
    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
    
    if (hour >= 6 && hour < 12) timeOfDay = 'morning'
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon'
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening'
    else timeOfDay = 'night'
    
    updateGameMusic({ timeOfDay })
  }

  // 音楽イベント履歴の取得
  public getMusicEventHistory(): Array<{ event: string; timestamp: number }> {
    return [...this.musicEventHistory]
  }

  // 統計情報の取得
  public getStats(): {
    totalEvents: number
    recentEvents: number
    currentMode: string
    initialized: boolean
  } {
    const oneHourAgo = Date.now() - (60 * 60 * 1000)
    const recentEvents = this.musicEventHistory.filter(
      event => event.timestamp > oneHourAgo
    ).length

    return {
      totalEvents: this.musicEventHistory.length,
      recentEvents,
      currentMode: this.currentGameMode,
      initialized: this.initialized
    }
  }

  // システムのリセット
  public reset(): void {
    this.musicEventHistory = []
    this.currentGameMode = 'normal'
    updateGameMusic({
      currentPage: 'dashboard',
      mood: 'neutral',
      activeExpeditions: 0,
      ongoingTraining: false,
      inBreeding: false,
      inResearch: false,
      recentAchievement: false
    })
  }
}

// シングルトンインスタンス
export const gameMusicIntegration = new GameMusicIntegration()

// 便利な関数エクスポート
export const playGameMusic = gameMusicIntegration.events
export const setGameMusicMode = gameMusicIntegration.setGameMode.bind(gameMusicIntegration)
export const updateTimeOfDayMusic = gameMusicIntegration.updateTimeOfDay.bind(gameMusicIntegration)

// 自動時間更新の開始
if (typeof window !== 'undefined') {
  // 1分ごとに時間帯をチェック
  setInterval(() => {
    gameMusicIntegration.updateTimeOfDay()
  }, 60000)
  
  // 初回実行
  gameMusicIntegration.updateTimeOfDay()
}

export default gameMusicIntegration