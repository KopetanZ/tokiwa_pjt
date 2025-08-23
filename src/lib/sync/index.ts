/**
 * データ同期システム
 * クラウド同期とデータ競合解決の機能を提供
 */

import { SyncManager } from './SyncManager'

export { 
  SyncManager, 
  LocalStorageSyncProvider, 
  AutoConflictResolver
} from './SyncManager'

export type {
  SyncProvider,
  SyncUploadResult,
  SyncDownloadResult,
  CloudSaveInfo,
  SyncConflictResolver
} from './SyncManager'

// 同期システム初期化ヘルパー
export const initializeSyncSystem = async (config: any) => {
  const syncManager = new SyncManager({
    enabled: false,
    autoSync: false,
    syncInterval: 15,
    conflictResolution: 'manual'
  })
  
  // 利用可能なプロバイダーをチェック
  const status = syncManager.getSyncStatus()
  console.log('🔄 同期システム初期化:', status)
  
  return syncManager
}