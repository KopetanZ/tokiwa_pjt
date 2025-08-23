/**
 * ポケモン捕獲システム
 * 高度な捕獲メカニクス・戦闘・成功率計算
 */

import type { Pokemon, Trainer } from '@/lib/game-state/types'
import type { PokemonSpecies } from './PokemonDatabase'
import { pokemonDatabase } from './PokemonDatabase'
import { pokemonGenerator, type PokemonGenerationOptions } from './PokemonGenerator'
import { pokemonEncounterSystem, type EncounterResult } from './PokemonEncounterSystem'
import { performanceMonitor } from '@/lib/performance/PerformanceOptimizer'

export interface CaptureAttempt {
  id: string
  pokemonSpecies: PokemonSpecies
  trainer: Trainer
  captureMethod: CaptureMethod
  environment: CaptureEnvironment
  pokemonCondition: PokemonCondition
  timestamp: string
}

export interface CaptureMethod {
  type: 'pokeball' | 'greatball' | 'ultraball' | 'masterball' | 'specialty'
  name: string
  baseSuccessRate: number
  bonusEffects: CaptureBonus[]
  cost: number
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
  description: string
}

export interface CaptureEnvironment {
  terrain: 'grass' | 'water' | 'cave' | 'mountain' | 'urban' | 'forest'
  weather: 'sunny' | 'rain' | 'snow' | 'fog' | 'storm'
  timeOfDay: 'morning' | 'day' | 'evening' | 'night'
  disturbances: string[]
  advantage: number // -1.0 to 1.0
}

export interface PokemonCondition {
  healthPercentage: number // 0.0 to 1.0
  statusEffect?: 'sleep' | 'paralysis' | 'freeze' | 'burn' | 'poison'
  mood: 'aggressive' | 'defensive' | 'curious' | 'fearful' | 'calm'
  exhaustion: number // 0.0 to 1.0
  wariness: number // 0.0 to 1.0 (how alert/suspicious)
}

export interface CaptureBonus {
  type: 'species' | 'type' | 'condition' | 'environment' | 'skill' | 'item' | 'friendship'
  name: string
  multiplier: number
  description: string
  conditions?: string[]
}

export interface CaptureResult {
  success: boolean
  capturedPokemon?: Pokemon
  attempt: CaptureAttempt
  calculatedSuccessRate: number
  actualRoll: number
  bonusesApplied: CaptureBonus[]
  escapeAttempts: number
  damageDealt: number
  experience: {
    trainer: number
    pokemon: number
  }
  message: string
  consequences: CaptureConsequence[]
}

export interface CaptureConsequence {
  type: 'item_lost' | 'trainer_injury' | 'pokemon_injury' | 'relationship_change' | 'area_alert'
  severity: 'minor' | 'moderate' | 'major'
  description: string
  effect: string
}

export interface BattleAction {
  type: 'attack' | 'defend' | 'item' | 'capture' | 'flee'
  target?: 'self' | 'opponent'
  moveUsed?: string
  itemUsed?: string
  power?: number
  accuracy?: number
}

export interface BattleState {
  turn: number
  trainerPokemon?: Pokemon
  wildPokemon: {
    species: PokemonSpecies
    currentHp: number
    maxHp: number
    condition: PokemonCondition
    moves: string[]
    usedMoves: string[]
  }
  environment: CaptureEnvironment
  log: BattleLogEntry[]
}

export interface BattleLogEntry {
  turn: number
  actor: 'trainer' | 'wild_pokemon' | 'environment'
  action: string
  result: string
  damage?: number
  effect?: string
}

/**
 * ポケモン捕獲システム
 */
export class PokemonCaptureSystem {
  private static instance: PokemonCaptureSystem
  private captureMethods = new Map<string, CaptureMethod>()
  private activeBattles = new Map<string, BattleState>()
  private captureHistory = new Map<string, CaptureResult[]>() // trainerId -> history
  
  private constructor() {
    this.initializeCaptureMethods()
  }
  
  static getInstance(): PokemonCaptureSystem {
    if (!PokemonCaptureSystem.instance) {
      PokemonCaptureSystem.instance = new PokemonCaptureSystem()
    }
    return PokemonCaptureSystem.instance
  }
  
