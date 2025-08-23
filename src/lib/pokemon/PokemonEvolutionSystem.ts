import { PokemonInstance, PokemonSpecies } from '../schemas/pokemon';
import { GameContext } from '../game-state/types';
import { pokemonDatabase } from './PokemonDatabase';

export interface EvolutionRequirement {
  type: 'level' | 'stone' | 'trade' | 'happiness' | 'time' | 'location' | 'item' | 'stat' | 'move' | 'special';
  value?: number;
  itemId?: string;
  timeOfDay?: 'day' | 'night';
  locationId?: string;
  stat?: 'hp' | 'attack' | 'defense' | 'specialAttack' | 'specialDefense' | 'speed';
  moveId?: string;
  condition?: string;
}

export interface EvolutionPath {
  fromSpeciesId: string;
  toSpeciesId: string;
  requirements: EvolutionRequirement[];
  reversible: boolean;
  description: string;
  priority: number; // For multiple evolution options
}

export interface EvolutionResult {
  success: boolean;
  evolvedPokemon?: PokemonInstance;
  previousForm: PokemonInstance;
  evolutionPath?: EvolutionPath;
  bonuses?: {
    statBonus: number;
    moveBonus: string[];
    abilityBonus?: string;
  };
  error?: string;
}

export interface EvolutionPreview {
  canEvolve: boolean;
  availablePaths: Array<{
    path: EvolutionPath;
    requirementsMet: boolean;
    missingRequirements: EvolutionRequirement[];
  }>;
}

export class PokemonEvolutionSystem {
  private evolutionPaths: Map<string, EvolutionPath[]>;
  private specialEvolutions: Map<string, (pokemon: PokemonInstance, context: GameContext) => boolean>;

  constructor() {
    this.evolutionPaths = this.initializeEvolutionPaths();
    this.specialEvolutions = this.initializeSpecialEvolutions();
  }

  private initializeEvolutionPaths(): Map<string, EvolutionPath[]> {
    const paths = new Map<string, EvolutionPath[]>();

    // Basic level evolutions
    paths.set('pikachu', [
      {
        fromSpeciesId: 'pikachu',
        toSpeciesId: 'raichu',
        requirements: [{ type: 'stone', itemId: 'thunder_stone' }],
        reversible: false,
        description: 'かみなりのいしで進化',
        priority: 1
      }
    ]);

    paths.set('eevee', [
      {
        fromSpeciesId: 'eevee',
        toSpeciesId: 'vaporeon',
        requirements: [{ type: 'stone', itemId: 'water_stone' }],
        reversible: false,
        description: 'みずのいしで進化',
        priority: 1
      },
      {
        fromSpeciesId: 'eevee',
        toSpeciesId: 'jolteon',
        requirements: [{ type: 'stone', itemId: 'thunder_stone' }],
        reversible: false,
        description: 'かみなりのいしで進化',
        priority: 1
      },
      {
        fromSpeciesId: 'eevee',
        toSpeciesId: 'flareon',
        requirements: [{ type: 'stone', itemId: 'fire_stone' }],
        reversible: false,
        description: 'ほのおのいしで進化',
        priority: 1
      },
      {
        fromSpeciesId: 'eevee',
        toSpeciesId: 'espeon',
        requirements: [
          { type: 'happiness', value: 220 },
          { type: 'time', timeOfDay: 'day' }
        ],
        reversible: false,
        description: '昼間になつき度が高い状態でレベルアップ',
        priority: 2
      },
      {
        fromSpeciesId: 'eevee',
        toSpeciesId: 'umbreon',
        requirements: [
          { type: 'happiness', value: 220 },
          { type: 'time', timeOfDay: 'night' }
        ],
        reversible: false,
        description: '夜間になつき度が高い状態でレベルアップ',
        priority: 2
      }
    ]);

    paths.set('charmeleon', [
      {
        fromSpeciesId: 'charmeleon',
        toSpeciesId: 'charizard',
        requirements: [{ type: 'level', value: 36 }],
        reversible: false,
        description: 'レベル36で進化',
        priority: 1
      }
    ]);

    paths.set('wartortle', [
      {
        fromSpeciesId: 'wartortle',
        toSpeciesId: 'blastoise',
        requirements: [{ type: 'level', value: 36 }],
        reversible: false,
        description: 'レベル36で進化',
        priority: 1
      }
    ]);

    paths.set('ivysaur', [
      {
        fromSpeciesId: 'ivysaur',
        toSpeciesId: 'venusaur',
        requirements: [{ type: 'level', value: 32 }],
        reversible: false,
        description: 'レベル32で進化',
        priority: 1
      }
    ]);

    // Trade evolutions
    paths.set('machoke', [
      {
        fromSpeciesId: 'machoke',
        toSpeciesId: 'machamp',
        requirements: [{ type: 'trade' }],
        reversible: false,
        description: '通信交換で進化',
        priority: 1
      }
    ]);

    paths.set('alakazam', [
      {
        fromSpeciesId: 'kadabra',
        toSpeciesId: 'alakazam',
        requirements: [{ type: 'trade' }],
        reversible: false,
        description: '通信交換で進化',
        priority: 1
      }
    ]);

    // Special stat-based evolutions
    paths.set('hitmonlee', [
      {
        fromSpeciesId: 'tyrogue',
        toSpeciesId: 'hitmonlee',
        requirements: [
          { type: 'level', value: 20 },
          { type: 'stat', stat: 'attack', value: 1 } // Attack > Defense
        ],
        reversible: false,
        description: 'レベル20で攻撃>防御',
        priority: 1
      }
    ]);

    paths.set('hitmonchan', [
      {
        fromSpeciesId: 'tyrogue',
        toSpeciesId: 'hitmonchan',
        requirements: [
          { type: 'level', value: 20 },
          { type: 'stat', stat: 'defense', value: 1 } // Defense > Attack
        ],
        reversible: false,
        description: 'レベル20で防御>攻撃',
        priority: 1
      }
    ]);

    return paths;
  }

