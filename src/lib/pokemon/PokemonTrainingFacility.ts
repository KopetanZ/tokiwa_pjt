import { PokemonInstance } from '../schemas/pokemon';
import { GameContext } from '../game-state/types';
import { pokemonGrowthSystem, TrainingSession } from './PokemonGrowthSystem';

export interface TrainingFacility {
  id: string;
  name: string;
  description: string;
  level: number;
  capacity: number;
  specialization: 'strength' | 'endurance' | 'speed' | 'technique' | 'intelligence' | 'balanced';
  bonusMultiplier: number;
  unlockRequirements: {
    playerLevel?: number;
    facilitiesBuilt?: string[];
    itemsRequired?: Array<{ itemId: string; quantity: number }>;
  };
  upgradeCost: number;
  maintenanceCost: number;
}

export interface TrainingSlot {
  id: string;
  pokemonId: string;
  facilityId: string;
  programId: string;
  startTime: number;
  endTime: number;
  progress: number; // 0-100
  status: 'active' | 'completed' | 'paused' | 'cancelled';
}

export interface FacilityUpgrade {
  level: number;
  cost: number;
  benefits: {
    capacityIncrease?: number;
    bonusMultiplier?: number;
    newPrograms?: string[];
    speedBonus?: number;
  };
  requirements: {
    playerLevel?: number;
    itemsRequired?: Array<{ itemId: string; quantity: number }>;
  };
}

export class PokemonTrainingFacility {
  private facilities: Map<string, TrainingFacility>;
  private activeTrainingSessions: Map<string, TrainingSlot>;
  private facilityUpgrades: Map<string, FacilityUpgrade[]>;

  constructor() {
    this.facilities = this.initializeFacilities();
    this.activeTrainingSessions = new Map();
    this.facilityUpgrades = this.initializeFacilityUpgrades();
  }

  private initializeFacilities(): Map<string, TrainingFacility> {
    const facilities = new Map<string, TrainingFacility>();

    facilities.set('basic_gym', {
      id: 'basic_gym',
      name: '基本トレーニングジム',
      description: '基本的な体力強化トレーニングが行える施設',
      level: 1,
      capacity: 2,
      specialization: 'strength',
      bonusMultiplier: 1.0,
      unlockRequirements: {},
      upgradeCost: 1000,
      maintenanceCost: 50
    });

    facilities.set('speed_course', {
      id: 'speed_course',
      name: 'スピードコース',
      description: '素早さを重点的に鍛える専用コース',
      level: 1,
      capacity: 3,
      specialization: 'speed',
      bonusMultiplier: 1.2,
      unlockRequirements: {
        playerLevel: 5,
        facilitiesBuilt: ['basic_gym']
      },
      upgradeCost: 1500,
      maintenanceCost: 75
    });

    facilities.set('endurance_pool', {
      id: 'endurance_pool',
      name: '持久力プール',
      description: '水中での持久力トレーニング施設',
      level: 1,
      capacity: 4,
      specialization: 'endurance',
      bonusMultiplier: 1.1,
      unlockRequirements: {
        playerLevel: 8,
        itemsRequired: [{ itemId: 'water_stone', quantity: 2 }]
      },
      upgradeCost: 2000,
      maintenanceCost: 100
    });

    facilities.set('technique_dojo', {
      id: 'technique_dojo',
      name: '技能道場',
      description: '特殊攻撃と防御の技術を磨く道場',
      level: 1,
      capacity: 2,
      specialization: 'technique',
      bonusMultiplier: 1.3,
      unlockRequirements: {
        playerLevel: 12,
        facilitiesBuilt: ['basic_gym', 'speed_course']
      },
      upgradeCost: 3000,
      maintenanceCost: 150
    });

    facilities.set('elite_center', {
      id: 'elite_center',
      name: 'エリートトレーニングセンター',
      description: '最高レベルの総合トレーニング施設',
      level: 1,
      capacity: 6,
      specialization: 'balanced',
      bonusMultiplier: 1.5,
      unlockRequirements: {
        playerLevel: 20,
        facilitiesBuilt: ['basic_gym', 'speed_course', 'endurance_pool', 'technique_dojo'],
        itemsRequired: [
          { itemId: 'rare_metal', quantity: 5 },
          { itemId: 'energy_core', quantity: 3 }
        ]
      },
      upgradeCost: 10000,
      maintenanceCost: 500
    });

    return facilities;
  }

