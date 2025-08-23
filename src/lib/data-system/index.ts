/**
 * 統合データ管理システム
 * 全てのデータ管理機能を統合したメインエントリーポイント
 */

import { UnifiedDataManager } from '../unified-data'
import { getStaticDataManager } from '../static-data'
import { getGameStateManager } from '../game-state/GameStateManager'
import { SyncManager } from '../sync'
import { getDataValidator } from '../validation'

import type { UnifiedDataConfig } from '../unified-data/types'

/**
 * データシステム設定
 */
export interface DataSystemConfig {
  unified?: Partial<UnifiedDataConfig>
  enableSync?: boolean
  enableValidation?: boolean
  debug?: boolean
}

/**
 * 統合データシステム
 * 全てのデータ管理コンポーネントを統合
 */
export class DataSystem {
  private static instance: DataSystem
  private unifiedManager: UnifiedDataManager
  private staticManager = getStaticDataManager()
  private gameStateManager = getGameStateManager()
  private syncManager: any
  private validator = getDataValidator()
  private isInitialized = false
  
  private constructor(private config: DataSystemConfig) {
    this.unifiedManager = UnifiedDataManager.getInstance(config.unified)
    
    if (config.enableSync) {
      this.syncManager = new SyncManager({
        enabled: false,
        autoSync: false,
        syncInterval: 15,
        conflictResolution: 'manual'
      })
    }
  }
  
  static getInstance(config: DataSystemConfig = {}): DataSystem {
    if (!DataSystem.instance) {
      DataSystem.instance = new DataSystem(config)
    }
    return DataSystem.instance
  }
  
  /**
   * システム初期化
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      console.log('✅ データシステムは既に初期化済みです')
      return true
    }
    
    try {
      console.log('🚀 統合データシステム初期化開始...')
      
      // 静的データ検証
      const staticValidation = this.staticManager.validateData()
      if (!staticValidation.isValid) {
        console.warn('⚠️ 静的データに問題があります:', staticValidation.errors.length)
        if (this.config.debug) {
          console.warn('静的データエラー:', staticValidation.errors)
        }
      }
      
      // 統合セーブデータ読み込み
      const saveData = await this.unifiedManager.load()
      if (!saveData) {
        console.log('🆕 初回起動: 新しいセーブデータを作成')
        await this.unifiedManager.save()
      } else {
        console.log('📂 既存セーブデータを読み込み:', {
          version: saveData.version,
          lastSaved: saveData.lastSaved,
          playerName: saveData.gameData.player.name
        })
      }
      
      // データ検証実行
      if (this.config.enableValidation) {
        console.log('🔍 データ整合性検証実行中...')
        const validation = await this.unifiedManager.validate()
        
        if (!validation.isValid) {
          console.warn('⚠️ データ整合性の問題を検出:', {
            errors: validation.errors.length,
            warnings: validation.warnings.length
          })
          
          if (this.config.debug) {
            console.warn('検証エラー:', validation.errors)
            console.warn('検証警告:', validation.warnings)
          }
          
          // 自動修復を試行
          const autoRepairEnabled = this.config.unified?.validation?.autoRepair
          if (autoRepairEnabled && validation.errors.some(e => e.autoFixable)) {
            console.log('🔧 自動修復を実行中...')
            const repair = await this.unifiedManager.repair()
            
            if (repair.success) {
              console.log('✅ 自動修復完了:', {
                fixedErrors: repair.fixedErrors,
                changes: repair.changes.length
              })
            } else {
              console.warn('⚠️ 一部の問題は修復できませんでした:', {
                remainingErrors: repair.remainingErrors.length
              })
            }
          }
        } else {
          console.log('✅ データ整合性チェック完了: 問題なし')
        }
      }
      
      // 同期システム初期化
      if (this.config.enableSync && this.syncManager) {
        const syncStatus = this.syncManager.getSyncStatus()
        console.log('🔄 同期システム初期化:', syncStatus)
      }
      
      this.isInitialized = true
      
      console.log('✅ 統合データシステム初期化完了')
      this.logSystemStatus()
      
      return true
    } catch (error) {
      console.error('❌ データシステム初期化エラー:', error)
      return false
    }
  }
  
  /**
   * システム状態をログ出力
   */
  private logSystemStatus(): void {
    if (!this.config.debug) return
    
    const gameData = this.gameStateManager.getData()
    const staticStats = this.staticManager.getDataStatistics()
    
    console.log('📊 システム状態:')
    console.log('  ゲームデータ:', {
      version: gameData.version,
      trainers: gameData.trainers.length,
      pokemon: gameData.pokemon.length,
      expeditions: gameData.expeditions.length,
      money: gameData.player.money,
      level: gameData.player.level
    })
    console.log('  静的データ:', staticStats)
    
    if (this.syncManager) {
      const syncStatus = this.syncManager.getSyncStatus()
      console.log('  同期状態:', syncStatus)
    }
  }
  
  /**
   * 手動保存
   */
  async save(): Promise<boolean> {
    try {
      return await this.unifiedManager.save()
    } catch (error) {
      console.error('❌ 手動保存エラー:', error)
      return false
    }
  }
  
