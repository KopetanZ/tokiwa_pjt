import type { LocationDefinition } from './types'

/**
 * 派遣先定義データ
 * 各エリアの特性、出現ポケモン、必要条件を定義
 */

export const LOCATION_DEFINITIONS: Record<number, LocationDefinition> = {
  1: {
    id: 1,
    name: 'Viridian Forest',
    nameJa: 'トキワの森',
    description: 'A peaceful forest near Viridian City, perfect for beginners',
    region: 'Kanto',
    
    difficulty: 'easy',
    environment: 'forest',
    weather: ['sunny', 'rainy'],
    
    baseDuration: 2,
    dangerLevel: 2,
    explorationReward: 1500,
    
    pokemonEncounters: [
      {
        speciesId: 10, // Caterpie
        rarity: 'common',
        encounterRate: 0.4,
        levelRange: [2, 5],
        timeOfDay: 'day'
      },
      {
        speciesId: 13, // Weedle
        rarity: 'common',
        encounterRate: 0.3,
        levelRange: [2, 4],
        timeOfDay: 'day'
      },
      {
        speciesId: 16, // Pidgey
        rarity: 'common',
        encounterRate: 0.25,
        levelRange: [3, 6]
      },
      {
        speciesId: 25, // Pikachu
        rarity: 'uncommon',
        encounterRate: 0.05,
        levelRange: [3, 6]
      }
    ],
    
    requiredSkills: {
      exploration: 2,
      capture: 1
    },
    
    recommendedJobs: ['ranger', 'breeder'],
    
    unlockConditions: {},
    
    specialEvents: [
      {
        id: 'forest_berry_discovery',
        name: 'Berry Discovery',
        description: 'ポケモンがきのみを見つけました',
        triggerRate: 0.2,
        effects: [
          { type: 'money_bonus', value: 500 }
        ]
      },
      {
        id: 'trainer_encounter',
        name: 'Young Trainer Encounter',
        description: '若いトレーナーとの出会い',
        triggerRate: 0.1,
        effects: [
          { type: 'experience_bonus', value: 100 }
        ]
      }
    ],
    
    environmentalEffects: {
      weatherImpact: {
        'sunny': 1.1,
        'rainy': 0.9
      },
      timeOfDayBonus: {
        'morning': 1.1,
        'day': 1.0,
        'evening': 0.9,
        'night': 0.8
      },
      skillModifiers: {
        'capture': 0.1,
        'exploration': 0.2
      }
    }
  },

  2: {
    id: 2,
    name: 'Route 22',
    nameJa: '22番道路',
    description: 'A winding path connecting Viridian City to the Pokemon League',
    region: 'Kanto',
    
    difficulty: 'normal',
    environment: 'grassland',
    weather: ['sunny', 'rainy', 'stormy'],
    
    baseDuration: 3,
    dangerLevel: 4,
    explorationReward: 2200,
    
    pokemonEncounters: [
      {
        speciesId: 19, // Rattata
        rarity: 'common',
        encounterRate: 0.35,
        levelRange: [4, 8],
        timeOfDay: 'night'
      },
      {
        speciesId: 21, // Spearow
        rarity: 'common',
        encounterRate: 0.3,
        levelRange: [5, 9]
      },
      {
        speciesId: 29, // Nidoran♀
        rarity: 'uncommon',
        encounterRate: 0.15,
        levelRange: [4, 7]
      },
      {
        speciesId: 32, // Nidoran♂
        rarity: 'uncommon',
        encounterRate: 0.15,
        levelRange: [4, 7]
      },
      {
        speciesId: 56, // Mankey
        rarity: 'uncommon',
        encounterRate: 0.05,
        levelRange: [5, 10]
      }
    ],
    
    requiredSkills: {
      exploration: 3,
      battle: 2,
      capture: 2
    },
    
    recommendedJobs: ['ranger', 'battler'],
    
    unlockConditions: {
      playerLevel: 2,
      completedLocations: [1]
    },
    
    specialEvents: [
      {
        id: 'wild_pokemon_battle',
        name: 'Wild Pokemon Challenge',
        description: '野生のポケモンが戦いを挑んできました',
        triggerRate: 0.15,
        effects: [
          { type: 'experience_bonus', value: 200 },
          { type: 'danger', value: 1 }
        ]
      },
      {
        id: 'rival_encounter',
        name: 'Rival Trainer',
        description: 'ライバルトレーナーとの遭遇',
        triggerRate: 0.05,
        effects: [
          { type: 'experience_bonus', value: 500 },
          { type: 'money_bonus', value: 1000 }
        ]
      }
    ],
    
    environmentalEffects: {
      weatherImpact: {
        'sunny': 1.0,
        'rainy': 0.8,
        'stormy': 0.6
      },
      timeOfDayBonus: {
        'morning': 1.0,
        'day': 1.1,
        'evening': 1.0,
        'night': 1.2
      },
      skillModifiers: {
        'battle': 0.2,
        'exploration': 0.1
      }
    }
  },

  3: {
    id: 3,
    name: 'Mt. Silver',
    nameJa: 'シロガネ山',
    description: 'A treacherous mountain known for its powerful wild Pokemon',
    region: 'Johto',
    
    difficulty: 'hard',
    environment: 'mountain',
    weather: ['sunny', 'snowy', 'stormy'],
    
    baseDuration: 6,
    dangerLevel: 8,
    explorationReward: 5000,
    
    pokemonEncounters: [
      {
        speciesId: 74, // Geodude
        rarity: 'common',
        encounterRate: 0.3,
        levelRange: [15, 25]
      },
      {
        speciesId: 95, // Onix
        rarity: 'uncommon',
        encounterRate: 0.2,
        levelRange: [20, 30]
      },
      {
        speciesId: 126, // Magmar
        rarity: 'rare',
        encounterRate: 0.1,
        levelRange: [25, 35]
      },
      {
        speciesId: 144, // Articuno
        rarity: 'legendary',
        encounterRate: 0.001,
        levelRange: [50, 50],
        timeOfDay: 'night'
      }
    ],
    
    requiredSkills: {
      exploration: 7,
      battle: 6,
      healing: 4,
      capture: 5
    },
    
    recommendedJobs: ['battler', 'medic', 'ranger'],
    
    unlockConditions: {
      playerLevel: 8,
      reputation: 50,
      completedLocations: [1, 2, 4, 5]
    },
    
    specialEvents: [
      {
        id: 'avalanche',
        name: 'Avalanche Warning',
        description: '雪崩の危険があります',
        triggerRate: 0.1,
        effects: [
          { type: 'danger', value: 3 }
        ]
      },
      {
        id: 'rare_mineral',
        name: 'Rare Mineral Discovery',
        description: '貴重な鉱物を発見しました',
        triggerRate: 0.05,
        effects: [
          { type: 'money_bonus', value: 10000 }
        ]
      },
      {
        id: 'legendary_sighting',
        name: 'Legendary Pokemon Sighting',
        description: '伝説のポケモンの気配を感じます',
        triggerRate: 0.02,
        effects: [
          { type: 'pokemon_encounter', value: 1 }
        ]
      }
    ],
    
    environmentalEffects: {
      weatherImpact: {
        'sunny': 1.0,
        'snowy': 0.7,
        'stormy': 0.5
      },
      timeOfDayBonus: {
        'morning': 0.9,
        'day': 1.0,
        'evening': 0.9,
        'night': 1.3
      },
      skillModifiers: {
        'battle': 0.3,
        'healing': 0.2,
        'exploration': -0.1
      }
    }
  },

  4: {
    id: 4,
    name: 'Cerulean Cave',
    nameJa: 'ハナダの洞窟',
    description: 'A mysterious cave filled with psychic energy',
    region: 'Kanto',
    
    difficulty: 'extreme',
    environment: 'cave',
    weather: ['foggy'],
    
    baseDuration: 8,
    dangerLevel: 10,
    explorationReward: 8000,
    
    pokemonEncounters: [
      {
        speciesId: 42, // Golbat
        rarity: 'common',
        encounterRate: 0.4,
        levelRange: [30, 40]
      },
      {
        speciesId: 65, // Alakazam
        rarity: 'rare',
        encounterRate: 0.1,
        levelRange: [35, 45]
      },
      {
        speciesId: 150, // Mewtwo
        rarity: 'legendary',
        encounterRate: 0.005,
        levelRange: [70, 70]
      }
    ],
    
    requiredSkills: {
      exploration: 8,
      battle: 8,
      research: 6,
      healing: 5,
      capture: 7
    },
    
    recommendedJobs: ['researcher', 'battler', 'medic'],
    
    unlockConditions: {
      playerLevel: 15,
      reputation: 100,
      specialRequirements: ['elite_four_champion', 'psychic_research_complete']
    },
    
    specialEvents: [
      {
        id: 'psychic_anomaly',
        name: 'Psychic Anomaly',
        description: 'サイコパワーの異常を感知しました',
        triggerRate: 0.2,
        effects: [
          { type: 'skill_bonus', value: 2, duration: 24 },
          { type: 'danger', value: 2 }
        ]
      },
      {
        id: 'ancient_technology',
        name: 'Ancient Technology',
        description: '古代の技術を発見しました',
        triggerRate: 0.03,
        effects: [
          { type: 'money_bonus', value: 20000 }
        ]
      }
    ],
    
    environmentalEffects: {
      weatherImpact: {
        'foggy': 0.8
      },
      timeOfDayBonus: {
        'morning': 1.0,
        'day': 1.0,
        'evening': 1.0,
        'night': 1.0
      },
      skillModifiers: {
        'research': 0.4,
        'battle': 0.2,
        'exploration': -0.2
      }
    }
  },

  5: {
    id: 5,
    name: 'Safari Zone',
    nameJa: 'サファリゾーン',
    description: 'A protected nature reserve with diverse Pokemon habitats',
    region: 'Kanto',
    
    difficulty: 'normal',
    environment: 'grassland',
    weather: ['sunny', 'rainy'],
    
    baseDuration: 4,
    dangerLevel: 3,
    explorationReward: 3000,
    
    pokemonEncounters: [
      {
        speciesId: 111, // Rhyhorn
        rarity: 'common',
        encounterRate: 0.25,
        levelRange: [10, 20]
      },
      {
        speciesId: 115, // Kangaskhan
        rarity: 'uncommon',
        encounterRate: 0.15,
        levelRange: [15, 25]
      },
      {
        speciesId: 127, // Pinsir
        rarity: 'uncommon',
        encounterRate: 0.1,
        levelRange: [15, 25]
      },
      {
        speciesId: 128, // Tauros
        rarity: 'rare',
        encounterRate: 0.08,
        levelRange: [18, 28]
      },
      {
        speciesId: 113, // Chansey
        rarity: 'rare',
        encounterRate: 0.02,
        levelRange: [20, 30]
      }
    ],
    
    requiredSkills: {
      capture: 5,
      exploration: 4,
      research: 3
    },
    
    recommendedJobs: ['ranger', 'researcher', 'breeder'],
    
    unlockConditions: {
      playerLevel: 5,
      reputation: 25,
      specialRequirements: ['safari_zone_pass']
    },
    
    specialEvents: [
      {
        id: 'warden_gift',
        name: 'Warden\'s Gift',
        description: 'ゾーンワーデンからの贈り物',
        triggerRate: 0.1,
        effects: [
          { type: 'money_bonus', value: 2000 }
        ]
      },
      {
        id: 'rare_pokemon_area',
        name: 'Rare Pokemon Area',
        description: '珍しいポケモンの生息地を発見',
        triggerRate: 0.05,
        effects: [
          { type: 'pokemon_encounter', value: 1 },
          { type: 'experience_bonus', value: 300 }
        ]
      }
    ],
    
    environmentalEffects: {
      weatherImpact: {
        'sunny': 1.2,
        'rainy': 1.0
      },
      timeOfDayBonus: {
        'morning': 1.1,
        'day': 1.2,
        'evening': 1.1,
        'night': 0.8
      },
      skillModifiers: {
        'capture': 0.3,
        'research': 0.2,
        'exploration': 0.1
      }
    }
  }
}

