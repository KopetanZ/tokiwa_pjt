/**
 * ポケモン個体生成システム
 * 動的な個体値・性格・能力バリエーション管理
 */

import type { Pokemon } from '@/lib/game-state/types'
import type { PokemonSpecies, PokemonNature } from './PokemonDatabase'
import { pokemonDatabase } from './PokemonDatabase'
import { pokeAPIService } from './PokeAPIService'
import { performanceMonitor, memoize } from '@/lib/performance/PerformanceOptimizer'

export interface PokemonGenerationOptions {
  species?: PokemonSpecies
  speciesId?: number
  level?: number
  ivQuality?: number // 0.0-1.0, 個体値の品質
  nature?: PokemonNature
  shinyChance?: number // 色違い確率
  forceShiny?: boolean
  trainer?: string
  location?: number
  captureMethod?: string
  customIVs?: IndividualValues
  customNature?: PokemonNature
  customMoves?: string[]
}

export interface IndividualValues {
  hp: number
  attack: number
  defense: number
  specialAttack: number
  specialDefense: number
  speed: number
  total: number
  grade: 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS'
}

export interface PokemonNatureEffect {
  name: PokemonNature
  nameEn: string
  increasedStat?: keyof Omit<Pokemon['ivs'], 'total'>
  decreasedStat?: keyof Omit<Pokemon['ivs'], 'total'>
  modifier: number // 1.1 for increased, 0.9 for decreased, 1.0 for neutral
  description: string
  personality: {
    aggressive: number // -5 to +5
    friendly: number
    energetic: number
    intelligent: number
    brave: number
  }
}

export interface ShinyVariant {
  isShiny: boolean
  colorVariant: string
  sparkleEffect: boolean
  rarity: 'normal' | 'shiny' | 'ultra_shiny'
  valueMultiplier: number
}

export interface PokemonStats {
  hp: number
  maxHp: number
  attack: number
  defense: number
  specialAttack: number
  specialDefense: number
  speed: number
  accuracy: number
  evasion: number
  criticalRate: number
}

/**
 * ポケモン個体生成システム
 */
export class PokemonGenerator {
  private static instance: PokemonGenerator
  private natureDatabase = new Map<PokemonNature, PokemonNatureEffect>()
  private qualityDistribution = new Map<string, number>()
  
  private constructor() {
    this.initializeNatureDatabase()
    this.initializeQualityDistribution()
  }
  
  static getInstance(): PokemonGenerator {
    if (!PokemonGenerator.instance) {
      PokemonGenerator.instance = new PokemonGenerator()
    }
    return PokemonGenerator.instance
  }
  
  /**
   * ポケモン個体を生成
   */
  async generatePokemon(options: PokemonGenerationOptions): Promise<Pokemon> {
    return performanceMonitor.measureAsync('pokemon_generation', async () => {
      // 種族データの取得
      let species = options.species
      if (!species && options.speciesId) {
        species = pokemonDatabase.getSpecies(options.speciesId) || undefined
        if (!species) {
          // PokeAPIから動的取得
          const apiSpecies = await pokeAPIService.getEnhancedPokemonData(options.speciesId)
          species = apiSpecies || undefined
        }
      }
      
      if (!species) {
        throw new Error('ポケモン種族データが見つかりません')
      }
      
      // 基本パラメータの決定
      const level = options.level || this.generateRandomLevel(species)
      const nature = options.customNature || options.nature || this.generateRandomNature()
      const ivs = options.customIVs || this.generateIndividualValues(options.ivQuality || 0.5, species)
      const shiny = this.generateShinyVariant(options.shinyChance || 0.001, options.forceShiny)
      
      // ステータス計算
      const stats = this.calculateStats(species, level, ivs, nature)
      
      // ユニークID生成
      const pokemonId = this.generateUniquePokemonId()
      
      // 技の決定
      const moves = options.customMoves || this.generateMoves(species, level)
      
      // 捕獲情報
      const captureInfo = this.generateCaptureInfo(options.trainer, options.location, options.captureMethod)
      
      // Pokemon オブジェクトの構築
      const pokemon: Pokemon = {
        id: pokemonId,
        speciesId: species.id,
        name: species.name,
        nameJa: species.nameJa,
        level,
        experience: pokemonDatabase.calculateExperienceForLevel(species, level),
        nextLevelExp: pokemonDatabase.calculateExperienceForLevel(species, level + 1),
        
        // ステータス
        hp: stats.maxHp,
        maxHp: stats.maxHp,
        attack: stats.attack,
        defense: stats.defense,
        specialAttack: stats.specialAttack,
        specialDefense: stats.specialDefense,
        speed: stats.speed,
        
        // 状態
        status: 'healthy',
        
        // 技
        moves,
        
        // 個体値
        ivs: {
          hp: ivs.hp,
          attack: ivs.attack,
          defense: ivs.defense,
          specialAttack: ivs.specialAttack,
          specialDefense: ivs.specialDefense,
          speed: ivs.speed
        },
        
        // 性格
        nature,
        
        // 捕獲情報
        caughtDate: captureInfo.caughtDate,
        caughtLocation: captureInfo.caughtLocation,
        caughtBy: captureInfo.caughtBy,
        originalTrainer: captureInfo.originalTrainer
      }
      
      // 色違いの場合は特別な処理
      if (shiny.isShiny) {
        this.applyShinyEffects(pokemon, shiny)
      }
      
      return pokemon
    })
  }
  
