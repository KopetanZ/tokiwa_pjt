/**
 * 静的データ管理システム
 * ゲーム内で使用される不変データの統合管理
 */

import { JOB_DEFINITIONS, getJobDefinition, getAllJobs, getJobsByUnlockStatus, calculateTrainerSalary, getJobSkillBonus, getJobPersonalityTendency } from './jobs'
import { LOCATION_DEFINITIONS, getLocationDefinition, getAllLocations, getLocationsByDifficulty, getLocationsByEnvironment, getUnlockedLocations, getRecommendedLocationsForTrainer, calculateLocationReward, getPokemonEncounterChance } from './locations'
import { POKEMON_SPECIES, TYPE_DEFINITIONS, getPokemonSpecies, getAllPokemonSpecies, getPokemonByType, getPokemonByRarity, getPokemonByHabitat, calculatePokemonStats, getEvolutionRequirement, calculateCatchDifficulty, getPokemonMarketValue, getTypeColor, getTypeEffectiveness } from './pokemon'

import type { StaticDataDB, JobDefinition, LocationDefinition, PokemonSpeciesDefinition, TrainerJob, PokemonType } from './types'

/**
 * 静的データベースクラス
 * 全ての静的データへの統一されたアクセスを提供
 */
export class StaticDataManager {
  private static instance: StaticDataManager
  
  private constructor() {}
  
  static getInstance(): StaticDataManager {
    if (!StaticDataManager.instance) {
      StaticDataManager.instance = new StaticDataManager()
    }
    return StaticDataManager.instance
  }
  
  // =================== 職業データ ===================
  
  getJob(job: TrainerJob): JobDefinition {
    return getJobDefinition(job)
  }
  
  getAllJobs(): JobDefinition[] {
    return getAllJobs()
  }
  
  getAvailableJobs(playerLevel: number, reputation: number, unlockedConditions: string[]): {
    unlocked: JobDefinition[]
    locked: JobDefinition[]
  } {
    return getJobsByUnlockStatus(playerLevel, reputation, unlockedConditions)
  }
  
  calculateSalary(job: TrainerJob, level: number): number {
    return calculateTrainerSalary(job, level)
  }
  
  getJobSkillModifier(job: TrainerJob, skill: string): number {
    return getJobSkillBonus(job, skill as any)
  }
  
  getJobPersonalityModifier(job: TrainerJob, trait: string): number {
    return getJobPersonalityTendency(job, trait as any)
  }
  
  // =================== 派遣先データ ===================
  
  getLocation(id: number): LocationDefinition | undefined {
    return getLocationDefinition(id)
  }
  
  getAllLocations(): LocationDefinition[] {
    return getAllLocations()
  }
  
  getLocationsByDifficulty(difficulty: LocationDefinition['difficulty']): LocationDefinition[] {
    return getLocationsByDifficulty(difficulty)
  }
  
  getLocationsByEnvironment(environment: LocationDefinition['environment']): LocationDefinition[] {
    return getLocationsByEnvironment(environment)
  }
  
  getAccessibleLocations(
    playerLevel: number, 
    reputation: number, 
    completedLocations: number[], 
    specialRequirements: string[]
  ): LocationDefinition[] {
    return getUnlockedLocations(playerLevel, reputation, completedLocations, specialRequirements)
  }
  
  getRecommendedLocations(trainerJob: string, trainerLevel: number): LocationDefinition[] {
    return getRecommendedLocationsForTrainer(trainerJob, trainerLevel)
  }
  
  calculateExpeditionReward(location: LocationDefinition, trainerLevel: number, success: boolean): number {
    return calculateLocationReward(location, trainerLevel, success)
  }
  
  getPokemonEncounters(location: LocationDefinition, timeOfDay?: string, weather?: string): LocationDefinition['pokemonEncounters'] {
    return getPokemonEncounterChance(location, timeOfDay, weather)
  }
  
  // =================== ポケモンデータ ===================
  
  getPokemon(id: number): PokemonSpeciesDefinition | undefined {
    return getPokemonSpecies(id)
  }
  
  getAllPokemon(): PokemonSpeciesDefinition[] {
    return getAllPokemonSpecies()
  }
  
