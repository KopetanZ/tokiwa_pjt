'use client'

import { useState, useEffect } from 'react'
import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { PixelProgressBar } from '@/components/ui/PixelProgressBar'
import { ExpeditionEvent, PlayerResponse, realtimeSystem } from '@/lib/realtime'
import { clsx } from 'clsx'

interface InterventionPanelProps {
  expeditionId: string
  isVisible: boolean
  onClose: () => void
}

export function InterventionPanel({ expeditionId, isVisible, onClose }: InterventionPanelProps) {
  const [currentEvent, setCurrentEvent] = useState<ExpeditionEvent | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [isResponding, setIsResponding] = useState(false)
  const [lastResponse, setLastResponse] = useState<any>(null)

  useEffect(() => {
    if (!isVisible || !expeditionId) return

    const handleInterventionRequired = (eventType: string, data: ExpeditionEvent) => {
      if (eventType === 'intervention_required') {
        setCurrentEvent(data)
        setTimeRemaining(data.autoResolveTime)
        setLastResponse(null)
      }
    }

    const handleResponseResult = (eventType: string, data: any) => {
      if (eventType === 'response_result') {
        setLastResponse(data)
        setCurrentEvent(null)
        setTimeRemaining(0)
        
        // 3秒後に結果パネルを閉じる
        setTimeout(() => {
          setLastResponse(null)
        }, 3000)
      }
    }

    const handleAutoResolved = (eventType: string, data: any) => {
      if (eventType === 'auto_resolved') {
        setCurrentEvent(null)
        setTimeRemaining(0)
      }
    }

    realtimeSystem.addEventListener(expeditionId, handleInterventionRequired)
    realtimeSystem.addEventListener(expeditionId, handleResponseResult)
    realtimeSystem.addEventListener(expeditionId, handleAutoResolved)

    return () => {
      realtimeSystem.removeEventListener(expeditionId, handleInterventionRequired)
      realtimeSystem.removeEventListener(expeditionId, handleResponseResult)
      realtimeSystem.removeEventListener(expeditionId, handleAutoResolved)
    }
  }, [expeditionId, isVisible])

  useEffect(() => {
    if (timeRemaining <= 0) return

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setCurrentEvent(null)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeRemaining])

  const handleResponse = async (optionId: string) => {
    if (!currentEvent || isResponding) return

    setIsResponding(true)

    const response: PlayerResponse = {
      eventId: currentEvent.id,
      optionId,
      timestamp: new Date(),
      responseTime: (currentEvent.autoResolveTime - timeRemaining) * 1000
    }

    try {
      await realtimeSystem.respondToEvent(response)
    } catch (error) {
      console.error('Failed to send response:', error)
    } finally {
      setIsResponding(false)
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'border-red-500 bg-red-50'
      case 'high': return 'border-orange-500 bg-orange-50'
      case 'medium': return 'border-yellow-500 bg-yellow-50'
      default: return 'border-blue-500 bg-blue-50'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      default: return 'text-green-600'
    }
  }

  if (!isVisible) return null

  // 応答結果表示
  if (lastResponse) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="w-full max-w-md mx-4">
          <PixelCard>
            <div className="text-center space-y-4">
              <div className="font-pixel text-lg text-retro-gb-dark">
                {lastResponse.success ? '成功！' : '失敗...'}
              </div>
              
              <div className={`font-pixel text-sm ${lastResponse.success ? 'text-green-600' : 'text-red-600'}`}>
                {lastResponse.success 
                  ? '指示は成功しました！報酬がアップします。'
                  : '指示は失敗しました。リスクが高まりました。'
                }
              </div>
              
              <div className="flex justify-center">
                <PixelButton onClick={() => setLastResponse(null)}>
                  OK
                </PixelButton>
              </div>
            </div>
          </PixelCard>
        </div>
      </div>
    )
  }

  // 介入要求表示
  if (currentEvent) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="w-full max-w-lg mx-4">
          <div className={clsx(
            'border-2 rounded-none',
            getUrgencyColor(currentEvent.data.urgency)
          )}>
            <PixelCard>
              <div className="space-y-4">
                {/* ヘッダー */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-pixel text-lg text-retro-gb-dark">
                      緊急介入要求
                    </h3>
                    <p className="font-pixel text-xs text-retro-gb-mid">
                      トレーナーからの報告
                    </p>
                  </div>
                  <div className={clsx(
                    'px-2 py-1 font-pixel text-xs',
                    currentEvent.data.urgency === 'critical' && 'bg-red-500 text-white',
                    currentEvent.data.urgency === 'high' && 'bg-orange-500 text-white',
                    currentEvent.data.urgency === 'medium' && 'bg-yellow-500 text-white',
                    currentEvent.data.urgency === 'low' && 'bg-blue-500 text-white'
                  )}>
                    {currentEvent.data.urgency === 'critical' && '緊急'}
                    {currentEvent.data.urgency === 'high' && '重要'}
                    {currentEvent.data.urgency === 'medium' && '普通'}
                    {currentEvent.data.urgency === 'low' && '軽微'}
                  </div>
                </div>

                {/* 制限時間 */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-pixel text-xs text-retro-gb-mid">制限時間</span>
                    <span className="font-pixel text-xs text-retro-gb-dark">
                      {timeRemaining}秒
                    </span>
                  </div>
                  <PixelProgressBar
                    value={timeRemaining}
                    max={currentEvent.autoResolveTime}
                    color={timeRemaining <= 10 ? 'hp' : 'progress'}
                    showLabel={false}
                  />
                </div>

                {/* 状況説明 */}
                <div className="bg-retro-gb-light border border-retro-gb-mid p-3">
                  <p className="font-pixel text-sm text-retro-gb-dark">
                    {currentEvent.data.description}
                  </p>
                  
                  {currentEvent.data.pokemon && (
                    <div className="mt-2 font-pixel text-xs text-retro-gb-mid">
                      Lv.{currentEvent.data.pokemon.level} {currentEvent.data.pokemon.name}
                      {currentEvent.data.pokemon.shiny && ' ✨'}
                    </div>
                  )}
                </div>

                {/* 選択肢 */}
                {currentEvent.data.options && (
                  <div className="space-y-2">
                    <div className="font-pixel text-xs text-retro-gb-mid">
                      どうしますか？
                    </div>
                    {currentEvent.data.options.map((option) => (
                      <div key={option.id} className="border border-retro-gb-mid p-3 hover:bg-retro-gb-lightest cursor-pointer"
                           onClick={() => handleResponse(option.id)}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-pixel text-sm text-retro-gb-dark">
                              {option.label}
                            </div>
                            <div className="flex space-x-4 mt-1">
                              <span className="font-pixel text-xs text-retro-gb-mid">
                                成功率: {option.success_rate}%
                              </span>
                              <span className="font-pixel text-xs text-retro-gb-mid">
                                報酬: x{option.reward_multiplier}
                              </span>
                              <span className={`font-pixel text-xs ${getRiskColor(option.risk_level)}`}>
                                リスク: {option.risk_level}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 操作ボタン */}
                <div className="flex justify-between">
                  <PixelButton
                    variant="secondary"
                    size="sm"
                    onClick={onClose}
                    disabled={isResponding}
                  >
                    自動解決に任せる
                  </PixelButton>
                  
                  {timeRemaining <= 5 && (
                    <div className="font-pixel text-xs text-red-600 animate-pulse">
                      あと{timeRemaining}秒で自動解決！
                    </div>
                  )}
                </div>
              </div>
            </PixelCard>
          </div>
        </div>
      </div>
    )
  }

  return null
}