  /**
   * 複数ポケモンの一括生成
   */
  async generateMultiplePokemon(
    count: number, 
    options: PokemonGenerationOptions[]
  ): Promise<Pokemon[]> {
    const promises = Array.from({ length: count }, (_, index) => 
      this.generatePokemon(options[index] || options[0] || {})
    )
    
    const results = await Promise.allSettled(promises)
    return results
      .filter((result): result is PromiseFulfilledResult<Pokemon> => result.status === 'fulfilled')
      .map(result => result.value)
  }
  
  /**
   * 個体値品質による生成
   */
  async generatePokemonByQuality(
    speciesId: number, 
    quality: 'poor' | 'average' | 'good' | 'excellent' | 'perfect'
  ): Promise<Pokemon> {
    const qualityMap = {
      poor: 0.1,
      average: 0.4,
      good: 0.7,
      excellent: 0.9,
      perfect: 1.0
    }
    
    return this.generatePokemon({
      speciesId,
      ivQuality: qualityMap[quality]
    })
  }
  
  /**
   * 個体値を生成
   */
  private generateIndividualValues(quality: number, species: PokemonSpecies): IndividualValues {
    // 品質に基づく個体値生成
    const generateIV = () => {
      if (quality >= 1.0) return 31 // 完璧
      if (quality <= 0) return 0 // 最悪
      
      // 品質に基づく確率分布
      const mean = 31 * quality
      const variance = 31 * (1 - quality) * 0.5
      
      // 正規分布近似
      let value = 0
      for (let i = 0; i < 12; i++) {
        value += Math.random()
      }
      value = (value - 6) / 6 // 標準正規分布近似
      
      const result = Math.round(mean + value * variance)
      return Math.max(0, Math.min(31, result))
    }
    
    const ivs: IndividualValues = {
      hp: generateIV(),
      attack: generateIV(),
      defense: generateIV(),
      specialAttack: generateIV(),
      specialDefense: generateIV(),
      speed: generateIV(),
      total: 0,
      grade: 'F'
    }
    
    ivs.total = ivs.hp + ivs.attack + ivs.defense + ivs.specialAttack + ivs.specialDefense + ivs.speed
    ivs.grade = this.calculateIVGrade(ivs.total)
    
    return ivs
  }
  
  /**
   * 個体値グレード計算
   */
  private calculateIVGrade(totalIV: number): IndividualValues['grade'] {
    const percentage = totalIV / 186 // 最大186 (31*6)
    
    if (percentage >= 0.97) return 'SS' // 31-30-31-31-31-31 レベル
    if (percentage >= 0.90) return 'S'  // 30以上が5つ以上
    if (percentage >= 0.80) return 'A'  // 25以上が多い
    if (percentage >= 0.70) return 'B'  // 平均的
    if (percentage >= 0.55) return 'C'  // やや低い
    if (percentage >= 0.40) return 'D'  // 低い
    if (percentage >= 0.25) return 'E'  // 非常に低い
    return 'F' // 最低
  }
  
