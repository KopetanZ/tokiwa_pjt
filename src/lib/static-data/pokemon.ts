import type { PokemonSpeciesDefinition, PokemonType } from './types'

/**
 * ポケモン種族定義データ
 * 主要な第一世代ポケモンの基本データ
 */

export const POKEMON_SPECIES: Record<number, PokemonSpeciesDefinition> = {
  25: { // Pikachu
    id: 25,
    name: 'Pikachu',
    nameJa: 'ピカチュウ',
    type1: 'electric',
    category: 'Mouse Pokémon',
    
    baseStats: {
      hp: 35,
      attack: 55,
      defense: 40,
      specialAttack: 50,
      specialDefense: 50,
      speed: 90,
      total: 320
    },
    
    experienceGroup: 'medium_fast',
    baseExperience: 112,
    catchRate: 190,
    
    height: 0.4,
    weight: 6.0,
    color: 'yellow',
    habitat: 'forest',
    
    rarity: 'uncommon',
    marketValue: 15000,
    researchValue: 8000,
    
    abilities: ['Static'],
    hiddenAbility: 'Lightning Rod',
    
    levelUpMoves: [
      { level: 1, move: 'でんき' },
      { level: 1, move: 'しっぽをふる' },
      { level: 5, move: 'でんこうせっか' },
      { level: 10, move: 'かみなり' },
      { level: 15, move: '10まんボルト' },
      { level: 20, move: 'でんじは' }
    ],
    
    evolutionChain: {
      evolvesTo: 26,
      method: 'stone',
      requirement: 'かみなりのいし'
    },
    
    ecology: {
      temperament: 'curious',
      activityPattern: 'diurnal',
      socialBehavior: 'small_group',
      preferredEnvironment: ['forest', 'grassland', 'urban'],
      diet: 'omnivore'
    },
    
    trainingDifficulty: 5,
    loyaltyGrowthRate: 1.2,
    healthRecoveryRate: 1.0,
    
    description: 'このポケモンは電気を体に蓄える。電気袋から電撃を放つことができる。',
    flavorText: [
      {
        version: 'Red/Blue',
        text: 'When several of these Pokémon gather, their electricity could build and cause lightning storms.'
      },
      {
        version: 'Gold/Silver',
        text: 'It keeps its tail raised to monitor its surroundings. If you yank its tail, it will try to bite you.'
      }
    ]
  },

  133: { // Eevee
    id: 133,
    name: 'Eevee',
    nameJa: 'イーブイ',
    type1: 'normal',
    category: 'Evolution Pokémon',
    
    baseStats: {
      hp: 55,
      attack: 55,
      defense: 50,
      specialAttack: 45,
      specialDefense: 65,
      speed: 55,
      total: 325
    },
    
    experienceGroup: 'medium_fast',
    baseExperience: 65,
    catchRate: 45,
    
    height: 0.3,
    weight: 6.5,
    color: 'brown',
    habitat: 'urban',
    
    rarity: 'rare',
    marketValue: 25000,
    researchValue: 15000,
    
    abilities: ['Run Away', 'Adaptability'],
    hiddenAbility: 'Anticipation',
    
    levelUpMoves: [
      { level: 1, move: 'しっぽをふる' },
      { level: 1, move: 'たいあたり' },
      { level: 8, move: 'すなかけ' },
      { level: 16, move: 'でんこうせっか' },
      { level: 23, move: 'かみつく' },
      { level: 30, move: 'とっしん' }
    ],
    
    ecology: {
      temperament: 'docile',
      activityPattern: 'diurnal',
      socialBehavior: 'pair',
      preferredEnvironment: ['urban', 'grassland'],
      diet: 'omnivore'
    },
    
    trainingDifficulty: 3,
    loyaltyGrowthRate: 1.5,
    healthRecoveryRate: 1.1,
    
    description: '遺伝子が不安定で、様々な進化の可能性を秘めたポケモン。',
    flavorText: [
      {
        version: 'Red/Blue',
        text: 'Its genetic code is irregular. It may mutate if it is exposed to radiation from element stones.'
      }
    ]
  },

  4: { // Charmander
    id: 4,
    name: 'Charmander',
    nameJa: 'ヒトカゲ',
    type1: 'fire',
    category: 'Lizard Pokémon',
    
    baseStats: {
      hp: 39,
      attack: 52,
      defense: 43,
      specialAttack: 60,
      specialDefense: 50,
      speed: 65,
      total: 309
    },
    
    experienceGroup: 'medium_slow',
    baseExperience: 62,
    catchRate: 45,
    
    height: 0.6,
    weight: 8.5,
    color: 'red',
    habitat: 'mountain',
    
    rarity: 'rare',
    marketValue: 30000,
    researchValue: 12000,
    
    abilities: ['Blaze'],
    hiddenAbility: 'Solar Power',
    
    levelUpMoves: [
      { level: 1, move: 'なきごえ' },
      { level: 1, move: 'ひのこ' },
      { level: 7, move: 'ひっかく' },
      { level: 13, move: 'かえんほうしゃ' },
      { level: 19, move: 'りゅうのいかり' },
      { level: 25, move: 'きりさく' }
    ],
    
    evolutionChain: {
      evolvesTo: 5,
      method: 'level',
      requirement: 16
    },
    
    ecology: {
      temperament: 'aggressive',
      activityPattern: 'diurnal',
      socialBehavior: 'solitary',
      preferredEnvironment: ['mountain', 'cave'],
      diet: 'omnivore'
    },
    
    trainingDifficulty: 6,
    loyaltyGrowthRate: 1.0,
    healthRecoveryRate: 0.9,
    
    description: 'しっぽの炎が健康のバロメーター。元気な時は盛んに燃える。',
    flavorText: [
      {
        version: 'Red/Blue',
        text: 'Obviously prefers hot places. When it rains, steam is said to spout from the tip of its tail.'
      }
    ]
  },

  10: { // Caterpie
    id: 10,
    name: 'Caterpie',
    nameJa: 'キャタピー',
    type1: 'bug',
    category: 'Worm Pokémon',
    
    baseStats: {
      hp: 45,
      attack: 30,
      defense: 35,
      specialAttack: 20,
      specialDefense: 20,
      speed: 45,
      total: 195
    },
    
    experienceGroup: 'medium_fast',
    baseExperience: 39,
    catchRate: 255,
    
    height: 0.3,
    weight: 2.9,
    color: 'green',
    habitat: 'forest',
    
    rarity: 'common',
    marketValue: 1000,
    researchValue: 2000,
    
    abilities: ['Shield Dust'],
    hiddenAbility: 'Run Away',
    
    levelUpMoves: [
      { level: 1, move: 'たいあたり' },
      { level: 1, move: 'いとをはく' },
      { level: 15, move: 'むしくい' }
    ],
    
    evolutionChain: {
      evolvesTo: 11,
      method: 'level',
      requirement: 7
    },
    
    ecology: {
      temperament: 'docile',
      activityPattern: 'diurnal',
      socialBehavior: 'large_group',
      preferredEnvironment: ['forest'],
      diet: 'herbivore'
    },
    
    trainingDifficulty: 2,
    loyaltyGrowthRate: 1.3,
    healthRecoveryRate: 1.2,
    
    description: '脱皮を繰り返して成長する。体は柔らかく触ると冷たい。',
    flavorText: [
      {
        version: 'Red/Blue',
        text: 'Its short feet are tipped with suction pads that enable it to tirelessly climb slopes and walls.'
      }
    ]
  },

  150: { // Mewtwo
    id: 150,
    name: 'Mewtwo',
    nameJa: 'ミュウツー',
    type1: 'psychic',
    category: 'Genetic Pokémon',
    
    baseStats: {
      hp: 106,
      attack: 110,
      defense: 90,
      specialAttack: 154,
      specialDefense: 90,
      speed: 130,
      total: 680
    },
    
    experienceGroup: 'slow',
    baseExperience: 306,
    catchRate: 3,
    
    height: 2.0,
    weight: 122.0,
    color: 'purple',
    habitat: 'rare',
    
    rarity: 'legendary',
    marketValue: 1000000,
    researchValue: 500000,
    
    abilities: ['Pressure'],
    hiddenAbility: 'Unnerve',
    
    levelUpMoves: [
      { level: 1, move: 'ねんりき' },
      { level: 1, move: 'かなしばり' },
      { level: 11, move: 'バリアー' },
      { level: 22, move: 'サイコキネシス' },
      { level: 33, move: 'じこさいせい' },
      { level: 44, move: 'ミストボール' },
      { level: 55, move: 'アムネジア' },
      { level: 66, move: 'サイコカッター' },
      { level: 77, move: 'パワースワップ' },
      { level: 88, move: 'サイコブレイク' }
    ],
    
    ecology: {
      temperament: 'aggressive',
      activityPattern: 'nocturnal',
      socialBehavior: 'solitary',
      preferredEnvironment: ['cave', 'urban'],
      diet: 'energy'
    },
    
    trainingDifficulty: 10,
    loyaltyGrowthRate: 0.3,
    healthRecoveryRate: 0.8,
    
    description: '遺伝子操作によって作られた人工のポケモン。強大なサイコパワーを持つ。',
    flavorText: [
      {
        version: 'Red/Blue',
        text: 'It was created by a scientist after years of horrific gene splicing and DNA engineering experiments.'
      }
    ]
  },

  74: { // Geodude
    id: 74,
    name: 'Geodude',
    nameJa: 'イシツブテ',
    type1: 'rock',
    type2: 'ground',
    category: 'Rock Pokémon',
    
    baseStats: {
      hp: 40,
      attack: 80,
      defense: 100,
      specialAttack: 30,
      specialDefense: 30,
      speed: 20,
      total: 300
    },
    
    experienceGroup: 'medium_slow',
    baseExperience: 60,
    catchRate: 255,
    
    height: 0.4,
    weight: 20.0,
    color: 'brown',
    habitat: 'mountain',
    
    rarity: 'common',
    marketValue: 3000,
    researchValue: 2500,
    
    abilities: ['Rock Head', 'Sturdy'],
    hiddenAbility: 'Sand Veil',
    
    levelUpMoves: [
      { level: 1, move: 'たいあたり' },
      { level: 1, move: 'まるくなる' },
      { level: 6, move: 'いわおとし' },
      { level: 11, move: 'マグニチュード' },
      { level: 16, move: 'ころがる' },
      { level: 21, move: 'いわなだれ' }
    ],
    
    evolutionChain: {
      evolvesTo: 75,
      method: 'level',
      requirement: 25
    },
    
    ecology: {
      temperament: 'docile',
      activityPattern: 'diurnal',
      socialBehavior: 'large_group',
      preferredEnvironment: ['mountain', 'cave'],
      diet: 'omnivore'
    },
    
    trainingDifficulty: 4,
    loyaltyGrowthRate: 0.9,
    healthRecoveryRate: 0.8,
    
    description: '山道でよく見かける岩のようなポケモン。転がって移動する。',
    flavorText: [
      {
        version: 'Red/Blue',
        text: 'Found in fields and mountains. Mistaking them for boulders, people often step or trip on them.'
      }
    ]
  }
}

