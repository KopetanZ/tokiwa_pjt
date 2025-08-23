// JSONベースのゲームデータ型定義
export interface GameData {
  // メタデータ
  version: string
  userId: string
  lastSaved: string
  createdAt: string
  
  // プレイヤー情報
  player: {
    name: string
    schoolName: string
    money: number
    reputation: number
    level: number
    experience: number
    nextLevelExp: number
  }
  
  // トレーナー
  trainers: Trainer[]
  
  // ポケモン
  pokemon: Pokemon[]
  
  // 派遣
  expeditions: Expedition[]
  
  // 施設
  facilities: Facility[]
  
  // 取引履歴
  transactions: Transaction[]
  
  // 設定
  settings: GameSettings
  
  // 統計
  statistics: GameStatistics
}

export interface Trainer {
  id: string
  name: string
  job: TrainerJob
  level: number
  experience: number
  nextLevelExp: number
  
  // ステータス
  status: 'available' | 'on_expedition' | 'training' | 'resting'
  currentExpeditionId?: string
  
  // スキル
  skills: {
    capture: number
    exploration: number
    battle: number
    research: number
    healing: number
  }
  
  // 個性
  personality: {
    courage: number      // -10 to 10
    caution: number      // -10 to 10
    curiosity: number    // -10 to 10
    teamwork: number     // -10 to 10
    independence: number // -10 to 10
    compliance: number   // -10 to 10
  }
  
  // 経済
  salary: number
  totalEarned: number
  
  // パフォーマンス
  totalExpeditions: number
  successfulExpeditions: number
  pokemonCaught: number
  
  // 関係性
  trustLevel: number
  favoriteLocations: number[]
  
  // メタ
  hiredDate: string
  lastActive: string
}

export interface Pokemon {
  id: string
  speciesId: number
  name: string
  nameJa: string
  level: number
  experience: number
  nextLevelExp: number
  
  // ステータス
  hp: number
  maxHp: number
  attack: number
  defense: number
  specialAttack: number
  specialDefense: number
  speed: number
  
  // 状態
  status: 'healthy' | 'injured' | 'sick' | 'training'
  
  // 習得技
  moves: string[]
  
  // 個体値
  ivs: {
    hp: number
    attack: number
    defense: number
    specialAttack: number
    specialDefense: number
    speed: number
  }
  
  // 性格
  nature: string
  
  // メタ
  caughtDate: string
  caughtLocation: number
  caughtBy: string // trainer id
  originalTrainer: string
}

export interface Expedition {
  id: string
  trainerId: string
  locationId: number
  
  // 設定
  mode: 'exploration' | 'balanced' | 'safe' | 'aggressive'
  targetDuration: number // hours
  strategy: string[]
  
  // 状態
  status: 'preparing' | 'active' | 'completed' | 'failed' | 'recalled'
  startTime: string
  estimatedEndTime: string
  actualEndTime?: string
  currentProgress: number // 0.0 to 1.0
  
  // イベント
  events: ExpeditionEvent[]
  interventions: Intervention[]
  
  // 結果
  result?: {
    success: boolean
    pokemonCaught: Pokemon[]
    itemsFound: Item[]
    moneyEarned: number
    experienceGained: number
    trainerExpGained: number
    summary: string
  }
  
  // メタ
  createdAt: string
  updatedAt: string
}

export interface ExpeditionEvent {
  id: string
  type: 'pokemon_encounter' | 'item_discovery' | 'danger' | 'weather' | 'trainer_encounter'
  message: string
  timestamp: string
  
  // 選択肢
  choices?: {
    id: string
    text: string
    effect: string
    successRate: number
    requirements?: string[]
  }[]
  
  // 解決状況
  resolved: boolean
  chosenAction?: string
  result?: string
}

export interface Intervention {
  id: string
  eventId: string
  action: string
  timestamp: string
  result: 'success' | 'failure' | 'partial'
  effect: string
}

export interface Facility {
  id: string
  type: 'healing_center' | 'training_ground' | 'research_lab' | 'storage' | 'dormitory'
  name: string
  level: number
  