/**
 * 派遣先データへのアクセス関数
 */
export const getLocationDefinition = (id: number): LocationDefinition | undefined => {
  return LOCATION_DEFINITIONS[id]
}

export const getAllLocations = (): LocationDefinition[] => {
  return Object.values(LOCATION_DEFINITIONS)
}

export const getLocationsByDifficulty = (difficulty: LocationDefinition['difficulty']): LocationDefinition[] => {
  return getAllLocations().filter(loc => loc.difficulty === difficulty)
}

export const getLocationsByEnvironment = (environment: LocationDefinition['environment']): LocationDefinition[] => {
  return getAllLocations().filter(loc => loc.environment === environment)
}

export const getUnlockedLocations = (
  playerLevel: number, 
  reputation: number, 
  completedLocations: number[], 
  specialRequirements: string[]
): LocationDefinition[] => {
  return getAllLocations().filter(loc => {
    const conditions = loc.unlockConditions
    
    // プレイヤーレベルチェック
    if (conditions.playerLevel && playerLevel < conditions.playerLevel) return false
    
    // 評判チェック
    if (conditions.reputation && reputation < conditions.reputation) return false
    
    // 前提派遣先チェック
    if (conditions.completedLocations && 
        !conditions.completedLocations.every(id => completedLocations.includes(id))) return false
    
    // 特別条件チェック
    if (conditions.specialRequirements && 
        !conditions.specialRequirements.every(req => specialRequirements.includes(req))) return false
    
    return true
  })
}

