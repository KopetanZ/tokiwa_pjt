'use client'

import { useState, useEffect } from 'react'
import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { PixelProgressBar } from '@/components/ui/PixelProgressBar'
import { PixelInput } from '@/components/ui/PixelInput'
import { economySystem, Transaction, BudgetCategory, FinancialStatus } from '@/lib/economy'
import { formatMoney } from '@/lib/utils'
import { useGameState, useEconomy } from '@/lib/game-state/hooks'
import { clsx } from 'clsx'

export default function EconomyPage() {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'transactions' | 'budget' | 'reports'>('overview')
  
  const { gameData } = useGameState()
  const { money, transactions, actions } = useEconomy()
  
  // JSON システムから取得したデータを使用
  const transactionList = transactions.slice(0, 20).map(t => ({
    id: t.id,
    type: t.type,
    amount: t.amount,
    category: t.category,
    description: t.description,
    timestamp: new Date(t.timestamp),
    relatedId: t.relatedId
  }))
  
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const netIncome = totalIncome - totalExpenses
  const burnRate = totalExpenses > 0 ? money / totalExpenses * 30 : Infinity
  const totalAssets = money // 簡単化: 現金のみ
  
  const financialStatus = {
    totalIncome,
    totalExpenses,
    currentBalance: money,
    netIncome,
    profitability: netIncome,
    burnRate,
    totalAssets,
    monthlyIncome: totalIncome,
    monthlyExpenses: totalExpenses,
    recentTransactions: transactions.slice(0, 5)
  }
  
  const budget: BudgetCategory[] = [
    {
      id: 'budget-personnel',
      name: '人件費',
      allocated: 15000,
      spent: 12000,
      remaining: 3000,
      percentage: 80,
      isOverBudget: false
    },
    {
      id: 'budget-facilities', 
      name: '施設維持費',
      allocated: 5000,
      spent: 3500,
      remaining: 1500,
      percentage: 70,
      isOverBudget: false
    },
    {
      id: 'budget-pokemon-care',
      name: 'ポケモンケア',
      allocated: 3000,
      spent: 2800,
      remaining: 200,
      percentage: 93.3,
      isOverBudget: false
    }
  ]
  
  const monthlyReport = {
    insights: [
      `現在の資金: ${formatMoney(money)}`,
      `今月の取引件数: ${transactions.length}`,
      '安定した経営を維持しています'
    ],
    recommendations: [
      '派遣事業の拡大を検討してください',
      'トレーナーの追加雇用で収益向上を目指しましょう'
    ]
  }

  const handleQuickTransaction = async (type: 'income' | 'expense', category: string, amount: number, description: string) => {
    try {
      if (type === 'expense') {
        // 支出の場合は資金チェック
        if (money < amount) {
          console.error(`資金が不足しています。現在: ₽${money.toLocaleString()}, 必要: ₽${amount.toLocaleString()}`)
          return
        }
        
        // 支出処理
        const success = actions.canAfford(amount)
        if (success) {
          actions.updateMoney(-amount)
          actions.addTransaction({
            type: 'expense',
            category: category as any,
            amount,
            description,
            timestamp: new Date().toISOString()
          })
        }
        if (success) {
          console.log(`${description}: -₽${amount.toLocaleString()}`)
        } else {
          console.error('支出処理に失敗しました')
        }
      } else {
        // 収入処理
        actions.updateMoney(amount)
        actions.addTransaction({
          type: 'income',
          category: category as any,
          amount,
          description,
          timestamp: new Date().toISOString()
        })
        console.log(`${description}: +₽${amount.toLocaleString()}`)
      }
    } catch (error) {
      console.error('取引処理エラー:', error)
    }
  }

  if (!financialStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="font-pixel text-retro-gb-mid">読み込み中...</div>
      </div>
    )
  }

  const getHealthColor = (value: number, type: 'balance' | 'profit' | 'burnRate') => {
    switch (type) {
      case 'balance':
        if (value > 30000) return 'text-green-600'
        if (value > 10000) return 'text-yellow-600'
        return 'text-red-600'
      case 'profit':
        if (value > 10) return 'text-green-600'
        if (value > 0) return 'text-yellow-600'
        return 'text-red-600'
      case 'burnRate':
        if (value > 60) return 'text-green-600'
        if (value > 30) return 'text-yellow-600'
        return 'text-red-600'
      default:
        return 'text-retro-gb-dark'
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="font-pixel-large text-retro-gb-dark">
          経済管理
        </h1>
        <div className="flex space-x-2">
          <PixelButton size="sm" variant="secondary">
            データエクスポート
          </PixelButton>
          <PixelButton>
            取引を追加
          </PixelButton>
        </div>
      </div>

      {/* 財務概要 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <PixelCard title="現在の残高">
          <div className="text-center">
            <div className={`font-pixel-large ${getHealthColor(financialStatus.currentBalance, 'balance')}`}>
              {formatMoney(financialStatus.currentBalance)}
            </div>
            <div className="font-pixel text-xs text-retro-gb-mid">利用可能資金</div>
          </div>
        </PixelCard>

        <PixelCard title="月次純利益">
          <div className="text-center">
            <div className={`font-pixel-large ${getHealthColor(financialStatus.profitability, 'profit')}`}>
              {formatMoney(financialStatus.netIncome)}
            </div>
            <div className="font-pixel text-xs text-retro-gb-mid">
              利益率 {financialStatus.profitability.toFixed(1)}%
            </div>
          </div>
        </PixelCard>

        <PixelCard title="運営持続日数">
          <div className="text-center">
            <div className={`font-pixel-large ${getHealthColor(financialStatus.burnRate, 'burnRate')}`}>
              {financialStatus.burnRate === Infinity ? '∞' : Math.floor(financialStatus.burnRate)}
            </div>
            <div className="font-pixel text-xs text-retro-gb-mid">
              {financialStatus.burnRate === Infinity ? '黒字経営' : '日'}
            </div>
          </div>
        </PixelCard>

        <PixelCard title="総資産価値">
          <div className="text-center">
            <div className="font-pixel-large text-retro-gb-dark">
              {formatMoney(financialStatus.totalAssets)}
            </div>
            <div className="font-pixel text-xs text-retro-gb-mid">現金+資産</div>
          </div>
        </PixelCard>
      </div>

      {/* タブナビゲーション */}
      <PixelCard>
        <div className="flex space-x-2">
          {[
            { key: 'overview', label: '概要' },
            { key: 'transactions', label: '取引履歴' },
            { key: 'budget', label: '予算管理' },
            { key: 'reports', label: 'レポート' }
          ].map(tab => (
            <PixelButton
              key={tab.key}
              size="sm"
              variant={selectedTab === tab.key ? 'primary' : 'secondary'}
              onClick={() => setSelectedTab(tab.key as any)}
            >
              {tab.label}
            </PixelButton>
          ))}
        </div>
      </PixelCard>

      {/* 概要タブ */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* 収支グラフ */}
          <PixelCard title="月次収支">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-pixel text-sm text-green-600 mb-2">収入</div>
                <div className="font-pixel-large text-green-600">
                  {formatMoney(financialStatus.monthlyIncome)}
                </div>
                <div className="mt-2">
                  <PixelProgressBar
                    value={financialStatus.monthlyIncome}
                    max={Math.max(financialStatus.monthlyIncome, financialStatus.monthlyExpenses)}
                    color="exp"
                    showLabel={false}
                  />
                </div>
              </div>
              <div>
                <div className="font-pixel text-sm text-red-600 mb-2">支出</div>
                <div className="font-pixel-large text-red-600">
                  {formatMoney(financialStatus.monthlyExpenses)}
                </div>
                <div className="mt-2">
                  <PixelProgressBar
                    value={financialStatus.monthlyExpenses}
                    max={Math.max(financialStatus.monthlyIncome, financialStatus.monthlyExpenses)}
                    color="hp"
                    showLabel={false}
                  />
                </div>
              </div>
            </div>
          </PixelCard>

          {/* クイック取引 */}
          <PixelCard title="クイック取引">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <PixelButton
                size="sm"
                className="h-16 flex flex-col items-center justify-center"
                onClick={() => handleQuickTransaction('income', 'expedition', 2000, '派遣報酬受取')}
              >
                <div className="font-pixel text-xs">派遣報酬</div>
                <div className="font-pixel text-xs text-green-600">+₽2,000</div>
              </PixelButton>
              
              <PixelButton
                size="sm"
                variant="secondary"
                className="h-16 flex flex-col items-center justify-center"
                onClick={() => handleQuickTransaction('expense', 'salary', 3600, '給与支払い')}
              >
                <div className="font-pixel text-xs">給与支払い</div>
                <div className="font-pixel text-xs text-red-600">-₽3,600</div>
              </PixelButton>
              
              <PixelButton
                size="sm"
                variant="secondary"
                className="h-16 flex flex-col items-center justify-center"
                onClick={() => handleQuickTransaction('expense', 'pokemon', 1500, 'ポケモンケア')}
              >
                <div className="font-pixel text-xs">ポケモンケア</div>
                <div className="font-pixel text-xs text-red-600">-₽1,500</div>
              </PixelButton>
              
              <PixelButton
                size="sm"
                variant="secondary"
                className="h-16 flex flex-col items-center justify-center"
                onClick={() => handleQuickTransaction('expense', 'facility', 2500, '施設維持費')}
              >
                <div className="font-pixel text-xs">施設維持費</div>
                <div className="font-pixel text-xs text-red-600">-₽2,500</div>
              </PixelButton>
            </div>
          </PixelCard>

          {/* 最近の取引 */}
          <PixelCard title="最近の取引">
            <div className="space-y-2">
              {transactionList.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center py-2 border-b border-retro-gb-mid last:border-b-0">
                  <div>
                    <div className="font-pixel text-xs text-retro-gb-dark">
                      {transaction.description}
                    </div>
                    <div className="font-pixel text-xs text-retro-gb-mid">
                      {transaction.timestamp.toLocaleString('ja-JP')}
                    </div>
                  </div>
                  <div className={`font-pixel text-sm ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatMoney(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          </PixelCard>
        </div>
      )}

      {/* 取引履歴タブ */}
      {selectedTab === 'transactions' && (
        <div className="space-y-4">
          <PixelCard title="取引履歴">
            <div className="space-y-3">
              {transactionList.map((transaction) => (
                <div key={transaction.id} className="border border-retro-gb-mid p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-block w-3 h-3 ${transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className="font-pixel text-sm text-retro-gb-dark">
                          {transaction.description}
                        </span>
                      </div>
                      <div className="mt-1 space-y-1">
                        <div className="font-pixel text-xs text-retro-gb-mid">
                          カテゴリ: {transaction.category}
                        </div>
                        <div className="font-pixel text-xs text-retro-gb-mid">
                          {transaction.timestamp.toLocaleString('ja-JP')}
                        </div>
                        {transaction.relatedId && (
                          <div className="font-pixel text-xs text-retro-gb-mid">
                            関連ID: {transaction.relatedId}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`font-pixel text-lg ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatMoney(transaction.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </PixelCard>
        </div>
      )}

      {/* 予算管理タブ */}
      {selectedTab === 'budget' && (
        <div className="space-y-4">
          <PixelCard title="月次予算状況">
            <div className="space-y-4">
              {budget.map((category) => (
                <div key={category.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-pixel text-sm text-retro-gb-dark">
                      {category.name}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="font-pixel text-xs text-retro-gb-mid">
                        {formatMoney(category.spent)} / {formatMoney(category.allocated)}
                      </span>
                      {category.isOverBudget && (
                        <span className="font-pixel text-xs text-red-600">超過!</span>
                      )}
                    </div>
                  </div>
                  <PixelProgressBar
                    value={category.spent}
                    max={category.allocated}
                    color={category.isOverBudget ? 'hp' : category.percentage > 80 ? 'progress' : 'exp'}
                    showLabel={false}
                  />
                  <div className="flex justify-between text-xs">
                    <span className="font-pixel text-retro-gb-mid">
                      残り: {formatMoney(category.remaining)}
                    </span>
                    <span className={`font-pixel ${category.isOverBudget ? 'text-red-600' : 'text-retro-gb-mid'}`}>
                      {category.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </PixelCard>
        </div>
      )}

      {/* レポートタブ */}
      {selectedTab === 'reports' && monthlyReport && (
        <div className="space-y-4">
          <PixelCard title="月次レポート">
            <div className="space-y-4">
              {/* インサイト */}
              <div>
                <h3 className="font-pixel text-sm text-retro-gb-dark mb-2">分析結果</h3>
                <div className="space-y-2">
                  {monthlyReport.insights.map((insight: string, index: number) => (
                    <div key={index} className="font-pixel text-xs text-retro-gb-mid p-2 bg-retro-gb-light border border-retro-gb-mid">
                      {insight}
                    </div>
                  ))}
                </div>
              </div>

              {/* 投資シミュレーション */}
              <div>
                <h3 className="font-pixel text-sm text-retro-gb-dark mb-2">投資シミュレーション</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: '新施設建設', amount: 20000, return: 8, months: 12 },
                    { name: '研究開発投資', amount: 10000, return: 15, months: 6 }
                  ].map((investment, index) => {
                    // モックモード用の簡単な計算
                    const totalReturn = investment.amount * (1 + (investment.return / 100))
                    const roi = investment.return
                    
                    return (
                      <div key={index} className="border border-retro-gb-mid p-3">
                        <div className="font-pixel text-sm text-retro-gb-dark mb-2">
                          {investment.name}
                        </div>
                        <div className="space-y-1 font-pixel text-xs text-retro-gb-mid">
                          <div>投資額: {formatMoney(investment.amount)}</div>
                          <div>期間: {investment.months}ヶ月</div>
                          <div>期待リターン: {formatMoney(totalReturn)}</div>
                          <div>ROI: {roi.toFixed(1)}%</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 推奨事項 */}
              <div>
                <h3 className="font-pixel text-sm text-retro-gb-dark mb-2">推奨事項</h3>
                <div className="space-y-2">
                  {monthlyReport.recommendations.map((rec: string, index: number) => (
                    <div key={index} className="font-pixel text-xs text-blue-700 p-2 bg-blue-50 border border-blue-200">
                      💡 {rec}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PixelCard>
        </div>
      )}
    </div>
  )
}