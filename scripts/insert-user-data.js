#!/usr/bin/env node

/**
 * 特定ユーザー用サンプルデータ投入スクリプト（UUID対応版）
 */

const { createClient } = require('@supabase/supabase-js')
const { randomUUID } = require('crypto')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const userId = process.argv[2] || 'e5651d93-2721-461f-b42a-3d6ba1a6944c'

console.log('🎮 ユーザー専用データ投入開始')
console.log(`👤 ユーザーID: ${userId}`)
console.log('')

// UUIDを事前に生成
const pokemonIds = {
  pikachu: randomUUID(),
  charmander: randomUUID(),
  squirtle: randomUUID()
}

const trainerIds = {
  akira: randomUUID(),
  misaki: randomUUID(),
  hiroshi: randomUUID()
}

const expeditionIds = {
  forest: randomUUID(),
  cave: randomUUID()
}

const facilityIds = {
  training: randomUUID(),
  research: randomUUID(),
  medical: randomUUID()
}

async function insertSampleData() {
  try {
    // 1. ポケモンデータ
    console.log('🐾 ポケモンデータを投入中...')
    const { error: pokemonError } = await supabase.from('pokemon').insert([
      {
        id: pokemonIds.pikachu,
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
        id: pokemonIds.charmander,
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
        id: pokemonIds.squirtle,
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
    ])

    if (pokemonError) throw pokemonError
    console.log('✅ ポケモン3匹を投入完了')

    // 2. トレーナーデータ
    console.log('👨‍🎓 トレーナーデータを投入中...')
    const { error: trainersError } = await supabase.from('trainers').insert([
      {
        id: trainerIds.akira,
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
        id: trainerIds.misaki,
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
        id: trainerIds.hiroshi,
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
    ])

    if (trainersError) throw trainersError
    console.log('✅ トレーナー3名を投入完了')

    // 3. 施設データ
    console.log('🏢 施設データを投入中...')
    const { error: facilitiesError } = await supabase.from('facilities').insert([
      {
        id: facilityIds.training,
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
        id: facilityIds.research,
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
        id: facilityIds.medical,
        user_id: userId,
        name: 'ポケモンセンター',
        type: 'medical',
        level: 4,
        capacity: 12,
        efficiency: 1.3,
        maintenance_cost: 1800,
        status: 'active'
      }
    ])

    if (facilitiesError) throw facilitiesError
    console.log('✅ 施設3つを投入完了')

    // 4. 派遣データ
    console.log('🗺️ 派遣データを投入中...')
    const { error: expeditionsError } = await supabase.from('expeditions').insert([
      {
        id: expeditionIds.forest,
        user_id: userId,
        location: 'トキワの森',
        trainer_ids: [trainerIds.akira],
        pokemon_ids: [pokemonIds.pikachu],
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
        id: expeditionIds.cave,
        user_id: userId,
        location: 'ハナダの洞窟',
        trainer_ids: [trainerIds.misaki],
        pokemon_ids: [pokemonIds.squirtle],
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
    ])

    if (expeditionsError) throw expeditionsError
    console.log('✅ 派遣2件を投入完了')

    // 5. 取引データ
    console.log('💰 取引データを投入中...')
    const { error: transactionsError } = await supabase.from('transactions').insert([
      {
        id: randomUUID(),
        user_id: userId,
        type: 'income',
        category: 'expedition',
        amount: 3200,
        description: '派遣報酬: ハナダの洞窟',
        reference_id: expeditionIds.cave,
        created_at: '2024-01-26T16:00:00Z'
      },
      {
        id: randomUUID(),
        user_id: userId,
        type: 'expense',
        category: 'salary',
        amount: 3600,
        description: '給与支払い: アキラ',
        reference_id: trainerIds.akira,
        created_at: '2024-01-25T18:00:00Z'
      },
      {
        id: randomUUID(),
        user_id: userId,
        type: 'income',
        category: 'expedition',
        amount: 1800,
        description: '派遣報酬: トキワの森（中間）',
        reference_id: expeditionIds.forest,
        created_at: '2024-01-26T12:00:00Z'
      },
      {
        id: randomUUID(),
        user_id: userId,
        type: 'expense',
        category: 'facility',
        amount: 2500,
        description: '施設維持費: トレーニング施設',
        reference_id: facilityIds.training,
        created_at: '2024-01-26T08:00:00Z'
      },
      {
        id: randomUUID(),
        user_id: userId,
        type: 'expense',
        category: 'pokemon',
        amount: 1200,
        description: 'ポケモンケア費用',
        reference_id: null,
        created_at: '2024-01-25T15:30:00Z'
      }
    ])

    if (transactionsError) throw transactionsError
    console.log('✅ 取引5件を投入完了')

    // 6. AI分析データ
    console.log('🤖 AI分析データを投入中...')
    const { error: analysisError } = await supabase.from('ai_analysis').insert([
      {
        id: randomUUID(),
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
    ])

    if (analysisError) throw analysisError
    console.log('✅ AI分析1件を投入完了')

    console.log('')
    console.log('🎉 全てのサンプルデータ投入が完了しました！')
    console.log('')
    console.log('📊 投入済みデータ:')
    console.log('  🐾 ポケモン: 3匹')
    console.log('  👨‍🎓 トレーナー: 3名')
    console.log('  🗺️ 派遣: 2件')
    console.log('  🏢 施設: 3つ')
    console.log('  💰 取引: 5件')
    console.log('  🤖 AI分析: 1件')
    console.log('')
    console.log('🔄 ページをリロードしてゲームをお楽しみください！')

  } catch (error) {
    console.error('')
    console.error('💥 エラーが発生しました:', error.message)
    console.error('')
    if (error.details) {
      console.error('詳細:', error.details)
    }
    process.exit(1)
  }
}

insertSampleData()