  /**
   * ランダム性格生成
   */
  private generateRandomNature(): PokemonNature {
    const natures = Array.from(this.natureDatabase.keys())
    return natures[Math.floor(Math.random() * natures.length)]
  }
  
  /**
   * ランダムレベル生成
   */
  private generateRandomLevel(species: PokemonSpecies): number {
    // レアリティに基づくレベル分布
    const rarityLevelRange = {
      common: [1, 15],
      uncommon: [3, 20],
      rare: [5, 25],
      ultra_rare: [8, 30],
      legendary: [15, 50],
      mythical: [20, 50]
    }
    
    const [min, max] = rarityLevelRange[species.rarity] || [1, 20]
    return Math.floor(Math.random() * (max - min + 1)) + min
  }
  
  /**
   * 色違いバリアント生成
   */
  private generateShinyVariant(baseChance: number, force: boolean = false): ShinyVariant {
    const isShiny = force || Math.random() < baseChance
    
    if (!isShiny) {
      return {
        isShiny: false,
        colorVariant: 'normal',
        sparkleEffect: false,
        rarity: 'normal',
        valueMultiplier: 1.0
      }
    }
    
    // 超色違い（さらに稀）
    const isUltraShiny = Math.random() < 0.1 // 10%の確率で超色違い
    
    return {
      isShiny: true,
      colorVariant: isUltraShiny ? 'ultra_shiny' : 'shiny',
      sparkleEffect: true,
      rarity: isUltraShiny ? 'ultra_shiny' : 'shiny',
      valueMultiplier: isUltraShiny ? 5.0 : 2.5
    }
  }
  
  /**
   * ステータス計算
   */
  private calculateStats(
    species: PokemonSpecies,
    level: number,
    ivs: IndividualValues,
    nature: PokemonNature
  ): PokemonStats {
    const natureEffect = this.natureDatabase.get(nature)
    
    // 基本ステータス計算式（ポケモン準拠）
    const calculateStat = (base: number, iv: number, level: number, isHp: boolean = false): number => {
      if (isHp) {
        return Math.floor((2 * base + iv) * level / 100) + level + 10
      } else {
        return Math.floor((2 * base + iv) * level / 100) + 5
      }
    }
    
    // 性格補正の適用
    const applyNatureModifier = (stat: number, statName: keyof Pokemon['ivs']): number => {
      if (!natureEffect) return stat
      
      if (natureEffect.increasedStat === statName) {
        return Math.floor(stat * 1.1)
      } else if (natureEffect.decreasedStat === statName) {
        return Math.floor(stat * 0.9)
      }
      
      return stat
    }
    
    const hp = calculateStat(species.baseStats.hp, ivs.hp, level, true)
    const attack = applyNatureModifier(calculateStat(species.baseStats.attack, ivs.attack, level), 'attack')
    const defense = applyNatureModifier(calculateStat(species.baseStats.defense, ivs.defense, level), 'defense')
    const specialAttack = applyNatureModifier(calculateStat(species.baseStats.specialAttack, ivs.specialAttack, level), 'specialAttack')
    const specialDefense = applyNatureModifier(calculateStat(species.baseStats.specialDefense, ivs.specialDefense, level), 'specialDefense')
    const speed = applyNatureModifier(calculateStat(species.baseStats.speed, ivs.speed, level), 'speed')
    
    return {
      hp,
      maxHp: hp,
      attack,
      defense,
      specialAttack,
      specialDefense,
      speed,
      accuracy: 100,
      evasion: 100,
      criticalRate: this.calculateCriticalRate(speed, ivs.speed)
    }
  }
  
  /**
   * 急所率計算
   */
  private calculateCriticalRate(speed: number, speedIV: number): number {
    // 素早さと個体値に基づく急所率
    const baseRate = 4.17 // 基本確率（%）
    const speedBonus = Math.min(speed / 200, 0.5) // 最大0.5%ボーナス
    const ivBonus = speedIV / 310 // 個体値ボーナス
    
    return baseRate + speedBonus + ivBonus
  }
  
  /**
   * 技生成
   */
  private generateMoves(species: PokemonSpecies, level: number): string[] {
    // 簡易的な技習得システム
    const basicMoves = ['たいあたり', 'なきごえ']
    const typeMoves = this.getTypeBasedMoves(species.types[0])
    
    const availableMoves = [...basicMoves, ...typeMoves]
    const moveCount = Math.min(4, Math.ceil(level / 5) + 1)
    
    // レベルに応じて技を選択
    const learnedMoves: string[] = []
    for (let i = 0; i < moveCount && i < availableMoves.length; i++) {
      learnedMoves.push(availableMoves[i])
    }
    
    return learnedMoves
  }
  
