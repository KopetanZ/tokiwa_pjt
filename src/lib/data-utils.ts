/**
 * データフォールバック処理ユーティリティ
 * モックデータと実際のデータの統合管理
 */

import { User } from '@supabase/supabase-js'
import { MOCK_GAME_DATA, MOCK_PROFILE } from './mock-data'

export interface GameDataStructure {
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
  analysis: any[]
}

/**
 * 安全なゲームデータ取得
 * モックモード、実際のデータ、フォールバックを適切に処理
 */
export function getSafeGameData(
  isMockMode: boolean,
  gameData: any,
  user: User | null
): GameDataStructure {
  // モックモードの場合
  if (isMockMode) {
    console.log('🎮 データフォールバック: モックモードを使用')
    return gameData || {
      profile: MOCK_PROFILE,
      pokemon: MOCK_GAME_DATA.pokemon || [],
      trainers: MOCK_GAME_DATA.trainers || [],
      expeditions: MOCK_GAME_DATA.expeditions || [],
      facilities: MOCK_GAME_DATA.facilities || [],
      transactions: MOCK_GAME_DATA.transactions || [],
      analysis: MOCK_GAME_DATA.analysis || []
    }
  }

  // 実際のデータが利用可能な場合
  if (gameData && typeof gameData === 'object' && Object.keys(gameData).length > 0) {
    console.log('🎮 データフォールバック: 実際のデータを使用')
    return {
      profile: gameData.profile || null,
      pokemon: Array.isArray(gameData.pokemon) ? gameData.pokemon : [],
      trainers: Array.isArray(gameData.trainers) ? gameData.trainers : [],
      expeditions: Array.isArray(gameData.expeditions) ? gameData.expeditions : [],
      facilities: Array.isArray(gameData.facilities) ? gameData.facilities : [],
      transactions: Array.isArray(gameData.transactions) ? gameData.transactions : [],
      analysis: Array.isArray(gameData.analysis) ? gameData.analysis : []
    }
  }

  // フォールバック: 最小限の構造を提供
  console.log('🎮 データフォールバック: フォールバックデータを使用')
  return {
    profile: user ? {
      id: user.id,
      guest_name: user.user_metadata?.trainer_name || user.email?.split('@')[0] || 'トレーナー',
      school_name: user.user_metadata?.school_name || 'トキワシティ訓練所',
      current_money: 50000,
      total_reputation: 0,
      ui_theme: 'classic',
      settings: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } : null,
    pokemon: [],
    trainers: [],
    expeditions: [],
    facilities: [],
    transactions: [],
    analysis: []
  }
}

/**
 * 安全な配列データ取得
 */
export function getSafeArray<T>(data: T[] | undefined | null): T[] {
  return Array.isArray(data) ? data : []
}

/**
 * 安全な数値データ取得
 */
export function getSafeNumber(data: number | undefined | null, fallback: number = 0): number {
  return typeof data === 'number' && !isNaN(data) ? data : fallback
}

/**
 * 安全な文字列データ取得
 */
export function getSafeString(data: string | undefined | null, fallback: string = ''): string {
  return typeof data === 'string' ? data : fallback
}

/**
 * データの存在確認
 */
export function hasValidData(data: any): boolean {
  return data !== null && data !== undefined && (
    (typeof data === 'object' && Object.keys(data).length > 0) ||
    (Array.isArray(data) && data.length > 0) ||
    (typeof data === 'string' && data.length > 0) ||
    typeof data === 'number'
  )
}

/**
 * エラー安全なデータアクセス
 */
export function safeAccess<T>(
  accessor: () => T,
  fallback: T
): T {
  try {
    const result = accessor()
    return hasValidData(result) ? result : fallback
  } catch (error) {
    console.warn('データアクセスエラー:', error)
    return fallback
  }
}

/**
 * データ統計計算のユーティリティ
 */
export function calculateGameStats(gameData: GameDataStructure) {
  return {
    totalPokemon: getSafeArray(gameData.pokemon).length,
    totalTrainers: getSafeArray(gameData.trainers).length,
    activeExpeditions: getSafeArray(gameData.expeditions).filter(exp => exp.status === 'active').length,
    currentMoney: getSafeNumber(gameData.profile?.current_money, 50000),
    reputation: getSafeNumber(gameData.profile?.total_reputation, 0),
    recentTransactions: getSafeArray(gameData.transactions).slice(-5)
  }
}