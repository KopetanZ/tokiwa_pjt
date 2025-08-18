// ゲームロジックアルゴリズム総合システム
import { economySystem } from './economy'
import { facilitySystem } from './facilities'
import { realtimeSystem } from './realtime'
import { generateRandomWildPokemon } from './pokeapi'

// ゲーム進行状況
export interface GameProgress {
  level: number
  experience: number
  nextLevelExp: number
  totalPlayTime: number // 分
  achievementPoints: number
  unlockedFeatures: string[]
  difficulty: 'easy' | 'normal' | 'hard' | 'expert'
}

// バランスパラメータ
export interface GameBalance {
  trainerGrowthRate: number
  pokemonGrowthRate: number
  expeditionDifficulty: number
  economyInflation: number
  researchSpeed: number
  facilityEfficiency: number
}

// 成果指標
export interface PerformanceMetrics {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  expeditionsCompleted: number
  expeditionSuccessRate: number
  pokemonCaught: number
  trainersHired: number
  facilitiesUpgraded: number
  researchCompleted: number
  averageEfficiency: number
}

// ゲームロジック統合クラス
class GameLogicSystem {
  private gameProgress: GameProgress
  private gameBalance: GameBalance
  private performanceMetrics: PerformanceMetrics
  private lastCalculationTime: number = Date.now()
  
  constructor() {
    this.gameProgress = this.initializeGameProgress()
    this.gameBalance = this.initializeGameBalance()
    this.performanceMetrics = this.initializeMetrics()
    
    // 定期計算開始
    this.startPeriodicCalculations()
  }
  
  // ゲーム進行状況初期化
  private initializeGameProgress(): GameProgress {
    return {
      level: 1,
      experience: 0,
      nextLevelExp: 1000,
      totalPlayTime: 0,
      achievementPoints: 0,
      unlockedFeatures: ['basic_training', 'pokemon_management', 'simple_expeditions'],
      difficulty: 'normal'
    }
  }
  
  // バランスパラメータ初期化
  private initializeGameBalance(): GameBalance {
    return {
      trainerGrowthRate: 1.0,
      pokemonGrowthRate: 1.0,
      expeditionDifficulty: 1.0,
      economyInflation: 1.0,
      researchSpeed: 1.0,
      facilityEfficiency: 1.0
    }
  }
  
  // 成果指標初期化
  private initializeMetrics(): PerformanceMetrics {
    return {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      expeditionsCompleted: 0,
      expeditionSuccessRate: 0,
      pokemonCaught: 0,
      trainersHired: 0,
      facilitiesUpgraded: 0,
      researchCompleted: 0,
      averageEfficiency: 1.0
    }
  }
  
  // 定期計算開始
  private startPeriodicCalculations(): void {
    // 1分毎の計算
    setInterval(() => {
      this.updateGameProgress()
      this.calculatePerformanceMetrics()
      this.adjustGameBalance()
      this.processIdleGains()
    }, 60 * 1000)
    
    // 5分毎の詳細計算
    setInterval(() => {
      this.deepAnalysisUpdate()
      this.optimizeGameBalance()
    }, 5 * 60 * 1000)
  }
  
  // ゲーム進行状況更新
  private updateGameProgress(): void {
    const now = Date.now()
    const timeDiff = (now - this.lastCalculationTime) / (60 * 1000) // 分
    this.lastCalculationTime = now
    
    // プレイ時間更新
    this.gameProgress.totalPlayTime += timeDiff
    
    // 経験値計算
    const expGain = this.calculateExperienceGain()
    this.gameProgress.experience += expGain
    
    // レベルアップチェック
    this.checkLevelUp()
    
    // 新機能解放チェック
    this.checkFeatureUnlocks()
  }
  
  // 経験値獲得計算
  private calculateExperienceGain(): number {
    const facilities = facilitySystem.getFacilities()
    const activeFacilities = facilities.filter(f => f.status === 'active').length
    const averageEfficiency = facilities.reduce((sum, f) => sum + f.efficiency, 0) / facilities.length
    
    // 基礎経験値: 施設数 × 効率 × 時間
    const baseExp = activeFacilities * averageEfficiency * 10
    
    // ボーナス経験値
    const bonusMultipliers = [
      this.gameBalance.facilityEfficiency,
      this.gameProgress.difficulty === 'hard' ? 1.5 : 1.0,
      this.gameProgress.difficulty === 'expert' ? 2.0 : 1.0
    ]
    
    const totalMultiplier = bonusMultipliers.reduce((total, mult) => total * mult, 1)
    
    return Math.floor(baseExp * totalMultiplier)
  }
  
