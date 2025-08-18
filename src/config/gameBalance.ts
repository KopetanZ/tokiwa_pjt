export const GAME_BALANCE = {
  // 基礎設定
  MAX_TRAINER_LEVEL: 50,
  MAX_POKEMON_LEVEL: 100,
  MAX_PARTY_SIZE: 6,
  
  // 時間設定
  MIN_EXPEDITION_HOURS: 1,
  MAX_EXPEDITION_HOURS: 72,
  INTERVENTION_WINDOW_SECONDS: 30,
  
  // 経済バランス
  STARTING_MONEY: 50000,
  BASE_TRAINER_SALARY: 3000,
  SALARY_LEVEL_MULTIPLIER: 1.2,
  
  // 成功率補正
  PLAYER_INTERVENTION_BONUS: 0.15, // 15%向上
  TRUST_LEVEL_MAX_BONUS: 0.25,     // 最大25%向上
  FACILITY_MAX_BONUS: 0.30,        // 施設最大30%向上
  
  // 確率設定
  RARE_POKEMON_BASE_RATE: 0.05,    // 5%
  INTERVENTION_EVENT_RATE: 0.20,   // 20%（1時間あたり）
  CRITICAL_EVENT_RATE: 0.05,       // 5%（緊急事態）
  
  // レベルアップ経験値（指数的増加を避ける設計）
  LEVEL_EXP_BASE: 100,
  LEVEL_EXP_MULTIPLIER: 1.1,
  
  // 施設効果
  FACILITY_EFFECT_BASE: 0.05,      // 5%
  FACILITY_EFFECT_PER_LEVEL: 0.03, // レベルごと+3%
} as const

export const TRAINER_JOBS = {
  RANGER: {
    id: 1,
    name: 'ranger',
    nameJa: 'レンジャー',
    specializations: {
      capture: 1.25,
      exploration: 1.15,
      battle: 0.95
    },
    salaryMultiplier: 1.0
  },
  BREEDER: {
    id: 2,
    name: 'breeder',
    nameJa: 'ブリーダー',
    specializations: {
      breeding: 1.30,
      healing: 1.20,
      capture: 1.05
    },
    salaryMultiplier: 1.1
  },
  BATTLER: {
    id: 3,
    name: 'battler',
    nameJa: 'バトラー',
    specializations: {
      battle: 1.25,
      strategy: 1.15,
      capture: 0.90
    },
    salaryMultiplier: 1.2
  },
  RESEARCHER: {
    id: 4,
    name: 'researcher',
    nameJa: 'リサーチャー',
    specializations: {
      discovery: 1.25,
      rare_find: 1.30,
      analysis: 1.20
    },
    salaryMultiplier: 1.3
  },
  MEDIC: {
    id: 5,
    name: 'medic',
    nameJa: 'メディック',
    specializations: {
      healing: 1.35,
      safety: 1.25,
      emergency: 1.40
    },
    salaryMultiplier: 1.4
  }
} as const

export const EXPEDITION_LOCATIONS = {
  VIRIDIAN_FOREST: {
    id: 1,
    name: 'viridian_forest',
    nameJa: 'トキワの森',
    distanceLevel: 1,
    travelCost: 500,
    travelTimeHours: 2,
    riskLevel: 1.0,
    baseRewardMoney: 1000,
    encounterTypes: ['bug', 'normal', 'flying']
  },
  ROUTE_22: {
    id: 2,
    name: 'route_22',
    nameJa: '22番道路',
    distanceLevel: 1,
    travelCost: 300,
    travelTimeHours: 1,
    riskLevel: 0.8,
    baseRewardMoney: 800,
    encounterTypes: ['normal', 'flying']
  },
  PEWTER_GYM: {
    id: 3,
    name: 'pewter_gym',
    nameJa: 'ニビジム',
    distanceLevel: 2,
    travelCost: 1200,
    travelTimeHours: 4,
    riskLevel: 1.3,
    baseRewardMoney: 2500,
    encounterTypes: ['rock', 'ground']
  },
  MT_MOON: {
    id: 4,
    name: 'mt_moon',
    nameJa: 'お月見山',
    distanceLevel: 3,
    travelCost: 2000,
    travelTimeHours: 8,
    riskLevel: 1.5,
    baseRewardMoney: 4000,
    encounterTypes: ['rock', 'normal', 'poison']
  },
  CERULEAN_CAVE: {
    id: 5,
    name: 'cerulean_cave',
    nameJa: 'ハナダの洞窟',
    distanceLevel: 5,
    travelCost: 5000,
    travelTimeHours: 24,
    riskLevel: 2.5,
    baseRewardMoney: 15000,
    encounterTypes: ['psychic', 'water', 'normal']
  }
} as const