/**
 * 派遣システム完全同期管理
 * 
 * 派遣の開始、進行、完了のリアルタイム同期を管理
 */

import { supabase } from './supabase'

export interface ExpeditionSync {
  id: string
  user_id: string
  trainer_id: string
  location_id: number
  status: 'preparing' | 'in_progress' | 'completed' | 'failed' | 'recalled'
  expedition_mode: 'conservative' | 'balanced' | 'aggressive'
  target_duration_hours: number
  actual_duration?: number
  start_time?: string
  completion_time?: string
  success_rate?: number
  rewards_earned?: any
  interventions_count?: number
  final_report?: string
  created_at: string
  updated_at: string
}

export interface ExpeditionProgress {
  expedition_id: string
  current_phase: 'travel' | 'exploration' | 'return' | 'complete'
  progress_percentage: number
  estimated_completion: string
  current_location_description: string
  trainer_status: 'healthy' | 'tired' | 'injured'
  pokemon_status: Array<{ id: string; condition: string; hp_percentage: number }>
  events_log: Array<{ timestamp: string; event: string; description: string }>
  last_update: string
}

export class ExpeditionSyncManager {
  private userId: string
  private activeSubscriptions: Map<string, any> = new Map()
  
  constructor(userId: string) {
    this.userId = userId
  }
  