  getPokemonByType(type: PokemonType): PokemonSpeciesDefinition[] {
    return getPokemonByType(type)
  }
  
  getPokemonByRarity(rarity: PokemonSpeciesDefinition['rarity']): PokemonSpeciesDefinition[] {
    return getPokemonByRarity(rarity)
  }
  
  getPokemonByHabitat(habitat: string): PokemonSpeciesDefinition[] {
    return getPokemonByHabitat(habitat)
  }
  
  calculateStats(speciesId: number, level: number, ivs: Record<string, number>): Record<string, number> {
    return calculatePokemonStats(speciesId, level, ivs)
  }
  
  getEvolutionInfo(speciesId: number): string {
    return getEvolutionRequirement(speciesId)
  }
  
  calculateCatchRate(species: PokemonSpeciesDefinition, level: number): number {
    return calculateCatchDifficulty(species, level)
  }
  
  calculateMarketValue(species: PokemonSpeciesDefinition, level: number): number {
    return getPokemonMarketValue(species, level)
  }
  
  getTypeColor(type: PokemonType): string {
    return getTypeColor(type)
  }
  
  calculateTypeEffectiveness(attackType: PokemonType, defendType1: PokemonType, defendType2?: PokemonType): number {
    return getTypeEffectiveness(attackType, defendType1, defendType2)
  }
  
  // =================== 統合検索・分析 ===================
  
  /**
   * トレーナーに最適な派遣先を推奨
   */
  getOptimalExpeditions(
    trainerJob: TrainerJob, 
    trainerLevel: number, 
    trainerSkills: Record<string, number>,
    preferences: {
      difficulty?: LocationDefinition['difficulty']
      environment?: LocationDefinition['environment']
      targetPokemon?: PokemonType[]
      minimumReward?: number
    } = {}
  ): LocationDefinition[] {
    let locations = this.getRecommendedLocations(trainerJob, trainerLevel)
    
    // フィルタリング
    if (preferences.difficulty) {
      locations = locations.filter(loc => loc.difficulty === preferences.difficulty)
    }
    
    if (preferences.environment) {
      locations = locations.filter(loc => loc.environment === preferences.environment)
    }
    
    if (preferences.targetPokemon && preferences.targetPokemon.length > 0) {
      locations = locations.filter(loc => 
        loc.pokemonEncounters.some(encounter => {
          const species = this.getPokemon(encounter.speciesId)
          return species && (
            preferences.targetPokemon!.includes(species.type1) ||
            (species.type2 && preferences.targetPokemon!.includes(species.type2))
          )
        })
      )
    }
    
        if (preferences.minimumReward) {
      locations = locations.filter(loc =>
        this.calculateExpeditionReward(loc, trainerLevel, true) >= (preferences.minimumReward || 0)
      )
    }
    
    // 成功率でソート
    return locations.sort((a, b) => {
      const scoreA = this.calculateExpeditionSuccessRate(a, trainerJob, trainerLevel, trainerSkills)
      const scoreB = this.calculateExpeditionSuccessRate(b, trainerJob, trainerLevel, trainerSkills)
      return scoreB - scoreA
    })
  }
  
  /**
   * 派遣成功率を計算
   */
  calculateExpeditionSuccessRate(
    location: LocationDefinition,
    trainerJob: TrainerJob,
    trainerLevel: number,
    trainerSkills: Record<string, number>
  ): number {
    const jobDef = this.getJob(trainerJob)
    let successRate = 0.5 // ベース成功率
    
    // スキル適性チェック
    Object.entries(location.requiredSkills || {}).forEach(([skill, required]) => {
      const trainerSkill = trainerSkills[skill] || 0
      const jobBonus = jobDef.skillAffinities[skill as keyof typeof jobDef.skillAffinities] || 0
      const effectiveSkill = trainerSkill + jobBonus
      
      if (effectiveSkill >= required) {
        successRate += 0.1
      } else {
        successRate -= 0.2
      }
    })
    
    // レベル差ボーナス/ペナルティ
    const difficultyLevel = { easy: 3, normal: 6, hard: 10, extreme: 15 }[location.difficulty]
    const levelDiff = trainerLevel - difficultyLevel
    successRate += levelDiff * 0.05
    
    // 推奨職業ボーナス
    if (location.recommendedJobs.includes(trainerJob)) {
      successRate += 0.2
    }
    
    // 危険度ペナルティ
    successRate -= (location.dangerLevel - 1) * 0.05
    
    return Math.max(0.1, Math.min(0.95, successRate))
  }
  
