/**
 * 入力フィールドのサニタイゼーションとバリデーション
 */

export interface InputValidationOptions {
  maxLength?: number
  minLength?: number
  allowSpecialChars?: boolean
  allowNumbers?: boolean
  allowSpaces?: boolean
  customPattern?: RegExp
}

/**
 * 入力値を安全にサニタイズする
 */
export function sanitizeInput(
  value: string, 
  options: InputValidationOptions = {}
): string {
  try {
    if (typeof value !== 'string') {
      console.warn('⚠️ sanitizeInput: 非文字列の入力を受信:', typeof value)
      return ''
    }

    const {
      maxLength = 100,
      minLength = 0,
      allowSpecialChars = false,
      allowNumbers = true,
      allowSpaces = true,
    } = options

    // 基本的なサニタイゼーション
    let sanitized = value

    // 危険な文字列を除去
    sanitized = sanitized.replace(/[<>\"'&]/g, '')
    
    // 制御文字を除去
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '')
    
    // 特殊文字の処理
    if (!allowSpecialChars) {
      sanitized = sanitized.replace(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g, '')
    }
    
    // 数字の処理
    if (!allowNumbers) {
      sanitized = sanitized.replace(/[0-9]/g, '')
    }
    
    // スペースの処理
    if (!allowSpaces) {
      sanitized = sanitized.replace(/\s/g, '')
    }

    // 長さの制限
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength)
    }

    return sanitized
  } catch (error) {
    console.error('❌ sanitizeInput エラー:', error)
    return ''
  }
}

/**
 * 入力値をバリデーションする
 */
export function validateInput(
  value: string,
  options: InputValidationOptions = {}
): { isValid: boolean; errors: string[] } {
  try {
    const errors: string[] = []
    const {
      maxLength = 100,
      minLength = 0,
      customPattern
    } = options

    if (typeof value !== 'string') {
      errors.push('入力値が無効です')
      return { isValid: false, errors }
    }

    // 長さのバリデーション
    if (value.length < minLength) {
      errors.push(`${minLength}文字以上で入力してください`)
    }
    
    if (value.length > maxLength) {
      errors.push(`${maxLength}文字以内で入力してください`)
    }

    // カスタムパターンのバリデーション
    if (customPattern && !customPattern.test(value)) {
      errors.push('入力形式が正しくありません')
    }

    return { isValid: errors.length === 0, errors }
  } catch (error) {
    console.error('❌ validateInput エラー:', error)
    return { isValid: false, errors: ['入力の検証中にエラーが発生しました'] }
  }
}

/**
 * 館長名用の安全な入力ハンドラー
 */
export function sanitizeTrainerName(value: string): string {
  return sanitizeInput(value, {
    maxLength: 20,
    minLength: 0,
    allowSpecialChars: true, // 一部の記号は許可
    allowNumbers: true,
    allowSpaces: true
  })
}

/**
 * スクール名用の安全な入力ハンドラー
 */
export function sanitizeSchoolName(value: string): string {
  return sanitizeInput(value, {
    maxLength: 50,
    minLength: 0,
    allowSpecialChars: true,
    allowNumbers: true,
    allowSpaces: true
  })
}

/**
 * メールアドレス用の安全な入力ハンドラー
 */
export function sanitizeEmail(value: string): string {
  return sanitizeInput(value, {
    maxLength: 100,
    allowSpecialChars: true, // @, ., -, _など必要
    allowNumbers: true,
    allowSpaces: false
  })
}