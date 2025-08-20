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
export * from './trainer-system'

// メインゲームコントローラー
import { expeditionSystem, ExpeditionParams, ExpeditionResult, EXPEDITION_LOCATIONS } from './expedition-system'
import { pokemonSystem, PokemonSystem, CaptureAttempt } from './pokemon-system'
import { economySystem, EconomySystem } from './economy-system'
import { soundSystem, SoundSystem, playExpeditionStartSound, playPokemonCatchSound, playMoneySound, playLevelUpSound } from './sound-system'
import { TrainerSystem } from './trainer-system'
import { gameRandom } from './random-system'
import { supabase } from '../supabase'

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
  private userId: string | null = null
  
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
    
    // ユーザー情報初期化
    await this.initializeUser()
  }
  
  /**
   * ユーザー初期化
   * Supabaseからユーザー情報を取得し、内部状態を初期化
   */
  private async initializeUser(): Promise<void> {
    try {
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          this.userId = user.id
          console.log('👤 ユーザー情報初期化完了:', user.id)
        }
      }
    } catch (error) {
      console.error('ユーザー初期化エラー:', error)
    }
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
      
      // 6. データベースに派遣結果を保存
      if (this.userId && supabase) {
        try {
          // 派遣記録を保存
          const { data: expeditionData, error: expeditionError } = await supabase
            .from('expeditions')
            .insert({
              user_id: this.userId,
              trainer_id: params.trainerId,
              location_id: parseInt(params.locationId),
              expedition_mode: 'balanced',
              target_duration_hours: params.durationHours,
              status: result.success ? 'completed' : 'failed',
              success_rate: result.successRate,
              rewards_earned: result.rewards,
              completion_time: new Date().toISOString(),
              created_at: new Date().toISOString()
            })
            .select('id')
            .single()
          
          if (expeditionError) {
            console.error('派遣記録保存エラー:', expeditionError)
          } else {
            console.log('✅ 派遣記録が保存されました')
          }
          
          // 捕獲したポケモンをデータベースに保存
          if (result.rewards.pokemonCaught.length > 0) {
            const pokemonInsertData = result.rewards.pokemonCaught.map(pokemon => ({
              user_id: this.userId,
              dex_number: pokemon.dex_number,
              name: pokemon.name,
              level: pokemon.level,
              hp: pokemon.hp,
              attack: pokemon.attack,
              defense: pokemon.defense,
              special_attack: pokemon.special_attack,
              special_defense: pokemon.special_defense,
              speed: pokemon.speed,
              types: pokemon.types,
              nature: pokemon.nature,
              is_shiny: pokemon.is_shiny || false,
              status: 'available',
              caught_at: new Date().toISOString()
            }))
            
            const { error: pokemonError } = await supabase
              .from('pokemon')
              .insert(pokemonInsertData)
            
            if (pokemonError) {
              console.error('捕獲ポケモン保存エラー:', pokemonError)
            } else {
              console.log('✅ 捕獲ポケモンが保存されました')
            }
          }
          
          // 収入記録をデータベースに保存
          if (moneyGained > 0) {
            const { error: transactionError } = await supabase
              .from('transactions')
              .insert({
                user_id: this.userId,
                type: 'income',
                category: 'expedition',
                amount: moneyGained,
                description: `派遣報酬 - ${params.locationId}`,
                reference_id: expeditionData?.id,
                created_at: new Date().toISOString()
              })
            
            if (transactionError) {
              console.error('派遣収入記録エラー:', transactionError)
            }
          }
          
        } catch (dbError) {
          console.error('派遣データベース保存エラー:', dbError)
        }
      }
      
      // 7. 最終結果の統合・返却
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
  
  // トレーナー雇用機能
  async hireTrainer(name: string, job: string, level: number = 1): Promise<{
    success: boolean
    message: string
    trainer?: any
    cost?: number
  }> {
    try {
      const trainerJob = job as any // TrainerJob型変換
      const { trainer, hireCost } = TrainerSystem.hireNewTrainer(name, trainerJob, level)
      
      // 資金チェック
      const canAfford = this.checkCanAfford(hireCost)
      if (!canAfford) {
        return {
          success: false,
          message: `資金が不足しています。必要: ₽${hireCost.toLocaleString()}`
        }
      }
      
      // 雇用費用の支払い
      const paymentResult = this.recordTransaction(
        'expense',
        'salary',
        hireCost,
        `${name} 雇用費用`
      )
      
      if (!paymentResult) {
        return {
          success: false,
          message: '雇用費用の支払いに失敗しました'
        }
      }
      
      // データベースに保存
      if (this.userId && supabase) {
        try {
          // 職業IDを取得
          const { data: jobData } = await supabase
            .from('trainer_jobs')
            .select('id')
            .eq('job_name', trainer.job)
            .single()
          
          // トレーナーをデータベースに保存
          const { error: trainerError } = await supabase
            .from('trainers')
            .insert({
              user_id: this.userId,
              name: trainer.name,
              job_id: jobData?.id || null,
              job_level: trainer.level,
              job_experience: trainer.experience || 0,
              preferences: trainer.skills || {},
              compliance_rate: 80, // デフォルト値
              trust_level: 50, // デフォルト値
              personality: trainer.personality || 'balanced',
              status: 'available',
              salary: trainer.salary_base,
              total_earned: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          
          if (trainerError) {
            console.error('トレーナー保存エラー:', trainerError)
          } else {
            console.log('✅ トレーナーがデータベースに保存されました')
          }
          
          // 取引記録をデータベースに保存
          const { error: transactionError } = await supabase
            .from('transactions')
            .insert({
              user_id: this.userId,
              type: 'expense',
              category: 'salary',
              amount: hireCost,
              description: `${name} 雇用費用`,
              reference_id: null,
              created_at: new Date().toISOString()
            })
          
          if (transactionError) {
            console.error('取引記録エラー:', transactionError)
          } else {
            console.log('✅ 取引記録がデータベースに保存されました')
          }
          
          // ゲーム状態保存
          await this.saveGameState()
          
        } catch (dbError) {
          console.error('データベース保存エラー:', dbError)
        }
      }
      
      console.log('🎯 新規トレーナー雇用完了:', {
        name: trainer.name,
        job: trainer.job,
        level: trainer.level,
        hireCost,
        salary: trainer.salary_base,
        skills: trainer.skills
      })
      
      return {
        success: true,
        message: `${name}を雇用しました！`,
        trainer,
        cost: hireCost
      }
      
    } catch (error) {
      console.error('トレーナー雇用エラー:', error)
      return {
        success: false,
        message: 'トレーナー雇用に失敗しました'
      }
    }
  }

  // 利用可能なトレーナー候補の取得
  getAvailableTrainerCandidates() {
    return TrainerSystem.generateTrainerCandidates()
  }

  // ポケモンケア機能群
  async healPokemon(pokemonId: string, healType: 'basic' | 'full'): Promise<{
    success: boolean
    message: string
    cost?: number
    healedAmount?: number
  }> {
    try {
      // データベースからポケモンデータを取得
      const pokemon = await this.getPokemonById(pokemonId)
      if (!pokemon) {
        return {
          success: false,
          message: 'ポケモンが見つかりませんでした'
        }
      }
      
      // PokemonSystemで必要な形式に変換
      const pokemonForSystem: any = {
        id: pokemon.id,
        species: { base_stats: { hp: 50 } }, // 基本値として使用
        level: pokemon.level,
        current_hp: pokemon.hp,
        max_hp: pokemon.max_hp || pokemon.hp,
        status_condition: 'healthy' as const,
        individual_values: { hp: 15, attack: 12, defense: 14, special_attack: 10, special_defense: 12, speed: 13 }
      }
      
      const result = pokemonSystem.healPokemon(pokemonForSystem, healType)
      
      // 資金チェックと支払い
      const canAfford = this.checkCanAfford(result.cost)
      if (!canAfford) {
        return {
          success: false,
          message: `資金が不足しています。必要: ₽${result.cost.toLocaleString()}`
        }
      }
      
      const paymentResult = this.recordTransaction(
        'expense',
        'maintenance',
        result.cost,
        `ポケモン回復 (${healType})`
      )
      
      if (!paymentResult) {
        return {
          success: false,
          message: '支払い処理に失敗しました'
        }
      }
      
      // データベースに保存
      if (this.userId && supabase) {
        try {
          const { error: pokemonError } = await supabase
            .from('pokemon')
            .update({
              hp: result.newHp,
              updated_at: new Date().toISOString()
            })
            .eq('id', pokemonId)
            .eq('user_id', this.userId)
          
          if (pokemonError) {
            console.error('ポケモン回復データ保存エラー:', pokemonError)
          } else {
            console.log('✅ ポケモン回復データが保存されました')
          }
          
          // 取引記録をデータベースに保存
          const { error: transactionError } = await supabase
            .from('transactions')
            .insert({
              user_id: this.userId,
              type: 'expense',
              category: 'maintenance',
              amount: result.cost,
              description: `ポケモン回復 (${healType})`,
              reference_id: pokemonId,
              created_at: new Date().toISOString()
            })
          
          if (transactionError) {
            console.error('回復取引記録エラー:', transactionError)
          }
          
        } catch (dbError) {
          console.error('ポケモン回復データベース保存エラー:', dbError)
        }
      }
      
      return {
        success: true,
        message: `ポケモンが回復しました！HP +${result.healedAmount}`,
        cost: result.cost,
        healedAmount: result.healedAmount
      }
    } catch (error) {
      console.error('ポケモン回復エラー:', error)
      return {
        success: false,
        message: 'ポケモンの回復に失敗しました'
      }
    }
  }

  async increasePokemonFriendship(pokemonId: string, treatmentType: 'basic' | 'premium'): Promise<{
    success: boolean
    message: string
    cost?: number
    friendshipIncrease?: number
  }> {
    try {
      // データベースからポケモンデータを取得
      const pokemon = await this.getPokemonById(pokemonId)
      if (!pokemon) {
        return {
          success: false,
          message: 'ポケモンが見つかりませんでした'
        }
      }
      
      const pokemonForSystem: any = {
        id: pokemon.id,
        friendship: pokemon.friendship || 100
      }
      
      const result = pokemonSystem.increaseFriendship(pokemonForSystem, treatmentType)
      
      const canAfford = this.checkCanAfford(result.cost)
      if (!canAfford) {
        return {
          success: false,
          message: `資金が不足しています。必要: ₽${result.cost.toLocaleString()}`
        }
      }
      
      const paymentResult = this.recordTransaction(
        'expense',
        'maintenance',
        result.cost,
        `なつき度向上 (${treatmentType})`
      )
      
      if (!paymentResult) {
        return {
          success: false,
          message: '支払い処理に失敗しました'
        }
      }
      
      // データベースに保存
      if (this.userId && supabase) {
        try {
          const { error: pokemonError } = await supabase
            .from('pokemon')
            .update({
              friendship: (pokemon.friendship || 100) + result.friendshipIncrease,
              updated_at: new Date().toISOString()
            })
            .eq('id', pokemonId)
            .eq('user_id', this.userId)
          
          if (pokemonError) {
            console.error('なつき度データ保存エラー:', pokemonError)
          } else {
            console.log('✅ なつき度データが保存されました')
          }
          
          // 取引記録をデータベースに保存
          const { error: transactionError } = await supabase
            .from('transactions')
            .insert({
              user_id: this.userId,
              type: 'expense',
              category: 'maintenance',
              amount: result.cost,
              description: `なつき度向上 (${treatmentType})`,
              reference_id: pokemonId,
              created_at: new Date().toISOString()
            })
          
          if (transactionError) {
            console.error('なつき度取引記録エラー:', transactionError)
          }
          
        } catch (dbError) {
          console.error('なつき度データベース保存エラー:', dbError)
        }
      }
      
      return {
        success: true,
        message: `なつき度が上がりました！+${result.friendshipIncrease}`,
        cost: result.cost,
        friendshipIncrease: result.friendshipIncrease
      }
    } catch (error) {
      console.error('なつき度向上エラー:', error)
      return {
        success: false,
        message: 'なつき度向上に失敗しました'
      }
    }
  }

  async trainPokemon(pokemonId: string, trainingType: 'basic' | 'intensive'): Promise<{
    success: boolean
    message: string
    cost?: number
    experienceGained?: number
    levelUp?: boolean
    newLevel?: number
  }> {
    try {
      // データベースからポケモンデータを取得
      const pokemon = await this.getPokemonById(pokemonId)
      if (!pokemon) {
        return {
          success: false,
          message: 'ポケモンが見つかりませんでした'
        }
      }
      
      const pokemonForSystem: any = {
        id: pokemon.id,
        species: { base_stats: { hp: 50 } },
        level: pokemon.level,
        experience: pokemon.experience || 0,
        max_hp: pokemon.max_hp || pokemon.hp,
        current_hp: pokemon.hp,
        individual_values: { hp: 15, attack: 12, defense: 14, special_attack: 10, special_defense: 12, speed: 13 }
      }
      
      const result = pokemonSystem.trainPokemon(pokemonForSystem, trainingType)
      
      const canAfford = this.checkCanAfford(result.cost)
      if (!canAfford) {
        return {
          success: false,
          message: `資金が不足しています。必要: ₽${result.cost.toLocaleString()}`
        }
      }
      
      const paymentResult = this.recordTransaction(
        'expense',
        'maintenance',
        result.cost,
        `ポケモン特訓 (${trainingType})`
      )
      
      if (!paymentResult) {
        return {
          success: false,
          message: '支払い処理に失敗しました'
        }
      }
      
      // データベースに保存
      if (this.userId && supabase) {
        try {
          const updateData: any = {
            experience: (pokemon.experience || 0) + result.experienceGained,
            updated_at: new Date().toISOString()
          }
          
          if (result.levelUp) {
            updateData.level = result.newLevel
            // レベルアップ時はHPも計算し直し（簡易版）
            updateData.max_hp = Math.floor(pokemon.max_hp * 1.1)
          }
          
          const { error: pokemonError } = await supabase
            .from('pokemon')
            .update(updateData)
            .eq('id', pokemonId)
            .eq('user_id', this.userId)
          
          if (pokemonError) {
            console.error('特訓データ保存エラー:', pokemonError)
          } else {
            console.log('✅ 特訓データが保存されました')
          }
          
          // 取引記録をデータベースに保存
          const { error: transactionError } = await supabase
            .from('transactions')
            .insert({
              user_id: this.userId,
              type: 'expense',
              category: 'maintenance',
              amount: result.cost,
              description: `ポケモン特訓 (${trainingType})`,
              reference_id: pokemonId,
              created_at: new Date().toISOString()
            })
          
          if (transactionError) {
            console.error('特訓取引記録エラー:', transactionError)
          }
          
        } catch (dbError) {
          console.error('特訓データベース保存エラー:', dbError)
        }
      }
      
      let message = `特訓完了！経験値 +${result.experienceGained}`
      if (result.levelUp) {
        message += ` レベルアップ！Lv.${result.newLevel}になりました！`
      }
      
      return {
        success: true,
        message,
        cost: result.cost,
        experienceGained: result.experienceGained,
        levelUp: result.levelUp,
        newLevel: result.newLevel
      }
    } catch (error) {
      console.error('ポケモン特訓エラー:', error)
      return {
        success: false,
        message: 'ポケモンの特訓に失敗しました'
      }
    }
  }

  async healAllPokemon(healType: 'basic' | 'full'): Promise<{
    success: boolean
    message: string
    totalCost?: number
    healedCount?: number
  }> {
    try {
      // 実際の実装では、全ポケモンを取得する必要があります
      const samplePokemonList: any[] = [
        { id: '1', current_hp: 10, max_hp: 25, status_condition: 'healthy' },
        { id: '2', current_hp: 8, max_hp: 20, status_condition: 'poisoned' },
        { id: '3', current_hp: 15, max_hp: 30, status_condition: 'healthy' }
      ]
      
      const injuredPokemon = samplePokemonList.filter(p => 
        p.current_hp < p.max_hp || p.status_condition !== 'healthy'
      )
      
      if (injuredPokemon.length === 0) {
        return {
          success: true,
          message: '回復が必要なポケモンはいません',
          totalCost: 0,
          healedCount: 0
        }
      }
      
      const result = pokemonSystem.healAllPokemon(samplePokemonList, healType)
      
      const canAfford = this.checkCanAfford(result.totalCost)
      if (!canAfford) {
        return {
          success: false,
          message: `資金が不足しています。必要: ₽${result.totalCost.toLocaleString()}`
        }
      }
      
      const paymentResult = this.recordTransaction(
        'expense',
        'maintenance',
        result.totalCost,
        `全体回復 (${healType})`
      )
      
      if (!paymentResult) {
        return {
          success: false,
          message: '支払い処理に失敗しました'
        }
      }
      
      return {
        success: true,
        message: `${result.healedPokemon}匹のポケモンが回復しました！`,
        totalCost: result.totalCost,
        healedCount: result.healedPokemon
      }
    } catch (error) {
      console.error('全体回復エラー:', error)
      return {
        success: false,
        message: '全体回復に失敗しました'
      }
    }
  }

  // 経済取引記録
  recordTransaction(
    type: 'income' | 'expense',
    category: string,
    amount: number,
    description: string
  ): boolean {
    if (type === 'income') {
      return this.economySystem.recordIncome(category as any, amount, description, 'manual')
    } else {
      return this.economySystem.recordExpense(category as any, amount, description, 'manual')
    }
  }

  // 資金チェック
  checkCanAfford(amount: number): boolean {
    return this.economySystem.checkCanAfford(amount)
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
    
    // データベースに保存
    if (this.userId && supabase) {
      try {
        const { error: pokemonError } = await supabase
          .from('pokemon')
          .update({
            status: 'in_party',
            updated_at: new Date().toISOString()
          })
          .eq('id', pokemonId)
          .eq('user_id', this.userId)
        
        if (pokemonError) {
          console.error('パーティ追加データベースエラー:', pokemonError)
          return false
        } else {
          console.log('✅ ポケモンをパーティに追加しました')
        }
        
      } catch (dbError) {
        console.error('パーティ追加データベース保存エラー:', dbError)
        return false
      }
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
    
    // データベースに保存
    if (this.userId && supabase) {
      try {
        const { error: pokemonError } = await supabase
          .from('pokemon')
          .update({
            status: 'available',
            updated_at: new Date().toISOString()
          })
          .eq('id', pokemonId)
          .eq('user_id', this.userId)
        
        if (pokemonError) {
          console.error('パーティ削除データベースエラー:', pokemonError)
          return false
        } else {
          console.log('✅ ポケモンをパーティから削除しました')
        }
        
      } catch (dbError) {
        console.error('パーティ削除データベース保存エラー:', dbError)
        return false
      }
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
  
  // データベースからポケモンデータを取得
  private async getPokemonById(pokemonId: string): Promise<any | null> {
    if (!this.userId || !supabase) return null
    
    try {
      const { data, error } = await supabase
        .from('pokemon')
        .select('*')
        .eq('id', pokemonId)
        .eq('user_id', this.userId)
        .single()
      
      if (error) {
        console.error('ポケモンデータ取得エラー:', error)
        return null
      }
      
      return data
    } catch (error) {
      console.error('ポケモンデータ取得エラー:', error)
      return null
    }
  }
  
  // 研究機能
  async startResearch(projectId: string, cost: number): Promise<{
    success: boolean
    message: string
    cost?: number
  }> {
    try {
      // 資金チェック
      const canAfford = this.checkCanAfford(cost)
      if (!canAfford) {
        return {
          success: false,
          message: `資金が不足しています。必要: ₽${cost.toLocaleString()}`
        }
      }
      
      // 研究費用の支払い
      const paymentResult = this.recordTransaction(
        'expense',
        'research',
        cost,
        `研究プロジェクト: ${projectId}`
      )
      
      if (!paymentResult) {
        return {
          success: false,
          message: '研究費用の支払いに失敗しました'
        }
      }
      
      // データベースに保存
      if (this.userId && supabase) {
        try {
          const { error: researchError } = await supabase
            .from('research_projects')
            .insert({
              user_id: this.userId,
              project_id: projectId,
              research_points: 0,
              status: 'researching',
              started_at: new Date().toISOString()
            })
          
          if (researchError) {
            console.error('研究プロジェクト保存エラー:', researchError)
          } else {
            console.log('✅ 研究プロジェクトが開始されました')
          }
          
          // 取引記録をデータベースに保存
          const { error: transactionError } = await supabase
            .from('transactions')
            .insert({
              user_id: this.userId,
              type: 'expense',
              category: 'research',
              amount: cost,
              description: `研究プロジェクト: ${projectId}`,
              reference_id: projectId,
              created_at: new Date().toISOString()
            })
          
          if (transactionError) {
            console.error('研究取引記録エラー:', transactionError)
          }
          
        } catch (dbError) {
          console.error('研究データベース保存エラー:', dbError)
        }
      }
      
      return {
        success: true,
        message: '研究を開始しました！',
        cost
      }
      
    } catch (error) {
      console.error('研究開始エラー:', error)
      return {
        success: false,
        message: '研究開始に失敗しました'
      }
    }
  }
  
  // ゲーム完全リセット
  /**
   * ゲーム進行状況とバランスデータを保存
   * トレーナー雇用などの重要なアクション後に呼び出される
   */
  private async saveGameState(): Promise<void> {
    if (!this.userId || !supabase) return
    
    try {
      // ゲーム進行状況を更新
      const { error: progressError } = await supabase
        .from('game_progress')
        .upsert({
          user_id: this.userId,
          level: 1, // 基本レベル
          experience: 0,
          next_level_exp: 1000,
          total_play_time: 0,
          achievement_points: 0,
          unlocked_features: ['basic_training', 'pokemon_management', 'simple_expeditions'],
          difficulty: 'normal',
          updated_at: new Date().toISOString()
        })
      
      if (progressError) {
        console.error('ゲーム進行状況保存エラー:', progressError)
      } else {
        console.log('✅ ゲーム進行状況が保存されました')
      }
      
      // ゲームバランスを更新
      const { error: balanceError } = await supabase
        .from('game_balance')
        .upsert({
          user_id: this.userId,
          trainer_growth_rate: 1.0,
          pokemon_growth_rate: 1.0,
          expedition_difficulty: 1.0,
          economy_inflation: 1.0,
          research_speed: 1.0,
          facility_efficiency: 1.0,
          updated_at: new Date().toISOString()
        })
      
      if (balanceError) {
        console.error('ゲームバランス保存エラー:', balanceError)
      } else {
        console.log('✅ ゲームバランスが保存されました')
      }
      
    } catch (error) {
      console.error('ゲーム状態保存エラー:', error)
    }
  }
  
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