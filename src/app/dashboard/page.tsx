'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useGameData, useNotifications } from '@/contexts/GameContext'
import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { PixelProgressBar } from '@/components/ui/PixelProgressBar'
import { formatMoney } from '@/lib/utils'
import { getSafeGameData, calculateGameStats } from '@/lib/data-utils'
import { UI } from '@/config/app'
import { saveEmergencyEventResult, processEmergencyEvent, processMockEmergencyEvent } from '@/lib/emergency-events'
import { gameController } from '@/lib/game-logic'

export default function DashboardPage() {
  const { user, isAuthenticated, isMockMode, isLoading: authLoading } = useAuth()
  const gameData = useGameData()
  const { addNotification } = useNotifications()
  const router = useRouter()
  
  // ローディング状態の統合判定
  const isLoading = authLoading || (!isMockMode && isAuthenticated && !gameData)
  
  const [showEmergency, setShowEmergency] = useState(false)
  const [emergencyEvent, setEmergencyEvent] = useState<{
    id: string
    type: 'pokemon_encounter' | 'rare_item' | 'trainer_emergency' | 'weather_event'
    pokemon: string
    trainerName: string
    timeLeft: number
    successChance: number
    timestamp: Date
    resolved: boolean
  } | null>(null)
  const [emergencyTimer, setEmergencyTimer] = useState<NodeJS.Timeout | null>(null)
  const [gameStats, setGameStats] = useState<any>(null)
  const [economicData, setEconomicData] = useState<any>(null)

  // ゲームデータ読み込み
  useEffect(() => {
    const loadGameStats = async () => {
      try {
        const stats = gameController.getGameStats()
        const economic = gameController.getEconomicStatus()
        
        setGameStats(stats)
        setEconomicData(economic)
        
        console.log('📊 ゲーム統計読み込み完了:', { stats, economic })
      } catch (error) {
        console.error('ゲーム統計読み込みエラー:', error)
      }
    }
    
    loadGameStats()
    
    // 30秒ごとに更新
    const interval = setInterval(loadGameStats, UI.REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  // クイックアクションハンドラー
  const handleNewExpedition = () => {
    addNotification({
      type: 'info',
      message: '新しい派遣画面に移動します'
    })
    router.push('/dashboard/expeditions')
  }

  const handleHireTrainer = () => {
    addNotification({
      type: 'info',
      message: 'トレーナー雇用画面に移動します'
    })
    router.push('/dashboard/trainers')
  }

  const handleUpgradeFacility = () => {
    addNotification({
      type: 'info',
      message: '施設強化画面に移動します'
    })
    router.push('/dashboard/facilities')
  }

  const handleManagePokemon = () => {
    addNotification({
      type: 'info',
      message: 'ポケモン管理画面に移動します'
    })
    router.push('/dashboard/pokemon')
  }

  const handleViewDetails = () => {
    addNotification({
      type: 'info',
      message: '詳細分析画面に移動します'
    })
    router.push('/dashboard/analytics')
  }

  // 緊急イベントタイマー
  const startEmergencyTimer = useCallback(() => {
    if (emergencyTimer) {
      clearInterval(emergencyTimer)
    }
    
    const timer = setInterval(() => {
      setEmergencyEvent(prev => {
        if (!prev || prev.timeLeft <= 1) {
          setShowEmergency(false)
          addNotification({
            type: 'warning',
            message: '⏰ 緊急イベントの時間切れです'
          })
          clearInterval(timer)
          return null
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 }
      })
    }, 1000)
    
    setEmergencyTimer(timer)
  }, [emergencyTimer, addNotification])

  // 緊急イベント生成
  const generateEmergencyEvent = useCallback(() => {
    const pokemonList = ['ピカチュウ', 'イーブイ', 'ヒトカゲ', 'フシギダネ', 'ゼニガメ', 'ピッピ']
    const trainerList = ['カスミ', 'タケシ', 'マチス', 'エリカ', 'ナツメ']
    const eventTypes: ('pokemon_encounter' | 'rare_item' | 'trainer_emergency' | 'weather_event')[] = ['pokemon_encounter', 'rare_item', 'trainer_emergency']
    
    const event = {
      id: `emergency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      pokemon: pokemonList[Math.floor(Math.random() * pokemonList.length)],
      trainerName: trainerList[Math.floor(Math.random() * trainerList.length)],
      timeLeft: 30, // 30秒
      successChance: Math.floor(Math.random() * 40) + 60, // 60-100%
      timestamp: new Date(),
      resolved: false
    }
    
    setEmergencyEvent(event)
    setShowEmergency(true)
    
    console.log('緊急イベント発生:', event)
    
    // タイマー開始
    startEmergencyTimer()
  }, [startEmergencyTimer])

  // コンポーネントマウント時とクリーンアップ
  useEffect(() => {
    // 60秒に1回緊急イベントを発生させる（テスト用）
    const eventGenerator = setInterval(() => {
      if (!showEmergency && Math.random() < 0.3) { // 30%の確率
        generateEmergencyEvent()
      }
    }, 60000) // 60秒間隔

    // 初回は30秒後に発生
    const initialEvent = setTimeout(() => {
      if (!showEmergency) {
        generateEmergencyEvent()
      }
    }, UI.REFRESH_INTERVAL)

    return () => {
      clearInterval(eventGenerator)
      clearTimeout(initialEvent)
      if (emergencyTimer) {
        clearInterval(emergencyTimer)
      }
    }
  }, [showEmergency, emergencyTimer])

  // 緊急通知ハンドラー（改良版）
  const handleEmergencyChoice = async (choice: 'capture' | 'observe' | 'ignore') => {
    if (!emergencyEvent) return
    
    try {
      // イベント処理
      const result = isMockMode 
        ? processMockEmergencyEvent(emergencyEvent, choice)
        : processEmergencyEvent(emergencyEvent, choice)
      
      // 通知表示
      addNotification({
        type: result.success ? 'success' : 'warning',
        message: `${result.success ? '🎉' : '😞'} ${result.message}`
      })
      
      // データベース保存（モックモードでない場合）
      if (!isMockMode && user && result.success) {
        const saved = await saveEmergencyEventResult(user, emergencyEvent, result)
        
        if (saved) {
          addNotification({
            type: 'info',
            message: '📊 ゲームデータが更新されました'
          })
        } else {
          addNotification({
            type: 'warning',
            message: 'データ保存に失敗しました'
          })
        }
      }
      
      console.log('緊急イベント結果:', {
        choice,
        result,
        pokemon: emergencyEvent.pokemon,
        trainer: emergencyEvent.trainerName
      })
      
    } catch (error) {
      console.error('緊急イベント処理エラー:', error)
      addNotification({
        type: 'warning',
        message: 'イベント処理中にエラーが発生しました'
      })
    } finally {
      // クリーンアップ
      setShowEmergency(false)
      if (emergencyTimer) {
        clearInterval(emergencyTimer)
      }
    }
  }

  // 後方互換性のための旧ハンドラー
  const handleCapturePokemon = () => handleEmergencyChoice('capture')
  const handleMissPokemon = () => handleEmergencyChoice('ignore')

  console.log('📊 DashboardPage: レンダリング', { user: !!user, isLoading, isAuthenticated, isMockMode, gameDataLoaded: !!gameData })

  // ローディング中の表示
  if (isLoading) {
    console.log('📊 DashboardPage: ローディング中を表示')
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="font-pixel text-retro-gb-dark">ダッシュボードを読み込み中...</div>
          <div className="w-16 h-2 bg-retro-gb-mid mx-auto animate-pulse"></div>
          <div className="font-pixel text-xs text-retro-gb-mid">
            認証方法: Supabase
          </div>
        </div>
      </div>
    )
  }

  // 安全なゲームデータ取得
  const safeGameData = getSafeGameData(isMockMode, gameData, user)
  const legacyGameStats = calculateGameStats(safeGameData)
  
  // ゲームロジックからのデータを優先、フォールバックで既存データを使用
  const currentGameStats = gameStats || legacyGameStats
  const currentMoney = economicData?.current_money || legacyGameStats.currentMoney
  const monthlyIncome = economicData?.monthly_income || 15000
  const monthlyExpenses = economicData?.monthly_expenses || 8500
  const netIncome = economicData?.net_income || (monthlyIncome - monthlyExpenses)

  // ユーザーが存在しない場合（開発環境では表示を続行）
  const isDevelopment = process.env.NODE_ENV === 'development'
  if (!user && !isDevelopment) {
    console.log('📊 DashboardPage: ユーザーが存在しない、エラー表示')
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="font-pixel text-retro-gb-dark">ユーザー情報が見つかりません</div>
          <PixelButton onClick={() => router.push('/')}>
            ホームに戻る
          </PixelButton>
        </div>
      </div>
    )
  }

  console.log('📊 DashboardPage: メインコンテンツを表示', { user, isMockMode, hasGameData: !!safeGameData })

  // 開発環境でユーザーがいない場合の初期化案内
  if (isDevelopment && !user && !isMockMode) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="font-pixel text-retro-gb-dark">🎮 開発環境でゲームを体験</div>
          <div className="font-pixel text-xs text-retro-gb-mid">
            認証なしでゲームをテストできます
          </div>
          <PixelButton onClick={() => router.push('/')}>
            ホームに戻ってクイックスタート
          </PixelButton>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="text-center space-y-2">
        <h1 className="font-pixel-large text-retro-gb-dark">
          トキワシティ訓練所
        </h1>
        <p className="font-pixel text-xs text-retro-gb-mid">
          館長: {safeGameData.profile?.guest_name || user?.email || (isMockMode ? '開発テスト館長' : 'ゲスト')}
          {isMockMode && (
            <span className="ml-2 px-2 py-1 bg-yellow-300 text-yellow-800 rounded text-xs">
              🎮 DEV
            </span>
          )}
        </p>
      </div>

      {/* 概要カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 資金状況 */}
        <PixelCard title="スクール資金">
          <div className="space-y-3">
            <div className="text-center">
              <div className="font-pixel-large text-retro-gb-dark">
                {formatMoney(currentMoney)}
              </div>
              {economicData && (
                <div className="font-pixel text-xs text-retro-gb-mid">
                  キャッシュフロー: {economicData.cash_flow_trend === 'positive' ? '📈' : economicData.cash_flow_trend === 'negative' ? '📉' : '↔️'}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-pixel text-xs">今月収入</span>
                <span className="font-pixel text-xs text-green-600">+₽{monthlyIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-pixel text-xs">今月支出</span>
                <span className="font-pixel text-xs text-red-600">-₽{monthlyExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-pixel text-xs">
                <span>純利益</span>
                <span className={netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {netIncome >= 0 ? '+' : ''}₽{netIncome.toLocaleString()}
                </span>
              </div>
              <PixelProgressBar 
                value={Math.max(0, Math.min(100, (netIncome / monthlyIncome) * 100))} 
                max={100} 
                color={netIncome >= 0 ? "exp" : "danger"}
                showLabel={false}
              />
            </div>
          </div>
        </PixelCard>

        {/* スクール評判 */}
        <PixelCard title="スクール評判">
          <div className="space-y-3">
            <div className="text-center">
              <div className="font-pixel-large text-retro-gb-dark">
                {currentGameStats.reputation}
              </div>
              <div className="font-pixel text-xs text-retro-gb-mid">
                評判ポイント
              </div>
              {gameStats && (
                <div className="font-pixel text-xs text-retro-gb-mid">
                  v{gameStats.gameVersion}
                </div>
              )}
            </div>
            <PixelProgressBar 
              value={currentGameStats.reputation} 
              max={1000} 
              color="hp"
              showLabel={true}
            />
          </div>
        </PixelCard>

        {/* 現在の活動 */}
        <PixelCard title="現在の活動">
          <div className="space-y-3">
            <div className="font-pixel text-xs text-retro-gb-dark">
              進行中の派遣: {currentGameStats.activeExpeditions}件
            </div>
            <div className="font-pixel text-xs text-retro-gb-dark">
              利用可能トレーナー: {currentGameStats.totalTrainers}人
            </div>
            <div className="font-pixel text-xs text-retro-gb-dark">
              総ポケモン数: {currentGameStats.totalPokemon}匹
            </div>
            {gameStats && (
              <div className="font-pixel text-xs text-retro-gb-mid">
                派遣先: {gameStats.locations}箇所
              </div>
            )}
            <PixelButton size="sm" className="w-full" onClick={handleViewDetails}>
              詳細を見る
            </PixelButton>
          </div>
        </PixelCard>
      </div>

      {/* クイックアクション */}
      <PixelCard title="クイックアクション">
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <PixelButton size="sm" onClick={handleNewExpedition}>
              新しい派遣
            </PixelButton>
            <PixelButton size="sm" variant="secondary" onClick={handleHireTrainer}>
              トレーナー雇用
            </PixelButton>
            <PixelButton size="sm" variant="secondary" onClick={handleUpgradeFacility}>
              施設強化
            </PixelButton>
            <PixelButton size="sm" variant="secondary" onClick={handleManagePokemon}>
              ポケモン管理
            </PixelButton>
          </div>
          
          {/* デバッグアクション（開発時のみ） */}
          {process.env.NODE_ENV === 'development' && (
            <div className="border-t border-retro-gb-mid pt-3">
              <div className="font-pixel text-xs text-retro-gb-mid mb-2">🔧 デバッグアクション</div>
              <div className="grid grid-cols-2 gap-2">
                <PixelButton 
                  size="sm" 
                  variant="secondary" 
                  onClick={() => {
                    gameController.addDebugMoney(10000)
                    addNotification({ type: 'success', message: '₽10,000を追加しました' })
                  }}
                >
                  +₽10K
                </PixelButton>
                <PixelButton 
                  size="sm" 
                  variant="secondary" 
                  onClick={async () => {
                    try {
                      const pokemon = await gameController.generateDebugPokemon()
                      addNotification({ 
                        type: 'success', 
                        message: `${pokemon?.name_ja || 'ポケモン'}を発見！` 
                      })
                    } catch (error) {
                      addNotification({ type: 'error', message: 'ポケモン生成エラー' })
                    }
                  }}
                >
                  ポケモン発見
                </PixelButton>
              </div>
            </div>
          )}
        </div>
      </PixelCard>

      {/* 経済詳細 & 最近の活動 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 経済結果レポート */}
        <PixelCard title="経済サマリー">
          <div className="space-y-3">
            {economicData ? (
              <>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="font-pixel text-retro-gb-mid">総収入</div>
                    <div className="font-pixel text-green-600">₽{economicData.total_income.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="font-pixel text-retro-gb-mid">総支出</div>
                    <div className="font-pixel text-red-600">₽{economicData.total_expenses.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="font-pixel text-retro-gb-mid">純利益</div>
                    <div className={`font-pixel ${economicData.net_income >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₽{economicData.net_income.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="font-pixel text-retro-gb-mid">トレンド</div>
                    <div className="font-pixel text-retro-gb-dark">
                      {economicData.cash_flow_trend === 'positive' ? '📈 成長' : 
                       economicData.cash_flow_trend === 'negative' ? '📉 下降' : '↔️ 安定'}
                    </div>
                  </div>
                </div>
                <PixelButton size="sm" className="w-full" onClick={() => router.push('/dashboard/analytics')}>
                  詳細レポートを見る
                </PixelButton>
              </>
            ) : (
              <div className="font-pixel text-xs text-retro-gb-mid text-center py-4">
                経済データ読み込み中...
              </div>
            )}
          </div>
        </PixelCard>

        {/* 最近の活動 */}
        <PixelCard title="最近の活動">
          <div className="space-y-3">
            {[
              { time: '2時間前', event: 'タケシが22番道路から帰還', result: 'ポッポ×1、₽800獲得' },
              { time: '4時間前', event: 'カスミがトキワの森へ出発', result: '予定時間: 6時間' },
              { time: '6時間前', event: 'タケシがレベルアップ', result: 'レンジャー Lv.3 → Lv.4' },
            ].map((activity, index) => (
              <div key={index} className="space-y-1 pb-2 border-b border-retro-gb-mid last:border-b-0">
                <div className="flex justify-between items-start">
                  <span className="font-pixel text-xs text-retro-gb-dark flex-1">
                    {activity.event}
                  </span>
                  <span className="font-pixel text-xs text-retro-gb-mid">
                    {activity.time}
                  </span>
                </div>
                <div className="font-pixel text-xs text-retro-gb-mid">
                  {activity.result}
                </div>
              </div>
            ))}
          </div>
        </PixelCard>
      </div>

      {/* 緊急通知 */}
      {showEmergency && emergencyEvent && (
        <PixelCard title="緊急通知" variant="danger">
          <div className="space-y-2">
            <div className="font-pixel text-xs text-red-800">
              ⚠️ {emergencyEvent.trainerName}が野生の{emergencyEvent.pokemon}を発見！
            </div>
            <div className="font-pixel text-xs text-red-700">
              捕獲を試みますか？（残り時間: {emergencyEvent.timeLeft}秒）
            </div>
            <div className="font-pixel text-xs text-orange-600">
              成功確率: {emergencyEvent.successChance}%
            </div>
            <div className="grid grid-cols-3 gap-2">
              <PixelButton size="sm" variant="danger" onClick={handleCapturePokemon}>
                捕獲する
              </PixelButton>
              <PixelButton size="sm" variant="secondary" onClick={() => handleEmergencyChoice('observe')}>
                観察する
              </PixelButton>
              <PixelButton size="sm" variant="secondary" onClick={handleMissPokemon}>
                見逃す
              </PixelButton>
            </div>
          </div>
        </PixelCard>
      )}
    </div>
  )
}