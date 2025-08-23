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
  guest_name: '新米トレーナー',
  school_name: 'はじまりの町ポケモン学校',
  current_money: 5000, // 序盤に適した初期資金
  total_reputation: 0, // 初期評判はゼロ
  ui_theme: 'default',
  settings: {
    autoSave: true,
    realTimeUpdates: true,
    notifications: true,
    difficulty: 'normal'
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

// モックゲーム進行状況
export const MOCK_PROGRESS = {
  id: 'mock-progress-dev',
  user_id: MOCK_USER.id,
  level: 1, // 初心者レベル
  experience: 0, // 経験値ゼロから開始
  next_level_exp: 1000, // レベル2までの経験値
  total_play_time: 0, // プレイ時間ゼロ
  achievement_points: 0, // アチーブメントポイントなし
  unlocked_features: [
    'basic_training', // 基本訓練のみ利用可能
    'pokemon_management' // ポケモン管理のみ
    // 他の機能はプレイヤーが進行で解放
  ],
  difficulty: 'normal',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

// モックポケモン - 初心者向けスターターポケモン1匹のみ
export const MOCK_POKEMON = [
  {
    id: 'starter-pokemon-1',
    user_id: MOCK_USER.id,
    dex_number: 25,
    name: 'ピカチュウ',
    level: 5, // 初心者レベル
    hp: 35, // レベル相応の低いHP
    attack: 35,
    defense: 25,
    special_attack: 30,
    special_defense: 30,
    speed: 45,
    types: ['electric'],
    nature: 'がんばりや', // ニュートラルな性格
    is_shiny: false, // 色違いではない
    ivs: { hp: 15, attack: 15, defense: 15, special_attack: 15, special_defense: 15, speed: 15 }, // 平均的なIV
    status: 'available',
    friendship: 50, // 初期なつき度
    moves: ['でんきショック', 'なきごえ'], // 最低限の技のみ
    caught_at: new Date().toISOString(), // 今受け取ったばかり
    updated_at: new Date().toISOString()
  }
]

// モックトレーナー - 初心者向けに初期トレーナーなし（雇用が目標の一つ）
export const MOCK_TRAINERS = [
  // 初期状態はトレーナーなし。プレイヤーが後で雇用する必要がある
]

// モック派遣 - 初期状態では進行中の派遣なし
export const MOCK_EXPEDITIONS = [
  // 初期状態は派遣なし。プレイヤーがトレーナーを雇用後に派遣を開始
]

// モック施設 - 基本的なトレーニング場のみレベル1で提供
export const MOCK_FACILITIES = [
  {
    id: 'starter-facility-1',
    user_id: MOCK_USER.id,
    facility_type: 'training_ground',
    name: '基本トレーニング場',
    level: 1, // レベル1から開始
    capacity: 2, // 少ない容量から開始
    efficiency: 1.0, // 基本効率
    maintenance_cost: 100, // 低いメンテナンス費用
    status: 'operational',
    last_maintenance: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

// モック取引 - 初期状態では取引履歴なし
export const MOCK_TRANSACTIONS = [
  // 初期状態は取引履歴なし。プレイヤーが活動を始めると記録される
]

// モック分析データ - 初期状態では分析データなし
export const MOCK_ANALYSIS = [
  // 初期状態は分析データなし。プレイヤーが活動すると生成される
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