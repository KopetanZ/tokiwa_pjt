/**
 * ゲームロジックシステム統合モジュール
 * 
 * トキワシティ訓練所のすべてのゲームシステムを統合管理する
 * メインコントローラーとして各システム間の協調動作を制御
 */

// ゲームロジックシステム統合
export * from './expedition-system'
export * from './pokemon-system'
export * from './economy-system'
export * from './sound-system'
export * from './random-system'

// メインゲームコントローラー
import { expeditionSystem, ExpeditionParams, ExpeditionResult, EXPEDITION_LOCATIONS } from './expedition-system'
import { pokemonSystem, PokemonSystem, CaptureAttempt } from './pokemon-system'
import { economySystem, EconomySystem } from './economy-system'
import { soundSystem, SoundSystem, playExpeditionStartSound, playPokemonCatchSound, playMoneySound, playLevelUpSound } from './sound-system'
import { gameRandom } from './random-system'

/**
 * 統合ゲームコントローラー
 * 
 * 全ゲームシステムを統合し、プレイヤーアクションに対して
 * 協調的な処理を実行するメインコントローラー
 * 
 * 主な責任:
 * - システム間の連携制御
 * - ゲームループの管理
 * - 音響効果の統合管理
 * - エラーハンドリング
 */
export class GameController {
  private expeditionSystem = expeditionSystem
  private pokemonSystem = pokemonSystem
  private economySystem = economySystem
  private soundSystem = soundSystem
  
  /**
   * ゲームコントローラーを初期化
   * 全システムの初期化を実行し、ゲーム開始準備を行う
   */
  constructor() {
    this.initialize()
  }
  
  /**
   * システム初期化
   * 音響システムの初期化とBGM開始を行う
   */
  async initialize(): Promise<void> {
    // 音響システム初期化
    await this.soundSystem.initialize()
    
    // BGM開始
    this.soundSystem.playBGM('bgm_main')
    
    console.log('🎮 ゲームコントローラー初期化完了')
  }
  
  /**
   * 派遣実行（統合版）
   * 
   * プレイヤーの派遣要求を受けて、以下の処理を統合実行:
   * 1. 派遣システムによる成功判定・報酬算出
   * 2. 経済システムによる収支処理
   * 3. 音響システムによる効果音再生
   * 4. 全システムの状態更新
   * 
   * @param params 派遣パラメータ（場所、期間、戦略等）
   * @returns 派遣結果と各システムへの影響
   */
  async executeExpedition(params: ExpeditionParams): Promise<{
    result: ExpeditionResult
    economicImpact: {
      moneyGained: number
      totalBalance: number
    }
    pokemonCaught: any[]
    sounds: string[]
  }> {
    const soundsPlayed: string[] = []
    
    try {
      // 1. 派遣開始音再生
      playExpeditionStartSound()
      soundsPlayed.push('expedition_start')
      
      // 2. 派遣システムによる実行・結果算出
      const result = await this.expeditionSystem.executeExpedition(params)
      
      // 3. 成功時の経済処理
      let moneyGained = 0
      if (result.success) {
        moneyGained = this.economySystem.processExpeditionReward(
          { nameJa: '派遣地', baseRewardMoney: result.rewards.money },
          result.success,
          result.successRate,
          10, // トレーナーレベル（仮）
          'ranger', // 職業（仮）
          result.rewards.pokemonCaught.length,
          result.rewards.items.length
        )
        
        // お金獲得音再生
        if (moneyGained > 0) {
          playMoneySound(moneyGained)
          soundsPlayed.push('money_gain')
        }
      }
      
      // 4. ポケモン捕獲時の音響処理
      if (result.rewards.pokemonCaught.length > 0) {
        playPokemonCatchSound()
        soundsPlayed.push('pokemon_catch')
      }
      
      // 5. レベルアップ時の音響処理
      if (result.trainerStatus.levelUp) {
        playLevelUpSound()
        soundsPlayed.push('level_up')
      }
      
      // 6. 最終結果の統合・返却
      const currentBalance = this.economySystem.getCurrentMoney()
      
      return {
        result,
        economicImpact: {
          moneyGained,
          totalBalance: currentBalance
        },
        pokemonCaught: result.rewards.pokemonCaught,
        sounds: soundsPlayed
      }
    } catch (error) {
      console.error('派遣実行エラー:', error)
      throw error
    }
  }
  
  /**
   * 利用可能な派遣先取得
   * トレーナーレベルに応じて挑戦可能な派遣先を返却
   * 
   * @param trainerLevel トレーナーレベル（デフォルト: 1）
   * @returns 利用可能な派遣先配列
   */
  getAvailableExpeditions(trainerLevel: number = 1) {
    return this.expeditionSystem.getAvailableLocations(trainerLevel)
  }
  
