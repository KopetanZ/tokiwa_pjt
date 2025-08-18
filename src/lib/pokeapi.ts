// PokeAPI統合とキャッシングシステム
import { PokemonType } from '@/types/pokemon'

// PokeAPI レスポンス型定義
interface PokeAPISpecies {
  id: number
  name: string
  sprites: {
    front_default: string | null
    front_shiny: string | null
  }
  types: Array<{
    slot: number
    type: {
      name: string
    }
  }>
  stats: Array<{
    base_stat: number
    stat: {
      name: string
    }
  }>
  abilities: Array<{
    ability: {
      name: string
    }
    is_hidden: boolean
  }>
  height: number
  weight: number
  base_experience: number | null
  species: {
    url: string
  }
}

interface PokeAPISpeciesDetail {
  id: number
  name: string
  names: Array<{
    name: string
    language: {
      name: string
    }
  }>
  flavor_text_entries: Array<{
    flavor_text: string
    language: {
      name: string
    }
  }>
  capture_rate: number
  base_happiness: number
  growth_rate: {
    name: string
  }
  egg_groups: Array<{
    name: string
  }>
  gender_rate: number
}

// キャッシュ管理
class PokeAPICache {
  private cache = new Map<string, any>()
  private readonly maxAge = 60 * 60 * 1000 // 1時間
  
  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }
  
  get(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  size(): number {
    return this.cache.size
  }
}

const cache = new PokeAPICache()

// API クライアント
class PokeAPIClient {
  private readonly baseUrl = 'https://pokeapi.co/api/v2'
  
  async fetchPokemon(idOrName: string | number): Promise<PokeAPISpecies> {
    const cacheKey = `pokemon:${idOrName}`
    const cached = cache.get(cacheKey)
    if (cached) return cached
    
    try {
      const response = await fetch(`${this.baseUrl}/pokemon/${idOrName}`)
      if (!response.ok) {
        throw new Error(`PokeAPI Error: ${response.status}`)
      }
      
      const data = await response.json()
      cache.set(cacheKey, data)
      return data
    } catch (error) {
      console.error('PokeAPI fetch error:', error)
      throw error
    }
  }
  
  async fetchSpecies(idOrName: string | number): Promise<PokeAPISpeciesDetail> {
    const cacheKey = `species:${idOrName}`
    const cached = cache.get(cacheKey)
    if (cached) return cached
    
    try {
      const response = await fetch(`${this.baseUrl}/pokemon-species/${idOrName}`)
      if (!response.ok) {
        throw new Error(`PokeAPI Species Error: ${response.status}`)
      }
      
      const data = await response.json()
      cache.set(cacheKey, data)
      return data
    } catch (error) {
      console.error('PokeAPI species fetch error:', error)
      throw error
    }
  }
  
  async fetchPokemonWithSpecies(idOrName: string | number) {
    const [pokemon, species] = await Promise.all([
      this.fetchPokemon(idOrName),
      this.fetchSpecies(idOrName)
    ])
    
    return { pokemon, species }
  }
}

export const pokeAPI = new PokeAPIClient()

// ヘルパー関数
export function getJapaneseName(names: Array<{ name: string; language: { name: string } }>): string {
  const japaneseName = names.find(n => n.language.name === 'ja')
  return japaneseName?.name || names.find(n => n.language.name === 'en')?.name || 'Unknown'
}

export function getJapaneseDescription(entries: Array<{ flavor_text: string; language: { name: string } }>): string {
  const japaneseEntry = entries.find(e => e.language.name === 'ja')
  return japaneseEntry?.flavor_text.replace(/\n/g, ' ') || 
         entries.find(e => e.language.name === 'en')?.flavor_text.replace(/\n/g, ' ') || 
         'No description available'
}

export function mapPokemonTypes(types: Array<{ type: { name: string } }>): PokemonType[] {
  return types.map(t => t.type.name as PokemonType)
}

export function mapStatValue(stats: Array<{ base_stat: number; stat: { name: string } }>, statName: string): number {
  const stat = stats.find(s => s.stat.name === statName)
  return stat?.base_stat || 0
}

export function mapGrowthRate(growthRateName: string): 'slow' | 'medium_slow' | 'medium_fast' | 'fast' | 'erratic' | 'fluctuating' {
  switch (growthRateName) {
    case 'slow': return 'slow'
    case 'medium-slow': return 'medium_slow'
    case 'medium': return 'medium_fast'
    case 'fast': return 'fast'
    case 'erratic': return 'erratic'
    case 'fluctuating': return 'fluctuating'
    default: return 'medium_fast'
  }
}

