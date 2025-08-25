'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { User } from '@/types/auth'
import { supabase, isSupabaseAvailable } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { safeLocalStorage } from '@/lib/storage'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signUp: (email: string, password: string, trainerName: string, schoolName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  forceSignOut: () => Promise<void>
  createGuestSession: (guestName: string, schoolName: string) => Promise<void>
  authMethod: 'supabase' | 'local'
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authMethod, setAuthMethod] = useState<'supabase' | 'local'>('local')
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()
  
  // 初期化処理
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true)
        
        // 古い認証情報のクリーンアップ（開発環境とVercelデプロイ時）
        if (typeof window !== 'undefined') {
          const currentUrl = window.location.href
          const isVercelDeploy = currentUrl.includes('vercel.app') || currentUrl.includes('vercel.com')
          const isDev = process.env.NODE_ENV === 'development'
          
          if (isVercelDeploy || isDev) {
            console.log('🔐 AuthProvider: 古い認証情報をクリーンアップ', { isVercelDeploy, isDev })
            
            // 古いSupabaseセッション関連のキーをクリア
            const keysToRemove = [
              'supabase.auth.token',
              'supabase.auth.expires_at',
              'supabase.auth.refresh_token',
              'supabase.auth.access_token',
              'supabase.auth.user'
            ]
            
            keysToRemove.forEach(key => {
              safeLocalStorage.removeItem(key)
            })
            
            // Supabaseのプリフィックス付きキーもクリア
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('sb-')) {
                localStorage.removeItem(key)
              }
            })
          }
        }
        
        // Supabaseの接続確認
        if (supabase) {
          console.log('🔐 AuthProvider: Supabase認証を使用')
          setAuthMethod('supabase')
          
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            const appUser: User = {
              id: session.user.id,
              guestName: session.user.user_metadata?.trainer_name || 'Unknown Trainer',
              schoolName: session.user.user_metadata?.school_name || 'Unknown School',
              currentMoney: 5000,
              totalReputation: 0,
              uiTheme: 'gameboy_green',
              createdAt: session.user.created_at,
              updatedAt: new Date().toISOString()
            }
            setUser(appUser)
            setIsLoading(false)
            return
          }
        } else {
          console.log('🔐 AuthProvider: ローカル認証を使用')
          setAuthMethod('local')
        }

        // クライアントサイドでのみlocalStorageにアクセス
        if (typeof window !== 'undefined') {
          // ローカルストレージから復元
          const savedUser = safeLocalStorage.getItem('tokiwa_user')
          console.log('🔐 AuthProvider: ローカルストレージ確認:', { savedUser: !!savedUser })
          
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser)
              console.log('🔐 AuthProvider: パースされたユーザー:', parsedUser)
              
              if (parsedUser && parsedUser.id && parsedUser.guestName) {
                console.log('🔐 AuthProvider: ローカルユーザー復元成功')
                setUser(parsedUser)
              } else {
                console.log('🔐 AuthProvider: 無効なユーザー情報、削除')
                safeLocalStorage.removeItem('tokiwa_user')
              }
            } catch (error) {
              console.error('🔐 AuthProvider: ユーザー情報のパースエラー:', error)
              safeLocalStorage.removeItem('tokiwa_user')
            }
          } else {
            console.log('🔐 AuthProvider: ローカルストレージにユーザー情報なし')
          }
        }
      } catch (error) {
        console.error('🔐 AuthProvider: 初期化エラー:', error)
        setError('認証システムの初期化に失敗しました')
      } finally {
        console.log('🔐 AuthProvider: 初期化完了', { 
          user: !!user, 
          authMethod, 
          isLoading: false 
        })
        setIsLoading(false)
        setIsInitialized(true)
      }
    }

    initializeAuth()
  }, [])

  // Supabaseセッション変更の監視
  useEffect(() => {
    if (supabase && authMethod === 'supabase') {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('🔐 AuthProvider: Supabase認証状態変更:', event)
          
          if (session?.user) {
            const appUser: User = {
              id: session.user.id,
              guestName: session.user.user_metadata?.trainer_name || 'Unknown Trainer',
              schoolName: session.user.user_metadata?.school_name || 'Unknown School',
              currentMoney: 5000,
              totalReputation: 0,
              uiTheme: 'gameboy_green',
              createdAt: session.user.created_at,
              updatedAt: new Date().toISOString()
            }
            setUser(appUser)
          } else if (event === 'SIGNED_OUT') {
            setUser(null)
            safeLocalStorage.removeItem('tokiwa_user')
          }
        }
      )
      
      return () => subscription.unsubscribe()
    }
  }, [authMethod])

  // ユーザー状態の変更をGameContextに通知
  useEffect(() => {
    // GameContextとの連携は、ユーザー状態が安定してから行う
    if (user && !isLoading) {
      console.log('🔐 AuthProvider: ユーザー認証完了', {
        id: user.id,
        guestName: user.guestName,
        schoolName: user.schoolName
      })
      
      // ローカルストレージにユーザー情報を保存
      if (typeof window !== 'undefined') {
        safeLocalStorage.setItem('tokiwa_user', JSON.stringify(user))
      }
    } else if (!user && !isLoading) {
      console.log('🔐 AuthProvider: ユーザー未認証')
      
      // ローカルストレージからユーザー情報を削除
      if (typeof window !== 'undefined') {
        safeLocalStorage.removeItem('tokiwa_user')
      }
    }
  }, [user, isLoading])

  const signUp = async (email: string, password: string, trainerName: string, schoolName: string) => {
    setError(null)
    setIsLoading(true)
    
    try {
      // 既存セッションをクリア
      if (supabase) {
        await supabase.auth.signOut()
      }
      
      if (authMethod === 'supabase' && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              trainer_name: trainerName.trim(),
              school_name: schoolName.trim()
            }
          }
        })
        
        if (error) throw error
        
        if (data.user && !data.session) {
          // メール認証が必要
          setError('メールを確認してアカウントを有効化してください')
        } else if (data.user && data.session) {
          // 即座にログイン完了
          router.push('/dashboard')
        }
      } else {
        // ローカル認証フォールバック
        await createGuestSession(trainerName, schoolName)
      }
    } catch (error: any) {
      console.error('🔐 サインアップエラー:', error)
      setError(error.message || 'サインアップに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setError(null)
    setIsLoading(true)
    
    try {
      // 既存セッションをクリア
      if (supabase) {
        await supabase.auth.signOut()
      }
      
      if (authMethod === 'supabase' && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim()
        })
        
        if (error) throw error
        
        if (data.user) {
          router.push('/dashboard')
        }
      } else {
        throw new Error('ローカル認証では事前登録が必要です')
      }
    } catch (error: any) {
      console.error('🔐 サインインエラー:', error)
      setError(error.message || 'ログインに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      if (authMethod === 'supabase' && supabase) {
        await supabase.auth.signOut()
      }
      setUser(null)
      safeLocalStorage.removeItem('tokiwa_user')
      router.push('/')
    } catch (error: any) {
      console.error('🔐 サインアウトエラー:', error)
      setError(error.message || 'ログアウトに失敗しました')
    }
  }

  const forceSignOut = async () => {
    try {
      console.log('🔐 AuthProvider: 強制ログアウト開始')
      
      // Supabaseセッションを強制的にクリア
      if (supabase) {
        await supabase.auth.signOut({ scope: 'global' })
      }
      
      // ローカルストレージを完全にクリア
      if (typeof window !== 'undefined') {
        // Tokiwa関連のデータをクリア
        safeLocalStorage.removeItem('tokiwa_user')
        
        // Supabase関連のデータをクリア
        const keysToRemove = [
          'supabase.auth.token',
          'supabase.auth.expires_at', 
          'supabase.auth.refresh_token',
          'supabase.auth.access_token',
          'supabase.auth.user',
          'sb-' // Supabaseのプリフィックス付きキー
        ]
        
        Object.keys(localStorage).forEach(key => {
          if (keysToRemove.some(prefix => key.startsWith(prefix))) {
            localStorage.removeItem(key)
          }
        })
      }
      
      // 状態をリセット
      setUser(null)
      setError(null)
      setAuthMethod('local')
      
      console.log('🔐 AuthProvider: 強制ログアウト完了')
      
      // ページをリロード
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
      
    } catch (error: any) {
      console.error('🔐 強制ログアウトエラー:', error)
      // エラーが発生してもページをリロード
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    }
  }

  const createGuestSession = async (guestName: string, schoolName: string) => {
    const guestUser: User = {
      id: `guest_${Date.now()}`,
      guestName: guestName.trim(),
      schoolName: schoolName.trim(),
      currentMoney: 5000,
      totalReputation: 0,
      uiTheme: 'gameboy_green',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    setUser(guestUser)
    safeLocalStorage.setItem('tokiwa_user', JSON.stringify(guestUser))
    router.push('/dashboard')
  }

  // 初期化が完了するまで待機
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="font-pixel text-retro-gb-dark">システム初期化中...</div>
          <div className="w-16 h-2 bg-retro-gb-mid mx-auto animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        isAuthenticated: !!user, 
        signUp,
        signIn, 
        signOut,
        forceSignOut,
        createGuestSession,
        authMethod,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Simple background context detection for development

export function useAuthProvider() {
  // Always call useContext first (React Hooks rules)
  const context = useContext(AuthContext)
  
  // シンプルなコンテキストチェック - 正当な使用の場合はコンテキストが存在するはず
  if (context === undefined) {
    // 開発環境でのみバックグラウンド処理をチェック
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      const stackTrace = new Error().stack || ''
      
      // 真にバックグラウンド処理の場合のみモックを返す（入力処理は除外）
      const isTrueBackgroundContext = (
        stackTrace.includes('MessagePort') || 
        stackTrace.includes('webpackHotUpdate') ||
        stackTrace.includes('webpack_require') ||
        stackTrace.includes('hot-dev-client') ||
        stackTrace.includes('react-refresh') ||
        stackTrace.includes('fast-refresh') ||
        typeof (globalThis as any).importScripts === 'function' ||
        window.name === 'nodejs'
      )
      
      if (isTrueBackgroundContext) {
        // サイレントにモックを返す（ログを最小限に）
        return {
          user: null,
          isLoading: false,
          isAuthenticated: false,
          signUp: async () => {},
          signIn: async () => {},
          signOut: async () => {},
          forceSignOut: async () => {},
          createGuestSession: async () => {},
          authMethod: 'local' as const,
          error: null
        }
      }
    }
    
    // 正当なコンポーネントでコンテキストが見つからない場合のみエラー
    throw new Error('useAuthProvider must be used within an AuthProvider')
  }
  
  return context
}

// Safe version of useAuthProvider that returns fallback values instead of throwing
export function useAuthProviderSafe() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    // In development, provide more detailed error information
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ useAuthProviderSafe called outside AuthProvider context, returning fallback')
    }
    
    return {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      signUp: async () => { throw new Error('Authentication context unavailable') },
      signIn: async () => { throw new Error('Authentication context unavailable') },
      signOut: async () => { throw new Error('Authentication context unavailable') },
      forceSignOut: async () => { throw new Error('Authentication context unavailable') },
      createGuestSession: async () => { throw new Error('Authentication context unavailable') },
      authMethod: 'local' as const,
      error: 'Authentication context unavailable'
    }
  }
  return context
}