/**
 * 派遣システムのリアルタイム進行エンジン
 * 派遣の自動進行、イベント生成、プレイヤー介入を管理
 */

import type { Expedition, ExpeditionEvent, Trainer, Pokemon, Intervention, Item } from '@/lib/game-state/types'
import { realtimeManager } from '@/lib/real-time/RealtimeManager'
import { performanceMonitor, memoize, throttle } from '@/lib/performance/PerformanceOptimizer'

export interface ExpeditionProgress {
  expeditionId: string
  currentStage: 'preparation' | 'early' | 'middle' | 'late' | 'completion'
  stageProgress: number // 0.0 to 1.0 within current stage
  overallProgress: number // 0.0 to 1.0 total
  nextEventTime?: number // timestamp
  estimatedEndTime: number // timestamp
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

export interface ExpeditionOutcome {
  success: boolean
  pokemonCaught: Pokemon[]
  itemsFound: Item[]
  moneyEarned: number
  experienceGained: number
  trainerExpGained: number
  summary: string
  events: ExpeditionEvent[]
}

/**
 * 派遣エンジン - リアルタイム進行管理
 */
export class ExpeditionEngine {
  private static instance: ExpeditionEngine
  private activeExpeditions = new Map<string, ExpeditionProgress>()
  private progressTimers = new Map<string, NodeJS.Timeout>()
  private eventQueue = new Map<string, ExpeditionEvent[]>()
  private lastUpdate = Date.now()
  
  private constructor() {
    this.startProgressLoop()
  }
  
  static getInstance(): ExpeditionEngine {
    if (!ExpeditionEngine.instance) {
      ExpeditionEngine.instance = new ExpeditionEngine()
    }
    return ExpeditionEngine.instance
  }
  
  /**
   * 派遣を開始
   */
  startExpedition(expedition: Expedition, trainer: Trainer): ExpeditionProgress {
    const progress: ExpeditionProgress = {
      expeditionId: expedition.id,
      currentStage: 'preparation',
      stageProgress: 0,
      overallProgress: 0,
      estimatedEndTime: new Date(expedition.estimatedEndTime).getTime(),
      riskLevel: this.calculateInitialRisk(expedition, trainer)
    }
    
    this.activeExpeditions.set(expedition.id, progress)
    this.eventQueue.set(expedition.id, [])
    
    // 最初のイベント時間を設定
    progress.nextEventTime = Date.now() + this.calculateNextEventDelay(expedition, trainer, 'preparation')
    
    console.log(`📊 派遣開始: ${trainer.name} → ${expedition.locationId} (${expedition.targetDuration}時間)`)
    
    // リアルタイム通知
    realtimeManager.emitDataChange({
      category: 'expeditions',
      action: 'update',
      entityId: expedition.id,
      data: { status: 'active', currentProgress: 0 },
      source: 'system_update'
    })
    
    return progress
  }
  
  /**
   * 派遣を停止/リコール
   */
  stopExpedition(expeditionId: string, reason: 'recall' | 'complete' | 'failed' = 'recall'): void {
    this.activeExpeditions.delete(expeditionId)
    this.eventQueue.delete(expeditionId)
    
    const timer = this.progressTimers.get(expeditionId)
    if (timer) {
      clearTimeout(timer)
      this.progressTimers.delete(expeditionId)
    }
    
    console.log(`⏹️ 派遣停止: ${expeditionId} (${reason})`)
    
    realtimeManager.emitDataChange({
      category: 'expeditions',
      action: 'update',
      entityId: expeditionId,
      data: { status: reason === 'recall' ? 'recalled' : reason === 'complete' ? 'completed' : 'failed' },
      source: 'system_update'
    })
  }
  
  /**
   * 派遣の進行状況を取得
   */
  getProgress(expeditionId: string): ExpeditionProgress | null {
    return this.activeExpeditions.get(expeditionId) || null
  }
  
  /**
   * 全ての進行中派遣を取得
   */
  getAllProgress(): ExpeditionProgress[] {
    return Array.from(this.activeExpeditions.values())
  }
  
