// 経済取引システム
import { formatMoney } from './utils'

// 取引記録
export interface Transaction {
  id: string
  type: 'income' | 'expense'
  category: 'expedition' | 'salary' | 'facility' | 'pokemon' | 'items' | 'research' | 'emergency'
  amount: number
  description: string
  timestamp: Date
  relatedId?: string // 関連する派遣ID、トレーナーID等
  metadata?: Record<string, any>
}

// 予算カテゴリ
export interface BudgetCategory {
  id: string
  name: string
  allocated: number
  spent: number
  remaining: number
  percentage: number
  isOverBudget: boolean
}

// 財務状況
export interface FinancialStatus {
  balance: number
  monthlyIncome: number
  monthlyExpenses: number
  netIncome: number
  totalAssets: number
  dailyOperatingCost: number
  burnRate: number // 残高が尽きるまでの日数
  profitability: number // 利益率
}

// 経済システム管理クラス
class EconomySystem {
  private transactions: Transaction[] = []
  private currentBalance: number = 50000 // 初期資金
  private monthlyBudget: BudgetCategory[] = []
  
  constructor() {
    this.initializeBudget()
    this.loadSampleTransactions()
  }
  
  // 予算初期化
  private initializeBudget(): void {
    this.monthlyBudget = [
      {
        id: 'salaries',
        name: 'トレーナー給与',
        allocated: 15000,
        spent: 0,
        remaining: 15000,
        percentage: 0,
        isOverBudget: false
      },
      {
        id: 'facilities',
        name: '施設維持費',
        allocated: 8000,
        spent: 0,
        remaining: 8000,
        percentage: 0,
        isOverBudget: false
      },
      {
        id: 'pokemon_care',
        name: 'ポケモンケア',
        allocated: 5000,
        spent: 0,
        remaining: 5000,
        percentage: 0,
        isOverBudget: false
      },
      {
        id: 'research',
        name: '研究開発',
        allocated: 3000,
        spent: 0,
        remaining: 3000,
        percentage: 0,
        isOverBudget: false
      },
      {
        id: 'emergency',
        name: '緊急資金',
        allocated: 2000,
        spent: 0,
        remaining: 2000,
        percentage: 0,
        isOverBudget: false
      }
    ]
  }
  
