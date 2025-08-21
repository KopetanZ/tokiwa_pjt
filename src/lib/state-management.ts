/**
 * 型安全な状態管理システム
 * GameContextで使用する状態とアクションの型定義
 */

import { User } from '@supabase/supabase-js'
import { GameError } from './unified-error-handling'
import { PokemonIVs } from '../types/game-data'

// =============================================================================
// 基本型定義
// =============================================================================

// ユーザープロフィール
export interface UserProfile {
  id: string
  guest_name: string
  school_name: string
  current_money: number
  total_reputation: number
  ui_theme: string
  settings: UserSettings | null
  created_at: string
  updated_at: string
}

// ユーザー設定
export interface UserSettings {
  autoSave: boolean
  realTimeUpdates: boolean
  notifications: boolean
  difficulty: 'easy' | 'normal' | 'hard' | 'expert'
  soundEnabled: boolean
  musicVolume: number
  effectVolume: number
  language: 'ja' | 'en'
}

// ポケモン詳細情報
export interface Pokemon {
  id: string
  user_id: string
  dex_number: number
  name: string
  level: number
  hp: number
  attack: number
  defense: number
  special_attack: number
  special_defense: number
  speed: number
  types: string[]
  nature: string | null
  is_shiny: boolean
  ivs: PokemonIVs
  status: 'available' | 'training' | 'expedition' | 'injured' | 'resting'
  friendship: number
  moves: string[]
  caught_at: string
  updated_at: string
}

// トレーナー詳細情報
export interface Trainer {
  id: string
  user_id: string
  name: string
  job_id: number | null
  job_level: number
  job_experience: number
  preferences: Record<string, number>
  compliance_rate: number
  trust_level: number
  personality: string
  status: 'available' | 'on_expedition' | 'training' | 'resting' | 'injured'
  current_expedition_id: string | null
  salary: number
  total_earned: number
  sprite_path: string | null
  created_at: string
  updated_at: string
}

// 派遣情報
export interface Expedition {
  id: string
  user_id: string
  trainer_id: string
  location_id: number
  expedition_mode: string
  target_duration_hours: number
  status: 'planning' | 'active' | 'completed' | 'failed' | 'cancelled'
  started_at: string | null
  expected_return: string | null
  actual_return: string | null
  current_progress: number
  created_at: string
  updated_at: string
}

// 施設情報
export interface Facility {
  id: string
  user_id: string
  facility_type: string
  level: number
  max_level: number
  upgrade_cost: number
  maintenance_cost: number
  construction_cost: number
  sprite_path: string | null
  status: 'operational' | 'under_construction' | 'maintenance' | 'disabled'
  construction_started: string | null
  construction_completed: string | null
  created_at: string
  updated_at: string
}

// 取引記録
export interface Transaction {
  id: string
  user_id: string
  type: 'income' | 'expense'
  category: string
  amount: number
  description: string
  reference_id: string | null
  created_at: string
}

// 通知情報
export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  autoHide: boolean
  duration: number
  actions?: NotificationAction[]
}

export interface NotificationAction {
  id: string
  label: string
  handler: () => void
  style: 'primary' | 'secondary' | 'danger'
}

// 進行状況
export interface GameProgress {
  id: string
  user_id: string
  level: number
  experience: number
  next_level_exp: number
  total_play_time: number
  achievement_points: number
  unlocked_features: string[]
  difficulty: string
  created_at: string
  updated_at: string
}

// =============================================================================
// アプリケーション状態
// =============================================================================

export interface AppState {
  // ユーザー関連
  user: {
    profile: User | null
    gameProfile: UserProfile | null
    isAuthenticated: boolean
    isMockMode: boolean
    settings: UserSettings | null
  }
  
  // 接続・システム状態
  system: {
    isConnected: boolean
    isLoading: boolean
    lastSyncTime: Date | null
    backgroundSyncEnabled: boolean
    serverStatus: 'online' | 'offline' | 'maintenance'
  }
  