  /**
   * ポケモン捕獲推定値を計算
   */
  estimatePokemonCatchRate(
    locationId: number,
    trainerJob: TrainerJob,
    trainerLevel: number,
    trainerSkills: Record<string, number>
  ): { speciesId: number; estimatedCatchRate: number; marketValue: number }[] {
    const location = this.getLocation(locationId)
    if (!location) return []
    
    const jobDef = this.getJob(trainerJob)
    const captureSkill = trainerSkills.capture || 0
    const captureBonus = jobDef.skillAffinities.capture || 0
    const effectiveCaptureSkill = captureSkill + captureBonus
    
    return location.pokemonEncounters.map(encounter => {
      const species = this.getPokemon(encounter.speciesId)
      if (!species) return { speciesId: encounter.speciesId, estimatedCatchRate: 0, marketValue: 0 }
      
      const baseCatchRate = this.calculateCatchRate(species, encounter.levelRange[1])
      const skillModifier = effectiveCaptureSkill * 0.05
      const encounterModifier = encounter.encounterRate
      
      const estimatedCatchRate = baseCatchRate * (1 + skillModifier) * encounterModifier
      const marketValue = this.calculateMarketValue(species, encounter.levelRange[1])
      
      return {
        speciesId: encounter.speciesId,
        estimatedCatchRate: Math.min(1.0, estimatedCatchRate),
        marketValue
      }
    }).filter(result => result.estimatedCatchRate > 0)
  }
  
  // =================== データ検証 ===================
  
  validateData(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // 職業データ検証
    Object.values(JOB_DEFINITIONS).forEach(job => {
      if (!job.name || !job.nameJa) {
        errors.push(`Job ${job.id} missing name`)
      }
      if (job.baseSalary <= 0) {
        errors.push(`Job ${job.id} has invalid salary`)
      }
    })
    
    // 派遣先データ検証
    Object.values(LOCATION_DEFINITIONS).forEach(location => {
      if (!location.name || !location.nameJa) {
        errors.push(`Location ${location.id} missing name`)
      }
      if (location.baseDuration <= 0) {
        errors.push(`Location ${location.id} has invalid duration`)
      }
      
      // ポケモン出現データ検証
      location.pokemonEncounters.forEach(encounter => {
        if (!this.getPokemon(encounter.speciesId)) {
          errors.push(`Location ${location.id} references unknown Pokemon ${encounter.speciesId}`)
        }
      })
    })
    
    // ポケモンデータ検証
    Object.values(POKEMON_SPECIES).forEach(pokemon => {
      if (!pokemon.name || !pokemon.nameJa) {
        errors.push(`Pokemon ${pokemon.id} missing name`)
      }
      if (pokemon.baseStats.total !== Object.values(pokemon.baseStats).slice(0, -1).reduce((a, b) => a + b, 0)) {
        errors.push(`Pokemon ${pokemon.id} has incorrect stat total`)
      }
    })
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  // =================== 統計情報 ===================
  
  getDataStatistics() {
    return {
      jobs: Object.keys(JOB_DEFINITIONS).length,
      locations: Object.keys(LOCATION_DEFINITIONS).length,
      pokemon: Object.keys(POKEMON_SPECIES).length,
      types: Object.keys(TYPE_DEFINITIONS).length,
      validation: this.validateData()
    }
  }
}

// シングルトンインスタンス取得
export const getStaticDataManager = (): StaticDataManager => {
  return StaticDataManager.getInstance()
}

// 個別エクスポート
export {
  JOB_DEFINITIONS,
  LOCATION_DEFINITIONS,
  POKEMON_SPECIES,
  TYPE_DEFINITIONS
}

export * from './types'