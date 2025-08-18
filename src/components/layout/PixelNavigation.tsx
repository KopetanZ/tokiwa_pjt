'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

interface NavItem {
  href: string
  label: string
  icon: string
  badge?: number
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'ダッシュボード', icon: '🏠' },
  { href: '/dashboard/trainers', label: 'トレーナー', icon: '👨‍🏫', badge: 3 },
  { href: '/dashboard/expeditions', label: '派遣管理', icon: '🗺️', badge: 2 },
  { href: '/dashboard/pokemon', label: 'ポケモン', icon: '🎾' },
  { href: '/dashboard/facilities', label: '施設', icon: '🏢' },
  { href: '/dashboard/economy', label: '経済', icon: '💰' },
  { href: '/dashboard/analytics', label: '分析', icon: '📊' },
  { href: '/dashboard/events', label: 'イベント', icon: '🎪' },
  { href: '/dashboard/settings', label: '設定', icon: '⚙️' },
]

export function PixelNavigation() {
  const pathname = usePathname()

  return (
    <nav className="w-48 bg-retro-gb-light border-r-2 border-retro-gb-dark p-4">
      <div className="space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'block pixel-button w-full text-left relative',
                isActive 
                  ? 'bg-retro-gb-dark text-retro-gb-lightest' 
                  : 'bg-retro-gb-lightest text-retro-gb-dark hover:bg-retro-gb-mid'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{item.icon}</span>
                  <span className="font-pixel text-xs">{item.label}</span>
                </div>
                
                {item.badge && (
                  <div className="bg-retro-red text-white rounded-full w-4 h-4 flex items-center justify-center">
                    <span className="font-pixel text-xs">{item.badge}</span>
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </div>
      
      {/* フッター */}
      <div className="mt-8 pt-4 border-t border-retro-gb-mid">
        <div className="text-center space-y-2">
          <div className="font-pixel text-xs text-retro-gb-mid">
            Ver 1.0.0
          </div>
          <button className="font-pixel text-xs text-retro-gb-mid hover:text-retro-gb-dark">
            ログアウト
          </button>
        </div>
      </div>
    </nav>
  )
}