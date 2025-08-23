/**
 * ポケモン種族データベース
 * 全ポケモンの基本データと出現情報を管理
 */

import type { Pokemon } from '@/lib/game-state/types'

export interface PokemonSpecies {
  id: number
  name: string
  nameJa: string
  generation: number
  types: PokemonType[]
  
  // 基礎ステータス
  baseStats: {
    hp: number
    attack: number
    defense: number
    specialAttack: number
    specialDefense: number
    speed: number
    total: number
  }
  
  // 成長・レベル
  growthRate: GrowthRate
  baseExperience: number
  maxLevel: number
  evolutionLevel?: number
  evolutionTo?: number[]
  evolutionFrom?: number
  
  // 出現情報
  rarity: PokemonRarity
  habitat: Habitat[]
  timeOfDay: TimeOfDay[]
  weather: Weather[]
  season: Season[]
  
  // 捕獲情報
  baseCaptureRate: number
  friendshipBase: number
  fleeRate: number
  
  // 能力・特性
  abilities: string[]
  hiddenAbility?: string
  learnableTypes: PokemonType[]
  
  // 経済・価値
  baseValue: number
  rarityMultiplier: number
  
  // メタデータ
  description: string
  category: string
  height: number // cm
  weight: number // kg
  color: string
  shape: string
}

export type PokemonType = 
  | 'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice' 
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug' 
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy'

export type PokemonRarity = 'common' | 'uncommon' | 'rare' | 'ultra_rare' | 'legendary' | 'mythical'

export type GrowthRate = 'fast' | 'medium_fast' | 'medium_slow' | 'slow' | 'erratic' | 'fluctuating'

export type Habitat = 
  | 'grassland' | 'forest' | 'waters_edge' | 'sea' | 'cave' | 'mountain' 
  | 'rough_terrain' | 'urban' | 'rare'

export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night' | 'any'

export type Weather = 'sunny' | 'rain' | 'snow' | 'fog' | 'sandstorm' | 'any'

export type Season = 'spring' | 'summer' | 'autumn' | 'winter' | 'any'

/**
 * ポケモン種族データベース
 */
export class PokemonDatabase {
  private static instance: PokemonDatabase
  private speciesData = new Map<number, PokemonSpecies>()
  private typeChart = new Map<string, TypeEffectiveness>()
  
  private constructor() {
    this.initializeSpeciesData()
    this.initializeTypeChart()
  }
  
  static getInstance(): PokemonDatabase {
    if (!PokemonDatabase.instance) {
      PokemonDatabase.instance = new PokemonDatabase()
    }
    return PokemonDatabase.instance
  }
  
  /**
   * ポケモン種族データを取得
   */
  getSpecies(id: number): PokemonSpecies | null {
    return this.speciesData.get(id) || null
  }
  
  /**
   * 全ポケモン種族を取得
   */
  getAllSpecies(): PokemonSpecies[] {
    return Array.from(this.speciesData.values())
  }
  
  /**
   * 条件に合致するポケモンを検索
   */
  searchPokemon(criteria: PokemonSearchCriteria): PokemonSpecies[] {
    return this.getAllSpecies().filter(species => 
      this.matchesCriteria(species, criteria)
    )
  }
  
  /**
   * 地域別出現ポケモンを取得
   */
  getPokemonByLocation(locationId: number): LocationPokemonData {
    const locationMap: Record<number, {
      commonPool: number[]
      uncommonPool: number[]
      rarePool: number[]
      ultraRarePool: number[]
      legendaryPool: number[]
    }> = {
      1: { // 初心者の森
        commonPool: [10, 13, 16, 19, 21, 25, 32, 35, 39, 52, 54, 69, 74, 92, 129],
        uncommonPool: [1, 4, 7, 133, 147, 104, 111, 114],
        rarePool: [2, 5, 8, 148, 95, 127],
        ultraRarePool: [3, 6, 9, 149, 142],
        legendaryPool: []
      },
      2: { // 草原地帯
        commonPool: [16, 17, 19, 20, 21, 22, 25, 27, 29, 32, 46, 48, 54, 77, 83, 84, 115, 128, 129],
        uncommonPool: [18, 26, 28, 30, 33, 47, 49, 55, 78, 85, 116, 147],
        rarePool: [31, 34, 79, 117, 148, 130],
        ultraRarePool: [149, 131, 132, 142],
        legendaryPool: [144]
      },
      3: { // 山岳地帯
        commonPool: [41, 42, 56, 57, 66, 67, 74, 75, 95, 104, 105, 111, 112, 126, 129],
        uncommonPool: [68, 76, 106, 107, 127, 147],
        rarePool: [125, 148, 142],
        ultraRarePool: [149],
        legendaryPool: [146]
      },
      4: { // 水辺・洞窟
        commonPool: [41, 42, 54, 55, 60, 61, 72, 73, 90, 98, 99, 118, 119, 129],
        uncommonPool: [62, 79, 80, 91, 120, 140, 141, 147],
        rarePool: [121, 131, 138, 139, 148],
        ultraRarePool: [130, 142, 149],
        legendaryPool: [150, 151]
      },
      5: { // 危険地域
        commonPool: [41, 42, 56, 57, 66, 67, 92, 93, 104, 105, 109, 110, 129],
        uncommonPool: [57, 68, 94, 106, 107, 111, 112, 126],
        rarePool: [125, 127, 142, 143],
        ultraRarePool: [148, 149],
        legendaryPool: [144, 145, 146, 150, 151]
      }
    }
    
    return locationMap[locationId] || locationMap[1]
  }
  