  /**
   * ポケモン捕獲を試行
   */
  async attemptCapture(
    pokemonSpecies: PokemonSpecies,
    trainer: Trainer,
    captureMethodId: string,
    environment: CaptureEnvironment,
    pokemonCondition?: Partial<PokemonCondition>
  ): Promise<CaptureResult> {
    return performanceMonitor.measureAsync('pokemon_capture', async () => {
      const captureMethod = this.captureMethods.get(captureMethodId)
      if (!captureMethod) {
        throw new Error(`捕獲方法が見つかりません: ${captureMethodId}`)
      }
      
      // ポケモンの状態を生成
      const condition = this.generatePokemonCondition(pokemonSpecies, environment, pokemonCondition)
      
      // 捕獲試行を作成
      const attempt: CaptureAttempt = {
        id: this.generateCaptureAttemptId(),
        pokemonSpecies,
        trainer,
        captureMethod,
        environment,
        pokemonCondition: condition,
        timestamp: new Date().toISOString()
      }
      
      // 成功率を計算
      const { successRate, bonuses } = this.calculateCaptureSuccessRate(attempt)
      
      // 捕獲判定
      const roll = Math.random()
      const success = roll < successRate
      
      let result: CaptureResult
      
      if (success) {
        // 捕獲成功
        const capturedPokemon = await this.createCapturedPokemon(pokemonSpecies, trainer, attempt)
        result = await this.handleCaptureSuccess(attempt, capturedPokemon, successRate, roll, bonuses)
      } else {
        // 捕獲失敗
        result = await this.handleCaptureFailure(attempt, successRate, roll, bonuses)
      }
      
      // 履歴に記録
      this.recordCaptureAttempt(trainer.id, result)
      
      return result
    })
  }
  
  /**
   * バトル開始
   */
  async initiateBattle(
    wildPokemon: PokemonSpecies,
    trainer: Trainer,
    environment: CaptureEnvironment,
    trainerPokemon?: Pokemon
  ): Promise<BattleState> {
    const battleId = this.generateBattleId()
    
    const wildCondition = this.generatePokemonCondition(wildPokemon, environment)
    const wildStats = this.calculateWildPokemonStats(wildPokemon, wildCondition)
    
    const battleState: BattleState = {
      turn: 1,
      trainerPokemon,
      wildPokemon: {
        species: wildPokemon,
        currentHp: wildStats.hp,
        maxHp: wildStats.hp,
        condition: wildCondition,
        moves: this.generateWildPokemonMoves(wildPokemon),
        usedMoves: []
      },
      environment,
      log: [{
        turn: 0,
        actor: 'environment',
        action: 'battle_start',
        result: `野生の${wildPokemon.nameJa}が現れた！`
      }]
    }
    
    this.activeBattles.set(battleId, battleState)
    return battleState
  }
  
  /**
   * バトルアクション実行
   */
  async executeBattleAction(
    battleId: string,
    action: BattleAction,
    trainer: Trainer
  ): Promise<BattleState> {
    const battle = this.activeBattles.get(battleId)
    if (!battle) {
      throw new Error(`バトルが見つかりません: ${battleId}`)
    }
    
    // プレイヤーアクション実行
    await this.processPlayerAction(battle, action, trainer)
    
    // 野生ポケモンのアクション
    if (battle.wildPokemon.currentHp > 0) {
      await this.processWildPokemonAction(battle)
    }
    
    // ターン終了処理
    battle.turn++
    this.processEndOfTurn(battle)
    
    this.activeBattles.set(battleId, battle)
    return battle
  }
  
  /**
   * バトル終了
   */
  endBattle(battleId: string): void {
    this.activeBattles.delete(battleId)
  }
  
