// リアルタイム介入システム

// リアルタイムイベント型定義
export interface ExpeditionEvent {
  id: string
  expeditionId: string
  trainerId: string
  eventType: 'encounter' | 'battle' | 'discovery' | 'emergency' | 'decision_point'
  timestamp: Date
  data: {
    description: string
    options?: Array<{
      id: string
      label: string
      success_rate: number
      reward_multiplier: number
      risk_level: 'low' | 'medium' | 'high'
    }>
    pokemon?: {
      name: string
      level: number
      shiny: boolean
    }
    location?: string
    urgency: 'low' | 'medium' | 'high' | 'critical'
  }
  playerResponseRequired: boolean
  responseDeadline?: Date
  autoResolveTime: number // 秒
  status: 'pending' | 'responded' | 'auto_resolved' | 'expired'
}

export interface PlayerResponse {
  eventId: string
  optionId: string
  timestamp: Date
  responseTime: number // ミリ秒
}

export interface ExpeditionProgress {
  expeditionId: string
  trainerId: string
  progress: number // 0-100
  currentStage: string
  timeElapsed: number
  timeRemaining: number
  events: ExpeditionEvent[]
  totalReward: number
  riskLevel: number
  successProbability: number
}

// リアルタイム介入管理クラス
class RealtimeInterventionSystem {
  private activeExpeditions = new Map<string, ExpeditionProgress>()
  private eventListeners = new Map<string, Function[]>()
  private simulationIntervals = new Map<string, NodeJS.Timeout>()
  
  // 派遣開始
  async startExpedition(expeditionId: string, trainerId: string, duration: number): Promise<void> {
    const progress: ExpeditionProgress = {
      expeditionId,
      trainerId,
      progress: 0,
      currentStage: 'preparation',
      timeElapsed: 0,
      timeRemaining: duration * 60 * 1000, // 分→ミリ秒
      events: [],
      totalReward: 0,
      riskLevel: 1,
      successProbability: 85
    }
    
    this.activeExpeditions.set(expeditionId, progress)
    this.startSimulation(expeditionId)
    
    // 初期イベント生成
    setTimeout(() => {
      this.generateRandomEvent(expeditionId)
    }, 5000) // 5秒後に最初のイベント
  }
  
  // 派遣シミュレーション開始
  private startSimulation(expeditionId: string): void {
    const interval = setInterval(() => {
      const progress = this.activeExpeditions.get(expeditionId)
      if (!progress) {
        clearInterval(interval)
        return
      }
      
      // 時間進行
      progress.timeElapsed += 1000
      progress.timeRemaining -= 1000
      progress.progress = Math.min(100, (progress.timeElapsed / (progress.timeElapsed + progress.timeRemaining)) * 100)
      
      // ステージ更新
      if (progress.progress < 25) {
        progress.currentStage = 'exploration'
      } else if (progress.progress < 50) {
        progress.currentStage = 'encounter'
      } else if (progress.progress < 75) {
        progress.currentStage = 'collection'
      } else {
        progress.currentStage = 'return'
      }
      
      // ランダムイベント生成判定
      if (Math.random() < 0.1) { // 10%の確率で毎秒
        this.generateRandomEvent(expeditionId)
      }
      
      // 派遣完了判定
      if (progress.timeRemaining <= 0) {
        this.completeExpedition(expeditionId)
        clearInterval(interval)
        return
      }
      
      // リスナーに通知
      this.notifyListeners(expeditionId, 'progress_update', progress)
      
    }, 1000) // 1秒間隔
    
    this.simulationIntervals.set(expeditionId, interval)
  }
  
