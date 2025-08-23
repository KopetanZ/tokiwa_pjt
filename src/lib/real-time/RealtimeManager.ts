/**
 * リアルタイム更新マネージャー
 * データ変更の監視と自動更新の管理
 */

import { EventEmitter } from 'events'

export interface DataChangeEvent {
  type: 'data_changed'
  category: 'trainers' | 'pokemon' | 'expeditions' | 'economy' | 'player' | 'system'
  action: 'create' | 'update' | 'delete' | 'bulk_update'
  entityId?: string
  data?: any
  previousData?: any
  timestamp: string
  source: 'user_action' | 'system_update' | 'external_sync' | 'auto_save'
}

export interface SystemStatusEvent {
  type: 'system_status_changed'
  status: 'initializing' | 'ready' | 'error' | 'maintenance' | 'syncing'
  message?: string
  timestamp: string
}

export interface ValidationEvent {
  type: 'validation_completed'
  isValid: boolean
  errorCount: number
  warningCount: number
  timestamp: string
}

export type RealtimeEvent = DataChangeEvent | SystemStatusEvent | ValidationEvent

/**
 * リアルタイム更新マネージャー
 */
export class RealtimeManager extends EventEmitter {
  private static instance: RealtimeManager
  private isEnabled = true
  private eventBuffer: RealtimeEvent[] = []
  private bufferSize = 100
  private subscriptions = new Map<string, Set<(event: RealtimeEvent) => void>>()
  
  private constructor() {
    super()
    this.setMaxListeners(50) // リスナー数の上限を増やす
  }
  
