// 動的音楽管理システム - ゲーム状況に応じたBGM自動切り替え

import { soundSystem } from './sound-system'

export interface GameContext {
  currentPage: string
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  season: 'spring' | 'summer' | 'autumn' | 'winter'
  activeExpeditions: number
  ongoingTraining: boolean
  inBreeding: boolean
  inResearch: boolean
  recentAchievement: boolean
  playerLevel: number
  mood: 'happy' | 'neutral' | 'focused' | 'excited' | 'relaxed'
}

export interface MusicRule {
  id: string
  name: string
  priority: number
  conditions: (context: GameContext) => boolean
  trackId: string
  fadeTransition: boolean
  volume?: number
}

export interface PlaylistEntry {
  trackId: string
  duration: number
  nextTrack?: string
  conditions?: (context: GameContext) => boolean
}

export class MusicManager {
  private currentTrack: string | null = null
  private currentContext: GameContext | null = null
  private musicRules: MusicRule[] = []
  private playlists: Map<string, PlaylistEntry[]> = new Map()
  private lastUpdateTime: number = 0
  private updateInterval: number = 10000 // 10秒ごとに更新チェック
  private seasonalBonus: boolean = false
  private ambientTimer: NodeJS.Timeout | null = null

  constructor() {
    this.initializeMusicRules()
    this.initializePlaylists()
    this.startAmbientSystem()
    
    // 時間変化の監視
    setInterval(() => this.checkTimeChange(), 60000) // 1分ごと
  }

  // 音楽ルールの初期化
  private initializeMusicRules(): void {
    this.musicRules = [
      // 最優先ルール（特別なイベント）
      {
        id: 'achievement_celebration',
        name: 'アチーブメント達成',
        priority: 100,
        conditions: (ctx) => ctx.recentAchievement,
        trackId: 'bgm_achievement',
        fadeTransition: true,
        volume: 0.8
      },

      // 活動別ルール
      {
        id: 'active_expedition',
        name: '派遣進行中',
        priority: 80,
        conditions: (ctx) => ctx.activeExpeditions > 0,
        trackId: 'bgm_expedition',
        fadeTransition: true
      },
      {
        id: 'training_session',
        name: 'トレーニング中',
        priority: 75,
        conditions: (ctx) => ctx.ongoingTraining,
        trackId: 'bgm_training',
        fadeTransition: true
      },
      {
        id: 'breeding_activity',
        name: '育て屋活動中',
        priority: 70,
        conditions: (ctx) => ctx.inBreeding,
        trackId: 'bgm_breeding',
        fadeTransition: true
      },
      {
        id: 'research_mode',
        name: '研究中',
        priority: 75,
        conditions: (ctx) => ctx.inResearch,
        trackId: 'bgm_research',
        fadeTransition: true
      },

      // ページ別ルール
      {
        id: 'pokemon_center_page',
        name: 'ポケモンセンターページ',
        priority: 60,
        conditions: (ctx) => ctx.currentPage === 'pokemon' || ctx.currentPage === 'pokemon-center',
        trackId: 'bgm_pokemon_center',
        fadeTransition: true
      },
      {
        id: 'dashboard_page',
        name: 'ダッシュボードページ',
        priority: 55,
        conditions: (ctx) => ctx.currentPage === 'dashboard',
        trackId: 'bgm_dashboard',
        fadeTransition: true
      },

      // 時間帯別ルール（季節考慮）
      {
        id: 'morning_time',
        name: '朝の時間帯',
        priority: 30,
        conditions: (ctx) => ctx.timeOfDay === 'morning',
        trackId: 'bgm_morning',
        fadeTransition: true
      },
      {
        id: 'afternoon_time',
        name: '昼の時間帯',
        priority: 30,
        conditions: (ctx) => ctx.timeOfDay === 'afternoon',
        trackId: 'bgm_afternoon',
        fadeTransition: true
      },
      {
        id: 'evening_time',
        name: '夕方の時間帯',
        priority: 30,
        conditions: (ctx) => ctx.timeOfDay === 'evening',
        trackId: 'bgm_evening',
        fadeTransition: true
      },
      {
        id: 'night_time',
        name: '夜の時間帯',
        priority: 30,
        conditions: (ctx) => ctx.timeOfDay === 'night',
        trackId: 'bgm_night',
        fadeTransition: true
      },

      // 季節別ルール（時間帯ルールより低優先度だが、季節イベント時は優先）
      {
        id: 'spring_season',
        name: '春の季節',
        priority: this.seasonalBonus ? 50 : 20,
        conditions: (ctx) => ctx.season === 'spring',
        trackId: 'bgm_seasonal_spring',
        fadeTransition: true
      },
      {
        id: 'summer_season',
        name: '夏の季節',
        priority: this.seasonalBonus ? 50 : 20,
        conditions: (ctx) => ctx.season === 'summer',
        trackId: 'bgm_seasonal_summer',
        fadeTransition: true
      },
      {
        id: 'autumn_season',
        name: '秋の季節',
        priority: this.seasonalBonus ? 50 : 20,
        conditions: (ctx) => ctx.season === 'autumn',
        trackId: 'bgm_seasonal_autumn',
        fadeTransition: true
      },
      {
        id: 'winter_season',
        name: '冬の季節',
        priority: this.seasonalBonus ? 50 : 20,
        conditions: (ctx) => ctx.season === 'winter',
        trackId: 'bgm_seasonal_winter',
        fadeTransition: true
      },

      // デフォルトルール（最低優先度）
      {
        id: 'default_main',
        name: 'メインテーマ',
        priority: 10,
        conditions: () => true,
        trackId: 'bgm_main',
        fadeTransition: true
      }
    ]

    console.log('🎵 音楽ルール初期化完了:', this.musicRules.length)
  }

