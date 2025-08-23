/**
 * 派遣詳細レポートシステム
 * 派遣の詳細分析、統計、改善提案を生成
 */

import type { Expedition, ExpeditionEvent, Trainer, Pokemon, Intervention } from '@/lib/game-state/types'
import { realtimeManager } from '@/lib/real-time/RealtimeManager'
import type { ExpeditionLoot, RewardCalculation } from './ExpeditionRewardSystem'
import type { ExpeditionProgress } from './ExpeditionEngine'
import { memoize, performanceMonitor } from '@/lib/performance/PerformanceOptimizer'

export interface ExpeditionReport {
  expedition: Expedition
  summary: ExpeditionSummary
  timeline: TimelineEntry[]
  performance: PerformanceAnalysis
  recommendations: Recommendation[]
  statistics: ReportStatistics
  comparison: ComparisonData
  metadata: ReportMetadata
}

export interface ExpeditionSummary {
  outcome: 'success' | 'partial_success' | 'failure'
  duration: {
    planned: number // minutes
    actual: number // minutes
    efficiency: number // 0.0 to 1.0+
  }
  achievements: Achievement[]
  highlights: string[]
  concerns: string[]
  overallRating: number // 0.0 to 10.0
}

export interface TimelineEntry {
  timestamp: string
  type: 'start' | 'stage_change' | 'event' | 'intervention' | 'completion' | 'milestone'
  title: string
  description: string
  impact: 'positive' | 'negative' | 'neutral'
  details?: any
}

export interface PerformanceAnalysis {
  trainerPerformance: TrainerPerformance
  eventHandling: EventHandlingAnalysis
  resourceUtilization: ResourceUtilization
  riskManagement: RiskManagement
  efficiency: EfficiencyAnalysis
}

export interface TrainerPerformance {
  skillUtilization: Record<keyof Trainer['skills'], number> // 0.0 to 1.0
  decisionQuality: number // 0.0 to 1.0
  adaptability: number // 0.0 to 1.0
  reliability: number // 0.0 to 1.0
  improvement: number // -1.0 to 1.0, compared to previous expeditions
  strengths: string[]
  weaknesses: string[]
}

export interface EventHandlingAnalysis {
  totalEvents: number
  resolvedSuccessfully: number
  missedOpportunities: number
  avgResponseTime: number // minutes
  eventTypeBreakdown: Record<string, { count: number; successRate: number }>
  criticalEventHandling: number // 0.0 to 1.0
}

export interface ResourceUtilization {
  timeEfficiency: number // 0.0 to 1.0+
  costEffectiveness: number // value/cost ratio
  interventionEfficiency: number // 0.0 to 1.0
  wastedResources: number // estimated cost of inefficiencies
}

export interface RiskManagement {
  riskAssessmentAccuracy: number // 0.0 to 1.0
  riskMitigationSuccess: number // 0.0 to 1.0
  dangerousDecisions: number
  safetyMargin: number // how close to failure
}

export interface EfficiencyAnalysis {
  progressRate: number // progress per minute
  eventResolutionRate: number // events per hour
  resourceToOutcomeRatio: number // outcome value / total cost
  benchmarkComparison: number // compared to similar expeditions
}

export interface Achievement {
  id: string
  type: 'milestone' | 'record' | 'skill' | 'discovery' | 'survival'
  name: string
  description: string
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
  points: number
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low'
  category: 'training' | 'equipment' | 'strategy' | 'timing' | 'risk_management'
  title: string
  description: string
  expectedImprovement: string
  implementationCost: number
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface ReportStatistics {
  pokemonEncountered: number
  pokemonCaught: number
  itemsFound: number
  moneyEarned: number
  experienceGained: number
  distanceTraveled: number // km
  battlesWon: number
  dangersAvoided: number
}

export interface ComparisonData {
  previousExpedition?: ComparisonEntry
  trainerAverage: ComparisonEntry
  locationAverage: ComparisonEntry
  globalAverage: ComparisonEntry
}

export interface ComparisonEntry {
  successRate: number
  averageDuration: number
  averageReward: number
  eventSuccessRate: number
  ratingDifference: number // compared to current expedition
}

export interface ReportMetadata {
  generatedAt: string
  version: string
  reportId: string
  analysisDepth: 'basic' | 'detailed' | 'comprehensive'
  dataQuality: number // 0.0 to 1.0
  reliability: number // 0.0 to 1.0
}

/**
 * 派遣レポートシステム
 */
export class ExpeditionReportSystem {
  private static instance: ExpeditionReportSystem
  private reportHistory = new Map<string, ExpeditionReport>() // expeditionId -> report
  private trainerHistory = new Map<string, ExpeditionReport[]>() // trainerId -> reports
  private locationHistory = new Map<number, ExpeditionReport[]>() // locationId -> reports
  private achievements = new Map<string, Achievement>()
  
