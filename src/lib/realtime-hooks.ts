'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { useEffect, useState } from 'react'

// 共通のnullチェック関数
function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase client not available')
  }
  return supabase
}

// 安全なSupabaseクエリ実行ヘルパー
async function safeSupabaseQuery<T>(
  queryFn: (client: any) => Promise<{ data: T | null; error: any }>
): Promise<T> {
  const client = ensureSupabase()
  const { data, error } = await queryFn(client)
  
  if (error) {
    console.error('🔧 Supabaseクエリエラー:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    })
    
    // 400エラー（テーブル未作成など）の場合は分かりやすいエラーメッセージ
    if (error.message?.includes('400') || error.code === 'PGRST116') {
      console.warn('🔧 データベーステーブルが見つかりません。モックモードの使用を推奨します。')
    }
    throw error
  }
  
  return data as T
}

// 安全なSupabaseミューテーション実行ヘルパー
async function safeSupabaseMutation<T>(
  mutationFn: (client: any) => Promise<{ data: T | null; error: any }>
): Promise<T> {
  const client = ensureSupabase()
  const { data, error } = await mutationFn(client)
  
  if (error) {
    throw error
  }
  
  return data as T
}

// リアルタイムデータ更新フック（簡素版）
export function useRealtimeData<T>(
  table: string,
  queryKey: string[],
  userId?: string
) {
  const queryClient = useQueryClient()
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!userId || !supabase) {
      setIsConnected(false)
      return
    }

    // 開発環境での最適化
    const isDevelopment = process.env.NODE_ENV === 'development'
    let timeoutId: NodeJS.Timeout

    const connectRealtime = () => {
      console.log(`${table} リアルタイム接続開始`)
      if (!supabase) {
        console.warn(`${table} Supabase client is not initialized`)
        setIsConnected(false)
        return
      }
      const subscription = supabase
        .channel(`${table}-changes-${userId}`) // ユニークなチャンネル名
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log(`${table}リアルタイム更新:`, payload)
            // キャッシュ無効化のデバウンス
            if (timeoutId) clearTimeout(timeoutId)
            timeoutId = setTimeout(() => {
              queryClient.invalidateQueries({ queryKey })
            }, 1000)
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsConnected(true)
            console.log(`${table} リアルタイム接続完了`)
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            setIsConnected(false)
            console.log(`${table} リアルタイム接続終了:`, status)
          }
        })

      return subscription
    }

    // 開発環境では接続を遅延
    const delay = isDevelopment ? 3000 : 500
    const connectionTimeout = setTimeout(() => {
      const subscription = connectRealtime()
      
      // クリーンアップ関数を外部に設定
      ;(window as any)[`cleanup_${table}_${userId}`] = () => {
        if (timeoutId) clearTimeout(timeoutId)
        if (subscription) subscription.unsubscribe()
        setIsConnected(false)
      }
    }, delay)

    return () => {
      clearTimeout(connectionTimeout)
      if (timeoutId) clearTimeout(timeoutId)
      if ((window as any)[`cleanup_${table}_${userId}`]) {
        ;(window as any)[`cleanup_${table}_${userId}`]()
        delete (window as any)[`cleanup_${table}_${userId}`]
      }
      setIsConnected(false)
    }
  }, [table, userId])

  return { isConnected }
}

// 基本的なデータ取得フック（null安全版）
export function useSupabaseQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: {
    enabled?: boolean
    staleTime?: number
    refetchInterval?: number
  }
) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not available')
      }
      return queryFn()
    },
    enabled: !!supabase && (options?.enabled ?? true),
    staleTime: options?.staleTime || 30 * 1000,
    refetchInterval: options?.refetchInterval || 60 * 1000
  })
}

// ポケモンデータフック（安全版）
export function usePokemon(userId: string) {
  const { isConnected } = useRealtimeData('pokemon', ['pokemon', userId], userId)
  
  const query = useSupabaseQuery(
    ['pokemon', userId],
    async () => {
      return safeSupabaseQuery(async (client) => {
        return client
          .from('pokemon')
          .select('*')
          .eq('user_id', userId)
          .order('caught_at', { ascending: false })
      })
    },
    { enabled: !!userId }
  )

  const captureMutation = useMutation({
    mutationFn: async (pokemonData: any) => {
      return safeSupabaseMutation(async (client) => {
        return client
          .from('pokemon')
          .insert({
            user_id: userId,
            ...pokemonData,
            caught_at: new Date().toISOString()
          })
      })
    },
    onSuccess: () => {
      query.refetch()
    }
  })

  return {
    pokemon: query.data || [],
    loading: query.isLoading,
    error: query.error,
    isConnected,
    capturePokemon: captureMutation.mutateAsync,
    refetch: query.refetch
  }
}

// ユーザープロファイルデータフック（安全版）
export function useProfile(userId: string) {
  const { isConnected } = useRealtimeData('profiles', ['profile', userId], userId)
  
  const query = useSupabaseQuery(
    ['profile', userId],
    async () => {
      return safeSupabaseQuery(async (client) => {
        return client
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
      })
    },
    { enabled: !!userId }
  )

  return {
    profile: query.data || null,
    loading: query.isLoading,
    error: query.error,
    isConnected,
    refetch: query.refetch
  }
}

// トレーナーデータフック（安全版）
export function useTrainers(userId: string) {
  const { isConnected } = useRealtimeData('trainers', ['trainers', userId], userId)
  
  const query = useSupabaseQuery(
    ['trainers', userId],
    async () => {
      return safeSupabaseQuery(async (client) => {
        return client
          .from('trainers')
          .select('*')
          .eq('user_id', userId)
          .order('hired_at', { ascending: false })
      })
    },
    { enabled: !!userId }
  )

  return {
    trainers: query.data || [],
    loading: query.isLoading,
    error: query.error,
    isConnected,
    refetch: query.refetch
  }
}

