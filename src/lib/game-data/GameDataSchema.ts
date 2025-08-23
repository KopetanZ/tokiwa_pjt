// ゲーム拡張データの型定義とスキーマ

export interface GameSaveData {
  version: string;
  savedAt: string;
  playerId: string;
  
  // プレイヤープロフィール
  player: {
    id: string;
    name: string;
    schoolName: string;
    level: number;
    experience: number;
    money: number;
    reputation: number;
    achievements: string[];
    playTime: number; // 分単位
    settings: PlayerSettings;
  };

  // ポケモンデータ
  pokemon: {
    owned: PokemonSaveData[];
    storage: PokemonSaveData[]; // PC保管
    released: number; // 逃がした数
    shinyCount: number;
    totalCaught: number;
  };

  // トレーナーデータ
  trainers: {
    hired: TrainerSaveData[];
    available: any[]; // TODO: define TrainerCandidateData interface
    dismissed: number;
    totalHired: number;
  };

  // 施設データ
  facilities: {
    built: FacilitySaveData[];
    blueprints: string[]; // 利用可能な設計図
    totalInvestment: number;
  };

  // 派遣データ
  expeditions: {
    active: ExpeditionSaveData[];
    completed: any[]; // TODO: define ExpeditionHistoryData interface
    locations: LocationSaveData[];
    totalExpeditions: number;
    totalRewards: number;
  };

  // 経済データ
  economy: {
    transactions: TransactionData[];
    monthlyReports: MonthlyReportData[];
    currentMonthStats: MonthlyStatsData;
  };

  // 研究データ
  research: {
    projects: ResearchProjectData[];
    discoveries: DiscoveryData[];
    technologies: string[]; // 解放済み技術
    totalResearchPoints: number;
  };

  // アチーブメントデータ
  achievements: {
    unlocked: AchievementData[];
    progress: AchievementProgressData[];
    totalPoints: number;
  };

  // イベントデータ
  events: {
    seasonal: SeasonalEventData[];
    special: SpecialEventData[];
    daily: DailyTaskData[];
    weekly: WeeklyTaskData[];
  };

  // ゲーム進行データ
  progression: {
    currentPhase: string;
    unlockedFeatures: string[];
    completedTutorials: string[];
    milestones: MilestoneData[];
  };

  // 統計データ
  statistics: GameStatistics;
}

export interface PlayerSettings {
  language: 'ja' | 'en';
  theme: 'gameboy_green' | 'gameboy_pocket' | 'gameboy_color';
  soundEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  autoSave: boolean;
  notifications: {
    expeditions: boolean;
    training: boolean;
    breeding: boolean;
    achievements: boolean;
  };
  ui: {
    animationSpeed: 'slow' | 'normal' | 'fast';
    showTutorialHints: boolean;
    compactMode: boolean;
  };
}

export interface PokemonSaveData {
  id: string;
  speciesId: string;
  name: string; // ニックネーム
  level: number;
  experience: number;
  stats: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  ivs: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  evs: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  nature: string;
  ability: string;
  moves: string[];
  types: string[];
  happiness: number;
  isShiny: boolean;
  rarity: string;
  origin: {
    method: 'caught' | 'hatched' | 'gift' | 'trade';
    location: string;
    date: string;
    trainerLevel: number;
  };
  training: {
    totalSessions: number;
    specializedTraining: string[];
    favoriteTraining: string;
  };
  breeding: {
    offspringCount: number;
    parentIds: string[];
    eggGroups: string[];
  };
  status: 'active' | 'storage' | 'training' | 'expedition' | 'breeding' | 'injured';
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: string;
  };
}

export interface TrainerSaveData {
  id: string;
  name: string;
  specialization: string[];
  level: number;
  experience: number;
  skills: {
    combat: number;
    survival: number;
    pokemonCare: number;
    leadership: number;
    research: number;
  };
  personality: {
    motivation: number;
    loyalty: number;
    adaptability: number;
    creativity: number;
  };
  status: 'available' | 'expedition' | 'training' | 'rest' | 'injured';
  equipment: string[];
  achievements: string[];
  expeditionHistory: {
    totalExpeditions: number;
    successRate: number;
    preferredLocations: string[];
    totalRewards: number;
  };
  salary: number;
  contract: {
    hiredAt: string;
    contractType: 'permanent' | 'temporary' | 'seasonal';
    contractEnd?: string;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
  };
}

export interface FacilitySaveData {
  id: string;
  type: string;
  name: string;
  level: number;
  capacity: number;
  efficiency: number;
  status: 'operational' | 'maintenance' | 'construction' | 'offline';
  upgrades: string[];
  equipment: string[];
  maintenance: {
    lastMaintenance: string;
    nextMaintenance: string;
    totalCost: number;
    efficiency: number;
  };
  usage: {
    totalUsage: number;
    currentUsage: number;
    peakUsage: number;
    averageUsage: number;
  };
  earnings: {
    totalEarnings: number;
    monthlyEarnings: number;
    roi: number; // Return on Investment
  };
  metadata: {
    builtAt: string;
    totalInvestment: number;
    version: string;
  };
}

