/**
 * 緊急イベントシステム
 * 実際のゲームロジックとの連携機能
 */

import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'

export interface EmergencyEvent {
  id: string
  type: 'pokemon_encounter' | 'rare_item' | 'trainer_emergency' | 'weather_event'
  pokemon: string
  trainerName: string
  timeLeft: number
  successChance: number
  timestamp: Date
  resolved: boolean
}

export interface EmergencyEventResult {
  success: boolean
  reward?: {
    type: 'pokemon' | 'money' | 'item' | 'reputation'
    value: any
    amount?: number
  }
  message: string
}

/**
 * 緊急イベントの結果をデータベースに保存
 */
export async function saveEmergencyEventResult(
  user: User,
  event: EmergencyEvent,
  result: EmergencyEventResult
): Promise<boolean> {
  try {
    // Supabaseが利用可能かチェック
    if (!supabase) {
      console.warn('⚠️ Supabaseが利用できません。モックモードで動作します。')
      return true // モックモードでは成功として扱う
    }

    // ポケモン捕獲の場合
    if (result.success && result.reward?.type === 'pokemon') {
      const newPokemon = {
        user_id: user.id,
        dex_number: getPokemonDexNumber(event.pokemon),
        name: event.pokemon,
        level: Math.floor(Math.random() * 10) + 5,
        hp: 100,
        max_hp: 100,
        attack: Math.floor(Math.random() * 20) + 30,
        defense: Math.floor(Math.random() * 20) + 25,
        speed: Math.floor(Math.random() * 20) + 20,
        experience: 0,
        happiness: 50,
        nature: getRandomNature(),
        ability: 'default',
        moves: ['はたく', 'なきごえ'],
        held_item: null,
        status: 'healthy',
        location: 'school',
        captured_at: new Date().toISOString(),
        trainer_memo: `${event.trainerName}により緊急イベントで発見`
      }

      const { error: pokemonError } = await supabase
        .from('pokemon')
        .insert([newPokemon])

      if (pokemonError) {
        console.error('ポケモン保存エラー:', pokemonError)
        return false
      }

      console.log('✅ ポケモンをデータベースに保存:', newPokemon)
    }

    // お金の報酬の場合
    if (result.reward?.type === 'money' && result.reward.amount) {
      const { error: moneyError } = await supabase.rpc('add_money', {
        user_id: user.id,
        amount: result.reward.amount
      })

      if (moneyError) {
        console.error('お金の追加エラー:', moneyError)
        return false
      }

      console.log('✅ お金をデータベースに追加:', result.reward.amount)
    }

    // 評判の報酬の場合
    if (result.reward?.type === 'reputation' && result.reward.amount) {
      const { error: reputationError } = await supabase.rpc('add_reputation', {
        user_id: user.id,
        amount: result.reward.amount
      })

      if (reputationError) {
        console.error('評判の追加エラー:', reputationError)
        return false
      }

      console.log('✅ 評判をデータベースに追加:', result.reward.amount)
    }

    // 取引履歴の記録
    const transaction = {
      user_id: user.id,
      type: result.success ? 'income' : 'event',
      category: 'emergency_event',
      amount: result.reward?.amount || 0,
      description: `緊急イベント: ${event.pokemon} - ${result.message}`,
      reference_id: event.id,
      metadata: {
        event_type: event.type,
        trainer: event.trainerName,
        success: result.success,
        pokemon: event.pokemon
      }
    }

    const { error: transactionError } = await supabase
      .from('transactions')
      .insert([transaction])

    if (transactionError) {
      console.error('取引履歴保存エラー:', transactionError)
      return false
    }

    console.log('✅ 取引履歴をデータベースに保存:', transaction)
    return true

  } catch (error) {
    console.error('緊急イベント結果保存エラー:', error)
    return false
  }
}

/**
 * 緊急イベント処理（成功/失敗の判定と報酬計算）
 */
export function processEmergencyEvent(
  event: EmergencyEvent,
  choice: 'capture' | 'observe' | 'ignore'
): EmergencyEventResult {
  const baseSuccess = event.successChance
  let finalSuccessRate = baseSuccess

  // 選択に応じた成功率調整
  switch (choice) {
    case 'capture':
      finalSuccessRate = baseSuccess
      break
    case 'observe':
      finalSuccessRate = Math.min(95, baseSuccess + 20)
      break
    case 'ignore':
      return {
        success: false,
        message: `${event.pokemon}を見逃しました`,
      }
  }

  const success = Math.random() * 100 < finalSuccessRate

  if (success) {
    switch (choice) {
      case 'capture':
        return {
          success: true,
          reward: {
            type: 'pokemon',
            value: event.pokemon
          },
          message: `${event.pokemon}の捕獲に成功しました！`
        }
      case 'observe':
        return {
          success: true,
          reward: {
            type: 'reputation',
            value: 'research_data',
            amount: Math.floor(Math.random() * 50) + 25
          },
          message: `${event.pokemon}の観察に成功！研究データを獲得しました`
        }
    }
  }

  // 失敗の場合
  switch (choice) {
    case 'capture':
      return {
        success: false,
        message: `${event.pokemon}の捕獲に失敗しました...`
      }
    case 'observe':
      return {
        success: false,
        message: `${event.pokemon}を見失ってしまいました...`
      }
    default:
      return {
        success: false,
        message: `何も起こりませんでした`
      }
  }
}

/**
 * ポケモンの図鑑番号を取得
 */
function getPokemonDexNumber(pokemonName: string): number {
  const pokemonDex: Record<string, number> = {
    'ピカチュウ': 25,
    'イーブイ': 133,
    'ヒトカゲ': 4,
    'フシギダネ': 1,
    'ゼニガメ': 7,
    'ピッピ': 35,
    'コラッタ': 19,
    'ポッポ': 16
  }
  return pokemonDex[pokemonName] || 0
}

/**
 * ランダムな性格を取得
 */
function getRandomNature(): string {
  const natures = [
    'がんばりや', 'さみしがり', 'かたい', 'いじっぱり', 'やんちゃ',
    'ゆうかん', 'ずぶとい', 'わんぱく', 'のうてんき', 'おっとり',
    'うっかりや', 'ひかえめ', 'おとなしい', 'なまいき', 'しんちょう',
    'れいせい', 'てれや', 'せっかち', 'ようき', 'むじゃき',
    'すなお', 'のんき', 'おくびょう', 'せいしん', 'きまぐれ'
  ]
  return natures[Math.floor(Math.random() * natures.length)]
}

/**
 * モックモード用の緊急イベント結果処理
 */
export function processMockEmergencyEvent(
  event: EmergencyEvent,
  choice: 'capture' | 'observe' | 'ignore'
): EmergencyEventResult {
  // 実際の処理と同じロジックだが、データベース保存は行わない
  return processEmergencyEvent(event, choice)
}