  /**
   * タイプ相性を取得
   */
  getTypeEffectiveness(attackingType: PokemonType, defendingType: PokemonType): number {
    const key = `${attackingType}_${defendingType}`
    return this.typeChart.get(key)?.effectiveness || 1.0
  }
  
  /**
   * ポケモンの推定価値を計算
   */
  calculatePokemonValue(species: PokemonSpecies, level: number, ivs: Pokemon['ivs']): number {
    const baseValue = species.baseValue
    const rarityBonus = this.getRarityValueMultiplier(species.rarity)
    const levelBonus = 1 + (level - 1) * 0.1
    const ivBonus = 1 + (this.calculateAverageIV(ivs) - 15) * 0.02
    
    return Math.floor(baseValue * rarityBonus * levelBonus * ivBonus)
  }
  
  /**
   * 進化可能かチェック
   */
  canEvolve(species: PokemonSpecies, level: number): boolean {
    return !!(species.evolutionLevel && level >= species.evolutionLevel && species.evolutionTo)
  }
  
  /**
   * ランダムな性格を生成
   */
  generateRandomNature(): PokemonNature {
    const natures: PokemonNature[] = [
      'がんばりや', 'さみしがり', 'いじっぱり', 'やんちゃ', 'ゆうかん',
      'ずぶとい', 'すなお', 'のんき', 'わんぱく', 'のうてんき',
      'おくびょう', 'せっかち', 'まじめ', 'ようき', 'むじゃき',
      'ひかえめ', 'おっとり', 'れいせい', 'てれや', 'なまいき'
    ]
    
    return natures[Math.floor(Math.random() * natures.length)]
  }
  
  /**
   * 個体値をランダム生成（品質指定可能）
   */
  generateRandomIVs(quality: number = 0.5): Pokemon['ivs'] {
    const generateIV = () => {
      const base = Math.floor(Math.random() * 32)
      const bonus = Math.floor((quality - 0.5) * 32)
      return Math.max(0, Math.min(31, base + bonus))
    }
    
    return {
      hp: generateIV(),
      attack: generateIV(),
      defense: generateIV(),
      specialAttack: generateIV(),
      specialDefense: generateIV(),
      speed: generateIV()
    }
  }
  
  /**
   * レベルから経験値を計算
   */
  calculateExperienceForLevel(species: PokemonSpecies, level: number): number {
    switch (species.growthRate) {
      case 'fast':
        return Math.floor(0.8 * Math.pow(level, 3))
      case 'medium_fast':
        return Math.floor(Math.pow(level, 3))
      case 'medium_slow':
        return Math.floor(1.2 * Math.pow(level, 3) - 15 * Math.pow(level, 2) + 100 * level - 140)
      case 'slow':
        return Math.floor(1.25 * Math.pow(level, 3))
      default:
        return Math.floor(Math.pow(level, 3)) // デフォルトは medium_fast
    }
  }
  
