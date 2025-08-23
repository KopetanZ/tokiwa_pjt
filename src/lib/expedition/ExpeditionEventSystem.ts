/**
 * 派遣イベント生成・処理システム
 * 動的なイベント生成、選択肢処理、結果計算を管理
 */

import type { Expedition, ExpeditionEvent, Trainer, Pokemon, Intervention } from '@/lib/game-state/types'
import { realtimeManager } from '@/lib/real-time/RealtimeManager'
import { memoize, LRUCache } from '@/lib/performance/PerformanceOptimizer'

export interface EventTemplate {
  id: string
  type: ExpeditionEvent['type']
  name: string
  description: string
  conditions: EventCondition[]
  baseMessage: string
  messageVariants: string[]
  choices: ChoiceTemplate[]
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
  locationRestrictions?: number[]
  stageRestrictions?: string[]
  cooldown?: number // minutes
}

export interface EventCondition {
  type: 'stage' | 'location' | 'trainer_skill' | 'risk_level' | 'weather' | 'time_of_day'
  operator: 'eq' | 'gt' | 'lt' | 'in' | 'not_in'
  value: any
  weight: number // 0.0 to 1.0 - how much this condition affects event probability
}

export interface ChoiceTemplate {
  id: string
  text: string
  description?: string
  effect: ChoiceEffect
  requirements: ChoiceRequirement[]
  baseSuccessRate: number
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'extreme'
  cooldown?: number // minutes before same choice can be used again
}

export interface ChoiceEffect {
  type: 'pokemon_capture' | 'item_gain' | 'experience' | 'money' | 'status_change' | 'progress_modifier'
  parameters: Record<string, any>
  consequences?: ChoiceEffect[] // follow-up effects
}

export interface ChoiceRequirement {
  type: 'trainer_skill' | 'trainer_level' | 'item_possession' | 'risk_tolerance'
  skill?: keyof Trainer['skills']
  value: number
  optional?: boolean // if true, requirement boosts success rate but isn't mandatory
}

export interface EventResolution {
  eventId: string
  choiceId: string
  success: boolean
  result: {
    pokemonCaught?: Pokemon[]
    itemsGained?: any[]
    experienceGained: number
    moneyGained: number
    statusEffects?: string[]
    progressModifier: number // -1.0 to 1.0
    message: string
  }
  consequences: EventResolution[]
}

/**
 * 派遣イベントシステム
 */
export class ExpeditionEventSystem {
  private static instance: ExpeditionEventSystem
  private eventTemplates = new Map<string, EventTemplate>()
  private eventHistory = new LRUCache<ExpeditionEvent[]>(100) // 最近のイベント履歴
  private choiceCooldowns = new Map<string, number>() // choice_id -> last_used_timestamp
  private eventCooldowns = new Map<string, number>() // event_id -> last_used_timestamp
  
  private constructor() {
    this.initializeEventTemplates()
  }
  
  static getInstance(): ExpeditionEventSystem {
    if (!ExpeditionEventSystem.instance) {
      ExpeditionEventSystem.instance = new ExpeditionEventSystem()
    }
    return ExpeditionEventSystem.instance
  }
  
  /**
   * イベントを生成
   */
  generateEvent(
    expeditionId: string,
    expedition: Expedition,
    trainer: Trainer,
    currentStage: string,
    riskLevel: string
  ): ExpeditionEvent | null {
    const context = {
      expeditionId,
      locationId: expedition.locationId,
      stage: currentStage,
      riskLevel,
      trainer,
      timeOfDay: this.getCurrentTimeOfDay()
    }
    
    // 利用可能なイベントテンプレートを取得
    const availableTemplates = this.getAvailableEventTemplates(context)
    if (availableTemplates.length === 0) return null
    
    // 重み付きランダム選択でイベントテンプレートを選択
    const selectedTemplate = this.selectEventTemplate(availableTemplates, context)
    if (!selectedTemplate) return null
    
    // イベントを生成
    const event = this.createEventFromTemplate(selectedTemplate, context)
    
    // 履歴に追加
    const history = this.eventHistory.get(expeditionId) || []
    history.push(event)
    this.eventHistory.set(expeditionId, history)
    
    // クールダウンを設定
    if (selectedTemplate.cooldown) {
      this.eventCooldowns.set(selectedTemplate.id, Date.now())
    }
    
    console.log(`🎲 イベント生成: ${selectedTemplate.name} (${selectedTemplate.rarity})`)
    
    return event
  }
  
