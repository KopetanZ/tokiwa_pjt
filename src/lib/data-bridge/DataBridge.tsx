/**
 * データブリッジ
 * 既存のGameContextと新しい統合データシステム間の橋渡し役
 */

'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useGame } from '@/contexts/GameContext'
import { useDataSystem, useDataSystemManagement } from '@/components/providers/DataSystemProvider'

/**
 * データブリッジフック
 * GameContextと統合データシステム間でデータを同期
 */
export function useDataBridge() {
  const gameContext = useGame()
  const dataSystem = useDataSystem()
  const dataSystemManagement = useDataSystemManagement()
  
  const syncInProgressRef = useRef(false)
  const lastSyncRef = useRef<string>('')
  
  /**
   * GameContextから統合データシステムにデータを同期
   */
  const syncFromGameContext = useCallback(async () => {
    if (syncInProgressRef.current || !dataSystem.gameData || !dataSystem.isInitialized) {
      return
    }
    
    try {
      syncInProgressRef.current = true
      
      // GameContextのデータを取得
      const gameContextData = gameContext.state.gameData
      
      // データが有効かチェック
      if (!gameContextData.profile) {
        return
      }
      
      // 統合データシステムの現在のデータと比較
      const currentData = dataSystem.gameData
      const currentDataHash = JSON.stringify(currentData)
      
      // 変更がない場合はスキップ
      if (lastSyncRef.current === currentDataHash) {
        return
      }
      
      // 必要に応じてデータを統合データシステムに反映
      // （この段階では読み取り専用として動作）
      
      console.log('🔄 データブリッジ: GameContext → 統合データシステム同期完了')
      lastSyncRef.current = currentDataHash
      
    } catch (error) {
      console.error('❌ データブリッジ同期エラー:', error)
    } finally {
      syncInProgressRef.current = false
    }
  }, [gameContext.state.gameData, dataSystem.gameData, dataSystem.isInitialized])
  
  /**
   * 統合データシステムからGameContextにデータを同期
   */
  const syncToGameContext = useCallback(async () => {
    if (syncInProgressRef.current || !dataSystem.gameData || !dataSystem.isInitialized) {
      return
    }
    
    try {
      syncInProgressRef.current = true
      
      const unifiedData = dataSystem.gameData
      
      // 統合データシステムのデータをGameContextの形式に変換
      const gameContextFormat = {
        profile: {
          id: unifiedData.userId || 'unified-user',
          guest_name: unifiedData.player?.name || 'プレイヤー',
          school_name: unifiedData.player?.schoolName || 'ポケモン学校',
          current_money: unifiedData.player?.money || 50000,
          total_reputation: unifiedData.player?.reputation || 0,
          ui_theme: 'retro',
          settings: {},
          created_at: unifiedData.createdAt || new Date().toISOString(),
          updated_at: unifiedData.lastSaved || new Date().toISOString()
        },
        pokemon: dataSystem.pokemon,
        trainers: dataSystem.trainers,
        expeditions: dataSystem.expeditions,
        facilities: unifiedData.facilities || [],
        transactions: unifiedData.transactions || [],
        progress: null,
        analysis: []
      }
      
      // GameContextを更新
      gameContext.dispatch({
        type: 'UPDATE_GAME_DATA',
        payload: gameContextFormat
      })
      
      console.log('🔄 データブリッジ: 統合データシステム → GameContext同期完了')
      
    } catch (error) {
      console.error('❌ データブリッジ逆同期エラー:', error)
    } finally {
      syncInProgressRef.current = false
    }
  }, [dataSystem.gameData, dataSystem.trainers, dataSystem.pokemon, dataSystem.expeditions, dataSystem.isInitialized, gameContext.dispatch])
  
  /**
   * 双方向同期
   */
  const bidirectionalSync = useCallback(async () => {
    // まず統合データシステムからGameContextに同期（統合データシステムを真実の源とする）
    await syncToGameContext()
  }, [syncToGameContext])
  
  /**
   * データ統合の開始
   */
  const startDataIntegration = useCallback(() => {
    if (!dataSystem.isInitialized) {
      return
    }
    
    console.log('🔗 データブリッジ: 統合開始')
    
    // 初回同期実行
    bidirectionalSync()
    
    // 定期同期の設定（必要に応じて）
    const syncInterval = setInterval(bidirectionalSync, 5000) // 5秒間隔
    
    return () => {
      clearInterval(syncInterval)
      console.log('🔗 データブリッジ: 統合終了')
    }
  }, [dataSystem.isInitialized, bidirectionalSync])
  
  return {
    syncFromGameContext,
    syncToGameContext,
    bidirectionalSync,
    startDataIntegration,
    isReady: dataSystem.isInitialized && !dataSystem.isLoading
  }
}

/**
 * データブリッジコンポーネント
 * プロバイダー内で自動的にデータ同期を処理
 */
export function DataBridge() {
  const dataBridge = useDataBridge()
  const { isInitialized, error } = useDataSystemManagement()
  
  // データシステムが初期化されたら統合開始
  useEffect(() => {
    if (isInitialized && !error) {
      return dataBridge.startDataIntegration()
    }
  }, [isInitialized, error, dataBridge.startDataIntegration])
  
  // エラー状態の監視
  useEffect(() => {
    if (error) {
      console.error('🔗 データブリッジ: システムエラー検出:', error)
    }
  }, [error])
  
  // このコンポーネントはUIを持たない
  return null
}

/**
 * 統合データアクセスフック
 * GameContextと統合データシステムの両方からデータにアクセス可能
 */
export function useUnifiedGameData() {
  const gameContext = useGame()
  const dataSystem = useDataSystem()
  const dataBridge = useDataBridge()
  
  // 統合データシステムが利用可能な場合はそれを優先
  const useUnified = dataSystem.isInitialized && !dataSystem.isLoading && dataBridge.isReady
  
  return {
    // データアクセス
    trainers: useUnified ? dataSystem.trainers : gameContext.state.gameData.trainers,
    pokemon: useUnified ? dataSystem.pokemon : gameContext.state.gameData.pokemon,
    expeditions: useUnified ? dataSystem.expeditions : gameContext.state.gameData.expeditions,
    player: useUnified ? dataSystem.gameData?.player : {
      name: gameContext.state.gameData.profile?.guest_name || 'プレイヤー',
      schoolName: gameContext.state.gameData.profile?.school_name || 'ポケモン学校',
      money: gameContext.state.gameData.profile?.current_money || 50000,
      reputation: gameContext.state.gameData.profile?.total_reputation || 0,
      level: 1,
      experience: 0,
      nextLevelExp: 1000
    },
    
    // システム情報
    isUsingUnifiedSystem: useUnified,
    unifiedSystemStatus: {
      initialized: dataSystem.isInitialized,
      loading: dataSystem.isLoading,
      error: dataSystem.error
    },
    
    // 操作メソッド（統合データシステムが利用可能な場合はそちらを使用）
    actions: useUnified ? dataSystem.actions : {
      addTrainer: async (trainer: any) => {
        throw new Error('統合データシステムが利用できません')
      },
      updateTrainer: async (id: string, updates: any) => {
        throw new Error('統合データシステムが利用できません')
      },
      addPokemon: async (pokemon: any) => {
        throw new Error('統合データシステムが利用できません')
      },
      updatePokemon: async (id: string, updates: any) => {
        throw new Error('統合データシステムが利用できません')
      }
    }
  }
}