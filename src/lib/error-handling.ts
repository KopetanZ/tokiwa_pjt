// データベースエラーハンドリングの完全実装
import { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

// エラーの種類を定義
export enum ErrorType {
  DATABASE_CONNECTION = 'database_connection',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NETWORK = 'network',
  RATE_LIMIT = 'rate_limit',
  DATA_INTEGRITY = 'data_integrity',
  TRANSACTION = 'transaction',
  UNKNOWN = 'unknown'
}

// エラーの重要度レベル
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// 統一エラーオブジェクト
export interface DatabaseError {
  type: ErrorType
  severity: ErrorSeverity
  message: string
  code?: string
  details?: any
  timestamp: Date
  user?: User | null
  context?: {
    operation: string
    table?: string
    data?: any
  }
  recoverable: boolean
  retryable: boolean
  userMessage: string
}

// Supabaseエラーをカスタムエラーに変換
export function mapSupabaseError(
  error: any,
  context: {
    operation: string
    table?: string
    data?: any
  },
  user?: User | null
): DatabaseError {
  const timestamp = new Date()
  
  // Supabaseのエラーコードに基づいて分類
  let type = ErrorType.UNKNOWN
  let severity = ErrorSeverity.MEDIUM
  let recoverable = false
  let retryable = false
  let userMessage = 'データベースエラーが発生しました'

  if (!error) {
    return {
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.LOW,
      message: 'Unknown error occurred',
      timestamp,
      user,
      context,
      recoverable: false,
      retryable: false,
      userMessage: '不明なエラーが発生しました'
    }
  }

  const errorCode = error.code || error.status?.toString()
  const errorMessage = error.message || error.statusText || String(error)

  switch (errorCode) {
    // 接続エラー
    case 'ECONNREFUSED':
    case 'ENOTFOUND':
    case 'ETIMEDOUT':
      type = ErrorType.DATABASE_CONNECTION
      severity = ErrorSeverity.HIGH
      retryable = true
      userMessage = 'データベースに接続できません。しばらく後にもう一度お試しください。'
      break

    // 認証エラー
    case '401':
    case 'PGRST301':
      type = ErrorType.AUTHENTICATION
      severity = ErrorSeverity.HIGH
      userMessage = 'ログインが必要です。再度ログインしてください。'
      break

    // 認可エラー
    case '403':
    case 'PGRST302':
      type = ErrorType.AUTHORIZATION
      severity = ErrorSeverity.HIGH
      userMessage = 'この操作を実行する権限がありません。'
      break

    // バリデーションエラー
    case '400':
    case '422':
    case 'PGRST202':
      type = ErrorType.VALIDATION
      severity = ErrorSeverity.MEDIUM
      recoverable = true
      userMessage = '入力データに不備があります。内容を確認してください。'
      break

    // レート制限
    case '429':
      type = ErrorType.RATE_LIMIT
      severity = ErrorSeverity.MEDIUM
      retryable = true
      userMessage = 'リクエストが多すぎます。しばらく待ってからお試しください。'
      break

    // データ整合性エラー
    case '23505': // unique violation
    case '23503': // foreign key violation
    case '23502': // not null violation
      type = ErrorType.DATA_INTEGRITY
      severity = ErrorSeverity.HIGH
      recoverable = true
      userMessage = 'データの整合性に問題があります。管理者にお問い合わせください。'
      break

    // ネットワークエラー
    case 'NetworkError':
    case 'ERR_NETWORK':
      type = ErrorType.NETWORK
      severity = ErrorSeverity.HIGH
      retryable = true
      userMessage = 'ネットワークエラーが発生しました。接続を確認してください。'
      break

    // その他のHTTPエラー
    case '500':
    case '502':
    case '503':
    case '504':
      type = ErrorType.DATABASE_CONNECTION
      severity = ErrorSeverity.CRITICAL
      retryable = true
      userMessage = 'サーバーエラーが発生しました。しばらく後にもう一度お試しください。'
      break

    default:
      // 特定のエラーメッセージで判定
      if (errorMessage.includes('duplicate key') || errorMessage.includes('already exists')) {
        type = ErrorType.DATA_INTEGRITY
        severity = ErrorSeverity.MEDIUM
        recoverable = true
        userMessage = 'データが重複しています。'
      } else if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
        type = ErrorType.VALIDATION
        severity = ErrorSeverity.MEDIUM
        recoverable = true
        userMessage = '指定されたデータが見つかりません。'
      } else if (errorMessage.includes('connection') || errorMessage.includes('timeout')) {
        type = ErrorType.DATABASE_CONNECTION
        severity = ErrorSeverity.HIGH
        retryable = true
        userMessage = 'データベース接続エラーが発生しました。'
      }
      break
  }

  return {
    type,
    severity,
    message: errorMessage,
    code: errorCode,
    details: error,
    timestamp,
    user,
    context,
    recoverable,
    retryable,
    userMessage
  }
}