  /**
   * プライベートヘルパーメソッド
   */
  private matchesCriteria(species: PokemonSpecies, criteria: PokemonSearchCriteria): boolean {
    if (criteria.types && !criteria.types.some(type => species.types.includes(type))) {
      return false
    }
    
    if (criteria.rarity && !criteria.rarity.includes(species.rarity)) {
      return false
    }
    
    if (criteria.habitat && !criteria.habitat.some(habitat => species.habitat.includes(habitat))) {
      return false
    }
    
    if (criteria.generation && species.generation !== criteria.generation) {
      return false
    }
    
    if (criteria.minBaseTotal && species.baseStats.total < criteria.minBaseTotal) {
      return false
    }
    
    if (criteria.maxBaseTotal && species.baseStats.total > criteria.maxBaseTotal) {
      return false
    }
    
    return true
  }
  
  private getRarityValueMultiplier(rarity: PokemonRarity): number {
    const multipliers = {
      common: 1.0,
      uncommon: 1.5,
      rare: 2.5,
      ultra_rare: 4.0,
      legendary: 10.0,
      mythical: 20.0
    }
    
    return multipliers[rarity] || 1.0
  }
  
  private calculateAverageIV(ivs: Pokemon['ivs']): number {
    return (ivs.hp + ivs.attack + ivs.defense + ivs.specialAttack + ivs.specialDefense + ivs.speed) / 6
  }
  