  /**
   * 捕獲成功率計算
   */
  private calculateCaptureSuccessRate(attempt: CaptureAttempt): {
    successRate: number
    bonuses: CaptureBonus[]
  } {
    const { pokemonSpecies, trainer, captureMethod, environment, pokemonCondition } = attempt
    
    // ベース成功率
    let successRate = captureMethod.baseSuccessRate
    
    // ポケモンの基本捕獲率
    const speciesModifier = pokemonSpecies.baseCaptureRate / 255
    successRate *= speciesModifier
    
    const bonuses: CaptureBonus[] = []
    
    // HP減少ボーナス
    if (pokemonCondition.healthPercentage < 1.0) {
      const healthBonus = 1 + (1 - pokemonCondition.healthPercentage) * 1.5
      successRate *= healthBonus
      bonuses.push({
        type: 'condition',
        name: 'HP減少',
        multiplier: healthBonus,
        description: `HP減少による捕獲率向上: x${healthBonus.toFixed(2)}`
      })
    }
    
    // 状態異常ボーナス
    if (pokemonCondition.statusEffect) {
      const statusBonus = this.getStatusEffectBonus(pokemonCondition.statusEffect)
      successRate *= statusBonus.multiplier
      bonuses.push(statusBonus)
    }
    
    // トレーナースキルボーナス
    const skillBonus = 1 + (trainer.skills.capture / 20) // 最大50%ボーナス
    successRate *= skillBonus
    bonuses.push({
      type: 'skill',
      name: '捕獲スキル',
      multiplier: skillBonus,
      description: `トレーナーの捕獲スキル: x${skillBonus.toFixed(2)}`
    })
    
    // 環境ボーナス
    const envBonus = this.getEnvironmentBonus(pokemonSpecies, environment)
    if (envBonus.multiplier !== 1.0) {
      successRate *= envBonus.multiplier
      bonuses.push(envBonus)
    }
    
    // ボールの特殊効果
    captureMethod.bonusEffects.forEach(effect => {
      if (this.checkBonusConditions(effect, attempt)) {
        successRate *= effect.multiplier
        bonuses.push(effect)
      }
    })
    
    // レアリティによる基本修正
    const rarityModifier = this.getRarityModifier(pokemonSpecies.rarity)
    successRate *= rarityModifier
    bonuses.push({
      type: 'species',
      name: 'レアリティ修正',
      multiplier: rarityModifier,
      description: `${pokemonSpecies.rarity}による修正: x${rarityModifier.toFixed(2)}`
    })
    
    // 最終成功率は5%-95%の範囲に制限
    successRate = Math.max(0.05, Math.min(0.95, successRate))
    
    return { successRate, bonuses }
  }
  
  /**
   * 捕獲成功処理
   */
  private async handleCaptureSuccess(
    attempt: CaptureAttempt,
    capturedPokemon: Pokemon,
    successRate: number,
    roll: number,
    bonuses: CaptureBonus[]
  ): Promise<CaptureResult> {
    const escapeAttempts = this.calculateEscapeAttempts(attempt.pokemonSpecies, successRate)
    const experience = this.calculateCaptureExperience(attempt, true)
    
    return {
      success: true,
      capturedPokemon,
      attempt,
      calculatedSuccessRate: successRate,
      actualRoll: roll,
      bonusesApplied: bonuses,
      escapeAttempts,
      damageDealt: 0,
      experience,
      message: `${attempt.pokemonSpecies.nameJa}の捕獲に成功しました！`,
      consequences: this.generateSuccessConsequences(attempt)
    }
  }
  
  /**
   * 捕獲失敗処理
   */
  private async handleCaptureFailure(
    attempt: CaptureAttempt,
    successRate: number,
    roll: number,
    bonuses: CaptureBonus[]
  ): Promise<CaptureResult> {
    const escapeAttempts = this.calculateEscapeAttempts(attempt.pokemonSpecies, successRate)
    const experience = this.calculateCaptureExperience(attempt, false)
    
    // 失敗の種類を決定
    const failureType = this.determineFailureType(roll, successRate)
    
    return {
      success: false,
      attempt,
      calculatedSuccessRate: successRate,
      actualRoll: roll,
      bonusesApplied: bonuses,
      escapeAttempts,
      damageDealt: 0,
      experience,
      message: this.generateFailureMessage(attempt.pokemonSpecies, failureType),
      consequences: this.generateFailureConsequences(attempt, failureType)
    }
  }
  