  // プレイリストの初期化
  private initializePlaylists(): void {
    // 朝のプレイリスト
    this.playlists.set('morning_playlist', [
      { trackId: 'bgm_morning', duration: 240 },
      { trackId: 'bgm_main', duration: 180 },
      { trackId: 'bgm_dashboard', duration: 120 }
    ])

    // 夜のプレイリスト
    this.playlists.set('night_playlist', [
      { trackId: 'bgm_night', duration: 300 },
      { trackId: 'bgm_pokemon_center', duration: 240 }
    ])

    // 作業用プレイリスト
    this.playlists.set('work_playlist', [
      { trackId: 'bgm_training', duration: 180 },
      { trackId: 'bgm_research', duration: 200 },
      { trackId: 'bgm_dashboard', duration: 160 }
    ])

    console.log('🎵 プレイリスト初期化完了:', this.playlists.size)
  }

  // ゲームコンテキストの更新
  updateContext(context: Partial<GameContext>): void {
    const oldContext = this.currentContext
    this.currentContext = {
      currentPage: 'dashboard',
      timeOfDay: this.getCurrentTimeOfDay(),
      season: this.getCurrentSeason(),
      activeExpeditions: 0,
      ongoingTraining: false,
      inBreeding: false,
      inResearch: false,
      recentAchievement: false,
      playerLevel: 1,
      mood: 'neutral',
      ...this.currentContext,
      ...context
    }

    // コンテキストに重要な変化がある場合は即座に音楽を更新
    if (this.shouldUpdateMusicImmediately(oldContext, this.currentContext)) {
      this.updateMusic()
    } else {
      // 通常の更新間隔チェック
      const now = Date.now()
      if (now - this.lastUpdateTime > this.updateInterval) {
        this.updateMusic()
      }
    }
  }

  // 即座に音楽更新が必要かの判定
  private shouldUpdateMusicImmediately(old: GameContext | null, current: GameContext): boolean {
    if (!old) return true

    // 重要な変化の検出
    return (
      old.currentPage !== current.currentPage ||
      old.recentAchievement !== current.recentAchievement ||
      old.ongoingTraining !== current.ongoingTraining ||
      old.inBreeding !== current.inBreeding ||
      old.inResearch !== current.inResearch ||
      (old.activeExpeditions === 0) !== (current.activeExpeditions === 0) ||
      old.timeOfDay !== current.timeOfDay
    )
  }

