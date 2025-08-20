/**
 * ゲーム進行状況管理システム
 * 
 * MOCK_PROGRESSに代わる実際のデータベースベースの進行状況管理
 */

import { supabase } from './supabase'

export interface GameProgress {
  id?: string
  user_id: string
  level: number
  experience: number
  next_level_exp: number
  total_play_time: number
  achievement_points: number
  unlocked_features: string[]
  difficulty: 'easy' | 'normal' | 'hard' | 'expert'
  created_at?: string
  updated_at?: string
}

export interface GameBalance {
  id?: string
  user_id: string
  trainer_growth_rate: number
  pokemon_growth_rate: number
  expedition_difficulty: number
  economy_inflation: number
  research_speed: number
  facility_efficiency: number
  updated_at?: string
}

export class ProgressManager {
  private userId: string
  
  constructor(userId: string) {
    this.userId = userId
  }
  
  /**
   * ゲーム進行状況を取得
   */
  async getProgress(): Promise<GameProgress | null> {
    if (!supabase) return null
    
    try {
      const { data, error } = await supabase
        .from('game_progress')
        .select('*')
        .eq('user_id', this.userId)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          // データが見つからない場合は初期化
          console.log('進行状況が見つからないため初期化します')
          return await this.initializeProgress()
        }
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
   * ゲーム進行状況を更新
   */
  async updateProgress(updates: Partial<GameProgress>): Promise<boolean> {
    if (!supabase) return false
    
    try {
      const { error } = await supabase
        .from('game_progress')
        .upsert({
          user_id: this.userId,
          ...updates,
          updated_at: new Date().toISOString()
        })
      
      if (error) {
        console.error('進行状況更新エラー:', error)
        return false
      }
      
      console.log('✅ 進行状況が更新されました')
      return true
    } catch (error) {
      console.error('進行状況更新エラー:', error)
      return false
    }
  }
  
  /**
   * 経験値を追加してレベルアップ処理
   */
  async addExperience(exp: number): Promise<{ levelUp: boolean; newLevel?: number }> {
    const progress = await this.getProgress()
    if (!progress) return { levelUp: false }
    
    const newExperience = progress.experience + exp
    let newLevel = progress.level
    let nextLevelExp = progress.next_level_exp
    let levelUp = false
    
    // レベルアップ計算
    while (newExperience >= nextLevelExp) {
      newLevel++
      levelUp = true
      nextLevelExp = this.calculateNextLevelExp(newLevel)
    }
    
    const updated = await this.updateProgress({
      experience: newExperience,
      level: newLevel,
      next_level_exp: nextLevelExp
    })
    
    if (levelUp) {
      console.log(`🎉 レベルアップ！Lv.${newLevel}になりました！`)
      
      // レベルアップ報酬の処理
      await this.processLevelUpRewards(newLevel)
    }
    
    return { levelUp, newLevel: levelUp ? newLevel : undefined }
  }
  
  /**
   * プレイ時間を更新
   */
  async updatePlayTime(minutesPlayed: number): Promise<boolean> {
    const progress = await this.getProgress()
    if (!progress) return false
    
    return await this.updateProgress({
      total_play_time: progress.total_play_time + minutesPlayed
    })
  }
  
  /**
   * 機能をアンロック
   */
  async unlockFeature(feature: string): Promise<boolean> {
    const progress = await this.getProgress()
    if (!progress) return false
    
    if (progress.unlocked_features.includes(feature)) {
      return true // 既にアンロック済み
    }
    
    const newUnlockedFeatures = [...progress.unlocked_features, feature]
    const updated = await this.updateProgress({
      unlocked_features: newUnlockedFeatures
    })
    
    if (updated) {
      console.log(`🔓 新機能がアンロックされました: ${feature}`)
    }
    
    return updated
  }
  
  /**
   * アチーブメントポイントを追加
   */
  async addAchievementPoints(points: number): Promise<boolean> {
    const progress = await this.getProgress()
    if (!progress) return false
    
    return await this.updateProgress({
      achievement_points: progress.achievement_points + points
    })
  }
  
  /**
   * 難易度を変更
   */
  async changeDifficulty(difficulty: GameProgress['difficulty']): Promise<boolean> {
    return await this.updateProgress({ difficulty })
  }
  
  /**
   * ゲームバランス設定を取得
   */
  async getBalance(): Promise<GameBalance | null> {
    if (!supabase) return null
    
    try {
      const { data, error } = await supabase
        .from('game_balance')
        .select('*')
        .eq('user_id', this.userId)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          // データが見つからない場合は初期化
          return await this.initializeBalance()
        }
        console.error('バランス設定取得エラー:', error)
        return null
      }
      
      return data
    } catch (error) {
      console.error('バランス設定取得エラー:', error)
      return null
    }
  }
  
  /**
   * ゲームバランス設定を更新
   */
  async updateBalance(updates: Partial<GameBalance>): Promise<boolean> {
    if (!supabase) return false
    
    try {
      const { error } = await supabase
        .from('game_balance')
        .upsert({
          user_id: this.userId,
          ...updates,
          updated_at: new Date().toISOString()
        })
      
      if (error) {
        console.error('バランス設定更新エラー:', error)
        return false
      }
      
      console.log('✅ バランス設定が更新されました')
      return true
    } catch (error) {
      console.error('バランス設定更新エラー:', error)
      return false
    }
  }
  
  /**
   * 初期進行状況を作成
   */
  private async initializeProgress(): Promise<GameProgress | null> {
    const initialProgress: GameProgress = {
      user_id: this.userId,
      level: 1,
      experience: 0,
      next_level_exp: 1000,
      total_play_time: 0,
      achievement_points: 0,
      unlocked_features: ['basic_training', 'pokemon_management', 'simple_expeditions'],
      difficulty: 'normal',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const success = await this.updateProgress(initialProgress)
    return success ? initialProgress : null
  }
  
  /**
   * 初期バランス設定を作成
   */
  private async initializeBalance(): Promise<GameBalance | null> {
    const initialBalance: GameBalance = {
      user_id: this.userId,
      trainer_growth_rate: 1.0,
      pokemon_growth_rate: 1.0,
      expedition_difficulty: 1.0,
      economy_inflation: 1.0,
      research_speed: 1.0,
      facility_efficiency: 1.0,
      updated_at: new Date().toISOString()
    }
    
    const success = await this.updateBalance(initialBalance)
    return success ? initialBalance : null
  }
  
  /**
   * 次のレベルまでの必要経験値を計算
   */
  private calculateNextLevelExp(level: number): number {
    // 指数的増加式: baseExp * (level ** 1.5)
    const baseExp = 800
    return Math.floor(baseExp * Math.pow(level, 1.5))
  }
  
  /**
   * レベルアップ報酬の処理
   */
  private async processLevelUpRewards(newLevel: number): Promise<void> {
    // レベルに応じた機能アンロック
    const unlockTable: { [level: number]: string[] } = {
      2: ['pokemon_trading'],
      3: ['advanced_training'],
      5: ['facility_upgrades'],
      7: ['research_projects'],
      10: ['breeding_system'],
      15: ['competitive_battles'],
      20: ['legendary_encounters']
    }
    
    const unlocksForThisLevel = unlockTable[newLevel]
    if (unlocksForThisLevel) {
      for (const feature of unlocksForThisLevel) {
        await this.unlockFeature(feature)
      }
    }
    
    // アチーブメントポイント報酬
    const pointsReward = newLevel * 10
    await this.addAchievementPoints(pointsReward)
  }
}

/**
 * 進行状況マネージャーのファクトリー関数
 */
export const createProgressManager = (userId: string): ProgressManager => {
  return new ProgressManager(userId)
}