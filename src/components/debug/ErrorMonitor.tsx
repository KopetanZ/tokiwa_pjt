'use client'

import { useState, useEffect } from 'react'
import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { ErrorLogger, GameError, ErrorCategory, ErrorSeverity } from '@/lib/unified-error-handling'
import { useAuth } from '@/contexts/GameContext'

interface ErrorMonitorProps {
  isVisible: boolean
  onClose: () => void
}

export function ErrorMonitor({ isVisible, onClose }: ErrorMonitorProps) {
  const [errors, setErrors] = useState<GameError[]>([])
  const [stats, setStats] = useState<any>(null)
  const [filter, setFilter] = useState<{
    type?: ErrorCategory
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
      filteredErrors = filteredErrors.filter(e => e.category === filter.type)
    }
    if (filter.severity) {
      filteredErrors = filteredErrors.filter(e => e.severity === filter.severity)
    }
    
    setErrors(filteredErrors)
    // TODO: Implement getErrorStats method or use ErrorHandler.getErrorStats()
    setStats({ total: filteredErrors.length, critical: 0, high: 0, medium: 0, low: 0 })
  }

  const clearErrors = () => {
    ErrorLogger.getInstance().clearErrors()
    loadErrors()
  }

  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'low': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'high': return 'text-orange-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getSeverityBg = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'low': return 'bg-green-100'
      case 'medium': return 'bg-yellow-100'
      case 'high': return 'bg-orange-100'
      case 'critical': return 'bg-red-100'
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
                    {stats.bySeverity?.critical || 0}
                  </div>
                  <div className="font-pixel text-xs text-retro-gb-mid">クリティカル</div>
                </div>
                <div className="text-center">
                  <div className="font-pixel text-lg text-orange-600">
                    {stats.bySeverity?.high || 0}
                  </div>
                  <div className="font-pixel text-xs text-retro-gb-mid">重要</div>
                </div>
                <div className="text-center">
                  <div className="font-pixel text-lg text-green-600">
                    {stats.bySeverity?.low || 0}
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
                  onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value as ErrorCategory || undefined }))}
                  className="font-pixel text-xs bg-retro-gb-light border border-retro-gb-mid px-2 py-1 ml-2"
                >
                  <option value="">すべて</option>
                  {['auth', 'database', 'network', 'game', 'validation', 'system'].map(type => (
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
                  {['low', 'medium', 'high', 'critical'].map(severity => (
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
                          {error.category}
                        </span>
                        {error.retryable && (
                          <span className="font-pixel text-xs bg-blue-200 text-blue-800 px-2 py-1">
                            RETRY
                          </span>
                        )}
                        {error.retryable && (
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
                        {error.context?.user && <div><strong>ユーザー:</strong> {error.context.user.id}</div>}
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
export function generateTestError(category: ErrorCategory, severity: ErrorSeverity) {
  const testError = new GameError(
    `テストエラー: ${category} - ${severity}`,
    `TEST_${category.toUpperCase()}_${severity.toUpperCase()}`,
    {
      severity,
      category,
      context: {
        function: 'generateTestError',
        testMode: true
      }
    }
  )
  
  ErrorLogger.getInstance().log(testError)
}