  // エラー・通知管理
  notifications: {
    errors: GameError[]
    messages: Notification[]
    maxErrors: number
    maxNotifications: number
  }
  
  // ゲームデータ
  game: {
    pokemon: Pokemon[]
    trainers: Trainer[]
    expeditions: Expedition[]
    facilities: Facility[]
    transactions: Transaction[]
    progress: GameProgress | null
  }
  
  // UI状態
  ui: {
    currentPage: string
    selectedPokemon: string | null
    selectedTrainer: string | null
    selectedExpedition: string | null
    selectedFacility: string | null
    modals: {
      [modalName: string]: {
        isOpen: boolean
        data?: any
      }
    }
    filters: {
      pokemonType?: string
      trainerStatus?: string
      expeditionStatus?: string
    }
    sort: {
      pokemon?: {
        field: keyof Pokemon
        order: 'asc' | 'desc'
      }
      trainers?: {
        field: keyof Trainer
        order: 'asc' | 'desc'
      }
    }
  }
  
  // キャッシュ管理
  cache: {
    lastUpdated: {
      pokemon: Date | null
      trainers: Date | null
      expeditions: Date | null
      facilities: Date | null
      transactions: Date | null
    }
    invalidationTimes: {
      [key: string]: Date
    }
  }
}

// =============================================================================
// アクション型定義
// =============================================================================

// ユーザー関連アクション
export type UserAction = 
  | { type: 'SET_USER_PROFILE'; payload: User | null }
  | { type: 'SET_GAME_PROFILE'; payload: UserProfile | null }
  | { type: 'UPDATE_USER_SETTINGS'; payload: Partial<UserSettings> }
  | { type: 'SET_AUTH_STATUS'; payload: boolean }
  | { type: 'SET_MOCK_MODE'; payload: boolean }

// システム関連アクション
export type SystemAction =
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean }
  | { type: 'SET_LOADING_STATUS'; payload: boolean }
  | { type: 'SET_SYNC_TIME'; payload: Date }
  | { type: 'SET_SERVER_STATUS'; payload: 'online' | 'offline' | 'maintenance' }
  | { type: 'TOGGLE_BACKGROUND_SYNC'; payload: boolean }

// 通知関連アクション
export type NotificationActions = 
  | { type: 'ADD_ERROR'; payload: GameError }
  | { type: 'REMOVE_ERROR'; payload: string }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }

// ゲームデータ関連アクション
export type GameDataAction =
  | { type: 'SET_POKEMON'; payload: Pokemon[] }
  | { type: 'ADD_POKEMON'; payload: Pokemon }
  | { type: 'UPDATE_POKEMON'; payload: { id: string; data: Partial<Pokemon> } }
  | { type: 'REMOVE_POKEMON'; payload: string }
  | { type: 'SET_TRAINERS'; payload: Trainer[] }
  | { type: 'ADD_TRAINER'; payload: Trainer }
  | { type: 'UPDATE_TRAINER'; payload: { id: string; data: Partial<Trainer> } }
  | { type: 'REMOVE_TRAINER'; payload: string }
  | { type: 'SET_EXPEDITIONS'; payload: Expedition[] }
  | { type: 'ADD_EXPEDITION'; payload: Expedition }
  | { type: 'UPDATE_EXPEDITION'; payload: { id: string; data: Partial<Expedition> } }
  | { type: 'REMOVE_EXPEDITION'; payload: string }
  | { type: 'SET_FACILITIES'; payload: Facility[] }
  | { type: 'ADD_FACILITY'; payload: Facility }
  | { type: 'UPDATE_FACILITY'; payload: { id: string; data: Partial<Facility> } }
  | { type: 'REMOVE_FACILITY'; payload: string }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'SET_PROGRESS'; payload: GameProgress }

