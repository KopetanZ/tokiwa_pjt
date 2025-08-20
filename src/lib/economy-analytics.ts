/**
 * 経済システム詳細分析・レポート機能
 * 
 * 基本的な経済記録を超えた高度な分析とレポート機能
 */

import { supabase } from './supabase'

export interface EconomyAnalytics {
  // 基本統計
  totalIncome: number
  totalExpenses: number
  netProfit: number
  profitMargin: number
  
  // カテゴリ別分析
  categoryBreakdown: {
    [category: string]: {
      income: number
      expenses: number
      net: number
      transactionCount: number
    }
  }
  
  // 期間別分析
  dailyAverages: {
    income: number
    expenses: number
    profit: number
  }
  
  // トレンド分析
  trend: {
    direction: 'improving' | 'declining' | 'stable'
    rate: number // パーセンテージ
    confidence: number // 0-100
  }
  
  // 予算状況
  budgetStatus: {
    category: string
    budgetLimit: number
    actualSpent: number
    remaining: number
    percentUsed: number
    status: 'safe' | 'warning' | 'exceeded'
  }[]
  
  // 予測
  projections: {
    nextWeekProfit: number
    nextMonthProfit: number
    breakEvenTime: number | null // 日数、nullは不可能
  }
}

export interface BudgetAlert {
  id: string
  user_id: string
  category: string
  alert_type: 'approaching_limit' | 'exceeded_limit' | 'unusual_spending'
  current_amount: number
  budget_limit?: number
  message: string
  severity: 'low' | 'medium' | 'high'
  created_at: string
  acknowledged: boolean
}

export interface EconomyReport {
  period: 'daily' | 'weekly' | 'monthly'
  start_date: string
  end_date: string
  summary: {
    totalTransactions: number
    totalIncome: number
    totalExpenses: number
    netResult: number
    topIncomeSource: string
    topExpenseCategory: string
  }
  details: {
    incomeBreakdown: { [category: string]: number }
    expenseBreakdown: { [category: string]: number }
    dailyTrends: Array<{ date: string; income: number; expenses: number; net: number }>
  }
  recommendations: string[]
}

export class EconomyAnalyzer {
  private userId: string
  
  constructor(userId: string) {
    this.userId = userId
  }
  
  /**
   * 包括的経済分析を実行
   */
  async generateAnalytics(days: number = 30): Promise<EconomyAnalytics> {
    if (!supabase) {
      throw new Error('データベース接続がありません')
    }
    
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)
    
    // 取引データを取得
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', this.userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true })
    
    if (error) {
      throw new Error(`取引データ取得エラー: ${error.message}`)
    }
    
