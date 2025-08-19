'use client'

import { useAuth } from '@/contexts/GameContext'
import { formatMoney } from '@/lib/utils'
import { useState, useEffect } from 'react'

export function StatusBar() {
  const { user, isMockMode } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 開発モードでは認証なしでも表示
  const isDevelopment = process.env.NODE_ENV === 'development'
  const displayUser = user || (isDevelopment ? { email: 'ゲストユーザー' } : null)
  
  if (!displayUser) return null

  return (
    <div className="bg-retro-gb-mid text-retro-gb-lightest border-b-2 border-retro-gb-dark">
      <div className="flex items-center justify-between px-4 py-2">
        {/* 左側：スクール情報 */}
        <div className="flex items-center space-x-4">
          <div className="font-pixel text-xs">
            トキワシティ訓練所
          </div>
          <div className="font-pixel text-xs opacity-80">
            館長: {displayUser.email || 'ゲスト'}
          </div>
        </div>

        {/* 中央：ステータス */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="font-pixel text-xs">💰</span>
            <span className="font-pixel text-xs">
              {formatMoney(50000)}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="font-pixel text-xs">⭐</span>
            <span className="font-pixel text-xs">
              0
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-pixel text-xs">👥</span>
            <span className="font-pixel text-xs">3/10</span>
          </div>
        </div>

        {/* 右側：時刻とモード表示 */}
        <div className="flex items-center space-x-3">
          {isMockMode && (
            <div className="flex items-center space-x-1 bg-yellow-400 text-yellow-900 px-2 py-1 rounded">
              <span className="font-pixel text-xs">🎮</span>
              <span className="font-pixel text-xs">DEV</span>
            </div>
          )}
          <div className="font-pixel text-xs">
            {currentTime.toLocaleTimeString('ja-JP', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </div>
    </div>
  )
}