import { useState, useEffect, useCallback, useMemo } from 'react'
import { GameData, Trainer, Pokemon, Expedition } from './types'
import { getGameStateManager, GameStateManager } from './GameStateManager'

/**
 * ゲーム状態管理用Reactフック
 */

/**
 * メインのゲーム状態フック
 */
export const useGameState = (userId?: string) => {
  const [gameData, setGameData] = useState<GameData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const gameManager = useMemo(() => getGameStateManager(userId), [userId])
  
  useEffect(() => {
    // 初期データ読み込み
    setGameData(gameManager.getData())
    setIsLoading(false)
    
    // リアルタイム更新リスナー
    const unsubscribe = gameManager.addListener((data) => {
      setGameData({ ...data }) // 新しいオブジェクトとして設定
    })
    
    return unsubscribe
  }, [gameManager])
  
  // アクション関数
  const actions = useMemo(() => ({
    // トレーナー関連
    addTrainer: (trainer: Omit<Trainer, 'id'>) => gameManager.addTrainer(trainer),
    updateTrainer: (id: string, updates: Partial<Trainer>) => gameManager.updateTrainer(id, updates),
    
    // ポケモン関連
    addPokemon: (pokemon: Omit<Pokemon, 'id'>) => gameManager.addPokemon(pokemon),
    
    // 派遣関連
    startExpedition: (expedition: Omit<Expedition, 'id' | 'createdAt' | 'updatedAt'>) => 
      gameManager.startExpedition(expedition),
    completeExpedition: (expeditionId: string, result: Expedition['result']) => 
      gameManager.completeExpedition(expeditionId, result),
    
    // 経済関連
    updateMoney: (change: number) => gameManager.updatePlayerMoney(change),
    addTransaction: (transaction: Parameters<GameStateManager['addTransaction']>[0]) => 
      gameManager.addTransaction(transaction),
    
    // データ管理
    saveGame: () => gameManager.saveToLocal(),
    exportData: () => gameManager.exportData(),
    importData: (data: string) => gameManager.importData(data)
  }), [gameManager])
  
  return {
    gameData,
    isLoading,
    actions,
    manager: gameManager
  }
}

/**
 * トレーナー専用フック
 */
export const useTrainers = (userId?: string) => {
  const { gameData, actions } = useGameState(userId)
  
  const trainers = useMemo(() => gameData?.trainers || [], [gameData?.trainers])
  
  const computed = useMemo(() => ({
    available: trainers.filter(t => t.status === 'available'),
    onExpedition: trainers.filter(t => t.status === 'on_expedition'),
    training: trainers.filter(t => t.status === 'training'),
    total: trainers.length,
    totalSalary: trainers.reduce((sum, t) => sum + t.salary, 0)
  }), [trainers])
  
  const trainerActions = useMemo(() => ({
    hire: actions.addTrainer,
    update: actions.updateTrainer,
    getById: (id: string) => trainers.find(t => t.id === id)
  }), [actions, trainers])
  
  return {
    trainers,
    ...computed,
    actions: trainerActions
  }
}

/**
 * ポケモン専用フック
 */
export const usePokemon = (userId?: string) => {
  const { gameData, actions } = useGameState(userId)
  
  const pokemon = useMemo(() => gameData?.pokemon || [], [gameData?.pokemon])
  
  const computed = useMemo(() => ({
    healthy: pokemon.filter(p => p.status === 'healthy'),
    injured: pokemon.filter(p => p.status === 'injured'),
    training: pokemon.filter(p => p.status === 'training'),
    total: pokemon.length,
    averageLevel: pokemon.length > 0 
      ? pokemon.reduce((sum, p) => sum + p.level, 0) / pokemon.length 
      : 0
  }), [pokemon])
  
  const pokemonActions = useMemo(() => ({
    add: actions.addPokemon,
    getById: (id: string) => pokemon.find(p => p.id === id),
    getBySpecies: (speciesId: number) => pokemon.filter(p => p.speciesId === speciesId)
  }), [actions, pokemon])
  
  return {
    pokemon,
    ...computed,
    actions: pokemonActions
  }
}

/**
 * 派遣専用フック
 */
