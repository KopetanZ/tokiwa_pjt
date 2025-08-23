import { 
  GameSaveData, 
  CURRENT_GAME_VERSION, 
  SerializationConfig, 
  DEFAULT_SERIALIZATION_CONFIG,
  DataIntegrityCheck,
  MigrationFunction,
  DataVersion
} from './GameDataSchema';
import { GameContext } from '../game-state/types';
import { safeLocalStorage } from '../storage';

export interface SaveMetadata {
  id: string;
  name: string;
  version: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  playTime: number;
  playerLevel: number;
  playerName: string;
  schoolName: string;
  checksum: string;
  isCorrupted: boolean;
  isBackup: boolean;
}

export interface SaveSlot {
  slot: number;
  metadata: SaveMetadata | null;
  data: GameSaveData | null;
  isEmpty: boolean;
}

export class GameDataManager {
  private config: SerializationConfig;
  private integrityChecks: DataIntegrityCheck[];
  private migrations: MigrationFunction[];
  private maxSaveSlots: number = 3;
  private maxBackups: number = 5;

  constructor(config?: Partial<SerializationConfig>) {
    this.config = { ...DEFAULT_SERIALIZATION_CONFIG, ...config };
    this.integrityChecks = this.initializeIntegrityChecks();
    this.migrations = this.initializeMigrations();
  }

  private initializeIntegrityChecks(): DataIntegrityCheck[] {
    return [
      {
        checkName: 'player_data_integrity',
        description: 'プレイヤーデータの整合性をチェック',
        check: (data: GameSaveData) => {
          return !!(
            data.player?.id &&
            data.player?.name &&
            data.player?.level >= 1 &&
            data.player?.money >= 0
          );
        },
        fix: (data: GameSaveData) => {
          if (!data.player?.id) data.player.id = `player_${Date.now()}`;
          if (!data.player?.name) data.player.name = 'Unknown Player';
          if (data.player?.level < 1) data.player.level = 1;
          if (data.player?.money < 0) data.player.money = 0;
          return data;
        },
        critical: true
      },
      {
        checkName: 'pokemon_data_consistency',
        description: 'ポケモンデータの一貫性をチェック',
        check: (data: GameSaveData) => {
          return data.pokemon?.owned?.every(p => 
            p.id && p.speciesId && p.level >= 1 && p.level <= 100
          ) ?? true;
        },
        fix: (data: GameSaveData) => {
          if (data.pokemon?.owned) {
            data.pokemon.owned = data.pokemon.owned.filter(p => 
              p.id && p.speciesId && p.level >= 1 && p.level <= 100
            );
          }
          return data;
        },
        critical: false
      },
      {
        checkName: 'facility_status_check',
        description: '施設の状態をチェック',
        check: (data: GameSaveData) => {
          return data.facilities?.built?.every(f => 
            f.id && f.type && f.level >= 1 && ['operational', 'maintenance', 'construction', 'offline'].includes(f.status)
          ) ?? true;
        },
        critical: false
      },
      {
        checkName: 'economy_balance_check',
        description: '経済データの妥当性をチェック',
        check: (data: GameSaveData) => {
          const totalIncome = data.economy?.transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 0;
          const totalExpenses = data.economy?.transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0;
          const calculatedMoney = 5000 + totalIncome - totalExpenses; // 初期資金5000円
          return Math.abs(data.player?.money - calculatedMoney) < 1000; // 1000円の誤差は許容
        },
        critical: false
      }
    ];
  }

  private initializeMigrations(): MigrationFunction[] {
    return [
      {
        from: { major: 0, minor: 9, patch: 0 },
        to: { major: 1, minor: 0, patch: 0 },
        migrate: (oldData: any): GameSaveData => {
          // v0.9.0からv1.0.0へのマイグレーション例
          return {
            ...oldData,
            version: '1.0.0',
            // 新しいフィールドのデフォルト値設定
            research: oldData.research || {
              projects: [],
              discoveries: [],
              technologies: [],
              totalResearchPoints: 0
            },
            // 統計データの初期化
            statistics: oldData.statistics || this.createDefaultStatistics()
          };
        },
        validate: (data: GameSaveData) => !!data.research && !!data.statistics
      }
    ];
  }

