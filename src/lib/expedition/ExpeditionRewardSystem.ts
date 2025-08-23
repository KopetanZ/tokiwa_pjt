/**
 * 派遣報酬・ドロップシステム
 * 派遣成果物の生成、レアリティ計算、報酬分配を管理
 */

import type { Expedition, ExpeditionEvent, Trainer, Pokemon, Item } from '@/lib/game-state/types'
import { realtimeManager } from '@/lib/real-time/RealtimeManager'
import { memoize, LRUCache } from '@/lib/performance/PerformanceOptimizer'

export interface RewardCalculation {
  baseReward: number
  bonusMultipliers: RewardMultiplier[]
  totalMultiplier: number
  finalReward: number
  breakdown: RewardBreakdown
}

export interface RewardMultiplier {
  source: string
  multiplier: number
  description: string
}

export interface RewardBreakdown {
  baseReward: number
  difficultyBonus: number
  performanceBonus: number
  durationBonus: number
  riskBonus: number
  trainerSkillBonus: number
  locationBonus: number
  eventBonus: number
}

export interface DropTable {
  locationId: number
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
  items: DropItem[]
  pokemon: DropPokemon[]
  contextModifiers: DropModifier[]
}

export interface DropItem {
  itemId: string
  name: string
  type: Item['type']
  baseDropRate: number // 0.0 to 1.0
  quantity: { min: number; max: number }
  value: number
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
  requirements?: DropRequirement[]
}

export interface DropPokemon {
  speciesId: number
  name: string
  baseDropRate: number // 0.0 to 1.0
  levelRange: { min: number; max: number }
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
  requirements?: DropRequirement[]
}

export interface DropRequirement {
  type: 'trainer_skill' | 'expedition_mode' | 'stage' | 'event_completion' | 'weather' | 'time'
  value: any
  description: string
}

export interface DropModifier {
  condition: string
  pokemonRateMultiplier: number
  itemRateMultiplier: number
  rarityBonus: number
  description: string
}

export interface ExpeditionLoot {
  pokemon: GeneratedPokemon[]
  items: GeneratedItem[]
  money: number
  experience: number
  trainerExperience: number
  specialRewards: SpecialReward[]
  totalValue: number
  summary: string
}

export interface GeneratedPokemon extends Omit<Pokemon, 'id' | 'caughtDate' | 'caughtBy' | 'originalTrainer'> {
  catchCircumstances: string
  rarityBonus: number
}

export interface GeneratedItem extends Item {
  foundCircumstances: string
  rarityBonus: number
}

export interface SpecialReward {
  id: string
  type: 'achievement' | 'unlock' | 'bonus' | 'discovery'
  name: string
  description: string
  value: any
}

/**
 * 派遣報酬システム
 */
export class ExpeditionRewardSystem {
  private static instance: ExpeditionRewardSystem
  private dropTables = new Map<number, DropTable>() // locationId -> DropTable
  private rewardCache = new LRUCache<RewardCalculation>(200)
  private pokemonDatabase = new Map<number, any>() // speciesId -> pokemon data
  private itemDatabase = new Map<string, any>() // itemId -> item data
  
  private constructor() {
    this.initializeDropTables()
    this.initializePokemonDatabase()
    this.initializeItemDatabase()
  }
  
  static getInstance(): ExpeditionRewardSystem {
    if (!ExpeditionRewardSystem.instance) {
      ExpeditionRewardSystem.instance = new ExpeditionRewardSystem()
    }
    return ExpeditionRewardSystem.instance
  }
  