  // レベルアップチェック
  private checkLevelUp(): void {
    while (this.gameProgress.experience >= this.gameProgress.nextLevelExp) {
      this.gameProgress.experience -= this.gameProgress.nextLevelExp
      this.gameProgress.level++
      this.gameProgress.nextLevelExp = Math.floor(this.gameProgress.nextLevelExp * 1.2)
      
      // レベルアップボーナス
      economySystem.recordIncome(
        'expedition',
        1000 * this.gameProgress.level,
        `レベルアップボーナス (Lv.${this.gameProgress.level})`,
        `levelup_${this.gameProgress.level}`
      )
      
      console.log(`🎉 レベルアップ！ Lv.${this.gameProgress.level}`)
    }
  }
  
  // 新機能解放チェック
  private checkFeatureUnlocks(): void {
    const levelUnlocks: Record<number, string[]> = {
      3: ['advanced_training', 'pokemon_breeding'],
      5: ['research_lab', 'expedition_optimization'],
      8: ['pokemon_contests', 'trading_system'],
      10: ['elite_expeditions', 'legendary_encounters'],
      15: ['international_expeditions', 'pokemon_league'],
      20: ['master_facilities', 'ultimate_challenges']
    }
    
    const unlocksForCurrentLevel = levelUnlocks[this.gameProgress.level]
    if (unlocksForCurrentLevel) {
      unlocksForCurrentLevel.forEach(feature => {
        if (!this.gameProgress.unlockedFeatures.includes(feature)) {
          this.gameProgress.unlockedFeatures.push(feature)
          console.log(`🔓 新機能解放: ${feature}`)
        }
      })
    }
  }
  
  // 成果指標計算
  private calculatePerformanceMetrics(): void {
    const financialStatus = economySystem.getFinancialStatus()
    const facilities = facilitySystem.getFacilities()
    const activeExpeditions = realtimeSystem.getActiveExpeditions()
    
    // 財務指標更新
    this.performanceMetrics.totalRevenue = financialStatus.monthlyIncome
    this.performanceMetrics.totalExpenses = financialStatus.monthlyExpenses
    this.performanceMetrics.netProfit = financialStatus.netIncome
    
    // 施設効率平均
    this.performanceMetrics.averageEfficiency = facilities.length > 0 
      ? facilities.reduce((sum, f) => sum + f.efficiency, 0) / facilities.length
      : 1.0
    
    // 派遣成功率（サンプルデータ）
    this.performanceMetrics.expeditionSuccessRate = Math.min(100, 
      70 + (this.gameProgress.level * 2) + (this.performanceMetrics.averageEfficiency * 10)
    )
  }
  
  // ゲームバランス調整
  private adjustGameBalance(): void {
    // レベルに応じた難易度調整
    const levelFactor = Math.min(2.0, 1 + (this.gameProgress.level - 1) * 0.05)
    
    // パフォーマンスに応じた調整
    const profitabilityFactor = this.performanceMetrics.netProfit > 0 ? 1.1 : 0.9
    
    // バランス更新
    this.gameBalance.expeditionDifficulty = levelFactor * profitabilityFactor
    this.gameBalance.economyInflation = Math.min(1.5, 1 + (this.gameProgress.level - 1) * 0.02)
    this.gameBalance.facilityEfficiency = Math.max(0.8, 1 + (this.performanceMetrics.averageEfficiency - 1) * 0.1)
  }
  
  // 放置時間収益処理
  private processIdleGains(): void {
    const facilities = facilitySystem.getFacilities()
    const activeFacilities = facilities.filter(f => f.status === 'active')
    
    // 施設毎の自動収益
    activeFacilities.forEach(facility => {
      const baseIncome = facility.level * facility.efficiency * 50 // 基礎収益
      const adjustedIncome = Math.floor(baseIncome * this.gameBalance.facilityEfficiency)
      
      if (adjustedIncome > 0) {
        economySystem.recordIncome(
          'facility',
          adjustedIncome,
          `${facility.nameJa} 自動収益`,
          facility.id
        )
      }
    })
    
    // 維持費自動支払い
    const maintenanceCost = facilitySystem.getTotalMaintenanceCost()
    if (maintenanceCost > 0) {
      economySystem.makePayment(
        'facility',
        Math.floor(maintenanceCost / 30), // 日割り計算
        '施設維持費（日割り）',
        'daily_maintenance'
      )
    }
  }
  