  private constructor() {
    this.initializeAchievements()
  }
  
  static getInstance(): ExpeditionReportSystem {
    if (!ExpeditionReportSystem.instance) {
      ExpeditionReportSystem.instance = new ExpeditionReportSystem()
    }
    return ExpeditionReportSystem.instance
  }
  
  /**
   * 派遣完了時に詳細レポートを生成
   */
  async generateExpeditionReport(
    expedition: Expedition,
    trainer: Trainer,
    progress: ExpeditionProgress,
    events: ExpeditionEvent[],
    interventions: Intervention[],
    loot: ExpeditionLoot,
    rewardCalculation: RewardCalculation
  ): Promise<ExpeditionReport> {
    console.log(`📊 レポート生成開始: ${expedition.id}`)
    
    const report = await performanceMonitor.measureAsync('expedition_report_generation', async () => {
      // 基本サマリーを生成
      const summary = this.generateSummary(expedition, progress, events, loot)
      
      // タイムラインを構築
      const timeline = this.buildTimeline(expedition, events, interventions, progress)
      
      // パフォーマンス分析
      const performance = this.analyzePerformance(expedition, trainer, events, interventions, progress)
      
      // 統計情報を計算
      const statistics = this.calculateStatistics(expedition, events, loot)
      
      // 比較データを取得
      const comparison = this.generateComparisonData(expedition, trainer, statistics)
      
      // 実績をチェック
      const achievements = this.checkAchievements(expedition, trainer, events, loot, statistics)
      summary.achievements = achievements
      
      // 推奨事項を生成
      const recommendations = this.generateRecommendations(performance, comparison, achievements)
      
      // レポートを構築
      const expeditionReport: ExpeditionReport = {
        expedition,
        summary,
        timeline,
        performance,
        recommendations,
        statistics,
        comparison,
        metadata: {
          generatedAt: new Date().toISOString(),
          version: '1.0.0',
          reportId: `report_${expedition.id}_${Date.now()}`,
          analysisDepth: 'comprehensive',
          dataQuality: this.assessDataQuality(expedition, events, interventions),
          reliability: this.calculateReliability(expedition, events)
        }
      }
      
      return expeditionReport
    })
    
    // レポートを保存
    this.storeReport(expedition.id, trainer.id, expedition.locationId, report)
    
    console.log(`✅ レポート生成完了: 評価${report.summary.overallRating}/10`)
    
    // リアルタイム通知
    realtimeManager.emitDataChange({
      category: 'expeditions',
      action: 'create',
      entityId: expedition.id,
      data: { reportId: report.metadata.reportId, rating: report.summary.overallRating },
      source: 'system_update'
    })
    
    return report
  }
  
  /**
   * サマリーを生成
   */
  private generateSummary(
    expedition: Expedition,
    progress: ExpeditionProgress,
    events: ExpeditionEvent[],
    loot: ExpeditionLoot
  ): ExpeditionSummary {
    // 結果判定
    const outcome = this.determineOutcome(progress, events, loot)
    
    // 時間効率
    const plannedDuration = expedition.targetDuration * 60 // minutes
    const actualDuration = expedition.actualEndTime 
      ? (new Date(expedition.actualEndTime).getTime() - new Date(expedition.startTime).getTime()) / (1000 * 60)
      : plannedDuration
    const efficiency = plannedDuration / actualDuration
    
    // ハイライトと懸念事項
    const highlights = this.generateHighlights(events, loot, efficiency)
    const concerns = this.generateConcerns(events, progress, efficiency)
    
    // 総合評価
    const overallRating = this.calculateOverallRating(outcome, efficiency, events, loot)
    
    return {
      outcome,
      duration: {
        planned: plannedDuration,
        actual: actualDuration,
        efficiency
      },
      achievements: [], // 後で設定
      highlights,
      concerns,
      overallRating
    }
  }
  
