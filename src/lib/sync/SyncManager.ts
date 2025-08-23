/**
 * データ同期マネージャー
 * ローカルとクラウド間でのデータ同期を管理
 */

import type { 
  UnifiedSaveData, 
  SyncResult, 
  DataConflict,
  UnifiedDataConfig 
} from '../unified-data/types'
import type { GameData } from '../game-state/types'

export interface SyncProvider {
  name: string
  isAvailable(): Promise<boolean>
  upload(data: UnifiedSaveData): Promise<SyncUploadResult>
  download(): Promise<SyncDownloadResult>
  delete(id: string): Promise<boolean>
  listSaves(): Promise<CloudSaveInfo[]>
}

export interface SyncUploadResult {
  success: boolean
  cloudId: string
  timestamp: string
  error?: string
}

export interface SyncDownloadResult {
  success: boolean
  data?: UnifiedSaveData
  timestamp?: string
  error?: string
}

export interface CloudSaveInfo {
  id: string
  timestamp: string
  size: number
  checksum: string
  metadata: {
    playerName: string
    level: number
    playtime: number
  }
}

export interface SyncConflictResolver {
  resolve(conflicts: DataConflict[]): Promise<DataConflict[]>
}

/**
 * デフォルト同期プロバイダー (LocalStorage ベース)
 */
export class LocalStorageSyncProvider implements SyncProvider {
  name = 'LocalStorage'
  private storageKey = 'tokiwa-cloud-saves'
  
  async isAvailable(): Promise<boolean> {
    try {
      localStorage.setItem('test', 'test')
      localStorage.removeItem('test')
      return true
    } catch {
      return false
    }
  }
  
  async upload(data: UnifiedSaveData): Promise<SyncUploadResult> {
    try {
      const cloudId = `cloud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const timestamp = new Date().toISOString()
      
      const cloudSave = {
        id: cloudId,
        data,
        timestamp,
        checksum: this.calculateChecksum(JSON.stringify(data))
      }
      
      const existing = this.getCloudSaves()
      existing[cloudId] = cloudSave
      
      // 古いセーブを削除（最大10個まで保持）
      const saves = Object.values(existing).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      
      if (saves.length > 10) {
        const toDelete = saves.slice(10)
        toDelete.forEach(save => delete existing[save.id])
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(existing))
      
      console.log('☁️ クラウドセーブ完了:', {
        cloudId,
        size: `${(JSON.stringify(data).length / 1024).toFixed(1)}KB`,
        timestamp
      })
      
      return {
        success: true,
        cloudId,
        timestamp
      }
    } catch (error) {
      console.error('❌ クラウドセーブエラー:', error)
      return {
        success: false,
        cloudId: '',
        timestamp: '',
        error: String(error)
      }
    }
  }
  
  async download(): Promise<SyncDownloadResult> {
    try {
      const saves = this.getCloudSaves()
      const savesList = Object.values(saves).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      
      if (savesList.length === 0) {
        return {
          success: false,
          error: 'クラウドセーブが見つかりません'
        }
      }
      
      const latest = savesList[0]
      
      console.log('☁️ クラウドロード完了:', {
        id: latest.id,
        timestamp: latest.timestamp,
        checksum: latest.checksum.substring(0, 8)
      })
      
      return {
        success: true,
        data: latest.data,
        timestamp: latest.timestamp
      }
    } catch (error) {
      console.error('❌ クラウドロードエラー:', error)
      return {
        success: false,
        error: String(error)
      }
    }
  }
  
  async delete(id: string): Promise<boolean> {
    try {
      const existing = this.getCloudSaves()
      delete existing[id]
      localStorage.setItem(this.storageKey, JSON.stringify(existing))
      return true
    } catch {
      return false
    }
  }
  
  async listSaves(): Promise<CloudSaveInfo[]> {
    try {
      const saves = this.getCloudSaves()
      return Object.values(saves).map(save => ({
        id: save.id,
        timestamp: save.timestamp,
        size: JSON.stringify(save.data).length,
        checksum: save.checksum,
        metadata: {
          playerName: save.data.gameData.player.name,
          level: save.data.gameData.player.level,
          playtime: save.data.gameData.statistics.totalPlayTime
        }
      })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    } catch {
      return []
    }
  }
  
  private getCloudSaves(): Record<string, any> {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  }
  
  private calculateChecksum(data: string): string {
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(16)
  }
}

/**
 * 自動競合解決機
 */
export class AutoConflictResolver implements SyncConflictResolver {
  constructor(private strategy: 'local_wins' | 'cloud_wins' | 'newest_wins' = 'newest_wins') {}
  
  async resolve(conflicts: DataConflict[]): Promise<DataConflict[]> {
    return conflicts.map(conflict => {
      let resolution: DataConflict['resolution']
      
      switch (this.strategy) {
        case 'local_wins':
          resolution = 'use_local'
          break
        case 'cloud_wins':
          resolution = 'use_cloud'
          break
        case 'newest_wins':
          const localTime = new Date(conflict.timestamp.local).getTime()
          const cloudTime = new Date(conflict.timestamp.cloud).getTime()
          resolution = localTime > cloudTime ? 'use_local' : 'use_cloud'
          break
        default:
          resolution = 'use_local'
      }
      
      return { ...conflict, resolution }
    })
  }
}

/**
 * メイン同期マネージャー
 */
export class SyncManager {
  private providers: Map<string, SyncProvider> = new Map()
  private activeProvider: SyncProvider | null = null
  private conflictResolver: SyncConflictResolver
  private syncInProgress = false
  
  constructor(
    private config: UnifiedDataConfig['sync'],
    conflictResolver?: SyncConflictResolver
  ) {
    this.conflictResolver = conflictResolver || new AutoConflictResolver(
      config.conflictResolution === 'manual' ? 'newest_wins' : 'newest_wins'
    )
    
    // デフォルトプロバイダーを登録
    this.registerProvider(new LocalStorageSyncProvider())
    
    console.log('🔄 同期マネージャー初期化完了')
  }
  
  /**
   * 同期プロバイダーを登録
   */
  registerProvider(provider: SyncProvider): void {
    this.providers.set(provider.name, provider)
    
    if (!this.activeProvider) {
      this.activeProvider = provider
    }
    
    console.log('📡 同期プロバイダー登録:', provider.name)
  }
  
  /**
   * アクティブなプロバイダーを設定
   */
  async setActiveProvider(name: string): Promise<boolean> {
    const provider = this.providers.get(name)
    if (!provider) {
      console.error('❌ 未知の同期プロバイダー:', name)
      return false
    }
    
    const available = await provider.isAvailable()
    if (!available) {
      console.error('❌ 同期プロバイダーが利用不可:', name)
      return false
    }
    
    this.activeProvider = provider
    console.log('✅ 同期プロバイダー切り替え:', name)
    return true
  }
  
  /**
   * ローカルデータをクラウドに同期
   */
  async syncToCloud(localData: UnifiedSaveData): Promise<SyncResult> {
    if (this.syncInProgress) {
      return {
        success: false,
        conflicts: [],
        resolvedChanges: 0,
        error: '同期処理が既に実行中です'
      }
    }
    
    if (!this.activeProvider) {
      return {
        success: false,
        conflicts: [],
        resolvedChanges: 0,
        error: 'アクティブな同期プロバイダーがありません'
      }
    }
    
    this.syncInProgress = true
    
    try {
      console.log('☁️⬆️ クラウド同期開始 (アップロード)')
      
      // 現在のクラウドデータを取得
      const downloadResult = await this.activeProvider.download()
      
      if (downloadResult.success && downloadResult.data) {
        // 競合検出
        const conflicts = this.detectConflicts(localData, downloadResult.data)
        
        if (conflicts.length > 0) {
          console.log('⚠️ データ競合を検出:', conflicts.length)
          
          // 競合解決
          const resolvedConflicts = await this.conflictResolver.resolve(conflicts)
          const mergedData = this.mergeData(localData, downloadResult.data, resolvedConflicts)
          
          // マージされたデータをアップロード
          const uploadResult = await this.activeProvider.upload(mergedData)
          
          return {
            success: uploadResult.success,
            conflicts: resolvedConflicts,
            resolvedChanges: resolvedConflicts.length,
            error: uploadResult.error
          }
        }
      }
      
      // 競合がない場合は単純アップロード
      const uploadResult = await this.activeProvider.upload(localData)
      
      return {
        success: uploadResult.success,
        conflicts: [],
        resolvedChanges: 0,
        error: uploadResult.error
      }
    } catch (error) {
      console.error('❌ クラウド同期エラー:', error)
      return {
        success: false,
        conflicts: [],
        resolvedChanges: 0,
        error: String(error)
      }
    } finally {
      this.syncInProgress = false
    }
  }
  
  /**
   * クラウドからローカルに同期
   */
  async syncFromCloud(): Promise<SyncResult> {
    if (this.syncInProgress) {
      return {
        success: false,
        conflicts: [],
        resolvedChanges: 0,
        error: '同期処理が既に実行中です'
      }
    }
    
    if (!this.activeProvider) {
      return {
        success: false,
        conflicts: [],
        resolvedChanges: 0,
        error: 'アクティブな同期プロバイダーがありません'
      }
    }
    
    this.syncInProgress = true
    
    try {
      console.log('☁️⬇️ クラウド同期開始 (ダウンロード)')
      
      const downloadResult = await this.activeProvider.download()
      
      if (!downloadResult.success || !downloadResult.data) {
        return {
          success: false,
          conflicts: [],
          resolvedChanges: 0,
          error: downloadResult.error || 'クラウドデータの取得に失敗'
        }
      }
      
      return {
        success: true,
        conflicts: [],
        resolvedChanges: 1,
        error: undefined
      }
    } catch (error) {
      console.error('❌ クラウド同期エラー:', error)
      return {
        success: false,
        conflicts: [],
        resolvedChanges: 0,
        error: String(error)
      }
    } finally {
      this.syncInProgress = false
    }
  }
  
  /**
   * 利用可能なクラウドセーブを一覧
   */
  async listCloudSaves(): Promise<CloudSaveInfo[]> {
    if (!this.activeProvider) {
      return []
    }
    
    try {
      return await this.activeProvider.listSaves()
    } catch (error) {
      console.error('❌ クラウドセーブ一覧取得エラー:', error)
      return []
    }
  }
  
  /**
   * クラウドセーブを削除
   */
  async deleteCloudSave(id: string): Promise<boolean> {
    if (!this.activeProvider) {
      return false
    }
    
    try {
      return await this.activeProvider.delete(id)
    } catch (error) {
      console.error('❌ クラウドセーブ削除エラー:', error)
      return false
    }
  }
  
  /**
   * 同期状態を取得
   */
  getSyncStatus(): {
    enabled: boolean
    activeProvider: string | null
    inProgress: boolean
    availableProviders: string[]
  } {
    return {
      enabled: this.config.enabled,
      activeProvider: this.activeProvider?.name || null,
      inProgress: this.syncInProgress,
      availableProviders: Array.from(this.providers.keys())
    }
  }
  
  // =================== プライベートメソッド ===================
  
  /**
   * データ競合を検出
   */
  private detectConflicts(localData: UnifiedSaveData, cloudData: UnifiedSaveData): DataConflict[] {
    const conflicts: DataConflict[] = []
    
    // プレイヤーデータの競合チェック
    if (localData.gameData.player.money !== cloudData.gameData.player.money) {
      conflicts.push({
        field: 'player.money',
        localValue: localData.gameData.player.money,
        cloudValue: cloudData.gameData.player.money,
        timestamp: {
          local: localData.lastSaved,
          cloud: cloudData.lastSaved
        }
      })
    }
    
    if (localData.gameData.player.level !== cloudData.gameData.player.level) {
      conflicts.push({
        field: 'player.level',
        localValue: localData.gameData.player.level,
        cloudValue: cloudData.gameData.player.level,
        timestamp: {
          local: localData.lastSaved,
          cloud: cloudData.lastSaved
        }
      })
    }
    
    // 統計データの競合チェック
    const localStats = localData.gameData.statistics
    const cloudStats = cloudData.gameData.statistics
    
    if (localStats.totalExpeditions !== cloudStats.totalExpeditions) {
      conflicts.push({
        field: 'statistics.totalExpeditions',
        localValue: localStats.totalExpeditions,
        cloudValue: cloudStats.totalExpeditions,
        timestamp: {
          local: localData.lastSaved,
          cloud: cloudData.lastSaved
        }
      })
    }
    
    return conflicts
  }
  
  /**
   * 競合解決後のデータマージ
   */
  private mergeData(
    localData: UnifiedSaveData, 
    cloudData: UnifiedSaveData, 
    resolvedConflicts: DataConflict[]
  ): UnifiedSaveData {
    const merged = JSON.parse(JSON.stringify(localData)) // ディープコピー
    
    resolvedConflicts.forEach(conflict => {
      if (conflict.resolution === 'use_cloud') {
        this.setNestedValue(merged.gameData, conflict.field, conflict.cloudValue)
      } else if (conflict.resolution === 'merge') {
        // 数値の場合は最大値を使用
        if (typeof conflict.localValue === 'number' && typeof conflict.cloudValue === 'number') {
          this.setNestedValue(merged.gameData, conflict.field, Math.max(conflict.localValue, conflict.cloudValue))
        }
      }
      // 'use_local' の場合は何もしない（ローカル値を保持）
    })
    
    // マージ後のメタデータ更新
    merged.lastSaved = new Date().toISOString()
    merged.syncStatus.lastCloudSync = new Date().toISOString()
    merged.syncStatus.pendingChanges = 0
    
    return merged
  }
  
  /**
   * ネストされたオブジェクトの値を設定
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    let current = obj
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {}
      }
      current = current[keys[i]]
    }
    
    current[keys[keys.length - 1]] = value
  }
}

// ファクトリー関数
export const createSyncManager = (config: UnifiedDataConfig['sync']): SyncManager => {
  return new SyncManager(config)
}