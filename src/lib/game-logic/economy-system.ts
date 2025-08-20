// 経済システム - 収入・支出・資産管理
import { GAME_BALANCE } from '@/config/gameBalance'
import { gameRandom } from './random-system'

// 経済関連の型定義
export interface Transaction {
  id: string
  type: 'income' | 'expense'
  category: 'expedition' | 'facility' | 'salary' | 'maintenance' | 'upgrade' | 'emergency' | 'bonus'
  amount: number
  description: string
  date: string
  reference_id?: string
}

export interface FinancialStatus {
  current_money: number
  total_income: number
  total_expenses: number
  net_income: number
  monthly_income: number
  monthly_expenses: number
  projected_monthly_balance: number
  cash_flow_trend: 'positive' | 'negative' | 'stable'
}

export interface BudgetAllocation {
  salaries: number
  maintenance: number
  upgrades: number
  emergency_fund: number
  research: number
  expansion: number
}

export interface EconomicProjection {
  timeframe_months: number
  projected_income: number[]
  projected_expenses: number[]
  projected_balance: number[]
  risk_factors: string[]
  recommendations: string[]
}

export interface TrainerSalary {
  trainer_id: string
  base_salary: number
  performance_bonus: number
  level_bonus: number
  job_multiplier: number
  total_salary: number
}

export class EconomySystem {
  private transactions: Transaction[] = []
  private currentMoney: number = GAME_BALANCE.STARTING_MONEY
  private lastPaymentDate: string = ''
  
  constructor() {
    this.lastPaymentDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  }

  // 収入を記録
  recordIncome(
    category: Transaction['category'],
    amount: number,
    description: string,
    referenceId?: string
  ): void {
    const transaction: Transaction = {
      id: `income_${Date.now()}_${gameRandom.integer(1000, 9999)}`,
      type: 'income',
      category,
      amount,
      description,
      date: new Date().toISOString(),
      reference_id: referenceId
    }
    
    this.transactions.push(transaction)
    this.currentMoney += amount
    
    console.log(`💰 収入: +¥${amount.toLocaleString()} (${description})`)
  }

  // 支出を記録
  recordExpense(
    category: Transaction['category'],
    amount: number,
    description: string,
    referenceId?: string
  ): boolean {
    // 残高チェック
    if (this.currentMoney < amount) {
      console.warn(`❌ 資金不足: ¥${amount.toLocaleString()} 必要、残高: ¥${this.currentMoney.toLocaleString()}`)
      return false
    }
    
    const transaction: Transaction = {
      id: `expense_${Date.now()}_${gameRandom.integer(1000, 9999)}`,
      type: 'expense',
      category,
      amount,
      description,
      date: new Date().toISOString(),
      reference_id: referenceId
    }
    
    this.transactions.push(transaction)
    this.currentMoney -= amount
    
    console.log(`💸 支出: -¥${amount.toLocaleString()} (${description})`)
    return true
  }

  // 派遣報酬の計算と支払い
  processExpeditionReward(
    location: any,
    success: boolean,
    successRate: number,
    trainerLevel: number,
    trainerJob: string,
    pokemonCaught: number = 0,
    itemsFound: number = 0
  ): number {
    // ベース報酬
    let baseReward = location.baseRewardMoney || 1000
    
    // 成功度補正
    const successMultiplier = success ? 1.0 : 0.3
    const rateMultiplier = 0.5 + (successRate * 0.5)
    
    // レベル補正
    const levelMultiplier = 1.0 + (trainerLevel * 0.02)
    
    // 職業補正
    const jobMultiplier = this.getJobIncomeMultiplier(trainerJob)
    
    // 捕獲・発見ボーナス
    const captureBonus = pokemonCaught * 500
    const discoveryBonus = itemsFound * 200
    
    const totalReward = Math.floor(
      baseReward * successMultiplier * rateMultiplier * levelMultiplier * jobMultiplier
    ) + captureBonus + discoveryBonus
    
    this.recordIncome(
      'expedition',
      totalReward,
      `派遣報酬: ${location.nameJa || location.name} (成功率: ${Math.floor(successRate * 100)}%)`,
      location.id
    )
    
    return totalReward
  }

  // 職業による収入補正
  private getJobIncomeMultiplier(jobName: string): number {
    const jobMultipliers: Record<string, number> = {
      economist: 1.3,     // 経済学者は収入に長けている
      explorer: 1.2,      // 探検家は貴重品発見が得意
      researcher: 1.15,   // 研究者は価値ある発見をする
      ranger: 1.1,        // レンジャーは安定した成果
      breeder: 1.0,       // ブリーダーは標準
      battler: 0.95,      // バトラーは収入より戦闘重視
      medic: 1.0          // 医師は標準
    }
    
    return jobMultipliers[jobName] || 1.0
  }

