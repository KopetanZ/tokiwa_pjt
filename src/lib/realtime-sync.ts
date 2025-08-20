/**
 * リアルタイムデータ同期システム
 * 
 * Supabaseリアルタイムを使用して全ゲームデータの同期を管理
 */

import { useEffect, useCallback, useRef, useState } from 'react'
import { supabase } from './supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface RealtimeUpdateHandler<T = any> {
  onInsert?: (record: T) => void
  onUpdate?: (oldRecord: T, newRecord: T) => void
  onDelete?: (record: T) => void
  onError?: (error: Error) => void
}

export interface RealtimeSubscriptionConfig {
  table: string
  filter?: string
  handler: RealtimeUpdateHandler
}

/**
 * 包括的リアルタイムデータ同期フック
 */
export const useRealtimeSync = (
  userId: string | null,
  subscriptions: RealtimeSubscriptionConfig[]
) => {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<Error | null>(null)
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map())
  const reconnectAttemptRef = useRef(0)
  const maxReconnectAttempts = 5
  
  // チャンネル作成関数
  const createChannel = useCallback((config: RealtimeSubscriptionConfig) => {
    if (!supabase || !userId) return null
    
    const channelName = `${config.table}_${userId}_${Date.now()}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: config.table,
          filter: config.filter || `user_id=eq.${userId}`
        },
        (payload) => {
          try {
            config.handler.onInsert?.(payload.new)
            console.log(`🔄 リアルタイム INSERT: ${config.table}`, payload.new)
          } catch (error) {
            console.error(`リアルタイム INSERT エラー (${config.table}):`, error)
            config.handler.onError?.(error as Error)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: config.table,
          filter: config.filter || `user_id=eq.${userId}`
        },
        (payload) => {
          try {
            config.handler.onUpdate?.(payload.old, payload.new)
            console.log(`🔄 リアルタイム UPDATE: ${config.table}`, payload.new)
          } catch (error) {
            console.error(`リアルタイム UPDATE エラー (${config.table}):`, error)
            config.handler.onError?.(error as Error)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: config.table,
          filter: config.filter || `user_id=eq.${userId}`
        },
        (payload) => {
          try {
            config.handler.onDelete?.(payload.old)
            console.log(`🔄 リアルタイム DELETE: ${config.table}`, payload.old)
          } catch (error) {
            console.error(`リアルタイム DELETE エラー (${config.table}):`, error)
            config.handler.onError?.(error as Error)
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          setConnectionError(null)
          reconnectAttemptRef.current = 0
          console.log(`✅ リアルタイム接続成功: ${config.table}`)
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false)
          setConnectionError(new Error(`接続エラー: ${config.table}`))
          console.error(`❌ リアルタイム接続エラー: ${config.table}`)
          
          // 再接続を試行
          attemptReconnect(config)
        } else if (status === 'TIMED_OUT') {
          setIsConnected(false)
          setConnectionError(new Error(`接続タイムアウト: ${config.table}`))
          console.error(`⏰ リアルタイム接続タイムアウト: ${config.table}`)
        } else if (status === 'CLOSED') {
          setIsConnected(false)
          console.log(`🔌 リアルタイム接続終了: ${config.table}`)
        }
      })
    
    return channel
  }, [userId])
  
  // 再接続試行
  const attemptReconnect = useCallback((config: RealtimeSubscriptionConfig) => {
    if (reconnectAttemptRef.current >= maxReconnectAttempts) {
      console.error(`❌ 最大再接続試行回数に達しました: ${config.table}`)
      return
    }
    
    const delay = Math.pow(2, reconnectAttemptRef.current) * 1000 // 指数バックオフ
    console.log(`🔄 ${delay/1000}秒後に再接続を試行: ${config.table}`)
    
    setTimeout(() => {
      reconnectAttemptRef.current++
      const channel = createChannel(config)
      if (channel) {
        channelsRef.current.set(config.table, channel)
      }
    }, delay)
  }, [createChannel])
  
  // 初期化
  useEffect(() => {
    if (!userId || subscriptions.length === 0) {
      return
    }
    
    // 既存のチャンネルをクリーンアップ
    channelsRef.current.forEach((channel) => {
      channel.unsubscribe()
    })
    channelsRef.current.clear()
    
    // 新しいチャンネルを作成
    subscriptions.forEach((config) => {
      const channel = createChannel(config)
      if (channel) {
        channelsRef.current.set(config.table, channel)
      }
    })
    
    // クリーンアップ
    return () => {
      channelsRef.current.forEach((channel) => {
        channel.unsubscribe()
      })
      channelsRef.current.clear()
      setIsConnected(false)
    }
  }, [userId, subscriptions, createChannel])
  
  return {
    isConnected,
    connectionError,
    reconnectAttempts: reconnectAttemptRef.current
  }
}

/**
 * ゲーム専用リアルタイム同期フック
 */
export const useGameRealtimeSync = (
  userId: string | null,
  handlers: {
    onPokemonUpdate?: RealtimeUpdateHandler
    onTrainerUpdate?: RealtimeUpdateHandler
    onExpeditionUpdate?: RealtimeUpdateHandler
    onTransactionUpdate?: RealtimeUpdateHandler
    onProgressUpdate?: RealtimeUpdateHandler
  }
) => {
  const subscriptions: RealtimeSubscriptionConfig[] = [
    {
      table: 'pokemon',
      handler: handlers.onPokemonUpdate || {}
    },
    {
      table: 'trainers',
      handler: handlers.onTrainerUpdate || {}
    },
    {
      table: 'expeditions',
      handler: handlers.onExpeditionUpdate || {}
    },
    {
      table: 'transactions',
      handler: handlers.onTransactionUpdate || {}
    },
    {
      table: 'game_progress',
      handler: handlers.onProgressUpdate || {}
    }
  ]
  
  return useRealtimeSync(userId, subscriptions)
}

/**
 * 経済データ専用リアルタイム同期フック
 */
export const useEconomyRealtimeSync = (
  userId: string | null,
  onBalanceChange: (newBalance: number) => void,
  onTransactionAdded: (transaction: any) => void
) => {
  const handlers: RealtimeUpdateHandler = {
    onInsert: (transaction) => {
      onTransactionAdded(transaction)
    },
    onUpdate: (oldTransaction, newTransaction) => {
      onTransactionAdded(newTransaction)
    }
  }
  
  return useRealtimeSync(userId, [
    {
      table: 'transactions',
      handler: handlers
    }
  ])
}

/**
 * 派遣専用リアルタイム同期フック
 */
export const useExpeditionRealtimeSync = (
  userId: string | null,
  onExpeditionStatusChange: (expedition: any) => void,
  onProgressUpdate: (progress: any) => void
) => {
  const subscriptions: RealtimeSubscriptionConfig[] = [
    {
      table: 'expeditions',
      handler: {
        onUpdate: (oldExpedition, newExpedition) => {
          if (oldExpedition.status !== newExpedition.status) {
            onExpeditionStatusChange(newExpedition)
          }
        }
      }
    },
    {
      table: 'expedition_progress',
      handler: {
        onInsert: onProgressUpdate,
        onUpdate: (oldProgress, newProgress) => onProgressUpdate(newProgress)
      }
    }
  ]
  
  return useRealtimeSync(userId, subscriptions)
}

/**
 * 通知システム用リアルタイム同期
 */
export const useNotificationSync = (
  userId: string | null,
  onNotification: (notification: {
    type: 'info' | 'success' | 'warning' | 'error'
    title: string
    message: string
    timestamp: string
  }) => void
) => {
  useEffect(() => {
    if (!supabase || !userId) return
    
    // カスタム通知チャンネル
    const channel = supabase
      .channel(`notifications_${userId}`)
      .on('broadcast', { event: 'notification' }, (payload) => {
        onNotification(payload.payload)
      })
      .subscribe()
    
    return () => {
      channel.unsubscribe()
    }
  }, [userId, onNotification])
}

/**
 * リアルタイム通知送信関数
 */
export const sendRealtimeNotification = async (
  userId: string,
  notification: {
    type: 'info' | 'success' | 'warning' | 'error'
    title: string
    message: string
  }
) => {
  if (!supabase) return
  
  const channel = supabase.channel(`notifications_${userId}`)
  await channel.send({
    type: 'broadcast',
    event: 'notification',
    payload: {
      ...notification,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * パフォーマンス監視付きリアルタイム同期
 */
export const useRealtimeSyncWithMetrics = (
  userId: string | null,
  subscriptions: RealtimeSubscriptionConfig[]
) => {
  const [metrics, setMetrics] = useState({
    messagesReceived: 0,
    errorsCount: 0,
    reconnectCount: 0,
    averageLatency: 0,
    lastMessageTime: null as Date | null
  })
  
  const metricsRef = useRef(metrics)
  metricsRef.current = metrics
  
  // メトリクス更新用のハンドラーでラップ
  const wrappedSubscriptions = subscriptions.map(sub => ({
    ...sub,
    handler: {
      ...sub.handler,
      onInsert: (record: any) => {
        setMetrics(prev => ({
          ...prev,
          messagesReceived: prev.messagesReceived + 1,
          lastMessageTime: new Date()
        }))
        sub.handler.onInsert?.(record)
      },
      onUpdate: (oldRecord: any, newRecord: any) => {
        setMetrics(prev => ({
          ...prev,
          messagesReceived: prev.messagesReceived + 1,
          lastMessageTime: new Date()
        }))
        sub.handler.onUpdate?.(oldRecord, newRecord)
      },
      onDelete: (record: any) => {
        setMetrics(prev => ({
          ...prev,
          messagesReceived: prev.messagesReceived + 1,
          lastMessageTime: new Date()
        }))
        sub.handler.onDelete?.(record)
      },
      onError: (error: Error) => {
        setMetrics(prev => ({
          ...prev,
          errorsCount: prev.errorsCount + 1
        }))
        sub.handler.onError?.(error)
      }
    }
  }))
  
  const syncResult = useRealtimeSync(userId, wrappedSubscriptions)
  
  return {
    ...syncResult,
    metrics
  }
}