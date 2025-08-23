/**
 * ポケモン遭遇・レアリティシステム
 * 高度な出現率計算とレアリティ管理
 */

import type { PokemonSpecies, PokemonRarity, Habitat, TimeOfDay, Weather, Season } from './PokemonDatabase'
import { pokemonDatabase, type LocationPokemonData } from './PokemonDatabase'
import { pokemonGenerator, type PokemonGenerationOptions } from './PokemonGenerator'
import { performanceMonitor, LRUCache } from '@/lib/performance/PerformanceOptimizer'
import type { Trainer, Expedition } from '@/lib/game-state/types'

export interface EncounterContext {
  locationId: number
  timeOfDay: TimeOfDay
  weather: Weather
  season: Season
  trainerLevel: number
  trainerSkills: Trainer['skills']
  expeditionMode: Expedition['mode']
  searchEffort: number // 0.0-1.0
  luckFactor: number // 0.0-2.0
  specialConditions?: string[]
}

export interface EncounterRates {
  common: number
  uncommon: number
  rare: number
  ultraRare: number
  legendary: number
  mythical: number
  shinyBonus: number
  totalModifier: number
}

export interface EncounterResult {
  species: PokemonSpecies
  baseEncounterRate: number
  actualEncounterRate: number
  bonusFactors: EncounterBonus[]
  rarityTier: PokemonRarity
  encounterType: 'random' | 'scripted' | 'special_event' | 'chain'
  contextualInfo: string
}

export interface EncounterBonus {
  type: 'time' | 'weather' | 'season' | 'skill' | 'level' | 'luck' | 'equipment' | 'chain' | 'event'
  name: string
  multiplier: number
  description: string
}

export interface ChainEncounter {
  species: PokemonSpecies
  chainCount: number
  maxChain: number
  shinyBonus: number
  rarityBonus: number
  isActive: boolean
  lastEncounter: number
}

export interface SpecialEvent {
  id: string
  name: string
  description: string
  duration: { start: Date; end: Date }
  encounterBonuses: Record<PokemonRarity, number>
  specialPokemon: number[]
  conditions: string[]
  active: boolean
}

/**
 * ポケモン遭遇システム
 */
export class PokemonEncounterSystem {
  private static instance: PokemonEncounterSystem
  private encounterCache = new LRUCache<EncounterRates>(100)
  private activeChains = new Map<string, ChainEncounter>() // trainerId -> chain
  private specialEvents = new Map<string, SpecialEvent>()
  private hourlyModifiers = new Map<number, number>()
  private seasonalEvents = new Map<string, number>()
  
  private constructor() {
    this.initializeHourlyModifiers()
    this.initializeSpecialEvents()
    this.initializeSeasonalEvents()
  }
  
  static getInstance(): PokemonEncounterSystem {
    if (!PokemonEncounterSystem.instance) {
      PokemonEncounterSystem.instance = new PokemonEncounterSystem()
    }
    return PokemonEncounterSystem.instance
  }
  
  /**
   * ポケモン遭遇を実行
   */
  async executeEncounter(context: EncounterContext, trainerId?: string): Promise<EncounterResult | null> {
    return performanceMonitor.measureAsync('pokemon_encounter', async () => {
      // 遭遇率を計算
      const encounterRates = this.calculateEncounterRates(context)
      
      // 遭遇判定
      const encounterRoll = Math.random()
      if (encounterRoll > this.getTotalEncounterChance(encounterRates, context)) {
        return null // 遭遇なし
      }
      
      // ポケモン種族を選択
      const selectedSpecies = this.selectPokemonSpecies(context, encounterRates)
      if (!selectedSpecies) return null
      
      // 遭遇結果を構築
      const result = this.buildEncounterResult(selectedSpecies, context, encounterRates)
      
      // チェーン処理
      if (trainerId) {
        this.updateChainEncounter(trainerId, selectedSpecies)
      }
      
      return result
    })
  }
  