  // トレーナー給与計算
  calculateTrainerSalary(trainer: any): TrainerSalary {
    const level = trainer.level || 1
    const job = trainer.job || 'ranger'
    const performanceRating = trainer.performance_rating || 0.5 // 0-1
    
    // 基本給
    const baseSalary = GAME_BALANCE.BASE_TRAINER_SALARY
    
    // レベルボーナス
    const levelMultiplier = Math.pow(GAME_BALANCE.SALARY_LEVEL_MULTIPLIER, level - 1)
    const levelBonus = Math.floor(baseSalary * (levelMultiplier - 1))
    
    // 職業補正
    const jobMultiplier = this.getJobSalaryMultiplier(job)
    
    // パフォーマンスボーナス
    const performanceBonus = Math.floor(baseSalary * performanceRating * 0.3)
    
    const totalSalary = Math.floor(
      baseSalary * levelMultiplier * jobMultiplier + performanceBonus
    )
    
    return {
      trainer_id: trainer.id,
      base_salary: baseSalary,
      performance_bonus: performanceBonus,
      level_bonus: levelBonus,
      job_multiplier: jobMultiplier,
      total_salary: totalSalary
    }
  }

  // 職業による給与補正
  private getJobSalaryMultiplier(jobName: string): number {
    const multipliers: Record<string, number> = {
      ranger: 1.0,        // 標準
      breeder: 1.1,       // +10% (専門性)
      battler: 1.2,       // +20% (高リスク)
      researcher: 1.3,    // +30% (高度な知識)
      medic: 1.4,         // +40% (医療専門)
      economist: 1.15,    // +15% (金融専門)
      explorer: 1.2       // +20% (危険地帯)
    }
    
    return multipliers[jobName] || 1.0
  }

  // 月次給与支払い処理
  processMonthlyPayroll(trainers: any[]): boolean {
    const today = new Date().toISOString().split('T')[0]
    const lastPayment = new Date(this.lastPaymentDate)
    const daysSinceLastPayment = Math.floor(
      (Date.now() - lastPayment.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    // 30日経過していない場合はスキップ
    if (daysSinceLastPayment < 30) {
      return false
    }
    
    let totalPayroll = 0
    const salaryDetails: TrainerSalary[] = []
    
    // 各トレーナーの給与計算
    for (const trainer of trainers) {
      const salary = this.calculateTrainerSalary(trainer)
      salaryDetails.push(salary)
      totalPayroll += salary.total_salary
    }
    
    // 資金チェック
    if (this.currentMoney < totalPayroll) {
      console.warn(`❌ 給与支払い不可: ¥${totalPayroll.toLocaleString()} 必要、残高: ¥${this.currentMoney.toLocaleString()}`)
      
      // 緊急事態：部分支払いまたは借入
      this.handlePayrollCrisis(totalPayroll, salaryDetails)
      return false
    }
    
    // 給与支払い実行
    this.recordExpense(
      'salary',
      totalPayroll,
      `月次給与支払い (${trainers.length}名)`,
      'monthly_payroll'
    )
    
    this.lastPaymentDate = today
    
    console.log(`💰 給与支払い完了: ¥${totalPayroll.toLocaleString()} (${trainers.length}名)`)
    return true
  }

  // 給与支払い危機処理
  private handlePayrollCrisis(requiredAmount: number, salaryDetails: TrainerSalary[]): void {
    const shortage = requiredAmount - this.currentMoney
    
    // 緊急借入（高金利）
    const emergencyLoan = Math.ceil(shortage * 1.2) // 20%の利息
    this.recordIncome(
      'emergency',
      emergencyLoan,
      `緊急借入 (給与不足対応)`,
      'emergency_loan'
    )
    
    // 追加の利息支払い
    this.recordExpense(
      'emergency',
      Math.floor(emergencyLoan * 0.1),
      '緊急借入利息',
      'loan_interest'
    )
    
    console.warn(`🚨 緊急借入実行: ¥${emergencyLoan.toLocaleString()}`)
  }

  // 施設維持費計算
  calculateFacilitiesCost(facilities: any[]): number {
    let totalCost = 0
    
    for (const facility of facilities) {
      const baseCost = facility.maintenance_cost || 1000
      const levelMultiplier = Math.pow(1.5, (facility.level || 1) - 1)
      const facilityCost = Math.floor(baseCost * levelMultiplier)
      
      totalCost += facilityCost
    }
    
    return totalCost
  }

  // 月次固定費支払い
  processMonthlyExpenses(facilities: any[], trainers: any[]): void {
    // 施設維持費
    const facilitiesCost = this.calculateFacilitiesCost(facilities)
    if (facilitiesCost > 0) {
      this.recordExpense(
        'maintenance',
        facilitiesCost,
        `施設維持費 (${facilities.length}施設)`,
        'monthly_facilities'
      )
    }
    
    // その他固定費
    const utilityCost = Math.floor(facilities.length * 500) // 施設数に比例
    const insuranceCost = Math.floor(trainers.length * 300) // トレーナー数に比例
    
    this.recordExpense('maintenance', utilityCost, '光熱費', 'utilities')
    this.recordExpense('maintenance', insuranceCost, '保険料', 'insurance')
  }

  // 現在の財務状況取得
  getFinancialStatus(): FinancialStatus {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
    
    // 過去30日の取引を抽出
    const recentTransactions = this.transactions.filter(t => 
      new Date(t.date) >= thirtyDaysAgo
    )
    
    const monthlyIncome = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const monthlyExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalIncome = this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalExpenses = this.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const netIncome = totalIncome - totalExpenses
    const monthlyBalance = monthlyIncome - monthlyExpenses
    
    // キャッシュフロートレンド分析
    const previousMonthTransactions = this.transactions.filter(t => {
      const transactionDate = new Date(t.date)
      const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000))
      return transactionDate >= sixtyDaysAgo && transactionDate < thirtyDaysAgo
    })
    
    const previousMonthBalance = previousMonthTransactions
      .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)
    
