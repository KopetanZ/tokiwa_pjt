/**
 * 派遣システム統合フック
 * React コンポーネント用の派遣システム操作インターフェース
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useDataSystem } from '@/components/providers/DataSystemProvider'
import { useErrorHandling } from './useErrorHandling'
import {
  expeditionEngine,
  expeditionEventSystem,
  expeditionInterventionSystem,
  expeditionRewardSystem,
  expeditionReportSystem,
  expeditionSystemManager,
  type ExpeditionProgress,
  type ExpeditionLoot,
  type ExpeditionReport,
  type InterventionAction,
  type Achievement
} from '@/lib/expedition'
import type { Expedition, ExpeditionEvent, Trainer } from '@/lib/game-state/types'

export interface ExpeditionSystemState {
  activeExpeditions: ExpeditionProgress[]
  recentEvents: ExpeditionEvent[]
  availableInterventions: InterventionAction[]
  systemHealth: 'healthy' | 'degraded' | 'critical'
  statistics: any
}

/**
 * 派遣進行管理フック
 */
export function useExpeditionProgress(expeditionId?: string) {
  const [progress, setProgress] = useState<ExpeditionProgress | null>(null)
  const [isActive, setIsActive] = useState(false)
  const { handleError } = useErrorHandling()
  
  // 特定の派遣進行状況を監視
  useEffect(() => {
    if (!expeditionId) return
    
    const interval = setInterval(() => {
      try {
        const currentProgress = expeditionEngine.getProgress(expeditionId)
        setProgress(currentProgress)
        setIsActive(currentProgress !== null)
      } catch (error) {
        handleError(error as Error, { context: 'expedition_progress_monitoring' })
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [expeditionId, handleError])
  
  // 派遣開始
  const startExpedition = useCallback(async (expedition: Expedition, trainer: Trainer) => {
    try {
      const newProgress = expeditionEngine.startExpedition(expedition, trainer)
      setProgress(newProgress)
      setIsActive(true)
      return newProgress
    } catch (error) {
      await handleError(error as Error, { context: 'expedition_start' })
      throw error
    }
  }, [handleError])
  
  // 派遣停止
  const stopExpedition = useCallback(async (reason: 'recall' | 'complete' | 'failed' = 'recall') => {
    if (!expeditionId) return
    
    try {
      expeditionEngine.stopExpedition(expeditionId, reason)
      setProgress(null)
      setIsActive(false)
    } catch (error) {
      await handleError(error as Error, { context: 'expedition_stop' })
      throw error
    }
  }, [expeditionId, handleError])
  
  return {
    progress,
    isActive,
    startExpedition,
    stopExpedition
  }
}

/**
 * 派遣イベント処理フック
 */
export function useExpeditionEvents(expeditionId: string) {
  const [events, setEvents] = useState<ExpeditionEvent[]>([])
  const [pendingEvents, setPendingEvents] = useState<ExpeditionEvent[]>([])
  const { handleError } = useErrorHandling()
  const dataSystem = useDataSystem()
  
  // イベント履歴を取得
  useEffect(() => {
    try {
      const history = expeditionEventSystem.getEventHistory(expeditionId)
      setEvents(history)
      setPendingEvents(history.filter(e => !e.resolved))
    } catch (error) {
      handleError(error as Error, { context: 'expedition_events_loading' })
    }
  }, [expeditionId, handleError])
  
  // 選択を処理
  const processChoice = useCallback(async (eventId: string, choiceId: string) => {
    try {
      const trainer = dataSystem.expeditions.find(e => e.id === expeditionId)?.trainerId
      const trainerData = trainer ? dataSystem.trainers.find(t => t.id === trainer) : null
      
      if (!trainerData) {
        throw new Error('トレーナー情報が見つかりません')
      }
      
      const resolution = await expeditionEventSystem.processChoice(
        expeditionId,
        eventId,
        choiceId,
        trainerData
      )
      
      // イベントリストを更新
      const updatedHistory = expeditionEventSystem.getEventHistory(expeditionId)
      setEvents(updatedHistory)
      setPendingEvents(updatedHistory.filter(e => !e.resolved))
      
      return resolution
    } catch (error) {
      await handleError(error as Error, { context: 'expedition_choice_processing' })
      throw error
    }
  }, [expeditionId, dataSystem, handleError])
  
  // イベント統計を取得
  const getEventStatistics = useCallback(() => {
    return expeditionEventSystem.getEventStatistics(expeditionId)
  }, [expeditionId])
  
  return {
    events,
    pendingEvents,
    processChoice,
    getEventStatistics,
    hasPendingEvents: pendingEvents.length > 0
  }
}

/**
 * 派遣介入フック
 */
export function useExpeditionIntervention(expeditionId: string) {
  const [availableActions, setAvailableActions] = useState<InterventionAction[]>([])
  const [interventionHistory, setInterventionHistory] = useState<any[]>([])
  const { handleError } = useErrorHandling()
  const dataSystem = useDataSystem()
  
  // 利用可能なアクションを更新
  const updateAvailableActions = useCallback(async () => {
    try {
      // 現在の状態を取得
      const progress = expeditionEngine.getProgress(expeditionId)
      if (!progress) return
      
      const expedition = dataSystem.expeditions.find(e => e.id === expeditionId)
      const trainer = expedition ? dataSystem.trainers.find(t => t.id === expedition.trainerId) : null
      
      if (!expedition || !trainer) return
      
      const actions = expeditionInterventionSystem.getAvailableActions(
        expeditionId,
        progress.currentStage,
        progress.riskLevel,
        1, // TODO: get player level from proper context
        5000, // TODO: get player money from proper context
        trainer.trustLevel
      )
      
      setAvailableActions(actions)
    } catch (error) {
      await handleError(error as Error, { context: 'intervention_actions_update' })
    }
  }, [expeditionId, dataSystem, handleError])
  
  useEffect(() => {
    updateAvailableActions()
    const interval = setInterval(updateAvailableActions, 30000) // 30秒ごと
    return () => clearInterval(interval)
  }, [updateAvailableActions])
  
  // 介入を実行
  const executeIntervention = useCallback(async (actionId: string) => {
    try {
      const expedition = dataSystem.expeditions.find(e => e.id === expeditionId)
      const trainer = expedition ? dataSystem.trainers.find(t => t.id === expedition.trainerId) : null
      
      if (!trainer) {
        throw new Error('トレーナー情報が見つかりません')
      }
      
      const result = await expeditionInterventionSystem.executeIntervention(
        expeditionId,
        actionId,
        trainer,
        1, // TODO: get player level from proper context
        5000, // TODO: get player money from proper context
        [] // inventory - TODO: アイテムシステムと連携
      )
      
      await updateAvailableActions()
      return result
    } catch (error) {
      await handleError(error as Error, { context: 'expedition_intervention' })
      throw error
    }
  }, [expeditionId, dataSystem, updateAvailableActions, handleError])
  
  // 緊急介入
  const emergencyIntervention = useCallback(async (eventId: string, actionId: string) => {
    try {
      const expedition = dataSystem.expeditions.find(e => e.id === expeditionId)
      const trainer = expedition ? dataSystem.trainers.find(t => t.id === expedition.trainerId) : null
      
      if (!trainer) {
        throw new Error('トレーナー情報が見つかりません')
      }
      
      const resolution = await expeditionInterventionSystem.emergencyIntervention(
        expeditionId,
        eventId,
        actionId,
        trainer
      )
      
      await updateAvailableActions()
      return resolution
    } catch (error) {
      await handleError(error as Error, { context: 'emergency_intervention' })
      throw error
    }
  }, [expeditionId, dataSystem, updateAvailableActions, handleError])
  
  // 介入統計を取得
  const getInterventionStatistics = useCallback(() => {
    return expeditionInterventionSystem.getInterventionStatistics(expeditionId)
  }, [expeditionId])
  
  return {
    availableActions,
    executeIntervention,
    emergencyIntervention,
    getInterventionStatistics,
    canIntervene: availableActions.length > 0
  }
}

/**
 * 派遣完了処理フック
 */
export function useExpeditionCompletion() {
  const { handleError } = useErrorHandling()
  const dataSystem = useDataSystem()
  
  // 報酬を生成
  const generateRewards = useCallback(async (
    expedition: Expedition,
    trainer: Trainer,
    events: ExpeditionEvent[],
    successRate: number,
    actualDuration: number
  ) => {
    try {
      return await expeditionRewardSystem.generateExpeditionRewards(
        expedition,
        trainer,
        events,
        successRate,
        actualDuration
      )
    } catch (error) {
      await handleError(error as Error, { context: 'reward_generation' })
      throw error
    }
  }, [handleError])
  
  // レポートを生成
  const generateReport = useCallback(async (
    expedition: Expedition,
    trainer: Trainer,
    progress: ExpeditionProgress,
    events: ExpeditionEvent[],
    interventions: any[],
    loot: ExpeditionLoot
  ) => {
    try {
      return await expeditionReportSystem.generateExpeditionReport(
        expedition,
        trainer,
        progress,
        events,
        interventions,
        loot,
        { finalReward: loot.money, baseReward: loot.money } as any // 簡易計算
      )
    } catch (error) {
      await handleError(error as Error, { context: 'report_generation' })
      throw error
    }
  }, [handleError])
  
  return {
    generateRewards,
    generateReport
  }
}

/**
 * 派遣レポート閲覧フック
 */
export function useExpeditionReports(type?: 'expedition' | 'trainer' | 'location', id?: string | number) {
  const [reports, setReports] = useState<ExpeditionReport[]>([])
  const [statistics, setStatistics] = useState<any>(null)
  const { handleError } = useErrorHandling()
  
  useEffect(() => {
    try {
      if (type && id !== undefined) {
        const history = expeditionReportSystem.getReportHistory(type, id)
        setReports(history)
      } else {
        setReports([])
      }
      
      const stats = expeditionReportSystem.getStatisticsSummary()
      setStatistics(stats)
    } catch (error) {
      handleError(error as Error, { context: 'reports_loading' })
    }
  }, [type, id, handleError])
  
  return {
    reports,
    statistics,
    hasReports: reports.length > 0
  }
}

/**
 * システム統合フック
 */
export function useExpeditionSystem() {
  const [systemState, setSystemState] = useState<ExpeditionSystemState>({
    activeExpeditions: [],
    recentEvents: [],
    availableInterventions: [],
    systemHealth: 'healthy',
    statistics: {}
  })
  const { handleError } = useErrorHandling()
  const initRef = useRef(false)
  
  // システム初期化
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    
    try {
      expeditionSystemManager.initialize()
      console.log('🎯 派遣システムが初期化されました')
    } catch (error) {
      handleError(error as Error, { context: 'expedition_system_init' })
    }
  }, [handleError])
  
  // システム状態更新
  useEffect(() => {
    const updateSystemState = () => {
      try {
        const healthCheck = expeditionSystemManager.healthCheck()
        const statistics = expeditionSystemManager.getSystemStatistics()
        const activeExpeditions = expeditionEngine.getAllProgress()
        
        setSystemState({
          activeExpeditions,
          recentEvents: [], // TODO: 最近のイベントを取得
          availableInterventions: [], // TODO: 利用可能な介入を取得
          systemHealth: healthCheck.status,
          statistics
        })
      } catch (error) {
        handleError(error as Error, { context: 'system_state_update' })
      }
    }
    
    updateSystemState()
    const interval = setInterval(updateSystemState, 5000) // 5秒ごと
    
    return () => clearInterval(interval)
  }, [handleError])
  
  // システム統計を取得
  const getSystemStatistics = useCallback(() => {
    return expeditionSystemManager.getSystemStatistics()
  }, [])
  
  // システムヘルスチェック
  const performHealthCheck = useCallback(() => {
    return expeditionSystemManager.healthCheck()
  }, [])
  
  return {
    systemState,
    getSystemStatistics,
    performHealthCheck,
    isHealthy: systemState.systemHealth === 'healthy',
    activeExpeditionCount: systemState.activeExpeditions.length
  }
}

/**
 * 派遣実績フック
 */
export function useExpeditionAchievements(trainerId?: string) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([])
  
  useEffect(() => {
    // 実績データを取得（実装詳細化時に改善）
    const mockAchievements: Achievement[] = [
      {
        id: 'first_expedition',
        type: 'milestone',
        name: '初回派遣',
        description: '最初の派遣を完了しました',
        rarity: 'common',
        points: 50
      }
    ]
    
    setAchievements(mockAchievements)
    setRecentAchievements(mockAchievements.slice(-5)) // 最新5個
  }, [trainerId])
  
  return {
    achievements,
    recentAchievements,
    totalPoints: achievements.reduce((sum, a) => sum + a.points, 0),
    hasNewAchievements: recentAchievements.length > 0
  }
}