  /**
   * 捕獲したポケモンを生成
   */
  private async createCapturedPokemon(
    species: PokemonSpecies,
    trainer: Trainer,
    attempt: CaptureAttempt
  ): Promise<Pokemon> {
    // 捕獲条件に基づいて個体値品質を調整
    let ivQuality = 0.5 // デフォルト
    
    // 困難な捕獲ほど高品質
    if (species.rarity === 'legendary' || species.rarity === 'mythical') {
      ivQuality = 0.8
    } else if (species.rarity === 'ultra_rare') {
      ivQuality = 0.7
    } else if (species.rarity === 'rare') {
      ivQuality = 0.6
    }
    
    // トレーナースキルによる品質向上
    ivQuality += trainer.skills.capture * 0.01
    
    // 環境による品質調整
    if (attempt.environment.advantage > 0.5) {
      ivQuality += 0.1
    }
    
    const options: PokemonGenerationOptions = {
      species,
      ivQuality: Math.min(0.95, ivQuality),
      trainer: trainer.id,
      location: attempt.environment.terrain === 'grass' ? 1 : 2,
      captureMethod: attempt.captureMethod.name
    }
    
    return pokemonGenerator.generatePokemon(options)
  }
  
  /**
   * プレイヤーアクション処理
   */
  private async processPlayerAction(battle: BattleState, action: BattleAction, trainer: Trainer): Promise<void> {
    switch (action.type) {
      case 'attack':
        await this.processAttackAction(battle, action, trainer)
        break
      case 'capture':
        await this.processCaptureAction(battle, action, trainer)
        break
      case 'item':
        await this.processItemAction(battle, action, trainer)
        break
      case 'flee':
        await this.processFleeAction(battle, action, trainer)
        break
    }
  }
  
  /**
   * 攻撃アクション処理
   */
  private async processAttackAction(battle: BattleState, action: BattleAction, trainer: Trainer): Promise<void> {
    if (!battle.trainerPokemon || !action.moveUsed) return
    
    const damage = this.calculateDamage(
      battle.trainerPokemon,
      battle.wildPokemon.species,
      action.moveUsed,
      battle.environment
    )
    
    battle.wildPokemon.currentHp = Math.max(0, battle.wildPokemon.currentHp - damage)
    
    // HPの減少に応じて捕獲率が上がる
    battle.wildPokemon.condition.healthPercentage = battle.wildPokemon.currentHp / battle.wildPokemon.maxHp
    
    // 疲労度も上昇
    battle.wildPokemon.condition.exhaustion = Math.min(1.0, battle.wildPokemon.condition.exhaustion + 0.1)
    
    battle.log.push({
      turn: battle.turn,
      actor: 'trainer',
      action: `${action.moveUsed}を使用`,
      result: `${damage}のダメージ！`,
      damage
    })
    
    if (battle.wildPokemon.currentHp === 0) {
      battle.log.push({
        turn: battle.turn,
        actor: 'environment',
        action: 'faint',
        result: '野生ポケモンは倒れてしまった...'
      })
    }
  }
  
  /**
   * 野生ポケモンアクション処理
   */
  private async processWildPokemonAction(battle: BattleState): Promise<void> {
    const wildPokemon = battle.wildPokemon
    
    // 行動決定（簡易AI）
    const actionType = this.determineWildPokemonAction(wildPokemon)
    
    switch (actionType) {
      case 'attack':
        if (battle.trainerPokemon) {
          const move = this.selectWildPokemonMove(wildPokemon)
          const damage = this.calculateWildDamage(wildPokemon.species, move)
          
          battle.log.push({
            turn: battle.turn,
            actor: 'wild_pokemon',
            action: `${move}を使用`,
            result: `${damage}のダメージ！`,
            damage
          })
        }
        break
        
      case 'flee':
        const fleeChance = this.calculateFleeChance(wildPokemon)
        if (Math.random() < fleeChance) {
          battle.log.push({
            turn: battle.turn,
            actor: 'wild_pokemon',
            action: 'flee',
            result: '野生ポケモンは逃げ出した！'
          })
          battle.wildPokemon.currentHp = 0 // バトル終了
        }
        break
    }
  }
  
  /**
   * ユーティリティメソッド群
   */
  private generatePokemonCondition(
    species: PokemonSpecies,
    environment: CaptureEnvironment,
    override?: Partial<PokemonCondition>
  ): PokemonCondition {
    const baseCondition: PokemonCondition = {
      healthPercentage: 1.0,
      mood: this.determineMood(species, environment),
      exhaustion: 0.0,
      wariness: this.calculateWariness(species, environment)
    }
    
    return { ...baseCondition, ...override }
  }
  