// ランダムポケモン生成
export async function generateRandomWildPokemon(level: number = 5): Promise<{
  species: any
  level: number
  shiny: boolean
  nature: string
  ivs: Record<string, number>
}> {
  // 第1世代のポケモンIDをランダム選択（1-151）
  const randomId = Math.floor(Math.random() * 151) + 1
  
  try {
    const { pokemon, species } = await pokeAPI.fetchPokemonWithSpecies(randomId)
    
    // シャイニー判定（1/4096の確率）
    const shiny = Math.random() < (1 / 4096)
    
    // 性格をランダム選択
    const natures = [
      'がんばりや', 'さみしがり', 'ゆうかん', 'いじっぱり', 'やんちゃ',
      'ずぶとい', 'すなお', 'のんき', 'わんぱく', 'のうてんき',
      'おくびょう', 'せっかち', 'まじめ', 'ようき', 'むじゃき',
      'ひかえめ', 'おっとり', 'れいせい', 'てれや', 'うっかりや',
      'おだやか', 'おとなしい', 'しんちょう', 'きまぐれ', 'なまいき'
    ]
    const nature = natures[Math.floor(Math.random() * natures.length)]
    
    // 個体値をランダム生成（0-31）
    const ivs = {
      hp: Math.floor(Math.random() * 32),
      attack: Math.floor(Math.random() * 32),
      defense: Math.floor(Math.random() * 32),
      specialAttack: Math.floor(Math.random() * 32),
      specialDefense: Math.floor(Math.random() * 32),
      speed: Math.floor(Math.random() * 32)
    }
    
    return {
      species: {
        id: pokemon.id,
        name: getJapaneseName(species.names),
        nameEn: pokemon.name,
        types: mapPokemonTypes(pokemon.types),
        baseStats: {
          hp: mapStatValue(pokemon.stats, 'hp'),
          attack: mapStatValue(pokemon.stats, 'attack'),
          defense: mapStatValue(pokemon.stats, 'defense'),
          specialAttack: mapStatValue(pokemon.stats, 'special-attack'),
          specialDefense: mapStatValue(pokemon.stats, 'special-defense'),
          speed: mapStatValue(pokemon.stats, 'speed')
        },
        abilities: pokemon.abilities.map(a => a.ability.name),
        height: pokemon.height,
        weight: pokemon.weight,
        captureRate: species.capture_rate,
        baseExperience: pokemon.base_experience || 0,
        growthRate: mapGrowthRate(species.growth_rate.name),
        description: getJapaneseDescription(species.flavor_text_entries),
        sprite: pokemon.sprites.front_default || ''
      },
      level,
      shiny,
      nature,
      ivs
    }
  } catch (error) {
    console.error('Failed to generate random Pokemon:', error)
    // フォールバック: ピカチュウ
    return {
      species: {
        id: 25,
        name: 'ピカチュウ',
        nameEn: 'pikachu',
        types: ['electric' as PokemonType],
        baseStats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90 },
        abilities: ['せいでんき'],
        height: 4,
        weight: 60,
        captureRate: 190,
        baseExperience: 112,
        growthRate: 'medium_fast' as const,
        description: 'ほっぺたの りょうがわに ちいさい でんきぶくろを もつ。',
        sprite: ''
      },
      level,
      shiny: false,
      nature: 'がんばりや',
      ivs: { hp: 20, attack: 20, defense: 20, specialAttack: 20, specialDefense: 20, speed: 20 }
    }
  }
}

// ポケモン図鑑データ取得
export async function fetchPokedexEntry(id: number) {
  try {
    const { pokemon, species } = await pokeAPI.fetchPokemonWithSpecies(id)
    
    return {
      id: pokemon.id,
      name: getJapaneseName(species.names),
      nameEn: pokemon.name,
      types: mapPokemonTypes(pokemon.types),
      description: getJapaneseDescription(species.flavor_text_entries),
      sprite: pokemon.sprites.front_default,
      shinySprite: pokemon.sprites.front_shiny,
      height: pokemon.height / 10, // デシメートル → メートル
      weight: pokemon.weight / 10, // ヘクトグラム → キログラム
      baseStats: {
        hp: mapStatValue(pokemon.stats, 'hp'),
        attack: mapStatValue(pokemon.stats, 'attack'),
        defense: mapStatValue(pokemon.stats, 'defense'),
        specialAttack: mapStatValue(pokemon.stats, 'special-attack'),
        specialDefense: mapStatValue(pokemon.stats, 'special-defense'),
        speed: mapStatValue(pokemon.stats, 'speed')
      },
      abilities: pokemon.abilities.map(a => a.ability.name),
      captureRate: species.capture_rate,
      baseExperience: pokemon.base_experience || 0,
      growthRate: mapGrowthRate(species.growth_rate.name)
    }
  } catch (error) {
    console.error('Failed to fetch Pokedex entry:', error)
    return null
  }
}

// キャッシュ統計
export function getCacheStats() {
  return {
    size: cache.size(),
    clear: () => cache.clear()
  }
}