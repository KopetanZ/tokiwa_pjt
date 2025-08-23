/**
 * 統合データアクセスフック
 * コンポーネントからゲームデータにアクセスするための統一されたインターフェース
 */

'use client'

import { useMemo, useCallback } from 'react'
import { useGame } from '@/contexts/GameContext'
import { 
  useDataSystem, 
  useTrainers as useDataSystemTrainers,
  usePokemon as useDataSystemPokemon,
  useExpeditions as useDataSystemExpeditions,
  useDataSystemManagement 
} from '@/components/providers/DataSystemProvider'
import type { Trainer, Pokemon, Expedition, Transaction } from '@/lib/game-state/types'

/**
 * 統合されたゲームデータアクセスフック
 * GameContextと統合データシステムの両方から最適なデータソースを選択
 */
export function useUnifiedGameData() {
  const gameContext = useGame()
  const dataSystem = useDataSystem()
  
  // 統合データシステムが利用可能かチェック
  const isUnifiedAvailable = useMemo(() => {
    return dataSystem.isInitialized && !dataSystem.isLoading && !dataSystem.error
  }, [dataSystem.isInitialized, dataSystem.isLoading, dataSystem.error])
  
  // プレイヤーデータ
  const player = useMemo(() => {
    if (isUnifiedAvailable && dataSystem.gameData?.player) {
      return dataSystem.gameData.player
    }
    
    // フォールバック: GameContextから取得
    const profile = gameContext.state.gameData.profile
    return {
      name: profile?.guest_name || 'プレイヤー',
      schoolName: profile?.school_name || 'ポケモン学校',
      money: profile?.current_money || 50000,
      reputation: profile?.total_reputation || 0,
      level: 1,
      experience: 0,
      nextLevelExp: 1000
    }
  }, [isUnifiedAvailable, dataSystem.gameData, gameContext.state.gameData.profile])
  
  // システム情報
  const systemInfo = useMemo(() => ({
    isUsingUnifiedSystem: isUnifiedAvailable,
    fallbackToGameContext: !isUnifiedAvailable,
    dataSystemStatus: {
      initialized: dataSystem.isInitialized,
      loading: dataSystem.isLoading,
      error: dataSystem.error
    },
    stats: dataSystem.stats,
    validation: dataSystem.validation
  }), [isUnifiedAvailable, dataSystem])
  
  return {
    player,
    systemInfo,
    
    // データソース情報
    isReady: isUnifiedAvailable || gameContext.state.isAuthenticated,
    isLoading: dataSystem.isLoading || gameContext.state.isLoading,
    error: dataSystem.error || gameContext.state.errors?.[0]?.message
  }
}

/**
 * 統合トレーナーデータフック
 */
export function useUnifiedTrainers() {
  const gameContext = useGame()
  const dataSystemTrainers = useDataSystemTrainers()
  const { isUnifiedAvailable } = useUnifiedSystemStatus()
  
  const trainers = useMemo(() => {
    if (isUnifiedAvailable) {
      return dataSystemTrainers.trainers
    }
    return gameContext.state.gameData.trainers || []
  }, [isUnifiedAvailable, dataSystemTrainers.trainers, gameContext.state.gameData.trainers])
  
  const actions = useMemo(() => ({
    addTrainer: isUnifiedAvailable 
      ? dataSystemTrainers.addTrainer 
      : async (trainer: Omit<Trainer, 'id'>) => {
          throw new Error('統合データシステムが利用できません')
        },
    updateTrainer: isUnifiedAvailable 
      ? dataSystemTrainers.updateTrainer 
      : async (id: string, updates: Partial<Trainer>) => {
          throw new Error('統合データシステムが利用できません')
        },
    
    // 便利メソッド
    getAvailableTrainers: () => {
      return trainers.filter(t => t.status === 'available')
    },
    
    getTrainerById: (id: string) => {
      return trainers.find(t => t.id === id)
    },
    
    getTrainersByJob: (job: string) => {
      return trainers.filter(t => t.job === job)
    },
    
    getTotalTrainers: () => {
      return trainers.length
    }
  }), [isUnifiedAvailable, dataSystemTrainers, trainers])
  
  return {
    trainers,
    ...actions,
    isLoading: false, // TODO: 実装
    error: null // TODO: 実装
  }
}

