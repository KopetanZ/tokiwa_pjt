'use client'

import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { PixelProgressBar } from '@/components/ui/PixelProgressBar'
import { ExpeditionCard } from '@/components/expeditions/ExpeditionCard'
import { LocationCard } from '@/components/expeditions/LocationCard'
import { TrainerSelectionModal } from '@/components/expeditions/TrainerSelectionModal'
import { useGameState, useExpeditions, useTrainers } from '@/lib/game-state/hooks'
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
  return gameController.getAvailableExpeditions(trainerLevel).map((location, index) => ({
    id: index + 1, // number型のIDを割り当て
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
  const [isLoading, setIsLoading] = useState(false)
  const [isTrainerModalOpen, setIsTrainerModalOpen] = useState(false)
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null)
  
  const { gameData, actions } = useGameState()
  const { expeditions, actions: expeditionActions } = useExpeditions()
  const { trainers, actions: trainerActions } = useTrainers()
  
  const getAvailableTrainers = () => trainers.filter(t => t.status === 'available')
  
  // ゲームデータから情報を取得
  const locations = sampleLocations // 固定のロケーションデータを使用
  const availableTrainers = getAvailableTrainers()
  
  // 統計計算
  const stats = {
    active: expeditions.filter(exp => exp.status === 'active').length,
    interventionRequired: expeditions.filter(exp => 
      exp.status === 'active' && exp.events.some(event => !event.resolved && event.choices)
    ).length,
    todayEarnings: expeditions
      .filter(exp => {
        const today = new Date().toDateString()
        return exp.actualEndTime && new Date(exp.actualEndTime).toDateString() === today
      })
      .reduce((sum, exp) => sum + (exp.result?.moneyEarned || 0), 0),
    availableLocations: locations.filter(loc => loc.isUnlocked).length
  }
  
  const handleStartExpedition = (locationId: number | string) => {
    console.log('🚀 派遣処理開始:', { locationId, availableTrainersCount: availableTrainers.length })
    
    setSelectedLocationId(typeof locationId === 'string' ? parseInt(locationId) : locationId)
    setIsTrainerModalOpen(true)
  }

  const handleConfirmExpedition = async (trainerId: string) => {
    if (!selectedLocationId) return
    
    setIsLoading(true)
    setIsTrainerModalOpen(false)
    
    try {
      // 選択されたトレーナーを取得
      const selectedTrainer = availableTrainers.find(t => t.id === trainerId)
      if (!selectedTrainer) {
        console.error('トレーナーが見つかりません')
        return
      }
      
      console.log('📋 選択されたトレーナー:', selectedTrainer)
      
      // JSON システムを使用して派遣を開始
      const now = new Date().toISOString()
      const endTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      
      const expeditionId = expeditionActions.start({
        trainerId,
        locationId: selectedLocationId,
        mode: 'balanced',
        targetDuration: 2,
        strategy: [],
        status: 'active',
        startTime: now,
        estimatedEndTime: endTime,
        currentProgress: 0,
        events: [],
        interventions: []
      })
      
      console.log('🚀 派遣開始:', expeditionId)
      
    } catch (error) {
      console.error('派遣開始エラー:', error)
    } finally {
      setIsLoading(false)
      setSelectedLocationId(null)
    }
  }
  
  const handleIntervention = (expeditionId: string) => {
    console.log('介入処理:', { expeditionId })
    // TODO: 実際の介入処理を実装
  }

  const handleShowDetails = (locationId: number) => {
    const location = locations.find(loc => loc.id === locationId)
    if (location) {
      console.log('詳細表示:', { locationId, location })
    }
  }

  const handleExpeditionDetails = (expeditionId: string) => {
    const expedition = expeditions.find(exp => exp.id === expeditionId)
    if (expedition) {
      console.log('派遣詳細表示:', { expeditionId, expedition })
    }
  }

  const handleAutoDecision = (expeditionId: string) => {
    console.log('自動判断設定:', { expeditionId })
    // TODO: 自動判断モードの実装
  }

  const selectedLocation = selectedLocationId ? 
    locations.find(loc => loc.id === selectedLocationId) : null

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
          {expeditions.filter(exp => exp.status === 'active').length > 0 ? (
            expeditions.filter(exp => exp.status === 'active').map(expedition => (
              <ExpeditionCard 
                key={expedition.id}
                expedition={{
                  id: expedition.id,
                  trainer: { 
                    id: expedition.trainerId, 
                    name: trainers.find(t => t.id === expedition.trainerId)?.name || '不明',
                    job: trainers.find(t => t.id === expedition.trainerId)?.job || 'トレーナー'
                  },
                  location: {
                    id: expedition.locationId,
                    nameJa: locations.find(l => l.id === expedition.locationId)?.nameJa || '不明',
                    distanceLevel: expedition.targetDuration,
                    estimatedReturn: expedition.estimatedEndTime,
                    backgroundImage: locations.find(l => l.id === expedition.locationId)?.backgroundImage
                  },
                  status: expedition.status,
                  currentProgress: expedition.currentProgress,
                  expeditionMode: expedition.mode,
                  hasInterventionRequired: expedition.events.some(event => !event.resolved && event.choices),
                  estimatedReward: 1000, // デフォルト値
                  startedAt: expedition.startTime
                }}
                onIntervene={handleIntervention}
                onRecall={(id) => {
                  console.log('呼び戻し処理:', { id })
                  // TODO: 呼び戻し処理の実装
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
          {availableTrainers.length === 0 && (
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
            {locations.map(location => (
              <LocationCard
                key={location.id}
                location={location}
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
        locationName={selectedLocation?.nameJa || ''}
        disabled={isLoading}
      />
    </div>
  )
}