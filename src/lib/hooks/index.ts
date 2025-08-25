/**
 * 統合フックライブラリ（簡素化版）
 * 過剰実装を削除し、必要最小限の機能のみ提供
 */

// プロバイダーからの直接インポート（必要に応じて）
export {
  useDataSystem,
  useGameData,
  useTrainers,
  usePokemon,
  useExpeditions,
  useDataSystemManagement
} from '@/components/providers/DataSystemProvider'

// エラーハンドリングフック
export {
  useErrorHandling,
  useErrorMonitor,
  useNetworkErrorMonitor
} from './useErrorHandling'

// 派遣システムフック（簡素化により削除されたフックのダミーエクスポート）
export function useExpeditionProgress() { return { progress: null, isActive: false, overallProgress: 0, currentStage: '', riskLevel: 'low' } }
export function useExpeditionEvents() { return { events: [], pendingEvents: [], processChoice: () => {}, hasPendingEvents: () => false } }
export function useExpeditionIntervention() { return { availableActions: [], executeIntervention: () => {}, emergencyIntervention: () => {}, getInterventionStatistics: () => ({}), canIntervene: () => false } }
export function useExpeditionCompletion() { return { completedExpeditions: [], getExpeditionResults: () => null } }
export function useExpeditionReports() { return { reports: [], metadata: null, summary: null, timeline: [], performance: null, statistics: null, recommendations: [] } }
export function useExpeditionSystem() { 
  return { 
    systemState: { 
      isHealthy: true, 
      activeExpeditions: [], 
      recentEvents: [], 
      systemHealth: 'healthy' as const,
      statistics: {} 
    }, 
    isHealthy: true, 
    activeExpeditionCount: 0, 
    performHealthCheck: () => {} 
  } 
}
export function useExpeditionAchievements() { return { achievements: [] } }

// 簡素化により削除されたフックのダミーエクスポート
export function useGameCore() {
  return {
    trainers: [] as any[],
    pokemon: [] as any[],
    expeditions: [] as any[],
    player: null as any
  }
}