// UI関連アクション
export type UIAction =
  | { type: 'SET_CURRENT_PAGE'; payload: string }
  | { type: 'SELECT_POKEMON'; payload: string | null }
  | { type: 'SELECT_TRAINER'; payload: string | null }
  | { type: 'SELECT_EXPEDITION'; payload: string | null }
  | { type: 'SELECT_FACILITY'; payload: string | null }
  | { type: 'OPEN_MODAL'; payload: { name: string; data?: any } }
  | { type: 'CLOSE_MODAL'; payload: string }
  | { type: 'CLOSE_ALL_MODALS' }
  | { type: 'SET_FILTER'; payload: { type: string; value: any } }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'SET_SORT'; payload: { type: string; field: string; order: 'asc' | 'desc' } }

// キャッシュ関連アクション
export type CacheAction =
  | { type: 'UPDATE_CACHE_TIME'; payload: { type: string; time: Date } }
  | { type: 'INVALIDATE_CACHE'; payload: string }
  | { type: 'CLEAR_CACHE' }

// 統合アクション型
export type AppAction = 
  | UserAction 
  | SystemAction 
  | NotificationActions 
  | GameDataAction 
  | UIAction 
  | CacheAction

// =============================================================================
// セレクター関数（状態から派生した値を取得）
// =============================================================================

export const selectors = {
  // ユーザー関連
  isAuthenticated: (state: AppState) => state.user.isAuthenticated,
  currentUser: (state: AppState) => state.user.profile,
  userSettings: (state: AppState) => state.user.settings,
  currentMoney: (state: AppState) => state.user.gameProfile?.current_money || 0,
  
  // システム関連
  isOnline: (state: AppState) => state.system.isConnected && state.system.serverStatus === 'online',
  isLoading: (state: AppState) => state.system.isLoading,
  
  // 通知関連
  errorCount: (state: AppState) => state.notifications.errors.length,
  notificationCount: (state: AppState) => state.notifications.messages.length,
  criticalErrors: (state: AppState) => state.notifications.errors.filter(e => e.severity === 'critical'),
  
  // ゲームデータ関連
  availablePokemon: (state: AppState) => state.game.pokemon.filter(p => p.status === 'available'),
  availableTrainers: (state: AppState) => state.game.trainers.filter(t => t.status === 'available'),
  activeExpeditions: (state: AppState) => state.game.expeditions.filter(e => e.status === 'active'),
  operationalFacilities: (state: AppState) => state.game.facilities.filter(f => f.status === 'operational'),
  
  // 統計情報
  totalPokemon: (state: AppState) => state.game.pokemon.length,
  totalTrainers: (state: AppState) => state.game.trainers.length,
  recentTransactions: (state: AppState) => state.game.transactions.slice(0, 10),
  
  // UI関連
  currentPage: (state: AppState) => state.ui.currentPage,
  selectedItems: (state: AppState) => ({
    pokemon: state.ui.selectedPokemon,
    trainer: state.ui.selectedTrainer,
    expedition: state.ui.selectedExpedition,
    facility: state.ui.selectedFacility,
  }),
  openModals: (state: AppState) => Object.entries(state.ui.modals)
    .filter(([_, modal]) => modal.isOpen)
    .map(([name]) => name),
}

// =============================================================================
// 初期状態
// =============================================================================

export const initialAppState: AppState = {
  user: {
    profile: null,
    gameProfile: null,
    isAuthenticated: false,
    isMockMode: false,
    settings: null,
  },
  
  system: {
    isConnected: false,
    isLoading: false,
    lastSyncTime: null,
    backgroundSyncEnabled: true,
    serverStatus: 'offline',
  },
  
  notifications: {
    errors: [],
    messages: [],
    maxErrors: 50,
    maxNotifications: 10,
  },
  
  game: {
    pokemon: [],
    trainers: [],
    expeditions: [],
    facilities: [],
    transactions: [],
    progress: null,
  },
  
  ui: {
    currentPage: 'dashboard',
    selectedPokemon: null,
    selectedTrainer: null,
    selectedExpedition: null,
    selectedFacility: null,
    modals: {},
    filters: {},
    sort: {},
  },
  
  cache: {
    lastUpdated: {
      pokemon: null,
      trainers: null,
      expeditions: null,
      facilities: null,
      transactions: null,
    },
    invalidationTimes: {},
  },
}