  /**
   * プレイヤーの選択を処理
   */
  async processChoice(
    expeditionId: string,
    eventId: string,
    choiceId: string,
    trainer: Trainer
  ): Promise<EventResolution> {
    const history = this.eventHistory.get(expeditionId) || []
    const event = history.find(e => e.id === eventId)
    
    if (!event || !event.choices) {
      throw new Error(`Event not found or has no choices: ${eventId}`)
    }
    
    const choice = event.choices.find(c => c.id === choiceId)
    if (!choice) {
      throw new Error(`Choice not found: ${choiceId}`)
    }
    
    // 選択の実行可能性をチェック
    const template = this.findChoiceTemplate(event.type, choiceId)
    if (!template) {
      throw new Error(`Choice template not found: ${choiceId}`)
    }
    
    // 要件チェック
    const requirementsMet = this.checkRequirements(template.requirements, trainer)
    
    // 成功率計算
    const successRate = this.calculateSuccessRate(template, trainer, requirementsMet)
    const success = Math.random() < successRate
    
    // 結果を生成
    const resolution = await this.generateResolution(
      eventId,
      choiceId,
      template,
      trainer,
      success,
      requirementsMet
    )
    
    // イベントを解決済みに設定
    event.resolved = true
    event.chosenAction = choiceId
    event.result = resolution.result.message
    
    // クールダウンを設定
    if (template.cooldown) {
      this.choiceCooldowns.set(`${trainer.id}_${choiceId}`, Date.now())
    }
    
    console.log(`⚡ 選択処理: ${choice.text} → ${success ? '成功' : '失敗'}`)
    
    // リアルタイム通知
    realtimeManager.emitDataChange({
      category: 'expeditions',
      action: 'update',
      entityId: expeditionId,
      source: 'user_action',
      data: { eventId, choiceId, resolution }
    })
    
    return resolution
  }
  
  /**
   * 利用可能なイベントテンプレートを取得
   */
  private getAvailableEventTemplates(context: any): EventTemplate[] {
    const now = Date.now()
    const available: EventTemplate[] = []
    
    this.eventTemplates.forEach(template => {
      // クールダウンチェック
      if (template.cooldown) {
        const lastUsed = this.eventCooldowns.get(template.id) || 0
        if (now - lastUsed < template.cooldown * 60 * 1000) {
          return
        }
      }
      
      // 制限チェック
      if (template.locationRestrictions && !template.locationRestrictions.includes(context.locationId)) {
        return
      }
      
      if (template.stageRestrictions && !template.stageRestrictions.includes(context.stage)) {
        return
      }
      
      // 条件チェック
      if (this.checkEventConditions(template.conditions, context)) {
        available.push(template)
      }
    })
    
    return available
  }
  
  /**
   * イベント条件をチェック
   */
  private checkEventConditions(conditions: EventCondition[], context: any): boolean {
    if (conditions.length === 0) return true
    
    let totalWeight = 0
    let metWeight = 0
    
    for (const condition of conditions) {
      totalWeight += condition.weight
      
      if (this.evaluateCondition(condition, context)) {
        metWeight += condition.weight
      }
    }
    
    // 重み付き条件の50%以上が満たされればOK
    return totalWeight === 0 || (metWeight / totalWeight) >= 0.5
  }
  
