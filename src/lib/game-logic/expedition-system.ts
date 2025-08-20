// 派遣システム - 基本ゲームロジック
import { GAME_BALANCE } from '@/config/gameBalance'
import { gameRandom } from './random-system'

// 派遣に関する型定義
export interface ExpeditionLocation {
  id: string
  nameJa: string
  nameEn: string
  distanceLevel: number // 1-10 (近い〜遠い)
  encounterTypes: string[] // 出現するポケモンタイプ
  baseRewardMoney: number
  baseExperience: number
  dangerLevel: number // 1-5 (安全〜危険)
  requiredLevel: number // トレーナーの最低レベル
  description: string
}

export interface ExpeditionParams {
  trainerId: string
  locationId: string
  durationHours: number
  strategy: 'balanced' | 'aggressive' | 'defensive' | 'exploration'
  playerAdvice?: PlayerAdvice[]
}

export interface PlayerAdvice {
  type: 'pokemon_priority' | 'safety_level' | 'exploration_focus' | 'battle_strategy'
  value: string | number
  description: string
}

export interface ExpeditionResult {
  success: boolean
  successRate: number
  finalScore: number
  rewards: {
    money: number
    experience: number
    items: string[]
    pokemonCaught: any[]
  }
  events: ExpeditionEvent[]
  trainerStatus: {
    healthLoss: number
    experienceGained: number
    levelUp: boolean
  }
  duration: number // 実際にかかった時間
}

export interface ExpeditionEvent {
  id: string
  type: 'pokemon_encounter' | 'battle' | 'discovery' | 'danger' | 'rare_find'
  title: string
  description: string
  outcome: 'success' | 'failure' | 'partial'
  effects: {
    money?: number
    experience?: number
    health?: number
    pokemon?: any
    items?: string[]
  }
}

// 派遣先のマスターデータ（gameBalance.tsと統合）
import { EXPEDITION_LOCATIONS as CONFIG_LOCATIONS } from '@/config/gameBalance'

export const EXPEDITION_LOCATIONS: ExpeditionLocation[] = [
  // CONFIG_LOCATIONSをExpeditionLocation形式に変換
  {
    id: 'viridian_forest',
    nameJa: CONFIG_LOCATIONS.VIRIDIAN_FOREST.nameJa,
    nameEn: 'Viridian Forest',
    distanceLevel: CONFIG_LOCATIONS.VIRIDIAN_FOREST.distanceLevel,
    encounterTypes: [...CONFIG_LOCATIONS.VIRIDIAN_FOREST.encounterTypes],
    baseRewardMoney: CONFIG_LOCATIONS.VIRIDIAN_FOREST.baseRewardMoney,
    baseExperience: 75,
    dangerLevel: CONFIG_LOCATIONS.VIRIDIAN_FOREST.riskLevel,
    requiredLevel: 3,
    description: '虫タイプのポケモンが豊富。キャタピーやビードルが生息している。'
  },
  {
    id: 'route_22',
    nameJa: CONFIG_LOCATIONS.ROUTE_22.nameJa,
    nameEn: 'Route 22',
    distanceLevel: CONFIG_LOCATIONS.ROUTE_22.distanceLevel,
    encounterTypes: [...CONFIG_LOCATIONS.ROUTE_22.encounterTypes],
    baseRewardMoney: CONFIG_LOCATIONS.ROUTE_22.baseRewardMoney,
    baseExperience: 50,
    dangerLevel: CONFIG_LOCATIONS.ROUTE_22.riskLevel,
    requiredLevel: 1,
    description: '初心者向けの安全な道路。マンキーなども出現する。'
  },
  {
    id: 'pewter_gym',
    nameJa: CONFIG_LOCATIONS.PEWTER_GYM.nameJa,
    nameEn: 'Pewter Gym',
    distanceLevel: CONFIG_LOCATIONS.PEWTER_GYM.distanceLevel,
    encounterTypes: [...CONFIG_LOCATIONS.PEWTER_GYM.encounterTypes],
    baseRewardMoney: CONFIG_LOCATIONS.PEWTER_GYM.baseRewardMoney,
    baseExperience: 150,
    dangerLevel: CONFIG_LOCATIONS.PEWTER_GYM.riskLevel,
    requiredLevel: 8,
    description: 'ニビジム周辺。岩タイプのポケモンと訓練できる。'
  },
  {
    id: 'mt_moon',
    nameJa: CONFIG_LOCATIONS.MT_MOON.nameJa,
    nameEn: 'Mt. Moon',
    distanceLevel: CONFIG_LOCATIONS.MT_MOON.distanceLevel,
    encounterTypes: [...CONFIG_LOCATIONS.MT_MOON.encounterTypes],
    baseRewardMoney: CONFIG_LOCATIONS.MT_MOON.baseRewardMoney,
    baseExperience: 200,
    dangerLevel: CONFIG_LOCATIONS.MT_MOON.riskLevel,
    requiredLevel: 12,
    description: '岩タイプのポケモンが多く、月の石などのレアアイテムも見つかる。'
  },
  {
    id: 'cerulean_cave',
    nameJa: CONFIG_LOCATIONS.CERULEAN_CAVE.nameJa,
    nameEn: 'Cerulean Cave',
    distanceLevel: CONFIG_LOCATIONS.CERULEAN_CAVE.distanceLevel,
    encounterTypes: [...CONFIG_LOCATIONS.CERULEAN_CAVE.encounterTypes],
    baseRewardMoney: CONFIG_LOCATIONS.CERULEAN_CAVE.baseRewardMoney,
    baseExperience: 600,
    dangerLevel: CONFIG_LOCATIONS.CERULEAN_CAVE.riskLevel,
    requiredLevel: 30,
    description: '伝説のポケモンが眠ると言われる神秘の洞窟。最高難易度。'
  }
]