  /**
   * 種族データの初期化
   */
  private initializeSpeciesData(): void {
    const speciesData: PokemonSpecies[] = [
      // 第一世代 - 草タイプスターター系統
      {
        id: 1,
        name: 'Bulbasaur',
        nameJa: 'フシギダネ',
        generation: 1,
        types: ['grass', 'poison'],
        baseStats: { hp: 45, attack: 49, defense: 49, specialAttack: 65, specialDefense: 65, speed: 45, total: 318 },
        growthRate: 'medium_slow',
        baseExperience: 64,
        maxLevel: 100,
        evolutionLevel: 16,
        evolutionTo: [2],
        rarity: 'uncommon',
        habitat: ['grassland', 'forest'],
        timeOfDay: ['day'],
        weather: ['sunny', 'any'],
        season: ['spring', 'summer'],
        baseCaptureRate: 45,
        friendshipBase: 70,
        fleeRate: 0.1,
        abilities: ['しんりょく'],
        hiddenAbility: 'ようりょくそ',
        learnableTypes: ['grass', 'poison', 'normal'],
        baseValue: 1500,
        rarityMultiplier: 1.5,
        description: 'たねポケモン。背中の種から栄養を取って大きくなる。',
        category: 'たねポケモン',
        height: 70,
        weight: 6900,
        color: 'green',
        shape: 'quadruped'
      },
      
      {
        id: 2,
        name: 'Ivysaur',
        nameJa: 'フシギソウ',
        generation: 1,
        types: ['grass', 'poison'],
        baseStats: { hp: 60, attack: 62, defense: 63, specialAttack: 80, specialDefense: 80, speed: 60, total: 405 },
        growthRate: 'medium_slow',
        baseExperience: 142,
        maxLevel: 100,
        evolutionLevel: 32,
        evolutionTo: [3],
        evolutionFrom: 1,
        rarity: 'rare',
        habitat: ['grassland', 'forest'],
        timeOfDay: ['day'],
        weather: ['sunny', 'any'],
        season: ['spring', 'summer'],
        baseCaptureRate: 45,
        friendshipBase: 70,
        fleeRate: 0.05,
        abilities: ['しんりょく'],
        hiddenAbility: 'ようりょくそ',
        learnableTypes: ['grass', 'poison', 'normal'],
        baseValue: 3000,
        rarityMultiplier: 2.5,
        description: '背中のつぼみが膨らむとあまい香りが強くなる。',
        category: 'たねポケモン',
        height: 100,
        weight: 13000,
        color: 'green',
        shape: 'quadruped'
      },
      
      // 炎タイプスターター系統
      {
        id: 4,
        name: 'Charmander',
        nameJa: 'ヒトカゲ',
        generation: 1,
        types: ['fire'],
        baseStats: { hp: 39, attack: 52, defense: 43, specialAttack: 60, specialDefense: 50, speed: 65, total: 309 },
        growthRate: 'medium_slow',
        baseExperience: 62,
        maxLevel: 100,
        evolutionLevel: 16,
        evolutionTo: [5],
        rarity: 'uncommon',
        habitat: ['mountain', 'cave'],
        timeOfDay: ['day', 'evening'],
        weather: ['sunny', 'any'],
        season: ['summer', 'autumn'],
        baseCaptureRate: 45,
        friendshipBase: 70,
        fleeRate: 0.1,
        abilities: ['もうか'],
        hiddenAbility: 'サンパワー',
        learnableTypes: ['fire', 'normal', 'fighting'],
        baseValue: 1500,
        rarityMultiplier: 1.5,
        description: 'しっぽの炎の勢いで健康状態がわかる。',
        category: 'とかげポケモン',
        height: 60,
        weight: 8500,
        color: 'red',
        shape: 'upright'
      },
      
      // 水タイプスターター系統
      {
        id: 7,
        name: 'Squirtle',
        nameJa: 'ゼニガメ',
        generation: 1,
        types: ['water'],
        baseStats: { hp: 44, attack: 48, defense: 65, specialAttack: 50, specialDefense: 64, speed: 43, total: 314 },
        growthRate: 'medium_slow',
        baseExperience: 63,
        maxLevel: 100,
        evolutionLevel: 16,
        evolutionTo: [8],
        rarity: 'uncommon',
        habitat: ['waters_edge', 'sea'],
        timeOfDay: ['any'],
        weather: ['rain', 'any'],
        season: ['any'],
        baseCaptureRate: 45,
        friendshipBase: 70,
        fleeRate: 0.1,
        abilities: ['げきりゅう'],
        hiddenAbility: 'あめうけざら',
        learnableTypes: ['water', 'normal', 'fighting'],
        baseValue: 1500,
        rarityMultiplier: 1.5,
        description: '甲羅に閉じこもって身を守る。',
        category: 'かめのこポケモン',
        height: 50,
        weight: 9000,
        color: 'blue',
        shape: 'upright'
      },
      
      // 一般ポケモン
      {
        id: 10,
        name: 'Caterpie',
        nameJa: 'キャタピー',
        generation: 1,
        types: ['bug'],
        baseStats: { hp: 45, attack: 30, defense: 35, specialAttack: 20, specialDefense: 20, speed: 45, total: 195 },
        growthRate: 'medium_fast',
        baseExperience: 39,
        maxLevel: 100,
        evolutionLevel: 7,
        evolutionTo: [11],
        rarity: 'common',
        habitat: ['forest', 'grassland'],
        timeOfDay: ['day'],
        weather: ['any'],
        season: ['spring', 'summer'],
        baseCaptureRate: 255,
        friendshipBase: 70,
        fleeRate: 0.25,
        abilities: ['りんぷん'],
        learnableTypes: ['bug', 'normal'],
        baseValue: 200,
        rarityMultiplier: 1.0,
        description: 'においの強い足を出して敵を近づけないようにしている。',
        category: 'いもむしポケモン',
        height: 30,
        weight: 2900,
        color: 'green',
        shape: 'bug'
      },
      
      {
        id: 25,
        name: 'Pikachu',
        nameJa: 'ピカチュウ',
        generation: 1,
        types: ['electric'],
        baseStats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90, total: 320 },
        growthRate: 'medium_fast',
        baseExperience: 112,
        maxLevel: 100,
        rarity: 'uncommon',
        habitat: ['forest', 'urban'],
        timeOfDay: ['any'],
        weather: ['any'],
        season: ['any'],
        baseCaptureRate: 190,
        friendshipBase: 70,
        fleeRate: 0.15,
        abilities: ['せいでんき'],
        hiddenAbility: 'ひらいしん',
        learnableTypes: ['electric', 'normal', 'fighting'],
        baseValue: 2000,
        rarityMultiplier: 1.5,
        description: 'ほっぺたの電気袋に電気を貯める。',
        category: 'ねずみポケモン',
        height: 40,
        weight: 6000,
        color: 'yellow',
        shape: 'upright'
      },
      
      {
        id: 133,
        name: 'Eevee',
        nameJa: 'イーブイ',
        generation: 1,
        types: ['normal'],
        baseStats: { hp: 55, attack: 55, defense: 50, specialAttack: 45, specialDefense: 65, speed: 55, total: 325 },
        growthRate: 'medium_fast',
        baseExperience: 65,
        maxLevel: 100,
        evolutionTo: [134, 135, 136], // 進化先が複数
        rarity: 'rare',
        habitat: ['urban', 'grassland'],
        timeOfDay: ['any'],
        weather: ['any'],
        season: ['any'],
        baseCaptureRate: 45,
        friendshipBase: 70,
        fleeRate: 0.1,
        abilities: ['にげあし', 'てきおうりょく'],
        hiddenAbility: 'きけんよち',
        learnableTypes: ['normal', 'fighting', 'dark'],
        baseValue: 4000,
        rarityMultiplier: 2.5,
        description: '遺伝子が不安定で様々な進化の可能性を持つ。',
        category: 'しんかポケモン',
        height: 30,
        weight: 6500,
        color: 'brown',
        shape: 'quadruped'
      },
      
      // 伝説のポケモン
      {
        id: 144,
        name: 'Articuno',
        nameJa: 'フリーザー',
        generation: 1,
        types: ['ice', 'flying'],
        baseStats: { hp: 90, attack: 85, defense: 100, specialAttack: 95, specialDefense: 125, speed: 85, total: 580 },
        growthRate: 'slow',
        baseExperience: 261,
        maxLevel: 100,
        rarity: 'legendary',
        habitat: ['mountain', 'cave'],
        timeOfDay: ['night', 'evening'],
        weather: ['snow', 'fog'],
        season: ['winter'],
        baseCaptureRate: 3,
        friendshipBase: 35,
        fleeRate: 0.01,
        abilities: ['プレッシャー'],
        hiddenAbility: 'ゆきがくれ',
        learnableTypes: ['ice', 'flying', 'psychic'],
        baseValue: 50000,
        rarityMultiplier: 10.0,
        description: '美しく青い羽毛に覆われた伝説の鳥ポケモン。',
        category: 'れいとうポケモン',
        height: 170,
        weight: 55400,
        color: 'blue',
        shape: 'wings'
      },
      
      {
        id: 150,
        name: 'Mewtwo',
        nameJa: 'ミュウツー',
        generation: 1,
        types: ['psychic'],
        baseStats: { hp: 106, attack: 110, defense: 90, specialAttack: 154, specialDefense: 90, speed: 130, total: 680 },
        growthRate: 'slow',
        baseExperience: 306,
        maxLevel: 100,
        rarity: 'mythical',
        habitat: ['rare'],
        timeOfDay: ['night'],
        weather: ['any'],
        season: ['any'],
        baseCaptureRate: 3,
        friendshipBase: 0,
        fleeRate: 0.005,
        abilities: ['プレッシャー'],
        hiddenAbility: 'きんちょうかん',
        learnableTypes: ['psychic', 'fighting', 'electric'],
        baseValue: 100000,
        rarityMultiplier: 20.0,
        description: '遺伝子操作によって作られた人工のポケモン。',
        category: 'いでんしポケモン',
        height: 200,
        weight: 122000,
        color: 'purple',
        shape: 'upright'
      }
    ]
    