  /**
   * 条件を評価
   */
  private evaluateCondition(condition: EventCondition, context: any): boolean {
    const getValue = (type: string) => {
      switch (type) {
        case 'stage': return context.stage
        case 'location': return context.locationId
        case 'risk_level': return context.riskLevel
        case 'trainer_skill': return context.trainer.skills
        case 'weather': return 'clear' // 実装予定
        case 'time_of_day': return context.timeOfDay
        default: return null
      }
    }
    
    const contextValue = getValue(condition.type)
    if (contextValue === null) return false
    
    switch (condition.operator) {
      case 'eq':
        return contextValue === condition.value
      case 'gt':
        return contextValue > condition.value
      case 'lt':
        return contextValue < condition.value
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(contextValue)
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(contextValue)
      default:
        return false
    }
  }
  
  /**
   * 重み付きランダム選択でイベントテンプレートを選択
   */
  private selectEventTemplate(templates: EventTemplate[], context: any): EventTemplate | null {
    const rarityWeights = {
      common: 1.0,
      uncommon: 0.3,
      rare: 0.1,
      legendary: 0.02
    }
    
    const weightedTemplates = templates.map(template => ({
      template,
      weight: rarityWeights[template.rarity] || 0.5
    }))
    
    const totalWeight = weightedTemplates.reduce((sum, item) => sum + item.weight, 0)
    if (totalWeight === 0) return null
    
    let random = Math.random() * totalWeight
    for (const item of weightedTemplates) {
      random -= item.weight
      if (random <= 0) return item.template
    }
    
    return templates[0] || null
  }
  
  /**
   * テンプレートからイベントを作成
   */
  private createEventFromTemplate(template: EventTemplate, context: any): ExpeditionEvent {
    // メッセージのバリエーションを選択
    const messages = [template.baseMessage, ...template.messageVariants]
    const message = messages[Math.floor(Math.random() * messages.length)]
    
    // 選択肢を生成
    const choices = template.choices.map(choiceTemplate => ({
      id: choiceTemplate.id,
      text: choiceTemplate.text,
      effect: JSON.stringify(choiceTemplate.effect),
      successRate: this.adjustSuccessRateForContext(choiceTemplate.baseSuccessRate, context),
      requirements: choiceTemplate.requirements.map(req => 
        `${req.type}:${req.skill || ''}:${req.value}`
      )
    }))
    
    return {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: template.type,
      message,
      timestamp: new Date().toISOString(),
      choices,
      resolved: false
    }
  }
  
  /**
   * コンテキストに基づいて成功率を調整
   */
  private adjustSuccessRateForContext(baseRate: number, context: any): number {
    let adjustedRate = baseRate
    
    // リスクレベルによる調整
    const riskAdjustments = {
      low: 1.1,
      medium: 1.0,
      high: 0.9,
      critical: 0.8
    }
    
    adjustedRate *= riskAdjustments[context.riskLevel as keyof typeof riskAdjustments] || 1.0
    
    // ステージによる調整
    const stageAdjustments = {
      preparation: 1.05,
      early: 1.0,
      middle: 0.95,
      late: 0.9,
      completion: 1.0
    }
    
    adjustedRate *= stageAdjustments[context.stage as keyof typeof stageAdjustments] || 1.0
    
    return Math.min(Math.max(adjustedRate, 0.05), 0.95)
  }
  
  /**
   * 選択肢テンプレートを検索
   */
  private findChoiceTemplate(eventType: ExpeditionEvent['type'], choiceId: string): ChoiceTemplate | null {
    let result: ChoiceTemplate | null = null
    this.eventTemplates.forEach(template => {
      if (template.type === eventType) {
        const choice = template.choices.find(c => c.id === choiceId)
        if (choice) result = choice
      }
    })
    return result
  }
  
  /**
   * 要件をチェック
   */
  private checkRequirements(requirements: ChoiceRequirement[], trainer: Trainer): {met: boolean, optional: number} {
    let mandatoryMet = true
    let optionalCount = 0
    
    for (const req of requirements) {
      const met = this.evaluateRequirement(req, trainer)
      
      if (req.optional) {
        if (met) optionalCount++
      } else {
        if (!met) mandatoryMet = false
      }
    }
    
    return { met: mandatoryMet, optional: optionalCount }
  }
  