  private determineMood(species: PokemonSpecies, environment: CaptureEnvironment): PokemonCondition['mood'] {
    // 種族とタイプに基づいた性格決定
    if (species.types.includes('fighting') || species.types.includes('fire')) {
      return 'aggressive'
    } else if (species.types.includes('psychic') || species.types.includes('electric')) {
      return 'curious'
    } else if (species.rarity === 'legendary' || species.rarity === 'mythical') {
      return 'defensive'
    } else if (environment.disturbances.length > 0) {
      return 'fearful'
    }
    
    return 'calm'
  }
  
  private calculateWariness(species: PokemonSpecies, environment: CaptureEnvironment): number {
    let wariness = 0.5
    
    // レアなポケモンほど警戒心が強い
    const rarityWariness = {
      common: 0.2,
      uncommon: 0.3,
      rare: 0.5,
      ultra_rare: 0.7,
      legendary: 0.9,
      mythical: 0.95
    }
    
    wariness = rarityWariness[species.rarity] || 0.5
    
    // 環境による調整
    if (environment.disturbances.length > 0) {
      wariness += 0.2
    }
    
    if (environment.advantage < 0) {
      wariness += Math.abs(environment.advantage) * 0.3
    }
    
    return Math.min(1.0, wariness)
  }
  
  private getStatusEffectBonus(status: PokemonCondition['statusEffect']): CaptureBonus {
    const bonuses = {
      sleep: { multiplier: 2.5, description: 'ねむり状態' },
      paralysis: { multiplier: 1.5, description: 'まひ状態' },
      freeze: { multiplier: 2.0, description: 'こおり状態' },
      burn: { multiplier: 1.5, description: 'やけど状態' },
      poison: { multiplier: 1.5, description: 'どく状態' }
    }
    
    const bonus = bonuses[status!]
    return {
      type: 'condition',
      name: '状態異常',
      multiplier: bonus.multiplier,
      description: `${bonus.description}による捕獲率向上: x${bonus.multiplier}`
    }
  }
  
  private getEnvironmentBonus(species: PokemonSpecies, environment: CaptureEnvironment): CaptureBonus {
    // 生息地マッチング
    if (species.habitat.some(habitat => this.matchesEnvironment(habitat, environment.terrain))) {
      return {
        type: 'environment',
        name: '生息地一致',
        multiplier: 1.2,
        description: '適した環境での捕獲: x1.2'
      }
    }
    
    return {
      type: 'environment',
      name: '環境標準',
      multiplier: 1.0,
      description: '標準的な環境'
    }
  }
  
  private matchesEnvironment(habitat: string, terrain: string): boolean {
    const matches: Record<string, string[]> = {
      grassland: ['grass'],
      forest: ['grass', 'forest'],
      waters_edge: ['water'],
      sea: ['water'],
      cave: ['cave'],
      mountain: ['mountain'],
      urban: ['urban']
    }
    
    return matches[habitat]?.includes(terrain) || false
  }
  
  private getRarityModifier(rarity: string): number {
    const modifiers = {
      common: 1.0,
      uncommon: 0.8,
      rare: 0.6,
      ultra_rare: 0.4,
      legendary: 0.2,
      mythical: 0.1
    }
    
    return modifiers[rarity as keyof typeof modifiers] || 1.0
  }
  
  private checkBonusConditions(bonus: CaptureBonus, attempt: CaptureAttempt): boolean {
    if (!bonus.conditions) return true
    
    return bonus.conditions.every(condition => {
      // 条件チェックロジック（簡易実装）
      if (condition.includes('type:')) {
        const requiredType = condition.split(':')[1]
        return attempt.pokemonSpecies.types.includes(requiredType as any)
      }
      
      return true
    })
  }
  
  private calculateEscapeAttempts(species: PokemonSpecies, successRate: number): number {
    // 成功率が低いほど多くの脱出試行
    const baseAttempts = Math.floor((1 - successRate) * 4)
    const rarityAttempts = species.rarity === 'legendary' ? 3 : species.rarity === 'rare' ? 2 : 1
    
    return Math.min(5, baseAttempts + rarityAttempts)
  }
  
