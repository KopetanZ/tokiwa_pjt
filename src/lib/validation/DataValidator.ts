/**
 * データ検証・修復システム
 * ゲームデータの整合性を検証し、問題を自動修復する
 */

import type { GameData } from '../game-state/types'
import type { UnifiedSaveData, ValidationError, ValidationResult, RepairResult } from '../unified-data/types'
import { getStaticDataManager } from '../static-data'
import { validateGameData, normalizeGameData, CURRENT_SCHEMA_VERSION } from '../schemas'

export interface ValidationRule {
  id: string
  name: string
  description: string
  severity: ValidationError['severity']
  autoFixable: boolean
  validate: (data: GameData) => ValidationError[]
  repair?: (data: GameData, errors: ValidationError[]) => GameData
}

export class DataValidator {
  private rules: Map<string, ValidationRule> = new Map()
  private staticDataManager = getStaticDataManager()
  
  constructor() {
    this.initializeDefaultRules()
    console.log('🔍 データ検証システム初期化完了')
  }
  
  /**
   * 検証ルールを追加
   */
  addRule(rule: ValidationRule): void {
    this.rules.set(rule.id, rule)
    console.log('📋 検証ルール追加:', rule.name)
  }
  
  /**
   * 検証ルールを削除
   */
  removeRule(id: string): boolean {
    return this.rules.delete(id)
  }
  
  /**
   * 全検証ルールを取得
   */
  getRules(): ValidationRule[] {
    return Array.from(this.rules.values())
  }
  
  /**
   * ゲームデータを検証
   */
  async validateGameData(data: GameData): Promise<ValidationResult> {
    const startTime = performance.now()
    const allErrors: ValidationError[] = []
    const warnings: ValidationError[] = []
    
    try {
      // 基本スキーマ検証
      const schemaValidation = validateGameData(data)
      if (!schemaValidation.isValid) {
        allErrors.push(...schemaValidation.errors.map(error => ({
          type: 'corrupted_data' as const,
          severity: 'error' as const,
          message: error,
          location: 'schema_validation',
          autoFixable: true,
          suggestedFix: 'データを正規化'
        })))
      }
      
      // 各検証ルールを実行
      Array.from(this.rules.values()).forEach(rule => {
        try {
          const ruleErrors = rule.validate(data)
          ruleErrors.forEach(error => {
            if (error.severity === 'warning') {
              warnings.push(error)
            } else {
              allErrors.push(error)
            }
          })
        } catch (error) {
          console.warn(`⚠️ 検証ルール '${rule.id}' でエラー:`, error)
          allErrors.push({
            type: 'corrupted_data',
            severity: 'error',
            message: `検証ルール '${rule.id}' の実行に失敗: ${error}`,
            location: `validation_rule_${rule.id}`,
            autoFixable: false
          })
        }
      });
      
      const duration = performance.now() - startTime
      
      const result: ValidationResult = {
        isValid: allErrors.length === 0,
        errors: allErrors,
        warnings,
        repairSuggestions: this.generateRepairSuggestions(allErrors),
        validationTime: duration
      }
      
      console.log('🔍 データ検証完了:', {
        isValid: result.isValid,
        errors: allErrors.length,
        warnings: warnings.length,
        duration: `${duration.toFixed(1)}ms`
      })
      
      return result
    } catch (error) {
      console.error('❌ データ検証中にエラー:', error)
      return {
        isValid: false,
        errors: [{
          type: 'corrupted_data',
          severity: 'critical',
          message: `検証処理エラー: ${error}`,
          location: 'validation_system',
          autoFixable: false
        }],
        warnings: [],
        repairSuggestions: [],
        validationTime: performance.now() - startTime
      }
    }
  }
  
  /**
   * 統合セーブデータを検証
   */
  async validateUnifiedData(data: UnifiedSaveData): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []
    
    // 基本構造チェック
    if (!data.gameData) {
      errors.push({
        type: 'missing_data',
        severity: 'critical',
        message: 'ゲームデータが見つかりません',
        location: 'unified_data.gameData',
        autoFixable: false
      })
      
      return {
        isValid: false,
        errors,
        warnings,
        repairSuggestions: [],
        validationTime: 0
      }
    }
    
