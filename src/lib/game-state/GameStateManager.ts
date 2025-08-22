import { GameData, createInitialGameData, Trainer, Pokemon, Expedition, Transaction } from './types'

/**
 * JSONベースのゲーム状態管理システム
 * - ローカルファースト設計
 * - 即座の状態更新
 * - オプショナルなクラウド同期
 */
export class GameStateManager {
  private static readonly STORAGE_KEY = 'tokiwa-game-state'
  private static readonly AUTO_SAVE_INTERVAL = 30000 // 30秒
  
  private data: GameData
  private listeners: Set<(data: GameData) => void> = new Set()
  private autoSaveTimer?: NodeJS.Timeout
  private isDirty = false
  
  constructor(userId?: string) {
    // ローカルデータを読み込み、なければ初期データ作成
    this.data = this.loadFromLocal() || this.createNewGame(userId || 'guest')
    
    // 自動保存開始
    this.startAutoSave()
  }
  
  // =================== データアクセス ===================
  
  /**
   * 現在のゲームデータを取得（読み取り専用）
   */
  getData(): Readonly<GameData> {
    return this.data
  }
  
  /**
   * 特定の部分データを取得
   */
  getTrainers(): Trainer[] {
    return [...this.data.trainers]
  }
  
  getPokemon(): Pokemon[] {
    return [...this.data.pokemon]
  }
  
  getExpeditions(): Expedition[] {
    return [...this.data.expeditions]
  }
  
  getPlayer() {
    return { ...this.data.player }
  }
  
  // =================== データ更新 ===================
  
  /**
   * トレーナーを追加
   */
  addTrainer(trainer: Omit<Trainer, 'id'>): string {
    const id = this.generateId('trainer')
    const newTrainer: Trainer = {
      ...trainer,
      id,
      hiredDate: new Date().toISOString(),
      lastActive: new Date().toISOString()
    }
    
    this.data.trainers.push(newTrainer)
    this.markDirty()
    this.notifyListeners()
    
    console.log('✅ トレーナー追加:', newTrainer.name)
    return id
  }
  
  /**
   * トレーナー情報を更新
   */
  updateTrainer(id: string, updates: Partial<Trainer>): boolean {
    const index = this.data.trainers.findIndex(t => t.id === id)
    if (index === -1) return false
    
    this.data.trainers[index] = {
      ...this.data.trainers[index],
      ...updates,
      lastActive: new Date().toISOString()
    }
    
    this.markDirty()
    this.notifyListeners()
    return true
  }
  
  /**
   * ポケモンを追加
   */
  addPokemon(pokemon: Omit<Pokemon, 'id'>): string {
    const id = this.generateId('pokemon')
    const newPokemon: Pokemon = {
      ...pokemon,
      id,
      caughtDate: new Date().toISOString()
    }
    
    this.data.pokemon.push(newPokemon)
    this.markDirty()
    this.notifyListeners()
    
    console.log('✅ ポケモン追加:', newPokemon.name)
    return id
  }
  
  /**
   * 派遣を開始
   */
  startExpedition(expedition: Omit<Expedition, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = this.generateId('expedition')
    const now = new Date().toISOString()
    
    const newExpedition: Expedition = {
      ...expedition,
      id,
      createdAt: now,
      updatedAt: now,
      events: [],
      interventions: []
    }
    
    this.data.expeditions.push(newExpedition)
    
    // トレーナーのステータス更新
    this.updateTrainer(expedition.trainerId, {
      status: 'on_expedition',
      currentExpeditionId: id
    })
    
    this.markDirty()
    this.notifyListeners()
    
    console.log('✅ 派遣開始:', id)
    return id
  }
  
