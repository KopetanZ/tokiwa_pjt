'use client'

import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { PixelProgressBar } from '@/components/ui/PixelProgressBar'
import { TrainerCard } from '@/components/trainers/TrainerCard'
import { TrainerDetailModal } from '@/components/trainers/TrainerDetailModal'
import { CandidateSelectionModal } from '@/components/trainers/CandidateSelectionModal'
import { TrainerSummary } from '@/types/trainer'
import { useGameData, useAuth, useNotifications } from '@/contexts/GameContext'
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
  
  const { isMockMode } = useAuth()
  const gameData = useGameData()
  const { addNotification } = useNotifications()
  
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
  
  // ゲームコントローラーから最新のトレーナー状態を取得
  const [localTrainers, setLocalTrainers] = useState<any[]>([])
  
  useEffect(() => {
    // ゲームコントローラーから最新状態を取得
    const getLatestTrainers = async () => {
      try {
        const { gameController } = await import('@/lib/game-logic')
        const gameState = gameController.getGameState()
        setLocalTrainers(gameState.trainers)
      } catch (error) {
        console.error('ゲーム状態取得エラー:', error)
      }
    }
    
    if (isMockMode) {
      getLatestTrainers()
    }
  }, [isMockMode, availableCandidates]) // 雇用候補が変更されたときも更新
  
  // 実際のゲームデータまたはサンプルデータを使用
  // モックデータを表示用の構造に変換
  const contextTrainers = isMockMode ? gameData.trainers : []
  const allTrainers = isMockMode ? [...contextTrainers, ...localTrainers] : sampleTrainers
  
  const trainers = allTrainers.map(trainer => ({
      id: trainer.id,
      name: trainer.name,
      job: {
        id: 1,
        name: 'ranger',
        nameJa: trainer.specialty || 'レンジャー',
        level: trainer.level,
        experience: trainer.experience,
        nextLevelExp: trainer.next_level_exp,
        specializations: { capture: 1.2, exploration: 1.1, battle: 1.0 }
      },
      status: trainer.status as 'available' | 'on_expedition' | 'training',
      party: {
        pokemonCount: 2,
        totalLevel: trainer.level * 2,
        averageLevel: trainer.level
      },
      trustLevel: Math.min(100, trainer.experience / 10),
      salary: 3000 + trainer.level * 200,
      spritePath: '/sprites/trainers/ranger_m.png'
    })) : sampleTrainers
  
  const filteredTrainers = trainers.filter(trainer => {
    if (selectedTab === 'available') return trainer.status === 'available'
    if (selectedTab === 'busy') return trainer.status !== 'available'
    return true
  })
  
  // 統計計算
  const stats = {
    total: trainers.length,
    available: trainers.filter(t => t.status === 'available').length,
    busy: trainers.filter(t => t.status !== 'available').length,
    totalSalary: trainers.reduce((sum, t) => sum + (t.salary || 0), 0)
  }
  
  const handleHireTrainer = async (candidate: any) => {
    const { name: trainerName, job, hireCost: cost } = candidate
    console.log('🎯 雇用処理開始:', { trainerName, job, cost })
    
    try {
      // gameControllerを使用して実際の雇用処理
      const { gameController } = await import('@/lib/game-logic')
      
      console.log('📋 gameController取得完了、雇用処理実行中...')
      const result = await gameController.hireTrainer(trainerName, job, 1)
      
      console.log('📊 雇用処理結果:', result)
      
      if (result.success) {
        addNotification({
          type: 'success',
          message: `${trainerName}を雇用しました！（費用: ₽${result.cost?.toLocaleString()}）`
        })
        
        // 候補者リストから雇用したトレーナーを除外（即座にUI更新）
        setAvailableCandidates(prev => 
          prev.filter(c => c.name !== trainerName)
        )
        
        console.log('✅ ローカル状態更新完了 - 新しいトレーナーはゲーム内で利用可能')
        addNotification({
          type: 'success',
          message: `${trainerName}が派遣に利用可能になりました！`
        })
        
        // バックグラウンドでデータベース保存状況を確認
        if (result.dbData && result.dbData.id) {
          console.log('✅ データベース保存も完了:', result.dbData.id)
        } else {
          console.warn('⚠️ データベース保存状況不明（ゲームプレイには影響なし）')
        }
      } else {
        console.warn('❌ 雇用失敗:', result.message)
        addNotification({
          type: 'error',
          message: result.message
        })
      }
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
        {filteredTrainers.map(trainer => (
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