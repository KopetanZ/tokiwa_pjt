'use client'

import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { PixelProgressBar } from '@/components/ui/PixelProgressBar'
import { PixelInput } from '@/components/ui/PixelInput'
import { PokemonCard } from '@/components/pokemon/PokemonCard'
import { useGameData, useAuth, useNotifications } from '@/contexts/GameContext'
import { useState } from 'react'

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

// サンプルポケモンデータ
const samplePokemon: SimplePokemon[] = [
  {
    id: '1',
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
    id: '2', 
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
    trainerId: '1',
    friendship: 70,
    moves: ['はっぱカッター', 'たいあたり', 'なきごえ', 'やどりぎのタネ'],
    experience: 512,
    nextLevelExp: 729
  },
  {
    id: '3',
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
    id: '4',
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
  
  const { isMockMode } = useAuth()
  const gameData = useGameData()
  const { addNotification } = useNotifications()
  
  // 実際のゲームデータまたはサンプルデータを使用
  // モックデータを表示用の構造に変換
  const pokemon = isMockMode ? 
    gameData.pokemon.map(p => ({
      id: p.id,
      dexNumber: p.dex_number,
      name: p.name,
      nameEn: p.name.toLowerCase(),
      level: p.level,
      hp: p.hp,
      maxHp: p.hp,
      attack: p.attack,
      defense: p.defense,
      speed: p.speed,
      types: p.types,
      nature: p.nature || 'きまぐれ',
      ability: 'ひでん', // デフォルト特性
      status: p.status as 'available' | 'on_expedition' | 'injured' | 'training',
      trainerId: null,
      friendship: p.friendship,
      moves: p.moves,
      experience: p.level * 100,
      nextLevelExp: (p.level + 1) * 100
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
  
  const handlePokemonCare = (type: string, cost: number) => {
    addNotification({
      type: 'success',
      message: `ポケモンの${type}を行いました！（費用: ₽${cost.toLocaleString()}）`
    })
    
    // TODO: 実際のケア処理を実装
    console.log('ポケモンケア:', { type, cost })
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
            onClick={() => window.location.href = '/dashboard/pokemon/pokedex'}
          >
            ポケモン図鑑
          </PixelButton>
          <PixelButton
            onClick={() => window.location.href = '/dashboard/pokemon/capture'}
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
            onClick={() => {/* 詳細画面へ */}}
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
    </div>
  )
}