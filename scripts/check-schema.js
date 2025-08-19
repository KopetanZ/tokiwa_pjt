#!/usr/bin/env node

/**
 * データベーススキーマ確認スクリプト
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSchema() {
  console.log('🔍 データベーススキーマを確認中...')
  console.log('')

  const tables = ['pokemon', 'trainers', 'expeditions', 'facilities', 'transactions', 'game_progress', 'ai_analysis']
  
  for (const table of tables) {
    try {
      console.log(`📋 ${table} テーブル:`)
      
      // まず空のクエリを試行してスキーマエラーを確認
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`  ❌ エラー: ${error.message}`)
        if (error.message.includes('does not exist')) {
          console.log(`  💡 テーブル ${table} が存在しません`)
        }
      } else {
        console.log(`  ✅ テーブルが存在し、アクセス可能`)
        console.log(`  📊 レコード数: ${data?.length || 0}`)
      }
    } catch (err) {
      console.log(`  💥 例外: ${err.message}`)
    }
    console.log('')
  }
}

checkSchema().catch(console.error)