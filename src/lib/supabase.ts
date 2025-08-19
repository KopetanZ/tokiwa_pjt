import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { ErrorLogger, mapSupabaseError, createErrorHandler } from '@/lib/error-handling'

// 環境変数の存在チェック
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 環境変数が設定されていない場合の警告
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase環境変数が設定されていません:')
  console.warn('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '設定済み' : '未設定')
  console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '設定済み' : '未設定')
  console.warn('ローカルストレージベースの認証を使用します')
}

// エラーハンドリング付きSupabaseクライアントの作成
const createEnhancedClient = (url: string, key: string) => {
  const client = createClient<Database>(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 2 // リアルタイム更新の頻度制限
      }
    }
  })

  // グローバルエラーハンドリングの設定
  if (typeof window !== 'undefined') {
    // 認証エラーの監視
    client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        console.log(`Auth event: ${event}`, session?.user?.id)
      }
    })

    // ネットワークエラーの監視
    window.addEventListener('online', () => {
      console.log('ネットワーク接続が復旧しました')
    })

    window.addEventListener('offline', () => {
      console.warn('ネットワーク接続が失われました')
      ErrorLogger.getInstance().logError({
        type: 'network' as any,
        severity: 'high' as any,
        message: 'Network connection lost',
        timestamp: new Date(),
        recoverable: true,
        retryable: true,
        userMessage: 'ネットワーク接続が失われました。接続を確認してください。'
      })
    })
  }

  return client
}

// 環境変数が設定されている場合のみSupabaseクライアントを作成
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createEnhancedClient(supabaseUrl, supabaseAnonKey)
  : null

// クライアントサイド用
export const createBrowserClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase環境変数が設定されていません')
  }
  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Supabaseが利用可能かチェック
export const isSupabaseAvailable = () => {
  return !!supabase
}

// エラーハンドリング付きのデータベース操作ヘルパー
export const safeSupabaseOperation = async <T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  context: {
    operation: string
    table?: string
    data?: any
  }
): Promise<{ data: T | null; error: any; handled: boolean }> => {
  if (!supabase) {
    return {
      data: null,
      error: new Error('Supabase is not available'),
      handled: false
    }
  }

  try {
    const result = await operation()
    
    if (result.error) {
      const handler = createErrorHandler(context)
      const dbError = handler(result.error)
      
      return {
        data: result.data,
        error: dbError,
        handled: true
      }
    }
    
    return {
      data: result.data,
      error: null,
      handled: true
    }
    
  } catch (error) {
    const handler = createErrorHandler(context)
    const dbError = handler(error)
    
    return {
      data: null,
      error: dbError,
      handled: true
    }
  }
}

// 接続状態を監視
export const monitorSupabaseConnection = () => {
  if (!supabase) return

  // 定期的な接続確認
  const checkConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
      
      if (error) {
        console.warn('Supabase接続エラー:', error)
        ErrorLogger.getInstance().logError(mapSupabaseError(error, {
          operation: 'connection_check'
        }))
      }
    } catch (error) {
      console.warn('接続確認中にエラー:', error)
    }
  }

  // 5分ごとに接続確認
  setInterval(checkConnection, 5 * 60 * 1000)
  
  // 初回実行
  setTimeout(checkConnection, 1000)
}

// 初期化時に接続監視を開始
if (typeof window !== 'undefined' && supabase) {
  monitorSupabaseConnection()
}