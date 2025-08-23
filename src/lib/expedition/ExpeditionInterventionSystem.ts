/**
 * 派遣プレイヤー介入システム
 * アイテム使用、指示変更、緊急リコールなどの介入機能を管理
 */

import type { Expedition, ExpeditionEvent, Trainer, Pokemon, Intervention, Item } from '@/lib/game-state/types'
import { realtimeManager } from '@/lib/real-time/RealtimeManager'
import { expeditionEventSystem, type EventResolution } from './ExpeditionEventSystem'
import { performanceMonitor, throttle } from '@/lib/performance/PerformanceOptimizer'

export interface InterventionAction {
  id: string
  type: 'item_use' | 'strategy_change' | 'emergency_recall' | 'guidance' | 'resource_support'
  name: string
  description: string
  cost: number // お金またはリソース
  cooldown: number // minutes
  requirements: InterventionRequirement[]
  effects: InterventionEffect[]
}

export interface InterventionRequirement {
  type: 'player_level' | 'money' | 'item_possession' | 'trust_level' | 'expedition_stage'
  value: any
  description: string
}

export interface InterventionEffect {
  type: 'progress_boost' | 'success_rate_boost' | 'risk_reduction' | 'event_trigger' | 'status_change'
  parameters: Record<string, any>
  duration?: number // minutes, if temporary
  description: string
}

export interface InterventionResult {
  success: boolean
  cost: number
  effects: AppliedEffect[]
  message: string
  consequence?: string
}

export interface AppliedEffect {
  type: InterventionEffect['type']
  value: number
  duration: number
  startTime: number
  description: string
}

export interface ActiveIntervention {
  interventionId: string
  expeditionId: string
  trainerId: string
  action: InterventionAction
  appliedEffects: AppliedEffect[]
  timestamp: string
}

/**
 * 派遣介入システム
 */
export class ExpeditionInterventionSystem {
  private static instance: ExpeditionInterventionSystem
  private interventionActions = new Map<string, InterventionAction>()
  private activeInterventions = new Map<string, ActiveIntervention[]>() // expeditionId -> interventions
  private cooldowns = new Map<string, number>() // actionId_playerId -> timestamp
  private interventionHistory = new Map<string, Intervention[]>() // expeditionId -> history
  
  private constructor() {
    this.initializeInterventionActions()
    this.startEffectUpdateLoop()
  }
  
  static getInstance(): ExpeditionInterventionSystem {
    if (!ExpeditionInterventionSystem.instance) {
      ExpeditionInterventionSystem.instance = new ExpeditionInterventionSystem()
    }
    return ExpeditionInterventionSystem.instance
  }
  
  /**
   * 介入を実行
   */
  async executeIntervention(
    expeditionId: string,
    actionId: string,
    trainer: Trainer,
    playerLevel: number,
    playerMoney: number,
    inventory?: Item[]
  ): Promise<InterventionResult> {
    const action = this.interventionActions.get(actionId)
    if (!action) {
      throw new Error(`介入アクション不明: ${actionId}`)
    }
    
    // クールダウンチェック
    const cooldownKey = `${actionId}_player`
    const lastUsed = this.cooldowns.get(cooldownKey) || 0
    const now = Date.now()
    const cooldownRemaining = (lastUsed + action.cooldown * 60 * 1000) - now
    
    if (cooldownRemaining > 0) {
      throw new Error(`クールダウン中です（残り${Math.ceil(cooldownRemaining / 1000 / 60)}分）`)
    }
    
    // 要件チェック
    const requirementCheck = this.checkRequirements(action.requirements, {
      playerLevel,
      playerMoney,
      inventory: inventory || [],
      trainer,
      expeditionId
    })
    
    if (!requirementCheck.met) {
      throw new Error(`要件不足: ${requirementCheck.missingRequirements.join(', ')}`)
    }
    
    // 介入を実行
    const result = await this.performIntervention(expeditionId, action, trainer)
    
    // クールダウンを設定
    this.cooldowns.set(cooldownKey, now)
    
    // 履歴に記録
    const intervention: Intervention = {
      id: `intervention_${now}_${Math.random().toString(36).substr(2, 9)}`,
      eventId: '', // 特定イベントに対する介入でない場合は空
      action: actionId,
      timestamp: new Date().toISOString(),
      result: result.success ? 'success' : 'failure',
      effect: result.message
    }
    
    const history = this.interventionHistory.get(expeditionId) || []
    history.push(intervention)
    this.interventionHistory.set(expeditionId, history)
    
    console.log(`🎯 介入実行: ${action.name} → ${result.success ? '成功' : '失敗'}`)
    
    // リアルタイム通知
    realtimeManager.emitDataChange({
      category: 'expeditions',
      action: 'update',
      entityId: expeditionId,
      source: 'user_action',
      data: { intervention, result }
    })
    
    return result
  }
  
