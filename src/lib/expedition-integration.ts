// 派遣システムの実際のゲームデータ統合
import { supabase, safeSupabaseOperation } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { realtimeSystem, ExpeditionProgress } from '@/lib/realtime'
import { executeWithRetry } from '@/lib/error-handling'

// データベースに保存される派遣データの型定義
export interface DatabaseExpedition {
  id: string
  user_id: string
  trainer_id: string
  location_id: number
  expedition_mode: 'exploration' | 'balanced' | 'safe' | 'aggressive'
  target_duration_hours: number
  advice_given: any
  status: 'preparing' | 'active' | 'completed' | 'recalled'
  started_at: string | null
  expected_return: string | null
  actual_return: string | null
  current_progress: number
  intervention_opportunities: any[]
  intervention_responses: any
  result_summary: any
  success_rate: number | null
  created_at: string
  updated_at: string
}

export interface DatabaseTrainer {
  id: string
  user_id: string
  name: string
  job_id: number
  job_level: number
  job_experience: number
  preferences: any
  compliance_rate: number
  trust_level: number
  personality: string
  status: 'available' | 'on_expedition' | 'resting' | 'unavailable'
  current_expedition_id: string | null
  salary: number
  total_earned: number
  sprite_path: string | null
  created_at: string
  updated_at: string
}

export interface DatabaseLocation {
  id: number
  location_name: string
  location_name_ja: string
  region: string
  distance_level: number
  travel_cost: number
  travel_time_hours: number
  risk_level: number
  base_reward_money: number
  reward_multiplier: number
  encounter_species: number[]
  encounter_rates: any
  background_image: string | null
  map_icon: string | null
  unlock_requirements: any
  is_unlocked_by_default: boolean
  created_at: string
}

// 実際のゲームデータを使った派遣開始
export async function startRealExpedition(
  user: User,
  trainerId: string,
  locationId: number,
  expeditionMode: 'exploration' | 'balanced' | 'safe' | 'aggressive',
  targetDurationHours: number
): Promise<{ success: boolean; expeditionId?: string; error?: string }> {
  try {
    // Supabaseが利用可能かチェック
    if (!supabase) {
      return { success: false, error: 'データベース接続が利用できません' }
    }

    // トレーナーの状態確認
    const { data: trainer, error: trainerError } = await supabase
      .from('trainers')
      .select('*')
      .eq('id', trainerId)
      .eq('user_id', user.id)
      .eq('status', 'available')
      .single()

    if (trainerError || !trainer) {
      return { success: false, error: 'トレーナーが利用できません' }
    }

    // 派遣先の確認
    const { data: location, error: locationError } = await supabase
      .from('expedition_locations')
      .select('*')
      .eq('id', locationId)
      .single()

    if (locationError || !location) {
      return { success: false, error: '派遣先が見つかりません' }
    }

    // ユーザーの資金確認
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('current_money')
      .eq('id', user.id)
      .single()

    if (userError || !userProfile || userProfile.current_money < location.travel_cost) {
      return { success: false, error: '資金が不足しています' }
    }

    const startTime = new Date()
    const expectedReturn = new Date(startTime.getTime() + (targetDurationHours * 60 * 60 * 1000))

    // 派遣レコード作成
    const { data: expedition, error: expeditionError } = await supabase
      .from('expeditions')
      .insert([{
        user_id: user.id,
        trainer_id: trainerId,
        location_id: locationId,
        expedition_mode: expeditionMode,
        target_duration_hours: targetDurationHours,
        advice_given: {},
        status: 'active',
        started_at: startTime.toISOString(),
        expected_return: expectedReturn.toISOString(),
        current_progress: 0.0
      }])
      .select()
      .single()

    if (expeditionError || !expedition) {
      return { success: false, error: '派遣の開始に失敗しました' }
    }

    // トレーナーの状態更新
    await supabase
      .from('trainers')
      .update({
        status: 'on_expedition',
        current_expedition_id: expedition.id
      })
      .eq('id', trainerId)

    // 旅費の支払い
    await supabase
      .from('profiles')
      .update({
        current_money: userProfile.current_money - location.travel_cost
      })
      .eq('id', user.id)

    // 経済取引記録
    await supabase
      .from('transactions')
      .insert([{
        user_id: user.id,
        type: 'expense',
        category: 'expedition_travel_cost',
        amount: location.travel_cost,
        description: `${location.location_name_ja}への派遣費用`,
        reference_id: expedition.id
      }])

    // リアルタイムシステムに派遣を登録
    await realtimeSystem.startExpedition(
      expedition.id,
      trainerId,
      targetDurationHours * 60 // 分に変換
    )

    return { success: true, expeditionId: expedition.id }

  } catch (error) {
    console.error('派遣開始エラー:', error)
    return { success: false, error: 'システムエラーが発生しました' }
  }
}

