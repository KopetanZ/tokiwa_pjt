/**
 * 静的ゲームデータの型定義
 * ゲーム内で使用される不変データの定義
 */

// 職業定義
export interface JobDefinition {
  id: TrainerJob
  name: string
  nameJa: string
  description: string
  
  // 基本パラメータ
  baseSalary: number
  startingLevel: number
  levelMultiplier: number
  
  // スキル特性
  skillAffinities: {
    capture: number      // -2 to 3
    exploration: number  // -2 to 3
    battle: number       // -2 to 3
    research: number     // -2 to 3
    healing: number      // -2 to 3
  }
  
  // 個性傾向
  personalityTendencies: {
    courage: number      // -2 to 2
    caution: number      // -2 to 2
    curiosity: number    // -2 to 2
    teamwork: number     // -2 to 2
    independence: number // -2 to 2
    compliance: number   // -2 to 2
  }
  
  // 特殊能力
  specialAbilities: string[]
  
  // 成長率
  growthRates: {
    experienceMultiplier: number
    skillGrowthRate: number
    trustGrowthRate: number
  }
  
  // 雇用条件
  hireCost: number
  minimumReputation: number
  unlockConditions: string[]
  
  // ロールプレイ
  flavor: {
    personalityDescription: string
    workStyle: string
    motivations: string[]
    catchphrases: string[]
  }
}

// 派遣先定義
export interface LocationDefinition {
  id: number
  name: string
  nameJa: string
  description: string
  region: string
  
  // 基本情報
  difficulty: 'easy' | 'normal' | 'hard' | 'extreme'
  environment: 'forest' | 'mountain' | 'cave' | 'water' | 'urban' | 'desert' | 'grassland'
  weather: ('sunny' | 'rainy' | 'snowy' | 'stormy' | 'foggy')[]
  
  // 派遣パラメータ
  baseDuration: number // hours
  dangerLevel: number  // 1-10
  explorationReward: number
  
  // 出現ポケモン
  pokemonEncounters: {
    speciesId: number
    rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
    encounterRate: number // 0.0-1.0
    levelRange: [number, number]
    timeOfDay?: 'morning' | 'day' | 'evening' | 'night'
    seasonality?: 'spring' | 'summer' | 'autumn' | 'winter'
  }[]
  
  // 必要スキル
  requiredSkills: {
    capture?: number
    exploration?: number
    battle?: number
    research?: number
    healing?: number
  }
  
  // 推奨トレーナータイプ
  recommendedJobs: TrainerJob[]
  
  // アンロック条件
  unlockConditions: {
    playerLevel?: number
    reputation?: number
    completedLocations?: number[]
    specialRequirements?: string[]
  }
  
  // イベント
  specialEvents: {
    id: string
    name: string
    description: string
    triggerRate: number
    effects: EventEffect[]
  }[]
  
  // 環境効果
  environmentalEffects: {
    weatherImpact: Record<string, number>
    timeOfDayBonus: Record<string, number>
    skillModifiers: Record<string, number>
  }
}

// ポケモン種族データ
export interface PokemonSpeciesDefinition {
  id: number
  name: string
  nameJa: string
  type1: PokemonType
  type2?: PokemonType
  category: string
  
  // 基本ステータス
  baseStats: {
    hp: number
    attack: number
    defense: number
    specialAttack: number
    specialDefense: number
    speed: number
    total: number
  }
  
  // 成長パラメータ
  experienceGroup: 'slow' | 'medium_slow' | 'medium_fast' | 'fast'
  baseExperience: number
  catchRate: number
  
  // 外見・特徴
  height: number // meters
  weight: number // kg
  color: string
  habitat: string
  
  // ゲーム内での価値
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary' | 'mythical'
  marketValue: number
  researchValue: number
  
  // 能力・特性
  abilities: string[]
  hiddenAbility?: string
  
  // 習得技
  levelUpMoves: {
    level: number
    move: string
  }[]
  
  // 進化
  evolutionChain?: {
    evolvesTo?: number
    method: 'level' | 'stone' | 'trade' | 'friendship' | 'special'
    requirement: any
  }
  
  // 生態情報
  ecology: {
    temperament: 'docile' | 'aggressive' | 'shy' | 'curious' | 'protective'
    activityPattern: 'diurnal' | 'nocturnal' | 'crepuscular'
    socialBehavior: 'solitary' | 'pair' | 'small_group' | 'large_group'
    preferredEnvironment: string[]
    diet: 'herbivore' | 'carnivore' | 'omnivore' | 'energy'
  }
  
  // トレーニング
  trainingDifficulty: number // 1-10
  loyaltyGrowthRate: number
  healthRecoveryRate: number
  
  // フレーバー
  description: string
  flavorText: {
    version: string
    text: string
  }[]
}

// 共通型
export type TrainerJob = 'ranger' | 'breeder' | 'researcher' | 'battler' | 'medic'

export type PokemonType = 
  | 'normal' | 'fighting' | 'flying' | 'poison' | 'ground' | 'rock' 
  | 'bug' | 'ghost' | 'steel' | 'fire' | 'water' | 'grass'
  | 'electric' | 'psychic' | 'ice' | 'dragon' | 'dark' | 'fairy'

export interface EventEffect {
  type: 'skill_bonus' | 'experience_bonus' | 'money_bonus' | 'pokemon_encounter' | 'danger'
  value: number
  duration?: number
  condition?: string
}

// データベースインターフェース
export interface StaticDataDB {
  jobs: Record<TrainerJob, JobDefinition>
  locations: Record<number, LocationDefinition>
  pokemon: Record<number, PokemonSpeciesDefinition>
  types: Record<PokemonType, TypeDefinition>
  moves: Record<string, MoveDefinition>
}

export interface TypeDefinition {
  name: string
  nameJa: string
  color: string
  effectiveness: Record<PokemonType, number>
}

export interface MoveDefinition {
  name: string
  nameJa: string
  type: PokemonType
  category: 'physical' | 'special' | 'status'
  power?: number
  accuracy: number
  pp: number
  description: string
}