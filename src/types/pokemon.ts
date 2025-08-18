export interface Pokemon {
  id: string
  dexNumber: number
  name: string
  nameEn: string
  level: number
  hp: number
  maxHp: number
  attack: number
  defense: number
  speed: number
  specialAttack: number
  specialDefense: number
  types: PokemonType[]
  nature: string
  ability: string
  status: 'available' | 'on_expedition' | 'injured' | 'training' | 'resting'
  trainerId: string | null
  friendship: number
  moves: PokemonMove[]
  experience: number
  nextLevelExp: number
  ivs: {
    hp: number
    attack: number
    defense: number
    specialAttack: number
    specialDefense: number
    speed: number
  }
  evs: {
    hp: number
    attack: number
    defense: number
    specialAttack: number
    specialDefense: number
    speed: number
  }
  shiny: boolean
  gender: 'male' | 'female' | 'genderless'
  caughtAt: Date
  originalTrainer: string
  pokeball: string
}

export interface PokemonMove {
  id: string
  name: string
  nameEn: string
  type: PokemonType
  category: 'physical' | 'special' | 'status'
  power: number | null
  accuracy: number | null
  pp: number
  maxPp: number
  description: string
}

export type PokemonType = 
  | 'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice'
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy'

export interface PokemonSpecies {
  id: number
  name: string
  nameEn: string
  types: PokemonType[]
  baseStats: {
    hp: number
    attack: number
    defense: number
    specialAttack: number
    specialDefense: number
    speed: number
  }
  abilities: string[]
  height: number
  weight: number
  captureRate: number
  baseExperience: number
  growthRate: 'slow' | 'medium_slow' | 'medium_fast' | 'fast' | 'erratic' | 'fluctuating'
  eggGroups: string[]
  genderRatio: number // -1 for genderless, 0-100 for female ratio
  description: string
  sprite: string
}

export interface PokemonParty {
  id: string
  trainerId: string
  pokemon: Pokemon[]
  createdAt: Date
  updatedAt: Date
}

export interface PokemonBox {
  id: string
  name: string
  pokemon: Pokemon[]
  maxCapacity: number
}

export interface WildPokemonEncounter {
  id: string
  species: PokemonSpecies
  level: number
  location: string
  rarity: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary'
  conditions: {
    timeOfDay?: 'morning' | 'day' | 'evening' | 'night'
    weather?: string
    season?: string
  }
}

export interface PokemonCatchResult {
  success: boolean
  pokemon?: Pokemon
  message: string
  experience: number
  items?: string[]
}

export interface PokemonEvolution {
  id: string
  fromSpeciesId: number
  toSpeciesId: number
  trigger: 'level' | 'stone' | 'trade' | 'friendship' | 'time' | 'location'
  requirement: {
    level?: number
    item?: string
    friendship?: number
    timeOfDay?: string
    location?: string
    holdingItem?: string
  }
}