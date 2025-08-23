/**
 * 派遣イベント処理UIコンポーネント
 * 発生したイベントの表示と選択肢処理
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Zap,
  Gift,
  Shield,
  Swords,
  Cloud,
  Users,
  HelpCircle,
  Timer,
  Star
} from 'lucide-react'
import { useExpeditionEvents, useErrorHandling } from '@/lib/hooks'
import type { ExpeditionEvent } from '@/lib/game-state/types'
import type { EventResolution } from '@/lib/expedition'

interface ExpeditionEventHandlerProps {
  expeditionId: string
  onEventResolved?: (eventId: string, resolution: EventResolution) => void
  className?: string
}

export function ExpeditionEventHandler({ 
  expeditionId, 
  onEventResolved,
  className 
}: ExpeditionEventHandlerProps) {
  const { events, pendingEvents, processChoice, hasPendingEvents } = useExpeditionEvents(expeditionId)
  const { handleError } = useErrorHandling()
  const [selectedEvent, setSelectedEvent] = useState<ExpeditionEvent | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // 未解決のイベントがある場合、最新のものを自動選択
  useEffect(() => {
    if (pendingEvents.length > 0 && !selectedEvent) {
      setSelectedEvent(pendingEvents[0])
    }
  }, [pendingEvents, selectedEvent])

  const handleChoiceSelection = async (eventId: string, choiceId: string) => {
    setIsProcessing(true)
    try {
      const resolution = await processChoice(eventId, choiceId)
      onEventResolved?.(eventId, resolution)
      
      // 次の未解決イベントを選択
      const remainingPending = pendingEvents.filter(e => e.id !== eventId)
      setSelectedEvent(remainingPending.length > 0 ? remainingPending[0] : null)
    } catch (error) {
      await handleError(error as Error, { context: 'event_choice_processing' })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダー */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              派遣イベント
            </CardTitle>
            <div className="flex items-center gap-2">
              {hasPendingEvents && (
                <Badge variant="destructive">
                  {pendingEvents.length} 件要対応
                </Badge>
              )}
              <Badge variant="outline">
                総 {events.length} 件
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        {hasPendingEvents && (
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {pendingEvents.length}件のイベントが対応待ちです。適切な選択肢を選んでください。
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* イベントリスト */}
        <Card>
          <CardHeader>
            <CardTitle>イベント履歴</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <EventList 
                events={events}
                selectedEvent={selectedEvent}
                onSelectEvent={setSelectedEvent}
              />
            </ScrollArea>
          </CardContent>
        </Card>

        {/* イベント詳細・選択肢 */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedEvent ? 'イベント詳細' : 'イベントを選択してください'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedEvent ? (
              <EventDetailView 
                event={selectedEvent}
                onChoiceSelect={handleChoiceSelection}
                isProcessing={isProcessing}
              />
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>左のリストからイベントを選択してください</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 統計情報 */}
      <EventStatistics events={events} />
    </div>
  )
}

/**
 * イベントリストコンポーネント
 */
function EventList({ 
  events, 
  selectedEvent, 
  onSelectEvent 
}: {
  events: ExpeditionEvent[]
  selectedEvent: ExpeditionEvent | null
  onSelectEvent: (event: ExpeditionEvent) => void
}) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>まだイベントは発生していません</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {events.map((event, index) => (
        <EventListItem
          key={event.id}
          event={event}
          index={index}
          isSelected={selectedEvent?.id === event.id}
          onClick={() => onSelectEvent(event)}
        />
      ))}
    </div>
  )
}

/**
 * イベントリストアイテム
 */
