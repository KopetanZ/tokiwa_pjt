/**
 * 統一エラーハンドリングシステム
 * アプリケーション全体で一貫したエラー処理を提供
 */

import { ERRORS, DEVELOPMENT } from '@/config/app'

// エラーコード定数
export const ERROR_CODES = {
  // ゲーム関連
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  TRAINER_BUSY: 'TRAINER_BUSY',
  TRAINER_NOT_FOUND: 'TRAINER_NOT_FOUND',
  LOCATION_LOCKED: 'LOCATION_LOCKED',
  POKEMON_NOT_FOUND: 'POKEMON_NOT_FOUND',
  FACILITY_BUSY: 'FACILITY_BUSY',
  EXPEDITION_IN_PROGRESS: 'EXPEDITION_IN_PROGRESS',
  
  // データベース関連
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  QUERY_FAILED: 'QUERY_FAILED',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',
  
  // 認証関連
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // API関連
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_REQUEST: 'INVALID_REQUEST',
  
  // バリデーション関連
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // システム関連
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  FEATURE_DISABLED: 'FEATURE_DISABLED',
} as const

export type ErrorCode = keyof typeof ERROR_CODES

// エラーの重要度レベル
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

// 値としても使用できるよう enum も提供
export enum ErrorSeverityEnum {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  CRITICAL = 'critical'
}

// エラーカテゴリ
export type ErrorCategory = 'game' | 'database' | 'auth' | 'api' | 'validation' | 'system'

// ゲーム専用エラークラス
export class GameError extends Error {
  public readonly code: string
  public readonly severity: ErrorSeverity
  public readonly category: ErrorCategory
  public readonly context?: Record<string, any>
  public readonly timestamp: Date
  public readonly userMessage: string
  public readonly retryable: boolean

  constructor(
    message: string,
    code: string,
    options: {
      severity?: ErrorSeverity
      category?: ErrorCategory
      context?: Record<string, any>
      userMessage?: string
      retryable?: boolean
    } = {}
  ) {
    super(message)
    this.name = 'GameError'
    this.code = code
    this.severity = options.severity || 'medium'
    this.category = options.category || 'system'
    this.context = options.context
    this.timestamp = new Date()
    this.userMessage = options.userMessage || this.getDefaultUserMessage(code)
    this.retryable = options.retryable || false

    // スタックトレースの調整
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GameError)
    }
  }

  private getDefaultUserMessage(code: string): string {
    const messages: Record<string, string> = {
      [ERROR_CODES.INSUFFICIENT_FUNDS]: '資金が不足しています',
      [ERROR_CODES.TRAINER_BUSY]: 'トレーナーは現在他の作業中です',
      [ERROR_CODES.TRAINER_NOT_FOUND]: '指定されたトレーナーが見つかりません',
      [ERROR_CODES.LOCATION_LOCKED]: 'この場所はまだ利用できません',
      [ERROR_CODES.POKEMON_NOT_FOUND]: '指定されたポケモンが見つかりません',
      [ERROR_CODES.FACILITY_BUSY]: '施設は現在使用中です',
      [ERROR_CODES.EXPEDITION_IN_PROGRESS]: '派遣が既に実行中です',
      [ERROR_CODES.DATABASE_ERROR]: 'データの保存に失敗しました',
      [ERROR_CODES.CONNECTION_FAILED]: '接続に失敗しました',
      [ERROR_CODES.AUTHENTICATION_ERROR]: '認証に失敗しました',
      [ERROR_CODES.SESSION_EXPIRED]: 'セッションが期限切れです',
      [ERROR_CODES.NETWORK_ERROR]: 'ネットワークエラーが発生しました',
      [ERROR_CODES.TIMEOUT_ERROR]: 'タイムアウトしました',
      [ERROR_CODES.VALIDATION_ERROR]: '入力内容に問題があります',
      [ERROR_CODES.INVALID_INPUT]: '無効な入力です',
      [ERROR_CODES.CONFIGURATION_ERROR]: '設定に問題があります',
      [ERROR_CODES.FEATURE_DISABLED]: 'この機能は現在無効です',
      [ERROR_CODES.UNKNOWN_ERROR]: '予期しないエラーが発生しました',
    }

    return messages[code] || 'エラーが発生しました'
  }

  // エラーの詳細情報をJSONで取得
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      category: this.category,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      userMessage: this.userMessage,
      retryable: this.retryable,
      stack: DEVELOPMENT.DEBUG_MODE ? this.stack : undefined,
    }
  }
}

// エラーハンドリングユーティリティ
export class ErrorHandler {
  private static errorHistory: GameError[] = []

