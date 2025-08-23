/**
 * PokeAPI連携サービス
 * 公式ポケモンデータを取得・キャッシュ・変換
 */

import { pokemonDatabase, type PokemonSpecies, type PokemonType } from './PokemonDatabase'
import { LRUCache, performanceMonitor } from '@/lib/performance/PerformanceOptimizer'

// PokeAPI型定義
export interface PokeAPISpecies {
  id: number
  name: string
  base_happiness: number
  capture_rate: number
  color: { name: string }
  evolution_chain: { url: string }
  flavor_text_entries: Array<{
    flavor_text: string
    language: { name: string }
    version: { name: string }
  }>
  genera: Array<{
    genus: string
    language: { name: string }
  }>
  generation: { name: string }
  habitat: { name: string } | null
  shape: { name: string }
  names: Array<{
    name: string
    language: { name: string }
  }>
}

export interface PokeAPIPokemon {
  id: number
  name: string
  height: number
  weight: number
  base_experience: number
  stats: Array<{
    base_stat: number
    stat: { name: string }
  }>
  types: Array<{
    type: { name: string }
  }>
  abilities: Array<{
    ability: { name: string }
    is_hidden: boolean
  }>
  species: { url: string }
}

export interface PokeAPIEvolutionChain {
  chain: EvolutionDetail
}

export interface EvolutionDetail {
  species: { name: string; url: string }
  evolves_to: EvolutionDetail[]
  evolution_details: Array<{
    min_level: number | null
    trigger: { name: string }
    item: { name: string } | null
  }>
}

/**
 * PokeAPI連携サービス
 */
export class PokeAPIService {
  private static instance: PokeAPIService
  private cache = new LRUCache<any>(500) // 500エントリまでキャッシュ
  private baseUrl = 'https://pokeapi.co/api/v2'
  private requestQueue = new Map<string, Promise<any>>() // 重複リクエスト防止
  
  private constructor() {}
  
  static getInstance(): PokeAPIService {
    if (!PokeAPIService.instance) {
      PokeAPIService.instance = new PokeAPIService()
    }
    return PokeAPIService.instance
  }
  
  /**
   * ポケモンデータを取得（基本情報）
   */
  async getPokemon(idOrName: number | string): Promise<PokeAPIPokemon> {
    const cacheKey = `pokemon_${idOrName}`
    const cached = this.cache.get(cacheKey)
    if (cached) return cached
    
    return this.queueRequest(cacheKey, async () => {
      const response = await fetch(`${this.baseUrl}/pokemon/${idOrName}`)
      if (!response.ok) throw new Error(`Pokemon not found: ${idOrName}`)
      
      const data = await response.json()
      this.cache.set(cacheKey, data)
      return data
    })
  }
  
  /**
   * ポケモン種族データを取得
   */
  async getPokemonSpecies(idOrName: number | string): Promise<PokeAPISpecies> {
    const cacheKey = `species_${idOrName}`
    const cached = this.cache.get(cacheKey)
    if (cached) return cached
    
    return this.queueRequest(cacheKey, async () => {
      const response = await fetch(`${this.baseUrl}/pokemon-species/${idOrName}`)
      if (!response.ok) throw new Error(`Species not found: ${idOrName}`)
      
      const data = await response.json()
      this.cache.set(cacheKey, data)
      return data
    })
  }
  
