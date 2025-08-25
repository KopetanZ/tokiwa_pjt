'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { AuthProvider } from './AuthProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SimpleGameProvider } from '@/contexts/SimpleGameContext'

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

  // 簡素化: 過剰なデータシステム設定を削除

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
        <AuthProvider>
          <SimpleGameProvider>
            {children}
          </SimpleGameProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}