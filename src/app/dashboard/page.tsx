'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { PixelProgressBar } from '@/components/ui/PixelProgressBar'
import { formatMoney } from '@/lib/utils'

export default function DashboardPage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="text-center space-y-2">
        <h1 className="font-pixel-large text-retro-gb-dark">
          {user.schoolName}
        </h1>
        <p className="font-pixel text-xs text-retro-gb-mid">
          館長: {user.guestName}
        </p>
      </div>

      {/* 概要カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 資金状況 */}
        <PixelCard title="スクール資金">
          <div className="space-y-3">
            <div className="text-center">
              <div className="font-pixel-large text-retro-gb-dark">
                {formatMoney(user.currentMoney)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-pixel text-xs">今月収入</span>
                <span className="font-pixel text-xs">+₽15,000</span>
              </div>
              <div className="flex justify-between">
                <span className="font-pixel text-xs">今月支出</span>
                <span className="font-pixel text-xs">-₽8,500</span>
              </div>
              <PixelProgressBar 
                value={65} 
                max={100} 
                color="exp"
                showLabel={false}
              />
            </div>
          </div>
        </PixelCard>

        {/* スクール評判 */}
        <PixelCard title="スクール評判">
          <div className="space-y-3">
            <div className="text-center">
              <div className="font-pixel-large text-retro-gb-dark">
                {user.totalReputation}
              </div>
              <div className="font-pixel text-xs text-retro-gb-mid">
                評判ポイント
              </div>
            </div>
            <PixelProgressBar 
              value={user.totalReputation} 
              max={1000} 
              color="hp"
              showLabel={true}
            />
          </div>
        </PixelCard>

        {/* 現在の活動 */}
        <PixelCard title="現在の活動">
          <div className="space-y-3">
            <div className="font-pixel text-xs text-retro-gb-dark">
              進行中の派遣: 2件
            </div>
            <div className="font-pixel text-xs text-retro-gb-dark">
              利用可能トレーナー: 3人
            </div>
            <div className="font-pixel text-xs text-retro-gb-dark">
              総ポケモン数: 8匹
            </div>
            <PixelButton size="sm" className="w-full">
              詳細を見る
            </PixelButton>
          </div>
        </PixelCard>
      </div>

      {/* クイックアクション */}
      <PixelCard title="クイックアクション">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <PixelButton size="sm">
            新しい派遣
          </PixelButton>
          <PixelButton size="sm" variant="secondary">
            トレーナー雇用
          </PixelButton>
          <PixelButton size="sm" variant="secondary">
            施設強化
          </PixelButton>
          <PixelButton size="sm" variant="secondary">
            ポケモン管理
          </PixelButton>
        </div>
      </PixelCard>

      {/* 最近の活動 */}
      <PixelCard title="最近の活動">
        <div className="space-y-3">
          {[
            { time: '2時間前', event: 'タケシが22番道路から帰還', result: 'ポッポ×1、₽800獲得' },
            { time: '4時間前', event: 'カスミがトキワの森へ出発', result: '予定時間: 6時間' },
            { time: '6時間前', event: 'タケシがレベルアップ', result: 'レンジャー Lv.3 → Lv.4' },
          ].map((activity, index) => (
            <div key={index} className="space-y-1 pb-2 border-b border-retro-gb-mid last:border-b-0">
              <div className="flex justify-between items-start">
                <span className="font-pixel text-xs text-retro-gb-dark flex-1">
                  {activity.event}
                </span>
                <span className="font-pixel text-xs text-retro-gb-mid">
                  {activity.time}
                </span>
              </div>
              <div className="font-pixel text-xs text-retro-gb-mid">
                {activity.result}
              </div>
            </div>
          ))}
        </div>
      </PixelCard>

      {/* 緊急通知（サンプル） */}
      <PixelCard title="緊急通知" variant="danger">
        <div className="space-y-2">
          <div className="font-pixel text-xs text-red-800">
            ⚠️ カスミが野生のピカチュウを発見！
          </div>
          <div className="font-pixel text-xs text-red-700">
            捕獲を試みますか？（残り時間: 25秒）
          </div>
          <div className="flex gap-2">
            <PixelButton size="sm" variant="danger">
              捕獲する
            </PixelButton>
            <PixelButton size="sm" variant="secondary">
              見逃す
            </PixelButton>
          </div>
        </div>
      </PixelCard>
    </div>
  )
}