// 派遣データフック（安全版）
export function useExpeditions(userId: string) {
  const { isConnected } = useRealtimeData('expeditions', ['expeditions', userId], userId)
  
  const query = useSupabaseQuery(
    ['expeditions', userId],
    async () => {
      return safeSupabaseQuery(async (client) => {
        return client
          .from('expeditions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
      })
    },
    { 
      enabled: !!userId,
      staleTime: 15 * 1000,
      refetchInterval: 30 * 1000
    }
  )

  return {
    expeditions: query.data || [],
    loading: query.isLoading,
    error: query.error,
    isConnected,
    refetch: query.refetch
  }
}

// 施設データフック（安全版）
export function useFacilities(userId: string) {
  const { isConnected } = useRealtimeData('facilities', ['facilities', userId], userId)
  
  const query = useSupabaseQuery(
    ['facilities', userId],
    async () => {
      return safeSupabaseQuery(async (client) => {
        return client
          .from('facilities')
          .select('*')
          .eq('user_id', userId)
          .order('id')
      })
    },
    { 
      enabled: !!userId,
      staleTime: 60 * 1000,
      refetchInterval: 2 * 60 * 1000
    }
  )

  return {
    facilities: query.data || [],
    loading: query.isLoading,
    error: query.error,
    isConnected,
    refetch: query.refetch
  }
}

// 取引データフック（安全版）
export function useTransactions(userId: string) {
  const { isConnected } = useRealtimeData('transactions', ['transactions', userId], userId)
  
  const query = useSupabaseQuery(
    ['transactions', userId],
    async () => {
      return safeSupabaseQuery(async (client) => {
        return client
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100)
      })
    },
    { enabled: !!userId }
  )

  return {
    transactions: query.data || [],
    loading: query.isLoading,
    error: query.error,
    isConnected,
    refetch: query.refetch
  }
}

// ゲーム進行状況フック（安全版）
export function useGameProgress(userId: string) {
  const { isConnected } = useRealtimeData('game_progress', ['game-progress', userId], userId)
  
  const query = useSupabaseQuery(
    ['game-progress', userId],
    async () => {
      return safeSupabaseQuery(async (client) => {
        const { data, error } = await client
          .from('game_progress')
          .select('*')
          .eq('user_id', userId)
          .single()
        
        if (error && error.code !== 'PGRST116') throw error
        return data || {
          level: 1,
          experience: 0,
          next_level_exp: 1000,
          total_play_time: 0,
          achievement_points: 0,
          unlocked_features: [],
          difficulty: 'normal'
        }
      })
    },
    { enabled: !!userId }
  )

  return {
    progress: query.data,
    loading: query.isLoading,
    error: query.error,
    isConnected,
    refetch: query.refetch
  }
}

// AI分析結果フック（安全版）
export function useAIAnalysis(userId: string) {
  const { isConnected } = useRealtimeData('ai_analysis', ['ai-analysis', userId], userId)
  
  const query = useSupabaseQuery(
    ['ai-analysis', userId],
    async () => {
      return safeSupabaseQuery(async (client) => {
        return client
          .from('ai_analysis')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10)
      })
    },
    { 
      enabled: !!userId,
      staleTime: 5 * 60 * 1000,
      refetchInterval: 10 * 60 * 1000
    }
  )

  return {
    analyses: query.data || [],
    loading: query.isLoading,
    error: query.error,
    isConnected,
    refetch: query.refetch
  }
}

// 統合状態管理フック（安全版）
export function useGameState(userId: string) {
  const profile = useProfile(userId)
  const pokemon = usePokemon(userId)
  const trainers = useTrainers(userId)
  const expeditions = useExpeditions(userId)
  const facilities = useFacilities(userId)
  const transactions = useTransactions(userId)
  const progress = useGameProgress(userId)
  const analysis = useAIAnalysis(userId)

  // 全体的な接続状態
  const isConnected = [
    profile.isConnected,
    pokemon.isConnected,
    trainers.isConnected,
    expeditions.isConnected,
    facilities.isConnected,
    transactions.isConnected,
    progress.isConnected,
    analysis.isConnected
  ].every(connected => connected)

  // 全体的な読み込み状態
  const isLoading = [
    profile.loading,
    pokemon.loading,
    trainers.loading,
    expeditions.loading,
    facilities.loading,
    transactions.loading,
    progress.loading,
    analysis.loading
  ].some(loading => loading)

  // 全体的なエラー状態
  const errors = [
    profile.error,
    pokemon.error,
    trainers.error,
    expeditions.error,
    facilities.error,
    transactions.error,
    progress.error,
    analysis.error
  ].filter(error => error !== null)

  return {
    profile,
    pokemon,
    trainers,
    expeditions,
    facilities,
    transactions,
    progress,
    analysis,
    isConnected,
    isLoading,
    errors
  }
}

// 接続状態監視フック（安全版）
export function useConnectionStatus() {
  const [status, setStatus] = useState<'CONNECTING' | 'OPEN' | 'CLOSED'>('CONNECTING')
  const [lastPing, setLastPing] = useState<Date | null>(null)

  useEffect(() => {
    if (!supabase) {
      setStatus('CLOSED')
      return
    }

    const channel = supabase.channel('connection-test')
    
    const subscription = channel
      .on('broadcast', { event: 'ping' }, () => {
        setLastPing(new Date())
      })
      .subscribe((status) => {
        setStatus(status as any)
      })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    status,
    isConnected: status === 'OPEN',
    lastPing
  }
}