  // 詳細分析更新
  private deepAnalysisUpdate(): void {
    // 長期トレンド分析
    const trends = this.analyzeTrends()
    
    // AIによるレコメンデーション生成
    const recommendations = this.generateRecommendations(trends)
    
    console.log('📊 詳細分析完了', { trends, recommendations })
  }
  
  // トレンド分析
  private analyzeTrends(): {
    growthTrend: 'positive' | 'negative' | 'stable'
    efficiencyTrend: 'improving' | 'declining' | 'stable'
    profitabilityTrend: 'increasing' | 'decreasing' | 'stable'
  } {
    // 簡略化されたトレンド分析
    const currentProfit = this.performanceMetrics.netProfit
    const currentEfficiency = this.performanceMetrics.averageEfficiency
    
    return {
      growthTrend: currentProfit > 0 ? 'positive' : 'negative',
      efficiencyTrend: currentEfficiency > 1.2 ? 'improving' : 'stable',
      profitabilityTrend: currentProfit > 5000 ? 'increasing' : 'stable'
    }
  }
  
  // レコメンデーション生成
  private generateRecommendations(trends: any): string[] {
    const recommendations: string[] = []
    
    if (trends.profitabilityTrend === 'decreasing') {
      recommendations.push('支出の見直しを検討してください')
      recommendations.push('より効率的な派遣戦略を検討してください')
    }
    
    if (trends.efficiencyTrend === 'declining') {
      recommendations.push('施設のアップグレードを検討してください')
      recommendations.push('トレーナーの訓練を強化してください')
    }
    
    if (this.gameProgress.level >= 5 && !this.gameProgress.unlockedFeatures.includes('research_lab')) {
      recommendations.push('研究所の建設を検討してください')
    }
    
    return recommendations
  }
  
  // バランス最適化
  private optimizeGameBalance(): void {
    // パフォーマンスメトリクスに基づくバランス調整
    const metrics = this.performanceMetrics
    
    // 成功率が高すぎる場合は難易度上昇
    if (metrics.expeditionSuccessRate > 90) {
      this.gameBalance.expeditionDifficulty *= 1.1
    }
    
    // 利益率が高すぎる場合はインフレーション
    const profitMargin = metrics.totalRevenue > 0 ? metrics.netProfit / metrics.totalRevenue : 0
    if (profitMargin > 0.5) {
      this.gameBalance.economyInflation *= 1.05
    }
    
    // 効率が低すぎる場合は補正
    if (metrics.averageEfficiency < 1.0) {
      this.gameBalance.facilityEfficiency *= 1.05
    }
  }
  
