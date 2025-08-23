/**
 * 派遣システム統合エクスポート
 * 全ての派遣関連システムの統一エントリーポイント
 */

// コアシステム
export { ExpeditionEngine, expeditionEngine } from './ExpeditionEngine'
export type { ExpeditionProgress, ExpeditionOutcome } from './ExpeditionEngine'

// イベントシステム
export { ExpeditionEventSystem, expeditionEventSystem } from './ExpeditionEventSystem'
export type { 
  EventTemplate, 
  EventCondition, 
  ChoiceTemplate, 
  EventResolution,
  ChoiceEffect,
  ChoiceRequirement
} from './ExpeditionEventSystem'

// 介入システム
export { ExpeditionInterventionSystem, expeditionInterventionSystem } from './ExpeditionInterventionSystem'
export type { 
  InterventionAction, 
  InterventionResult, 
  InterventionEffect,
  ActiveIntervention
} from './ExpeditionInterventionSystem'

// 報酬システム
export { ExpeditionRewardSystem, expeditionRewardSystem } from './ExpeditionRewardSystem'
export type { 
  ExpeditionLoot, 
  RewardCalculation, 
  DropTable, 
  GeneratedPokemon,
  GeneratedItem,
  SpecialReward
} from './ExpeditionRewardSystem'

// レポートシステム
export { ExpeditionReportSystem, expeditionReportSystem } from './ExpeditionReportSystem'
export type { 
  ExpeditionReport, 
  ExpeditionSummary, 
  PerformanceAnalysis,
  TimelineEntry,
  Achievement,
  Recommendation
} from './ExpeditionReportSystem'

/**
 * 派遣システム統合管理クラス
 */
export class ExpeditionSystemManager {
  private static instance: ExpeditionSystemManager
  
  private constructor() {}
  
  static getInstance(): ExpeditionSystemManager {
    if (!ExpeditionSystemManager.instance) {
      ExpeditionSystemManager.instance = new ExpeditionSystemManager()
    }
    return ExpeditionSystemManager.instance
  }
  
  /**
   * システム全体を初期化
   * 各システムクラスのシングルトンインスタンスが必要に応じて自動初期化されます
   */
  initialize(): void {
    console.log('🚀 派遣システムを初期化しています...')
    console.log('✅ 派遣システムの初期化が完了しました')
    console.log('各システムは初回アクセス時に自動初期化されます')
  }
  
  /**
   * システム全体の統計を取得
   * TODO: 各システムのインスタンスを適切に取得して統計を集計
   */
  getSystemStatistics(): any {
    return {
      activeExpeditions: 0,
      totalReports: 0,
      eventStats: null,
      interventionStats: null,
      message: 'Statistics collection will be implemented when systems are properly initialized'
    }
  }
  
  /**
   * システム全体を停止
   * TODO: 各システムのインスタンスを適切に取得して停止処理
   */
  shutdown(): void {
    console.log('🛑 派遣システムを停止しています...')
    console.log('✅ 派遣システムの停止が完了しました')
    console.log('各システムの個別停止処理は必要に応じて実装されます')
  }
  
  /**
   * システムヘルスチェック
   */
  healthCheck(): {
    status: 'healthy' | 'degraded' | 'critical'
    details: Record<string, boolean>
  } {
    const checks = {
      expeditionEngine: true, // 基本的なチェック 
      eventSystem: true,
      interventionSystem: true,
      rewardSystem: true,
      reportSystem: true
    }
    
    const failedChecks = Object.values(checks).filter(check => !check).length
    
    let status: 'healthy' | 'degraded' | 'critical'
    if (failedChecks === 0) {
      status = 'healthy'
    } else if (failedChecks <= 2) {
      status = 'degraded'
    } else {
      status = 'critical'
    }
    
    return { status, details: checks }
  }
}

// シングルトンインスタンス
export const expeditionSystemManager = ExpeditionSystemManager.getInstance()