  // セーブデータの作成
  async createSaveData(gameContext: GameContext): Promise<GameSaveData> {
    const { gameState, user } = gameContext;
    
    const saveData: GameSaveData = {
      version: CURRENT_GAME_VERSION,
      savedAt: new Date().toISOString(),
      playerId: user?.id || 'unknown',
      
      player: {
        id: user?.id || 'unknown',
        name: user?.guestName || 'Unknown Player',
        schoolName: user?.schoolName || 'Unknown School',
        level: gameState.player?.level || 1,
        experience: gameState.player?.experience || 0,
        money: gameState.player?.money || 5000,
        reputation: gameState.player?.reputation || 0,
        achievements: [] as string[], // TODO: implement achievements system
        playTime: 0, // TODO: implement play time tracking
        settings: this.createDefaultPlayerSettings() // TODO: implement player settings system
      },

      pokemon: {
        owned: gameState.pokemon?.map(p => this.convertToPokemonSaveData(p)) || [],
        storage: [],
        released: 0, // TODO: implement Pokemon release system
        shinyCount: 0, // TODO: implement shiny Pokemon system
        totalCaught: gameState.pokemon?.length || 0
      },

      trainers: {
        hired: gameState.trainers?.map(t => this.convertToTrainerSaveData(t)) || [],
        available: [],
        dismissed: 0,
        totalHired: gameState.trainers?.length || 0
      },

      facilities: {
        built: gameState.facilities?.map(f => this.convertToFacilitySaveData(f)) || [],
        blueprints: [], // TODO: implement facility blueprints system
        totalInvestment: 0 // TODO: implement facility cost tracking
      },

      expeditions: {
        active: gameState.expeditions?.filter(e => e.status === 'active').map(e => this.convertToExpeditionSaveData(e)) || [],
        completed: [],
        locations: [],
        totalExpeditions: gameState.expeditions?.length || 0,
        totalRewards: 0
      },

      economy: {
        transactions: gameState.transactions?.map(t => this.convertToTransactionData(t)) || [],
        monthlyReports: [],
        currentMonthStats: this.createDefaultMonthlyStats()
      },

      research: {
        projects: [],
        discoveries: [],
        technologies: [], // TODO: implement technology system
        totalResearchPoints: 0
      },

      achievements: {
        unlocked: [],
        progress: [],
        totalPoints: 0
      },

      events: {
        seasonal: [],
        special: [],
        daily: [],
        weekly: []
      },

      progression: {
        currentPhase: 'tutorial', // TODO: implement game phases
        unlockedFeatures: [], // TODO: implement feature unlocking
        completedTutorials: [], // TODO: implement tutorial tracking
        milestones: []
      },

      statistics: this.calculateStatistics(gameContext)
    };

    return saveData;
  }

  // セーブデータの保存
  async saveGame(slot: number, gameContext: GameContext): Promise<SaveMetadata> {
    if (slot < 1 || slot > this.maxSaveSlots) {
      throw new Error(`Invalid save slot: ${slot}`);
    }

    const saveData = await this.createSaveData(gameContext);
    const serialized = this.serializeData(saveData);
    const checksum = await this.calculateChecksum(serialized);

    const metadata: SaveMetadata = {
      id: `save_${slot}_${Date.now()}`,
      name: `セーブ${slot}`,
      version: CURRENT_GAME_VERSION,
      size: serialized.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      playTime: saveData.player.level * 1000, // 仮の計算
      playerLevel: saveData.player.level,
      playerName: saveData.player.name,
      schoolName: saveData.player.schoolName,
      checksum: checksum,
      isCorrupted: false,
      isBackup: false
    };

    // バックアップ作成
    await this.createBackup(slot);

    // セーブデータとメタデータを保存
    safeLocalStorage.setItem(`tokiwa_save_${slot}`, serialized);
    safeLocalStorage.setItem(`tokiwa_save_meta_${slot}`, JSON.stringify(metadata));

    console.log(`ゲームをスロット${slot}に保存しました:`, metadata.name);
    return metadata;
  }

  // セーブデータの読み込み
  async loadGame(slot: number): Promise<GameSaveData> {
    if (slot < 1 || slot > this.maxSaveSlots) {
      throw new Error(`Invalid save slot: ${slot}`);
    }

    const savedData = safeLocalStorage.getItem(`tokiwa_save_${slot}`);
    const savedMeta = safeLocalStorage.getItem(`tokiwa_save_meta_${slot}`);

    if (!savedData || !savedMeta) {
      throw new Error(`Save slot ${slot} is empty`);
    }

    const metadata: SaveMetadata = JSON.parse(savedMeta);
    
    // チェックサム検証
    const currentChecksum = await this.calculateChecksum(savedData);
    if (currentChecksum !== metadata.checksum) {
      console.error('セーブデータが破損している可能性があります');
      metadata.isCorrupted = true;
      
      // バックアップからの復旧を試行
      const backupData = await this.loadBackup(slot);
      if (backupData) {
        console.log('バックアップからセーブデータを復旧しました');
        return backupData;
      }
      
      throw new Error('Save data is corrupted and no valid backup found');
    }

    // デシリアライズ
    const gameData = this.deserializeData(savedData);
    
    // バージョンチェックとマイグレーション
    const migratedData = this.migrateData(gameData);
    
    // データ整合性チェック
    const integrityResult = this.checkDataIntegrity(migratedData);
    if (!integrityResult.isValid) {
      console.warn('読み込んだデータに整合性の問題があります:', integrityResult.issues);
    }

    console.log(`スロット${slot}からゲームを読み込みました:`, metadata.name);
    return migratedData;
  }