  /**
   * 複数回遭遇シミュレーション
   */
  async simulateMultipleEncounters(
    context: EncounterContext,
    attempts: number,
    trainerId?: string
  ): Promise<EncounterResult[]> {
    const results: EncounterResult[] = []
    
    for (let i = 0; i < attempts; i++) {
      const result = await this.executeEncounter(context, trainerId)
      if (result) {
        results.push(result)
      }
      
      // チェーンによる確率変動を考慮
      if (trainerId) {
        this.applyChainEffects(context, trainerId)
      }
    }
    
    return results
  }
  
  /**
   * 特定ポケモンの遭遇率を計算
   */
  calculateSpecificEncounterRate(speciesId: number, context: EncounterContext): number {
    const species = pokemonDatabase.getSpecies(speciesId)
    if (!species) return 0
    
    const baseRate = this.getBaseEncounterRate(species, context.locationId)
    if (baseRate === 0) return 0 // その場所には出現しない
    
    const modifiers = this.calculateAllModifiers(species, context)
    return baseRate * modifiers.reduce((total, mod) => total * mod.multiplier, 1)
  }
  
  /**
   * レアリティ別遭遇統計を取得
   */
  getEncounterStatistics(context: EncounterContext): Record<PokemonRarity, { rate: number; count: number }> {
    const locationData = pokemonDatabase.getPokemonByLocation(context.locationId)
    const rates = this.calculateEncounterRates(context)
    
    return {
      common: { rate: rates.common, count: locationData.commonPool.length },
      uncommon: { rate: rates.uncommon, count: locationData.uncommonPool.length },
      rare: { rate: rates.rare, count: locationData.rarePool.length },
      ultra_rare: { rate: rates.ultraRare, count: locationData.ultraRarePool.length },
      legendary: { rate: rates.legendary, count: locationData.legendaryPool.length },
      mythical: { rate: 0, count: 0 } // 通常遭遇では出現しない
    }
  }
  
  /**
   * 遭遇率の詳細計算
   */
  private calculateEncounterRates(context: EncounterContext): EncounterRates {
    const cacheKey = this.generateCacheKey(context)
    const cached = this.encounterCache.get(cacheKey)
    if (cached) return cached
    
    // ベース遭遇率
    const baseRates = this.getBaseRatesByLocation(context.locationId)
    
    // 時間帯修正
    const timeModifier = this.getTimeModifier(context.timeOfDay)
    
    // 天候修正
    const weatherModifier = this.getWeatherModifier(context.weather)
    
    // 季節修正
    const seasonModifier = this.getSeasonModifier(context.season)
    
    // トレーナーレベル修正
    const levelModifier = this.getLevelModifier(context.trainerLevel)
    
    // スキル修正
    const skillModifier = this.getSkillModifier(context.trainerSkills, context.expeditionMode)
    
    // 運気修正
    const luckModifier = context.luckFactor
    
    // 探索努力修正
    const effortModifier = 1 + (context.searchEffort * 0.5)
    
    // 特別イベント修正
    const eventModifier = this.getActiveEventModifier()
    
    // 総合修正値
    const totalModifier = timeModifier * weatherModifier * seasonModifier * 
                         levelModifier * skillModifier * luckModifier * 
                         effortModifier * eventModifier
    
    const rates: EncounterRates = {
      common: baseRates.common * totalModifier,
      uncommon: baseRates.uncommon * totalModifier,
      rare: baseRates.rare * totalModifier,
      ultraRare: baseRates.ultraRare * totalModifier,
      legendary: baseRates.legendary * totalModifier,
      mythical: baseRates.mythical * totalModifier,
      shinyBonus: this.calculateShinyBonus(context),
      totalModifier
    }
    
    this.encounterCache.set(cacheKey, rates)
    return rates
  }
  
