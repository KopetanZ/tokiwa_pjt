'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { formatMoney } from '@/lib/utils'
import { useState, useEffect } from 'react'

export function StatusBar() {
  const { user } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!user) return null

  return (
    <div className="bg-retro-gb-mid text-retro-gb-lightest border-b-2 border-retro-gb-dark">
      <div className="flex items-center justify-between px-4 py-2">
        {/* 左側：スクール情報 */}
        <div className="flex items-center space-x-4">
          <div className="font-pixel text-xs">
            {user.schoolName}
          </div>
          <div className="font-pixel text-xs opacity-80">
            館長: {user.guestName}
          </div>
        </div>

        {/* 中央：ステータス */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="font-pixel text-xs">💰</span>
            <span className="font-pixel text-xs">
              {formatMoney(user.currentMoney)}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="font-pixel text-xs">⭐</span>
            <span className="font-pixel text-xs">
              {user.totalReputation}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-pixel text-xs">👥</span>
            <span className="font-pixel text-xs">3/10</span>
          </div>
        </div>

        {/* 右側：時刻 */}
        <div className="font-pixel text-xs">
          {currentTime.toLocaleTimeString('ja-JP', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  )
}