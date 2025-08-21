/**
 * 状態管理用Reducer関数
 * AppStateとAppActionを使用した型安全な状態更新
 */

import { 
  AppState, 
  AppAction, 
  initialAppState
} from './state-management'

import { GameError } from './unified-error-handling'

// =============================================================================
// メインReducer
// =============================================================================

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // ユーザー関連
    case 'SET_USER_PROFILE':
      return {
        ...state,
        user: {
          ...state.user,
          profile: action.payload,
          isAuthenticated: action.payload !== null,
        },
      }
    
    case 'SET_GAME_PROFILE':
      return {
        ...state,
        user: {
          ...state.user,
          gameProfile: action.payload,
        },
      }
    
    case 'UPDATE_USER_SETTINGS':
      return {
        ...state,
        user: {
          ...state.user,
          settings: state.user.settings 
            ? { ...state.user.settings, ...action.payload }
            : action.payload as any,
        },
      }
    
    case 'SET_AUTH_STATUS':
      return {
        ...state,
        user: {
          ...state.user,
          isAuthenticated: action.payload,
        },
      }
    
    case 'SET_MOCK_MODE':
      return {
        ...state,
        user: {
          ...state.user,
          isMockMode: action.payload,
        },
      }
    
    // システム関連
    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        system: {
          ...state.system,
          isConnected: action.payload,
        },
      }
    
    case 'SET_LOADING_STATUS':
      return {
        ...state,
        system: {
          ...state.system,
          isLoading: action.payload,
        },
      }
    
    case 'SET_SYNC_TIME':
      return {
        ...state,
        system: {
          ...state.system,
          lastSyncTime: action.payload,
        },
      }
    
    case 'SET_SERVER_STATUS':
      return {
        ...state,
        system: {
          ...state.system,
          serverStatus: action.payload,
        },
      }
    
    case 'TOGGLE_BACKGROUND_SYNC':
      return {
        ...state,
        system: {
          ...state.system,
          backgroundSyncEnabled: action.payload,
        },
      }
    
    // 通知・エラー関連
    case 'ADD_ERROR':
      const newErrors = [action.payload, ...state.notifications.errors]
        .slice(0, state.notifications.maxErrors)
      
      return {
        ...state,
        notifications: {
          ...state.notifications,
          errors: newErrors,
        },
      }
    
    case 'REMOVE_ERROR':
      return {
        ...state,
        notifications: {
          ...state.notifications,
          errors: state.notifications.errors.filter(error => error.code !== action.payload),
        },
      }
    
    case 'CLEAR_ERRORS':
      return {
        ...state,
        notifications: {
          ...state.notifications,
          errors: [],
        },
      }
    
    case 'ADD_NOTIFICATION':
      const newNotifications = [action.payload, ...state.notifications.messages]
        .slice(0, state.notifications.maxNotifications)
      
      return {
        ...state,
        notifications: {
          ...state.notifications,
          messages: newNotifications,
        },
      }
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: {
          ...state.notifications,
          messages: state.notifications.messages.filter(n => n.id !== action.payload),
        },
      }
    
    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: {
          ...state.notifications,
          messages: [],
        },
      }
    
    // ポケモン関連
    case 'SET_POKEMON':
      return {
        ...state,
        game: {
          ...state.game,
          pokemon: action.payload,
        },
        cache: {
          ...state.cache,
          lastUpdated: {
            ...state.cache.lastUpdated,
            pokemon: new Date(),
          },
        },
      }
    
    case 'ADD_POKEMON':
      return {
        ...state,
        game: {
          ...state.game,
          pokemon: [...state.game.pokemon, action.payload],
        },
      }
    
    case 'UPDATE_POKEMON':
      return {
        ...state,
        game: {
          ...state.game,
          pokemon: state.game.pokemon.map(pokemon =>
            pokemon.id === action.payload.id
              ? { ...pokemon, ...action.payload.data }
              : pokemon
          ),
        },
      }
    
    case 'REMOVE_POKEMON':
      return {
        ...state,
        game: {
          ...state.game,
          pokemon: state.game.pokemon.filter(pokemon => pokemon.id !== action.payload),
        },
      }
    
    // トレーナー関連
    case 'SET_TRAINERS':
      return {
        ...state,
        game: {
          ...state.game,
          trainers: action.payload,
        },
        cache: {
          ...state.cache,
          lastUpdated: {
            ...state.cache.lastUpdated,
            trainers: new Date(),
          },
        },
      }
    
    case 'ADD_TRAINER':
      return {
        ...state,
        game: {
          ...state.game,
          trainers: [...state.game.trainers, action.payload],
        },
      }
    
    case 'UPDATE_TRAINER':
      return {
        ...state,
        game: {
          ...state.game,
          trainers: state.game.trainers.map(trainer =>
            trainer.id === action.payload.id
              ? { ...trainer, ...action.payload.data }
              : trainer
          ),
        },
      }
    
    case 'REMOVE_TRAINER':
      return {
        ...state,
        game: {
          ...state.game,
          trainers: state.game.trainers.filter(trainer => trainer.id !== action.payload),
        },
      }
    
    // 派遣関連
    case 'SET_EXPEDITIONS':
      return {
        ...state,
        game: {
          ...state.game,
          expeditions: action.payload,
        },
        cache: {
          ...state.cache,
          lastUpdated: {
            ...state.cache.lastUpdated,
            expeditions: new Date(),
          },
        },
      }
    
    case 'ADD_EXPEDITION':
      return {
        ...state,
        game: {
          ...state.game,
          expeditions: [...state.game.expeditions, action.payload],
        },
      }
    
    case 'UPDATE_EXPEDITION':
      return {
        ...state,
        game: {
          ...state.game,
          expeditions: state.game.expeditions.map(expedition =>
            expedition.id === action.payload.id
              ? { ...expedition, ...action.payload.data }
              : expedition
          ),
        },
      }
    
    case 'REMOVE_EXPEDITION':
      return {
        ...state,
        game: {
          ...state.game,
          expeditions: state.game.expeditions.filter(expedition => expedition.id !== action.payload),
        },
      }
    
    // 施設関連
    case 'SET_FACILITIES':
      return {
        ...state,
        game: {
          ...state.game,
          facilities: action.payload,
        },
        cache: {
          ...state.cache,
          lastUpdated: {
            ...state.cache.lastUpdated,
            facilities: new Date(),
          },
        },
      }
    
    case 'ADD_FACILITY':
      return {
        ...state,
        game: {
          ...state.game,
          facilities: [...state.game.facilities, action.payload],
        },
      }
    
    case 'UPDATE_FACILITY':
      return {
        ...state,
        game: {
          ...state.game,
          facilities: state.game.facilities.map(facility =>
            facility.id === action.payload.id
              ? { ...facility, ...action.payload.data }
              : facility
          ),
        },
      }
    
    case 'REMOVE_FACILITY':
      return {
        ...state,
        game: {
          ...state.game,
          facilities: state.game.facilities.filter(facility => facility.id !== action.payload),
        },
      }
    
    // 取引関連
    case 'SET_TRANSACTIONS':
      return {
        ...state,
        game: {
          ...state.game,
          transactions: action.payload,
        },
        cache: {
          ...state.cache,
          lastUpdated: {
            ...state.cache.lastUpdated,
            transactions: new Date(),
          },
        },
      }
    
    case 'ADD_TRANSACTION':
      return {
        ...state,
        game: {
          ...state.game,
          transactions: [action.payload, ...state.game.transactions],
        },
      }
    
    case 'SET_PROGRESS':
      return {
        ...state,
        game: {
          ...state.game,
          progress: action.payload,
        },
      }
    
    // UI関連
    case 'SET_CURRENT_PAGE':
      return {
        ...state,
        ui: {
          ...state.ui,
          currentPage: action.payload,
        },
      }
    
    case 'SELECT_POKEMON':
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedPokemon: action.payload,
        },
      }
    
    case 'SELECT_TRAINER':
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedTrainer: action.payload,
        },
      }
    
    case 'SELECT_EXPEDITION':
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedExpedition: action.payload,
        },
      }
    
    case 'SELECT_FACILITY':
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedFacility: action.payload,
        },
      }
    
    case 'OPEN_MODAL':
      return {
        ...state,
        ui: {
          ...state.ui,
          modals: {
            ...state.ui.modals,
            [action.payload.name]: {
              isOpen: true,
              data: action.payload.data,
            },
          },
        },
      }
    
    case 'CLOSE_MODAL':
      return {
        ...state,
        ui: {
          ...state.ui,
          modals: {
            ...state.ui.modals,
            [action.payload]: {
              ...state.ui.modals[action.payload],
              isOpen: false,
            },
          },
        },
      }
    
    case 'CLOSE_ALL_MODALS':
      const closedModals = Object.keys(state.ui.modals).reduce((acc, key) => {
        acc[key] = { ...state.ui.modals[key], isOpen: false }
        return acc
      }, {} as any)
      
      return {
        ...state,
        ui: {
          ...state.ui,
          modals: closedModals,
        },
      }
    
    case 'SET_FILTER':
      return {
        ...state,
        ui: {
          ...state.ui,
          filters: {
            ...state.ui.filters,
            [action.payload.type]: action.payload.value,
          },
        },
      }
    
    case 'CLEAR_FILTERS':
      return {
        ...state,
        ui: {
          ...state.ui,
          filters: {},
        },
      }
    
    case 'SET_SORT':
      return {
        ...state,
        ui: {
          ...state.ui,
          sort: {
            ...state.ui.sort,
            [action.payload.type]: {
              field: action.payload.field as any,
              order: action.payload.order,
            },
          },
        },
      }
    
    // キャッシュ関連
    case 'UPDATE_CACHE_TIME':
      return {
        ...state,
        cache: {
          ...state.cache,
          lastUpdated: {
            ...state.cache.lastUpdated,
            [action.payload.type]: action.payload.time,
          },
        },
      }
    
    case 'INVALIDATE_CACHE':
      return {
        ...state,
        cache: {
          ...state.cache,
          invalidationTimes: {
            ...state.cache.invalidationTimes,
            [action.payload]: new Date(),
          },
        },
      }
    
    case 'CLEAR_CACHE':
      return {
        ...state,
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
    
    default:
      return state
  }
}