  // 汎用エラーハンドラー
  static handle(error: unknown, context?: Record<string, any>): GameError {
    let gameError: GameError

    if (error instanceof GameError) {
      gameError = error
    } else if (error instanceof Error) {
      gameError = this.fromError(error, context)
    } else {
      gameError = new GameError(
        String(error),
        ERROR_CODES.UNKNOWN_ERROR,
        { context, severity: 'medium' }
      )
    }

    this.logError(gameError)
    this.recordError(gameError)

    return gameError
  }

  // 標準Errorからの変換
  private static fromError(error: Error, context?: Record<string, any>): GameError {
    // エラーメッセージからコードを推測
    const code = this.inferErrorCode(error.message)
    const category = this.inferErrorCategory(code)
    const severity = this.inferErrorSeverity(code)

    return new GameError(
      error.message,
      code,
      {
        category,
        severity,
        context: {
          ...context,
          originalStack: error.stack,
        },
        retryable: this.isRetryable(code),
      }
    )
  }

  // エラーコードの推測
  private static inferErrorCode(message: string): string {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes('insufficient') || lowerMessage.includes('funds')) {
      return ERROR_CODES.INSUFFICIENT_FUNDS
    }
    if (lowerMessage.includes('not found')) {
      return ERROR_CODES.TRAINER_NOT_FOUND
    }
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      return ERROR_CODES.NETWORK_ERROR
    }
    if (lowerMessage.includes('timeout')) {
      return ERROR_CODES.TIMEOUT_ERROR
    }
    if (lowerMessage.includes('auth') || lowerMessage.includes('credential')) {
      return ERROR_CODES.AUTHENTICATION_ERROR
    }
    if (lowerMessage.includes('database') || lowerMessage.includes('sql')) {
      return ERROR_CODES.DATABASE_ERROR
    }
    if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
      return ERROR_CODES.VALIDATION_ERROR
    }

    return ERROR_CODES.UNKNOWN_ERROR
  }

  // エラーカテゴリの推測
  private static inferErrorCategory(code: string): ErrorCategory {
    if ([
      ERROR_CODES.INSUFFICIENT_FUNDS,
      ERROR_CODES.TRAINER_BUSY,
      ERROR_CODES.LOCATION_LOCKED,
      ERROR_CODES.POKEMON_NOT_FOUND,
    ].includes(code as any)) {
      return 'game'
    }

    if ([
      ERROR_CODES.DATABASE_ERROR,
      ERROR_CODES.CONNECTION_FAILED,
      ERROR_CODES.QUERY_FAILED,
    ].includes(code as any)) {
      return 'database'
    }

    if ([
      ERROR_CODES.AUTHENTICATION_ERROR,
      ERROR_CODES.AUTHORIZATION_ERROR,
      ERROR_CODES.SESSION_EXPIRED,
    ].includes(code as any)) {
      return 'auth'
    }

    if ([
      ERROR_CODES.NETWORK_ERROR,
      ERROR_CODES.TIMEOUT_ERROR,
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
    ].includes(code as any)) {
      return 'api'
    }

    if ([
      ERROR_CODES.VALIDATION_ERROR,
      ERROR_CODES.INVALID_INPUT,
      ERROR_CODES.MISSING_REQUIRED_FIELD,
    ].includes(code as any)) {
      return 'validation'
    }

    return 'system'
  }

  // エラー重要度の推測
  private static inferErrorSeverity(code: string): ErrorSeverity {
    const criticalCodes = [
      ERROR_CODES.DATABASE_ERROR,
      ERROR_CODES.AUTHENTICATION_ERROR,
      ERROR_CODES.CONFIGURATION_ERROR,
    ]

    const highCodes = [
      ERROR_CODES.CONNECTION_FAILED,
      ERROR_CODES.SESSION_EXPIRED,
      ERROR_CODES.NETWORK_ERROR,
    ]

    const lowCodes = [
      ERROR_CODES.INSUFFICIENT_FUNDS,
      ERROR_CODES.TRAINER_BUSY,
      ERROR_CODES.VALIDATION_ERROR,
    ]

    if (criticalCodes.includes(code as any)) return 'critical'
    if (highCodes.includes(code as any)) return 'high'
    if (lowCodes.includes(code as any)) return 'low'

    return 'medium'
  }

  // リトライ可能かの判定
  private static isRetryable(code: string): boolean {
    const retryableCodes = [
      ERROR_CODES.NETWORK_ERROR,
      ERROR_CODES.TIMEOUT_ERROR,
      ERROR_CODES.CONNECTION_FAILED,
      ERROR_CODES.DATABASE_ERROR,
    ]

    return retryableCodes.includes(code as any)
  }

  // エラーログ出力
  private static logError(error: GameError): void {
    if (ERRORS.LOG_TO_CONSOLE) {
      const logMethod = error.severity === 'critical' ? 'error' :
                        error.severity === 'high' ? 'warn' :
                        'log'

      console[logMethod]('🚨 GameError:', {
        code: error.code,
        message: error.message,
        severity: error.severity,
        category: error.category,
        context: error.context,
        timestamp: error.timestamp,
        ...(ERRORS.SHOW_STACK_TRACE && { stack: error.stack }),
      })
    }
  }

  // エラー履歴に記録
  private static recordError(error: GameError): void {
    this.errorHistory.unshift(error)
    
    // 履歴の上限管理
    if (this.errorHistory.length > ERRORS.MAX_ERROR_HISTORY) {
      this.errorHistory = this.errorHistory.slice(0, ERRORS.MAX_ERROR_HISTORY)
    }
  }

  // エラー履歴の取得
  static getErrorHistory(): readonly GameError[] {
    return [...this.errorHistory]
  }

  // エラー統計の取得
  static getErrorStats() {
    const stats = this.errorHistory.reduce((acc, error) => {
      acc.total++
      acc.byCategory[error.category] = (acc.byCategory[error.category] || 0) + 1
      acc.bySeverity[error.severity] = (acc.bySeverity[error.severity] || 0) + 1
      acc.byCode[error.code] = (acc.byCode[error.code] || 0) + 1

      return acc
    }, {
      total: 0,
      byCategory: {} as Record<ErrorCategory, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      byCode: {} as Record<string, number>,
    })

    return stats
  }

  // エラー履歴のクリア
  static clearErrorHistory(): void {
    this.errorHistory = []
  }
}

