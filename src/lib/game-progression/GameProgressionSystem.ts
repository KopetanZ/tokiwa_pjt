import { GameContext } from '../game-state/types';

export interface GamePhase {
  id: string;
  name: string;
  description: string;
  requirements: {
    level?: number;
    pokemonCount?: number;
    trainerCount?: number;
    money?: number;
    completedTasks?: string[];
  };
  unlocks: {
    features?: string[];
    locations?: string[];
    facilities?: string[];
    items?: string[];
  };
  objectives: {
    primary: string[];
    secondary: string[];
  };
  rewards: {
    money?: number;
    experience?: number;
    items?: Array<{ itemId: string; quantity: number }>;
  };
}

export interface EarlyGameBalance {
  initialMoney: number;
  trainingCosts: {
    basic: number;
    advanced: number;
  };
  expeditionRewards: {
    easy: { min: number; max: number };
    medium: { min: number; max: number };
    hard: { min: number; max: number };
  };
  pokemonCatchRates: {
    common: number;
    uncommon: number;
    rare: number;
  };
  trainerHiringCosts: {
    novice: number;
    experienced: number;
    expert: number;
  };
}

export class GameProgressionSystem {
  private gamePhases: Map<string, GamePhase>;
  private balance: EarlyGameBalance;

  constructor() {
    this.gamePhases = this.initializeGamePhases();
    this.balance = this.initializeBalance();
  }

  private initializeGamePhases(): Map<string, GamePhase> {
    const phases = new Map<string, GamePhase>();

    // Phase 1: チュートリアル完了
    phases.set('tutorial', {
      id: 'tutorial',
      name: 'はじまりの一歩',
      description: 'ポケモントレーナーとしての第一歩を踏み出そう',
      requirements: {},
      unlocks: {
        features: ['pokemon_management', 'basic_training'],
        locations: ['starter_area'],
        facilities: ['basic_training_ground']
      },
      objectives: {
        primary: [
          'スターターポケモンを受け取る',
          '基本トレーニングを1回完了する'
        ],
        secondary: [
          'ポケモンのステータスを確認する',
          'なつき度を上げる'
        ]
      },
      rewards: {
        money: 1000,
        experience: 100
      }
    });

    // Phase 2: 初級トレーナー
    phases.set('beginner_trainer', {
      id: 'beginner_trainer',
      name: '初級トレーナー',
      description: '基本的なポケモン育成を覚えよう',
      requirements: {
        level: 2,
        pokemonCount: 1
      },
      unlocks: {
        features: ['pokemon_catching', 'simple_expeditions'],
        locations: ['nearby_route', 'pokemon_center'],
        items: ['pokeball', 'potion']
      },
      objectives: {
        primary: [
          'ポケモンを1匹捕獲する',
          '簡単な派遣を1回完了する',
          'ポケモンをレベル10まで育てる'
        ],
        secondary: [
          'トレーニング場をレベル2にアップグレードする',
          'お金を10000円貯める'
        ]
      },
      rewards: {
        money: 2000,
        experience: 300,
        items: [
          { itemId: 'pokeball', quantity: 5 },
          { itemId: 'potion', quantity: 3 }
        ]
      }
    });

    // Phase 3: 中級トレーナー
    phases.set('intermediate_trainer', {
      id: 'intermediate_trainer',
      name: '中級トレーナー',
      description: 'トレーナーを雇用してチームを拡大しよう',
      requirements: {
        level: 5,
        pokemonCount: 3,
        money: 5000
      },
      unlocks: {
        features: ['trainer_hiring', 'advanced_training', 'pokemon_evolution'],
        locations: ['forest_depths', 'mountain_path'],
        facilities: ['pokemon_center', 'research_lab']
      },
      objectives: {
        primary: [
          '初回トレーナーを雇用する',
          'ポケモンを1匹進化させる',
          '中級派遣を3回完了する'
        ],
        secondary: [
          'ポケモンを5匹まで増やす',
          '色違いポケモンを捕獲する'
        ]
      },
      rewards: {
        money: 5000,
        experience: 500,
        items: [
          { itemId: 'super_ball', quantity: 3 },
          { itemId: 'evolution_stone', quantity: 1 }
        ]
      }
    });

    // Phase 4: 上級トレーナー
    phases.set('advanced_trainer', {
      id: 'advanced_trainer',
      name: '上級トレーナー',
      description: '本格的なポケモン学校の運営を始めよう',
      requirements: {
        level: 10,
        pokemonCount: 8,
        trainerCount: 2,
        money: 20000
      },
      unlocks: {
        features: ['pokemon_breeding', 'facility_management', 'competitive_battles'],
        locations: ['elite_areas', 'legendary_sites'],
        facilities: ['breeding_center', 'battle_facility']
      },
      objectives: {
        primary: [
          'ポケモンの卵を孵化させる',
          '施設を3つ以上運営する',
          '月収50000円を達成する'
        ],
        secondary: [
          'レジェンダリーポケモンとの遭遇',
          '完璧なIVのポケモンを育成する'
        ]
      },
      rewards: {
        money: 10000,
        experience: 1000,
        items: [
          { itemId: 'ultra_ball', quantity: 5 },
          { itemId: 'master_ball', quantity: 1 }
        ]
      }
    });

    return phases;
  }

  private initializeBalance(): EarlyGameBalance {
    return {
      initialMoney: 5000, // スターターとして適度な金額
      trainingCosts: {
        basic: 200, // 基本訓練は安価
        advanced: 800 // 上級訓練は高価
      },
      expeditionRewards: {
        easy: { min: 300, max: 800 }, // 序盤に適した報酬
        medium: { min: 800, max: 1500 },
        hard: { min: 1500, max: 3000 }
      },
      pokemonCatchRates: {
        common: 0.8, // 80%の捕獲率
        uncommon: 0.6, // 60%の捕獲率  
        rare: 0.3 // 30%の捕獲率
      },
      trainerHiringCosts: {
        novice: 3000, // 初心者トレーナー
        experienced: 8000, // 経験者トレーナー
        expert: 20000 // エキスパートトレーナー
      }
    };
  }

  getCurrentPhase(gameContext: GameContext): GamePhase | null {
    const { gameState } = gameContext;
    
    // 現在の進行状況を評価
    const playerLevel = gameState.player?.level || 1;
    const pokemonCount = gameState.pokemon?.length || 0;
    const trainerCount = gameState.trainers?.length || 0;
    const money = gameState.player?.money || 0;

    // 逆順で確認して、満たしている最高レベルのフェーズを返す
    const phaseOrder = ['advanced_trainer', 'intermediate_trainer', 'beginner_trainer', 'tutorial'];
    
    for (const phaseId of phaseOrder) {
      const phase = this.gamePhases.get(phaseId);
      if (!phase) continue;

      const req = phase.requirements;
      const meetsRequirements = 
        (req.level === undefined || playerLevel >= req.level) &&
        (req.pokemonCount === undefined || pokemonCount >= req.pokemonCount) &&
        (req.trainerCount === undefined || trainerCount >= req.trainerCount) &&
        (req.money === undefined || money >= req.money);

      if (meetsRequirements) {
        return phase;
      }
    }

    // デフォルトでチュートリアルフェーズ
    return this.gamePhases.get('tutorial') || null;
  }

  getNextPhase(currentPhase: GamePhase): GamePhase | null {
    const phaseProgression: Record<string, string> = {
      'tutorial': 'beginner_trainer',
      'beginner_trainer': 'intermediate_trainer', 
      'intermediate_trainer': 'advanced_trainer',
      'advanced_trainer': 'master_trainer' // 未実装
    };

    const nextPhaseId = phaseProgression[currentPhase.id];
    return nextPhaseId ? this.gamePhases.get(nextPhaseId) || null : null;
  }

  calculateExpeditionReward(difficulty: 'easy' | 'medium' | 'hard', playerLevel: number): number {
    const baseReward = this.balance.expeditionRewards[difficulty];
    const randomReward = Math.floor(Math.random() * (baseReward.max - baseReward.min)) + baseReward.min;
    
    // プレイヤーレベルによるボーナス（最大50%まで）
    const levelBonus = Math.min(playerLevel * 0.05, 0.5);
    
    return Math.floor(randomReward * (1 + levelBonus));
  }

  calculateTrainingCost(type: 'basic' | 'advanced', facilityLevel: number = 1): number {
    const baseCost = this.balance.trainingCosts[type];
    // 施設レベルが高いほどコストは上がるが効果も向上
    return Math.floor(baseCost * Math.pow(1.2, facilityLevel - 1));
  }

  calculatePokemonCatchSuccess(rarity: keyof EarlyGameBalance['pokemonCatchRates'], playerLevel: number): boolean {
    const baseRate = this.balance.pokemonCatchRates[rarity];
    // プレイヤーレベルによる成功率向上（最大20%まで）
    const levelBonus = Math.min(playerLevel * 0.02, 0.2);
    const finalRate = Math.min(baseRate + levelBonus, 0.95); // 最大95%
    
    return Math.random() < finalRate;
  }

  calculateTrainerHiringCost(experience: 'novice' | 'experienced' | 'expert'): number {
    return this.balance.trainerHiringCosts[experience];
  }

  // 序盤バランスの調整メソッド
  adjustEarlyGameBalance(adjustments: Partial<EarlyGameBalance>): void {
    this.balance = { ...this.balance, ...adjustments };
  }

  // 進行状況の分析
  analyzeProgression(gameContext: GameContext): {
    currentPhase: GamePhase | null;
    nextPhase: GamePhase | null;
    completionPercentage: number;
    recommendations: string[];
    blockers: string[];
  } {
    const currentPhase = this.getCurrentPhase(gameContext);
    const nextPhase = currentPhase ? this.getNextPhase(currentPhase) : null;
    
    const { gameState } = gameContext;
    const playerLevel = gameState.player?.level || 1;
    const pokemonCount = gameState.pokemon?.length || 0;
    const trainerCount = gameState.trainers?.length || 0;
    const money = gameState.player?.money || 0;

    let completionPercentage = 0;
    const recommendations: string[] = [];
    const blockers: string[] = [];

    if (nextPhase) {
      const req = nextPhase.requirements;
      let metRequirements = 0;
      let totalRequirements = 0;

      // レベル要件の確認
      if (req.level !== undefined) {
        totalRequirements++;
        if (playerLevel >= req.level) {
          metRequirements++;
        } else {
          blockers.push(`プレイヤーレベルを${req.level}まで上げる必要があります（現在：${playerLevel}）`);
          recommendations.push('ポケモンの訓練や派遣でプレイヤー経験値を獲得しましょう');
        }
      }

      // ポケモン数要件の確認
      if (req.pokemonCount !== undefined) {
        totalRequirements++;
        if (pokemonCount >= req.pokemonCount) {
          metRequirements++;
        } else {
          blockers.push(`ポケモンを${req.pokemonCount}匹まで増やす必要があります（現在：${pokemonCount}匹）`);
          recommendations.push('野生のポケモンを捕獲するか、派遣でポケモンを探しましょう');
        }
      }

      // トレーナー数要件の確認
      if (req.trainerCount !== undefined) {
        totalRequirements++;
        if (trainerCount >= req.trainerCount) {
          metRequirements++;
        } else {
          blockers.push(`トレーナーを${req.trainerCount}人まで雇用する必要があります（現在：${trainerCount}人）`);
          recommendations.push('トレーナー募集所でトレーナーを雇用しましょう');
        }
      }

      // 所持金要件の確認
      if (req.money !== undefined) {
        totalRequirements++;
        if (money >= req.money) {
          metRequirements++;
        } else {
          blockers.push(`${req.money}円まで貯める必要があります（現在：${money}円）`);
          recommendations.push('派遣や訓練指導で収入を増やしましょう');
        }
      }

      completionPercentage = totalRequirements > 0 ? (metRequirements / totalRequirements) * 100 : 100;
    }

    return {
      currentPhase,
      nextPhase,
      completionPercentage: Math.floor(completionPercentage),
      recommendations,
      blockers
    };
  }

  // 初心者向けの推奨アクション
  getBeginnerRecommendations(gameContext: GameContext): string[] {
    const { gameState } = gameContext;
    const pokemonCount = gameState.pokemon?.length || 0;
    const money = gameState.player?.money || 0;
    const recommendations: string[] = [];

    if (pokemonCount === 0) {
      recommendations.push('まずはスターターポケモンを受け取りましょう');
    } else if (pokemonCount === 1) {
      recommendations.push('野生のポケモンを捕獲してチームを拡大しましょう');
      recommendations.push('スターターポケモンの訓練を始めましょう');
    }

    if (money < 1000) {
      recommendations.push('簡単な派遣でお金を稼ぎましょう');
    } else if (money > 5000) {
      recommendations.push('トレーニング場のアップグレードを検討しましょう');
    }

    if (pokemonCount > 0) {
      const avgLevel = gameState.pokemon?.reduce((sum, p) => sum + p.level, 0) || 0 / pokemonCount;
      if (avgLevel < 10) {
        recommendations.push('ポケモンの基本訓練を続けましょう');
      }
    }

    return recommendations;
  }

  getBalance(): EarlyGameBalance {
    return { ...this.balance };
  }

  getAllPhases(): GamePhase[] {
    return Array.from(this.gamePhases.values());
  }
}

export const gameProgressionSystem = new GameProgressionSystem();