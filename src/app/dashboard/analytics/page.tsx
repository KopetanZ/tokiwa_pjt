'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { PixelProgressBar } from '@/components/ui/PixelProgressBar'
import { formatMoney } from '@/lib/utils'
import { useGameState, useEconomy, useTrainers, useExpeditions } from '@/lib/game-state/hooks'

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'all'>('week')
  const router = useRouter()
  
  const { gameData } = useGameState()
  const { money, transactions } = useEconomy()
  const { trainers } = useTrainers()
  const { expeditions } = useExpeditions()

  // JSON システムから分析データを計算
  const gameState = {
    progress: {
      level: gameData?.player?.level || 1,
      experience: gameData?.player?.experience || 0,
      nextLevelExp: gameData?.player?.nextLevelExp || 1000,
      totalPlayTime: gameData?.statistics?.totalPlayTime || 0,
      unlockedFeatures: ['basic_training', 'pokemon_management', 'expeditions', 'economy'],
      difficulty: 'normal'
    },
    metrics: {
      averageEfficiency: trainers.length > 0 ? trainers.reduce((sum, t) => sum + t.level, 0) / trainers.length / 10 : 1.0,
      expeditionSuccessRate: expeditions.length > 0 ? 
        (expeditions.filter(e => e.status === 'completed').length / expeditions.length) * 100 : 100,
      totalRevenue: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
      totalExpenses: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
      netProfit: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) - 
                transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
      expeditionsCompleted: expeditions.filter(e => e.status === 'completed').length,
      pokemonCaught: gameData?.pokemon?.length || 0,
      trainersHired: trainers.length,
      facilitiesUpgraded: 0,
      researchCompleted: 0
    },
    balance: {
      trainerGrowthRate: 1.0,
      pokemonGrowthRate: 1.0,
      expeditionDifficulty: 1.0,
      economyInflation: 1.0,
      researchSpeed: 1.0,
      facilityEfficiency: 1.0
    }
  }

  const gameSummary = {
    overallScore: (gameData?.player?.experience || 0) + money + (trainers.length * 100) + ((gameData?.pokemon?.length || 0) * 50),
    recommendations: [
      money < 10000 ? '資金を増やしましょう' : null,
      trainers.length < 3 ? 'トレーナーを雇用しましょう' : null,
      expeditions.filter(e => e.status === 'active').length === 0 ? '派遣を開始しましょう' : null
    ].filter(Boolean),
    nextMilestone: {
      level: gameState.progress.level + 1,
      description: `レベル${gameState.progress.level + 1}で新機能が解放されます`
    }
  }

  const handleEmergencyEvent = () => {
    const events = [
      { description: 'ポケモンが負傷しました', severity: '中', duration: 30 },
      { description: '施設でトラブルが発生しました', severity: '低', duration: 15 },
      { description: '緊急派遣要請が来ています', severity: '高', duration: 60 }
    ]
    const event = events[Math.floor(Math.random() * events.length)]
    alert(`🚨 ${event.description}\n深刻度: ${event.severity}\n持続時間: ${event.duration}分`)
  }

  const handleDetailedReport = () => {
    console.log('詳細レポートを生成しています...')
    
    // 詳細レポートの生成処理をシミュレート
    setTimeout(() => {
      console.log('📊 詳細レポートが生成されました')
      console.log('詳細レポート生成:', {
        period: selectedPeriod,
        gameState,
        gameSummary,
        timestamp: new Date().toISOString()
      })
    }, 2000)
  }

  const getLevelProgress = () => {
    const progress = gameState.progress
    return (progress.experience / progress.nextLevelExp) * 100
  }

  const getScoreGrade = (score: number) => {
    if (score >= 2000) return { grade: 'S', color: 'text-purple-600' }
    if (score >= 1500) return { grade: 'A', color: 'text-blue-600' }
    if (score >= 1000) return { grade: 'B', color: 'text-green-600' }
    if (score >= 500) return { grade: 'C', color: 'text-yellow-600' }
    return { grade: 'D', color: 'text-red-600' }
  }

  const scoreInfo = getScoreGrade(gameSummary.overallScore)

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="font-pixel-large text-retro-gb-dark">
          ゲーム分析
        </h1>
        <div className="flex space-x-2">
          <PixelButton size="sm" variant="secondary" onClick={handleEmergencyEvent}>
            緊急イベント生成
          </PixelButton>
          <PixelButton onClick={handleDetailedReport}>
            詳細レポート
          </PixelButton>
        </div>
      </div>

      {/* 総合スコア */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <PixelCard title="総合スコア">
          <div className="text-center">
            <div className={`font-pixel-large ${scoreInfo.color}`}>
              {scoreInfo.grade}
            </div>
            <div className="font-pixel text-sm text-retro-gb-dark">
              {gameSummary.overallScore.toLocaleString()}pt
            </div>
          </div>
        </PixelCard>

        <PixelCard title="施設長レベル">
          <div className="text-center">
            <div className="font-pixel-large text-blue-600">
              Lv.{gameState.progress.level}
            </div>
            <div className="mt-2">
              <PixelProgressBar
                value={getLevelProgress()}
                max={100}
                color="exp"
                showLabel={false}
              />
            </div>
            <div className="font-pixel text-xs text-retro-gb-mid mt-1">
              {gameState.progress.experience} / {gameState.progress.nextLevelExp}
            </div>
          </div>
        </PixelCard>

        <PixelCard title="プレイ時間">
          <div className="text-center">
            <div className="font-pixel-large text-green-600">
              {Math.floor(gameState.progress.totalPlayTime / 60)}h
            </div>
            <div className="font-pixel text-sm text-retro-gb-mid">
              {Math.floor(gameState.progress.totalPlayTime % 60)}分
            </div>
          </div>
        </PixelCard>

        <PixelCard title="解放機能">
          <div className="text-center">
            <div className="font-pixel-large text-purple-600">
              {gameState.progress.unlockedFeatures.length}
            </div>
            <div className="font-pixel text-xs text-retro-gb-mid">機能利用可能</div>
          </div>
        </PixelCard>
      </div>

      {/* パフォーマンス指標 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PixelCard title="効率指標">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-pixel text-xs text-retro-gb-mid">平均効率</span>
              <span className="font-pixel text-sm text-blue-600">
                {gameState.metrics.averageEfficiency.toFixed(2)}x
              </span>
            </div>
            <PixelProgressBar
              value={gameState.metrics.averageEfficiency}
              max={2.0}
              color="progress"
              showLabel={false}
            />
            <div className="flex justify-between">
              <span className="font-pixel text-xs text-retro-gb-mid">派遣成功率</span>
              <span className="font-pixel text-sm text-green-600">
                {gameState.metrics.expeditionSuccessRate.toFixed(1)}%
              </span>
            </div>
            <PixelProgressBar
              value={gameState.metrics.expeditionSuccessRate}
              max={100}
              color="exp"
              showLabel={false}
            />
          </div>
        </PixelCard>

        <PixelCard title="財務指標">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-pixel text-xs text-retro-gb-mid">月次収益</span>
              <span className="font-pixel text-sm text-green-600">
                {formatMoney(gameState.metrics.totalRevenue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-pixel text-xs text-retro-gb-mid">月次支出</span>
              <span className="font-pixel text-sm text-red-600">
                {formatMoney(gameState.metrics.totalExpenses)}
              </span>
            </div>
            <div className="flex justify-between border-t border-retro-gb-mid pt-2">
              <span className="font-pixel text-xs text-retro-gb-dark">純利益</span>
              <span className={`font-pixel text-sm ${gameState.metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatMoney(gameState.metrics.netProfit)}
              </span>
            </div>
          </div>
        </PixelCard>

        <PixelCard title="活動指標">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-pixel text-xs text-retro-gb-mid">派遣完了</span>
              <span className="font-pixel text-sm text-retro-gb-dark">
                {gameState.metrics.expeditionsCompleted}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-pixel text-xs text-retro-gb-mid">ポケモン捕獲</span>
              <span className="font-pixel text-sm text-retro-gb-dark">
                {gameState.metrics.pokemonCaught}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-pixel text-xs text-retro-gb-mid">トレーナー雇用</span>
              <span className="font-pixel text-sm text-retro-gb-dark">
                {gameState.metrics.trainersHired}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-pixel text-xs text-retro-gb-mid">施設アップグレード</span>
              <span className="font-pixel text-sm text-retro-gb-dark">
                {gameState.metrics.facilitiesUpgraded}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-pixel text-xs text-retro-gb-mid">研究完了</span>
              <span className="font-pixel text-sm text-retro-gb-dark">
                {gameState.metrics.researchCompleted}
              </span>
            </div>
          </div>
        </PixelCard>
      </div>

      {/* バランス状況 */}
      <PixelCard title="ゲームバランス状況">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="font-pixel text-sm text-retro-gb-dark mb-1">
              トレーナー成長率
            </div>
            <div className="font-pixel-large text-blue-600">
              {gameState.balance.trainerGrowthRate.toFixed(2)}x
            </div>
          </div>
          <div className="text-center">
            <div className="font-pixel text-sm text-retro-gb-dark mb-1">
              ポケモン成長率
            </div>
            <div className="font-pixel-large text-green-600">
              {gameState.balance.pokemonGrowthRate.toFixed(2)}x
            </div>
          </div>
          <div className="text-center">
            <div className="font-pixel text-sm text-retro-gb-dark mb-1">
              派遣難易度
            </div>
            <div className="font-pixel-large text-orange-600">
              {gameState.balance.expeditionDifficulty.toFixed(2)}x
            </div>
          </div>
          <div className="text-center">
            <div className="font-pixel text-sm text-retro-gb-dark mb-1">
              経済インフレ
            </div>
            <div className="font-pixel-large text-red-600">
              {gameState.balance.economyInflation.toFixed(2)}x
            </div>
          </div>
          <div className="text-center">
            <div className="font-pixel text-sm text-retro-gb-dark mb-1">
              研究速度
            </div>
            <div className="font-pixel-large text-purple-600">
              {gameState.balance.researchSpeed.toFixed(2)}x
            </div>
          </div>
          <div className="text-center">
            <div className="font-pixel text-sm text-retro-gb-dark mb-1">
              施設効率
            </div>
            <div className="font-pixel-large text-cyan-600">
              {gameState.balance.facilityEfficiency.toFixed(2)}x
            </div>
          </div>
        </div>
      </PixelCard>

      {/* AI推奨事項 */}
      <PixelCard title="AI分析レコメンデーション">
        <div className="space-y-3">
          {gameSummary.recommendations.length > 0 ? (
            gameSummary.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200">
                <span className="text-blue-600 font-bold">💡</span>
                <span className="font-pixel text-xs text-blue-700 flex-1">{rec}</span>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <div className="font-pixel text-sm text-green-600">
                🎉 素晴らしい経営状況です！
              </div>
              <div className="font-pixel text-xs text-retro-gb-mid mt-1">
                現在のところ特別な改善提案はありません
              </div>
            </div>
          )}
        </div>
      </PixelCard>

      {/* 次の目標 */}
      <PixelCard title="次のマイルストーン">
        <div className="flex items-center space-x-4">
          <div className="text-4xl">🎯</div>
          <div className="flex-1">
            <div className="font-pixel text-lg text-retro-gb-dark">
              レベル {gameSummary.nextMilestone.level}
            </div>
            <div className="font-pixel text-sm text-retro-gb-mid">
              {gameSummary.nextMilestone.description}
            </div>
            <div className="mt-2">
              <PixelProgressBar
                value={gameState.progress.level}
                max={gameSummary.nextMilestone.level}
                color="progress"
                showLabel={true}
              />
            </div>
          </div>
        </div>
      </PixelCard>

      {/* 解放済み機能一覧 */}
      <PixelCard title="解放済み機能">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {gameState.progress.unlockedFeatures.map((feature: string, index: number) => (
            <div key={index} className="bg-green-50 border border-green-200 p-2 text-center">
              <span className="font-pixel text-xs text-green-700">
                {feature.replace(/_/g, ' ')}
              </span>
            </div>
          ))}
        </div>
      </PixelCard>

      {/* ゲーム設定 */}
      <PixelCard title="ゲーム設定">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-pixel text-sm text-retro-gb-dark">
              難易度: {gameState.progress.difficulty}
            </span>
            <div className="flex space-x-2">
              {['easy', 'normal', 'hard', 'expert'].map(diff => (
                <PixelButton
                  key={diff}
                  size="sm"
                  variant={gameState.progress.difficulty === diff ? 'primary' : 'secondary'}
                >
                  {diff}
                </PixelButton>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-pixel text-sm text-retro-gb-dark">
              分析期間
            </span>
            <div className="flex space-x-2">
              {[
                { key: 'day', label: '日' },
                { key: 'week', label: '週' },
                { key: 'month', label: '月' },
                { key: 'all', label: '全期間' }
              ].map(period => (
                <PixelButton
                  key={period.key}
                  size="sm"
                  variant={selectedPeriod === period.key ? 'primary' : 'secondary'}
                  onClick={() => setSelectedPeriod(period.key as any)}
                >
                  {period.label}
                </PixelButton>
              ))}
            </div>
          </div>
        </div>
      </PixelCard>
    </div>
  )
}