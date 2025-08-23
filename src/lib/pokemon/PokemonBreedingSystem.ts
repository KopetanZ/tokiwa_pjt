import { PokemonInstance, PokemonSpecies } from '../schemas/pokemon';
import { GameContext } from '../game-state/types';
import { pokemonGenerator } from './PokemonGenerator';
import { pokemonDatabase } from './PokemonDatabase';

export interface BreedingPair {
  parent1: PokemonInstance;
  parent2: PokemonInstance;
  compatibility: number; // 0-100
  estimatedTime: number; // minutes
  possibleOffspring: number[]; // species IDs
}

export interface BreedingSession {
  id: string;
  parent1Id: string;
  parent2Id: string;
  startTime: number;
  endTime: number;
  progress: number; // 0-100
  status: 'active' | 'ready' | 'completed' | 'cancelled';
  eggGenerated?: boolean;
}

export interface PokemonEgg {
  id: string;
  speciesId: number;
  parent1Id: string;
  parent2Id: string;
  createdAt: number;
  hatchTime: number;
  stepsRequired: number;
  currentSteps: number;
  inheritedTraits: {
    ivs: Partial<PokemonInstance['ivs']>;
    nature?: PokemonInstance['nature'];
    moves: string[];
    abilities?: string[];
  };
  isShiny: boolean;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export interface BreedingResult {
  success: boolean;
  egg?: PokemonEgg;
  error?: string;
  bonusRewards?: {
    experience: number;
    items: Array<{ itemId: string; quantity: number }>;
  };
}

export interface HatchResult {
  success: boolean;
  pokemon?: PokemonInstance;
  egg: PokemonEgg;
  specialTraits?: {
    perfectIVs: number;
    inheritedMoves: string[];
    hiddenAbility: boolean;
  };
  error?: string;
}

export class PokemonBreedingSystem {
  private activeBreedingSessions: Map<string, BreedingSession>;
  private eggInventory: Map<string, PokemonEgg>;
  private breedingCompatibility: Map<number, Map<number, number>>;

  constructor() {
    this.activeBreedingSessions = new Map();
    this.eggInventory = new Map();
    this.breedingCompatibility = this.initializeCompatibilityMatrix();
  }

  private initializeCompatibilityMatrix(): Map<number, Map<number, number>> {
    const matrix = new Map<number, Map<number, number>>();
    
    // This would be populated with breeding compatibility data
    // For now, we'll use a simplified system based on species IDs
    const eggGroups: Record<string, number[]> = {
      'Field': [25, 133, 58, 77], // pikachu, eevee, growlithe, ponyta
      'Flying': [16, 21, 41], // pidgey, spearow, zubat
      'Water1': [54, 118, 129], // psyduck, goldeen, magikarp
      'Water2': [72, 79], // tentacool, slowpoke
      'Monster': [4, 7, 1, 29], // charmander, squirtle, bulbasaur, nidoran
      'Grass': [1, 43, 69], // bulbasaur, oddish, bellsprout
      'Bug': [10, 13, 123], // caterpie, weedle, scyther
      'Mineral': [74, 95, 81], // geodude, onix, magnemite
      'Humanlike': [66, 65, 106] // machop, alakazam, hitmonlee
    };

    // Calculate compatibility based on shared egg groups
    for (const [group1, pokemon1List] of Object.entries(eggGroups)) {
      for (const [group2, pokemon2List] of Object.entries(eggGroups)) {
        const compatibility = group1 === group2 ? 85 : 
                            this.getInterGroupCompatibility(group1, group2);
        
        for (const pokemon1 of pokemon1List) {
          if (!matrix.has(pokemon1)) {
            matrix.set(pokemon1, new Map());
          }
          for (const pokemon2 of pokemon2List) {
            matrix.get(pokemon1)!.set(pokemon2, compatibility);
          }
        }
      }
    }

    return matrix;
  }

