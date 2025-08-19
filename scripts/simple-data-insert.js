#!/usr/bin/env node

/**
 * 最小限のサンプルデータ投入（実際のスキーマに合わせた版）
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

console.log('🎮 最小限データ投入開始')
console.log(`👤 ユーザーID: ${userId}`)
console.log('')

async function insertMinimalData() {
  try {
    // 1. ポケモンデータ（最小限の必須フィールドのみ）
    console.log('🐾 ポケモンデータを投入中...')
    const pokemonIds = [randomUUID(), randomUUID(), randomUUID()]
    
    const { error: pokemonError } = await supabase.from('pokemon').insert([
      {
        id: pokemonIds[0],
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
        ivs: {},
        status: 'available'
      },
      {
        id: pokemonIds[1],
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
        ivs: {},
        status: 'available'
      },
      {
        id: pokemonIds[2],
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
        ivs: {},
        status: 'available'
      }
    ])

    if (pokemonError) throw pokemonError
    console.log('✅ ポケモン3匹を投入完了')

    // 2. トレーナーデータ（最小限の必須フィールドのみ）
    console.log('👨‍🎓 トレーナーデータを投入中...')
    const trainerIds = [randomUUID(), randomUUID(), randomUUID()]
    
    const { error: trainersError } = await supabase.from('trainers').insert([
      {
        id: trainerIds[0],
        user_id: userId,
        name: 'アキラ',
        status: 'available'
      },
      {
        id: trainerIds[1],
        user_id: userId,
        name: 'ミサキ',
        status: 'available'
      },
      {
        id: trainerIds[2],
        user_id: userId,
        name: 'ヒロシ',
        status: 'available'
      }
    ])

    if (trainersError) throw trainersError
    console.log('✅ トレーナー3名を投入完了')

    // 3. 施設データ（最小限の必須フィールドのみ）
    console.log('🏢 施設データを投入中...')
    const facilityIds = [randomUUID(), randomUUID(), randomUUID()]
    
    const { error: facilitiesError } = await supabase.from('facilities').insert([
      {
        id: facilityIds[0],
        user_id: userId,
        facility_type: 'training',
        upgrade_cost: 5000,
        construction_cost: 10000
      },
      {
        id: facilityIds[1],
        user_id: userId,
        facility_type: 'research',
        upgrade_cost: 8000,
        construction_cost: 15000
      },
      {
        id: facilityIds[2],
        user_id: userId,
        facility_type: 'medical',
        upgrade_cost: 3000,
        construction_cost: 8000
      }
    ])

    if (facilitiesError) throw facilitiesError
    console.log('✅ 施設3つを投入完了')

    // 4. 派遣データ（最小限の必須フィールドのみ）
    console.log('🗺️ 派遣データを投入中...')
    const expeditionIds = [randomUUID(), randomUUID()]
    
    const { error: expeditionsError } = await supabase.from('expeditions').insert([
      {
        id: expeditionIds[0],
        user_id: userId,
        status: 'active',
        target_duration_hours: 2
      },
      {
        id: expeditionIds[1],
        user_id: userId,
        status: 'completed',
        target_duration_hours: 3
      }
    ])

    if (expeditionsError) throw expeditionsError
    console.log('✅ 派遣2件を投入完了')

    // 5. 取引データ（最小限の必須フィールドのみ）
    console.log('💰 取引データを投入中...')
    
    const { error: transactionsError } = await supabase.from('transactions').insert([
      {
        id: randomUUID(),
        user_id: userId,
        type: 'income',
        category: 'expedition',
        amount: 3200,
        description: '派遣報酬: ハナダの洞窟'
      },
      {
        id: randomUUID(),
        user_id: userId,
        type: 'expense',
        category: 'salary',
        amount: 3600,
        description: '給与支払い: アキラ'
      },
      {
        id: randomUUID(),
        user_id: userId,
        type: 'income',
        category: 'expedition',
        amount: 1800,
        description: '派遣報酬: トキワの森（中間）'
      }
    ])

    if (transactionsError) throw transactionsError
    console.log('✅ 取引3件を投入完了')

    console.log('')
    console.log('🎉 基本データの投入が完了しました！')
    console.log('')
    console.log('📊 投入済みデータ:')
    console.log('  🐾 ポケモン: 3匹')
    console.log('  👨‍🎓 トレーナー: 3名')
    console.log('  🗺️ 派遣: 2件')
    console.log('  🏢 施設: 3つ')
    console.log('  💰 取引: 3件')
    console.log('')
    console.log('🔄 ページをリロードして、データベースエラーが解決されることを確認してください！')

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

insertMinimalData()