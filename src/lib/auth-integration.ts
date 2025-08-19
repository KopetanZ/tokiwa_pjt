// 認証システムの統合とセッション管理の完全実装
import { supabase, safeSupabaseOperation } from '@/lib/supabase'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { ErrorLogger, mapSupabaseError, ErrorType, ErrorSeverity } from '@/lib/error-handling'
import { initializeUserSettings } from '@/lib/settings-integration'

// セッション状態の定義
export interface SessionState {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  lastActivity: Date | null
  sessionExpiry: Date | null
  refreshAttempts: number
}

// 認証イベントタイプ
export enum AuthEventType {
  SIGN_IN = 'SIGNED_IN',
  SIGN_OUT = 'SIGNED_OUT',
  TOKEN_REFRESHED = 'TOKEN_REFRESHED',
  USER_UPDATED = 'USER_UPDATED',
  PASSWORD_RECOVERY = 'PASSWORD_RECOVERY',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  AUTH_ERROR = 'AUTH_ERROR'
}

// セッション管理の設定
const SESSION_CONFIG = {
  maxInactivityMinutes: 30, // 30分間の非活動でセッション期限切れ警告
  refreshThresholdMinutes: 10, // トークン期限の10分前に自動更新
  maxRefreshAttempts: 3, // 最大再試行回数
  autoSaveIntervalMs: 60000, // 1分ごとに自動セーブ
  sessionStorageKey: 'tokiwa-session-state',
  activityEvents: ['click', 'keypress', 'scroll', 'mousemove', 'touchstart'] as const
}

// 認証とセッション管理を統合するクラス
export class AuthSessionManager {
  private static instance: AuthSessionManager
  private sessionState: SessionState
  private listeners: Map<string, Function[]> = new Map()
  private activityTimer: NodeJS.Timeout | null = null
  private refreshTimer: NodeJS.Timeout | null = null
  private autoSaveTimer: NodeJS.Timeout | null = null
  private isInitialized = false

  constructor() {
    this.sessionState = {
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      lastActivity: null,
      sessionExpiry: null,
      refreshAttempts: 0
    }
  }

  static getInstance(): AuthSessionManager {
    if (!AuthSessionManager.instance) {
      AuthSessionManager.instance = new AuthSessionManager()
    }
    return AuthSessionManager.instance
  }

  // 初期化
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // 保存されたセッション状態を復元
      await this.restoreSessionState()

