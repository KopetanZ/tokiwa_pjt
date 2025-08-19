#!/usr/bin/env node

/**
 * テーブルカラム確認スクリプト
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

async function checkTableColumns() {
  console.log('🔍 テーブル構造を確認中...')
  console.log('')

  const tables = ['pokemon', 'trainers', 'expeditions', 'facilities', 'transactions']
  
  for (const table of tables) {
    try {
      console.log(`📋 ${table} テーブル:`)
      
      // 空のクエリで1レコード取得を試行（カラム情報を得る）
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`  ❌ エラー: ${error.message}`)
      } else {
        console.log(`  ✅ アクセス可能`)
      }
      
      // より詳細なスキーマ情報を取得
      const { data: schemaData, error: schemaError } = await supabase
        .rpc('get_table_columns', { table_name: table })
        .single()
      
      if (schemaError) {
        console.log(`  💡 スキーマ情報取得不可: ${schemaError.message}`)
      }
      
    } catch (err) {
      console.log(`  💥 例外: ${err.message}`)
    }
    console.log('')
  }
  
  // 代替案：各テーブルに存在するレコードから構造を推測
  console.log('🔬 代替案: 空のINSERTでカラム情報を確認...')
  
  for (const table of tables) {
    try {
      // 故意に失敗させてエラーメッセージからカラム情報を得る
      const { error } = await supabase
        .from(table)
        .insert({})
      
      if (error) {
        console.log(`📋 ${table} 必須カラム情報:`)
        console.log(`  ${error.message}`)
        console.log('')
      }
    } catch (err) {
      console.log(`${table}: ${err.message}`)
    }
  }
}

checkTableColumns().catch(console.error)