  private initializeFacilityUpgrades(): Map<string, FacilityUpgrade[]> {
    const upgrades = new Map<string, FacilityUpgrade[]>();

    // Basic Gym upgrades
    upgrades.set('basic_gym', [
      {
        level: 2,
        cost: 1000,
        benefits: { capacityIncrease: 1, bonusMultiplier: 0.1 },
        requirements: { playerLevel: 5 }
      },
      {
        level: 3,
        cost: 2500,
        benefits: { capacityIncrease: 2, bonusMultiplier: 0.2, speedBonus: 0.1 },
        requirements: { playerLevel: 10 }
      },
      {
        level: 4,
        cost: 5000,
        benefits: { capacityIncrease: 2, bonusMultiplier: 0.3, newPrograms: ['advanced_strength'] },
        requirements: { 
          playerLevel: 15,
          itemsRequired: [{ itemId: 'power_enhancer', quantity: 3 }]
        }
      }
    ]);

    // Speed Course upgrades
    upgrades.set('speed_course', [
      {
        level: 2,
        cost: 1500,
        benefits: { capacityIncrease: 2, speedBonus: 0.2 },
        requirements: { playerLevel: 8 }
      },
      {
        level: 3,
        cost: 3000,
        benefits: { capacityIncrease: 1, bonusMultiplier: 0.2, speedBonus: 0.3 },
        requirements: { playerLevel: 12 }
      }
    ]);

    // Other facilities would have similar upgrade paths...

    return upgrades;
  }