  /**
   * ポケモン種族選択
   */
  private selectPokemonSpecies(context: EncounterContext, rates: EncounterRates): PokemonSpecies | null {
    const locationData = pokemonDatabase.getPokemonByLocation(context.locationId)
    
    // レアリティプールから選択
    const rarityRoll = Math.random()
    let selectedPool: number[]
    let selectedRarity: PokemonRarity
    
    if (rarityRoll < rates.legendary && locationData.legendaryPool.length > 0) {
      selectedPool = locationData.legendaryPool
      selectedRarity = 'legendary'
    } else if (rarityRoll < rates.ultraRare && locationData.ultraRarePool.length > 0) {
      selectedPool = locationData.ultraRarePool
      selectedRarity = 'ultra_rare'
    } else if (rarityRoll < rates.rare && locationData.rarePool.length > 0) {
      selectedPool = locationData.rarePool
      selectedRarity = 'rare'
    } else if (rarityRoll < rates.uncommon && locationData.uncommonPool.length > 0) {
      selectedPool = locationData.uncommonPool
      selectedRarity = 'uncommon'
    } else {
      selectedPool = locationData.commonPool
      selectedRarity = 'common'
    }
    
    if (selectedPool.length === 0) return null
    
    // プール内から重み付き選択
    const weightedSelection = this.performWeightedSelection(selectedPool, context)
    return pokemonDatabase.getSpecies(weightedSelection)
  }
  
  /**
   * 重み付き選択
   */
  private performWeightedSelection(pool: number[], context: EncounterContext): number {
    const weights = pool.map(speciesId => {
      const species = pokemonDatabase.getSpecies(speciesId)
      if (!species) return 0
      
      let weight = 1.0
      
      // 環境条件マッチング
      if (species.timeOfDay.includes(context.timeOfDay) || species.timeOfDay.includes('any')) {
        weight *= 1.5
      }
      
      if (species.weather.includes(context.weather) || species.weather.includes('any')) {
        weight *= 1.3
      }
      
      if (species.season.includes(context.season) || species.season.includes('any')) {
        weight *= 1.2
      }
      
      return weight
    })
    
    // 重み付きランダム選択
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
    let random = Math.random() * totalWeight
    
    for (let i = 0; i < pool.length; i++) {
      random -= weights[i]
      if (random <= 0) {
        return pool[i]
      }
    }
    
    return pool[pool.length - 1] // フォールバック
  }
  
  /**
   * 遭遇結果構築
   */
  private buildEncounterResult(
    species: PokemonSpecies,
    context: EncounterContext,
    rates: EncounterRates
  ): EncounterResult {
    const baseRate = this.getBaseEncounterRate(species, context.locationId)
    const bonusFactors = this.calculateAllModifiers(species, context)
    const actualRate = bonusFactors.reduce((rate, bonus) => rate * bonus.multiplier, baseRate)
    
    return {
      species,
      baseEncounterRate: baseRate,
      actualEncounterRate: actualRate,
      bonusFactors,
      rarityTier: species.rarity,
      encounterType: this.determineEncounterType(species, context),
      contextualInfo: this.generateContextualInfo(species, context)
    }
  }
  
  /**
   * 全修正値計算
   */
  private calculateAllModifiers(species: PokemonSpecies, context: EncounterContext): EncounterBonus[] {
    const bonuses: EncounterBonus[] = []
    
    // 時間帯ボーナス
    if (species.timeOfDay.includes(context.timeOfDay)) {
      bonuses.push({
        type: 'time',
        name: '時間帯マッチ',
        multiplier: 1.5,
        description: `${context.timeOfDay}の時間帯に活動的`
      })
    }
    
    // 天候ボーナス
    if (species.weather.includes(context.weather)) {
      bonuses.push({
        type: 'weather',
        name: '天候マッチ',
        multiplier: 1.3,
        description: `${context.weather}の天候を好む`
      })
    }
    
    // スキルボーナス
    const skillBonus = this.calculateSkillBonus(context.trainerSkills, species.rarity)
    if (skillBonus > 1.0) {
      bonuses.push({
        type: 'skill',
        name: 'トレーナースキル',
        multiplier: skillBonus,
        description: `${species.rarity}ポケモンへの遭遇スキル`
      })
    }
    
    // レベルボーナス
    const levelBonus = this.calculateLevelBonus(context.trainerLevel, species.rarity)
    if (levelBonus > 1.0) {
      bonuses.push({
        type: 'level',
        name: 'トレーナーレベル',
        multiplier: levelBonus,
        description: '高レベルによる遭遇率向上'
      })
    }
    
    // 運気ボーナス
    if (context.luckFactor > 1.0) {
      bonuses.push({
        type: 'luck',
        name: '幸運',
        multiplier: context.luckFactor,
        description: '運気による遭遇率向上'
      })
    }
    
    return bonuses
  }
  