  /**
   * 進化チェーンデータを取得
   */
  async getEvolutionChain(url: string): Promise<PokeAPIEvolutionChain> {
    const cacheKey = `evolution_${url}`
    const cached = this.cache.get(cacheKey)
    if (cached) return cached
    
    return this.queueRequest(cacheKey, async () => {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Evolution chain not found: ${url}`)
      
      const data = await response.json()
      this.cache.set(cacheKey, data)
      return data
    })
  }
  
  /**
   * 複数ポケモンの一括取得
   */
  async getBulkPokemonData(ids: number[]): Promise<PokemonSpecies[]> {
    return performanceMonitor.measureAsync('bulk_pokemon_fetch', async () => {
      const promises = ids.map(id => this.getEnhancedPokemonData(id))
      const results = await Promise.allSettled(promises)
      
      return results
        .filter((result): result is PromiseFulfilledResult<PokemonSpecies> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value)
    })
  }
  
  /**
   * 拡張ポケモンデータを取得（統合情報）
   */
  async getEnhancedPokemonData(id: number): Promise<PokemonSpecies | null> {
    try {
      // 並行してデータを取得
      const [pokemon, species] = await Promise.all([
        this.getPokemon(id),
        this.getPokemonSpecies(id)
      ])
      
      // 進化チェーンデータも取得
      let evolutionData: PokeAPIEvolutionChain | null = null
      try {
        evolutionData = await this.getEvolutionChain(species.evolution_chain.url)
      } catch (error) {
        console.warn(`進化チェーンデータの取得に失敗: ${id}`, error)
      }
      
      // データを変換
      return this.convertToGameSpecies(pokemon, species, evolutionData)
      
    } catch (error) {
      console.error(`ポケモンデータ取得エラー: ${id}`, error)
      return null
    }
  }
  
  /**
   * PokeAPIデータをゲーム用データに変換
   */
  private convertToGameSpecies(
    pokemon: PokeAPIPokemon,
    species: PokeAPISpecies,
    evolutionData: PokeAPIEvolutionChain | null
  ): PokemonSpecies {
    // 日本語名を取得
    const japaneseName = species.names.find(n => n.language.name === 'ja-Hrkt')?.name || 
                        species.names.find(n => n.language.name === 'ja')?.name || 
                        pokemon.name
    
    // 説明文を取得（日本語優先）
    const description = species.flavor_text_entries
      .find(entry => entry.language.name === 'ja')?.flavor_text.replace(/\n/g, ' ') ||
      species.flavor_text_entries
        .find(entry => entry.language.name === 'en')?.flavor_text.replace(/\n/g, ' ') ||
      'データなし'
    
    // カテゴリを取得
    const category = species.genera.find(g => g.language.name === 'ja')?.genus || 
                    species.genera.find(g => g.language.name === 'en')?.genus || 
                    'ポケモン'
    
    // ステータスを変換
    const baseStats = this.convertStats(pokemon.stats)
    
    // タイプを変換
    const types = pokemon.types.map(t => this.convertType(t.type.name))
    
    // 世代を取得
    const generation = this.convertGeneration(species.generation.name)
    
    // 進化情報を処理
    const evolutionInfo = this.processEvolutionChain(evolutionData, pokemon.name)
    
    // 生息地を変換
    const habitat = this.convertHabitat(species.habitat?.name)
    
    // レアリティを計算（合計種族値ベース）
    const rarity = this.calculateRarity(baseStats.total, species.capture_rate)
    
    return {
      id: pokemon.id,
      name: pokemon.name,
      nameJa: japaneseName,
      generation,
      types,
      baseStats,
      growthRate: this.determineGrowthRate(pokemon.base_experience),
      baseExperience: pokemon.base_experience || 100,
      maxLevel: 100,
      evolutionLevel: evolutionInfo.evolutionLevel,
      evolutionTo: evolutionInfo.evolutionTo,
      evolutionFrom: evolutionInfo.evolutionFrom,
      rarity,
      habitat: [habitat],
      timeOfDay: ['any'],
      weather: ['any'],
      season: ['any'],
      baseCaptureRate: species.capture_rate,
      friendshipBase: species.base_happiness,
      fleeRate: this.calculateFleeRate(species.capture_rate),
      abilities: pokemon.abilities.filter(a => !a.is_hidden).map(a => a.ability.name),
      hiddenAbility: pokemon.abilities.find(a => a.is_hidden)?.ability.name,
      learnableTypes: this.determineLearnableTypes(types),
      baseValue: this.calculateBaseValue(baseStats.total, rarity),
      rarityMultiplier: this.getRarityMultiplier(rarity),
      description,
      category,
      height: pokemon.height * 10, // デシメートルからセンチメートル
      weight: pokemon.weight * 100, // ヘクトグラムからグラム
      color: species.color.name,
      shape: species.shape.name
    }
  }
  
  /**
   * 重複リクエスト防止のためのキュー管理
   */
  private async queueRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key)!
    }
    
    const promise = requestFn()
    this.requestQueue.set(key, promise)
    
    try {
      const result = await promise
      this.requestQueue.delete(key)
      return result
    } catch (error) {
      this.requestQueue.delete(key)
      throw error
    }
  }
  
  /**
   * 変換ヘルパーメソッド
   */
  private convertStats(stats: PokeAPIPokemon['stats']): PokemonSpecies['baseStats'] {
    const statMap: Record<string, keyof Omit<PokemonSpecies['baseStats'], 'total'>> = {
      'hp': 'hp',
      'attack': 'attack',
      'defense': 'defense',
      'special-attack': 'specialAttack',
      'special-defense': 'specialDefense',
      'speed': 'speed'
    }
    
    const baseStats: any = {}
    let total = 0
    
    stats.forEach(stat => {
      const key = statMap[stat.stat.name]
      if (key) {
        baseStats[key] = stat.base_stat
        total += stat.base_stat
      }
    })
    
    baseStats.total = total
    return baseStats
  }
  
  private convertType(typeName: string): PokemonType {
    const typeMap: Record<string, PokemonType> = {
      'normal': 'normal',
      'fire': 'fire',
      'water': 'water',
      'electric': 'electric',
      'grass': 'grass',
      'ice': 'ice',
      'fighting': 'fighting',
      'poison': 'poison',
      'ground': 'ground',
      'flying': 'flying',
      'psychic': 'psychic',
      'bug': 'bug',
      'rock': 'rock',
      'ghost': 'ghost',
      'dragon': 'dragon',
      'dark': 'dark',
      'steel': 'steel',
      'fairy': 'fairy'
    }
    
    return typeMap[typeName] || 'normal'
  }
  
  private convertGeneration(genName: string): number {
    const match = genName.match(/generation-(\w+)/)
    if (!match) return 1
    
    const genMap: Record<string, number> = {
      'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5,
      'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9
    }
    
    return genMap[match[1]] || 1
  }
  
  private convertHabitat(habitat: string | undefined): PokemonSpecies['habitat'][0] {
    const habitatMap: Record<string, PokemonSpecies['habitat'][0]> = {
      'grassland': 'grassland',
      'forest': 'forest',
      'waters-edge': 'waters_edge',
      'sea': 'sea',
      'cave': 'cave',
      'mountain': 'mountain',
      'rough-terrain': 'rough_terrain',
      'urban': 'urban',
      'rare': 'rare'
    }
    
    return habitatMap[habitat || 'grassland'] || 'grassland'
  }
  
  private processEvolutionChain(
    evolutionData: PokeAPIEvolutionChain | null, 
    currentName: string
  ): { evolutionLevel?: number; evolutionTo?: number[]; evolutionFrom?: number } {
    if (!evolutionData) return {}
    
    // 進化チェーンを解析（簡略化）
    const findInChain = (chain: EvolutionDetail): any => {
      if (chain.species.name === currentName) {
        const evolutionTo = chain.evolves_to.map(evo => {
          const id = this.extractIdFromUrl(evo.species.url)
          return id
        }).filter(id => id !== null)
        
        const evolutionLevel = chain.evolves_to[0]?.evolution_details?.[0]?.min_level || undefined
        
        return { evolutionLevel, evolutionTo: evolutionTo.length > 0 ? evolutionTo : undefined }
      }
      
      for (const evolve of chain.evolves_to) {
        const result = findInChain(evolve)
        if (result) {
          if (evolve.species.name === currentName) {
            result.evolutionFrom = this.extractIdFromUrl(chain.species.url)
          }
          return result
        }
      }
      
      return null
    }
    
    return findInChain(evolutionData.chain) || {}
  }
  
  private extractIdFromUrl(url: string): number | null {
    const match = url.match(/\/(\d+)\/$/)
    return match ? parseInt(match[1]) : null
  }
  
  private determineGrowthRate(baseExperience: number): PokemonSpecies['growthRate'] {
    if (baseExperience <= 50) return 'fast'
    if (baseExperience <= 100) return 'medium_fast'
    if (baseExperience <= 150) return 'medium_slow'
    return 'slow'
  }
  
  private calculateRarity(baseTotal: number, captureRate: number): PokemonSpecies['rarity'] {
    // 合計種族値と捕獲率でレアリティを決定
    if (baseTotal >= 680) return 'mythical'
    if (baseTotal >= 580) return 'legendary'
    if (baseTotal >= 500 || captureRate <= 10) return 'ultra_rare'
    if (baseTotal >= 400 || captureRate <= 50) return 'rare'
    if (baseTotal >= 300 || captureRate <= 120) return 'uncommon'
    return 'common'
  }
  
  private calculateFleeRate(captureRate: number): number {
    // 捕獲率が低いほど逃走率が高い
    return Math.max(0.01, Math.min(0.5, (255 - captureRate) / 500))
  }
  
  private determineLearnableTypes(types: PokemonType[]): PokemonType[] {
    // メインタイプに加えて、一般的に覚えられるタイプを追加
    const commonTypes: PokemonType[] = ['normal']
    return Array.from(new Set([...types, ...commonTypes]))
  }
  
  private calculateBaseValue(baseTotal: number, rarity: PokemonSpecies['rarity']): number {
    const baseValue = baseTotal * 10
    return Math.floor(baseValue * this.getRarityMultiplier(rarity))
  }
  
  private getRarityMultiplier(rarity: PokemonSpecies['rarity']): number {
    const multipliers = {
      common: 1.0,
      uncommon: 1.5,
      rare: 2.5,
      ultra_rare: 4.0,
      legendary: 10.0,
      mythical: 20.0
    }
    
    return multipliers[rarity]
  }
  
  /**
   * 人気ポケモンのプリセットを取得
   */
  async getPopularPokemon(): Promise<PokemonSpecies[]> {
    const popularIds = [
      1, 4, 7, 25, 39, 52, 54, 104, 113, 129, 133, 138, 144, 150, 151, // 第1世代人気
      152, 155, 158, 172, 179, 196, 197, 243, 244, 245, 249, 250, 251, // 第2世代
      252, 255, 258, 280, 334, 350, 376, 380, 381, 382, 383, 384, 385, // 第3世代
      387, 390, 393, 448, 483, 484, 487, 491, 492, 493, // 第4世代
      494, 643, 644, 646, 647, 648, 649 // 第5世代
    ]
    
    return this.getBulkPokemonData(popularIds)
  }
  
  /**
   * 指定世代のポケモンを取得
   */
  async getPokemonByGeneration(generation: number): Promise<PokemonSpecies[]> {
    const generationRanges: Record<number, [number, number]> = {
      1: [1, 151],
      2: [152, 251],
      3: [252, 386],
      4: [387, 493],
      5: [494, 649]
    }
    
    const range = generationRanges[generation]
    if (!range) throw new Error(`Unsupported generation: ${generation}`)
    
    const [start, end] = range
    const ids = Array.from({ length: end - start + 1 }, (_, i) => start + i)
    
    return this.getBulkPokemonData(ids)
  }
  
  /**
   * キャッシュ統計を取得
   */
  getCacheStats(): { size: number; hitRate: number; maxSize: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // LRUCacheに統計機能があれば実装
      maxSize: 500
    }
  }
  
  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    this.cache.clear()
    this.requestQueue.clear()
  }
}

// シングルトンインスタンス
export const pokeAPIService = PokeAPIService.getInstance()