  /**
   * 緊急イベントに対する介入
   */
  async emergencyIntervention(
    expeditionId: string,
    eventId: string,
    actionId: string,
    trainer: Trainer
  ): Promise<EventResolution> {
    const action = this.interventionActions.get(actionId)
    if (!action) {
      throw new Error(`緊急介入アクション不明: ${actionId}`)
    }
    
    // 緊急介入は一部クールダウンを無視
    if (action.type !== 'emergency_recall') {
      const cooldownKey = `${actionId}_emergency`
      const lastUsed = this.cooldowns.get(cooldownKey) || 0
      const now = Date.now()
      const emergencyCooldown = Math.max(action.cooldown * 0.5, 5) // 通常の半分、最低5分
      
      if (now - lastUsed < emergencyCooldown * 60 * 1000) {
        throw new Error('緊急介入のクールダウン中です')
      }
      
      this.cooldowns.set(cooldownKey, now)
    }
    
    // イベントの解決方法を変更
    const modifiedResolution = await this.modifyEventResolution(eventId, action, trainer)
    
    // 介入を記録
    const intervention: Intervention = {
      id: `emergency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventId,
      action: actionId,
      timestamp: new Date().toISOString(),
      result: modifiedResolution.success ? 'success' : 'partial',
      effect: `緊急介入: ${action.name}`
    }
    
    const history = this.interventionHistory.get(expeditionId) || []
    history.push(intervention)
    this.interventionHistory.set(expeditionId, history)
    
    console.log(`🚨 緊急介入: ${action.name} (イベント: ${eventId})`)
    
    return modifiedResolution
  }
  
  /**
   * 利用可能な介入アクションを取得
   */
  getAvailableActions(
    expeditionId: string,
    stage: string,
    riskLevel: string,
    playerLevel: number,
    playerMoney: number,
    trustLevel: number
  ): InterventionAction[] {
    const now = Date.now()
    const available: InterventionAction[] = []
    
    this.interventionActions.forEach(action => {
      // クールダウンチェック
      const cooldownKey = `${action.id}_player`
      const lastUsed = this.cooldowns.get(cooldownKey) || 0
      if (now - lastUsed < action.cooldown * 60 * 1000) {
        return
      }
      
      // 基本要件チェック
      const meetsRequirements = this.checkRequirements(action.requirements, {
        playerLevel,
        playerMoney,
        inventory: [],
        trainer: { trustLevel } as Trainer,
        expeditionId,
        stage,
        riskLevel
      }).met
      
      if (meetsRequirements) {
        available.push(action)
      }
    })
    
    return available
  }
  
  /**
   * アクティブな介入効果を取得
   */
  getActiveEffects(expeditionId: string): AppliedEffect[] {
    const interventions = this.activeInterventions.get(expeditionId) || []
    const allEffects: AppliedEffect[] = []
    
    for (const intervention of interventions) {
      allEffects.push(...intervention.appliedEffects)
    }
    
    // 期限切れの効果をフィルタリング
    const now = Date.now()
    return allEffects.filter(effect => 
      effect.duration === 0 || effect.startTime + effect.duration * 60 * 1000 > now
    )
  }
  
  /**
   * 介入の統計を取得
   */
  getInterventionStatistics(expeditionId?: string): any {
    if (expeditionId) {
      const history = this.interventionHistory.get(expeditionId) || []
      return {
        totalInterventions: history.length,
        successfulInterventions: history.filter(i => i.result === 'success').length,
        actionBreakdown: history.reduce((acc, i) => {
          acc[i.action] = (acc[i.action] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }
    }
    
    // 全体統計
    const allHistory: Intervention[] = []
    this.interventionHistory.forEach((history) => {
      allHistory.push(...history)
    })
    
    return {
      totalInterventions: allHistory.length,
      successfulInterventions: allHistory.filter(i => i.result === 'success').length,
      actionBreakdown: allHistory.reduce((acc, i) => {
        acc[i.action] = (acc[i.action] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }
  
  /**
   * 要件をチェック
   */
  private checkRequirements(
    requirements: InterventionRequirement[],
    context: any
  ): { met: boolean; missingRequirements: string[] } {
    const missing: string[] = []
    
    for (const requirement of requirements) {
      if (!this.evaluateRequirement(requirement, context)) {
        missing.push(requirement.description)
      }
    }
    
    return {
      met: missing.length === 0,
      missingRequirements: missing
    }
  }
  
  /**
   * 要件を評価
   */
  private evaluateRequirement(requirement: InterventionRequirement, context: any): boolean {
    switch (requirement.type) {
      case 'player_level':
        return context.playerLevel >= requirement.value
        
      case 'money':
        return context.playerMoney >= requirement.value
        
      case 'item_possession':
        return context.inventory.some((item: Item) => 
          item.id === requirement.value || item.type === requirement.value
        )
        
      case 'trust_level':
        return context.trainer.trustLevel >= requirement.value
        
      case 'expedition_stage':
        return Array.isArray(requirement.value) 
          ? requirement.value.includes(context.stage)
          : context.stage === requirement.value
          
      default:
        return false
    }
  }
  
  /**
   * 介入を実行
   */
  private async performIntervention(
    expeditionId: string,
    action: InterventionAction,
    trainer: Trainer
  ): Promise<InterventionResult> {
    const appliedEffects: AppliedEffect[] = []
    const now = Date.now()
    
    // 効果を適用
    for (const effect of action.effects) {
      const appliedEffect: AppliedEffect = {
        type: effect.type,
        value: effect.parameters.value || 1,
        duration: effect.duration || 0,
        startTime: now,
        description: effect.description
      }
      
      appliedEffects.push(appliedEffect)
      
      // 即座に適用される効果
      switch (effect.type) {
        case 'progress_boost':
          this.applyProgressBoost(expeditionId, appliedEffect.value)
          break
          
        case 'risk_reduction':
          this.applyRiskReduction(expeditionId, appliedEffect.value)
          break
          
        case 'event_trigger':
          await this.triggerSpecialEvent(expeditionId, effect.parameters)
          break
      }
    }
    
    // アクティブ介入として記録
    const activeIntervention: ActiveIntervention = {
      interventionId: `active_${now}_${Math.random().toString(36).substr(2, 9)}`,
      expeditionId,
      trainerId: trainer.id,
      action,
      appliedEffects,
      timestamp: new Date().toISOString()
    }
    
    const expeditionInterventions = this.activeInterventions.get(expeditionId) || []
    expeditionInterventions.push(activeIntervention)
    this.activeInterventions.set(expeditionId, expeditionInterventions)
    
    return {
      success: true,
      cost: action.cost,
      effects: appliedEffects,
      message: this.generateSuccessMessage(action),
      consequence: this.generateConsequence(action, trainer)
    }
  }
  
  /**
   * 進行度ブーストを適用
   */
  private applyProgressBoost(expeditionId: string, value: number): void {
    realtimeManager.emitDataChange({
      category: 'expeditions',
      action: 'update',
      entityId: expeditionId,
      data: { boost: value },
      source: 'system_update'
    })
  }
  
  /**
   * リスク軽減を適用
   */
  private applyRiskReduction(expeditionId: string, value: number): void {
    realtimeManager.emitDataChange({
      category: 'expeditions',
      action: 'update',
      entityId: expeditionId,
      data: { reduction: value },
      source: 'system_update'
    })
  }
  
  /**
   * 特別イベントをトリガー
   */
  private async triggerSpecialEvent(expeditionId: string, parameters: any): Promise<void> {
    // TODO: 特別イベントの生成と実行
    console.log(`🎭 特別イベント発生: ${expeditionId}`, parameters)
  }
  
  /**
   * イベント解決を変更
   */
  private async modifyEventResolution(
    eventId: string,
    action: InterventionAction,
    trainer: Trainer
  ): Promise<EventResolution> {
    // 基本的な解決結果を取得（模擬）
    const baseResolution: EventResolution = {
      eventId,
      choiceId: `intervention_${action.id}`,
      success: true,
      result: {
        experienceGained: 0,
        moneyGained: 0,
        progressModifier: 0,
        message: ''
      },
      consequences: []
    }
    
    // 介入効果を適用
    for (const effect of action.effects) {
      switch (effect.type) {
        case 'success_rate_boost':
          baseResolution.success = true // 介入により成功保証
          baseResolution.result.experienceGained += effect.parameters.experience || 50
          break
          
        case 'progress_boost':
          baseResolution.result.progressModifier += effect.parameters.value || 0.1
          break
          
        case 'risk_reduction':
          baseResolution.result.message = '危険な状況を回避しました'
          break
      }
    }
    
    return baseResolution
  }
  
  /**
   * 成功メッセージを生成
   */
  private generateSuccessMessage(action: InterventionAction): string {
    const messages = {
      item_use: 'アイテムの効果でトレーナーを支援しました',
      strategy_change: '戦略の変更が功を奏しました',
      emergency_recall: 'トレーナーを安全に呼び戻しました',
      guidance: '的確な指示を送りました',
      resource_support: '追加リソースが届きました'
    }
    
    return messages[action.type] || '介入が成功しました'
  }
  
  /**
   * 結果を生成
   */
  private generateConsequence(action: InterventionAction, trainer: Trainer): string | undefined {
    // 介入の種類と頻度によって信頼関係に影響
    const trust = trainer.trustLevel
    
    if (action.type === 'emergency_recall' && trust > 70) {
      return 'トレーナーは安全を優先してくれたことに感謝しています'
    }
    
    if (action.type === 'guidance' && trust < 50) {
      return 'トレーナーは指示に少し抵抗感を示しています'
    }
    
    return undefined
  }
  
  /**
   * 効果の更新ループを開始
   */
  private startEffectUpdateLoop(): void {
    const updateInterval = 30000 // 30秒間隔
    
    const effectUpdateLoop = throttle(() => {
      performanceMonitor.measure('intervention_effect_update', () => {
        this.updateActiveEffects()
      })
      
      setTimeout(effectUpdateLoop, updateInterval)
    }, 15000) // 最大15秒間隔
    
    effectUpdateLoop()
  }
  
  /**
   * アクティブ効果を更新
   */
  private updateActiveEffects(): void {
    const now = Date.now()
    
    this.activeInterventions.forEach((interventions, expeditionId) => {
      const updatedInterventions = interventions.filter(intervention => {
        // 期限切れの効果を除去
        intervention.appliedEffects = intervention.appliedEffects.filter(effect => 
          effect.duration === 0 || effect.startTime + effect.duration * 60 * 1000 > now
        )
        
        // 効果が全て期限切れの場合、介入記録を削除
        return intervention.appliedEffects.length > 0
      })
      
      if (updatedInterventions.length === 0) {
        this.activeInterventions.delete(expeditionId)
      } else {
        this.activeInterventions.set(expeditionId, updatedInterventions)
      }
    })
  }
  
  /**
   * 介入アクションを初期化
   */
  private initializeInterventionActions(): void {
    const actions: InterventionAction[] = [
      {
        id: 'healing_potion',
        type: 'item_use',
        name: '回復薬使用',
        description: 'トレーナーに回復薬を送り、体力を回復させます',
        cost: 500,
        cooldown: 30, // 30分
        requirements: [
          { type: 'money', value: 500, description: '500円必要' },
          { type: 'item_possession', value: 'healing_potion', description: '回復薬が必要' }
        ],
        effects: [
          {
            type: 'progress_boost',
            parameters: { value: 0.05 },
            duration: 60,
            description: '1時間進行速度アップ'
          },
          {
            type: 'risk_reduction',
            parameters: { value: 0.2 },
            duration: 120,
            description: '2時間リスク軽減'
          }
        ]
      },
      
      {
        id: 'strategy_change_defensive',
        type: 'strategy_change',
        name: '慎重戦略への変更',
        description: '現在の戦略を安全重視に変更します',
        cost: 0,
        cooldown: 60, // 1時間
        requirements: [
          { type: 'trust_level', value: 40, description: '信頼レベル40以上' }
        ],
        effects: [
          {
            type: 'risk_reduction',
            parameters: { value: 0.3 },
            duration: 0, // 永続
            description: 'リスク大幅軽減'
          }
        ]
      },
      
      {
        id: 'emergency_recall',
        type: 'emergency_recall',
        name: '緊急呼び戻し',
        description: 'トレーナーを即座に安全な場所に呼び戻します',
        cost: 1000,
        cooldown: 0, // クールダウンなし（緊急時用）
        requirements: [
          { type: 'money', value: 1000, description: '1000円必要（緊急費用）' }
        ],
        effects: [
          {
            type: 'event_trigger',
            parameters: { type: 'immediate_return', safety: true },
            description: '即座に安全帰還'
          }
        ]
      },
      
      {
        id: 'expert_guidance',
        type: 'guidance',
        name: '専門家の助言',
        description: 'ベテラントレーナーの助言を送信します',
        cost: 800,
        cooldown: 45, // 45分
        requirements: [
          { type: 'player_level', value: 5, description: 'プレイヤーレベル5以上' },
          { type: 'money', value: 800, description: '800円必要' }
        ],
        effects: [
          {
            type: 'success_rate_boost',
            parameters: { value: 0.3 },
            duration: 90,
            description: '1.5時間成功率大幅アップ'
          }
        ]
      },
      
      {
        id: 'supply_drop',
        type: 'resource_support',
        name: '補給物資投下',
        description: '必要な物資をドローンで投下します',
        cost: 1500,
        cooldown: 120, // 2時間
        requirements: [
          { type: 'player_level', value: 8, description: 'プレイヤーレベル8以上' },
          { type: 'money', value: 1500, description: '1500円必要' },
          { type: 'expedition_stage', value: ['middle', 'late'], description: '中盤以降のみ' }
        ],
        effects: [
          {
            type: 'progress_boost',
            parameters: { value: 0.15 },
            duration: 180,
            description: '3時間大幅進行促進'
          },
          {
            type: 'event_trigger',
            parameters: { type: 'supply_bonus', items: true },
            description: '特別なアイテム発見チャンス'
          }
        ]
      }
    ]
    
    // アクションをマップに登録
    actions.forEach(action => {
      this.interventionActions.set(action.id, action)
    })
    
    console.log(`🎮 ${actions.length}個の介入アクションを初期化しました`)
  }
  
  /**
   * カスタム介入アクションを追加
   */
  addInterventionAction(action: InterventionAction): void {
    this.interventionActions.set(action.id, action)
    console.log(`🔧 カスタム介入アクション追加: ${action.name}`)
  }
  
  /**
   * リソースを解放
   */
  destroy(): void {
    this.interventionActions.clear()
    this.activeInterventions.clear()
    this.cooldowns.clear()
    this.interventionHistory.clear()
    
    console.log('🗑️ 介入システムを破棄しました')
  }
}

// シングルトンインスタンス
export const expeditionInterventionSystem = ExpeditionInterventionSystem.getInstance()