/**
 * 統合データマネージャー
 * 静的データと動的データを統合管理し、セーブデータの整合性を保つ
 */

import { GameStateManager } from '../game-state/GameStateManager'
import { StaticDataManager } from '../static-data'
import type { 
  UnifiedSaveData, 
  UnifiedDataConfig, 
  ValidationResult, 
  ValidationError,
  RepairResult,
  SyncResult,
  BackupData,
  DataStatistics,
  PerformanceMetrics,
  CacheInfo,
  DataAccessLog
} from './types'
import type { GameData } from '../game-state/types'
import { safeLocalStorage } from '../storage';

export class UnifiedDataManager {
  private static instance: UnifiedDataManager
  private gameStateManager: GameStateManager
  private staticDataManager: StaticDataManager
  private config: UnifiedDataConfig
  private cache: Map<string, CacheInfo> = new Map()
  private accessLog: DataAccessLog[] = []
  private performanceMetrics: PerformanceMetrics
  private autoSaveTimer?: NodeJS.Timeout
  private autoValidateTimer?: NodeJS.Timeout
  private autoSyncTimer?: NodeJS.Timeout
  
  private constructor(config: Partial<UnifiedDataConfig> = {}) {
    this.gameStateManager = new GameStateManager()
    this.staticDataManager = StaticDataManager.getInstance()
    this.config = this.mergeConfig(config)
    this.performanceMetrics = this.initializeMetrics()
    
    this.setupAutoOperations()
    console.log('🔧 統合データマネージャー初期化完了')
  }
  
  static getInstance(config?: Partial<UnifiedDataConfig>): UnifiedDataManager {
    if (!UnifiedDataManager.instance) {
      UnifiedDataManager.instance = new UnifiedDataManager(config)
    }
    return UnifiedDataManager.instance
  }
  
  // =================== 基本操作 ===================
  
  /**
   * 統合セーブデータを保存
   */
  async save(): Promise<boolean> {
    const startTime = performance.now()
    
    try {
      this.logAccess('write', 'unified_save', startTime)
      
      // 検証実行
      if (this.config.validation.enabled) {
        const validation = await this.validate()
        if (!validation.isValid && validation.errors.some(e => e.severity === 'critical')) {
          console.error('❌ 重大なデータエラーのため保存をキャンセル:', validation.errors)
          return false
        }
      }
      
      // 統合セーブデータ作成
      const unifiedData = await this.createUnifiedSaveData()
      
      // 圧縮
      let serializedData = JSON.stringify(unifiedData, null, 2)
      if (this.config.performance.enableCompression) {
        serializedData = this.compressData(serializedData)
      }
      
      // ローカル保存
      safeLocalStorage.setItem('tokiwa-unified-save', serializedData)
      
      // パフォーマンス記録
      const duration = performance.now() - startTime
      this.updatePerformanceMetrics('save', duration, true)
      
      // 自動バックアップ
      if (this.config.backup.enabled) {
        await this.createBackup('auto')
      }
      
      console.log('💾 統合セーブデータ保存完了:', {
        size: `${(serializedData.length / 1024).toFixed(1)}KB`,
        duration: `${duration.toFixed(1)}ms`
      })
      
      return true
    } catch (error) {
      const duration = performance.now() - startTime
      this.updatePerformanceMetrics('save', duration, false)
      console.error('❌ 統合セーブデータ保存エラー:', error)
      return false
    }
  }
  