  private initializeSpecialEvolutions(): Map<string, (pokemon: PokemonInstance, context: GameContext) => boolean> {
    const special = new Map<string, (pokemon: PokemonInstance, context: GameContext) => boolean>();

    // Example: Special location-based evolution
    special.set('location_moss_rock', (pokemon, context) => {
      // Check if player is at Moss Rock location
      // Note: Location-based evolution would need proper location context
      return false; // Placeholder until location context is properly implemented
    });

    special.set('weather_rain', (pokemon, context) => {
      // Check weather conditions
      // Note: Weather-based evolution would need proper weather context
      return false; // Placeholder until weather context is properly implemented
    });

    return special;
  }

  getEvolutionPreview(pokemon: PokemonInstance, context: GameContext): EvolutionPreview {
    const availablePaths = this.getAvailableEvolutionPaths(pokemon.speciesId.toString());
    const pathAnalysis = availablePaths.map(path => ({
      path,
      requirementsMet: this.checkEvolutionRequirements(pokemon, path.requirements, context),
      missingRequirements: this.getMissingRequirements(pokemon, path.requirements, context)
    }));

    return {
      canEvolve: pathAnalysis.some(analysis => analysis.requirementsMet),
      availablePaths: pathAnalysis
    };
  }

  evolve(pokemon: PokemonInstance, targetSpeciesId: string, context: GameContext): EvolutionResult {
    const availablePaths = this.getAvailableEvolutionPaths(pokemon.speciesId.toString());
    const evolutionPath = availablePaths.find(path => path.toSpeciesId === targetSpeciesId);

    if (!evolutionPath) {
      return {
        success: false,
        previousForm: pokemon,
        error: '指定された進化先が見つかりません'
      };
    }

    // Check if all requirements are met
    const requirementsMet = this.checkEvolutionRequirements(pokemon, evolutionPath.requirements, context);
    if (!requirementsMet) {
      return {
        success: false,
        previousForm: pokemon,
        error: '進化の条件を満たしていません',
        evolutionPath
      };
    }

    // Consume evolution items if required
    const consumeResult = this.consumeEvolutionItems(evolutionPath.requirements, context);
    if (!consumeResult.success) {
      return {
        success: false,
        previousForm: pokemon,
        error: consumeResult.error,
        evolutionPath
      };
    }

    // Perform the evolution
    const evolvedPokemon = this.performEvolution(pokemon, targetSpeciesId, evolutionPath);
    const bonuses = this.calculateEvolutionBonuses(pokemon, evolvedPokemon, evolutionPath);

    return {
      success: true,
      evolvedPokemon,
      previousForm: pokemon,
      evolutionPath,
      bonuses
    };
  }

