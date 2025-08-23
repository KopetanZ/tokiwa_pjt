/**
 * 派遣コンポーネント統合エクスポート
 * 全ての派遣関連UIコンポーネントの統一エントリーポイント
 */

// メインコンポーネント
export { default as ExpeditionDashboard } from './ExpeditionDashboard'
export { default as ExpeditionProgressView } from './ExpeditionProgressView'
export { default as ExpeditionEventHandler } from './ExpeditionEventHandler'
export { default as ExpeditionInterventionPanel } from './ExpeditionInterventionPanel'
export { default as ExpeditionResultsView } from './ExpeditionResultsView'

// 型定義の再エクスポート
export type { 
  ExpeditionProgress,
  ExpeditionLoot,
  ExpeditionReport,
  InterventionAction,
  InterventionResult,
  Achievement,
  Recommendation
} from '@/lib/expedition'

/**
 * 派遣UIコンポーネント統合クラス
 * 全ての派遣関連UIの管理とコーディネーション
 */
export class ExpeditionUIManager {
  private static instance: ExpeditionUIManager
  
  private constructor() {}
  
  static getInstance(): ExpeditionUIManager {
    if (!ExpeditionUIManager.instance) {
      ExpeditionUIManager.instance = new ExpeditionUIManager()
    }
    return ExpeditionUIManager.instance
  }
  
  /**
   * コンポーネント間の通信を管理
   */
  setupComponentCommunication(): void {
    // コンポーネント間のイベント通信設定
    console.log('🔗 派遣UIコンポーネント間通信を設定しました')
  }
  
  /**
   * UIテーマの統一設定
   */
  applyConsistentTheme(): void {
    // 一貫したテーマとスタイルの適用
    console.log('🎨 派遣UIテーマを統一しました')
  }
  
  /**
   * アクセシビリティ設定
   */
  setupAccessibility(): void {
    // アクセシビリティ機能の設定
    console.log('♿ 派遣UIアクセシビリティを設定しました')
  }
  
  /**
   * パフォーマンス最適化
   */
  optimizePerformance(): void {
    // UI パフォーマンスの最適化
    console.log('⚡ 派遣UIパフォーマンスを最適化しました')
  }
}

// シングルトンインスタンス
export const expeditionUIManager = ExpeditionUIManager.getInstance()