  private getInterGroupCompatibility(group1: string, group2: string): number {
    // Some egg groups have natural compatibility
    const compatibleGroups: Record<string, string[]> = {
      'Field': ['Flying', 'Humanlike'],
      'Water1': ['Water2', 'Flying'],
      'Monster': ['Field', 'Grass'],
      'Grass': ['Monster', 'Bug'],
      'Bug': ['Grass']
    };

    const group1Compatible = compatibleGroups[group1] || [];
    const group2Compatible = compatibleGroups[group2] || [];
    
    if (group1Compatible.includes(group2) || group2Compatible.includes(group1)) {
      return 60;
    }
    
    return 25; // Low compatibility for unrelated groups
  }

  checkBreedingCompatibility(pokemon1: PokemonInstance, pokemon2: PokemonInstance): BreedingPair {
    // Basic compatibility checks
    if (pokemon1.id === pokemon2.id) {
      return {
        parent1: pokemon1,
        parent2: pokemon2,
        compatibility: 0,
        estimatedTime: 0,
        possibleOffspring: []
      };
    }

    // Check if Pokemon are healthy enough to breed
    const minLevel = 15;
    const minHappiness = 100;
    
    if (pokemon1.level < minLevel || pokemon2.level < minLevel) {
      return {
        parent1: pokemon1,
        parent2: pokemon2,
        compatibility: 0,
        estimatedTime: 0,
        possibleOffspring: []
      };
    }

    if ((pokemon1.friendship || 50) < minHappiness || (pokemon2.friendship || 50) < minHappiness) {
      return {
        parent1: pokemon1,
        parent2: pokemon2,
        compatibility: 25, // Reduced compatibility
        estimatedTime: 180,
        possibleOffspring: [pokemon1.speciesId, pokemon2.speciesId]
      };
    }

    // Get base compatibility from matrix
    const baseCompatibility = this.breedingCompatibility
      .get(pokemon1.speciesId)
      ?.get(pokemon2.speciesId) || 25;

    // Apply bonuses and penalties
    let finalCompatibility = baseCompatibility;

    // Same species bonus
    if (pokemon1.speciesId === pokemon2.speciesId) {
      finalCompatibility += 20;
    }

    // Level difference penalty
    const levelDifference = Math.abs(pokemon1.level - pokemon2.level);
    if (levelDifference > 20) {
      finalCompatibility -= 15;
    } else if (levelDifference > 10) {
      finalCompatibility -= 5;
    }

    // Happiness bonus
    const avgHappiness = ((pokemon1.friendship || 50) + (pokemon2.friendship || 50)) / 2;
    if (avgHappiness > 150) {
      finalCompatibility += 15;
    } else if (avgHappiness > 120) {
      finalCompatibility += 8;
    }

    finalCompatibility = Math.max(0, Math.min(100, finalCompatibility));

    // Calculate estimated breeding time
    const baseTime = 120; // 2 hours base
    const timeMultiplier = Math.max(0.5, (100 - finalCompatibility) / 100 + 0.5);
    const estimatedTime = Math.floor(baseTime * timeMultiplier);

    // Determine possible offspring
    const possibleOffspring = this.determinePossibleOffspring(pokemon1, pokemon2);

    return {
      parent1: pokemon1,
      parent2: pokemon2,
      compatibility: finalCompatibility,
      estimatedTime,
      possibleOffspring
    };
  }

  private determinePossibleOffspring(pokemon1: PokemonInstance, pokemon2: PokemonInstance): number[] {
    const species1Data = this.getSpeciesData(pokemon1.speciesId);
    const species2Data = this.getSpeciesData(pokemon2.speciesId);

    const offspring: number[] = [];

    // Always possible to get either parent species
    offspring.push(pokemon1.speciesId, pokemon2.speciesId);

    // Check for baby forms - using species IDs instead of names
    const babyForms: Record<number, number> = {
      25: 172, // pikachu -> pichu
      39: 298, // jigglypuff -> igglybuff
      35: 173, // clefairy -> cleffa
      184: 298, // marill -> azurill
      202: 360  // wobbuffet -> wynaut
    };

    if (babyForms[pokemon1.speciesId]) {
      offspring.unshift(babyForms[pokemon1.speciesId]);
    }
    if (babyForms[pokemon2.speciesId] && !offspring.includes(babyForms[pokemon2.speciesId])) {
      offspring.unshift(babyForms[pokemon2.speciesId]);
    }

    // Remove duplicates
    return Array.from(new Set(offspring));
  }

