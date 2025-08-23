/**
 * 統合データマネージャーの型定義
 * 静的データと動的データを統合管理するためのインターフェース
 */

import type { GameData } from '../game-state/types'
import type { StaticDataDB } from '../static-data/types'

// 統合セーブデータ構造
export interface UnifiedSaveData {
  // メタデータ
  version: string
  userId: string
  createdAt: string
  lastSaved: string
  lastValidated: string
  
  // 動的ゲームデータ
  gameData: GameData
  
  // 静的データのバージョン管理
  staticDataVersion: string
  staticDataChecksum: string
  
  // データ整合性
  dataIntegrity: {
    isValid: boolean
    lastCheck: string
    validationErrors: ValidationError[]
    autoRepairAttempts: number
  }
  
  // 同期状態
  syncStatus: {
    cloudSyncEnabled: boolean
    lastCloudSync?: string
    pendingChanges: number
    conflictResolution: 'local_wins' | 'cloud_wins' | 'manual'
  }
  
  // パフォーマンス情報
  performance: {
    saveSize: number
    compressionRatio: number
    lastSaveTime: number
    averageSaveTime: number
  }
}

// データ検証エラー
export interface ValidationError {
  type: 'missing_data' | 'invalid_reference' | 'corrupted_data' | 'version_mismatch'
  severity: 'warning' | 'error' | 'critical'
  message: string
  location: string
  autoFixable: boolean
  suggestedFix?: string
}

// データ同期結果
export interface SyncResult {
  success: boolean
  conflicts: DataConflict[]
  resolvedChanges: number
  error?: string
}

// データ競合
export interface DataConflict {
  field: string
  localValue: any
  cloudValue: any
  timestamp: {
    local: string
    cloud: string
  }
  resolution?: 'use_local' | 'use_cloud' | 'merge' | 'manual'
}

// バックアップデータ
export interface BackupData {
  id: string
  timestamp: string
  data: UnifiedSaveData
  type: 'auto' | 'manual' | 'pre_update'
  size: number
  compressed: boolean
}

// データマイグレーション情報
export interface MigrationInfo {
  fromVersion: string
  toVersion: string
  appliedMigrations: string[]
  migrationLog: MigrationLogEntry[]
}

export interface MigrationLogEntry {
  migrationId: string
  timestamp: string
  success: boolean
  changes: string[]
  error?: string
}

// 統合データ操作インターフェース
export interface UnifiedDataOperations {
  // 基本操作
  save(): Promise<boolean>
  load(): Promise<UnifiedSaveData | null>
  validate(): Promise<ValidationResult>
  repair(): Promise<RepairResult>
  
  // バックアップ操作
  createBackup(type: BackupData['type']): Promise<string>
  restoreBackup(backupId: string): Promise<boolean>
  listBackups(): Promise<BackupData[]>
  cleanupBackups(): Promise<number>
  
  // 同期操作
  syncToCloud(): Promise<SyncResult>
  syncFromCloud(): Promise<SyncResult>
  resolveConflicts(conflicts: DataConflict[]): Promise<boolean>
  
  // マイグレーション
  migrateData(targetVersion: string): Promise<MigrationResult>
  checkMigrationRequired(): boolean
  
  // 統計・分析
  getDataStatistics(): DataStatistics
  getPerformanceMetrics(): PerformanceMetrics
}

// 検証結果
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  repairSuggestions: RepairSuggestion[]
  validationTime: number
}

// 修復結果
export interface RepairResult {
  success: boolean
  fixedErrors: number
  remainingErrors: ValidationError[]
  changes: string[]
  backupCreated: boolean
  backupId?: string
}

// 修復提案
export interface RepairSuggestion {
  errorType: ValidationError['type']
  description: string
  autoFixable: boolean
  riskLevel: 'low' | 'medium' | 'high'
  action: string
}

// マイグレーション結果
export interface MigrationResult {
  success: boolean
  fromVersion: string
  toVersion: string
  appliedMigrations: string[]
  backupCreated: boolean
  backupId?: string
  error?: string
}

// データ統計
export interface DataStatistics {
  totalSize: number
  gameDataSize: number
  staticDataSize: number
  compressionRatio: number
  
  counts: {
    trainers: number
    pokemon: number
    expeditions: number
    transactions: number
    facilities: number
  }
  
  integrity: {
    validReferences: number
    invalidReferences: number
    missingData: number
  }
  
  performance: {
    averageLoadTime: number
    averageSaveTime: number
    cacheHitRate: number
  }
}

// パフォーマンス指標
export interface PerformanceMetrics {
  operations: {
    save: { count: number; totalTime: number; averageTime: number }
    load: { count: number; totalTime: number; averageTime: number }
    validate: { count: number; totalTime: number; averageTime: number }
    sync: { count: number; totalTime: number; averageTime: number }
  }
  
  memory: {
    heapUsed: number
    heapTotal: number
    external: number
  }
  
  storage: {
    totalSize: number
    compressionRatio: number
    fragmentationRatio: number
  }
}

// 設定オプション
export interface UnifiedDataConfig {
  // 自動保存設定
  autoSave: {
    enabled: boolean
    interval: number // minutes
    onDataChange: boolean
    onUserAction: boolean
  }
  
  // バックアップ設定
  backup: {
    enabled: boolean
    maxBackups: number
    autoBackupInterval: number // hours
    compressBackups: boolean
  }
  
  // 同期設定
  sync: {
    enabled: boolean
    autoSync: boolean
    syncInterval: number // minutes
    conflictResolution: DataConflict['resolution']
  }
  
  // 検証設定
  validation: {
    enabled: boolean
    autoValidate: boolean
    validationInterval: number // minutes
    autoRepair: boolean
  }
  
  // パフォーマンス設定
  performance: {
    enableCompression: boolean
    enableCaching: boolean
    cacheSize: number // MB
    lazyLoading: boolean
  }
}

// キャッシュ情報
export interface CacheInfo {
  key: string
  data: any
  timestamp: string
  accessCount: number
  lastAccess: string
  size: number
  ttl?: number
}

// データアクセスログ
export interface DataAccessLog {
  operation: 'read' | 'write' | 'validate' | 'sync' | 'backup'
  target: string
  timestamp: string
  duration: number
  success: boolean
  error?: string
  metadata?: Record<string, any>
}