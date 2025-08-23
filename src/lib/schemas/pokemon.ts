// Pokemon Schema Definitions

export interface PokemonInstance {
  id: string
  speciesId: number
  name: string
  nameJa: string
  level: number
  experience: number
  nextLevelExp: number
  hp: number
  maxHp: number
  attack: number
  defense: number
  specialAttack: number
  specialDefense: number
  speed: number
  status: 'healthy' | 'injured' | 'sick' | 'training' | 'available' | 'on_expedition'
  moves: string[]
  types?: string[]
  ivs: {
    hp: number
    attack: number
    defense: number
    specialAttack: number
    specialDefense: number
    speed: number
  }
  evs?: {
    hp: number
    attack: number
    defense: number
    specialAttack: number
    specialDefense: number
    speed: number
  }
  nature: string
  caughtDate: string
  caughtLocation: number
  caughtBy: string
  originalTrainer: string
  isShiny?: boolean
  ability?: string
  hiddenAbility?: boolean
  rarity?: 'common' | 'uncommon' | 'rare' | 'legendary' | 'mythical'
  friendship?: number
  gender?: 'male' | 'female' | 'unknown'
  ballType?: string
  markings?: string[]
  nickname?: string
}

export interface PokemonSpecies {
  id: number
  name: string
  nameJa: string
  type1: string
  type2?: string
  category: string
  baseStats: {
    hp: number
    attack: number
    defense: number
    specialAttack: number
    specialDefense: number
    speed: number
    total: number
  }
  experienceGroup: 'slow' | 'medium_slow' | 'medium_fast' | 'fast'
  baseExperience: number
  catchRate: number
  height: number
  weight: number
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary' | 'mythical'
  marketValue: number
  researchValue: number
  evolutions?: {
    evolves_to: number
    method: 'level' | 'stone' | 'trade' | 'friendship' | 'other'
    condition: string | number
    notes?: string
  }[]
  abilities?: string[]
  hiddenAbility?: string
  eggGroups?: string[]
  genderRatio?: {
    male: number
    female: number
  }
  description?: string
}

export interface PokemonMove {
  id: string
  name: string
  nameJa: string
  type: string
  category: 'physical' | 'special' | 'status'
  power?: number
  accuracy?: number
  pp: number
  description?: string
  effect?: string
}

export interface PokemonTrainingSession {
  id: string
  pokemonId: string
  trainerId: string
  trainingType: 'physical' | 'special' | 'speed' | 'hp' | 'skill'
  startTime: string
  endTime?: string
  duration: number // in minutes
  intensity: 'light' | 'moderate' | 'intense'
  results?: {
    experienceGained: number
    statsImproved: string[]
    friendship: number
    fatigue: number
  }
  status: 'active' | 'completed' | 'cancelled'
}

export interface PokemonBreedingPair {
  id: string
  parent1Id: string
  parent2Id: string
  startTime: string
  estimatedHatchTime: string
  actualHatchTime?: string
  status: 'breeding' | 'egg_ready' | 'hatched'
  eggId?: string
  offspring?: PokemonInstance
}

export interface PokemonEgg {
  id: string
  species?: number // May be unknown until hatching
  parentIds: [string, string]
  layTime: string
  estimatedHatchTime: string
  actualHatchTime?: string
  steps: number
  totalStepsRequired: number
  status: 'incubating' | 'ready_to_hatch' | 'hatched'
  inheritedMoves?: string[]
  inheritedAbilities?: string[]
}

// Pokemon Status Effects
export interface PokemonStatusEffect {
  id: string
  name: string
  nameJa: string
  type: 'positive' | 'negative' | 'neutral'
  duration?: number // in hours, undefined for permanent
  effect: {
    statMultipliers?: {
      hp?: number
      attack?: number
      defense?: number
      specialAttack?: number
      specialDefense?: number
      speed?: number
    }
    experienceMultiplier?: number
    friendshipMultiplier?: number
    other?: string
  }
  description: string
}

// Pokemon Medical Record
export interface PokemonMedicalRecord {
  pokemonId: string
  checkups: Array<{
    date: string
    veterinarianId: string
    findings: string
    treatment?: string
    medications?: string[]
    nextCheckup?: string
  }>
  injuries: Array<{
    date: string
    type: string
    severity: 'minor' | 'moderate' | 'severe'
    treatment: string
    healed: boolean
    healedDate?: string
  }>
  illnesses: Array<{
    date: string
    type: string
    symptoms: string[]
    treatment: string
    recovered: boolean
    recoveredDate?: string
  }>
  vaccinations: Array<{
    date: string
    vaccine: string
    nextDue?: string
  }>
}

// Evolution Requirements
export interface EvolutionRequirement {
  method: 'level' | 'stone' | 'trade' | 'friendship' | 'time' | 'location' | 'item' | 'move' | 'other'
  condition: any // Flexible type for various conditions
  notes?: string
}

// Pokemon Contest Stats (if contests are implemented)
export interface PokemonContestStats {
  beauty: number
  cute: number
  cool: number
  smart: number
  tough: number
}

// Export utility functions
export const createNewPokemonInstance = (
  speciesId: number, 
  level: number = 5, 
  trainerId: string = 'unknown'
): Partial<PokemonInstance> => {
  const id = `pokemon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  return {
    id,
    speciesId,
    level,
    experience: 0,
    nextLevelExp: calculateNextLevelExp(level),
    status: 'healthy',
    moves: [],
    ivs: generateRandomIVs(),
    caughtDate: new Date().toISOString(),
    caughtBy: trainerId,
    originalTrainer: trainerId,
    isShiny: Math.random() < 0.001, // 1/1000 chance for shiny
    friendship: 70, // Default friendship level
    gender: Math.random() < 0.5 ? 'male' : 'female'
  }
}

export const generateRandomIVs = (): PokemonInstance['ivs'] => {
  return {
    hp: Math.floor(Math.random() * 32),
    attack: Math.floor(Math.random() * 32),
    defense: Math.floor(Math.random() * 32),
    specialAttack: Math.floor(Math.random() * 32),
    specialDefense: Math.floor(Math.random() * 32),
    speed: Math.floor(Math.random() * 32)
  }
}

export const calculateNextLevelExp = (currentLevel: number): number => {
  // Simple formula - can be made more complex based on experience group
  return Math.floor(Math.pow(currentLevel, 3) * 0.8)
}

export const calculatePokemonStats = (
  baseStats: PokemonSpecies['baseStats'],
  level: number,
  ivs: PokemonInstance['ivs'],
  evs: PokemonInstance['evs'] = { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 }
) => {
  const hp = Math.floor(((2 * baseStats.hp + ivs.hp + Math.floor(evs.hp / 4)) * level) / 100) + level + 10
  const attack = Math.floor(((2 * baseStats.attack + ivs.attack + Math.floor(evs.attack / 4)) * level) / 100) + 5
  const defense = Math.floor(((2 * baseStats.defense + ivs.defense + Math.floor(evs.defense / 4)) * level) / 100) + 5
  const specialAttack = Math.floor(((2 * baseStats.specialAttack + ivs.specialAttack + Math.floor(evs.specialAttack / 4)) * level) / 100) + 5
  const specialDefense = Math.floor(((2 * baseStats.specialDefense + ivs.specialDefense + Math.floor(evs.specialDefense / 4)) * level) / 100) + 5
  const speed = Math.floor(((2 * baseStats.speed + ivs.speed + Math.floor(evs.speed / 4)) * level) / 100) + 5

  return {
    hp,
    maxHp: hp,
    attack,
    defense,
    specialAttack,
    specialDefense,
    speed
  }
}