  private calculateCaptureExperience(attempt: CaptureAttempt, success: boolean): { trainer: number; pokemon: number } {
    const baseExp = attempt.pokemonSpecies.baseExperience || 100
    const difficultyMultiplier = this.getRarityModifier(attempt.pokemonSpecies.rarity)
    
    const trainerExp = Math.floor(baseExp * (success ? 1.0 : 0.3) * (1 / difficultyMultiplier))
    const pokemonExp = success ? Math.floor(baseExp * 0.1) : 0
    
    return { trainer: trainerExp, pokemon: pokemonExp }
  }
  
  private determineFailureType(roll: number, successRate: number): 'broke_free' | 'nearly_caught' | 'resisted' {
    const margin = roll - successRate
    
    if (margin < 0.1) return 'nearly_caught'
    if (margin < 0.3) return 'broke_free'
    return 'resisted'
  }
  
  private generateFailureMessage(species: PokemonSpecies, failureType: string): string {
    const messages = {
      broke_free: `${species.nameJa}はボールから飛び出してしまった！`,
      nearly_caught: `おしい！${species.nameJa}を捕まえられそうだった...`,
      resisted: `${species.nameJa}は捕まえられることを拒んでいる！`
    }
    
    return messages[failureType as keyof typeof messages] || messages.resisted
  }
  
  private generateSuccessConsequences(attempt: CaptureAttempt): CaptureConsequence[] {
    const consequences: CaptureConsequence[] = []
    
    // レアポケモンの捕獲は周囲に影響
    if (attempt.pokemonSpecies.rarity === 'legendary' || attempt.pokemonSpecies.rarity === 'mythical') {
      consequences.push({
        type: 'area_alert',
        severity: 'major',
        description: '伝説ポケモンの捕獲',
        effect: '周囲のポケモンが警戒状態になった'
      })
    }
    
    return consequences
  }
  
  private generateFailureConsequences(attempt: CaptureAttempt, failureType: string): CaptureConsequence[] {
    const consequences: CaptureConsequence[] = []
    
    // ボール消費
    consequences.push({
      type: 'item_lost',
      severity: 'minor',
      description: 'ボール消費',
      effect: `${attempt.captureMethod.name}を1個失った`
    })
    
    return consequences
  }
  
  /**
   * 初期化メソッド
   */
  private initializeCaptureMethods(): void {
    const methods: CaptureMethod[] = [
      {
        type: 'pokeball',
        name: 'モンスターボール',
        baseSuccessRate: 0.3,
        bonusEffects: [],
        cost: 200,
        rarity: 'common',
        description: '基本的なポケモン捕獲ボール'
      },
      {
        type: 'greatball',
        name: 'スーパーボール',
        baseSuccessRate: 0.5,
        bonusEffects: [],
        cost: 600,
        rarity: 'uncommon',
        description: 'モンスターボールより捕獲率が高い'
      },
      {
        type: 'ultraball',
        name: 'ハイパーボール',
        baseSuccessRate: 0.7,
        bonusEffects: [],
        cost: 1200,
        rarity: 'rare',
        description: '非常に高い捕獲率を誇る'
      },
      {
        type: 'masterball',
        name: 'マスターボール',
        baseSuccessRate: 1.0,
        bonusEffects: [],
        cost: 50000,
        rarity: 'legendary',
        description: '必ず捕獲できる究極のボール'
      }
    ]
    
    methods.forEach(method => {
      this.captureMethods.set(method.name, method)
    })
  }
  
  private recordCaptureAttempt(trainerId: string, result: CaptureResult): void {
    const history = this.captureHistory.get(trainerId) || []
    history.push(result)
    
    // 最新100件まで保持
    if (history.length > 100) {
      history.shift()
    }
    
    this.captureHistory.set(trainerId, history)
  }
  