    return this.analyzeTransactions(transactions || [])
  }
  
  /**
   * 経済レポートを生成
   */
  async generateReport(
    period: EconomyReport['period'],
    startDate: Date,
    endDate: Date
  ): Promise<EconomyReport> {
    if (!supabase) {
      throw new Error('データベース接続がありません')
    }
    
    // 取引データを取得
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', this.userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true })
    
    if (error) {
      throw new Error(`レポートデータ取得エラー: ${error.message}`)
    }
    
    const analytics = this.analyzeTransactions(transactions || [])
    
    return {
      period,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      summary: {
        totalTransactions: transactions?.length || 0,
        totalIncome: analytics.totalIncome,
        totalExpenses: analytics.totalExpenses,
        netResult: analytics.netProfit,
        topIncomeSource: this.getTopCategory(analytics.categoryBreakdown, 'income'),
        topExpenseCategory: this.getTopCategory(analytics.categoryBreakdown, 'expenses')
      },
      details: {
        incomeBreakdown: this.extractCategoryTotals(analytics.categoryBreakdown, 'income'),
        expenseBreakdown: this.extractCategoryTotals(analytics.categoryBreakdown, 'expenses'),
        dailyTrends: this.calculateDailyTrends(transactions || [], startDate, endDate)
      },
      recommendations: this.generateRecommendations(analytics)
    }
  }
  
  /**
   * 予算アラートをチェック
   */
  async checkBudgetAlerts(): Promise<BudgetAlert[]> {
    if (!supabase) return []
    
    try {
      // 予算設定を取得
      const { data: budgets } = await supabase
        .from('budget_settings')
        .select('*')
        .eq('user_id', this.userId)
        .eq('active', true)
      
      if (!budgets || budgets.length === 0) return []
      
      const alerts: BudgetAlert[] = []
      const currentMonth = new Date()
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      
      for (const budget of budgets) {
        // 今月の支出を計算
        const { data: expenses } = await supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', this.userId)
          .eq('category', budget.category)
          .eq('type', 'expense')
          .gte('created_at', monthStart.toISOString())
        
        const totalSpent = expenses?.reduce((sum, t) => sum + t.amount, 0) || 0
        const percentUsed = (totalSpent / budget.monthly_limit) * 100
        
        // アラート条件をチェック
        if (percentUsed >= 100) {
          alerts.push({
            id: `alert_${budget.category}_${Date.now()}`,
            user_id: this.userId,
            category: budget.category,
            alert_type: 'exceeded_limit',
            current_amount: totalSpent,
            budget_limit: budget.monthly_limit,
            message: `${budget.category}の予算を${Math.round(percentUsed - 100)}%超過しています`,
            severity: 'high',
            created_at: new Date().toISOString(),
            acknowledged: false
          })
        } else if (percentUsed >= 80) {
          alerts.push({
            id: `alert_${budget.category}_${Date.now()}`,
            user_id: this.userId,
            category: budget.category,
            alert_type: 'approaching_limit',
            current_amount: totalSpent,
            budget_limit: budget.monthly_limit,
            message: `${budget.category}の予算の${Math.round(percentUsed)}%を使用しています`,
            severity: 'medium',
            created_at: new Date().toISOString(),
            acknowledged: false
          })
        }
      }
      
      return alerts
      
    } catch (error) {
      console.error('予算アラートチェックエラー:', error)
      return []
    }
  }
  
  /**
   * 異常支出検知
   */
  async detectUnusualSpending(days: number = 7): Promise<BudgetAlert[]> {
    if (!supabase) return []
    
    try {
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)
      const historicalStartDate = new Date(startDate.getTime() - days * 4 * 24 * 60 * 60 * 1000)
      
      // 最近の支出と過去の支出を比較
      const [recentExpenses, historicalExpenses] = await Promise.all([
        supabase
          .from('transactions')
          .select('category, amount')
          .eq('user_id', this.userId)
          .eq('type', 'expense')
          .gte('created_at', startDate.toISOString()),
        
        supabase
          .from('transactions')
          .select('category, amount')
          .eq('user_id', this.userId)
          .eq('type', 'expense')
          .gte('created_at', historicalStartDate.toISOString())
          .lt('created_at', startDate.toISOString())
      ])
      
      const alerts: BudgetAlert[] = []
      const recentByCategory = this.groupByCategory(recentExpenses.data || [])
      const historicalByCategory = this.groupByCategory(historicalExpenses.data || [])
      
      for (const [category, recentAmount] of Object.entries(recentByCategory)) {
        const historicalAmount = historicalByCategory[category] || 0
        const historicalAverage = historicalAmount / 4 // 4週間の平均
        
        if (recentAmount > historicalAverage * 2) {
          alerts.push({
            id: `unusual_${category}_${Date.now()}`,
            user_id: this.userId,
            category,
            alert_type: 'unusual_spending',
            current_amount: recentAmount,
            message: `${category}での支出が通常の${Math.round(recentAmount / historicalAverage)}倍になっています`,
            severity: 'medium',
            created_at: new Date().toISOString(),
            acknowledged: false
          })
        }
      }
      
      return alerts
      
    } catch (error) {
      console.error('異常支出検知エラー:', error)
      return []
    }
  }
  
  /**
   * 収益性分析レポート
   */
  async generateProfitabilityReport(): Promise<{
    expeditionROI: number
    trainerEfficiency: { [trainerId: string]: { profit: number; cost: number; roi: number } }
    facilityROI: { [facilityType: string]: { investment: number; returns: number; roi: number } }
    overallROI: number
  }> {
    if (!supabase) {
      throw new Error('データベース接続がありません')
    }
    
    // 派遣関連の収支を分析
    const { data: expeditionTransactions } = await supabase
      .from('transactions')
      .select('*, expeditions(*)')
      .eq('user_id', this.userId)
      .eq('category', 'expedition')
    
    // トレーナー関連の収支を分析
    const { data: trainerTransactions } = await supabase
      .from('transactions')
      .select('*, trainers(*)')
      .eq('user_id', this.userId)
      .in('category', ['salary', 'training'])
    
    // 施設関連の収支を分析
    const { data: facilityTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', this.userId)
      .in('category', ['facility', 'maintenance', 'upgrade'])
    
    return {
      expeditionROI: this.calculateExpeditionROI(expeditionTransactions || []),
      trainerEfficiency: this.calculateTrainerEfficiency(trainerTransactions || []),
      facilityROI: this.calculateFacilityROI(facilityTransactions || []),
      overallROI: this.calculateOverallROI()
    }
  }
  
  /**
   * 取引データを分析
   */
  private analyzeTransactions(transactions: any[]): EconomyAnalytics {
    const income = transactions.filter(t => t.type === 'income')
    const expenses = transactions.filter(t => t.type === 'expense')
    
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0)
    const netProfit = totalIncome - totalExpenses
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0
    
    // カテゴリ別分析
    const categoryBreakdown: EconomyAnalytics['categoryBreakdown'] = {}
    const allCategories = Array.from(new Set([...income.map(t => t.category), ...expenses.map(t => t.category)]))
    
    for (const category of allCategories) {
      const categoryIncome = income.filter(t => t.category === category).reduce((sum, t) => sum + t.amount, 0)
      const categoryExpenses = expenses.filter(t => t.category === category).reduce((sum, t) => sum + t.amount, 0)
      
      categoryBreakdown[category] = {
        income: categoryIncome,
        expenses: categoryExpenses,
        net: categoryIncome - categoryExpenses,
        transactionCount: income.filter(t => t.category === category).length + 
                         expenses.filter(t => t.category === category).length
      }
    }
    
    // 日次平均
    const days = transactions.length > 0 ? this.calculateDaysSpanned(transactions) : 1
    const dailyAverages = {
      income: totalIncome / days,
      expenses: totalExpenses / days,
      profit: netProfit / days
    }
    
    // トレンド分析
    const trend = this.calculateTrend(transactions)
    
    // 予測
    const projections = {
      nextWeekProfit: dailyAverages.profit * 7,
      nextMonthProfit: dailyAverages.profit * 30,
      breakEvenTime: netProfit < 0 && dailyAverages.profit > 0 ? 
        Math.abs(netProfit) / dailyAverages.profit : null
    }
    
    return {
      totalIncome,
      totalExpenses,
      netProfit,
      profitMargin,
      categoryBreakdown,
      dailyAverages,
      trend,
      budgetStatus: [], // 別途計算
      projections
    }
  }
  
  private calculateTrend(transactions: any[]): EconomyAnalytics['trend'] {
    if (transactions.length < 14) {
      return { direction: 'stable', rate: 0, confidence: 0 }
    }
    
    const midpoint = Math.floor(transactions.length / 2)
    const firstHalf = transactions.slice(0, midpoint)
    const secondHalf = transactions.slice(midpoint)
    
    const firstHalfProfit = this.calculateNetProfit(firstHalf)
    const secondHalfProfit = this.calculateNetProfit(secondHalf)
    
    const change = secondHalfProfit - firstHalfProfit
    const rate = firstHalfProfit !== 0 ? (change / Math.abs(firstHalfProfit)) * 100 : 0
    
    return {
      direction: rate > 5 ? 'improving' : rate < -5 ? 'declining' : 'stable',
      rate: Math.abs(rate),
      confidence: Math.min(transactions.length / 30 * 100, 100) // より多いデータほど信頼性高
    }
  }
  
  private calculateNetProfit(transactions: any[]): number {
    return transactions.reduce((sum, t) => {
      return sum + (t.type === 'income' ? t.amount : -t.amount)
    }, 0)
  }
  
  private calculateDaysSpanned(transactions: any[]): number {
    if (transactions.length === 0) return 1
    
    const dates = transactions.map(t => new Date(t.created_at))
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
    
    return Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (24 * 60 * 60 * 1000)))
  }
  
  private getTopCategory(breakdown: EconomyAnalytics['categoryBreakdown'], type: 'income' | 'expenses'): string {
    const entries = Object.entries(breakdown)
    if (entries.length === 0) return 'なし'
    
    return entries.reduce((top, [category, data]) => {
      return data[type] > breakdown[top]?.[type] ? category : top
    }, entries[0][0])
  }
  
  private extractCategoryTotals(breakdown: EconomyAnalytics['categoryBreakdown'], type: 'income' | 'expenses'): { [category: string]: number } {
    const result: { [category: string]: number } = {}
    for (const [category, data] of Object.entries(breakdown)) {
      if (data[type] > 0) {
        result[category] = data[type]
      }
    }
    return result
  }
  
  private calculateDailyTrends(transactions: any[], startDate: Date, endDate: Date): Array<{ date: string; income: number; expenses: number; net: number }> {
    const trends: Array<{ date: string; income: number; expenses: number; net: number }> = []
    const current = new Date(startDate)
    
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0]
      const dayTransactions = transactions.filter(t => 
        t.created_at.split('T')[0] === dateStr
      )
      
      const income = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
      const expenses = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
      
      trends.push({
        date: dateStr,
        income,
        expenses,
        net: income - expenses
      })
      
      current.setDate(current.getDate() + 1)
    }
    
    return trends
  }
  
  private generateRecommendations(analytics: EconomyAnalytics): string[] {
    const recommendations: string[] = []
    
    if (analytics.netProfit < 0) {
      recommendations.push('収益がマイナスです。支出を見直すか、収入源を増やすことを検討してください。')
    }
    
    if (analytics.profitMargin < 10) {
      recommendations.push('利益率が低めです。より効率的な経済活動を検討してください。')
    }
    
    if (analytics.trend.direction === 'declining') {
      recommendations.push('収益が減少傾向にあります。原因を分析して対策を講じてください。')
    }
    
    // 最も支出の多いカテゴリへのアドバイス
    const topExpenseCategory = this.getTopCategory(analytics.categoryBreakdown, 'expenses')
    if (topExpenseCategory !== 'なし') {
      recommendations.push(`${topExpenseCategory}の支出が最も多くなっています。この分野での効率化を検討してください。`)
    }
    
    return recommendations
  }
  
  private groupByCategory(transactions: any[]): { [category: string]: number } {
    const result: { [category: string]: number } = {}
    for (const transaction of transactions) {
      result[transaction.category] = (result[transaction.category] || 0) + transaction.amount
    }
    return result
  }
  
  private calculateExpeditionROI(transactions: any[]): number {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    return expenses > 0 ? ((income - expenses) / expenses) * 100 : 0
  }
  
  private calculateTrainerEfficiency(transactions: any[]): { [trainerId: string]: { profit: number; cost: number; roi: number } } {
    // TODO: トレーナー別の効率計算を実装
    return {}
  }
  
  private calculateFacilityROI(transactions: any[]): { [facilityType: string]: { investment: number; returns: number; roi: number } } {
    // TODO: 施設別のROI計算を実装
    return {}
  }
  
  private calculateOverallROI(): number {
    // TODO: 全体的なROI計算を実装
    return 0
  }
}

/**
 * 経済分析マネージャーのファクトリー関数
 */
export const createEconomyAnalyzer = (userId: string): EconomyAnalyzer => {
  return new EconomyAnalyzer(userId)
}