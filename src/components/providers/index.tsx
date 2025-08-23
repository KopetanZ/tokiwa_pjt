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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <DataSystemProvider config={dataSystemConfig}>
          <GameProvider>
            <AuthProvider>
              <MusicProvider>
                <ToastProvider>
                  <DataBridge />
                  {children}
                </ToastProvider>
              </MusicProvider>
            </AuthProvider>
          </GameProvider>
        </DataSystemProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}