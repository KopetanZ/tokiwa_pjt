/**
 * 派遣結果とレポート表示コンポーネント
 * 完了した派遣の詳細結果とパフォーマンスレポートを表示
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Trophy,
  Star,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  Gift,
  Award,
  Target,
  Activity,
  BarChart3,
  FileText,
  Download,
  Share,
  Calendar,
  MapPin,
  Users,
  Zap,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Lightbulb
} from 'lucide-react'
import { useExpeditionReports, useExpeditionCompletion } from '@/lib/hooks'
import type { ExpeditionLoot, ExpeditionReport, Achievement, Recommendation } from '@/lib/expedition'
import type { Expedition, Trainer } from '@/lib/game-state/types'

interface ExpeditionResultsViewProps {
  expeditionId: string
  onClose?: () => void
  className?: string
}

export function ExpeditionResultsView({ 
  expeditionId, 
  onClose,
  className 
}: ExpeditionResultsViewProps) {
  const { reports } = useExpeditionReports('expedition', expeditionId)
  const [selectedTab, setSelectedTab] = useState('summary')
  
  const report = reports[0] // 最新のレポート

  if (!report) {
    return (
      <Card className={className}>
        <CardContent className="py-16">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>派遣レポートを読み込み中...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダー */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                派遣完了レポート
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                派遣ID: {expeditionId.slice(-8)} | 生成日時: {new Date(report.metadata.generatedAt).toLocaleString('ja-JP')}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <OverallRatingBadge rating={report.summary.overallRating} />
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  閉じる
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* メインコンテンツ */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="summary">概要</TabsTrigger>
          <TabsTrigger value="timeline">タイムライン</TabsTrigger>
          <TabsTrigger value="performance">パフォーマンス</TabsTrigger>
          <TabsTrigger value="rewards">報酬</TabsTrigger>
          <TabsTrigger value="recommendations">推奨事項</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          <ExpeditionSummaryPanel report={report} />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <TimelinePanel timeline={report.timeline} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformancePanel performance={report.performance} />
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <RewardsPanel 
            statistics={report.statistics} 
            achievements={report.summary.achievements}
          />
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <RecommendationsPanel recommendations={report.recommendations} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * 総合評価バッジ
 */