  /**
   * 手動検証
   */
  async validate(): Promise<any> {
    try {
      return await this.unifiedManager.validate()
    } catch (error) {
      console.error('❌ 手動検証エラー:', error)
      return {
        isValid: false,
        errors: [{ message: `検証エラー: ${error}` }],
        warnings: [],
        repairSuggestions: []
      }
    }
  }
  
  /**
   * 手動修復
   */
  async repair(): Promise<any> {
    try {
      return await this.unifiedManager.repair()
    } catch (error) {
      console.error('❌ 手動修復エラー:', error)
      return {
        success: false,
        fixedErrors: 0,
        remainingErrors: [],
        changes: []
      }
    }
  }
  
  /**
   * バックアップ作成
   */
  async createBackup(): Promise<string | null> {
    try {
      return await this.unifiedManager.createBackup('manual')
    } catch (error) {
      console.error('❌ バックアップ作成エラー:', error)
      return null
    }
  }
  
  /**
   * バックアップ一覧取得
   */
  async getBackups(): Promise<any[]> {
    try {
      return await this.unifiedManager.listBackups()
    } catch (error) {
      console.error('❌ バックアップ一覧取得エラー:', error)
      return []
    }
  }
  
  /**
   * バックアップ復元
   */
  async restoreBackup(backupId: string): Promise<boolean> {
    try {
      return await this.unifiedManager.restoreBackup(backupId)
    } catch (error) {
      console.error('❌ バックアップ復元エラー:', error)
      return false
    }
  }
  
  /**
   * 同期実行
   */
  async performSync(): Promise<any> {
    if (!this.syncManager) {
      return {
        success: false,
        error: '同期機能が無効です'
      }
    }
    
    try {
      const saveData = await this.unifiedManager.load()
      if (!saveData) {
        return {
          success: false,
          error: 'セーブデータが見つかりません'
        }
      }
      
      return await this.syncManager.syncToCloud(saveData)
    } catch (error) {
      console.error('❌ 同期エラー:', error)
      return {
        success: false,
        error: String(error)
      }
    }
  }
  
  /**
   * システム統計取得
   */
  getSystemStats(): any {
    const gameData = this.gameStateManager.getData()
    const staticStats = this.staticManager.getDataStatistics()
    
    return {
      system: {
        initialized: this.isInitialized,
        version: '1.0.0',
        features: {
          sync: !!this.syncManager,
          validation: this.config.enableValidation,
          debug: this.config.debug
        }
      },
      gameData: {
        version: gameData.version,
        lastSaved: gameData.lastSaved,
        player: {
          name: gameData.player.name,
          level: gameData.player.level,
          money: gameData.player.money
        },
        counts: {
          trainers: gameData.trainers.length,
          pokemon: gameData.pokemon.length,
          expeditions: gameData.expeditions.length,
          transactions: gameData.transactions.length
        }
      },
      staticData: staticStats,
      sync: this.syncManager ? this.syncManager.getSyncStatus() : null
    }
  }
  
  /**
   * リソース解放
   */
  destroy(): void {
    if (this.unifiedManager) {
      this.unifiedManager.destroy()
    }
    
    if (this.gameStateManager) {
      this.gameStateManager.stopAutoSave()
    }
    
    console.log('🗑️ データシステムリソース解放完了')
  }
  
  // =================== 便利なアクセッサー ===================
  
  get unified(): UnifiedDataManager {
    return this.unifiedManager
  }
  
  get static(): any {
    return this.staticManager
  }
  
  get gameState(): any {
    return this.gameStateManager
  }
  
  get sync(): any {
    return this.syncManager
  }
  
  get validation(): any {
    return this.validator
  }
}

/**
 * グローバルデータシステムインスタンス
 */
let globalDataSystem: DataSystem | null = null

/**
 * データシステム初期化関数
 */
export async function initializeDataSystem(config: DataSystemConfig = {}): Promise<DataSystem> {
  // デフォルト設定
  const defaultConfig: DataSystemConfig = {
    enableSync: false,
    enableValidation: true,
    debug: false,
    unified: {
      autoSave: {
        enabled: true,
        interval: 5,
        onDataChange: true,
        onUserAction: false
      },
      backup: {
        enabled: true,
        maxBackups: 10,
        autoBackupInterval: 24,
        compressBackups: true
      },
      validation: {
        enabled: true,
        autoValidate: true,
        validationInterval: 10,
        autoRepair: false
      }
    }
  }
  
  const mergedConfig = { ...defaultConfig, ...config }
  
  if (!globalDataSystem) {
    globalDataSystem = DataSystem.getInstance(mergedConfig)
    await globalDataSystem.initialize()
  }
  
  return globalDataSystem
}

/**
 * データシステム取得
 */
export function getDataSystem(): DataSystem | null {
  return globalDataSystem
}

/**
 * データシステム破棄
 */
export function destroyDataSystem(): void {
  if (globalDataSystem) {
    globalDataSystem.destroy()
    globalDataSystem = null
  }
}

// 子システムの再エクスポート（DataSystemクラスは既に上で定義済み）
export * from '../unified-data'
export * from '../static-data'
export * from '../sync'
export * from '../validation'
export * from '../schemas'