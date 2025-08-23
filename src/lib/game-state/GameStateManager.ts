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
      // lastActive: removed - not part of Pokemon interface
    }
    
    // 初期状態の確認と修正
    if (newPokemon.status === 'injured' || newPokemon.status === 'sick') {
      newPokemon.status = 'healthy'
      console.log('🔄 ポケモンの状態を健康に修正:', newPokemon.name)
    }
    
    this.data.pokemon.push(newPokemon)
    this.markDirty()
    this.notifyListeners()
    
    console.log('✅ ポケモン追加:', newPokemon.name)
    return id
  }

  /**
   * ポケモン情報を更新
   */
  updatePokemon(id: string, updates: Partial<Pokemon>): boolean {
    const index = this.data.pokemon.findIndex(p => p.id === id)
    if (index === -1) return false
    
    this.data.pokemon[index] = {
      ...this.data.pokemon[index],
      ...updates
      // lastActive: removed - not part of Pokemon interface  
    }
    
    this.markDirty()
    this.notifyListeners()
    return true
  }

  /**
   * ポケモンの状態を回復
   */
  healPokemon(id: string): boolean {
    const pokemon = this.data.pokemon.find(p => p.id === id)
    if (!pokemon) return false
    
    if (pokemon.status === 'healthy') {
      console.log('ℹ️ ポケモンは既に健康です:', pokemon.name)
      return true
    }
    
    // 状態を健康に回復
    pokemon.status = 'healthy'
    pokemon.hp = pokemon.maxHp
    
    this.markDirty()
    this.notifyListeners()
    
    console.log('💚 ポケモンを回復しました:', pokemon.name)
    return true
  }

  /**
   * 全ポケモンの状態を回復
   */
  healAllPokemon(): number {
    let healedCount = 0
    
    this.data.pokemon.forEach(pokemon => {
      if (pokemon.status !== 'healthy' || pokemon.hp < pokemon.maxHp) {
        pokemon.status = 'healthy'
        pokemon.hp = pokemon.maxHp
        healedCount++
      }
    })
    
    if (healedCount > 0) {
      this.markDirty()
      this.notifyListeners()
      console.log(`💚 ${healedCount}匹のポケモンを回復しました`)
    }
    
    return healedCount
  }

  /**
   * ポケモンの状態をチェック
   */
  getPokemonStatus(): { healthy: number; injured: number; sick: number; training: number } {
    const status = { healthy: 0, injured: 0, sick: 0, training: 0 }
    
    this.data.pokemon.forEach(pokemon => {
      status[pokemon.status]++
    })
    
    return status
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
      
      // 初期トレーナーが存在しない場合は追加
      if (data.trainers.length === 0) {
        console.log('🆕 初期トレーナーが存在しないため、追加します')
        const initialTrainers = this.createInitialTrainers()
        data.trainers.push(...initialTrainers)
        this.markDirty()
      }
      
      // 初期ポケモンが存在しない場合は追加
      if (data.pokemon.length === 0) {
        console.log('🆕 初期ポケモンが存在しないため、追加します')
        const initialPokemon = this.createInitialPokemon()
        data.pokemon.push(...initialPokemon)
        this.markDirty()
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

  /**
   * 初期トレーナーを作成
   */
  private createInitialTrainers(): Trainer[] {
    return [
      {
        id: 'mock-trainer-1',
        name: 'タケシ',
        job: 'ranger',
        level: 4,
        experience: 320,
        nextLevelExp: 500,
        status: 'available',
        skills: { capture: 8, exploration: 7, battle: 6, research: 5, healing: 4 },
        personality: { courage: 7, caution: 3, curiosity: 8, teamwork: 6, independence: 4, compliance: 5 },
        salary: 3600,
        totalEarned: 14400,
        totalExpeditions: 12,
        successfulExpeditions: 10,
        pokemonCaught: 15,
        trustLevel: 75,
        favoriteLocations: [1, 2, 3],
        hiredDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30日前
        lastActive: new Date().toISOString()
      },
      {
        id: 'mock-trainer-2',
        name: 'カスミ',
        job: 'battler',
        level: 2,
        experience: 180,
        nextLevelExp: 300,
        status: 'available',
        skills: { capture: 5, exploration: 4, battle: 8, research: 3, healing: 2 },
        personality: { courage: 8, caution: 2, curiosity: 6, teamwork: 7, independence: 5, compliance: 4 },
        salary: 3000,
        totalEarned: 9000,
        totalExpeditions: 8,
        successfulExpeditions: 6,
        pokemonCaught: 8,
        trustLevel: 60,
        favoriteLocations: [2, 4],
        hiredDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20日前
        lastActive: new Date().toISOString()
      },
      {
        id: 'mock-trainer-3',
        name: 'マチス',
        job: 'breeder',
        level: 1,
        experience: 50,
        nextLevelExp: 150,
        status: 'available',
        skills: { capture: 6, exploration: 4, battle: 3, research: 7, healing: 8 },
        personality: { courage: 4, caution: 8, curiosity: 9, teamwork: 8, independence: 3, compliance: 7 },
        salary: 2800,
        totalEarned: 5600,
        totalExpeditions: 5,
        successfulExpeditions: 4,
        pokemonCaught: 6,
        trustLevel: 45,
        favoriteLocations: [1, 5],
        hiredDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15日前
        lastActive: new Date().toISOString()
      }
    ]
  }

  /**
   * 初期ポケモンを作成
   */
  private createInitialPokemon(): Pokemon[] {
    return [
      {
        id: 'starter-pikachu',
        speciesId: 25,
        name: 'ピカチュウ',
        nameJa: 'ピカチュウ',
        level: 5,
        experience: 0,
        nextLevelExp: 100,
        hp: 20,
        maxHp: 20,
        attack: 12,
        defense: 8,
        specialAttack: 10,
        specialDefense: 8,
        speed: 15,
        status: 'healthy',
        moves: ['でんこうせっか', 'しっぽをふる', 'なきごえ'],
        ivs: { hp: 15, attack: 14, defense: 13, specialAttack: 12, specialDefense: 11, speed: 16 },
        nature: 'がんばりや',
        caughtDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1週間前
        caughtLocation: 1,
        caughtBy: 'mock-trainer-1',
        originalTrainer: 'タケシ'
      },
      {
        id: 'starter-eevee',
        speciesId: 133,
        name: 'イーブイ',
        nameJa: 'イーブイ',
        level: 3,
        experience: 0,
        nextLevelExp: 80,
        hp: 16,
        maxHp: 16,
        attack: 10,
        defense: 9,
        specialAttack: 8,
        specialDefense: 9,
        speed: 12,
        status: 'healthy',
        moves: ['でんこうせっか', 'しっぽをふる', 'なきごえ'],
        ivs: { hp: 14, attack: 13, defense: 15, specialAttack: 11, specialDefense: 12, speed: 13 },
        nature: 'おだやか',
        caughtDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5日前
        caughtLocation: 2,
        caughtBy: 'mock-trainer-2',
        originalTrainer: 'カスミ'
      },
      {
        id: 'starter-charmander',
        speciesId: 4,
        name: 'ヒトカゲ',
        nameJa: 'ヒトカゲ',
        level: 4,
        experience: 0,
        nextLevelExp: 90,
        hp: 18,
        maxHp: 18,
        attack: 11,
        defense: 7,
        specialAttack: 12,
        specialDefense: 8,
        speed: 13,
        status: 'healthy',
        moves: ['ひのこ', 'なきごえ', 'かえんだん'],
        ivs: { hp: 13, attack: 16, defense: 10, specialAttack: 15, specialDefense: 9, speed: 14 },
        nature: 'いじっぱり',
        caughtDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3日前
        caughtLocation: 3,
        caughtBy: 'mock-trainer-3',
        originalTrainer: 'マチス'
      }
    ]
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
   * 初期トレーナーを復元
   */
  restoreInitialTrainers(): void {
    console.log('🔄 初期トレーナーを復元します')
    
    // 既存の初期トレーナーIDを持つトレーナーを削除
    this.data.trainers = this.data.trainers.filter(t => 
      !t.id.startsWith('mock-trainer-')
    )
    
    // 初期トレーナーを追加
    const initialTrainers = this.createInitialTrainers()
    this.data.trainers.push(...initialTrainers)
    
    this.markDirty()
    this.notifyListeners()
    this.saveToLocal()
    
    console.log('✅ 初期トレーナー復元完了:', initialTrainers.map(t => t.name))
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