'use client'

import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface PixelCardProps {
  title?: string
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger'
  className?: string
}

export function PixelCard({ 
  title, 
  children, 
  variant = 'default',
  className 
}: PixelCardProps) {
  const variantStyles = {
    default: 'bg-retro-gb-lightest border-retro-gb-mid',
    success: 'bg-green-100 border-green-600',
    warning: 'bg-yellow-100 border-yellow-600',
    danger: 'bg-red-100 border-red-600'
  }

  return (
    <div 
      className={clsx(
        'pixel-dialog',
        variantStyles[variant],
        className
      )}
    >
      {title && (
        <div className={clsx(
          'pixel-dialog-header',
          variant === 'default' && 'bg-retro-gb-mid text-retro-gb-lightest',
          variant === 'success' && 'bg-green-600 text-white',
          variant === 'warning' && 'bg-yellow-600 text-white',
          variant === 'danger' && 'bg-red-600 text-white'
        )}>
          <h3 className="font-pixel text-xs">{title}</h3>
        </div>
      )}
      
      <div className="pixel-dialog-content">
        {children}
      </div>
    </div>
  )
}