  // サンプル取引データ読み込み
  private loadSampleTransactions(): void {
    const now = new Date()
    const sampleTransactions: Omit<Transaction, 'id'>[] = [
      {
        type: 'income',
        category: 'expedition',
        amount: 2400,
        description: 'トキワの森派遣成功報酬',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        relatedId: 'exp_1'
      },
      {
        type: 'income',
        category: 'expedition',
        amount: 1800,
        description: '22番道路派遣成功報酬',
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        relatedId: 'exp_2'
      },
      {
        type: 'expense',
        category: 'salary',
        amount: 3600,
        description: 'タケシ月給支払い',
        timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000),
        relatedId: 'trainer_1'
      },
      {
        type: 'expense',
        category: 'pokemon',
        amount: 1500,
        description: 'ポケモンセンター治療費',
        timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000)
      },
      {
        type: 'expense',
        category: 'facility',
        amount: 2500,
        description: '訓練施設設備更新',
        timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000)
      }
    ]
    
    sampleTransactions.forEach(transaction => {
      this.addTransaction(transaction)
    })
  }
  
  // 取引追加
  addTransaction(transaction: Omit<Transaction, 'id'>): Transaction {
    const newTransaction: Transaction = {
      ...transaction,
      id: this.generateTransactionId()
    }
    
    this.transactions.push(newTransaction)
    
    // 残高更新
    if (transaction.type === 'income') {
      this.currentBalance += transaction.amount
    } else {
      this.currentBalance -= transaction.amount
    }
    
    // 予算更新
    this.updateBudget(transaction.category, transaction.amount, transaction.type)
    
    return newTransaction
  }
  
  // 取引ID生成
  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  }
  
  // 予算更新
  private updateBudget(category: string, amount: number, type: 'income' | 'expense'): void {
    if (type !== 'expense') return
    
    const budgetMapping: Record<string, string> = {
      salary: 'salaries',
      facility: 'facilities',
      pokemon: 'pokemon_care',
      research: 'research',
      emergency: 'emergency'
    }
    
    const budgetId = budgetMapping[category]
    if (!budgetId) return
    
    const budget = this.monthlyBudget.find(b => b.id === budgetId)
    if (budget) {
      budget.spent += amount
      budget.remaining = budget.allocated - budget.spent
      budget.percentage = (budget.spent / budget.allocated) * 100
      budget.isOverBudget = budget.spent > budget.allocated
    }
  }
  
  // 現在の財務状況取得
  getFinancialStatus(): FinancialStatus {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recentTransactions = this.transactions.filter(t => t.timestamp >= thirtyDaysAgo)
    
    const monthlyIncome = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const monthlyExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const dailyOperatingCost = monthlyExpenses / 30
    const burnRate = dailyOperatingCost > 0 ? this.currentBalance / dailyOperatingCost : Infinity
    const netIncome = monthlyIncome - monthlyExpenses
    const profitability = monthlyIncome > 0 ? (netIncome / monthlyIncome) * 100 : 0
    
    return {
      balance: this.currentBalance,
      monthlyIncome,
      monthlyExpenses,
      netIncome,
      totalAssets: this.currentBalance + this.calculateAssetValue(),
      dailyOperatingCost,
      burnRate,
      profitability
    }
  }
  
  // 資産価値計算
  private calculateAssetValue(): number {
    // 施設、ポケモン、装備等の価値
    return 25000 // 仮の値
  }
  
  // 取引履歴取得
  getTransactions(limit?: number, category?: string): Transaction[] {
    let filtered = [...this.transactions].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    
    if (category) {
      filtered = filtered.filter(t => t.category === category)
    }
    
    if (limit) {
      filtered = filtered.slice(0, limit)
    }
    
    return filtered
  }
  
  // 予算状況取得
  getBudgetStatus(): BudgetCategory[] {
    return [...this.monthlyBudget]
  }
  
  // 支払い可能性チェック
  canAfford(amount: number): boolean {
    return this.currentBalance >= amount
  }
  
  // 支払い実行
  makePayment(category: Transaction['category'], amount: number, description: string, relatedId?: string): boolean {
    if (!this.canAfford(amount)) {
      return false
    }
    
    this.addTransaction({
      type: 'expense',
      category,
      amount,
      description,
      timestamp: new Date(),
      relatedId
    })
    
    return true
  }
  
  // 収入記録
  recordIncome(category: Transaction['category'], amount: number, description: string, relatedId?: string): void {
    this.addTransaction({
      type: 'income',
      category,
      amount,
      description,
      timestamp: new Date(),
      relatedId
    })
  }
  
  // 月次レポート生成
  generateMonthlyReport(): {
    summary: FinancialStatus
    transactions: Transaction[]
    budget: BudgetCategory[]
    insights: string[]
  } {
    const summary = this.getFinancialStatus()
    const transactions = this.getTransactions(50)
    const budget = this.getBudgetStatus()
    
    const insights: string[] = []
    
    // 分析とアドバイス生成
    if (summary.profitability < 10) {
      insights.push('⚠️ 利益率が低下しています。収入源の多様化を検討してください。')
    }
    
    if (summary.burnRate < 30) {
      insights.push('🚨 資金が不足する可能性があります。支出の見直しが必要です。')
    }
    
    budget.forEach(b => {
      if (b.isOverBudget) {
        insights.push(`💰 ${b.name}の予算を超過しています。(${b.percentage.toFixed(1)}%)`)
      }
    })
    
    if (summary.netIncome > 0) {
      insights.push('✅ 今月は黒字経営を維持しています。')
    }
    
    const expeditionIncome = transactions
      .filter(t => t.type === 'income' && t.category === 'expedition')
      .reduce((sum, t) => sum + t.amount, 0)
    
    if (expeditionIncome > summary.monthlyIncome * 0.7) {
      insights.push('🎯 派遣事業が主要な収入源となっています。')
    }
    
    return {
      summary,
      transactions,
      budget,
      insights
    }
  }
  
  // 予算設定
  setBudget(categoryId: string, amount: number): boolean {
    const budget = this.monthlyBudget.find(b => b.id === categoryId)
    if (budget) {
      budget.allocated = amount
      budget.remaining = amount - budget.spent
      budget.percentage = budget.allocated > 0 ? (budget.spent / budget.allocated) * 100 : 0
      budget.isOverBudget = budget.spent > budget.allocated
      return true
    }
    return false
  }
  
  // 投資シミュレーション
  simulateInvestment(amount: number, expectedReturnRate: number, months: number): {
    totalReturn: number
    monthlyReturn: number
    roi: number
    breakEvenPoint: number
  } {
    const monthlyReturnRate = expectedReturnRate / 12 / 100
    const totalReturn = amount * Math.pow(1 + monthlyReturnRate, months)
    const profit = totalReturn - amount
    const monthlyReturn = profit / months
    const roi = (profit / amount) * 100
    const breakEvenPoint = amount / (amount * monthlyReturnRate)
    
    return {
      totalReturn,
      monthlyReturn,
      roi,
      breakEvenPoint
    }
  }
}

export const economySystem = new EconomySystem()