  startBreeding(
    pokemon1: PokemonInstance,
    pokemon2: PokemonInstance,
    context: GameContext
  ): {
    success: boolean;
    session?: BreedingSession;
    error?: string;
  } {
    const compatibility = this.checkBreedingCompatibility(pokemon1, pokemon2);
    
    if (compatibility.compatibility < 25) {
      return {
        success: false,
        error: 'Pokemon are not compatible for breeding'
      };
    }

    // Check if either Pokemon is already breeding
    const isAlreadyBreeding = Array.from(this.activeBreedingSessions.values())
      .some(session => 
        session.status === 'active' && 
        (session.parent1Id === pokemon1.id || session.parent2Id === pokemon1.id ||
         session.parent1Id === pokemon2.id || session.parent2Id === pokemon2.id)
      );

    if (isAlreadyBreeding) {
      return {
        success: false,
        error: 'One or both Pokemon are already in breeding'
      };
    }

    // Create breeding session
    const session: BreedingSession = {
      id: `breeding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      parent1Id: pokemon1.id,
      parent2Id: pokemon2.id,
      startTime: Date.now(),
      endTime: Date.now() + (compatibility.estimatedTime * 60 * 1000),
      progress: 0,
      status: 'active',
      eggGenerated: false
    };

    this.activeBreedingSessions.set(session.id, session);

    return {
      success: true,
      session
    };
  }

  updateBreedingSessions(): BreedingSession[] {
    const completedSessions: BreedingSession[] = [];
    const currentTime = Date.now();

    this.activeBreedingSessions.forEach((session, sessionId) => {
      if (session.status !== 'active') return;

      // Update progress
      const totalDuration = session.endTime - session.startTime;
      const elapsed = currentTime - session.startTime;
      const progress = Math.min(100, Math.floor((elapsed / totalDuration) * 100));

      session.progress = progress;

      // Check if breeding is complete
      if (currentTime >= session.endTime) {
        session.status = 'ready';
        session.progress = 100;
        completedSessions.push(session);
      }
    });

    return completedSessions;
  }

  collectEgg(sessionId: string, context: GameContext): BreedingResult {
    const session = this.activeBreedingSessions.get(sessionId);
    
    if (!session || session.status !== 'ready') {
      return {
        success: false,
        error: 'Breeding session not ready or not found'
      };
    }

    // Get parent data
    const parent1 = this.getPokemonById(session.parent1Id, context);
    const parent2 = this.getPokemonById(session.parent2Id, context);

    if (!parent1 || !parent2) {
      return {
        success: false,
        error: 'Parent Pokemon not found'
      };
    }

    // Generate egg
    const egg = this.generateEgg(parent1, parent2, session);
    this.eggInventory.set(egg.id, egg);

    // Mark session as completed
    session.status = 'completed';
    session.eggGenerated = true;

    // Calculate bonus rewards
    const compatibility = this.checkBreedingCompatibility(parent1, parent2);
    const bonusRewards = this.calculateBreedingRewards(compatibility.compatibility);

    // Clean up completed session after a delay
    setTimeout(() => {
      this.activeBreedingSessions.delete(sessionId);
    }, 5 * 60 * 1000); // 5 minutes

    return {
      success: true,
      egg,
      bonusRewards
    };
  }

  private generateEgg(
    parent1: PokemonInstance,
    parent2: PokemonInstance,
    session: BreedingSession
  ): PokemonEgg {
    const possibleOffspring = this.determinePossibleOffspring(parent1, parent2);
    
    // Determine egg species (70% parent1, 25% parent2, 5% baby form)
    let speciesId: number;
    const rand = Math.random();
    if (rand < 0.05 && possibleOffspring.length > 2) {
      speciesId = possibleOffspring[0]; // Baby form
    } else if (rand < 0.75) {
      speciesId = parent1.speciesId;
    } else {
      speciesId = parent2.speciesId;
    }

    // Calculate inheritance
    const inheritedTraits = this.calculateInheritance(parent1, parent2);
    
    // Determine if shiny (increased chance with compatible parents)
    const compatibility = this.checkBreedingCompatibility(parent1, parent2).compatibility;
    const shinyChance = compatibility > 80 ? 0.02 : 0.005; // 2% or 0.5%
    const isShiny = Math.random() < shinyChance;

    // Calculate hatch time (based on species rarity and egg steps)
    const species = this.getSpeciesData(speciesId);
    const baseSteps = this.getEggSteps(species.rarity);
    const hatchTime = Date.now() + (baseSteps * 100); // 100ms per step for simulation

    const egg: PokemonEgg = {
      id: `egg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      speciesId,
      parent1Id: parent1.id,
      parent2Id: parent2.id,
      createdAt: Date.now(),
      hatchTime,
      stepsRequired: baseSteps,
      currentSteps: 0,
      inheritedTraits,
      isShiny,
      rarity: species.rarity === 'mythical' ? 'legendary' : (species.rarity as 'common' | 'uncommon' | 'rare' | 'legendary')
    };

    return egg;
  }