  /**
   * タイムラインを構築
   */
  private buildTimeline(
    expedition: Expedition,
    events: ExpeditionEvent[],
    interventions: Intervention[],
    progress: ExpeditionProgress
  ): TimelineEntry[] {
    const timeline: TimelineEntry[] = []
    
    // 開始エントリ
    timeline.push({
      timestamp: expedition.startTime,
      type: 'start',
      title: '派遣開始',
      description: `${expedition.mode}モードで${expedition.locationId}番エリアへの派遣を開始`,
      impact: 'neutral'
    })
    
    // イベントエントリ
    events.forEach(event => {
      timeline.push({
        timestamp: event.timestamp,
        type: 'event',
        title: this.getEventTitle(event),
        description: event.message,
        impact: this.getEventImpact(event),
        details: {
          type: event.type,
          resolved: event.resolved,
          chosenAction: event.chosenAction
        }
      })
    })
    
    // 介入エントリ
    interventions.forEach(intervention => {
      timeline.push({
        timestamp: intervention.timestamp,
        type: 'intervention',
        title: 'プレイヤー介入',
        description: intervention.effect,
        impact: intervention.result === 'success' ? 'positive' : 'negative',
        details: {
          action: intervention.action,
          result: intervention.result
        }
      })
    })
    
    // ステージ変更エントリ（模擬）
    const stages = ['preparation', 'early', 'middle', 'late', 'completion']
    const startTime = new Date(expedition.startTime).getTime()
    const duration = expedition.actualEndTime 
      ? new Date(expedition.actualEndTime).getTime() - startTime
      : expedition.targetDuration * 60 * 60 * 1000
    
    stages.forEach((stage, index) => {
      if (index === 0) return // 開始は既に追加済み
      
      const stageTime = new Date(startTime + (duration * index / stages.length))
      timeline.push({
        timestamp: stageTime.toISOString(),
        type: 'stage_change',
        title: `${stage}段階に移行`,
        description: `派遣が${stage}段階に入りました`,
        impact: 'neutral'
      })
    })
    
    // 完了エントリ
    if (expedition.actualEndTime) {
      timeline.push({
        timestamp: expedition.actualEndTime,
        type: 'completion',
        title: '派遣完了',
        description: expedition.result?.summary || '派遣が完了しました',
        impact: expedition.result?.success ? 'positive' : 'negative'
      })
    }
    
    // 時系列順にソート
    return timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }
  
  /**
   * パフォーマンス分析
   */
  private analyzePerformance(
    expedition: Expedition,
    trainer: Trainer,
    events: ExpeditionEvent[],
    interventions: Intervention[],
    progress: ExpeditionProgress
  ): PerformanceAnalysis {
    // トレーナーパフォーマンス
    const trainerPerformance = this.analyzeTrainerPerformance(trainer, events, interventions)
    
    // イベント処理分析
    const eventHandling = this.analyzeEventHandling(events)
    
    // リソース利用効率
    const resourceUtilization = this.analyzeResourceUtilization(expedition, interventions, progress)
    
    // リスク管理
    const riskManagement = this.analyzeRiskManagement(events, progress)
    
    // 効率性分析
    const efficiency = this.analyzeEfficiency(expedition, events, progress)
    
    return {
      trainerPerformance,
      eventHandling,
      resourceUtilization,
      riskManagement,
      efficiency
    }
  }
  
  /**
   * トレーナーパフォーマンス分析
   */
  private analyzeTrainerPerformance(
    trainer: Trainer,
    events: ExpeditionEvent[],
    interventions: Intervention[]
  ): TrainerPerformance {
    // スキル活用度
    const skillUtilization = this.calculateSkillUtilization(trainer, events)
    
    // 意思決定品質
    const decisionQuality = this.calculateDecisionQuality(events)
    
    // 適応性
    const adaptability = this.calculateAdaptability(events, interventions)
    
    // 信頼性
    const reliability = Math.min(trainer.trustLevel / 100, 1.0)
    
    // 改善度（前回比較）
    const improvement = this.calculateImprovement(trainer.id)
    
    // 強み・弱点
    const strengths = this.identifyStrengths(trainer, skillUtilization, decisionQuality)
    const weaknesses = this.identifyWeaknesses(trainer, skillUtilization, decisionQuality)
    
    return {
      skillUtilization,
      decisionQuality,
      adaptability,
      reliability,
      improvement,
      strengths,
      weaknesses
    }
  }
  
