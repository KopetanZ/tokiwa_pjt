#!/usr/bin/env node

/**
 * トキワシティ訓練所 クイックスタートスクリプト
 * データベースの初期化とサンプルデータの挿入を行います
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// 環境変数の読み込み
require('dotenv').config()

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  console.error('NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runQuickStart() {
  console.log('🚀 トキワシティ訓練所 クイックスタート開始...')
  
  try {
    // 1. データベーススキーマの作成
    console.log('📊 データベーススキーマを作成中...')
    const schemaSql = fs.readFileSync(path.join(__dirname, '../setup-database-now.sql'), 'utf8')
    
    // SQLを分割して実行
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
          if (error) {
            console.warn(`⚠️ SQL実行警告: ${error.message}`)
          }
        } catch (err) {
          console.warn(`⚠️ SQL実行エラー: ${err.message}`)
        }
      }
    }
    
    console.log('✅ データベーススキーマの作成完了')
    
    // 2. サンプルデータの挿入
    console.log('🎯 サンプルデータを挿入中...')
    
    // トレーナー職業の挿入
    const trainerJobs = [
      {
        job_name: 'ranger',
        job_name_ja: 'レンジャー',
        description: '野生ポケモンの保護と調査を行う職業',
        max_level: 10,
        specializations: { capture: 1.25, exploration: 1.15, battle: 0.95 },
        unlock_cost: 0,
        sprite_path: '/sprites/jobs/ranger.png'
      },
      {
        job_name: 'breeder',
        job_name_ja: 'ブリーダー',
        description: 'ポケモンの繁殖と育成を専門とする職業',
        max_level: 10,
        specializations: { breeding: 1.30, healing: 1.20, capture: 1.05 },
        unlock_cost: 1000,
        sprite_path: '/sprites/jobs/breeder.png'
      },
      {
        job_name: 'battler',
        job_name_ja: 'バトラー',
        description: 'ポケモンバトルを専門とする職業',
        max_level: 10,
        specializations: { battle: 1.25, strategy: 1.15, capture: 0.90 },
        unlock_cost: 2000,
        sprite_path: '/sprites/jobs/battler.png'
      }
    ]
    
    for (const job of trainerJobs) {
      const { error } = await supabase
        .from('trainer_jobs')
        .upsert(job, { onConflict: 'job_name' })
      
      if (error) {
        console.warn(`⚠️ トレーナー職業挿入警告: ${error.message}`)
      }
    }
    
    // 派遣先の挿入
    const locations = [
      {
        location_name: 'viridian_forest',
        location_name_ja: 'トキワの森',
        region: 'kanto',
        distance_level: 1,
        travel_cost: 500,
        travel_time_hours: 2,
        risk_level: 1.0,
        base_reward_money: 1000,
        reward_multiplier: 1.0,
        encounter_species: [1, 4, 7, 10, 13, 16, 19, 21, 23, 25, 27, 29, 32, 35, 37, 39, 41, 43, 46, 48, 50, 52, 54, 56, 58, 60, 63, 66, 69, 72, 74, 77, 79, 81, 84, 86, 88, 90, 92, 95, 96, 98, 100, 102, 104, 106, 107, 108, 109, 111, 113, 114, 115, 116, 118, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151],
        encounter_rates: { common: 0.6, uncommon: 0.3, rare: 0.1 },
        background_image: '/images/locations/viridian_forest.jpg',
        map_icon: '/icons/locations/forest.png',
        unlock_requirements: {},
        is_unlocked_by_default: true
      },
      {
        location_name: 'route_22',
        location_name_ja: '22番道路',
        region: 'kanto',
        distance_level: 1,
        travel_cost: 300,
        travel_time_hours: 1,
        risk_level: 0.8,
        base_reward_money: 800,
        reward_multiplier: 0.9,
        encounter_species: [19, 21, 23, 27, 29, 32, 35, 37, 39, 41, 43, 46, 48, 50, 52, 54, 56, 58, 60, 63, 66, 69, 72, 74, 77, 79, 81, 84, 86, 88, 90, 92, 95, 96, 98, 100, 102, 104, 106, 107, 108, 109, 111, 113, 114, 115, 116, 118, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151],
        encounter_rates: { common: 0.7, uncommon: 0.25, rare: 0.05 },
        background_image: '/images/locations/route_22.jpg',
        map_icon: '/icons/locations/route.png',
        unlock_requirements: {},
        is_unlocked_by_default: true
      }
    ]
    
    for (const location of locations) {
      const { error } = await supabase
        .from('expedition_locations')
        .upsert(location, { onConflict: 'location_name' })
      
      if (error) {
        console.warn(`⚠️ 派遣先挿入警告: ${error.message}`)
      }
    }
    
    console.log('✅ サンプルデータの挿入完了')
    
    // 3. 完了メッセージ
    console.log('\n🎉 クイックスタートが完了しました！')
    console.log('\n📋 次のステップ:')
    console.log('1. ブラウザでアプリケーションを開く')
    console.log('2. 新しいアカウントを作成する')
    console.log('3. ゲームを開始する')
    
  } catch (error) {
    console.error('❌ クイックスタート中にエラーが発生しました:', error)
    process.exit(1)
  }
}

// スクリプト実行
if (require.main === module) {
  runQuickStart()
}

module.exports = { runQuickStart }