  // 音楽の更新
  private updateMusic(): void {
    if (!this.currentContext) return

    const bestRule = this.selectBestMusicRule(this.currentContext)
    if (!bestRule) return

    const newTrackId = bestRule.trackId
    
    // 既に同じトラックが再生中の場合はスキップ
    if (this.currentTrack === newTrackId) return

    console.log(`🎵 音楽変更: ${this.currentTrack} → ${newTrackId} (${bestRule.name})`)

    // 音楽の切り替え
    if (bestRule.fadeTransition && this.currentTrack) {
      soundSystem.fadeBGM(newTrackId)
    } else {
      soundSystem.stopBGM()
      soundSystem.playBGM(newTrackId)
    }

    this.currentTrack = newTrackId
    this.lastUpdateTime = Date.now()

    // 音量調整
    if (bestRule.volume) {
      const config = soundSystem.getConfig()
      soundSystem.updateConfig({ volume: config.volume * bestRule.volume })
    }
  }

  // 最適な音楽ルールの選択
  private selectBestMusicRule(context: GameContext): MusicRule | null {
    const applicableRules = this.musicRules
      .filter(rule => rule.conditions(context))
      .sort((a, b) => b.priority - a.priority)

    return applicableRules[0] || null
  }

  // 現在の時間帯を取得
  private getCurrentTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours()
    
