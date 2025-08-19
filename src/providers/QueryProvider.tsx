'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

// React Query設定
const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // デフォルトのstale time (5分)
        staleTime: 5 * 60 * 1000,
        // デフォルトのcache time (10分)
        gcTime: 10 * 60 * 1000,
        // エラー時の自動リトライ
        retry: (failureCount, error: any) => {
          // ネットワークエラーの場合は3回まで
          if (error?.message?.includes('network')) {
            return failureCount < 3
          }
          // 認証エラーの場合はリトライしない
          if (error?.status === 401) {
            return false
          }
          // その他は1回まで
          return failureCount < 1
        },
        // リトライの遅延
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // バックグラウンドでの自動再取得
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        refetchOnReconnect: true
      },
      mutations: {
        // ミューテーションのリトライ
        retry: (failureCount, error: any) => {
          // 認証エラーの場合はリトライしない
          if (error?.status === 401) {
            return false
          }
          // ネットワークエラーの場合は2回まで
          if (error?.message?.includes('network')) {
            return failureCount < 2
          }
          return false
        }
      }
    }
  })
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // クライアント毎にQueryClientを作成
  const [queryClient] = useState(() => createQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}