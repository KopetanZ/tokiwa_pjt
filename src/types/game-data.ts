/**
 * ゲーム内で使用される具体的なデータ型定義
 * Record<string, any>やany[]を具体的な型に置き換える
 */

// Pokemon Individual Values (個体値)
export interface PokemonIVs {
  hp: number
  attack: number
  defense: number
  special_attack: number
  special_defense: number
  speed: number
}

// 派遣時のアドバイス設定
export interface ExpeditionAdvice {
  strategy: 'aggressive' | 'balanced' | 'cautious'
  focus: 'capture' | 'exploration' | 'safety' | 'treasure'
  priorities: string[]
  risk_tolerance: number // 0.0 - 1.0
  use_items: boolean
}

// 介入機会イベント
export interface InterventionOpportunity {
  id: string
  event_type: 'wild_pokemon' | 'treasure_found' | 'danger' | 'choice_point' | 'weather'
  description: string
  description_ja: string
  choices: InterventionChoice[]
  time_limit_seconds: number
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface InterventionChoice {
  id: string
  label: string
  label_ja: string
  description: string
  success_rate: number
  potential_rewards: {
    money?: number
    experience?: number
    items?: string[]
    pokemon?: { species: string; level: number }[]
  }
  potential_risks: {
    injury_chance?: number
    equipment_damage?: number
    time_loss?: number
  }
}

// 派遣結果サマリー
export interface ExpeditionResultSummary {
  success: boolean
  duration_actual_hours: number
  total_reward_money: number
  experience_gained: number
  pokemon_caught: Array<{
    species: string
    species_ja: string
    level: number
    is_shiny: boolean
  }>
  items_found: Array<{
    item_name: string
    item_name_ja: string
    quantity: number
  }>
  events_encountered: Array<{
    event_type: string
    outcome: string
    impact: 'positive' | 'negative' | 'neutral'
  }>
  trainer_status: {
    health: number // 0-100
    stamina: number // 0-100
    morale: number // 0-100
  }
  completion_rating: 'excellent' | 'good' | 'average' | 'poor' | 'failed'
}

// 介入への応答
export interface InterventionResponses {
  [interventionId: string]: {
    choice_id: string
    response_time_seconds: number
    outcome: 'success' | 'failure' | 'partial'
    actual_rewards: ExpeditionResultSummary['pokemon_caught'] | ExpeditionResultSummary['items_found']
    actual_consequences: {
      health_change?: number
      stamina_change?: number
      time_change?: number
    }
  }
}

// 場所のアンロック要件
export interface LocationUnlockRequirements {
  min_trainer_level?: number
  min_school_level?: number
  required_expeditions?: string[] // 完了が必要な派遣のID
  required_pokemon_types?: string[] // 所有が必要なポケモンタイプ
  required_facilities?: string[] // 建設が必要な施設
  cost_to_unlock?: number
  story_progression?: string // ストーリー進行度
}

// AI分析の予測結果
export interface PredictedOutcomes {
  success_probability: number // 0.0 - 1.0
  expected_duration_hours: number
  expected_money_range: {
    min: number
    max: number
    average: number
  }
  pokemon_catch_probabilities: Array<{
    species: string
    probability: number
    expected_level_range: { min: number; max: number }
  }>
  risk_assessment: {
    injury_risk: number // 0.0 - 1.0
    equipment_damage_risk: number
    failure_risk: number
  }
}

// AI最適化提案
export interface OptimizationSuggestions {
  recommended_strategy: ExpeditionAdvice['strategy']
  recommended_duration_hours: number
  equipment_suggestions: string[]
  trainer_preparation_advice: string[]
  timing_recommendations: {
    best_time_of_day: 'morning' | 'afternoon' | 'evening' | 'night'
    weather_conditions: string[]
  }
  alternative_locations: Array<{
    location_id: number
    reason: string
    expected_improvement: string
  }>
}

// 介入イベントでの報酬
export interface InterventionRewards {
  immediate: {
    money?: number
    experience?: number
    items?: Array<{ name: string; quantity: number }>
  }
  pokemon_encounters?: Array<{
    species: string
    level: number
    catch_rate: number
    is_shiny: boolean
  }>
  long_term_effects?: {
    reputation_change?: number
    relationship_changes?: Record<string, number>
    unlock_opportunities?: string[]
  }
}

// バックアップデータの構造
export interface BackupGameData {
  version: string
  created_at: string
  user_profile: {
    trainer_name: string
    school_name: string
    level: number
    total_play_time: number
  }
  game_state: {
    current_money: number
    trainers_count: number
    pokemon_count: number
    facilities_count: number
    active_expeditions_count: number
  }
  settings: {
    difficulty: string
    auto_save: boolean
    notifications: boolean
  }
  checksum: string // データ整合性チェック用
}

// 施設の効果
export interface FacilityEffects {
  training_speed_multiplier?: number // トレーニング速度向上
  pokemon_care_efficiency?: number   // ポケモンケア効率
  expedition_success_bonus?: number  // 派遣成功率ボーナス
  resource_generation?: {            // リソース生成
    type: 'money' | 'research_points' | 'materials'
    amount_per_hour: number
  }
  capacity_bonuses?: {               // 容量ボーナス
    trainer_slots?: number
    pokemon_slots?: number
    storage_slots?: number
  }
  special_abilities?: string[]       // 特殊能力
}

// 汎用的なゲーム統計
export interface GameStats {
  total_expeditions_completed: number
  total_pokemon_caught: number
  total_money_earned: number
  favorite_location_id?: number
  most_successful_trainer_id?: string
  total_play_time_hours: number
  achievements_unlocked: string[]
  current_streak: {
    type: 'successful_expeditions' | 'daily_logins' | 'perfect_scores'
    count: number
    started_at: string
  }
}