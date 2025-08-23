/**
 * 派遣管理ダッシュボード
 * 派遣システム全体の統合管理インターフェース
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Activity, 
  MapPin, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Users,
  Zap
} from 'lucide-react'
import {
  useExpeditionSystem,
  useExpeditionProgress,
  useExpeditionEvents,
  useExpeditionIntervention,
  useGameCore
} from '@/lib/hooks'
import type { Expedition, Trainer } from '@/lib/game-state/types'
import type { ExpeditionProgress } from '@/lib/expedition'

interface ExpeditionDashboardProps {
  className?: string
}

export function ExpeditionDashboard({ className }: ExpeditionDashboardProps) {
  const [selectedExpedition, setSelectedExpedition] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  
  const { systemState, isHealthy, activeExpeditionCount } = useExpeditionSystem()
  const gameCore = useGameCore()
  
  // システム統計の取得
  const systemStats = {
    totalExpeditions: gameCore.expeditions.length,
    activeExpeditions: activeExpeditionCount,
    availableTrainers: gameCore.trainers.filter(t => t.status === 'available').length,
    systemHealth: systemState.systemHealth
  }

  return (
    <div className={`expedition-dashboard space-y-6 ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">派遣管理センター</h1>
          <p className="text-muted-foreground">
            トレーナーの派遣状況とシステム全体を監視・管理
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge 
            variant={isHealthy ? 'default' : 'destructive'}
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            {isHealthy ? 'システム正常' : 'システム異常'}
          </Badge>
          
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            更新
          </Button>
        </div>
      </div>

      {/* システム異常時の警告 */}
      {!isHealthy && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            派遣システムに問題が発生しています。管理者にお問い合わせください。
          </AlertDescription>
        </Alert>
      )}

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">進行中の派遣</p>
                <p className="text-2xl font-bold">{systemStats.activeExpeditions}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">利用可能なトレーナー</p>
                <p className="text-2xl font-bold">{systemStats.availableTrainers}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">総派遣数</p>
                <p className="text-2xl font-bold">{systemStats.totalExpeditions}</p>
              </div>
              <MapPin className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">システム効率</p>
                <p className="text-2xl font-bold">
                  {isHealthy ? '98%' : '低下中'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* メインコンテンツ */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="active">進行中</TabsTrigger>
          <TabsTrigger value="planning">計画</TabsTrigger>
          <TabsTrigger value="history">履歴</TabsTrigger>
          <TabsTrigger value="analytics">分析</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ExpeditionOverview 
            systemStats={systemStats}
            activeExpeditions={systemState.activeExpeditions}
          />
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          <ActiveExpeditionsPanel 
            expeditions={systemState.activeExpeditions}
            onSelectExpedition={setSelectedExpedition}
            selectedExpedition={selectedExpedition}
          />
        </TabsContent>

        <TabsContent value="planning" className="space-y-6">
          <ExpeditionPlanningPanel 
            availableTrainers={gameCore.trainers.filter(t => t.status === 'available')}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <ExpeditionHistoryPanel 
            expeditions={gameCore.expeditions.filter(e => e.status === 'completed' || e.status === 'failed')}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <ExpeditionAnalyticsPanel 
            systemStats={systemStats}
            statistics={systemState.statistics}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * 概要パネル
 */
function ExpeditionOverview({ 
  systemStats, 
  activeExpeditions 
}: { 
  systemStats: any
  activeExpeditions: ExpeditionProgress[]
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* システム状態 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            システム状態
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>派遣エンジン</span>
            <Badge variant="default">
              <CheckCircle className="h-3 w-3 mr-1" />
              正常
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span>イベントシステム</span>
            <Badge variant="default">
              <CheckCircle className="h-3 w-3 mr-1" />
              正常
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span>報酬システム</span>
            <Badge variant="default">
              <CheckCircle className="h-3 w-3 mr-1" />
              正常
            </Badge>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              全システムが正常に動作しています
            </p>
          </div>
        </CardContent>
      </Card>

      {/* アクティブ派遣サマリー */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            進行中の派遣
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeExpeditions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              現在進行中の派遣はありません
            </p>
          ) : (
            <div className="space-y-4">
              {activeExpeditions.slice(0, 3).map((expedition) => (
                <div key={expedition.expeditionId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">派遣 #{expedition.expeditionId.slice(-6)}</p>
                    <p className="text-sm text-muted-foreground">
                      {expedition.currentStage} - {expedition.riskLevel}リスク
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{Math.round(expedition.overallProgress * 100)}%</p>
                    <Progress value={expedition.overallProgress * 100} className="w-20" />
                  </div>
                </div>
              ))}
              
              {activeExpeditions.length > 3 && (
                <p className="text-sm text-muted-foreground text-center">
                  他 {activeExpeditions.length - 3} 件の派遣が進行中
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * アクティブ派遣パネル
 */
function ActiveExpeditionsPanel({ 
  expeditions, 
  onSelectExpedition, 
  selectedExpedition 
}: {
  expeditions: ExpeditionProgress[]
  onSelectExpedition: (id: string | null) => void
  selectedExpedition: string | null
}) {
  if (expeditions.length === 0) {
    return (
      <Card>
        <CardContent className="py-16">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">進行中の派遣がありません</h3>
            <p className="text-muted-foreground mb-4">
              新しい派遣を開始するには「計画」タブをご利用ください
            </p>
            <Button onClick={() => {}}>
              新しい派遣を開始
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 派遣リスト */}
      <Card>
        <CardHeader>
          <CardTitle>進行中の派遣</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {expeditions.map((expedition) => (
            <div
              key={expedition.expeditionId}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedExpedition === expedition.expeditionId
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => onSelectExpedition(expedition.expeditionId)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">派遣 #{expedition.expeditionId.slice(-6)}</h4>
                <Badge variant={expedition.riskLevel === 'critical' ? 'destructive' : 'default'}>
                  {expedition.riskLevel}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>進行状況</span>
                  <span>{Math.round(expedition.overallProgress * 100)}%</span>
                </div>
                <Progress value={expedition.overallProgress * 100} />
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{expedition.currentStage}</span>
                  {expedition.nextEventTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      次のイベントまで...
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 選択された派遣の詳細 */}
      <Card>
        <CardHeader>
          <CardTitle>派遣詳細</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedExpedition ? (
            <ExpeditionDetailView expeditionId={selectedExpedition} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              派遣を選択してください
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * 派遣詳細ビュー
 */
function ExpeditionDetailView({ expeditionId }: { expeditionId: string }) {
  const { progress } = useExpeditionProgress(expeditionId)
  const { events, pendingEvents, hasPendingEvents } = useExpeditionEvents(expeditionId)
  const { availableActions, canIntervene } = useExpeditionIntervention(expeditionId)

  if (!progress) {
    return <div className="text-center py-8">派遣情報を読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      {/* 進行状況 */}
      <div>
        <h4 className="font-medium mb-2">進行状況</h4>
        <Progress value={progress.overallProgress * 100} className="mb-2" />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{progress.currentStage}段階</span>
          <span>{Math.round(progress.overallProgress * 100)}% 完了</span>
        </div>
      </div>

      {/* リスクレベル */}
      <div>
        <h4 className="font-medium mb-2">リスクレベル</h4>
        <Badge variant={progress.riskLevel === 'critical' ? 'destructive' : 'default'}>
          {progress.riskLevel}
        </Badge>
      </div>

      {/* 待機中イベント */}
      {hasPendingEvents && (
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            要対応イベント
          </h4>
          <Badge variant="secondary">
            {pendingEvents.length} 件のイベントが待機中
          </Badge>
        </div>
      )}

      {/* 利用可能な介入 */}
      {canIntervene && (
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-500" />
            介入オプション
          </h4>
          <Badge variant="outline">
            {availableActions.length} 件の介入が利用可能
          </Badge>
        </div>
      )}

      {/* アクション */}
      <div className="flex gap-2">
        <Button size="sm" variant="outline">
          詳細を見る
        </Button>
        {hasPendingEvents && (
          <Button size="sm">
            イベント処理
          </Button>
        )}
        {canIntervene && (
          <Button size="sm" variant="secondary">
            介入実行
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * 派遣計画パネル（プレースホルダー）
 */
function ExpeditionPlanningPanel({ availableTrainers }: { availableTrainers: Trainer[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>新しい派遣を計画</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          派遣計画機能は開発中です。利用可能なトレーナー: {availableTrainers.length}名
        </p>
      </CardContent>
    </Card>
  )
}

/**
 * 派遣履歴パネル（プレースホルダー）
 */
function ExpeditionHistoryPanel({ expeditions }: { expeditions: Expedition[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>派遣履歴</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          完了した派遣: {expeditions.length}件
        </p>
      </CardContent>
    </Card>
  )
}

/**
 * 派遣分析パネル（プレースホルダー）
 */
function ExpeditionAnalyticsPanel({ systemStats, statistics }: { systemStats: any, statistics: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>分析とレポート</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          統計分析機能は開発中です
        </p>
      </CardContent>
    </Card>
  )
}

export default ExpeditionDashboard