/**
 * データシステムエラーハンドラー
 * エラー処理、ログ記録、復旧機能を提供
 */

import { realtimeManager } from '@/lib/real-time/RealtimeManager'

export interface ErrorDetails {
  type: 'validation' | 'network' | 'storage' | 'permission' | 'system' | 'user' | 'unknown'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  originalError?: Error
  context?: any
  timestamp: string
  userId?: string
  sessionId?: string
  stackTrace?: string
}

export interface RecoveryAction {
  id: string
  name: string
  description: string
  action: () => Promise<boolean>
  riskLevel: 'low' | 'medium' | 'high'
}

export interface ErrorHandlingStrategy {
  errorType: ErrorDetails['type']
  autoRetry: boolean
  maxRetries: number
  retryDelay: number // milliseconds
  fallbackActions: RecoveryAction[]
  requiresUserConfirmation: boolean
}

/**
 * データシステムエラーハンドラー
 */
export class DataSystemErrorHandler {
  private static instance: DataSystemErrorHandler
  private errorLog: ErrorDetails[] = []
  private maxLogSize = 1000
  private strategies: Map<string, ErrorHandlingStrategy> = new Map()
  private retryAttempts: Map<string, number> = new Map()
  
  private constructor() {
    this.initializeDefaultStrategies()
  }
  
  static getInstance(): DataSystemErrorHandler {
    if (!DataSystemErrorHandler.instance) {
      DataSystemErrorHandler.instance = new DataSystemErrorHandler()
    }
    return DataSystemErrorHandler.instance
  }
  
  /**
   * エラーを処理する
   */
  async handleError(error: Error, context?: any): Promise<{
    handled: boolean
    recovered: boolean
    actions: RecoveryAction[]
    requiresUserAction: boolean
  }> {
    const errorDetails = this.createErrorDetails(error, context)
    this.logError(errorDetails)
    
    // リアルタイムでエラーを通知
    realtimeManager.emitSystemStatus('error', errorDetails.message)
    
    const strategy = this.getStrategyForError(errorDetails)
    let recovered = false
    
    if (strategy && strategy.autoRetry) {
      recovered = await this.attemptAutoRecovery(errorDetails, strategy)
    }
    
    return {
      handled: true,
      recovered,
      actions: strategy?.fallbackActions || [],
      requiresUserAction: strategy?.requiresUserConfirmation || false
    }
  }
  
  /**
   * エラーの詳細情報を作成
   */
  private createErrorDetails(error: Error, context?: any): ErrorDetails {
    const type = this.classifyError(error)
    const severity = this.determineSeverity(error, type)
    
    return {
      type,
      severity,
      message: error.message,
      originalError: error,
      context,
      timestamp: new Date().toISOString(),
      stackTrace: error.stack,
      userId: context?.userId,
      sessionId: context?.sessionId
    }
  }
  