/**
 * 統合ポケモンデータフック
 */
export function useUnifiedPokemon() {
  const gameContext = useGame()
  const dataSystemPokemon = useDataSystemPokemon()
  const { isUnifiedAvailable } = useUnifiedSystemStatus()
  
  const pokemon = useMemo(() => {
    if (isUnifiedAvailable) {
      return dataSystemPokemon.pokemon
    }
    return gameContext.state.gameData.pokemon || []
  }, [isUnifiedAvailable, dataSystemPokemon.pokemon, gameContext.state.gameData.pokemon])
  
  const actions = useMemo(() => ({
    addPokemon: isUnifiedAvailable 
      ? dataSystemPokemon.addPokemon 
      : async (pokemonData: Omit<Pokemon, 'id'>) => {
          throw new Error('統合データシステムが利用できません')
        },
    updatePokemon: isUnifiedAvailable 
      ? dataSystemPokemon.updatePokemon 
      : async (id: string, updates: Partial<Pokemon>) => {
          throw new Error('統合データシステムが利用できません')
        },
    healPokemon: isUnifiedAvailable 
      ? dataSystemPokemon.healPokemon 
      : async (id: string) => {
          throw new Error('統合データシステムが利用できません')
        },
    healAllPokemon: isUnifiedAvailable 
      ? dataSystemPokemon.healAllPokemon 
      : async () => {
          throw new Error('統合データシステムが利用できません')
        },
    
    // 便利メソッド
    getHealthyPokemon: () => {
      return pokemon.filter(p => p.status === 'healthy')
    },
    
    getInjuredPokemon: () => {
      return pokemon.filter(p => p.status === 'injured' || p.status === 'sick')
    },
    
    getPokemonById: (id: string) => {
      return pokemon.find(p => p.id === id)
    },
    
    getPokemonBySpecies: (speciesId: number) => {
      return pokemon.filter(p => p.speciesId === speciesId)
    },
    
    getPokemonStats: () => {
      return {
        total: pokemon.length,
        healthy: pokemon.filter(p => p.status === 'healthy').length,
        injured: pokemon.filter(p => p.status === 'injured').length,
        sick: pokemon.filter(p => p.status === 'sick').length,
        training: pokemon.filter(p => p.status === 'training').length
      }
    }
  }), [isUnifiedAvailable, dataSystemPokemon, pokemon])
  
  return {
    pokemon,
    ...actions,
    isLoading: false,
    error: null
  }
}

/**
 * 統合派遣データフック
 */
export function useUnifiedExpeditions() {
  const gameContext = useGame()
  const dataSystemExpeditions = useDataSystemExpeditions()
  const { isUnifiedAvailable } = useUnifiedSystemStatus()
  
  const expeditions = useMemo(() => {
    if (isUnifiedAvailable) {
      return dataSystemExpeditions.expeditions
    }
    return gameContext.state.gameData.expeditions || []
  }, [isUnifiedAvailable, dataSystemExpeditions.expeditions, gameContext.state.gameData.expeditions])
  
  const actions = useMemo(() => ({
    startExpedition: isUnifiedAvailable 
      ? dataSystemExpeditions.startExpedition 
      : async (expeditionData: Omit<Expedition, 'id' | 'createdAt' | 'updatedAt'>) => {
          throw new Error('統合データシステムが利用できません')
        },
    completeExpedition: isUnifiedAvailable 
      ? dataSystemExpeditions.completeExpedition 
      : async (expeditionId: string, result: Expedition['result']) => {
          throw new Error('統合データシステムが利用できません')
        },
    
    // 便利メソッド
    getActiveExpeditions: () => {
      return expeditions.filter(e => e.status === 'active')
    },
    
    getCompletedExpeditions: () => {
      return expeditions.filter(e => e.status === 'completed')
    },
    
    getExpeditionById: (id: string) => {
      return expeditions.find(e => e.id === id)
    },
    
    getExpeditionsByTrainer: (trainerId: string) => {
      return expeditions.filter(e => e.trainerId === trainerId)
    },
    
    getExpeditionsByLocation: (locationId: number) => {
      return expeditions.filter(e => e.locationId === locationId)
    }
  }), [isUnifiedAvailable, dataSystemExpeditions, expeditions])
  
  return {
    expeditions,
    ...actions,
    isLoading: false,
    error: null
  }
}

