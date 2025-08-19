'use client'

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useRef } from 'react'
import { useGameState } from '@/lib/realtime-hooks'
import { supabase, safeSupabaseOperation } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { MOCK_USER, MOCK_GAME_DATA } from '@/lib/mock-data'
import { useErrorHandler, DatabaseError } from '@/lib/error-handling'
import { authSessionManager, AuthEventType, SessionState } from '@/lib/auth-integration'

// ゲーム状態の型定義
export interface GameContextState {
  // ユーザー情報
  user: User | null
  isAuthenticated: boolean
  isMockMode: boolean
  
  // 接続状態
  isConnected: boolean
  isLoading: boolean
  errors: DatabaseError[]
  errorHandler: ReturnType<typeof useErrorHandler>
  
  // セッション管理（新規追加）
  session: SessionState
  authLoading: boolean
  sessionExpiry: Date | null
  lastActivity: Date | null
  
  // ゲームデータ
  gameData: {
    profile: {
      id: string
      guest_name: string
      school_name: string
      current_money: number
      total_reputation: number
      ui_theme: string
      settings: Record<string, any> | null
      created_at: string
      updated_at: string
    } | null
    pokemon: any[]
    trainers: any[]
    expeditions: any[]
    facilities: any[]
    transactions: any[]
    progress: any
    analysis: any[]
  }
  
  // UI状態
  ui: {
    currentPage: string
    selectedPokemon: string | null
    selectedTrainer: string | null
    selectedExpedition: string | null
    notifications: Notification[]
    isDarkMode: boolean
    soundEnabled: boolean
  }
  
  // 設定
  settings: {
    autoSave: boolean
    realTimeUpdates: boolean
    notifications: boolean
    difficulty: 'easy' | 'normal' | 'hard' | 'expert'
  }
}

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  timestamp: Date
  autoHide?: boolean
}

// アクションの型定義
type GameAction = 
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CONNECTION'; payload: boolean }
  | { type: 'SET_ERRORS'; payload: any[] }
  | { type: 'UPDATE_GAME_DATA'; payload: Partial<GameContextState['gameData']> }
  | { type: 'SET_CURRENT_PAGE'; payload: string }
  | { type: 'SELECT_POKEMON'; payload: string | null }
  | { type: 'SELECT_TRAINER'; payload: string | null }
  | { type: 'SELECT_EXPEDITION'; payload: string | null }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<GameContextState['settings']> }
  | { type: 'ENABLE_MOCK_MODE' }
  | { type: 'DISABLE_MOCK_MODE' }
  | { type: 'UPDATE_SESSION'; payload: SessionState }
  | { type: 'SET_AUTH_LOADING'; payload: boolean }
  | { type: 'SESSION_EXPIRED' }
  | { type: 'SESSION_WARNING'; payload: any }

// 初期状態
const initialState: GameContextState = {
  user: null,
  isAuthenticated: false,
  isMockMode: false,
  isConnected: false,
  isLoading: true,
  errors: [],
  errorHandler: null as any, // 実行時に設定される
  
  // セッション管理の初期状態
  session: {
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    lastActivity: null,
    sessionExpiry: null,
    refreshAttempts: 0
  },
  authLoading: true,
  sessionExpiry: null,
  lastActivity: null,
  gameData: {
    profile: null,
    pokemon: [],
    trainers: [],
    expeditions: [],
    facilities: [],
    transactions: [],
    progress: null,
    analysis: []
  },
  ui: {
    currentPage: 'dashboard',
    selectedPokemon: null,
    selectedTrainer: null,
    selectedExpedition: null,
    notifications: [],
    isDarkMode: false,
    soundEnabled: true
  },
  settings: {
    autoSave: true,
    realTimeUpdates: true,
    notifications: true,
    difficulty: 'normal'
  }
}

