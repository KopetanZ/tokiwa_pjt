'use client'

import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { PixelProgressBar } from '@/components/ui/PixelProgressBar'
import { ExpeditionCard } from '@/components/expeditions/ExpeditionCard'
import { LocationCard } from '@/components/expeditions/LocationCard'
import { TrainerSelectionModal } from '@/components/expeditions/TrainerSelectionModal'
import { useAuth, useNotifications } from '@/contexts/GameContext'
import { useExpeditions, useTrainers, useEconomy } from '@/lib/game-state'
import { gameController, EXPEDITION_LOCATIONS } from '@/lib/game-logic'
import { useState, useEffect } from 'react'

export default function ExpeditionsPageNew() {
  const [selectedTab, setSelectedTab] = useState<'active' | 'locations' | 'history'>('active')
  const [isLoading, setIsLoading] = useState(false)
  const [isTrainerModalOpen, setIsTrainerModalOpen] = useState(false)
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null)
  
  // JSONシステムのフック
  const { user } = useAuth()
  const { expeditions, active, completed, failed, successRate, actions: expeditionActions } = useExpeditions(user?.id)
  const { trainers, available, actions: trainerActions } = useTrainers(user?.id)
  const { money, actions: economyActions } = useEconomy(user?.id)
  const { addNotification } = useNotifications()
  
  // ゲームロジックから派遣先データを取得
  const getGameLocations = (trainerLevel: number = 5) => {
    return gameController.getAvailableExpeditions(trainerLevel).map((location, index) => ({
      id: index + 1, // number型で順番通りのIDを割り当て
      nameJa: location.nameJa,
      distanceLevel: location.distanceLevel,
      travelCost: Math.floor(location.baseRewardMoney * 0.3),
      travelTimeHours: Math.max(1, location.distanceLevel),
      riskLevel: location.dangerLevel / 5,
      baseRewardMoney: location.baseRewardMoney,
      encounterTypes: location.encounterTypes,
      isUnlocked: true,
      description: location.description,
      backgroundImage: `/images/locations/${location.id}.png`
    }))
  }

  const locations = getGameLocations()
  
  // 統計計算
  const stats = {
    active: active.length,
    interventionRequired: active.filter(exp => 
      exp.events.some(event => !event.resolved && event.choices)
    ).length,
    todayEarnings: completed
      .filter(exp => {
        const today = new Date().toDateString()
        return exp.actualEndTime && new Date(exp.actualEndTime).toDateString() === today
      })
      .reduce((sum, exp) => sum + (exp.result?.moneyEarned || 0), 0),
    availableLocations: locations.filter(loc => loc.isUnlocked).length
  }
  
  // 派遣開始処理（JSONシステム）
  const handleStartExpedition = (locationId: number | string) => {
    console.log('🚀 JSON派遣処理開始:', { locationId, availableTrainersCount: available.length })
    
    setSelectedLocationId(typeof locationId === 'string' ? parseInt(locationId) : locationId)
    setIsTrainerModalOpen(true)
  }

  const handleConfirmExpedition = async (trainerId: string) => {
    if (!selectedLocationId) return
    
    setIsLoading(true)
    setIsTrainerModalOpen(false)
    
    try {
      // 選択されたトレーナーを取得
      const selectedTrainer = available.find(t => t.id === trainerId)
      if (!selectedTrainer) {
        addNotification({
          type: 'error',
          message: 'トレーナーが見つかりません'
        })
        return
      }
      
      console.log('📋 選択されたトレーナー:', selectedTrainer)
      
      // 派遣費用チェック
      const location = locations.find(loc => loc.id === selectedLocationId)
      if (location && !economyActions.canAfford(location.travelCost)) {
        addNotification({
          type: 'error',
          message: `旅費が不足しています。必要: ₽${location.travelCost.toLocaleString()}`
        })
        return
      }
      
      // 派遣開始（JSONシステム）
      const expeditionId = expeditionActions.start({
        trainerId: selectedTrainer.id,
        locationId: selectedLocationId,
        mode: 'balanced',
        targetDuration: 2,
        strategy: [],
        status: 'active',
        startTime: new Date().toISOString(),
        estimatedEndTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        currentProgress: 0,
        events: [],
        interventions: []
      })
      
      // 旅費支払い
      if (location) {
        economyActions.updateMoney(-location.travelCost)
        economyActions.addTransaction({
          type: 'expense',
          category: 'expedition_reward',
          amount: location.travelCost,
          description: `派遣旅費: ${location.nameJa}`,
          relatedId: expeditionId,
          timestamp: new Date().toISOString()
        })
      }
      
      addNotification({
        type: 'success',
        message: `${selectedTrainer.name}の派遣を開始しました！`
      })
      
      // 数秒後に派遣完了をシミュレート（テスト用）
      setTimeout(() => {
        simulateExpeditionCompletion(expeditionId, selectedLocationId)
      }, 5000)
      
      console.log('✅ JSON派遣開始完了:', expeditionId)
      
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
  
  // 派遣完了シミュレーション（テスト用）
  const simulateExpeditionCompletion = (expeditionId: string, locationId: number) => {
    try {
      const location = locations.find(loc => loc.id === locationId)
      if (!location) return
      
      const success = Math.random() > 0.3 // 70%成功率
      const moneyEarned = success ? Math.floor(location.baseRewardMoney * (0.8 + Math.random() * 0.4)) : 0
      
      // 派遣完了
      expeditionActions.complete(expeditionId, {
        success,
        pokemonCaught: [], // 今回は省略
        itemsFound: [],
        moneyEarned,
        experienceGained: success ? 100 : 50,
        trainerExpGained: success ? 50 : 25,
        summary: success ? `${location.nameJa}での派遣に成功しました！` : `${location.nameJa}での派遣は部分的な成功でした。`
      })
      
      addNotification({
        type: success ? 'success' : 'warning',
        message: success 
          ? `派遣完了！₽${moneyEarned.toLocaleString()}を獲得しました！`
          : `派遣完了。結果は部分的な成功でした。`
      })
      
      console.log('✅ 派遣完了シミュレーション:', { expeditionId, success, moneyEarned })
      
    } catch (error) {
      console.error('派遣完了エラー:', error)
    }
  }
  
  const handleIntervention = (expeditionId: string) => {
    addNotification({
      type: 'info',
      message: `派遣#${expeditionId}に介入しました`
    })
    console.log('介入処理:', { expeditionId })
  }

  const handleShowDetails = (locationId: number) => {
    const location = locations.find(loc => loc.id === locationId)
    if (location) {
      addNotification({
        type: 'info',
        message: `${location.nameJa}の詳細情報を表示`
      })
      console.log('詳細表示:', { locationId, location })
    }
  }

  const handleExpeditionDetails = (expeditionId: string) => {
    const expedition = expeditions.find(exp => exp.id === expeditionId)
    if (expedition) {
      addNotification({
        type: 'info',
        message: `派遣詳細を表示`
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
    locations.find(loc => loc.id === selectedLocationId) : null

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-pixel-large text-retro-gb-dark">
            派遣管理
          </h1>
          <div className="font-pixel text-xs text-retro-gb-mid">
            💾 JSONローカル管理 | 所持金: ₽{money.toLocaleString()}
          </div>
        </div>
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
          {active.length > 0 ? (
            active.map((expedition) => {
              const trainer = trainers.find(t => t.id === expedition.trainerId)
              const location = locations.find(l => l.id === expedition.locationId)
              
              // JSON形式を表示用形式に変換
              const displayExpedition = {
                id: expedition.id,
                trainer: {
                  id: expedition.trainerId,
                  name: trainer?.name || '不明',
                  job: trainer?.job || 'unknown'
                },
                location: {
                  id: expedition.locationId,
                  nameJa: location?.nameJa || '不明',
                  distanceLevel: location?.distanceLevel || 1,
                  estimatedReturn: expedition.estimatedEndTime,
                  backgroundImage: location?.backgroundImage
                },
                status: expedition.status,
                currentProgress: expedition.currentProgress,
                expeditionMode: expedition.mode,
                hasInterventionRequired: expedition.events.some(e => !e.resolved && e.choices),
                estimatedReward: location?.baseRewardMoney || 0,
                startedAt: expedition.startTime
              }
              
              return (
                <ExpeditionCard 
                  key={expedition.id}
                  expedition={displayExpedition}
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
              )
            })
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
          {available.length === 0 && (
            <PixelCard>
              <div className="text-center py-4">
                <div className="font-pixel text-xs text-retro-gb-mid mb-2">
                  派遣を開始するには利用可能なトレーナーが必要です
                </div>
                <PixelButton size="sm" variant="secondary" onClick={() => window.location.href = '/dashboard/trainers'}>
                  トレーナーを雇用する
                </PixelButton>
              </div>
            </PixelCard>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {locations.map((location) => (
              <LocationCard
                key={location.id}
                location={{
                  id: location.id,
                  nameJa: location.nameJa,
                  distanceLevel: location.distanceLevel,
                  travelCost: location.travelCost,
                  travelTimeHours: location.travelTimeHours,
                  riskLevel: location.riskLevel,
                  baseRewardMoney: location.baseRewardMoney,
                  encounterTypes: location.encounterTypes,
                  isUnlocked: location.isUnlocked,
                  description: location.description,
                  backgroundImage: location.backgroundImage
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
            {[...completed, ...failed]
              .sort((a, b) => new Date(b.actualEndTime || b.startTime).getTime() - new Date(a.actualEndTime || a.startTime).getTime())
              .slice(0, 10)
              .map((expedition, index) => {
                const trainer = trainers.find(t => t.id === expedition.trainerId)
                const location = locations.find(l => l.id === expedition.locationId)
                
                return (
                  <div key={index} className="border-b border-retro-gb-mid last:border-b-0 pb-3 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-pixel text-xs text-retro-gb-dark">
                        {trainer?.name || '不明'} → {location?.nameJa || '不明'}
                      </div>
                      <div className="font-pixel text-xs text-retro-gb-mid">
                        {expedition.actualEndTime 
                          ? new Date(expedition.actualEndTime).toLocaleString('ja-JP')
                          : '進行中'
                        }
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="font-pixel text-xs text-retro-gb-mid">所要時間</span>
                        <span className="font-pixel text-xs text-retro-gb-dark">{expedition.targetDuration}時間</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-pixel text-xs text-retro-gb-mid">結果</span>
                        <span className={`font-pixel text-xs ${
                          expedition.result?.success ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {expedition.result?.success ? '成功' : '部分成功'}
                        </span>
                      </div>
                      <div className="font-pixel text-xs text-retro-gb-dark">
                        ₽{expedition.result?.moneyEarned?.toLocaleString() || '0'}、経験値+{expedition.result?.experienceGained || 0}
                      </div>
                    </div>
                  </div>
                )
              })}
            {completed.length === 0 && failed.length === 0 && (
              <div className="text-center py-4">
                <div className="font-pixel text-xs text-retro-gb-mid">
                  まだ派遣履歴がありません
                </div>
              </div>
            )}
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
        trainers={available.map(trainer => ({
          id: trainer.id,
          name: trainer.name,
          job: trainer.job,
          level: trainer.level,
          status: trainer.status
        }))}
        locationName={selectedLocation?.nameJa || ''}
        disabled={isLoading}
      />
    </div>
  )
}