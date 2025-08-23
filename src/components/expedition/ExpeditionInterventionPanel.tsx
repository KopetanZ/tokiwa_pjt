/**
 * プレイヤー介入UIコンポーネント
 * 派遣中の介入アクション管理と実行
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Heart,
  MessageSquare,
  Package,
  RotateCcw,
  DollarSign,
  Timer,
  TrendingUp,
  Activity,
  Target,
  Star,
  HelpCircle,
  Coins
} from 'lucide-react'
import { useExpeditionIntervention, useGameCore, useErrorHandling } from '@/lib/hooks'
import type { InterventionAction, InterventionResult } from '@/lib/expedition'

interface ExpeditionInterventionPanelProps {
  expeditionId: string
  onInterventionExecuted?: (result: InterventionResult) => void
  className?: string
}

export function ExpeditionInterventionPanel({ 
  expeditionId, 
  onInterventionExecuted,
  className 
}: ExpeditionInterventionPanelProps) {
  const { 
    availableActions, 
    executeIntervention, 
    emergencyIntervention,
    getInterventionStatistics,
    canIntervene 
  } = useExpeditionIntervention(expeditionId)
  
  const gameCore = useGameCore()
  const { handleError } = useErrorHandling()
  
  const [selectedAction, setSelectedAction] = useState<InterventionAction | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [recentResults, setRecentResults] = useState<InterventionResult[]>([])
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const statistics = getInterventionStatistics()
  const playerMoney = gameCore.player?.money || 0

  const handleInterventionExecute = async (actionId: string) => {
    if (!selectedAction) return

    setIsExecuting(true)
    try {
      const result = await executeIntervention(actionId)
      setRecentResults(prev => [result, ...prev.slice(0, 4)]) // 最新5件まで保持
      onInterventionExecuted?.(result)
      setSelectedAction(null)
      setShowConfirmDialog(false)
    } catch (error) {
      await handleError(error as Error, { context: 'intervention_execution' })
    } finally {
      setIsExecuting(false)
    }
  }

  const handleEmergencyIntervention = async (eventId: string, actionId: string) => {
    setIsExecuting(true)
    try {
      const resolution = await emergencyIntervention(eventId, actionId)
      // 緊急介入の結果を処理
      console.log('Emergency intervention result:', resolution)
    } catch (error) {
      await handleError(error as Error, { context: 'emergency_intervention' })
    } finally {
      setIsExecuting(false)
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
              プレイヤー介入
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={canIntervene ? 'default' : 'secondary'}>
                {canIntervene ? `${availableActions.length} 件利用可能` : '介入不可'}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Coins className="h-3 w-3" />
                {playerMoney.toLocaleString()}円
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        {!canIntervene && (
          <CardContent>
            <Alert>
              <HelpCircle className="h-4 w-4" />
              <AlertDescription>
                現在利用可能な介入アクションはありません。時間経過で新しいオプションが利用可能になる場合があります。
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 利用可能なアクション */}
        <Card>
          <CardHeader>
            <CardTitle>利用可能なアクション</CardTitle>
          </CardHeader>
          <CardContent>
            {availableActions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Timer className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>現在利用可能なアクションはありません</p>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {availableActions.map((action) => (
                    <InterventionActionCard
                      key={action.id}
                      action={action}
                      playerMoney={playerMoney}
                      isSelected={selectedAction?.id === action.id}
                      onSelect={() => setSelectedAction(action)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* アクション詳細・実行 */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedAction ? 'アクション詳細' : 'アクションを選択してください'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedAction ? (
              <InterventionActionDetail
                action={selectedAction}
                playerMoney={playerMoney}
                onExecute={() => setShowConfirmDialog(true)}
                isExecuting={isExecuting}
              />
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>左のリストからアクションを選択してください</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 最近の介入結果 */}
      {recentResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>最近の介入結果</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentInterventions results={recentResults} />
          </CardContent>
        </Card>
      )}

      {/* 統計情報 */}
      <InterventionStatistics statistics={statistics} />

      {/* 確認ダイアログ */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>介入実行の確認</DialogTitle>
          </DialogHeader>
          {selectedAction && (
            <InterventionConfirmation
              action={selectedAction}
              onConfirm={() => handleInterventionExecute(selectedAction.id)}
              onCancel={() => setShowConfirmDialog(false)}
              isExecuting={isExecuting}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * 介入アクションカード
 */
function InterventionActionCard({ 
  action, 
  playerMoney, 
  isSelected, 
  onSelect 
}: {
  action: InterventionAction
  playerMoney: number
  isSelected: boolean
  onSelect: () => void
}) {
  const canAfford = playerMoney >= action.cost
  const icon = getActionIcon(action.type)
  const Icon = icon

  return (
    <div
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        isSelected 
          ? 'border-primary bg-primary/5 shadow-sm' 
          : canAfford 
            ? 'border-muted hover:border-primary/50 hover:bg-muted/50'
            : 'border-muted bg-muted/30 opacity-60 cursor-not-allowed'
      }`}
      onClick={canAfford ? onSelect : undefined}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full shrink-0 ${
          canAfford 
            ? 'bg-blue-100 text-blue-600' 
            : 'bg-gray-100 text-gray-400'
        }`}>
          <Icon className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium">{action.name}</h4>
            <Badge variant={getActionPriorityVariant(action.type)}>
              {getActionTypeLabel(action.type)}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {action.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm">
              <DollarSign className="h-3 w-3" />
              <span className={canAfford ? 'text-foreground' : 'text-red-500'}>
                {action.cost.toLocaleString()}円
              </span>
            </div>
            
            {action.cooldown > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {action.cooldown}分CD
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 介入アクション詳細
 */
function InterventionActionDetail({ 
  action, 
  playerMoney, 
  onExecute, 
  isExecuting 
}: {
  action: InterventionAction
  playerMoney: number
  onExecute: () => void
  isExecuting: boolean
}) {
  const canAfford = playerMoney >= action.cost
  const Icon = getActionIcon(action.type)

  return (
    <div className="space-y-6">
      {/* アクション基本情報 */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{action.name}</h3>
            <Badge variant={getActionPriorityVariant(action.type)}>
              {getActionTypeLabel(action.type)}
            </Badge>
          </div>
        </div>
        
        <p className="text-muted-foreground">{action.description}</p>
      </div>

      <Separator />

      {/* コストと要件 */}
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">コスト</h4>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className={`text-lg font-semibold ${canAfford ? 'text-foreground' : 'text-red-500'}`}>
              {action.cost.toLocaleString()}円
            </span>
            {!canAfford && (
              <Badge variant="destructive">資金不足</Badge>
            )}
          </div>
        </div>

        {action.requirements.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">要件</h4>
            <div className="space-y-2">
              {action.requirements.map((req, index) => (
                <RequirementItem key={index} requirement={req} />
              ))}
            </div>
          </div>
        )}

        {action.cooldown > 0 && (
          <div>
            <h4 className="font-medium mb-2">クールダウン</h4>
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              <span>{action.cooldown}分間使用不可</span>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* 効果 */}
      <div>
        <h4 className="font-medium mb-3">効果</h4>
        <div className="space-y-2">
          {action.effects.map((effect, index) => (
            <EffectItem key={index} effect={effect} />
          ))}
        </div>
      </div>

      <Separator />

      {/* 実行ボタン */}
      <Button
        onClick={onExecute}
        disabled={!canAfford || isExecuting}
        className="w-full"
        size="lg"
      >
        {isExecuting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
            実行中...
          </>
        ) : (
          <>
            <Zap className="h-4 w-4 mr-2" />
            介入を実行
          </>
        )}
      </Button>
    </div>
  )
}

/**
 * 要件アイテム
 */
function RequirementItem({ requirement }: { requirement: any }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <CheckCircle className="h-4 w-4 text-green-500" />
      <span>{requirement.description}</span>
    </div>
  )
}

/**
 * 効果アイテム
 */
function EffectItem({ effect }: { effect: any }) {
  const Icon = getEffectIcon(effect.type)
  
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-4 w-4 text-blue-500" />
      <span>{effect.description}</span>
      {effect.duration && effect.duration > 0 && (
        <Badge variant="outline" className="text-xs">
          {effect.duration}分間
        </Badge>
      )}
    </div>
  )
}

/**
 * 最近の介入結果
 */
function RecentInterventions({ results }: { results: InterventionResult[] }) {
  return (
    <div className="space-y-3">
      {results.map((result, index) => (
        <div
          key={index}
          className={`p-3 rounded-lg border ${
            result.success 
              ? 'border-green-200 bg-green-50' 
              : 'border-red-200 bg-red-50'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <span className={`font-medium ${
              result.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {result.success ? '成功' : '失敗'}
            </span>
            <Badge variant="outline" className="text-xs">
              コスト: {result.cost}円
            </Badge>
          </div>
          
          <p className={`text-sm ${
            result.success ? 'text-green-600' : 'text-red-600'
          }`}>
            {result.message}
          </p>
          
          {result.consequence && (
            <p className="text-xs text-muted-foreground mt-1">
              {result.consequence}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * 介入確認ダイアログ
 */
function InterventionConfirmation({ 
  action, 
  onConfirm, 
  onCancel, 
  isExecuting 
}: {
  action: InterventionAction
  onConfirm: () => void
  onCancel: () => void
  isExecuting: boolean
}) {
  return (
    <div className="space-y-4">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          「{action.name}」を実行しますか？この操作には{action.cost.toLocaleString()}円かかります。
        </AlertDescription>
      </Alert>
      
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isExecuting}>
          キャンセル
        </Button>
        <Button onClick={onConfirm} disabled={isExecuting}>
          {isExecuting ? '実行中...' : '実行'}
        </Button>
      </div>
    </div>
  )
}

/**
 * 介入統計
 */
function InterventionStatistics({ statistics }: { statistics: any }) {
  const successRate = statistics.totalInterventions > 0 
    ? Math.round((statistics.successfulInterventions / statistics.totalInterventions) * 100)
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">介入統計</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{statistics.totalInterventions || 0}</p>
            <p className="text-sm text-muted-foreground">総介入回数</p>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{statistics.successfulInterventions || 0}</p>
            <p className="text-sm text-muted-foreground">成功回数</p>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{successRate}%</p>
            <p className="text-sm text-muted-foreground">成功率</p>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">
              {Object.keys(statistics.actionBreakdown || {}).length}
            </p>
            <p className="text-sm text-muted-foreground">使用アクション数</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * ユーティリティ関数
 */
function getActionIcon(type: InterventionAction['type']) {
  switch (type) {
    case 'item_use': return Heart
    case 'strategy_change': return MessageSquare
    case 'emergency_recall': return RotateCcw
    case 'guidance': return MessageSquare
    case 'resource_support': return Package
    default: return Zap
  }
}

function getActionTypeLabel(type: InterventionAction['type']): string {
  switch (type) {
    case 'item_use': return 'アイテム'
    case 'strategy_change': return '戦略変更'
    case 'emergency_recall': return '緊急リコール'
    case 'guidance': return '指導'
    case 'resource_support': return 'リソース支援'
    default: return 'その他'
  }
}

function getActionPriorityVariant(type: InterventionAction['type']) {
  switch (type) {
    case 'emergency_recall': return 'destructive' as const
    case 'item_use': return 'default' as const
    case 'guidance': return 'secondary' as const
    default: return 'outline' as const
  }
}

function getEffectIcon(type: string) {
  switch (type) {
    case 'progress_boost': return TrendingUp
    case 'success_rate_boost': return Star
    case 'risk_reduction': return Shield
    case 'event_trigger': return Activity
    case 'status_change': return Heart
    default: return Zap
  }
}

export default ExpeditionInterventionPanel