'use client'

import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { PokemonInstance } from '../../lib/schemas/pokemon'
import { pokemonEvolutionSystem, EvolutionPreview, EvolutionResult } from '../../lib/pokemon/PokemonEvolutionSystem'

interface PokemonEvolutionModalProps {
  pokemon: PokemonInstance
  isOpen: boolean
  onClose: () => void
  onEvolve: (pokemon: PokemonInstance, targetSpeciesId: string) => void
  gameContext: any
}

export function PokemonEvolutionModal({
  pokemon,
  isOpen,
  onClose,
  onEvolve,
  gameContext
}: PokemonEvolutionModalProps) {
  const [evolutionPreview, setEvolutionPreview] = useState<EvolutionPreview | null>(null)
  const [selectedEvolution, setSelectedEvolution] = useState<string | null>(null)
  const [isEvolving, setIsEvolving] = useState(false)
  const [evolutionResult, setEvolutionResult] = useState<EvolutionResult | null>(null)

  useEffect(() => {
    if (isOpen && pokemon) {
      const preview = pokemonEvolutionSystem.getEvolutionPreview(pokemon, gameContext)
      setEvolutionPreview(preview)
      setSelectedEvolution(null)
      setEvolutionResult(null)
    }
  }, [isOpen, pokemon, gameContext])

  const handleEvolve = async () => {
    if (!selectedEvolution || !pokemon) return

    setIsEvolving(true)
    try {
      // Simulate evolution process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const result = pokemonEvolutionSystem.evolve(pokemon, selectedEvolution, gameContext)
      setEvolutionResult(result)
      
      if (result.success) {
        onEvolve(pokemon, selectedEvolution)
      }
    } catch (error) {
      console.error('Evolution failed:', error)
    } finally {
      setIsEvolving(false)
    }
  }

  const getRequirementText = (requirement: any): string => {
    switch (requirement.type) {
      case 'level':
        return `レベル ${requirement.value} 以上`
      case 'stone':
        return `${requirement.itemId} を使用`
      case 'happiness':
        return `なつき度 ${requirement.value} 以上`
      case 'time':
        return requirement.timeOfDay === 'day' ? '昼間にレベルアップ' : '夜間にレベルアップ'
      case 'trade':
        return '通信交換'
      case 'location':
        return `特定の場所でレベルアップ`
      case 'stat':
        return `特定の能力値条件`
      default:
        return '特殊な条件'
    }
  }

  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      'Normal': 'bg-gray-400',
      'Fire': 'bg-red-500',
      'Water': 'bg-blue-500',
      'Electric': 'bg-yellow-400',
      'Grass': 'bg-green-500',
      'Ice': 'bg-cyan-300',
      'Fighting': 'bg-red-700',
      'Poison': 'bg-purple-500',
      'Ground': 'bg-yellow-600',
      'Flying': 'bg-indigo-400',
      'Psychic': 'bg-pink-500',
      'Bug': 'bg-lime-500',
      'Rock': 'bg-yellow-800',
      'Ghost': 'bg-purple-700',
      'Dragon': 'bg-indigo-700',
      'Dark': 'bg-gray-800',
      'Steel': 'bg-gray-500',
      'Fairy': 'bg-pink-300'
    }
    return colors[type] || colors.Normal
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border-4 border-retro-gb-dark max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-retro-gb-dark text-white p-4 flex items-center justify-between">
          <h2 className="font-pixel text-lg">ポケモン進化</h2>
          <button
            onClick={onClose}
            className="font-pixel text-lg hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Pokemon */}
          <div className="text-center">
            <div className="inline-block bg-retro-gb-light border-2 border-retro-gb-mid p-4 rounded">
              <div className="w-24 h-24 bg-gray-200 mx-auto mb-3 flex items-center justify-center">
                {pokemon.isShiny && <span className="text-yellow-500">✨</span>}
                <span className="font-pixel text-lg">{pokemon.name.slice(0, 3).toUpperCase()}</span>
              </div>
              <h3 className="font-pixel text-lg text-retro-gb-dark">{pokemon.name}</h3>
              <p className="font-pixel text-sm text-retro-gb-mid">レベル {pokemon.level}</p>
              <div className="flex justify-center space-x-1 mt-2">
                {pokemon.types?.map(type => (
                  <span
                    key={type}
                    className={clsx(
                      'px-2 py-1 text-white font-pixel text-xs',
                      getTypeColor(type)
                    )}
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Evolution Options */}
          {evolutionPreview && evolutionPreview.canEvolve ? (
            <div className="space-y-4">
              <h3 className="font-pixel text-lg text-center text-retro-gb-dark">
                進化先を選択してください
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {evolutionPreview.availablePaths.map((pathInfo, index) => (
                  <div
                    key={index}
                    className={clsx(
                      'border-2 p-4 cursor-pointer transition-all',
                      selectedEvolution === pathInfo.path.toSpeciesId
                        ? 'border-blue-500 bg-blue-50'
                        : pathInfo.requirementsMet
                        ? 'border-green-500 hover:bg-green-50'
                        : 'border-gray-300 bg-gray-50 cursor-not-allowed'
                    )}
                    onClick={() => {
                      if (pathInfo.requirementsMet) {
                        setSelectedEvolution(pathInfo.path.toSpeciesId)
                      }
                    }}
                  >
                    <div className="text-center mb-3">
                      <div className="w-16 h-16 bg-gray-200 mx-auto mb-2 flex items-center justify-center">
                        <span className="font-pixel text-sm">
                          {pathInfo.path.toSpeciesId.slice(0, 3).toUpperCase()}
                        </span>
                      </div>
                      <h4 className="font-pixel text-md text-retro-gb-dark capitalize">
                        {pathInfo.path.toSpeciesId}
                      </h4>
                    </div>

                    <div className="space-y-2">
                      <div className="font-pixel text-sm text-retro-gb-mid">
                        {pathInfo.path.description}
                      </div>
                      
                      {/* Requirements */}
                      <div className="space-y-1">
                        <div className="font-pixel text-xs text-retro-gb-mid">必要条件:</div>
                        {pathInfo.path.requirements.map((req, reqIndex) => (
                          <div
                            key={reqIndex}
                            className={clsx(
                              'font-pixel text-xs flex items-center',
                              pathInfo.requirementsMet || !pathInfo.missingRequirements.includes(req)
                                ? 'text-green-600'
                                : 'text-red-600'
                            )}
                          >
                            <span className="mr-2">
                              {pathInfo.requirementsMet || !pathInfo.missingRequirements.includes(req) ? '✓' : '✗'}
                            </span>
                            {getRequirementText(req)}
                          </div>
                        ))}
                      </div>

                      {!pathInfo.requirementsMet && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200">
                          <div className="font-pixel text-xs text-red-800">
                            条件を満たしていません
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="font-pixel text-lg text-retro-gb-mid">
                このポケモンは現在進化できません
              </div>
              <div className="font-pixel text-sm text-retro-gb-mid mt-2">
                レベルアップや特定のアイテムが必要かもしれません
              </div>
            </div>
          )}

          {/* Evolution Process */}
          {isEvolving && (
            <div className="text-center py-8">
              <div className="font-pixel text-xl text-retro-gb-dark mb-4">
                進化中...
              </div>
              <div className="w-32 h-2 bg-gray-200 mx-auto overflow-hidden">
                <div className="h-full bg-blue-500 animate-pulse"></div>
              </div>
              <div className="font-pixel text-sm text-retro-gb-mid mt-2">
                おめでとう！{pokemon.name}は進化している！
              </div>
            </div>
          )}

          {/* Evolution Result */}
          {evolutionResult && (
            <div className="space-y-4">
              {evolutionResult.success ? (
                <div className="text-center py-6 bg-green-50 border border-green-200">
                  <div className="font-pixel text-xl text-green-800 mb-2">
                    進化成功！
                  </div>
                  <div className="font-pixel text-lg text-retro-gb-dark">
                    {pokemon.name} → {evolutionResult.evolvedPokemon?.name}
                  </div>
                  
                  {evolutionResult.bonuses && (
                    <div className="mt-4 space-y-2">
                      <div className="font-pixel text-sm text-green-700">
                        能力値上昇: +{evolutionResult.bonuses.statBonus}
                      </div>
                      {evolutionResult.bonuses.moveBonus.length > 0 && (
                        <div className="font-pixel text-sm text-green-700">
                          新しい技: {evolutionResult.bonuses.moveBonus.join(', ')}
                        </div>
                      )}
                      {evolutionResult.bonuses.abilityBonus && (
                        <div className="font-pixel text-sm text-green-700">
                          新しい特性: {evolutionResult.bonuses.abilityBonus}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 bg-red-50 border border-red-200">
                  <div className="font-pixel text-xl text-red-800 mb-2">
                    進化失敗
                  </div>
                  <div className="font-pixel text-sm text-red-600">
                    {evolutionResult.error}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-center space-x-4 pt-4 border-t border-retro-gb-mid">
            {!isEvolving && !evolutionResult && evolutionPreview?.canEvolve && (
              <button
                onClick={handleEvolve}
                disabled={!selectedEvolution}
                className={clsx(
                  'px-6 py-2 font-pixel text-sm border-2',
                  selectedEvolution
                    ? 'bg-purple-500 text-white border-purple-600 hover:bg-purple-600'
                    : 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed'
                )}
              >
                進化させる
              </button>
            )}
            
            <button
              onClick={onClose}
              className="px-6 py-2 font-pixel text-sm bg-gray-500 text-white border-2 border-gray-600 hover:bg-gray-600"
            >
              {evolutionResult ? '閉じる' : 'キャンセル'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}