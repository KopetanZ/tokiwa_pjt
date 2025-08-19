#!/usr/bin/env node

/**
 * トキワシティ訓練所: サンプルデータ自動投入スクリプト
 * 
 * 使用方法:
 * node scripts/setup-sample-data.js [user-id]
 * 
 * 例:
 * node scripts/setup-sample-data.js e5651d93-2721-461f-b42a-3d6ba1a6944c
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
const { randomUUID } = require('crypto')
require('dotenv').config({ path: '.env.local' })

// Supabase設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL')
  console.error('  SUPABASE_SERVICE_ROLE_KEY')
  console.error('')
  console.error('💡 .env.local ファイルを確認してください')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// コマンドライン引数からユーザーIDを取得
const userId = process.argv[2] || 'e5651d93-2721-461f-b42a-3d6ba1a6944c'

console.log('🎮 トキワシティ訓練所: サンプルデータ投入')
console.log('=' .repeat(50))
console.log(`📍 ユーザーID: ${userId}`)
console.log(`🔗 Supabase URL: ${supabaseUrl}`)
console.log('')

const sampleData = {
  // ポケモンデータ
  pokemon: [
    {
      id: randomUUID(),
      user_id: userId,
      dex_number: 25,
      name: 'ピカチュウ',
      level: 15,
      hp: 60,
      attack: 55,
      defense: 40,
      special_attack: 50,
      special_defense: 50,
      speed: 90,
      types: ['electric'],
      nature: 'がんばりや',
      is_shiny: false,
      ivs: { hp: 25, attack: 20, defense: 15, specialAttack: 25, specialDefense: 20, speed: 31 },
      status: 'available',
      caught_at: '2024-01-15T10:30:00Z'
    },
    {
      id: 'pokemon_charmander_002',
      user_id: userId,
      dex_number: 4,
      name: 'ヒトカゲ',
      level: 12,
      hp: 48,
      attack: 52,
      defense: 43,
      special_attack: 60,
      special_defense: 50,
      speed: 65,
      types: ['fire'],
      nature: 'ようき',
      is_shiny: false,
      ivs: { hp: 28, attack: 30, defense: 18, specialAttack: 22, specialDefense: 15, speed: 25 },
      status: 'available',
      caught_at: '2024-01-20T14:15:00Z'
    },
    {
      id: 'pokemon_squirtle_003',
      user_id: userId,
      dex_number: 7,
      name: 'ゼニガメ',
      level: 18,
      hp: 65,
      attack: 48,
      defense: 65,
      special_attack: 50,
      special_defense: 64,
      speed: 43,
      types: ['water'],
      nature: 'ひかえめ',
      is_shiny: false,
      ivs: { hp: 22, attack: 15, defense: 28, specialAttack: 30, specialDefense: 25, speed: 20 },
      status: 'available',
      caught_at: '2024-01-25T09:45:00Z'
    }
  ],

  // トレーナーデータ
  trainers: [
    {
      id: 'trainer_akira_001',
      user_id: userId,
      name: 'アキラ',
      level: 8,
      experience: 2100,
      specialty: 'レンジャー',
      status: 'available',
      efficiency: 1.2,
      salary: 3600,
      hired_at: '2024-01-10T08:00:00Z'
    },
    {
      id: 'trainer_misaki_002',
      user_id: userId,
      name: 'ミサキ',
      level: 12,
      experience: 3800,
      specialty: 'リサーチャー',
      status: 'available',
      efficiency: 1.35,
      salary: 4200,
      hired_at: '2024-01-12T09:30:00Z'
    },
    {
      id: 'trainer_hiroshi_003',
      user_id: userId,
      name: 'ヒロシ',
      level: 6,
      experience: 1500,
      specialty: 'ブリーダー',
      status: 'available',
      efficiency: 1.1,
      salary: 3000,
      hired_at: '2024-01-18T11:00:00Z'
    }
  ],

  // 派遣データ
  expeditions: [
    {
      id: 'expedition_001',
      user_id: userId,
      location: 'トキワの森',
      trainer_ids: ['trainer_akira_001'],
      pokemon_ids: ['pokemon_pikachu_001'],
      status: 'active',
      progress: 75,
      estimated_duration: 120,
      rewards: {
        money: 2500,
        items: ['きのみ', 'モンスターボール'],
        experience: 150
      },
      started_at: '2024-01-26T10:00:00Z'
    },
    {
      id: 'expedition_002',
      user_id: userId,
      location: 'ハナダの洞窟',
      trainer_ids: ['trainer_misaki_002'],
      pokemon_ids: ['pokemon_squirtle_003'],
      status: 'completed',
      progress: 100,
      estimated_duration: 180,
      rewards: {
        money: 3200,
        items: ['しんじゅ', 'げんきのかけら'],
        experience: 220
      },
      started_at: '2024-01-24T14:30:00Z'
    }
  ],

  // 施設データ
  facilities: [
    {
      id: 'facility_training_001',
      user_id: userId,
      name: 'トレーニング施設',
      type: 'training',
      level: 3,
      capacity: 8,
      efficiency: 1.15,
      maintenance_cost: 2500,
      status: 'active'
    },
    {
      id: 'facility_research_002',
      user_id: userId,
      name: 'リサーチセンター',
      type: 'research',
      level: 2,
      capacity: 4,
      efficiency: 1.25,
      maintenance_cost: 3200,
      status: 'active'
    },
    {
      id: 'facility_medical_003',
      user_id: userId,
      name: 'ポケモンセンター',
      type: 'medical',
      level: 4,
      capacity: 12,
      efficiency: 1.3,
      maintenance_cost: 1800,
      status: 'active'
    }
  ],

  // 取引データ
  transactions: [
    {
      id: 'trans_001',
      user_id: userId,
      type: 'income',
      category: 'expedition',
      amount: 3200,
      description: '派遣報酬: ハナダの洞窟',
      reference_id: 'expedition_002',
      created_at: '2024-01-26T16:00:00Z'
    },
    {
      id: 'trans_002',
      user_id: userId,
      type: 'expense',
      category: 'salary',
      amount: 3600,
      description: '給与支払い: アキラ',
      reference_id: 'trainer_akira_001',
      created_at: '2024-01-25T18:00:00Z'
    },
    {
      id: 'trans_003',
      user_id: userId,
      type: 'income',
      category: 'expedition',
      amount: 1800,
      description: '派遣報酬: トキワの森（中間）',
      reference_id: 'expedition_001',
      created_at: '2024-01-26T12:00:00Z'
    },
    {
      id: 'trans_004',
      user_id: userId,
      type: 'expense',
      category: 'facility',
      amount: 2500,
      description: '施設維持費: トレーニング施設',
      reference_id: 'facility_training_001',
      created_at: '2024-01-26T08:00:00Z'
    },
    {
      id: 'trans_005',
      user_id: userId,
      type: 'expense',
      category: 'pokemon',
      amount: 1200,
      description: 'ポケモンケア費用',
      reference_id: null,
      created_at: '2024-01-25T15:30:00Z'
    }
  ],

  // ゲーム進捗データ
  game_progress: [
    {
      id: 'progress_001',
      user_id: userId,
      level: 5,
      total_experience: 4500,
      unlocked_areas: ['トキワの森', 'ハナダの洞窟', 'シオンタウン'],
      achievements: ['初回派遣完了', 'トレーナー3名雇用', 'ポケモン3匹捕獲'],
      statistics: {
        expeditions_completed: 8,
        pokemon_caught: 3,
        trainers_hired: 3,
        total_earnings: 45000,
        days_active: 16
      }
    }
  ],

  // AI分析データ
  ai_analysis: [
    {
      id: 'analysis_001',
      user_id: userId,
      analysis_type: 'monthly_performance',
      data: {
        revenue: 25000,
        expenses: 18000,
        pokemon_growth: 2.3,
        trainer_efficiency: 1.25
      },
      recommendations: [
        'トレーニング施設のアップグレードを推奨します',
        '新しいエリア解放により収益が15%向上する見込み',
        'ポケモンの回復時間を最適化することで効率向上が期待できます'
      ],
      predicted_outcomes: {
        weekly_profit: 1800,
        trainer_growth: 2,
        pokemon_evolution: 1
      },
      confidence_score: 0.87
    }
  ]
}

async function insertData() {
  try {
    console.log('📤 データベースへサンプルデータを投入中...')
    console.log('')

    // 各テーブルにデータを投入
    for (const [tableName, records] of Object.entries(sampleData)) {
      console.log(`📊 ${tableName}: ${records.length}件のレコードを投入中...`)
      
      const { data, error } = await supabase
        .from(tableName)
        .upsert(records, { onConflict: 'id' })
      
      if (error) {
        console.error(`❌ ${tableName} テーブルへの投入エラー:`, error.message)
        throw error
      }
      
      console.log(`✅ ${tableName}: 投入完了`)
    }

    console.log('')
    console.log('🎉 すべてのサンプルデータの投入が完了しました！')
    console.log('')
    console.log('📋 投入されたデータ:')
    console.log(`  🐾 ポケモン: ${sampleData.pokemon.length}匹`)
    console.log(`  👨‍🎓 トレーナー: ${sampleData.trainers.length}名`)
    console.log(`  🗺️ 派遣: ${sampleData.expeditions.length}件`)
    console.log(`  🏢 施設: ${sampleData.facilities.length}つ`)
    console.log(`  💰 取引: ${sampleData.transactions.length}件`)
    console.log(`  📈 進捗: ${sampleData.game_progress.length}件`)
    console.log(`  🤖 分析: ${sampleData.ai_analysis.length}件`)
    console.log('')
    console.log('🎮 ゲームをリロードしてお楽しみください！')

  } catch (error) {
    console.error('')
    console.error('💥 データ投入中にエラーが発生しました:')
    console.error(error.message)
    console.error('')
    console.error('🔧 対処方法:')
    console.error('  1. Supabaseの接続設定を確認')
    console.error('  2. データベーステーブルが存在することを確認')
    console.error('  3. setup-database-now.sql を先に実行')
    process.exit(1)
  }
}

// スクリプト実行
insertData()