  /**
   * 進行ループの開始
   */
  private startProgressLoop(): void {
    const updateInterval = 1000 // 1秒間隔
    
    const progressLoop = throttle(() => {
      const now = Date.now()
      const deltaTime = now - this.lastUpdate
      this.lastUpdate = now
      
      performanceMonitor.measure('expedition_progress_update', () => {
        this.updateAllProgress(deltaTime)
      })
      
      setTimeout(progressLoop, updateInterval)
    }, 500) // 最大0.5秒間隔
    
    progressLoop()
  }
  
  /**
   * 全派遣の進行状況を更新
   */
  private updateAllProgress(deltaTime: number): void {
    this.activeExpeditions.forEach((progress, expeditionId) => {
      this.updateExpeditionProgress(expeditionId, progress, deltaTime)
    })
  }
  
  /**
   * 個別派遣の進行状況を更新
   */
  private updateExpeditionProgress(expeditionId: string, progress: ExpeditionProgress, deltaTime: number): void {
    const now = Date.now()
    const totalDuration = progress.estimatedEndTime - (now - deltaTime)
    const elapsed = now - (progress.estimatedEndTime - totalDuration)
    
    // 全体進行率を計算
    const newOverallProgress = Math.min(elapsed / totalDuration, 1.0)
    const progressDelta = newOverallProgress - progress.overallProgress
    
    if (progressDelta > 0.001) { // 0.1%以上の変化があった場合のみ更新
      progress.overallProgress = newOverallProgress
      
      // ステージの判定
      const newStage = this.determineStage(newOverallProgress)
      if (newStage !== progress.currentStage) {
        progress.currentStage = newStage
        progress.stageProgress = 0
        console.log(`🎯 派遣ステージ変更: ${expeditionId} → ${newStage}`)
      }
      
      // ステージ内進行率を更新
      progress.stageProgress = this.calculateStageProgress(newOverallProgress, newStage)
      
      // リスクレベルの再評価
      progress.riskLevel = this.calculateCurrentRisk(progress)
      
      // イベント発生チェック
      if (progress.nextEventTime && now >= progress.nextEventTime) {
        this.processScheduledEvent(expeditionId, progress)
      }
      
      // 完了チェック
      if (newOverallProgress >= 1.0) {
        this.completeExpedition(expeditionId)
        return
      }
      
      // リアルタイム更新通知
      realtimeManager.emitDataChange({
        category: 'expeditions',
        action: 'update',
        entityId: expeditionId,
        source: 'system_update',
        data: { 
          currentProgress: progress.overallProgress,
          stage: progress.currentStage,
          riskLevel: progress.riskLevel
        }
      })
    }
  }
  
  /**
   * 進行率からステージを判定
   */
  private determineStage(progress: number): ExpeditionProgress['currentStage'] {
    if (progress < 0.1) return 'preparation'
    if (progress < 0.3) return 'early'
    if (progress < 0.7) return 'middle'
    if (progress < 0.95) return 'late'
    return 'completion'
  }
  
  /**
   * ステージ内進行率を計算
   */
  private calculateStageProgress(overallProgress: number, stage: ExpeditionProgress['currentStage']): number {
    switch (stage) {
      case 'preparation':
        return overallProgress / 0.1
      case 'early':
        return (overallProgress - 0.1) / 0.2
      case 'middle':
        return (overallProgress - 0.3) / 0.4
      case 'late':
        return (overallProgress - 0.7) / 0.25
      case 'completion':
        return (overallProgress - 0.95) / 0.05
      default:
        return 0
    }
  }
  
  /**
   * 初期リスクレベルを計算
   */
  private calculateInitialRisk(expedition: Expedition, trainer: Trainer): ExpeditionProgress['riskLevel'] {
    const locationRisk = this.getLocationRiskLevel(expedition.locationId)
    const trainerExperience = trainer.level + (trainer.totalExpeditions / 10)
    const modeRisk = this.getModeRiskMultiplier(expedition.mode)
    
    const baseRisk = locationRisk * modeRisk
    const experienceReduction = Math.min(trainerExperience * 0.1, 0.5)
    const finalRisk = baseRisk - experienceReduction
    
    if (finalRisk < 0.3) return 'low'
    if (finalRisk < 0.6) return 'medium'
    if (finalRisk < 0.8) return 'high'
    return 'critical'
  }
  