export interface ExpeditionSaveData {
  id: string;
  leaderId: string;
  teamMembers: string[];
  location: string;
  missionType: string;
  difficulty: string;
  duration: number;
  startTime: string;
  endTime: string;
  progress: number;
  status: 'preparation' | 'active' | 'completed' | 'failed' | 'cancelled';
  rewards: {
    money: number;
    experience: number;
    items: Array<{ itemId: string; quantity: number }>;
    pokemon?: PokemonSaveData[];
  };
  events: ExpeditionEventData[];
  risks: {
    weather: number;
    danger: number;
    equipment: number;
    team: number;
  };
  metadata: {
    createdAt: string;
    version: string;
  };
}

export interface ExpeditionEventData {
  id: string;
  type: 'encounter' | 'discovery' | 'challenge' | 'rest' | 'weather';
  timestamp: string;
  description: string;
  choices?: Array<{
    id: string;
    text: string;
    consequences: any;
  }>;
  selectedChoice?: string;
  outcome: {
    success: boolean;
    rewards?: any;
    penalties?: any;
    storyText: string;
  };
}

export interface LocationSaveData {
  id: string;
  name: string;
  type: string;
  difficulty: number;
  accessibility: number;
  discovered: boolean;
  explorationProgress: number;
  availableMissions: string[];
  pokemonEncounters: Array<{
    speciesId: string;
    rarity: number;
    conditions: string[];
  }>;
  resources: Array<{
    type: string;
    abundance: number;
    quality: number;
  }>;
  weather: {
    current: string;
    forecast: string[];
    seasonal: string[];
  };
  reputation: number;
  totalExpeditions: number;
  successRate: number;
  metadata: {
    discoveredAt: string;
    lastVisited: string;
  };
}

export interface TransactionData {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  referenceId?: string;
  tags: string[];
  date: string;
  metadata: {
    source: string;
    automated: boolean;
  };
}

export interface MonthlyReportData {
  month: string; // YYYY-MM
  income: {
    total: number;
    byCategory: Record<string, number>;
    growth: number;
  };
  expenses: {
    total: number;
    byCategory: Record<string, number>;
    growth: number;
  };
  netIncome: number;
  kpis: {
    roi: number;
    efficiency: number;
    sustainability: number;
  };
  highlights: string[];
  recommendations: string[];
}

export interface MonthlyStatsData {
  pokemonCaught: number;
  trainersHired: number;
  expeditionsCompleted: number;
  facilitiesBuilt: number;
  totalTraining: number;
  researchCompleted: number;
  achievementsUnlocked: number;
}

export interface ResearchProjectData {
  id: string;
  title: string;
  description: string;
  category: string;
  requirements: {
    level: number;
    prerequisites: string[];
    resources: Array<{ type: string; amount: number }>;
  };
  progress: number;
  startedAt?: string;
  completedAt?: string;
  status: 'available' | 'in_progress' | 'completed' | 'locked';
  rewards: {
    technologies: string[];
    items: Array<{ itemId: string; quantity: number }>;
    unlocks: string[];
  };
  timeline: {
    phases: Array<{
      name: string;
      duration: number;
      requirements: any[];
    }>;
    currentPhase: number;
  };
}

export interface DiscoveryData {
  id: string;
  title: string;
  type: 'species' | 'location' | 'technology' | 'method' | 'secret';
  discoveredAt: string;
  discoveredBy: string; // trainer or player
  description: string;
  significance: number;
  rewards: {
    reputation: number;
    money: number;
    unlocks: string[];
  };
  conditions: string[];
}

export interface AchievementData {
  id: string;
  title: string;
  description: string;
  category: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';
  points: number;
  unlockedAt: string;
  conditions: any[];
  rewards: {
    money?: number;
    items?: Array<{ itemId: string; quantity: number }>;
    titles?: string[];
    unlocks?: string[];
  };
  rarity: number;
  hidden: boolean;
}

export interface AchievementProgressData {
  achievementId: string;
  progress: number;
  maxProgress: number;
  milestones: Array<{
    threshold: number;
    reached: boolean;
    reachedAt?: string;
  }>;
  metadata: any;
}

export interface SeasonalEventData {
  id: string;
  name: string;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  startDate: string;
  endDate: string;
  active: boolean;
  participated: boolean;
  progress: number;
  rewards: {
    claimed: boolean;
    items: Array<{ itemId: string; quantity: number }>;
    pokemon?: PokemonSaveData[];
    cosmetics?: string[];
  };
  specialOffers: Array<{
    id: string;
    purchased: boolean;
    discount: number;
  }>;
  leaderboard: {
    rank?: number;
    score: number;
    category: string;
  };
}

