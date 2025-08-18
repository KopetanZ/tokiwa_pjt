'use client'

import { PixelProgressBar } from '@/components/ui/PixelProgressBar'
import { TrainerSummary } from '@/types/trainer'
import { clsx } from 'clsx'

interface TrainerCardProps {
  trainer: TrainerSummary
  onClick?: () => void
  showStatus?: boolean
  showParty?: boolean
}

export function TrainerCard({
  trainer,
  onClick,
  showStatus = false,
  showParty = false
}: TrainerCardProps) {
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

  return (
    <div 
      className={clsx(
        'trainer-card',
        onClick && 'trainer-card--clickable',
        trainer.status === 'on_expedition' && 'trainer-card--busy'
      )}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        {/* トレーナースプライト */}
        <div className="trainer-card__sprite">
          <div className="w-12 h-12 bg-retro-gb-mid border border-retro-gb-dark flex items-center justify-center">
            <span className="font-pixel text-xs">👨‍🏫</span>
          </div>
        </div>
        
        {/* トレーナー情報 */}
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-pixel text-sm text-retro-gb-dark">{trainer.name}</h3>
              <p className="font-pixel text-xs text-retro-gb-mid">
                {trainer.job.nameJa} Lv.{trainer.job.level}
              </p>
            </div>
            
            {showStatus && (
              <div className="trainer-card__status">
                {getStatusBadge(trainer.status)}
              </div>
            )}
          </div>

          {/* 職業経験値バー */}
          <div className="trainer-card__exp">
            <div className="flex justify-between mb-1">
              <span className="font-pixel text-xs text-retro-gb-mid">経験値</span>
              <span className="font-pixel text-xs text-retro-gb-mid">
                {trainer.job.experience}/{trainer.job.nextLevelExp}
              </span>
            </div>
            <PixelProgressBar
              value={trainer.job.experience}
              max={trainer.job.nextLevelExp}
              color="exp"
              showLabel={false}
            />
          </div>

          {/* 信頼度 */}
          <div className="trainer-card__trust">
            <div className="flex justify-between mb-1">
              <span className="font-pixel text-xs text-retro-gb-mid">信頼度</span>
              <span className="font-pixel text-xs text-retro-gb-mid">
                {trainer.trustLevel}%
              </span>
            </div>
            <PixelProgressBar
              value={trainer.trustLevel}
              max={100}
              color="hp"
              showLabel={false}
            />
          </div>

          {showParty && (
            <div className="trainer-card__party">
              <div className="flex justify-between items-center">
                <span className="font-pixel text-xs text-retro-gb-mid">
                  パーティ: {trainer.party.pokemonCount}/6
                </span>
                <span className="font-pixel text-xs text-retro-gb-mid">
                  平均Lv.{trainer.party.averageLevel}
                </span>
              </div>
              <PixelProgressBar 
                value={trainer.party.pokemonCount} 
                max={6}
                color="progress"
                showLabel={false}
              />
            </div>
          )}

          {/* 給与情報 */}
          <div className="flex justify-between items-center pt-2 border-t border-retro-gb-mid">
            <span className="font-pixel text-xs text-retro-gb-mid">月給</span>
            <span className="font-pixel text-xs text-retro-gb-dark">
              ₽{trainer.salary.toLocaleString()}
            </span>
          </div>

          {/* 特化スキル */}
          <div className="flex flex-wrap gap-1">
            {Object.entries(trainer.job.specializations).map(([skill, multiplier]) => (
              <span 
                key={skill}
                className="inline-block bg-retro-gb-mid text-retro-gb-lightest px-2 py-1 font-pixel text-xs"
              >
                {skill} x{multiplier.toFixed(2)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}