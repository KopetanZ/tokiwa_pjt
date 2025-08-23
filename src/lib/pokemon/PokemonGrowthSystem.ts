import { PokemonInstance, PokemonSpecies } from '../schemas/pokemon';
import { GameContext } from '../game-state/types';

export interface ExperienceGain {
  baseExp: number;
  bonusExp: number;
  totalExp: number;
  source: 'expedition' | 'training' | 'battle' | 'special';
}

export interface LevelUpResult {
  previousLevel: number;
  newLevel: number;
  statGains: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  newMoves?: string[];
  canEvolve?: boolean;
  evolutionOptions?: EvolutionOption[];
}

export interface EvolutionOption {
  targetSpeciesId: string;
  method: 'level' | 'stone' | 'trade' | 'happiness' | 'special';
  requirement: {
    level?: number;
    item?: string;
    happiness?: number;
    time?: 'day' | 'night';
    location?: string;
    condition?: string;
  };
}

export interface TrainingSession {
  type: 'strength' | 'endurance' | 'speed' | 'technique' | 'intelligence' | 'balanced';
  duration: number; // minutes
  intensity: 'light' | 'moderate' | 'intense' | 'extreme';
  cost: number;
  expMultiplier: number;
  statBonuses: Partial<Record<'hp' | 'attack' | 'defense' | 'specialAttack' | 'specialDefense' | 'speed', number>>;
}

export class PokemonGrowthSystem {
  private readonly experienceTable: number[];
  private readonly trainingPrograms: Map<string, TrainingSession>;

  constructor() {
    this.experienceTable = this.generateExperienceTable();
    this.trainingPrograms = this.initializeTrainingPrograms();
  }

  private generateExperienceTable(): number[] {
    const table: number[] = [0]; // Level 1 = 0 exp
    for (let level = 2; level <= 100; level++) {
      // Medium Fast growth rate formula
      const exp = Math.floor(Math.pow(level, 3));
      table.push(exp);
    }
    return table;
  }

  private initializeTrainingPrograms(): Map<string, TrainingSession> {
    const programs = new Map<string, TrainingSession>();

    programs.set('basic_strength', {
      type: 'strength',
      duration: 30,
      intensity: 'moderate',
      cost: 100,
      expMultiplier: 1.2,
      statBonuses: { attack: 2, hp: 1 }
    });

    programs.set('advanced_strength', {
      type: 'strength',
      duration: 60,
      intensity: 'intense',
      cost: 300,
      expMultiplier: 1.5,
      statBonuses: { attack: 5, hp: 2 }
    });

    programs.set('speed_training', {
      type: 'speed',
      duration: 45,
      intensity: 'intense',
      cost: 200,
      expMultiplier: 1.3,
      statBonuses: { speed: 4, defense: 1 }
    });

    programs.set('endurance_training', {
      type: 'endurance',
      duration: 90,
      intensity: 'moderate',
      cost: 150,
      expMultiplier: 1.1,
      statBonuses: { hp: 6, defense: 3 }
    });

    programs.set('technique_mastery', {
      type: 'technique',
      duration: 120,
      intensity: 'light',
      cost: 250,
      expMultiplier: 1.4,
      statBonuses: { specialAttack: 4, specialDefense: 2 }
    });

    programs.set('elite_training', {
      type: 'balanced',
      duration: 180,
      intensity: 'extreme',
      cost: 500,
      expMultiplier: 2.0,
      statBonuses: { 
        hp: 3, 
        attack: 3, 
        defense: 3, 
        specialAttack: 3, 
        specialDefense: 3, 
        speed: 3 
      }
    });

    return programs;
  }

  giveExperience(
    pokemon: PokemonInstance, 
    baseExp: number, 
    source: ExperienceGain['source'],
    context: GameContext
  ): { updatedPokemon: PokemonInstance; levelUpResult?: LevelUpResult; experienceGain: ExperienceGain } {
    const bonusExp = this.calculateBonusExperience(pokemon, baseExp, source, context);
    const totalExp = baseExp + bonusExp;
    
    const experienceGain: ExperienceGain = {
      baseExp,
      bonusExp,
      totalExp,
      source
    };

    const newTotalExp = pokemon.experience + totalExp;
    const newLevel = this.calculateLevelFromExperience(newTotalExp);
    
    let levelUpResult: LevelUpResult | undefined;
    let updatedPokemon = { ...pokemon, experience: newTotalExp };

    if (newLevel > pokemon.level) {
      levelUpResult = this.handleLevelUp(pokemon, newLevel);
      updatedPokemon = this.applyLevelUpChanges(updatedPokemon, levelUpResult);
    }

    return { updatedPokemon, levelUpResult, experienceGain };
  }