    let cashFlowTrend: 'positive' | 'negative' | 'stable' = 'stable'
    if (monthlyBalance > previousMonthBalance * 1.1) {
      cashFlowTrend = 'positive'
    } else if (monthlyBalance < previousMonthBalance * 0.9) {
      cashFlowTrend = 'negative'
    }
    
    return {
      current_money: this.currentMoney,
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_income: netIncome,
      monthly_income: monthlyIncome,
      monthly_expenses: monthlyExpenses,
      projected_monthly_balance: monthlyBalance,
      cash_flow_trend: cashFlowTrend
    }
  }

  // 予算配分の推奨
  recommendBudgetAllocation(availableFunds: number, priorities: string[] = []): BudgetAllocation {
    // 基本配分比率
    const baseAllocation = {
      salaries: 0.4,        // 40%
      maintenance: 0.2,     // 20%
      upgrades: 0.15,       // 15%
      emergency_fund: 0.1,  // 10%
      research: 0.1,        // 10%
      expansion: 0.05       // 5%
    }
    
    // 優先度による調整
    const adjustments: Record<string, Partial<typeof baseAllocation>> = {
      growth: { upgrades: 0.25, expansion: 0.15, emergency_fund: 0.05 },
      stability: { emergency_fund: 0.2, maintenance: 0.25, salaries: 0.45 },
      research: { research: 0.2, upgrades: 0.1 },
      expansion: { expansion: 0.2, upgrades: 0.2, emergency_fund: 0.05 }
    }
    
    let allocation = { ...baseAllocation }
    
    // 優先度に基づく調整適用
    for (const priority of priorities) {
      const adjustment = adjustments[priority]
      if (adjustment) {
        Object.assign(allocation, { ...allocation, ...adjustment })
      }
    }
    
    // 実際の金額に変換
    return {
      salaries: Math.floor(availableFunds * allocation.salaries),
      maintenance: Math.floor(availableFunds * allocation.maintenance),
      upgrades: Math.floor(availableFunds * allocation.upgrades),
      emergency_fund: Math.floor(availableFunds * allocation.emergency_fund),
      research: Math.floor(availableFunds * allocation.research),
      expansion: Math.floor(availableFunds * allocation.expansion)
    }
  }

  // 経済予測生成
  generateEconomicProjection(
    monthsAhead: number,
    currentTrainers: any[],
    currentFacilities: any[],
    growthRate: number = 0.05
  ): EconomicProjection {
    const projection: EconomicProjection = {
      timeframe_months: monthsAhead,
      projected_income: [],
      projected_expenses: [],
      projected_balance: [],
      risk_factors: [],
      recommendations: []
    }
    
    const currentStatus = this.getFinancialStatus()
    let runningBalance = this.currentMoney
    
    for (let month = 1; month <= monthsAhead; month++) {
      // 収入予測（成長率考慮）
      const monthlyIncome = currentStatus.monthly_income * Math.pow(1 + growthRate, month)
      
      // 支出予測（インフレーション考慮）
      const inflationRate = 0.02 // 月2%のインフレ
      const monthlyExpenses = currentStatus.monthly_expenses * Math.pow(1 + inflationRate, month)
      
      const netIncome = monthlyIncome - monthlyExpenses
      runningBalance += netIncome
      
      projection.projected_income.push(Math.floor(monthlyIncome))
      projection.projected_expenses.push(Math.floor(monthlyExpenses))
      projection.projected_balance.push(Math.floor(runningBalance))
      
      // リスク要因の特定
      if (runningBalance < monthlyExpenses) {
        projection.risk_factors.push(`${month}ヶ月後: 資金不足のリスク`)
      }
    }
    
    // 推奨事項の生成
    if (projection.projected_balance.some(balance => balance < 0)) {
      projection.recommendations.push('支出削減または収入源の拡大が必要です')
      projection.recommendations.push('緊急資金の確保を検討してください')
    }
    
    if (currentStatus.cash_flow_trend === 'negative') {
      projection.recommendations.push('キャッシュフローの改善が急務です')
    }
    
    const avgProfit = projection.projected_income.reduce((sum, income, i) => 
      sum + (income - projection.projected_expenses[i]), 0
    ) / monthsAhead
    
    if (avgProfit > currentStatus.monthly_income * 0.5) {
      projection.recommendations.push('積極的な投資と拡張を検討できます')
    }
    
    return projection
  }

  // 緊急事態費用処理
  handleEmergencyExpense(type: string, severity: 'minor' | 'major' | 'critical'): boolean {
    const emergencyCosts = {
      disaster: { minor: 5000, major: 15000, critical: 50000 },
      accident: { minor: 2000, major: 8000, critical: 25000 },
      equipment: { minor: 3000, major: 10000, critical: 30000 },
      medical: { minor: 1500, major: 6000, critical: 20000 }
    }
    
    const cost = emergencyCosts[type as keyof typeof emergencyCosts]?.[severity] || 5000
    
    const success = this.recordExpense(
      'emergency',
      cost,
      `緊急事態対応: ${type} (${severity})`,
      `emergency_${type}_${Date.now()}`
    )
    
    if (!success) {
      // 緊急借入で対応
      this.recordIncome('emergency', cost * 1.3, '緊急事態対応借入')
      this.recordExpense('emergency', cost, `緊急事態対応: ${type} (${severity})`)
      this.recordExpense('emergency', Math.floor(cost * 0.3), '緊急借入利息')
      
      console.warn(`🚨 緊急借入で対応: ¥${cost.toLocaleString()}`)
    }
    
    return success
  }

  // 取引履歴取得
  getTransactionHistory(limit: number = 50, category?: string): Transaction[] {
    let transactions = [...this.transactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    
    if (category) {
      transactions = transactions.filter(t => t.category === category)
    }
    
    return transactions.slice(0, limit)
  }

  // 現在の残高取得
  getCurrentMoney(): number {
    return this.currentMoney
  }

  // 残高設定（テスト・初期化用）
  setCurrentMoney(amount: number): void {
    this.currentMoney = Math.max(0, amount)
  }

  // 月次レポート生成
  generateMonthlyReport(): {
    summary: FinancialStatus
    topExpenses: { category: string; amount: number }[]
    topIncomes: { category: string; amount: number }[]
    recommendations: string[]
  } {
    const summary = this.getFinancialStatus()
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
    
    const recentTransactions = this.transactions.filter(t => 
      new Date(t.date) >= thirtyDaysAgo
    )
    
    // カテゴリ別支出集計
    const expensesByCategory = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount
        return acc
      }, {} as Record<string, number>)
    
    // カテゴリ別収入集計
    const incomesByCategory = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount
        return acc
      }, {} as Record<string, number>)
    
    const topExpenses = Object.entries(expensesByCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
    
    const topIncomes = Object.entries(incomesByCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
    
    const recommendations: string[] = []
    
    // 収支バランス分析
    const profitMargin = summary.monthly_income > 0 ? 
      summary.projected_monthly_balance / summary.monthly_income : 0
    
    if (profitMargin < 0.1) {
      recommendations.push('利益率が低すぎます。支出の見直しを検討してください。')
    }
    
    if (summary.current_money < summary.monthly_expenses) {
      recommendations.push('運転資金が不足気味です。資金調達を検討してください。')
    }
    
    if (summary.cash_flow_trend === 'positive') {
      recommendations.push('良好な成長傾向です。投資機会を検討できます。')
    }
    
    return {
      summary,
      topExpenses,
      topIncomes,
      recommendations
    }
  }
}

export const economySystem = new EconomySystem()