  /**
   * 派遣を完了
   */
  completeExpedition(expeditionId: string, result: Expedition['result']): boolean {
    const expedition = this.data.expeditions.find(e => e.id === expeditionId)
    if (!expedition) return false
    
    expedition.status = result?.success ? 'completed' : 'failed'
    expedition.actualEndTime = new Date().toISOString()
    expedition.result = result
    expedition.updatedAt = new Date().toISOString()
    
    // トレーナーのステータス更新
    this.updateTrainer(expedition.trainerId, {
      status: 'available',
      currentExpeditionId: undefined,
      totalExpeditions: this.data.trainers.find(t => t.id === expedition.trainerId)!.totalExpeditions + 1,
      successfulExpeditions: result?.success 
        ? this.data.trainers.find(t => t.id === expedition.trainerId)!.successfulExpeditions + 1
        : this.data.trainers.find(t => t.id === expedition.trainerId)!.successfulExpeditions
    })
    
    // 結果を反映
    if (result) {
      // ポケモン追加
      result.pokemonCaught.forEach(pokemon => {
        this.addPokemon(pokemon)
      })
      
      // 収入記録
      if (result.moneyEarned > 0) {
        this.addTransaction({
          type: 'income',
          category: 'expedition_reward',
          amount: result.moneyEarned,
          description: `派遣報酬: ${expedition.locationId}`,
          relatedId: expeditionId,
          timestamp: new Date().toISOString()
        })
        
        this.updatePlayerMoney(result.moneyEarned)
      }
    }
    
    this.markDirty()
    this.notifyListeners()
    
    console.log('✅ 派遣完了:', expeditionId)
    return true
  }
  
  /**
   * 取引を追加
   */
  addTransaction(transaction: Omit<Transaction, 'id'>): string {
    const id = this.generateId('transaction')
    const newTransaction: Transaction = {
      ...transaction,
      id
    }
    
    this.data.transactions.push(newTransaction)
    this.markDirty()
    this.notifyListeners()
    
    return id
  }
  
  /**
   * プレイヤーの所持金を更新
   */
  updatePlayerMoney(change: number): number {
    this.data.player.money = Math.max(0, this.data.player.money + change)
    this.markDirty()
    this.notifyListeners()
    
    return this.data.player.money
  }
  
  // =================== 検索・フィルタ ===================
  
  /**
   * 利用可能なトレーナーを取得
   */
  getAvailableTrainers(): Trainer[] {
    return this.data.trainers.filter(t => t.status === 'available')
  }
  
  /**
   * 進行中の派遣を取得
   */
  getActiveExpeditions(): Expedition[] {
    return this.data.expeditions.filter(e => e.status === 'active')
  }
  
  /**
   * 最近の取引を取得
   */
  getRecentTransactions(limit: number = 10): Transaction[] {
    return this.data.transactions
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }
  
  // =================== 永続化 ===================
  
  /**
   * ローカルストレージに保存
   */
  saveToLocal(): void {
    try {
      this.data.lastSaved = new Date().toISOString()
      const serialized = JSON.stringify(this.data, null, 2)
      localStorage.setItem(GameStateManager.STORAGE_KEY, serialized)
      this.isDirty = false
      
      console.log('💾 ゲームデータをローカル保存:', {
        size: `${(serialized.length / 1024).toFixed(1)}KB`,
        trainers: this.data.trainers.length,
        pokemon: this.data.pokemon.length,
        expeditions: this.data.expeditions.length
      })
    } catch (error) {
      console.error('❌ ローカル保存エラー:', error)
    }
  }
  
  /**
   * ローカルストレージから読み込み
   */
  private loadFromLocal(): GameData | null {
    try {
      const stored = localStorage.getItem(GameStateManager.STORAGE_KEY)
      if (!stored) return null
      
      const data = JSON.parse(stored) as GameData
      
      // バージョン互換性チェック
      if (data.version !== '1.0.0') {
        console.warn('⚠️ ゲームデータのバージョンが異なります')
        // 今後、マイグレーション処理を追加
      }
      
      console.log('📂 ゲームデータをローカル読み込み:', {
        version: data.version,
        lastSaved: data.lastSaved,
        trainers: data.trainers.length,
        pokemon: data.pokemon.length
      })
      
      return data
    } catch (error) {
      console.error('❌ ローカル読み込みエラー:', error)
      return null
    }
  }
  
  /**
   * 新しいゲームを作成
   */
  private createNewGame(userId: string): GameData {
    console.log('🎮 新しいゲームを作成:', { userId })
    return createInitialGameData(userId, 'プレイヤー', 'トキワシティ訓練所')
  }
  