  private calculateBonusExperience(
    pokemon: PokemonInstance, 
    baseExp: number, 
    source: ExperienceGain['source'],
    context: GameContext
  ): number {
    let multiplier = 1.0;

    // Happiness bonus
    const happiness = pokemon.friendship || 50;
    if (happiness > 150) multiplier += 0.2;
    else if (happiness > 100) multiplier += 0.1;

    // Level difference penalty (higher level = less exp)
    if (pokemon.level > 50) multiplier *= 0.8;
    else if (pokemon.level > 25) multiplier *= 0.9;

    // Source-specific bonuses
    switch (source) {
      case 'training':
        multiplier += 0.5; // Training gives more exp
        break;
      case 'expedition':
        multiplier += 0.2;
        break;
      case 'battle':
        multiplier += 0.3;
        break;
      case 'special':
        multiplier += 1.0;
        break;
    }

    // Player skill bonuses
    const trainerLevel = context.gameState.player?.level || 1;
    const skillBonus = Math.min(trainerLevel * 0.02, 0.5);
    multiplier += skillBonus;

    return Math.floor(baseExp * (multiplier - 1.0));
  }

  private calculateLevelFromExperience(experience: number): number {
    for (let level = 1; level < this.experienceTable.length; level++) {
      if (experience < this.experienceTable[level]) {
        return level;
      }
    }
    return 100; // Max level
  }

  private handleLevelUp(pokemon: PokemonInstance, newLevel: number): LevelUpResult {
    const statGains = this.calculateStatGains(pokemon, pokemon.level, newLevel);
    const newMoves = this.getNewMovesForLevel(pokemon.speciesId.toString(), newLevel);
    const evolutionData = this.checkEvolutionRequirements(pokemon, newLevel);

    return {
      previousLevel: pokemon.level,
      newLevel,
      statGains,
      newMoves: newMoves.length > 0 ? newMoves : undefined,
      canEvolve: evolutionData.canEvolve,
      evolutionOptions: evolutionData.options
    };
  }

  private calculateStatGains(
    pokemon: PokemonInstance, 
    oldLevel: number, 
    newLevel: number
  ): LevelUpResult['statGains'] {
    const species = this.getSpeciesData(pokemon.speciesId.toString());
    const nature = pokemon.nature;
    const ivs = pokemon.ivs;

    const gains = {
      hp: 0,
      attack: 0,
      defense: 0,
      specialAttack: 0,
      specialDefense: 0,
      speed: 0
    };

    for (let level = oldLevel + 1; level <= newLevel; level++) {
      // Base stat growth per level
      gains.hp += Math.floor((species.baseStats.hp + ivs.hp) * 0.02) + 1;
      gains.attack += Math.floor((species.baseStats.attack + ivs.attack) * 0.02);
      gains.defense += Math.floor((species.baseStats.defense + ivs.defense) * 0.02);
      gains.specialAttack += Math.floor((species.baseStats.specialAttack + ivs.specialAttack) * 0.02);
      gains.specialDefense += Math.floor((species.baseStats.specialDefense + ivs.specialDefense) * 0.02);
      gains.speed += Math.floor((species.baseStats.speed + ivs.speed) * 0.02);

      // Nature modifiers (applied every 5 levels)
      if (level % 5 === 0) {
        this.applyNatureModifiers(gains, nature);
      }
    }

    return gains;
  }

  private applyNatureModifiers(
    gains: LevelUpResult['statGains'], 
    nature: PokemonInstance['nature']
  ): void {
    // Simplified nature effects
    const natureEffects: Record<string, { positive: keyof typeof gains; negative: keyof typeof gains }> = {
      'Adamant': { positive: 'attack', negative: 'specialAttack' },
      'Bold': { positive: 'defense', negative: 'attack' },
      'Calm': { positive: 'specialDefense', negative: 'attack' },
      'Careful': { positive: 'specialDefense', negative: 'specialAttack' },
      'Hasty': { positive: 'speed', negative: 'defense' },
      'Impish': { positive: 'defense', negative: 'specialAttack' },
      'Jolly': { positive: 'speed', negative: 'specialAttack' },
      'Modest': { positive: 'specialAttack', negative: 'attack' },
      'Timid': { positive: 'speed', negative: 'attack' }
    };

    const effect = natureEffects[nature];
    if (effect) {
      gains[effect.positive] += 2;
      gains[effect.negative] -= 1;
    }
  }

  private getNewMovesForLevel(speciesId: string, level: number): string[] {
    // Simplified move learning system
    const movesByLevel: Record<number, string[]> = {
      5: ['Quick Attack'],
      10: ['Thunder Shock', 'Ember', 'Water Gun'],
      15: ['Double Kick', 'Bite'],
      20: ['Thunder Wave', 'Flame Wheel', 'Bubble Beam'],
      25: ['Agility', 'Take Down'],
      30: ['Thunderbolt', 'Flamethrower', 'Surf'],
      35: ['Thunder', 'Fire Blast', 'Hydro Pump'],
      40: ['Double Team', 'Rest'],
      45: ['Thunder', 'Fire Blast', 'Blizzard'],
      50: ['Hyper Beam']
    };

    return movesByLevel[level] || [];
  }