export const getRecommendedLocationsForTrainer = (trainerJob: string, trainerLevel: number): LocationDefinition[] => {
  return getAllLocations().filter(loc => {
    // 推奨職業チェック
    if (!loc.recommendedJobs.includes(trainerJob as any)) return false
    
    // 難易度とレベルの適合性チェック
    const difficultyLevel = {
      'easy': 3,
      'normal': 6,
      'hard': 10,
      'extreme': 15
    }
    
    return trainerLevel >= difficultyLevel[loc.difficulty] - 2
  })
}

export const calculateLocationReward = (
  location: LocationDefinition, 
  trainerLevel: number, 
  success: boolean
): number => {
  let reward = location.explorationReward
  
  // レベルボーナス
  reward *= (1 + (trainerLevel - 1) * 0.1)
  
  // 成功ボーナス
  if (success) {
    reward *= 1.2
  } else {
    reward *= 0.3
  }
  
  return Math.floor(reward)
}

export const getPokemonEncounterChance = (
  location: LocationDefinition, 
  timeOfDay?: string, 
  weather?: string
): LocationDefinition['pokemonEncounters'] => {
  return location.pokemonEncounters.filter(encounter => {
    if (encounter.timeOfDay && timeOfDay && encounter.timeOfDay !== timeOfDay) return false
    return true
  }).map(encounter => ({
    ...encounter,
    encounterRate: encounter.encounterRate * (weather && location.environmentalEffects.weatherImpact[weather] || 1.0)
  }))
}