  static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager()
    }
    return RealtimeManager.instance
  }
  
  /**
   * リアルタイム更新を有効/無効にする
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    if (enabled) {
      console.log('🔴 リアルタイム更新を有効化')
    } else {
      console.log('⚫ リアルタイム更新を無効化')
    }
  }
  
  /**
   * データ変更イベントを発行
   */
  emitDataChange(event: Omit<DataChangeEvent, 'type' | 'timestamp'>): void {
    if (!this.isEnabled) return
    
    const fullEvent: DataChangeEvent = {
      ...event,
      type: 'data_changed',
      timestamp: new Date().toISOString()
    }
    
    this.addToBuffer(fullEvent)
    this.emit('data_changed', fullEvent)
    this.emit(`data_changed:${event.category}`, fullEvent)
    
    if (event.entityId) {
      this.emit(`data_changed:${event.category}:${event.entityId}`, fullEvent)
    }
    
    // デバッグログ
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 データ変更イベント:', {
        category: event.category,
        action: event.action,
        entityId: event.entityId,
        source: event.source
      })
    }
  }
  
  /**
   * システム状態変更イベントを発行
   */
  emitSystemStatus(status: SystemStatusEvent['status'], message?: string): void {
    if (!this.isEnabled) return
    
    const event: SystemStatusEvent = {
      type: 'system_status_changed',
      status,
      message,
      timestamp: new Date().toISOString()
    }
    
    this.addToBuffer(event)
    this.emit('system_status_changed', event)
    this.emit(`system_status:${status}`, event)
    
    console.log(`📊 システム状態変更: ${status}${message ? ` - ${message}` : ''}`)
  }
  
  /**
   * 検証完了イベントを発行
   */
  emitValidation(isValid: boolean, errorCount: number, warningCount: number): void {
    if (!this.isEnabled) return
    
    const event: ValidationEvent = {
      type: 'validation_completed',
      isValid,
      errorCount,
      warningCount,
      timestamp: new Date().toISOString()
    }
    
    this.addToBuffer(event)
    this.emit('validation_completed', event)
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 検証完了:', { isValid, errorCount, warningCount })
    }
  }
  
  /**
   * 特定のカテゴリの変更を監視
   */
  subscribeToDataChanges(
    category: DataChangeEvent['category'],
    callback: (event: DataChangeEvent) => void
  ): () => void {
    const eventName = `data_changed:${category}`
    this.on(eventName, callback)
    
    return () => {
      this.off(eventName, callback)
    }
  }
  
  /**
   * 特定のエンティティの変更を監視
   */
  subscribeToEntity(
    category: DataChangeEvent['category'],
    entityId: string,
    callback: (event: DataChangeEvent) => void
  ): () => void {
    const eventName = `data_changed:${category}:${entityId}`
    this.on(eventName, callback)
    
    return () => {
      this.off(eventName, callback)
    }
  }
  
  /**
   * システム状態の変更を監視
   */
  subscribeToSystemStatus(
    callback: (event: SystemStatusEvent) => void
  ): () => void {
    this.on('system_status_changed', callback)
    
    return () => {
      this.off('system_status_changed', callback)
    }
  }
  
  /**
   * 検証結果を監視
   */
  subscribeToValidation(
    callback: (event: ValidationEvent) => void
  ): () => void {
    this.on('validation_completed', callback)
    
    return () => {
      this.off('validation_completed', callback)
    }
  }
  
  /**
   * 全てのイベントを監視
   */
  subscribeToAll(
    callback: (event: RealtimeEvent) => void
  ): () => void {
    const handler = (event: RealtimeEvent) => callback(event)
    
    this.on('data_changed', handler)
    this.on('system_status_changed', handler)
    this.on('validation_completed', handler)
    
    return () => {
      this.off('data_changed', handler)
      this.off('system_status_changed', handler)
      this.off('validation_completed', handler)
    }
  }
  
  /**
   * イベント履歴を取得
   */
  getEventHistory(limit?: number): RealtimeEvent[] {
    return limit ? this.eventBuffer.slice(-limit) : [...this.eventBuffer]
  }
  
  /**
   * 特定カテゴリのイベント履歴を取得
   */
  getCategoryHistory(category: DataChangeEvent['category'], limit?: number): DataChangeEvent[] {
    const categoryEvents = this.eventBuffer
      .filter((event): event is DataChangeEvent => 
        event.type === 'data_changed' && event.category === category
      )
    
    return limit ? categoryEvents.slice(-limit) : categoryEvents
  }
  
  /**
   * イベントバッファをクリア
   */
  clearHistory(): void {
    this.eventBuffer = []
    console.log('🗑️ イベント履歴をクリアしました')
  }
  
  /**
   * 統計情報を取得
   */
  getStatistics() {
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000
    
    const recentEvents = this.eventBuffer.filter(
      event => new Date(event.timestamp).getTime() > oneHourAgo
    )
    
    const dataChangeEvents = recentEvents.filter(
      (event): event is DataChangeEvent => event.type === 'data_changed'
    )
    
    const categoryStats = dataChangeEvents.reduce((acc, event) => {
      acc[event.category] = (acc[event.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const actionStats = dataChangeEvents.reduce((acc, event) => {
      acc[event.action] = (acc[event.action] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      totalEvents: this.eventBuffer.length,
      recentEvents: recentEvents.length,
      recentDataChanges: dataChangeEvents.length,
      categoryBreakdown: categoryStats,
      actionBreakdown: actionStats,
      listenerCount: this.listenerCount('data_changed'),
      isEnabled: this.isEnabled
    }
  }
  
  /**
   * イベントをバッファに追加
   */
  private addToBuffer(event: RealtimeEvent): void {
    this.eventBuffer.push(event)
    
    // バッファサイズを制限
    if (this.eventBuffer.length > this.bufferSize) {
      this.eventBuffer = this.eventBuffer.slice(-this.bufferSize)
    }
  }
  
  /**
   * リソース解放
   */
  destroy(): void {
    this.removeAllListeners()
    this.eventBuffer = []
    this.subscriptions.clear()
    console.log('🗑️ リアルタイムマネージャーを破棄しました')
  }
}

// シングルトンインスタンス取得
export const realtimeManager = RealtimeManager.getInstance()

/**
 * React用のリアルタイム更新フック
 */
export function useRealtimeUpdates() {
  const manager = RealtimeManager.getInstance()
  
  return {
    // イベント発行
    emitDataChange: manager.emitDataChange.bind(manager),
    emitSystemStatus: manager.emitSystemStatus.bind(manager),
    emitValidation: manager.emitValidation.bind(manager),
    
    // 購読
    subscribeToDataChanges: manager.subscribeToDataChanges.bind(manager),
    subscribeToEntity: manager.subscribeToEntity.bind(manager),
    subscribeToSystemStatus: manager.subscribeToSystemStatus.bind(manager),
    subscribeToValidation: manager.subscribeToValidation.bind(manager),
    subscribeToAll: manager.subscribeToAll.bind(manager),
    
    // 履歴
    getEventHistory: manager.getEventHistory.bind(manager),
    getCategoryHistory: manager.getCategoryHistory.bind(manager),
    clearHistory: manager.clearHistory.bind(manager),
    
    // 制御
    setEnabled: manager.setEnabled.bind(manager),
    getStatistics: manager.getStatistics.bind(manager)
  }
}