// Reducer
function gameReducer(state: GameContextState, action: GameAction): GameContextState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false // ユーザー状態が設定されたらローディングを終了
      }

    case 'UPDATE_SESSION':
      return {
        ...state,
        session: action.payload,
        user: action.payload.user,
        isAuthenticated: action.payload.isAuthenticated,
        authLoading: action.payload.isLoading,
        sessionExpiry: action.payload.sessionExpiry,
        lastActivity: action.payload.lastActivity
      }

    case 'SET_AUTH_LOADING':
      return {
        ...state,
        authLoading: action.payload
      }

    case 'SESSION_EXPIRED':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        session: {
          ...state.session,
          user: null,
          session: null,
          isAuthenticated: false,
          error: 'セッションが期限切れです'
        }
      }

    case 'SESSION_WARNING':
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: [
            ...state.ui.notifications,
            {
              id: `session_warning_${Date.now()}`,
              type: 'warning',
              message: action.payload.message,
              timestamp: new Date(),
              autoHide: false
            }
          ]
        }
      }
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      }
    
    case 'SET_CONNECTION':
      return {
        ...state,
        isConnected: action.payload
      }
    
    case 'SET_ERRORS':
      return {
        ...state,
        errors: action.payload
      }
    
    case 'UPDATE_GAME_DATA':
      return {
        ...state,
        gameData: {
          ...state.gameData,
          ...action.payload
        }
      }
    
    case 'SET_CURRENT_PAGE':
      return {
        ...state,
        ui: {
          ...state.ui,
          currentPage: action.payload
        }
      }
    
    case 'SELECT_POKEMON':
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedPokemon: action.payload
        }
      }
    
    case 'SELECT_TRAINER':
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedTrainer: action.payload
        }
      }
    
    case 'SELECT_EXPEDITION':
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedExpedition: action.payload
        }
      }
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: [...state.ui.notifications, action.payload]
        }
      }
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: state.ui.notifications.filter(n => n.id !== action.payload)
        }
      }
    
    case 'TOGGLE_DARK_MODE':
      return {
        ...state,
        ui: {
          ...state.ui,
          isDarkMode: !state.ui.isDarkMode
        }
      }
    
    case 'TOGGLE_SOUND':
      return {
        ...state,
        ui: {
          ...state.ui,
          soundEnabled: !state.ui.soundEnabled
        }
      }
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload
        }
      }
    
    case 'ENABLE_MOCK_MODE':
      return {
        ...state,
        user: MOCK_USER,
        isAuthenticated: true,
        isMockMode: true,
        isConnected: true,
        isLoading: false,
        errors: [],
        gameData: MOCK_GAME_DATA
      }
    
    case 'DISABLE_MOCK_MODE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isMockMode: false,
        isConnected: false,
        isLoading: true,
        errors: [],
        gameData: {
          profile: null,
          pokemon: [],
          trainers: [],
          expeditions: [],
          facilities: [],
          transactions: [],
          progress: null,
          analysis: []
        }
      }
    
    default:
      return state
  }
}

// Context作成
const GameContext = createContext<{
  state: GameContextState
  dispatch: React.Dispatch<GameAction>
  actions: {
    // ユーザー関連
    setUser: (user: User | null) => void
    signOut: () => Promise<void>
    enableMockMode: () => void
    disableMockMode: () => void
    
    // 通知関連
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
    removeNotification: (id: string) => void
    
    // 選択関連
    selectPokemon: (id: string | null) => void
    selectTrainer: (id: string | null) => void
    selectExpedition: (id: string | null) => void
    
    // 設定関連
    updateSettings: (settings: Partial<GameContextState['settings']>) => void
    toggleDarkMode: () => void
    toggleSound: () => void
    
    // ページ遷移
    setCurrentPage: (page: string) => void
  }
} | null>(null)

