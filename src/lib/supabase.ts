import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

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

// 環境変数が設定されている場合のみSupabaseクライアントを作成
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
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