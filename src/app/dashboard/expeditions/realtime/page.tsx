'use client'

import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { PixelProgressBar } from '@/components/ui/PixelProgressBar'
import { LiveExpeditionCard } from '@/components/expeditions/LiveExpeditionCard'
import { InterventionPanel } from '@/components/expeditions/InterventionPanel'
import { realtimeSystem } from '@/lib/realtime'
import { getUserExpeditions, synchronizeRealtimeWithDatabase } from '@/lib/expedition-integration'
import { useAuth } from '@/contexts/GameContext'
import { useState, useEffect } from 'react'

// デモ用サンプルデータ（モックIDと整合性を保つ）
const sampleExpeditions = [
  {
    id: 'mock-expedition-1',
    trainer: { id: 'mock-trainer-2', name: 'カスミ', job: 'バトラー' },
    location: { nameJa: 'トキワの森' }
  },
  {
    id: 'mock-expedition-2', 
    trainer: { id: 'mock-trainer-1', name: 'タケシ', job: 'レンジャー' },
    location: { nameJa: '22番道路' }
  }
]

export default function RealtimeExpeditionsPage() {
  const [interventionPanel, setInterventionPanel] = useState<{
    isOpen: boolean
    expeditionId: string
  }>({ isOpen: false, expeditionId: '' })
  
  const [activeExpeditions, setActiveExpeditions] = useState<any[]>([])
  const [realExpeditionData, setRealExpeditionData] = useState<any>(null)
  const [completedExpeditions, setCompletedExpeditions] = useState<any[]>([])
  const [stats, setStats] = useState({
    active: 0,
    interventionsRequired: 0,
    totalRewards: 0,
    successRate: 85
  })
  
  const { isMockMode, user, isAuthenticated } = useAuth()

  useEffect(() => {
    // リアルタイムシステムとデータベースの同期を初期化
    if (!isMockMode) {
      synchronizeRealtimeWithDatabase()
    }
    
    // 実際の派遣データを読み込み
    async function loadRealExpeditions() {
      if (!isMockMode && isAuthenticated && user) {
        try {
          const expeditionData = await getUserExpeditions(user)
          setRealExpeditionData(expeditionData)
          
          // アクティブな派遣をリアルタイムシステムに登録
          expeditionData.active.forEach((expedition: any) => {
            const progress = realtimeSystem.getProgress(expedition.id)
            if (!progress) {
              const remainingHours = expedition.target_duration_hours - 
                ((Date.now() - new Date(expedition.started_at).getTime()) / (1000 * 60 * 60))
              
              if (remainingHours > 0) {
                realtimeSystem.startExpedition(
                  expedition.id,
                  expedition.trainer_id,
                  Math.max(remainingHours * 60, 1) // 最低1分
                )
              }
            }
          })
        } catch (error) {
          console.error('派遣データ読み込みエラー:', error)
        }
      }
    }
    
    loadRealExpeditions()
    
    // アクティブ派遣を取得
    const active = realtimeSystem.getActiveExpeditions()
    setActiveExpeditions(active)
    
    // モックモードのみ：デモ派遣を自動開始
    if (isMockMode && active.length === 0) {
      sampleExpeditions.forEach((exp, index) => {
        setTimeout(() => {
          realtimeSystem.startExpedition(
            exp.id,
            exp.trainer.id,
            30 + (index * 10) // 30-40分の派遣
          )
        }, index * 2000) // 2秒間隔で開始
      })
    }

    // 派遣完了イベントのリスナーを設定
    sampleExpeditions.forEach(exp => {
      realtimeSystem.addEventListener(exp.id, (eventType: string, data: any) => {
        if (eventType === 'expedition_complete') {
          setCompletedExpeditions(prev => [...prev, {
            id: exp.id,
            trainer: exp.trainer,
            location: exp.location,
            reward: data.finalReward,
            completedAt: new Date()
          }])
          setActiveExpeditions(prev => prev.filter(e => e.expeditionId !== exp.id))
        } else if (eventType === 'expedition_cancelled') {
          // 派遣キャンセル時の処理
          setCompletedExpeditions(prev => [...prev, {
            id: exp.id,
            trainer: exp.trainer,
            location: exp.location,
            reward: data.partialReward,
            completedAt: new Date(),
            status: 'cancelled'
          }])
          setActiveExpeditions(prev => prev.filter(e => e.expeditionId !== exp.id))
        }
      })
    })

    // 統計更新用の定期タイマー
    const statsInterval = setInterval(() => {
      const currentActive = realtimeSystem.getActiveExpeditions()
      setActiveExpeditions(currentActive)
      
      const interventionsNeeded = currentActive.reduce((count, exp) => {
        const pendingEvents = exp.events.filter(e => e.status === 'pending' && e.playerResponseRequired)
        return count + pendingEvents.length
      }, 0)
      
      setStats({
        active: currentActive.length,
        interventionsRequired: interventionsNeeded,
        totalRewards: currentActive.reduce((sum, exp) => sum + exp.totalReward * 1000, 0),
        successRate: currentActive.length > 0 
          ? Math.round(currentActive.reduce((sum, exp) => sum + exp.successProbability, 0) / currentActive.length)
          : 85
      })
    }, 1000)

    return () => {
      clearInterval(statsInterval)
    }
  }, [isMockMode, isAuthenticated, user])

  const handleInterventionOpen = (expeditionId: string) => {
    setInterventionPanel({ isOpen: true, expeditionId })
  }

  const handleInterventionClose = () => {
    setInterventionPanel({ isOpen: false, expeditionId: '' })
  }

  const startNewExpedition = () => {
    if (isMockMode) {
      // モックモードでのデモ派遣
      const newId = `exp_${Date.now()}`
      const trainer = sampleExpeditions[Math.floor(Math.random() * sampleExpeditions.length)]
      
      realtimeSystem.startExpedition(
        newId,
        trainer.trainer.id,
        Math.floor(Math.random() * 30) + 15 // 15-45分
      )
    } else {
      // 実際のモードでは派遣ページにリダイレクト
      window.location.href = '/dashboard/expeditions'
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="font-pixel-large text-retro-gb-dark">
          リアルタイム派遣管理
        </h1>
        <div className="flex space-x-2">
          <PixelButton onClick={startNewExpedition}>
            新しい派遣を開始
          </PixelButton>
          <PixelButton 
            variant="secondary"
            onClick={() => window.location.href = '/dashboard/expeditions'}
          >
            通常表示に戻る
          </PixelButton>
        </div>
      </div>

      {/* リアルタイム統計 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <PixelCard title="アクティブ派遣">
          <div className="text-center">
            <div className="font-pixel-large text-blue-600">{stats.active}</div>
            <div className="font-pixel text-xs text-retro-gb-mid">進行中</div>
          </div>
        </PixelCard>

        <PixelCard title="介入要求">
          <div className="text-center">
            <div className={`font-pixel-large ${stats.interventionsRequired > 0 ? 'text-red-600 animate-pulse' : 'text-green-600'}`}>
              {stats.interventionsRequired}
            </div>
            <div className="font-pixel text-xs text-retro-gb-mid">
              {stats.interventionsRequired > 0 ? '要対応' : '正常'}
            </div>
          </div>
        </PixelCard>

        <PixelCard title="予想報酬">
          <div className="text-center">
            <div className="font-pixel-large text-green-600">
              ₽{Math.floor(stats.totalRewards).toLocaleString()}
            </div>
            <div className="font-pixel text-xs text-retro-gb-mid">合計</div>
          </div>
        </PixelCard>

        <PixelCard title="成功率">
          <div className="text-center">
            <div className={`font-pixel-large ${stats.successRate >= 80 ? 'text-green-600' : stats.successRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
              {stats.successRate}%
            </div>
            <div className="font-pixel text-xs text-retro-gb-mid">平均</div>
          </div>
        </PixelCard>
      </div>

      {/* ライブアップデート警告 */}
      <PixelCard>
        <div className="flex items-center space-x-3 p-2 bg-blue-50 border border-blue-200">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          <div className="font-pixel text-xs text-blue-700">
            リアルタイム更新中 - 派遣状況は自動的に更新されます
          </div>
        </div>
      </PixelCard>

      {/* アクティブな派遣一覧 */}
      <div className="space-y-4">
        <h2 className="font-pixel text-lg text-retro-gb-dark">
          進行中の派遣 ({activeExpeditions.length})
        </h2>
        
        {activeExpeditions.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {isMockMode ? (
              // モックモードでの表示
              sampleExpeditions.map(exp => (
                <LiveExpeditionCard
                  key={exp.id}
                  expeditionId={exp.id}
                  trainerName={exp.trainer.name}
                  destination={exp.location.nameJa}
                  onInterventionOpen={() => handleInterventionOpen(exp.id)}
                />
              ))
            ) : (
              // 実際のデータでの表示
              realExpeditionData?.active?.map((expedition: any) => {
                const trainer = realExpeditionData.trainers?.find((t: any) => t.id === expedition.trainer_id)
                const location = realExpeditionData.locations?.find((l: any) => l.id === expedition.location_id)
                
                return (
                  <LiveExpeditionCard
                    key={expedition.id}
                    expeditionId={expedition.id}
                    trainerName={trainer?.name || '不明'}
                    destination={location?.location_name_ja || '不明'}
                    onInterventionOpen={() => handleInterventionOpen(expedition.id)}
                  />
                )
              }) || []
            )}
          </div>
        ) : (
          <PixelCard>
            <div className="text-center py-8">
              <div className="font-pixel text-retro-gb-mid mb-4">
                現在進行中の派遣はありません
              </div>
              <PixelButton onClick={startNewExpedition}>
                {isMockMode ? 'デモ派遣を開始する' : '派遣を開始する'}
              </PixelButton>
            </div>
          </PixelCard>
        )}
      </div>

      {/* 完了した派遣一覧 */}
      {completedExpeditions.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-pixel text-lg text-retro-gb-dark">
            完了した派遣 ({completedExpeditions.length})
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {completedExpeditions.map(exp => (
              <PixelCard key={exp.id} title={`${exp.trainer.name} - ${exp.location.nameJa}`}>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="font-pixel text-sm text-retro-gb-mid">
                      完了時刻: {exp.completedAt.toLocaleTimeString()}
                    </div>
                    <div className="font-pixel text-lg text-green-600">
                      ₽{exp.reward.toLocaleString()}
                    </div>
                  </div>
                  
                  {exp.status === 'cancelled' && (
                    <div className="bg-yellow-100 border border-yellow-300 p-2 rounded">
                      <div className="font-pixel text-xs text-yellow-800 text-center">
                        ⚠️ 派遣キャンセル済み（部分報酬）
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <PixelButton
                      size="sm"
                      onClick={() => {
                        // 報酬を取得
                        setCompletedExpeditions(prev => prev.filter(e => e.id !== exp.id))
                        // ここで実際の報酬処理を行う
                        alert(`報酬 ${exp.reward} を取得しました！`)
                      }}
                    >
                      報酬を取得
                    </PixelButton>
                    
                    <PixelButton
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setCompletedExpeditions(prev => prev.filter(e => e.id !== exp.id))
                      }}
                    >
                      破棄
                    </PixelButton>
                  </div>
                </div>
              </PixelCard>
            ))}
          </div>
        </div>
      )}

      {/* リアルタイム介入ガイド */}
      <PixelCard title="リアルタイム介入システムについて">
        <div className="space-y-3 font-pixel text-xs text-retro-gb-mid">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-pixel text-sm text-retro-gb-dark mb-2">🎯 介入のタイミング</h4>
              <ul className="space-y-1">
                <li>• 野生ポケモンとの遭遇時</li>
                <li>• 危険な状況の発生時</li>
                <li>• 重要な分岐点での選択</li>
                <li>• 緊急事態への対応</li>
              </ul>
            </div>
            <div>
              <h4 className="font-pixel text-sm text-retro-gb-dark mb-2">⚡ 自動解決</h4>
              <ul className="space-y-1">
                <li>• 30秒以内に応答がない場合</li>
                <li>• 最も安全な選択肢を自動選択</li>
                <li>• 報酬は少し減少</li>
                <li>• リスクは最小限に抑制</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-3 border-t border-retro-gb-mid">
            <div className="font-pixel text-sm text-retro-gb-dark mb-2">💡 介入のコツ</div>
            <div>迅速な判断が報酬アップの鍵！リスクと報酬のバランスを考慮して選択しましょう。</div>
          </div>
        </div>
      </PixelCard>

      {/* 介入パネル */}
      <InterventionPanel
        expeditionId={interventionPanel.expeditionId}
        isVisible={interventionPanel.isOpen}
        onClose={handleInterventionClose}
      />
    </div>
  )
}