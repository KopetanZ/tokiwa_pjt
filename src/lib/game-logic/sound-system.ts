// 音響システム - ゲーム音楽・効果音管理
import { gameRandom } from './random-system'

// 音響関連の型定義
export interface SoundConfig {
  volume: number // 0.0 - 1.0
  enabled: boolean
  bgmEnabled: boolean
  sfxEnabled: boolean
  fadeTime: number // ミリ秒
}

export interface AudioTrack {
  id: string
  name: string
  type: 'bgm' | 'sfx' | 'jingle' | 'ambient'
  url?: string
  buffer?: AudioBuffer
  loop: boolean
  volume: number
  duration?: number
}

export interface SoundEvent {
  type: 'expedition_start' | 'expedition_complete' | 'pokemon_catch' | 'level_up' | 
        'money_gain' | 'facility_upgrade' | 'battle_victory' | 'rare_encounter' |
        'notification' | 'ui_click' | 'menu_open' | 'error'
  priority: 'low' | 'medium' | 'high' | 'critical'
  track?: string
  volume?: number
}

// Web Audio API クラス
class WebAudioManager {
  private audioContext: AudioContext | null = null
  private gainNode: GainNode | null = null
  private tracks: Map<string, AudioTrack> = new Map()
  private currentBGM: AudioBufferSourceNode | null = null
  private sfxSources: AudioBufferSourceNode[] = []
  
  async initialize(): Promise<boolean> {
    try {
      // テスト環境では初期化をスキップ
      if (typeof window === 'undefined') {
        return false
      }
      
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.gainNode = this.audioContext.createGain()
      this.gainNode.connect(this.audioContext.destination)
      
      // ユーザー操作で音声コンテキストを再開
      if (this.audioContext.state === 'suspended') {
        document.addEventListener('click', this.resumeAudioContext.bind(this), { once: true })
        document.addEventListener('keydown', this.resumeAudioContext.bind(this), { once: true })
      }
      
      console.log('🔊 Web Audio API 初期化完了')
      return true
    } catch (error) {
      console.error('Web Audio API 初期化失敗:', error)
      return false
    }
  }
  
