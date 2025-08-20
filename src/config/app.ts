/**
 * アプリケーション全体の設定値を集約
 * マジックナンバーとハードコードされた値を排除
 */

import { GAME_BALANCE, TRAINER_JOBS, EXPEDITION_LOCATIONS } from './gameBalance'

export const APP_CONFIG = {
  // API設定
  API: {
    POKEAPI_BASE_URL: process.env.NEXT_PUBLIC_POKEAPI_BASE_URL || 'https://pokeapi.co/api/v2',
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    TIMEOUT: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000'),
    RETRY_ATTEMPTS: parseInt(process.env.NEXT_PUBLIC_API_RETRY_ATTEMPTS || '3'),
    RETRY_DELAY_BASE: 1000, // 1秒
    RETRY_DELAY_MAX: 30000, // 30秒
  },

  // UI設定
  UI: {
    REFRESH_INTERVAL: 30000, // 30秒
    NOTIFICATION_DURATION: 3000, // 3秒
    ANIMATION_DURATION: 500, // 0.5秒
    PROGRESS_UPDATE_INTERVAL: 30000, // 30秒
    SESSION_CHECK_INTERVAL: 30000, // 30秒
    INTERVENTION_TIMEOUT: 3000, // 3秒
    AUTO_HIDE_NOTIFICATIONS: true,
    MAX_NOTIFICATIONS: 5,
  },

  // 開発環境設定
  DEVELOPMENT: {
    DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
    FAST_EXPEDITION: process.env.NEXT_PUBLIC_FAST_EXPEDITION === 'true',
    MOCK_DATA: process.env.NODE_ENV === 'development',
    CONSOLE_LOGGING: process.env.NODE_ENV === 'development',
    REALTIME_DELAY: process.env.NODE_ENV === 'development' ? 3000 : 500,
  },

  // セキュリティ設定
  SECURITY: {
    SESSION_TIMEOUT_MINUTES: 60, // 1時間
    SESSION_WARNING_MINUTES: 50, // 50分で警告
    MAX_LOGIN_ATTEMPTS: 3,
    LOCKOUT_DURATION_MINUTES: 15,
    SECURE_HEADERS: true,
  },

  // パフォーマンス設定
  PERFORMANCE: {
    CACHE_TTL: 300, // 5分
    DEBOUNCE_DELAY: 300, // 0.3秒
    THROTTLE_DELAY: 1000, // 1秒
    BATCH_SIZE: 100,
    MAX_CONCURRENT_REQUESTS: 5,
  },

  // ゲーム固有設定
  GAME: {
    ...GAME_BALANCE,
    JOBS: TRAINER_JOBS,
    LOCATIONS: EXPEDITION_LOCATIONS,
    
    // 追加のゲーム設定
    AUTO_SAVE_INTERVAL: 60000, // 1分
    MAX_SAVE_BACKUPS: 10,
    MINIMUM_PLAY_SESSION: 30, // 30秒
    
    // 通知設定
    NOTIFY_LOW_FUNDS_THRESHOLD: 5000,
    NOTIFY_EXPEDITION_COMPLETE: true,
    NOTIFY_TRAINER_LEVEL_UP: true,
    NOTIFY_POKEMON_CAUGHT: true,
    
    // バランス調整用の隠しフラグ
    ENABLE_CHEATS: process.env.NEXT_PUBLIC_ENABLE_CHEATS === 'true',
    UNLIMITED_MONEY: process.env.NEXT_PUBLIC_UNLIMITED_MONEY === 'true',
    FAST_LEVEL_UP: process.env.NEXT_PUBLIC_FAST_LEVEL_UP === 'true',
  },

  // エラーハンドリング設定
  ERRORS: {
    SHOW_STACK_TRACE: process.env.NODE_ENV === 'development',
    LOG_TO_CONSOLE: process.env.NODE_ENV === 'development',
    REPORT_TO_SERVICE: process.env.NODE_ENV === 'production',
    MAX_ERROR_HISTORY: 50,
  },

  // フィーチャーフラグ
  FEATURES: {
    REALTIME_SYNC: process.env.NEXT_PUBLIC_ENABLE_REALTIME === 'true',
    AI_ANALYSIS: process.env.NEXT_PUBLIC_ENABLE_AI === 'true',
    ADVANCED_STATS: process.env.NEXT_PUBLIC_ENABLE_STATS === 'true',
    MULTIPLAYER: process.env.NEXT_PUBLIC_ENABLE_MULTIPLAYER === 'true',
    ACHIEVEMENTS: process.env.NEXT_PUBLIC_ENABLE_ACHIEVEMENTS === 'true',
    TRADING: process.env.NEXT_PUBLIC_ENABLE_TRADING === 'true',
  },

  // アプリケーション情報
  APP: {
    NAME: process.env.NEXT_PUBLIC_APP_NAME || 'トキワシティ訓練所',
    VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    BUILD: process.env.NEXT_PUBLIC_BUILD_NUMBER || 'dev',
    ENVIRONMENT: process.env.NODE_ENV || 'development',
    SUPPORT_EMAIL: 'support@tokiwa-school.com',
    DOCUMENTATION_URL: 'https://docs.tokiwa-school.com',
  },

} as const

// 型安全性のための型定義
export type AppConfig = typeof APP_CONFIG

// よく使用される値のショートカット
export const {
  API,
  UI,
  GAME,
  DEVELOPMENT,
  SECURITY,
  PERFORMANCE,
  ERRORS,
  FEATURES,
  APP
} = APP_CONFIG

// 環境に応じた設定の検証
export function validateConfig(): boolean {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]

  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    console.error('❌ 必要な環境変数が設定されていません:', missing)
    return false
  }

  console.log('✅ 設定検証完了')
  return true
}

// 開発用の設定ダンプ
export function dumpConfig() {
  if (DEVELOPMENT.DEBUG_MODE) {
    console.log('🔧 アプリケーション設定:')
    console.table({
      Environment: APP.ENVIRONMENT,
      Version: APP.VERSION,
      Debug: DEVELOPMENT.DEBUG_MODE,
      Realtime: FEATURES.REALTIME_SYNC,
      FastExpedition: DEVELOPMENT.FAST_EXPEDITION,
    })
  }
}