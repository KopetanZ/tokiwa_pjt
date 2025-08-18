'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@/types/auth'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (guestName: string, schoolName: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 初期化時にローカルストレージから認証情報を復元
    const savedUser = localStorage.getItem('tokiwa_user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Failed to parse saved user:', error)
        localStorage.removeItem('tokiwa_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (guestName: string, schoolName: string) => {
    setIsLoading(true)
    try {
      // 仮の実装 - 後でSupabase認証に置き換え
      const newUser: User = {
        id: `guest_${Date.now()}`,
        guestName,
        schoolName,
        currentMoney: 50000,
        totalReputation: 0,
        uiTheme: 'gameboy_green',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      setUser(newUser)
      localStorage.setItem('tokiwa_user', JSON.stringify(newUser))
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('tokiwa_user')
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        isAuthenticated: !!user, 
        login, 
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}