  // ランダムイベント生成
  private generateRandomEvent(expeditionId: string): void {
    const progress = this.activeExpeditions.get(expeditionId)
    if (!progress) return
    
    const eventTypes = ['encounter', 'battle', 'discovery', 'emergency', 'decision_point']
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)] as ExpeditionEvent['eventType']
    
    const event: ExpeditionEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      expeditionId,
      trainerId: progress.trainerId,
      eventType,
      timestamp: new Date(),
      data: this.generateEventData(eventType, progress),
      playerResponseRequired: Math.random() < 0.6, // 60%の確率で介入要求
      responseDeadline: new Date(Date.now() + 30000), // 30秒後
      autoResolveTime: 30,
      status: 'pending'
    }
    
    progress.events.push(event)
    
    // 介入要求の場合はリスナーに通知
    if (event.playerResponseRequired) {
      this.notifyListeners(expeditionId, 'intervention_required', event)
      
      // 自動解決タイマー
      setTimeout(() => {
        if (event.status === 'pending') {
          this.autoResolveEvent(event)
        }
      }, event.autoResolveTime * 1000)
    } else {
      // 自動解決
      this.autoResolveEvent(event)
    }
  }
  
  // イベントデータ生成
  private generateEventData(eventType: ExpeditionEvent['eventType'], progress: ExpeditionProgress) {
    const pokemonNames = ['ピカチュウ', 'フシギダネ', 'ヒトカゲ', 'ゼニガメ', 'ポッポ', 'コラッタ']
    
    switch (eventType) {
      case 'encounter':
        return {
          description: `野生の${pokemonNames[Math.floor(Math.random() * pokemonNames.length)]}が現れた！`,
          options: [
            { id: 'capture', label: '捕獲を試みる', success_rate: 70, reward_multiplier: 1.5, risk_level: 'medium' as const },
            { id: 'battle', label: 'バトルで経験値を得る', success_rate: 85, reward_multiplier: 1.2, risk_level: 'low' as const },
            { id: 'avoid', label: '避けて進む', success_rate: 95, reward_multiplier: 1.0, risk_level: 'low' as const }
          ],
          pokemon: {
            name: pokemonNames[Math.floor(Math.random() * pokemonNames.length)],
            level: Math.floor(Math.random() * 10) + 5,
            shiny: Math.random() < 0.01
          },
          urgency: 'medium' as const
        }
      
      case 'battle':
        return {
          description: 'トレーナーバトルを仕掛けられた！',
          options: [
            { id: 'aggressive', label: '積極的に攻める', success_rate: 60, reward_multiplier: 2.0, risk_level: 'high' as const },
            { id: 'defensive', label: '慎重に戦う', success_rate: 80, reward_multiplier: 1.3, risk_level: 'medium' as const },
            { id: 'retreat', label: '戦闘を避ける', success_rate: 50, reward_multiplier: 0.8, risk_level: 'low' as const }
          ],
          urgency: 'high' as const
        }
      
      case 'discovery':
        return {
          description: '珍しいアイテムを発見した！',
          options: [
            { id: 'investigate', label: '詳しく調べる', success_rate: 70, reward_multiplier: 1.8, risk_level: 'medium' as const },
            { id: 'collect', label: 'すぐに回収する', success_rate: 90, reward_multiplier: 1.2, risk_level: 'low' as const },
            { id: 'ignore', label: '無視して進む', success_rate: 100, reward_multiplier: 1.0, risk_level: 'low' as const }
          ],
          urgency: 'low' as const
        }
      
      case 'emergency':
        return {
          description: 'ポケモンが怪我をした！',
          options: [
            { id: 'heal', label: '回復アイテムを使う', success_rate: 85, reward_multiplier: 1.0, risk_level: 'low' as const },
            { id: 'continue', label: 'そのまま続行', success_rate: 40, reward_multiplier: 1.1, risk_level: 'high' as const },
            { id: 'return', label: '早期帰還する', success_rate: 95, reward_multiplier: 0.6, risk_level: 'low' as const }
          ],
          urgency: 'critical' as const
        }
      
      case 'decision_point':
        return {
          description: '道が二手に分かれている',
          options: [
            { id: 'forest', label: '森の道を進む', success_rate: 75, reward_multiplier: 1.4, risk_level: 'medium' as const },
            { id: 'cave', label: '洞窟の道を進む', success_rate: 65, reward_multiplier: 1.6, risk_level: 'high' as const },
            { id: 'safe', label: '安全な道を進む', success_rate: 90, reward_multiplier: 1.1, risk_level: 'low' as const }
          ],
          urgency: 'low' as const
        }
      
      default:
        return {
          description: '何かが起こった...',
          urgency: 'low' as const
        }
    }
  }
  
  // プレイヤー応答処理
  async respondToEvent(response: PlayerResponse): Promise<void> {
    const expeditionId = response.eventId.split('_')[0] // イベントIDから派遣IDを抽出
    const progress = this.activeExpeditions.get(expeditionId)
    if (!progress) return
    
    const event = progress.events.find(e => e.id === response.eventId)
    if (!event || event.status !== 'pending') return
    
    event.status = 'responded'
    
    const selectedOption = event.data.options?.find(o => o.id === response.optionId)
    if (selectedOption) {
      // 成功判定
      const success = Math.random() < (selectedOption.success_rate / 100)
      
      if (success) {
        progress.totalReward *= selectedOption.reward_multiplier
        progress.successProbability = Math.min(100, progress.successProbability + 5)
      } else {
        progress.successProbability = Math.max(0, progress.successProbability - 10)
        
        // リスクレベルに応じて派遣時間延長やダメージ
        if (selectedOption.risk_level === 'high') {
          progress.timeRemaining += 60000 // 1分延長
        }
      }
      
      // 結果をリスナーに通知
      this.notifyListeners(expeditionId, 'response_result', {
        event,
        response,
        success,
        result: success ? 'success' : 'failure'
      })
    }
  }
  
  // 自動解決
  private autoResolveEvent(event: ExpeditionEvent): void {
    if (event.status !== 'pending') return
    
    event.status = 'auto_resolved'
    
    // 最も安全な選択肢を自動選択
    const safeOption = event.data.options?.find(o => o.risk_level === 'low') || 
                      event.data.options?.[0]
    
    if (safeOption) {
      const expeditionId = event.expeditionId
      const progress = this.activeExpeditions.get(expeditionId)
      if (progress) {
        // 自動解決は成功率を少し下げる
        const success = Math.random() < ((safeOption.success_rate - 10) / 100)
        
        if (success) {
          progress.totalReward *= (safeOption.reward_multiplier * 0.9) // 自動解決は報酬減
        }
        
        this.notifyListeners(expeditionId, 'auto_resolved', {
          event,
          selectedOption: safeOption,
          success
        })
      }
    }
  }
  
  // 派遣完了
  private completeExpedition(expeditionId: string): void {
    const progress = this.activeExpeditions.get(expeditionId)
    if (!progress) return
    
    // 最終報酬計算
    const baseReward = 1000
    const finalReward = Math.floor(baseReward * progress.totalReward * (progress.successProbability / 100))
    
    this.notifyListeners(expeditionId, 'expedition_complete', {
      expeditionId,
      finalReward,
      eventsCount: progress.events.length,
      successProbability: progress.successProbability
    })
    
    // クリーンアップ
    this.activeExpeditions.delete(expeditionId)
    this.simulationIntervals.delete(expeditionId)
  }
  
  // イベントリスナー管理
  addEventListener(expeditionId: string, callback: Function): void {
    if (!this.eventListeners.has(expeditionId)) {
      this.eventListeners.set(expeditionId, [])
    }
    this.eventListeners.get(expeditionId)!.push(callback)
  }
  
  removeEventListener(expeditionId: string, callback: Function): void {
    const listeners = this.eventListeners.get(expeditionId)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }
  
  private notifyListeners(expeditionId: string, eventType: string, data: any): void {
    const listeners = this.eventListeners.get(expeditionId)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(eventType, data)
        } catch (error) {
          console.error('Listener error:', error)
        }
      })
    }
  }
  
  // 現在の進行状況取得
  getProgress(expeditionId: string): ExpeditionProgress | null {
    return this.activeExpeditions.get(expeditionId) || null
  }
  
  // アクティブな派遣一覧
  getActiveExpeditions(): ExpeditionProgress[] {
    return Array.from(this.activeExpeditions.values())
  }
  
  // 派遣停止
  stopExpedition(expeditionId: string): void {
    const interval = this.simulationIntervals.get(expeditionId)
    if (interval) {
      clearInterval(interval)
      this.simulationIntervals.delete(expeditionId)
    }
    this.activeExpeditions.delete(expeditionId)
    this.eventListeners.delete(expeditionId)
  }
}

export const realtimeSystem = new RealtimeInterventionSystem()