      // Supabaseの認証状態を監視
      if (supabase) {
        supabase.auth.onAuthStateChange(async (event, session) => {
          await this.handleAuthStateChange(event as AuthEventType, session)
        })

        // 現在のセッションを確認
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          this.logAuthError(error, 'get_session')
          this.updateSessionState({ error: error.message, isLoading: false })
        } else {
          await this.handleAuthStateChange(AuthEventType.SIGN_IN, session)
        }
      } else {
        // Supabaseが利用できない場合はモックモードへ
        console.warn('Supabase未設定 - モックモードで動作します')
        this.updateSessionState({ isLoading: false, error: null })
      }

      // アクティビティ監視を開始
      this.startActivityTracking()

      // 自動保存を開始
      this.startAutoSave()

      this.isInitialized = true
      
      console.log('認証システムが初期化されました')

    } catch (error) {
      console.error('認証システムの初期化に失敗:', error)
      this.updateSessionState({ 
        error: '認証システムの初期化に失敗しました',
        isLoading: false 
      })
    }
  }

  // 認証状態変更の処理
  private async handleAuthStateChange(event: AuthEventType, session: Session | null): Promise<void> {
    console.log(`認証イベント: ${event}`, session?.user?.id)

    try {
      switch (event) {
        case AuthEventType.SIGN_IN:
          if (session?.user) {
            await this.handleSignIn(session)
          }
          break

        case AuthEventType.SIGN_OUT:
          await this.handleSignOut()
          break

        case AuthEventType.TOKEN_REFRESHED:
          if (session) {
            await this.handleTokenRefresh(session)
          }
          break

        case AuthEventType.USER_UPDATED:
          if (session?.user) {
            this.updateSessionState({
              user: session.user,
              session: session,
              lastActivity: new Date()
            })
          }
          break

        default:
          console.log(`未処理の認証イベント: ${event}`)
      }

      // リスナーに通知
      this.notifyListeners(event, { session, user: session?.user })

    } catch (error) {
      console.error(`認証イベント処理エラー (${event}):`, error)
      this.logAuthError(error, `handle_auth_event_${event}`)
    }
  }

  // サインイン処理
  private async handleSignIn(session: Session): Promise<void> {
    const sessionExpiry = new Date(Date.now() + (session.expires_in || 3600) * 1000)
    
    this.updateSessionState({
      user: session.user,
      session: session,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      lastActivity: new Date(),
      sessionExpiry: sessionExpiry,
      refreshAttempts: 0
    })

    // ユーザー設定を初期化
    try {
      await initializeUserSettings(session.user)
    } catch (error) {
      console.warn('ユーザー設定の初期化に失敗:', error)
    }

    // リフレッシュタイマーを設定
    this.scheduleTokenRefresh(session)

    // 最後のアクティビティ時間を記録
    this.updateLastActivity()

    console.log('ユーザーがサインインしました:', session.user.email)
  }

  // サインアウト処理
  private async handleSignOut(): Promise<void> {
    // タイマーをクリア
    this.clearTimers()

    this.updateSessionState({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      lastActivity: null,
      sessionExpiry: null,
      refreshAttempts: 0
    })

    // セッション状態をクリア
    this.clearSessionStorage()

    console.log('ユーザーがサインアウトしました')
  }

  // トークン更新処理
  private async handleTokenRefresh(session: Session): Promise<void> {
    const sessionExpiry = new Date(Date.now() + (session.expires_in || 3600) * 1000)
    
    this.updateSessionState({
      session: session,
      sessionExpiry: sessionExpiry,
      refreshAttempts: 0,
      lastActivity: new Date()
    })

    // 新しいリフレッシュタイマーを設定
    this.scheduleTokenRefresh(session)

    console.log('トークンが更新されました')
  }

  // トークン自動更新のスケジュール
  private scheduleTokenRefresh(session: Session): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
    }

    const expiresIn = (session.expires_in || 3600) * 1000
    const refreshTime = expiresIn - (SESSION_CONFIG.refreshThresholdMinutes * 60 * 1000)

    this.refreshTimer = setTimeout(async () => {
      await this.refreshToken()
    }, Math.max(refreshTime, 60000)) // 最低1分後
  }

  // トークン更新
  async refreshToken(): Promise<boolean> {
    if (!supabase || this.sessionState.refreshAttempts >= SESSION_CONFIG.maxRefreshAttempts) {
      return false
    }

    try {
      this.updateSessionState({ 
        refreshAttempts: this.sessionState.refreshAttempts + 1 
      })

      const { data: { session }, error } = await supabase.auth.refreshSession()

      if (error) {
        throw error
      }

      if (session) {
        await this.handleTokenRefresh(session)
        return true
      }

      return false

    } catch (error) {
      console.error('トークン更新に失敗:', error)
      this.logAuthError(error, 'refresh_token')

      if (this.sessionState.refreshAttempts >= SESSION_CONFIG.maxRefreshAttempts) {
        // 最大試行回数に達した場合はサインアウト
        await this.signOut()
        this.notifyListeners(AuthEventType.SESSION_EXPIRED, { error })
      }

      return false
    }
  }

  // アクティビティ追跡開始
  private startActivityTracking(): void {
    if (typeof window === 'undefined') return

    // アクティビティイベントリスナーを設定
    SESSION_CONFIG.activityEvents.forEach(eventType => {
      window.addEventListener(eventType, this.handleUserActivity.bind(this), { passive: true })
    })

    // 非活動タイマーを開始
    this.resetInactivityTimer()
  }

  // ユーザーアクティビティ処理
  private handleUserActivity(): void {
    if (!this.sessionState.isAuthenticated) return

    this.updateLastActivity()
    this.resetInactivityTimer()
  }

  // 最後のアクティビティ時間を更新
  private updateLastActivity(): void {
    this.updateSessionState({ lastActivity: new Date() })
  }

  // 非活動タイマーをリセット
  private resetInactivityTimer(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer)
    }

    this.activityTimer = setTimeout(() => {
      this.handleInactivity()
    }, SESSION_CONFIG.maxInactivityMinutes * 60 * 1000)
  }

  // 非活動状態の処理
  private handleInactivity(): void {
    if (this.sessionState.isAuthenticated) {
      console.warn('ユーザーが非活動状態です')
      this.notifyListeners('session_warning', {
        message: '長時間の非活動を検出しました',
        minutesInactive: SESSION_CONFIG.maxInactivityMinutes
      })

      // 警告後、さらに時間が経過したら自動サインアウト
      this.activityTimer = setTimeout(async () => {
        console.log('非活動によるセッション期限切れ')
        await this.signOut()
        this.notifyListeners(AuthEventType.SESSION_EXPIRED, {
          reason: 'inactivity'
        })
      }, 5 * 60 * 1000) // 5分後
    }
  }

  // 自動保存開始
  private startAutoSave(): void {
    this.autoSaveTimer = setInterval(() => {
      this.saveSessionState()
    }, SESSION_CONFIG.autoSaveIntervalMs)
  }

  // セッション状態を更新
  private updateSessionState(updates: Partial<SessionState>): void {
    this.sessionState = { ...this.sessionState, ...updates }
    this.saveSessionState()
  }

  // セッション状態を保存
  private saveSessionState(): void {
    if (typeof window === 'undefined') return

    try {
      const stateToSave = {
        ...this.sessionState,
        session: null, // セキュリティのためセッショントークンは保存しない
        user: this.sessionState.user ? {
          id: this.sessionState.user.id,
          email: this.sessionState.user.email,
          user_metadata: this.sessionState.user.user_metadata
        } : null
      }

      localStorage.setItem(SESSION_CONFIG.sessionStorageKey, JSON.stringify(stateToSave))
    } catch (error) {
      console.warn('セッション状態の保存に失敗:', error)
    }
  }

  // セッション状態を復元
  private async restoreSessionState(): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      const saved = localStorage.getItem(SESSION_CONFIG.sessionStorageKey)
      if (saved) {
        const restoredState = JSON.parse(saved)
        this.sessionState = {
          ...this.sessionState,
          ...restoredState,
          isLoading: true // 復元時は再確認が必要
        }
      }
    } catch (error) {
      console.warn('セッション状態の復元に失敗:', error)
      this.clearSessionStorage()
    }
  }

  // セッション状態をクリア
  private clearSessionStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_CONFIG.sessionStorageKey)
    }
  }

  // タイマーをクリア
  private clearTimers(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer)
      this.activityTimer = null
    }
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = null
    }
  }

  // 認証エラーのログ記録
  private logAuthError(error: any, context: string): void {
    const authError = mapSupabaseError(error, {
      operation: context,
      table: 'auth'
    }, this.sessionState.user)

    ErrorLogger.getInstance().logError(authError)
  }

  // パブリックメソッド: サインイン
  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'データベース接続が利用できません' }
    }

    try {
      this.updateSessionState({ isLoading: true, error: null })

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        this.updateSessionState({ 
          isLoading: false, 
          error: this.getAuthErrorMessage(error)
        })
        this.logAuthError(error, 'sign_in')
        return { success: false, error: this.getAuthErrorMessage(error) }
      }

      // サインイン成功（handleAuthStateChangeで処理される）
      return { success: true }

    } catch (error) {
      const errorMessage = '予期しないエラーが発生しました'
      this.updateSessionState({ isLoading: false, error: errorMessage })
      this.logAuthError(error, 'sign_in_catch')
      return { success: false, error: errorMessage }
    }
  }

  // パブリックメソッド: サインアップ
  async signUp(email: string, password: string, userData?: any): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'データベース接続が利用できません' }
    }

    try {
      this.updateSessionState({ isLoading: true, error: null })

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData || {}
        }
      })

      if (error) {
        this.updateSessionState({ 
          isLoading: false, 
          error: this.getAuthErrorMessage(error)
        })
        this.logAuthError(error, 'sign_up')
        return { success: false, error: this.getAuthErrorMessage(error) }
      }

      this.updateSessionState({ isLoading: false })
      return { success: true }

    } catch (error) {
      const errorMessage = '予期しないエラーが発生しました'
      this.updateSessionState({ isLoading: false, error: errorMessage })
      this.logAuthError(error, 'sign_up_catch')
      return { success: false, error: errorMessage }
    }
  }

  // パブリックメソッド: サインアウト
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      if (supabase) {
        const { error } = await supabase.auth.signOut()
        if (error) {
          this.logAuthError(error, 'sign_out')
          return { success: false, error: this.getAuthErrorMessage(error) }
        }
      } else {
        // Supabaseが利用できない場合は直接処理
        await this.handleSignOut()
      }

      return { success: true }

    } catch (error) {
      this.logAuthError(error, 'sign_out_catch')
      return { success: false, error: '予期しないエラーが発生しました' }
    }
  }

  // パスワードリセット
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'データベース接続が利用できません' }
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)

      if (error) {
        this.logAuthError(error, 'reset_password')
        return { success: false, error: this.getAuthErrorMessage(error) }
      }

      return { success: true }

    } catch (error) {
      this.logAuthError(error, 'reset_password_catch')
      return { success: false, error: '予期しないエラーが発生しました' }
    }
  }

  // イベントリスナーの追加
  addEventListener(eventType: string, callback: Function): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, [])
    }
    this.listeners.get(eventType)!.push(callback)
  }

  // イベントリスナーの削除
  removeEventListener(eventType: string, callback: Function): void {
    const listeners = this.listeners.get(eventType)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  // リスナーに通知
  private notifyListeners(eventType: string, data: any): void {
    const listeners = this.listeners.get(eventType)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`リスナーエラー (${eventType}):`, error)
        }
      })
    }
  }

  // 認証エラーメッセージの変換
  private getAuthErrorMessage(error: AuthError): string {
    switch (error.message) {
      case 'Invalid login credentials':
        return 'メールアドレスまたはパスワードが正しくありません'
      case 'Email not confirmed':
        return 'メールアドレスの確認が完了していません'
      case 'User already registered':
        return 'このメールアドレスは既に登録されています'
      case 'Password should be at least 6 characters':
        return 'パスワードは6文字以上で入力してください'
      case 'Unable to validate email address: invalid format':
        return 'メールアドレスの形式が正しくありません'
      default:
        return error.message || '認証エラーが発生しました'
    }
  }

  // 現在のセッション状態を取得
  getSessionState(): SessionState {
    return { ...this.sessionState }
  }

  // セッションの有効性チェック
  isSessionValid(): boolean {
    if (!this.sessionState.isAuthenticated || !this.sessionState.sessionExpiry) {
      return false
    }

    return new Date() < this.sessionState.sessionExpiry
  }

  // クリーンアップ
  destroy(): void {
    this.clearTimers()

    // イベントリスナーを削除
    if (typeof window !== 'undefined') {
      SESSION_CONFIG.activityEvents.forEach(eventType => {
        window.removeEventListener(eventType, this.handleUserActivity.bind(this))
      })
    }

    this.listeners.clear()
    this.isInitialized = false
  }
}

