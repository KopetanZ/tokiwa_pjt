'use client'

import { InputHTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface PixelInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function PixelInput({
  error = false,
  className,
  ...props
}: PixelInputProps) {
  return (
    <input
      className={clsx(
        'w-full font-pixel text-xs',
        'px-3 py-2',
        'bg-retro-gb-lightest text-retro-gb-dark',
        'border-2 border-retro-gb-mid',
        'focus:outline-none focus:border-retro-gb-dark',
        'placeholder:text-retro-gb-mid placeholder:opacity-60',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        error && 'border-retro-red focus:border-retro-red',
        'transition-colors duration-200',
        className
      )}
      {...props}
    />
  )
}