  /**
   * チェーン遭遇更新
   */
  private updateChainEncounter(trainerId: string, species: PokemonSpecies): void {
    const existingChain = this.activeChains.get(trainerId)
    
    if (existingChain && existingChain.species.id === species.id) {
      // 同じ種族のチェーン継続
      existingChain.chainCount++
      existingChain.lastEncounter = Date.now()
      
      if (existingChain.chainCount > existingChain.maxChain) {
        existingChain.maxChain = existingChain.chainCount
      }
      
      // チェーンボーナス計算
      existingChain.shinyBonus = Math.min(0.01, existingChain.chainCount * 0.0001) // 最大1%
      existingChain.rarityBonus = Math.min(2.0, 1.0 + existingChain.chainCount * 0.01) // 最大2倍
      
    } else {
      // 新しいチェーン開始
      this.activeChains.set(trainerId, {
        species,
        chainCount: 1,
        maxChain: 1,
        shinyBonus: 0,
        rarityBonus: 1.0,
        isActive: true,
        lastEncounter: Date.now()
      })
    }
  }
  
  /**
   * 基本遭遇率取得
   */
  private getBaseEncounterRate(species: PokemonSpecies, locationId: number): number {
    const locationData = pokemonDatabase.getPokemonByLocation(locationId)
    
    // どのプールに属するかチェック
    if (locationData.commonPool.includes(species.id)) return 0.4
    if (locationData.uncommonPool.includes(species.id)) return 0.2
    if (locationData.rarePool.includes(species.id)) return 0.08
    if (locationData.ultraRarePool.includes(species.id)) return 0.02
    if (locationData.legendaryPool.includes(species.id)) return 0.001
    
    return 0 // その場所には出現しない
  }
  
  /**
   * ユーティリティメソッド群
   */
  private getBaseRatesByLocation(locationId: number): EncounterRates {
    const baseRates = {
      1: { common: 0.6, uncommon: 0.25, rare: 0.10, ultraRare: 0.04, legendary: 0.01, mythical: 0 },
      2: { common: 0.5, uncommon: 0.3, rare: 0.15, ultraRare: 0.04, legendary: 0.01, mythical: 0 },
      3: { common: 0.4, uncommon: 0.35, rare: 0.2, ultraRare: 0.04, legendary: 0.01, mythical: 0 },
      4: { common: 0.3, uncommon: 0.4, rare: 0.25, ultraRare: 0.04, legendary: 0.01, mythical: 0 },
      5: { common: 0.2, uncommon: 0.3, rare: 0.35, ultraRare: 0.1, legendary: 0.05, mythical: 0 }
    }
    
    const rates = baseRates[locationId as keyof typeof baseRates] || baseRates[1]
    
    return {
      common: rates.common,
      uncommon: rates.uncommon,
      rare: rates.rare,
      ultraRare: rates.ultraRare,
      legendary: rates.legendary,
      mythical: rates.mythical,
      shinyBonus: 0,
      totalModifier: 1.0
    }
  }
  
  private getTimeModifier(timeOfDay: TimeOfDay): number {
    const hour = new Date().getHours()
    const modifiers = this.hourlyModifiers.get(hour) || 1.0
    
    // 特定時間帯のボーナス
    switch (timeOfDay) {
      case 'night': return hour >= 20 || hour <= 5 ? 1.2 : 0.8
      case 'morning': return hour >= 6 && hour <= 11 ? 1.3 : 1.0
      case 'day': return hour >= 12 && hour <= 17 ? 1.1 : 1.0
      case 'evening': return hour >= 18 && hour <= 21 ? 1.2 : 1.0
      default: return 1.0
    }
  }
  
