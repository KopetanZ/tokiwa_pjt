// ポケモン捕獲・管理システム
import { gameRandom } from './random-system'
import { EXPEDITION_LOCATIONS, ExpeditionLocation } from './expedition-system'
import { pokeAPI, generateRandomWildPokemon, fetchPokedexEntry, getJapaneseName } from '@/lib/pokeapi'

// ポケモン関連の型定義
export interface PokemonSpecies {
  id: number
  name_ja: string
  name_en: string
  types: string[]
  base_stats: {
    hp: number
    attack: number
    defense: number
    special_attack: number
    special_defense: number
    speed: number
  }
  catch_rate: number
  rarity_tier: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary'
  habitat: string[]
  description_ja: string
}

export interface PokemonInstance {
  id: string
  species_id: number
  species: PokemonSpecies
  level: number
  experience: number
  individual_values: {
    hp: number
    attack: number
    defense: number
    special_attack: number
    special_defense: number
    speed: number
  }
  current_hp: number
  max_hp: number
  status_condition: 'healthy' | 'poisoned' | 'paralyzed' | 'sleeping' | 'burned' | 'frozen'
  moves: string[]
  caught_at: string
  caught_location: string
  trainer_id?: string
  nickname?: string
}

export interface CaptureAttempt {
  species: PokemonSpecies
  location: ExpeditionLocation
  trainer: any
  party: PokemonInstance[]
  strategy: string
  weather?: string
  time_of_day?: 'morning' | 'day' | 'evening' | 'night'
}

export interface CaptureResult {
  success: boolean
  pokemon?: PokemonInstance
  capture_rate: number
  experience: number
  message: string
  damage?: number[]
}

// 第1世代ポケモンの基本データ（PokeAPIから取得する前の仮データ）
export const POKEMON_SPECIES_DATA: Record<number, PokemonSpecies> = {
  1: {
    id: 1,
    name_ja: 'フシギダネ',
    name_en: 'Bulbasaur',
    types: ['grass', 'poison'],
    base_stats: { hp: 45, attack: 49, defense: 49, special_attack: 65, special_defense: 65, speed: 45 },
    catch_rate: 45,
    rarity_tier: 'rare',
    habitat: ['forest', 'route'],
    description_ja: '背中の種から栄養をとって大きくなるポケモン。'
  },
  4: {
    id: 4,
    name_ja: 'ヒトカゲ',
    name_en: 'Charmander',
    types: ['fire'],
    base_stats: { hp: 39, attack: 52, defense: 43, special_attack: 60, special_defense: 50, speed: 65 },
    catch_rate: 45,
    rarity_tier: 'rare',
    habitat: ['mountain', 'cave'],
    description_ja: '尻尾の炎は気持ちを表現する。楽しい時は炎が燃え上がる。'
  },
  7: {
    id: 7,
    name_ja: 'ゼニガメ',
    name_en: 'Squirtle',
    types: ['water'],
    base_stats: { hp: 44, attack: 48, defense: 65, special_attack: 50, special_defense: 64, speed: 43 },
    catch_rate: 45,
    rarity_tier: 'rare',
    habitat: ['water', 'route'],
    description_ja: '甲羅に引っ込んで身を守る。隙を見て水を噴射して反撃する。'
  },
  10: {
    id: 10,
    name_ja: 'キャタピー',
    name_en: 'Caterpie',
    types: ['bug'],
    base_stats: { hp: 45, attack: 30, defense: 35, special_attack: 20, special_defense: 20, speed: 45 },
    catch_rate: 255,
    rarity_tier: 'common',
    habitat: ['forest', 'route'],
    description_ja: '緑色の体をしている。イモムシのような見た目だがこれはポケモンである。'
  },
  16: {
    id: 16,
    name_ja: 'ポッポ',
    name_en: 'Pidgey',
    types: ['normal', 'flying'],
    base_stats: { hp: 40, attack: 45, defense: 40, special_attack: 35, special_defense: 35, speed: 56 },
    catch_rate: 255,
    rarity_tier: 'common',
    habitat: ['route', 'forest'],
    description_ja: '縄張り意識が低く大人しい。草むらに隠れている虫ポケモンを捕食する。'
  },
  19: {
    id: 19,
    name_ja: 'コラッタ',
    name_en: 'Rattata',
    types: ['normal'],
    base_stats: { hp: 30, attack: 56, defense: 35, special_attack: 25, special_defense: 35, speed: 72 },
    catch_rate: 255,
    rarity_tier: 'common',
    habitat: ['route', 'cave'],
    description_ja: '警戒心がとても強く どこにでも住み着く。繁殖力が高い。'
  },
  25: {
    id: 25,
    name_ja: 'ピカチュウ',
    name_en: 'Pikachu',
    types: ['electric'],
    base_stats: { hp: 35, attack: 55, defense: 40, special_attack: 50, special_defense: 50, speed: 90 },
    catch_rate: 190,
    rarity_tier: 'uncommon',
    habitat: ['forest', 'route'],
    description_ja: '頬の両側に小さい電気袋を持つ。ピンチの時に放電する。'
  },
  56: {
    id: 56,
    name_ja: 'マンキー',
    name_en: 'Mankey',
    types: ['fighting'],
    base_stats: { hp: 40, attack: 80, defense: 35, special_attack: 35, special_defense: 45, speed: 70 },
    catch_rate: 190,
    rarity_tier: 'uncommon',
    habitat: ['route', 'mountain'],
    description_ja: '怒りっぽい性格。気に入らないことがあると怒って暴れまわる。'
  },
  74: {
    id: 74,
    name_ja: 'イシツブテ',
    name_en: 'Geodude',
    types: ['rock', 'ground'],
    base_stats: { hp: 40, attack: 80, defense: 100, special_attack: 30, special_defense: 30, speed: 20 },
    catch_rate: 255,
    rarity_tier: 'common',
    habitat: ['mountain', 'cave'],
    description_ja: '山道でよく見かける。足音を立てずに歩くので踏んでしまうことがある。'
  },
  129: {
    id: 129,
    name_ja: 'コイキング',
    name_en: 'Magikarp',
    types: ['water'],
    base_stats: { hp: 20, attack: 10, defense: 55, special_attack: 15, special_defense: 20, speed: 80 },
    catch_rate: 255,
    rarity_tier: 'common',
    habitat: ['water'],
    description_ja: '世界中の汚い水の中でも生きられる とても生命力の強いポケモン。'
  },
  150: {
    id: 150,
    name_ja: 'ミュウツー',
    name_en: 'Mewtwo',
    types: ['psychic'],
    base_stats: { hp: 106, attack: 110, defense: 90, special_attack: 154, special_defense: 90, speed: 130 },
    catch_rate: 3,
    rarity_tier: 'legendary',
    habitat: ['cave'],
    description_ja: '遺伝子操作によって作られた人工のポケモン。人間の科学力で作られた。'
  }
}

