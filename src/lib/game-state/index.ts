// JSONベースのゲーム状態管理システム
// エクスポート集約

// 型定義
export * from './types'

// メインクラス
export { GameStateManager, getGameStateManager } from './GameStateManager'

// Reactフック
export {
  useGameState,
  useTrainers,
  usePokemon,
  useExpeditions,
  useEconomy,
  useGameStatistics,
  useGameDebug
} from './hooks'

// 使用例とドキュメント
export const USAGE_EXAMPLES = {
  basic: `
// 基本的な使用方法
import { useGameState } from '@/lib/game-state'

function MyComponent() {
  const { gameData, actions, isLoading } = useGameState('user123')
  
  if (isLoading) return <div>Loading...</div>
  
  const handleHireTrainer = () => {
    actions.addTrainer({
      name: 'タケシ',
      job: 'ranger',
      level: 1,
      // ... other properties
    })
  }
  
  return (
    <div>
      <h1>{gameData.player.name}</h1>
      <p>所持金: ₽{gameData.player.money}</p>
      <button onClick={handleHireTrainer}>トレーナー雇用</button>
    </div>
  )
}
  `,
  
  trainers: `
// トレーナー専用フック
import { useTrainers } from '@/lib/game-state'

function TrainerList() {
  const { trainers, available, actions } = useTrainers('user123')
  
  return (
    <div>
      <h2>利用可能: {available.length}人</h2>
      {available.map(trainer => (
        <div key={trainer.id}>
          {trainer.name} ({trainer.job})
        </div>
      ))}
    </div>
  )
}
  `,
  
  expeditions: `
// 派遣専用フック
import { useExpeditions, useTrainers } from '@/lib/game-state'

function ExpeditionManager() {
  const { active, actions: expeditionActions } = useExpeditions('user123')
  const { available } = useTrainers('user123')
  
  const startExpedition = () => {
    if (available.length > 0) {
      expeditionActions.start({
        trainerId: available[0].id,
        locationId: 1,
        mode: 'balanced',
        targetDuration: 2,
        strategy: [],
        status: 'active',
        startTime: new Date().toISOString(),
        estimatedEndTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        currentProgress: 0
      })
    }
  }
  
  return (
    <div>
      <h2>進行中: {active.length}件</h2>
      <button onClick={startExpedition}>派遣開始</button>
    </div>
  )
}
  `
}

// 設定
export const CONFIG = {
  STORAGE_KEY: 'tokiwa-game-state',
  AUTO_SAVE_INTERVAL: 30000, // 30秒
  VERSION: '1.0.0'
}