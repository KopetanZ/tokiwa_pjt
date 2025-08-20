'use client'

import { useState, useEffect } from 'react'
import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { PixelProgressBar } from '@/components/ui/PixelProgressBar'
import { PixelInput } from '@/components/ui/PixelInput'
import { facilitySystem, Facility as FacilityType, UpgradeProject } from '@/lib/game-logic/facility-system'
import { formatMoney } from '@/lib/utils'
import { useGameData, useAuth, useNotifications } from '@/contexts/GameContext'
import { clsx } from 'clsx'

export default function FacilitiesPage() {
  const [selectedTab, setSelectedTab] = useState<'facilities' | 'upgrades' | 'overview' | 'research'>('overview')
  const [loading, setLoading] = useState(true)
  
  const { isMockMode } = useAuth()
  const gameData = useGameData()
  const { addNotification } = useNotifications()

  // 新しい施設システムを使用
  const [facilities, setFacilities] = useState<FacilityType[]>([])
  const [upgradeProjects, setUpgradeProjects] = useState<UpgradeProject[]>([])
  const [researchProjects, setResearchProjects] = useState<any[]>([])
  const [facilityStatus, setFacilityStatus] = useState({
    total: 0,
    active: 0,
    upgrading: 0,
    averageLevel: 0,
    averageCondition: 0,
    monthlyMaintenanceCost: 0
  })

  useEffect(() => {
    loadFacilityData()
    const interval = setInterval(loadFacilityData, 5000) // 5秒毎に更新
    return () => clearInterval(interval)
  }, [])

  const loadFacilityData = async () => {
    try {
      const allFacilities = facilitySystem.getAllFacilities()
      const activeProjects = facilitySystem.getActiveProjects()
      const status = facilitySystem.getFacilityStatus()

      setFacilities(allFacilities)
      setUpgradeProjects(activeProjects)
      setFacilityStatus(status)
    } catch (error) {
      console.error('施設データの読み込みに失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (facilityId: string) => {
    try {
      const result = await facilitySystem.startUpgrade(facilityId)
      if (result.success) {
        addNotification({
          type: 'success',
          message: result.message
        })
        loadFacilityData() // データ更新
      } else {
        addNotification({
          type: 'error',
          message: result.message
        })
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'アップグレードに失敗しました'
      })
    }
  }

  const handleUnlockFacility = (facilityId: string) => {
    const success = facilitySystem.unlockFacility(facilityId)
    if (success) {
      addNotification({
        type: 'success',
        message: '新しい施設がロック解除されました！'
      })
      loadFacilityData()
    } else {
      addNotification({
        type: 'error',
        message: 'ロック解除の条件を満たしていません'
      })
    }
  }

  const handleStartResearch = async (projectId: string) => {
    try {
      // 研究開始の実装
      const researchCost = 5000 // 基本研究費
      
      const { gameController } = await import('@/lib/game-logic')
      const canAfford = gameController.checkCanAfford(researchCost)
      
      if (!canAfford) {
        addNotification({
          type: 'error',
          message: `資金が不足しています。必要: ₽${researchCost.toLocaleString()}`
        })
        return
      }
      
      const paymentResult = gameController.recordTransaction(
        'expense',
        'maintenance',
        researchCost,
        '施設研究費'
      )
      
      if (paymentResult) {
        addNotification({
          type: 'success',
          message: `研究を開始しました！（費用: ₽${researchCost.toLocaleString()}）`
        })
        // 実際の研究プロジェクト開始処理をここに追加
      } else {
        addNotification({
          type: 'error',
          message: '研究費の支払いに失敗しました'
        })
      }
    } catch (error) {
      console.error('研究開始エラー:', error)
      addNotification({
        type: 'error',
        message: '研究開始に失敗しました'
      })
    }
  }

  const handleCompleteUpgradeInstantly = async (projectId: string) => {
    const success = await facilitySystem.completeUpgradeInstantly(projectId)
    if (success) {
      addNotification({
        type: 'success',
        message: 'アップグレードが完了しました！'
      })
      loadFacilityData()
    }
  }

  const getFacilityTypeIcon = (category: string) => {
    const icons = {
      training: '🏋️',
      research: '🔬',
      medical: '🏥',
      storage: '📦',
      accommodation: '🏠',
      security: '🛡️',
      utility: '⚙️'
    }
    return icons[category as keyof typeof icons] || '🏢'
  }

  const getStatusText = (facility: FacilityType) => {
    if (!facility.isUnlocked) return { text: 'ロック中', color: 'text-gray-600' }
    if (!facility.isActive) return { text: '未建設', color: 'text-red-600' }
    if (facility.level === 0) return { text: '建設中', color: 'text-yellow-600' }
    return { text: '稼働中', color: 'text-green-600' }
  }

  const formatEffectValue = (value: number, type: string) => {
    const sign = value > 0 ? '+' : ''
    const suffix = type.includes('rate') || type.includes('bonus') ? '%' : ''
    return `${sign}${value}${suffix}`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <PixelCard title="稼働施設">
          <div className="text-center">
            <div className="font-pixel-large text-green-600">{facilityStatus.active}</div>
            <div className="font-pixel text-xs text-retro-gb-mid">/ {facilityStatus.total} 施設</div>
          </div>
        </PixelCard>

        <PixelCard title="アップグレード中">
          <div className="text-center">
            <div className="font-pixel-large text-orange-600">{facilityStatus.upgrading}</div>
            <div className="font-pixel text-xs text-retro-gb-mid">プロジェクト</div>
          </div>
        </PixelCard>

        <PixelCard title="平均レベル">
          <div className="text-center">
            <div className="font-pixel-large text-blue-600">
              {facilityStatus.averageLevel}
            </div>
            <div className="font-pixel text-xs text-retro-gb-mid">全施設平均</div>
          </div>
        </PixelCard>

        <PixelCard title="平均コンディション">
          <div className="text-center">
            <div className="font-pixel-large text-purple-600">
              {facilityStatus.averageCondition}%
            </div>
            <div className="font-pixel text-xs text-retro-gb-mid">メンテナンス状況</div>
          </div>
        </PixelCard>

        <PixelCard title="月次維持費">
          <div className="text-center">
            <div className="font-pixel-large text-red-600">
              ¥{facilityStatus.monthlyMaintenanceCost.toLocaleString()}
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
            { key: 'upgrades', label: 'アップグレード' }
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
          {upgradeProjects.length > 0 && (
            <PixelCard title="進行中のアップグレード">
              <div className="space-y-3">
                {upgradeProjects.map(project => {
                  const facility = facilities.find(f => f.id === project.facilityId)
                  const startTime = new Date(project.startTime).getTime()
                  const endTime = new Date(project.completionTime).getTime()
                  const now = Date.now()
                  const progress = Math.min(100, ((now - startTime) / (endTime - startTime)) * 100)
                  const timeRemaining = Math.max(0, endTime - now)
                  const hoursRemaining = Math.floor(timeRemaining / (60 * 60 * 1000))
                  const minutesRemaining = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000))

                  return (
                    <div key={project.id} className="border border-retro-gb-mid p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-pixel text-sm text-retro-gb-dark">
                            {facility?.name} Lv.{facility?.level} → {project.newLevel}
                          </div>
                          <div className="font-pixel text-xs text-retro-gb-mid">
                            残り時間: {hoursRemaining}時間{minutesRemaining}分
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="font-pixel text-xs text-retro-gb-dark">
                            {progress.toFixed(1)}%
                          </div>
                          <PixelButton
                            size="sm"
                            onClick={() => handleCompleteUpgradeInstantly(project.id)}
                          >
                            即座完了
                          </PixelButton>
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
                .filter(f => f.level > 0)
                .sort((a, b) => b.level - a.level)
                .slice(0, 5)
                .map((facility, index) => (
                  <div key={facility.id} className="flex justify-between items-center py-2 border-b border-retro-gb-mid last:border-b-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-pixel text-sm text-retro-gb-mid">#{index + 1}</span>
                      <span className="text-lg">{getFacilityTypeIcon(facility.category)}</span>
                      <span className="font-pixel text-sm text-retro-gb-dark">{facility.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-pixel text-sm text-blue-600">{facility.level}x</div>
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
                    <span className="text-2xl">{getFacilityTypeIcon(facility.category)}</span>
                    <div>
                      <h3 className="font-pixel text-lg text-retro-gb-dark">
                        {facility.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="font-pixel text-sm text-retro-gb-mid">
                          Lv.{facility.level}/10
                        </span>
                        <span className="font-pixel text-xs text-green-600">
                          {facility.level > 0 ? '稼働中' : '停止中'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-pixel text-sm text-blue-600">
                      {(facility.level * 0.2 + 1).toFixed(1)}x
                    </div>
                    <div className="font-pixel text-xs text-retro-gb-mid">効率</div>
                  </div>
                </div>

                {/* 使用率 */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-pixel text-xs text-retro-gb-mid">使用率</span>
                    <span className="font-pixel text-xs text-retro-gb-dark">
{Math.floor(facility.level * 20)}/{facility.level * 50}
                    </span>
                  </div>
                  <PixelProgressBar
                    value={Math.floor(facility.level * 20)}
                    max={facility.level * 50}
                    color={facility.level > 5 ? 'hp' : 'progress'}
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
                    <div className="font-pixel text-xs text-green-600">
                      効率 +{(facility.level * 10)}%
                    </div>
                  </div>
                </div>

                {/* 維持費 */}
                <div className="flex justify-between items-center pt-2 border-t border-retro-gb-mid">
                  <span className="font-pixel text-xs text-retro-gb-mid">
                    月次維持費: {formatMoney(facility.maintenanceCost)}
                  </span>
                  <div className="flex space-x-2">
                    {facility.level > 0 && facility.level < 10 && (
                      <PixelButton
                        size="sm"
                        onClick={() => handleUpgrade(facility.id)}
                      >
                        アップグレード
                        <br />
                        {formatMoney(facility.upgradeCost * Math.pow(1.5, facility.level))}
                      </PixelButton>
                    )}
                    {facility.level === 0 && (
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
                .filter(f => f.level < 10 && f.level > 0)
                .map(facility => (
                  <div key={facility.id} className="border border-retro-gb-mid p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">{getFacilityTypeIcon(facility.category)}</span>
                          <div>
                            <div className="font-pixel text-sm text-retro-gb-dark">
                              {facility.name}
                            </div>
                            <div className="font-pixel text-xs text-retro-gb-mid">
                              Lv.{facility.level} → {facility.level + 1}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="font-pixel text-xs text-retro-gb-mid">
                            費用: {formatMoney(facility.upgradeCost * Math.pow(1.5, facility.level))}
                          </div>
                          <div className="font-pixel text-xs text-retro-gb-mid">
                            工期: {Math.floor(facility.constructionTime / 60)}時間
                          </div>
                          <div className="font-pixel text-xs text-retro-gb-mid">
                            材料: 基本資材
                          </div>
                        </div>
                      </div>
                      
                      <PixelButton
                        onClick={() => handleUpgrade(facility.id)}
                        disabled={false}
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
                        <span className="font-pixel text-xs text-green-600">
                          研究可能
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