// 希少度別出現率設定
const RARITY_DISTRIBUTION = {
  common: 0.60,
  uncommon: 0.25,
  rare: 0.10,
  very_rare: 0.04,
  legendary: 0.01
}

export class PokemonSystem {
  
  // 派遣地域でのポケモン出現判定（PokeAPI連携版）
  async generateWildPokemonEncounter(location: ExpeditionLocation): Promise<PokemonSpecies | null> {
    // 場所による希少度補正
    const rarityBonus = Math.min(0.3, location.distanceLevel * 0.03)
    
    const adjustedDistribution = {
      common: Math.max(0.2, RARITY_DISTRIBUTION.common - rarityBonus),
      uncommon: RARITY_DISTRIBUTION.uncommon,
      rare: RARITY_DISTRIBUTION.rare + rarityBonus * 0.5,
      very_rare: RARITY_DISTRIBUTION.very_rare + rarityBonus * 0.3,
      legendary: Math.min(0.05, RARITY_DISTRIBUTION.legendary + rarityBonus * 0.2)
    }
    
    // 希少度選択
    const selectedRarity = gameRandom.weightedChoice([
      { item: 'common', weight: adjustedDistribution.common },
      { item: 'uncommon', weight: adjustedDistribution.uncommon },
      { item: 'rare', weight: adjustedDistribution.rare },
      { item: 'very_rare', weight: adjustedDistribution.very_rare },
      { item: 'legendary', weight: adjustedDistribution.legendary }
    ])
    
    try {
      // PokeAPIから実際のポケモンデータを取得
      const wildPokemon = await generateRandomWildPokemon(
        Math.max(1, location.requiredLevel + gameRandom.integer(-2, 3))
      )
      
      // 希少度の再判定（場所の距離レベルに応じて）
      const actualRarity = this.determineActualRarity(selectedRarity, location.distanceLevel)
      
      // PokeAPIデータをゲーム内形式に変換
      const pokemonSpecies: PokemonSpecies = {
        id: wildPokemon.species.id,
        name_ja: wildPokemon.species.name,
        name_en: wildPokemon.species.nameEn,
        types: wildPokemon.species.types,
        base_stats: {
          hp: wildPokemon.species.baseStats.hp,
          attack: wildPokemon.species.baseStats.attack,
          defense: wildPokemon.species.baseStats.defense,
          special_attack: wildPokemon.species.baseStats.specialAttack,
          special_defense: wildPokemon.species.baseStats.specialDefense,
          speed: wildPokemon.species.baseStats.speed
        },
        catch_rate: wildPokemon.species.captureRate,
        rarity_tier: actualRarity,
        habitat: this.inferHabitatFromTypes(wildPokemon.species.types),
        description_ja: wildPokemon.species.description
      }
      
      return pokemonSpecies
    } catch (error) {
      console.error('PokeAPI連携エラー、フォールバックデータを使用:', error)
      
      // フォールバック: 既存のローカルデータから選択
      const candidatePokemon = Object.values(POKEMON_SPECIES_DATA).filter(pokemon => {
        if (pokemon.rarity_tier !== selectedRarity) return false
        
        const hasMatchingType = pokemon.types.some(type => 
          location.encounterTypes.includes(type)
        )
        
        const hasMatchingHabitat = pokemon.habitat.some(habitat => {
          return location.nameEn.toLowerCase().includes(habitat) ||
                 location.nameJa.includes(habitat)
        })
        
        return hasMatchingType || hasMatchingHabitat
      })
      
      if (candidatePokemon.length === 0) {
        const fallbackPokemon = Object.values(POKEMON_SPECIES_DATA).filter(p => 
          p.rarity_tier === 'common'
        )
        return fallbackPokemon.length > 0 ? gameRandom.choice(fallbackPokemon) : null
      }
      
      return gameRandom.choice(candidatePokemon)
    }
  }

