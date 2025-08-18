import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY'
  }).format(amount).replace('￥', '₽') // ポケモンっぽくするため
}

export function formatLevel(level: number, maxLevel: number = 100): string {
  return `Lv.${level}/${maxLevel}`
}

export function calculatePercentage(current: number, max: number): number {
  return Math.min(100, Math.max(0, (current / max) * 100))
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}