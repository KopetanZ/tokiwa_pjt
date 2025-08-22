'use client'

import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { PixelProgressBar } from '@/components/ui/PixelProgressBar'
import { PixelInput } from '@/components/ui/PixelInput'
import { PokemonCard } from '@/components/pokemon/PokemonCard'
import { PokemonDetailModal } from '@/components/pokemon/PokemonDetailModal'
import { useGameState } from '@/lib/game-state/hooks'
import { gameController } from '@/lib/game-logic'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Pokemon interface for this page (simplified)
interface SimplePokemon {
  id: string
  dexNumber: number
  name: string
  nameEn: string
  level: number
  hp: number
  maxHp: number
  attack: number
  defense: number
  speed: number
  types: string[]
  nature: string
  ability: string
  status: 'available' | 'on_expedition' | 'injured' | 'training'
  trainerId: string | null
  friendship: number
  moves: string[]
  experience: number
  nextLevelExp: number
}

// サンプルポケモンデータ（モックIDと整合性を保つ）
const samplePokemon: SimplePokemon[] = [
  {
    id: 'mock-pokemon-1',
    dexNumber: 25,
    name: 'ピカチュウ',
    nameEn: 'pikachu',
    level: 12,
    hp: 35,
    maxHp: 35,
    attack: 24,
    defense: 18,
    speed: 30,
    types: ['electric'],
    nature: 'やんちゃ',
    ability: 'せいでんき',
    status: 'available',
    trainerId: null,
    friendship: 85,
    moves: ['でんきショック', 'でんこうせっか', 'しっぽをふる', 'なきごえ'],
    experience: 1580,
    nextLevelExp: 1728
  },
  {
    id: 'mock-pokemon-2', 
    dexNumber: 1,
    name: 'フシギダネ',
    nameEn: 'bulbasaur',
    level: 8,
    hp: 22,
    maxHp: 22,
    attack: 16,
    defense: 16,
    speed: 14,
    types: ['grass', 'poison'],
    nature: 'おだやか',
    ability: 'しんりょく',
    status: 'on_expedition',
    trainerId: 'mock-trainer-1',
    friendship: 70,
    moves: ['はっぱカッター', 'たいあたり', 'なきごえ', 'やどりぎのタネ'],
    experience: 512,
    nextLevelExp: 729
  },
  {
    id: 'mock-pokemon-3',
    dexNumber: 4,
    name: 'ヒトカゲ',
    nameEn: 'charmander',
    level: 6,
    hp: 19,
    maxHp: 19,
    attack: 15,
    defense: 12,
    speed: 18,
    types: ['fire'],
    nature: 'いじっぱり',
    ability: 'もうか',
    status: 'injured',
    trainerId: null,
    friendship: 60,
    moves: ['ひっかく', 'なきごえ', 'ひのこ'],
    experience: 216,
    nextLevelExp: 343
  },
  {
    id: 'mock-pokemon-4',
    dexNumber: 7,
    name: 'ゼニガメ',
    nameEn: 'squirtle',
    level: 10,
    hp: 24,
    maxHp: 24,
    attack: 16,
    defense: 20,
    speed: 15,
    types: ['water'],
    nature: 'ひかえめ',
    ability: 'げきりゅう',
    status: 'available',
    trainerId: null,
    friendship: 75,
    moves: ['たいあたり', 'しっぽをふる', 'みずでっぽう', 'からにこもる'],
    experience: 1000,
    nextLevelExp: 1331
  }
]