  // 捕獲確率計算
  calculateCaptureRate(attempt: CaptureAttempt): number {
    const { species, location, trainer, party } = attempt
    
    // 1. ベース捕獲率（ポケモンの種族による）
    let baseCaptureRate = (species.catch_rate || 45) / 255 // 0.0-1.0に正規化
    
    // 2. レベル差補正
    const averagePartyLevel = party.length > 0 ? 
      party.reduce((sum, p) => sum + p.level, 0) / party.length : 5
    const estimatedWildLevel = Math.max(1, location.requiredLevel + gameRandom.integer(-2, 3))
    const levelDifference = averagePartyLevel - estimatedWildLevel
    const levelMultiplier = 1.0 + (levelDifference * 0.02) // ±2%/レベル
    
    // 3. トレーナー職業補正
    const jobMultiplier = this.getJobCaptureBonus(trainer.job || 'ranger')
    
    // 4. 場所補正
    const locationMultiplier = this.getLocationCaptureMultiplier(location, species)
    
    // 5. 天候・時間補正
    const environmentMultiplier = this.getEnvironmentMultiplier(
      species, attempt.weather, attempt.time_of_day
    )
    
    // 6. パーティ状態補正
    const partyConditionMultiplier = this.calculatePartyConditionBonus(party)
    
    // 7. 戦略補正
    const strategyMultiplier = this.getStrategyMultiplier(attempt.strategy)
    
    const finalCaptureRate = baseCaptureRate 
      * levelMultiplier 
      * jobMultiplier 
      * locationMultiplier 
      * environmentMultiplier 
      * partyConditionMultiplier
      * strategyMultiplier
    
    return Math.min(0.95, Math.max(0.01, finalCaptureRate))
  }

  // 職業による捕獲ボーナス
  private getJobCaptureBonus(jobName: string): number {
    const jobBonuses: Record<string, number> = {
      ranger: 1.3,      // レンジャーは捕獲のプロ
      researcher: 1.2,  // 研究者は知識が豊富
      breeder: 1.15,    // ブリーダーはポケモンに慣れている
      explorer: 1.1,    // 探検家は経験豊富
      battler: 0.9,     // バトラーは捕獲よりバトル重視
      medic: 1.0,       // 医師は標準
      economist: 0.95   // 経済学者は実戦経験が少ない
    }
    
    return jobBonuses[jobName] || 1.0
  }

  // 場所による捕獲補正
  private getLocationCaptureMultiplier(location: ExpeditionLocation, species: PokemonSpecies): number {
    // ポケモンのタイプと場所の相性
    const typeMatch = species.types.some(type => 
      location.encounterTypes.includes(type)
    )
    
    // 生息地の一致
    const habitatMatch = species.habitat.some(habitat => 
      location.nameEn.toLowerCase().includes(habitat) ||
      location.nameJa.includes(habitat)
    )
    
    if (typeMatch && habitatMatch) return 1.3
    if (typeMatch || habitatMatch) return 1.1
    return 0.8 // 不適合な環境では捕獲困難
  }