  /**
   * イベント処理分析
   */
  private analyzeEventHandling(events: ExpeditionEvent[]): EventHandlingAnalysis {
    const totalEvents = events.length
    const resolvedSuccessfully = events.filter(e => e.resolved && e.result?.includes('成功')).length
    const missedOpportunities = events.filter(e => !e.resolved).length
    
    // 平均応答時間（模擬）
    const avgResponseTime = 15 // 15分と仮定
    
    // イベントタイプ別分析
    const eventTypeBreakdown = events.reduce((acc, event) => {
      if (!acc[event.type]) {
        acc[event.type] = { count: 0, successRate: 0 }
      }
      acc[event.type].count++
      if (event.resolved && event.result?.includes('成功')) {
        acc[event.type].successRate++
      }
      return acc
    }, {} as Record<string, { count: number; successRate: number }>)
    
    // 成功率を計算
    Object.values(eventTypeBreakdown).forEach(breakdown => {
      breakdown.successRate = breakdown.count > 0 ? breakdown.successRate / breakdown.count : 0
    })
    
    // 重要イベント処理評価
    const criticalEvents = events.filter(e => e.type === 'danger' || e.type === 'pokemon_encounter')
    const criticalEventHandling = criticalEvents.length > 0 
      ? criticalEvents.filter(e => e.resolved).length / criticalEvents.length 
      : 1.0
    
    return {
      totalEvents,
      resolvedSuccessfully,
      missedOpportunities,
      avgResponseTime,
      eventTypeBreakdown,
      criticalEventHandling
    }
  }
  
  /**
   * 実績をチェック
   */
  private checkAchievements(
    expedition: Expedition,
    trainer: Trainer,
    events: ExpeditionEvent[],
    loot: ExpeditionLoot,
    statistics: ReportStatistics
  ): Achievement[] {
    const achievements: Achievement[] = []
    
    // 完璧な派遣
    if (events.length > 0 && events.every(e => e.resolved)) {
      achievements.push({
        id: 'perfect_handling',
        type: 'skill',
        name: '完璧な対応',
        description: '全てのイベントを適切に処理しました',
        rarity: 'rare',
        points: 100
      })
    }
    
    // 効率の達人
    if (expedition.targetDuration * 60 > (expedition.actualEndTime ? 
      (new Date(expedition.actualEndTime).getTime() - new Date(expedition.startTime).getTime()) / (1000 * 60) : 
      expedition.targetDuration * 60)) {
      achievements.push({
        id: 'efficiency_master',
        type: 'record',
        name: '効率の達人',
        description: '予定時間より早く派遣を完了しました',
        rarity: 'uncommon',
        points: 50
      })
    }
    
    // レアポケモンハンター
    if (loot.pokemon.some(p => p.rarityBonus >= 2)) {
      achievements.push({
        id: 'rare_hunter',
        type: 'discovery',
        name: 'レアポケモンハンター',
        description: '珍しいポケモンを発見しました',
        rarity: 'rare',
        points: 150
      })
    }
    
    // サバイバー
    const dangerEvents = events.filter(e => e.type === 'danger')
    if (dangerEvents.length >= 3 && dangerEvents.every(e => e.resolved)) {
      achievements.push({
        id: 'survivor',
        type: 'survival',
        name: 'サバイバー',
        description: '多数の危険を乗り越えました',
        rarity: 'uncommon',
        points: 75
      })
    }
    
    return achievements
  }
  