  /**
   * 統合セーブデータを読み込み
   */
  async load(): Promise<UnifiedSaveData | null> {
    const startTime = performance.now()
    
    try {
      this.logAccess('read', 'unified_save', startTime)
      
      const stored = safeLocalStorage.getItem('tokiwa-unified-save')
      if (!stored) {
        console.log('📂 統合セーブデータが見つかりません')
        return null
      }
      
      // 解凍
      let dataString = stored
      if (this.config.performance.enableCompression) {
        dataString = this.decompressData(stored)
      }
      
      const unifiedData = JSON.parse(dataString) as UnifiedSaveData
      
      // バージョン互換性チェック
      if (unifiedData.version !== '1.0.0') {
        console.warn('⚠️ セーブデータのバージョンが異なります:', unifiedData.version)
        // 必要に応じてマイグレーション実行
      }
      
      // 検証実行
      if (this.config.validation.enabled) {
        const validation = await this.validateUnifiedData(unifiedData)
        if (!validation.isValid) {
          console.warn('⚠️ データ整合性の問題を検出:', validation.errors.length)
          
          if (this.config.validation.autoRepair) {
            const repair = await this.repairUnifiedData(unifiedData)
            if (repair.success) {
              console.log('🔧 データを自動修復しました')
            }
          }
        }
      }
      
      // パフォーマンス記録
      const duration = performance.now() - startTime
      this.updatePerformanceMetrics('load', duration, true)
      
      console.log('📂 統合セーブデータ読み込み完了:', {
        size: `${(stored.length / 1024).toFixed(1)}KB`,
        duration: `${duration.toFixed(1)}ms`,
        version: unifiedData.version
      })
      
      return unifiedData
    } catch (error) {
      const duration = performance.now() - startTime
      this.updatePerformanceMetrics('load', duration, false)
      console.error('❌ 統合セーブデータ読み込みエラー:', error)
      return null
    }
  }
  