  /**
   * 現在のリスクレベルを計算
   */
  private calculateCurrentRisk(progress: ExpeditionProgress): ExpeditionProgress['riskLevel'] {
    let baseRisk = 0.4 // ベースリスク
    
    // ステージによるリスク変動
    switch (progress.currentStage) {
      case 'preparation':
        baseRisk *= 0.3
        break
      case 'early':
        baseRisk *= 0.7
        break
      case 'middle':
        baseRisk *= 1.2
        break
      case 'late':
        baseRisk *= 1.5
        break
      case 'completion':
        baseRisk *= 0.8
        break
    }
    
    // 進行率による変動
    baseRisk += Math.sin(progress.overallProgress * Math.PI) * 0.3
    
    if (baseRisk < 0.3) return 'low'
    if (baseRisk < 0.6) return 'medium'
    if (baseRisk < 0.8) return 'high'
    return 'critical'
  }
  
  /**
   * 次のイベント発生までの遅延時間を計算
   */
  private calculateNextEventDelay(expedition: Expedition, trainer: Trainer, stage: string): number {
    const baseDelay = 30000 // 30秒
    const stageMultiplier = this.getStageEventMultiplier(stage)
    const randomFactor = 0.5 + Math.random()
    
    return baseDelay * stageMultiplier * randomFactor
  }
  
  /**
   * ステージごとのイベント発生頻度倍率
   */
  private getStageEventMultiplier(stage: string): number {
    switch (stage) {
      case 'preparation': return 3.0
      case 'early': return 2.0
      case 'middle': return 1.0
      case 'late': return 1.5
      case 'completion': return 2.5
      default: return 1.0
    }
  }
  
  /**
   * スケジュールされたイベントを処理
   */
  private processScheduledEvent(expeditionId: string, progress: ExpeditionProgress): void {
    const event = this.generateEvent(expeditionId, progress)
    if (event) {
      const eventQueue = this.eventQueue.get(expeditionId) || []
      eventQueue.push(event)
      this.eventQueue.set(expeditionId, eventQueue)
      
      console.log(`🎲 イベント発生: ${event.type} - ${event.message}`)
      
      // リアルタイム通知
      realtimeManager.emitDataChange({
        category: 'expeditions',
        action: 'update',
        entityId: expeditionId,
        source: 'system_update',
        data: event
      })
    }
    
    // 次のイベント時間を設定
    progress.nextEventTime = Date.now() + this.calculateNextEventDelay({} as Expedition, {} as Trainer, progress.currentStage)
  }
  
  /**
   * イベントを生成
   */
  private generateEvent(expeditionId: string, progress: ExpeditionProgress): ExpeditionEvent | null {
    const eventTypes: ExpeditionEvent['type'][] = ['pokemon_encounter', 'item_discovery', 'danger', 'weather', 'trainer_encounter']
    const weightedTypes = this.getWeightedEventTypes(progress.currentStage, progress.riskLevel)
    
    const selectedType = this.selectRandomWeighted(weightedTypes)
    if (!selectedType) return null
    
    return {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: selectedType,
      message: this.generateEventMessage(selectedType, progress.currentStage),
      timestamp: new Date().toISOString(),
      resolved: false,
      choices: this.generateEventChoices(selectedType, progress.riskLevel)
    }
  }
  
