'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
  errorCount: number
  lastErrorTime: number
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  maxErrors?: number
  resetTimeoutMs?: number
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: NodeJS.Timeout | null = null
  private errorCountResetId: NodeJS.Timeout | null = null
  
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { 
      hasError: false, 
      errorCount: 0, 
      lastErrorTime: 0 
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const now = Date.now()
    return { 
      hasError: true, 
      error,
      lastErrorTime: now
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const now = Date.now()
    const timeSinceLastError = now - this.state.lastErrorTime
    const newErrorCount = timeSinceLastError < 5000 ? this.state.errorCount + 1 : 1
    
    console.error('🚨 ErrorBoundary caught an error:', error)
    console.error('📍 Error Info:', errorInfo)
    console.error('🔢 Error count:', newErrorCount)
    
    this.setState({
      hasError: true,
      error,
      errorInfo,
      errorCount: newErrorCount,
      lastErrorTime: now
    })

    // Clear existing timeouts
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
    if (this.errorCountResetId) {
      clearTimeout(this.errorCountResetId)
    }

    // AuthProvider無限ループの特別処理
    if (error.message && error.message.includes('useAuthProvider must be used within an AuthProvider')) {
      console.warn('⚠️ AuthProvider context error caught, attempting recovery')
      
      // すぐにリセットして無限ループを防ぐ
      this.resetTimeoutId = setTimeout(() => {
        console.log('🔄 Auto-resetting ErrorBoundary for AuthProvider error')
        this.setState({ 
          hasError: false, 
          error: undefined, 
          errorInfo: undefined 
        })
      }, 100) // 短い遅延でリセット
      
      return
    }

    // 入力関連のエラー処理
    if (error.message && (
      error.message.includes('input') || 
      error.message.includes('value') || 
      error.message.includes('target') ||
      error.message.includes('sanitize')
    )) {
      console.warn('⚠️ Input-related error caught by ErrorBoundary:', error.message)
      
      this.resetTimeoutId = setTimeout(() => {
        console.log('🔄 Auto-resetting ErrorBoundary for input error')
        this.setState({ 
          hasError: false, 
          error: undefined, 
          errorInfo: undefined 
        })
      }, 2000)
      
      return
    }

    // エラー数が多い場合の処理
    const maxErrors = this.props.maxErrors || 5
    if (newErrorCount >= maxErrors) {
      console.error('🚨 Too many errors, forcing page reload')
      // 無限ループを防ぐためにページをリロード
      window.location.reload()
      return
    }

    // 通常のエラーは少し長めの遅延でリセット
    const resetTimeout = this.props.resetTimeoutMs || 5000
    this.resetTimeoutId = setTimeout(() => {
      console.log('🔄 Auto-resetting ErrorBoundary after timeout')
      this.setState({ 
        hasError: false, 
        error: undefined, 
        errorInfo: undefined 
      })
    }, resetTimeout)
    
    // エラー数リセットタイマー
    this.errorCountResetId = setTimeout(() => {
      this.setState(prevState => ({
        ...prevState,
        errorCount: 0
      }))
    }, 30000) // 30秒でエラー数リセット
  }

  render() {
    if (this.state.hasError) {
      // カスタムフォールバックがある場合は使用
      if (this.props.fallback) {
        return this.props.fallback
      }

      // デフォルトのエラー表示
      return (
        <div className="p-6 text-center space-y-4 bg-red-50 border-2 border-red-300 rounded">
          <div className="font-pixel text-lg text-red-800">
            ⚠️ エラーが発生しました
          </div>
          <div className="font-pixel text-sm text-red-600">
            アプリケーションで問題が発生しました。
            <br />
            ページを再読み込みしてお試しください。
          </div>
          <div className="space-y-2">
            <button
              onClick={() => {
                if (this.resetTimeoutId) clearTimeout(this.resetTimeoutId)
                if (this.errorCountResetId) clearTimeout(this.errorCountResetId)
                this.setState({ 
                  hasError: false, 
                  error: undefined, 
                  errorInfo: undefined,
                  errorCount: 0
                })
              }}
              className="font-pixel text-xs px-4 py-2 bg-red-200 hover:bg-red-300 border-2 border-red-400 text-red-800 rounded transition-colors"
            >
              🔄 再試行
            </button>
            <button
              onClick={() => window.location.reload()}
              className="font-pixel text-xs px-4 py-2 bg-yellow-200 hover:bg-yellow-300 border-2 border-yellow-400 text-yellow-800 rounded transition-colors ml-2"
            >
              🔄 ページ再読み込み
            </button>
          </div>
          {this.state.errorCount > 1 && (
            <div className="text-xs text-orange-600 font-pixel">
              ⚠️ 連続エラー: {this.state.errorCount}回
            </div>
          )}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="text-left text-xs text-gray-600 mt-4">
              <summary className="cursor-pointer font-pixel">開発者情報</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {this.state.error.toString()}
              </pre>
              {this.state.errorInfo && (
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
  
  componentWillUnmount() {
    // コンポーネントがアンマウントされる時にタイマーをクリア
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
    if (this.errorCountResetId) {
      clearTimeout(this.errorCountResetId)
    }
  }
}