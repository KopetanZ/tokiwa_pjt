// 設定管理の実際のデータベース統合
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

// 設定の型定義
export interface UserSettings {
  audio_effects: boolean
  animations: boolean
  notifications: boolean
  ui_theme: 'gameboy_green' | 'gameboy_classic' | 'gameboy_blue' | 'dark' | 'light'
  auto_save: boolean
  sound_volume: number
  notification_frequency: 'high' | 'medium' | 'low' | 'none'
  expedition_alerts: boolean
  pokemon_care_reminders: boolean
  economic_notifications: boolean
  language: 'ja' | 'en'
}

// デフォルト設定
export const DEFAULT_SETTINGS: UserSettings = {
  audio_effects: true,
  animations: true,
  notifications: true,
  ui_theme: 'gameboy_green',
  auto_save: true,
  sound_volume: 50,
  notification_frequency: 'medium',
  expedition_alerts: true,
  pokemon_care_reminders: true,
  economic_notifications: true,
  language: 'ja'
}

// localStorageキー
const SETTINGS_STORAGE_KEY = 'tokiwa-game-settings'

// 設定をデータベースから取得
export async function getUserSettings(user: User): Promise<UserSettings> {
  try {
    if (!supabase) {
      return DEFAULT_SETTINGS
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('trainer_name, school_name, current_money, total_reputation')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('設定取得エラー:', error)
      return getLocalSettings()
    }

    if (data) {
      // プロファイルテーブルは基本情報のみを格納（設定はlocalStorageベース）
      const dbSettings = {
        ...DEFAULT_SETTINGS,
        // trainer_name, school_nameなどは基本情報として扱う
      }
      
      // localStorageにも同期保存
      saveLocalSettings(dbSettings)
      return dbSettings
    }

    return getLocalSettings()
  } catch (error) {
    console.error('設定取得エラー:', error)
    return getLocalSettings()
  }
}

// 設定をデータベースに保存
export async function saveUserSettings(
  user: User, 
  settings: UserSettings
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Database connection not available' }
    }
    const { error } = await supabase
      .from('profiles')
      .update({
        trainer_name: settings.trainer_name || 'トレーナー',
        school_name: settings.school_name || 'ポケモンスクール',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) {
      console.error('設定保存エラー:', error)
      // データベース保存に失敗した場合はlocalStorageのみに保存
      saveLocalSettings(settings)
      return { success: false, error: error.message }
    }

    // 成功時はlocalStorageにも同期保存
    saveLocalSettings(settings)
    return { success: true }
    
  } catch (error) {
    console.error('設定保存エラー:', error)
    saveLocalSettings(settings)
    return { success: false, error: (error as Error).message }
  }
}

// localStorageから設定を取得
export function getLocalSettings(): UserSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        ...DEFAULT_SETTINGS,
        ...parsed
      }
    }
  } catch (error) {
    console.error('ローカル設定取得エラー:', error)
  }
  
  return DEFAULT_SETTINGS
}

// localStorageに設定を保存
export function saveLocalSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('ローカル設定保存エラー:', error)
  }
}

// 設定の初期化（ユーザー作成時）
export async function initializeUserSettings(user: User): Promise<boolean> {
  try {
    if (!supabase) {
      return false
    }
    const { error } = await supabase
      .from('profiles')
      .update({
        trainer_name: 'トレーナー',
        school_name: 'ポケモンスクール'
      })
      .eq('id', user.id)

    if (error) {
      console.error('設定初期化エラー:', error)
      return false
    }

    saveLocalSettings(DEFAULT_SETTINGS)
    return true
    
  } catch (error) {
    console.error('設定初期化エラー:', error)
    return false
  }
}

// 設定の統合管理クラス
export class SettingsManager {
  private user: User | null = null
  private settings: UserSettings = DEFAULT_SETTINGS
  private isMockMode: boolean = false
  
  constructor(user: User | null, isMockMode: boolean = false) {
    this.user = user
    this.isMockMode = isMockMode
  }

  // 設定を読み込み
  async loadSettings(): Promise<UserSettings> {
    if (this.isMockMode || !this.user) {
      this.settings = getLocalSettings()
      return this.settings
    }

    this.settings = await getUserSettings(this.user)
    return this.settings
  }

  // 設定を保存
  async saveSettings(newSettings: UserSettings): Promise<{ success: boolean; error?: string }> {
    this.settings = newSettings
    
    if (this.isMockMode || !this.user) {
      saveLocalSettings(newSettings)
      return { success: true }
    }

    return await saveUserSettings(this.user, newSettings)
  }

  // 個別設定を更新
  async updateSetting<K extends keyof UserSettings>(
    key: K, 
    value: UserSettings[K]
  ): Promise<{ success: boolean; error?: string }> {
    const updatedSettings = {
      ...this.settings,
      [key]: value
    }
    
    return await this.saveSettings(updatedSettings)
  }

  // 現在の設定を取得
  getCurrentSettings(): UserSettings {
    return { ...this.settings }
  }

  // 設定をデフォルトにリセット
  async resetToDefaults(): Promise<{ success: boolean; error?: string }> {
    return await this.saveSettings(DEFAULT_SETTINGS)
  }

  // 設定の検証
  validateSettings(settings: any): settings is UserSettings {
    if (!settings || typeof settings !== 'object') return false
    
    const requiredKeys = Object.keys(DEFAULT_SETTINGS) as (keyof UserSettings)[]
    return requiredKeys.every(key => key in settings)
  }

  // バックアップデータの生成
  generateBackupData(): any {
    return {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      user: {
        id: this.user?.id,
        email: this.user?.email
      },
      settings: this.settings,
      localStorage: {
        [SETTINGS_STORAGE_KEY]: localStorage.getItem(SETTINGS_STORAGE_KEY)
      }
    }
  }

  // バックアップからの復元
  async restoreFromBackup(backupData: any): Promise<{ success: boolean; error?: string }> {
    try {
      if (!backupData.settings) {
        return { success: false, error: 'バックアップデータに設定情報が含まれていません' }
      }

      if (!this.validateSettings(backupData.settings)) {
        return { success: false, error: '設定データが無効です' }
      }

      return await this.saveSettings(backupData.settings)
      
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }
}