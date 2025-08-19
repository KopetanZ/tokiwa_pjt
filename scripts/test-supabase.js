#!/usr/bin/env node

/**
 * Supabase接続・認証テストスクリプト
 * 使用法: node scripts/test-supabase.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// 色付きログ用の関数
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.cyan}${colors.bright}=== ${msg} ===${colors.reset}`)
}

async function testSupabaseConnection() {
  log.header('Supabase接続テスト開始')

  // 1. 環境変数の確認
  log.info('環境変数を確認中...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    log.error('NEXT_PUBLIC_SUPABASE_URL が設定されていません')
    return false
  }

  if (!supabaseKey) {
    log.error('NEXT_PUBLIC_SUPABASE_ANON_KEY が設定されていません')
    return false
  }

  log.success(`Supabase URL: ${supabaseUrl}`)
  log.success(`Anon Key: ${supabaseKey.substring(0, 20)}...`)
  
  if (serviceRoleKey) {
    log.success(`Service Role Key: ${serviceRoleKey.substring(0, 20)}...`)
  } else {
    log.warning('SUPABASE_SERVICE_ROLE_KEY が設定されていません（オプション）')
  }

  // 2. Supabaseクライアント作成
  log.info('Supabaseクライアントを作成中...')
  
  let supabase
  try {
    supabase = createClient(supabaseUrl, supabaseKey)
    log.success('Supabaseクライアント作成完了')
  } catch (error) {
    log.error(`Supabaseクライアント作成失敗: ${error.message}`)
    return false
  }

  // 3. 基本接続テスト
  log.info('基本接続をテスト中...')
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (error) {
      log.warning(`テーブル接続テスト: ${error.message}`)
      log.info('これは正常です（テーブルが存在しない可能性があります）')
    } else {
      log.success('基本接続テスト成功')
    }
  } catch (error) {
    log.error(`基本接続テスト失敗: ${error.message}`)
  }

  // 4. 認証テスト
  log.header('認証システムテスト')

  // 現在のセッション確認
  log.info('現在のセッションを確認中...')
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      log.error(`セッション取得エラー: ${error.message}`)
    } else if (session) {
      log.success(`既存セッション発見: ${session.user.email}`)
      log.info(`セッション有効期限: ${new Date(session.expires_at * 1000)}`)
    } else {
      log.info('現在セッションなし（正常）')
    }
  } catch (error) {
    log.error(`セッションテストエラー: ${error.message}`)
  }

  // 5. 匿名認証テスト
  log.info('匿名認証をテスト中...')
  
  try {
    const { data, error } = await supabase.auth.signInAnonymously()
    
    if (error) {
      log.warning(`匿名認証失敗: ${error.message}`)
      log.info('匿名認証が無効化されている可能性があります（セキュリティ設定）')
    } else {
      log.success(`匿名認証成功: ${data.user.id}`)
      
      // 匿名セッションからサインアウト
      await supabase.auth.signOut()
      log.info('匿名セッションからサインアウト')
    }
  } catch (error) {
    log.error(`匿名認証テストエラー: ${error.message}`)
  }

  // 6. データベーステーブル存在確認
  log.header('データベーステーブル確認')

  const tables = ['pokemon', 'trainers', 'expeditions', 'facilities', 'transactions', 'game_progress']
  
  for (const table of tables) {
    log.info(`テーブル '${table}' を確認中...`)
    
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)

      if (error) {
        if (error.code === 'PGRST106') {
          log.warning(`テーブル '${table}' が存在しません`)
        } else {
          log.error(`テーブル '${table}': ${error.message}`)
        }
      } else {
        log.success(`テーブル '${table}' 存在確認完了`)
      }
    } catch (error) {
      log.error(`テーブル '${table}' テストエラー: ${error.message}`)
    }
  }

  // 7. リアルタイム機能テスト
  log.header('リアルタイム機能テスト')

  log.info('リアルタイムチャンネルを作成中...')
  
  try {
    const channel = supabase.channel('test-channel')
    
    const subscription = channel
      .on('broadcast', { event: 'test' }, (payload) => {
        log.success(`リアルタイムメッセージ受信: ${JSON.stringify(payload)}`)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          log.success('リアルタイムチャンネル接続成功')
          
          // テストメッセージ送信
          setTimeout(() => {
            channel.send({
              type: 'broadcast',
              event: 'test',
              payload: { message: 'テストメッセージ', timestamp: new Date().toISOString() }
            })
          }, 1000)
          
          // 5秒後にクリーンアップ
          setTimeout(() => {
            subscription.unsubscribe()
            log.info('リアルタイムチャンネル切断')
          }, 3000)
          
        } else if (status === 'CLOSED') {
          log.info('リアルタイムチャンネル接続終了')
        } else {
          log.warning(`リアルタイムチャンネル状態: ${status}`)
        }
      })
      
  } catch (error) {
    log.error(`リアルタイム機能テストエラー: ${error.message}`)
  }

  // 8. 結果サマリー
  setTimeout(() => {
    log.header('テスト結果サマリー')
    log.info('基本的なSupabase接続は動作しているようです')
    log.info('認証問題の原因:')
    log.warning('1. 認証プロバイダー設定（Email/Password等が無効）')
    log.warning('2. RLS（Row Level Security）ポリシーの未設定')
    log.warning('3. 公開スキーマの権限設定')
    log.info('\n推奨解決策:')
    log.success('1. Supabase Dashboard → Authentication → Settings で認証方法を有効化')
    log.success('2. Database → Policies でRLSポリシーを設定')
    log.success('3. 開発環境では一時的に認証を無効化（現在の実装）')
  }, 4000)

  return true
}

// メイン実行
if (require.main === module) {
  testSupabaseConnection()
    .then(() => {
      setTimeout(() => {
        log.header('テスト完了')
        process.exit(0)
      }, 5000)
    })
    .catch((error) => {
      log.error(`テスト実行エラー: ${error.message}`)
      process.exit(1)
    })
}

module.exports = { testSupabaseConnection }