  /**
   * 派遣完了時の報酬を計算・生成
   */
  async generateExpeditionRewards(
    expedition: Expedition,
    trainer: Trainer,
    events: ExpeditionEvent[],
    successRate: number,
    actualDuration: number
  ): Promise<ExpeditionLoot> {
    console.log(`💰 報酬生成開始: ${expedition.id}`)
    
    // 基本報酬計算
    const rewardCalc = this.calculateMoneyReward(expedition, trainer, events, successRate, actualDuration)
    
    // ドロップテーブルを取得
    const dropTable = this.getDropTable(expedition.locationId, expedition.mode)
    
    // ポケモンを生成
    const pokemon = await this.generatePokemon(dropTable, trainer, events, successRate, expedition)
    
    // アイテムを生成
    const items = await this.generateItems(dropTable, trainer, events, successRate)
    
    // 経験値を計算
    const experience = this.calculateExperience(expedition, events, pokemon, items, successRate)
    const trainerExperience = this.calculateTrainerExperience(trainer, expedition, events, successRate)
    
    // 特別報酬をチェック
    const specialRewards = this.checkSpecialRewards(expedition, trainer, events, pokemon, items)
    
    // 総価値を計算
    const totalValue = rewardCalc.finalReward + 
      items.reduce((sum, item) => sum + item.value * item.quantity, 0) +
      pokemon.length * 1000 // ポケモンの価値を簡易計算
    
    const loot: ExpeditionLoot = {
      pokemon,
      items,
      money: rewardCalc.finalReward,
      experience,
      trainerExperience,
      specialRewards,
      totalValue,
      summary: this.generateLootSummary(rewardCalc.finalReward, pokemon, items, specialRewards)
    }
    
    console.log(`✨ 報酬生成完了: ¥${rewardCalc.finalReward}, ポケモン${pokemon.length}匹, アイテム${items.length}個`)
    
    // リアルタイム通知
    realtimeManager.emitDataChange({
      category: 'expeditions',
      action: 'create',
      entityId: expedition.id,
      data: { loot, calculation: rewardCalc },
      source: 'system_update'
    })
    
    return loot
  }
  
  /**
   * 報酬金額を計算
   */
  private calculateMoneyReward(
    expedition: Expedition,
    trainer: Trainer,
    events: ExpeditionEvent[],
    successRate: number,
    actualDuration: number
  ): RewardCalculation {
    const cacheKey = `money_${expedition.id}_${successRate}_${actualDuration}`
    const cached = this.rewardCache.get(cacheKey)
    if (cached) return cached
    
    // ベース報酬（時間とロケーション難易度に基づく）
    const locationDifficulty = this.getLocationDifficulty(expedition.locationId)
    const baseReward = Math.floor(
      (expedition.targetDuration * 100) * // 時間あたり100円
      (1 + locationDifficulty * 0.5) * // 難易度ボーナス
      successRate // 成功度による調整
    )
    
    const breakdown: RewardBreakdown = {
      baseReward,
      difficultyBonus: 0,
      performanceBonus: 0,
      durationBonus: 0,
      riskBonus: 0,
      trainerSkillBonus: 0,
      locationBonus: 0,
      eventBonus: 0
    }
    
    const multipliers: RewardMultiplier[] = []
    
    // 難易度ボーナス
    if (locationDifficulty > 0.6) {
      const bonus = Math.floor(baseReward * 0.3)
      breakdown.difficultyBonus = bonus
      multipliers.push({
        source: 'difficulty',
        multiplier: 1.3,
        description: `高難易度ボーナス: +${bonus}円`
      })
    }
    
    // パフォーマンスボーナス
    if (successRate > 0.8) {
      const bonus = Math.floor(baseReward * 0.2)
      breakdown.performanceBonus = bonus
      multipliers.push({
        source: 'performance',
        multiplier: 1.2,
        description: `高成功率ボーナス: +${bonus}円`
      })
    }
    
    // 時間効率ボーナス/ペナルティ
    const plannedDuration = expedition.targetDuration * 60 * 60 * 1000 // ms
    const durationRatio = actualDuration / plannedDuration
    if (durationRatio < 0.9) {
      const bonus = Math.floor(baseReward * 0.15)
      breakdown.durationBonus = bonus
      multipliers.push({
        source: 'duration',
        multiplier: 1.15,
        description: `効率ボーナス: +${bonus}円`
      })
    } else if (durationRatio > 1.2) {
      const penalty = Math.floor(baseReward * 0.1)
      breakdown.durationBonus = -penalty
      multipliers.push({
        source: 'duration',
        multiplier: 0.9,
        description: `遅延ペナルティ: -${penalty}円`
      })
    }
    
    // リスク取りボーナス
    if (expedition.mode === 'aggressive') {
      const bonus = Math.floor(baseReward * 0.25)
      breakdown.riskBonus = bonus
      multipliers.push({
        source: 'risk',
        multiplier: 1.25,
        description: `積極的戦略ボーナス: +${bonus}円`
      })
    }
    
    // トレーナースキルボーナス
    const avgSkill = Object.values(trainer.skills).reduce((a, b) => a + b, 0) / Object.keys(trainer.skills).length
    if (avgSkill > 6) {
      const bonus = Math.floor(baseReward * (avgSkill - 6) * 0.05)
      breakdown.trainerSkillBonus = bonus
      multipliers.push({
        source: 'skill',
        multiplier: 1 + (avgSkill - 6) * 0.05,
        description: `スキルボーナス: +${bonus}円`
      })
    }
    
    // イベントボーナス
    const successfulEvents = events.filter(e => e.resolved && e.result?.includes('成功')).length
    if (successfulEvents > 0) {
      const bonus = successfulEvents * 200
      breakdown.eventBonus = bonus
      multipliers.push({
        source: 'events',
        multiplier: 1 + successfulEvents * 0.1,
        description: `イベント成功ボーナス: +${bonus}円`
      })
    }
    
    // 最終計算
    const totalMultiplier = multipliers.reduce((total, m) => total * m.multiplier, 1)
    const finalReward = Math.floor(
      baseReward + 
      breakdown.difficultyBonus + 
      breakdown.performanceBonus + 
      breakdown.durationBonus + 
      breakdown.riskBonus + 
      breakdown.trainerSkillBonus + 
      breakdown.locationBonus + 
      breakdown.eventBonus
    )
    
    const calculation: RewardCalculation = {
      baseReward,
      bonusMultipliers: multipliers,
      totalMultiplier,
      finalReward,
      breakdown
    }
    
    this.rewardCache.set(cacheKey, calculation)
    return calculation
  }
  