// 派遣システムのメインクラス
export class ExpeditionSystem {
  // 派遣成功率を計算
  calculateExpeditionSuccess(
    trainer: any,
    location: ExpeditionLocation,
    party: any[],
    strategy: string,
    playerAdvice: PlayerAdvice[] = []
  ): number {
    // 1. ベース成功率（場所の難易度による）
    const baseSuccessRate = Math.max(0.3, 1.0 - (location.dangerLevel * 0.15))
    
    // 2. トレーナーレベル補正
    const levelDifference = (trainer.level || 1) - location.requiredLevel
    const levelMultiplier = Math.max(0.5, 1.0 + (levelDifference * 0.05))
    
    // 3. パーティ戦力計算
    const partyPower = this.calculatePartyPower(party, location)
    const partyMultiplier = Math.min(2.0, 0.5 + (partyPower / 1000))
    
    // 4. 戦略補正
    const strategyMultiplier = this.getStrategyMultiplier(strategy, location)
    
    // 5. プレイヤーアドバイス効果
    const adviceMultiplier = this.calculateAdviceEffect(playerAdvice, trainer)
    
    // 6. 職業補正（トレーナーに職業がある場合）
    const jobMultiplier = this.getJobMultiplier(trainer.job || 'ranger', location)
    
    // 最終成功率計算
    const finalSuccessRate = baseSuccessRate 
      * levelMultiplier 
      * partyMultiplier 
      * strategyMultiplier 
      * adviceMultiplier
      * jobMultiplier
    
    return Math.min(0.95, Math.max(0.05, finalSuccessRate))
  }

  // パーティ戦力計算
  private calculatePartyPower(party: any[], location: ExpeditionLocation): number {
    if (!party || party.length === 0) return 100 // 最低限の戦力
    
    let totalPower = 0
    
    for (const pokemon of party) {
      // 基礎戦力（レベル + 種族値）
      const level = pokemon.level || 5
      const basePower = level * 10 + this.calculateSpeciesPower(pokemon.species || pokemon)
      
      // タイプ相性補正
      const typeMultiplier = this.calculateTypeAdvantage(
        pokemon.types || pokemon.species?.types || ['normal'],
        location.encounterTypes
      )
      
      // HP状態補正
      const hpMultiplier = (pokemon.current_hp || pokemon.max_hp || 100) / (pokemon.max_hp || 100)
      
      const pokemonPower = basePower * typeMultiplier * hpMultiplier
      totalPower += pokemonPower
    }
    
    // パーティサイズボーナス（6体満員で+20%）
    const sizeBonus = 1.0 + (Math.min(party.length, 6) / 6) * 0.2
    
    return totalPower * sizeBonus
  }

