/**
 * データ検証・修復システム
 * ゲームデータの整合性検証と自動修復機能
 */

import { getDataValidator } from './DataValidator'

export { DataValidator, getDataValidator } from './DataValidator'
export type { ValidationRule } from './DataValidator'

// 検証システム初期化ヘルパー
export const initializeValidationSystem = () => {
  const validator = getDataValidator()
  
  console.log('🔍 検証システム初期化完了')
  console.log('📋 登録済み検証ルール:', validator.getRules().length)
  
  return validator
}