/**
 * 統合経済データフック
 */
export function useUnifiedEconomy() {
  const gameContext = useGame()
  const dataSystem = useDataSystem()
  const { isUnifiedAvailable } = useUnifiedSystemStatus()
  
  const economyData = useMemo(() => {
    if (isUnifiedAvailable && dataSystem.gameData) {
      return {
        money: dataSystem.gameData.player?.money || 0,
        transactions: dataSystem.gameData.transactions || []
      }
    }
    
    // フォールバック
    return {
      money: gameContext.state.gameData.profile?.current_money || 0,
      transactions: gameContext.state.gameData.transactions || []
    }
  }, [isUnifiedAvailable, dataSystem.gameData, gameContext.state.gameData])
  
  const actions = useMemo(() => ({
    // TODO: 経済操作のアクションを実装
    updateMoney: async (change: number) => {
      if (!isUnifiedAvailable) {
        throw new Error('統合データシステムが利用できません')
      }
      // 実装予定
    },
    
    addTransaction: async (transaction: Omit<Transaction, 'id'>) => {
      if (!isUnifiedAvailable) {
        throw new Error('統合データシステムが利用できません')
      }
      // 実装予定
    },
    
    // 便利メソッド
    getRecentTransactions: (limit: number = 10) => {
      return economyData.transactions
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)
    },
    
    getIncomeTransactions: () => {
      return economyData.transactions.filter(t => t.type === 'income')
    },
    
    getExpenseTransactions: () => {
      return economyData.transactions.filter(t => t.type === 'expense')
    },
    
    getTotalIncome: () => {
      return economyData.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
    },
    
    getTotalExpenses: () => {
      return economyData.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
    }
  }), [isUnifiedAvailable, economyData])
  
  return {
    money: economyData.money,
    transactions: economyData.transactions,
    ...actions,
    isLoading: false,
    error: null
  }
}

/**
 * システム管理フック
 */
export function useUnifiedSystemManagement() {
  const dataSystemManagement = useDataSystemManagement()
  const { isUnifiedAvailable } = useUnifiedSystemStatus()
  
  const actions = useMemo(() => ({
    save: isUnifiedAvailable ? dataSystemManagement.save : async () => false,
    validate: isUnifiedAvailable ? dataSystemManagement.validate : async () => ({ isValid: false, errors: [], warnings: [], repairSuggestions: [], validationTime: 0 }),
    repair: isUnifiedAvailable ? dataSystemManagement.repair : async () => ({ success: false, fixedErrors: 0, remainingErrors: [], changes: [] }),
    createBackup: isUnifiedAvailable ? dataSystemManagement.createBackup : async () => null,
    restoreBackup: isUnifiedAvailable ? dataSystemManagement.restoreBackup : async () => false,
    getBackups: isUnifiedAvailable ? dataSystemManagement.getBackups : async () => [],
    exportData: isUnifiedAvailable ? dataSystemManagement.exportData : () => '{}',
    importData: isUnifiedAvailable ? dataSystemManagement.importData : async () => false
  }), [isUnifiedAvailable, dataSystemManagement])
  
  return {
    isAvailable: isUnifiedAvailable,
    stats: dataSystemManagement.stats,
    validation: dataSystemManagement.validation,
    ...actions
  }
}

/**
 * システム状態チェック用の内部フック
 */
function useUnifiedSystemStatus() {
  const dataSystem = useDataSystem()
  
  const isUnifiedAvailable = useMemo(() => {
    return dataSystem.isInitialized && !dataSystem.isLoading && !dataSystem.error
  }, [dataSystem.isInitialized, dataSystem.isLoading, dataSystem.error])
  
  return { isUnifiedAvailable }
}