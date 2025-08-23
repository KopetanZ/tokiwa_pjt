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
    
    // BGMの場合は長めのループ、その他は短め
    const duration = track.type === 'bgm' ? 8.0 : 1.0
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
        this.generateBGM(data, sampleRate, track.id)
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
  private generateBGM(data: Float32Array, sampleRate: number, trackId: string): void {
    const length = data.length
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate
      
      switch (trackId) {
        case 'bgm_expedition':
          // 派遣中のBGM: 冒険的で明るい音楽
          const adventureMelody = this.generateAdventureMelody(t)
          const adventureBass = this.generateAdventureBass(t)
          const adventureHarmony = this.generateAdventureHarmony(t)
          data[i] = (adventureMelody + adventureBass + adventureHarmony) * 0.12
          break
          
        case 'bgm_training':
          // トレーニングBGM: 力強く、エネルギッシュ
          data[i] = this.generateTrainingMusic(t) * 0.13
          break
          
        case 'bgm_pokemon_center':
          // ポケモンセンターBGM: 癒し系、穏やか
          data[i] = this.generateHealingMusic(t) * 0.11
          break
          
        case 'bgm_research':
          // 研究所BGM: 知的で神秘的
          data[i] = this.generateResearchMusic(t) * 0.12
          break
          
        case 'bgm_breeding':
          // 育て屋BGM: 優しく暖かい
          data[i] = this.generateBreedingMusic(t) * 0.11
          break
          
        case 'bgm_morning':
          // 朝のBGM: 爽やかで希望に満ちた
          data[i] = this.generateMorningMusic(t) * 0.13
          break
          
        case 'bgm_afternoon':
          // 昼のBGM: 活動的で明るい
          data[i] = this.generateAfternoonMusic(t) * 0.14
          break
          
        case 'bgm_evening':
          // 夕方のBGM: 落ち着いた、ノスタルジック
          data[i] = this.generateEveningMusic(t) * 0.12
          break
          
        case 'bgm_night':
          // 夜のBGM: 静かで神秘的
          data[i] = this.generateNightMusic(t) * 0.10
          break
          
        case 'bgm_seasonal_spring':
          // 春のBGM: 新緑と希望
          data[i] = this.generateSpringMusic(t) * 0.13
          break
          
        case 'bgm_seasonal_summer':
          // 夏のBGM: 元気で活発
          data[i] = this.generateSummerMusic(t) * 0.14
          break
          
        case 'bgm_seasonal_autumn':
          // 秋のBGM: 落ち着いた、収穫の季節
          data[i] = this.generateAutumnMusic(t) * 0.12
          break
          
        case 'bgm_seasonal_winter':
          // 冬のBGM: 静寂と美しさ
          data[i] = this.generateWinterMusic(t) * 0.11
          break
          
        case 'bgm_achievement':
          // アチーブメントBGM: 勝利と達成感
          data[i] = this.generateAchievementMusic(t) * 0.15
          break
          
        case 'bgm_dashboard':
          // ダッシュボードBGM: メインテーマのバリエーション
          data[i] = this.generateDashboardMusic(t) * 0.13
          break
          
        default:
          // メインBGM: 明るいポケモンらしい音楽: トキワシティ風
          const melody = this.generatePokemonMelody(t)
          const bass = this.generatePokemonBass(t)
          const harmony = this.generatePokemonHarmony(t)
          data[i] = (melody + bass + harmony) * 0.15
      }
    }
  }

  // ポケモンらしいメロディ生成
  private generatePokemonMelody(t: number): number {
    // 明るいメロディ: C major scale
    const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25] // C4 to C5
    const melodyPattern = [0, 2, 4, 2, 0, 2, 4, 5, 4, 2, 0, 2, 4, 2, 0, 2] // 明るいメロディパターン
    
    const noteIndex = Math.floor(t * 4) % melodyPattern.length
    const freq = notes[melodyPattern[noteIndex]]
    
    // メロディにリズムを追加
    const rhythm = Math.sin(t * 8) * 0.5 + 0.5
    return Math.sin(2 * Math.PI * freq * t) * rhythm
  }

  // ポケモンらしいベース生成
  private generatePokemonBass(t: number): number {
    // 安定したベースライン
    const bassNotes = [130.81, 146.83, 164.81, 174.61] // C3, D3, E3, F3
    const bassPattern = [0, 0, 1, 1, 2, 2, 3, 3, 2, 2, 1, 1, 0, 0, 1, 1]
    
    const noteIndex = Math.floor(t * 2) % bassPattern.length
    const freq = bassNotes[bassPattern[noteIndex]]
    
    return Math.sin(2 * Math.PI * freq * t) * 0.6
  }

  // ポケモンらしいハーモニー生成
  private generatePokemonHarmony(t: number): number {
    // 和音: C major triad (C, E, G)
    const harmonyFreqs = [261.63, 329.63, 392.00]
    const harmonyPattern = [0, 1, 2, 1, 0, 1, 2, 1]
    
    const patternIndex = Math.floor(t * 3) % harmonyPattern.length
    const freq = harmonyFreqs[harmonyPattern[patternIndex]]
    
    // ハーモニーに少しの変化を追加
    const variation = Math.sin(t * 0.5) * 0.3 + 0.7
    return Math.sin(2 * Math.PI * freq * t) * variation * 0.4
  }

  // 冒険的BGM用メロディ生成
  private generateAdventureMelody(t: number): number {
    // 冒険的なメロディ: G major scale
    const notes = [392.00, 440.00, 493.88, 523.25, 587.33, 659.25, 739.99, 783.99] // G4 to G5
    const adventurePattern = [0, 2, 4, 5, 4, 2, 0, 2, 4, 5, 7, 5, 4, 2, 0, 2] // 冒険的メロディパターン
    
    const noteIndex = Math.floor(t * 3) % adventurePattern.length
    const freq = notes[adventurePattern[noteIndex]]
    
    // 冒険的なリズム
    const rhythm = Math.sin(t * 6) * 0.6 + 0.4
    return Math.sin(2 * Math.PI * freq * t) * rhythm
  }

  // 冒険的BGM用ベース生成
  private generateAdventureBass(t: number): number {
    // 冒険的なベースライン
    const bassNotes = [196.00, 220.00, 246.94, 261.63] // G3, A3, B3, C4
    const bassPattern = [0, 1, 2, 1, 0, 1, 2, 3, 2, 1, 0, 1, 2, 1, 0, 1]
    
    const noteIndex = Math.floor(t * 2) % bassPattern.length
    const freq = bassNotes[bassPattern[noteIndex]]
    
    return Math.sin(2 * Math.PI * freq * t) * 0.5
  }

  // 冒険的BGM用ハーモニー生成
  private generateAdventureHarmony(t: number): number {
    // 和音: G major triad (G, B, D)
    const harmonyFreqs = [392.00, 493.88, 587.33]
    const harmonyPattern = [0, 1, 2, 1, 0, 1, 2, 1]
    
    const patternIndex = Math.floor(t * 2) % harmonyPattern.length
    const freq = harmonyFreqs[harmonyPattern[patternIndex]]
    
    // 冒険的な変化
    const variation = Math.sin(t * 1.5) * 0.4 + 0.6
    return Math.sin(2 * Math.PI * freq * t) * variation * 0.3
  }
  
  // トレーニング音楽生成
  private generateTrainingMusic(t: number): number {
    // 力強いリズムとメロディ
    const baseFreq = 220 // A3
    const rhythm = Math.sin(t * 8) * 0.5 + 0.5 // 速いリズム
    const melody = Math.sin(2 * Math.PI * baseFreq * 1.5 * t) * rhythm
    const percussion = Math.sin(t * 16) * 0.3 // パーカッション風
    return melody + percussion
  }
  
  // 癒し音楽生成（ポケモンセンター）
  private generateHealingMusic(t: number): number {
    // 優しく穏やかなメロディ
    const freq1 = 261.63 // C4
    const freq2 = 329.63 // E4
    const soothing = Math.sin(2 * Math.PI * freq1 * t) * 0.5 + Math.sin(2 * Math.PI * freq2 * t) * 0.3
    const gentle = Math.sin(t * 2) * 0.2 + 0.8 // ゆっくりとした変化
    return soothing * gentle
  }
  
  // 研究音楽生成
  private generateResearchMusic(t: number): number {
    // 知的で神秘的な雰囲気
    const freq = 440 + Math.sin(t * 0.5) * 50 // 周波数変調
    const mystery = Math.sin(2 * Math.PI * freq * t) * 0.6
    const intellect = Math.sin(2 * Math.PI * 880 * t) * 0.2 // 高音の装飾
    return mystery + intellect
  }
  
  // 育て屋音楽生成
  private generateBreedingMusic(t: number): number {
    // 優しく暖かい、家族的な雰囲気
    const warmth = Math.sin(2 * Math.PI * 293.66 * t) * 0.5 // D4
    const comfort = Math.sin(2 * Math.PI * 369.99 * t) * 0.3 // F#4
    const family = Math.sin(t * 1) * 0.2 + 0.8 // ゆったりとした変化
    return (warmth + comfort) * family
  }
  
  // 朝の音楽生成
  private generateMorningMusic(t: number): number {
    // 爽やかで希望に満ちた
    const dawn = Math.sin(2 * Math.PI * 523.25 * t) * 0.5 // C5
    const hope = Math.sin(2 * Math.PI * 659.25 * t) * 0.3 // E5
    const freshness = Math.sin(t * 4) * 0.3 + 0.7
    return (dawn + hope) * freshness
  }
  
  // 昼の音楽生成
  private generateAfternoonMusic(t: number): number {
    // 活動的で明るい、メインテーマのアップテンポ版
    const active = this.generatePokemonMelody(t) * 1.2
    const energy = Math.sin(t * 6) * 0.2 + 0.8
    return active * energy
  }
  
  // 夕方の音楽生成
  private generateEveningMusic(t: number): number {
    // 落ち着いた、ノスタルジック
    const nostalgia = Math.sin(2 * Math.PI * 349.23 * t) * 0.5 // F4
    const peace = Math.sin(2 * Math.PI * 440.00 * t) * 0.3 // A4
    const sunset = Math.sin(t * 1.5) * 0.3 + 0.7
    return (nostalgia + peace) * sunset
  }
  
  // 夜の音楽生成
  private generateNightMusic(t: number): number {
    // 静かで神秘的
    const mystery = Math.sin(2 * Math.PI * 220.00 * t) * 0.4 // A3
    const tranquil = Math.sin(2 * Math.PI * 329.63 * t) * 0.2 // E4
    const night = Math.sin(t * 0.8) * 0.2 + 0.6
    return (mystery + tranquil) * night
  }
  
  // 春の音楽生成
  private generateSpringMusic(t: number): number {
    // 新緑と希望、生命力
    const growth = Math.sin(2 * Math.PI * 293.66 * t) * 0.5 // D4
    const bloom = Math.sin(2 * Math.PI * 392.00 * t) * 0.3 // G4
    const life = Math.sin(t * 3) * 0.4 + 0.6
    return (growth + bloom) * life
  }
  
  // 夏の音楽生成
  private generateSummerMusic(t: number): number {
    // 元気で活発、エネルギッシュ
    const energy = Math.sin(2 * Math.PI * 440.00 * t) * 0.6 // A4
    const vitality = Math.sin(2 * Math.PI * 587.33 * t) * 0.4 // D5
    const summer = Math.sin(t * 5) * 0.3 + 0.7
    return (energy + vitality) * summer
  }
  
  // 秋の音楽生成
  private generateAutumnMusic(t: number): number {
    // 落ち着いた、収穫の季節
    const harvest = Math.sin(2 * Math.PI * 369.99 * t) * 0.5 // F#4
    const wisdom = Math.sin(2 * Math.PI * 493.88 * t) * 0.3 // B4
    const autumn = Math.sin(t * 2) * 0.3 + 0.7
    return (harvest + wisdom) * autumn
  }
  
  // 冬の音楽生成
  private generateWinterMusic(t: number): number {
    // 静寂と美しさ、澄んだ空気
    const crystal = Math.sin(2 * Math.PI * 523.25 * t) * 0.4 // C5
    const purity = Math.sin(2 * Math.PI * 783.99 * t) * 0.2 // G5
    const winter = Math.sin(t * 1) * 0.2 + 0.6
    return (crystal + purity) * winter
  }
  
  // アチーブメント音楽生成
  private generateAchievementMusic(t: number): number {
    // 勝利と達成感、ファンファーレ風
    const triumph = Math.sin(2 * Math.PI * 659.25 * t) * 0.6 // E5
    const victory = Math.sin(2 * Math.PI * 783.99 * t) * 0.4 // G5
    const celebration = Math.sin(t * 6) * 0.4 + 0.6
    return (triumph + victory) * celebration
  }
  
  // ダッシュボード音楽生成
  private generateDashboardMusic(t: number): number {
    // メインテーマのバリエーション、情報整理に適した
    const melody = this.generatePokemonMelody(t) * 0.8
    const organization = Math.sin(t * 3) * 0.2 + 0.8
    const focus = Math.sin(2 * Math.PI * 174.61 * t) * 0.2 // F3 ベース
    return (melody + focus) * organization
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
      // メインBGM
      {
        id: 'bgm_main',
        name: 'トキワシティ訓練所テーマ',
        type: 'bgm',
        loop: true,
        volume: 0.35
      },
      {
        id: 'bgm_dashboard',
        name: 'ダッシュボードテーマ',
        type: 'bgm',
        loop: true,
        volume: 0.3
      },
      {
        id: 'bgm_pokemon_center',
        name: 'ポケモンセンターテーマ',
        type: 'bgm',
        loop: true,
        volume: 0.28
      },
      
      // 活動別BGM
      {
        id: 'bgm_expedition',
        name: '派遣冒険テーマ',
        type: 'bgm',
        loop: true,
        volume: 0.25
      },
      {
        id: 'bgm_training',
        name: 'トレーニングテーマ',
        type: 'bgm',
        loop: true,
        volume: 0.32
      },
      {
        id: 'bgm_breeding',
        name: '育て屋テーマ',
        type: 'bgm',
        loop: true,
        volume: 0.28
      },
      {
        id: 'bgm_research',
        name: '研究所テーマ',
        type: 'bgm',
        loop: true,
        volume: 0.3
      },
      
      // 時間帯別BGM
      {
        id: 'bgm_morning',
        name: '朝のテーマ',
        type: 'bgm',
        loop: true,
        volume: 0.32
      },
      {
        id: 'bgm_afternoon',
        name: '昼のテーマ',
        type: 'bgm',
        loop: true,
        volume: 0.35
      },
      {
        id: 'bgm_evening',
        name: '夕方のテーマ',
        type: 'bgm',
        loop: true,
        volume: 0.28
      },
      {
        id: 'bgm_night',
        name: '夜のテーマ',
        type: 'bgm',
        loop: true,
        volume: 0.25
      },
      
      // 特別なシチュエーション
      {
        id: 'bgm_achievement',
        name: 'アチーブメントテーマ',
        type: 'bgm',
        loop: true,
        volume: 0.4
      },
      {
        id: 'bgm_seasonal_spring',
        name: '春のテーマ',
        type: 'bgm',
        loop: true,
        volume: 0.33
      },
      {
        id: 'bgm_seasonal_summer',
        name: '夏のテーマ',
        type: 'bgm',
        loop: true,
        volume: 0.35
      },
      {
        id: 'bgm_seasonal_autumn',
        name: '秋のテーマ',
        type: 'bgm',
        loop: true,
        volume: 0.3
      },
      {
        id: 'bgm_seasonal_winter',
        name: '冬のテーマ',
        type: 'bgm',
        loop: true,
        volume: 0.28
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