  private calculateInheritance(
    parent1: PokemonInstance,
    parent2: PokemonInstance
  ): PokemonEgg['inheritedTraits'] {
    const inheritedTraits: PokemonEgg['inheritedTraits'] = {
      ivs: {},
      moves: [],
      abilities: []
    };

    // IV inheritance - each stat has 50% chance to inherit from either parent
    const statKeys = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as const;
    for (const stat of statKeys) {
      if (Math.random() < 0.5) {
        inheritedTraits.ivs[stat] = parent1.ivs[stat];
      } else {
        inheritedTraits.ivs[stat] = parent2.ivs[stat];
      }
    }

    // Perfect IV inheritance (small chance for 3-5 perfect IVs)
    const perfectChance = Math.random();
    if (perfectChance < 0.02) { // 2% chance for exceptional inheritance
      const numPerfect = Math.floor(Math.random() * 3) + 3; // 3-5 perfect IVs
      const perfectStats = statKeys.slice().sort(() => Math.random() - 0.5).slice(0, numPerfect);
      for (const stat of perfectStats) {
        inheritedTraits.ivs[stat] = 31;
      }
    }

    // Nature inheritance (20% chance from either parent)
    if (Math.random() < 0.2) {
      inheritedTraits.nature = Math.random() < 0.5 ? parent1.nature : parent2.nature;
    }

    // Move inheritance
    const parent1Moves = parent1.moves || [];
    const parent2Moves = parent2.moves || [];
    const allParentMoves = [...parent1Moves, ...parent2Moves];
    
    // Inherit up to 2 moves from parents
    const inheritedMoves = Array.from(new Set(allParentMoves)).slice(0, 2);
    inheritedTraits.moves = inheritedMoves;

    return inheritedTraits;
  }

  private getEggSteps(rarity: PokemonInstance['rarity']): number {
    const stepsByRarity: Record<string, number> = {
      'common': 2560,
      'uncommon': 3840,
      'rare': 5120,
      'very_rare': 6400,
      'legendary': 12800
    };

    return stepsByRarity[rarity as string] || 2560;
  }

  async hatchEgg(eggId: string, context: GameContext): Promise<HatchResult> {
    const egg = this.eggInventory.get(eggId);
    
    if (!egg) {
      return {
        success: false,
        egg: {} as PokemonEgg,
        error: 'Egg not found'
      };
    }

    if (egg.currentSteps < egg.stepsRequired) {
      return {
        success: false,
        egg,
        error: 'Egg is not ready to hatch'
      };
    }

    // Generate the Pokemon
    const species = this.getSpeciesData(egg.speciesId);
    const newPokemon = await pokemonGenerator.generatePokemon({
      level: 1,
      forceShiny: egg.isShiny,
      // customIVs: egg.inheritedTraits.ivs, // 部分的なIVsは直接使用できないため、コメントアウト
      customNature: egg.inheritedTraits.nature,
      customMoves: egg.inheritedTraits.moves,
      speciesId: typeof species.id === 'string' ? parseInt(species.id) : species.id,
      ...species
    });

    // Calculate special traits
    const specialTraits = {
      perfectIVs: this.countPerfectIVs(newPokemon.ivs),
      inheritedMoves: egg.inheritedTraits.moves,
      hiddenAbility: Math.random() < 0.1 // 10% chance for hidden ability
    };

    // Remove egg from inventory
    this.eggInventory.delete(eggId);

    return {
      success: true,
      pokemon: newPokemon as PokemonInstance,
      egg,
      specialTraits
    };
  }

  private countPerfectIVs(ivs: PokemonInstance['ivs']): number {
    return Object.values(ivs).filter(iv => iv === 31).length;
  }

  incubateEggs(steps: number): PokemonEgg[] {
    const readyToHatch: PokemonEgg[] = [];

    Array.from(this.eggInventory.values()).forEach(egg => {
      if (egg.currentSteps < egg.stepsRequired) {
        egg.currentSteps = Math.min(egg.stepsRequired, egg.currentSteps + steps);
        
        if (egg.currentSteps >= egg.stepsRequired) {
          readyToHatch.push(egg);
        }
      }
    });

    return readyToHatch;
  }

  private calculateBreedingRewards(compatibility: number): BreedingResult['bonusRewards'] {
    const baseExp = 100;
    const expBonus = Math.floor(baseExp * (compatibility / 100));

    const rewards: BreedingResult['bonusRewards'] = {
      experience: expBonus,
      items: []
    };

    // High compatibility breeding can yield bonus items
    if (compatibility > 80) {
      rewards.items.push({ itemId: 'rare_candy', quantity: 1 });
    }
    if (compatibility > 90) {
      rewards.items.push({ itemId: 'protein', quantity: 1 });
    }

    return rewards;
  }

  private getPokemonById(pokemonId: string, context: GameContext): PokemonInstance | null {
    // This would integrate with the game state to find the Pokemon
    return null;
  }

  private getSpeciesData(speciesId: number): PokemonSpecies {
    const defaultSpecies: PokemonSpecies = {
      id: speciesId,
      name: `Species${speciesId}`,
      nameJa: `種族${speciesId}`,
      type1: 'Normal',
      category: '通常',
      baseStats: { hp: 45, attack: 45, defense: 45, specialAttack: 45, specialDefense: 45, speed: 45, total: 270 },
      experienceGroup: 'medium_fast',
      baseExperience: 50,
      catchRate: 255,
      height: 0.5,
      weight: 5.0,
      rarity: 'common',
      marketValue: 100,
      researchValue: 10
    };

    try {
      const species = pokemonDatabase.getSpecies(speciesId);
      return (species as unknown as PokemonSpecies) || defaultSpecies;
    } catch {
      return defaultSpecies;
    }
  }

  // Utility methods
  getActiveBreedingSessions(): BreedingSession[] {
    return Array.from(this.activeBreedingSessions.values())
      .filter(session => session.status === 'active');
  }

  getEggInventory(): PokemonEgg[] {
    return Array.from(this.eggInventory.values());
  }

  getReadyToHatchEggs(): PokemonEgg[] {
    return Array.from(this.eggInventory.values())
      .filter(egg => egg.currentSteps >= egg.stepsRequired);
  }

  cancelBreeding(sessionId: string): boolean {
    const session = this.activeBreedingSessions.get(sessionId);
    if (session && session.status === 'active') {
      session.status = 'cancelled';
      return true;
    }
    return false;
  }
}

export const pokemonBreedingSystem = new PokemonBreedingSystem();