  /**
   * 要件を評価
   */
  private evaluateRequirement(requirement: ChoiceRequirement, trainer: Trainer): boolean {
    switch (requirement.type) {
      case 'trainer_skill':
        if (requirement.skill && trainer.skills[requirement.skill] !== undefined) {
          return trainer.skills[requirement.skill] >= requirement.value
        }
        return false
        
      case 'trainer_level':
        return trainer.level >= requirement.value
        
      case 'item_possession':
        // TODO: アイテム所持チェックの実装
        return true
        
      case 'risk_tolerance':
        // トレーナーの性格からリスク耐性を計算
        const riskTolerance = (trainer.personality.courage - trainer.personality.caution + 10) / 2
        return riskTolerance >= requirement.value
        
      default:
        return false
    }
  }
  
  /**
   * 成功率を計算
   */
  private calculateSuccessRate(
    template: ChoiceTemplate,
    trainer: Trainer,
    requirementResult: {met: boolean, optional: number}
  ): number {
    if (!requirementResult.met) return 0
    
    let successRate = template.baseSuccessRate
    
    // オプション要件によるボーナス
    successRate += requirementResult.optional * 0.1
    
    // トレーナーのスキルレベルによるボーナス
    const relevantSkills = this.getRelevantSkills(template.effect.type)
    for (const skill of relevantSkills) {
      const skillLevel = trainer.skills[skill] || 0
      successRate += skillLevel * 0.02 // スキルレベル1につき2%ボーナス
    }
    
    // 経験値によるボーナス
    const experienceBonus = Math.min(trainer.totalExpeditions * 0.01, 0.2) // 最大20%
    successRate += experienceBonus
    
    return Math.min(Math.max(successRate, 0.05), 0.95)
  }
  
  /**
   * 効果タイプに関連するスキルを取得
   */
  private getRelevantSkills(effectType: string): Array<keyof Trainer['skills']> {
    const skillMap: Record<string, Array<keyof Trainer['skills']>> = {
      pokemon_capture: ['capture', 'exploration'],
      item_gain: ['exploration', 'research'],
      experience: ['research'],
      money: ['exploration', 'battle'],
      status_change: ['healing'],
      progress_modifier: ['exploration']
    }
    
    return skillMap[effectType] || ['exploration']
  }
  
  /**
   * 結果を生成
   */
  private async generateResolution(
    eventId: string,
    choiceId: string,
    template: ChoiceTemplate,
    trainer: Trainer,
    success: boolean,
    requirementResult: {met: boolean, optional: number}
  ): Promise<EventResolution> {
    const baseEffect = template.effect
    const resolution: EventResolution = {
      eventId,
      choiceId,
      success,
      result: {
        experienceGained: 0,
        moneyGained: 0,
        progressModifier: 0,
        message: ''
      },
      consequences: []
    }
    
    if (success) {
      // 成功時の効果を適用
      switch (baseEffect.type) {
        case 'pokemon_capture':
          resolution.result.pokemonCaught = [] // TODO: ポケモン生成
          resolution.result.experienceGained = baseEffect.parameters.experience || 50
          resolution.result.message = 'ポケモンの捕獲に成功しました！'
          break
          
        case 'item_gain':
          resolution.result.itemsGained = [] // TODO: アイテム生成
          resolution.result.experienceGained = baseEffect.parameters.experience || 20
          resolution.result.message = 'アイテムを発見しました！'
          break
          
        case 'money':
          resolution.result.moneyGained = baseEffect.parameters.amount || 100
          resolution.result.message = 'お金を見つけました！'
          break
          
        case 'progress_modifier':
          resolution.result.progressModifier = baseEffect.parameters.modifier || 0.1
          resolution.result.experienceGained = 30
          resolution.result.message = '順調に進んでいます'
          break
          
        default:
          resolution.result.experienceGained = 25
          resolution.result.message = '何かいいことがありました'
      }
      
      // オプション要件ボーナス
      if (requirementResult.optional > 0) {
        resolution.result.experienceGained += requirementResult.optional * 10
        resolution.result.moneyGained += requirementResult.optional * 50
      }
    } else {
      // 失敗時の効果
      resolution.result.experienceGained = 5 // 失敗からも少し学習
      resolution.result.progressModifier = -0.05 // わずかな遅延
      resolution.result.message = this.generateFailureMessage(template.riskLevel)
    }
    
    return resolution
  }
  