export interface SpecialEventData {
  id: string;
  name: string;
  type: 'limited' | 'celebration' | 'collaboration' | 'emergency';
  startDate: string;
  endDate: string;
  active: boolean;
  completed: boolean;
  objectives: Array<{
    id: string;
    description: string;
    progress: number;
    maxProgress: number;
    completed: boolean;
    rewards: any;
  }>;
  storyProgress: number;
  choices: Array<{
    eventId: string;
    choiceId: string;
    consequences: any;
  }>;
}

export interface DailyTaskData {
  date: string; // YYYY-MM-DD
  tasks: Array<{
    id: string;
    type: string;
    description: string;
    progress: number;
    maxProgress: number;
    completed: boolean;
    rewards: {
      money: number;
      experience: number;
      items: Array<{ itemId: string; quantity: number }>;
    };
  }>;
  streakCount: number;
  bonusMultiplier: number;
}

export interface WeeklyTaskData {
  week: string; // YYYY-WXX
  tasks: Array<{
    id: string;
    type: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    progress: number;
    maxProgress: number;
    completed: boolean;
    rewards: {
      money: number;
      experience: number;
      items: Array<{ itemId: string; quantity: number }>;
    };
  }>;
  completedTasks: number;
  bonusRewards: {
    threshold: number;
    claimed: boolean;
    rewards: any;
  }[];
}

export interface MilestoneData {
  id: string;
  title: string;
  description: string;
  category: string;
  requirement: any;
  progress: number;
  reached: boolean;
  reachedAt?: string;
  rewards: {
    money?: number;
    experience?: number;
    items?: Array<{ itemId: string; quantity: number }>;
    unlocks?: string[];
  };
  significance: number;
}

export interface GameStatistics {
  // 基本統計
  totalPlayTime: number; // 分
  sessionCount: number;
  averageSessionTime: number;
  
  // ポケモン統計
  pokemon: {
    totalCaught: number;
    totalReleased: number;
    shinyCount: number;
    speciesDiscovered: number;
    highestLevel: number;
    averageLevel: number;
    evolutionCount: number;
    breedingCount: number;
  };

  // トレーナー統計
  trainers: {
    totalHired: number;
    totalDismissed: number;
    averageLevel: number;
    totalExpeditions: number;
    successRate: number;
    totalSalaryPaid: number;
  };

  // 経済統計
  economy: {
    totalEarned: number;
    totalSpent: number;
    peakMoney: number;
    totalTransactions: number;
    averageTransaction: number;
    profitMargin: number;
  };

  // 施設統計
  facilities: {
    totalBuilt: number;
    totalInvestment: number;
    totalEarnings: number;
    averageROI: number;
    maintenanceCost: number;
  };

  // 派遣統計
  expeditions: {
    totalLaunched: number;
    totalCompleted: number;
    successRate: number;
    averageDuration: number;
    locationsDiscovered: number;
    totalRewards: number;
  };

  // 研究統計
  research: {
    projectsCompleted: number;
    technologiesUnlocked: number;
    discoveriesMade: number;
    totalResearchTime: number;
  };

  // アチーブメント統計
  achievements: {
    totalUnlocked: number;
    totalPoints: number;
    rareAchievements: number;
    completionRate: number;
  };

  // ゲーム進行統計
  progression: {
    currentLevel: number;
    phasesCompleted: number;
    featuresUnlocked: number;
    tutorialsCompleted: number;
    milestonesReached: number;
  };
}

// バージョン管理とマイグレーション
export interface DataVersion {
  major: number;
  minor: number;
  patch: number;
}

export interface MigrationFunction {
  from: DataVersion;
  to: DataVersion;
  migrate: (data: any) => GameSaveData;
  validate: (data: GameSaveData) => boolean;
}

// データ整合性チェック
export interface DataIntegrityCheck {
  checkName: string;
  description: string;
  check: (data: GameSaveData) => boolean;
  fix?: (data: GameSaveData) => GameSaveData;
  critical: boolean;
}

// 現在のゲームデータバージョン
export const CURRENT_GAME_VERSION = "1.0.0";

// データ圧縮とシリアライゼーション設定
export interface SerializationConfig {
  compress: boolean;
  encryption: boolean;
  format: 'json' | 'binary';
  checksumAlgorithm: 'md5' | 'sha256';
}

export const DEFAULT_SERIALIZATION_CONFIG: SerializationConfig = {
  compress: true,
  encryption: false,
  format: 'json',
  checksumAlgorithm: 'sha256'
};