  private checkEvolutionRequirements(
    pokemon: PokemonInstance, 
    newLevel: number
  ): { canEvolve: boolean; options: EvolutionOption[] } {
    const species = this.getSpeciesData(pokemon.speciesId.toString());
    const options: EvolutionOption[] = [];

    // Level-based evolutions
    if (species.evolutions) {
      for (const evolution of species.evolutions) {
        if (evolution.method === 'level' && typeof evolution.condition === 'number' && newLevel >= evolution.condition) {
          options.push({
            targetSpeciesId: evolution.evolves_to.toString(),
            method: 'level',
            requirement: { level: evolution.condition }
          });
        }
      }
    }

    return {
      canEvolve: options.length > 0,
      options
    };
  }

  private applyLevelUpChanges(
    pokemon: PokemonInstance, 
    levelUpResult: LevelUpResult
  ): PokemonInstance {
    return {
      ...pokemon,
      level: levelUpResult.newLevel,
      hp: pokemon.hp + levelUpResult.statGains.hp,
      maxHp: pokemon.maxHp + levelUpResult.statGains.hp,
      attack: pokemon.attack + levelUpResult.statGains.attack,
      defense: pokemon.defense + levelUpResult.statGains.defense,
      specialAttack: pokemon.specialAttack + levelUpResult.statGains.specialAttack,
      specialDefense: pokemon.specialDefense + levelUpResult.statGains.specialDefense,
      speed: pokemon.speed + levelUpResult.statGains.speed,
      moves: levelUpResult.newMoves 
        ? [...(pokemon.moves || []), ...levelUpResult.newMoves].slice(0, 4)
        : pokemon.moves
    };
  }

  performTraining(
    pokemon: PokemonInstance,
    programId: string,
    context: GameContext
  ): {
    success: boolean;
    result?: {
      experienceGained: ExperienceGain;
      statBonuses: Partial<Record<'hp' | 'attack' | 'defense' | 'specialAttack' | 'specialDefense' | 'speed', number>>;
      levelUpResult?: LevelUpResult;
      updatedPokemon: PokemonInstance;
    };
    error?: string;
  } {
    const program = this.trainingPrograms.get(programId);
    if (!program) {
      return { success: false, error: 'Training program not found' };
    }

    // Check if player has enough resources
    const playerMoney = context.gameState.player?.money || 0;
    if (playerMoney < program.cost) {
      return { success: false, error: 'Insufficient funds for training' };
    }

    // Calculate experience gain
    const baseExp = this.calculateTrainingExperience(pokemon, program);
    const { updatedPokemon, levelUpResult, experienceGain } = this.giveExperience(
      pokemon, 
      baseExp, 
      'training', 
      context
    );

    // Apply stat bonuses
    const finalPokemon = this.applyStatBonuses(updatedPokemon, program.statBonuses);

    return {
      success: true,
      result: {
        experienceGained: experienceGain,
        statBonuses: program.statBonuses,
        levelUpResult,
        updatedPokemon: finalPokemon
      }
    };
  }

  private calculateTrainingExperience(pokemon: PokemonInstance, program: TrainingSession): number {
    const baseExp = 50; // Base training experience
    const durationMultiplier = program.duration / 30; // 30 minutes = 1x
    const intensityMultiplier = {
      'light': 0.8,
      'moderate': 1.0,
      'intense': 1.3,
      'extreme': 1.8
    }[program.intensity];

    return Math.floor(baseExp * durationMultiplier * intensityMultiplier * program.expMultiplier);
  }

  private applyStatBonuses(
    pokemon: PokemonInstance, 
    bonuses: Partial<Record<'hp' | 'attack' | 'defense' | 'specialAttack' | 'specialDefense' | 'speed', number>>
  ): PokemonInstance {
    const updatedPokemon = { ...pokemon };
    
    for (const [stat, bonus] of Object.entries(bonuses)) {
      if (typeof bonus === 'number') {
        if (stat === 'hp') updatedPokemon.hp += bonus;
        else if (stat === 'attack') updatedPokemon.attack += bonus;
        else if (stat === 'defense') updatedPokemon.defense += bonus;
        else if (stat === 'specialAttack') updatedPokemon.specialAttack += bonus;
        else if (stat === 'specialDefense') updatedPokemon.specialDefense += bonus;
        else if (stat === 'speed') updatedPokemon.speed += bonus;
      }
    }

    return updatedPokemon;
  }

  getTrainingPrograms(): TrainingSession[] {
    return Array.from(this.trainingPrograms.values());
  }

  getExperienceToNextLevel(pokemon: PokemonInstance): number {
    if (pokemon.level >= 100) return 0;
    return this.experienceTable[pokemon.level + 1] - pokemon.experience;
  }

  private getSpeciesData(speciesId: string): PokemonSpecies {
    // This would integrate with the PokemonDatabase
    return {
      id: parseInt(speciesId) || 0,
      name: 'Unknown',
      nameJa: '不明',
      type1: 'Normal',
      category: '通常',
      baseStats: {
        hp: 50,
        attack: 50,
        defense: 50,
        specialAttack: 50,
        specialDefense: 50,
        speed: 50,
        total: 300
      },
      experienceGroup: 'medium_fast',
      baseExperience: 50,
      catchRate: 255,
      height: 1.0,
      weight: 10.0,
      rarity: 'common',
      marketValue: 100,
      researchValue: 10
    };
  }
}

export const pokemonGrowthSystem = new PokemonGrowthSystem();