    // データベースに登録
    speciesData.forEach(species => {
      this.speciesData.set(species.id, species)
    })
    
    console.log(`🔍 ${speciesData.length}種のポケモンデータを初期化しました`)
  }
  
  /**
   * タイプ相性チャートの初期化
   */
  private initializeTypeChart(): void {
    // 簡略化したタイプ相性（一部のみ実装）
    const effectiveness = [
      // 攻撃タイプ_防御タイプ: 効果倍率
      { attack: 'fire', defend: 'grass', effectiveness: 2.0 },
      { attack: 'fire', defend: 'water', effectiveness: 0.5 },
      { attack: 'water', defend: 'fire', effectiveness: 2.0 },
      { attack: 'water', defend: 'grass', effectiveness: 0.5 },
      { attack: 'grass', defend: 'water', effectiveness: 2.0 },
      { attack: 'grass', defend: 'fire', effectiveness: 0.5 },
      { attack: 'electric', defend: 'water', effectiveness: 2.0 },
      { attack: 'electric', defend: 'flying', effectiveness: 2.0 },
      { attack: 'electric', defend: 'ground', effectiveness: 0.0 },
    ]
    
    effectiveness.forEach(({ attack, defend, effectiveness: eff }) => {
      this.typeChart.set(`${attack}_${defend}`, { effectiveness: eff })
    })
  }
}

// インターフェース定義
export interface PokemonSearchCriteria {
  types?: PokemonType[]
  rarity?: PokemonRarity[]
  habitat?: Habitat[]
  generation?: number
  minBaseTotal?: number
  maxBaseTotal?: number
}

export interface LocationPokemonData {
  commonPool: number[]
  uncommonPool: number[]
  rarePool: number[]
  ultraRarePool: number[]
  legendaryPool: number[]
}

export interface TypeEffectiveness {
  effectiveness: number
}

export type PokemonNature = string

// シングルトンインスタンス
export const pokemonDatabase = PokemonDatabase.getInstance()