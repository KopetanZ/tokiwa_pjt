'use client'

import { PixelButton } from '@/components/ui/PixelButton'
import { PixelProgressBar } from '@/components/ui/PixelProgressBar'
import { PixelCard } from '@/components/ui/PixelCard'
import { clsx } from 'clsx'
import { useState, useEffect } from 'react'

interface ExpeditionSummary {
  id: string
  trainer: {
    id: string
    name: string
    job: string
  }
  location: {
    id: number
    nameJa: string
    distanceLevel: number
    estimatedReturn: string
    backgroundImage?: string
  }
  status: string
  currentProgress: number
  expeditionMode: string
  hasInterventionRequired: boolean
  estimatedReward: number
  startedAt: string
}

interface ExpeditionCardProps {
  expedition: ExpeditionSummary
  onIntervene: (expeditionId: string) => void
  onRecall: (expeditionId: string) => void
}

export function ExpeditionCard({
  expedition,
  onIntervene,
  onRecall
}: ExpeditionCardProps) {
  const [timeRemaining, setTimeRemaining] = useState('')

  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date()
      const returnTime = new Date(expedition.location.estimatedReturn)
      const diff = returnTime.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining('帰還予定時刻を過ぎています')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      
      setTimeRemaining(`${hours}時間${minutes}分後帰還予定`)
    }

    updateTimeRemaining()
    const timer = setInterval(updateTimeRemaining, 60000) // 1分ごと更新

    return () => clearInterval(timer)
  }, [expedition.location.estimatedReturn])

  const getModeLabel = (mode: string) => {
    const modeLabels = {
      exploration: '探索重視',
      balanced: 'バランス',
      safe: '安全重視',
      aggressive: '積極的'
    }
    return modeLabels[mode as keyof typeof modeLabels] || mode
  }

  return (
    <PixelCard 
      title={`${expedition.trainer.name} の派遣`}
      variant={expedition.hasInterventionRequired ? 'danger' : 'default'}
    >
      <div className="space-y-4">
        {/* 緊急介入通知 */}
        {expedition.hasInterventionRequired && (
          <div className="bg-red-100 border border-red-600 p-3 space-y-2">
            <div className="font-pixel text-xs text-red-800 flex items-center">
              ⚠️ 緊急事態が発生しました！
            </div>
            <div className="font-pixel text-xs text-red-700">
              野生のピカチュウを発見。捕獲を試みますか？
            </div>
            <div className="flex gap-2">
              <PixelButton 
                size="sm" 
                variant="danger"
                onClick={() => onIntervene(expedition.id)}
              >
                介入する
              </PixelButton>
              <PixelButton size="sm" variant="secondary">
                自動判断
              </PixelButton>
            </div>
          </div>
        )}

        {/* 基本情報 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <div className="font-pixel text-xs text-retro-gb-mid">派遣先</div>
              <div className="font-pixel text-sm text-retro-gb-dark">
                {expedition.location.nameJa} (Lv.{expedition.location.distanceLevel})
              </div>
            </div>

            <div>
              <div className="font-pixel text-xs text-retro-gb-mid">トレーナー</div>
              <div className="font-pixel text-sm text-retro-gb-dark">
                {expedition.trainer.name} ({expedition.trainer.job})
              </div>
            </div>

            <div>
              <div className="font-pixel text-xs text-retro-gb-mid">派遣モード</div>
              <div className="font-pixel text-sm text-retro-gb-dark">
                {getModeLabel(expedition.expeditionMode)}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="font-pixel text-xs text-retro-gb-mid">進行状況</div>
              <PixelProgressBar
                value={expedition.currentProgress * 100}
                max={100}
                color="progress"
                animated={true}
                showLabel={true}
              />
            </div>

            <div>
              <div className="font-pixel text-xs text-retro-gb-mid">帰還予定</div>
              <div className="font-pixel text-xs text-retro-gb-dark">
                {timeRemaining}
              </div>
            </div>

            <div>
              <div className="font-pixel text-xs text-retro-gb-mid">予想報酬</div>
              <div className="font-pixel text-sm text-retro-gb-dark">
                ₽{expedition.estimatedReward.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* 進行状況の詳細 */}
        <div className="bg-retro-gb-light p-3 space-y-2">
          <div className="font-pixel text-xs text-retro-gb-dark">進行レポート</div>
          <div className="space-y-1">
            {expedition.currentProgress >= 0.2 && (
              <div className="font-pixel text-xs text-retro-gb-mid">
                ✓ 派遣先に到着しました
              </div>
            )}
            {expedition.currentProgress >= 0.4 && (
              <div className="font-pixel text-xs text-retro-gb-mid">
                ✓ ポケモンの気配を感じています
              </div>
            )}
            {expedition.currentProgress >= 0.6 && (
              <div className="font-pixel text-xs text-retro-gb-mid">
                ✓ コラッタを発見、捕獲に成功しました
              </div>
            )}
            {expedition.currentProgress >= 0.8 && (
              <div className="font-pixel text-xs text-retro-gb-mid">
                ✓ 探索を継続中...
              </div>
            )}
            {expedition.hasInterventionRequired && (
              <div className="font-pixel text-xs text-red-600">
                ⚠️ 重要な判断が必要です
              </div>
            )}
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex justify-between items-center pt-2 border-t border-retro-gb-mid">
          <div className="flex gap-2">
            <PixelButton 
              size="sm" 
              variant="secondary"
              onClick={() => onRecall(expedition.id)}
            >
              緊急呼び戻し
            </PixelButton>
            <PixelButton size="sm" variant="secondary">
              詳細表示
            </PixelButton>
          </div>

          <div className="font-pixel text-xs text-retro-gb-mid">
            開始: {new Date(expedition.startedAt).toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>
    </PixelCard>
  )
}