// エラーログの記録
export class ErrorLogger {
  private static instance: ErrorLogger
  private errorLog: DatabaseError[] = []
  private maxLogSize = 1000
  
  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  logError(error: DatabaseError): void {
    this.errorLog.unshift(error)
    
    // ログサイズ制限
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize)
    }

    // コンソールに出力
    const logLevel = this.getLogLevel(error.severity)
    console[logLevel](`[${error.type}] ${error.message}`, {
      context: error.context,
      timestamp: error.timestamp,
      user: error.user?.id,
      details: error.details
    })

    // クリティカルエラーの場合は追加処理
    if (error.severity === ErrorSeverity.CRITICAL) {
      this.handleCriticalError(error)
    }

    // ローカルストレージに保存（最新100件のみ）
    try {
      const recentErrors = this.errorLog.slice(0, 100).map(e => ({
        ...e,
        details: undefined // 詳細情報は除外してサイズを削減
      }))
      localStorage.setItem('tokiwa-error-log', JSON.stringify(recentErrors))
    } catch (e) {
      console.warn('エラーログの保存に失敗:', e)
    }
  }

  private getLogLevel(severity: ErrorSeverity): 'log' | 'warn' | 'error' {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'log'
      case ErrorSeverity.MEDIUM:
        return 'warn'
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return 'error'
      default:
        return 'log'
    }
  }

  private handleCriticalError(error: DatabaseError): void {
    // クリティカルエラーの追加処理
    console.error('🚨 CRITICAL ERROR DETECTED 🚨', error)
    
    // 可能であればユーザーに緊急通知
    if (typeof window !== 'undefined') {
      const message = `重大なエラーが発生しました。アプリケーションを再起動することを推奨します。\n\nエラー: ${error.userMessage}`
      
      // 非同期で通知を表示
      setTimeout(() => {
        if (confirm(message + '\n\nページを再読み込みしますか？')) {
          window.location.reload()
        }
      }, 1000)
    }
  }

  getRecentErrors(limit: number = 50): DatabaseError[] {
    return this.errorLog.slice(0, limit)
  }

  getErrorsByType(type: ErrorType): DatabaseError[] {
    return this.errorLog.filter(error => error.type === type)
  }

  getErrorsBySeverity(severity: ErrorSeverity): DatabaseError[] {
    return this.errorLog.filter(error => error.severity === severity)
  }

  clearErrorLog(): void {
    this.errorLog = []
    localStorage.removeItem('tokiwa-error-log')
  }

  getErrorStats(): {
    total: number
    byType: Record<ErrorType, number>
    bySeverity: Record<ErrorSeverity, number>
  } {
    const stats = {
      total: this.errorLog.length,
      byType: {} as Record<ErrorType, number>,
      bySeverity: {} as Record<ErrorSeverity, number>
    }

    // 初期化
    Object.values(ErrorType).forEach(type => {
      stats.byType[type] = 0
    })
    Object.values(ErrorSeverity).forEach(severity => {
      stats.bySeverity[severity] = 0
    })

    // カウント
    this.errorLog.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1
    })

    return stats
  }
}