  // ポケモンの種族値から戦力計算
  private calculateSpeciesPower(species: any): number {
    const baseStats = species.base_stats || species.baseStats || {
      hp: 50, attack: 50, defense: 50, 
      special_attack: 50, special_defense: 50, speed: 50
    }
    
    // 戦闘力 = HP*0.3 + Attack*0.4 + Defense*0.3
    const battlePower = baseStats.hp * 0.3 + baseStats.attack * 0.4 + baseStats.defense * 0.3
    
    // 探索力 = Speed*0.5 + (Special Attack + Special Defense)*0.25
    const explorationPower = baseStats.speed * 0.5 + 
      (baseStats.special_attack + baseStats.special_defense) * 0.25
    
    return (battlePower + explorationPower) / 2
  }

  // タイプ相性計算
  private calculateTypeAdvantage(pokemonTypes: string[], encounterTypes: string[]): number {
    // 簡略化したタイプ相性
    const typeEffectiveness: Record<string, Record<string, number>> = {
      fire: { grass: 2.0, water: 0.5, fire: 0.5 },
      water: { fire: 2.0, grass: 0.5, water: 0.5 },
      grass: { water: 2.0, fire: 0.5, grass: 0.5 },
      electric: { water: 2.0, flying: 2.0, electric: 0.5, ground: 0.0 },
      rock: { flying: 2.0, fire: 2.0, fighting: 0.5, ground: 0.5 },
      ground: { electric: 2.0, fire: 2.0, flying: 0.0 },
      fighting: { normal: 2.0, rock: 2.0, psychic: 0.0 },
      psychic: { fighting: 2.0, poison: 2.0, psychic: 0.5 }
    }
    
    let averageEffectiveness = 1.0
    let effectivenessCount = 0
    
    for (const pokemonType of pokemonTypes) {
      for (const encounterType of encounterTypes) {
        const effectiveness = typeEffectiveness[pokemonType]?.[encounterType] ?? 1.0
        averageEffectiveness += effectiveness
        effectivenessCount++
      }
    }
    
    return effectivenessCount > 0 ? averageEffectiveness / effectivenessCount : 1.0
  }

  // 戦略補正計算
  private getStrategyMultiplier(strategy: string, location: ExpeditionLocation): number {
    const strategyEffects: Record<string, Record<string, number>> = {
      balanced: { success: 1.0, safety: 1.0, reward: 1.0 },
      aggressive: { success: 1.2, safety: 0.8, reward: 1.3 },
      defensive: { success: 0.85, safety: 1.3, reward: 0.8 },
      exploration: { success: 0.9, safety: 0.9, reward: 1.4 }
    }
    
    const strategyData = strategyEffects[strategy] || strategyEffects.balanced
    
    // 危険地帯では防御戦略が有利
    if (location.dangerLevel >= 4 && strategy === 'defensive') {
      return strategyData.success * 1.25
    }
    
    // 安全地帯では探索戦略が有利
    if (location.dangerLevel <= 2 && strategy === 'exploration') {
      return strategyData.success * 1.1
    }
    
    return strategyData.success
  }

  // プレイヤーアドバイス効果計算
  private calculateAdviceEffect(playerAdvice: PlayerAdvice[], trainer: any): number {
    if (!playerAdvice || playerAdvice.length === 0) return 1.0
    
    // トレーナーの遵守率（基本50% + 信頼度 + 性格補正）
    const baseTrust = trainer.trust_level || 50
    const complianceRate = Math.min(95, Math.max(20, baseTrust + (trainer.personality_compliance || 0)))
    
    let adviceBonus = 0
    
    for (const advice of playerAdvice) {
      if (gameRandom.chance(complianceRate / 100)) {
        // アドバイスが採用された場合のボーナス
        adviceBonus += GAME_BALANCE.PLAYER_INTERVENTION_BONUS / playerAdvice.length
      }
    }
    
    return 1.0 + adviceBonus
  }