  /**
   * 派遣を開始してデータベースに記録
   */
  async startExpedition(params: {
    trainer_id: string
    location_id: number
    expedition_mode: ExpeditionSync['expedition_mode']
    target_duration_hours: number
  }): Promise<{ success: boolean; expeditionId?: string; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'データベース接続がありません' }
    }
    
    try {
      // 派遣記録を作成
      const { data, error } = await supabase
        .from('expeditions')
        .insert({
          user_id: this.userId,
          trainer_id: params.trainer_id,
          location_id: params.location_id,
          status: 'preparing',
          expedition_mode: params.expedition_mode,
          target_duration_hours: params.target_duration_hours,
          start_time: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()
      
      if (error) {
        console.error('派遣開始エラー:', error)
        return { success: false, error: error.message }
      }
      
      const expeditionId = data.id
      
      // トレーナーのステータスを「派遣中」に更新
      await supabase
        .from('trainers')
        .update({
          status: 'on_expedition',
          current_expedition_id: expeditionId,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.trainer_id)
        .eq('user_id', this.userId)
      
      // 進行状況の初期記録を作成
      await this.initializeExpeditionProgress(expeditionId, params)
      
      console.log('🚀 派遣が開始されました:', expeditionId)
      
      // リアルタイム監視を開始
      this.startProgressMonitoring(expeditionId)
      
      return { success: true, expeditionId }
      
    } catch (error) {
      console.error('派遣開始エラー:', error)
      return { success: false, error: '派遣開始に失敗しました' }
    }
  }
  
  /**
   * 派遣の進行状況を更新
   */
  async updateExpeditionProgress(
    expeditionId: string, 
    progress: Partial<ExpeditionProgress>
  ): Promise<boolean> {
    if (!supabase) return false
    
    try {
      const { error } = await supabase
        .from('expedition_progress')
        .upsert({
          expedition_id: expeditionId,
          ...progress,
          last_update: new Date().toISOString()
        })
      
      if (error) {
        console.error('進行状況更新エラー:', error)
        return false
      }
      
      console.log('📊 派遣進行状況が更新されました:', expeditionId)
      return true
      
    } catch (error) {
      console.error('進行状況更新エラー:', error)
      return false
    }
  }
  
  /**
   * 派遣を完了してすべての結果を記録
   */
  async completeExpedition(
    expeditionId: string,
    results: {
      success: boolean
      actual_duration: number
      success_rate: number
      rewards_earned: any
      interventions_count: number
      final_report: string
      captured_pokemon?: any[]
      trainer_experience_gained?: number
    }
  ): Promise<boolean> {
    if (!supabase) return false
    
    try {
      // 派遣ステータスを完了に更新
      const { error: expeditionError } = await supabase
        .from('expeditions')
        .update({
          status: results.success ? 'completed' : 'failed',
          actual_duration: results.actual_duration,
          completion_time: new Date().toISOString(),
          success_rate: results.success_rate,
          rewards_earned: results.rewards_earned,
          interventions_count: results.interventions_count,
          final_report: results.final_report,
          updated_at: new Date().toISOString()
        })
        .eq('id', expeditionId)
        .eq('user_id', this.userId)
      
      if (expeditionError) {
        console.error('派遣完了記録エラー:', expeditionError)
        return false
      }
      
      // 派遣情報を取得してトレーナーID取得
      const { data: expedition } = await supabase
        .from('expeditions')
        .select('trainer_id')
        .eq('id', expeditionId)
        .single()
      
      if (expedition) {
        // トレーナーのステータスを「利用可能」に戻す
        await supabase
          .from('trainers')
          .update({
            status: 'available',
            current_expedition_id: null,
            // 経験値がある場合は追加
            ...(results.trainer_experience_gained && {
              job_experience: supabase.rpc('increment_trainer_exp', {
                trainer_id: expedition.trainer_id,
                exp_gain: results.trainer_experience_gained
              })
            }),
            updated_at: new Date().toISOString()
          })
          .eq('id', expedition.trainer_id)
          .eq('user_id', this.userId)
      }
      
      // 捕獲したポケモンがある場合は保存
      if (results.captured_pokemon && results.captured_pokemon.length > 0) {
        const pokemonInsertData = results.captured_pokemon.map(pokemon => ({
          user_id: this.userId,
          dex_number: pokemon.dex_number,
          name: pokemon.name,
          level: pokemon.level,
          hp: pokemon.hp,
          attack: pokemon.attack,
          defense: pokemon.defense,
          special_attack: pokemon.special_attack,
          special_defense: pokemon.special_defense,
          speed: pokemon.speed,
          types: pokemon.types,
          nature: pokemon.nature,
          is_shiny: pokemon.is_shiny || false,
          status: 'available',
          caught_at: new Date().toISOString(),
          caught_location: expeditionId // 派遣記録への参照
        }))
        
        await supabase
          .from('pokemon')
          .insert(pokemonInsertData)
      }
      
      // 経済記録（報酬）
      if (results.rewards_earned.money > 0) {
        await supabase
          .from('transactions')
          .insert({
            user_id: this.userId,
            type: 'income',
            category: 'expedition',
            amount: results.rewards_earned.money,
            description: `派遣完了報酬`,
            reference_id: expeditionId,
            created_at: new Date().toISOString()
          })
      }
      
      // 進行状況を完了に更新
      await this.updateExpeditionProgress(expeditionId, {
        current_phase: 'complete',
        progress_percentage: 100,
        current_location_description: '派遣完了',
        events_log: [{
          timestamp: new Date().toISOString(),
          event: 'expedition_completed',
          description: results.final_report
        }]
      })
      
      // リアルタイム監視を停止
      this.stopProgressMonitoring(expeditionId)
      
      console.log('🏁 派遣が完了しました:', expeditionId)
      return true
      
    } catch (error) {
      console.error('派遣完了エラー:', error)
      return false
    }
  }
  
  /**
   * 派遣を中止する（リコール）
   */
  async recallExpedition(expeditionId: string, reason: string = 'ユーザーによる中止'): Promise<boolean> {
    if (!supabase) return false
    
    try {
      // 派遣ステータスを中止に更新
      await supabase
        .from('expeditions')
        .update({
          status: 'recalled',
          completion_time: new Date().toISOString(),
          final_report: `派遣中止: ${reason}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', expeditionId)
        .eq('user_id', this.userId)
      
      // 派遣情報を取得してトレーナーを利用可能に戻す
      const { data: expedition } = await supabase
        .from('expeditions')
        .select('trainer_id')
        .eq('id', expeditionId)
        .single()
      
      if (expedition) {
        await supabase
          .from('trainers')
          .update({
            status: 'available',
            current_expedition_id: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', expedition.trainer_id)
          .eq('user_id', this.userId)
      }
      
      // 進行状況を更新
      await this.updateExpeditionProgress(expeditionId, {
        current_phase: 'complete',
        current_location_description: '派遣中止',
        events_log: [{
          timestamp: new Date().toISOString(),
          event: 'expedition_recalled',
          description: reason
        }]
      })
      
      // リアルタイム監視を停止
      this.stopProgressMonitoring(expeditionId)
      
      console.log('🔙 派遣が中止されました:', expeditionId)
      return true
      
    } catch (error) {
      console.error('派遣中止エラー:', error)
      return false
    }
  }
  
  /**
   * 進行中の派遣一覧を取得
   */
  async getActiveExpeditions(): Promise<ExpeditionSync[]> {
    if (!supabase) return []
    
    try {
      const { data, error } = await supabase
        .from('expeditions')
        .select(`
          *,
          trainers:trainer_id (
            name,
            job_level,
            status
          ),
          expedition_locations:location_id (
            location_name_ja
          )
        `)
        .eq('user_id', this.userId)
        .in('status', ['preparing', 'in_progress'])
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('進行中派遣取得エラー:', error)
        return []
      }
      
      return data as ExpeditionSync[]
      
    } catch (error) {
      console.error('進行中派遣取得エラー:', error)
      return []
    }
  }
  
  /**
   * 派遣の詳細進行状況を取得
   */
  async getExpeditionProgress(expeditionId: string): Promise<ExpeditionProgress | null> {
    if (!supabase) return null
    
    try {
      const { data, error } = await supabase
        .from('expedition_progress')
        .select('*')
        .eq('expedition_id', expeditionId)
        .single()
      
      if (error) {
        console.error('進行状況取得エラー:', error)
        return null
      }
      
      return data
      
    } catch (error) {
      console.error('進行状況取得エラー:', error)
      return null
    }
  }
  
  /**
   * 進行状況の初期化
   */
  private async initializeExpeditionProgress(
    expeditionId: string, 
    params: any
  ): Promise<void> {
    const initialProgress: Partial<ExpeditionProgress> = {
      expedition_id: expeditionId,
      current_phase: 'travel',
      progress_percentage: 0,
      estimated_completion: new Date(Date.now() + params.target_duration_hours * 60 * 60 * 1000).toISOString(),
      current_location_description: '派遣地に向けて出発',
      trainer_status: 'healthy',
      pokemon_status: [],
      events_log: [{
        timestamp: new Date().toISOString(),
        event: 'expedition_started',
        description: '派遣を開始しました'
      }]
    }
    
    await this.updateExpeditionProgress(expeditionId, initialProgress)
  }
  
  /**
   * リアルタイム進行状況監視を開始
   */
  private startProgressMonitoring(expeditionId: string): void {
    if (!supabase) return
    
    // 進行状況の変更を監視
    const subscription = supabase
      .channel(`expedition_${expeditionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expedition_progress',
          filter: `expedition_id=eq.${expeditionId}`
        },
        (payload) => {
          console.log('📊 派遣進行状況更新:', payload)
          
          // カスタムイベントを発火して UI に通知
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('expeditionProgressUpdate', {
                detail: { expeditionId, progress: payload.new }
              })
            )
          }
        }
      )
      .subscribe()
    
    this.activeSubscriptions.set(expeditionId, subscription)
  }
  
  /**
   * リアルタイム進行状況監視を停止
   */
  private stopProgressMonitoring(expeditionId: string): void {
    const subscription = this.activeSubscriptions.get(expeditionId)
    if (subscription) {
      subscription.unsubscribe()
      this.activeSubscriptions.delete(expeditionId)
    }
  }
  
  /**
   * すべての監視を停止
   */
  public stopAllMonitoring(): void {
    this.activeSubscriptions.forEach((subscription, expeditionId) => {
      subscription.unsubscribe()
    })
    this.activeSubscriptions.clear()
  }
}

/**
 * 派遣同期マネージャーのファクトリー関数
 */
export const createExpeditionSyncManager = (userId: string): ExpeditionSyncManager => {
  return new ExpeditionSyncManager(userId)
}