/**
 * 後方互換性のためのエラーハンドリング
 * 新しい統一エラーハンドリングシステムに委譲
 */

// 新しいシステムからのエクスポート
export {
  GameError,
  ErrorHandler,
  ERROR_CODES,
  createGameError,
  useErrorHandler,
  ErrorLogger,
  mapSupabaseError,
  executeWithRetry,
  createErrorHandler,
  type ErrorCode,
  type ErrorCategory,
} from './unified-error-handling'

// 後方互換性のためのエイリアス
import { ERROR_CODES, ErrorHandler, GameError } from './unified-error-handling'

// 旧システムとの互換性
export enum ErrorType {
  DATABASE_CONNECTION = 'DATABASE_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  NETWORK = 'NETWORK_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_EXCEEDED',
  DATA_INTEGRITY = 'CONSTRAINT_VIOLATION',
  TRANSACTION = 'DATABASE_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR'
}

// 後方互換性のための関数
export function handleGameError(error: unknown): GameError {
  return ErrorHandler.handle(error)
}

// 旧システムとの互換性のためのEnum
export const ErrorSeverity = {
  LOW: 'low' as const,
  MEDIUM: 'medium' as const,
  HIGH: 'high' as const,
  CRITICAL: 'critical' as const,
}

// 旧DatabaseError型との互換性
export interface DatabaseError {
  type: ErrorType
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  context?: Record<string, any>
  timestamp: Date
  retryable: boolean
  // 追加プロパティ（互換性のため）
  recoverable?: boolean
  userMessage?: string
  code?: string
  user?: any
}