  private getWeatherModifier(weather: Weather): number {
    const weatherBonuses = {
      sunny: 1.1,
      rain: 1.2,
      snow: 1.3,
      fog: 1.4,
      sandstorm: 1.5,
      any: 1.0
    }
    
    return weatherBonuses[weather] || 1.0
  }
  
  private getSeasonModifier(season: Season): number {
    const currentMonth = new Date().getMonth()
    const seasonBonuses = {
      spring: [2, 3, 4].includes(currentMonth) ? 1.2 : 1.0,
      summer: [5, 6, 7].includes(currentMonth) ? 1.2 : 1.0,
      autumn: [8, 9, 10].includes(currentMonth) ? 1.2 : 1.0,
      winter: [11, 0, 1].includes(currentMonth) ? 1.2 : 1.0,
      any: 1.0
    }
    
    return seasonBonuses[season] || 1.0
  }
  
  private getLevelModifier(level: number): number {
    return 1.0 + Math.min(level / 100, 0.5) // 最大50%ボーナス
  }
  
  private getSkillModifier(skills: Trainer['skills'], mode: Expedition['mode']): number {
    const captureSkill = skills.capture || 0
    const explorationSkill = skills.exploration || 0
    
    let modifier = 1.0 + (captureSkill + explorationSkill) / 40 // 最大50%ボーナス
    
    // 探索モードによる修正
    switch (mode) {
      case 'exploration':
        modifier *= 1.3
        break
      case 'aggressive':
        modifier *= 1.1
        break
      case 'safe':
        modifier *= 0.9
        break
    }
    
    return modifier
  }
  
  private calculateShinyBonus(context: EncounterContext): number {
    let bonus = 0.001 // ベース色違い確率 0.1%
    
    // 探索努力による向上
    bonus += context.searchEffort * 0.002
    
    // 運気による向上
    bonus *= context.luckFactor
    
    // スキルによる向上
    const avgSkill = Object.values(context.trainerSkills).reduce((a, b) => a + b, 0) / 5
    bonus += avgSkill * 0.0001
    
    return Math.min(bonus, 0.05) // 最大5%
  }
  
  private getTotalEncounterChance(rates: EncounterRates, context: EncounterContext): number {
    const baseChance = 0.3 // 30%のベース遭遇確率
    const searchBonus = context.searchEffort * 0.2
    const skillBonus = Object.values(context.trainerSkills).reduce((a, b) => a + b, 0) / 100
    
    return Math.min(baseChance + searchBonus + skillBonus, 0.8) // 最大80%
  }
  
  private calculateSkillBonus(skills: Trainer['skills'], rarity: PokemonRarity): number {
    const relevantSkill = skills.capture + skills.exploration
    const rarityDifficulty = {
      common: 0,
      uncommon: 2,
      rare: 5,
      ultra_rare: 8,
      legendary: 12,
      mythical: 15
    }
    
    const difficulty = rarityDifficulty[rarity] || 0
    return relevantSkill > difficulty ? 1.0 + (relevantSkill - difficulty) * 0.1 : 1.0
  }
  
  private calculateLevelBonus(level: number, rarity: PokemonRarity): number {
    const rarityRequirement = {
      common: 1,
      uncommon: 5,
      rare: 15,
      ultra_rare: 25,
      legendary: 40,
      mythical: 50
    }
    
    const requirement = rarityRequirement[rarity] || 1
    return level >= requirement ? 1.0 + Math.max(0, level - requirement) * 0.02 : 0.5
  }
  
  private getActiveEventModifier(): number {
    const now = new Date()
    let modifier = 1.0
    
    Array.from(this.specialEvents.values()).forEach(event => {
      if (event.active && now >= event.duration.start && now <= event.duration.end) {
        modifier *= 1.5 // イベント期間中は遭遇率1.5倍
      }
    });
    
    return modifier
  }
  
  private applyChainEffects(context: EncounterContext, trainerId: string): void {
    const chain = this.activeChains.get(trainerId)
    if (chain && chain.isActive) {
      // チェーンによる効果を文脈に反映
      context.luckFactor *= chain.rarityBonus
    }
  }
  