    if (hour >= 6 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 17) return 'afternoon'
    if (hour >= 17 && hour < 21) return 'evening'
    return 'night'
  }

  // 現在の季節を取得
  private getCurrentSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
    const month = new Date().getMonth() + 1
    
    if (month >= 3 && month <= 5) return 'spring'
    if (month >= 6 && month <= 8) return 'summer'
    if (month >= 9 && month <= 11) return 'autumn'
    return 'winter'
  }

  // 時間変化の確認
  private checkTimeChange(): void {
    if (!this.currentContext) return

    const newTimeOfDay = this.getCurrentTimeOfDay()
    const newSeason = this.getCurrentSeason()

    if (this.currentContext.timeOfDay !== newTimeOfDay || 
        this.currentContext.season !== newSeason) {
      
      this.updateContext({
        timeOfDay: newTimeOfDay,
        season: newSeason
      })
    }
  }

  // アンビエントサウンドシステムの開始
  private startAmbientSystem(): void {
    // 定期的にアンビエント音を再生
    this.ambientTimer = setInterval(() => {
      if (this.currentContext && this.shouldPlayAmbientSound()) {
        soundSystem.playRandomAmbient()
      }
    }, 30000) // 30秒ごと
  }

  // アンビエント音再生の判定
  private shouldPlayAmbientSound(): boolean {
    if (!this.currentContext) return false

    // 夜や静かな時間帯は控えめに
    if (this.currentContext.timeOfDay === 'night') return Math.random() < 0.3
    
    // 活動中は少し多めに
    if (this.currentContext.ongoingTraining || this.currentContext.inResearch) {
      return Math.random() < 0.6
    }

    return Math.random() < 0.4
  }

  // 季節イベントの有効化
  enableSeasonalBonus(enabled: boolean): void {
    this.seasonalBonus = enabled
    
    // 季節ルールの優先度を更新
    this.musicRules.forEach(rule => {
      if (rule.id.includes('season')) {
        rule.priority = enabled ? 50 : 20
      }
    })

    if (enabled) {
      console.log('🎵 季節音楽ボーナス有効化')
      this.updateMusic()
    }
  }

  // プレイリストの再生
  playPlaylist(playlistId: string): void {
    const playlist = this.playlists.get(playlistId)
    if (!playlist || playlist.length === 0) return

    console.log(`🎵 プレイリスト開始: ${playlistId}`)
    
    let currentIndex = 0
    const playNext = () => {
      if (currentIndex >= playlist.length) {
        currentIndex = 0 // ループ
      }

      const entry = playlist[currentIndex]
      const shouldPlay = !entry.conditions || entry.conditions(this.currentContext!)

      if (shouldPlay) {
        soundSystem.playBGM(entry.trackId)
        this.currentTrack = entry.trackId

        // 次の曲への自動切り替え
        setTimeout(() => {
          currentIndex++
          playNext()
        }, entry.duration * 1000)
      } else {
        currentIndex++
        playNext()
      }
    }

    playNext()
  }

  // 手動での音楽変更
  playTrack(trackId: string, fadeTransition: boolean = true): void {
    console.log(`🎵 手動再生: ${trackId}`)
    
    if (fadeTransition && this.currentTrack) {
      soundSystem.fadeBGM(trackId)
    } else {
      soundSystem.stopBGM()
      soundSystem.playBGM(trackId)
    }

    this.currentTrack = trackId
  }

  // 現在の音楽情報を取得
  getCurrentMusicInfo(): {
    currentTrack: string | null
    applicableRules: string[]
    nextUpdate: number
    context: GameContext | null
  } {
    const applicableRules = this.currentContext 
      ? this.musicRules
          .filter(rule => rule.conditions(this.currentContext!))
          .map(rule => rule.name)
      : []

    return {
      currentTrack: this.currentTrack,
      applicableRules,
      nextUpdate: this.updateInterval - (Date.now() - this.lastUpdateTime),
      context: this.currentContext
    }
  }

  // 音楽システムの状態を取得
  getStatus(): {
    initialized: boolean
    currentTrack: string | null
    rulesCount: number
    playlistsCount: number
    lastUpdate: string
  } {
    return {
      initialized: soundSystem.getStatus().initialized,
      currentTrack: this.currentTrack,
      rulesCount: this.musicRules.length,
      playlistsCount: this.playlists.size,
      lastUpdate: new Date(this.lastUpdateTime).toLocaleTimeString()
    }
  }

  // クリーンアップ
  destroy(): void {
    if (this.ambientTimer) {
      clearInterval(this.ambientTimer)
      this.ambientTimer = null
    }
    soundSystem.stopAll()
    console.log('🎵 音楽マネージャー終了')
  }
}

// シングルトンインスタンス
export const musicManager = new MusicManager()

// ゲームイベント用のヘルパー関数
export function updateGameMusic(context: Partial<GameContext>): void {
  musicManager.updateContext(context)
}

export function playAchievementMusic(): void {
  musicManager.updateContext({ recentAchievement: true })
  
  // 5秒後にアチーブメント状態をリセット
  setTimeout(() => {
    musicManager.updateContext({ recentAchievement: false })
  }, 5000)
}

export function startExpeditionMusic(): void {
  musicManager.updateContext({ 
    activeExpeditions: 1,
    mood: 'excited'
  })
}

export function endExpeditionMusic(): void {
  musicManager.updateContext({ 
    activeExpeditions: 0,
    mood: 'neutral'
  })
}

export function enterTrainingMode(): void {
  musicManager.updateContext({
    ongoingTraining: true,
    mood: 'focused'
  })
}

export function exitTrainingMode(): void {
  musicManager.updateContext({
    ongoingTraining: false,
    mood: 'neutral'
  })
}

export function enterBreedingMode(): void {
  musicManager.updateContext({
    inBreeding: true,
    mood: 'relaxed'
  })
}

export function exitBreedingMode(): void {
  musicManager.updateContext({
    inBreeding: false,
    mood: 'neutral'
  })
}

export function enterResearchMode(): void {
  musicManager.updateContext({
    inResearch: true,
    mood: 'focused'
  })
}

export function exitResearchMode(): void {
  musicManager.updateContext({
    inResearch: false,
    mood: 'neutral'
  })
}