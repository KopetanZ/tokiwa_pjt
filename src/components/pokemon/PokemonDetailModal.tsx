'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Zap, Shield, Sword, Star, MapPin } from "lucide-react"
import { useState, useEffect } from "react"

interface PokemonStats {
  hp: number
  attack: number
  defense: number
  special_attack: number
  special_defense: number
  speed: number
}

interface PokemonSpecies {
  id: number
  name: string
  types: string[]
  base_stats: PokemonStats
  height: number
  weight: number
  base_experience: number
}

interface Pokemon {
  id: string
  species_id: number
  species?: PokemonSpecies
  level: number
  experience: number
  current_hp: number
  max_hp: number
  individual_values: {
    hp: number
    attack: number
    defense: number
    special_attack: number
    special_defense: number
    speed: number
  }
  nature?: string
  caught_at: string
  location?: string
  is_in_party: boolean
}

interface PokemonDetailModalProps {
  pokemon: Pokemon | null
  isOpen: boolean
  onClose: () => void
  onAddToParty?: (pokemon: Pokemon) => void
  onRemoveFromParty?: (pokemon: Pokemon) => void
}

export function PokemonDetailModal({ 
  pokemon, 
  isOpen, 
  onClose, 
  onAddToParty, 
  onRemoveFromParty 
}: PokemonDetailModalProps) {
  const [pokemonData, setPokemonData] = useState<PokemonSpecies | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (pokemon && pokemon.species_id && isOpen) {
      fetchPokemonData(pokemon.species_id)
    }
  }, [pokemon, isOpen])

  const fetchPokemonData = async (speciesId: number) => {
    if (pokemon?.species) {
      setPokemonData(pokemon.species)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${speciesId}`)
      const data = await response.json()
      
      const speciesData: PokemonSpecies = {
        id: data.id,
        name: data.name,
        types: data.types.map((type: any) => type.type.name),
        base_stats: {
          hp: data.stats[0].base_stat,
          attack: data.stats[1].base_stat,
          defense: data.stats[2].base_stat,
          special_attack: data.stats[3].base_stat,
          special_defense: data.stats[4].base_stat,
          speed: data.stats[5].base_stat
        },
        height: data.height,
        weight: data.weight,
        base_experience: data.base_experience
      }
      
      setPokemonData(speciesData)
    } catch (error) {
      console.error('ポケモンデータの取得に失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStat = (baseStat: number, iv: number, level: number) => {
    // ポケモンの実際のステータス計算（簡略版）
    return Math.floor(((baseStat + iv) * level / 50) + 10)
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      normal: 'bg-gray-400',
      fire: 'bg-red-500',
      water: 'bg-blue-500',
      electric: 'bg-yellow-400',
      grass: 'bg-green-500',
      ice: 'bg-blue-300',
      fighting: 'bg-red-700',
      poison: 'bg-purple-500',
      ground: 'bg-yellow-600',
      flying: 'bg-indigo-400',
      psychic: 'bg-pink-500',
      bug: 'bg-green-400',
      rock: 'bg-yellow-800',
      ghost: 'bg-purple-700',
      dragon: 'bg-indigo-700',
      dark: 'bg-gray-800',
      steel: 'bg-gray-500',
      fairy: 'bg-pink-300'
    }
    return colors[type] || 'bg-gray-400'
  }

  const getExperienceToNextLevel = (currentLevel: number, currentExp: number) => {
    const expForNextLevel = currentLevel * 1000 // 簡易計算
    const expForCurrentLevel = (currentLevel - 1) * 1000
    const progress = currentExp - expForCurrentLevel
    const needed = expForNextLevel - expForCurrentLevel
    return { progress, needed, percentage: (progress / needed) * 100 }
  }

  if (!pokemon) return null

  const species = pokemonData || pokemon.species
  const expInfo = getExperienceToNextLevel(pokemon.level, pokemon.experience)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {species?.name ? (
              <>
                {species.name.charAt(0).toUpperCase() + species.name.slice(1)}
                <Badge variant="outline">Lv.{pokemon.level}</Badge>
              </>
            ) : (
              `ポケモン #${pokemon.species_id}`
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 基本情報 */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">基本情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    <span className="text-sm">レベル: {pokemon.level}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="text-sm">HP: {pokemon.current_hp}/{pokemon.max_hp}</span>
                  </div>
                  {pokemon.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">捕獲場所: {pokemon.location}</span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    捕獲日時: {new Date(pokemon.caught_at).toLocaleDateString('ja-JP')}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">経験値</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm">
                    経験値: {pokemon.experience.toLocaleString()}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>次のレベルまで</span>
                      <span>{expInfo.needed - expInfo.progress}</span>
                    </div>
                    <Progress value={expInfo.percentage} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* タイプ */}
            {species?.types && (
              <div>
                <h3 className="text-sm font-medium mb-2">タイプ</h3>
                <div className="flex gap-2">
                  {species.types.map((type) => (
                    <Badge
                      key={type}
                      className={`${getTypeColor(type)} text-white`}
                    >
                      {type.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* ステータス */}
            {species?.base_stats && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">ステータス</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(species.base_stats).map(([statName, baseStat]) => {
                      const iv = pokemon.individual_values[statName as keyof PokemonStats] || 0
                      const actualStat = calculateStat(baseStat, iv, pokemon.level)
                      const maxStat = 255 // 概算の最大値
                      
                      const icons: Record<string, any> = {
                        hp: Heart,
                        attack: Sword,
                        defense: Shield,
                        special_attack: Zap,
                        special_defense: Shield,
                        speed: Zap
                      }
                      
                      const Icon = icons[statName] || Star
                      
                      return (
                        <div key={statName} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              <span className="text-sm capitalize">
                                {statName.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="text-sm font-medium">
                              {actualStat}
                              <span className="text-xs text-gray-500 ml-1">
                                (IV: {iv})
                              </span>
                            </div>
                          </div>
                          <Progress 
                            value={(actualStat / maxStat) * 100} 
                            className="h-2"
                          />
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* パーティ管理ボタン */}
            <div className="flex gap-2 pt-4">
              {pokemon.is_in_party ? (
                <Button
                  variant="destructive"
                  onClick={() => onRemoveFromParty?.(pokemon)}
                  className="flex-1"
                >
                  パーティから外す
                </Button>
              ) : (
                <Button
                  onClick={() => onAddToParty?.(pokemon)}
                  className="flex-1"
                >
                  パーティに追加
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>
                閉じる
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}