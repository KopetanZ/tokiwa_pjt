'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { DataSystem, initializeDataSystem, DataSystemConfig } from '@/lib/data-system'
import { UnifiedSaveData, ValidationResult, RepairResult } from '@/lib/unified-data/types'
import type { GameData, Trainer, Pokemon, Expedition } from '@/lib/game-state/types'
import { realtimeManager } from '@/lib/real-time/RealtimeManager'
import { dataSystemErrorHandler } from '@/lib/error-handling/DataSystemErrorHandler'
import { useErrorHandling } from '@/lib/hooks/useErrorHandling'

// データシステムコンテキストの型定義
export interface DataSystemContextValue {
  // システム状態
  dataSystem: DataSystem | null
  isInitialized: boolean
  isLoading: boolean
  error: string | null
  
  // データアクセス
  gameData: GameData | null
  trainers: Trainer[]
  pokemon: Pokemon[]
  expeditions: Expedition[]
  
  // システム統計
  stats: any
  validation: ValidationResult | null
  
  // 操作メソッド
  actions: {
    // 基本操作
    save: () => Promise<boolean>
    validate: () => Promise<ValidationResult>
    repair: () => Promise<RepairResult>
    
    // バックアップ
    createBackup: () => Promise<string | null>
    restoreBackup: (backupId: string) => Promise<boolean>
    getBackups: () => Promise<any[]>
    
    // 同期
    sync: () => Promise<any>
    
    // データ操作
    addTrainer: (trainer: Omit<Trainer, 'id'>) => Promise<string>
    updateTrainer: (id: string, updates: Partial<Trainer>) => Promise<boolean>
    addPokemon: (pokemon: Omit<Pokemon, 'id'>) => Promise<string>
    updatePokemon: (id: string, updates: Partial<Pokemon>) => Promise<boolean>
    healPokemon: (id: string) => Promise<boolean>
    healAllPokemon: () => Promise<number>
    startExpedition: (expedition: Omit<Expedition, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>
    completeExpedition: (expeditionId: string, result: Expedition['result']) => Promise<boolean>
    
    // システム管理
    reinitialize: (config?: Partial<DataSystemConfig>) => Promise<void>
    exportData: () => string
    importData: (jsonData: string) => Promise<boolean>
  }
}

// データシステムコンテキスト作成
const DataSystemContext = createContext<DataSystemContextValue | null>(null)

// プロバイダーのProps
export interface DataSystemProviderProps {
  children: React.ReactNode
  config?: Partial<DataSystemConfig>
  debug?: boolean
}

/**
 * データシステムプロバイダー
 * 統合データ管理システムをReactコンポーネントで利用可能にする
 */
export function DataSystemProvider({ children, config, debug = false }: DataSystemProviderProps) {
  // エラーハンドリング
  const errorHandling = useErrorHandling()
  
  // 状態管理
  const [dataSystem, setDataSystem] = useState<DataSystem | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // データ状態
  const [gameData, setGameData] = useState<GameData | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  
  // 更新タイマー
  const updateTimerRef = useRef<NodeJS.Timeout>()
  const validationTimerRef = useRef<NodeJS.Timeout>()
  
  /**
   * データシステム初期化
   */
  const initializeSystem = useCallback(async (initConfig?: Partial<DataSystemConfig>) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const systemConfig: Partial<DataSystemConfig> = {
        enableSync: false,
        enableValidation: true,
        debug: debug,
        unified: {
          autoSave: {
            enabled: true,
            interval: 5,
            onDataChange: true,
            onUserAction: false
          },
          backup: {
            enabled: true,
            maxBackups: 10,
            autoBackupInterval: 24,
            compressBackups: true
          },
          validation: {
            enabled: true,
            autoValidate: true,
            validationInterval: 10,
            autoRepair: false
          },
          performance: {
            enableCompression: true,
            enableCaching: true,
            cacheSize: 50,
            lazyLoading: true
          }
        },
        ...config,
        ...initConfig
      }
      
      const system = await initializeDataSystem(systemConfig)
      setDataSystem(system)
      setIsInitialized(true)
      
      // 初期データ読み込み
      const initialGameData = system.gameState.getData()
      setGameData(initialGameData)
      
      // システム統計取得
      const systemStats = system.getSystemStats()
      setStats(systemStats)
      
      // 自動検証実行
      if (systemConfig.enableValidation) {
        const validationResult = await system.validate()
        setValidation(validationResult)
        
        // リアルタイム検証イベント発行
        realtimeManager.emitValidation(
          validationResult.isValid, 
          validationResult.errors.length, 
          validationResult.warnings.length
        )
        
        if (debug && !validationResult.isValid) {
          console.warn('🔍 データ検証で問題を検出:', validationResult)
        }
      }
      
      // システム状態をリアルタイム更新
      realtimeManager.emitSystemStatus('ready', 'データシステム初期化完了')
      
      if (debug) {
        console.log('🚀 データシステム初期化完了:', systemStats)
      }
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      const errorMessage = error.message
      setError(errorMessage)
      realtimeManager.emitSystemStatus('error', errorMessage)
      
      // エラーハンドリングシステムでエラーを処理
      await errorHandling.handleError(error, { context: 'data_system_initialization' })
      
      console.error('❌ データシステム初期化エラー:', err)
    } finally {
      setIsLoading(false)
    }
  }, [config, debug])
  
  /**
   * データ更新監視
   */
  const startDataMonitoring = useCallback(() => {
    if (!dataSystem) return
    
    // ゲームデータの定期更新監視
    updateTimerRef.current = setInterval(() => {
      if (dataSystem && dataSystem.gameState) {
        const currentData = dataSystem.gameState.getData()
        setGameData(currentData)
        
        // 統計更新
        const currentStats = dataSystem.getSystemStats()
        setStats(currentStats)
      }
    }, 1000) // 1秒間隔
    
    // 検証の定期実行
    validationTimerRef.current = setInterval(async () => {
      if (dataSystem) {
        try {
          const validationResult = await dataSystem.validate()
          setValidation(validationResult)
          
          if (debug && !validationResult.isValid) {
            console.warn('🔍 定期検証で問題を検出:', validationResult.errors.length)
          }
        } catch (err) {
          console.error('❌ 定期検証エラー:', err)
        }
      }
    }, 10 * 60 * 1000) // 10分間隔
    
    if (debug) {
      console.log('📊 データ監視開始')
    }
  }, [dataSystem, debug])
  
  /**
   * データ監視停止
   */
  const stopDataMonitoring = useCallback(() => {
    if (updateTimerRef.current) {
      clearInterval(updateTimerRef.current)
      updateTimerRef.current = undefined
    }
    if (validationTimerRef.current) {
      clearInterval(validationTimerRef.current)
      validationTimerRef.current = undefined
    }
    
    if (debug) {
      console.log('🛑 データ監視停止')
    }
  }, [debug])
  
  // 初期化処理
  useEffect(() => {
    initializeSystem()
    
    return () => {
      stopDataMonitoring()
      if (dataSystem) {
        dataSystem.destroy()
      }
    }
  }, []) // 依存配列は空に保つ
  
  // データ監視開始
  useEffect(() => {
    if (isInitialized && dataSystem) {
      startDataMonitoring()
      return stopDataMonitoring
    }
  }, [isInitialized, dataSystem, startDataMonitoring, stopDataMonitoring])
  
  // 計算されたデータ
  const trainers = useMemo(() => gameData?.trainers || [], [gameData])
  const pokemon = useMemo(() => gameData?.pokemon || [], [gameData])
  const expeditions = useMemo(() => gameData?.expeditions || [], [gameData])
  
  // アクション定義
  const actions = useMemo(() => ({
    // 基本操作
    save: async () => {
      if (!dataSystem) return false
      try {
        return await dataSystem.save()
      } catch (err) {
        console.error('❌ 保存エラー:', err)
        return false
      }
    },
    
    validate: async () => {
      if (!dataSystem) {
        throw new Error('データシステムが初期化されていません')
      }
      try {
        const result = await dataSystem.validate()
        setValidation(result)
        return result
      } catch (err) {
        console.error('❌ 検証エラー:', err)
        throw err
      }
    },
    
    repair: async () => {
      if (!dataSystem) {
        throw new Error('データシステムが初期化されていません')
      }
      try {
        const result = await dataSystem.repair()
        
        // 修復後にデータを再読み込み
        const updatedData = dataSystem.gameState.getData()
        setGameData(updatedData)
        
        // 検証を再実行
        const validationResult = await dataSystem.validate()
        setValidation(validationResult)
        
        return result
      } catch (err) {
        console.error('❌ 修復エラー:', err)
        throw err
      }
    },
    
    // バックアップ操作
    createBackup: async () => {
      if (!dataSystem) return null
      try {
        return await dataSystem.createBackup()
      } catch (err) {
        console.error('❌ バックアップ作成エラー:', err)
        return null
      }
    },
    
    restoreBackup: async (backupId: string) => {
      if (!dataSystem) return false
      try {
        const result = await dataSystem.restoreBackup(backupId)
        
        if (result) {
          // 復元後にデータを再読み込み
          const restoredData = dataSystem.gameState.getData()
          setGameData(restoredData)
        }
        
        return result
      } catch (err) {
        console.error('❌ バックアップ復元エラー:', err)
        return false
      }
    },
    
    getBackups: async () => {
      if (!dataSystem) return []
      try {
        return await dataSystem.getBackups()
      } catch (err) {
        console.error('❌ バックアップ一覧取得エラー:', err)
        return []
      }
    },
    
    // 同期
    sync: async () => {
      if (!dataSystem) {
        throw new Error('データシステムが初期化されていません')
      }
      try {
        return await dataSystem.sync()
      } catch (err) {
        console.error('❌ 同期エラー:', err)
        throw err
      }
    },
    
    // データ操作
    addTrainer: async (trainer: Omit<Trainer, 'id'>) => {
      if (!dataSystem) {
        throw new Error('データシステムが初期化されていません')
      }
      try {
        const id = dataSystem.gameState.addTrainer(trainer)
        
        // データ更新を即座に反映
        const updatedData = dataSystem.gameState.getData()
        setGameData(updatedData)
        
        // リアルタイムイベント発行
        const newTrainer = updatedData.trainers.find((t: any) => t.id === id)
        realtimeManager.emitDataChange({
          category: 'trainers',
          action: 'create',
          entityId: id,
          data: newTrainer,
          source: 'user_action'
        })
        
        return id
      } catch (err) {
        console.error('❌ トレーナー追加エラー:', err)
        throw err
      }
    },
    
    updateTrainer: async (id: string, updates: Partial<Trainer>) => {
      if (!dataSystem) {
        throw new Error('データシステムが初期化されていません')
      }
      try {
        const previousTrainer = dataSystem.gameState.getData().trainers.find((t: any) => t.id === id)
        const result = dataSystem.gameState.updateTrainer(id, updates)
        
        if (result) {
          const updatedData = dataSystem.gameState.getData()
          setGameData(updatedData)
          
          const updatedTrainer = updatedData.trainers.find((t: any) => t.id === id)
          realtimeManager.emitDataChange({
            category: 'trainers',
            action: 'update',
            entityId: id,
            data: updatedTrainer,
            previousData: previousTrainer,
            source: 'user_action'
          })
        }
        
        return result
      } catch (err) {
        console.error('❌ トレーナー更新エラー:', err)
        throw err
      }
    },
    
    addPokemon: async (pokemon: Omit<Pokemon, 'id'>) => {
      if (!dataSystem) {
        throw new Error('データシステムが初期化されていません')
      }
      try {
        const id = dataSystem.gameState.addPokemon(pokemon)
        
        const updatedData = dataSystem.gameState.getData()
        setGameData(updatedData)
        
        return id
      } catch (err) {
        console.error('❌ ポケモン追加エラー:', err)
        throw err
      }
    },
    
    updatePokemon: async (id: string, updates: Partial<Pokemon>) => {
      if (!dataSystem) {
        throw new Error('データシステムが初期化されていません')
      }
      try {
        const result = dataSystem.gameState.updatePokemon(id, updates)
        
        if (result) {
          const updatedData = dataSystem.gameState.getData()
          setGameData(updatedData)
        }
        
        return result
      } catch (err) {
        console.error('❌ ポケモン更新エラー:', err)
        throw err
      }
    },
    
    healPokemon: async (id: string) => {
      if (!dataSystem) {
        throw new Error('データシステムが初期化されていません')
      }
      try {
        const result = dataSystem.gameState.healPokemon(id)
        
        if (result) {
          const updatedData = dataSystem.gameState.getData()
          setGameData(updatedData)
        }
        
        return result
      } catch (err) {
        console.error('❌ ポケモン回復エラー:', err)
        throw err
      }
    },
    
    healAllPokemon: async () => {
      if (!dataSystem) {
        throw new Error('データシステムが初期化されていません')
      }
      try {
        const count = dataSystem.gameState.healAllPokemon()
        
        if (count > 0) {
          const updatedData = dataSystem.gameState.getData()
          setGameData(updatedData)
        }
        
        return count
      } catch (err) {
        console.error('❌ 全ポケモン回復エラー:', err)
        throw err
      }
    },
    
    startExpedition: async (expedition: Omit<Expedition, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!dataSystem) {
        throw new Error('データシステムが初期化されていません')
      }
      try {
        const id = dataSystem.gameState.startExpedition(expedition)
        
        const updatedData = dataSystem.gameState.getData()
        setGameData(updatedData)
        
        return id
      } catch (err) {
        console.error('❌ 派遣開始エラー:', err)
        throw err
      }
    },
    
    completeExpedition: async (expeditionId: string, result: Expedition['result']) => {
      if (!dataSystem) {
        throw new Error('データシステムが初期化されていません')
      }
      try {
        const success = dataSystem.gameState.completeExpedition(expeditionId, result)
        
        if (success) {
          const updatedData = dataSystem.gameState.getData()
          setGameData(updatedData)
        }
        
        return success
      } catch (err) {
        console.error('❌ 派遣完了エラー:', err)
        throw err
      }
    },
    
    // システム管理
    reinitialize: async (newConfig?: Partial<DataSystemConfig>) => {
      stopDataMonitoring()
      if (dataSystem) {
        dataSystem.destroy()
      }
      setDataSystem(null)
      setIsInitialized(false)
      await initializeSystem(newConfig)
    },
    
    exportData: () => {
      if (!dataSystem) {
        throw new Error('データシステムが初期化されていません')
      }
      return dataSystem.gameState.exportData()
    },
    
    importData: async (jsonData: string) => {
      if (!dataSystem) {
        throw new Error('データシステムが初期化されていません')
      }
      try {
        const result = dataSystem.gameState.importData(jsonData)
        
        if (result) {
          const updatedData = dataSystem.gameState.getData()
          setGameData(updatedData)
        }
        
        return result
      } catch (err) {
        console.error('❌ データインポートエラー:', err)
        throw err
      }
    }
  }), [dataSystem, stopDataMonitoring, initializeSystem])
  
  // コンテキスト値
  const contextValue: DataSystemContextValue = {
    dataSystem,
    isInitialized,
    isLoading,
    error,
    gameData,
    trainers,
    pokemon,
    expeditions,
    stats,
    validation,
    actions
  }
  
  return (
    <DataSystemContext.Provider value={contextValue}>
      {children}
    </DataSystemContext.Provider>
  )
}