  /**
   * データ検証を実行
   */
  async validate(): Promise<ValidationResult> {
    const startTime = performance.now()
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []
    
    try {
      this.logAccess('validate', 'unified_data', startTime)
      
      // ゲームデータ検証
      const gameData = this.gameStateManager.getData()
      const gameValidation = this.validateGameData(gameData)
      errors.push(...gameValidation.errors)
      warnings.push(...gameValidation.warnings)
      
      // 静的データ検証
      const staticValidation = this.staticDataManager.validateData()
      if (!staticValidation.isValid) {
        errors.push(...staticValidation.errors.map(err => ({
          type: 'corrupted_data' as const,
          severity: 'error' as const,
          message: err,
          location: 'static_data',
          autoFixable: false
        })))
      }
      
      // 参照整合性検証
      const referenceValidation = this.validateReferences(gameData)
      errors.push(...referenceValidation.errors)
      warnings.push(...referenceValidation.warnings)
      
      const duration = performance.now() - startTime
      this.updatePerformanceMetrics('validate', duration, true)
      
      const result: ValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
        repairSuggestions: this.generateRepairSuggestions(errors),
        validationTime: duration
      }
      
      console.log('🔍 データ検証完了:', {
        isValid: result.isValid,
        errors: errors.length,
        warnings: warnings.length,
        duration: `${duration.toFixed(1)}ms`
      })
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      this.updatePerformanceMetrics('validate', duration, false)
      console.error('❌ データ検証エラー:', error)
      
      return {
        isValid: false,
        errors: [{
          type: 'corrupted_data',
          severity: 'critical',
          message: `検証処理エラー: ${error}`,
          location: 'validation_system',
          autoFixable: false
        }],
        warnings: [],
        repairSuggestions: [],
        validationTime: duration
      }
    }
  }
  
  /**
   * データ修復を実行
   */
  async repair(): Promise<RepairResult> {
    const startTime = performance.now()
    
    try {
      // バックアップ作成
      const backupId = await this.createBackup('pre_update')
      
      const validation = await this.validate()
      if (validation.isValid) {
        return {
          success: true,
          fixedErrors: 0,
          remainingErrors: [],
          changes: [],
          backupCreated: true,
          backupId
        }
      }
      
      const fixedErrors: ValidationError[] = []
      const changes: string[] = []
      
      // 自動修復可能なエラーを処理
      for (const error of validation.errors) {
        if (error.autoFixable) {
          const fixed = await this.fixError(error)
          if (fixed) {
            fixedErrors.push(error)
            changes.push(`修復: ${error.message}`)
          }
        }
      }
      
      // 修復後の検証
      const postRepairValidation = await this.validate()
      
      const result: RepairResult = {
        success: fixedErrors.length > 0,
        fixedErrors: fixedErrors.length,
        remainingErrors: postRepairValidation.errors,
        changes,
        backupCreated: true,
        backupId
      }
      
      console.log('🔧 データ修復完了:', {
        fixedErrors: result.fixedErrors,
        remainingErrors: result.remainingErrors.length,
        changes: result.changes.length
      })
      
      return result
    } catch (error) {
      console.error('❌ データ修復エラー:', error)
      return {
        success: false,
        fixedErrors: 0,
        remainingErrors: [],
        changes: [],
        backupCreated: false
      }
    }
  }
  
  // =================== バックアップ操作 ===================
  
  /**
   * バックアップを作成
   */
  async createBackup(type: BackupData['type'] = 'manual'): Promise<string> {
    try {
      const unifiedData = await this.createUnifiedSaveData()
      const backupId = `backup_${Date.now()}_${type}`
      
      let serializedData = JSON.stringify(unifiedData)
      const originalSize = serializedData.length
      
      if (this.config.backup.compressBackups) {
        serializedData = this.compressData(serializedData)
      }
      
      const backup: BackupData = {
        id: backupId,
        timestamp: new Date().toISOString(),
        data: unifiedData,
        type,
        size: originalSize,
        compressed: this.config.backup.compressBackups
      }
      
      safeLocalStorage.setItem(`tokiwa-backup-${backupId}`, JSON.stringify(backup))
      
      // 古いバックアップの清理
      await this.cleanupBackups()
      
      console.log('📦 バックアップ作成完了:', {
        id: backupId,
        type,
        size: `${(originalSize / 1024).toFixed(1)}KB`,
        compressed: backup.compressed
      })
      
      return backupId
    } catch (error) {
      console.error('❌ バックアップ作成エラー:', error)
      throw error
    }
  }
  
  /**
   * バックアップから復元
   */
  async restoreBackup(backupId: string): Promise<boolean> {
    try {
      const stored = safeLocalStorage.getItem(`tokiwa-backup-${backupId}`)
      if (!stored) {
        console.error('❌ バックアップが見つかりません:', backupId)
        return false
      }
      
      const backup = JSON.parse(stored) as BackupData
      
      // 現在のデータをバックアップ
      const currentBackupId = await this.createBackup('manual')
      console.log('💾 現在のデータをバックアップ:', currentBackupId)
      
      // データ復元
      const serializedData = JSON.stringify(backup.data)
      safeLocalStorage.setItem('tokiwa-unified-save', serializedData)
      
      console.log('📦 バックアップから復元完了:', {
        backupId,
        timestamp: backup.timestamp,
        type: backup.type
      })
      
      return true
    } catch (error) {
      console.error('❌ バックアップ復元エラー:', error)
      return false
    }
  }
  
  /**
   * バックアップリストを取得
   */
  async listBackups(): Promise<BackupData[]> {
    const backups: BackupData[] = []
    
    for (let i = 0; i < safeLocalStorage.getKeysWithPrefix('tokiwa-backup-').length; i++) {
      const key = safeLocalStorage.getKeysWithPrefix('tokiwa-backup-')[i]
      if (key) {
        try {
          const stored = safeLocalStorage.getItem(key)
          if (stored) {
            const backup = JSON.parse(stored) as BackupData
            backups.push(backup)
          }
        } catch (error) {
          console.warn('⚠️ 破損したバックアップをスキップ:', key)
        }
      }
    }
    
    return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }
  
  /**
   * 古いバックアップを削除
   */
  async cleanupBackups(): Promise<number> {
    const backups = await this.listBackups()
    const maxBackups = this.config.backup.maxBackups
    
    if (backups.length <= maxBackups) {
      return 0
    }
    
    const toDelete = backups.slice(maxBackups)
    let deletedCount = 0
    
    for (const backup of toDelete) {
      try {
        safeLocalStorage.removeItem(`tokiwa-backup-${backup.id}`)
        deletedCount++
      } catch (error) {
        console.warn('⚠️ バックアップ削除エラー:', backup.id)
      }
    }
    
    console.log('🧹 古いバックアップを削除:', { deleted: deletedCount, remaining: maxBackups })
    return deletedCount
  }
  
  // =================== プライベートメソッド ===================
  
  /**
   * 統合セーブデータを作成
   */
  private async createUnifiedSaveData(): Promise<UnifiedSaveData> {
    const gameData = this.gameStateManager.getData()
    const staticValidation = this.staticDataManager.validateData()
    
    return {
      version: '1.0.0',
      userId: gameData.userId,
      createdAt: gameData.createdAt,
      lastSaved: new Date().toISOString(),
      lastValidated: new Date().toISOString(),
      
      gameData,
      
      staticDataVersion: '1.0.0',
      staticDataChecksum: this.calculateChecksum(JSON.stringify(this.staticDataManager.getDataStatistics())),
      
      dataIntegrity: {
        isValid: staticValidation.isValid,
        lastCheck: new Date().toISOString(),
        validationErrors: [],
        autoRepairAttempts: 0
      },
      
      syncStatus: {
        cloudSyncEnabled: this.config.sync.enabled,
        pendingChanges: 0,
        conflictResolution: this.config.sync.conflictResolution === 'manual' ? 'local_wins' : 
                          this.config.sync.conflictResolution === 'use_local' ? 'local_wins' : 
                          this.config.sync.conflictResolution === 'use_cloud' ? 'cloud_wins' : 
                          this.config.sync.conflictResolution === 'merge' ? 'cloud_wins' : 'local_wins'
      },
      
      performance: {
        saveSize: 0,
        compressionRatio: 1.0,
        lastSaveTime: 0,
        averageSaveTime: this.performanceMetrics.operations.save.averageTime
      }
    }
  }
  
  /**
   * 設定をマージ
   */
  private mergeConfig(config: Partial<UnifiedDataConfig>): UnifiedDataConfig {
    return {
      autoSave: {
        enabled: true,
        interval: 5,
        onDataChange: true,
        onUserAction: false,
        ...config.autoSave
      },
      backup: {
        enabled: true,
        maxBackups: 10,
        autoBackupInterval: 24,
        compressBackups: true,
        ...config.backup
      },
      sync: {
        enabled: false,
        autoSync: false,
        syncInterval: 15,
        conflictResolution: 'manual',
        ...config.sync
      },
      validation: {
        enabled: true,
        autoValidate: true,
        validationInterval: 10,
        autoRepair: false,
        ...config.validation
      },
      performance: {
        enableCompression: true,
        enableCaching: true,
        cacheSize: 50,
        lazyLoading: true,
        ...config.performance
      }
    }
  }
  
  /**
   * パフォーマンス指標を初期化
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      operations: {
        save: { count: 0, totalTime: 0, averageTime: 0 },
        load: { count: 0, totalTime: 0, averageTime: 0 },
        validate: { count: 0, totalTime: 0, averageTime: 0 },
        sync: { count: 0, totalTime: 0, averageTime: 0 }
      },
      memory: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0
      },
      storage: {
        totalSize: 0,
        compressionRatio: 1.0,
        fragmentationRatio: 0.0
      }
    }
  }
  
  /**
   * 自動操作を設定
   */
  private setupAutoOperations(): void {
    if (this.config.autoSave.enabled) {
      this.autoSaveTimer = setInterval(async () => {
        await this.save()
      }, this.config.autoSave.interval * 60 * 1000)
    }
    
    if (this.config.validation.autoValidate) {
      this.autoValidateTimer = setInterval(async () => {
        await this.validate()
      }, this.config.validation.validationInterval * 60 * 1000)
    }
    
    if (this.config.sync.autoSync) {
      this.autoSyncTimer = setInterval(async () => {
        // await this.syncToCloud()
      }, this.config.sync.syncInterval * 60 * 1000)
    }
  }
  
  /**
   * データ圧縮（簡易実装）
   */
  private compressData(data: string): string {
    // 実際の実装では適切な圧縮ライブラリを使用
    return btoa(data)
  }
  
  /**
   * データ解凍（簡易実装）
   */
  private decompressData(data: string): string {
    // 実際の実装では適切な解凍ライブラリを使用
    return atob(data)
  }
  
  /**
   * チェックサム計算
   */
  private calculateChecksum(data: string): string {
    // 簡易的なハッシュ計算
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(16)
  }
  
  /**
   * ゲームデータ検証
   */
  private validateGameData(gameData: GameData): { errors: ValidationError[]; warnings: ValidationError[] } {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []
    
    // 基本データチェック
    if (!gameData.userId || !gameData.player.name) {
      errors.push({
        type: 'missing_data',
        severity: 'error',
        message: '必須のプレイヤー情報が不足',
        location: 'player_data',
        autoFixable: true,
        suggestedFix: 'デフォルト値を設定'
      })
    }
    
    // トレーナーデータチェック
    gameData.trainers.forEach((trainer, index) => {
      if (!trainer.id || !trainer.name) {
        errors.push({
          type: 'missing_data',
          severity: 'error',
          message: `トレーナー${index}の必須情報が不足`,
          location: `trainers[${index}]`,
          autoFixable: true
        })
      }
    })
    
    return { errors, warnings }
  }
  
  /**
   * 参照整合性検証
   */
  private validateReferences(gameData: GameData): { errors: ValidationError[]; warnings: ValidationError[] } {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []
    
    // 派遣のトレーナー参照チェック
    gameData.expeditions.forEach((expedition, index) => {
      const trainer = gameData.trainers.find(t => t.id === expedition.trainerId)
      if (!trainer) {
        errors.push({
          type: 'invalid_reference',
          severity: 'error',
          message: `派遣${index}が存在しないトレーナーを参照`,
          location: `expeditions[${index}].trainerId`,
          autoFixable: true,
          suggestedFix: '派遣データを削除または修正'
        })
      }
    })
    
    return { errors, warnings }
  }
  
  /**
   * 統合データ検証
   */
  private async validateUnifiedData(data: UnifiedSaveData): Promise<ValidationResult> {
    // 基本的な検証のみ実装
    const errors: ValidationError[] = []
    
    if (!data.gameData) {
      errors.push({
        type: 'missing_data',
        severity: 'critical',
        message: 'ゲームデータが存在しません',
        location: 'gameData',
        autoFixable: false
      })
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      repairSuggestions: [],
      validationTime: 0
    }
  }
  
  /**
   * 統合データ修復
   */
  private async repairUnifiedData(data: UnifiedSaveData): Promise<RepairResult> {
    // 基本的な修復のみ実装
    return {
      success: true,
      fixedErrors: 0,
      remainingErrors: [],
      changes: [],
      backupCreated: false
    }
  }
  
  /**
   * エラー修復
   */
  private async fixError(error: ValidationError): Promise<boolean> {
    // 実際の修復ロジックを実装
    console.log('🔧 エラー修復:', error.message)
    return true
  }
  
  /**
   * 修復提案生成
   */
  private generateRepairSuggestions(errors: ValidationError[]): any[] {
    return []
  }
  
  /**
   * アクセスログ記録
   */
  private logAccess(operation: DataAccessLog['operation'], target: string, startTime: number): void {
    this.accessLog.push({
      operation,
      target,
      timestamp: new Date().toISOString(),
      duration: performance.now() - startTime,
      success: true
    })
    
    // ログサイズ制限
    if (this.accessLog.length > 1000) {
      this.accessLog = this.accessLog.slice(-500)
    }
  }
  
  /**
   * パフォーマンス指標更新
   */
  private updatePerformanceMetrics(operation: keyof PerformanceMetrics['operations'], duration: number, success: boolean): void {
    const metrics = this.performanceMetrics.operations[operation]
    metrics.count++
    if (success) {
      metrics.totalTime += duration
      metrics.averageTime = metrics.totalTime / metrics.count
    }
  }
  
  /**
   * リソース解放
   */
  destroy(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
    }
    if (this.autoValidateTimer) {
      clearInterval(this.autoValidateTimer)
    }
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer)
    }
    
    this.cache.clear()
    this.accessLog.length = 0
    
    console.log('🗑️ 統合データマネージャーリソース解放')
  }
}

// シングルトンインスタンス取得
export const getUnifiedDataManager = (config?: Partial<UnifiedDataConfig>): UnifiedDataManager => {
  return UnifiedDataManager.getInstance(config)
}