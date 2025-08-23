/**
 * リアルタイムデータフック
 * データ変更の自動監視と更新を提供
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { realtimeManager, DataChangeEvent, SystemStatusEvent, ValidationEvent } from '@/lib/real-time/RealtimeManager'
import { useDataSystem } from '@/components/providers/DataSystemProvider'
import type { Trainer, Pokemon, Expedition } from '@/lib/game-state/types'

/**
 * データ自動更新フック
 * データ変更を監視し、コンポーネントを自動更新
 */
export function useAutoRefresh<T>(
  dataGetter: () => T,
  category: DataChangeEvent['category'],
  entityId?: string
) {
  const [data, setData] = useState<T>(dataGetter())
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toISOString())
  const getterRef = useRef(dataGetter)
  
  // データゲッターを最新に保つ
  getterRef.current = dataGetter
  
  // データ変更監視
  useEffect(() => {
    const unsubscribe = entityId
      ? realtimeManager.subscribeToEntity(category, entityId, (event) => {
          const newData = getterRef.current()
          setData(newData)
          setLastUpdate(event.timestamp)
        })
      : realtimeManager.subscribeToDataChanges(category, (event) => {
          const newData = getterRef.current()
          setData(newData)
          setLastUpdate(event.timestamp)
        })
    
    return unsubscribe
  }, [category, entityId])
  
  // 手動更新
  const refresh = useCallback(() => {
    const newData = getterRef.current()
    setData(newData)
    setLastUpdate(new Date().toISOString())
  }, [])
  
  return {
    data,
    lastUpdate,
    refresh
  }
}

/**
 * トレーナーリアルタイムフック
 */
export function useRealtimeTrainers() {
  const dataSystem = useDataSystem()
  const [notifications, setNotifications] = useState<string[]>([])
  
  const { data: trainers, lastUpdate, refresh } = useAutoRefresh(
    () => dataSystem.trainers,
    'trainers'
  )
  
  // トレーナー固有のイベント監視
  useEffect(() => {
    const unsubscribe = realtimeManager.subscribeToDataChanges('trainers', (event) => {
      // 通知の生成
      if (event.action === 'create') {
        setNotifications(prev => [...prev, `新しいトレーナー「${event.data?.name || '不明'}」が雇用されました`])
      } else if (event.action === 'update' && event.data?.status === 'available' && event.previousData?.status === 'on_expedition') {
        setNotifications(prev => [...prev, `トレーナー「${event.data?.name || '不明'}」が派遣から戻りました`])
      }
    })
    
    return unsubscribe
  }, [])
  
  // 通知クリア
  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])
  
  return {
    trainers,
    lastUpdate,
    refresh,
    notifications,
    clearNotifications
  }
}

/**
 * ポケモンリアルタイムフック
 */
export function useRealtimePokemon() {
  const dataSystem = useDataSystem()
  const [healthChanges, setHealthChanges] = useState<Array<{ id: string; previousStatus: string; newStatus: string; timestamp: string }>>([])
  
  const { data: pokemon, lastUpdate, refresh } = useAutoRefresh(
    () => dataSystem.pokemon,
    'pokemon'
  )
  
  // ポケモンの健康状態変化を監視
  useEffect(() => {
    const unsubscribe = realtimeManager.subscribeToDataChanges('pokemon', (event) => {
      if (event.action === 'update' && 
          event.data?.status !== event.previousData?.status) {
        setHealthChanges(prev => [...prev.slice(-9), {
          id: event.entityId || '',
          previousStatus: event.previousData?.status || 'unknown',
          newStatus: event.data?.status || 'unknown',
          timestamp: event.timestamp
        }])
      }
    })
    
    return unsubscribe
  }, [])
  
  // ポケモン統計の計算
  const stats = {
    total: pokemon.length,
    healthy: pokemon.filter(p => p.status === 'healthy').length,
    injured: pokemon.filter(p => p.status === 'injured').length,
    sick: pokemon.filter(p => p.status === 'sick').length,
    training: pokemon.filter(p => p.status === 'training').length
  }
  
  return {
    pokemon,
    stats,
    healthChanges,
    lastUpdate,
    refresh
  }
}

/**
 * 派遣リアルタイムフック
 */
