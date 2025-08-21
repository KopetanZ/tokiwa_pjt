/**
 * 新しい型安全なGameContext
 * 改善された状態管理システムを使用
 */

'use client'

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react'
import { User } from '@supabase/supabase-js'

import { 
  AppState, 
  AppAction, 
  initialAppState, 
  selectors,
  Pokemon,
  Trainer,
  Expedition,
  Facility,
  Transaction,
  UserProfile,
  UserSettings,
  Notification,
} from '@/lib/state-management'

import { appReducer, actions } from '@/lib/state-reducer'
import { GameError, ErrorHandler, createGameError } from '@/lib/unified-error-handling'
import { supabase } from '@/lib/supabase'
import { MOCK_USER, MOCK_GAME_DATA } from '@/lib/mock-data'
import { APP_CONFIG } from '@/config/app'

// =============================================================================
// Context型定義
// =============================================================================

export interface GameContextValue {
  // 状態
  state: AppState
  
  // ユーザー関連
  user: User | null
  gameProfile: UserProfile | null
  isAuthenticated: boolean
  isMockMode: boolean
  settings: UserSettings | null
  
  // システム状態
  isConnected: boolean
  isLoading: boolean
  serverStatus: 'online' | 'offline' | 'maintenance'
  
  // ゲームデータ
  pokemon: Pokemon[]
  trainers: Trainer[]
  expeditions: Expedition[]
  facilities: Facility[]
  transactions: Transaction[]
  
  // 派生データ
  availableTrainers: Trainer[]
  availablePokemon: Pokemon[]
  activeExpeditions: Expedition[]
  currentMoney: number
  
  // UI状態
  currentPage: string
  selectedItems: {
    pokemon: string | null
    trainer: string | null
    expedition: string | null
    facility: string | null
  }
  
  // 通知・エラー
  errors: GameError[]
  notifications: Notification[]
  
  // アクション関数
  dispatch: React.Dispatch<AppAction>
  
  // 便利な操作関数
  actions: {
    // ユーザー関連
    signIn: (user: User) => void
    signOut: () => void
    updateSettings: (settings: Partial<UserSettings>) => void
    
    // データ操作
    loadPokemon: () => Promise<void>
    loadTrainers: () => Promise<void>
    loadExpeditions: () => Promise<void>
    loadFacilities: () => Promise<void>
    loadTransactions: () => Promise<void>
    
    // UI操作
    setCurrentPage: (page: string) => void
    selectPokemon: (id: string | null) => void
    selectTrainer: (id: string | null) => void
    selectExpedition: (id: string | null) => void
    selectFacility: (id: string | null) => void
    
    // モーダル操作
    openModal: (name: string, data?: any) => void
    closeModal: (name: string) => void
    closeAllModals: () => void
    
    // 通知操作
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
    removeNotification: (id: string) => void
    clearNotifications: () => void
    
    // エラー操作
    addError: (error: GameError) => void
    removeError: (code: string) => void
    clearErrors: () => void
    handleError: (error: unknown, context?: Record<string, any>) => GameError
    
    // 接続・同期
    connect: () => Promise<void>
    disconnect: () => void
    syncData: () => Promise<void>
    
    // キャッシュ操作
    invalidateCache: (type: string) => void
    clearCache: () => void
  }
}

// =============================================================================
// Context作成
// =============================================================================

const GameContext = createContext<GameContextValue | undefined>(undefined)

// =============================================================================
// Provider実装
// =============================================================================

