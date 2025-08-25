export interface User {
  id: string
  email?: string
  password?: string
  guestName: string
  schoolName: string
  currentMoney: number
  totalReputation: number
  uiTheme: string
  settings?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface GuestLoginRequest {
  guestName: string
  schoolName: string
  uiTheme?: string
}

export interface AuthSession {
  user: User
  accessToken?: string
  refreshToken?: string
  expiresAt?: string
}