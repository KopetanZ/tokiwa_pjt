'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@/types/auth'
import { supabase, isSupabaseAvailable } from '@/lib/supabase'
import { useGame } from '@/contexts/GameContext'

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
  
  // GameContextから認証状態を取得
  const { state: gameState, actions: gameActions } = useGame()

  useEffect(() => {
    // 初期化時にローカルストレージから認証情報を復元
    const initializeAuth = async () => {
      console.log('🔐 AuthProvider: 初期化開始')
      
      // 古いセッション情報をクリア
      try {
        localStorage.removeItem('tokiwa_user')
        localStorage.removeItem('tokiwa-session-state')
        sessionStorage.clear()
        console.log('🔐 AuthProvider: 古いセッション情報をクリアしました')
      } catch (error) {
        console.warn('🔐 AuthProvider: セッションクリア中にエラー:', error)
      }
      
      // Supabaseの利用可能性をチェック
      const supabaseAvailable = isSupabaseAvailable()
      console.log('🔐 AuthProvider: Supabase利用可能:', supabaseAvailable)
      
      if (supabaseAvailable) {
        setAuthMethod('supabase')
        try {
          console.log('🔐 AuthProvider: Supabaseセッションを確認中...')
          if (supabase) {
            // Supabaseのセッションもクリア
            await supabase.auth.signOut()
            console.log('🔐 AuthProvider: Supabaseセッションをクリアしました')
            
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

  // GameContextの認証状態と同期
  useEffect(() => {
    console.log('🔐 AuthProvider: GameContext状態を監視中', {
      isMockMode: gameState.isMockMode,
      isAuthenticated: gameState.isAuthenticated,
      isLoading: gameState.isLoading,
      hasUser: !!gameState.user
    })
    
    if (gameState.isMockMode && gameState.isAuthenticated) {
      // モックモードが有効で認証済みの場合
      console.log('🔐 AuthProvider: GameContextのモックモードと同期')
      setUser({
        id: gameState.user?.id || 'mock-user',
        guestName: 'モックユーザー',
        schoolName: 'モック学校',
        currentMoney: 50000,
        totalReputation: 0,
        uiTheme: 'gameboy_green',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      setAuthMethod('local')
      setIsLoading(false)
    } else if (!gameState.isLoading && !gameState.isAuthenticated) {
      // 認証されていない場合
      console.log('🔐 AuthProvider: GameContextで未認証状態を検出')
      setUser(null)
      setIsLoading(false)
    }
  }, [gameState.isMockMode, gameState.isAuthenticated, gameState.isLoading, gameState.user?.id])

  // 初期化完了後の状態確認
  useEffect(() => {
    if (!isLoading && !user && !gameState.isMockMode) {
      // 初期化完了後、ユーザーがおらず、モックモードでもない場合
      console.log('🔐 AuthProvider: 初期化完了、未認証状態')
      setIsLoading(false)
    }
  }, [isLoading, user, gameState.isMockMode])

  // GameContextの状態変更をより積極的に監視
  useEffect(() => {
    // モックモードが有効化された場合の処理
    if (gameState.isMockMode && !user) {
      console.log('🔐 AuthProvider: GameContextでモックモード有効化を検出')
      setUser({
        id: 'mock-user',
        guestName: 'モックユーザー',
        schoolName: 'モック学校',
        currentMoney: 50000,
        totalReputation: 0,
        uiTheme: 'gameboy_green',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      setAuthMethod('local')
      setIsLoading(false)
    }
  }, [gameState.isMockMode, user?.id])

  // モックモードの状態を監視して認証状態を同期
  useEffect(() => {
    if (gameState.isMockMode && gameState.isAuthenticated && gameState.user) {
      // GameContextでモックモードが有効で認証済みの場合
      if (!user || user.id !== gameState.user.id) {
        console.log('🔐 AuthProvider: GameContextのモックモード状態と同期')
        setUser({
          id: gameState.user.id || 'mock-user',
          guestName: 'モックユーザー',
          schoolName: 'モック学校',
          currentMoney: 50000,
          totalReputation: 0,
          uiTheme: 'gameboy_green',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        setAuthMethod('local')
        setIsLoading(false)
      }
    }
  }, [gameState.isMockMode, gameState.isAuthenticated, gameState.user?.id, user?.id])

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
      
      // GameContextのモックモードを有効化
      if (gameActions) {
        gameActions.enableMockMode()
      }
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
    
    // GameContextのモックモードを無効化
    if (gameActions) {
      gameActions.disableMockMode()
    }
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