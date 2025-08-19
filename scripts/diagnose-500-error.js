#!/usr/bin/env node

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import chalk from 'chalk'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log(chalk.cyan.bold('=== Supabase 500エラー診断 ==='))

// Anonクライアント（フロントエンド用）
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)

// Service Roleクライアント（管理者権限）
const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

async function diagnose500Error() {
  console.log(chalk.blue('ℹ'), '500エラーの原因を診断中...')

  try {
    // 1. Supabase接続基本テスト
    console.log(chalk.blue('ℹ'), '基本接続テスト...')
    console.log('  - URL:', supabaseUrl)
    console.log('  - Anon Key:', supabaseAnonKey ? '設定済み' : '未設定')
    console.log('  - Service Key:', supabaseServiceKey ? '設定済み' : '未設定')

    // 2. プロジェクト設定確認
    console.log(chalk.blue('ℹ'), 'プロジェクト設定を確認中...')
    try {
      const { data: settings, error: settingsError } = await supabaseService.rpc('get_api_version')
      if (settingsError) {
        console.log(chalk.yellow('⚠'), 'プロジェクト設定エラー:', settingsError.message)
      } else {
        console.log(chalk.green('✓'), 'プロジェクト接続成功')
      }
    } catch (err) {
      console.log(chalk.yellow('⚠'), 'プロジェクト設定確認をスキップ')
    }

    // 3. 認証設定確認
    console.log(chalk.blue('ℹ'), '認証設定を確認中...')
    try {
      // 認証プロバイダーの状態を確認
      const { data: authConfig, error: authError } = await supabaseService.auth.admin.listUsers()
      
      if (authError) {
        console.log(chalk.red('✗'), '認証設定エラー:', authError.message)
        console.log(chalk.blue('ℹ'), '詳細:')
        console.log('  - エラーコード:', authError.status)
        console.log('  - エラータイプ:', authError.name)
        
        // 500エラーの典型的な原因
        if (authError.message.includes('Database')) {
          console.log(chalk.yellow('⚠'), '原因候補: データベーストリガーまたはRLSポリシーエラー')
        }
        if (authError.message.includes('function')) {
          console.log(chalk.yellow('⚠'), '原因候補: PostgreSQL関数エラー')
        }
        if (authError.message.includes('trigger')) {
          console.log(chalk.yellow('⚠'), '原因候補: トリガー関数のエラー')
        }
      } else {
        console.log(chalk.green('✓'), '認証設定アクセス成功')
        console.log('  - 既存ユーザー数:', authConfig.users?.length || 0)
      }
    } catch (err) {
      console.log(chalk.red('✗'), '認証設定確認エラー:', err.message)
    }

    // 4. データベーステーブル存在確認
    console.log(chalk.blue('ℹ'), 'データベーステーブル存在確認...')
    const tables = ['profiles', 'pokemon', 'trainers', 'expeditions', 'facilities']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseService
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(chalk.red('✗'), `テーブル '${table}':`, error.message)
        } else {
          console.log(chalk.green('✓'), `テーブル '${table}': 存在確認`)
        }
      } catch (err) {
        console.log(chalk.red('✗'), `テーブル '${table}':`, err.message)
      }
    }

    // 5. トリガー関数確認
    console.log(chalk.blue('ℹ'), 'トリガー関数の確認...')
    try {
      const { data: functions, error: funcError } = await supabaseService.rpc('pg_get_functiondef', {
        func_oid: 'handle_new_user'
      })
      
      if (funcError) {
        console.log(chalk.yellow('⚠'), 'handle_new_user関数エラー:', funcError.message)
      } else {
        console.log(chalk.green('✓'), 'handle_new_user関数存在確認')
      }
    } catch (err) {
      console.log(chalk.yellow('⚠'), 'トリガー関数確認をスキップ:', err.message)
    }

    // 6. 直接テストユーザー作成（管理者権限）
    console.log(chalk.blue('ℹ'), '管理者権限でのテストユーザー作成...')
    try {
      const testEmail = `test-${Date.now()}@tokiwa.school`
      const { data: adminUser, error: adminError } = await supabaseService.auth.admin.createUser({
        email: testEmail,
        password: 'password123',
        email_confirm: true,
        user_metadata: {
          trainer_name: 'テスト館長',
          school_name: 'テストスクール'
        }
      })

      if (adminError) {
        console.log(chalk.red('✗'), '管理者ユーザー作成エラー:', adminError.message)
        
        // 具体的なエラー診断
        if (adminError.message.includes('trigger')) {
          console.log(chalk.yellow('⚠'), '診断結果: トリガー関数 handle_new_user にエラーがあります')
          console.log(chalk.blue('ℹ'), '推奨対策: SQLトリガー関数を再作成してください')
        }
      } else {
        console.log(chalk.green('✓'), '管理者ユーザー作成成功:', adminUser.user?.email)
        
        // 作成したテストユーザーを削除
        await supabaseService.auth.admin.deleteUser(adminUser.user.id)
        console.log(chalk.blue('ℹ'), 'テストユーザーを削除しました')
      }
    } catch (err) {
      console.log(chalk.red('✗'), '管理者ユーザー作成エラー:', err.message)
    }

  } catch (error) {
    console.log(chalk.red('✗'), '診断プロセスエラー:', error.message)
  }

  // 7. 推奨対策の提示
  console.log(chalk.cyan.bold('\n=== 推奨対策 ==='))
  console.log(chalk.blue('ℹ'), '500エラーの主な原因と対策:')
  console.log('1. トリガー関数エラー → setup-database-now.sqlを再実行')
  console.log('2. RLSポリシーエラー → ポリシーの削除と再作成') 
  console.log('3. テーブル権限エラー → 公開スキーマ権限の確認')
  console.log('4. PostgreSQL拡張エラー → 必要な拡張機能の確認')
}

await diagnose500Error()
console.log(chalk.cyan.bold('\n=== 診断完了 ==='))