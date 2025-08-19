#!/usr/bin/env node

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import chalk from 'chalk'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log(chalk.cyan.bold('=== Supabase認証テスト ==='))

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuth() {
  console.log(chalk.blue('ℹ'), '認証機能をテスト中...')

  // テスト用メールアドレス
  const testEmail = 'test@tokiwa.school'
  const testPassword = 'password123'

  try {
    // 1. サインアップテスト
    console.log(chalk.blue('ℹ'), 'サインアップテスト:', testEmail)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          trainer_name: 'テスト館長',
          school_name: 'テストスクール'
        }
      }
    })

    if (signUpError) {
      console.log(chalk.yellow('⚠'), 'サインアップエラー:', signUpError.message)
      
      // ユーザーが既に存在する場合は正常
      if (signUpError.message.includes('User already registered')) {
        console.log(chalk.blue('ℹ'), 'ユーザーは既に登録済みです')
      }
    } else {
      console.log(chalk.green('✓'), 'サインアップ成功:', signUpData.user?.email)
    }

    // 2. サインインテスト
    console.log(chalk.blue('ℹ'), 'サインインテスト:', testEmail)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (signInError) {
      console.log(chalk.red('✗'), 'サインインエラー:', signInError.message)
      
      // 詳細なエラー情報を表示
      console.log(chalk.blue('ℹ'), 'エラー詳細:')
      console.log('  - エラーコード:', signInError.status)
      console.log('  - エラータイプ:', signInError.name)
      console.log('  - メッセージ:', signInError.message)
    } else {
      console.log(chalk.green('✓'), 'サインイン成功:', signInData.user?.email)
      console.log(chalk.green('✓'), 'ユーザーID:', signInData.user?.id)
    }

    // 3. 現在のセッション確認
    console.log(chalk.blue('ℹ'), '現在のセッションを確認中...')
    const { data: session, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.log(chalk.red('✗'), 'セッションエラー:', sessionError.message)
    } else if (session.session) {
      console.log(chalk.green('✓'), 'アクティブなセッションが見つかりました')
      console.log('  - ユーザー:', session.session.user.email)
      console.log('  - 有効期限:', new Date(session.session.expires_at * 1000))
    } else {
      console.log(chalk.yellow('⚠'), 'アクティブなセッションはありません')
    }

    // 4. プロファイル確認
    if (session.session?.user) {
      console.log(chalk.blue('ℹ'), 'プロファイル情報を確認中...')
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.session.user.id)
        .single()

      if (profileError) {
        console.log(chalk.yellow('⚠'), 'プロファイルエラー:', profileError.message)
      } else {
        console.log(chalk.green('✓'), 'プロファイル取得成功')
        console.log('  - 館長名:', profile.trainer_name)
        console.log('  - スクール名:', profile.school_name)
        console.log('  - 所持金:', profile.current_money)
      }
    }

  } catch (error) {
    console.log(chalk.red('✗'), '予期しないエラー:', error.message)
  }
}

console.log(chalk.cyan.bold('=== 認証機能診断開始 ==='))
await testAuth()
console.log(chalk.cyan.bold('=== 診断完了 ==='))