export interface GameProviderProps {
  children: React.ReactNode
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialAppState)
  
  // ==========================================================================
  // 派生データ（メモ化）
  // ==========================================================================
  
  const derivedState = useMemo(() => ({
    user: selectors.currentUser(state),
    gameProfile: state.user.gameProfile,
    isAuthenticated: selectors.isAuthenticated(state),
    isMockMode: state.user.isMockMode,
    settings: selectors.userSettings(state),
    
    isConnected: state.system.isConnected,
    isLoading: selectors.isLoading(state),
    serverStatus: state.system.serverStatus,
    
    pokemon: state.game.pokemon,
    trainers: state.game.trainers,
    expeditions: state.game.expeditions,
    facilities: state.game.facilities,
    transactions: state.game.transactions,
    
    availableTrainers: selectors.availableTrainers(state),
    availablePokemon: selectors.availablePokemon(state),
    activeExpeditions: selectors.activeExpeditions(state),
    currentMoney: selectors.currentMoney(state),
    
    currentPage: selectors.currentPage(state),
    selectedItems: selectors.selectedItems(state),
    
    errors: state.notifications.errors,
    notifications: state.notifications.messages,
  }), [state])
  
  // ==========================================================================
  // アクション関数
  // ==========================================================================
  
  const actionFunctions = useMemo(() => ({
    // ユーザー関連
    signIn: (user: User) => {
      dispatch(actions.setUserProfile(user))
      dispatch(actions.setAuthStatus(true))
      dispatch(actions.setMockMode(false))
    },
    
    signOut: () => {
      dispatch(actions.setUserProfile(null))
      dispatch(actions.setGameProfile(null))
      dispatch(actions.setAuthStatus(false))
      dispatch(actions.clearErrors())
      dispatch(actions.clearNotifications())
    },
    
    updateSettings: (settings: Partial<UserSettings>) => {
      dispatch(actions.updateUserSettings(settings))
    },
    
    // データ読み込み
    loadPokemon: async () => {
      try {
        dispatch(actions.setLoadingStatus(true))
        
        if (state.user.isMockMode) {
          // モックデータを使用
          dispatch(actions.setPokemon(MOCK_GAME_DATA.pokemon as Pokemon[]))
        } else {
          // 実際のデータを取得
          if (!supabase || !state.user.profile) return
          
          const { data, error } = await supabase
            .from('pokemon')
            .select('*')
            .eq('user_id', state.user.profile.id)
          
          if (error) {
            throw error
          }
          
          dispatch(actions.setPokemon(data as Pokemon[]))
        }
      } catch (error) {
        const gameError = ErrorHandler.handle(error)
        dispatch(actions.addError(gameError))
      } finally {
        dispatch(actions.setLoadingStatus(false))
      }
    },
    
    loadTrainers: async () => {
      try {
        dispatch(actions.setLoadingStatus(true))
        
        if (state.user.isMockMode) {
          dispatch(actions.setTrainers(MOCK_GAME_DATA.trainers as unknown as Trainer[]))
        } else {
          if (!supabase || !state.user.profile) return
          
          const { data, error } = await supabase
            .from('trainers')
            .select('*')
            .eq('user_id', state.user.profile.id)
          
          if (error) throw error
          
          dispatch(actions.setTrainers(data as Trainer[]))
        }
      } catch (error) {
        const gameError = ErrorHandler.handle(error)
        dispatch(actions.addError(gameError))
      } finally {
        dispatch(actions.setLoadingStatus(false))
      }
    },
    
    loadExpeditions: async () => {
      try {
        dispatch(actions.setLoadingStatus(true))
        
        if (state.user.isMockMode) {
          dispatch(actions.setExpeditions(MOCK_GAME_DATA.expeditions as unknown as Expedition[]))
        } else {
          if (!supabase || !state.user.profile) return
          
          const { data, error } = await supabase
            .from('expeditions')
            .select('*')
            .eq('user_id', state.user.profile.id)
            .order('created_at', { ascending: false })
          
          if (error) throw error
          
          dispatch(actions.setExpeditions(data as Expedition[]))
        }
      } catch (error) {
        const gameError = ErrorHandler.handle(error)
        dispatch(actions.addError(gameError))
      } finally {
        dispatch(actions.setLoadingStatus(false))
      }
    },
    
    loadFacilities: async () => {
      try {
        dispatch(actions.setLoadingStatus(true))
        
        if (state.user.isMockMode) {
          dispatch({ type: 'SET_FACILITIES', payload: MOCK_GAME_DATA.facilities as unknown as Facility[] })
        } else {
          if (!supabase || !state.user.profile) return
          
          const { data, error } = await supabase
            .from('facilities')
            .select('*')
            .eq('user_id', state.user.profile.id)
          
          if (error) throw error
          
          dispatch({ type: 'SET_FACILITIES', payload: data as Facility[] })
        }
      } catch (error) {
        const gameError = ErrorHandler.handle(error)
        dispatch(actions.addError(gameError))
      } finally {
        dispatch(actions.setLoadingStatus(false))
      }
    },
    
    loadTransactions: async () => {
      try {
        dispatch(actions.setLoadingStatus(true))
        
        if (state.user.isMockMode) {
          dispatch({ type: 'SET_TRANSACTIONS', payload: MOCK_GAME_DATA.transactions as unknown as Transaction[] })
        } else {
          if (!supabase || !state.user.profile) return
          
          const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', state.user.profile.id)
            .order('created_at', { ascending: false })
            .limit(100)
          
          if (error) throw error
          
          dispatch({ type: 'SET_TRANSACTIONS', payload: data as Transaction[] })
        }
      } catch (error) {
        const gameError = ErrorHandler.handle(error)
        dispatch(actions.addError(gameError))
      } finally {
        dispatch(actions.setLoadingStatus(false))
      }
    },
    
    // UI操作
    setCurrentPage: (page: string) => {
      dispatch(actions.setCurrentPage(page))
    },
    
    selectPokemon: (id: string | null) => {
      dispatch(actions.selectPokemon(id))
    },
    
    selectTrainer: (id: string | null) => {
      dispatch(actions.selectTrainer(id))
    },
    
    selectExpedition: (id: string | null) => {
      dispatch({ type: 'SELECT_EXPEDITION', payload: id })
    },
    
    selectFacility: (id: string | null) => {
      dispatch({ type: 'SELECT_FACILITY', payload: id })
    },
    
    // モーダル操作
    openModal: (name: string, data?: any) => {
      dispatch(actions.openModal(name, data))
    },
    
    closeModal: (name: string) => {
      dispatch(actions.closeModal(name))
    },
    
    closeAllModals: () => {
      dispatch({ type: 'CLOSE_ALL_MODALS' })
    },
    
    // 通知操作
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => {
      const newNotification: Notification = {
        ...notification,
        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      }
      dispatch(actions.addNotification(newNotification))
    },
    
    removeNotification: (id: string) => {
      dispatch(actions.removeNotification(id))
    },
    
    clearNotifications: () => {
      dispatch(actions.clearNotifications())
    },
    
    // エラー操作
    addError: (error: GameError) => {
      dispatch(actions.addError(error))
    },
    
    removeError: (code: string) => {
      dispatch(actions.removeError(code))
    },
    
    clearErrors: () => {
      dispatch(actions.clearErrors())
    },
    
    handleError: (error: unknown, context?: Record<string, any>) => {
      const gameError = ErrorHandler.handle(error, context)
      dispatch(actions.addError(gameError))
      return gameError
    },
    
    // 接続・同期
    connect: async () => {
      try {
        dispatch(actions.setConnectionStatus(true))
        dispatch(actions.setServerStatus('online'))
        
        // 初期データの読み込み
        await Promise.all([
          actionFunctions.loadPokemon(),
          actionFunctions.loadTrainers(),
          actionFunctions.loadExpeditions(),
          actionFunctions.loadFacilities(),
          actionFunctions.loadTransactions(),
        ])
        
        dispatch(actions.setSyncTime(new Date()))
      } catch (error) {
        dispatch(actions.setServerStatus('offline'))
        actionFunctions.handleError(error, { operation: 'connect' })
      }
    },
    
    disconnect: () => {
      dispatch(actions.setConnectionStatus(false))
      dispatch(actions.setServerStatus('offline'))
    },
    
    syncData: async () => {
      if (!state.system.isConnected) return
      
      await Promise.all([
        actionFunctions.loadPokemon(),
        actionFunctions.loadTrainers(),
        actionFunctions.loadExpeditions(),
        actionFunctions.loadFacilities(),
        actionFunctions.loadTransactions(),
      ])
      
      dispatch(actions.setSyncTime(new Date()))
    },
    
    // キャッシュ操作
    invalidateCache: (type: string) => {
      dispatch({ type: 'INVALIDATE_CACHE', payload: type })
    },
    
    clearCache: () => {
      dispatch({ type: 'CLEAR_CACHE' })
    },
  }), [state, dispatch])
  
  // ==========================================================================
  // 初期化・効果
  // ==========================================================================
  
  useEffect(() => {
    // 認証状態の確認
    const checkAuth = async () => {
      if (!supabase) {
        dispatch(actions.setMockMode(true))
        dispatch(actions.setUserProfile(MOCK_USER))
        return
      }
      
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          dispatch(actions.setUserProfile(user))
          dispatch(actions.setAuthStatus(true))
        } else {
          dispatch(actions.setMockMode(true))
          dispatch(actions.setUserProfile(MOCK_USER))
        }
      } catch (error) {
        console.warn('認証確認エラー:', error)
        dispatch(actions.setMockMode(true))
        dispatch(actions.setUserProfile(MOCK_USER))
      }
    }
    
    checkAuth()
  }, [])
  
  // 認証状態が確定したらデータ読み込み
  useEffect(() => {
    if (state.user.profile) {
      actionFunctions.connect()
    }
  }, [state.user.profile])
  
  // ==========================================================================
  // Context値の構築
  // ==========================================================================
  
  const contextValue: GameContextValue = useMemo(() => ({
    state,
    ...derivedState,
    dispatch,
    actions: actionFunctions,
  }), [state, derivedState, actionFunctions])
  
  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  )
}

