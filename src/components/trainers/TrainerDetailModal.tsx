'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { PixelProgressBar } from '@/components/ui/PixelProgressBar'
import { TrainerSummary } from '@/types/trainer'
import { useGameData, useNotifications } from '@/contexts/GameContext'
import { clsx } from 'clsx'

interface TrainerDetailModalProps {
  trainer: TrainerSummary
  isOpen: boolean
  onClose: () => void
}

export function TrainerDetailModal({ trainer, isOpen, onClose }: TrainerDetailModalProps) {
  const [selectedTab, setSelectedTab] = useState<'profile' | 'skills' | 'equipment' | 'history'>('profile')
  const { addNotification } = useNotifications()
  const router = useRouter()

  if (!isOpen) return null

  const handleDispatchToExpedition = async () => {
    try {
      const { gameController } = await import('@/lib/game-logic')
      
      if (trainer.status !== 'available') {
        addNotification({
          type: 'error',
          message: 'このトレーナーは現在利用できません'
        })
        return
      }

      // 派遣画面に移動
      addNotification({
        type: 'info',
        message: `${trainer.name}を派遣画面で選択しました`
      })
      
      // 実装: 派遣画面に移動してトレーナーを事前選択
      router.push(`/dashboard/expeditions?trainer=${trainer.id}`)
      
    } catch (error) {
      console.error('派遣処理エラー:', error)
      addNotification({
        type: 'error',
        message: '派遣処理中にエラーが発生しました'
      })
    }
  }

  const handleTraining = async () => {
    try {
      const { gameController } = await import('@/lib/game-logic')
      
      if (trainer.status !== 'available') {
        addNotification({
          type: 'error',
          message: 'このトレーナーは現在利用できません'
        })
        return
      }

      // 簡易的な訓練実装
      const trainingCost = 1000 + (trainer.job.level * 200)
      const canAfford = gameController.checkCanAfford(trainingCost)
      
      if (!canAfford) {
        addNotification({
          type: 'error',
          message: `訓練費が不足しています。必要: ₽${trainingCost.toLocaleString()}`
        })
        return
      }

      const paymentResult = gameController.recordTransaction(
        'expense',
        'training',
        trainingCost,
        `${trainer.name}の訓練費`
      )
      
      if (paymentResult) {
        addNotification({
          type: 'success',
          message: `${trainer.name}の訓練を開始しました！（費用: ₽${trainingCost.toLocaleString()}）`
        })
        onClose()
      }
    } catch (error) {
      console.error('訓練処理エラー:', error)
      addNotification({
        type: 'error',
        message: '訓練処理中にエラーが発生しました'
      })
    }
  }

  const getStatusText = (status: string) => {
    const statusMap = {
      available: { text: '待機中', color: 'text-green-600' },
      on_expedition: { text: '派遣中', color: 'text-orange-600' },
      training: { text: '訓練中', color: 'text-blue-600' },
      injured: { text: '負傷中', color: 'text-red-600' },
      resting: { text: '休息中', color: 'text-purple-600' }
    }
    return statusMap[status as keyof typeof statusMap] || { text: '不明', color: 'text-gray-600' }
  }

  const statusInfo = getStatusText(trainer.status)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-retro-gb-lightest border-2 border-retro-gb-dark max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* ヘッダー */}
        <div className="bg-retro-gb-dark text-retro-gb-lightest p-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-retro-gb-mid border border-retro-gb-light flex items-center justify-center">
              <span className="font-pixel text-lg">👨‍🏫</span>
            </div>
            <div>
              <h2 className="font-pixel text-lg">{trainer.name}</h2>
              <div className="flex items-center space-x-2">
                <span className="font-pixel text-sm">{trainer.job.nameJa} Lv.{trainer.job.level}</span>
                <span className={clsx('font-pixel text-sm', statusInfo.color)}>
                  {statusInfo.text}
                </span>
              </div>
            </div>
          </div>
          <PixelButton size="sm" variant="secondary" onClick={onClose}>
            ✕
          </PixelButton>
        </div>

        {/* タブナビゲーション */}
        <div className="p-4 border-b border-retro-gb-mid">
          <div className="flex space-x-2">
            {[
              { key: 'profile', label: 'プロフィール' },
              { key: 'skills', label: 'スキル' },
              { key: 'equipment', label: '装備' },
              { key: 'history', label: '履歴' }
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
        </div>

        {/* タブコンテンツ */}
        <div className="p-4 space-y-4">
          {selectedTab === 'profile' && (
            <>
              {/* 基本情報 */}
              <PixelCard title="基本情報">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-pixel text-xs text-retro-gb-mid">職業レベル</div>
                      <div className="font-pixel text-retro-gb-dark">Lv.{trainer.job.level}</div>
                    </div>
                    <div>
                      <div className="font-pixel text-xs text-retro-gb-mid">信頼度</div>
                      <div className="font-pixel text-retro-gb-dark">{trainer.trustLevel}%</div>
                    </div>
                    <div>
                      <div className="font-pixel text-xs text-retro-gb-mid">月給</div>
                      <div className="font-pixel text-retro-gb-dark">₽{trainer.salary.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="font-pixel text-xs text-retro-gb-mid">パーティ</div>
                      <div className="font-pixel text-retro-gb-dark">{trainer.party.pokemonCount}/6匹</div>
                    </div>
                  </div>
                  
                  {/* 経験値バー */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-pixel text-xs text-retro-gb-mid">職業経験値</span>
                      <span className="font-pixel text-xs text-retro-gb-mid">
                        {trainer.job.experience}/{trainer.job.nextLevelExp}
                      </span>
                    </div>
                    <PixelProgressBar
                      value={trainer.job.experience}
                      max={trainer.job.nextLevelExp}
                      color="exp"
                      showLabel={false}
                    />
                  </div>

                  {/* 信頼度バー */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-pixel text-xs text-retro-gb-mid">信頼度</span>
                      <span className="font-pixel text-xs text-retro-gb-mid">{trainer.trustLevel}%</span>
                    </div>
                    <PixelProgressBar
                      value={trainer.trustLevel}
                      max={100}
                      color="hp"
                      showLabel={false}
                    />
                  </div>
                </div>
              </PixelCard>

              {/* アクションボタン */}
              <PixelCard title="アクション">
                <div className="space-y-2">
                  <PixelButton 
                    className="w-full" 
                    disabled={trainer.status !== 'available'}
                    onClick={handleDispatchToExpedition}
                  >
                    派遣に送る
                  </PixelButton>
                  <PixelButton 
                    variant="secondary" 
                    className="w-full"
                    disabled={trainer.status !== 'available'}
                    onClick={handleTraining}
                  >
                    訓練を行う
                  </PixelButton>
                  <PixelButton 
                    variant="secondary" 
                    className="w-full"
                    disabled={trainer.status !== 'available'}
                    onClick={() => {
                      addNotification({
                        type: 'info',
                        message: '装備システムは開発中です'
                      })
                    }}
                  >
                    装備を変更
                  </PixelButton>
                </div>
              </PixelCard>
            </>
          )}

          {selectedTab === 'skills' && (
            <PixelCard title="専門スキル">
              <div className="space-y-3">
                {Object.entries(trainer.job.specializations).map(([skill, multiplier]) => (
                  <div key={skill} className="flex justify-between items-center">
                    <span className="font-pixel text-sm text-retro-gb-dark capitalize">{skill}</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-pixel text-sm text-retro-gb-dark">x{multiplier.toFixed(2)}</span>
                      <PixelProgressBar
                        value={(multiplier - 0.5) * 100}
                        max={100}
                        color={multiplier > 1.1 ? 'exp' : 'progress'}
                        showLabel={false}
                        className="w-20"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </PixelCard>
          )}

          {selectedTab === 'equipment' && (
            <PixelCard title="装備・アイテム">
              <div className="text-center py-8">
                <div className="font-pixel text-sm text-retro-gb-mid">
                  装備システムは開発中です
                </div>
              </div>
            </PixelCard>
          )}

          {selectedTab === 'history' && (
            <PixelCard title="活動履歴">
              <div className="space-y-3">
                {[
                  { date: '2024-01-15', activity: '22番道路への派遣', result: '成功 - ポッポ×1捕獲' },
                  { date: '2024-01-12', activity: 'レベルアップ', result: 'レンジャー Lv.3 → Lv.4' },
                  { date: '2024-01-10', activity: 'トキワの森への派遣', result: '成功 - アイテム×3取得' },
                  { date: '2024-01-08', activity: '訓練セッション', result: '経験値+150獲得' },
                ].map((entry, index) => (
                  <div key={index} className="border-b border-retro-gb-mid pb-2 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-pixel text-sm text-retro-gb-dark">{entry.activity}</div>
                        <div className="font-pixel text-xs text-retro-gb-mid">{entry.result}</div>
                      </div>
                      <div className="font-pixel text-xs text-retro-gb-mid">{entry.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </PixelCard>
          )}
        </div>
      </div>
    </div>
  )
}