  // 職業補正計算
  private getJobMultiplier(jobName: string, location: ExpeditionLocation): number {
    const jobMultipliers: Record<string, Record<string, number>> = {
      ranger: { 
        forest: 1.3, route: 1.2, mountain: 1.1, cave: 0.9 
      },
      explorer: { 
        cave: 1.3, mountain: 1.2, tunnel: 1.2, route: 1.1 
      },
      researcher: { 
        lab: 1.4, zone: 1.2, cave: 1.1, route: 0.9 
      },
      battler: { 
        gym: 1.4, road: 1.2, tunnel: 1.1, route: 1.0 
      }
    }
    
    const locationTypeMap: Record<string, string> = {
      route: 'route', forest: 'forest', mountain: 'mountain',
      cave: 'cave', tunnel: 'tunnel', zone: 'zone', road: 'road'
    }
    
    // 場所名から地形タイプを推定
    let locationType = 'route'
    for (const [type, keyword] of Object.entries(locationTypeMap)) {
      if (location.nameEn.toLowerCase().includes(keyword) || 
          location.nameJa.includes(keyword)) {
        locationType = type
        break
      }
    }
    
    return jobMultipliers[jobName]?.[locationType] || 1.0
  }

  // 派遣実行
  async executeExpedition(params: ExpeditionParams): Promise<ExpeditionResult> {
    const location = EXPEDITION_LOCATIONS.find(loc => loc.id === params.locationId)
    if (!location) {
      throw new Error(`Location not found: ${params.locationId}`)
    }
    
    // モックトレーナーデータ（実際はDBから取得）
    const trainer = {
      id: params.trainerId,
      level: 10,
      job: 'ranger',
      trust_level: 60,
      personality_compliance: 10
    }
    
    // モックパーティデータ（実際はDBから取得）
    const party = [
      { 
        level: 12, 
        types: ['normal'], 
        species: { base_stats: { hp: 45, attack: 60, defense: 40, special_attack: 35, special_defense: 35, speed: 70 } },
        current_hp: 100, 
        max_hp: 100 
      }
    ]
    
    // 成功率計算
    const successRate = this.calculateExpeditionSuccess(
      trainer, location, party, params.strategy, params.playerAdvice
    )
    
    // 成功判定
    const success = gameRandom.chance(successRate)
    
    // 実際の派遣時間（成功度によって変動）
    const baseTime = params.durationHours * 60 // 分に変換
    const timeVariation = success ? 
      gameRandom.range(0.8, 1.0) : // 成功時は短縮
      gameRandom.range(1.0, 1.3)   // 失敗時は延長
    const actualDuration = Math.floor(baseTime * timeVariation)
    
    // イベント生成
    const events = this.generateExpeditionEvents(location, success, params.strategy)
    
    // 報酬計算
    const rewards = this.calculateRewards(location, success, successRate, events)
    
    // トレーナー状態更新
    const trainerStatus = this.calculateTrainerStatusChange(trainer, location, success, actualDuration)
    
    return {
      success,
      successRate,
      finalScore: Math.floor(successRate * 100),
      rewards,
      events,
      trainerStatus,
      duration: actualDuration
    }
  }

  // 派遣イベント生成
  private generateExpeditionEvents(
    location: ExpeditionLocation, 
    success: boolean, 
    strategy: string
  ): ExpeditionEvent[] {
    const events: ExpeditionEvent[] = []
    
    // 基本的なポケモン遭遇イベント
    if (success || gameRandom.chance(0.7)) {
      events.push({
        id: `encounter_${Date.now()}`,
        type: 'pokemon_encounter',
        title: 'ポケモンとの遭遇',
        description: `${location.nameJa}で野生のポケモンに遭遇しました。`,
        outcome: success ? 'success' : 'partial',
        effects: {
          experience: gameRandom.integer(20, 80),
          money: gameRandom.integer(100, 500)
        }
      })
    }
    
    // 戦略に応じた特別イベント
    if (strategy === 'exploration' && gameRandom.chance(0.4)) {
      events.push({
        id: `discovery_${Date.now()}`,
        type: 'discovery',
        title: 'アイテム発見',
        description: '探索中に珍しいアイテムを発見しました。',
        outcome: 'success',
        effects: {
          items: ['モンスターボール', 'キズぐすり'],
          money: gameRandom.integer(200, 800)
        }
      })
    }
    
    // 危険イベント（高難易度地域）
    if (location.dangerLevel >= 4 && gameRandom.chance(0.3)) {
      const dangerOutcome = strategy === 'defensive' ? 'partial' : 
                           success ? 'success' : 'failure'
      events.push({
        id: `danger_${Date.now()}`,
        type: 'danger',
        title: '危険な状況',
        description: '予期しない危険に遭遇しました。',
        outcome: dangerOutcome,
        effects: {
          health: dangerOutcome === 'failure' ? -20 : -5,
          experience: dangerOutcome === 'success' ? 50 : 10
        }
      })
    }
    
    return events
  }

