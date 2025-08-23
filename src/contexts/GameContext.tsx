'use client'

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useRef } from 'react'
import { useGameState, useTrainers, useExpeditions, useEconomy } from '@/lib/game-state/hooks'
import { supabase, safeSupabaseOperation } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { MOCK_USER, MOCK_GAME_DATA } from '@/lib/mock-data'
import { useErrorHandler, DatabaseError } from '@/lib/error-handling'
import { authSessionManager, AuthEventType, SessionState } from '@/lib/auth-integration'
import { createProgressManager, ProgressManager, GameProgress, GameBalance } from '@/lib/progress-management'
import { safeLocalStorage } from '@/lib/storage'

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
  
  // 進行状況管理
  progressManager: ProgressManager | null
  currentProgress: GameProgress | null
  currentBalance: GameBalance | null
  
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
  | { type: 'SET_PROGRESS_MANAGER'; payload: ProgressManager | null }
  | { type: 'UPDATE_PROGRESS'; payload: GameProgress }
  | { type: 'UPDATE_BALANCE'; payload: GameBalance }
  | { type: 'UPDATE_UI'; payload: Partial<GameContextState['ui']> }

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
  
  // 進行状況管理の初期状態
  progressManager: null,
  currentProgress: null,
  currentBalance: null,
  
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
    
    case 'SET_PROGRESS_MANAGER':
      return {
        ...state,
        progressManager: action.payload
      }
    
    case 'UPDATE_PROGRESS':
      return {
        ...state,
        currentProgress: action.payload,
        gameData: {
          ...state.gameData,
          progress: action.payload
        }
      }
    
    case 'UPDATE_BALANCE':
      return {
        ...state,
        currentBalance: action.payload
      }
    
    case 'UPDATE_UI':
      return {
        ...state,
        ui: {
          ...state.ui,
          ...action.payload
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
    
    // プロファイル管理
    createProfile: (profileData: { trainer_name: string; school_name: string }) => Promise<void>
    updateProfile: (updates: Partial<{ trainer_name: string; school_name: string; current_money: number; total_reputation: number }>) => Promise<void>
    
    // 進行状況管理
    addExperience: (exp: number) => Promise<{ levelUp: boolean; newLevel?: number }>
    updatePlayTime: (minutesPlayed: number) => Promise<boolean>
    unlockFeature: (feature: string) => Promise<boolean>
    addAchievementPoints: (points: number) => Promise<boolean>
    changeDifficulty: (difficulty: GameProgress['difficulty']) => Promise<boolean>
    
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
  
  // エラーハンドラーの初期化
  const errorHandler = useErrorHandler()
  
  // エラーハンドラーを状態に設定（初期状態では空の配列）
  useEffect(() => {
    // エラーハンドラーが利用可能になったら記録（ローディング状態は認証完了時に変更）
    if (errorHandler && process.env.NODE_ENV === 'development') {
      console.log('🔧 GameContext: エラーハンドラー初期化完了')
    }
  }, [errorHandler])

  // データソース判定の改善
  const shouldUseRealData = useMemo(() => {
    // ユーザーが存在し、認証済みで、モックモードでない場合のみ
    return !state.isMockMode && state.isAuthenticated && !!state.user?.id
  }, [state.isMockMode, state.isAuthenticated, state.user?.id])

  // 前回の状態を記録して無限ループを防ぐ
  const prevStateRef = useRef({
    isMockMode: state.isMockMode,
    hasUser: !!state.user,
    shouldUseRealData
  })

  // デバッグ用ログ（本番環境では削除）
  const prevShouldUseRealDataRef = useRef(shouldUseRealData)
  useEffect(() => {
    if (prevShouldUseRealDataRef.current !== shouldUseRealData) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🎮 GameContext データソース:', {
          isMockMode: state.isMockMode,
          hasUser: !!state.user,
          shouldUseRealData,
          userId: state.user?.id ? `${state.user.id.substring(0, 8)}...` : 'none',
          isAuthenticated: state.isAuthenticated,
          authLoading: state.authLoading
        })
      }
      prevShouldUseRealDataRef.current = shouldUseRealData
    }
  }, [shouldUseRealData, state.isMockMode, state.isAuthenticated, state.authLoading])

  const gameStateHook = useGameState(shouldUseRealData && state.user?.id ? state.user.id : '')

  // ユーザー認証状態監視
  useEffect(() => {
    if (supabase) {
      // 初期セッション取得
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
          console.error('🔐 GameContext: セッション取得エラー:', error)
          dispatch({ type: 'SET_USER', payload: null })
          dispatch({ type: 'SET_LOADING', payload: false })
          dispatch({ type: 'SET_AUTH_LOADING', payload: false })
        } else if (session?.user) {
          console.log('🔐 GameContext: セッション発見:', session.user.email)
          dispatch({ type: 'SET_USER', payload: session.user })
          dispatch({ type: 'SET_LOADING', payload: false })
          dispatch({ type: 'SET_AUTH_LOADING', payload: false })
        } else {
          console.log('🔐 GameContext: セッションなし')
          dispatch({ type: 'SET_USER', payload: null })
          dispatch({ type: 'SET_LOADING', payload: false })
          dispatch({ type: 'SET_AUTH_LOADING', payload: false })
        }
      })

      // 認証状態変更の監視
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔐 GameContext: 認証状態変更:', event, session?.user?.email)
        }
        
        if (event === 'SIGNED_IN' && session?.user) {
          dispatch({ type: 'SET_USER', payload: session.user })
          dispatch({ type: 'SET_LOADING', payload: false })
          dispatch({ type: 'SET_AUTH_LOADING', payload: false })
        } else if (event === 'SIGNED_OUT') {
          dispatch({ type: 'SET_USER', payload: null })
          dispatch({ type: 'SET_LOADING', payload: false })
          dispatch({ type: 'SET_AUTH_LOADING', payload: false })
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          dispatch({ type: 'SET_USER', payload: session.user })
        }
      })

      return () => subscription.unsubscribe()
    } else {
      // Supabaseが利用できない場合は認証の初期化のみ完了させる（モックモードは手動で有効化）
      console.warn('🔐 GameContext: Supabaseが利用できません。認証初期化のみ完了します。')
      dispatch({ type: 'SET_LOADING', payload: false })
      dispatch({ type: 'SET_AUTH_LOADING', payload: false })
    }
  }, [])

  // ゲームデータ同期（モックモードでない場合のみ）
  // JSON システムとの統合
  const jsonGameStateHook = useGameState()
  const jsonTrainersHook = useTrainers()
  const jsonExpeditionsHook = useExpeditions()
  const jsonEconomyHook = useEconomy()

  // データソース判定とゲームデータ同期
  useEffect(() => {
    // 無限ループを防ぐため、前回の状態と比較
    const currentState = {
      isMockMode: state.isMockMode,
      hasUser: !!state.user,
      shouldUseRealData
    }
    
    // 状態が変更されていない場合は処理をスキップ
    if (
      prevStateRef.current.isMockMode === currentState.isMockMode &&
      prevStateRef.current.hasUser === currentState.hasUser &&
      prevStateRef.current.shouldUseRealData === currentState.shouldUseRealData
    ) {
      return
    }
    
    // 前回の状態を更新
    prevStateRef.current = currentState
    
    if (state.isMockMode || (!state.user && !shouldUseRealData)) {
      // モックモードまたは未認証の場合はJSONシステムからデータを取得
      const jsonGameData: GameContextState['gameData'] = {
        profile: {
          id: 'json-user',
          guest_name: 'JSONユーザー',
          school_name: jsonGameStateHook.gameData?.player?.schoolName || 'ポケモン学校',
          current_money: jsonEconomyHook.money,
          total_reputation: jsonGameStateHook.gameData?.player?.reputation || 0,
          ui_theme: 'default',
          settings: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        pokemon: jsonGameStateHook.gameData?.pokemon || [],
        trainers: jsonTrainersHook.trainers,
        expeditions: jsonExpeditionsHook.expeditions,
        facilities: [],
        transactions: jsonEconomyHook.transactions,
        progress: null,
        analysis: []
      }
      
      dispatch({ type: 'UPDATE_GAME_DATA', payload: jsonGameData })
      dispatch({ type: 'SET_CONNECTION', payload: true }) // JSON システムは常に接続状態
      dispatch({ type: 'SET_LOADING', payload: false })
      dispatch({ type: 'SET_ERRORS', payload: [] })
    } else if (state.user && !state.isMockMode) {
      // 認証済みの場合は従来のSupabaseシステムを使用
      const currentGameState = {
        profileId: null, // JSONモードでは無効化
        pokemonLength: Array.isArray(gameStateHook.gameData?.pokemon) ? gameStateHook.gameData.pokemon.length : 0,
        trainersLength: 0, // デフォルト値
        expeditionsLength: 0, // デフォルト値
        facilitiesLength: 0, // デフォルト値
        transactionsLength: 0, // デフォルト値
        isConnected: true, // JSONモードでは常に接続済み
        isLoading: gameStateHook.isLoading
      }
      
      const newGameData: GameContextState['gameData'] = {
        profile: null, // JSONモードでは無効化
        pokemon: gameStateHook.gameData?.pokemon || [],
        trainers: [],
        expeditions: [],
        facilities: [],
        transactions: [],
        progress: null,
        analysis: []
      }
      
      dispatch({ type: 'UPDATE_GAME_DATA', payload: newGameData })
      dispatch({ type: 'SET_CONNECTION', payload: true })
      dispatch({ type: 'SET_LOADING', payload: gameStateHook.isLoading })
      dispatch({ type: 'SET_ERRORS', payload: [] })
    }
  }, [
    state.user?.id, 
    state.isMockMode, 
    shouldUseRealData
  ])

  // 進行状況マネージャーの初期化
  useEffect(() => {
    if (state.user && !state.isMockMode) {
      const progressManager = createProgressManager(state.user.id)
      dispatch({ type: 'SET_PROGRESS_MANAGER', payload: progressManager })
      
      // 初期進行状況とバランスをロード
      progressManager.getProgress().then((progress) => {
        if (progress) {
          dispatch({ type: 'UPDATE_PROGRESS', payload: progress })
        }
      })
      
      progressManager.getBalance().then((balance) => {
        if (balance) {
          dispatch({ type: 'UPDATE_BALANCE', payload: balance })
        }
      })
      
      console.log('📊 進行状況マネージャーが初期化されました')
    } else {
      dispatch({ type: 'SET_PROGRESS_MANAGER', payload: null })
      dispatch({ type: 'UPDATE_PROGRESS', payload: null as any })
      dispatch({ type: 'UPDATE_BALANCE', payload: null as any })
    }
  }, [state.user?.id, state.isMockMode])

  // 通知の自動削除
  const notificationsRef = useRef(state.ui.notifications)
  notificationsRef.current = state.ui.notifications
  
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      const currentNotifications = notificationsRef.current
      currentNotifications.forEach(notification => {
        if (notification.autoHide !== false && now.getTime() - notification.timestamp.getTime() > 5000) {
          dispatch({ type: 'REMOVE_NOTIFICATION', payload: notification.id })
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // 設定の保存
  const saveSettings = useCallback((newSettings: Partial<GameContextState['settings']>) => {
    const updatedSettings = { ...state.settings, ...newSettings };
    dispatch({ type: 'UPDATE_SETTINGS', payload: updatedSettings });
    
    // ローカルストレージに保存
    safeLocalStorage.setItem('tokiwa-settings', JSON.stringify(updatedSettings));
  }, [state.settings]);

  // UI状態の保存
  const saveUIState = useCallback((uiState: Partial<GameContextState['ui']>) => {
    const updatedUI = { ...state.ui, ...uiState };
    dispatch({ type: 'UPDATE_UI', payload: updatedUI });
    
    // ローカルストレージに保存
    safeLocalStorage.setItem('tokiwa-ui', JSON.stringify({
      currentPage: updatedUI.currentPage,
      selectedPokemon: updatedUI.selectedPokemon,
      selectedTrainer: updatedUI.selectedTrainer,
      selectedExpedition: updatedUI.selectedExpedition,
      isDarkMode: updatedUI.isDarkMode,
      soundEnabled: updatedUI.soundEnabled
    }));
  }, [state.ui]);

  // 初期化時の設定読み込み
  useEffect(() => {
    try {
      // 設定の読み込み
      const savedSettings = safeLocalStorage.getItem('tokiwa-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        dispatch({ type: 'UPDATE_SETTINGS', payload: parsed });
      }

      // UI状態の読み込み
      const savedUI = safeLocalStorage.getItem('tokiwa-ui');
      if (savedUI) {
        const parsed = JSON.parse(savedUI);
        dispatch({ type: 'UPDATE_UI', payload: parsed });
      }
    } catch (error) {
      console.warn('設定の読み込みに失敗しました:', error);
    }
  }, []);

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
  }, [state.settings.autoSave, state.settings.realTimeUpdates, state.settings.notifications, state.settings.difficulty, state.ui.isDarkMode, state.ui.soundEnabled])

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

    // プロファイル管理アクション
    createProfile: async (profileData: { trainer_name: string; school_name: string }) => {
      if (!supabase || !state.user) {
        throw new Error('認証が必要です')
      }

      try {
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: state.user.id,
            email: state.user.email,
            trainer_name: profileData.trainer_name,
            school_name: profileData.school_name,
            current_money: 50000, // 初期資金
            total_reputation: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (error) {
          console.error('プロファイル作成エラー:', error)
          throw error
        }

        console.log('✅ プロファイルが作成されました:', profileData.trainer_name)
        
        // ゲーム進行状況も初期化
        await supabase
          .from('game_progress')
          .insert({
            user_id: state.user.id,
            level: 1,
            experience: 0,
            next_level_exp: 1000,
            total_play_time: 0,
            achievement_points: 0,
            unlocked_features: ['basic_training', 'pokemon_management', 'simple_expeditions'],
            difficulty: 'normal',
            updated_at: new Date().toISOString()
          })

        // ゲームバランス設定も初期化
        await supabase
          .from('game_balance')
          .insert({
            user_id: state.user.id,
            trainer_growth_rate: 1.0,
            pokemon_growth_rate: 1.0,
            expedition_difficulty: 1.0,
            economy_inflation: 1.0,
            research_speed: 1.0,
            facility_efficiency: 1.0,
            updated_at: new Date().toISOString()
          })

      } catch (error) {
        console.error('プロファイル作成エラー:', error)
        throw error
      }
    },

    updateProfile: async (updates: Partial<{ trainer_name: string; school_name: string; current_money: number; total_reputation: number }>) => {
      if (!supabase || !state.user) {
        throw new Error('認証が必要です')
      }

      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', state.user.id)

        if (error) {
          console.error('プロファイル更新エラー:', error)
          throw error
        }

        console.log('✅ プロファイルが更新されました')
      } catch (error) {
        console.error('プロファイル更新エラー:', error)
        throw error
      }
    },

    // 進行状況管理アクション実装
    addExperience: async (exp: number) => {
      if (!state.progressManager) {
        throw new Error('進行状況マネージャーが初期化されていません')
      }
      const result = await state.progressManager.addExperience(exp)
      
      // 進行状況を更新
      const updatedProgress = await state.progressManager.getProgress()
      if (updatedProgress) {
        dispatch({ type: 'UPDATE_PROGRESS', payload: updatedProgress })
      }
      
      return result
    },

    updatePlayTime: async (minutesPlayed: number) => {
      if (!state.progressManager) {
        throw new Error('進行状況マネージャーが初期化されていません')
      }
      return await state.progressManager.updatePlayTime(minutesPlayed)
    },

    unlockFeature: async (feature: string) => {
      if (!state.progressManager) {
        throw new Error('進行状況マネージャーが初期化されていません')
      }
      const result = await state.progressManager.unlockFeature(feature)
      
      // 進行状況を更新
      const updatedProgress = await state.progressManager.getProgress()
      if (updatedProgress) {
        dispatch({ type: 'UPDATE_PROGRESS', payload: updatedProgress })
      }
      
      return result
    },

    addAchievementPoints: async (points: number) => {
      if (!state.progressManager) {
        throw new Error('進行状況マネージャーが初期化されていません')
      }
      const result = await state.progressManager.addAchievementPoints(points)
      
      // 進行状況を更新
      const updatedProgress = await state.progressManager.getProgress()
      if (updatedProgress) {
        dispatch({ type: 'UPDATE_PROGRESS', payload: updatedProgress })
      }
      
      return result
    },

    changeDifficulty: async (difficulty: GameProgress['difficulty']) => {
      if (!state.progressManager) {
        throw new Error('進行状況マネージャーが初期化されていません')
      }
      const result = await state.progressManager.changeDifficulty(difficulty)
      
      // 進行状況を更新
      const updatedProgress = await state.progressManager.getProgress()
      if (updatedProgress) {
        dispatch({ type: 'UPDATE_PROGRESS', payload: updatedProgress })
      }
      
      return result
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

  // モックモードの自動判定と初期化
  const prevMockModeStateRef = useRef({
    hasSupabase: !!supabase,
    isAuthenticated: false,
    authLoading: true,
    hasUser: false,
    isMockMode: false
  })
  
  useEffect(() => {
    const currentMockModeState = {
      hasSupabase: !!supabase,
      isAuthenticated: state.isAuthenticated,
      authLoading: state.authLoading,
      hasUser: !!state.user,
      isMockMode: state.isMockMode
    }
    
    // 状態が変わった場合のみ処理
    const hasStateChanged = JSON.stringify(currentMockModeState) !== JSON.stringify(prevMockModeStateRef.current)
    
    if (hasStateChanged) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🎮 GameContext: モックモード判定開始', currentMockModeState)
      }
      
      // 既にモックモードが有効な場合は何もしない
      if (state.isMockMode) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🎮 GameContext: モックモードは既に有効です')
        }
        prevMockModeStateRef.current = currentMockModeState
        return
      }
      
      // モックモードの自動有効化を無効化（ユーザーが明示的にクイックスタートを選択した場合のみ有効にする）
      // if (!supabase || (!state.isAuthenticated && !state.authLoading)) {
      //   const shouldEnableMockMode = !supabase || 
      //     (state.authLoading === false && !state.isAuthenticated && !state.user)
      //   
      //   if (process.env.NODE_ENV === 'development') {
      //     console.log('🎮 GameContext: モックモード判定結果', { shouldEnableMockMode })
      //   }
      //   
      //   if (shouldEnableMockMode) {
      //     console.log('🎮 GameContext: モックモードを有効化します')
      //     dispatch({ type: 'ENABLE_MOCK_MODE' })
      //     
      //     // モックユーザーを設定
      //     dispatch({ type: 'SET_USER', payload: MOCK_USER as any })
      //     dispatch({ type: 'SET_LOADING', payload: false })
      //     dispatch({ type: 'SET_AUTH_LOADING', payload: false })
      //   }
      // }
      
      prevMockModeStateRef.current = currentMockModeState
    }
  }, [supabase, state.isAuthenticated, state.authLoading, state.user?.id, state.isMockMode])

  // 認証状態の初期化完了を待つ
  useEffect(() => {
    // 認証の初期化が完了したら、適切な状態に設定
    if (!state.authLoading) {
      if (state.isMockMode) {
        // モックモードが有効な場合は、初期化完了
        console.log('🎮 GameContext: モックモード有効、初期化完了')
        dispatch({ type: 'SET_LOADING', payload: false })
      } else if (state.isAuthenticated) {
        // 認証されている場合も、ローディング状態を終了
        console.log('🎮 GameContext: 認証完了、ローディング終了')
        dispatch({ type: 'SET_LOADING', payload: false })
      } else {
        // 認証されていない場合は、ローディング状態を終了
        console.log('🎮 GameContext: 認証初期化完了、未認証状態')
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }
  }, [state.authLoading, state.isAuthenticated, state.isMockMode])

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
  
  // シンプルな認証状態判定
  const isMockMode = state.isMockMode
  const user = isMockMode ? MOCK_USER : state.user
  const isAuthenticated = state.isAuthenticated
  const isLoading = state.isLoading

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
    authError: state.session?.error || null,
    
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