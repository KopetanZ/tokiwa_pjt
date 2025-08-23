import { GameContext } from '../game-state/types';
import { gameProgressionSystem } from './GameProgressionSystem';

export interface IncomeSource {
  id: string;
  name: string;
  baseAmount: number;
  frequency: 'once' | 'daily' | 'weekly' | 'per_action';
  requirements: {
    level?: number;
    facilities?: string[];
    pokemon?: number;
    trainers?: number;
  };
  scalingFactor: number; // レベルごとの増加率
}

export interface ExpenseCategory {
  id: string;
  name: string;
  baseAmount: number;
  frequency: 'once' | 'daily' | 'weekly' | 'per_action';
  priority: 'essential' | 'important' | 'optional';
  scalingFactor: number;
}

export interface EconomyMetrics {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  dailyOperatingCosts: number;
  cashFlow: number;
  sustainabilityDays: number; // 現在の資金で何日運営できるか
  recommendedCashReserve: number;
}

export class EconomySystem {
  private incomeSources: Map<string, IncomeSource>;
  private expenseCategories: Map<string, ExpenseCategory>;

  constructor() {
    this.incomeSources = this.initializeIncomeSources();
    this.expenseCategories = this.initializeExpenseCategories();
  }

  private initializeIncomeSources(): Map<string, IncomeSource> {
    const sources = new Map<string, IncomeSource>();

    // 派遣による収入
    sources.set('expedition_rewards', {
      id: 'expedition_rewards',
      name: '派遣報酬',
      baseAmount: 500,
      frequency: 'per_action',
      requirements: { trainers: 1 },
      scalingFactor: 1.15 // レベルごとに15%増加
    });

    // 訓練指導料
    sources.set('training_fees', {
      id: 'training_fees',
      name: '訓練指導料',
      baseAmount: 300,
      frequency: 'per_action',
      requirements: { pokemon: 1, facilities: ['training_ground'] },
      scalingFactor: 1.1
    });

    // ポケモン販売（後期収入）
    sources.set('pokemon_sales', {
      id: 'pokemon_sales',
      name: 'ポケモン販売',
      baseAmount: 2000,
      frequency: 'per_action',
      requirements: { level: 10, pokemon: 5 },
      scalingFactor: 1.2
    });

    // 繁殖サービス
    sources.set('breeding_services', {
      id: 'breeding_services',
      name: '繁殖サービス',
      baseAmount: 1500,
      frequency: 'per_action',
      requirements: { level: 15, facilities: ['breeding_center'] },
      scalingFactor: 1.25
    });

    // 研究協力費
    sources.set('research_grants', {
      id: 'research_grants',
      name: '研究協力費',
      baseAmount: 5000,
      frequency: 'weekly',
      requirements: { level: 20, facilities: ['research_lab'] },
      scalingFactor: 1.3
    });

    return sources;
  }

  private initializeExpenseCategories(): Map<string, ExpenseCategory> {
    const expenses = new Map<string, ExpenseCategory>();

    // 施設維持費
    expenses.set('facility_maintenance', {
      id: 'facility_maintenance',
      name: '施設維持費',
      baseAmount: 200,
      frequency: 'daily',
      priority: 'essential',
      scalingFactor: 1.2 // 施設レベルアップで増加
    });

    // ポケモンの餌代
    expenses.set('pokemon_food', {
      id: 'pokemon_food',
      name: 'ポケモンの餌代',
      baseAmount: 50,
      frequency: 'daily',
      priority: 'essential',
      scalingFactor: 1.0 // ポケモン1匹あたり固定
    });

    // トレーナー給与
    expenses.set('trainer_salaries', {
      id: 'trainer_salaries',
      name: 'トレーナー給与',
      baseAmount: 1000,
      frequency: 'weekly',
      priority: 'essential',
      scalingFactor: 1.1 // トレーナーレベルで増加
    });

    // 道具・消耗品
    expenses.set('supplies', {
      id: 'supplies',
      name: '道具・消耗品',
      baseAmount: 300,
      frequency: 'weekly',
      priority: 'important',
      scalingFactor: 1.05
    });

    // 設備投資
    expenses.set('equipment_upgrades', {
      id: 'equipment_upgrades',
      name: '設備投資',
      baseAmount: 2000,
      frequency: 'once',
      priority: 'optional',
      scalingFactor: 1.5 // アップグレードごとに大幅増加
    });

    return expenses;
  }

