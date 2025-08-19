'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { ThemeProvider } from './ThemeProvider'
import { AuthProvider } from './AuthProvider'
import { ToastProvider } from './ToastProvider'
import { GameProvider } from '@/contexts/GameContext'

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

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <GameProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </GameProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}