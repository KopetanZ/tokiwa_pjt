/**
 * エラーハンドリングフック
 * Reactコンポーネント用のエラー処理とフォールバック機能
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { dataSystemErrorHandler, ErrorDetails, RecoveryAction } from '@/lib/error-handling/DataSystemErrorHandler'

export interface ErrorState {
  hasError: boolean
  error: ErrorDetails | null
  recoveryActions: RecoveryAction[]
  requiresUserAction: boolean
  isRecovering: boolean
}

/**
 * エラーハンドリングフック
 */
export function useErrorHandling() {
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    recoveryActions: [],
    requiresUserAction: false,
    isRecovering: false
  })
  
  const [errorHistory, setErrorHistory] = useState<ErrorDetails[]>([])
  const retryCountRef = useRef(0)
  
  /**
   * エラーを処理
   */
  const handleError = useCallback(async (error: Error, context?: any) => {
    try {
      console.log('🔧 エラーハンドリング開始:', error.message)
      
      const result = await dataSystemErrorHandler.handleError(error, context)
      
      setErrorState({
        hasError: true,
        error: dataSystemErrorHandler.getErrorLog(1)[0] || null,
        recoveryActions: result.actions,
        requiresUserAction: result.requiresUserAction,
        isRecovering: false
      })
      
      // エラー履歴を更新
      const recentErrors = dataSystemErrorHandler.getErrorLog(10)
      setErrorHistory(recentErrors)
      
      return result
    } catch (handlingError) {
      console.error('❌ エラーハンドリング中にエラー:', handlingError)
      
      // フォールバックエラー状態
      setErrorState({
        hasError: true,
        error: {
          type: 'system',
          severity: 'critical',
          message: 'エラーハンドリングシステムに問題が発生しました',
          timestamp: new Date().toISOString()
        },
        recoveryActions: [],
        requiresUserAction: true,
        isRecovering: false
      })
      
      return {
        handled: false,
        recovered: false,
        actions: [],
        requiresUserAction: true
      }
    }
  }, [])
  
  /**
   * 復旧アクションを実行
   */
  const executeRecoveryAction = useCallback(async (actionId: string): Promise<boolean> => {
    const action = errorState.recoveryActions.find(a => a.id === actionId)
    if (!action) {
      console.error('❌ 復旧アクションが見つかりません:', actionId)
      return false
    }
    
    setErrorState(prev => ({ ...prev, isRecovering: true }))
    
    try {
      console.log('🔧 復旧アクション実行:', action.name)
      const success = await action.action()
      
      if (success) {
        console.log('✅ 復旧アクション成功:', action.name)
        setErrorState({
          hasError: false,
          error: null,
          recoveryActions: [],
          requiresUserAction: false,
          isRecovering: false
        })
        retryCountRef.current = 0
        return true
      } else {
        console.warn('⚠️ 復旧アクション失敗:', action.name)
        setErrorState(prev => ({ ...prev, isRecovering: false }))
        return false
      }
    } catch (recoveryError) {
      console.error('❌ 復旧アクション実行エラー:', recoveryError)
      setErrorState(prev => ({ ...prev, isRecovering: false }))
      return false
    }
  }, [errorState.recoveryActions])
  
  /**
   * エラー状態をクリア
   */
  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      recoveryActions: [],
      requiresUserAction: false,
      isRecovering: false
    })
    retryCountRef.current = 0
    console.log('🧹 エラー状態をクリアしました')
  }, [])
  
  /**
   * リトライ実行
   */
  const retry = useCallback(async (operation: () => Promise<any>, maxRetries: number = 3): Promise<any> => {
    if (retryCountRef.current >= maxRetries) {
      throw new Error(`最大リトライ回数(${maxRetries})に達しました`)
    }
    
    try {
      retryCountRef.current++
      console.log(`🔄 リトライ実行 ${retryCountRef.current}/${maxRetries}`)
      
      const result = await operation()
      retryCountRef.current = 0
      clearError()
      return result
    } catch (error) {
      if (retryCountRef.current < maxRetries) {
        // 短時間待ってからリトライ
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCountRef.current))
        return retry(operation, maxRetries)
      } else {
        // 最大リトライ回数に達した場合
        await handleError(error as Error)
        throw error
      }
    }
  }, [handleError, clearError])
  
  /**
   * セーフ実行（エラーをキャッチして処理）
   */
  const safeExecute = useCallback(async <T>(
    operation: () => Promise<T>,
    fallbackValue?: T,
    context?: any
  ): Promise<T | undefined> => {
    try {
      return await operation()
    } catch (error) {
      await handleError(error as Error, context)
      return fallbackValue
    }
  }, [handleError])
  
  /**
   * エラー境界として使用
   */
  const errorBoundary = useCallback((error: Error, errorInfo?: any) => {
    handleError(error, errorInfo)
  }, [handleError])
  
  /**
   * エラー統計を取得
   */
  const getErrorStatistics = useCallback(() => {
    return dataSystemErrorHandler.getErrorStatistics()
  }, [])
  
  /**
   * 特定タイプのエラー履歴を取得
   */
  const getErrorsByType = useCallback((type: ErrorDetails['type'], limit?: number) => {
    return dataSystemErrorHandler.getErrorsByType(type, limit)
  }, [])
  
  return {
    // エラー状態
    errorState,
    errorHistory,
    hasError: errorState.hasError,
    currentError: errorState.error,
    isRecovering: errorState.isRecovering,
    requiresUserAction: errorState.requiresUserAction,
    recoveryActions: errorState.recoveryActions,
    
    // エラー処理
    handleError,
    clearError,
    executeRecoveryAction,
    
    // ユーティリティ
    retry,
    safeExecute,
    errorBoundary,
    
    // 統計・履歴
    getErrorStatistics,
    getErrorsByType,
    
    // リトライ情報
    retryCount: retryCountRef.current
  }
}

/**
 * 自動エラー監視フック
 */
export function useErrorMonitor() {
  const { handleError } = useErrorHandling()
  
  useEffect(() => {
    // グローバルエラーハンドラー
    const handleGlobalError = (event: ErrorEvent) => {
      handleError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    }
    
    // 未処理のPromise拒否
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      handleError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        { reason: event.reason }
      )
    }
    
    window.addEventListener('error', handleGlobalError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    
    return () => {
      window.removeEventListener('error', handleGlobalError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [handleError])
  
  return { handleError }
}

/**
 * ネットワークエラー監視フック
 */
export function useNetworkErrorMonitor() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [networkErrors, setNetworkErrors] = useState<ErrorDetails[]>([])
  const { handleError } = useErrorHandling()
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      console.log('🌐 ネットワーク接続復旧')
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      console.warn('🚫 ネットワーク接続断')
      handleError(new Error('ネットワーク接続が失われました'), { type: 'network' })
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleError])
  
  // ネットワークエラーの履歴を更新
  useEffect(() => {
    const networkErrorHistory = dataSystemErrorHandler.getErrorsByType('network', 10)
    setNetworkErrors(networkErrorHistory)
  }, [isOnline])
  
  return {
    isOnline,
    networkErrors,
    connectionStatus: isOnline ? 'connected' : 'disconnected'
  }
}