  /**
   * ポケモンを生成
   */
  private async generatePokemon(
    dropTable: DropTable,
    trainer: Trainer,
    events: ExpeditionEvent[],
    successRate: number,
    expedition: Expedition
  ): Promise<GeneratedPokemon[]> {
    const pokemon: GeneratedPokemon[] = []
    
    for (const pokemonDrop of dropTable.pokemon) {
      // ドロップ率を計算
      let dropRate = pokemonDrop.baseDropRate * successRate
      
      // トレーナースキルによる修正
      dropRate *= 1 + (trainer.skills.capture / 10)
      
      // イベントによる修正
      const captureEvents = events.filter(e => 
        e.type === 'pokemon_encounter' && e.resolved
      ).length
      dropRate *= 1 + (captureEvents * 0.1)
      
      // 要件チェック
      if (pokemonDrop.requirements && !this.checkDropRequirements(pokemonDrop.requirements, { trainer, events })) {
        continue
      }
      
      // ドロップ判定
      if (Math.random() < dropRate) {
        const generatedPokemon = await this.createPokemon(pokemonDrop, trainer, expedition)
        pokemon.push(generatedPokemon)
        
        // レアポケモンの場合、追加生成確率を下げる
        if (pokemonDrop.rarity === 'rare' || pokemonDrop.rarity === 'legendary') {
          break
        }
      }
    }
    
    return pokemon
  }
  