  /**
   * タイプ別基本技取得
   */
  private getTypeBasedMoves(type: string): string[] {
    const typeMoves: Record<string, string[]> = {
      fire: ['ひのこ', 'かえんほうしゃ', 'だいもんじ'],
      water: ['みずでっぽう', 'バブルこうせん', 'ハイドロポンプ'],
      grass: ['はっぱカッター', 'はなびらのまい', 'ソーラービーム'],
      electric: ['でんきショック', '10まんボルト', 'かみなり'],
      psychic: ['ねんりき', 'サイコキネシス', 'みらいよち'],
      normal: ['でんこうせっか', 'のしかかり', 'はかいこうせん']
    }
    
    return typeMoves[type] || typeMoves.normal
  }
  
  /**
   * 捕獲情報生成
   */
  private generateCaptureInfo(
    trainer?: string, 
    location?: number, 
    method?: string
  ) {
    return {
      caughtDate: new Date().toISOString(),
      caughtLocation: location || 1,
      caughtBy: trainer || 'wild_encounter',
      originalTrainer: trainer || '野生'
    }
  }
  
  /**
   * 色違い効果適用
   */
  private applyShinyEffects(pokemon: Pokemon, shiny: ShinyVariant): void {
    // 色違いの特別効果（実装例）
    if (shiny.rarity === 'ultra_shiny') {
      // 超色違いは全ステータス5%向上
      pokemon.attack = Math.floor(pokemon.attack * 1.05)
      pokemon.defense = Math.floor(pokemon.defense * 1.05)
      pokemon.specialAttack = Math.floor(pokemon.specialAttack * 1.05)
      pokemon.specialDefense = Math.floor(pokemon.specialDefense * 1.05)
      pokemon.speed = Math.floor(pokemon.speed * 1.05)
    }
  }
  
