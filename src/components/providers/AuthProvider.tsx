'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@/types/auth'
import { supabase, isSupabaseAvailable } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (guestName: string, schoolName: string) => Promise<void>
  logout: () => void
  authMethod: 'supabase' | 'local'
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authMethod, setAuthMethod] = useState<'supabase' | 'local'>('local')

  useEffect(() => {
    // 初期化時にローカルストレージから認証情報を復元
    const initializeAuth = async () => {
      console.log('🔐 AuthProvider: 初期化開始')
      
      // Supabaseの利用可能性をチェック
      const supabaseAvailable = isSupabaseAvailable()
      console.log('🔐 AuthProvider: Supabase利用可能:', supabaseAvailable)
      
      if (supabaseAvailable) {
        setAuthMethod('supabase')
        try {
          console.log('🔐 AuthProvider: Supabaseセッションを確認中...')
          if (supabase) {
            const { data: { session }, error } = await supabase.auth.getSession()
            
            if (error) {
              console.error('🔐 AuthProvider: Supabaseセッション取得エラー:', error)
              // エラーの場合はローカル認証にフォールバック
              setAuthMethod('local')
            } else if (session) {
              console.log('🔐 AuthProvider: Supabaseセッション発見:', session)
              // Supabaseセッションからユーザー情報を取得
              // ここでデータベースからユーザー情報を取得する処理を追加
            } else {
              console.log('🔐 AuthProvider: Supabaseセッションなし')
              // セッションがない場合はローカル認証にフォールバック
              setAuthMethod('local')
            }
          }
        } catch (error) {
          console.error('🔐 AuthProvider: Supabase認証エラー:', error)
          // エラーの場合はローカル認証にフォールバック
          setAuthMethod('local')
        }
      } else {
        setAuthMethod('local')
        console.log('🔐 AuthProvider: ローカルストレージ認証を使用')
      }

      // ローカルストレージからの復元（フォールバック）
      try {
        const savedUser = localStorage.getItem('tokiwa_user')
        console.log('🔐 AuthProvider: ローカルストレージから取得:', savedUser ? 'ユーザー情報あり' : 'ユーザー情報なし')
        
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser)
          console.log('🔐 AuthProvider: パースされたユーザー:', parsedUser)
          
          // 基本的なバリデーション
          if (parsedUser && parsedUser.id && parsedUser.guestName && parsedUser.schoolName) {
            console.log('🔐 AuthProvider: ユーザー情報を設定')
            setUser(parsedUser)
            // ローカルストレージから復元した場合は、認証方法をlocalに設定
            if (authMethod === 'supabase') {
              console.log('🔐 AuthProvider: ローカルストレージから復元、認証方法をlocalに変更')
              setAuthMethod('local')
            }
          } else {
            console.warn('🔐 AuthProvider: 無効なユーザーデータ、localStorageをクリア')
            localStorage.removeItem('tokiwa_user')
          }
        }
      } catch (error) {
        console.error('🔐 AuthProvider: ユーザー情報のパースに失敗:', error)
        localStorage.removeItem('tokiwa_user')
      } finally {
        console.log('🔐 AuthProvider: 初期化完了、isLoadingをfalseに設定')
        setIsLoading(false)
      }
    }

    // 少し遅延を入れて初期化（開発環境でのちらつきを防ぐ）
    const timer = setTimeout(initializeAuth, 100)
    return () => clearTimeout(timer)
  }, [])

  // authMethodの変更をログ出力
  useEffect(() => {
    console.log('🔐 AuthProvider: 認証方法が変更されました:', authMethod)
  }, [authMethod])

  const login = async (guestName: string, schoolName: string) => {
    setIsLoading(true)
    try {
      // 仮の実装 - 後でSupabase認証に置き換え
      const newUser: User = {
        id: `guest_${Date.now()}`,
        guestName,
        schoolName,
        currentMoney: 50000,
        totalReputation: 0,
        uiTheme: 'gameboy_green',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      setUser(newUser)
      localStorage.setItem('tokiwa_user', JSON.stringify(newUser))
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('tokiwa_user')
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        isAuthenticated: !!user, 
        login, 
        logout,
        authMethod
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}