    // バージョンチェック
    if (data.version !== CURRENT_SCHEMA_VERSION) {
      warnings.push({
        type: 'version_mismatch',
        severity: 'warning',
        message: `データバージョン不一致: ${data.version} (現在: ${CURRENT_SCHEMA_VERSION})`,
        location: 'unified_data.version',
        autoFixable: true,
        suggestedFix: 'データマイグレーションを実行'
      })
    }
    
    // ゲームデータ検証
    const gameDataValidation = await this.validateGameData(data.gameData)
    errors.push(...gameDataValidation.errors)
    warnings.push(...gameDataValidation.warnings)
    
    // データ整合性チェック
    if (data.dataIntegrity && !data.dataIntegrity.isValid) {
      warnings.push({
        type: 'corrupted_data',
        severity: 'warning',
        message: '前回の検証で問題が検出されました',
        location: 'unified_data.dataIntegrity',
        autoFixable: true,
        suggestedFix: 'データ修復を実行'
      })
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      repairSuggestions: this.generateRepairSuggestions(errors),
      validationTime: gameDataValidation.validationTime
    }
  }
  
  /**
   * データ修復を実行
   */
  async repairGameData(data: GameData, validationResult?: ValidationResult): Promise<RepairResult> {
    const startTime = performance.now()
    
    try {
      let repairedData = JSON.parse(JSON.stringify(data)) // ディープコピー
      const fixedErrors: ValidationError[] = []
      const changes: string[] = []
      let hasChanges = false
      
      // 検証結果がない場合は新規検証
      const validation = validationResult || await this.validateGameData(data)
      
      // スキーマ正規化
      const normalizedData = normalizeGameData(repairedData)
      if (JSON.stringify(normalizedData) !== JSON.stringify(repairedData)) {
        repairedData = normalizedData
        changes.push('データを正規化しました')
        hasChanges = true
      }
      
      // 自動修復可能なエラーを処理
      for (const error of validation.errors) {
        if (error.autoFixable) {
          const fixed = await this.fixError(repairedData, error)
          if (fixed.success) {
            repairedData = fixed.data
            fixedErrors.push(error)
            changes.push(...fixed.changes)
            hasChanges = true
          }
        }
      }
      
      // 修復後の検証
      let remainingErrors: ValidationError[] = []
      if (hasChanges) {
        const postRepairValidation = await this.validateGameData(repairedData)
        remainingErrors = postRepairValidation.errors
      } else {
        remainingErrors = validation.errors.filter(e => !e.autoFixable)
      }
      
      const duration = performance.now() - startTime
      
      const result: RepairResult = {
        success: fixedErrors.length > 0 || hasChanges,
        fixedErrors: fixedErrors.length,
        remainingErrors,
        changes,
        backupCreated: false // バックアップは上位層で作成
      }
      
      console.log('🔧 データ修復完了:', {
        success: result.success,
        fixedErrors: result.fixedErrors,
        remainingErrors: result.remainingErrors.length,
        changes: result.changes.length,
        duration: `${duration.toFixed(1)}ms`
      })
      
      return result
    } catch (error) {
      console.error('❌ データ修復中にエラー:', error)
      return {
        success: false,
        fixedErrors: 0,
        remainingErrors: [],
        changes: [],
        backupCreated: false
      }
    }
  }
  
  // =================== プライベートメソッド ===================
  
  /**
   * デフォルト検証ルールを初期化
   */
  private initializeDefaultRules(): void {
    // 基本データ検証ルール
    this.addRule({
      id: 'required_fields',
      name: '必須フィールド検証',
      description: '必要なデータフィールドが存在するかチェック',
      severity: 'error',
      autoFixable: true,
      validate: (data) => {
        const errors: ValidationError[] = []
        
        if (!data.userId) {
          errors.push({
            type: 'missing_data',
            severity: 'error',
            message: 'ユーザーIDが設定されていません',
            location: 'userId',
            autoFixable: true,
            suggestedFix: 'デフォルトユーザーIDを設定'
          })
        }
        
        if (!data.player.name) {
          errors.push({
            type: 'missing_data',
            severity: 'error',
            message: 'プレイヤー名が設定されていません',
            location: 'player.name',
            autoFixable: true,
            suggestedFix: 'デフォルト名を設定'
          })
        }
        
        return errors
      },
      repair: (data, errors) => {
        const repaired = { ...data }
        
        errors.forEach(error => {
          if (error.location === 'userId') {
            repaired.userId = 'guest_' + Date.now()
          } else if (error.location === 'player.name') {
            repaired.player.name = 'プレイヤー'
          }
        })
        
        return repaired
      }
    })
    
    // 参照整合性検証ルール
    this.addRule({
      id: 'reference_integrity',
      name: '参照整合性検証',
      description: 'データ間の参照が正しいかチェック',
      severity: 'error',
      autoFixable: true,
      validate: (data) => {
        const errors: ValidationError[] = []
        
        // 派遣のトレーナー参照チェック
        data.expeditions.forEach((expedition, index) => {
          const trainer = data.trainers.find(t => t.id === expedition.trainerId)
          if (!trainer) {
            errors.push({
              type: 'invalid_reference',
              severity: 'error',
              message: `派遣${index}が存在しないトレーナーを参照しています`,
              location: `expeditions[${index}].trainerId`,
              autoFixable: true,
              suggestedFix: '無効な派遣を削除'
            })
          }
        })
        
        // ポケモンの捕獲者参照チェック
        data.pokemon.forEach((pokemon, index) => {
          if (pokemon.caughtBy) {
            const trainer = data.trainers.find(t => t.id === pokemon.caughtBy)
            if (!trainer) {
              errors.push({
                type: 'invalid_reference',
                severity: 'warning',
                message: `ポケモン${index}の捕獲者が存在しません`,
                location: `pokemon[${index}].caughtBy`,
                autoFixable: true,
                suggestedFix: '捕獲者情報をクリア'
              })
            }
          }
        })
        
        return errors
      },
      repair: (data, errors) => {
        const repaired = JSON.parse(JSON.stringify(data))
        
        errors.forEach(error => {
          if (error.location.includes('expeditions')) {
            const match = error.location.match(/expeditions\[(\d+)\]/)
            if (match) {
              const index = parseInt(match[1])
              repaired.expeditions.splice(index, 1)
            }
          } else if (error.location.includes('pokemon') && error.location.includes('caughtBy')) {
            const match = error.location.match(/pokemon\[(\d+)\]/)
            if (match) {
              const index = parseInt(match[1])
              repaired.pokemon[index].caughtBy = ''
              repaired.pokemon[index].originalTrainer = '不明'
            }
          }
        })
        
        return repaired
      }
    })
    
    // 数値範囲検証ルール
    this.addRule({
      id: 'numeric_ranges',
      name: '数値範囲検証',
      description: '数値フィールドが適切な範囲内にあるかチェック',
      severity: 'warning',
      autoFixable: true,
      validate: (data) => {
        const errors: ValidationError[] = []
        
        // プレイヤーレベルチェック
        if (data.player.level < 1 || data.player.level > 100) {
          errors.push({
            type: 'invalid_reference',
            severity: 'warning',
            message: `プレイヤーレベルが範囲外です: ${data.player.level}`,
            location: 'player.level',
            autoFixable: true,
            suggestedFix: '適切な範囲に修正'
          })
        }
        
        // 所持金チェック
        if (data.player.money < 0) {
          errors.push({
            type: 'invalid_reference',
            severity: 'error',
            message: `所持金が負の値です: ${data.player.money}`,
            location: 'player.money',
            autoFixable: true,
            suggestedFix: '0に修正'
          })
        }
        
        // トレーナーレベルチェック
        data.trainers.forEach((trainer, index) => {
          if (trainer.level < 1 || trainer.level > 100) {
            errors.push({
              type: 'invalid_reference',
              severity: 'warning',
              message: `トレーナー${index}のレベルが範囲外: ${trainer.level}`,
              location: `trainers[${index}].level`,
              autoFixable: true
            })
          }
        })
        
        return errors
      },
      repair: (data, errors) => {
        const repaired = JSON.parse(JSON.stringify(data))
        
        errors.forEach(error => {
          if (error.location === 'player.level') {
            repaired.player.level = Math.max(1, Math.min(100, repaired.player.level))
          } else if (error.location === 'player.money') {
            repaired.player.money = Math.max(0, repaired.player.money)
          } else if (error.location.includes('trainers') && error.location.includes('level')) {
            const match = error.location.match(/trainers\[(\d+)\]/)
            if (match) {
              const index = parseInt(match[1])
              repaired.trainers[index].level = Math.max(1, Math.min(100, repaired.trainers[index].level))
            }
          }
        })
        
        return repaired
      }
    })
    
    // 静的データ参照検証ルール
    this.addRule({
      id: 'static_data_references',
      name: '静的データ参照検証',
      description: '静的データへの参照が有効かチェック',
      severity: 'warning',
      autoFixable: false,
      validate: (data) => {
        const errors: ValidationError[] = []
        
        // トレーナーの職業チェック
        data.trainers.forEach((trainer, index) => {
          const jobDef = this.staticDataManager.getJob(trainer.job)
          if (!jobDef) {
            errors.push({
              type: 'invalid_reference',
              severity: 'warning',
              message: `トレーナー${index}の職業が無効: ${trainer.job}`,
              location: `trainers[${index}].job`,
              autoFixable: false
            })
          }
        })
        
        // 派遣先の参照チェック
        data.expeditions.forEach((expedition, index) => {
          const location = this.staticDataManager.getLocation(expedition.locationId)
          if (!location) {
            errors.push({
              type: 'invalid_reference',
              severity: 'warning',
              message: `派遣${index}の派遣先が無効: ${expedition.locationId}`,
              location: `expeditions[${index}].locationId`,
              autoFixable: false
            })
          }
        })
        
        // ポケモン種族の参照チェック
        data.pokemon.forEach((pokemon, index) => {
          const species = this.staticDataManager.getPokemon(pokemon.speciesId)
          if (!species) {
            errors.push({
              type: 'invalid_reference',
              severity: 'warning',
              message: `ポケモン${index}の種族が無効: ${pokemon.speciesId}`,
              location: `pokemon[${index}].speciesId`,
              autoFixable: false
            })
          }
        })
        
        return errors
      }
    })
    
    console.log('📋 デフォルト検証ルール初期化完了:', this.rules.size)
  }
  
  /**
   * エラー修復
   */
  private async fixError(data: GameData, error: ValidationError): Promise<{
    success: boolean
    data: GameData
    changes: string[]
  }> {
    const changes: string[] = []
    let repairedData = JSON.parse(JSON.stringify(data))
    
    try {
      // 修復ロジック実装
      const rule = Array.from(this.rules.values()).find(r => 
        r.validate(data).some(e => e.message === error.message && e.location === error.location)
      )
      
      if (rule && rule.repair) {
        repairedData = rule.repair(repairedData, [error])
        changes.push(`修復: ${error.message}`)
        return { success: true, data: repairedData, changes }
      }
      
      // 汎用修復
      switch (error.type) {
        case 'missing_data':
          if (error.location === 'userId') {
            repairedData.userId = 'guest_' + Date.now()
            changes.push('デフォルトユーザーIDを設定')
          } else if (error.location === 'player.name') {
            repairedData.player.name = 'プレイヤー'
            changes.push('デフォルトプレイヤー名を設定')
          }
          break
      }
      
      return { success: changes.length > 0, data: repairedData, changes }
    } catch (repairError) {
      console.error('❌ エラー修復失敗:', repairError)
      return { success: false, data, changes: [] }
    }
  }
  
  /**
   * 修復提案を生成
   */
  private generateRepairSuggestions(errors: ValidationError[]): any[] {
    return errors
      .filter(error => error.autoFixable)
      .map(error => ({
        errorType: error.type,
        description: error.suggestedFix || '自動修復可能',
        autoFixable: true,
        riskLevel: error.severity === 'critical' ? 'high' : error.severity === 'error' ? 'medium' : 'low',
        action: `修復: ${error.message}`
      }))
  }
}

// シングルトンインスタンス
let dataValidator: DataValidator | null = null

export const getDataValidator = (): DataValidator => {
  if (!dataValidator) {
    dataValidator = new DataValidator()
  }
  return dataValidator
}