// Provider
export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  
  // リアルタイムゲームデータ（モックモードでない場合のみ）
  const shouldUseRealData = !state.isMockMode && state.user?.id
  console.log('🎮 GameContext データソース:', { 
    isMockMode: state.isMockMode, 
    hasUser: !!state.user?.id, 
    shouldUseRealData,
    userId: state.user?.id?.substring(0, 8) + '...' || 'none'
  })
  const gameStateHook = useGameState(shouldUseRealData ? state.user!.id : '')

  // ユーザー認証状態監視
  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        dispatch({ type: 'SET_USER', payload: session?.user ?? null })
        // セッションが存在する場合は認証済みとして設定
        if (session?.user) {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      })

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        dispatch({ type: 'SET_USER', payload: session?.user ?? null })
        // 認証状態が変更されたらローディング状態を更新
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      })

      return () => subscription.unsubscribe()
    }
  }, [])

  // ゲームデータ同期（モックモードでない場合のみ）
  useEffect(() => {
    if (state.user && !state.isMockMode) {
      const newGameData: GameContextState['gameData'] = {
        profile: gameStateHook.profile?.profile as GameContextState['gameData']['profile'] || null,
        pokemon: Array.isArray(gameStateHook.pokemon?.pokemon) ? gameStateHook.pokemon.pokemon : [],
        trainers: Array.isArray(gameStateHook.trainers?.trainers) ? gameStateHook.trainers.trainers : [],
        expeditions: Array.isArray(gameStateHook.expeditions?.expeditions) ? gameStateHook.expeditions.expeditions : [],
        facilities: Array.isArray(gameStateHook.facilities?.facilities) ? gameStateHook.facilities.facilities : [],
        transactions: Array.isArray(gameStateHook.transactions?.transactions) ? gameStateHook.transactions.transactions : [],
        progress: gameStateHook.progress?.progress || null,
        analysis: Array.isArray(gameStateHook.analysis?.analyses) ? gameStateHook.analysis.analyses : []
      }
      
      // データが実際に変更された場合のみ更新（深い比較を避ける）
      const hasDataChanged = 
        (newGameData.profile?.id !== state.gameData.profile?.id) ||
        newGameData.pokemon.length !== state.gameData.pokemon.length ||
        newGameData.trainers.length !== state.gameData.trainers.length ||
        newGameData.expeditions.length !== state.gameData.expeditions.length ||
        newGameData.facilities.length !== state.gameData.facilities.length ||
        newGameData.transactions.length !== state.gameData.transactions.length ||
        gameStateHook.isConnected !== state.isConnected ||
        gameStateHook.isLoading !== state.isLoading
      
      if (hasDataChanged) {
        dispatch({ type: 'UPDATE_GAME_DATA', payload: newGameData })
        dispatch({ type: 'SET_CONNECTION', payload: gameStateHook.isConnected })
        dispatch({ type: 'SET_LOADING', payload: gameStateHook.isLoading })
        dispatch({ type: 'SET_ERRORS', payload: gameStateHook.errors })
      }
    }
  }, [
    state.user?.id,
    state.isMockMode,
    (gameStateHook.profile?.profile as GameContextState['gameData']['profile'])?.id,
    Array.isArray(gameStateHook.pokemon?.pokemon) ? gameStateHook.pokemon.pokemon.length : 0,
    Array.isArray(gameStateHook.trainers?.trainers) ? gameStateHook.trainers.trainers.length : 0,
    Array.isArray(gameStateHook.expeditions?.expeditions) ? gameStateHook.expeditions.expeditions.length : 0,
    Array.isArray(gameStateHook.facilities?.facilities) ? gameStateHook.facilities.facilities.length : 0,
    Array.isArray(gameStateHook.transactions?.transactions) ? gameStateHook.transactions.transactions.length : 0,
    gameStateHook.isConnected,
    gameStateHook.isLoading
  ])

  // 通知の自動削除
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      state.ui.notifications.forEach(notification => {
        if (notification.autoHide !== false && now.getTime() - notification.timestamp.getTime() > 5000) {
          dispatch({ type: 'REMOVE_NOTIFICATION', payload: notification.id })
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [state.ui.notifications])

  // ローカルストレージから設定読み込み
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('tokiwa-settings')
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        dispatch({ type: 'UPDATE_SETTINGS', payload: settings })
      }

      const savedUI = localStorage.getItem('tokiwa-ui')
      if (savedUI) {
        const ui = JSON.parse(savedUI)
        if (ui.isDarkMode !== undefined) {
          dispatch({ type: 'TOGGLE_DARK_MODE' })
        }
        if (ui.soundEnabled !== undefined) {
          dispatch({ type: 'TOGGLE_SOUND' })
        }
      }
    } catch (error) {
      console.error('設定読み込みエラー:', error)
    }
  }, [])

  // 設定をローカルストレージに保存
  useEffect(() => {
    try {
      localStorage.setItem('tokiwa-settings', JSON.stringify(state.settings))
      localStorage.setItem('tokiwa-ui', JSON.stringify({
        isDarkMode: state.ui.isDarkMode,
        soundEnabled: state.ui.soundEnabled
      }))
    } catch (error) {
      console.error('設定保存エラー:', error)
    }
  }, [state.settings, state.ui.isDarkMode, state.ui.soundEnabled])

  // アクション定義
  const actions = {
    setUser: (user: User | null) => {
      dispatch({ type: 'SET_USER', payload: user })
    },

    signOut: async () => {
      try {
        if (supabase) {
          await supabase.auth.signOut()
        }
        // モックモードの場合は無効化
        if (state.isMockMode) {
          dispatch({ type: 'DISABLE_MOCK_MODE' })
        }
        // ユーザー状態をリセット
        dispatch({ type: 'SET_USER', payload: null })
        dispatch({ type: 'SET_LOADING', payload: false })
        // ゲームデータをリセット
        dispatch({ type: 'UPDATE_GAME_DATA', payload: {
          profile: null,
          pokemon: [],
          trainers: [],
          expeditions: [],
          facilities: [],
          transactions: [],
          progress: null,
          analysis: []
        }})
        console.log('✅ ログアウト完了: ユーザー状態をリセットしました')
      } catch (error) {
        console.error('❌ ログアウトエラー:', error)
        throw error
      }
    },

    enableMockMode: () => {
      console.log('🎮 モックモードを有効化: 開発用データでゲームを開始')
      dispatch({ type: 'ENABLE_MOCK_MODE' })
    },

    disableMockMode: () => {
      console.log('🔄 モックモードを無効化: 実際の認証に戻ります')
      dispatch({ type: 'DISABLE_MOCK_MODE' })
    },

    addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => {
      const id = `notification-${Date.now()}-${Math.random()}`
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          ...notification,
          id,
          timestamp: new Date()
        }
      })
    },

    removeNotification: (id: string) => {
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
    },

    selectPokemon: (id: string | null) => {
      dispatch({ type: 'SELECT_POKEMON', payload: id })
    },

    selectTrainer: (id: string | null) => {
      dispatch({ type: 'SELECT_TRAINER', payload: id })
    },

    selectExpedition: (id: string | null) => {
      dispatch({ type: 'SELECT_EXPEDITION', payload: id })
    },

    updateSettings: (settings: Partial<GameContextState['settings']>) => {
      dispatch({ type: 'UPDATE_SETTINGS', payload: settings })
    },

    toggleDarkMode: () => {
      dispatch({ type: 'TOGGLE_DARK_MODE' })
    },

    toggleSound: () => {
      dispatch({ type: 'TOGGLE_SOUND' })
    },

    setCurrentPage: (page: string) => {
      dispatch({ type: 'SET_CURRENT_PAGE', payload: page })
    }
  }

  return (
    <GameContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </GameContext.Provider>
  )
}