  // 環境補正（天候・時間）
  private getEnvironmentMultiplier(
    species: PokemonSpecies, 
    weather?: string, 
    timeOfDay?: string
  ): number {
    let multiplier = 1.0
    
    // 天候効果
    if (weather) {
      const weatherTypeBonus = this.getWeatherTypeBonus(species.types, weather)
      multiplier *= weatherTypeBonus
    }
    
    // 時間帯効果
    if (timeOfDay) {
      const timeBonus = this.getTimeOfDayBonus(species, timeOfDay)
      multiplier *= timeBonus
    }
    
    return multiplier
  }

  // 天候とタイプの相性
  private getWeatherTypeBonus(types: string[], weather: string): number {
    const weatherBonuses: Record<string, Record<string, number>> = {
      sunny: { fire: 1.2, grass: 1.1, water: 0.9 },
      rainy: { water: 1.2, electric: 1.1, fire: 0.8 },
      snowy: { ice: 1.3, water: 1.1, fire: 0.7 },
      windy: { flying: 1.2, normal: 1.1 },
      foggy: { ghost: 1.3, psychic: 1.1 }
    }
    
    const bonus = weatherBonuses[weather]
    if (!bonus) return 1.0
    
    let averageBonus = 1.0
    for (const type of types) {
      averageBonus += (bonus[type] || 1.0) - 1.0
    }
    
    return averageBonus / types.length
  }

  // 時間帯ボーナス
  private getTimeOfDayBonus(species: PokemonSpecies, timeOfDay: string): number {
    // 特定のポケモンは特定の時間に出現しやすい
    const timePreferences: Record<string, string[]> = {
      morning: ['normal', 'flying', 'grass'],
      day: ['fire', 'electric', 'fighting'],
      evening: ['water', 'psychic'],
      night: ['ghost', 'dark', 'poison']
    }
    
    const preferredTypes = timePreferences[timeOfDay] || []
    const hasPreferredType = species.types.some(type => 
      preferredTypes.includes(type)
    )
    
    return hasPreferredType ? 1.2 : 1.0
  }

  // パーティ状態による補正
  private calculatePartyConditionBonus(party: PokemonInstance[]): number {
    if (party.length === 0) return 0.8 // パーティなしは不利
    
    // 平均HP割合
    const averageHpRatio = party.reduce((sum, pokemon) => 
      sum + (pokemon.current_hp / pokemon.max_hp), 0
    ) / party.length
    
    // パーティサイズボーナス
    const sizeBonus = 1.0 + (Math.min(party.length, 6) - 1) * 0.05
    
    // HP状態ペナルティ
    const hpPenalty = 0.7 + averageHpRatio * 0.3
    
    return sizeBonus * hpPenalty
  }

  // 戦略による補正
  private getStrategyMultiplier(strategy: string): number {
    const strategyBonuses: Record<string, number> = {
      balanced: 1.0,
      aggressive: 0.8,    // 攻撃的だと捕獲率は下がる
      defensive: 1.1,     // 慎重だと捕獲率向上
      exploration: 1.3    // 探索重視は捕獲に特化
    }
    
    return strategyBonuses[strategy] || 1.0
  }

  // 捕獲試行
  attemptCapture(attempt: CaptureAttempt): CaptureResult {
    const captureRate = this.calculateCaptureRate(attempt)
    const success = gameRandom.chance(captureRate)
    
    if (success) {
      const caughtPokemon = this.generateCaughtPokemon(attempt.species, attempt.location)
      return {
        success: true,
        pokemon: caughtPokemon,
        capture_rate: captureRate,
        experience: this.calculateCaptureExperience(attempt.species),
        message: `${attempt.species.name_ja}を捕まえた！`
      }
    } else {
      return {
        success: false,
        capture_rate: captureRate,
        damage: this.calculateCaptureDamage(attempt.party),
        message: `${attempt.species.name_ja}に逃げられた...`,
        experience: Math.floor(this.calculateCaptureExperience(attempt.species) * 0.3)
      }
    }
  }