  /**
   * ステージとリスクに基づいた重み付きイベントタイプを取得
   */
  private getWeightedEventTypes(stage: string, riskLevel: string): Array<{type: ExpeditionEvent['type'], weight: number}> {
    const weights = {
      preparation: { pokemon_encounter: 1, item_discovery: 2, danger: 1, weather: 3, trainer_encounter: 1 },
      early: { pokemon_encounter: 3, item_discovery: 2, danger: 2, weather: 2, trainer_encounter: 1 },
      middle: { pokemon_encounter: 4, item_discovery: 3, danger: 3, weather: 1, trainer_encounter: 2 },
      late: { pokemon_encounter: 5, item_discovery: 2, danger: 4, weather: 1, trainer_encounter: 3 },
      completion: { pokemon_encounter: 2, item_discovery: 4, danger: 2, weather: 1, trainer_encounter: 2 }
    }
    
    const riskMultiplier = {
      low: { danger: 0.5 },
      medium: { danger: 1.0 },
      high: { danger: 1.5 },
      critical: { danger: 2.0 }
    }
    
    const stageWeights = weights[stage as keyof typeof weights] || weights.middle
    const riskMod = riskMultiplier[riskLevel as keyof typeof riskMultiplier] || riskMultiplier.medium
    
    return Object.entries(stageWeights).map(([type, weight]) => ({
      type: type as ExpeditionEvent['type'],
      weight: weight * (riskMod[type as keyof typeof riskMod] || 1)
    }))
  }
  
  /**
   * 重み付きランダム選択
   */
  private selectRandomWeighted<T>(items: Array<{type: T, weight: number}>): T | null {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
    if (totalWeight === 0) return null
    
    let random = Math.random() * totalWeight
    for (const item of items) {
      random -= item.weight
      if (random <= 0) return item.type
    }
    
    return items[0]?.type || null
  }
  
  /**
   * イベントメッセージを生成
   */
  private generateEventMessage(type: ExpeditionEvent['type'], stage: string): string {
    const messages = {
      pokemon_encounter: [
        '野生のポケモンが現れました！',
        '珍しいポケモンの気配を感じます...',
        'ポケモンの鳴き声が聞こえてきます',
        '草むらが動いています'
      ],
      item_discovery: [
        '地面に何か光るものが落ちています',
        '木の根元に隠されたアイテムを発見！',
        '古い宝箱を見つけました',
        '珍しい石を発見しました'
      ],
      danger: [
        '危険な野生ポケモンの縄張りに入ってしまいました',
        '足場が不安定になっています',
        '急に天候が悪化してきました',
        '迷子になってしまいそうです'
      ],
      weather: [
        '天候が変化しています',
        '霧が濃くなってきました',
        '風が強くなってきました',
        '雨が降り始めました'
      ],
      trainer_encounter: [
        '他のトレーナーと遭遇しました',
        'ベテラントレーナーが話しかけてきました',
        '地元の人が道案内を申し出ています',
        '旅の商人と出会いました'
      ]
    }
    
    const typeMessages = messages[type] || messages.pokemon_encounter
    return typeMessages[Math.floor(Math.random() * typeMessages.length)]
  }
  
  /**
   * イベントの選択肢を生成
   */
  private generateEventChoices(type: ExpeditionEvent['type'], riskLevel: string): ExpeditionEvent['choices'] {
    // 基本的な選択肢テンプレート
    const choiceTemplates = {
      pokemon_encounter: [
        { text: '積極的に捕まえる', effect: 'capture_attempt', successRate: 0.7, risk: 'medium' },
        { text: '慎重に観察する', effect: 'observe', successRate: 0.9, risk: 'low' },
        { text: '無視して通り過ぎる', effect: 'ignore', successRate: 1.0, risk: 'none' }
      ],
      item_discovery: [
        { text: 'すぐに回収する', effect: 'collect', successRate: 0.8, risk: 'low' },
        { text: '周囲を確認してから回収', effect: 'careful_collect', successRate: 0.95, risk: 'none' },
        { text: '危険そうなので無視', effect: 'ignore', successRate: 1.0, risk: 'none' }
      ],
      danger: [
        { text: '慎重に回避する', effect: 'avoid', successRate: 0.8, risk: 'low' },
        { text: '引き返す', effect: 'retreat', successRate: 0.95, risk: 'none' },
        { text: '強行突破', effect: 'force_through', successRate: 0.4, risk: 'high' }
      ],
      weather: [
        { text: '天候の変化を待つ', effect: 'wait', successRate: 0.9, risk: 'low' },
        { text: 'そのまま進む', effect: 'continue', successRate: 0.7, risk: 'medium' },
        { text: '避難場所を探す', effect: 'shelter', successRate: 0.85, risk: 'low' }
      ],
      trainer_encounter: [
        { text: '情報交換する', effect: 'trade_info', successRate: 0.8, risk: 'low' },
        { text: 'バトルを挑む', effect: 'battle', successRate: 0.6, risk: 'medium' },
        { text: '挨拶だけして立ち去る', effect: 'polite_leave', successRate: 1.0, risk: 'none' }
      ]
    }
    
    const templates = choiceTemplates[type] || choiceTemplates.pokemon_encounter
    
    return templates.map((template, index) => ({
      id: `choice_${index}`,
      text: template.text,
      effect: template.effect,
      successRate: this.adjustSuccessRate(template.successRate, riskLevel),
      requirements: []
    }))
  }
  