// =============================================================================
// Hooks
// =============================================================================

export function useGameContext(): GameContextValue {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider')
  }
  return context
}

// 便利なセレクターHooks
export function useAuth() {
  const { user, isAuthenticated, isMockMode, actions } = useGameContext()
  return { 
    user, 
    isAuthenticated, 
    isMockMode, 
    signIn: actions.signIn,
    signOut: actions.signOut 
  }
}

export function useGameData() {
  const { 
    pokemon, 
    trainers, 
    expeditions, 
    facilities, 
    transactions,
    availableTrainers,
    availablePokemon,
    activeExpeditions,
    currentMoney 
  } = useGameContext()
  
  return {
    pokemon,
    trainers,
    expeditions,
    facilities,
    transactions,
    availableTrainers,
    availablePokemon,
    activeExpeditions,
    currentMoney,
  }
}

export function useNotifications() {
  const { notifications, errors, actions } = useGameContext()
  return {
    notifications,
    errors,
    addNotification: actions.addNotification,
    removeNotification: actions.removeNotification,
    clearNotifications: actions.clearNotifications,
    addError: actions.addError,
    removeError: actions.removeError,
    clearErrors: actions.clearErrors,
    handleError: actions.handleError,
  }
}

export function useUI() {
  const { currentPage, selectedItems, actions } = useGameContext()
  return {
    currentPage,
    selectedItems,
    setCurrentPage: actions.setCurrentPage,
    selectPokemon: actions.selectPokemon,
    selectTrainer: actions.selectTrainer,
    selectExpedition: actions.selectExpedition,
    selectFacility: actions.selectFacility,
    openModal: actions.openModal,
    closeModal: actions.closeModal,
    closeAllModals: actions.closeAllModals,
  }
}