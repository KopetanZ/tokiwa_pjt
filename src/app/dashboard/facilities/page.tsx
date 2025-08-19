'use client'

import { useState, useEffect } from 'react'
import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { PixelProgressBar } from '@/components/ui/PixelProgressBar'
import { PixelInput } from '@/components/ui/PixelInput'
import { facilitySystem, Facility, FacilityUpgrade, ResearchProject } from '@/lib/facilities'
import { formatMoney } from '@/lib/utils'
import { useGameData, useAuth, useNotifications } from '@/contexts/GameContext'
import { clsx } from 'clsx'

export default function FacilitiesPage() {
  const [selectedTab, setSelectedTab] = useState<'facilities' | 'upgrades' | 'research' | 'overview'>('overview')
  
  const { isMockMode } = useAuth()
  const gameData = useGameData()
  const { addNotification } = useNotifications()
  
  // 実際のゲームデータまたはサンプルデータを使用
  const facilities = isMockMode ? gameData.facilities.map(f => ({
    ...f,
    nameJa: f.name,
    currentUsage: Math.floor(f.capacity * 0.6), // 使用率60%として表示
    effects: {
      trainerEfficiency: f.efficiency,
      pokemonRecovery: 1.0,
      researchSpeed: 1.0,
      storageCapacity: 1.0
    },
    upgradeRequirements: {
      cost: (f.level + 1) * 10000,
      time: (f.level + 1) * 60,
      materials: ['建設資材', '改良パーツ'],
      prerequisite: []
    },
    maxLevel: 10,
    description: `${f.name}の詳細説明がここに表示されます。`
  })) : facilitySystem.getFacilities()
  
  const upgrades: FacilityUpgrade[] = []
  const researchProjects: ResearchProject[] = []
  const totalMaintenanceCost = facilities.reduce((sum, f) => sum + (f.maintenance_cost || 0), 0)

  const handleUpgrade = (facilityId: string) => {
    addNotification({
      type: 'success',
      message: '施設のアップグレードを開始しました！'
    })
    console.log('アップグレード開始:', { facilityId })
  }

  const handleStartResearch = (projectId: string) => {
    addNotification({
      type: 'info', 
      message: '研究プロジェクトを開始しました！'
    })
    console.log('研究開始:', { projectId })
  }

  const getFacilityTypeIcon = (type: string) => {
    const icons = {
      training: '🏋️',
      research: '🔬',
      medical: '🏥',
      storage: '📦',
      utility: '🏠',
      expansion: '🏗️'
    }
    return icons[type as keyof typeof icons] || '🏢'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600'
      case 'upgrading': return 'text-orange-600'
      case 'maintenance': return 'text-yellow-600'
      case 'inactive': return 'text-gray-600'
      default: return 'text-retro-gb-dark'
    }
  }

  const getResearchStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600'
      case 'researching': return 'text-blue-600'
      case 'completed': return 'text-purple-600'
      case 'locked': return 'text-gray-600'
      default: return 'text-retro-gb-dark'
    }
  }

  // 統計計算
  const activeFacilities = facilities.filter(f => f.status === 'active').length
  const totalCapacity = facilities.reduce((sum, f) => sum + f.capacity, 0)
  const totalUsage = facilities.reduce((sum, f) => sum + f.currentUsage, 0)
  const averageEfficiency = facilities.length > 0 
    ? (facilities.reduce((sum, f) => sum + f.efficiency, 0) / facilities.length)
    : 1.0

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="font-pixel-large text-retro-gb-dark">
          施設管理
        </h1>
        <div className="flex space-x-2">
          <PixelButton size="sm" variant="secondary">
            施設レポート
          </PixelButton>
          <PixelButton>
            新規建設
          </PixelButton>
        </div>
      </div>

      {/* 統計概要 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <PixelCard title="稼働施設">
          <div className="text-center">
            <div className="font-pixel-large text-green-600">{activeFacilities}</div>
            <div className="font-pixel text-xs text-retro-gb-mid">/ {facilities.length} 施設</div>
          </div>
        </PixelCard>

        <PixelCard title="設備使用率">
          <div className="text-center">
            <div className="font-pixel-large text-retro-gb-dark">
              {totalCapacity > 0 ? Math.round((totalUsage / totalCapacity) * 100) : 0}%
            </div>
            <div className="font-pixel text-xs text-retro-gb-mid">
              {totalUsage} / {totalCapacity}
            </div>
          </div>
        </PixelCard>

        <PixelCard title="平均効率">
          <div className="text-center">
            <div className="font-pixel-large text-blue-600">
              {averageEfficiency.toFixed(1)}x
            </div>
            <div className="font-pixel text-xs text-retro-gb-mid">効率倍率</div>
          </div>
        </PixelCard>

        <PixelCard title="月次維持費">
          <div className="text-center">
            <div className="font-pixel-large text-red-600">
              {formatMoney(totalMaintenanceCost)}
            </div>
            <div className="font-pixel text-xs text-retro-gb-mid">毎月支払い</div>
          </div>
        </PixelCard>
      </div>

      {/* タブナビゲーション */}
      <PixelCard>
        <div className="flex space-x-2">
          {[
            { key: 'overview', label: '概要' },
            { key: 'facilities', label: '施設一覧' },
            { key: 'upgrades', label: 'アップグレード' },
            { key: 'research', label: '研究開発' }
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
          {/* アクティブアップグレード */}
          {upgrades.length > 0 && (
            <PixelCard title="進行中のアップグレード">
              <div className="space-y-3">
                {upgrades.map(upgrade => {
                  const facility = facilities.find(f => f.id === upgrade.facilityId)
                  const progress = Math.min(100, 
                    ((Date.now() - upgrade.startTime.getTime()) / 
                     (upgrade.endTime.getTime() - upgrade.startTime.getTime())) * 100
                  )
                  const timeRemaining = Math.max(0, upgrade.endTime.getTime() - Date.now())
                  const hoursRemaining = Math.floor(timeRemaining / (60 * 60 * 1000))
                  const minutesRemaining = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000))

                  return (
                    <div key={upgrade.facilityId} className="border border-retro-gb-mid p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-pixel text-sm text-retro-gb-dark">
                            {facility?.nameJa} Lv.{facility?.level} → {upgrade.targetLevel}
                          </div>
                          <div className="font-pixel text-xs text-retro-gb-mid">
                            残り時間: {hoursRemaining}時間{minutesRemaining}分
                          </div>
                        </div>
                        <div className="font-pixel text-xs text-retro-gb-dark">
                          {progress.toFixed(1)}%
                        </div>
                      </div>
                      <PixelProgressBar
                        value={progress}
                        max={100}
                        color="exp"
                        showLabel={false}
                      />
                    </div>
                  )
                })}
              </div>
            </PixelCard>
          )}

          {/* 進行中の研究 */}
          {researchProjects.filter(p => p.status === 'researching').length > 0 && (
            <PixelCard title="進行中の研究">
              <div className="space-y-3">
                {researchProjects
                  .filter(p => p.status === 'researching')
                  .map(project => (
                    <div key={project.id} className="border border-retro-gb-mid p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-pixel text-sm text-retro-gb-dark">
                            {project.nameJa}
                          </div>
                          <div className="font-pixel text-xs text-retro-gb-mid">
                            {project.effects.description}
                          </div>
                        </div>
                        <div className="font-pixel text-xs text-retro-gb-dark">
                          {((project.researchPoints / project.maxResearchPoints) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <PixelProgressBar
                        value={project.researchPoints}
                        max={project.maxResearchPoints}
                        color="progress"
                        showLabel={false}
                      />
                    </div>
                  ))}
              </div>
            </PixelCard>
          )}

          {/* 施設効率ランキング */}
          <PixelCard title="施設効率ランキング">
            <div className="space-y-2">
              {facilities
                .filter(f => f.status === 'active')
                .sort((a, b) => b.efficiency - a.efficiency)
                .slice(0, 5)
                .map((facility, index) => (
                  <div key={facility.id} className="flex justify-between items-center py-2 border-b border-retro-gb-mid last:border-b-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-pixel text-sm text-retro-gb-mid">#{index + 1}</span>
                      <span className="text-lg">{getFacilityTypeIcon(facility.type)}</span>
                      <span className="font-pixel text-sm text-retro-gb-dark">{facility.nameJa}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-pixel text-sm text-blue-600">{facility.efficiency.toFixed(1)}x</div>
                      <div className="font-pixel text-xs text-retro-gb-mid">Lv.{facility.level}</div>
                    </div>
                  </div>
                ))}
            </div>
          </PixelCard>
        </div>
      )}

      {/* 施設一覧タブ */}
      {selectedTab === 'facilities' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {facilities.map(facility => (
            <PixelCard key={facility.id}>
              <div className="space-y-4">
                {/* ヘッダー */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getFacilityTypeIcon(facility.type)}</span>
                    <div>
                      <h3 className="font-pixel text-lg text-retro-gb-dark">
                        {facility.nameJa}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="font-pixel text-sm text-retro-gb-mid">
                          Lv.{facility.level}/{facility.maxLevel}
                        </span>
                        <span className={`font-pixel text-xs ${getStatusColor(facility.status)}`}>
                          {facility.status === 'active' ? '稼働中' :
                           facility.status === 'upgrading' ? 'アップグレード中' :
                           facility.status === 'maintenance' ? 'メンテナンス中' : '停止中'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-pixel text-sm text-blue-600">
                      {facility.efficiency.toFixed(1)}x
                    </div>
                    <div className="font-pixel text-xs text-retro-gb-mid">効率</div>
                  </div>
                </div>

                {/* 使用率 */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-pixel text-xs text-retro-gb-mid">使用率</span>
                    <span className="font-pixel text-xs text-retro-gb-dark">
                      {facility.currentUsage}/{facility.capacity}
                    </span>
                  </div>
                  <PixelProgressBar
                    value={facility.currentUsage}
                    max={facility.capacity}
                    color={facility.currentUsage / facility.capacity > 0.8 ? 'hp' : 'progress'}
                    showLabel={false}
                  />
                </div>

                {/* 説明 */}
                <p className="font-pixel text-xs text-retro-gb-mid leading-relaxed">
                  {facility.description}
                </p>

                {/* 効果 */}
                <div>
                  <div className="font-pixel text-xs text-retro-gb-mid mb-1">効果:</div>
                  <div className="space-y-1">
                    {facility.effects.trainerEfficiency && (
                      <div className="font-pixel text-xs text-green-600">
                        トレーナー効率 +{((facility.effects.trainerEfficiency - 1) * 100).toFixed(0)}%
                      </div>
                    )}
                    {facility.effects.pokemonRecovery && (
                      <div className="font-pixel text-xs text-blue-600">
                        ポケモン回復 +{((facility.effects.pokemonRecovery - 1) * 100).toFixed(0)}%
                      </div>
                    )}
                    {facility.effects.researchSpeed && (
                      <div className="font-pixel text-xs text-purple-600">
                        研究速度 +{((facility.effects.researchSpeed - 1) * 100).toFixed(0)}%
                      </div>
                    )}
                    {facility.effects.storageCapacity && (
                      <div className="font-pixel text-xs text-orange-600">
                        保管容量 +{((facility.effects.storageCapacity - 1) * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                </div>

                {/* 維持費 */}
                <div className="flex justify-between items-center pt-2 border-t border-retro-gb-mid">
                  <span className="font-pixel text-xs text-retro-gb-mid">
                    月次維持費: {formatMoney(facility.maintenanceCost)}
                  </span>
                  <div className="flex space-x-2">
                    {facility.status === 'active' && facility.level < facility.maxLevel && (
                      <PixelButton
                        size="sm"
                        onClick={() => handleUpgrade(facility.id)}
                      >
                        アップグレード
                        <br />
                        {formatMoney(facility.upgradeRequirements.cost)}
                      </PixelButton>
                    )}
                    {facility.status === 'inactive' && (
                      <PixelButton size="sm" variant="secondary">
                        建設開始
                      </PixelButton>
                    )}
                  </div>
                </div>
              </div>
            </PixelCard>
          ))}
        </div>
      )}

      {/* アップグレードタブ */}
      {selectedTab === 'upgrades' && (
        <div className="space-y-4">
          <PixelCard title="アップグレード計画">
            <div className="space-y-4">
              {facilities
                .filter(f => f.level < f.maxLevel && f.status !== 'upgrading')
                .map(facility => (
                  <div key={facility.id} className="border border-retro-gb-mid p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">{getFacilityTypeIcon(facility.type)}</span>
                          <div>
                            <div className="font-pixel text-sm text-retro-gb-dark">
                              {facility.nameJa}
                            </div>
                            <div className="font-pixel text-xs text-retro-gb-mid">
                              Lv.{facility.level} → {facility.level + 1}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="font-pixel text-xs text-retro-gb-mid">
                            費用: {formatMoney(facility.upgradeRequirements.cost)}
                          </div>
                          <div className="font-pixel text-xs text-retro-gb-mid">
                            工期: {Math.floor(facility.upgradeRequirements.time / 60)}時間
                          </div>
                          {facility.upgradeRequirements.materials && (
                            <div className="font-pixel text-xs text-retro-gb-mid">
                              材料: {facility.upgradeRequirements.materials.join(', ')}
                            </div>
                          )}
                          {facility.upgradeRequirements.prerequisite && (
                            <div className="font-pixel text-xs text-orange-600">
                              前提: {facility.upgradeRequirements.prerequisite.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <PixelButton
                        onClick={() => handleUpgrade(facility.id)}
                        disabled={facility.status !== 'active'}
                      >
                        開始
                      </PixelButton>
                    </div>
                  </div>
                ))}
            </div>
          </PixelCard>
        </div>
      )}

      {/* 研究開発タブ */}
      {selectedTab === 'research' && (
        <div className="space-y-4">
          <PixelCard title="研究プロジェクト">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {researchProjects.map(project => (
                <div key={project.id} className="border border-retro-gb-mid p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-pixel text-sm text-retro-gb-dark">
                          {project.nameJa}
                        </h3>
                        <span className={`font-pixel text-xs ${getResearchStatusColor(project.status)}`}>
                          {project.status === 'available' ? '研究可能' :
                           project.status === 'researching' ? '研究中' :
                           project.status === 'completed' ? '完了' : 'ロック中'}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-pixel text-xs text-retro-gb-mid">
                          {project.category}
                        </div>
                      </div>
                    </div>

                    <p className="font-pixel text-xs text-retro-gb-mid leading-relaxed">
                      {project.effects.description}
                    </p>

                    {project.status === 'researching' && (
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="font-pixel text-xs text-retro-gb-mid">進捗</span>
                          <span className="font-pixel text-xs text-retro-gb-dark">
                            {project.researchPoints}/{project.maxResearchPoints}
                          </span>
                        </div>
                        <PixelProgressBar
                          value={project.researchPoints}
                          max={project.maxResearchPoints}
                          color="progress"
                          showLabel={false}
                        />
                      </div>
                    )}

                    <div className="space-y-1 font-pixel text-xs text-retro-gb-mid">
                      <div>費用: {formatMoney(project.cost)}</div>
                      <div>期間: {project.duration}日</div>
                      <div>研究者: {project.researchers}名</div>
                    </div>

                    {project.prerequisites && project.prerequisites.length > 0 && (
                      <div className="font-pixel text-xs text-orange-600">
                        前提研究: {project.prerequisites.join(', ')}
                      </div>
                    )}

                    {project.status === 'available' && (
                      <PixelButton
                        size="sm"
                        onClick={() => handleStartResearch(project.id)}
                        className="w-full"
                      >
                        研究開始
                      </PixelButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </PixelCard>
        </div>
      )}
    </div>
  )
}