  /**
   * 失敗メッセージを生成
   */
  private generateFailureMessage(riskLevel: string): string {
    const messages = {
      none: ['特に問題はありませんでした'],
      low: ['少し時間がかかりましたが問題ありません', '慎重に進んで時間をロスしました'],
      medium: ['思うようにいきませんでした', '予想以上に困難でした', '少し苦戦しています'],
      high: ['危険な状況でした', '大きな困難に直面しました', '危うく大変なことになるところでした'],
      extreme: ['非常に危険な状況を切り抜けました', '命に関わる危険でした', '奇跡的に助かりました']
    }
    
    const levelMessages = messages[riskLevel as keyof typeof messages] || messages.medium
    return levelMessages[Math.floor(Math.random() * levelMessages.length)]
  }
  
  /**
   * 現在の時間帯を取得
   */
  private getCurrentTimeOfDay(): string {
    const hour = new Date().getHours()
    if (hour < 6) return 'night'
    if (hour < 12) return 'morning'
    if (hour < 18) return 'afternoon'
    return 'evening'
  }
  
  /**
   * イベントテンプレートを初期化
   */
  private initializeEventTemplates(): void {
    // 基本的なイベントテンプレートを定義
    const templates: EventTemplate[] = [
      {
        id: 'wild_pokemon_common',
        type: 'pokemon_encounter',
        name: '野生ポケモンとの遭遇',
        description: 'よくある野生ポケモンとの遭遇',
        conditions: [],
        baseMessage: '野生のポケモンが現れました！',
        messageVariants: [
          'ポケモンの鳴き声が聞こえます',
          '草むらが揺れています',
          '何かの気配を感じます'
        ],
        choices: [
          {
            id: 'capture_aggressive',
            text: '積極的に捕まえる',
            effect: { type: 'pokemon_capture', parameters: { experience: 50 } },
            requirements: [{ type: 'trainer_skill', skill: 'capture', value: 5 }],
            baseSuccessRate: 0.7,
            riskLevel: 'medium'
          },
          {
            id: 'observe_careful',
            text: '慎重に観察する',
            effect: { type: 'experience', parameters: { amount: 30 } },
            requirements: [{ type: 'trainer_skill', skill: 'research', value: 3 }],
            baseSuccessRate: 0.9,
            riskLevel: 'low'
          },
          {
            id: 'ignore',
            text: '無視して通り過ぎる',
            effect: { type: 'progress_modifier', parameters: { modifier: 0.05 } },
            requirements: [],
            baseSuccessRate: 1.0,
            riskLevel: 'none'
          }
        ],
        rarity: 'common'
      },
      
      {
        id: 'treasure_discovery',
        type: 'item_discovery',
        name: '宝物の発見',
        description: '隠された宝物やアイテムの発見',
        conditions: [
          { type: 'stage', operator: 'in', value: ['middle', 'late'], weight: 0.8 }
        ],
        baseMessage: '地面に何か光るものを発見しました',
        messageVariants: [
          '木の根元に隠された宝箱があります',
          '岩の隙間に何かが挟まっています',
          '珍しい石が落ちています'
        ],
        choices: [
          {
            id: 'collect_immediately',
            text: 'すぐに回収する',
            effect: { type: 'item_gain', parameters: { experience: 20 } },
            requirements: [],
            baseSuccessRate: 0.8,
            riskLevel: 'low'
          },
          {
            id: 'examine_first',
            text: '周囲を確認してから回収',
            effect: { type: 'item_gain', parameters: { experience: 30 } },
            requirements: [{ type: 'trainer_skill', skill: 'research', value: 4 }],
            baseSuccessRate: 0.95,
            riskLevel: 'none'
          },
          {
            id: 'leave_alone',
            text: '危険そうなので諦める',
            effect: { type: 'progress_modifier', parameters: { modifier: 0.02 } },
            requirements: [],
            baseSuccessRate: 1.0,
            riskLevel: 'none'
          }
        ],
        rarity: 'uncommon'
      },
      
      {
        id: 'dangerous_encounter',
        type: 'danger',
        name: '危険な遭遇',
        description: '危険な野生ポケモンや状況との遭遇',
        conditions: [
          { type: 'risk_level', operator: 'in', value: ['high', 'critical'], weight: 0.9 }
        ],
        baseMessage: '危険な野生ポケモンの縄張りに入ってしまいました！',
        messageVariants: [
          '強力な野生ポケモンが威嚇しています',
          '非常に危険な雰囲気を感じます',
          '逃げ道が塞がれそうです'
        ],
        choices: [
          {
            id: 'fight_back',
            text: '立ち向かう',
            effect: { type: 'experience', parameters: { amount: 80 } },
            requirements: [
              { type: 'trainer_skill', skill: 'battle', value: 7 },
              { type: 'trainer_level', value: 3 }
            ],
            baseSuccessRate: 0.4,
            riskLevel: 'extreme'
          },
          {
            id: 'careful_retreat',
            text: '慎重に後退する',
            effect: { type: 'progress_modifier', parameters: { modifier: -0.1 } },
            requirements: [{ type: 'trainer_skill', skill: 'exploration', value: 5 }],
            baseSuccessRate: 0.8,
            riskLevel: 'medium'
          },
          {
            id: 'quick_escape',
            text: '急いで逃げる',
            effect: { type: 'progress_modifier', parameters: { modifier: -0.05 } },
            requirements: [],
            baseSuccessRate: 0.9,
            riskLevel: 'low'
          }
        ],
        rarity: 'uncommon'
      }
    ]
    
    // テンプレートをマップに登録
    templates.forEach(template => {
      this.eventTemplates.set(template.id, template)
    })
    
    console.log(`📋 ${templates.length}個のイベントテンプレートを初期化しました`)
  }
  