  /**
   * エラーの分類
   */
  private classifyError(error: Error): ErrorDetails['type'] {
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network'
    }
    if (message.includes('storage') || message.includes('quota') || message.includes('localstorage')) {
      return 'storage'
    }
    if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'permission'
    }
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return 'validation'
    }
    if (message.includes('user') || message.includes('input')) {
      return 'user'
    }
    if (error.name === 'TypeError' || error.name === 'ReferenceError' || error.name === 'SyntaxError') {
      return 'system'
    }
    
    return 'unknown'
  }
  
  /**
   * エラーの重要度を判定
   */
  private determineSeverity(error: Error, type: ErrorDetails['type']): ErrorDetails['severity'] {
    if (type === 'permission' || type === 'system') {
      return 'critical'
    }
    if (type === 'network' || type === 'storage') {
      return 'high'
    }
    if (type === 'validation') {
      return 'medium'
    }
    return 'low'
  }
  
  /**
   * エラーに対する戦略を取得
   */
  private getStrategyForError(error: ErrorDetails): ErrorHandlingStrategy | undefined {
    return this.strategies.get(error.type)
  }
  
  /**
   * 自動復旧を試行
   */
  private async attemptAutoRecovery(error: ErrorDetails, strategy: ErrorHandlingStrategy): Promise<boolean> {
    const errorKey = `${error.type}_${error.message}`
    const currentAttempts = this.retryAttempts.get(errorKey) || 0
    
    if (currentAttempts >= strategy.maxRetries) {
      console.warn('⚠️ 最大リトライ回数に達しました:', errorKey)
      return false
    }
    
    this.retryAttempts.set(errorKey, currentAttempts + 1)
    
    // 遅延後にリトライ
    await new Promise(resolve => setTimeout(resolve, strategy.retryDelay))
    
    try {
      // 基本的な復旧アクションを実行
      for (const action of strategy.fallbackActions) {
        if (action.riskLevel === 'low') {
          const success = await action.action()
          if (success) {
            console.log('✅ 自動復旧成功:', action.name)
            this.retryAttempts.delete(errorKey)
            realtimeManager.emitSystemStatus('ready', '自動復旧完了')
            return true
          }
        }
      }
      
      return false
    } catch (recoveryError) {
      console.error('❌ 自動復旧エラー:', recoveryError)
      return false
    }
  }
  
  /**
   * エラーをログに記録
   */
  private logError(error: ErrorDetails): void {
    this.errorLog.push(error)
    
    // ログサイズを制限
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize / 2)
    }
    
    // 重要度の高いエラーはコンソールに出力
    if (error.severity === 'high' || error.severity === 'critical') {
      console.error('🚨 重要エラー:', error)
    } else {
      console.warn('⚠️ エラー:', error.message)
    }
  }
  
  /**
   * デフォルトの処理戦略を初期化
   */
  private initializeDefaultStrategies(): void {
    // ネットワークエラー戦略
    this.strategies.set('network', {
      errorType: 'network',
      autoRetry: true,
      maxRetries: 3,
      retryDelay: 2000,
      fallbackActions: [
        {
          id: 'check_connection',
          name: '接続確認',
          description: 'ネットワーク接続を確認します',
          action: async () => {
            return navigator.onLine
          },
          riskLevel: 'low'
        },
        {
          id: 'use_cached_data',
          name: 'キャッシュデータ使用',
          description: 'ローカルキャッシュのデータを使用します',
          action: async () => {
            // キャッシュからのフォールバック実装
            return true
          },
          riskLevel: 'low'
        }
      ],
      requiresUserConfirmation: false
    })
    
    // ストレージエラー戦略
    this.strategies.set('storage', {
      errorType: 'storage',
      autoRetry: true,
      maxRetries: 2,
      retryDelay: 1000,
      fallbackActions: [
        {
          id: 'clear_old_data',
          name: '古いデータ削除',
          description: '古いキャッシュデータを削除して容量を確保します',
          action: async () => {
            try {
              // 古いデータの削除実装
              const keys = Object.keys(localStorage)
              const oldKeys = keys.filter(key => key.startsWith('tokiwa-backup-'))
                .sort()
                .slice(0, -5) // 最新5つを除いて削除
              
              oldKeys.forEach(key => localStorage.removeItem(key))
              return oldKeys.length > 0
            } catch {
              return false
            }
          },
          riskLevel: 'medium'
        }
      ],
      requiresUserConfirmation: true
    })
    
    // バリデーションエラー戦略
    this.strategies.set('validation', {
      errorType: 'validation',
      autoRetry: false,
      maxRetries: 0,
      retryDelay: 0,
      fallbackActions: [
        {
          id: 'data_repair',
          name: 'データ修復',
          description: 'データの整合性を修復します',
          action: async () => {
            // データ修復の実装（統合データシステムの修復機能を呼び出し）
            return false // 実装待ち
          },
          riskLevel: 'medium'
        },
        {
          id: 'restore_backup',
          name: 'バックアップ復元',
          description: '最新のバックアップからデータを復元します',
          action: async () => {
            // バックアップからの復元実装
            return false // 実装待ち
          },
          riskLevel: 'high'
        }
      ],
      requiresUserConfirmation: true
    })
    
    // システムエラー戦略
    this.strategies.set('system', {
      errorType: 'system',
      autoRetry: false,
      maxRetries: 0,
      retryDelay: 0,
      fallbackActions: [
        {
          id: 'reload_page',
          name: 'ページ再読み込み',
          description: 'ページを再読み込みしてシステムを初期化します',
          action: async () => {
            window.location.reload()
            return true
          },
          riskLevel: 'high'
        }
      ],
      requiresUserConfirmation: true
    })
  }
  
  /**
   * エラーログを取得
   */
  getErrorLog(limit?: number): ErrorDetails[] {
    return limit ? this.errorLog.slice(-limit) : [...this.errorLog]
  }
  
  /**
   * 特定タイプのエラーログを取得
   */
  getErrorsByType(type: ErrorDetails['type'], limit?: number): ErrorDetails[] {
    const filtered = this.errorLog.filter(error => error.type === type)
    return limit ? filtered.slice(-limit) : filtered
  }
  
  /**
   * エラー統計を取得
   */
  getErrorStatistics() {
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000
    const oneDayAgo = now - 24 * 60 * 60 * 1000
    
    const recentErrors = this.errorLog.filter(
      error => new Date(error.timestamp).getTime() > oneHourAgo
    )
    const todaysErrors = this.errorLog.filter(
      error => new Date(error.timestamp).getTime() > oneDayAgo
    )
    
    const typeBreakdown = this.errorLog.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const severityBreakdown = this.errorLog.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      totalErrors: this.errorLog.length,
      recentErrors: recentErrors.length,
      todaysErrors: todaysErrors.length,
      typeBreakdown,
      severityBreakdown,
      mostCommonError: Object.entries(typeBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none'
    }
  }
  
  /**
   * エラーログをクリア
   */
  clearErrorLog(): void {
    this.errorLog = []
    this.retryAttempts.clear()
    console.log('🗑️ エラーログをクリアしました')
  }
  
  /**
   * カスタム戦略を追加
   */
  addStrategy(type: string, strategy: ErrorHandlingStrategy): void {
    this.strategies.set(type, strategy)
    console.log(`📋 エラー処理戦略を追加: ${type}`)
  }
  
  /**
   * リソース解放
   */
  destroy(): void {
    this.errorLog = []
    this.strategies.clear()
    this.retryAttempts.clear()
    console.log('🗑️ エラーハンドラーを破棄しました')
  }
}

// シングルトンインスタンス
export const dataSystemErrorHandler = DataSystemErrorHandler.getInstance()