  private determineEncounterType(species: PokemonSpecies, context: EncounterContext): EncounterResult['encounterType'] {
    if (species.rarity === 'legendary' || species.rarity === 'mythical') {
      return 'special_event'
    }
    
    if (this.hasActiveChain(context)) {
      return 'chain'
    }
    
    return 'random'
  }
  
  private hasActiveChain(context: EncounterContext): boolean {
    // 簡易実装：チェーンの存在確認
    return this.activeChains.size > 0
  }
  
  private generateContextualInfo(species: PokemonSpecies, context: EncounterContext): string {
    const conditions: string[] = []
    
    if (species.timeOfDay.includes(context.timeOfDay)) {
      conditions.push(`${context.timeOfDay}の時間帯を好む`)
    }
    
    if (species.weather.includes(context.weather)) {
      conditions.push(`${context.weather}の天候で活発`)
    }
    
    if (species.rarity === 'legendary' || species.rarity === 'mythical') {
      conditions.push('非常に稀な遭遇')
    }
    
    return conditions.join('、') || '通常の遭遇'
  }
  
  private generateCacheKey(context: EncounterContext): string {
    return `${context.locationId}_${context.timeOfDay}_${context.weather}_${context.season}_${context.trainerLevel}`
  }
  
  /**
   * 初期化メソッド群
   */
  private initializeHourlyModifiers(): void {
    // 時間ごとの遭遇率修正
    for (let hour = 0; hour < 24; hour++) {
      let modifier = 1.0
      
      // 夜間は特別なポケモンが出やすい
      if (hour >= 20 || hour <= 5) {
        modifier = 1.2
      }
      // 朝は活発
      else if (hour >= 6 && hour <= 10) {
        modifier = 1.1
      }
      // 昼間は標準
      else if (hour >= 11 && hour <= 17) {
        modifier = 1.0
      }
      // 夕方はやや活発
      else {
        modifier = 1.05
      }
      
      this.hourlyModifiers.set(hour, modifier)
    }
  }
  
  private initializeSpecialEvents(): void {
    // 季節イベントなどの初期化
    const events: SpecialEvent[] = [
      {
        id: 'spring_festival',
        name: '春祭り',
        description: '草タイプポケモンの出現率が上がります',
        duration: { start: new Date(2024, 2, 20), end: new Date(2024, 3, 10) },
        encounterBonuses: { common: 1.2, uncommon: 1.3, rare: 1.5, ultra_rare: 1.2, legendary: 1.0, mythical: 1.0 },
        specialPokemon: [1, 2, 3, 152, 153, 154],
        conditions: ['grass_type_bonus'],
        active: false
      }
    ]
    
    events.forEach(event => {
      this.specialEvents.set(event.id, event)
    })
  }
  
  private initializeSeasonalEvents(): void {
    // 季節ごとの修正値
    this.seasonalEvents.set('spring_grass', 1.3)
    this.seasonalEvents.set('summer_fire', 1.3)
    this.seasonalEvents.set('autumn_normal', 1.2)
    this.seasonalEvents.set('winter_ice', 1.4)
  }
  
  /**
   * パブリックユーティリティメソッド
   */
  getActiveChain(trainerId: string): ChainEncounter | null {
    return this.activeChains.get(trainerId) || null
  }
  
  resetChain(trainerId: string): void {
    this.activeChains.delete(trainerId)
  }
  
  getSpecialEvents(): SpecialEvent[] {
    return Array.from(this.specialEvents.values())
  }
  
  activateEvent(eventId: string): boolean {
    const event = this.specialEvents.get(eventId)
    if (event) {
      event.active = true
      return true
    }
    return false
  }
  
  deactivateEvent(eventId: string): boolean {
    const event = this.specialEvents.get(eventId)
    if (event) {
      event.active = false
      return true
    }
    return false
  }
}

// シングルトンインスタンス
export const pokemonEncounterSystem = PokemonEncounterSystem.getInstance()