/**
 * ポケモンタイプ定義
 */
export const TYPE_DEFINITIONS: Record<PokemonType, { name: string; nameJa: string; color: string }> = {
  normal: { name: 'Normal', nameJa: 'ノーマル', color: '#A8A878' },
  fighting: { name: 'Fighting', nameJa: 'かくとう', color: '#C03028' },
  flying: { name: 'Flying', nameJa: 'ひこう', color: '#A890F0' },
  poison: { name: 'Poison', nameJa: 'どく', color: '#A040A0' },
  ground: { name: 'Ground', nameJa: 'じめん', color: '#E0C068' },
  rock: { name: 'Rock', nameJa: 'いわ', color: '#B8A038' },
  bug: { name: 'Bug', nameJa: 'むし', color: '#A8B820' },
  ghost: { name: 'Ghost', nameJa: 'ゴースト', color: '#705898' },
  steel: { name: 'Steel', nameJa: 'はがね', color: '#B8B8D0' },
  fire: { name: 'Fire', nameJa: 'ほのお', color: '#F08030' },
  water: { name: 'Water', nameJa: 'みず', color: '#6890F0' },
  grass: { name: 'Grass', nameJa: 'くさ', color: '#78C850' },
  electric: { name: 'Electric', nameJa: 'でんき', color: '#F8D030' },
  psychic: { name: 'Psychic', nameJa: 'エスパー', color: '#F85888' },
  ice: { name: 'Ice', nameJa: 'こおり', color: '#98D8D8' },
  dragon: { name: 'Dragon', nameJa: 'ドラゴン', color: '#7038F8' },
  dark: { name: 'Dark', nameJa: 'あく', color: '#705848' },
  fairy: { name: 'Fairy', nameJa: 'フェアリー', color: '#EE99AC' }
}