  // 捕獲したポケモンのインスタンス生成
  private generateCaughtPokemon(species: PokemonSpecies, location: ExpeditionLocation): PokemonInstance {
    // レベル決定（場所の危険度に応じて）
    const minLevel = Math.max(1, location.requiredLevel - 2)
    const maxLevel = location.requiredLevel + 5
    const level = gameRandom.integer(minLevel, maxLevel)
    
    // 個体値生成（0-31）
    const individualValues = {
      hp: gameRandom.integer(0, 31),
      attack: gameRandom.integer(0, 31),
      defense: gameRandom.integer(0, 31),
      special_attack: gameRandom.integer(0, 31),
      special_defense: gameRandom.integer(0, 31),
      speed: gameRandom.integer(0, 31)
    }
    
    // HP計算
    const maxHp = this.calculateStat(species.base_stats.hp, level, individualValues.hp)
    
    // 経験値計算（レベルに応じた経験値）
    const experience = this.calculateExperienceForLevel(level)
    
    // 基本技生成（簡易版）
    const moves = this.generateBasicMoves(species, level)
    
    return {
      id: `pokemon_${Date.now()}_${gameRandom.integer(1000, 9999)}`,
      species_id: species.id,
      species,
      level,
      experience,
      individual_values: individualValues,
      current_hp: maxHp,
      max_hp: maxHp,
      status_condition: 'healthy',
      moves,
      caught_at: new Date().toISOString(),
      caught_location: location.nameJa
    }
  }

  // ステータス計算（簡易版ポケモン計算式）
  private calculateStat(baseStat: number, level: number, iv: number): number {
    return Math.floor(((baseStat * 2 + iv) * level) / 100) + 5
  }

  // レベルに応じた経験値計算
  private calculateExperienceForLevel(level: number): number {
    // 簡易的な経験値計算（中速成長タイプ）
    return Math.floor(level ** 3)
  }

  // 基本技生成
  private generateBasicMoves(species: PokemonSpecies, level: number): string[] {
    // タイプに応じた基本技
    const typeMoves: Record<string, string[]> = {
      normal: ['たいあたり', 'でんこうせっか', 'ひっかく'],
      fire: ['ひのこ', 'かえんほうしゃ', 'かえんぐるま'],
      water: ['みずでっぽう', 'バブルこうせん', 'ハイドロポンプ'],
      electric: ['でんきショック', '10まんボルト', 'かみなり'],
      grass: ['はっぱカッター', 'ソーラービーム', 'やどりぎのタネ'],
      ice: ['こおりのつぶて', 'ふぶき', 'れいとうビーム'],
      fighting: ['からてチョップ', 'きあいパンチ', 'かわらわり'],
      poison: ['どくばり', 'ヘドロばくだん', 'どくどく'],
      ground: ['じしん', 'じならし', 'すなじごく'],
      flying: ['つばさでうつ', 'エアスラッシュ', 'ぼうふう'],
      psychic: ['ねんりき', 'サイコキネシス', 'みらいよち'],
      bug: ['むしくい', 'とんぼがえり', 'シザークロス'],
      rock: ['いわおとし', 'ロックブラスト', 'ストーンエッジ'],
      ghost: ['したでなめる', 'シャドーボール', 'あやしいひかり'],
      dragon: ['りゅうのいかり', 'ドラゴンクロー', 'りゅうせいぐん'],
      dark: ['かみつく', 'あくのはどう', 'つじぎり'],
      steel: ['はがねのつばさ', 'アイアンヘッド', 'ラスターカノン'],
      fairy: ['ようせいのかぜ', 'ムーンフォース', 'じゃれつく']
    }
    
    const moves: string[] = []
    
    // タイプ一致技を1-2個
    for (const type of species.types) {
      const availableMoves = typeMoves[type] || ['たいあたり']
      const moveCount = Math.min(availableMoves.length, level <= 10 ? 1 : 2)
      
      for (let i = 0; i < moveCount; i++) {
        const move = availableMoves[Math.min(i, availableMoves.length - 1)]
        if (!moves.includes(move)) {
          moves.push(move)
        }
      }
    }
    
    // 汎用技で埋める（最大4つ）
    const universalMoves = ['たいあたり', 'でんこうせっか', 'かげぶんしん', 'みがわり']
    while (moves.length < Math.min(4, Math.floor(level / 5) + 1)) {
      const move = gameRandom.choice(universalMoves)
      if (!moves.includes(move)) {
        moves.push(move)
      }
    }
    
    return moves
  }