  /**
   * アイテムを生成
   */
  private async generateItems(
    dropTable: DropTable,
    trainer: Trainer,
    events: ExpeditionEvent[],
    successRate: number
  ): Promise<GeneratedItem[]> {
    const items: GeneratedItem[] = []
    
    for (const itemDrop of dropTable.items) {
      // ドロップ率を計算
      let dropRate = itemDrop.baseDropRate * successRate
      
      // トレーナースキルによる修正
      dropRate *= 1 + (trainer.skills.exploration / 10)
      
      // イベントによる修正
      const discoveryEvents = events.filter(e => 
        e.type === 'item_discovery' && e.resolved
      ).length
      dropRate *= 1 + (discoveryEvents * 0.15)
      
      // 要件チェック
      if (itemDrop.requirements && !this.checkDropRequirements(itemDrop.requirements, { trainer, events })) {
        continue
      }
      
      // ドロップ判定
      if (Math.random() < dropRate) {
        const quantity = Math.floor(
          Math.random() * (itemDrop.quantity.max - itemDrop.quantity.min + 1) + itemDrop.quantity.min
        )
        
        const generatedItem: GeneratedItem = {
          id: `found_${itemDrop.itemId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: itemDrop.name,
          nameJa: itemDrop.name,
          type: itemDrop.type,
          description: `派遣で発見された${itemDrop.name}`,
          quantity,
          value: itemDrop.value,
          foundCircumstances: this.generateItemFoundStory(itemDrop, trainer),
          rarityBonus: this.getRarityBonus(itemDrop.rarity)
        }
        
        items.push(generatedItem)
      }
    }
    
    return items
  }
  
  /**
   * ポケモンを作成
   */
  private async createPokemon(pokemonDrop: DropPokemon, trainer: Trainer, expedition: Expedition): Promise<GeneratedPokemon> {
    const speciesData = this.pokemonDatabase.get(pokemonDrop.speciesId)
    const level = Math.floor(
      Math.random() * (pokemonDrop.levelRange.max - pokemonDrop.levelRange.min + 1) + pokemonDrop.levelRange.min
    )
    
    // 個体値をランダム生成（レアリティに応じて品質調整）
    const ivQuality = this.getIVQualityForRarity(pokemonDrop.rarity)
    const ivs = this.generateIVs(ivQuality)
    
    // ステータス計算
    const baseStats = speciesData?.baseStats || { hp: 45, attack: 49, defense: 49, specialAttack: 65, specialDefense: 65, speed: 45 }
    const stats = this.calculatePokemonStats(baseStats, level, ivs)
    
    return {
      speciesId: pokemonDrop.speciesId,
      name: pokemonDrop.name,
      nameJa: pokemonDrop.name,
      level,
      experience: 0,
      nextLevelExp: this.calculateNextLevelExp(level),
      hp: stats.hp,
      maxHp: stats.hp,
      attack: stats.attack,
      defense: stats.defense,
      specialAttack: stats.specialAttack,
      specialDefense: stats.specialDefense,
      speed: stats.speed,
      status: 'healthy',
      moves: this.generateMoves(pokemonDrop.speciesId, level),
      ivs,
      nature: this.selectRandomNature(),
      catchCircumstances: this.generateCatchStory(pokemonDrop, trainer),
      rarityBonus: this.getRarityBonus(pokemonDrop.rarity),
      caughtLocation: expedition.locationId
    }
  }
  
  /**
   * ドロップ要件をチェック
   */
  private checkDropRequirements(requirements: DropRequirement[], context: any): boolean {
    return requirements.every(req => {
      switch (req.type) {
        case 'trainer_skill':
          const [skill, value] = req.value.split(':')
          return context.trainer.skills[skill] >= parseInt(value)
          
        case 'expedition_mode':
          return req.value.includes(context.expedition?.mode)
          
        case 'event_completion':
          return context.events.some((e: ExpeditionEvent) => 
            e.type === req.value && e.resolved
          )
          
        default:
          return true
      }
    })
  }
  
  /**
   * 経験値を計算
   */
  private calculateExperience(
    expedition: Expedition,
    events: ExpeditionEvent[],
    pokemon: GeneratedPokemon[],
    items: GeneratedItem[],
    successRate: number
  ): number {
    let experience = Math.floor(expedition.targetDuration * 10 * successRate) // 基本経験値
    
    // イベント成功による経験値
    experience += events.filter(e => e.resolved).length * 25
    
    // 発見による経験値
    experience += pokemon.length * 50
    experience += items.length * 20
    
    return experience
  }
  
  /**
   * トレーナー経験値を計算
   */
  private calculateTrainerExperience(
    trainer: Trainer,
    expedition: Expedition,
    events: ExpeditionEvent[],
    successRate: number
  ): number {
    let experience = Math.floor(expedition.targetDuration * 15 * successRate)
    
    // 難易度による経験値ボーナス
    const difficulty = this.getLocationDifficulty(expedition.locationId)
    experience *= 1 + difficulty
    
    // イベント処理による経験値
    experience += events.filter(e => e.resolved).length * 30
    
    return Math.floor(experience)
  }
  
  /**
   * 特別報酬をチェック
   */
  private checkSpecialRewards(
    expedition: Expedition,
    trainer: Trainer,
    events: ExpeditionEvent[],
    pokemon: GeneratedPokemon[],
    items: GeneratedItem[]
  ): SpecialReward[] {
    const rewards: SpecialReward[] = []
    
    // レアポケモン発見
    const legendaryPokemon = pokemon.filter(p => p.rarityBonus > 2)
    if (legendaryPokemon.length > 0) {
      rewards.push({
        id: 'legendary_discovery',
        type: 'achievement',
        name: '伝説の出会い',
        description: '非常に珍しいポケモンを発見しました',
        value: { pokemonIds: legendaryPokemon.map(p => p.speciesId) }
      })
    }
    
    // 完璧な派遣
    if (events.length > 5 && events.every(e => e.resolved)) {
      rewards.push({
        id: 'perfect_expedition',
        type: 'bonus',
        name: '完璧な派遣',
        description: '全てのイベントを成功させました',
        value: { moneyBonus: 1000, experienceBonus: 200 }
      })
    }
    
    // 新エリア解放条件
    if (expedition.locationId === 4 && pokemon.length >= 2) {
      rewards.push({
        id: 'area_unlock',
        type: 'unlock',
        name: '新エリア発見',
        description: '新しい探索エリアへの道が開けました',
        value: { areaId: 6 }
      })
    }
    
    return rewards
  }
  
  /**
   * 報酬サマリーを生成
   */
  private generateLootSummary(
    money: number,
    pokemon: GeneratedPokemon[],
    items: GeneratedItem[],
    specialRewards: SpecialReward[]
  ): string {
    const parts: string[] = []
    
    if (money > 0) {
      parts.push(`${money}円を獲得`)
    }
    
    if (pokemon.length > 0) {
      parts.push(`${pokemon.length}匹のポケモンを発見`)
    }
    
    if (items.length > 0) {
      parts.push(`${items.length}個のアイテムを入手`)
    }
    
    if (specialRewards.length > 0) {
      parts.push(`${specialRewards.length}個の特別報酬を獲得`)
    }
    
    return parts.join('、') || '何も見つかりませんでした'
  }
  
  /**
   * ドロップテーブルを取得
   */
  private getDropTable(locationId: number, mode: Expedition['mode']): DropTable {
    const baseTable = this.dropTables.get(locationId)
    if (!baseTable) {
      throw new Error(`ドロップテーブルが見つかりません: location ${locationId}`)
    }
    
    // モードに応じてテーブルを調整
    const modifiedTable = { ...baseTable }
    
    switch (mode) {
      case 'aggressive':
        modifiedTable.pokemon = modifiedTable.pokemon.map(p => ({
          ...p,
          baseDropRate: p.baseDropRate * 1.3
        }))
        break
        
      case 'safe':
        modifiedTable.items = modifiedTable.items.map(i => ({
          ...i,
          baseDropRate: i.baseDropRate * 1.2
        }))
        break
        
      case 'exploration':
        // バランス調整なし
        break
    }
    
    return modifiedTable
  }
  
  /**
   * ユーティリティメソッド群
   */
  private getLocationDifficulty(locationId: number): number {
    const difficultyMap: Record<number, number> = {
      1: 0.2, // 初心者の森
      2: 0.4, // 草原
      3: 0.6, // 山岳地帯
      4: 0.8, // 洞窟
      5: 1.0  // 危険地域
    }
    return difficultyMap[locationId] || 0.5
  }
  
  private getIVQualityForRarity(rarity: string): number {
    const qualityMap = {
      common: 0.3,
      uncommon: 0.5,
      rare: 0.7,
      legendary: 0.9
    }
    return qualityMap[rarity as keyof typeof qualityMap] || 0.3
  }
  
  private generateIVs(quality: number): Pokemon['ivs'] {
    const generateIV = () => Math.floor(Math.random() * (31 * quality) + (31 * (1 - quality)))
    
    return {
      hp: generateIV(),
      attack: generateIV(),
      defense: generateIV(),
      specialAttack: generateIV(),
      specialDefense: generateIV(),
      speed: generateIV()
    }
  }
  
  private calculatePokemonStats(baseStats: any, level: number, ivs: Pokemon['ivs']): any {
    const calculateStat = (base: number, iv: number, level: number) => 
      Math.floor((2 * base + iv) * level / 100) + 5
    
    return {
      hp: calculateStat(baseStats.hp, ivs.hp, level) + level + 10,
      attack: calculateStat(baseStats.attack, ivs.attack, level),
      defense: calculateStat(baseStats.defense, ivs.defense, level),
      specialAttack: calculateStat(baseStats.specialAttack, ivs.specialAttack, level),
      specialDefense: calculateStat(baseStats.specialDefense, ivs.specialDefense, level),
      speed: calculateStat(baseStats.speed, ivs.speed, level)
    }
  }
  
  private calculateNextLevelExp(level: number): number {
    return Math.floor(Math.pow(level, 3))
  }
  
  private generateMoves(speciesId: number, level: number): string[] {
    // TODO: より詳細な技習得システム
    const basicMoves = ['たいあたり', 'なきごえ', 'でんこうせっか']
    return basicMoves.slice(0, Math.min(3, Math.floor(level / 2) + 1))
  }
  
  private selectRandomNature(): string {
    const natures = [
      'がんばりや', 'さみしがり', 'いじっぱり', 'やんちゃ', 'ゆうかん',
      'ずぶとい', 'すなお', 'のんき', 'わんぱく', 'のうてんき'
    ]
    return natures[Math.floor(Math.random() * natures.length)]
  }
  
  private generateCatchStory(pokemonDrop: DropPokemon, trainer: Trainer): string {
    const stories = [
      `${trainer.name}が慎重にアプローチして捕獲しました`,
      `偶然の出会いから信頼関係を築いて捕獲`,
      `激しい戦いの末、実力を認められて仲間に`,
      `お互いを理解し、自然な流れで仲間になりました`
    ]
    return stories[Math.floor(Math.random() * stories.length)]
  }
  
  private generateItemFoundStory(itemDrop: DropItem, trainer: Trainer): string {
    const stories = [
      `${trainer.name}が探索中に発見しました`,
      `隠された場所から見つけ出しました`,
      `他のポケモンが教えてくれた場所で発見`,
      `偶然の幸運で見つけることができました`
    ]
    return stories[Math.floor(Math.random() * stories.length)]
  }
  
  private getRarityBonus(rarity: string): number {
    const bonusMap = {
      common: 0,
      uncommon: 1,
      rare: 2,
      legendary: 3
    }
    return bonusMap[rarity as keyof typeof bonusMap] || 0
  }
  
  /**
   * 初期化メソッド群
   */
  private initializeDropTables(): void {
    const tables: DropTable[] = [
      {
        locationId: 1,
        rarity: 'common',
        items: [
          {
            itemId: 'berry_oran',
            name: 'オレンのみ',
            type: 'medicine',
            baseDropRate: 0.3,
            quantity: { min: 1, max: 3 },
            value: 100,
            rarity: 'common'
          },
          {
            itemId: 'potion',
            name: 'キズぐすり',
            type: 'medicine',
            baseDropRate: 0.2,
            quantity: { min: 1, max: 2 },
            value: 200,
            rarity: 'uncommon'
          }
        ],
        pokemon: [
          {
            speciesId: 25,
            name: 'ピカチュウ',
            baseDropRate: 0.15,
            levelRange: { min: 3, max: 8 },
            rarity: 'uncommon'
          },
          {
            speciesId: 133,
            name: 'イーブイ',
            baseDropRate: 0.1,
            levelRange: { min: 5, max: 10 },
            rarity: 'rare'
          }
        ],
        contextModifiers: []
      }
      // 他のロケーションのドロップテーブルも同様に定義
    ]
    
    tables.forEach(table => {
      this.dropTables.set(table.locationId, table)
    })
    
    console.log(`💎 ${tables.length}個のドロップテーブルを初期化しました`)
  }
  
  private initializePokemonDatabase(): void {
    // 簡易ポケモンデータ
    const pokemonData = [
      {
        id: 25,
        name: 'ピカチュウ',
        baseStats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90 }
      },
      {
        id: 133,
        name: 'イーブイ',
        baseStats: { hp: 55, attack: 55, defense: 50, specialAttack: 45, specialDefense: 65, speed: 55 }
      }
    ]
    
    pokemonData.forEach(pokemon => {
      this.pokemonDatabase.set(pokemon.id, pokemon)
    })
  }
  
  private initializeItemDatabase(): void {
    // アイテムデータベースの初期化
    const itemData = [
      {
        id: 'berry_oran',
        name: 'オレンのみ',
        description: 'HPを少し回復する木の実'
      },
      {
        id: 'potion',
        name: 'キズぐすり',
        description: 'ポケモンのHPを20回復する'
      }
    ]
    
    itemData.forEach(item => {
      this.itemDatabase.set(item.id, item)
    })
  }
  
  /**
   * リソースを解放
   */
  destroy(): void {
    this.dropTables.clear()
    this.rewardCache.clear()
    this.pokemonDatabase.clear()
    this.itemDatabase.clear()
    
    console.log('🗑️ 報酬システムを破棄しました')
  }
}

// シングルトンインスタンス
export const expeditionRewardSystem = ExpeditionRewardSystem.getInstance()