// 開発環境用モックデータ

import { User } from '@supabase/supabase-js'

// モックユーザー
export const MOCK_USER: User = {
  id: 'mock-user-dev-12345',
  app_metadata: {},
  user_metadata: {
    trainer_name: '開発テスト館長',
    school_name: 'トキワシティ訓練所（開発版）'
  },
  aud: 'authenticated',
  confirmation_sent_at: new Date().toISOString(),
  confirmed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  email: 'dev@tokiwa.school',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  phone_confirmed_at: undefined,
  last_sign_in_at: new Date().toISOString(),
  role: 'authenticated',
  identities: []
}

// モックプロファイル
export const MOCK_PROFILE = {
  id: MOCK_USER.id,
  email: MOCK_USER.email,
  trainer_name: '開発テスト館長',
  school_name: 'トキワシティ訓練所（開発版）',
  current_money: 100000,
  total_reputation: 150,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

// モックゲーム進行状況
export const MOCK_PROGRESS = {
  id: 'mock-progress-dev',
  user_id: MOCK_USER.id,
  level: 5,
  experience: 2500,
  next_level_exp: 5000,
  total_play_time: 180,
  achievement_points: 75,
  unlocked_features: [
    'basic_training',
    'pokemon_management',
    'simple_expeditions',
    'advanced_training',
    'facility_upgrades'
  ],
  difficulty: 'normal',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

// モックポケモン
export const MOCK_POKEMON = [
  {
    id: 'mock-pokemon-1',
    user_id: MOCK_USER.id,
    dex_number: 25,
    name: 'ピカチュウ',
    level: 15,
    hp: 60,
    attack: 55,
    defense: 40,
    special_attack: 50,
    special_defense: 50,
    speed: 90,
    types: ['electric'],
    nature: 'のんき',
    is_shiny: false,
    ivs: { hp: 20, attack: 25, defense: 15, special_attack: 30, special_defense: 20, speed: 31 },
    status: 'available',
    friendship: 85,
    moves: ['でんきショック', 'でんこうせっか', 'しっぽをふる', 'なきごえ'],
    caught_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-pokemon-2',
    user_id: MOCK_USER.id,
    dex_number: 1,
    name: 'フシギダネ',
    level: 12,
    hp: 45,
    attack: 49,
    defense: 49,
    special_attack: 65,
    special_defense: 65,
    speed: 45,
    types: ['grass', 'poison'],
    nature: 'おだやか',
    is_shiny: false,
    ivs: { hp: 18, attack: 15, defense: 22, special_attack: 28, special_defense: 31, speed: 12 },
    status: 'available',
    friendship: 70,
    moves: ['はっぱカッター', 'つるのムチ', 'せいちょう', 'たいあたり'],
    caught_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-pokemon-3',
    user_id: MOCK_USER.id,
    dex_number: 4,
    name: 'ヒトカゲ',
    level: 10,
    hp: 39,
    attack: 52,
    defense: 43,
    special_attack: 60,
    special_defense: 50,
    speed: 65,
    types: ['fire'],
    nature: 'いじっぱり',
    is_shiny: true,
    ivs: { hp: 25, attack: 31, defense: 18, special_attack: 22, special_defense: 16, speed: 29 },
    status: 'training',
    friendship: 60,
    moves: ['ひのこ', 'ひっかく', 'なきごえ', 'えんまく'],
    caught_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }
]

// モックトレーナー
export const MOCK_TRAINERS = [
  {
    id: 'mock-trainer-1',
    user_id: MOCK_USER.id,
    name: 'タケシ',
    specialty: 'いわタイプ',
    level: 25,
    experience: 1250,
    next_level_exp: 1500,
    stamina: 85,
    max_stamina: 100,
    skills: {
      combat: 78,
      survival: 92,
      pokemon_care: 65,
      leadership: 70,
      research: 45
    },
    status: 'available',
    hired_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-trainer-2',
    user_id: MOCK_USER.id,
    name: 'カスミ',
    specialty: 'みずタイプ',
    level: 22,
    experience: 890,
    next_level_exp: 1200,
    stamina: 75,
    max_stamina: 90,
    skills: {
      combat: 88,
      survival: 60,
      pokemon_care: 95,
      leadership: 85,
      research: 52
    },
    status: 'expedition',
    hired_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }
]

// モック派遣
export const MOCK_EXPEDITIONS = [
  {
    id: 'mock-expedition-1',
    user_id: MOCK_USER.id,
    trainer_id: 'mock-trainer-2',
    location: 'トキワの森',
    mission_type: 'ポケモン調査',
    difficulty: 'easy',
    status: 'active',
    duration: 120,
    progress: 45,
    rewards: {
      money: 2500,
      experience: 150,
      items: ['きのみ×3', 'モンスターボール×2']
    },
    started_at: new Date(Date.now() - 54 * 60 * 1000).toISOString(),
    estimated_completion: new Date(Date.now() + 66 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 54 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }
]

// モック施設
export const MOCK_FACILITIES = [
  {
    id: 'mock-facility-1',
    user_id: MOCK_USER.id,
    facility_type: 'training_ground',
    name: '基礎トレーニング場',
    level: 3,
    capacity: 6,
    efficiency: 1.2,
    maintenance_cost: 500,
    status: 'operational',
    last_maintenance: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-facility-2',
    user_id: MOCK_USER.id,
    facility_type: 'pokemon_center',
    name: 'ポケモンセンター',
    level: 2,
    capacity: 12,
    efficiency: 1.1,
    maintenance_cost: 300,
    status: 'operational',
    last_maintenance: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }
]

// モック取引
export const MOCK_TRANSACTIONS = [
  {
    id: 'mock-transaction-1',
    user_id: MOCK_USER.id,
    type: 'income',
    category: 'expedition_reward',
    amount: 3500,
    description: 'トキワの森調査完了報酬',
    reference_id: 'expedition-completed-001',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'mock-transaction-2',
    user_id: MOCK_USER.id,
    type: 'expense',
    category: 'facility_maintenance',
    amount: 800,
    description: '施設メンテナンス費用',
    reference_id: 'maintenance-scheduled-002',
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'mock-transaction-3',
    user_id: MOCK_USER.id,
    type: 'income',
    category: 'training_fee',
    amount: 1200,
    description: '基礎トレーニング指導料',
    reference_id: 'training-session-003',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
]

// モック分析データ
export const MOCK_ANALYSIS = [
  {
    id: 'mock-analysis-1',
    user_id: MOCK_USER.id,
    analysis_type: 'comprehensive',
    game_level: 5,
    efficiency_score: 78.5,
    profit_score: 125000,
    recommendations: [
      'トレーニング場のレベルを上げることで効率が20%向上します',
      'みずタイプのポケモンを追加することでバランスが改善されます',
      '派遣の頻度を増やすことで収益が安定します'
    ],
    predicted_outcomes: {
      weekly_profit: 15000,
      trainer_growth: 12,
      pokemon_evolution: 2
    },
    optimization_suggestions: {
      priority_upgrades: ['training_ground'],
      recommended_pokemon: ['みずタイプ', 'ひこうタイプ'],
      expedition_frequency: 'daily'
    },
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  }
]

export const MOCK_GAME_DATA = {
  profile: MOCK_PROFILE,
  pokemon: MOCK_POKEMON,
  trainers: MOCK_TRAINERS,
  expeditions: MOCK_EXPEDITIONS,
  facilities: MOCK_FACILITIES,
  transactions: MOCK_TRANSACTIONS,
  progress: MOCK_PROGRESS,
  analysis: MOCK_ANALYSIS
}