/**
 * データシステムコンテキストフック
 */
export function useDataSystem(): DataSystemContextValue {
  const context = useContext(DataSystemContext)
  if (!context) {
    throw new Error('useDataSystem must be used within a DataSystemProvider')
  }
  return context
}

/**
 * ゲームデータ専用フック
 */
export function useGameData() {
  const { gameData } = useDataSystem()
  return gameData
}

/**
 * トレーナー専用フック
 */
export function useTrainers() {
  const { trainers, actions } = useDataSystem()
  return {
    trainers,
    addTrainer: actions.addTrainer,
    updateTrainer: actions.updateTrainer
  }
}

/**
 * ポケモン専用フック
 */
export function usePokemon() {
  const { pokemon, actions } = useDataSystem()
  return {
    pokemon,
    addPokemon: actions.addPokemon,
    updatePokemon: actions.updatePokemon,
    healPokemon: actions.healPokemon,
    healAllPokemon: actions.healAllPokemon
  }
}

/**
 * 派遣専用フック
 */
export function useExpeditions() {
  const { expeditions, actions } = useDataSystem()
  return {
    expeditions,
    startExpedition: actions.startExpedition,
    completeExpedition: actions.completeExpedition
  }
}

/**
 * システム管理専用フック
 */
export function useDataSystemManagement() {
  const { dataSystem, isInitialized, isLoading, error, stats, validation, actions } = useDataSystem()
  return {
    dataSystem,
    isInitialized,
    isLoading,
    error,
    stats,
    validation,
    save: actions.save,
    validate: actions.validate,
    repair: actions.repair,
    createBackup: actions.createBackup,
    restoreBackup: actions.restoreBackup,
    getBackups: actions.getBackups,
    sync: actions.sync,
    reinitialize: actions.reinitialize,
    exportData: actions.exportData,
    importData: actions.importData
  }
}