  // 報酬計算
  private calculateRewards(
    location: ExpeditionLocation, 
    success: boolean, 
    successRate: number,
    events: ExpeditionEvent[]
  ): ExpeditionResult['rewards'] {
    const baseMultiplier = success ? 1.0 : 0.3
    const rateMultiplier = 0.5 + (successRate * 0.5)
    
    // 基本報酬
    let money = Math.floor(location.baseRewardMoney * baseMultiplier * rateMultiplier)
    let experience = Math.floor(location.baseExperience * baseMultiplier * rateMultiplier)
    
    // イベントボーナス
    for (const event of events) {
      money += event.effects.money || 0
      experience += event.effects.experience || 0
    }
    
    // アイテム収集
    const items: string[] = []
    for (const event of events) {
      if (event.effects.items) {
        items.push(...event.effects.items)
      }
    }
    
    // 基本アイテム
    if (success) {
      items.push('モンスターボール')
      if (gameRandom.chance(0.3)) {
        items.push('キズぐすり')
      }
    }
    
    // ポケモン捕獲（簡易版）
    const pokemonCaught: any[] = []
    if (success && gameRandom.chance(0.6)) {
      pokemonCaught.push({
        id: `caught_${Date.now()}`,
        species_id: gameRandom.integer(1, 151), // 第1世代
        level: gameRandom.integer(
          Math.max(1, location.requiredLevel - 2), 
          location.requiredLevel + 5
        ),
        location: location.nameJa,
        caught_at: new Date().toISOString()
      })
    }
    
    return {
      money,
      experience,
      items,
      pokemonCaught
    }
  }

  // トレーナー状態変化計算
  private calculateTrainerStatusChange(
    trainer: any, 
    location: ExpeditionLocation, 
    success: boolean,
    duration: number
  ): ExpeditionResult['trainerStatus'] {
    // 体力消耗（距離と時間に比例）
    const baseHealthLoss = location.distanceLevel * 2 + Math.floor(duration / 60)
    const healthLoss = success ? baseHealthLoss : baseHealthLoss * 1.5
    
    // 経験値獲得
    const baseExp = location.baseExperience * 0.1 // トレーナー経験値は少なめ
    const experienceGained = Math.floor(baseExp * (success ? 1.0 : 0.5))
    
    // レベルアップ判定（簡易）
    const currentExp = trainer.experience || 0
    const newExp = currentExp + experienceGained
    const currentLevel = trainer.level || 1
    const expForNextLevel = currentLevel * 1000 // 簡易計算
    const levelUp = newExp >= expForNextLevel
    
    return {
      healthLoss: Math.max(0, Math.floor(healthLoss)),
      experienceGained,
      levelUp
    }
  }

  // 利用可能な派遣先取得
  getAvailableLocations(trainerLevel: number): ExpeditionLocation[] {
    return EXPEDITION_LOCATIONS.filter(location => 
      location.requiredLevel <= trainerLevel
    ).sort((a, b) => a.distanceLevel - b.distanceLevel)
  }

  // 推奨派遣先取得
  getRecommendedLocation(trainer: any, party: any[]): ExpeditionLocation | null {
    const availableLocations = this.getAvailableLocations(trainer.level || 1)
    
    if (availableLocations.length === 0) return null
    
    // パーティの平均レベルを計算
    const avgPartyLevel = party.length > 0 ? 
      party.reduce((sum, p) => sum + (p.level || 5), 0) / party.length : 5
    
    // トレーナーレベルとパーティレベルに応じた推奨
    const targetLevel = Math.floor((trainer.level + avgPartyLevel) / 2)
    
    // 最適な難易度の場所を選択
    const suitableLocations = availableLocations.filter(loc => 
      loc.requiredLevel <= targetLevel && loc.requiredLevel >= targetLevel - 5
    )
    
    if (suitableLocations.length === 0) {
      return availableLocations[availableLocations.length - 1] // 最高レベル
    }
    
    // 最も報酬効率の良い場所を選択
    return suitableLocations.reduce((best, current) => 
      (current.baseRewardMoney / current.dangerLevel) > (best.baseRewardMoney / best.dangerLevel) 
        ? current : best
    )
  }
}

export const expeditionSystem = new ExpeditionSystem()