'use client'

import { useEffect, useState } from 'react'
import { clsx } from 'clsx'

interface Toast {
  id: string
  title?: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  duration?: number
}

interface PixelToastProps {
  toast: Toast
  onDismiss: (id: string) => void
}

export function PixelToast({ toast, onDismiss }: PixelToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // アニメーション用に少し遅延
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => onDismiss(toast.id), 200)
  }

  const typeStyles = {
    info: 'bg-retro-blue border-blue-800 text-white',
    success: 'bg-green-500 border-green-800 text-white',
    warning: 'bg-retro-yellow border-yellow-700 text-retro-gb-dark',
    error: 'bg-retro-red border-red-800 text-white'
  }

  return (
    <div
      className={clsx(
        'pixel-dialog max-w-sm w-full',
        'transform transition-all duration-200',
        isVisible 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0',
        typeStyles[toast.type]
      )}
    >
      <div className="pixel-dialog-header flex items-center justify-between">
        {toast.title && (
          <h4 className="font-pixel text-xs">{toast.title}</h4>
        )}
        <button
          onClick={handleDismiss}
          className="font-pixel text-xs hover:opacity-70 ml-auto"
          aria-label="閉じる"
        >
          ×
        </button>
      </div>
      
      <div className="pixel-dialog-content">
        <p className="font-pixel text-xs">{toast.message}</p>
      </div>
    </div>
  )
}