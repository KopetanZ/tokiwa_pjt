'use client'

import { useState, useEffect } from 'react'
import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { PixelProgressBar } from '@/components/ui/PixelProgressBar'
import { ExpeditionProgress, realtimeSystem } from '@/lib/realtime'
import { formatMoney } from '@/lib/utils'
import { clsx } from 'clsx'

interface LiveExpeditionCardProps {
  expeditionId: string
  trainerName: string
  destination: string
  onInterventionOpen: () => void
}

export function LiveExpeditionCard({ 
  expeditionId, 
  trainerName, 
  destination, 
  onInterventionOpen 
}: LiveExpeditionCardProps) {
  const [progress, setProgress] = useState<ExpeditionProgress | null>(null)
  const [hasNewEvent, setHasNewEvent] = useState(false)
  const [recentEvents, setRecentEvents] = useState<string[]>([])

  useEffect(() => {
    // 初期状態取得
    const initialProgress = realtimeSystem.getProgress(expeditionId)
    if (initialProgress) {
      setProgress(initialProgress)
    }

    const handleProgressUpdate = (eventType: string, data: ExpeditionProgress) => {
      if (eventType === 'progress_update') {
        setProgress(data)
      }
    }

    const handleInterventionRequired = (eventType: string, data: any) => {
      if (eventType === 'intervention_required') {
        setHasNewEvent(true)
        setRecentEvents(prev => [
          `${data.data.description}`,
          ...prev.slice(0, 2)
        ])
      }
    }

    const handleResponseResult = (eventType: string, data: any) => {
      if (eventType === 'response_result') {
        setHasNewEvent(false)
        setRecentEvents(prev => [
          `${data.success ? '✓' : '✗'} ${data.event.data.description}`,
          ...prev.slice(0, 2)
        ])
      }
    }

    const handleAutoResolved = (eventType: string, data: any) => {
      if (eventType === 'auto_resolved') {
        setHasNewEvent(false)
        setRecentEvents(prev => [
          `⚡ ${data.event.data.description} (自動解決)`,
          ...prev.slice(0, 2)
        ])
      }
    }

    const handleExpeditionComplete = (eventType: string, data: any) => {
      if (eventType === 'expedition_complete') {
        setRecentEvents(prev => [
          `🎉 派遣完了！報酬: ${formatMoney(data.finalReward)}`,
          ...prev.slice(0, 2)
        ])
      }
    }

    realtimeSystem.addEventListener(expeditionId, handleProgressUpdate)
    realtimeSystem.addEventListener(expeditionId, handleInterventionRequired)
    realtimeSystem.addEventListener(expeditionId, handleResponseResult)
    realtimeSystem.addEventListener(expeditionId, handleAutoResolved)
    realtimeSystem.addEventListener(expeditionId, handleExpeditionComplete)

    return () => {
      realtimeSystem.removeEventListener(expeditionId, handleProgressUpdate)
      realtimeSystem.removeEventListener(expeditionId, handleInterventionRequired)
      realtimeSystem.removeEventListener(expeditionId, handleResponseResult)
      realtimeSystem.removeEventListener(expeditionId, handleAutoResolved)
      realtimeSystem.removeEventListener(expeditionId, handleExpeditionComplete)
    }
  }, [expeditionId])

  if (!progress) {
    return (
      <PixelCard>
        <div className="text-center py-4">
          <div className="font-pixel text-xs text-retro-gb-mid">
            派遣データを読み込み中...
          </div>
        </div>
      </PixelCard>
    )
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'preparation': return '🎒'
      case 'exploration': return '🔍'
      case 'encounter': return '⚔️'
      case 'collection': return '💰'
      case 'return': return '🏠'
      default: return '❓'
    }
  }

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'preparation': return '準備中'
      case 'exploration': return '探索中'
      case 'encounter': return '遭遇中'
      case 'collection': return '収集中'
      case 'return': return '帰還中'
      default: return '不明'
    }
  }

  const getRiskColor = (riskLevel: number) => {
    if (riskLevel >= 3) return 'text-red-600'
    if (riskLevel >= 2) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className={clsx(
      'live-expedition-card',
      hasNewEvent && 'live-expedition-card--alert'
    )}>
      <PixelCard>
        <div className="space-y-4">
          {/* ヘッダー */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-pixel text-sm text-retro-gb-dark">
                {trainerName}
              </h3>
              <p className="font-pixel text-xs text-retro-gb-mid">
                {destination}へ派遣中
              </p>
            </div>
            
            {hasNewEvent && (
              <div className="relative">
                <PixelButton
                  size="sm"
                  onClick={onInterventionOpen}
                  className="animate-pulse"
                >
                  介入要求
                </PixelButton>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
              </div>
            )}
          </div>

          {/* 進行状況 */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="font-pixel text-xs text-retro-gb-mid">
                {getStageIcon(progress.currentStage)} {getStageLabel(progress.currentStage)}
              </span>
              <span className="font-pixel text-xs text-retro-gb-mid">
                {progress.progress.toFixed(1)}%
              </span>
            </div>
            <PixelProgressBar
              value={progress.progress}
              max={100}
              color="exp"
              showLabel={false}
            />
          </div>

          {/* 時間情報 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="font-pixel text-xs text-retro-gb-mid">経過時間</div>
              <div className="font-pixel text-sm text-retro-gb-dark">
                {formatTime(progress.timeElapsed)}
              </div>
            </div>
            <div>
              <div className="font-pixel text-xs text-retro-gb-mid">残り時間</div>
              <div className="font-pixel text-sm text-retro-gb-dark">
                {formatTime(progress.timeRemaining)}
              </div>
            </div>
          </div>

          {/* ステータス */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="font-pixel text-xs text-retro-gb-mid">イベント</div>
              <div className="font-pixel text-sm text-retro-gb-dark">
                {progress.events.length}
              </div>
            </div>
            <div className="text-center">
              <div className="font-pixel text-xs text-retro-gb-mid">成功率</div>
              <div className="font-pixel text-sm text-green-600">
                {progress.successProbability}%
              </div>
            </div>
            <div className="text-center">
              <div className="font-pixel text-xs text-retro-gb-mid">リスク</div>
              <div className={`font-pixel text-sm ${getRiskColor(progress.riskLevel)}`}>
                {progress.riskLevel.toFixed(1)}
              </div>
            </div>
          </div>

          {/* 現在の報酬倍率 */}
          <div>
            <div className="font-pixel text-xs text-retro-gb-mid">予想報酬</div>
            <div className="font-pixel text-sm text-retro-gb-dark">
              {formatMoney(Math.floor(1000 * progress.totalReward * (progress.successProbability / 100)))}
              <span className="text-retro-gb-mid"> (x{progress.totalReward.toFixed(2)})</span>
            </div>
          </div>

          {/* 最近のイベント */}
          {recentEvents.length > 0 && (
            <div>
              <div className="font-pixel text-xs text-retro-gb-mid mb-2">
                最近のイベント
              </div>
              <div className="space-y-1">
                {recentEvents.slice(0, 3).map((event, index) => (
                  <div 
                    key={index}
                    className="font-pixel text-xs bg-retro-gb-light border border-retro-gb-mid p-2"
                  >
                    {event}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 操作ボタン */}
          <div className="flex space-x-2">
            <PixelButton
              size="sm"
              variant="secondary"
              onClick={() => {/* 詳細画面へ */}}
            >
              詳細
            </PixelButton>
            
            {!hasNewEvent && (
              <>
                <PixelButton
                  size="sm"
                  variant="secondary"
                  onClick={() => realtimeSystem.stopExpedition(expeditionId)}
                >
                  早期帰還
                </PixelButton>
                
                <PixelButton
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    if (confirm('この派遣をキャンセルしますか？部分報酬のみ受け取れます。')) {
                      realtimeSystem.cancelExpedition(expeditionId)
                    }
                  }}
                >
                  キャンセル
                </PixelButton>
              </>
            )}
          </div>
        </div>
      </PixelCard>
    </div>
  )
}