  /**
   * 推奨派遣先取得
   * トレーナー・パーティ状況から最適な派遣先を推薦
   * 
   * @param trainer トレーナー情報
   * @param party パーティ情報
   * @returns 推奨派遣先
   */
  getRecommendedExpedition(trainer: any, party: any[]) {
    return this.expeditionSystem.getRecommendedLocation(trainer, party)
  }
  
  /**
   * ポケモン遭遇シミュレーション
   * 指定地域での野生ポケモン遭遇を模擬実行
   * 
   * @param locationId 派遣先ID
   * @returns 遭遇ポケモン情報（null = 遭遇なし）
   */
  async simulateWildPokemonEncounter(locationId: string) {
    const location = EXPEDITION_LOCATIONS.find(loc => loc.id === locationId)
    if (!location) return null
    
    return await this.pokemonSystem.generateWildPokemonEncounter(location)
  }
  
  /**
   * ポケモン捕獲試行
   * 指定されたパラメータでポケモン捕獲を実行
   * 
   * @param attempt 捕獲試行パラメータ
   * @returns 捕獲結果
   */
  attemptPokemonCapture(attempt: CaptureAttempt) {
    return this.pokemonSystem.attemptCapture(attempt)
  }
  
  /**
   * 経済状況取得
   * 現在の経済状況（残高、収支等）を取得
   * 
   * @returns 財務状況詳細
   */
  getEconomicStatus() {
    return this.economySystem.getFinancialStatus()
  }
  
  /**
   * 月次レポート取得
   * 過去30日間の収支分析と改善提案を生成
   * 
   * @returns 月次財務レポート
   */
  generateMonthlyReport() {
    return this.economySystem.generateMonthlyReport()
  }
  
  // 音響設定更新
  updateSoundSettings(config: any) {
    this.soundSystem.updateConfig(config)
  }
  
  // ゲーム統計取得
  getGameStats() {
    const economicStatus = this.economySystem.getFinancialStatus()
    const soundStatus = this.soundSystem.getStatus()
    
    return {
      economic: economicStatus,
      sound: soundStatus,
      locations: EXPEDITION_LOCATIONS.length,
      gameVersion: '1.0.0-alpha'
    }
  }
  
  // 緊急事態処理
  handleEmergencyEvent(type: string, severity: 'minor' | 'major' | 'critical') {
    const result = this.economySystem.handleEmergencyExpense(type, severity)
    
    if (!result) {
      // 緊急事態音
      this.soundSystem.playEvent({
        type: 'error',
        priority: 'critical'
      })
    }
    
    return result
  }
  
  // デバッグ用: 資金追加
  addDebugMoney(amount: number) {
    this.economySystem.recordIncome('bonus', amount, 'デバッグ用資金追加', 'debug')
    playMoneySound(amount)
  }
  
  // デバッグ用: ランダムポケモン生成
  async generateDebugPokemon() {
    const location = gameRandom.choice(EXPEDITION_LOCATIONS)
    return await this.pokemonSystem.generateWildPokemonEncounter(location)
  }
  
  // パーティ管理機能
  private party: any[] = []
  
  async addPokemonToParty(pokemonId: string): Promise<boolean> {
    if (this.party.length >= 6) {
      throw new Error('パーティは最大6体までです')
    }
    
    // 実際の実装では、データベースからポケモンを取得
    // ここでは簡易版
    const pokemon = {
      id: pokemonId,
      addedToParty: new Date().toISOString()
    }
    
    this.party.push(pokemon)
    console.log(`ポケモン ${pokemonId} をパーティに追加`)
    return true
  }
  
  async removePokemonFromParty(pokemonId: string): Promise<boolean> {
    const index = this.party.findIndex(p => p.id === pokemonId)
    if (index === -1) {
      throw new Error('指定されたポケモンはパーティにいません')
    }
    
    this.party.splice(index, 1)
    console.log(`ポケモン ${pokemonId} をパーティから削除`)
    return true
  }
  
  getParty(): any[] {
    return [...this.party]
  }
  
  getPartySize(): number {
    return this.party.length
  }
  
  // セーブデータ生成（将来の拡張用）
  generateSaveData() {
    return {
      economic: {
        currentMoney: this.economySystem.getCurrentMoney(),
        transactions: this.economySystem.getTransactionHistory(100)
      },
      sound: this.soundSystem.getConfig(),
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  }
  
  // ゲーム完全リセット
  resetGame() {
    this.economySystem.setCurrentMoney(50000) // 初期資金
    this.soundSystem.stopAll()
    this.soundSystem.playBGM('bgm_main')
    
    console.log('🔄 ゲームリセット完了')
  }
}

// グローバルインスタンス
export const gameController = new GameController()

// 便利な関数をエクスポート
export {
  expeditionSystem,
  pokemonSystem,
  economySystem,
  soundSystem,
  gameRandom,
  EXPEDITION_LOCATIONS
}