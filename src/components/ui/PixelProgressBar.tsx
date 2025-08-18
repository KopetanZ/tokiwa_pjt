'use client'

import { clsx } from 'clsx'

interface PixelProgressBarProps {
  value: number
  max: number
  color?: 'hp' | 'exp' | 'progress' | 'danger'
  showLabel?: boolean
  animated?: boolean
  className?: string
}

export function PixelProgressBar({
  value,
  max,
  color = 'progress',
  showLabel = false,
  animated = false,
  className
}: PixelProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)
  
  const colorClasses = {
    hp: 'pixel-progress-fill--hp',
    exp: 'pixel-progress-fill--exp', 
    progress: 'bg-retro-gb-mid',
    danger: 'pixel-progress-fill--danger'
  }

  return (
    <div className={clsx('space-y-1', className)}>
      {showLabel && (
        <div className="flex justify-between">
          <span className="font-pixel text-xs">{value}</span>
          <span className="font-pixel text-xs">{max}</span>
        </div>
      )}
      
      <div className="pixel-progress-bar">
        <div 
          className={clsx(
            'pixel-progress-fill h-full transition-all duration-300',
            colorClasses[color],
            animated && 'pixel-progress-fill--animated'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {showLabel && (
        <div className="text-center">
          <span className="font-pixel text-xs text-retro-gb-mid">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  )
}