  private generateCaptureAttemptId(): string {
    return `capture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  private generateBattleId(): string {
    return `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  // バトル関連のユーティリティメソッド（簡易実装）
  private calculateWildPokemonStats(species: PokemonSpecies, condition: PokemonCondition) {
    const level = 5 + Math.floor(Math.random() * 15) // レベル5-20
    const hp = Math.floor((2 * species.baseStats.hp + 15) * level / 100) + level + 10
    
    return { hp }
  }
  
  private generateWildPokemonMoves(species: PokemonSpecies): string[] {
    // 簡易的な技生成
    return ['たいあたり', 'なきごえ']
  }
  
  private calculateDamage(attacker: Pokemon, defender: PokemonSpecies, move: string, environment: CaptureEnvironment): number {
    // 簡易ダメージ計算
    const baseDamage = attacker.attack * 0.4
    const randomFactor = 0.85 + Math.random() * 0.3 // 85%-115%
    
    return Math.floor(baseDamage * randomFactor)
  }
  
  private calculateWildDamage(species: PokemonSpecies, move: string): number {
    return Math.floor(species.baseStats.attack * 0.3 + Math.random() * 10)
  }
  
  private determineWildPokemonAction(wildPokemon: BattleState['wildPokemon']): 'attack' | 'flee' {
    if (wildPokemon.condition.healthPercentage < 0.3 && wildPokemon.condition.mood === 'fearful') {
      return 'flee'
    }
    
    return 'attack'
  }
  
  private selectWildPokemonMove(wildPokemon: BattleState['wildPokemon']): string {
    return wildPokemon.moves[Math.floor(Math.random() * wildPokemon.moves.length)]
  }
  
  private calculateFleeChance(wildPokemon: BattleState['wildPokemon']): number {
    let fleeChance = wildPokemon.species.fleeRate || 0.1
    
    // HP減少で逃走率上昇
    if (wildPokemon.condition.healthPercentage < 0.5) {
      fleeChance += (0.5 - wildPokemon.condition.healthPercentage) * 0.4
    }
    
    // 疲労で逃走率減少
    fleeChance -= wildPokemon.condition.exhaustion * 0.3
    
    return Math.max(0.01, Math.min(0.8, fleeChance))
  }
  
  private processEndOfTurn(battle: BattleState): void {
    // ターン終了時の処理（状態異常、天候効果など）
  }
  
  private async processCaptureAction(battle: BattleState, action: BattleAction, trainer: Trainer): Promise<void> {
    // バトル中の捕獲試行
    battle.log.push({
      turn: battle.turn,
      actor: 'trainer',
      action: 'capture_attempt',
      result: 'ボールを投げた！'
    })
  }
  
  private async processItemAction(battle: BattleState, action: BattleAction, trainer: Trainer): Promise<void> {
    // アイテム使用
    battle.log.push({
      turn: battle.turn,
      actor: 'trainer',
      action: `${action.itemUsed}使用`,
      result: `${action.itemUsed}を使った！`
    })
  }
  
  private async processFleeAction(battle: BattleState, action: BattleAction, trainer: Trainer): Promise<void> {
    // 逃走
    battle.log.push({
      turn: battle.turn,
      actor: 'trainer',
      action: 'flee',
      result: 'うまく逃げ切れた！'
    })
    
    battle.wildPokemon.currentHp = 0 // バトル終了
  }
  
  /**
   * パブリックユーティリティメソッド
   */
  getCaptureMethods(): CaptureMethod[] {
    return Array.from(this.captureMethods.values())
  }
  
  getCaptureHistory(trainerId: string): CaptureResult[] {
    return this.captureHistory.get(trainerId) || []
  }
  
  getBattleState(battleId: string): BattleState | null {
    return this.activeBattles.get(battleId) || null
  }
  
  getCaptureStatistics(trainerId: string): {
    totalAttempts: number
    successRate: number
    speciesCaught: number
    averageSuccessRate: number
  } {
    const history = this.getCaptureHistory(trainerId)
    
    return {
      totalAttempts: history.length,
      successRate: history.length > 0 ? history.filter(r => r.success).length / history.length : 0,
      speciesCaught: new Set(history.filter(r => r.success).map(r => r.attempt.pokemonSpecies.id)).size,
      averageSuccessRate: history.length > 0 ? 
        history.reduce((sum, r) => sum + r.calculatedSuccessRate, 0) / history.length : 0
    }
  }
}

// シングルトンインスタンス
export const pokemonCaptureSystem = PokemonCaptureSystem.getInstance()