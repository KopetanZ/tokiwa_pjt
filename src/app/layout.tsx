import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'トキワシティ訓練所',
  description: '初代ポケモン風の派遣型トレーナー育成シミュレーションゲーム',
  keywords: ['ポケモン', 'シミュレーション', 'レトロゲーム', 'ドット絵'],
  authors: [{ name: 'Tokiwa Trainer School Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#9BBD0F', // Game Boy green
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className={`${inter.className} font-pixel bg-retro-gb-lightest text-retro-gb-dark`}>
        <Providers>
          <div className="gameboy-container min-h-screen">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}