  private async resumeAudioContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
      console.log('🔊 音声コンテキスト再開')
    }
  }
  
  async loadAudio(track: AudioTrack): Promise<boolean> {
    if (!this.audioContext) return false
    
    try {
      if (track.url) {
        const response = await fetch(track.url)
        const arrayBuffer = await response.arrayBuffer()
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
        
        track.buffer = audioBuffer
        track.duration = audioBuffer.duration
        this.tracks.set(track.id, track)
        
        console.log(`🎵 音源読み込み完了: ${track.name}`)
        return true
      } else {
        // URLがない場合は生成音を使用
        this.generateSyntheticAudio(track)
        return true
      }
    } catch (error) {
      console.error(`音源読み込み失敗: ${track.name}`, error)
      // フォールバック: 合成音を生成
      this.generateSyntheticAudio(track)
      return false
    }
  }
  
  // 合成音生成（音源ファイルがない場合のフォールバック）
  private generateSyntheticAudio(track: AudioTrack): void {
    if (!this.audioContext) return
    
    const duration = 1.0 // 1秒
    const sampleRate = this.audioContext.sampleRate
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate)
    const data = buffer.getChannelData(0)
    
    // トラックタイプに応じた合成音
    switch (track.type) {
      case 'sfx':
        this.generateSFX(data, sampleRate, track.id)
        break
      case 'jingle':
        this.generateJingle(data, sampleRate)
        break
      case 'bgm':
        this.generateBGM(data, sampleRate)
        break
      default:
        this.generateClick(data, sampleRate)
    }
    
    track.buffer = buffer
    track.duration = duration
    this.tracks.set(track.id, track)
  }
  
  // 効果音合成
  private generateSFX(data: Float32Array, sampleRate: number, soundId: string): void {
    const length = data.length
    
    switch (soundId) {
      case 'pokemon_catch':
        // ポケモン捕獲音: 上昇音程
        for (let i = 0; i < length; i++) {
          const t = i / sampleRate
          const freq = 440 + (t * 200) // 440Hz から 640Hz へ上昇
          data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 3) * 0.3
        }
        break
        
      case 'level_up':
        // レベルアップ音: ファンファーレ風
        for (let i = 0; i < length; i++) {
          const t = i / sampleRate
          const freq1 = 523 // C5
          const freq2 = 659 // E5  
          const freq3 = 784 // G5
          const envelope = Math.exp(-t * 2)
          data[i] = (
            Math.sin(2 * Math.PI * freq1 * t) +
            Math.sin(2 * Math.PI * freq2 * t) +
            Math.sin(2 * Math.PI * freq3 * t)
          ) * envelope * 0.2
        }
        break
        
      case 'money_gain':
        // お金獲得音: キラキラ音
        for (let i = 0; i < length; i++) {
          const t = i / sampleRate
          const freq = 880 + Math.sin(t * 10) * 100
          data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 4) * 0.25
        }
        break
        
      case 'notification':
        // 通知音: シンプルなピン音
        for (let i = 0; i < length; i++) {
          const t = i / sampleRate
          const freq = 800
          data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 5) * 0.3
        }
        break
        
      default:
        this.generateClick(data, sampleRate)
    }
  }
  
  // ジングル合成
  private generateJingle(data: Float32Array, sampleRate: number): void {
    const length = data.length
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate
      // 簡単なメロディ
      const notes = [523, 659, 784, 1047] // C, E, G, C (1オクターブ上)
      const noteIndex = Math.floor(t * 4) % notes.length
      const freq = notes[noteIndex]
      const envelope = Math.exp(-t * 1.5)
      
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.2
    }
  }
  
  // BGM合成
  private generateBGM(data: Float32Array, sampleRate: number): void {
    const length = data.length
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate
      // アンビエント風の音
      const freq1 = 220 + Math.sin(t * 0.5) * 20
      const freq2 = 330 + Math.sin(t * 0.7) * 15
      const envelope = 1.0
      
      data[i] = (
        Math.sin(2 * Math.PI * freq1 * t) * 0.1 +
        Math.sin(2 * Math.PI * freq2 * t) * 0.08
      ) * envelope
    }
  }
  
  // クリック音合成
  private generateClick(data: Float32Array, sampleRate: number): void {
    const length = Math.min(data.length, sampleRate * 0.1) // 0.1秒
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate
      const freq = 1000
      data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 30) * 0.2
    }
  }
  
  playSound(trackId: string, volume: number = 1.0, loop: boolean = false): boolean {
    if (!this.audioContext || !this.gainNode) return false
    
    const track = this.tracks.get(trackId)
    if (!track || !track.buffer) return false
    
    const source = this.audioContext.createBufferSource()
    const gainNode = this.audioContext.createGain()
    
    source.buffer = track.buffer
    source.loop = loop
    source.connect(gainNode)
    gainNode.connect(this.gainNode)
    
    // 音量設定
    gainNode.gain.value = volume * track.volume
    
    source.start()
    
    if (track.type === 'bgm' && loop) {
      // BGMの場合は現在のBGMを停止
      if (this.currentBGM) {
        this.currentBGM.stop()
      }
      this.currentBGM = source
    } else {
      // 効果音の場合はリストに追加
      this.sfxSources.push(source)
      
      // 再生終了後にリストから削除
      source.onended = () => {
        const index = this.sfxSources.indexOf(source)
        if (index !== -1) {
          this.sfxSources.splice(index, 1)
        }
      }
    }
    
    return true
  }
  
  stopBGM(): void {
    if (this.currentBGM) {
      this.currentBGM.stop()
      this.currentBGM = null
    }
  }
  
  stopAllSFX(): void {
    this.sfxSources.forEach(source => {
      try {
        source.stop()
      } catch (error) {
        // 既に停止している場合のエラーを無視
      }
    })
    this.sfxSources = []
  }
  
  setGlobalVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume))
    }
  }
  
  fadeOut(duration: number = 1000): void {
    if (!this.gainNode || !this.audioContext) return
    
    const currentTime = this.audioContext.currentTime
    this.gainNode.gain.linearRampToValueAtTime(0, currentTime + duration / 1000)
  }
  
  fadeIn(targetVolume: number = 1.0, duration: number = 1000): void {
    if (!this.gainNode || !this.audioContext) return
    
    const currentTime = this.audioContext.currentTime
    this.gainNode.gain.value = 0
    this.gainNode.gain.linearRampToValueAtTime(targetVolume, currentTime + duration / 1000)
  }
}

