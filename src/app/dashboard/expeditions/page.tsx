'use client'

import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { PixelProgressBar } from '@/components/ui/PixelProgressBar'
import { ExpeditionCard } from '@/components/expeditions/ExpeditionCard'
import { LocationCard } from '@/components/expeditions/LocationCard'
import { TrainerSelectionModal } from '@/components/expeditions/TrainerSelectionModal'
import { useGameData, useAuth, useNotifications } from '@/contexts/GameContext'
import { getUserExpeditions, startRealExpedition } from '@/lib/expedition-integration'
import { getSafeGameData } from '@/lib/data-utils'
import { gameController, EXPEDITION_LOCATIONS } from '@/lib/game-logic'
import { useState, useEffect, useCallback } from 'react'

// サンプルデータ（モックIDと整合性を保つ）
const sampleActiveExpeditions = [
  {
    id: 'mock-expedition-1',
    trainer: { id: 'mock-trainer-2', name: 'カスミ', job: 'バトラー' },
    location: { 
      id: 1, 
      nameJa: 'トキワの森', 
      distanceLevel: 1,
      estimatedReturn: '2024-01-15T16:30:00',
      backgroundImage: '/images/locations/viridian_forest.png'
    },
    status: 'active',
    currentProgress: 0.65,
    expeditionMode: 'exploration',
    hasInterventionRequired: true,
    estimatedReward: 1200,
    startedAt: '2024-01-15T14:30:00'
  },
  {
    id: 'mock-expedition-2',
    trainer: { id: 'mock-trainer-1', name: 'タケシ', job: 'レンジャー' },
    location: { 
      id: 2, 
      nameJa: '22番道路', 
      distanceLevel: 1,
      estimatedReturn: '2024-01-15T15:30:00',
      backgroundImage: '/images/locations/route_22.png'
    },
    status: 'active',
    currentProgress: 0.90,
    expeditionMode: 'balanced',
    hasInterventionRequired: false,
    estimatedReward: 800,
    startedAt: '2024-01-15T14:30:00'
  }
]

// ゲームロジックシステムから実際の派遣先データを取得
const getGameLocations = (trainerLevel: number = 5) => {
  return gameController.getAvailableExpeditions(trainerLevel).map(location => ({
    id: location.id,
    nameJa: location.nameJa,
    distanceLevel: location.distanceLevel,
    travelCost: Math.floor(location.baseRewardMoney * 0.3), // 報酬の30%を旅費として計算
    travelTimeHours: Math.max(1, location.distanceLevel),
    riskLevel: location.dangerLevel / 5, // 1-5を0.2-1.0に正規化
    baseRewardMoney: location.baseRewardMoney,
    encounterTypes: location.encounterTypes,
    isUnlocked: true,
    description: location.description,
    backgroundImage: `/images/locations/${location.id}.png`
  }))
}

const sampleLocations = getGameLocations()