  /**
   * イベント履歴を取得
   */
  getEventHistory(expeditionId: string): ExpeditionEvent[] {
    return this.eventHistory.get(expeditionId) || []
  }
  
  /**
   * イベント統計を取得
   */
  getEventStatistics(expeditionId?: string): any {
    if (expeditionId) {
      const events = this.eventHistory.get(expeditionId) || []
      return {
        totalEvents: events.length,
        resolvedEvents: events.filter(e => e.resolved).length,
        eventTypes: events.reduce((acc, e) => {
          acc[e.type] = (acc[e.type] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }
    }
    
    // 全体統計（空の配列を使用）
    const allEvents: ExpeditionEvent[] = []
    // TODO: Implement proper event history access
    
    return {
      totalEvents: allEvents.length,
      resolvedEvents: allEvents.filter(e => e.resolved).length,
      eventTypes: allEvents.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }
  
  /**
   * カスタムイベントテンプレートを追加
   */
  addEventTemplate(template: EventTemplate): void {
    this.eventTemplates.set(template.id, template)
    console.log(`📝 カスタムイベントテンプレートを追加: ${template.name}`)
  }
  
  /**
   * リソースを解放
   */
  destroy(): void {
    this.eventTemplates.clear()
    this.eventHistory.clear()
    this.choiceCooldowns.clear()
    this.eventCooldowns.clear()
    
    console.log('🗑️ イベントシステムを破棄しました')
  }
}

// シングルトンインスタンス
export const expeditionEventSystem = ExpeditionEventSystem.getInstance()