  // =================== ユーティリティ ===================
  
  /**
   * ユニークIDを生成
   */
  private generateId(prefix: string): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 9)
    return `${prefix}_${timestamp}_${random}`
  }
  
  /**
   * ダーティフラグを設定
   */
  private markDirty(): void {
    this.isDirty = true
  }
  
  /**
   * 自動保存開始
   */
  private startAutoSave(): void {
    this.autoSaveTimer = setInterval(() => {
      if (this.isDirty) {
        this.saveToLocal()
      }
    }, GameStateManager.AUTO_SAVE_INTERVAL)
    
    console.log('⏰ 自動保存開始 (30秒間隔)')
  }
  
  /**
   * 自動保存停止
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = undefined
      console.log('⏹️ 自動保存停止')
    }
  }
  
  // =================== リアルタイム更新 ===================
  
  /**
   * データ変更リスナーを追加
   */
  addListener(callback: (data: GameData) => void): () => void {
    this.listeners.add(callback)
    
    // アンサブスクライブ関数を返す
    return () => {
      this.listeners.delete(callback)
    }
  }
  
  /**
   * リスナーに変更を通知
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.data)
      } catch (error) {
        console.error('❌ リスナーエラー:', error)
      }
    })
  }
  
  // =================== デバッグ・ユーティリティ ===================
  
  /**
   * データをエクスポート（バックアップ用）
   */
  exportData(): string {
    return JSON.stringify(this.data, null, 2)
  }
  
  /**
   * データをインポート（復元用）
   */
  importData(jsonData: string): boolean {
    try {
      const importedData = JSON.parse(jsonData) as GameData
      this.data = importedData
      this.markDirty()
      this.notifyListeners()
      this.saveToLocal()
      
      console.log('📥 データインポート完了')
      return true
    } catch (error) {
      console.error('❌ データインポートエラー:', error)
      return false
    }
  }
  
  /**
   * 統計情報を取得
   */
  getStatistics() {
    const data = this.data
    const now = new Date()
    
    return {
      gameInfo: {
        version: data.version,
        created: data.createdAt,
        lastSaved: data.lastSaved
      },
      counts: {
        trainers: data.trainers.length,
        pokemon: data.pokemon.length,
        expeditions: data.expeditions.length,
        transactions: data.transactions.length
      },
      player: {
        money: data.player.money,
        level: data.player.level,
        reputation: data.player.reputation
      },
      performance: {
        expeditionSuccessRate: this.calculateExpeditionSuccessRate(),
        averageExpeditionReward: this.calculateAverageReward(),
        bestTrainer: this.getBestTrainer()
      }
    }
  }
  
  private calculateExpeditionSuccessRate(): number {
    const completed = this.data.expeditions.filter(e => e.status === 'completed' || e.status === 'failed')
    if (completed.length === 0) return 0
    
    const successful = completed.filter(e => e.result?.success)
    return (successful.length / completed.length) * 100
  }
  
  private calculateAverageReward(): number {
    const rewards = this.data.expeditions
      .filter(e => e.result?.moneyEarned)
      .map(e => e.result!.moneyEarned)
    
    if (rewards.length === 0) return 0
    return rewards.reduce((sum, reward) => sum + reward, 0) / rewards.length
  }
  
  private getBestTrainer(): string {
    if (this.data.trainers.length === 0) return 'なし'
    
    const best = this.data.trainers.reduce((best, trainer) => {
      const rate = trainer.totalExpeditions > 0 
        ? trainer.successfulExpeditions / trainer.totalExpeditions 
        : 0
      const bestRate = best.totalExpeditions > 0 
        ? best.successfulExpeditions / best.totalExpeditions 
        : 0
      
      return rate > bestRate ? trainer : best
    })
    
    return best.name
  }
}

// シングルトンインスタンス
let gameStateManager: GameStateManager | null = null

/**
 * ゲームステートマネージャーのシングルトンインスタンスを取得
 */
export const getGameStateManager = (userId?: string): GameStateManager => {
  if (!gameStateManager) {
    gameStateManager = new GameStateManager(userId)
  }
  return gameStateManager
}