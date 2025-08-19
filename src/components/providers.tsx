'use client'

import { QueryProvider } from '@/providers/QueryProvider'
import { GameProvider } from '@/contexts/GameContext'
import { DatabaseErrorBoundary } from '@/components/DatabaseErrorBoundary'
import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <QueryProvider>
        <GameProvider>
          <DatabaseErrorBoundary>
            {children}
          </DatabaseErrorBoundary>
        </GameProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}