  // セーブスロット一覧取得
  getSaveSlots(): SaveSlot[] {
    const slots: SaveSlot[] = [];
    
    for (let i = 1; i <= this.maxSaveSlots; i++) {
      const savedMeta = safeLocalStorage.getItem(`tokiwa_save_meta_${i}`);
      
      if (savedMeta) {
        try {
          const metadata: SaveMetadata = JSON.parse(savedMeta);
          slots.push({
            slot: i,
            metadata,
            data: null, // データは必要時に読み込み
            isEmpty: false
          });
        } catch (error) {
          console.error(`スロット${i}のメタデータが破損しています:`, error);
          slots.push({
            slot: i,
            metadata: null,
            data: null,
            isEmpty: true
          });
        }
      } else {
        slots.push({
          slot: i,
          metadata: null,
          data: null,
          isEmpty: true
        });
      }
    }
    
    return slots;
  }

  // セーブデータ削除
  async deleteSave(slot: number): Promise<void> {
    if (slot < 1 || slot > this.maxSaveSlots) {
      throw new Error(`Invalid save slot: ${slot}`);
    }

    safeLocalStorage.removeItem(`tokiwa_save_${slot}`);
    safeLocalStorage.removeItem(`tokiwa_save_meta_${slot}`);
    
    // バックアップも削除
    for (let i = 1; i <= this.maxBackups; i++) {
      safeLocalStorage.removeItem(`tokiwa_backup_${slot}_${i}`);
    }

    console.log(`スロット${slot}のセーブデータを削除しました`);
  }

  // バックアップ作成
  private async createBackup(slot: number): Promise<void> {
    const existingData = safeLocalStorage.getItem(`tokiwa_save_${slot}`);
    const existingMeta = safeLocalStorage.getItem(`tokiwa_save_meta_${slot}`);
    
    if (existingData && existingMeta) {
      // 既存のバックアップをシフト
      for (let i = this.maxBackups - 1; i >= 1; i--) {
        const backupData = safeLocalStorage.getItem(`tokiwa_backup_${slot}_${i}`);
        const backupMeta = safeLocalStorage.getItem(`tokiwa_backup_meta_${slot}_${i}`);
        
        if (backupData && backupMeta) {
          safeLocalStorage.setItem(`tokiwa_backup_${slot}_${i + 1}`, backupData);
          safeLocalStorage.setItem(`tokiwa_backup_meta_${slot}_${i + 1}`, backupMeta);
        }
      }
      
      // 最新のバックアップを作成
      const metadata = JSON.parse(existingMeta);
      metadata.isBackup = true;
      metadata.updatedAt = new Date().toISOString();
      
      safeLocalStorage.setItem(`tokiwa_backup_${slot}_1`, existingData);
      safeLocalStorage.setItem(`tokiwa_backup_meta_${slot}_1`, JSON.stringify(metadata));
    }
  }

  // バックアップからの読み込み
  private async loadBackup(slot: number): Promise<GameSaveData | null> {
    for (let i = 1; i <= this.maxBackups; i++) {
      const backupData = safeLocalStorage.getItem(`tokiwa_backup_${slot}_${i}`);
      const backupMeta = safeLocalStorage.getItem(`tokiwa_backup_meta_${slot}_${i}`);
      
      if (backupData && backupMeta) {
        try {
          const metadata: SaveMetadata = JSON.parse(backupMeta);
          const currentChecksum = await this.calculateChecksum(backupData);
          
          if (currentChecksum === metadata.checksum) {
            return this.deserializeData(backupData);
          }
        } catch (error) {
          console.warn(`バックアップ${i}の検証に失敗:`, error);
          continue;
        }
      }
    }
    
    return null;
  }

