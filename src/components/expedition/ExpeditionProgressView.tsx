/**
 * 派遣進行状況表示コンポーネント
 * リアルタイムの派遣進行状況を視覚的に表示
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Clock, 
  MapPin, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  Timer,
  TrendingUp,
  Shield,
  Target,
  Zap
} from 'lucide-react'
import { useExpeditionProgress, useGameCore } from '@/lib/hooks'
import type { ExpeditionProgress } from '@/lib/expedition'
import type { Expedition, Trainer } from '@/lib/game-state/types'

interface ExpeditionProgressViewProps {
  expeditionId: string
  onEventAction?: () => void
  onInterventionAction?: () => void
  className?: string
}

export function ExpeditionProgressView({ 
  expeditionId, 
  onEventAction, 
  onInterventionAction,
  className 
}: ExpeditionProgressViewProps) {
  const { progress, isActive } = useExpeditionProgress(expeditionId)
  const gameCore = useGameCore()
  
  const expedition = gameCore.expeditions.find(e => e.id === expeditionId)
  const trainer = expedition ? gameCore.trainers.find(t => t.id === expedition.trainerId) : null

  if (!expedition || !trainer) {
    return (
      <Card className={className}>
        <CardContent className="py-16">
          <div className="text-center text-muted-foreground">
            派遣情報が見つかりません
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isActive || !progress) {
    return (
      <Card className={className}>
        <CardContent className="py-16">
          <div className="text-center text-muted-foreground">
            この派遣は現在進行中ではありません
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダー情報 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              派遣進行状況
            </CardTitle>
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isActive ? '進行中' : '停止中'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">トレーナー</p>
              <p className="text-lg font-semibold">{trainer.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">探索地域</p>
              <p className="text-lg font-semibold flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                エリア {expedition.locationId}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* メイン進行状況 */}
      <Card>
        <CardHeader>
          <CardTitle>進行状況</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 全体進行率 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">全体進行</span>
              <span className="text-sm font-medium">
                {Math.round(progress.overallProgress * 100)}%
              </span>
            </div>
            <Progress value={progress.overallProgress * 100} className="h-3" />
          </div>

          <Separator />

          {/* ステージ詳細 */}
          <ExpeditionStageView progress={progress} expedition={expedition} />

          <Separator />

          {/* リスクとタイミング */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RiskLevelView riskLevel={progress.riskLevel} />
            <TimingView progress={progress} expedition={expedition} />
          </div>
        </CardContent>
      </Card>

      {/* アクションパネル */}
      <Card>
        <CardHeader>
          <CardTitle>利用可能なアクション</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionPanel 
            expeditionId={expeditionId}
            progress={progress}
            onEventAction={onEventAction}
            onInterventionAction={onInterventionAction}
          />
        </CardContent>
      </Card>

      {/* 統計情報 */}
      <StatisticsPanel expeditionId={expeditionId} progress={progress} />
    </div>
  )
}

/**
 * ステージビュー
 */