  calculateCurrentIncome(gameContext: GameContext): { total: number; breakdown: Array<{ source: string; amount: number }> } {
    const { gameState } = gameContext;
    const playerLevel = gameState.player?.level || 1;
    const pokemonCount = gameState.pokemon?.length || 0;
    const trainerCount = gameState.trainers?.length || 0;
    const facilities = gameState.facilities?.map(f => f.type) || [];

    let totalIncome = 0;
    const breakdown: Array<{ source: string; amount: number }> = [];

    this.incomeSources.forEach((source, id) => {
      // 要件チェック
      const meetsRequirements = 
        (source.requirements.level === undefined || playerLevel >= source.requirements.level) &&
        (source.requirements.pokemon === undefined || pokemonCount >= source.requirements.pokemon) &&
        (source.requirements.trainers === undefined || trainerCount >= source.requirements.trainers) &&
        (source.requirements.facilities === undefined || 
         source.requirements.facilities.every(reqFacility => facilities.includes(reqFacility as any)));

      if (meetsRequirements) {
        // レベルによるスケーリング
        const scaledAmount = source.baseAmount * Math.pow(source.scalingFactor, playerLevel - 1);
        
        // 頻度による調整（日割り換算）
        let dailyAmount = scaledAmount;
        if (source.frequency === 'weekly') {
          dailyAmount = scaledAmount / 7;
        } else if (source.frequency === 'per_action') {
          // アクション頻度を推定（1日あたりのアクション数）
          dailyAmount = scaledAmount * this.estimateDailyActions(id, gameContext);
        }

        totalIncome += dailyAmount;
        breakdown.push({ source: source.name, amount: dailyAmount });
      }
    });

    return { total: totalIncome, breakdown };
  }

  calculateCurrentExpenses(gameContext: GameContext): { total: number; breakdown: Array<{ category: string; amount: number; priority: string }> } {
    const { gameState } = gameContext;
    const pokemonCount = gameState.pokemon?.length || 0;
    const trainerCount = gameState.trainers?.length || 0;
    const facilities = gameState.facilities || [];

    let totalExpenses = 0;
    const breakdown: Array<{ category: string; amount: number; priority: string }> = [];

    this.expenseCategories.forEach((expense, id) => {
      let dailyAmount = 0;

      switch (id) {
        case 'facility_maintenance':
          // 施設ごとの維持費
          dailyAmount = facilities.reduce((sum, facility) => {
            const facilityMaintenanceCost = expense.baseAmount * Math.pow(expense.scalingFactor, facility.level - 1);
            return sum + facilityMaintenanceCost;
          }, 0);
          break;

        case 'pokemon_food':
          // ポケモン1匹あたりの餌代
          dailyAmount = pokemonCount * expense.baseAmount;
          break;

        case 'trainer_salaries':
          // トレーナーの週給を日割り
          const weeklyTrainerCosts = gameState.trainers?.reduce((sum, trainer) => {
            const trainerSalary = expense.baseAmount * Math.pow(expense.scalingFactor, trainer.level - 1);
            return sum + trainerSalary;
          }, 0) || 0;
          dailyAmount = weeklyTrainerCosts / 7;
          break;

        case 'supplies':
          // 基本消耗品費（週単位を日割り）
          dailyAmount = expense.baseAmount / 7;
          break;

        case 'equipment_upgrades':
          // 設備投資は不定期なので日次計算には含めない
          dailyAmount = 0;
          break;

        default:
          if (expense.frequency === 'daily') {
            dailyAmount = expense.baseAmount;
          } else if (expense.frequency === 'weekly') {
            dailyAmount = expense.baseAmount / 7;
          }
      }

      if (dailyAmount > 0) {
        totalExpenses += dailyAmount;
        breakdown.push({ 
          category: expense.name, 
          amount: dailyAmount, 
          priority: expense.priority 
        });
      }
    });

    return { total: totalExpenses, breakdown };
  }

  private estimateDailyActions(sourceId: string, gameContext: GameContext): number {
    const { gameState } = gameContext;
    const trainerCount = gameState.trainers?.length || 0;
    const pokemonCount = gameState.pokemon?.length || 0;

    switch (sourceId) {
      case 'expedition_rewards':
        // トレーナー1人あたり1日1~2回の派遣
        return trainerCount * 1.5;
        
      case 'training_fees':
        // ポケモン1匹あたり1日0.5回の訓練
        return pokemonCount * 0.5;
        
      case 'pokemon_sales':
        // 高レベルポケモンの販売は週1回程度
        return 1/7;
        
      case 'breeding_services':
        // 繁殖サービスは週2回程度
        return 2/7;
        
      default:
        return 1;
    }
  }

  generateEconomyMetrics(gameContext: GameContext): EconomyMetrics {
    const { gameState } = gameContext;
    const currentMoney = gameState.player?.money || 0;
    
    const incomeData = this.calculateCurrentIncome(gameContext);
    const expenseData = this.calculateCurrentExpenses(gameContext);
    
    const netIncome = incomeData.total - expenseData.total;
    const sustainabilityDays = expenseData.total > 0 ? Math.floor(currentMoney / expenseData.total) : 999;
    const recommendedCashReserve = expenseData.total * 14; // 2週間分の運営費

    return {
      totalIncome: incomeData.total,
      totalExpenses: expenseData.total,
      netIncome: netIncome,
      dailyOperatingCosts: expenseData.total,
      cashFlow: netIncome,
      sustainabilityDays: sustainabilityDays,
      recommendedCashReserve: recommendedCashReserve
    };
  }

  generateFinancialRecommendations(gameContext: GameContext): string[] {
    const metrics = this.generateEconomyMetrics(gameContext);
    const recommendations: string[] = [];
    const { gameState } = gameContext;
    const currentMoney = gameState.player?.money || 0;

    // キャッシュフロー分析
    if (metrics.netIncome < 0) {
      recommendations.push('⚠️ 収支が赤字です。支出を見直すか収入源を増やしましょう');
      if (gameState.trainers?.length === 0) {
        recommendations.push('トレーナーを雇用して派遣収入を得ましょう');
      }
    } else if (metrics.netIncome < 100) {
      recommendations.push('収支がギリギリです。収入の多様化を検討しましょう');
    }

    // 資金繰り分析
    if (metrics.sustainabilityDays < 7) {
      recommendations.push('🚨 緊急：資金が1週間以内に尽きる可能性があります');
      recommendations.push('すぐに収入を得られる派遣や訓練を実行しましょう');
    } else if (metrics.sustainabilityDays < 14) {
      recommendations.push('⚠️ 資金に注意が必要です。安定した収入源の確保を優先しましょう');
    }

    // 成長投資分析
    if (currentMoney > metrics.recommendedCashReserve && metrics.netIncome > 0) {
      recommendations.push('💰 安定した経営状況です。施設アップグレードを検討しましょう');
      recommendations.push('トレーナーの追加雇用で収入拡大が可能です');
    }

    // 効率化提案
    if (gameState.facilities?.length === 1 && currentMoney > 5000) {
      recommendations.push('ポケモンセンターの建設で効率化を図りましょう');
    }

    if (gameState.pokemon && gameState.pokemon.length > 5 && !gameState.facilities?.some(f => f.type === 'research_lab')) {
      recommendations.push('研究所で追加収入源を開拓しましょう');
    }

    return recommendations;
  }

  // 価格設定の妥当性チェック
  validatePricing(action: string, price: number, gameContext: GameContext): boolean {
    const balance = gameProgressionSystem.getBalance();
    const playerLevel = gameContext.gameState.player?.level || 1;

    switch (action) {
      case 'basic_training':
        const recommendedTrainingCost = balance.trainingCosts.basic * Math.pow(1.1, playerLevel - 1);
        return price <= recommendedTrainingCost * 1.5; // 50%まで高くても許容
        
      case 'trainer_hiring':
        const baseCost = balance.trainerHiringCosts.novice;
        return price <= baseCost * 2; // 2倍まで許容
        
      default:
        return true;
    }
  }

  // 動的価格調整（需要と供給に基づく）
  calculateDynamicPrice(basePrice: number, demandLevel: 'low' | 'medium' | 'high', supplyLevel: 'low' | 'medium' | 'high'): number {
    let multiplier = 1.0;
    
    // 需要による調整
    switch (demandLevel) {
      case 'high': multiplier *= 1.2; break;
      case 'medium': multiplier *= 1.0; break;
      case 'low': multiplier *= 0.8; break;
    }
    
    // 供給による調整
    switch (supplyLevel) {
      case 'high': multiplier *= 0.9; break;
      case 'medium': multiplier *= 1.0; break;
      case 'low': multiplier *= 1.1; break;
    }
    
    return Math.floor(basePrice * multiplier);
  }
}

export const economySystem = new EconomySystem();