  // データ整合性チェック
  private checkDataIntegrity(data: GameSaveData): {
    isValid: boolean;
    issues: string[];
    fixes: Array<{ checkName: string; applied: boolean; error?: string }>;
  } {
    const issues: string[] = [];
    const fixes: Array<{ checkName: string; applied: boolean; error?: string }> = [];

    for (const check of this.integrityChecks) {
      try {
        if (!check.check(data)) {
          issues.push(`${check.checkName}: ${check.description}`);
          
          if (check.fix) {
            try {
              data = check.fix(data);
              fixes.push({ checkName: check.checkName, applied: true });
            } catch (fixError) {
              fixes.push({ 
                checkName: check.checkName, 
                applied: false, 
                error: fixError instanceof Error ? fixError.message : String(fixError)
              });
            }
          }
        }
      } catch (error) {
        issues.push(`${check.checkName}: チェック実行エラー - ${error}`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      fixes
    };
  }

  // データマイグレーション
  private migrateData(data: any): GameSaveData {
    const currentVersion = this.parseVersion(data.version || '0.0.0');
    const targetVersion = this.parseVersion(CURRENT_GAME_VERSION);

    if (this.compareVersions(currentVersion, targetVersion) >= 0) {
      return data; // すでに最新バージョン
    }

    let migratedData = { ...data };
    
    for (const migration of this.migrations) {
      if (this.compareVersions(currentVersion, migration.from) >= 0 && 
          this.compareVersions(currentVersion, migration.to) < 0) {
        try {
          migratedData = migration.migrate(migratedData);
          if (!migration.validate(migratedData)) {
            throw new Error('Migration validation failed');
          }
          console.log(`マイグレーション完了: ${migration.from} -> ${migration.to}`);
        } catch (error) {
          console.error(`マイグレーションエラー: ${migration.from} -> ${migration.to}`, error);
          throw error;
        }
      }
    }

    return migratedData;
  }

  // 補助メソッド
  private serializeData(data: GameSaveData): string {
    let result = JSON.stringify(data);
    
    if (this.config.compress) {
      // 簡易的な圧縮（実際の実装ではLZ4やgzipを使用）
      result = this.compress(result);
    }
    
    return result;
  }

  private deserializeData(serialized: string): GameSaveData {
    let data = serialized;
    
    if (this.config.compress) {
      data = this.decompress(data);
    }
    
    return JSON.parse(data);
  }

  private async calculateChecksum(data: string): Promise<string> {
    // Web Crypto APIを使用したSHA-256ハッシュ計算
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private compress(data: string): string {
    // 簡易的な圧縮実装（実際の用途では適切な圧縮ライブラリを使用）
    return btoa(data);
  }

  private decompress(data: string): string {
    return atob(data);
  }

  private parseVersion(version: string): DataVersion {
    const parts = version.split('.').map(Number);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0
    };
  }

  private compareVersions(a: DataVersion, b: DataVersion): number {
    if (a.major !== b.major) return a.major - b.major;
    if (a.minor !== b.minor) return a.minor - b.minor;
    return a.patch - b.patch;
  }

  // デフォルト値作成のヘルパーメソッド
  private createDefaultPlayerSettings(): any {
    return {
      language: 'ja',
      theme: 'gameboy_green',
      soundEnabled: true,
      musicVolume: 80,
      sfxVolume: 80,
      autoSave: true,
      notifications: {
        expeditions: true,
        training: true,
        breeding: true,
        achievements: true
      },
      ui: {
        animationSpeed: 'normal',
        showTutorialHints: true,
        compactMode: false
      }
    };
  }

  private createDefaultStatistics(): any {
    return {
      totalPlayTime: 0,
      sessionCount: 0,
      averageSessionTime: 0,
      pokemon: {
        totalCaught: 0,
        totalReleased: 0,
        shinyCount: 0,
        speciesDiscovered: 0,
        highestLevel: 1,
        averageLevel: 1,
        evolutionCount: 0,
        breedingCount: 0
      },
      trainers: {
        totalHired: 0,
        totalDismissed: 0,
        averageLevel: 1,
        totalExpeditions: 0,
        successRate: 0,
        totalSalaryPaid: 0
      },
      economy: {
        totalEarned: 0,
        totalSpent: 0,
        peakMoney: 5000,
        totalTransactions: 0,
        averageTransaction: 0,
        profitMargin: 0
      },
      facilities: {
        totalBuilt: 0,
        totalInvestment: 0,
        totalEarnings: 0,
        averageROI: 0,
        maintenanceCost: 0
      },
      expeditions: {
        totalLaunched: 0,
        totalCompleted: 0,
        successRate: 0,
        averageDuration: 0,
        locationsDiscovered: 0,
        totalRewards: 0
      },
      research: {
        projectsCompleted: 0,
        technologiesUnlocked: 0,
        discoveriesMade: 0,
        totalResearchTime: 0
      },
      achievements: {
        totalUnlocked: 0,
        totalPoints: 0,
        rareAchievements: 0,
        completionRate: 0
      },
      progression: {
        currentLevel: 1,
        phasesCompleted: 0,
        featuresUnlocked: 0,
        tutorialsCompleted: 0,
        milestonesReached: 0
      }
    };
  }

  private createDefaultMonthlyStats(): any {
    return {
      pokemonCaught: 0,
      trainersHired: 0,
      expeditionsCompleted: 0,
      facilitiesBuilt: 0,
      totalTraining: 0,
      researchCompleted: 0,
      achievementsUnlocked: 0
    };
  }

  private calculateStatistics(gameContext: GameContext): any {
    const { gameState } = gameContext;
    // 実際の統計計算ロジックを実装
    return this.createDefaultStatistics();
  }

  // データ変換メソッド
  private convertToPokemonSaveData(pokemon: any): any {
    return {
      id: pokemon.id,
      speciesId: pokemon.speciesId || pokemon.dex_number?.toString(),
      name: pokemon.nickname || pokemon.name,
      level: pokemon.level,
      experience: pokemon.experience || 0,
      stats: pokemon.stats || pokemon,
      ivs: pokemon.ivs || { hp: 15, attack: 15, defense: 15, specialAttack: 15, specialDefense: 15, speed: 15 },
      evs: pokemon.evs || { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 },
      nature: pokemon.nature || 'Hardy',
      ability: pokemon.ability || 'Unknown',
      moves: pokemon.moves || [],
      types: pokemon.types || ['Normal'],
      happiness: pokemon.happiness || pokemon.friendship || 50,
      isShiny: pokemon.isShiny || pokemon.is_shiny || false,
      rarity: pokemon.rarity || 'common',
      status: pokemon.status || 'active',
      metadata: {
        createdAt: pokemon.caught_at || new Date().toISOString(),
        updatedAt: pokemon.updated_at || new Date().toISOString(),
        version: CURRENT_GAME_VERSION
      }
    };
  }

  private convertToTrainerSaveData(trainer: any): any {
    return {
      id: trainer.id,
      name: trainer.name,
      specialization: Array.isArray(trainer.specialty) ? trainer.specialty : [trainer.specialty],
      level: trainer.level,
      experience: trainer.experience,
      skills: trainer.skills,
      status: trainer.status || 'available',
      salary: trainer.salary || 1000,
      metadata: {
        createdAt: trainer.hired_at || new Date().toISOString(),
        updatedAt: trainer.updated_at || new Date().toISOString()
      }
    };
  }

  private convertToFacilitySaveData(facility: any): any {
    return {
      id: facility.id,
      type: facility.facility_type || facility.type,
      name: facility.name,
      level: facility.level,
      capacity: facility.capacity,
      efficiency: facility.efficiency,
      status: facility.status || 'operational',
      metadata: {
        builtAt: facility.created_at || new Date().toISOString(),
        totalInvestment: facility.cost || 0,
        version: CURRENT_GAME_VERSION
      }
    };
  }

  private convertToExpeditionSaveData(expedition: any): any {
    return {
      id: expedition.id,
      leaderId: expedition.trainer_id,
      location: expedition.location,
      missionType: expedition.mission_type,
      difficulty: expedition.difficulty,
      status: expedition.status,
      startTime: expedition.started_at,
      endTime: expedition.estimated_completion,
      progress: expedition.progress,
      metadata: {
        createdAt: expedition.created_at || new Date().toISOString(),
        version: CURRENT_GAME_VERSION
      }
    };
  }

  private convertToTransactionData(transaction: any): any {
    return {
      id: transaction.id,
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount,
      description: transaction.description,
      date: transaction.created_at,
      metadata: {
        source: 'game',
        automated: true
      }
    };
  }
}

// クライアントサイドでのみGameDataManagerインスタンスを作成
let gameDataManager: GameDataManager | null = null;

export function getGameDataManager(): GameDataManager {
  if (typeof window === 'undefined') {
    // サーバーサイドではnullを返す
    return null as any;
  }
  
  if (!gameDataManager) {
    gameDataManager = new GameDataManager();
  }
  
  return gameDataManager;
}