  startTraining(
    pokemon: PokemonInstance,
    facilityId: string,
    programId: string,
    context: GameContext
  ): {
    success: boolean;
    trainingSlot?: TrainingSlot;
    error?: string;
  } {
    const facility = this.facilities.get(facilityId);
    if (!facility) {
      return { success: false, error: 'Training facility not found' };
    }

    // Check facility availability
    const currentSessions = this.getActiveSessions(facilityId);
    if (currentSessions.length >= facility.capacity) {
      return { success: false, error: 'Training facility is at full capacity' };
    }

    // Check if Pokemon is already training
    const existingSession = Array.from(this.activeTrainingSessions.values())
      .find(session => session.pokemonId === pokemon.id && session.status === 'active');
    
    if (existingSession) {
      return { success: false, error: 'Pokemon is already in training' };
    }

    // Get training program details
    const programs = pokemonGrowthSystem.getTrainingPrograms();
    const program = programs.find(p => p.type === facility.specialization);
    
    if (!program) {
      return { success: false, error: 'No suitable training program found' };
    }

    // Calculate training duration with facility bonuses
    const baseDuration = program.duration * 60 * 1000; // Convert to milliseconds
    const speedBonus = this.getFacilitySpeedBonus(facility);
    const adjustedDuration = Math.floor(baseDuration * (1 - speedBonus));

    const trainingSlot: TrainingSlot = {
      id: `training_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pokemonId: pokemon.id,
      facilityId,
      programId,
      startTime: Date.now(),
      endTime: Date.now() + adjustedDuration,
      progress: 0,
      status: 'active'
    };

    this.activeTrainingSessions.set(trainingSlot.id, trainingSlot);

    return { success: true, trainingSlot };
  }

  updateTrainingSessions(): TrainingSlot[] {
    const completedSessions: TrainingSlot[] = [];
    const currentTime = Date.now();

    Array.from(this.activeTrainingSessions.entries()).forEach(([sessionId, session]) => {
      if (session.status !== 'active') return;

      // Update progress
      const totalDuration = session.endTime - session.startTime;
      const elapsed = currentTime - session.startTime;
      const progress = Math.min(100, Math.floor((elapsed / totalDuration) * 100));

      session.progress = progress;

      // Check if training is complete
      if (currentTime >= session.endTime) {
        session.status = 'completed';
        session.progress = 100;
        completedSessions.push(session);
      }
    });

    return completedSessions;
  }

  completeTraining(
    sessionId: string,
    context: GameContext
  ): {
    success: boolean;
    result?: {
      pokemon: PokemonInstance;
      experienceGained: number;
      statBonuses: any;
      levelUpResult?: any;
    };
    error?: string;
  } {
    const session = this.activeTrainingSessions.get(sessionId);
    if (!session || session.status !== 'completed') {
      return { success: false, error: 'Training session not found or not completed' };
    }

    const facility = this.facilities.get(session.facilityId);
    if (!facility) {
      return { success: false, error: 'Training facility not found' };
    }

    // Get the Pokemon from game state
    const pokemon = this.getPokemonById(session.pokemonId, context);
    if (!pokemon) {
      return { success: false, error: 'Pokemon not found' };
    }

    // Apply facility bonuses to training results
    const facilityBonus = facility.bonusMultiplier;
    const trainingResult = pokemonGrowthSystem.performTraining(
      pokemon,
      session.programId,
      context
    );

    if (!trainingResult.success || !trainingResult.result) {
      return { success: false, error: trainingResult.error };
    }

    // Apply facility-specific bonuses
    const enhancedResult = this.applyFacilityBonuses(trainingResult.result, facility);

    // Remove completed session
    this.activeTrainingSessions.delete(sessionId);

    return {
      success: true,
      result: enhancedResult
    };
  }

  private applyFacilityBonuses(result: any, facility: TrainingFacility): any {
    // Apply facility bonus multiplier to experience and stat bonuses
    const bonusMultiplier = facility.bonusMultiplier;
    
    return {
      ...result,
      experienceGained: {
        ...result.experienceGained,
        bonusExp: Math.floor(result.experienceGained.bonusExp * bonusMultiplier),
        totalExp: Math.floor(result.experienceGained.totalExp * bonusMultiplier)
      },
      statBonuses: Object.fromEntries(
        Object.entries(result.statBonuses).map(([stat, value]) => [
          stat,
          Math.floor((value as number) * bonusMultiplier)
        ])
      )
    };
  }

  upgradeFacility(
    facilityId: string,
    context: GameContext
  ): {
    success: boolean;
    newLevel?: number;
    error?: string;
  } {
    const facility = this.facilities.get(facilityId);
    if (!facility) {
      return { success: false, error: 'Facility not found' };
    }

    const upgrades = this.facilityUpgrades.get(facilityId);
    if (!upgrades) {
      return { success: false, error: 'No upgrades available for this facility' };
    }

    const nextUpgrade = upgrades.find(u => u.level === facility.level + 1);
    if (!nextUpgrade) {
      return { success: false, error: 'Facility is already at maximum level' };
    }

    // Check requirements
    const playerLevel = context.gameState.player?.level || 1;
    if (nextUpgrade.requirements.playerLevel && playerLevel < nextUpgrade.requirements.playerLevel) {
      return { success: false, error: 'Player level too low' };
    }

    const playerMoney = context.gameState.player?.money || 0;
    if (playerMoney < nextUpgrade.cost) {
      return { success: false, error: 'Insufficient funds' };
    }

    // Apply upgrade
    facility.level += 1;
    if (nextUpgrade.benefits.capacityIncrease) {
      facility.capacity += nextUpgrade.benefits.capacityIncrease;
    }
    if (nextUpgrade.benefits.bonusMultiplier) {
      facility.bonusMultiplier += nextUpgrade.benefits.bonusMultiplier;
    }

    return { success: true, newLevel: facility.level };
  }

  getActiveSessions(facilityId?: string): TrainingSlot[] {
    const sessions = Array.from(this.activeTrainingSessions.values());
    return facilityId 
      ? sessions.filter(s => s.facilityId === facilityId && s.status === 'active')
      : sessions.filter(s => s.status === 'active');
  }

  getAvailableFacilities(context: GameContext): TrainingFacility[] {
    const playerLevel = context.gameState.player?.level || 1;
    const builtFacilities = this.getBuiltFacilities(context);
    
    return Array.from(this.facilities.values()).filter(facility => {
      const reqs = facility.unlockRequirements;
      
      // Check player level
      if (reqs.playerLevel && playerLevel < reqs.playerLevel) {
        return false;
      }
      
      // Check required facilities
      if (reqs.facilitiesBuilt) {
        const hasAllRequired = reqs.facilitiesBuilt.every(reqFacility => 
          builtFacilities.includes(reqFacility)
        );
        if (!hasAllRequired) return false;
      }
      
      return true;
    });
  }

  private getBuiltFacilities(context: GameContext): string[] {
    // This would integrate with the game state to get built facilities
    // For now, return a basic set
    return ['basic_gym'];
  }

  private getFacilitySpeedBonus(facility: TrainingFacility): number {
    // Calculate speed bonus based on facility level and type
    return Math.min(0.5, facility.level * 0.1);
  }

  private getPokemonById(pokemonId: string, context: GameContext): PokemonInstance | null {
    // This would integrate with the game state to find the Pokemon
    // For now, return null - this would be implemented with the unified data system
    return null;
  }

  getFacilityMaintenanceCosts(): Array<{ facilityId: string; cost: number }> {
    return Array.from(this.facilities.values()).map(facility => ({
      facilityId: facility.id,
      cost: facility.maintenanceCost * facility.level
    }));
  }
}

export const pokemonTrainingFacility = new PokemonTrainingFacility();