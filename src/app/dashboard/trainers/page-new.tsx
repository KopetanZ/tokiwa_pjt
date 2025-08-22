'use client'

import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { TrainerCard } from '@/components/trainers/TrainerCard'
import { TrainerDetailModal } from '@/components/trainers/TrainerDetailModal'
import { CandidateSelectionModal } from '@/components/trainers/CandidateSelectionModal'
import { TrainerSummary } from '@/types/trainer'
import { useAuth, useNotifications } from '@/contexts/GameContext'
import { useTrainers, useEconomy, useGameDebug } from '@/lib/game-state'
import { useState, useEffect } from 'react'
import { TrainerSystem } from '@/lib/game-logic/trainer-system'

export default function TrainersPageNew() {
  const [selectedTab, setSelectedTab] = useState<'all' | 'available' | 'busy'>('all')
  const [showCandidateModal, setShowCandidateModal] = useState(false)
  const [availableCandidates, setAvailableCandidates] = useState<any[]>([])
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerSummary | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  // 新しいJSONシステムのフック
  const { user } = useAuth()
  const { trainers, available, onExpedition, training, total, totalSalary, actions: trainerActions } = useTrainers(user?.id)
  const { money, actions: economyActions } = useEconomy(user?.id)
  const { addNotification } = useNotifications()
  const debug = useGameDebug(user?.id)
  
  // 雇用候補者データの読み込み
  const loadCandidates = async () => {
    try {
      const candidates = TrainerSystem.generateTrainerCandidates()
      setAvailableCandidates(candidates)
    } catch (error) {
      console.error('候補者データ読み込みエラー:', error)
    }
  }

  useEffect(() => {
    loadCandidates()
  }, [])
  
  // JSONデータを表示用形式に変換
  const displayTrainers: TrainerSummary[] = trainers.map(trainer => ({
    id: trainer.id,
    name: trainer.name,
    job: {
      id: 1,
      name: trainer.job,
      nameJa: getJobNameJa(trainer.job),
      level: trainer.level,
      experience: trainer.experience,
      nextLevelExp: trainer.nextLevelExp,
      specializations: { capture: 1.2, exploration: 1.1, battle: 1.0 }
    },
    status: trainer.status === 'resting' ? 'busy' : trainer.status as 'available' | 'on_expedition' | 'injured' | 'training' | 'busy',
    party: {
      pokemonCount: 2,
      totalLevel: trainer.level * 2,
      averageLevel: trainer.level
    },
    trustLevel: trainer.trustLevel,
    salary: trainer.salary,
    spritePath: `/sprites/trainers/${trainer.job}_m.png`
  }))
  
  const filteredTrainers = displayTrainers.filter(trainer => {
    if (selectedTab === 'available') return trainer.status === 'available'
    if (selectedTab === 'busy') return trainer.status !== 'available'
    return true
  })
  
  // 統計計算
  const stats = {
    total,
    available: available.length,
    busy: onExpedition.length + training.length,
    totalSalary
  }
  
  // 雇用処理（新システム）
  const handleHireTrainer = async (candidate: any) => {
    const { name: trainerName, job, hireCost: cost } = candidate
    console.log('🎯 JSON雇用処理開始:', { trainerName, job, cost })
    
    try {
      // 資金チェック
      if (!economyActions.canAfford(cost)) {
        addNotification({
          type: 'error',
          message: `資金不足です。必要: ₽${cost.toLocaleString()}, 所持: ₽${money.toLocaleString()}`
        })
        return
      }
      
      // トレーナー生成
      const { trainer } = TrainerSystem.hireNewTrainer(trainerName, job as any, 1)
      
      // JSONシステムでトレーナー追加（即座にローカル更新）
      const trainerId = trainerActions.hire({
        name: trainer.name,
        job: trainer.job,
        level: trainer.level,
        experience: trainer.experience,
        nextLevelExp: (trainer.level + 1) * 1000,
        status: 'available',
        skills: {
          capture: 5,
          exploration: 5,
          battle: 5,
          research: 5,
          healing: 5
        },
        personality: trainer.personality,
        salary: 30000, // デフォルト値
        totalEarned: 0,
        totalExpeditions: 0,
        successfulExpeditions: 0,
        pokemonCaught: 0,
        trustLevel: 50, // デフォルト値
        favoriteLocations: [],
        lastActive: new Date().toISOString(),
        hiredDate: new Date().toISOString()
      })
      
      // 支払い処理（即座にローカル更新）
      economyActions.updateMoney(-cost)
      economyActions.addTransaction({
        type: 'expense',
        category: 'trainer_hire',
        amount: cost,
        description: `${trainerName} 雇用費用`,
        relatedId: trainerId,
        timestamp: new Date().toISOString()
      })
      
      // 候補者リストから除外
      setAvailableCandidates(prev => 
        prev.filter(c => c.name !== trainerName)
      )
      
      addNotification({
        type: 'success',
        message: `${trainerName}を雇用しました！（費用: ₽${cost.toLocaleString()}）`
      })
      
      addNotification({
        type: 'success',
        message: `${trainerName}が派遣に利用可能になりました！`
      })
      
      console.log('✅ JSON雇用完了 - 即座にUI反映完了')
      
    } catch (error) {
      console.error('🚨 雇用処理エラー:', error)
      addNotification({
        type: 'error',
        message: '雇用処理中にエラーが発生しました'
      })
    }
  }

  const handleTrainerClick = (trainer: TrainerSummary) => {
    setSelectedTrainer(trainer)
    setShowDetailModal(true)
  }

  const handleCloseDetailModal = () => {
    setShowDetailModal(false)
    setSelectedTrainer(null)
  }

  const handleNewTrainerHire = () => {
    setShowCandidateModal(true)
    addNotification({
      type: 'info',
      message: '雇用可能なトレーナーリストを表示します'
    })
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-pixel-large text-retro-gb-dark">
            トレーナー管理 
          </h1>
          <div className="font-pixel text-xs text-retro-gb-mid">
            💾 JSONローカル管理 | 所持金: ₽{money.toLocaleString()}
          </div>
        </div>
        <div className="flex gap-2">
          <PixelButton onClick={handleNewTrainerHire}>
            新しいトレーナーを雇う
          </PixelButton>
          {/* デバッグボタン */}
          <PixelButton 
            variant="secondary" 
            size="sm"
            onClick={() => debug.actions.addTestTrainer()}
          >
            テスト追加
          </PixelButton>
        </div>
      </div>

      {/* 統計サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <PixelCard title="総トレーナー数">
          <div className="text-center">
            <div className="font-pixel-large text-retro-gb-dark">{stats.total}</div>
            <div className="font-pixel text-xs text-retro-gb-mid">/ 10 (最大)</div>
          </div>
        </PixelCard>

        <PixelCard title="利用可能">
          <div className="text-center">
            <div className="font-pixel-large text-green-600">{stats.available}</div>
            <div className="font-pixel text-xs text-retro-gb-mid">派遣可能</div>
          </div>
        </PixelCard>

        <PixelCard title="活動中">
          <div className="text-center">
            <div className="font-pixel-large text-orange-600">{stats.busy}</div>
            <div className="font-pixel text-xs text-retro-gb-mid">派遣・訓練中</div>
          </div>
        </PixelCard>

        <PixelCard title="月給総額">
          <div className="text-center">
            <div className="font-pixel-large text-retro-gb-dark">₽{stats.totalSalary.toLocaleString()}</div>
            <div className="font-pixel text-xs text-retro-gb-mid">維持費</div>
          </div>
        </PixelCard>
      </div>

      {/* フィルタータブ */}
      <PixelCard>
        <div className="flex space-x-2">
          {[
            { key: 'all', label: '全て' },
            { key: 'available', label: '利用可能' },
            { key: 'busy', label: '活動中' }
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

      {/* トレーナーリスト */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredTrainers.map(trainer => (
          <TrainerCard 
            key={trainer.id}
            trainer={trainer}
            onClick={() => handleTrainerClick(trainer)}
            showStatus={true}
            showParty={true}
          />
        ))}
        {filteredTrainers.length === 0 && (
          <div className="col-span-2 text-center py-8">
            <div className="font-pixel text-retro-gb-mid mb-4">
              {selectedTab === 'available' ? '利用可能なトレーナーがいません' :
               selectedTab === 'busy' ? '活動中のトレーナーがいません' :
               'トレーナーがいません'}
            </div>
            <PixelButton onClick={handleNewTrainerHire}>
              トレーナーを雇用する
            </PixelButton>
          </div>
        )}
      </div>

      {/* 雇用可能トレーナー */}
      <PixelCard title="雇用可能なトレーナー">
        <div className="space-y-4">
          <div className="font-pixel text-xs text-retro-gb-mid">
            新しいトレーナーを雇って、スクールを拡大しましょう
          </div>
          
          <div className="text-center py-4">
            <div className="font-pixel text-sm text-retro-gb-dark mb-2">
              現在 {availableCandidates.length} 名の候補者が利用可能
            </div>
            <PixelButton onClick={() => setShowCandidateModal(true)}>
              候補者を確認する
            </PixelButton>
          </div>
        </div>
      </PixelCard>

      {/* デバッグ情報 */}
      <PixelCard title="システム情報">
        <div className="font-pixel text-xs text-retro-gb-mid space-y-1">
          <div>💾 データサイズ: {(debug.dataSize / 1024).toFixed(1)}KB</div>
          <div>🔄 JSONローカル管理</div>
          <div>⚡ リアルタイム更新: 有効</div>
          <div>🌐 オフライン動作: 対応</div>
        </div>
      </PixelCard>

      {/* トレーナー詳細モーダル */}
      {selectedTrainer && (
        <TrainerDetailModal
          trainer={selectedTrainer}
          isOpen={showDetailModal}
          onClose={handleCloseDetailModal}
        />
      )}

      {/* 候補者選択モーダル */}
      <CandidateSelectionModal
        isOpen={showCandidateModal}
        onClose={() => setShowCandidateModal(false)}
        onHire={handleHireTrainer}
        candidates={availableCandidates}
      />
    </div>
  )
}

// ユーティリティ関数
function getJobNameJa(job: string): string {
  const jobNames: Record<string, string> = {
    ranger: 'レンジャー',
    breeder: 'ブリーダー',
    researcher: 'リサーチャー',
    battler: 'バトラー',
    medic: 'メディック'
  }
  return jobNames[job] || job
}