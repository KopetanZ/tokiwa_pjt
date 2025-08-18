'use client'

import { PixelProgressBar } from '@/components/ui/PixelProgressBar'
import { clsx } from 'clsx'

interface PokemonCardProps {
  pokemon: {
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
  onClick?: () => void
  showStatus?: boolean
  showTrainer?: boolean
}

export function PokemonCard({
  pokemon,
  onClick,
  showStatus = false,
  showTrainer = false
}: PokemonCardProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: { label: '待機中', color: 'bg-green-500' },
      on_expedition: { label: '派遣中', color: 'bg-orange-500' },
      training: { label: '訓練中', color: 'bg-blue-500' },
      injured: { label: '負傷中', color: 'bg-red-500' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { label: '不明', color: 'bg-gray-500' }
    
    return (
      <span className={clsx(
        'inline-block px-2 py-1 text-white font-pixel text-xs',
        config.color
      )}>
        {config.label}
      </span>
    )
  }

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

  return (
    <div 
      className={clsx(
        'pokemon-card',
        onClick && 'pokemon-card--clickable',
        pokemon.status === 'injured' && 'pokemon-card--injured',
        pokemon.status === 'on_expedition' && 'pokemon-card--busy'
      )}
      onClick={onClick}
    >
      <div className="p-4 space-y-3">
        {/* ヘッダー */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-retro-gb-mid border border-retro-gb-dark flex items-center justify-center">
              <span className="font-pixel text-xs">#{pokemon.dexNumber.toString().padStart(3, '0')}</span>
            </div>
            <div>
              <h3 className="font-pixel text-sm text-retro-gb-dark">{pokemon.name}</h3>
              <p className="font-pixel text-xs text-retro-gb-mid">Lv.{pokemon.level}</p>
            </div>
          </div>
          
          {showStatus && (
            <div className="pokemon-card__status">
              {getStatusBadge(pokemon.status)}
            </div>
          )}
        </div>

        {/* タイプ */}
        <div className="flex space-x-1">
          {pokemon.types.map(type => (
            <span 
              key={type}
              className={clsx(
                'inline-block px-2 py-1 text-white font-pixel text-xs capitalize',
                getTypeColor(type)
              )}
            >
              {type}
            </span>
          ))}
        </div>

        {/* HP バー */}
        <div className="pokemon-card__hp">
          <div className="flex justify-between mb-1">
            <span className="font-pixel text-xs text-retro-gb-mid">HP</span>
            <span className="font-pixel text-xs text-retro-gb-mid">
              {pokemon.hp}/{pokemon.maxHp}
            </span>
          </div>
          <PixelProgressBar
            value={pokemon.hp}
            max={pokemon.maxHp}
            color="hp"
            showLabel={false}
          />
        </div>

        {/* 経験値バー */}
        <div className="pokemon-card__exp">
          <div className="flex justify-between mb-1">
            <span className="font-pixel text-xs text-retro-gb-mid">経験値</span>
            <span className="font-pixel text-xs text-retro-gb-mid">
              {pokemon.experience}/{pokemon.nextLevelExp}
            </span>
          </div>
          <PixelProgressBar
            value={pokemon.experience}
            max={pokemon.nextLevelExp}
            color="exp"
            showLabel={false}
          />
        </div>

        {/* ステータス */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="font-pixel text-xs text-retro-gb-mid">攻撃</div>
            <div className="font-pixel text-xs text-retro-gb-dark">{pokemon.attack}</div>
          </div>
          <div>
            <div className="font-pixel text-xs text-retro-gb-mid">防御</div>
            <div className="font-pixel text-xs text-retro-gb-dark">{pokemon.defense}</div>
          </div>
          <div>
            <div className="font-pixel text-xs text-retro-gb-mid">素早さ</div>
            <div className="font-pixel text-xs text-retro-gb-dark">{pokemon.speed}</div>
          </div>
        </div>

        {/* なつき度 */}
        <div className="pokemon-card__friendship">
          <div className="flex justify-between mb-1">
            <span className="font-pixel text-xs text-retro-gb-mid">なつき度</span>
            <span className="font-pixel text-xs text-retro-gb-mid">
              {pokemon.friendship}/100
            </span>
          </div>
          <PixelProgressBar
            value={pokemon.friendship}
            max={100}
            color="progress"
            showLabel={false}
          />
        </div>

        {/* 性格・特性 */}
        <div className="flex justify-between text-xs">
          <span className="font-pixel text-retro-gb-mid">性格: {pokemon.nature}</span>
          <span className="font-pixel text-retro-gb-mid">特性: {pokemon.ability}</span>
        </div>

        {/* わざ */}
        <div className="pokemon-card__moves">
          <div className="font-pixel text-xs text-retro-gb-mid mb-1">わざ</div>
          <div className="grid grid-cols-2 gap-1">
            {pokemon.moves.map((move, index) => (
              <div 
                key={index}
                className="bg-retro-gb-light border border-retro-gb-mid px-2 py-1 font-pixel text-xs text-retro-gb-dark"
              >
                {move}
              </div>
            ))}
          </div>
        </div>

        {/* トレーナー情報 */}
        {showTrainer && pokemon.trainerId && (
          <div className="pt-2 border-t border-retro-gb-mid">
            <span className="font-pixel text-xs text-retro-gb-mid">
              担当: トレーナー#{pokemon.trainerId}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}