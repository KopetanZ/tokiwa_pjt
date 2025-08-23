/**
 * 統合フックライブラリ
 * アプリケーション全体で使用する統合されたデータアクセスフック
 */

// 統合データアクセスフック
export {
  useUnifiedGameData,
  useUnifiedTrainers,
  useUnifiedPokemon,
  useUnifiedExpeditions,
  useUnifiedEconomy,
  useUnifiedSystemManagement
} from './useUnifiedData'

// データブリッジフック
export { useDataBridge, useUnifiedGameData as useUnifiedData } from '@/lib/data-bridge/DataBridge'

// プロバイダーからの直接インポート（必要に応じて）
export {
  useDataSystem,
  useGameData,
  useTrainers,
  usePokemon,
  useExpeditions,
  useDataSystemManagement
} from '@/components/providers/DataSystemProvider'

/**
 * 便利なデータアクセス組み合わせフック
 */
export function useGameCore() {
  const gameData = useUnifiedGameData()
  const trainers = useUnifiedTrainers()
  const pokemon = useUnifiedPokemon()
  const expeditions = useUnifiedExpeditions()
  const economy = useUnifiedEconomy()
  const systemManagement = useUnifiedSystemManagement()
  
  return {
    // 基本データ
    player: gameData.player,
    trainers: trainers.trainers,
    pokemon: pokemon.pokemon,
    expeditions: expeditions.expeditions,
    money: economy.money,
    transactions: economy.transactions,
    
    // システム情報
    systemInfo: gameData.systemInfo,
    isReady: gameData.isReady,
    isLoading: gameData.isLoading || trainers.isLoading || pokemon.isLoading || expeditions.isLoading,
    error: gameData.error || trainers.error || pokemon.error || expeditions.error,
    
    // 操作メソッド
    actions: {
      // トレーナー操作
      addTrainer: trainers.addTrainer,
      updateTrainer: trainers.updateTrainer,
      getAvailableTrainers: trainers.getAvailableTrainers,
      getTrainerById: trainers.getTrainerById,
      
      // ポケモン操作
      addPokemon: pokemon.addPokemon,
      updatePokemon: pokemon.updatePokemon,
      healPokemon: pokemon.healPokemon,
      healAllPokemon: pokemon.healAllPokemon,
      getHealthyPokemon: pokemon.getHealthyPokemon,
      getPokemonById: pokemon.getPokemonById,
      getPokemonStats: pokemon.getPokemonStats,
      
      // 派遣操作
      startExpedition: expeditions.startExpedition,
      completeExpedition: expeditions.completeExpedition,
      getActiveExpeditions: expeditions.getActiveExpeditions,
      getExpeditionById: expeditions.getExpeditionById,
      
      // 経済操作
      updateMoney: economy.updateMoney,
      addTransaction: economy.addTransaction,
      getRecentTransactions: economy.getRecentTransactions,
      getTotalIncome: economy.getTotalIncome,
      getTotalExpenses: economy.getTotalExpenses,
      
      // システム管理
      save: systemManagement.save,
      validate: systemManagement.validate,
      repair: systemManagement.repair,
      createBackup: systemManagement.createBackup,
      restoreBackup: systemManagement.restoreBackup,
      exportData: systemManagement.exportData,
      importData: systemManagement.importData
    },
    
    // 統計・分析
    stats: {
      totalTrainers: trainers.getTotalTrainers(),
      pokemonStats: pokemon.getPokemonStats(),
      activeExpeditions: expeditions.getActiveExpeditions().length,
      totalIncome: economy.getTotalIncome(),
      totalExpenses: economy.getTotalExpenses(),
      validation: systemManagement.validation
    }
  }
}

// リアルタイムデータフック
export { 
  useAutoRefresh,
  useRealtimeTrainers,
  useRealtimePokemon,
  useRealtimeExpeditions,
  useRealtimeSystemStatus,
  useRealtimeStatistics,
  useRealtimeEmitter,
  useRealtimeGameData
} from './useRealtimeData'

// エラーハンドリングフック
export {
  useErrorHandling,
  useErrorMonitor,
  useNetworkErrorMonitor
} from './useErrorHandling'

// 派遣システムフック
export {
  useExpeditionProgress,
  useExpeditionEvents,
  useExpeditionIntervention,
  useExpeditionCompletion,
  useExpeditionReports,
  useExpeditionSystem,
  useExpeditionAchievements
} from './useExpeditionSystem'

// 再エクスポート用のインポート
import {
  useUnifiedGameData,
  useUnifiedTrainers,
  useUnifiedPokemon,
  useUnifiedExpeditions,
  useUnifiedEconomy,
  useUnifiedSystemManagement
} from './useUnifiedData'