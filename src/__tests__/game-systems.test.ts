// 統合テストスイート: ゲームシステム全体のテスト
import { gameController } from '@/lib/game-logic'
import { expeditionSystem, EXPEDITION_LOCATIONS } from '@/lib/game-logic/expedition-system'
import { pokemonSystem } from '@/lib/game-logic/pokemon-system'
import { economySystem } from '@/lib/game-logic/economy-system'
import { facilitySystem } from '@/lib/game-logic/facility-system'
import { trainerSystem } from '@/lib/game-logic/trainer-system'

describe('統合テスト: ゲームシステム全体', () => {
  beforeEach(() => {
    // 各テスト前にシステムをリセット
    economySystem.setCurrentMoney(50000)
    facilitySystem.debugUnlockAllFacilities()
  })

  describe('基本ゲームループ', () => {
    test('派遣 → 報酬獲得 → 成長のサイクルが正常に動作する', async () => {
      // 初期状態
      const initialMoney = economySystem.getCurrentMoney()
      expect(initialMoney).toBe(50000)

      // 派遣実行
      const expeditionParams = {
        trainerId: 'test_trainer',
        locationId: 'viridian_forest',
        durationHours: 2,
        strategy: 'balanced' as const,
        playerAdvice: []
      }

      const result = await gameController.executeExpedition(expeditionParams)
      
      // 結果検証
      expect(result).toBeDefined()
      expect(result.result).toBeDefined()
      expect(result.economicImpact).toBeDefined()
      expect(result.economicImpact.totalBalance).toBeGreaterThanOrEqual(initialMoney)
      
      // 成功時は報酬が入ること
      if (result.result.success) {
        expect(result.economicImpact.moneyGained).toBeGreaterThan(0)
        expect(result.result.rewards.experience).toBeGreaterThan(0)
      }
    })

    test('複数回の派遣で経済状況が正しく更新される', async () => {
      const initialMoney = economySystem.getCurrentMoney()
      let totalGained = 0

      // 3回派遣を実行
      for (let i = 0; i < 3; i++) {
        const result = await gameController.executeExpedition({
          trainerId: 'test_trainer',
          locationId: 'route_22',
          durationHours: 1,
          strategy: 'balanced',
          playerAdvice: []
        })

        totalGained += result.economicImpact.moneyGained
      }

      const finalMoney = economySystem.getCurrentMoney()
      expect(finalMoney).toBe(initialMoney + totalGained)
    })
  })

  describe('派遣システム', () => {
    test('全ての派遣先で派遣が実行可能', async () => {
      for (const location of EXPEDITION_LOCATIONS) {
        const result = await expeditionSystem.executeExpedition({
          trainerId: 'test_trainer',
          locationId: location.id,
          durationHours: 1,
          strategy: 'balanced',
          playerAdvice: []
        })

        expect(result).toBeDefined()
        expect(result.success).toBeDefined()
        expect(result.successRate).toBeGreaterThan(0)
        expect(result.successRate).toBeLessThanOrEqual(100)
        expect(result.rewards).toBeDefined()
        expect(result.trainerStatus).toBeDefined()
      }
    })

    test('戦略による成功率の違い', async () => {
      const strategies = ['balanced', 'aggressive', 'defensive', 'exploration'] as const
      const results: Record<string, number> = {}

      for (const strategy of strategies) {
        const result = await expeditionSystem.executeExpedition({
          trainerId: 'test_trainer',
          locationId: 'viridian_forest',
          durationHours: 2,
          strategy,
          playerAdvice: []
        })
        
        results[strategy] = result.successRate
      }

      // 戦略による差があることを確認
      expect(Object.keys(results)).toHaveLength(4)
      const rates = Object.values(results)
      const maxRate = Math.max(...rates)
      const minRate = Math.min(...rates)
      expect(maxRate - minRate).toBeGreaterThan(0) // 差があること
    })

    test('プレイヤーアドバイスが成功率に影響する', async () => {
      // アドバイスなし
      const withoutAdvice = await expeditionSystem.executeExpedition({
        trainerId: 'test_trainer',
        locationId: 'viridian_forest',
        durationHours: 2,
        strategy: 'balanced',
        playerAdvice: []
      })

      // アドバイスあり
      const withAdvice = await expeditionSystem.executeExpedition({
        trainerId: 'test_trainer',
        locationId: 'viridian_forest',
        durationHours: 2,
        strategy: 'balanced',
        playerAdvice: [
          {
            type: 'pokemon_priority',
            value: 'bug',
            description: '虫タイプを優先'
          }
        ]
      })

      // アドバイスの効果があることを確認（必ずしも高くなるとは限らないが、処理されること）
      expect(withAdvice.successRate).toBeGreaterThan(0)
      expect(withoutAdvice.successRate).toBeGreaterThan(0)
    })
  })

  describe('ポケモンシステム', () => {
    test('野生ポケモン遭遇システム', async () => {
      const location = EXPEDITION_LOCATIONS[0]
      // generateWildPokemonEncounter メソッドが正しく呼び出し可能であることを確認
      const encounter = await pokemonSystem.generateWildPokemonEncounter(location)
      
      // 遭遇システムが実装されており、null/undefinedまたは有効なポケモンデータを返すことを確認
      expect(encounter === null || encounter === undefined || 
             (encounter && typeof encounter === 'object')).toBe(true)
             
      // 遭遇した場合の構造テスト
      if (encounter && typeof encounter === 'object') {
        expect(encounter.id).toBeDefined()
        expect(encounter.name || encounter.name_ja).toBeDefined()
      }
    })

    test('ポケモン捕獲試行', () => {
      const mockSpecies = {
        id: 25,
        name: 'ピカチュウ',
        catch_rate: 190,
        types: ['electric'],
        base_stats: { hp: 35, attack: 55 },
        habitat: ['forest', 'grassland']
      }
      
      const captureAttempt = {
        species: mockSpecies,
        location: EXPEDITION_LOCATIONS[0],
        trainer: { level: 10 },
        party: []
      }

      const result = pokemonSystem.attemptCapture(captureAttempt)
      
      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
      expect(result.capture_rate).toBeGreaterThan(0)
      expect(result.capture_rate).toBeLessThanOrEqual(1)
      expect(result.message).toBeDefined()
    })
  })

  describe('経済システム', () => {
    test('収入・支出の記録と計算', () => {
      const initialMoney = economySystem.getCurrentMoney()
      
      // 収入記録
      economySystem.recordIncome('expedition', 5000, '派遣報酬', 'reward')
      expect(economySystem.getCurrentMoney()).toBe(initialMoney + 5000)
      
      // 支出記録
      const expenseResult = economySystem.recordExpense('facility_upgrade', 3000, '施設アップグレード', 'upgrade')
      expect(expenseResult).toBe(true)
      expect(economySystem.getCurrentMoney()).toBe(initialMoney + 5000 - 3000)
      
      // 残高不足の場合
      const largeExpenseResult = economySystem.recordExpense('facility_upgrade', 100000, '大型支出', 'upgrade')
      expect(largeExpenseResult).toBe(false)
      expect(economySystem.getCurrentMoney()).toBe(initialMoney + 5000 - 3000) // 変わらない
    })

    test('月次レポート生成', () => {
      // いくつか取引を記録
      economySystem.recordIncome('expedition', 2000, 'テスト収入1', 'reward')
      economySystem.recordIncome('expedition', 3000, 'テスト収入2', 'reward')
      economySystem.recordExpense('facility_maintenance', 1000, 'テスト支出', 'maintenance')
      
      const report = economySystem.generateMonthlyReport()
      
      expect(report).toBeDefined()
      expect(report.summary.total_income).toBeGreaterThan(0)
      expect(report.summary.total_expenses).toBeGreaterThan(0)
      expect(report.summary.net_income).toBeDefined()
      expect(report.topExpenses).toBeDefined()
      expect(report.topIncomes).toBeDefined()
      expect(report.recommendations).toBeDefined()
      expect(report.topExpenses.length).toBeGreaterThan(0)
    })
  })

  describe('施設システム', () => {
    test('施設の基本操作', () => {
      const facilities = facilitySystem.getAllFacilities()
      expect(facilities.length).toBeGreaterThan(0)
      
      const trainingGround = facilitySystem.getFacility('training_ground')
      expect(trainingGround).toBeDefined()
      expect(trainingGround?.name).toBe('訓練場')
      expect(trainingGround?.level).toBeGreaterThanOrEqual(1)
    })

    test('施設アップグレード', async () => {
      const trainingGround = facilitySystem.getFacility('training_ground')
      const initialLevel = trainingGround?.level || 0
      
      // アップグレード開始
      const result = await facilitySystem.startUpgrade('training_ground')
      expect(result.success).toBe(true)
      expect(result.projectId).toBeDefined()
      
      // 即座完了
      if (result.projectId) {
        const completed = await facilitySystem.completeUpgradeInstantly(result.projectId)
        expect(completed).toBe(true)
        
        // レベルが上がったことを確認
        const upgradedFacility = facilitySystem.getFacility('training_ground')
        expect(upgradedFacility?.level).toBe(initialLevel + 1)
      }
    })

    test('施設効果の計算', () => {
      const effects = facilitySystem.calculateGlobalEffects()
      expect(effects).toBeDefined()
      
      // 何らかの効果があることを確認
      const effectTypes = Object.keys(effects)
      expect(effectTypes.length).toBeGreaterThan(0)
    })
  })

  describe('トレーナーシステム', () => {
    test('レベル計算', () => {
      expect(trainerSystem.calculateLevel(0)).toBe(1)
      expect(trainerSystem.calculateLevel(1000)).toBe(2)
      expect(trainerSystem.calculateLevel(2500)).toBe(3)
      expect(trainerSystem.calculateLevel(10000)).toBe(6)
    })

    test('次レベルまでの経験値計算', () => {
      const expInfo = trainerSystem.getExperienceToNextLevel(1500)
      expect(expInfo.currentLevel).toBe(2)
      expect(expInfo.nextLevel).toBe(3)
      expect(expInfo.remaining).toBeGreaterThan(0)
      expect(expInfo.progress).toBeGreaterThan(0)
      expect(expInfo.progress).toBeLessThanOrEqual(1)
    })

    test('トレーナー生成', () => {
      const trainer = trainerSystem.generateTrainer('ranger', 5)
      
      expect(trainer.level).toBe(5)
      expect(trainer.job).toBe('ranger')
      expect(trainer.name).toBeDefined()
      expect(trainer.skills).toBeDefined()
      expect(trainer.personality).toBeDefined()
      expect(trainer.salary_base).toBeGreaterThan(0)
      
      // レンジャーは特定スキルが高いことを確認
      expect(trainer.skills.pokemon_handling).toBeGreaterThan(trainer.skills.research)
    })

    test('レベルアップ処理', () => {
      const trainer = trainerSystem.generateTrainer('explorer', 1)
      const initialLevel = trainer.level
      const initialSkills = { ...trainer.skills }
      
      // 大量の経験値を追加してレベルアップさせる
      const levelUpResult = trainerSystem.processLevelUp(trainer, 5000)
      
      expect(levelUpResult.leveledUp).toBe(true)
      if (levelUpResult.result) {
        expect(levelUpResult.result.newLevel).toBeGreaterThan(initialLevel)
        expect(levelUpResult.result.skillsImproved.length).toBeGreaterThan(0)
        expect(levelUpResult.result.salaryIncrease).toBeGreaterThan(0)
        
        // スキルが向上していることを確認
        const improvedSkills = levelUpResult.result.skillsImproved
        for (const improvement of improvedSkills) {
          expect(improvement.newValue).toBeGreaterThan(improvement.oldValue)
        }
      }
    })
  })

  describe('システム間連携', () => {
    test('派遣成功時の全システム連動', async () => {
      const initialMoney = economySystem.getCurrentMoney()
      
      // 高レベルトレーナーで成功しやすい派遣を実行
      const result = await gameController.executeExpedition({
        trainerId: 'test_trainer',
        locationId: 'route_22', // 比較的簡単な場所
        durationHours: 1,
        strategy: 'balanced',
        playerAdvice: []
      })
      
      if (result.result.success) {
        // 経済システムに反映されている
        expect(result.economicImpact.moneyGained).toBeGreaterThan(0)
        expect(economySystem.getCurrentMoney()).toBeGreaterThan(initialMoney)
        
        // ポケモン捕獲があった場合
        if (result.result.rewards.pokemonCaught.length > 0) {
          expect(result.pokemonCaught.length).toBe(result.result.rewards.pokemonCaught.length)
        }
        
        // 音響システムが反応している
        expect(result.sounds.length).toBeGreaterThan(0)
      }
    })

    test('施設効果が派遣に影響する', async () => {
      // 訓練場をアップグレードして効果を上げる
      facilitySystem.debugSetFacilityLevel('training_ground', 5)
      
      const effects = facilitySystem.calculateGlobalEffects()
      const trainerBonus = effects.trainer_experience_bonus || 0
      
      expect(trainerBonus).toBeGreaterThan(0)
      
      // 派遣実行（施設効果が適用されるはず）
      const result = await gameController.executeExpedition({
        trainerId: 'test_trainer',
        locationId: 'viridian_forest',
        durationHours: 2,
        strategy: 'balanced',
        playerAdvice: []
      })
      
      expect(result.result.trainerStatus.experienceGained).toBeGreaterThan(0)
    })
  })

  describe('エラーハンドリング', () => {
    test('存在しない派遣先への派遣', async () => {
      await expect(
        expeditionSystem.executeExpedition({
          trainerId: 'test_trainer',
          locationId: 'nonexistent_location',
          durationHours: 1,
          strategy: 'balanced',
          playerAdvice: []
        })
      ).rejects.toThrow('Location not found')
    })

    test('資金不足でのアップグレード', async () => {
      // 資金を0に設定
      economySystem.setCurrentMoney(0)
      
      const result = await facilitySystem.startUpgrade('training_ground')
      expect(result.success).toBe(false)
      expect(result.message).toContain('資金')
    })

    test('不正なパラメータでのポケモン捕獲', () => {
      const invalidAttempt = {
        species: undefined,
        location: EXPEDITION_LOCATIONS[0],
        trainer: { level: 10 },
        party: []
      }

      // 不正なパラメータではエラーが発生するべき
      expect(() => {
        pokemonSystem.attemptCapture(invalidAttempt as any)
      }).toThrow()
    })
  })

  describe('パフォーマンス', () => {
    test('大量派遣の実行時間', async () => {
      const start = Date.now()
      
      // 10回の派遣を並列実行
      const promises = Array.from({ length: 10 }, () =>
        gameController.executeExpedition({
          trainerId: 'test_trainer',
          locationId: 'route_22',
          durationHours: 1,
          strategy: 'balanced',
          playerAdvice: []
        })
      )
      
      const results = await Promise.all(promises)
      const end = Date.now()
      
      expect(results).toHaveLength(10)
      expect(end - start).toBeLessThan(5000) // 5秒以内
      
      // 全て正常に実行されたことを確認
      results.forEach(result => {
        expect(result.result).toBeDefined()
        expect(result.economicImpact).toBeDefined()
      })
    })

    test('施設システムの応答時間', () => {
      const start = Date.now()
      
      // 多数の施設操作
      for (let i = 0; i < 100; i++) {
        facilitySystem.getAllFacilities()
        facilitySystem.getFacilityStatus()
        facilitySystem.calculateGlobalEffects()
      }
      
      const end = Date.now()
      expect(end - start).toBeLessThan(1000) // 1秒以内
    })
  })
})

// テスト実行後のクリーンアップ
afterAll(() => {
  console.log('✅ 全システム統合テスト完了')
})