// 実際のゲームデータを使った派遣一覧取得
export async function getUserExpeditions(user: User): Promise<{
  active: DatabaseExpedition[]
  completed: DatabaseExpedition[]
  trainers: DatabaseTrainer[]
  locations: DatabaseLocation[]
}> {
  try {
    // Supabaseが利用可能かチェック
    if (!supabase) {
      console.warn('⚠️ Supabaseが利用できません。モックモードで動作します。')
      return { active: [], completed: [], trainers: [], locations: [] }
    }

    // アクティブな派遣を取得
    const { data: activeExpeditions, error: activeError } = await supabase
      .from('expeditions')
      .select(`
        *,
        trainers!inner(id, name, job_id, status),
        expedition_locations!inner(id, location_name_ja, distance_level)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('started_at', { ascending: false })

    if (activeError) {
      console.error('アクティブな派遣取得エラー:', activeError)
    }

    // 完了した派遣履歴を取得
    const { data: completedExpeditions, error: completedError } = await supabase
      .from('expeditions')
      .select(`
        *,
        trainers!inner(id, name, job_id),
        expedition_locations!inner(id, location_name_ja, distance_level)
      `)
      .eq('user_id', user.id)
      .in('status', ['completed', 'recalled'])
      .order('actual_return', { ascending: false })
      .limit(10)

    if (completedError) {
      console.error('完了した派遣取得エラー:', completedError)
    }

    // ユーザーのトレーナー一覧を取得
    const { data: trainers, error: trainersError } = await supabase
      .from('trainers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (trainersError) {
      console.error('トレーナー取得エラー:', trainersError)
    }

    // 利用可能な派遣先を取得
    const { data: locations, error: locationsError } = await supabase
      .from('expedition_locations')
      .select('*')
      .order('distance_level', { ascending: true })

    if (locationsError) {
      console.error('派遣先取得エラー:', locationsError)
    }

    return {
      active: activeExpeditions || [],
      completed: completedExpeditions || [],
      trainers: trainers || [],
      locations: locations || []
    }

  } catch (error) {
    console.error('派遣データ取得エラー:', error)
    return { active: [], completed: [], trainers: [], locations: [] }
  }
}

// 派遣の進行状況を実際のデータベースに保存
export async function saveExpeditionProgress(
  expeditionId: string,
  progress: ExpeditionProgress
): Promise<boolean> {
  try {
    // Supabaseが利用可能かチェック
    if (!supabase) {
      console.warn('⚠️ Supabaseが利用できません。モックモードで動作します。')
      return true // モックモードでは成功として扱う
    }

    const { error } = await supabase
      .from('expeditions')
      .update({
        current_progress: progress.progress / 100,
        intervention_opportunities: progress.events.filter(e => e.playerResponseRequired),
        updated_at: new Date().toISOString()
      })
      .eq('id', expeditionId)

    if (error) {
      console.error('派遣進行状況保存エラー:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('派遣進行状況保存エラー:', error)
    return false
  }
}

// 派遣完了処理
export async function completeExpedition(
  expeditionId: string,
  finalResult: {
    success: boolean
    totalReward: number
    experienceGained: number
    itemsObtained: any[]
    pokemonCaught: any[]
  }
): Promise<boolean> {
  try {
    // Supabaseが利用可能かチェック
    if (!supabase) {
      console.warn('⚠️ Supabaseが利用できません。モックモードで動作します。')
      return true // モックモードでは成功として扱う
    }

    const completionTime = new Date()

    // 派遣ステータスを完了に更新
    const { data: expedition, error: expeditionError } = await supabase
      .from('expeditions')
      .update({
        status: 'completed',
        actual_return: completionTime.toISOString(),
        current_progress: 1.0,
        result_summary: finalResult,
        success_rate: finalResult.success ? 1.0 : 0.5
      })
      .eq('id', expeditionId)
      .select('user_id, trainer_id')
      .single()

    if (expeditionError || !expedition) {
      console.error('派遣完了更新エラー:', expeditionError)
      return false
    }

    // トレーナーを利用可能状態に戻す
    await supabase
      .from('trainers')
      .update({
        status: 'available',
        current_expedition_id: null,
        total_earned: finalResult.totalReward,
        job_experience: finalResult.experienceGained
      })
      .eq('id', expedition.trainer_id)

    // 報酬をユーザーに付与
    if (finalResult.totalReward > 0) {
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('current_money')
        .eq('id', expedition.user_id)
        .single()

      if (!userError && user) {
        await supabase
          .from('profiles')
          .update({
            current_money: user.current_money + finalResult.totalReward
          })
          .eq('id', expedition.user_id)

        // 経済取引記録
        await supabase
          .from('transactions')
          .insert([{
            user_id: expedition.user_id,
            type: 'income',
            category: 'expedition_reward',
            amount: finalResult.totalReward,
            description: '派遣完了報酬',
            reference_id: expeditionId
          }])
      }
    }

    // 捕獲したポケモンをデータベースに追加
    if (finalResult.pokemonCaught.length > 0) {
      const pokemonInserts = finalResult.pokemonCaught.map(pokemon => ({
        user_id: expedition.user_id,
        species_id: pokemon.species_id,
        trainer_id: expedition.trainer_id,
        nickname: pokemon.name,
        level: pokemon.level || 5,
        experience: 0,
        individual_values: pokemon.individual_values || {},
        current_hp: pokemon.max_hp || 20,
        max_hp: pokemon.max_hp || 20,
        caught_location: 'expedition',
        caught_by_trainer: expedition.trainer_id
      }))

      await supabase
        .from('pokemon')
        .insert(pokemonInserts)
    }

    return true
  } catch (error) {
    console.error('派遣完了処理エラー:', error)
    return false
  }
}

// 派遣早期呼び戻し
export async function recallExpedition(expeditionId: string): Promise<boolean> {
  try {
    // Supabaseが利用可能かチェック
    if (!supabase) {
      console.warn('⚠️ Supabaseが利用できません。モックモードで動作します。')
      return true // モックモードでは成功として扱う
    }

    const recallTime = new Date()

    // 派遣ステータスを呼び戻しに更新
    const { data: expedition, error: expeditionError } = await supabase
      .from('expeditions')
      .update({
        status: 'recalled',
        actual_return: recallTime.toISOString(),
        result_summary: { recalled: true, partial_reward: true }
      })
      .eq('id', expeditionId)
      .select('user_id, trainer_id, current_progress')
      .single()

    if (expeditionError || !expedition) {
      return false
    }

    // トレーナーを利用可能状態に戻す
    await supabase
      .from('trainers')
      .update({
        status: 'available',
        current_expedition_id: null
      })
      .eq('id', expedition.trainer_id)

    // リアルタイムシステムから派遣を停止
    realtimeSystem.stopExpedition(expeditionId)

    // 部分報酬の計算と付与（進行度に応じて）
    const partialReward = Math.floor(1000 * expedition.current_progress)
    if (partialReward > 0) {
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('current_money')
        .eq('id', expedition.user_id)
        .single()

      if (!userError && user) {
        await supabase
          .from('profiles')
          .update({
            current_money: user.current_money + partialReward
          })
          .eq('id', expedition.user_id)

        // 経済取引記録
        await supabase
          .from('transactions')
          .insert([{
            user_id: expedition.user_id,
            type: 'income',
            category: 'expedition_partial_reward',
            amount: partialReward,
            description: '派遣早期呼び戻し部分報酬',
            reference_id: expeditionId
          }])
      }
    }

    return true
  } catch (error) {
    console.error('派遣呼び戻しエラー:', error)
    return false
  }
}

// リアルタイムシステムとデータベースの同期
export function synchronizeRealtimeWithDatabase() {
  // リアルタイムシステムのイベントリスナーを設定してデータベースと同期
  const originalNotifyListeners = (realtimeSystem as any).notifyListeners.bind(realtimeSystem)
  
  ;(realtimeSystem as any).notifyListeners = function(expeditionId: string, eventType: string, data: any) {
    // 元の処理を実行
    originalNotifyListeners(expeditionId, eventType, data)
    
    // データベースに同期
    if (eventType === 'progress_update') {
      saveExpeditionProgress(expeditionId, data)
    } else if (eventType === 'expedition_complete') {
      completeExpedition(expeditionId, {
        success: true,
        totalReward: data.finalReward,
        experienceGained: 100,
        itemsObtained: [],
        pokemonCaught: []
      })
    }
  }
}