  /**
   * ユニークID生成
   */
  private generateUniquePokemonId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 9)
    return `pokemon_${timestamp}_${random}`
  }
  
  /**
   * 性格データベース初期化
   */
  private initializeNatureDatabase(): void {
    const natures: Array<Omit<PokemonNatureEffect, 'name'> & { name: PokemonNature }> = [
      {
        name: 'がんばりや',
        nameEn: 'Hardy',
        modifier: 1.0,
        description: 'バランスの取れた性格',
        personality: { aggressive: 0, friendly: 0, energetic: 0, intelligent: 0, brave: 0 }
      },
      {
        name: 'いじっぱり',
        nameEn: 'Adamant',
        increasedStat: 'attack',
        decreasedStat: 'specialAttack',
        modifier: 1.1,
        description: '物理攻撃力が高い',
        personality: { aggressive: 3, friendly: -1, energetic: 2, intelligent: -2, brave: 3 }
      },
      {
        name: 'ひかえめ',
        nameEn: 'Modest',
        increasedStat: 'specialAttack',
        decreasedStat: 'attack',
        modifier: 1.1,
        description: '特殊攻撃力が高い',
        personality: { aggressive: -2, friendly: 2, energetic: 1, intelligent: 4, brave: -1 }
      },
      {
        name: 'ようき',
        nameEn: 'Jolly',
        increasedStat: 'speed',
        decreasedStat: 'specialAttack',
        modifier: 1.1,
        description: '素早さが高い',
        personality: { aggressive: 1, friendly: 3, energetic: 4, intelligent: -1, brave: 2 }
      },
      {
        name: 'おくびょう',
        nameEn: 'Timid',
        increasedStat: 'speed',
        decreasedStat: 'attack',
        modifier: 1.1,
        description: '素早いが臆病',
        personality: { aggressive: -3, friendly: 1, energetic: 2, intelligent: 2, brave: -4 }
      },
      {
        name: 'ずぶとい',
        nameEn: 'Bold',
        increasedStat: 'defense',
        decreasedStat: 'attack',
        modifier: 1.1,
        description: '防御力が高い',
        personality: { aggressive: -2, friendly: 2, energetic: -1, intelligent: 3, brave: 1 }
      }
    ]
    
    natures.forEach(nature => {
      this.natureDatabase.set(nature.name, nature)
    })
  }
  
  /**
   * 品質分布初期化
   */
  private initializeQualityDistribution(): void {
    // 品質レベル別の出現確率
    this.qualityDistribution.set('poor', 0.4)     // 40%
    this.qualityDistribution.set('average', 0.35) // 35%
    this.qualityDistribution.set('good', 0.20)    // 20%
    this.qualityDistribution.set('excellent', 0.04) // 4%
    this.qualityDistribution.set('perfect', 0.01) // 1%
  }
  
  /**
   * 性格効果取得
   */
  getNatureEffect(nature: PokemonNature): PokemonNatureEffect | null {
    return this.natureDatabase.get(nature) || null
  }
  
  /**
   * 全性格リスト取得
   */
  getAllNatures(): PokemonNatureEffect[] {
    return Array.from(this.natureDatabase.values())
  }
  
  /**
   * ポケモン評価計算
   */
  evaluatePokemon(pokemon: Pokemon): {
    overall: number
    ivRating: string
    statRating: string
    potentialRating: string
    recommendations: string[]
  } {
    const totalIV = pokemon.ivs.hp + pokemon.ivs.attack + pokemon.ivs.defense + 
                   pokemon.ivs.specialAttack + pokemon.ivs.specialDefense + pokemon.ivs.speed
    const ivPercentage = totalIV / 186
    
    const totalStats = pokemon.attack + pokemon.defense + pokemon.specialAttack + 
                      pokemon.specialDefense + pokemon.speed
    
    const overall = Math.round((ivPercentage * 0.6 + (pokemon.level / 100) * 0.4) * 100)
    
    return {
      overall,
      ivRating: this.getIVRatingDescription(ivPercentage),
      statRating: this.getStatRatingDescription(totalStats, pokemon.level),
      potentialRating: this.getPotentialRating(pokemon),
      recommendations: this.generateRecommendations(pokemon)
    }
  }
  
  private getIVRatingDescription(percentage: number): string {
    if (percentage >= 0.95) return '素晴らしい個体値です！'
    if (percentage >= 0.85) return 'とても良い個体値です'
    if (percentage >= 0.70) return '良い個体値です'
    if (percentage >= 0.50) return '平均的な個体値です'
    return '個体値は低めです'
  }
  
  private getStatRatingDescription(totalStats: number, level: number): string {
    const expectedStats = level * 15 // 概算
    const ratio = totalStats / expectedStats
    
    if (ratio >= 1.2) return 'ステータスが非常に高いです'
    if (ratio >= 1.1) return 'ステータスが高いです'
    if (ratio >= 0.9) return 'ステータスは平均的です'
    return 'ステータスは低めです'
  }
  
  private getPotentialRating(pokemon: Pokemon): string {
    const species = pokemonDatabase.getSpecies(pokemon.speciesId)
    if (!species) return '不明'
    
    if (species.rarity === 'legendary' || species.rarity === 'mythical') {
      return 'とてつもない可能性を秘めています'
    }
    
    if (species.baseStats.total >= 500) {
      return '高い成長の可能性があります'
    }
    
    return '着実に成長する可能性があります'
  }
  
  private generateRecommendations(pokemon: Pokemon): string[] {
    const recommendations: string[] = []
    const species = pokemonDatabase.getSpecies(pokemon.speciesId)
    
    if (!species) return recommendations
    
    // 進化可能性
    if (pokemonDatabase.canEvolve(species, pokemon.level)) {
      recommendations.push('進化が可能です')
    }
    
    // レベルアップ推奨
    if (pokemon.level < 30) {
      recommendations.push('レベルアップで更に強くなります')
    }
    
    // 特殊な特徴
    const totalIV = pokemon.ivs.hp + pokemon.ivs.attack + pokemon.ivs.defense + 
                   pokemon.ivs.specialAttack + pokemon.ivs.specialDefense + pokemon.ivs.speed
    
    if (totalIV >= 170) {
      recommendations.push('個体値が優秀なので大切に育ててください')
    }
    
    return recommendations
  }
}

// シングルトンインスタンス
export const pokemonGenerator = PokemonGenerator.getInstance()