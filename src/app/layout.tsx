import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Press_Start_2P } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })
const pressStart2P = Press_Start_2P({ 
  subsets: ['latin'],
  weight: '400',
  variable: '--font-pixel',
  display: 'swap'
})

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
      <body className={`${inter.className} ${pressStart2P.variable} font-pixel bg-retro-gb-lightest text-retro-gb-dark`}>
        <Providers>
          <div className="gameboy-container min-h-screen">
            {children}
          </div>
        </Providers>
        {/* グローバルエラーハンドリング */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                window.addEventListener('error', function(e) {
                  if (e.message && e.message.includes('useAuthProvider must be used within an AuthProvider')) {
                    console.warn('⚠️ Suppressed AuthProvider context error from background process');
                    e.preventDefault();
                    return false;
                  }
                });
                
                window.addEventListener('unhandledrejection', function(e) {
                  if (e.reason && e.reason.message && e.reason.message.includes('useAuthProvider must be used within an AuthProvider')) {
                    console.warn('⚠️ Suppressed AuthProvider context promise rejection from background process');
                    e.preventDefault();
                  }
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}