/**
 * ポケモンデータへのアクセス関数
 */
export const getPokemonSpecies = (id: number): PokemonSpeciesDefinition | undefined => {
  return POKEMON_SPECIES[id]
}

export const getAllPokemonSpecies = (): PokemonSpeciesDefinition[] => {
  return Object.values(POKEMON_SPECIES)
}

export const getPokemonByType = (type: PokemonType): PokemonSpeciesDefinition[] => {
  return getAllPokemonSpecies().filter(pokemon => 
    pokemon.type1 === type || pokemon.type2 === type
  )
}

export const getPokemonByRarity = (rarity: PokemonSpeciesDefinition['rarity']): PokemonSpeciesDefinition[] => {
  return getAllPokemonSpecies().filter(pokemon => pokemon.rarity === rarity)
}

export const getPokemonByHabitat = (habitat: string): PokemonSpeciesDefinition[] => {
  return getAllPokemonSpecies().filter(pokemon => pokemon.habitat === habitat)
}

export const calculatePokemonStats = (
  speciesId: number, 
  level: number, 
  ivs: Record<string, number>
): Record<string, number> => {
  const species = getPokemonSpecies(speciesId)
  if (!species) return {}
  
  const stats: Record<string, number> = {}
  
  // HP計算
  stats.hp = Math.floor(((species.baseStats.hp + ivs.hp) * 2 * level) / 100) + level + 10
  
  // その他のステータス計算
  const statNames = ['attack', 'defense', 'specialAttack', 'specialDefense', 'speed']
  statNames.forEach(stat => {
    const baseStat = species.baseStats[stat as keyof typeof species.baseStats]
    const iv = ivs[stat] || 0
    stats[stat] = Math.floor(((baseStat + iv) * 2 * level) / 100) + 5
  })
  
  return stats
}

