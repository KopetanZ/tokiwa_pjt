'use client'

import { useState, useEffect } from 'react'
import { PokemonCard } from './PokemonCard'
import { clsx } from 'clsx'
import { PokemonInstance } from '../../lib/schemas/pokemon'
import { pokemonGrowthSystem } from '../../lib/pokemon/PokemonGrowthSystem'
import { pokemonEvolutionSystem } from '../../lib/pokemon/PokemonEvolutionSystem'
import { pokemonTrainingFacility } from '../../lib/pokemon/PokemonTrainingFacility'

interface PokemonManagementDashboardProps {
  pokemon: PokemonInstance[]
  onPokemonSelect?: (pokemon: PokemonInstance) => void
  onPokemonTrain?: (pokemon: PokemonInstance) => void
  onPokemonEvolve?: (pokemon: PokemonInstance) => void
  className?: string
}

type ViewMode = 'grid' | 'list' | 'detailed'
type SortBy = 'level' | 'name' | 'rarity' | 'type' | 'canEvolve'
type FilterBy = 'all' | 'canEvolve' | 'needsTraining' | 'shiny' | 'legendary'

export function PokemonManagementDashboard({
  pokemon,
  onPokemonSelect,
  onPokemonTrain,
  onPokemonEvolve,
  className = ''
}: PokemonManagementDashboardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortBy>('level')
  const [filterBy, setFilterBy] = useState<FilterBy>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonInstance[]>([])
  
  // Filter and sort Pokemon
  const filteredAndSortedPokemon = pokemon
    .filter(p => {
      // Search filter
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      
      // Category filter
      switch (filterBy) {
        case 'canEvolve':
          return pokemonEvolutionSystem.canEvolveNow(p, { gameState: {} as any, user: null })
        case 'needsTraining':
          return p.level < 50 // Pokemon below level 50 might need training
        case 'shiny':
          return p.isShiny
        case 'legendary':
          return p.rarity === 'legendary'
        default:
          return true
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'level':
          return b.level - a.level
        case 'name':
          return a.name.localeCompare(b.name)
        case 'rarity':
          const rarityOrder: Record<string, number> = { common: 0, uncommon: 1, rare: 2, very_rare: 3, legendary: 4 }
          return (rarityOrder[b.rarity || 'common'] || 0) - (rarityOrder[a.rarity || 'common'] || 0)
        case 'type':
          return (a.types?.[0] || 'normal').localeCompare(b.types?.[0] || 'normal')
        case 'canEvolve':
          const aCanEvolve = pokemonEvolutionSystem.canEvolveNow(a, { gameState: {} as any, user: null })
          const bCanEvolve = pokemonEvolutionSystem.canEvolveNow(b, { gameState: {} as any, user: null })
          return (bCanEvolve ? 1 : 0) - (aCanEvolve ? 1 : 0)
        default:
          return 0
      }
    })

  // Statistics
  const stats = {
    total: pokemon.length,
    canEvolve: pokemon.filter(p => pokemonEvolutionSystem.canEvolveNow(p, { gameState: {} as any, user: null })).length,
    shiny: pokemon.filter(p => p.isShiny).length,
    legendary: pokemon.filter(p => p.rarity === 'legendary').length,
    averageLevel: pokemon.length > 0 ? Math.floor(pokemon.reduce((sum, p) => sum + p.level, 0) / pokemon.length) : 0
  }

  const handlePokemonSelect = (pokemon: PokemonInstance) => {
    if (selectedPokemon.includes(pokemon)) {
      setSelectedPokemon(prev => prev.filter(p => p.id !== pokemon.id))
    } else {
      setSelectedPokemon(prev => [...prev, pokemon])
    }
    onPokemonSelect?.(pokemon)
  }

  const handleBulkAction = (action: 'train' | 'evolve') => {
    selectedPokemon.forEach(pokemon => {
      if (action === 'train') {
        onPokemonTrain?.(pokemon)
      } else if (action === 'evolve') {
        const canEvolve = pokemonEvolutionSystem.canEvolveNow(pokemon, { gameState: {} as any, user: null })
        if (canEvolve) {
          onPokemonEvolve?.(pokemon)
        }
      }
    })
    setSelectedPokemon([])
  }

  return (
    <div className={clsx('pokemon-management-dashboard', className)}>
      {/* Header with stats */}
      <div className="dashboard-header bg-retro-gb-light border border-retro-gb-dark p-4 mb-4">
        <h2 className="font-pixel text-lg text-retro-gb-dark mb-3">ポケモン管理</h2>
        
        {/* Statistics */}
        <div className="grid grid-cols-5 gap-4 mb-4">
          <div className="text-center">
            <div className="font-pixel text-2xl text-retro-gb-dark">{stats.total}</div>
            <div className="font-pixel text-xs text-retro-gb-mid">総数</div>
          </div>
          <div className="text-center">
            <div className="font-pixel text-2xl text-purple-600">{stats.canEvolve}</div>
            <div className="font-pixel text-xs text-retro-gb-mid">進化可能</div>
          </div>
          <div className="text-center">
            <div className="font-pixel text-2xl text-yellow-600">{stats.shiny}</div>
            <div className="font-pixel text-xs text-retro-gb-mid">色違い</div>
          </div>
          <div className="text-center">
            <div className="font-pixel text-2xl text-yellow-500">{stats.legendary}</div>
            <div className="font-pixel text-xs text-retro-gb-mid">レジェンダリー</div>
          </div>
          <div className="text-center">
            <div className="font-pixel text-2xl text-blue-600">{stats.averageLevel}</div>
            <div className="font-pixel text-xs text-retro-gb-mid">平均レベル</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-48">
            <input
              type="text"
              placeholder="ポケモンを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-retro-gb-mid bg-white font-pixel text-sm"
            />
          </div>

          {/* Filter */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterBy)}
            className="px-3 py-2 border border-retro-gb-mid bg-white font-pixel text-sm"
          >
            <option value="all">すべて</option>
            <option value="canEvolve">進化可能</option>
            <option value="needsTraining">要訓練</option>
            <option value="shiny">色違い</option>
            <option value="legendary">レジェンダリー</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-3 py-2 border border-retro-gb-mid bg-white font-pixel text-sm"
          >
            <option value="level">レベル順</option>
            <option value="name">名前順</option>
            <option value="rarity">レア度順</option>
            <option value="type">タイプ順</option>
            <option value="canEvolve">進化可能順</option>
          </select>

          {/* View Mode */}
          <div className="flex border border-retro-gb-mid">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'px-3 py-2 font-pixel text-sm border-r border-retro-gb-mid',
                viewMode === 'grid' ? 'bg-retro-gb-dark text-white' : 'bg-white text-retro-gb-dark'
              )}
            >
              グリッド
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'px-3 py-2 font-pixel text-sm border-r border-retro-gb-mid',
                viewMode === 'list' ? 'bg-retro-gb-dark text-white' : 'bg-white text-retro-gb-dark'
              )}
            >
              リスト
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={clsx(
                'px-3 py-2 font-pixel text-sm',
                viewMode === 'detailed' ? 'bg-retro-gb-dark text-white' : 'bg-white text-retro-gb-dark'
              )}
            >
              詳細
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedPokemon.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="font-pixel text-sm text-blue-800">
                {selectedPokemon.length}匹選択中
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkAction('train')}
                  className="px-3 py-1 bg-green-500 text-white font-pixel text-xs hover:bg-green-600"
                >
                  一括訓練
                </button>
                <button
                  onClick={() => handleBulkAction('evolve')}
                  className="px-3 py-1 bg-purple-500 text-white font-pixel text-xs hover:bg-purple-600"
                >
                  一括進化
                </button>
                <button
                  onClick={() => setSelectedPokemon([])}
                  className="px-3 py-1 bg-gray-500 text-white font-pixel text-xs hover:bg-gray-600"
                >
                  クリア
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pokemon Grid/List */}
      <div className="pokemon-grid">
        {filteredAndSortedPokemon.length === 0 ? (
          <div className="text-center py-12">
            <div className="font-pixel text-lg text-retro-gb-mid">ポケモンが見つかりません</div>
            <div className="font-pixel text-sm text-retro-gb-mid mt-2">
              検索条件を変更してください
            </div>
          </div>
        ) : (
          <div className={clsx(
            viewMode === 'grid' && 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
            viewMode === 'list' && 'space-y-2',
            viewMode === 'detailed' && 'space-y-6'
          )}>
            {filteredAndSortedPokemon.map(p => (
              <div
                key={p.id}
                className={clsx(
                  selectedPokemon.includes(p) && 'ring-2 ring-blue-500 ring-offset-2'
                )}
              >
                <PokemonCard
                  pokemon={{
                    ...p,
                    dexNumber: p.speciesId,
                    nameEn: p.name.toLowerCase(),
                    trainerId: null,
                    types: p.types || ['normal'],
                    friendship: 50,
                    ability: 'unknown'
                  } as any}
                  variant={viewMode === 'detailed' ? 'detailed' : viewMode === 'list' ? 'compact' : 'gameboy'}
                  onClick={() => handlePokemonSelect(p)}
                  onTrain={onPokemonTrain}
                  onEvolve={onPokemonEvolve}
                  showStatus={true}
                  showEvolution={true}
                  showIVs={viewMode === 'detailed'}
                  className="transition-all duration-200 hover:shadow-lg"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}