function ExpeditionStageView({ 
  progress, 
  expedition 
}: { 
  progress: ExpeditionProgress
  expedition: Expedition 
}) {
  const stages = [
    { id: 'preparation', name: '準備', icon: Shield },
    { id: 'early', name: '序盤', icon: Activity },
    { id: 'middle', name: '中盤', icon: Target },
    { id: 'late', name: '終盤', icon: TrendingUp },
    { id: 'completion', name: '完了', icon: CheckCircle }
  ]

  return (
    <div>
      <h4 className="font-medium mb-4">探索段階</h4>
      <div className="space-y-3">
        {stages.map((stage, index) => {
          const Icon = stage.icon
          const isActive = stage.id === progress.currentStage
          const isCompleted = stages.findIndex(s => s.id === progress.currentStage) > index
          
          return (
            <div
              key={stage.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                isActive 
                  ? 'border-primary bg-primary/5' 
                  : isCompleted 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-muted'
              }`}
            >
              <div className={`p-2 rounded-full ${
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : isCompleted 
                    ? 'bg-green-500 text-white' 
                    : 'bg-muted text-muted-foreground'
              }`}>
                <Icon className="h-4 w-4" />
              </div>
              
              <div className="flex-1">
                <p className={`font-medium ${
                  isActive ? 'text-primary' : isCompleted ? 'text-green-700' : 'text-muted-foreground'
                }`}>
                  {stage.name}
                </p>
                {isActive && (
                  <div className="mt-1">
                    <Progress 
                      value={progress.stageProgress * 100} 
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round(progress.stageProgress * 100)}% 完了
                    </p>
                  </div>
                )}
              </div>
              
              {isCompleted && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * リスクレベルビュー
 */
function RiskLevelView({ riskLevel }: { riskLevel: ExpeditionProgress['riskLevel'] }) {
  const riskConfig = {
    low: { 
      color: 'text-green-600', 
      bgColor: 'bg-green-100', 
      icon: Shield,
      label: '低リスク',
      description: '安全な状況です'
    },
    medium: { 
      color: 'text-yellow-600', 
      bgColor: 'bg-yellow-100', 
      icon: Activity,
      label: '中リスク',
      description: '注意が必要です'
    },
    high: { 
      color: 'text-orange-600', 
      bgColor: 'bg-orange-100', 
      icon: AlertTriangle,
      label: '高リスク',
      description: '慎重な対応が必要'
    },
    critical: { 
      color: 'text-red-600', 
      bgColor: 'bg-red-100', 
      icon: AlertTriangle,
      label: '危険',
      description: '即座の対応が必要'
    }
  }

  const config = riskConfig[riskLevel]
  const Icon = config.icon

  return (
    <div className={`p-4 rounded-lg ${config.bgColor}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-5 w-5 ${config.color}`} />
        <h4 className={`font-medium ${config.color}`}>リスクレベル</h4>
      </div>
      <p className={`text-lg font-semibold ${config.color}`}>{config.label}</p>
      <p className={`text-sm ${config.color} opacity-80`}>{config.description}</p>
    </div>
  )
}

/**
 * タイミングビュー
 */
function TimingView({ 
  progress, 
  expedition 
}: { 
  progress: ExpeditionProgress
  expedition: Expedition 
}) {
  const [timeInfo, setTimeInfo] = useState({
    elapsed: 0,
    remaining: 0,
    nextEvent: 0
  })

  useEffect(() => {
    const updateTime = () => {
      const now = Date.now()
      const startTime = new Date(expedition.startTime).getTime()
      const endTime = progress.estimatedEndTime
      
      setTimeInfo({
        elapsed: now - startTime,
        remaining: Math.max(0, endTime - now),
        nextEvent: progress.nextEventTime ? Math.max(0, progress.nextEventTime - now) : 0
      })
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [expedition.startTime, progress.estimatedEndTime, progress.nextEventTime])

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}時間${minutes % 60}分`
    } else if (minutes > 0) {
      return `${minutes}分${seconds % 60}秒`
    } else {
      return `${seconds}秒`
    }
  }

  return (
    <div className="p-4 rounded-lg bg-blue-50">
      <div className="flex items-center gap-2 mb-2">
        <Timer className="h-5 w-5 text-blue-600" />
        <h4 className="font-medium text-blue-600">時間情報</h4>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-blue-600">経過時間</span>
          <span className="font-medium text-blue-700">{formatTime(timeInfo.elapsed)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-blue-600">残り時間</span>
          <span className="font-medium text-blue-700">{formatTime(timeInfo.remaining)}</span>
        </div>
        
        {timeInfo.nextEvent > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-blue-600">次のイベント</span>
            <span className="font-medium text-blue-700">{formatTime(timeInfo.nextEvent)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * アクションパネル
 */
function ActionPanel({ 
  expeditionId, 
  progress,
  onEventAction, 
  onInterventionAction 
}: {
  expeditionId: string
  progress: ExpeditionProgress
  onEventAction?: () => void
  onInterventionAction?: () => void
}) {
  const hasUrgentSituation = progress.riskLevel === 'critical'
  const needsAttention = progress.nextEventTime && progress.nextEventTime <= Date.now() + 60000 // 1分以内

  return (
    <div className="space-y-4">
      {hasUrgentSituation && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h4 className="font-medium text-red-600">緊急事態</h4>
          </div>
          <p className="text-sm text-red-700 mb-3">
            危険レベルが非常に高くなっています。即座の対応が必要です。
          </p>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={onInterventionAction}
            className="w-full"
          >
            <Zap className="h-4 w-4 mr-2" />
            緊急介入
          </Button>
        </div>
      )}

      {needsAttention && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <h4 className="font-medium text-orange-600">要注意</h4>
          </div>
          <p className="text-sm text-orange-700 mb-3">
            新しいイベントが発生しました。対応をお願いします。
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onEventAction}
            className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
          >
            イベント確認
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={onEventAction}>
          イベント履歴
        </Button>
        <Button variant="outline" size="sm" onClick={onInterventionAction}>
          介入オプション
        </Button>
      </div>
    </div>
  )
}

/**
 * 統計パネル
 */
function StatisticsPanel({ 
  expeditionId, 
  progress 
}: { 
  expeditionId: string
  progress: ExpeditionProgress 
}) {
  const efficiency = progress.overallProgress > 0 ? progress.overallProgress * 100 : 0
  const stage = progress.currentStage
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">パフォーマンス指標</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{Math.round(efficiency)}%</p>
            <p className="text-sm text-muted-foreground">効率性</p>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stage}</p>
            <p className="text-sm text-muted-foreground">現在段階</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ExpeditionProgressView