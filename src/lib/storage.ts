// ローカルストレージ管理ユーティリティ

// データの型安全性を保つための型定義
type StorageKey = 
  | 'tokiwa-settings'
  | 'tokiwa-ui'
  | 'tokiwa-cache'
  | 'tokiwa-user-preferences'
  | 'tokiwa-game-state'

interface StorageData {
  'tokiwa-settings': {
    autoSave: boolean
    realTimeUpdates: boolean
    notifications: boolean
    difficulty: 'easy' | 'normal' | 'hard' | 'expert'
  }
  'tokiwa-ui': {
    isDarkMode: boolean
    soundEnabled: boolean
    currentPage: string
    sidebarCollapsed: boolean
  }
  'tokiwa-cache': {
    pokemonCache: Record<string, any>
    lastCacheTime: number
  }
  'tokiwa-user-preferences': {
    favoritePokemons: string[]
    preferredView: 'grid' | 'list'
    notificationSettings: Record<string, boolean>
  }
  'tokiwa-game-state': {
    lastSaveTime: number
    quickSaveData: any
  }
}

// ローカルストレージの操作クラス
class StorageManager {
  // データ保存
  setItem<K extends StorageKey>(key: K, data: StorageData[K]): boolean {
    try {
      const serialized = JSON.stringify({
        data,
        timestamp: new Date().toISOString(),
        version: '1.0'
      })
      localStorage.setItem(key, serialized)
      return true
    } catch (error) {
      console.error(`ストレージ保存エラー (${key}):`, error)
      return false
    }
  }

  // データ取得
  getItem<K extends StorageKey>(key: K): StorageData[K] | null {
    try {
      const item = localStorage.getItem(key)
      if (!item) return null

      const parsed = JSON.parse(item)
      
      // データ形式チェック
      if (!parsed.data || !parsed.timestamp) {
        console.warn(`不正なストレージデータ形式 (${key})`)
        return null
      }

      // データ有効期限チェック (7日間)
      const timestamp = new Date(parsed.timestamp)
      const now = new Date()
      const daysDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysDiff > 7) {
        console.warn(`期限切れのストレージデータ (${key})`)
        this.removeItem(key)
        return null
      }

      return parsed.data
    } catch (error) {
      console.error(`ストレージ取得エラー (${key}):`, error)
      return null
    }
  }

  // データ削除
  removeItem(key: StorageKey): boolean {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`ストレージ削除エラー (${key}):`, error)
      return false
    }
  }

  // 全データクリア
  clear(): boolean {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('tokiwa-'))
      keys.forEach(key => localStorage.removeItem(key))
      return true
    } catch (error) {
      console.error('ストレージクリアエラー:', error)
      return false
    }
  }

  // ストレージ使用量確認
  getUsage(): { used: number; total: number; percentage: number } {
    try {
      let used = 0
      for (let key in localStorage) {
        if (key.startsWith('tokiwa-')) {
          used += localStorage.getItem(key)?.length || 0
        }
      }

      // 推定値（実際の制限は約5-10MB）
      const total = 5 * 1024 * 1024 // 5MB
      const percentage = (used / total) * 100

      return { used, total, percentage }
    } catch (error) {
      console.error('ストレージ使用量取得エラー:', error)
      return { used: 0, total: 0, percentage: 0 }
    }
  }

  // データ整合性チェック
  validateData(): { valid: boolean; issues: string[] } {
    const issues: string[] = []
    let valid = true

    try {
      // 設定データチェック
      const settings = this.getItem('tokiwa-settings')
      if (settings) {
        if (typeof settings.autoSave !== 'boolean') {
          issues.push('設定データの自動保存フラグが無効')
          valid = false
        }
        if (!['easy', 'normal', 'hard', 'expert'].includes(settings.difficulty)) {
          issues.push('設定データの難易度が無効')
          valid = false
        }
      }

      // UIデータチェック
      const ui = this.getItem('tokiwa-ui')
      if (ui) {
        if (typeof ui.isDarkMode !== 'boolean') {
          issues.push('UIデータのダークモードフラグが無効')
          valid = false
        }
      }

      // キャッシュデータチェック
      const cache = this.getItem('tokiwa-cache')
      if (cache) {
        if (typeof cache.lastCacheTime !== 'number') {
          issues.push('キャッシュデータの時刻が無効')
          valid = false
        }
      }

    } catch (error) {
      issues.push(`データ検証エラー: ${error}`)
      valid = false
    }

    return { valid, issues }
  }

  // データマイグレーション（将来のバージョンアップ用）
  migrate(): boolean {
    try {
      // 現在は v1.0 のみなのでマイグレーション不要
      return true
    } catch (error) {
      console.error('データマイグレーションエラー:', error)
      return false
    }
  }

  // バックアップ作成
  createBackup(): string | null {
    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: {
          settings: this.getItem('tokiwa-settings'),
          ui: this.getItem('tokiwa-ui'),
          preferences: this.getItem('tokiwa-user-preferences')
        }
      }

      return JSON.stringify(backupData)
    } catch (error) {
      console.error('バックアップ作成エラー:', error)
      return null
    }
  }

  // バックアップ復元
  restoreBackup(backupString: string): boolean {
    try {
      const backup = JSON.parse(backupString)
      
      if (!backup.data || !backup.timestamp) {
        console.error('無効なバックアップ形式')
        return false
      }

      // データ復元
      if (backup.data.settings) {
        this.setItem('tokiwa-settings', backup.data.settings)
      }
      if (backup.data.ui) {
        this.setItem('tokiwa-ui', backup.data.ui)
      }
      if (backup.data.preferences) {
        this.setItem('tokiwa-user-preferences', backup.data.preferences)
      }

      return true
    } catch (error) {
      console.error('バックアップ復元エラー:', error)
      return false
    }
  }
}

// シングルトンインスタンス
export const storage = new StorageManager()

// サーバーサイドとクライアントサイドの両方で安全に動作するlocalStorageユーティリティ
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`localStorage.getItem(${key}) failed:`, error);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn(`localStorage.setItem(${key}) failed:`, error);
    }
  },

  removeItem: (key: string): void => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`localStorage.removeItem(${key}) failed:`, error);
    }
  },

  clear: (): void => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.clear();
    } catch (error) {
      console.warn('localStorage.clear() failed:', error);
    }
  },

  key: (index: number): string | null => {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      return localStorage.key(index);
    } catch (error) {
      console.warn(`localStorage.key(${index}) failed:`, error);
      return null;
    }
  },

  get length(): number {
    if (typeof window === 'undefined') {
      return 0;
    }
    try {
      return localStorage.length;
    } catch (error) {
      console.warn('localStorage.length failed:', error);
      return 0;
    }
  },

  // 特定のプレフィックスを持つキーのみを取得
  getKeysWithPrefix: (prefix: string): string[] => {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.push(key);
        }
      }
      return keys;
    } catch (error) {
      console.warn(`getKeysWithPrefix(${prefix}) failed:`, error);
      return [];
    }
  },

  // 特定のプレフィックスを持つキーのみを削除
  removeKeysWithPrefix: (prefix: string): void => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const keys = safeLocalStorage.getKeysWithPrefix(prefix);
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn(`removeKeysWithPrefix(${prefix}) failed:`, error);
    }
  }
};

// React Hook
import { useEffect, useState } from 'react'

export function useLocalStorage<K extends StorageKey>(
  key: K,
  defaultValue: StorageData[K]
): [StorageData[K], (value: StorageData[K]) => void] {
  const [value, setValue] = useState<StorageData[K]>(defaultValue)

  useEffect(() => {
    const stored = storage.getItem(key)
    if (stored !== null) {
      setValue(stored)
    }
  }, [key])

  const setStoredValue = (newValue: StorageData[K]) => {
    setValue(newValue)
    storage.setItem(key, newValue)
  }

  return [value, setStoredValue]
}

// ストレージ監視Hook
export function useStorageWatch(keys: StorageKey[]): Record<StorageKey, any> {
  const [values, setValues] = useState<Record<StorageKey, any>>({} as Record<StorageKey, any>)

  useEffect(() => {
    const updateValues = () => {
      const newValues = {} as Record<StorageKey, any>
      keys.forEach(key => {
        newValues[key] = storage.getItem(key)
      })
      setValues(newValues)
    }

    // 初期値設定
    updateValues()

    // ストレージ変更監視
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key && keys.includes(event.key as StorageKey)) {
        updateValues()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [keys])

  return values
}