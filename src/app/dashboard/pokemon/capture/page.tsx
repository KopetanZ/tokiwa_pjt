'use client'

import { useState } from 'react'
import Image from 'next/image'
import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { PixelProgressBar } from '@/components/ui/PixelProgressBar'
import { generateRandomWildPokemon } from '@/lib/pokeapi'
import { useMutation } from '@tanstack/react-query'

interface WildPokemon {
  species: {
    id: number
    name: string
    nameEn: string
    types: string[]
    sprite: string
    captureRate: number
    baseStats: Record<string, number>
  }
  level: number
  shiny: boolean
  nature: string
  ivs: Record<string, number>
}

interface CaptureAttempt {
  pokeball: string
  success: boolean
  breakout: number // 0-3 (揺れの回数)
  critical: boolean
}

function WildPokemonCard({ pokemon }: { pokemon: WildPokemon }) {
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
    <div className="wild-pokemon-card">
      <div className="flex items-center space-x-4">
        {/* スプライト */}
        <div className="relative">
          <div className="w-24 h-24 bg-retro-gb-light border border-retro-gb-mid flex items-center justify-center">
            {pokemon.species.sprite ? (
              <Image 
                src={pokemon.species.sprite}
                alt={pokemon.species.name}
                width={80}
                height={80}
                className="pixel-art"
                unoptimized
              />
            ) : (
              <span className="font-pixel text-xs">No.{pokemon.species.id}</span>
            )}
          </div>
          {pokemon.shiny && (
            <div className="absolute -top-2 -right-2 text-lg animate-pulse">✨</div>
          )}
        </div>
        
        {/* 情報 */}
        <div className="flex-1 space-y-2">
          <div>
            <h3 className="font-pixel text-lg text-retro-gb-dark">
              {pokemon.species.name} {pokemon.shiny && '(色違い)'}
            </h3>
            <p className="font-pixel text-xs text-retro-gb-mid">
              Lv.{pokemon.level} | {pokemon.nature}
            </p>
          </div>
          
          {/* タイプ */}
          <div className="flex space-x-1">
            {pokemon.species.types.map(type => (
              <span 
                key={type}
                className={`inline-block px-2 py-1 text-white font-pixel text-xs capitalize ${getTypeColor(type)}`}
              >
                {type}
              </span>
            ))}
          </div>
          
          {/* 捕獲率 */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="font-pixel text-xs text-retro-gb-mid">捕獲難易度</span>
              <span className="font-pixel text-xs text-retro-gb-mid">
                {pokemon.species.captureRate}/255
              </span>
            </div>
            <PixelProgressBar
              value={pokemon.species.captureRate}
              max={255}
              color="exp"
              showLabel={false}
            />
          </div>
          
          {/* 個体値ヒント */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {Object.entries(pokemon.ivs).slice(0, 3).map(([stat, value]) => {
              const quality = value >= 25 ? '優秀' : value >= 15 ? '普通' : '低め'
              const color = value >= 25 ? 'text-green-600' : value >= 15 ? 'text-yellow-600' : 'text-red-600'
              
              return (
                <div key={stat}>
                  <div className="font-pixel text-xs text-retro-gb-mid">
                    {stat === 'hp' ? 'HP' : stat === 'attack' ? '攻撃' : '防御'}
                  </div>
                  <div className={`font-pixel text-xs ${color}`}>{quality}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function CaptureResult({ attempt, onClose }: { attempt: CaptureAttempt; onClose: () => void }) {
  return (
    <PixelCard>
      <div className="text-center space-y-4">
        <div className="font-pixel text-lg text-retro-gb-dark">
          {attempt.success ? '捕獲成功！' : '捕獲失敗...'}
        </div>
        
        <div className="space-y-2">
          <div className="font-pixel text-sm text-retro-gb-mid">
            {attempt.pokeball}を投げた！
          </div>
          
          {attempt.critical && (
            <div className="font-pixel text-sm text-yellow-600">
              クリティカルキャッチ！
            </div>
          )}
          
          <div className="font-pixel text-sm text-retro-gb-mid">
            ボールが{attempt.breakout}回揺れた...
          </div>
          
          {attempt.success ? (
            <div className="font-pixel text-sm text-green-600">
              ポケモンを捕まえた！
            </div>
          ) : (
            <div className="font-pixel text-sm text-red-600">
              ポケモンはボールから出てきてしまった！
            </div>
          )}
        </div>
        
        <PixelButton onClick={onClose}>
          {attempt.success ? '続ける' : '再挑戦'}
        </PixelButton>
      </div>
    </PixelCard>
  )
}

export default function CapturePage() {
  const [wildPokemon, setWildPokemon] = useState<WildPokemon | null>(null)
  const [selectedPokeball, setSelectedPokeball] = useState('モンスターボール')
  const [captureResult, setCaptureResult] = useState<CaptureAttempt | null>(null)
  const [isEncountering, setIsEncountering] = useState(false)
  
  const pokeballs = [
    { name: 'モンスターボール', rate: 1.0, cost: 200, stock: 10 },
    { name: 'スーパーボール', rate: 1.5, cost: 600, stock: 5 },
    { name: 'ハイパーボール', rate: 2.0, cost: 1200, stock: 2 },
    { name: 'プレミアボール', rate: 1.0, cost: 200, stock: 1 }
  ]
  
  const encounterMutation = useMutation({
    mutationFn: async () => {
      const level = Math.floor(Math.random() * 10) + 5 // Lv.5-14
      return await generateRandomWildPokemon(level)
    },
    onMutate: () => setIsEncountering(true),
    onSuccess: (data) => {
      setWildPokemon(data)
      setIsEncountering(false)
      setCaptureResult(null)
    },
    onError: () => setIsEncountering(false)
  })
  
  const captureMutation = useMutation({
    mutationFn: async ({ pokemon, pokeball }: { pokemon: WildPokemon; pokeball: string }) => {
      // 捕獲計算シミュレーション
      const ball = pokeballs.find(b => b.name === pokeball)!
      const captureRate = pokemon.species.captureRate * ball.rate
      
      // クリティカルキャッチ判定（1/256の確率）
      const critical = Math.random() < (1/256)
      
      // 捕獲成功判定
      const threshold = Math.min(255, captureRate)
      const roll = Math.random() * 255
      const success = roll < threshold || critical
      
      // ボールの揺れ回数（0-3）
      const breakout = critical ? 1 : Math.floor(Math.random() * 4)
      
      // 結果を少し遅延させてリアルさを演出
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      return {
        pokeball,
        success,
        breakout,
        critical
      }
    },
    onSuccess: (result) => {
      setCaptureResult(result)
      if (result.success) {
        setWildPokemon(null)
      }
    }
  })
  
  const handleEncounter = () => {
    encounterMutation.mutate()
  }
  
  const handleCapture = () => {
    if (!wildPokemon) return
    captureMutation.mutate({ pokemon: wildPokemon, pokeball: selectedPokeball })
  }
  
  const handleResultClose = () => {
    setCaptureResult(null)
    if (!captureResult?.success) {
      // 失敗した場合は同じポケモンが残る
      return
    }
    // 成功した場合は新しい遭遇を促す
    setWildPokemon(null)
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="font-pixel-large text-retro-gb-dark">
          野生ポケモン捕獲
        </h1>
        <PixelButton
          onClick={handleEncounter}
          disabled={isEncountering || captureMutation.isPending}
        >
          {isEncountering ? '探索中...' : '野生ポケモンを探す'}
        </PixelButton>
      </div>
      
      {/* ボール選択 */}
      <PixelCard title="ボール選択">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {pokeballs.map(ball => (
            <div 
              key={ball.name}
              className={`p-3 border cursor-pointer transition-colors ${
                selectedPokeball === ball.name 
                  ? 'bg-retro-gb-mid border-retro-gb-dark' 
                  : 'bg-retro-gb-light border-retro-gb-mid hover:bg-retro-gb-lightest'
              }`}
              onClick={() => setSelectedPokeball(ball.name)}
            >
              <div className="text-center space-y-2">
                <div className="font-pixel text-xs text-retro-gb-dark">{ball.name}</div>
                <div className="font-pixel text-xs text-retro-gb-mid">
                  倍率: x{ball.rate}
                </div>
                <div className="font-pixel text-xs text-retro-gb-mid">
                  所持: {ball.stock}個
                </div>
                <div className="font-pixel text-xs text-retro-gb-mid">
                  ₽{ball.cost}
                </div>
              </div>
            </div>
          ))}
        </div>
      </PixelCard>
      
      {/* 遭遇結果 */}
      {captureResult ? (
        <CaptureResult attempt={captureResult} onClose={handleResultClose} />
      ) : wildPokemon ? (
        <PixelCard title="野生ポケモンが現れた！">
          <div className="space-y-4">
            <WildPokemonCard pokemon={wildPokemon} />
            
            <div className="flex justify-center space-x-4">
              <PixelButton
                onClick={handleCapture}
                disabled={captureMutation.isPending}
              >
                {captureMutation.isPending ? '捕獲中...' : `${selectedPokeball}を投げる`}
              </PixelButton>
              <PixelButton
                variant="secondary"
                onClick={() => setWildPokemon(null)}
                disabled={captureMutation.isPending}
              >
                逃げる
              </PixelButton>
            </div>
          </div>
        </PixelCard>
      ) : (
        <PixelCard>
          <div className="text-center py-8">
            <div className="font-pixel text-retro-gb-mid">
              「野生ポケモンを探す」ボタンを押して、ポケモンを探しましょう！
            </div>
          </div>
        </PixelCard>
      )}
      
      {/* 統計 */}
      <PixelCard title="捕獲統計">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="font-pixel-large text-retro-gb-dark">12</div>
            <div className="font-pixel text-xs text-retro-gb-mid">遭遇数</div>
          </div>
          <div className="text-center">
            <div className="font-pixel-large text-green-600">8</div>
            <div className="font-pixel text-xs text-retro-gb-mid">捕獲成功</div>
          </div>
          <div className="text-center">
            <div className="font-pixel-large text-red-600">4</div>
            <div className="font-pixel text-xs text-retro-gb-mid">捕獲失敗</div>
          </div>
          <div className="text-center">
            <div className="font-pixel-large text-yellow-600">1</div>
            <div className="font-pixel text-xs text-retro-gb-mid">色違い</div>
          </div>
        </div>
      </PixelCard>
      
      {/* ヒント */}
      <PixelCard title="捕獲のコツ">
        <div className="space-y-2 font-pixel text-xs text-retro-gb-mid">
          <div>• 捕獲率の高いポケモンは捕まえやすい</div>
          <div>• より良いボールを使うと捕獲率が上がる</div>
          <div>• 色違いポケモンは非常に珍しい（1/4096の確率）</div>
          <div>• クリティカルキャッチが発生することがある</div>
          <div>• 個体値の高いポケモンは貴重</div>
        </div>
      </PixelCard>
    </div>
  )
}