export const getEvolutionRequirement = (speciesId: number): string => {
  const species = getPokemonSpecies(speciesId)
  if (!species?.evolutionChain) return 'なし'
  
  const { method, requirement } = species.evolutionChain
  
  switch (method) {
    case 'level':
      return `レベル${requirement}で進化`
    case 'stone':
      return `${requirement}で進化`
    case 'trade':
      return '通信交換で進化'
    case 'friendship':
      return 'なつき度で進化'
    default:
      return '特殊条件で進化'
  }
}

export const calculateCatchDifficulty = (species: PokemonSpeciesDefinition, level: number): number => {
  const baseRate = species.catchRate
  const levelPenalty = Math.max(0, level - 5) * 2
  const rarityMultiplier = {
    'common': 1.0,
    'uncommon': 0.8,
    'rare': 0.6,
    'legendary': 0.1,
    'mythical': 0.05
  }
  
  return Math.max(1, Math.floor(baseRate * rarityMultiplier[species.rarity] - levelPenalty))
}

export const getPokemonMarketValue = (species: PokemonSpeciesDefinition, level: number): number => {
  const baseValue = species.marketValue
  const levelMultiplier = 1 + (level - 1) * 0.05
  return Math.floor(baseValue * levelMultiplier)
}

export const getTypeColor = (type: PokemonType): string => {
  return TYPE_DEFINITIONS[type]?.color || '#68A090'
}

export const getTypeEffectiveness = (attackType: PokemonType, defendType1: PokemonType, defendType2?: PokemonType): number => {
  // 簡易的なタイプ相性表
  const effectiveness: Record<string, Record<string, number>> = {
    fire: { grass: 2, ice: 2, bug: 2, steel: 2, water: 0.5, rock: 0.5, fire: 0.5, dragon: 0.5 },
    water: { fire: 2, ground: 2, rock: 2, water: 0.5, grass: 0.5, dragon: 0.5 },
    electric: { water: 2, flying: 2, electric: 0.5, grass: 0.5, dragon: 0.5, ground: 0 },
    grass: { water: 2, ground: 2, rock: 2, fire: 0.5, grass: 0.5, poison: 0.5, flying: 0.5, bug: 0.5, dragon: 0.5, steel: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5, steel: 0.5, dark: 0 },
    fighting: { normal: 2, ice: 2, rock: 2, dark: 2, steel: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, fairy: 0.5, ghost: 0 }
  }
  
  let multiplier = 1
  
  if (effectiveness[attackType] && effectiveness[attackType][defendType1]) {
    multiplier *= effectiveness[attackType][defendType1]
  }
  
  if (defendType2 && effectiveness[attackType] && effectiveness[attackType][defendType2]) {
    multiplier *= effectiveness[attackType][defendType2]
  }
  
  return multiplier
}