// よく使用されるエラーファクトリー関数
export const createGameError = {
  insufficientFunds: (required: number, current: number) =>
    new GameError(
      `資金不足: 必要 ₽${required.toLocaleString()}, 現在 ₽${current.toLocaleString()}`,
      ERROR_CODES.INSUFFICIENT_FUNDS,
      {
        severity: 'low',
        category: 'game',
        context: { required, current },
        userMessage: `資金が不足しています。₽${(required - current).toLocaleString()}必要です。`,
      }
    ),

  trainerBusy: (trainerId: string, currentActivity: string) =>
    new GameError(
      `Trainer ${trainerId} is busy with ${currentActivity}`,
      ERROR_CODES.TRAINER_BUSY,
      {
        severity: 'low',
        category: 'game',
        context: { trainerId, currentActivity },
        userMessage: 'トレーナーは現在他の作業中です',
      }
    ),

  networkError: (url: string, status?: number) =>
    new GameError(
      `Network request failed: ${url}${status ? ` (${status})` : ''}`,
      ERROR_CODES.NETWORK_ERROR,
      {
        severity: 'high',
        category: 'api',
        context: { url, status },
        retryable: true,
      }
    ),

  databaseError: (operation: string, details?: any) =>
    new GameError(
      `Database operation failed: ${operation}`,
      ERROR_CODES.DATABASE_ERROR,
      {
        severity: 'critical',
        category: 'database',
        context: { operation, details },
        retryable: true,
      }
    ),

  authenticationError: (reason?: string) =>
    new GameError(
      `Authentication failed${reason ? `: ${reason}` : ''}`,
      ERROR_CODES.AUTHENTICATION_ERROR,
      {
        severity: 'high',
        category: 'auth',
        context: { reason },
      }
    ),
}

// React用のエラーハンドリングフック
export function useErrorHandler() {
  return {
    handleError: ErrorHandler.handle,
    createError: createGameError,
    getErrorHistory: ErrorHandler.getErrorHistory,
    getErrorStats: ErrorHandler.getErrorStats,
    clearHistory: ErrorHandler.clearErrorHistory,
  }
}

// 後方互換性のための関数
export class ErrorLogger {
  private static instance: ErrorLogger | null = null

  static getInstance(): ErrorLogger {
    if (!this.instance) {
      this.instance = new ErrorLogger()
    }
    return this.instance
  }

  static log(error: GameError): void {
    ErrorHandler.handle(error)
  }

  log(error: GameError): void {
    ErrorHandler.handle(error)
  }
}

export function mapSupabaseError(error: any, context: any): GameError {
  return ErrorHandler.handle(error, context)
}

export function executeWithRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  return fn().catch(async (error) => {
    if (retries > 0) {
      const gameError = ErrorHandler.handle(error)
      if (gameError.retryable) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        return executeWithRetry(fn, retries - 1)
      }
    }
    throw error
  })
}

export const createErrorHandler = ErrorHandler