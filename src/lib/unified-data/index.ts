/**
 * 統合データマネージャーエクスポート
 * 統一されたデータ管理システムへのアクセスポイント
 */

export { UnifiedDataManager } from './UnifiedDataManager'
export * from './types'

// 便利な再エクスポート
export { getGameStateManager } from '../game-state/GameStateManager'
export { getStaticDataManager } from '../static-data'

/**
 * 統合データシステムの初期化ヘルパー
 */
export const initializeDataSystem = async (config?: any) => {
  const { UnifiedDataManager: Manager } = await import('./UnifiedDataManager')
  const unifiedManager = Manager.getInstance(config)
  
  // 初期データロード
  const saveData = await unifiedManager.load()
  
  // 初回起動時の処理
  if (!saveData) {
    console.log('🆕 初回起動: 新しいゲームデータを作成します')
    await unifiedManager.save()
  }
  
  // データ検証
  const validation = await unifiedManager.validate()
  if (!validation.isValid) {
    console.warn('⚠️ データ整合性の問題を検出:', validation.errors.length)
  }
  
  return unifiedManager
}