  private getAvailableEvolutionPaths(speciesId: string): EvolutionPath[] {
    return this.evolutionPaths.get(speciesId) || [];
  }

  private checkEvolutionRequirements(
    pokemon: PokemonInstance,
    requirements: EvolutionRequirement[],
    context: GameContext
  ): boolean {
    return requirements.every(req => this.checkSingleRequirement(pokemon, req, context));
  }

  private checkSingleRequirement(
    pokemon: PokemonInstance,
    requirement: EvolutionRequirement,
    context: GameContext
  ): boolean {
    switch (requirement.type) {
      case 'level':
        return pokemon.level >= (requirement.value || 0);

      case 'happiness':
        const happiness = pokemon.friendship || 50;
        return happiness >= (requirement.value || 0);

      case 'stone':
      case 'item':
        if (!requirement.itemId) return false;
        return this.hasRequiredItem(requirement.itemId, context);

      case 'time':
        const currentHour = new Date().getHours();
        if (requirement.timeOfDay === 'day') {
          return currentHour >= 6 && currentHour < 18;
        } else if (requirement.timeOfDay === 'night') {
          return currentHour < 6 || currentHour >= 18;
        }
        return false;

      case 'location':
        if (!requirement.locationId) return false;
        // Note: Location-based evolution would need proper location context
        return false; // Placeholder until location context is properly implemented

      case 'stat':
        if (!requirement.stat || requirement.value === undefined) return false;
        const statValue = pokemon[requirement.stat];
        if (requirement.value === 1) {
          // Special case: comparing stats (e.g., attack > defense)
          if (requirement.stat === 'attack') {
            return pokemon.attack > pokemon.defense;
          } else if (requirement.stat === 'defense') {
            return pokemon.defense > pokemon.attack;
          }
        }
        return statValue >= requirement.value;

      case 'move':
        if (!requirement.moveId) return false;
        const moves = pokemon.moves || [];
        return moves.includes(requirement.moveId);

      case 'trade':
        // In single-player context, we might simulate trade or require special item
        return true; // Simplified for now

      case 'special':
        if (!requirement.condition) return false;
        const specialCheck = this.specialEvolutions.get(requirement.condition);
        return specialCheck ? specialCheck(pokemon, context) : false;

      default:
        return false;
    }
  }

  private getMissingRequirements(
    pokemon: PokemonInstance,
    requirements: EvolutionRequirement[],
    context: GameContext
  ): EvolutionRequirement[] {
    return requirements.filter(req => !this.checkSingleRequirement(pokemon, req, context));
  }

  private hasRequiredItem(itemId: string, context: GameContext): boolean {
    // This would check the player's inventory
    // Note: Inventory system would need to be implemented in GameData
    return false; // Placeholder until inventory system is implemented
  }

  private consumeEvolutionItems(
    requirements: EvolutionRequirement[],
    context: GameContext
  ): { success: boolean; error?: string } {
    const itemRequirements = requirements.filter(req => req.type === 'stone' || req.type === 'item');
    
    for (const req of itemRequirements) {
      if (!req.itemId) continue;
      
      if (!this.hasRequiredItem(req.itemId, context)) {
        return { success: false, error: `Required item ${req.itemId} not found` };
      }
    }

    // In a real implementation, this would actually consume the items
    // For now, we'll just return success
    return { success: true };
  }

  private performEvolution(
    pokemon: PokemonInstance,
    targetSpeciesId: string,
    evolutionPath: EvolutionPath
  ): PokemonInstance {
    // Get the target species data
    const targetSpecies = this.getSpeciesData(targetSpeciesId);
    
    // Calculate new base stats
    const newStats = this.calculateEvolvedStats(pokemon, targetSpecies);
    
    // Preserve individual characteristics
    const evolvedPokemon: PokemonInstance = {
      ...pokemon,
      speciesId: parseInt(targetSpeciesId),
      name: targetSpecies.name,
      nameJa: targetSpecies.nameJa || targetSpecies.name,
      // Remove invalid properties
      // Keep same IVs, nature, etc.
    };

    // Add evolution-specific bonuses
    if (evolutionPath.priority === 1) {
      // Standard evolution - small HP boost
      evolvedPokemon.hp += Math.floor(pokemon.level * 0.1);
      evolvedPokemon.maxHp += Math.floor(pokemon.level * 0.1);
    }

    return evolvedPokemon;
  }

  private calculateEvolvedStats(pokemon: PokemonInstance, targetSpecies: PokemonSpecies): {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  } {
    // Evolution typically multiplies base stats by ~1.5-2.0
    const evolutionMultiplier = 1.6;
    
    return {
      hp: Math.floor(pokemon.hp * evolutionMultiplier),
      attack: Math.floor(pokemon.attack * evolutionMultiplier),
      defense: Math.floor(pokemon.defense * evolutionMultiplier),
      specialAttack: Math.floor(pokemon.specialAttack * evolutionMultiplier),
      specialDefense: Math.floor(pokemon.specialDefense * evolutionMultiplier),
      speed: Math.floor(pokemon.speed * evolutionMultiplier)
    };
  }

  private calculateEvolutionBonuses(
    originalPokemon: PokemonInstance,
    evolvedPokemon: PokemonInstance,
    evolutionPath: EvolutionPath
  ): EvolutionResult['bonuses'] {
    // Calculate total stat increase
    const statIncrease = 
      (evolvedPokemon.hp - originalPokemon.hp) +
      (evolvedPokemon.attack - originalPokemon.attack) +
      (evolvedPokemon.defense - originalPokemon.defense) +
      (evolvedPokemon.specialAttack - originalPokemon.specialAttack) +
      (evolvedPokemon.specialDefense - originalPokemon.specialDefense) +
      (evolvedPokemon.speed - originalPokemon.speed);

    // Evolution often grants new moves
    const newMoves = this.getEvolutionMoves(evolutionPath.toSpeciesId);

    return {
      statBonus: statIncrease,
      moveBonus: newMoves,
      abilityBonus: this.getEvolutionAbility(evolutionPath.toSpeciesId)
    };
  }

  private getEvolutionMoves(speciesId: string): string[] {
    // Species-specific evolution moves
    const evolutionMoves: Record<string, string[]> = {
      'charizard': ['Dragon Rage', 'Fire Spin'],
      'blastoise': ['Skull Bash', 'Hydro Pump'],
      'venusaur': ['Petal Dance', 'Solar Beam'],
      'raichu': ['Thunder', 'Agility'],
      'alakazam': ['Psychic', 'Future Sight']
    };

    return evolutionMoves[speciesId] || [];
  }

  private getEvolutionAbility(speciesId: string): string | undefined {
    // Some evolutions might grant special abilities
    const abilities: Record<string, string> = {
      'charizard': 'Blaze',
      'alakazam': 'Synchronize',
      'machamp': 'Guts'
    };

    return abilities[speciesId];
  }

  private getSpeciesData(speciesId: string): PokemonSpecies {
    // This would integrate with PokemonDatabase
    try {
      return pokemonDatabase.getSpecies(parseInt(speciesId)) as unknown as PokemonSpecies;
    } catch {
      // Fallback data
      return {
        id: parseInt(speciesId) || 0,
        name: speciesId,
        nameJa: speciesId,
        type1: 'Normal',
        category: '通常',
        baseStats: {
          hp: 60,
          attack: 60,
          defense: 60,
          specialAttack: 60,
          specialDefense: 60,
          speed: 60,
          total: 360
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

  // Utility methods
  canEvolveNow(pokemon: PokemonInstance, context: GameContext): boolean {
    const preview = this.getEvolutionPreview(pokemon, context);
    return preview.canEvolve;
  }

  getEvolutionCount(): number {
    let totalEvolutions = 0;
    Array.from(this.evolutionPaths.values()).forEach(paths => {
      totalEvolutions += paths.length;
    });
    return totalEvolutions;
  }

  getAllEvolutionPaths(): EvolutionPath[] {
    const allPaths: EvolutionPath[] = [];
    Array.from(this.evolutionPaths.values()).forEach(paths => {
      allPaths.push(...paths);
    });
    return allPaths.sort((a, b) => a.priority - b.priority);
  }
}

export const pokemonEvolutionSystem = new PokemonEvolutionSystem();