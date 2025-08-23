'use client'

import { useState } from 'react'
import { PixelProgressBar } from '@/components/ui/PixelProgressBar'
import { clsx } from 'clsx'
import { PokemonInstance } from '../../lib/schemas/pokemon'
import { pokemonEvolutionSystem } from '../../lib/pokemon/PokemonEvolutionSystem'
import { pokemonGrowthSystem } from '../../lib/pokemon/PokemonGrowthSystem'

interface PokemonCardProps {
  pokemon: PokemonInstance & {
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
    status: 'available' | 'on_expedition' | 'injured' | 'training' | 'healthy' | 'sick'
    trainerId: string | null
    friendship: number
    moves: string[]
    experience: number
    nextLevelExp: number
    rarity?: 'common' | 'uncommon' | 'rare' | 'legendary' | 'mythical'
  }
  variant?: 'compact' | 'detailed' | 'gameboy'
  onClick?: () => void
  onTrain?: (pokemon: PokemonInstance) => void
  onEvolve?: (pokemon: PokemonInstance) => void
  showStatus?: boolean
  showTrainer?: boolean
  showEvolution?: boolean
  showIVs?: boolean
  className?: string
}

export function PokemonCard({
  pokemon,
  variant = 'gameboy',
  onClick,
  onTrain,
  onEvolve,
  showStatus = false,
  showTrainer = false,
  showEvolution = false,
  showIVs = false,
  className = ''
}: PokemonCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  
  // Check evolution status
  const canEvolve = showEvolution && pokemon.speciesId && 
    pokemonEvolutionSystem.canEvolveNow(pokemon as PokemonInstance, { gameState: {} as any, user: null })
  
  // Get next level experience requirement
  const expToNextLevel = showDetails && pokemon.level < 100 ? 
    pokemonGrowthSystem.getExperienceToNextLevel(pokemon as PokemonInstance) : 0
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

  const getIVQuality = (iv: number): { text: string; color: string } => {
    if (iv === 31) return { text: 'Perfect', color: 'text-yellow-600' }
    if (iv >= 25) return { text: 'Excellent', color: 'text-green-600' }
    if (iv >= 20) return { text: 'Good', color: 'text-blue-600' }
    if (iv >= 15) return { text: 'Decent', color: 'text-gray-600' }
    return { text: 'Poor', color: 'text-red-600' }
  }

  const getRarityColor = (rarity: string): string => {
    const colors = {
      'common': 'border-retro-gb-mid',
      'uncommon': 'border-green-500',
      'rare': 'border-blue-500',
      'very_rare': 'border-purple-500',
      'legendary': 'border-yellow-500'
    }
    return colors[rarity as keyof typeof colors] || colors.common
  }

  // Compact variant for list views
  if (variant === 'compact') {
    return (
      <div 
        className={clsx(
          'pokemon-card pokemon-card--compact',
          onClick && 'pokemon-card--clickable',
          pokemon.status === 'injured' && 'pokemon-card--injured',
          pokemon.status === 'on_expedition' && 'pokemon-card--busy',
          pokemon.rarity && getRarityColor(pokemon.rarity),
          className
        )}
        onClick={onClick}
      >
        <div className="p-2 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-retro-gb-mid border border-retro-gb-dark flex items-center justify-center">
              {pokemon.isShiny && <span className="text-yellow-500 text-xs">✨</span>}
              <span className="font-pixel text-xs">#{pokemon.dexNumber}</span>
            </div>
            <div>
              <h3 className="font-pixel text-sm text-retro-gb-dark">{pokemon.name}</h3>
              <p className="font-pixel text-xs text-retro-gb-mid">Lv.{pokemon.level}</p>
            </div>
          </div>
          <div className="flex space-x-1">
            {pokemon.types.slice(0, 2).map(type => (
              <span 
                key={type}
                className={clsx(
                  'px-1 py-0.5 text-white font-pixel text-xs capitalize',
                  getTypeColor(type)
                )}
              >
                {type.slice(0, 3)}
              </span>
            ))}
            {canEvolve && (
              <span className="text-xs bg-purple-500 text-white px-1 py-0.5 font-pixel">
                進化
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Detailed variant with enhanced features
  if (variant === 'detailed') {
    return (
      <div 
        className={clsx(
          'pokemon-card pokemon-card--detailed',
          onClick && 'pokemon-card--clickable',
          pokemon.status === 'injured' && 'pokemon-card--injured',
          pokemon.status === 'on_expedition' && 'pokemon-card--busy',
          pokemon.rarity && getRarityColor(pokemon.rarity)
        )}
        onClick={onClick}
      >
        <div className="p-4 space-y-3">
          {/* Enhanced Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-retro-gb-mid border border-retro-gb-dark flex items-center justify-center relative">
                {pokemon.isShiny && (
                  <div className="absolute -top-1 -right-1 text-yellow-500 text-xs">✨</div>
                )}
                <span className="font-pixel text-xs">#{pokemon.dexNumber.toString().padStart(3, '0')}</span>
              </div>
              <div>
                <h3 className="font-pixel text-sm text-retro-gb-dark flex items-center">
                  {pokemon.name}
                  {pokemon.rarity === 'legendary' && <span className="ml-1 text-yellow-500">★</span>}
                </h3>
                <p className="font-pixel text-xs text-retro-gb-mid">Lv.{pokemon.level}</p>
              </div>
            </div>
            
            {showStatus && (
              <div className="pokemon-card__status flex flex-col space-y-1">
                {getStatusBadge(pokemon.status)}
                {canEvolve && (
                  <span className="inline-block px-2 py-1 bg-purple-500 text-white font-pixel text-xs">
                    進化可能
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Rest of detailed view content... */}
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

          {/* HP and Experience bars */}
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

          {/* Enhanced Stats */}
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

          {/* IVs Display */}
          {showIVs && pokemon.ivs && (
            <div className="pokemon-card__ivs">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDetails(!showDetails)
                }}
                className="font-pixel text-xs text-blue-600 hover:text-blue-800 mb-2"
              >
                {showDetails ? '個体値を隠す' : '個体値を表示'}
              </button>
              
              {showDetails && (
                <div className="bg-retro-gb-light border border-retro-gb-mid p-2">
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    {Object.entries(pokemon.ivs).map(([stat, iv]) => {
                      const quality = getIVQuality(iv as number)
                      return (
                        <div key={stat} className="flex justify-between">
                          <span className="font-pixel text-retro-gb-mid capitalize">
                            {stat.slice(0, 3)}:
                          </span>
                          <span className={clsx('font-pixel', quality.color)}>
                            {iv}/31
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {(onTrain || onEvolve) && (
            <div className="flex space-x-2 pt-2 border-t border-retro-gb-mid">
              {onTrain && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onTrain(pokemon as PokemonInstance)
                  }}
                  className="flex-1 px-2 py-1 bg-green-500 text-white font-pixel text-xs hover:bg-green-600"
                >
                  訓練
                </button>
              )}
              {onEvolve && canEvolve && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEvolve(pokemon as PokemonInstance)
                  }}
                  className="flex-1 px-2 py-1 bg-purple-500 text-white font-pixel text-xs hover:bg-purple-600"
                >
                  進化
                </button>
              )}
            </div>
          )}

          {/* Trainer info */}
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

  // Original GameBoy style variant (default)
  return (
    <div 
      className={clsx(
        'pokemon-card',
        onClick && 'pokemon-card--clickable',
        pokemon.status === 'injured' && 'pokemon-card--injured',
        pokemon.status === 'on_expedition' && 'pokemon-card--busy',
        pokemon.rarity && getRarityColor(pokemon.rarity)
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