export const useExpeditions = (userId?: string) => {
  const { gameData, actions } = useGameState(userId)
  
  const expeditions = useMemo(() => gameData?.expeditions || [], [gameData?.expeditions])
  
  const computed = useMemo(() => {
    const active = expeditions.filter(e => e.status === 'active')
    const completed = expeditions.filter(e => e.status === 'completed')
    const failed = expeditions.filter(e => e.status === 'failed')
    
    return {
      active,
      completed,
      failed,
      total: expeditions.length,
      successRate: expeditions.length > 0 
        ? (completed.length / (completed.length + failed.length)) * 100 
        : 0,
      needingIntervention: active.filter(e => 
        e.events.some(event => !event.resolved && event.choices)
      )
    }
  }, [expeditions])
  
  const expeditionActions = useMemo(() => ({
    start: actions.startExpedition,
    complete: actions.completeExpedition,
    getById: (id: string) => expeditions.find(e => e.id === id),
    getByTrainer: (trainerId: string) => expeditions.filter(e => e.trainerId === trainerId)
  }), [actions, expeditions])
  
  return {
    expeditions,
    ...computed,
    actions: expeditionActions
  }
}

/**
 * 経済状況専用フック
 */
export const useEconomy = (userId?: string) => {
  const { gameData, actions } = useGameState(userId)
  
  const player = useMemo(() => gameData?.player, [gameData?.player])
  const transactions = useMemo(() => gameData?.transactions || [], [gameData?.transactions])
  
  const computed = useMemo(() => {
    const recentTransactions = transactions
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20)
    
    const todayTransactions = transactions.filter(t => {
      const today = new Date().toDateString()
      return new Date(t.timestamp).toDateString() === today
    })
    
    const todayIncome = todayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const todayExpenses = todayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    return {
      money: player?.money || 0,
      todayIncome,
      todayExpenses,
      todayNet: todayIncome - todayExpenses,
      recentTransactions,
      totalTransactions: transactions.length
    }
  }, [player, transactions])
  
  const economyActions = useMemo(() => ({
    updateMoney: actions.updateMoney,
    addTransaction: actions.addTransaction,
    canAfford: (amount: number) => (player?.money || 0) >= amount
  }), [actions, player])
  
  return {
    player,
    transactions,
    ...computed,
    actions: economyActions
  }
}

/**
 * ゲーム統計フック
 */
export const useGameStatistics = (userId?: string) => {
  const { manager } = useGameState(userId)
  const [stats, setStats] = useState<any>(null)
  
  const refreshStats = useCallback(() => {
    if (manager) {
      setStats(manager.getStatistics())
    }
  }, [manager])
  
  useEffect(() => {
    refreshStats()
    
    // 定期的に統計を更新
    const interval = setInterval(refreshStats, 60000) // 1分毎
    
    return () => clearInterval(interval)
  }, [refreshStats])
  
  return {
    statistics: stats,
    refresh: refreshStats
  }
}

/**
 * デバッグ用フック
 */
export const useGameDebug = (userId?: string) => {
  const { gameData, actions, manager } = useGameState(userId)
  
  const debugActions = useMemo(() => ({
    exportData: actions.exportData,
    importData: actions.importData,
    getStatistics: () => manager.getStatistics(),
    addTestTrainer: () => actions.addTrainer({
      name: `テストトレーナー${Date.now()}`,
      job: 'ranger',
      level: 1,
      experience: 0,
      nextLevelExp: 1000,
      status: 'available',
      skills: {
        capture: 50,
        exploration: 50,
        battle: 50,
        research: 50,
        healing: 50
      },
      personality: {
        courage: 0,
        caution: 0,
        curiosity: 0,
        teamwork: 0,
        independence: 0,
        compliance: 0
      },
      salary: 3000,
      totalEarned: 0,
      totalExpeditions: 0,
      successfulExpeditions: 0,
      pokemonCaught: 0,
      trustLevel: 50,
      favoriteLocations: [],
      lastActive: new Date().toISOString(),
      hiredDate: new Date().toISOString()
    }),
    addTestMoney: () => actions.updateMoney(10000),
    clearData: () => {
      localStorage.removeItem('tokiwa-game-state')
      window.location.reload()
    }
  }), [actions, manager])
  
  return {
    gameData,
    actions: debugActions,
    dataSize: gameData ? JSON.stringify(gameData).length : 0
  }
}