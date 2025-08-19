'use client'

import { useState, useEffect } from 'react'
import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { ErrorLogger, DatabaseError, ErrorType, ErrorSeverity } from '@/lib/error-handling'
import { useAuth } from '@/contexts/GameContext'

interface ErrorMonitorProps {
  isVisible: boolean
  onClose: () => void
}

export function ErrorMonitor({ isVisible, onClose }: ErrorMonitorProps) {
  const [errors, setErrors] = useState<DatabaseError[]>([])
  const [stats, setStats] = useState<any>(null)
  const [filter, setFilter] = useState<{
    type?: ErrorType
    severity?: ErrorSeverity
  }>({})
  
  const { isMockMode } = useAuth()

  useEffect(() => {
    if (isVisible) {
      loadErrors()
      const interval = setInterval(loadErrors, 5000) // 5秒ごとに更新
      return () => clearInterval(interval)
    }
  }, [isVisible, filter])

  const loadErrors = () => {
    const errorLogger = ErrorLogger.getInstance()
    const allErrors = errorLogger.getRecentErrors(100)
    
    let filteredErrors = allErrors
    if (filter.type) {
      filteredErrors = filteredErrors.filter(e => e.type === filter.type)
    }
    if (filter.severity) {
      filteredErrors = filteredErrors.filter(e => e.severity === filter.severity)
    }
    
    setErrors(filteredErrors)
    setStats(errorLogger.getErrorStats())
  }

  const clearErrors = () => {
    ErrorLogger.getInstance().clearErrorLog()
    loadErrors()
  }

  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.LOW: return 'text-green-600'
      case ErrorSeverity.MEDIUM: return 'text-yellow-600'
      case ErrorSeverity.HIGH: return 'text-orange-600'
      case ErrorSeverity.CRITICAL: return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getSeverityBg = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.LOW: return 'bg-green-100'
      case ErrorSeverity.MEDIUM: return 'bg-yellow-100'
      case ErrorSeverity.HIGH: return 'bg-orange-100'
      case ErrorSeverity.CRITICAL: return 'bg-red-100'
      default: return 'bg-gray-100'
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <PixelCard>
          <div className="p-6">
            {/* ヘッダー */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="font-pixel text-lg text-retro-gb-dark">
                  🔍 エラーモニター
                </h2>
                <p className="font-pixel text-xs text-retro-gb-mid">
                  {isMockMode ? 'モックモード' : 'リアルモード'} - システムエラーの監視と分析
                </p>
              </div>
              <div className="flex space-x-2">
                <PixelButton size="sm" variant="secondary" onClick={clearErrors}>
                  ログクリア
                </PixelButton>
                <PixelButton size="sm" variant="secondary" onClick={onClose}>
                  閉じる
                </PixelButton>
              </div>
            </div>

            {/* 統計情報 */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="font-pixel text-lg text-retro-gb-dark">{stats.total}</div>
                  <div className="font-pixel text-xs text-retro-gb-mid">総エラー数</div>
                </div>
                <div className="text-center">
                  <div className="font-pixel text-lg text-red-600">
                    {stats.bySeverity[ErrorSeverity.CRITICAL] || 0}
                  </div>
                  <div className="font-pixel text-xs text-retro-gb-mid">クリティカル</div>
                </div>
                <div className="text-center">
                  <div className="font-pixel text-lg text-orange-600">
                    {stats.bySeverity[ErrorSeverity.HIGH] || 0}
                  </div>
                  <div className="font-pixel text-xs text-retro-gb-mid">重要</div>
                </div>
                <div className="text-center">
                  <div className="font-pixel text-lg text-green-600">
                    {stats.bySeverity[ErrorSeverity.LOW] || 0}
                  </div>
                  <div className="font-pixel text-xs text-retro-gb-mid">軽微</div>
                </div>
              </div>
            )}

            {/* フィルター */}
            <div className="flex space-x-4 mb-4">
              <div>
                <label className="font-pixel text-xs text-retro-gb-mid">タイプ</label>
                <select
                  value={filter.type || ''}
                  onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value as ErrorType || undefined }))}
                  className="font-pixel text-xs bg-retro-gb-light border border-retro-gb-mid px-2 py-1 ml-2"
                >
                  <option value="">すべて</option>
                  {Object.values(ErrorType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-pixel text-xs text-retro-gb-mid">重要度</label>
                <select
                  value={filter.severity || ''}
                  onChange={(e) => setFilter(prev => ({ ...prev, severity: e.target.value as ErrorSeverity || undefined }))}
                  className="font-pixel text-xs bg-retro-gb-light border border-retro-gb-mid px-2 py-1 ml-2"
                >
                  <option value="">すべて</option>
                  {Object.values(ErrorSeverity).map(severity => (
                    <option key={severity} value={severity}>{severity}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* エラーリスト */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {errors.length === 0 ? (
                <div className="text-center py-8">
                  <div className="font-pixel text-sm text-retro-gb-mid">
                    {filter.type || filter.severity ? 'フィルター条件に一致するエラーがありません' : 'エラーはありません'}
                  </div>
                </div>
              ) : (
                errors.map((error, index) => (
                  <div key={index} className={`border p-3 ${getSeverityBg(error.severity)}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`font-pixel text-sm font-bold ${getSeverityColor(error.severity)}`}>
                          {error.severity.toUpperCase()}
                        </span>
                        <span className="font-pixel text-xs text-gray-600">
                          {error.type}
                        </span>
                        {error.retryable && (
                          <span className="font-pixel text-xs bg-blue-200 text-blue-800 px-2 py-1">
                            RETRY
                          </span>
                        )}
                        {error.recoverable && (
                          <span className="font-pixel text-xs bg-green-200 text-green-800 px-2 py-1">
                            RECOVERABLE
                          </span>
                        )}
                      </div>
                      <div className="font-pixel text-xs text-gray-500">
                        {error.timestamp.toLocaleString('ja-JP')}
                      </div>
                    </div>
                    
                    <div className="font-pixel text-sm text-retro-gb-dark mb-2">
                      {error.userMessage}
                    </div>
                    
                    {error.context && (
                      <div className="font-pixel text-xs text-gray-600 mb-1">
                        操作: {error.context.operation}
                        {error.context.table && ` | テーブル: ${error.context.table}`}
                      </div>
                    )}
                    
                    <details className="font-pixel text-xs">
                      <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                        詳細情報
                      </summary>
                      <div className="mt-2 p-2 bg-gray-50 text-gray-700">
                        <div><strong>メッセージ:</strong> {error.message}</div>
                        {error.code && <div><strong>コード:</strong> {error.code}</div>}
                        {error.user && <div><strong>ユーザー:</strong> {error.user.id}</div>}
                      </div>
                    </details>
                  </div>
                ))
              )}
            </div>

            {/* フッター */}
            <div className="mt-4 pt-4 border-t border-retro-gb-mid">
              <div className="font-pixel text-xs text-retro-gb-mid text-center">
                エラーログは自動的に記録され、システムの改善に役立てられます
              </div>
            </div>
          </div>
        </PixelCard>
      </div>
    </div>
  )
}

// デバッグ用のエラーテスト関数
export function generateTestError(type: ErrorType, severity: ErrorSeverity) {
  const testError: DatabaseError = {
    type,
    severity,
    message: `Test error of type ${type} with severity ${severity}`,
    timestamp: new Date(),
    recoverable: Math.random() > 0.5,
    retryable: Math.random() > 0.5,
    userMessage: `これは${severity}レベルの${type}タイプのテストエラーです`,
    context: {
      operation: 'test_error_generation',
      table: 'test_table'
    }
  }
  
  ErrorLogger.getInstance().logError(testError)
}