  // 効果
  effects: {
    healingSpeed?: number
    trainingEfficiency?: number
    researchBonus?: number
    storageCapacity?: number
    trainerCapacity?: number
  }
  
  // 状態
  condition: number // 0.0 to 1.0
  maintenanceCost: number
  
  // メタ
  builtDate: string
  lastUpgrade?: string
}

export interface Transaction {
  id: string
  type: 'income' | 'expense'
  category: 'expedition_reward' | 'salary' | 'facility_cost' | 'trainer_hire' | 'item_purchase' | 'other'
  amount: number
  description: string
  
  // 関連データ
  relatedId?: string // expedition id, trainer id, etc.
  
  // メタ
  timestamp: string
}

export interface Item {
  id: string
  name: string
  nameJa: string
  type: 'medicine' | 'tool' | 'rare' | 'consumable'
  description: string
  quantity: number
  value: number
  
  // 効果
  effects?: {
    healing?: number
    experienceBoost?: number
    captureRateBoost?: number
  }
}

export interface GameSettings {
  // UI設定
  theme: 'light' | 'dark' | 'retro'
  soundEnabled: boolean
  musicEnabled: boolean
  notificationsEnabled: boolean
  
  // ゲーム設定
  autoSave: boolean
  autoSaveInterval: number // minutes
  difficutly: 'easy' | 'normal' | 'hard'
  
  // 自動化設定
  autoIntervention: boolean
  autoHeal: boolean
  autoTraining: boolean
}

export interface GameStatistics {
  // 基本統計
  totalPlayTime: number // minutes
  totalExpeditions: number
  totalPokemonCaught: number
  totalMoneyEarned: number
  
  // 成功率
  expeditionSuccessRate: number
  captureSuccessRate: number
  
  // 記録
  longestExpedition: number // hours
  mostValuableCapture: string // pokemon name
  bestDay: {
    date: string
    earnings: number
  }
  
  // トレーナー統計
  bestPerformingTrainer: string
  
  // 更新日時
  lastCalculated: string
}

// ゲームコンテキスト（セーブデータ用）
export interface GameContext {
  gameState: GameData
  user: { id: string; guestName: string; schoolName: string } | null
}

// 列挙型
export type TrainerJob = 'ranger' | 'breeder' | 'researcher' | 'battler' | 'medic'