  // 捕獲経験値計算
  private calculateCaptureExperience(species: PokemonSpecies): number {
    const baseExp = 50
    const rarityMultiplier = {
      common: 1.0,
      uncommon: 1.5,
      rare: 2.0,
      very_rare: 3.0,
      legendary: 5.0
    }
    
    return Math.floor(baseExp * (rarityMultiplier[species.rarity_tier] || 1.0))
  }

  // 捕獲失敗時のダメージ計算
  private calculateCaptureDamage(party: PokemonInstance[]): number[] {
    return party.map(pokemon => {
      const maxDamage = Math.floor(pokemon.max_hp * 0.1) // 最大10%のダメージ
      return gameRandom.integer(1, Math.max(1, maxDamage))
    })
  }

  // ポケモンの総合評価計算
  calculatePokemonRating(pokemon: PokemonInstance): {
    overall: number
    attack: number
    defense: number
    speed: number
    potential: number
  } {
    const species = pokemon.species
    const ivs = pokemon.individual_values
    
    // 種族値 + 個体値での各ステータス計算
    const attackStat = this.calculateStat(species.base_stats.attack, pokemon.level, ivs.attack)
    const defenseStat = this.calculateStat(species.base_stats.defense, pokemon.level, ivs.defense)
    const speedStat = this.calculateStat(species.base_stats.speed, pokemon.level, ivs.speed)
    
    // 個体値の合計（0-186）
    const totalIVs = Object.values(ivs).reduce((sum, iv) => sum + iv, 0)
    const ivPercentage = totalIVs / 186 // 最大値で割って0-1に正規化
    
    // 各評価の計算
    const attack = Math.floor((attackStat / 200) * 100) // 100点満点
    const defense = Math.floor((defenseStat / 200) * 100)
    const speed = Math.floor((speedStat / 200) * 100)
    const potential = Math.floor(ivPercentage * 100)
    
    // 総合評価（レベル補正込み）
    const levelBonus = Math.min(50, pokemon.level) // レベル50まではボーナス
    const overall = Math.floor(((attack + defense + speed) / 3 + potential + levelBonus) / 2)
    
    return {
      overall: Math.min(100, overall),
      attack: Math.min(100, attack),
      defense: Math.min(100, defense),
      speed: Math.min(100, speed),
      potential: Math.min(100, potential)
    }
  }

  // パーティ編成の推奨
  recommendPartyComposition(availablePokemon: PokemonInstance[], location: ExpeditionLocation): {
    recommended: PokemonInstance[]
    reasoning: string[]
  } {
    const reasoning: string[] = []
    
    if (availablePokemon.length === 0) {
      return {
        recommended: [],
        reasoning: ['利用可能なポケモンがいません。']
      }
    }
    
    // 1. タイプ相性でフィルタリング
    const typeAdvantageousPokemon = availablePokemon.filter(pokemon => {
      const hasAdvantage = pokemon.species.types.some(type => {
        // 簡略化したタイプ相性チェック
        return this.hasTypeAdvantage(type, location.encounterTypes)
      })
      return hasAdvantage
    })
    
    if (typeAdvantageousPokemon.length > 0) {
      reasoning.push(`${location.nameJa}の出現ポケモンに有利なタイプのポケモンを優先しました。`)
    }
    
    // 2. レベルとステータスで並び替え
    const sortedPokemon = (typeAdvantageousPokemon.length > 0 ? 
      typeAdvantageousPokemon : availablePokemon)
      .sort((a, b) => {
        const ratingA = this.calculatePokemonRating(a).overall
        const ratingB = this.calculatePokemonRating(b).overall
        return ratingB - ratingA // 評価の高い順
      })
    
    // 3. 最大6体を選択
    const recommended = sortedPokemon.slice(0, 6)
    
    if (recommended.length < 6) {
      reasoning.push(`パーティサイズ: ${recommended.length}/6体`)
    } else {
      reasoning.push('最強の6体でパーティを編成しました。')
    }
    
    // 4. HP状態チェック
    const injuredCount = recommended.filter(p => 
      p.current_hp < p.max_hp * 0.8
    ).length
    
    if (injuredCount > 0) {
      reasoning.push(`${injuredCount}体のポケモンが負傷しています。回復を推奨します。`)
    }
    
    return {
      recommended,
      reasoning
    }
  }