function EventListItem({ 
  event, 
  index, 
  isSelected, 
  onClick 
}: {
  event: ExpeditionEvent
  index: number
  isSelected: boolean
  onClick: () => void
}) {
  const getEventIcon = (type: ExpeditionEvent['type']) => {
    switch (type) {
      case 'pokemon_encounter': return Eye
      case 'item_discovery': return Gift
      case 'danger': return AlertTriangle
      case 'weather': return Cloud
      case 'trainer_encounter': return Users
      default: return HelpCircle
    }
  }

  const getEventTypeLabel = (type: ExpeditionEvent['type']) => {
    switch (type) {
      case 'pokemon_encounter': return 'ポケモン遭遇'
      case 'item_discovery': return 'アイテム発見'
      case 'danger': return '危険遭遇'
      case 'weather': return '天候変化'
      case 'trainer_encounter': return 'トレーナー遭遇'
      default: return '不明なイベント'
    }
  }

  const Icon = getEventIcon(event.type)
  const eventTime = new Date(event.timestamp).toLocaleTimeString('ja-JP', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })

  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-all ${
        isSelected 
          ? 'border-primary bg-primary/5 shadow-sm' 
          : 'border-muted hover:border-primary/50 hover:bg-muted/50'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full shrink-0 ${
          event.resolved 
            ? 'bg-green-100 text-green-600' 
            : 'bg-orange-100 text-orange-600'
        }`}>
          <Icon className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">
              {getEventTypeLabel(event.type)}
            </Badge>
            <span className="text-xs text-muted-foreground">#{index + 1}</span>
          </div>
          
          <p className="text-sm font-medium line-clamp-2 mb-1">
            {event.message}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Timer className="h-3 w-3" />
              {eventTime}
            </span>
            
            {event.resolved ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Badge variant="destructive" className="text-xs">
                要対応
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * イベント詳細ビュー
 */
function EventDetailView({ 
  event, 
  onChoiceSelect, 
  isProcessing 
}: {
  event: ExpeditionEvent
  onChoiceSelect: (eventId: string, choiceId: string) => void
  isProcessing: boolean
}) {
  const eventTime = new Date(event.timestamp).toLocaleString('ja-JP')

  return (
    <div className="space-y-6">
      {/* イベント基本情報 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline">{getEventTypeLabel(event.type)}</Badge>
          <Badge variant={event.resolved ? 'default' : 'destructive'}>
            {event.resolved ? '解決済み' : '未解決'}
          </Badge>
        </div>
        
        <h3 className="text-lg font-semibold mb-2">{event.message}</h3>
        
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {eventTime}
        </p>
      </div>

      <Separator />

      {/* 選択肢または結果 */}
      {event.resolved ? (
        <EventResult event={event} />
      ) : (
        <EventChoices 
          event={event} 
          onChoiceSelect={onChoiceSelect}
          isProcessing={isProcessing}
        />
      )}
    </div>
  )
}

/**
 * イベント選択肢
 */
function EventChoices({ 
  event, 
  onChoiceSelect, 
  isProcessing 
}: {
  event: ExpeditionEvent
  onChoiceSelect: (eventId: string, choiceId: string) => void
  isProcessing: boolean
}) {
  if (!event.choices || event.choices.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          このイベントには選択肢がありません。自動で処理されます。
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div>
      <h4 className="font-medium mb-4">対応方法を選択してください</h4>
      
      <div className="space-y-3">
        {event.choices.map((choice, index) => (
          <ChoiceOption
            key={choice.id}
            choice={choice}
            index={index}
            onSelect={() => onChoiceSelect(event.id, choice.id)}
            disabled={isProcessing}
          />
        ))}
      </div>
      
      {isProcessing && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            <span className="text-sm font-medium">処理中...</span>
          </div>
          <Progress value={undefined} className="h-2" />
        </div>
      )}
    </div>
  )
}

/**
 * 選択肢オプション
 */
function ChoiceOption({ 
  choice, 
  index, 
  onSelect, 
  disabled 
}: {
  choice: any // ExpeditionEvent['choices'][0]
  index: number
  onSelect: () => void
  disabled: boolean
}) {
  const successRate = Math.round(choice.successRate * 100)
  
  // 成功率によって色を決定
  const getRiskColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 border-green-200 bg-green-50'
    if (rate >= 60) return 'text-blue-600 border-blue-200 bg-blue-50'
    if (rate >= 40) return 'text-yellow-600 border-yellow-200 bg-yellow-50'
    return 'text-red-600 border-red-200 bg-red-50'
  }

  return (
    <Button
      variant="outline"
      className={`w-full h-auto p-4 text-left justify-start ${getRiskColor(successRate)} hover:opacity-80`}
      onClick={onSelect}
      disabled={disabled}
    >
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">選択肢 {index + 1}</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              成功率 {successRate}%
            </Badge>
            <Star className="h-4 w-4" />
          </div>
        </div>
        
        <p className="text-sm mb-2">{choice.text}</p>
        
        {choice.requirements && choice.requirements.length > 0 && (
          <div className="text-xs text-muted-foreground">
            要件: {choice.requirements.join(', ')}
          </div>
        )}
      </div>
    </Button>
  )
}

/**
 * イベント結果表示
 */
function EventResult({ event }: { event: ExpeditionEvent }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-green-500" />
        <h4 className="font-medium">処理結果</h4>
      </div>
      
      {event.chosenAction && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-1">選択した行動:</p>
          <p className="text-sm">{event.chosenAction}</p>
        </div>
      )}
      
      {event.result && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-medium mb-1 text-green-700">結果:</p>
          <p className="text-sm text-green-600">{event.result}</p>
        </div>
      )}
    </div>
  )
}

/**
 * イベント統計
 */
function EventStatistics({ events }: { events: ExpeditionEvent[] }) {
  const stats = {
    total: events.length,
    resolved: events.filter(e => e.resolved).length,
    pending: events.filter(e => !e.resolved).length,
    byType: events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  const resolvedRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">イベント統計</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-sm text-muted-foreground">総イベント数</p>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            <p className="text-sm text-muted-foreground">解決済み</p>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">要対応</p>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{resolvedRate}%</p>
            <p className="text-sm text-muted-foreground">処理率</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * ユーティリティ関数
 */
function getEventTypeLabel(type: ExpeditionEvent['type']): string {
  switch (type) {
    case 'pokemon_encounter': return 'ポケモン遭遇'
    case 'item_discovery': return 'アイテム発見'
    case 'danger': return '危険遭遇'
    case 'weather': return '天候変化'
    case 'trainer_encounter': return 'トレーナー遭遇'
    default: return '不明なイベント'
  }
}

export default ExpeditionEventHandler