export class SoundSystem {
  private audioManager: WebAudioManager
  private config: SoundConfig
  private initialized: boolean = false
  
  constructor() {
    this.audioManager = new WebAudioManager()
    this.config = {
      volume: 0.7,
      enabled: true,
      bgmEnabled: true,
      sfxEnabled: true,
      fadeTime: 1000
    }
    
    this.loadConfigFromStorage()
  }
  
  async initialize(): Promise<void> {
    if (this.initialized) return
    
    const success = await this.audioManager.initialize()
    if (success) {
      await this.loadDefaultTracks()
      this.initialized = true
      console.log('🎵 音響システム初期化完了')
    } else {
      console.warn('🔇 音響システムの初期化に失敗しました（無音モード）')
    }
  }
  
  private async loadDefaultTracks(): Promise<void> {
    // デフォルトの音源トラックを定義
    const defaultTracks: AudioTrack[] = [
      // BGM
      {
        id: 'bgm_main',
        name: 'メインテーマ',
        type: 'bgm',
        loop: true,
        volume: 0.4
      },
      {
        id: 'bgm_expedition',
        name: '派遣中',
        type: 'bgm',
        loop: true,
        volume: 0.3
      },
      
      // 効果音
      {
        id: 'pokemon_catch',
        name: 'ポケモン捕獲',
        type: 'sfx',
        loop: false,
        volume: 0.6
      },
      {
        id: 'level_up',
        name: 'レベルアップ',
        type: 'jingle',
        loop: false,
        volume: 0.7
      },
      {
        id: 'money_gain',
        name: 'お金獲得',
        type: 'sfx',
        loop: false,
        volume: 0.5
      },
      {
        id: 'notification',
        name: '通知',
        type: 'sfx',
        loop: false,
        volume: 0.6
      },
      {
        id: 'ui_click',
        name: 'UI クリック',
        type: 'sfx',
        loop: false,
        volume: 0.3
      },
      {
        id: 'menu_open',
        name: 'メニュー開く',
        type: 'sfx',
        loop: false,
        volume: 0.4
      },
      {
        id: 'error',
        name: 'エラー',
        type: 'sfx',
        loop: false,
        volume: 0.6
      },
      {
        id: 'battle_victory',
        name: 'バトル勝利',
        type: 'jingle',
        loop: false,
        volume: 0.7
      },
      {
        id: 'rare_encounter',
        name: 'レア遭遇',
        type: 'jingle',
        loop: false,
        volume: 0.8
      },
      {
        id: 'facility_upgrade',
        name: '施設アップグレード',
        type: 'jingle',
        loop: false,
        volume: 0.6
      }
    ]
    
    // 全トラックを並列読み込み
    const loadPromises = defaultTracks.map(track => this.audioManager.loadAudio(track))
    await Promise.all(loadPromises)
    
    console.log(`🎵 ${defaultTracks.length}個の音源を読み込み完了`)
  }
  
