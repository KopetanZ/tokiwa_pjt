'use client'

import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { PixelProgressBar } from '@/components/ui/PixelProgressBar'
import { TrainerCard } from '@/components/trainers/TrainerCard'
import { TrainerDetailModal } from '@/components/trainers/TrainerDetailModal'
import { CandidateSelectionModal } from '@/components/trainers/CandidateSelectionModal'
import { TrainerSummary } from '@/types/trainer'
import { useGameState, useTrainers, useEconomy } from '@/lib/game-state/hooks'
import { useState, useEffect } from 'react'

// サンプルデータ（モックIDと整合性を保つ）
const sampleTrainers: TrainerSummary[] = [
  {
    id: 'mock-trainer-1',
    name: 'タケシ',
    job: {
      id: 1,
      name: 'ranger',
      nameJa: 'レンジャー',
      level: 4,
      experience: 320,
      nextLevelExp: 500,
      specializations: { capture: 1.25, exploration: 1.15, battle: 0.95 }
    },
    status: 'available',
    party: {
      pokemonCount: 3,
      totalLevel: 15,
      averageLevel: 5
    },
    trustLevel: 75,
    salary: 3600,
    spritePath: '/sprites/trainers/ranger_m.png'
  },
  {
    id: 'mock-trainer-2', 
    name: 'カスミ',
    job: {
      id: 3,
      name: 'battler',
      nameJa: 'バトラー',
      level: 2,
      experience: 180,
      nextLevelExp: 300,
      specializations: { battle: 1.25, strategy: 1.15, capture: 0.9 }
    },
    status: 'on_expedition',
    party: {
      pokemonCount: 2,
      totalLevel: 8,
      averageLevel: 4
    },
    trustLevel: 60,
    salary: 3000,
    spritePath: '/sprites/trainers/battler_f.png'
  },
  {
    id: 'mock-trainer-3',
    name: 'マチス',
    job: {
      id: 2,
      name: 'breeder',
      nameJa: 'ブリーダー',
      level: 1,
      experience: 50,
      nextLevelExp: 150,
      specializations: { breeding: 1.30, healing: 1.20, capture: 1.05 }
    },
    status: 'training',
    party: {
      pokemonCount: 1,
      totalLevel: 3,
      averageLevel: 3
    },
    trustLevel: 45,
    salary: 2800,
    spritePath: '/sprites/trainers/breeder_m.png'
  }
]

