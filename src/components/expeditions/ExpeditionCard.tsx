'use client'

import { PixelButton } from '@/components/ui/PixelButton'
import { PixelProgressBar } from '@/components/ui/PixelProgressBar'
import { PixelCard } from '@/components/ui/PixelCard'
import { clsx } from 'clsx'
import { useState, useEffect } from 'react'

interface ExpeditionEvent {
  id: string
  type: 'pokemon_encounter' | 'rare_item' | 'danger' | 'weather' | 'trainer_encounter'
  message: string
  choices?: Array<{
    id: string
    text: string
    effect: string
    successRate?: number
  }>
  timestamp: Date
  resolved: boolean
}

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
  const [currentEvents, setCurrentEvents] = useState<ExpeditionEvent[]>([])
  const [progressEvents, setProgressEvents] = useState<string[]>([])
  const [realProgress, setRealProgress] = useState(expedition.currentProgress)

  // リアルタイムイベント生成
  const generateExpeditionEvent = (): ExpeditionEvent => {
    const eventTemplates = [
      {
        type: 'pokemon_encounter' as const,
        messages: [
          '野生のピカチュウが現れた！',
          'イーブイを発見！',
          'レアなポケモンの影を確認',
          'コラッタの群れに遭遇'
        ],
        choices: [
          { id: 'capture', text: '捕獲を試みる', effect: '+ポケモン', successRate: 70 },
          { id: 'observe', text: '観察する', effect: '+経験値', successRate: 90 },
          { id: 'avoid', text: '回避する', effect: '安全', successRate: 100 }
        ]
      },
      {
        type: 'rare_item' as const,
        messages: [
          '光る石を発見！',
          '古い技マシンを見つけた',
          '貴重なアイテムが落ちている',
          '珍しいキノコを発見'
        ],
        choices: [
          { id: 'take', text: '拾う', effect: '+アイテム', successRate: 80 },
          { id: 'examine', text: '詳しく調べる', effect: '+情報', successRate: 95 },
          { id: 'leave', text: '無視する', effect: '時間節約', successRate: 100 }
        ]
      },
      {
        type: 'danger' as const,
        messages: [
          '急な嵐が近づいている',
          '野生のポケモンが威嚇している',
          '道が崩れている',
          '濃い霧で視界が悪い'
        ],
        choices: [
          { id: 'push_through', text: '強行突破', effect: '+時間短縮', successRate: 50 },
          { id: 'wait', text: '待機する', effect: '安全確保', successRate: 85 },
          { id: 'retreat', text: '一時撤退', effect: '安全だが遅延', successRate: 100 }
        ]
      }
    ]

    const template = eventTemplates[Math.floor(Math.random() * eventTemplates.length)]
    const message = template.messages[Math.floor(Math.random() * template.messages.length)]

    return {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: template.type,
      message,
      choices: template.choices,
      timestamp: new Date(),
      resolved: false
    }
  }

  // 進行状況の自動更新とイベント生成
  useEffect(() => {
    if (expedition.status !== 'active') return

    const progressTimer = setInterval(() => {
      setRealProgress(prev => {
        const newProgress = Math.min(1.0, prev + 0.02) // 2%ずつ進行
        
        // 進行状況に応じたイベント生成確率
        if (Math.random() < 0.15 && currentEvents.length === 0) { // 15%の確率
          const newEvent = generateExpeditionEvent()
          setCurrentEvents([newEvent])
          console.log('新しい派遣イベント:', newEvent)
        }

        // 進行段階での自動イベント追加
        const progressThresholds = [0.25, 0.5, 0.75]
        const currentThreshold = progressThresholds.find(threshold => 
          prev < threshold && newProgress >= threshold
        )
        
        if (currentThreshold) {
          const progressMessages = {
            0.25: '派遣先に到着、探索を開始',
            0.5: 'ポケモンの痕跡を発見',
            0.75: '探索も終盤、成果をまとめています'
          }
          
          setProgressEvents(prev => [...prev, progressMessages[currentThreshold as keyof typeof progressMessages]])
        }

        return newProgress
      })
    }, 30000) // 30秒ごとに進行

    return () => clearInterval(progressTimer)
  }, [expedition.status, currentEvents.length])

  // 時間表示の更新
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

  // イベント選択処理
  const handleEventChoice = (eventId: string, choiceId: string) => {
    setCurrentEvents(prev => 
      prev.map(event => 
        event.id === eventId 
          ? { ...event, resolved: true }
          : event
      )
    )

    const event = currentEvents.find(e => e.id === eventId)
    const choice = event?.choices?.find(c => c.id === choiceId)
    
    if (choice) {
      const success = Math.random() * 100 < (choice.successRate || 50)
      const resultMessage = success 
        ? `${choice.text}: 成功！ ${choice.effect}`
        : `${choice.text}: 失敗...`
      
      setProgressEvents(prev => [...prev, resultMessage])
      console.log('イベント選択結果:', { choice: choice.text, success, effect: choice.effect })
    }

    // イベントを数秒後に削除
    setTimeout(() => {
      setCurrentEvents(prev => prev.filter(e => e.id !== eventId))
    }, 3000)
  }

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
        {/* リアルタイムイベント */}
        {currentEvents.map(event => (
          <div key={event.id} className={clsx(
            "border p-3 space-y-2",
            event.type === 'danger' ? 'bg-red-100 border-red-600' :
            event.type === 'pokemon_encounter' ? 'bg-yellow-100 border-yellow-600' :
            'bg-blue-100 border-blue-600'
          )}>
            <div className={clsx(
              "font-pixel text-xs flex items-center",
              event.type === 'danger' ? 'text-red-800' :
              event.type === 'pokemon_encounter' ? 'text-yellow-800' :
              'text-blue-800'
            )}>
              {event.type === 'danger' ? '⚠️' : event.type === 'pokemon_encounter' ? '🎯' : '✨'} {event.message}
            </div>
            
            {!event.resolved && event.choices && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {event.choices.map(choice => (
                  <PixelButton
                    key={choice.id}
                    size="sm"
                    variant={choice.successRate && choice.successRate > 80 ? 'primary' : 'secondary'}
                    onClick={() => handleEventChoice(event.id, choice.id)}
                    className="text-xs"
                  >
                    {choice.text}
                    <br />
                    <span className="text-xs opacity-75">
                      {choice.successRate}% | {choice.effect}
                    </span>
                  </PixelButton>
                ))}
              </div>
            )}
            
            {event.resolved && (
              <div className="font-pixel text-xs text-green-600">
                ✓ 選択完了 - 結果を処理中...
              </div>
            )}
          </div>
        ))}

        {/* 従来の緊急介入通知（互換性のため残す） */}
        {expedition.hasInterventionRequired && currentEvents.length === 0 && (
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
                value={realProgress * 100}
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

        {/* リアルタイム進行状況の詳細 */}
        <div className="bg-retro-gb-light p-3 space-y-2">
          <div className="font-pixel text-xs text-retro-gb-dark">リアルタイム進行レポート</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {progressEvents.length > 0 ? (
              progressEvents.map((event, index) => (
                <div key={index} className="font-pixel text-xs text-retro-gb-mid">
                  ✓ {event}
                </div>
              ))
            ) : (
              <div className="font-pixel text-xs text-retro-gb-mid">
                待機中...
              </div>
            )}
            
            {/* リアルタイム進行に基づく標準イベント */}
            {realProgress >= 0.25 && (
              <div className="font-pixel text-xs text-retro-gb-mid">
                ✓ 派遣先に到着、本格的な探索を開始
              </div>
            )}
            {realProgress >= 0.5 && (
              <div className="font-pixel text-xs text-retro-gb-mid">
                ✓ 中間地点到達、順調に進行中
              </div>
            )}
            {realProgress >= 0.75 && (
              <div className="font-pixel text-xs text-retro-gb-mid">
                ✓ 最終段階、帰還準備を開始
              </div>
            )}
            {realProgress >= 0.95 && (
              <div className="font-pixel text-xs text-green-600">
                ✓ もうすぐ帰還、成果をまとめています
              </div>
            )}
            {currentEvents.length > 0 && (
              <div className="font-pixel text-xs text-orange-600">
                ⚠️ 現在、判断が必要な状況が発生中
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