  // サウンドイベント再生
  playEvent(event: SoundEvent): void {
    if (!this.initialized || !this.config.enabled) return
    
    const trackId = event.track || this.getDefaultTrackForEvent(event.type)
    const volume = (event.volume || 1.0) * this.config.volume
    
    // SFXが無効化されている場合はスキップ
    if (!this.config.sfxEnabled && event.type !== 'expedition_start') return
    
    this.audioManager.playSound(trackId, volume, false)
    
    // デバッグログ
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔊 効果音再生: ${event.type} (${trackId})`)
    }
  }
  
  // イベントタイプに対応するデフォルトトラックID
  private getDefaultTrackForEvent(eventType: SoundEvent['type']): string {
    const eventTrackMap: Record<SoundEvent['type'], string> = {
      expedition_start: 'notification',
      expedition_complete: 'notification',
      pokemon_catch: 'pokemon_catch',
      level_up: 'level_up',
      money_gain: 'money_gain',
      facility_upgrade: 'facility_upgrade',
      battle_victory: 'battle_victory',
      rare_encounter: 'rare_encounter',
      notification: 'notification',
      ui_click: 'ui_click',
      menu_open: 'menu_open',
      error: 'error'
    }
    
    return eventTrackMap[eventType] || 'ui_click'
  }
  
  // BGM制御
  playBGM(trackId: string = 'bgm_main'): void {
    if (!this.initialized || !this.config.enabled || !this.config.bgmEnabled) return
    
    this.audioManager.playSound(trackId, this.config.volume * 0.5, true)
    console.log(`🎵 BGM開始: ${trackId}`)
  }
  
  stopBGM(): void {
    this.audioManager.stopBGM()
    console.log('🎵 BGM停止')
  }
  
  fadeBGM(newTrackId?: string): void {
    if (!this.initialized) return
    
    this.audioManager.fadeOut(this.config.fadeTime)
    
    if (newTrackId) {
      setTimeout(() => {
        this.playBGM(newTrackId)
        this.audioManager.fadeIn(this.config.volume * 0.5, this.config.fadeTime)
      }, this.config.fadeTime)
    }
  }
  
  // 設定関連
  updateConfig(newConfig: Partial<SoundConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.audioManager.setGlobalVolume(this.config.volume)
    this.saveConfigToStorage()
    
    console.log('🔊 音響設定更新:', this.config)
  }
  
  getConfig(): SoundConfig {
    return { ...this.config }
  }
  
  // ローカルストレージからの設定読み込み
  private loadConfigFromStorage(): void {
    try {
      if (typeof localStorage === 'undefined') return
      
      const stored = localStorage.getItem('tokiwa-sound-config')
      if (stored) {
        const config = JSON.parse(stored)
        this.config = { ...this.config, ...config }
      }
    } catch (error) {
      console.error('音響設定読み込みエラー:', error)
    }
  }
  
  // ローカルストレージへの設定保存
  private saveConfigToStorage(): void {
    try {
      localStorage.setItem('tokiwa-sound-config', JSON.stringify(this.config))
    } catch (error) {
      console.error('音響設定保存エラー:', error)
    }
  }
  
  // ランダムアンビエント音再生
  playRandomAmbient(): void {
    if (!this.config.enabled || !this.config.bgmEnabled) return
    
    const ambientSounds = ['notification', 'ui_click']
    const randomSound = gameRandom.choice(ambientSounds)
    const randomVolume = this.config.volume * gameRandom.range(0.1, 0.3)
    
    this.audioManager.playSound(randomSound, randomVolume, false)
  }
  
  // 音響システムの状態確認
  getStatus(): {
    initialized: boolean
    config: SoundConfig
    tracksLoaded: number
  } {
    return {
      initialized: this.initialized,
      config: this.config,
      tracksLoaded: this.audioManager['tracks']?.size || 0
    }
  }
  
  // 緊急停止
  stopAll(): void {
    this.audioManager.stopBGM()
    this.audioManager.stopAllSFX()
    console.log('🔇 全音響停止')
  }
  
  // ミュート/アンミュート
  mute(): void {
    this.updateConfig({ enabled: false })
    this.stopAll()
  }
  
  unmute(): void {
    this.updateConfig({ enabled: true })
  }
  
  toggle(): void {
    if (this.config.enabled) {
      this.mute()
    } else {
      this.unmute()
    }
  }
}

export const soundSystem = new SoundSystem()

// ゲームイベントハンドラー
export function playExpeditionStartSound(): void {
  soundSystem.playEvent({
    type: 'expedition_start',
    priority: 'medium'
  })
}

export function playPokemonCatchSound(): void {
  soundSystem.playEvent({
    type: 'pokemon_catch',
    priority: 'high'
  })
}

export function playLevelUpSound(): void {
  soundSystem.playEvent({
    type: 'level_up',
    priority: 'high'
  })
}

export function playMoneySound(amount: number): void {
  // 金額に応じて音量を調整
  const volume = Math.min(1.0, 0.3 + (amount / 10000) * 0.7)
  
  soundSystem.playEvent({
    type: 'money_gain',
    priority: 'medium',
    volume
  })
}

export function playRareEncounterSound(): void {
  soundSystem.playEvent({
    type: 'rare_encounter',
    priority: 'critical'
  })
}

export function playUIClickSound(): void {
  soundSystem.playEvent({
    type: 'ui_click',
    priority: 'low'
  })
}

export function playNotificationSound(): void {
  soundSystem.playEvent({
    type: 'notification',
    priority: 'medium'
  })
}

export function playErrorSound(): void {
  soundSystem.playEvent({
    type: 'error',
    priority: 'high'
  })
}