  // タイプ相性の簡易チェック
  private hasTypeAdvantage(attackType: string, defenseTypes: string[]): boolean {
    const advantages: Record<string, string[]> = {
      fire: ['grass', 'ice', 'bug', 'steel'],
      water: ['fire', 'ground', 'rock'],
      grass: ['water', 'ground', 'rock'],
      electric: ['water', 'flying'],
      rock: ['fire', 'ice', 'flying', 'bug'],
      ground: ['fire', 'electric', 'poison', 'rock', 'steel'],
      fighting: ['normal', 'ice', 'rock', 'dark', 'steel'],
      flying: ['grass', 'fighting', 'bug'],
      psychic: ['fighting', 'poison'],
      ice: ['grass', 'ground', 'flying', 'dragon']
    }
    
    const effectiveAgainst = advantages[attackType] || []
    return defenseTypes.some(defType => effectiveAgainst.includes(defType))
  }

  // 実際の希少度を決定（場所とランダム要素を考慮）
  private determineActualRarity(baseRarity: string, distanceLevel: number): PokemonSpecies['rarity_tier'] {
    const rarityUpgradeChance = Math.min(0.3, distanceLevel * 0.03)
    
    if (gameRandom.chance(rarityUpgradeChance)) {
      const rarityLevels = ['common', 'uncommon', 'rare', 'very_rare', 'legendary']
      const currentIndex = rarityLevels.indexOf(baseRarity)
      const upgradeIndex = Math.min(rarityLevels.length - 1, currentIndex + 1)
      return rarityLevels[upgradeIndex] as PokemonSpecies['rarity_tier']
    }
    
    return baseRarity as PokemonSpecies['rarity_tier']
  }

  // タイプから生息地を推測
  private inferHabitatFromTypes(types: string[]): string[] {
    const typeHabitats: Record<string, string[]> = {
      grass: ['forest', 'route'],
      water: ['water', 'route'],
      fire: ['mountain', 'cave'],
      electric: ['route', 'forest'],
      rock: ['mountain', 'cave'],
      ground: ['cave', 'route'],
      flying: ['route', 'mountain'],
      psychic: ['cave', 'route'],
      ice: ['cave', 'mountain'],
      dragon: ['cave', 'mountain'],
      ghost: ['cave'],
      dark: ['cave', 'forest'],
      steel: ['cave', 'mountain'],
      fairy: ['forest', 'route']
    }
    
    const habitats = new Set<string>()
    for (const type of types) {
      const typeHabitat = typeHabitats[type] || ['route']
      typeHabitat.forEach(habitat => habitats.add(habitat))
    }
    
    return Array.from(habitats)
  }

  // PokeAPIを使用してポケモン詳細を取得
  async getPokemonSpeciesFromAPI(id: number): Promise<PokemonSpecies | null> {
    try {
      const pokedexEntry = await fetchPokedexEntry(id)
      if (!pokedexEntry) return null
      
      return {
        id: pokedexEntry.id,
        name_ja: pokedexEntry.name,
        name_en: pokedexEntry.nameEn,
        types: pokedexEntry.types,
        base_stats: {
          hp: pokedexEntry.baseStats.hp,
          attack: pokedexEntry.baseStats.attack,
          defense: pokedexEntry.baseStats.defense,
          special_attack: pokedexEntry.baseStats.specialAttack,
          special_defense: pokedexEntry.baseStats.specialDefense,
          speed: pokedexEntry.baseStats.speed
        },
        catch_rate: pokedexEntry.captureRate,
        rarity_tier: this.calculateRarityFromCatchRate(pokedexEntry.captureRate),
        habitat: this.inferHabitatFromTypes(pokedexEntry.types),
        description_ja: pokedexEntry.description
      }
    } catch (error) {
      console.error('PokeAPI取得エラー:', error)
      return null
    }
  }

  // 捕獲率から希少度を計算
  private calculateRarityFromCatchRate(catchRate: number): PokemonSpecies['rarity_tier'] {
    if (catchRate >= 200) return 'common'
    if (catchRate >= 120) return 'uncommon'
    if (catchRate >= 45) return 'rare'
    if (catchRate >= 10) return 'very_rare'
    return 'legendary'
  }

  // 指定されたレアリティのポケモンリストを取得
  getPokemonByRarity(rarity: string): PokemonSpecies[] {
    return Object.values(POKEMON_SPECIES_DATA).filter(pokemon => 
      pokemon.rarity_tier === rarity
    )
  }

  // ポケモンの詳細情報を取得（ローカルデータ）
  getPokemonSpecies(id: number): PokemonSpecies | null {
    return POKEMON_SPECIES_DATA[id] || null
  }

  // 全ポケモンリストを取得（ローカルデータ）
  getAllPokemonSpecies(): PokemonSpecies[] {
    return Object.values(POKEMON_SPECIES_DATA)
  }