  // 緊急イベント生成
  generateEmergencyEvent(): {
    type: 'natural_disaster' | 'economic_crisis' | 'pokemon_outbreak' | 'facility_malfunction'
    severity: 'minor' | 'major' | 'critical'
    duration: number // 分
    effects: Record<string, number>
    description: string
  } {
    const eventTypes = ['natural_disaster', 'economic_crisis', 'pokemon_outbreak', 'facility_malfunction']
    const severities = ['minor', 'major', 'critical']
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)] as any
    const severity = severities[Math.floor(Math.random() * severities.length)] as any
    
    const baseEvents: Record<string, { description: string; effects: Record<string, number> }> = {
      natural_disaster: {
        description: '自然災害が発生しました！',
        effects: { expeditionDifficulty: 1.5, facilityEfficiency: 0.8 }
      },
      economic_crisis: {
        description: '経済危機が発生しました！',
        effects: { economyInflation: 1.3, trainerGrowthRate: 0.9 }
      },
      pokemon_outbreak: {
        description: '野生ポケモンの大量発生！',
        effects: { pokemonGrowthRate: 1.4, expeditionDifficulty: 1.2 }
      },
      facility_malfunction: {
        description: '施設の故障が発生しました！',
        effects: { facilityEfficiency: 0.7, researchSpeed: 0.8 }
      }
    }
    
    const severityMultipliers: Record<string, number> = { minor: 1.0, major: 1.5, critical: 2.0 }
    const durations: Record<string, number> = { minor: 30, major: 60, critical: 120 }
    
    const severityMultiplier = severityMultipliers[severity] || 1.0
    const duration = durations[severity] || 30 // 分
    
    const baseEvent = baseEvents[type]
    const adjustedEffects = Object.fromEntries(
      Object.entries(baseEvent.effects).map(([key, value]) => [
        key, 
        value < 1 ? Math.max(0.5, value / severityMultiplier) : value * severityMultiplier
      ])
    )
    
    return {
      type,
      severity,
      duration,
      effects: adjustedEffects,
      description: `${baseEvent.description} (${severity === 'minor' ? '軽微' : severity === 'major' ? '重大' : '致命的'})`
    }
  }
  
  // 成果報酬計算
  calculateAchievementReward(achievementType: string, value: number): {
    money: number
    experience: number
    items: string[]
  } {
    const rewardRates = {
      expedition_complete: { money: 100, exp: 50 },
      pokemon_catch: { money: 200, exp: 25 },
      facility_upgrade: { money: 500, exp: 100 },
      research_complete: { money: 1000, exp: 200 },
      level_up: { money: 1000, exp: 0 }
    }
    
    const rate = rewardRates[achievementType as keyof typeof rewardRates] || { money: 50, exp: 10 }
    const levelMultiplier = Math.max(1, this.gameProgress.level * 0.5)
    
    return {
      money: Math.floor(rate.money * value * levelMultiplier),
      experience: Math.floor(rate.exp * value * levelMultiplier),
      items: this.generateRewardItems(achievementType, value)
    }
  }
  
  // 報酬アイテム生成
  private generateRewardItems(achievementType: string, value: number): string[] {
    const itemPools = {
      expedition_complete: ['ポケボール', 'ハイパーボール', '回復薬'],
      pokemon_catch: ['モンスターボール', 'きのみ', '経験値アメ'],
      facility_upgrade: ['建設資材', '高級設備', '効率向上装置'],
      research_complete: ['研究資料', '先進技術', '特許書類']
    }
    
    const pool = itemPools[achievementType as keyof typeof itemPools] || ['コイン']
    const itemCount = Math.min(3, Math.floor(value / 2) + 1)
    
    return Array.from({ length: itemCount }, () => 
      pool[Math.floor(Math.random() * pool.length)]
    )
  }
  
  // 現在のゲーム状態取得
  getGameState() {
    return {
      progress: { ...this.gameProgress },
      balance: { ...this.gameBalance },
      metrics: { ...this.performanceMetrics }
    }
  }
  
  // 統計サマリー生成
  generateGameSummary() {
    const state = this.getGameState()
    
    return {
      overallScore: this.calculateOverallScore(),
      efficiency: state.metrics.averageEfficiency,
      profitability: state.metrics.netProfit / Math.max(1, state.metrics.totalExpenses),
      growth: state.progress.level,
      recommendations: this.generateRecommendations(this.analyzeTrends()),
      nextMilestone: this.getNextMilestone()
    }
  }
  
  // 総合スコア計算
  private calculateOverallScore(): number {
    const progress = this.gameProgress
    const metrics = this.performanceMetrics
    
    const levelScore = progress.level * 100
    const profitScore = Math.max(0, metrics.netProfit / 100)
    const efficiencyScore = metrics.averageEfficiency * 50
    const achievementScore = progress.achievementPoints
    
    return Math.floor(levelScore + profitScore + efficiencyScore + achievementScore)
  }
  
  // 次のマイルストーン取得
  private getNextMilestone(): { level: number; description: string } {
    const currentLevel = this.gameProgress.level
    const milestones = [
      { level: 5, description: '研究所解放' },
      { level: 10, description: 'エリート派遣解放' },
      { level: 15, description: '国際派遣解放' },
      { level: 20, description: 'マスター施設解放' },
      { level: 25, description: '究極チャレンジ解放' }
    ]
    
    const nextMilestone = milestones.find(m => m.level > currentLevel)
    return nextMilestone || { level: currentLevel + 5, description: '新たな挑戦' }
  }
}

export const gameLogic = new GameLogicSystem()