  /**
   * リスクレベルに基づいて成功率を調整
   */
  private adjustSuccessRate(baseRate: number, riskLevel: string): number {
    const adjustments = {
      low: 1.1,
      medium: 1.0,
      high: 0.9,
      critical: 0.8
    }
    
    const adjustment = adjustments[riskLevel as keyof typeof adjustments] || 1.0
    return Math.min(Math.max(baseRate * adjustment, 0.1), 0.95)
  }
  
  /**
   * 派遣を完了
   */
  private completeExpedition(expeditionId: string): void {
    const progress = this.activeExpeditions.get(expeditionId)
    if (!progress) return
    
    console.log(`✅ 派遣完了: ${expeditionId}`)
    
    // 結果を生成
    const outcome = this.generateExpeditionOutcome(expeditionId, progress)
    
    // 派遣を停止
    this.stopExpedition(expeditionId, 'complete')
    
    // 完了通知
    realtimeManager.emitDataChange({
      category: 'expeditions',
      action: 'update',
      entityId: expeditionId,
      source: 'system_update',
      data: outcome
    })
  }
  
  /**
   * 派遣結果を生成
   */
  private generateExpeditionOutcome(expeditionId: string, progress: ExpeditionProgress): ExpeditionOutcome {
    const events = this.eventQueue.get(expeditionId) || []
    const success = progress.overallProgress >= 0.95 && progress.riskLevel !== 'critical'
    
    return {
      success,
      pokemonCaught: [], // 実装予定
      itemsFound: [], // 実装予定
      moneyEarned: success ? Math.floor(Math.random() * 5000) + 1000 : 0,
      experienceGained: Math.floor(progress.overallProgress * 100),
      trainerExpGained: Math.floor(progress.overallProgress * 50),
      summary: success ? '派遣が成功しました！' : '派遣は困難でしたが、経験を積むことができました。',
      events
    }
  }
  
  /**
   * ロケーションのリスクレベルを取得
   */
  private getLocationRiskLevel(locationId: number): number {
    const riskMap: Record<number, number> = {
      1: 0.3, // 初心者の森
      2: 0.5, // 草原
      3: 0.7, // 山岳地帯
      4: 0.8, // 洞窟
      5: 0.9  // 危険地域
    }
    
    return riskMap[locationId] || 0.5
  }
  
  /**
   * モードのリスク倍率を取得
   */
  private getModeRiskMultiplier(mode: Expedition['mode']): number {
    const multipliers = {
      safe: 0.7,
      balanced: 1.0,
      exploration: 1.2,
      aggressive: 1.5
    }
    
    return multipliers[mode] || 1.0
  }
  
  /**
   * リソースを解放
   */
  destroy(): void {
    this.progressTimers.forEach(timer => {
      clearTimeout(timer)
    })
    
    this.activeExpeditions.clear()
    this.progressTimers.clear()
    this.eventQueue.clear()
    
    console.log('🗑️ 派遣エンジンを破棄しました')
  }
}

// シングルトンインスタンス
export const expeditionEngine = ExpeditionEngine.getInstance()