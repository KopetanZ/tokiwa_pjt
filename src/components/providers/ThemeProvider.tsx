'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface RetroTheme {
  name: string
  colors: {
    primary: string
    secondary: string
    background: string
    text: string
    border: string
    accent: string
  }
  palette: 'gameboy' | 'gameboy_color' | 'custom'
}

const themes: Record<string, RetroTheme> = {
  gameboy_green: {
    name: 'ゲームボーイ（緑）',
    colors: {
      primary: '#9BBD0F',
      secondary: '#8BAC0F',
      background: '#9BBD0F',
      text: '#0F380F',
      border: '#306230',
      accent: '#0F380F'
    },
    palette: 'gameboy'
  },
  gameboy_red: {
    name: 'ポケットモンスター赤',
    colors: {
      primary: '#FF6B6B',
      secondary: '#FF5252',
      background: '#FFF3E0',
      text: '#2C1810',
      border: '#8D4E3C',
      accent: '#FF5722'
    },
    palette: 'gameboy_color'
  },
  gameboy_blue: {
    name: 'ポケットモンスター青',
    colors: {
      primary: '#4FC3F7',
      secondary: '#29B6F6',
      background: '#E3F2FD',
      text: '#0D47A1',
      border: '#1976D2',
      accent: '#2196F3'
    },
    palette: 'gameboy_color'
  }
}

interface ThemeContextType {
  currentTheme: string
  setCurrentTheme: (theme: string) => void
  themes: Record<string, RetroTheme>
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<string>('gameboy_green')

  useEffect(() => {
    const theme = themes[currentTheme]
    const root = document.documentElement

    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--retro-${key}`, value)
    })
  }, [currentTheme])

  return (
    <ThemeContext.Provider value={{ currentTheme, setCurrentTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}