function OverallRatingBadge({ rating }: { rating: number }) {
  const getRatingInfo = (rating: number) => {
    if (rating >= 8.5) return { label: 'S', color: 'bg-yellow-500 text-white', icon: Trophy }
    if (rating >= 7.0) return { label: 'A', color: 'bg-green-500 text-white', icon: Star }
    if (rating >= 5.5) return { label: 'B', color: 'bg-blue-500 text-white', icon: CheckCircle }
    if (rating >= 4.0) return { label: 'C', color: 'bg-orange-500 text-white', icon: Target }
    return { label: 'D', color: 'bg-red-500 text-white', icon: XCircle }
  }

  const { label, color, icon: Icon } = getRatingInfo(rating)

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${color}`}>
      <Icon className="h-4 w-4" />
      <span className="font-bold">{label}ランク</span>
      <span className="text-sm">({rating.toFixed(1)})</span>
    </div>
  )
}

/**
 * 派遣概要パネル
 */
function ExpeditionSummaryPanel({ report }: { report: ExpeditionReport }) {
  const { summary, expedition } = report

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 基本結果 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            基本結果
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>結果</span>
            <OutcomeBadge outcome={summary.outcome} />
          </div>
          
          <div className="flex items-center justify-between">
            <span>効率性</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">
                {Math.round(summary.duration.efficiency * 100)}%
              </span>
              {summary.duration.efficiency > 1 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span>予定時間</span>
            <span>{Math.round(summary.duration.planned)}分</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>実際時間</span>
            <span>{Math.round(summary.duration.actual)}分</span>
          </div>
        </CardContent>
      </Card>

      {/* ハイライト・懸念事項 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            重要ポイント
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {summary.highlights.length > 0 && (
            <div>
              <h4 className="font-medium text-green-700 mb-2">✅ ハイライト</h4>
              <ul className="space-y-1">
                {summary.highlights.map((highlight, index) => (
                  <li key={index} className="text-sm text-green-600 flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {summary.concerns.length > 0 && (
            <div>
              <h4 className="font-medium text-orange-700 mb-2">⚠️ 懸念事項</h4>
              <ul className="space-y-1">
                {summary.concerns.map((concern, index) => (
                  <li key={index} className="text-sm text-orange-600 flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3" />
                    {concern}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {summary.highlights.length === 0 && summary.concerns.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              特記事項はありません
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * タイムラインパネル
 */
function TimelinePanel({ timeline }: { timeline: ExpeditionReport['timeline'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          派遣タイムライン
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {timeline.map((entry, index) => (
              <TimelineEntry key={index} entry={entry} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

/**
 * タイムラインエントリ
 */
function TimelineEntry({ entry }: { entry: ExpeditionReport['timeline'][0] }) {
  const getEntryIcon = (type: string) => {
    switch (type) {
      case 'start': return Activity
      case 'stage_change': return Target
      case 'event': return Eye
      case 'intervention': return Zap
      case 'completion': return CheckCircle
      case 'milestone': return Star
      default: return Activity
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200'
      case 'negative': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  const Icon = getEntryIcon(entry.type)
  const time = new Date(entry.timestamp).toLocaleTimeString('ja-JP', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  })

  return (
    <div className={`p-3 rounded-lg border ${getImpactColor(entry.impact)}`}>
      <div className="flex items-start gap-3">
        <div className="p-1 rounded-full bg-white">
          <Icon className="h-4 w-4" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium">{entry.title}</h4>
            <span className="text-xs opacity-75">{time}</span>
          </div>
          <p className="text-sm">{entry.description}</p>
          
          {entry.details && (
            <div className="mt-2 text-xs opacity-75">
              詳細: {JSON.stringify(entry.details)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * パフォーマンスパネル
 */
function PerformancePanel({ performance }: { performance: ExpeditionReport['performance'] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* トレーナーパフォーマンス */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            トレーナー評価
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <PerformanceMetric
              label="判断品質"
              value={performance.trainerPerformance.decisionQuality}
            />
            <PerformanceMetric
              label="適応性"
              value={performance.trainerPerformance.adaptability}
            />
            <PerformanceMetric
              label="信頼性"
              value={performance.trainerPerformance.reliability}
            />
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-medium mb-2">強み</h4>
            <ul className="space-y-1">
              {performance.trainerPerformance.strengths.map((strength, index) => (
                <li key={index} className="text-sm text-green-600 flex items-center gap-2">
                  <CheckCircle className="h-3 w-3" />
                  {strength}
                </li>
              ))}
            </ul>
          </div>
          
          {performance.trainerPerformance.weaknesses.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">改善点</h4>
              <ul className="space-y-1">
                {performance.trainerPerformance.weaknesses.map((weakness, index) => (
                  <li key={index} className="text-sm text-orange-600 flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3" />
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 効率性分析 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            効率性分析
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PerformanceMetric
            label="時間効率"
            value={performance.resourceUtilization.timeEfficiency}
          />
          <PerformanceMetric
            label="コスト効率"
            value={Math.min(performance.resourceUtilization.costEffectiveness / 3, 1)}
            suffix={`(${performance.resourceUtilization.costEffectiveness.toFixed(1)}x)`}
          />
          <PerformanceMetric
            label="介入効率"
            value={performance.resourceUtilization.interventionEfficiency}
          />
          <PerformanceMetric
            label="進行速度"
            value={Math.min(performance.efficiency.progressRate / 0.5, 1)}
            suffix={`(${performance.efficiency.progressRate.toFixed(2)}/h)`}
          />
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * パフォーマンス指標
 */
function PerformanceMetric({ 
  label, 
  value, 
  suffix 
}: { 
  label: string
  value: number
  suffix?: string 
}) {
  const percentage = Math.round(value * 100)
  const color = value >= 0.8 ? 'bg-green-500' : value >= 0.6 ? 'bg-blue-500' : value >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
  
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm">
          {percentage}% {suffix}
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  )
}

/**
 * 報酬パネル
 */
function RewardsPanel({ 
  statistics, 
  achievements 
}: { 
  statistics: ExpeditionReport['statistics']
  achievements: Achievement[]
}) {
  return (
    <div className="space-y-6">
      {/* 統計情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            獲得報酬
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={DollarSign}
              label="お金"
              value={`${statistics.moneyEarned.toLocaleString()}円`}
              color="text-green-600"
            />
            <StatCard
              icon={Eye}
              label="ポケモン"
              value={`${statistics.pokemonCaught}匹`}
              color="text-blue-600"
            />
            <StatCard
              icon={Gift}
              label="アイテム"
              value={`${statistics.itemsFound}個`}
              color="text-purple-600"
            />
            <StatCard
              icon={Star}
              label="経験値"
              value={`${statistics.experienceGained}EXP`}
              color="text-orange-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* 実績 */}
      {achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              獲得実績
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement, index) => (
                <AchievementCard key={index} achievement={achievement} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * 統計カード
 */
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: {
  icon: any
  label: string
  value: string
  color: string
}) {
  return (
    <div className="text-center p-4 bg-muted/50 rounded-lg">
      <Icon className={`h-6 w-6 mx-auto mb-2 ${color}`} />
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

/**
 * 実績カード
 */
function AchievementCard({ achievement }: { achievement: Achievement }) {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-yellow-400 bg-yellow-50 text-yellow-700'
      case 'rare': return 'border-purple-400 bg-purple-50 text-purple-700'
      case 'uncommon': return 'border-blue-400 bg-blue-50 text-blue-700'
      default: return 'border-gray-400 bg-gray-50 text-gray-700'
    }
  }

  return (
    <div className={`p-4 rounded-lg border-2 ${getRarityColor(achievement.rarity)}`}>
      <div className="flex items-center gap-2 mb-2">
        <Award className="h-5 w-5" />
        <h4 className="font-medium">{achievement.name}</h4>
        <Badge variant="outline" className="text-xs">
          {achievement.points}pt
        </Badge>
      </div>
      <p className="text-sm">{achievement.description}</p>
    </div>
  )
}

/**
 * 推奨事項パネル
 */
function RecommendationsPanel({ recommendations }: { recommendations: Recommendation[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          改善提案
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>現在提案できる改善事項はありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((recommendation, index) => (
              <RecommendationCard key={index} recommendation={recommendation} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * 推奨事項カード
 */
function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-300 bg-red-50'
      case 'medium': return 'border-yellow-300 bg-yellow-50'
      default: return 'border-blue-300 bg-blue-50'
    }
  }

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'hard': return <Badge variant="destructive">困難</Badge>
      case 'medium': return <Badge variant="outline">中程度</Badge>
      default: return <Badge variant="secondary">簡単</Badge>
    }
  }

  return (
    <div className={`p-4 rounded-lg border ${getPriorityColor(recommendation.priority)}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">{recommendation.title}</h4>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {recommendation.priority}優先度
          </Badge>
          {getDifficultyBadge(recommendation.difficulty)}
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground mb-3">
        {recommendation.description}
      </p>
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-green-600">
          期待効果: {recommendation.expectedImprovement}
        </span>
        <span className="text-orange-600">
          コスト: {recommendation.implementationCost.toLocaleString()}円
        </span>
      </div>
    </div>
  )
}

/**
 * 結果バッジ
 */
function OutcomeBadge({ outcome }: { outcome: string }) {
  const getOutcomeInfo = (outcome: string) => {
    switch (outcome) {
      case 'success':
        return { label: '成功', color: 'bg-green-500 text-white', icon: CheckCircle }
      case 'partial_success':
        return { label: '部分成功', color: 'bg-yellow-500 text-white', icon: AlertTriangle }
      default:
        return { label: '失敗', color: 'bg-red-500 text-white', icon: XCircle }
    }
  }

  const { label, color, icon: Icon } = getOutcomeInfo(outcome)

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${color}`}>
      <Icon className="h-4 w-4" />
      <span className="font-medium">{label}</span>
    </div>
  )
}

export default ExpeditionResultsView