// シングルトンインスタンス
export const authSessionManager = AuthSessionManager.getInstance()

// 初期化用のヘルパー関数
export async function initializeAuth(): Promise<void> {
  await authSessionManager.initialize()
}

import React from 'react'

// React Hook用のヘルパー
export function useAuthSession() {
  const [sessionState, setSessionState] = React.useState(authSessionManager.getSessionState())

  React.useEffect(() => {
    const handleStateChange = () => {
      setSessionState(authSessionManager.getSessionState())
    }

    // 全ての認証イベントを監視
    Object.values(AuthEventType).forEach(eventType => {
      authSessionManager.addEventListener(eventType, handleStateChange)
    })

    // セッション警告イベントも監視
    authSessionManager.addEventListener('session_warning', handleStateChange)

    return () => {
      Object.values(AuthEventType).forEach(eventType => {
        authSessionManager.removeEventListener(eventType, handleStateChange)
      })
      authSessionManager.removeEventListener('session_warning', handleStateChange)
    }
  }, [])

  return {
    ...sessionState,
    signIn: authSessionManager.signIn.bind(authSessionManager),
    signUp: authSessionManager.signUp.bind(authSessionManager),
    signOut: authSessionManager.signOut.bind(authSessionManager),
    resetPassword: authSessionManager.resetPassword.bind(authSessionManager),
    refreshToken: authSessionManager.refreshToken.bind(authSessionManager),
    isSessionValid: authSessionManager.isSessionValid.bind(authSessionManager)
  }
}