export default function PokemonPage() {
  const [selectedTab, setSelectedTab] = useState<'all' | 'available' | 'assigned' | 'injured'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPokemon, setSelectedPokemon] = useState<any | null>(null)
  const [party, setParty] = useState<SimplePokemon[]>([])
  const [enhancedPokemon, setEnhancedPokemon] = useState<any[]>([])
  
  const { gameData } = useGameState()
  const router = useRouter()
  
  // JSON システムから取得したポケモンデータを表示用に変換
  const pokemon = gameData?.pokemon && gameData.pokemon.length > 0 ? 
    gameData.pokemon.map(p => ({
      id: p.id,
      dexNumber: p.speciesId,
      name: p.name,
      nameEn: p.name.toLowerCase(),
      level: p.level,
      hp: p.hp,
      maxHp: p.maxHp,
      attack: p.attack,
      defense: p.defense,
      speed: p.speed,
      types: ['normal'], // デフォルト値
      nature: p.nature,
      ability: 'ひでん', // デフォルト値
      status: p.status as 'available' | 'on_expedition' | 'injured' | 'training',
      trainerId: null, // デフォルト値
      friendship: 50, // デフォルト値
      moves: p.moves || [],
      experience: p.experience,
      nextLevelExp: p.nextLevelExp
    })) : samplePokemon

  const filteredPokemon = pokemon.filter(poke => {
    const matchesSearch = poke.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         poke.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (!matchesSearch) return false
    
    if (selectedTab === 'available') return poke.status === 'available'
    if (selectedTab === 'assigned') return poke.status === 'on_expedition'
    if (selectedTab === 'injured') return poke.status === 'injured'
    return true
  })

  const stats = {
    total: pokemon.length,
    available: pokemon.filter(p => p.status === 'available').length,
    assigned: pokemon.filter(p => p.status === 'on_expedition').length,
    injured: pokemon.filter(p => p.status === 'injured').length,
    averageLevel: pokemon.length > 0 ? Math.round(pokemon.reduce((sum, p) => sum + p.level, 0) / pokemon.length) : 0
  }
  
  useEffect(() => {
    loadEnhancedPokemonData()
  }, [pokemon])

  const loadEnhancedPokemonData = async () => {
    try {
      const enhanced = await Promise.all(
        pokemon.slice(0, 5).map(async (p) => {
          try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${p.dexNumber}`)
            const apiData = await response.json()
            
            return {
              ...p,
              species: {
                id: apiData.id,
                name: apiData.name,
                types: apiData.types.map((type: any) => type.type.name),
                base_stats: {
                  hp: apiData.stats[0].base_stat,
                  attack: apiData.stats[1].base_stat,
                  defense: apiData.stats[2].base_stat,
                  special_attack: apiData.stats[3].base_stat,
                  special_defense: apiData.stats[4].base_stat,
                  speed: apiData.stats[5].base_stat
                },
                height: apiData.height,
                weight: apiData.weight,
                base_experience: apiData.base_experience
              },
              current_hp: p.hp,
              max_hp: p.maxHp,
              individual_values: {
                hp: Math.floor(Math.random() * 31),
                attack: Math.floor(Math.random() * 31),
                defense: Math.floor(Math.random() * 31),
                special_attack: Math.floor(Math.random() * 31),
                special_defense: Math.floor(Math.random() * 31),
                speed: Math.floor(Math.random() * 31)
              },
              caught_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
              location: ['トキワの森', '22番道路', 'おつきみ山', 'ニビジム'][Math.floor(Math.random() * 4)],
              is_in_party: party.some(partyPoke => partyPoke.id === p.id)
            }
          } catch (error) {
            console.error(`ポケモン ${p.dexNumber} のデータ取得に失敗:`, error)
            return {
              ...p,
              species: null,
              current_hp: p.hp,
              max_hp: p.maxHp,
              individual_values: {
                hp: Math.floor(Math.random() * 31),
                attack: Math.floor(Math.random() * 31),
                defense: Math.floor(Math.random() * 31),
                special_attack: Math.floor(Math.random() * 31),
                special_defense: Math.floor(Math.random() * 31),
                speed: Math.floor(Math.random() * 31)
              },
              caught_at: new Date().toISOString(),
              location: 'トキワの森',
              is_in_party: false
            }
          }
        })
      )
      setEnhancedPokemon(enhanced)
    } catch (error) {
      console.error('拡張ポケモンデータの読み込みに失敗:', error)
    }
  }

  const handleAddToParty = async (pokemon: any) => {
    if (party.length >= 6) {
      console.error('パーティは最大6体までです')
      return
    }
    
    try {
      // パーティに追加（簡易実装）
      setParty([...party, pokemon])
      console.log(`${pokemon.species?.name || pokemon.name} をパーティに追加しました`)
    } catch (error) {
      console.error('パーティ追加に失敗:', error)
    }
  }

  const handleRemoveFromParty = async (pokemon: any) => {
    try {
      // パーティから削除（簡易実装）
      setParty(party.filter(p => p.id !== pokemon.id))
      console.log(`${pokemon.species?.name || pokemon.name} をパーティから外しました`)
    } catch (error) {
      console.error('パーティ削除に失敗:', error)
    }
  }
  
  const handlePokemonCare = async (type: string, originalCost: number) => {
    try {
      // ポケモンケア処理（簡易実装）
      switch (type) {
        case '全体回復':
          console.log(`全体回復を実行しました（費用: ₽${originalCost.toLocaleString()}）`)
          break
        case '基本回復':
          console.log(`基本回復を実行しました（費用: ₽${originalCost.toLocaleString()}）`)
          break
        case 'なつき度向上':
          console.log(`なつき度向上を実行しました（費用: ₽${originalCost.toLocaleString()}）`)
          break
        case '特訓コース':
          console.log(`特訓コースを実行しました（費用: ₽${originalCost.toLocaleString()}）`)
          break
        default:
          console.error('不明なケアタイプです')
      }
    } catch (error) {
      console.error('ポケモンケアエラー:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="font-pixel-large text-retro-gb-dark">
          ポケモン管理
        </h1>
        <div className="flex space-x-2">
          <PixelButton 
            size="sm" 
            variant="secondary"
            onClick={() => router.push('/dashboard/pokemon/pokedex')}
          >
            ポケモン図鑑
          </PixelButton>
          <PixelButton
            onClick={() => router.push('/dashboard/pokemon/capture')}
          >
            野生ポケモン捕獲
          </PixelButton>
        </div>
      </div>

      {/* 統計サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <PixelCard title="総ポケモン数">
          <div className="text-center">
            <div className="font-pixel-large text-retro-gb-dark">{stats.total}</div>
            <div className="font-pixel text-xs text-retro-gb-mid">/ 100 (最大)</div>
          </div>
        </PixelCard>

        <PixelCard title="利用可能">
          <div className="text-center">
            <div className="font-pixel-large text-green-600">{stats.available}</div>
            <div className="font-pixel text-xs text-retro-gb-mid">派遣可能</div>
          </div>
        </PixelCard>

        <PixelCard title="派遣中">
          <div className="text-center">
            <div className="font-pixel-large text-orange-600">{stats.assigned}</div>
            <div className="font-pixel text-xs text-retro-gb-mid">活動中</div>
          </div>
        </PixelCard>

        <PixelCard title="負傷中">
          <div className="text-center">
            <div className="font-pixel-large text-red-600">{stats.injured}</div>
            <div className="font-pixel text-xs text-retro-gb-mid">回復中</div>
          </div>
        </PixelCard>

        <PixelCard title="平均レベル">
          <div className="text-center">
            <div className="font-pixel-large text-retro-gb-dark">Lv.{stats.averageLevel}</div>
            <div className="font-pixel text-xs text-retro-gb-mid">全体平均</div>
          </div>
        </PixelCard>
      </div>

      {/* 検索とフィルター */}
      <PixelCard>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <PixelInput
                placeholder="ポケモン名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex space-x-2">
              {[
                { key: 'all', label: '全て' },
                { key: 'available', label: '利用可能' },
                { key: 'assigned', label: '派遣中' },
                { key: 'injured', label: '負傷中' }
              ].map(tab => (
                <PixelButton
                  key={tab.key}
                  size="sm"
                  variant={selectedTab === tab.key ? 'primary' : 'secondary'}
                  onClick={() => setSelectedTab(tab.key as any)}
                >
                  {tab.label}
                </PixelButton>
              ))}
            </div>
          </div>
        </div>
      </PixelCard>

      {/* ポケモンリスト */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPokemon.map(pokemon => (
          <PokemonCard 
            key={pokemon.id}
            pokemon={pokemon}
            onClick={() => {
              // 拡張データがあればそれを使用、なければ基本データを使用
              const enhancedData = enhancedPokemon.find(ep => ep.id === pokemon.id)
              setSelectedPokemon(enhancedData || pokemon)
            }}
            showStatus={true}
            showTrainer={pokemon.trainerId !== null}
          />
        ))}
      </div>

      {filteredPokemon.length === 0 && (
        <PixelCard>
          <div className="text-center py-8">
            <div className="font-pixel text-retro-gb-mid">
              該当するポケモンが見つかりませんでした
            </div>
          </div>
        </PixelCard>
      )}

      {/* パーティ編成 */}
      <PixelCard title="パーティ編成">
        <div className="space-y-4">
          <div className="font-pixel text-xs text-retro-gb-mid">
            トレーナーのパーティを編成して派遣効率を上げましょう
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* トレーナー1のパーティ */}
            <div className="bg-retro-gb-light border border-retro-gb-mid p-4 space-y-3">
              <div className="font-pixel text-sm text-retro-gb-dark">タケシ (レンジャー)</div>
              <div className="space-y-2">
                {[
                  { name: 'フシギダネ', level: 8, assigned: true },
                  { name: '空きスロット', level: null, assigned: false },
                  { name: '空きスロット', level: null, assigned: false }
                ].map((slot, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-2 bg-retro-gb-lightest border border-retro-gb-mid"
                  >
                    <span className="font-pixel text-xs">
                      {slot.assigned ? `${slot.name} Lv.${slot.level}` : slot.name}
                    </span>
                    <PixelButton size="sm" variant="secondary">
                      {slot.assigned ? '外す' : '追加'}
                    </PixelButton>
                  </div>
                ))}
              </div>
            </div>

            {/* トレーナー2のパーティ */}
            <div className="bg-retro-gb-light border border-retro-gb-mid p-4 space-y-3">
              <div className="font-pixel text-sm text-retro-gb-dark">カスミ (バトラー)</div>
              <div className="space-y-2">
                {[
                  { name: '空きスロット', level: null, assigned: false },
                  { name: '空きスロット', level: null, assigned: false },
                  { name: '空きスロット', level: null, assigned: false }
                ].map((slot, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-2 bg-retro-gb-lightest border border-retro-gb-mid"
                  >
                    <span className="font-pixel text-xs">{slot.name}</span>
                    <PixelButton size="sm" variant="secondary">
                      追加
                    </PixelButton>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PixelCard>

      {/* ポケモンセンター */}
      <PixelCard title="ポケモンセンター">
        <div className="space-y-4">
          <div className="font-pixel text-xs text-retro-gb-mid">
            負傷したポケモンの回復や、ポケモンのケアを行います
          </div>
          
          {stats.injured > 0 && (
            <div className="bg-red-50 border border-red-200 p-4 space-y-3">
              <div className="font-pixel text-sm text-red-700">
                {stats.injured}匹のポケモンが負傷しています
              </div>
              <div className="flex space-x-2">
                <PixelButton 
                  size="sm"
                  onClick={() => handlePokemonCare('全体回復', stats.injured * 500)}
                >
                  すべて回復 (₽{stats.injured * 500})
                </PixelButton>
                <PixelButton size="sm" variant="secondary">
                  個別選択
                </PixelButton>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-retro-gb-light border border-retro-gb-mid p-3 space-y-2">
              <div className="font-pixel text-xs text-retro-gb-dark">基本回復</div>
              <div className="font-pixel text-xs text-retro-gb-mid">HP全回復 - ₽500</div>
              <PixelButton 
                size="sm" 
                className="w-full"
                onClick={() => handlePokemonCare('基本回復', 500)}
              >
                利用する
              </PixelButton>
            </div>
            
            <div className="bg-retro-gb-light border border-retro-gb-mid p-3 space-y-2">
              <div className="font-pixel text-xs text-retro-gb-dark">なつき度向上</div>
              <div className="font-pixel text-xs text-retro-gb-mid">なつき度+10 - ₽1,000</div>
              <PixelButton 
                size="sm" 
                className="w-full"
                onClick={() => handlePokemonCare('なつき度向上', 1000)}
              >
                利用する
              </PixelButton>
            </div>
            
            <div className="bg-retro-gb-light border border-retro-gb-mid p-3 space-y-2">
              <div className="font-pixel text-xs text-retro-gb-dark">特訓コース</div>
              <div className="font-pixel text-xs text-retro-gb-mid">経験値+100 - ₽2,000</div>
              <PixelButton 
                size="sm" 
                className="w-full"
                onClick={() => handlePokemonCare('特訓コース', 2000)}
              >
                利用する
              </PixelButton>
            </div>
          </div>
        </div>
      </PixelCard>

      {/* ポケモン詳細モーダル */}
      <PokemonDetailModal
        pokemon={selectedPokemon}
        isOpen={!!selectedPokemon}
        onClose={() => setSelectedPokemon(null)}
        onAddToParty={handleAddToParty}
        onRemoveFromParty={handleRemoveFromParty}
      />
    </div>
  )
}