// Hook
export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}

// 個別のカスタムフック
export function useGameData() {
  const { state } = useGame()
  return state.gameData
}

export function useGameUI() {
  const { state, actions } = useGame()
  return {
    ...state.ui,
    setCurrentPage: actions.setCurrentPage,
    selectPokemon: actions.selectPokemon,
    selectTrainer: actions.selectTrainer,
    selectExpedition: actions.selectExpedition,
    toggleDarkMode: actions.toggleDarkMode,
    toggleSound: actions.toggleSound
  }
}

export function useGameSettings() {
  const { state, actions } = useGame()
  return {
    ...state.settings,
    updateSettings: actions.updateSettings
  }
}

export function useNotifications() {
  const { state, actions } = useGame()
  return {
    notifications: state.ui.notifications,
    addNotification: actions.addNotification,
    removeNotification: actions.removeNotification
  }
}

export function useAuth() {
  const { state, actions } = useGame()
  
  // Supabaseが利用可能かチェック
  const canUseSupabase = supabase !== null
  
  // モックモード判定の改善（セッション管理統合）
  const isMockMode = !canUseSupabase || state.isMockMode || !state.session.isAuthenticated
  
  // ユーザーの判定（セッション情報を優先）
  const user = isMockMode ? MOCK_USER : (state.session.user || state.user)
  const isAuthenticated = isMockMode ? true : state.session.isAuthenticated
  const isLoading = state.authLoading || state.session.isLoading

  // 統合認証システムを使用
  const signIn = useCallback(async (email: string, password: string) => {
    const result = await authSessionManager.signIn(email, password)
    if (!result.success) {
      throw new Error(result.error)
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string, trainerName?: string) => {
    const result = await authSessionManager.signUp(email, password, {
      trainer_name: trainerName
    })
    if (!result.success) {
      throw new Error(result.error)
    }
  }, [])

  const signOut = useCallback(async () => {
    const result = await authSessionManager.signOut()
    if (!result.success) {
      throw new Error(result.error)
    }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    const result = await authSessionManager.resetPassword(email)
    if (!result.success) {
      throw new Error(result.error)
    }
  }, [])

  const refreshToken = useCallback(async () => {
    return await authSessionManager.refreshToken()
  }, [])

  return {
    user,
    isAuthenticated,
    isLoading,
    isMockMode,
    canUseSupabase,
    
    // セッション情報（新規）
    session: state.session,
    sessionExpiry: state.sessionExpiry,
    lastActivity: state.lastActivity,
    authError: state.session.error,
    
    // 認証操作
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshToken,
    
    // セッション管理
    isSessionValid: authSessionManager.isSessionValid.bind(authSessionManager),
    
    // モック状態管理
    enableMockMode: actions.enableMockMode,
    disableMockMode: actions.disableMockMode
  }
}