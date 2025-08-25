'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // エラーが発生した場合の状態更新
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // エラーログ
    console.error('🚨 ErrorBoundary caught an error:', error)
    console.error('📍 Error Info:', errorInfo)
    
    this.setState({
      hasError: true,
      error,
      errorInfo
    })

    // 入力関連のエラーの場合は特別な処理
    if (error.message && (
      error.message.includes('input') || 
      error.message.includes('value') || 
      error.message.includes('target') ||
      error.message.includes('sanitize')
    )) {
      console.warn('⚠️ Input-related error caught by ErrorBoundary:', error.message)
      
      // 一定時間後にリセット
      setTimeout(() => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined })
      }, 3000)
    }
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
              onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
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
}