// =============================================================================
// アクションクリエイター（型安全なアクション生成関数）
// =============================================================================

export const actions = {
  // ユーザー関連
  setUserProfile: (payload: any) => 
    ({ type: 'SET_USER_PROFILE' as const, payload }),
  
  setGameProfile: (payload: any) => 
    ({ type: 'SET_GAME_PROFILE' as const, payload }),
  
  updateUserSettings: (payload: any) => 
    ({ type: 'UPDATE_USER_SETTINGS' as const, payload }),
  
  setAuthStatus: (payload: boolean) => 
    ({ type: 'SET_AUTH_STATUS' as const, payload }),
  
  setMockMode: (payload: boolean) => 
    ({ type: 'SET_MOCK_MODE' as const, payload }),
  
  // システム関連
  setConnectionStatus: (payload: boolean) => 
    ({ type: 'SET_CONNECTION_STATUS' as const, payload }),
  
  setLoadingStatus: (payload: boolean) => 
    ({ type: 'SET_LOADING_STATUS' as const, payload }),
  
  setSyncTime: (payload: Date) => 
    ({ type: 'SET_SYNC_TIME' as const, payload }),
  
  setServerStatus: (payload: 'online' | 'offline' | 'maintenance') => 
    ({ type: 'SET_SERVER_STATUS' as const, payload }),
  
  // 通知関連
  addError: (payload: GameError) => 
    ({ type: 'ADD_ERROR' as const, payload }),
  
  removeError: (payload: string) => 
    ({ type: 'REMOVE_ERROR' as const, payload }),
  
  clearErrors: () => 
    ({ type: 'CLEAR_ERRORS' as const }),
  
  addNotification: (payload: any) => 
    ({ type: 'ADD_NOTIFICATION' as const, payload }),
  
  removeNotification: (payload: string) => 
    ({ type: 'REMOVE_NOTIFICATION' as const, payload }),
  
  clearNotifications: () => 
    ({ type: 'CLEAR_NOTIFICATIONS' as const }),
  
  // ゲームデータ関連  
  setPokemon: (payload: any) => 
    ({ type: 'SET_POKEMON' as const, payload }),
  
  setTrainers: (payload: any) => 
    ({ type: 'SET_TRAINERS' as const, payload }),
  
  setExpeditions: (payload: any) => 
    ({ type: 'SET_EXPEDITIONS' as const, payload }),
  
  // UI関連
  setCurrentPage: (payload: string) => 
    ({ type: 'SET_CURRENT_PAGE' as const, payload }),
  
  selectPokemon: (payload: string | null) => 
    ({ type: 'SELECT_POKEMON' as const, payload }),
  
  selectTrainer: (payload: string | null) => 
    ({ type: 'SELECT_TRAINER' as const, payload }),
  
  openModal: (name: string, data?: any) => 
    ({ type: 'OPEN_MODAL' as const, payload: { name, data } }),
  
  closeModal: (payload: string) => 
    ({ type: 'CLOSE_MODAL' as const, payload }),
}