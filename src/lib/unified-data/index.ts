// 過剰実装により削除
// シンプルなローカルストレージ管理で十分

export class UnifiedDataManager {
  static getInstance() {
    return null
  }
}

// 互換性のための再エクスポート
export { getGameStateManager } from '../game-state/GameStateManager'