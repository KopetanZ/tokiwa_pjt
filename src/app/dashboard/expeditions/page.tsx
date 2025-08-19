'use client'

import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { PixelProgressBar } from '@/components/ui/PixelProgressBar'
import { ExpeditionCard } from '@/components/expeditions/ExpeditionCard'
import { LocationCard } from '@/components/expeditions/LocationCard'
import { useGameData, useAuth, useNotifications } from '@/contexts/GameContext'
import { useState } from 'react'

// サンプルデータ
const sampleActiveExpeditions = [
  {
    id: '1',
    trainer: { id: '2', name: 'カスミ', job: 'バトラー' },
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
    id: '2',
    trainer: { id: '1', name: 'タケシ', job: 'レンジャー' },
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

const sampleLocations = [
  {
    id: 1,
    nameJa: 'トキワの森',
    distanceLevel: 1,
    travelCost: 500,
    travelTimeHours: 2,
    riskLevel: 1.0,
    baseRewardMoney: 1000,
    encounterTypes: ['bug', 'normal', 'flying'],
    isUnlocked: true,
    description: '初心者向けの安全な森。虫タイプのポケモンが多く生息。',
    backgroundImage: '/images/locations/viridian_forest.png'
  },
  {
    id: 2,
    nameJa: '22番道路',
    distanceLevel: 1,
    travelCost: 300,
    travelTimeHours: 1,
    riskLevel: 0.8,
    baseRewardMoney: 800,
    encounterTypes: ['normal', 'flying'],
    isUnlocked: true,
    description: '短時間で探索できる道路。ノーマル・ひこうタイプが中心。',
    backgroundImage: '/images/locations/route_22.png'
  },
  {
    id: 3,
    nameJa: 'ニビジム',
    distanceLevel: 2,
    travelCost: 1200,
    travelTimeHours: 4,
    riskLevel: 1.3,
    baseRewardMoney: 2500,
    encounterTypes: ['rock', 'ground'],
    isUnlocked: false,
    description: 'いわタイプの訓練に最適。高い報酬が期待できるが難易度も高い。',
    backgroundImage: '/images/locations/pewter_gym.png'
  }
]

export default function ExpeditionsPage() {
  const [selectedTab, setSelectedTab] = useState<'active' | 'locations' | 'history'>('active')
  
  const { isMockMode } = useAuth()
  const gameData = useGameData()
  const { addNotification } = useNotifications()
  
  // 実際のゲームデータまたはサンプルデータを使用
  const expeditions = isMockMode ? gameData.expeditions : sampleActiveExpeditions
  
  // 統計計算
  const stats = {
    active: expeditions.length,
    interventionRequired: expeditions.filter(exp => exp.hasInterventionRequired || 
      (exp.status === 'active' && Math.random() > 0.7)).length,
    todayEarnings: expeditions.reduce((sum, exp) => sum + (exp.estimatedReward || 0), 0),
    availableLocations: 2 // 解放済みエリア数
  }
  
  const handleStartExpedition = (locationId: number) => {
    addNotification({
      type: 'success',
      message: `新しい派遣を開始しました！`
    })
    
    // TODO: 実際の派遣開始処理を実装
    console.log('派遣開始:', { locationId })
  }
  
  const handleIntervention = (expeditionId: string) => {
    addNotification({
      type: 'info',
      message: `派遣#${expeditionId}に介入しました`
    })
    
    // TODO: 実際の介入処理を実装
    console.log('介入処理:', { expeditionId })
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="font-pixel-large text-retro-gb-dark">
          派遣管理
        </h1>
        <PixelButton>
          新しい派遣を開始
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
            expeditions.map(expedition => (
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
              />
            ))
          ) : (
            <PixelCard>
              <div className="text-center py-8">
                <div className="font-pixel text-retro-gb-mid mb-4">
                  現在進行中の派遣はありません
                </div>
                <PixelButton>
                  新しい派遣を開始する
                </PixelButton>
              </div>
            </PixelCard>
          )}
        </div>
      )}

      {/* 派遣先一覧 */}
      {selectedTab === 'locations' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sampleLocations.map(location => (
            <LocationCard
              key={location.id}
              location={location}
              onStartExpedition={handleStartExpedition}
            />
          ))}
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
            ].map((history, index) => (
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
    </div>
  )
}