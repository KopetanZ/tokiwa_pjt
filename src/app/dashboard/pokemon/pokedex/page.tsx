'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { PixelInput } from '@/components/ui/PixelInput'
import { PixelProgressBar } from '@/components/ui/PixelProgressBar'
import { fetchPokedexEntry } from '@/lib/pokeapi'
import { useQuery } from '@tanstack/react-query'

interface PokedexEntry {
  id: number
  name: string
  nameEn: string
  types: string[]
  description: string
  sprite: string | null
  shinySprite: string | null
  height: number
  weight: number
  baseStats: {
    hp: number
    attack: number
    defense: number
    specialAttack: number
    specialDefense: number
    speed: number
  }
  abilities: string[]
  captureRate: number
  baseExperience: number
  growthRate: string
}

function PokedexEntryCard({ entry }: { entry: PokedexEntry }) {
  const [showShiny, setShowShiny] = useState(false)
  
  const getTypeColor = (type: string) => {
    const typeColors = {
      normal: 'bg-gray-400',
      fire: 'bg-red-500',
      water: 'bg-blue-500',
      electric: 'bg-yellow-400',
      grass: 'bg-green-500',
      ice: 'bg-blue-200',
      fighting: 'bg-red-700',
      poison: 'bg-purple-500',
      ground: 'bg-yellow-600',
      flying: 'bg-blue-300',
      psychic: 'bg-pink-500',
      bug: 'bg-green-400',
      rock: 'bg-yellow-800',
      ghost: 'bg-purple-700',
      dragon: 'bg-purple-600',
      dark: 'bg-gray-800',
      steel: 'bg-gray-500',
      fairy: 'bg-pink-300'
    }
    
    return typeColors[type as keyof typeof typeColors] || 'bg-gray-400'
  }
  
  const statTotal = Object.values(entry.baseStats).reduce((sum, stat) => sum + stat, 0)
  
  return (
    <PixelCard>
      <div className="p-4 space-y-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-pixel text-lg text-retro-gb-dark">
              #{entry.id.toString().padStart(3, '0')} {entry.name}
            </h2>
            <p className="font-pixel text-xs text-retro-gb-mid">{entry.nameEn}</p>
          </div>
          <div className="flex space-x-1">
            {entry.types.map(type => (
              <span 
                key={type}
                className={`inline-block px-2 py-1 text-white font-pixel text-xs capitalize ${getTypeColor(type)}`}
              >
                {type}
              </span>
            ))}
          </div>
        </div>
        
        {/* スプライト */}
        <div className="flex justify-center space-x-4">
          <div className="text-center">
            <div className="w-24 h-24 bg-retro-gb-light border border-retro-gb-mid flex items-center justify-center">
              {entry.sprite ? (
                <Image 
                  src={showShiny ? entry.shinySprite || entry.sprite : entry.sprite}
                  alt={entry.name}
                  width={64}
                  height={64}
                  className="pixel-art"
                  unoptimized
                />
              ) : (
                <span className="font-pixel text-xs text-retro-gb-mid">No Image</span>
              )}
            </div>
            <div className="mt-2">
              <PixelButton 
                size="sm" 
                variant="secondary"
                onClick={() => setShowShiny(!showShiny)}
                disabled={!entry.shinySprite}
              >
                {showShiny ? '通常' : '色違い'}
              </PixelButton>
            </div>
          </div>
        </div>
        
        {/* 基本情報 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-pixel text-xs text-retro-gb-mid">身長</span>
            <div className="font-pixel text-sm text-retro-gb-dark">{entry.height}m</div>
          </div>
          <div>
            <span className="font-pixel text-xs text-retro-gb-mid">体重</span>
            <div className="font-pixel text-sm text-retro-gb-dark">{entry.weight}kg</div>
          </div>
        </div>
        
        {/* 説明文 */}
        <div>
          <span className="font-pixel text-xs text-retro-gb-mid">図鑑説明</span>
          <p className="font-pixel text-xs text-retro-gb-dark mt-1 leading-relaxed">
            {entry.description}
          </p>
        </div>
        
        {/* 基礎ステータス */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-pixel text-xs text-retro-gb-mid">基礎ステータス</span>
            <span className="font-pixel text-xs text-retro-gb-mid">合計: {statTotal}</span>
          </div>
          <div className="space-y-2">
            {Object.entries(entry.baseStats).map(([statName, value]) => {
              const statLabels = {
                hp: 'HP',
                attack: '攻撃',
                defense: '防御',
                specialAttack: '特攻',
                specialDefense: '特防',
                speed: '素早さ'
              }
              
              return (
                <div key={statName}>
                  <div className="flex justify-between mb-1">
                    <span className="font-pixel text-xs text-retro-gb-mid">
                      {statLabels[statName as keyof typeof statLabels]}
                    </span>
                    <span className="font-pixel text-xs text-retro-gb-dark">{value}</span>
                  </div>
                  <PixelProgressBar
                    value={value}
                    max={255}
                    color={statName === 'hp' ? 'hp' : 'progress'}
                    showLabel={false}
                  />
                </div>
              )
            })}
          </div>
        </div>
        
        {/* 特性 */}
        <div>
          <span className="font-pixel text-xs text-retro-gb-mid">特性</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {entry.abilities.map((ability, index) => (
              <span 
                key={index}
                className="inline-block bg-retro-gb-mid text-retro-gb-lightest px-2 py-1 font-pixel text-xs"
              >
                {ability}
              </span>
            ))}
          </div>
        </div>
        
        {/* その他データ */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-retro-gb-mid">
          <div>
            <span className="font-pixel text-xs text-retro-gb-mid">捕獲率</span>
            <div className="font-pixel text-sm text-retro-gb-dark">{entry.captureRate}</div>
          </div>
          <div>
            <span className="font-pixel text-xs text-retro-gb-mid">基礎経験値</span>
            <div className="font-pixel text-sm text-retro-gb-dark">{entry.baseExperience}</div>
          </div>
        </div>
      </div>
    </PixelCard>
  )
}

export default function PokedexPage() {
  const [selectedId, setSelectedId] = useState<number>(25) // ピカチュウ（人気ポケモン）をデフォルト
  const [searchId, setSearchId] = useState<string>('25')
  
  const { data: entry, isLoading, error } = useQuery({
    queryKey: ['pokedex', selectedId],
    queryFn: () => fetchPokedexEntry(selectedId),
    enabled: selectedId > 0 && selectedId <= 1010
  })
  
  const handleSearch = () => {
    const id = parseInt(searchId)
    if (id >= 1 && id <= 1010) {
      setSelectedId(id)
    }
  }
  
  const navigatePokemon = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedId > 1) {
      setSelectedId(selectedId - 1)
      setSearchId((selectedId - 1).toString())
    } else if (direction === 'next' && selectedId < 1010) {
      setSelectedId(selectedId + 1)
      setSearchId((selectedId + 1).toString())
    }
  }
  
  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="font-pixel-large text-retro-gb-dark">
          ポケモン図鑑
        </h1>
        <div className="flex items-center space-x-2">
          <PixelButton 
            size="sm" 
            variant="secondary"
            onClick={() => navigatePokemon('prev')}
            disabled={selectedId <= 1}
          >
            ←
          </PixelButton>
          <PixelButton 
            size="sm" 
            variant="secondary"
            onClick={() => navigatePokemon('next')}
            disabled={selectedId >= 1010}
          >
            →
          </PixelButton>
        </div>
      </div>
      
      {/* 検索 */}
      <PixelCard>
        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <PixelInput
              placeholder="図鑑番号 (1-1010)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <PixelButton onClick={handleSearch}>
            検索
          </PixelButton>
        </div>
      </PixelCard>
      
      {/* クイックナビゲーション */}
      <PixelCard>
        <div className="space-y-2">
          <div className="font-pixel text-xs text-retro-gb-mid">クイックナビ</div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'カントー (1-151)', range: [1, 151] },
              { label: 'ジョウト (152-251)', range: [152, 251] },
              { label: 'ホウエン (252-386)', range: [252, 386] },
              { label: 'シンオウ (387-493)', range: [387, 493] }
            ].map(region => (
              <PixelButton
                key={region.label}
                size="sm"
                variant="secondary"
                onClick={() => {
                  const randomId = Math.floor(Math.random() * (region.range[1] - region.range[0] + 1)) + region.range[0]
                  setSelectedId(randomId)
                  setSearchId(randomId.toString())
                }}
              >
                {region.label}
              </PixelButton>
            ))}
          </div>
        </div>
      </PixelCard>
      
      {/* ポケモンエントリー */}
      {isLoading && (
        <PixelCard>
          <div className="text-center py-8">
            <div className="font-pixel text-retro-gb-mid">読み込み中...</div>
          </div>
        </PixelCard>
      )}
      
      {error && (
        <PixelCard>
          <div className="text-center py-8">
            <div className="font-pixel text-red-600">エラーが発生しました</div>
            <div className="font-pixel text-xs text-retro-gb-mid mt-2">
              ポケモンデータの取得に失敗しました
            </div>
          </div>
        </PixelCard>
      )}
      
      {entry && !isLoading && (
        <PokedexEntryCard entry={entry} />
      )}
      
      {!entry && !isLoading && !error && (
        <PixelCard>
          <div className="text-center py-8">
            <div className="font-pixel text-retro-gb-mid">
              ポケモンが見つかりませんでした
            </div>
          </div>
        </PixelCard>
      )}
    </div>
  )
}