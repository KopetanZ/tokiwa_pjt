'use client'

import { PixelButton } from '@/components/ui/PixelButton'
import { PixelCard } from '@/components/ui/PixelCard'
import { clsx } from 'clsx'

interface ExpeditionLocation {
  id: number
  nameJa: string
  distanceLevel: number
  travelCost: number
  travelTimeHours: number
  riskLevel: number
  baseRewardMoney: number
  encounterTypes: string[]
  isUnlocked: boolean
  description: string
  backgroundImage?: string
}

interface LocationCardProps {
  location: ExpeditionLocation
  onStartExpedition: (locationId: number) => void
}

export function LocationCard({
  location,
  onStartExpedition
}: LocationCardProps) {
  const getRiskLabel = (riskLevel: number) => {
    if (riskLevel <= 0.8) return { label: '低', color: 'text-green-600' }
    if (riskLevel <= 1.2) return { label: '中', color: 'text-orange-600' }
    return { label: '高', color: 'text-red-600' }
  }

  const getTypeEmoji = (type: string) => {
    const typeEmojis: Record<string, string> = {
      normal: '⚪',
      fire: '🔥',
      water: '💧',
      electric: '⚡',
      grass: '🌿',
      ice: '❄️',
      fighting: '👊',
      poison: '☠️',
      ground: '🌍',
      flying: '🐦',
      psychic: '🔮',
      bug: '🐛',
      rock: '🗿',
      ghost: '👻',
      dragon: '🐉',
      dark: '🌑',
      steel: '⚔️',
      fairy: '🧚'
    }
    return typeEmojis[type] || '❓'
  }

  const risk = getRiskLabel(location.riskLevel)

  return (
    <PixelCard 
      title={location.nameJa}
      variant={location.isUnlocked ? 'default' : 'warning'}
    >
      <div className="space-y-4">
        {/* 背景画像（プレースホルダー） */}
        <div className="h-24 bg-retro-gb-mid border border-retro-gb-dark flex items-center justify-center">
          <span className="font-pixel text-xs text-retro-gb-lightest opacity-60">
            {location.nameJa}
          </span>
        </div>

        {/* 基本情報 */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="font-pixel text-retro-gb-mid">難易度</div>
            <div className="font-pixel text-retro-gb-dark">
              Lv.{location.distanceLevel}
            </div>
          </div>
          <div>
            <div className="font-pixel text-retro-gb-mid">所要時間</div>
            <div className="font-pixel text-retro-gb-dark">
              {location.travelTimeHours}時間
            </div>
          </div>
          <div>
            <div className="font-pixel text-retro-gb-mid">派遣費用</div>
            <div className="font-pixel text-retro-gb-dark">
              ₽{location.travelCost.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="font-pixel text-retro-gb-mid">リスク</div>
            <div className={clsx('font-pixel', risk.color)}>
              {risk.label}
            </div>
          </div>
        </div>

        {/* 報酬情報 */}
        <div className="bg-retro-gb-light p-3 space-y-2">
          <div className="font-pixel text-xs text-retro-gb-dark">予想報酬</div>
          <div className="font-pixel text-sm text-retro-gb-dark">
            ₽{location.baseRewardMoney.toLocaleString()} (基本額)
          </div>
          <div className="font-pixel text-xs text-retro-gb-mid">
            ※実際の報酬は成功度により変動
          </div>
        </div>

        {/* 出現ポケモンタイプ */}
        <div>
          <div className="font-pixel text-xs text-retro-gb-mid mb-2">
            出現ポケモンタイプ
          </div>
          <div className="flex flex-wrap gap-1">
            {location.encounterTypes.map(type => (
              <span 
                key={type}
                className="inline-flex items-center gap-1 bg-retro-gb-mid text-retro-gb-lightest px-2 py-1 font-pixel text-xs"
              >
                <span>{getTypeEmoji(type)}</span>
                {type}
              </span>
            ))}
          </div>
        </div>

        {/* 説明 */}
        <div className="bg-retro-gb-light p-3">
          <div className="font-pixel text-xs text-retro-gb-dark">
            {location.description}
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-2">
          {location.isUnlocked ? (
            <>
              <PixelButton 
                className="flex-1"
                onClick={() => onStartExpedition(location.id)}
              >
                派遣開始
              </PixelButton>
              <PixelButton variant="secondary" size="sm">
                詳細
              </PixelButton>
            </>
          ) : (
            <div className="flex-1">
              <PixelButton 
                className="w-full" 
                disabled
                variant="secondary"
              >
                未解放
              </PixelButton>
              <div className="font-pixel text-xs text-retro-gb-mid mt-2 text-center">
                条件: スクール評判500pt
              </div>
            </div>
          )}
        </div>
      </div>
    </PixelCard>
  )
}