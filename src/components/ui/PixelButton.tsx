'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  loading?: boolean
}

export function PixelButton({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  disabled,
  className,
  ...props
}: PixelButtonProps) {
  const baseClasses = 'pixel-button font-pixel inline-flex items-center justify-center gap-2'
  
  const variantClasses = {
    primary: 'bg-retro-gb-lightest text-retro-gb-dark border-retro-gb-mid hover:bg-retro-gb-light',
    secondary: 'bg-retro-gb-light text-retro-gb-dark border-retro-gb-dark hover:bg-retro-gb-mid',
    danger: 'bg-retro-red text-white border-red-800 hover:bg-red-600',
    success: 'bg-green-500 text-white border-green-800 hover:bg-green-600'
  }
  
  const sizeClasses = {
    sm: 'text-xs px-3 py-2',
    md: 'text-xs px-4 py-2',
    lg: 'text-sm px-6 py-3'
  }

  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        (disabled || loading) && 'opacity-60 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
      )}
      <span>{children}</span>
    </button>
  )
}