  /**
   * 推奨事項を生成
   */
  private generateRecommendations(
    performance: PerformanceAnalysis,
    comparison: ComparisonData,
    achievements: Achievement[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = []
    
    // スキル改善提案
    if (performance.trainerPerformance.decisionQuality < 0.7) {
      recommendations.push({
        priority: 'high',
        category: 'training',
        title: 'トレーナー判断力向上トレーニング',
        description: 'より適切な判断ができるよう、シミュレーション訓練を実施することを推奨します',
        expectedImprovement: '判断品質20-30%向上',
        implementationCost: 5000,
        difficulty: 'medium'
      })
    }
    
    // 装備改善提案
    if (performance.resourceUtilization.costEffectiveness < 1.5) {
      recommendations.push({
        priority: 'medium',
        category: 'equipment',
        title: '効率化装備の導入',
        description: 'より効率的な探索装備の導入により、成果向上が期待できます',
        expectedImprovement: 'コスト効率25%向上',
        implementationCost: 3000,
        difficulty: 'easy'
      })
    }
    
    // 戦略改善提案
    if (performance.riskManagement.safetyMargin < 0.3) {
      recommendations.push({
        priority: 'high',
        category: 'strategy',
        title: 'リスク管理戦略の見直し',
        description: '安全マージンを確保するため、より慎重な戦略を検討してください',
        expectedImprovement: '事故率50%減少',
        implementationCost: 0,
        difficulty: 'medium'
      })
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }
  
  /**
   * ユーティリティメソッド群
   */
  private determineOutcome(
    progress: ExpeditionProgress,
    events: ExpeditionEvent[],
    loot: ExpeditionLoot
  ): ExpeditionSummary['outcome'] {
    if (progress.overallProgress >= 0.95 && loot.totalValue > 1000) return 'success'
    if (progress.overallProgress >= 0.7) return 'partial_success'
    return 'failure'
  }
  
  private generateHighlights(
    events: ExpeditionEvent[],
    loot: ExpeditionLoot,
    efficiency: number
  ): string[] {
    const highlights: string[] = []
    
    if (efficiency > 1.1) highlights.push('予定より早期完了')
    if (loot.pokemon.length > 0) highlights.push(`${loot.pokemon.length}匹のポケモンを発見`)
    if (loot.specialRewards.length > 0) highlights.push('特別報酬を獲得')
    if (events.filter(e => e.resolved).length === events.length) highlights.push('全イベントを処理')
    
    return highlights
  }
  
  private generateConcerns(
    events: ExpeditionEvent[],
    progress: ExpeditionProgress,
    efficiency: number
  ): string[] {
    const concerns: string[] = []
    
    if (efficiency < 0.8) concerns.push('予定時間を大幅超過')
    if (progress.riskLevel === 'critical') concerns.push('危険レベルが非常に高い')
    if (events.filter(e => !e.resolved).length > 2) concerns.push('多数のイベント未処理')
    if (progress.overallProgress < 0.5) concerns.push('進行率が低い')
    
    return concerns
  }
  
  private calculateOverallRating(
    outcome: ExpeditionSummary['outcome'],
    efficiency: number,
    events: ExpeditionEvent[],
    loot: ExpeditionLoot
  ): number {
    let rating = 5.0 // ベース評価
    
    // 結果による調整
    switch (outcome) {
      case 'success': rating += 2.0; break
      case 'partial_success': rating += 0.5; break
      case 'failure': rating -= 2.0; break
    }
    
    // 効率による調整
    rating += (efficiency - 1.0) * 2
    
    // イベント処理による調整
    const eventSuccessRate = events.length > 0 ? events.filter(e => e.resolved).length / events.length : 1
    rating += eventSuccessRate * 2 - 1
    
    // 価値による調整
    if (loot.totalValue > 5000) rating += 1
    if (loot.pokemon.length > 2) rating += 0.5
    
    return Math.max(0, Math.min(10, rating))
  }
  
  private getEventTitle(event: ExpeditionEvent): string {
    const titles = {
      pokemon_encounter: 'ポケモン遭遇',
      item_discovery: 'アイテム発見',
      danger: '危険遭遇',
      weather: '天候変化',
      trainer_encounter: 'トレーナー遭遇'
    }
    return titles[event.type] || 'イベント発生'
  }
  
  private getEventImpact(event: ExpeditionEvent): TimelineEntry['impact'] {
    if (!event.resolved) return 'neutral'
    if (event.result?.includes('成功')) return 'positive'
    if (event.result?.includes('失敗')) return 'negative'
    return 'neutral'
  }
  
  private calculateSkillUtilization(trainer: Trainer, events: ExpeditionEvent[]): Record<keyof Trainer['skills'], number> {
    // 実際のスキル利用度計算（簡易版）
    return {
      capture: Math.min(events.filter(e => e.type === 'pokemon_encounter').length * 0.2, 1.0),
      exploration: Math.min(events.length * 0.1, 1.0),
      battle: Math.min(events.filter(e => e.type === 'danger').length * 0.3, 1.0),
      research: Math.min(events.filter(e => e.type === 'item_discovery').length * 0.25, 1.0),
      healing: 0.5 // 固定値（実装詳細化時に改善）
    }
  }
  
  private calculateDecisionQuality(events: ExpeditionEvent[]): number {
    if (events.length === 0) return 0.8
    const successfulDecisions = events.filter(e => e.resolved && e.result?.includes('成功')).length
    return successfulDecisions / events.length
  }
  
  private calculateAdaptability(events: ExpeditionEvent[], interventions: Intervention[]): number {
    // 状況変化への対応力
    const varietyOfEvents = new Set(events.map(e => e.type)).size
    const interventionSuccess = interventions.filter(i => i.result === 'success').length
    return Math.min((varietyOfEvents * 0.2) + (interventionSuccess * 0.1), 1.0)
  }
  
  private calculateImprovement(trainerId: string): number {
    const history = this.trainerHistory.get(trainerId) || []
    if (history.length < 2) return 0
    
    const recent = history.slice(-2)
    return recent[1].summary.overallRating - recent[0].summary.overallRating
  }
  
  private identifyStrengths(trainer: Trainer, skillUtilization: any, decisionQuality: number): string[] {
    const strengths: string[] = []
    
    Object.entries(trainer.skills).forEach(([skill, level]) => {
      if (level >= 7) strengths.push(`${skill}スキルが優秀`)
    })
    
    if (decisionQuality > 0.8) strengths.push('判断力が優秀')
    if (trainer.trustLevel > 80) strengths.push('信頼関係が良好')
    
    return strengths
  }
  
  private identifyWeaknesses(trainer: Trainer, skillUtilization: any, decisionQuality: number): string[] {
    const weaknesses: string[] = []
    
    Object.entries(trainer.skills).forEach(([skill, level]) => {
      if (level <= 3) weaknesses.push(`${skill}スキルの向上が必要`)
    })
    
    if (decisionQuality < 0.6) weaknesses.push('判断力の向上が必要')
    if (trainer.trustLevel < 50) weaknesses.push('信頼関係の構築が必要')
    
    return weaknesses
  }
  
  private analyzeResourceUtilization(
    expedition: Expedition,
    interventions: Intervention[],
    progress: ExpeditionProgress
  ): ResourceUtilization {
    const timeEfficiency = progress.overallProgress / (expedition.targetDuration / 60) // hours to minutes conversion
    const interventionCost = interventions.length * 500 // 平均介入コスト
    const expectedValue = 2000 // 期待価値
    const costEffectiveness = expectedValue / Math.max(interventionCost, 100)
    
    return {
      timeEfficiency: Math.min(timeEfficiency, 2.0),
      costEffectiveness,
      interventionEfficiency: interventions.filter(i => i.result === 'success').length / Math.max(interventions.length, 1),
      wastedResources: Math.max(0, interventionCost - expectedValue * 0.5)
    }
  }
  
  private analyzeRiskManagement(events: ExpeditionEvent[], progress: ExpeditionProgress): RiskManagement {
    const dangerEvents = events.filter(e => e.type === 'danger')
    const riskMitigationSuccess = dangerEvents.length > 0 
      ? dangerEvents.filter(e => e.resolved).length / dangerEvents.length
      : 1.0
    
    return {
      riskAssessmentAccuracy: 0.8, // 実装詳細化時に改善
      riskMitigationSuccess,
      dangerousDecisions: events.filter(e => e.type === 'danger' && !e.resolved).length,
      safetyMargin: Math.max(0, 1.0 - (progress.riskLevel === 'critical' ? 0.8 : progress.riskLevel === 'high' ? 0.6 : 0.4))
    }
  }
  
  private analyzeEfficiency(expedition: Expedition, events: ExpeditionEvent[], progress: ExpeditionProgress): EfficiencyAnalysis {
    const duration = expedition.actualEndTime 
      ? (new Date(expedition.actualEndTime).getTime() - new Date(expedition.startTime).getTime()) / (1000 * 60)
      : expedition.targetDuration * 60
    
    return {
      progressRate: progress.overallProgress / (duration / 60), // progress per hour
      eventResolutionRate: events.filter(e => e.resolved).length / (duration / 60), // events per hour
      resourceToOutcomeRatio: progress.overallProgress / Math.max(duration / expedition.targetDuration, 0.1),
      benchmarkComparison: 1.0 // 実装詳細化時に改善
    }
  }
  
  private calculateStatistics(expedition: Expedition, events: ExpeditionEvent[], loot: ExpeditionLoot): ReportStatistics {
    return {
      pokemonEncountered: events.filter(e => e.type === 'pokemon_encounter').length,
      pokemonCaught: loot.pokemon.length,
      itemsFound: loot.items.length,
      moneyEarned: loot.money,
      experienceGained: loot.experience,
      distanceTraveled: expedition.targetDuration * 5, // 仮定: 1時間あたり5km
      battlesWon: events.filter(e => e.type === 'danger' && e.resolved).length,
      dangersAvoided: events.filter(e => e.type === 'danger').length
    }
  }
  
  private generateComparisonData(expedition: Expedition, trainer: Trainer, statistics: ReportStatistics): ComparisonData {
    // 実際の実装では履歴データベースから取得
    return {
      trainerAverage: {
        successRate: 0.7,
        averageDuration: expedition.targetDuration * 60,
        averageReward: 2000,
        eventSuccessRate: 0.75,
        ratingDifference: 0
      },
      locationAverage: {
        successRate: 0.65,
        averageDuration: expedition.targetDuration * 60 * 1.1,
        averageReward: 1800,
        eventSuccessRate: 0.7,
        ratingDifference: 0
      },
      globalAverage: {
        successRate: 0.6,
        averageDuration: expedition.targetDuration * 60 * 1.2,
        averageReward: 1500,
        eventSuccessRate: 0.65,
        ratingDifference: 0
      }
    }
  }
  
  private assessDataQuality(expedition: Expedition, events: ExpeditionEvent[], interventions: Intervention[]): number {
    let quality = 1.0
    
    if (!expedition.actualEndTime) quality -= 0.2
    if (events.length === 0) quality -= 0.3
    if (!expedition.result) quality -= 0.1
    
    return Math.max(0, quality)
  }
  
  private calculateReliability(expedition: Expedition, events: ExpeditionEvent[]): number {
    // データの信頼性を計算
    return Math.min(1.0, events.length * 0.1 + 0.5)
  }
  
  /**
   * レポートを保存
   */
  private storeReport(expeditionId: string, trainerId: string, locationId: number, report: ExpeditionReport): void {
    this.reportHistory.set(expeditionId, report)
    
    const trainerReports = this.trainerHistory.get(trainerId) || []
    trainerReports.push(report)
    this.trainerHistory.set(trainerId, trainerReports.slice(-20)) // 最新20件
    
    const locationReports = this.locationHistory.get(locationId) || []
    locationReports.push(report)
    this.locationHistory.set(locationId, locationReports.slice(-50)) // 最新50件
  }
  
  /**
   * レポート履歴を取得
   */
  getReportHistory(type: 'expedition' | 'trainer' | 'location', id: string | number): ExpeditionReport[] {
    switch (type) {
      case 'expedition':
        const report = this.reportHistory.get(id as string)
        return report ? [report] : []
      case 'trainer':
        return this.trainerHistory.get(id as string) || []
      case 'location':
        return this.locationHistory.get(id as number) || []
      default:
        return []
    }
  }
  
  /**
   * 統計サマリーを取得
   */
  getStatisticsSummary(): any {
    const allReports = Array.from(this.reportHistory.values())
    
    return {
      totalReports: allReports.length,
      averageRating: allReports.reduce((sum, r) => sum + r.summary.overallRating, 0) / Math.max(allReports.length, 1),
      successRate: allReports.filter(r => r.summary.outcome === 'success').length / Math.max(allReports.length, 1),
      totalAchievements: allReports.reduce((sum, r) => sum + r.summary.achievements.length, 0)
    }
  }
  
  /**
   * 実績を初期化
   */
  private initializeAchievements(): void {
    console.log('🏆 実績システムを初期化しました')
  }
  
  /**
   * リソースを解放
   */
  destroy(): void {
    this.reportHistory.clear()
    this.trainerHistory.clear()
    this.locationHistory.clear()
    this.achievements.clear()
    
    console.log('🗑️ レポートシステムを破棄しました')
  }
}

// シングルトンインスタンス
export const expeditionReportSystem = ExpeditionReportSystem.getInstance()