export default function ExpeditionsPage() {
  const [selectedTab, setSelectedTab] = useState<'active' | 'locations' | 'history'>('active')
  const [realExpeditionData, setRealExpeditionData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isTrainerModalOpen, setIsTrainerModalOpen] = useState(false)
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null)
  
  const { isMockMode, user, isAuthenticated } = useAuth()
  const gameData = useGameData()
  const { addNotification } = useNotifications()
  
  // 実際のゲームデータを統一的に取得
  const safeGameData = getSafeGameData(isMockMode, gameData, user)
  
  // 実際のデータベースから派遣情報を取得
  useEffect(() => {
    async function loadRealExpeditionData() {
      if (isMockMode || !isAuthenticated || !user) return
      
      setIsLoading(true)
      try {
        const expeditionData = await getUserExpeditions(user)
        setRealExpeditionData(expeditionData)
      } catch (error) {
        console.error('派遣データ読み込みエラー:', error)
        addNotification({
          type: 'error',
          message: '派遣データの読み込みに失敗しました'
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    loadRealExpeditionData()
  }, [isMockMode, isAuthenticated, user, addNotification])
  
  // 実際のゲームデータまたはサンプルデータを使用
  const expeditions = isMockMode 
    ? (safeGameData.expeditions || sampleActiveExpeditions)
    : (realExpeditionData?.active || [])
  
  const locations = isMockMode
    ? sampleLocations
    : (realExpeditionData?.locations || sampleLocations)
  
  const availableTrainers = isMockMode
    ? safeGameData.trainers || []
    : (realExpeditionData?.trainers?.filter((t: any) => t.status === 'available') || [])
  
  // 統計計算
  const stats = {
    active: expeditions.length,
    interventionRequired: expeditions.filter((exp: any) => 
      exp.hasInterventionRequired || 
      (exp.status === 'active' && Math.random() > 0.7)
    ).length,
    todayEarnings: isMockMode 
      ? expeditions.reduce((sum: number, exp: any) => sum + (exp.estimatedReward || 0), 0)
      : (realExpeditionData?.completed?.reduce((sum: number, exp: any) => {
          const today = new Date().toDateString()
          const completedToday = exp.actual_return && new Date(exp.actual_return).toDateString() === today
          return completedToday ? sum + (exp.result_summary?.totalReward || 0) : sum
        }, 0) || 0),
    availableLocations: locations.filter((loc: any) => 
      isMockMode ? loc.isUnlocked : (loc.is_unlocked_by_default || false)
    ).length
  }
  
  const handleStartExpedition = (locationId: number | string) => {
    console.log('🚀 派遣処理開始:', { locationId, isMockMode, availableTrainersCount: availableTrainers.length })
    
    setSelectedLocationId(typeof locationId === 'string' ? parseInt(locationId) : locationId)
    setIsTrainerModalOpen(true)
  }

  const handleConfirmExpedition = async (trainerId: string) => {
    if (!selectedLocationId) return
    
    setIsLoading(true)
    setIsTrainerModalOpen(false)
    
    try {
      if (isMockMode) {
        // 選択されたトレーナーを取得
        const selectedTrainer = availableTrainers.find((t: any) => t.id === trainerId)
        if (!selectedTrainer) {
          addNotification({
            type: 'error',
            message: 'トレーナーが見つかりません'
          })
          return
        }
        
        console.log('📋 選択されたトレーナー:', selectedTrainer)
        
        // ゲームロジックを使用した実際の派遣実行（モックモード）
        const result = await gameController.executeExpedition({
          trainerId: selectedTrainer.id,
          locationId: selectedLocationId.toString(),
          durationHours: 2,
          strategy: 'balanced',
          playerAdvice: []
        })
        
        console.log('📊 派遣結果:', result)
        
        addNotification({
          type: 'success',
          message: `${selectedTrainer.name}の派遣完了！₽${result.economicImpact.moneyGained.toLocaleString()}を獲得${result.pokemonCaught.length > 0 ? ` & ポケモン${result.pokemonCaught.length}体捕獲` : ''}`
        })
        
        // 捕獲したポケモンの詳細を表示
        if (result.pokemonCaught.length > 0) {
          for (const pokemon of result.pokemonCaught) {
            addNotification({
              type: 'info',
              message: `${pokemon.species?.name_ja || 'ポケモン'}(Lv.${pokemon.level})を捕獲しました！`
            })
          }
        }
        
        // 画面更新のためのリロード
        window.location.reload()
        return
      }
      
      if (!user) {
        addNotification({
          type: 'error',
          message: 'ユーザー情報が見つかりません'
        })
        return
      }
      
      const result = await startRealExpedition(
        user,
        trainerId,
        selectedLocationId,
        'balanced',
        2 // 2時間の派遣
      )
      
      if (result.success) {
        const selectedTrainer = availableTrainers.find((t: any) => t.id === trainerId)
        addNotification({
          type: 'success',
          message: `${selectedTrainer?.name || 'トレーナー'}を派遣しました！`
        })
        // データを再読み込み
        if (!isMockMode && isAuthenticated && user) {
          const expeditionData = await getUserExpeditions(user)
          setRealExpeditionData(expeditionData)
        }
      } else {
        addNotification({
          type: 'error',
          message: result.error || '派遣開始に失敗しました'
        })
      }
    } catch (error) {
      console.error('派遣開始エラー:', error)
      addNotification({
        type: 'error',
        message: '派遣開始中にエラーが発生しました'
      })
    } finally {
      setIsLoading(false)
      setSelectedLocationId(null)
    }
  }
  
  const handleIntervention = (expeditionId: string) => {
    addNotification({
      type: 'info',
      message: `派遣#${expeditionId}に介入しました`
    })
    
    // TODO: 実際の介入処理を実装
    console.log('介入処理:', { expeditionId })
  }

  const handleShowDetails = (locationId: number) => {
    const location = locations.find((loc: any) => loc.id === locationId)
    if (location) {
      addNotification({
        type: 'info',
        message: `${location.location_name_ja || location.nameJa}の詳細情報を表示`
      })
      console.log('詳細表示:', { locationId, location })
    }
  }

  const handleExpeditionDetails = (expeditionId: string) => {
    const expedition = expeditions.find((exp: any) => exp.id === expeditionId)
    if (expedition) {
      addNotification({
        type: 'info',
        message: `${expedition.trainer.name}の派遣詳細を表示`
      })
      console.log('派遣詳細表示:', { expeditionId, expedition })
    }
  }

  const handleAutoDecision = (expeditionId: string) => {
    addNotification({
      type: 'info',
      message: `派遣#${expeditionId}を自動判断モードに設定しました`
    })
    console.log('自動判断設定:', { expeditionId })
  }

  const selectedLocation = selectedLocationId ? 
    locations.find((loc: any) => loc.id === selectedLocationId) : null

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="font-pixel-large text-retro-gb-dark">
          派遣管理
        </h1>
        <PixelButton 
          onClick={() => setSelectedTab('locations')}
          disabled={isLoading}
        >
          {isLoading ? '処理中...' : '新しい派遣を開始'}
        </PixelButton>
      </div>

      {/* 統計サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <PixelCard title="進行中の派遣">
          <div className="text-center">
            <div className="font-pixel-large text-orange-600">{stats.active}</div>
            <div className="font-pixel text-xs text-retro-gb-mid">活動中</div>
          </div>
        </PixelCard>

        <PixelCard title="緊急介入">
          <div className="text-center">
            <div className="font-pixel-large text-red-600">{stats.interventionRequired}</div>
            <div className="font-pixel text-xs text-retro-gb-mid">要対応</div>
          </div>
        </PixelCard>

        <PixelCard title="今日の成果">
          <div className="text-center">
            <div className="font-pixel-large text-green-600">₽{stats.todayEarnings.toLocaleString()}</div>
            <div className="font-pixel text-xs text-retro-gb-mid">獲得金額</div>
          </div>
        </PixelCard>

        <PixelCard title="利用可能エリア">
          <div className="text-center">
            <div className="font-pixel-large text-retro-gb-dark">{stats.availableLocations}/5</div>
            <div className="font-pixel text-xs text-retro-gb-mid">解放済み</div>
          </div>
        </PixelCard>
      </div>

      {/* タブナビゲーション */}
      <PixelCard>
        <div className="flex space-x-2">
          {[
            { key: 'active', label: '進行中の派遣' },
            { key: 'locations', label: '派遣先一覧' },
            { key: 'history', label: '派遣履歴' }
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

      {/* 進行中の派遣 */}
      {selectedTab === 'active' && (
        <div className="space-y-4">
          {expeditions.length > 0 ? (
            expeditions.map((expedition: any) => (
              <ExpeditionCard 
                key={expedition.id}
                expedition={expedition}
                onIntervene={handleIntervention}
                onRecall={(id) => {
                  addNotification({
                    type: 'info',
                    message: `派遣#${id}を呼び戻しました`
                  })
                  console.log('呼び戻し処理:', { id })
                }}
                onShowDetails={handleExpeditionDetails}
                onAutoDecision={handleAutoDecision}
                disabled={isLoading}
              />
            ))
          ) : (
            <PixelCard>
              <div className="text-center py-8">
                <div className="font-pixel text-retro-gb-mid mb-4">
                  現在進行中の派遣はありません
                </div>
                <PixelButton onClick={() => setSelectedTab('locations')}>
                  新しい派遣を開始する
                </PixelButton>
              </div>
            </PixelCard>
          )}
        </div>
      )}

      {/* 派遣先一覧 */}
      {selectedTab === 'locations' && (
        <div className="space-y-4">
          {availableTrainers.length === 0 && !isMockMode && (
            <PixelCard>
              <div className="text-center py-4">
                <div className="font-pixel text-xs text-retro-gb-mid mb-2">
                  派遣を開始するには利用可能なトレーナーが必要です
                </div>
                <PixelButton size="sm" variant="secondary">
                  トレーナーを雇用する
                </PixelButton>
              </div>
            </PixelCard>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {locations.map((location: any) => (
              <LocationCard
                key={location.id}
                location={{
                  id: location.id,
                  nameJa: location.location_name_ja || location.nameJa,
                  distanceLevel: location.distance_level || location.distanceLevel,
                  travelCost: location.travel_cost || location.travelCost,
                  travelTimeHours: location.travel_time_hours || location.travelTimeHours,
                  riskLevel: location.risk_level || location.riskLevel,
                  baseRewardMoney: location.base_reward_money || location.baseRewardMoney,
                  encounterTypes: location.encounter_types || location.encounterTypes || [],
                  isUnlocked: isMockMode ? location.isUnlocked : (location.is_unlocked_by_default || false),
                  description: location.description || `${location.location_name_ja || location.nameJa}での派遣`,
                  backgroundImage: location.background_image || location.backgroundImage
                }}
                onStartExpedition={handleStartExpedition}
                onShowDetails={handleShowDetails}
                disabled={isLoading}
              />
            ))}
          </div>
        </div>
      )}

      {/* 派遣履歴 */}
      {selectedTab === 'history' && (
        <PixelCard title="最近の派遣結果">
          <div className="space-y-3">
            {[
              {
                trainer: 'タケシ',
                location: 'トキワの森',
                duration: '2時間',
                result: '成功',
                rewards: 'ポッポ×1、₽1,200、経験値+150',
                completedAt: '1時間前'
              },
              {
                trainer: 'カスミ', 
                location: '22番道路',
                duration: '1時間',
                result: '成功',
                rewards: 'コラッタ×1、₽800、経験値+100',
                completedAt: '3時間前'
              },
              {
                trainer: 'マチス',
                location: 'トキワの森',
                duration: '2時間',
                result: '部分成功',
                rewards: '₽600、経験値+80',
                completedAt: '5時間前'
              }
            ].map((history: any, index: number) => (
              <div key={index} className="border-b border-retro-gb-mid last:border-b-0 pb-3 last:pb-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-pixel text-xs text-retro-gb-dark">
                    {history.trainer} → {history.location}
                  </div>
                  <div className="font-pixel text-xs text-retro-gb-mid">
                    {history.completedAt}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-pixel text-xs text-retro-gb-mid">所要時間</span>
                    <span className="font-pixel text-xs text-retro-gb-dark">{history.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-pixel text-xs text-retro-gb-mid">結果</span>
                    <span className={`font-pixel text-xs ${
                      history.result === '成功' ? 'text-green-600' : 
                      history.result === '部分成功' ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {history.result}
                    </span>
                  </div>
                  <div className="font-pixel text-xs text-retro-gb-dark">
                    {history.rewards}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PixelCard>
      )}

      {/* トレーナー選択モーダル */}
      <TrainerSelectionModal
        isOpen={isTrainerModalOpen}
        onClose={() => {
          setIsTrainerModalOpen(false)
          setSelectedLocationId(null)
        }}
        onConfirm={handleConfirmExpedition}
        trainers={availableTrainers}
        locationName={selectedLocation?.location_name_ja || selectedLocation?.nameJa || ''}
        disabled={isLoading}
      />
    </div>
  )
}