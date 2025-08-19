'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useGameData, useNotifications } from '@/contexts/GameContext'
import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { PixelProgressBar } from '@/components/ui/PixelProgressBar'
import { formatMoney } from '@/lib/utils'
import { getSafeGameData, calculateGameStats } from '@/lib/data-utils'
import { saveEmergencyEventResult, processEmergencyEvent, processMockEmergencyEvent } from '@/lib/emergency-events'

export default function DashboardPage() {
  const { user, isAuthenticated, isMockMode, isLoading: authLoading } = useAuth()
  const gameData = useGameData()
  const { addNotification } = useNotifications()
  const router = useRouter()
  
  // ローディング状態の統合判定
  const isLoading = authLoading || (!isMockMode && isAuthenticated && !gameData)
  
  const [showEmergency, setShowEmergency] = useState(false)
  const [emergencyEvent, setEmergencyEvent] = useState<{
    type: string
    pokemon: string
    trainerName: string
    timeLeft: number
    successChance: number
  } | null>(null)
  const [emergencyTimer, setEmergencyTimer] = useState<NodeJS.Timeout | null>(null)

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

  // 緊急イベント生成
  const generateEmergencyEvent = () => {
    const pokemonList = ['ピカチュウ', 'イーブイ', 'ヒトカゲ', 'フシギダネ', 'ゼニガメ', 'ピッピ']
    const trainerList = ['カスミ', 'タケシ', 'マチス', 'エリカ', 'ナツメ']
    const eventTypes = ['wild_encounter', 'rare_item', 'trainer_emergency']
    
    const event = {
      type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      pokemon: pokemonList[Math.floor(Math.random() * pokemonList.length)],
      trainerName: trainerList[Math.floor(Math.random() * trainerList.length)],
      timeLeft: 30, // 30秒
      successChance: Math.floor(Math.random() * 40) + 60 // 60-100%
    }
    
    setEmergencyEvent(event)
    setShowEmergency(true)
    
    console.log('緊急イベント発生:', event)
    
    // タイマー開始
    startEmergencyTimer()
  }

  // 緊急イベントタイマー
  const startEmergencyTimer = () => {
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
  }

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
    }, 30000)

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
  const gameStats = calculateGameStats(safeGameData)

  // ユーザーが存在しない場合（開発環境では表示を続行）
  const isDevelopment = process.env.NODE_ENV === 'development'
  if (!user && !isDevelopment) {
    console.log('📊 DashboardPage: ユーザーが存在しない、エラー表示')
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="font-pixel text-retro-gb-dark">ユーザー情報が見つかりません</div>
          <PixelButton onClick={() => window.location.href = '/'}>
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
          <PixelButton onClick={() => window.location.href = '/'}>
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
                {formatMoney(gameStats.currentMoney)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-pixel text-xs">今月収入</span>
                <span className="font-pixel text-xs">+₽15,000</span>
              </div>
              <div className="flex justify-between">
                <span className="font-pixel text-xs">今月支出</span>
                <span className="font-pixel text-xs">-₽8,500</span>
              </div>
              <PixelProgressBar 
                value={65} 
                max={100} 
                color="exp"
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
                {gameStats.reputation}
              </div>
              <div className="font-pixel text-xs text-retro-gb-mid">
                評判ポイント
              </div>
            </div>
            <PixelProgressBar 
              value={gameStats.reputation} 
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
              進行中の派遣: {gameStats.activeExpeditions}件
            </div>
            <div className="font-pixel text-xs text-retro-gb-dark">
              利用可能トレーナー: {gameStats.totalTrainers}人
            </div>
            <div className="font-pixel text-xs text-retro-gb-dark">
              総ポケモン数: {gameStats.totalPokemon}匹
            </div>
            <PixelButton size="sm" className="w-full" onClick={handleViewDetails}>
              詳細を見る
            </PixelButton>
          </div>
        </PixelCard>
      </div>

      {/* クイックアクション */}
      <PixelCard title="クイックアクション">
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