export function useRealtimeExpeditions() {
  const dataSystem = useDataSystem()
  const [expeditionUpdates, setExpeditionUpdates] = useState<Array<{ id: string; status: string; timestamp: string }>>([])
  
  const { data: expeditions, lastUpdate, refresh } = useAutoRefresh(
    () => dataSystem.expeditions,
    'expeditions'
  )
  
  // 派遣状態の変化を監視
  useEffect(() => {
    const unsubscribe = realtimeManager.subscribeToDataChanges('expeditions', (event) => {
      if (event.action === 'update' && event.data?.status) {
        setExpeditionUpdates(prev => [...prev.slice(-19), {
          id: event.entityId || '',
          status: event.data.status,
          timestamp: event.timestamp
        }])
      }
    })
    
    return unsubscribe
  }, [])
  
  // 進行中の派遣
  const activeExpeditions = expeditions.filter(e => e.status === 'active')
  const completedToday = expeditions.filter(e => {
    if (e.status !== 'completed' || !e.actualEndTime) return false
    const today = new Date().toDateString()
    return new Date(e.actualEndTime).toDateString() === today
  })
  
  return {
    expeditions,
    activeExpeditions,
    completedToday,
    expeditionUpdates,
    lastUpdate,
    refresh
  }
}

/**
 * システム状態リアルタイムフック
 */
export function useRealtimeSystemStatus() {
  const [systemStatus, setSystemStatus] = useState<SystemStatusEvent | null>(null)
  const [validationStatus, setValidationStatus] = useState<ValidationEvent | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  
  // システム状態監視
  useEffect(() => {
    const unsubscribeSystem = realtimeManager.subscribeToSystemStatus((event) => {
      setSystemStatus(event)
    })
    
    const unsubscribeValidation = realtimeManager.subscribeToValidation((event) => {
      setValidationStatus(event)
    })
    
    return () => {
      unsubscribeSystem()
      unsubscribeValidation()
    }
  }, [])
  
  // ネットワーク状態監視
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  return {
    systemStatus,
    validationStatus,
    isOnline,
    isSystemHealthy: systemStatus?.status === 'ready' && validationStatus?.isValid !== false && isOnline
  }
}

/**
 * リアルタイム統計フック
 */
export function useRealtimeStatistics() {
  const [stats, setStats] = useState(realtimeManager.getStatistics())
  
  // 統計の定期更新
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(realtimeManager.getStatistics())
    }, 5000) // 5秒間隔
    
    return () => clearInterval(interval)
  }, [])
  
  // イベント履歴
  const getRecentEvents = useCallback((limit: number = 20) => {
    return realtimeManager.getEventHistory(limit)
  }, [])
  
  const getCategoryHistory = useCallback((category: DataChangeEvent['category'], limit: number = 10) => {
    return realtimeManager.getCategoryHistory(category, limit)
  }, [])
  
  return {
    stats,
    getRecentEvents,
    getCategoryHistory,
    clearHistory: realtimeManager.clearHistory.bind(realtimeManager)
  }
}

/**
 * リアルタイムイベント発行フック
 */
export function useRealtimeEmitter() {
  return {
    emitDataChange: realtimeManager.emitDataChange.bind(realtimeManager),
    emitSystemStatus: realtimeManager.emitSystemStatus.bind(realtimeManager),
    emitValidation: realtimeManager.emitValidation.bind(realtimeManager)
  }
}

/**
 * 統合リアルタイムフック
 * 全ての主要データを監視
 */
export function useRealtimeGameData() {
  const trainers = useRealtimeTrainers()
  const pokemon = useRealtimePokemon()
  const expeditions = useRealtimeExpeditions()
  const systemStatus = useRealtimeSystemStatus()
  const statistics = useRealtimeStatistics()
  
  return {
    trainers,
    pokemon,
    expeditions,
    systemStatus,
    statistics,
    
    // 統合統計
    summary: {
      totalTrainers: trainers.trainers.length,
      availableTrainers: trainers.trainers.filter(t => t.status === 'available').length,
      totalPokemon: pokemon.pokemon.length,
      healthyPokemon: pokemon.stats.healthy,
      activeExpeditions: expeditions.activeExpeditions.length,
      completedToday: expeditions.completedToday.length,
      systemHealth: systemStatus.isSystemHealthy,
      lastUpdate: new Date().toISOString()
    }
  }
}