// リトライ機能付きデータベース操作ラッパー
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  context: {
    operation: string
    table?: string
    data?: any
  },
  user?: User | null,
  maxRetries: number = 3,
  backoffMs: number = 1000
): Promise<{ data: T | null; error: DatabaseError | null }> {
  let lastError: DatabaseError | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation()
      return { data: result, error: null }
      
    } catch (error) {
      const dbError = mapSupabaseError(error, context, user)
      lastError = dbError
      
      // エラーログに記録
      ErrorLogger.getInstance().logError(dbError)
      
      // リトライ可能でない場合は即座に終了
      if (!dbError.retryable || attempt === maxRetries) {
        break
      }
      
      // 指数バックオフで待機
      const waitTime = backoffMs * Math.pow(2, attempt)
      console.log(`リトライ ${attempt + 1}/${maxRetries} in ${waitTime}ms...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
  
  return { data: null, error: lastError }
}

// エラー回復処理
export class ErrorRecovery {
  static async attemptRecovery(error: DatabaseError): Promise<boolean> {
    if (!error.recoverable) {
      return false
    }

    try {
      switch (error.type) {
        case ErrorType.AUTHENTICATION:
          return await this.recoverAuthentication()
          
        case ErrorType.DATABASE_CONNECTION:
          return await this.recoverConnection()
          
        case ErrorType.DATA_INTEGRITY:
          return await this.recoverDataIntegrity(error)
          
        default:
          return false
      }
    } catch (e) {
      console.error('エラー回復処理中にエラー:', e)
      return false
    }
  }

  private static async recoverAuthentication(): Promise<boolean> {
    try {
      // supabaseクライアントの存在確認
      if (!supabase) {
        return false
      }
      
      // セッション更新を試行
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error || !session) {
        // ログインページにリダイレクト
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login'
        }
        return false
      }
      return true
    } catch (e) {
      return false
    }
  }

  private static async recoverConnection(): Promise<boolean> {
    // 簡単な接続テスト
    try {
      if (!supabase) {
        return false
      }
      const { error } = await supabase.from('profiles').select('id').limit(1)
      return !error
    } catch (e) {
      return false
    }
  }

  private static async recoverDataIntegrity(error: DatabaseError): Promise<boolean> {
    // データ整合性エラーの自動修復は危険なので、基本的にfalseを返す
    // 特定の安全なケースのみ実装する
    console.warn('データ整合性エラーは手動での対応が必要です:', error.message)
    return false
  }
}

// エラーハンドリングのユーティリティ関数
export function createErrorHandler(
  context: {
    operation: string
    table?: string
  },
  user?: User | null
) {
  return (error: any) => {
    const dbError = mapSupabaseError(error, context, user)
    ErrorLogger.getInstance().logError(dbError)
    return dbError
  }
}

// フロントエンド用の統一エラーハンドリングフック（React）
export function useErrorHandler() {
  const handleError = (
    error: any,
    context: {
      operation: string
      table?: string
      data?: any
    },
    user?: User | null
  ): DatabaseError => {
    const dbError = mapSupabaseError(error, context, user)
    ErrorLogger.getInstance().logError(dbError)
    
    // 必要に応じて回復処理を試行
    if (dbError.recoverable) {
      ErrorRecovery.attemptRecovery(dbError)
    }
    
    return dbError
  }

  const executeWithErrorHandling = async <T>(
    operation: () => Promise<T>,
    context: {
      operation: string
      table?: string
      data?: any
    },
    user?: User | null
  ): Promise<{ data: T | null; error: DatabaseError | null }> => {
    return await executeWithRetry(operation, context, user)
  }

  return {
    handleError,
    executeWithErrorHandling,
    getErrorLog: () => ErrorLogger.getInstance().getRecentErrors(),
    getErrorStats: () => ErrorLogger.getInstance().getErrorStats(),
    clearErrorLog: () => ErrorLogger.getInstance().clearErrorLog()
  }
}