// 初期データ生成用
export const createInitialGameData = (userId: string, playerName: string, schoolName: string): GameData => ({
  version: '1.0.0',
  userId,
  lastSaved: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  
  player: {
    name: playerName,
    schoolName,
    money: 50000,
    reputation: 0,
    level: 1,
    experience: 0,
    nextLevelExp: 1000
  },
  
  trainers: [
    {
      id: 'mock-trainer-1',
      name: 'タケシ',
      job: 'ranger',
      level: 4,
      experience: 320,
      nextLevelExp: 500,
      status: 'available',
      skills: { capture: 8, exploration: 7, battle: 6, research: 5, healing: 4 },
      personality: { courage: 7, caution: 3, curiosity: 8, teamwork: 6, independence: 4, compliance: 5 },
      salary: 3600,
      totalEarned: 14400,
      totalExpeditions: 12,
      successfulExpeditions: 10,
      pokemonCaught: 15,
      trustLevel: 75,
      favoriteLocations: [1, 2, 3],
      hiredDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30日前
      lastActive: new Date().toISOString()
    },
          {
        id: 'mock-trainer-2',
        name: 'カスミ',
        job: 'battler',
        level: 2,
        experience: 180,
        nextLevelExp: 300,
        status: 'available',
        skills: { capture: 5, exploration: 4, battle: 8, research: 3, healing: 2 },
        personality: { courage: 8, caution: 2, curiosity: 6, teamwork: 7, independence: 5, compliance: 4 },
        salary: 3000,
        totalEarned: 9000,
        totalExpeditions: 8,
        successfulExpeditions: 6,
        pokemonCaught: 8,
        trustLevel: 60,
        favoriteLocations: [2, 4],
        hiredDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20日前
        lastActive: new Date().toISOString()
      },
      {
        id: 'mock-trainer-3',
        name: 'マチス',
        job: 'breeder',
        level: 1,
        experience: 50,
        nextLevelExp: 150,
        status: 'available',
        skills: { capture: 6, exploration: 4, battle: 3, research: 7, healing: 8 },
        personality: { courage: 4, caution: 8, curiosity: 9, teamwork: 8, independence: 3, compliance: 7 },
        salary: 2800,
        totalEarned: 5600,
        totalExpeditions: 5,
        successfulExpeditions: 4,
        pokemonCaught: 6,
        trustLevel: 45,
        favoriteLocations: [1, 5],
        hiredDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15日前
        lastActive: new Date().toISOString()
      }
  ],
  pokemon: [
    {
      id: 'starter-pikachu',
      speciesId: 25,
      name: 'ピカチュウ',
      nameJa: 'ピカチュウ',
      level: 5,
      experience: 0,
      nextLevelExp: 100,
      hp: 20,
      maxHp: 20,
      attack: 12,
      defense: 8,
      specialAttack: 10,
      specialDefense: 8,
      speed: 15,
      status: 'healthy',
      moves: ['でんこうせっか', 'しっぽをふる', 'なきごえ'],
      ivs: { hp: 15, attack: 14, defense: 13, specialAttack: 12, specialDefense: 11, speed: 16 },
      nature: 'がんばりや',
      caughtDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1週間前
      caughtLocation: 1,
      caughtBy: 'mock-trainer-1',
      originalTrainer: 'タケシ'
    },
    {
      id: 'starter-eevee',
      speciesId: 133,
      name: 'イーブイ',
      nameJa: 'イーブイ',
      level: 3,
      experience: 0,
      nextLevelExp: 80,
      hp: 16,
      maxHp: 16,
      attack: 10,
      defense: 9,
      specialAttack: 8,
      specialDefense: 9,
      speed: 12,
      status: 'healthy',
      moves: ['でんこうせっか', 'しっぽをふる', 'なきごえ'],
      ivs: { hp: 14, attack: 13, defense: 15, specialAttack: 11, specialDefense: 12, speed: 13 },
      nature: 'おだやか',
      caughtDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5日前
      caughtLocation: 2,
      caughtBy: 'mock-trainer-2',
      originalTrainer: 'カスミ'
    },
    {
      id: 'starter-charmander',
      speciesId: 4,
      name: 'ヒトカゲ',
      nameJa: 'ヒトカゲ',
      level: 4,
      experience: 0,
      nextLevelExp: 90,
      hp: 18,
      maxHp: 18,
      attack: 11,
      defense: 7,
      specialAttack: 12,
      specialDefense: 8,
      speed: 13,
      status: 'healthy',
      moves: ['ひのこ', 'なきごえ', 'かえんだん'],
      ivs: { hp: 13, attack: 16, defense: 10, specialAttack: 15, specialDefense: 9, speed: 14 },
      nature: 'いじっぱり',
      caughtDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3日前
      caughtLocation: 3,
      caughtBy: 'mock-trainer-3',
      originalTrainer: 'マチス'
    }
  ],
  expeditions: [],
  facilities: [],
  transactions: [],
  
  settings: {
    theme: 'retro',
    soundEnabled: true,
    musicEnabled: true,
    notificationsEnabled: true,
    autoSave: true,
    autoSaveInterval: 5,
    difficutly: 'normal',
    autoIntervention: false,
    autoHeal: true,
    autoTraining: false
  },
  
  statistics: {
    totalPlayTime: 0,
    totalExpeditions: 0,
    totalPokemonCaught: 0,
    totalMoneyEarned: 0,
    expeditionSuccessRate: 0,
    captureSuccessRate: 0,
    longestExpedition: 0,
    mostValuableCapture: '',
    bestDay: {
      date: '',
      earnings: 0
    },
    bestPerformingTrainer: '',
    lastCalculated: new Date().toISOString()
  }
})