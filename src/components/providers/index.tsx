'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { ThemeProvider } from './ThemeProvider'
import { AuthProvider } from './AuthProvider'
import { ToastProvider } from './ToastProvider'
import { GameProvider } from '@/contexts/GameContext'
import { DataSystemProvider } from './DataSystemProvider'
import { MusicProvider } from './MusicProvider'
import { DataBridge } from '@/lib/data-bridge/DataBridge'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1分
            gcTime: 5 * 60 * 1000, // 5分 (React Query v5では cacheTime → gcTime)
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  // データシステムの設定
  const dataSystemConfig = {
    enableSync: false, // まずは同期機能を無効にして安全にテスト
    enableValidation: true,
    debug: process.env.NODE_ENV === 'development',
    unified: {
      autoSave: {
        enabled: true,
        interval: 5,
        onDataChange: true,
        onUserAction: false
      },
      backup: {
        enabled: true,
        maxBackups: 5,
        autoBackupInterval: 24,
        compressBackups: true
      },
      validation: {
        enabled: true,
        autoValidate: true,
        validationInterval: 15, // 15分間隔
        autoRepair: false // 自動修復は無効にして安全性を確保
      }
    }
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-retro-gb-lightest">
          <div className="text-center space-y-4 p-6">
            <div className="font-pixel-xl text-retro-gb-dark">
              トキワシティ訓練所
            </div>
            <div className="font-pixel text-red-600">
              ⚠️ アプリケーションエラーが発生しました
            </div>
            <div className="font-pixel text-sm text-retro-gb-mid">
              ページを再読み込みしてください
            </div>
            <button
              onClick={() => window.location.reload()}
              className="font-pixel px-4 py-2 bg-retro-gb-light border-2 border-retro-gb-mid hover:bg-retro-gb-mid transition-colors"
            >
              🔄 ページ再読み込み
            </button>
          </div>
        </div>
      }
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <DataSystemProvider config={dataSystemConfig}>
              <GameProvider>
                <MusicProvider>
                  <ToastProvider>
                    <DataBridge />
                    {children}
                  </ToastProvider>
                </MusicProvider>
              </GameProvider>
            </DataSystemProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}