  // ポケモンケア機能
  healPokemon(pokemon: PokemonInstance, healType: 'basic' | 'full'): {
    success: boolean
    newHp: number
    healedAmount: number
    cost: number
  } {
    const cost = healType === 'full' ? 800 : 300
    const healAmount = healType === 'full' ? pokemon.max_hp : Math.floor(pokemon.max_hp * 0.5)
    
    const newHp = Math.min(pokemon.max_hp, pokemon.current_hp + healAmount)
    const actualHealedAmount = newHp - pokemon.current_hp
    
    // ポケモンの状態を更新
    pokemon.current_hp = newHp
    if (healType === 'full') {
      pokemon.status_condition = 'healthy'
    }
    
    return {
      success: true,
      newHp,
      healedAmount: actualHealedAmount,
      cost
    }
  }

  // なつき度向上
  increaseFriendship(pokemon: PokemonInstance, treatmentType: 'basic' | 'premium'): {
    success: boolean
    friendshipIncrease: number
    cost: number
  } {
    const cost = treatmentType === 'premium' ? 1200 : 500
    const baseIncrease = treatmentType === 'premium' ? 20 : 10
    
    // ランダム要素を追加
    const actualIncrease = gameRandom.integer(
      Math.floor(baseIncrease * 0.7), 
      Math.floor(baseIncrease * 1.3)
    )
    
    // なつき度の上限は255
    const friendship = Math.min(255, (pokemon as any).friendship || 0)
    const newFriendship = Math.min(255, friendship + actualIncrease)
    
    // ポケモンデータを更新
    ;(pokemon as any).friendship = newFriendship
    
    return {
      success: true,
      friendshipIncrease: newFriendship - friendship,
      cost
    }
  }

  // 特訓コース
  trainPokemon(pokemon: PokemonInstance, trainingType: 'basic' | 'intensive'): {
    success: boolean
    experienceGained: number
    levelUp: boolean
    newLevel: number
    cost: number
  } {
    const cost = trainingType === 'intensive' ? 2500 : 1200
    const baseExp = trainingType === 'intensive' ? 200 : 100
    
    // レベルによる補正
    const levelMultiplier = 1.0 + (pokemon.level * 0.1)
    const expGained = Math.floor(baseExp * levelMultiplier * gameRandom.range(0.8, 1.2))
    
    const oldLevel = pokemon.level
    pokemon.experience += expGained
    
    // レベルアップ計算（簡易）
    const expForNextLevel = Math.pow(pokemon.level + 1, 3)
    let newLevel = oldLevel
    
    while (pokemon.experience >= Math.pow(newLevel + 1, 3) && newLevel < 100) {
      newLevel++
    }
    
    pokemon.level = newLevel
    
    // レベルアップ時のステータス更新
    if (newLevel > oldLevel) {
      this.updateStatsOnLevelUp(pokemon, newLevel - oldLevel)
    }
    
    return {
      success: true,
      experienceGained: expGained,
      levelUp: newLevel > oldLevel,
      newLevel,
      cost
    }
  }

  // 全体回復（複数ポケモン）
  healAllPokemon(pokemonList: PokemonInstance[], healType: 'basic' | 'full'): {
    success: boolean
    healedPokemon: number
    totalCost: number
    results: Array<{
      pokemonId: string
      healedAmount: number
    }>
  } {
    const results: Array<{ pokemonId: string; healedAmount: number }> = []
    let totalCost = 0
    let healedCount = 0
    
    for (const pokemon of pokemonList) {
      if (pokemon.current_hp < pokemon.max_hp || pokemon.status_condition !== 'healthy') {
        const result = this.healPokemon(pokemon, healType)
        results.push({
          pokemonId: pokemon.id,
          healedAmount: result.healedAmount
        })
        totalCost += result.cost
        healedCount++
      }
    }
    
    return {
      success: true,
      healedPokemon: healedCount,
      totalCost,
      results
    }
  }

  // レベルアップ時のステータス更新
  private updateStatsOnLevelUp(pokemon: PokemonInstance, levelsGained: number): void {
    const species = pokemon.species
    const ivs = pokemon.individual_values
    
    // 新しい最大HPを計算
    const newMaxHp = this.calculateStat(species.base_stats.hp, pokemon.level, ivs.hp)
    const hpGain = newMaxHp - pokemon.max_hp
    
    pokemon.max_hp = newMaxHp
    pokemon.current_hp = Math.min(pokemon.max_hp, pokemon.current_hp + hpGain)
  }
}

export const pokemonSystem = new PokemonSystem()