export default function TrainersPage() {
  const [selectedTab, setSelectedTab] = useState<'all' | 'available' | 'busy'>('all')
  const [showCandidateModal, setShowCandidateModal] = useState(false)
  const [availableCandidates, setAvailableCandidates] = useState<any[]>([])
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerSummary | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  const { gameData, actions } = useGameState()
  const { trainers, actions: trainerActions } = useTrainers()
  const { money, actions: economyActions } = useEconomy()
  
  const hireTrainer = trainerActions.hire
  const getAvailableTrainers = () => trainers.filter(t => t.status === 'available')
  
  // 雇用候補者データの読み込み
  const loadCandidates = async () => {
    try {
      const { gameController } = await import('@/lib/game-logic')
      const candidates = gameController.getAvailableTrainerCandidates()
      setAvailableCandidates(candidates)
    } catch (error) {
      console.error('候補者データ読み込みエラー:', error)
    }
  }

  useEffect(() => {
    loadCandidates()
  }, [])
  
  // JSON システムから取得したトレーナーデータを表示用に変換
  const displayTrainers = trainers.map(trainer => ({
    id: trainer.id,
    name: trainer.name,
    job: {
      id: 1,
      name: trainer.job,
      nameJa: trainer.job,
      level: trainer.level,
      experience: trainer.experience,
      nextLevelExp: trainer.nextLevelExp,
      specializations: { capture: 1.2, exploration: 1.1, battle: 1.0 }
    },
    status: trainer.status as 'available' | 'on_expedition' | 'training',
    party: {
      pokemonCount: 2, // デフォルト値
      totalLevel: trainer.level * 2, // デフォルト値
      averageLevel: trainer.level // デフォルト値
    },
    trustLevel: trainer.trustLevel,
    salary: trainer.salary,
    spritePath: `/sprites/trainers/${trainer.job.toLowerCase()}_m.png`
  }))
  
  const filteredDisplayTrainers = displayTrainers.filter(trainer => {
    if (selectedTab === 'available') return trainer.status === 'available'
    if (selectedTab === 'busy') return trainer.status !== 'available'
    return true
  })
  
  // 統計計算
  const stats = {
    total: trainers.length,
    available: trainers.filter(t => t.status === 'available').length,
    busy: trainers.filter(t => t.status !== 'available').length,
    totalSalary: trainers.reduce((sum, t) => sum + t.salary, 0)
  }
  
  const handleHireTrainer = async (candidate: any) => {
    const { name: trainerName, job, hireCost: cost } = candidate
    console.log('🎯 雇用処理開始:', { trainerName, job, cost })
    
    try {
      // JSON システムを使用して雇用処理
      const trainerData = {
        name: trainerName,
        job: job,
        level: 1,
        experience: 0,
        nextLevelExp: 1000,
        status: 'available' as const,
        skills: { capture: 5, exploration: 5, battle: 5, research: 5, healing: 5 },
        personality: { courage: 5, caution: 5, curiosity: 5, teamwork: 5, independence: 5, compliance: 5 },
        salary: cost,
        totalEarned: 0,
        totalExpeditions: 0,
        successfulExpeditions: 0,
        pokemonCaught: 0,
        trustLevel: 50,
        favoriteLocations: [],
        lastActive: new Date().toISOString(),
        hiredDate: new Date().toISOString()
      }
      const result = hireTrainer(trainerData)
      
      console.log('📊 雇用処理結果:', result)
      
      if (result) {
        // 支払い処理
        economyActions.updateMoney(-cost)
        economyActions.addTransaction({
          type: 'expense',
          category: 'trainer_hire',
          amount: cost,
          description: `${trainerName}の雇用費`,
          timestamp: new Date().toISOString()
        })
        
        console.log(`✅ ${trainerName}を雇用しました！（費用: ₽${cost?.toLocaleString()}）`)
        
        // 候補者リストから雇用したトレーナーを除外
        setAvailableCandidates(prev => 
          prev.filter(c => c.name !== trainerName)
        )
        
        console.log('✅ ローカル状態更新完了 - 新しいトレーナーは派遣に利用可能')
      } else {
        console.warn('❌ 雇用失敗: 資金不足または重複')
      }
    } catch (error) {
      console.error('🚨 雇用処理エラー:', error)
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
    console.log('雇用可能なトレーナーリストを表示します')
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="font-pixel-large text-retro-gb-dark">
          トレーナー管理
        </h1>
        <PixelButton onClick={handleNewTrainerHire}>
          新しいトレーナーを雇う
        </PixelButton>
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
        {filteredDisplayTrainers.map(trainer => (
          <TrainerCard 
            key={trainer.id}
            trainer={trainer}
            onClick={() => handleTrainerClick(trainer)}
            showStatus={true}
            showParty={true}
          />
        ))}
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

      {/* 初期トレーナー復元ボタン（開発環境のみ） */}
      {process.env.NODE_ENV === 'development' && (
        <PixelCard title="🔧 デバッグ機能">
          <div className="space-y-4">
            <div className="font-pixel text-xs text-retro-gb-mid">
              初期トレーナー（タケシ、カスミ、マチス）を復元します
            </div>
            <PixelButton 
              variant="secondary" 
              onClick={async () => {
                try {
                  const { gameController } = await import('@/lib/game-logic')
                  gameController.restoreInitialTrainers()
                  // 少し待ってからページをリロード
                  setTimeout(() => {
                    window.location.reload()
                  }, 1000)
                } catch (error) {
                  console.error('初期トレーナー復元エラー:', error)
                }
              }}
            >
              初期トレーナーを復元
            </PixelButton>
          </div>
        </PixelCard>
      )}

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