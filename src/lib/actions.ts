'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ポケモン関連アクション
export async function capturePokemon(formData: FormData) {
  const userId = formData.get('userId') as string
  const pokemonData = JSON.parse(formData.get('pokemonData') as string)
  
  try {
    const { error } = await supabase
      .from('pokemon')
      .insert({
        user_id: userId,
        dex_number: pokemonData.dexNumber,
        name: pokemonData.name,
        level: pokemonData.level,
        hp: pokemonData.hp,
        attack: pokemonData.attack,
        defense: pokemonData.defense,
        special_attack: pokemonData.specialAttack,
        special_defense: pokemonData.specialDefense,
        speed: pokemonData.speed,
        types: pokemonData.types,
        nature: pokemonData.nature,
        is_shiny: pokemonData.isShiny,
        ivs: pokemonData.ivs,
        status: 'available',
        caught_at: new Date().toISOString()
      })
    
    if (error) throw error
    
    revalidatePath('/dashboard/pokemon')
    return { success: true, message: `${pokemonData.name}を捕獲しました！` }
  } catch (error) {
    console.error('ポケモン捕獲エラー:', error)
    return { success: false, message: '捕獲に失敗しました' }
  }
}

export async function updatePokemonStatus(pokemonId: string, status: string) {
  try {
    const { error } = await supabase
      .from('pokemon')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', pokemonId)
    
    if (error) throw error
    
    revalidatePath('/dashboard/pokemon')
    return { success: true }
  } catch (error) {
    console.error('ポケモンステータス更新エラー:', error)
    return { success: false, message: 'ステータス更新に失敗しました' }
  }
}

// トレーナー関連アクション
export async function hireTrainer(formData: FormData) {
  const userId = formData.get('userId') as string
  const trainerData = JSON.parse(formData.get('trainerData') as string)
  
  try {
    const { error } = await supabase
      .from('trainers')
      .insert({
        user_id: userId,
        name: trainerData.name,
        level: trainerData.level,
        experience: trainerData.experience,
        specialization: trainerData.specialization,
        salary: trainerData.salary,
        skills: trainerData.skills,
        status: 'available',
        hired_at: new Date().toISOString()
      })
    
    if (error) throw error
    
    revalidatePath('/dashboard/trainers')
    return { success: true, message: `${trainerData.name}を雇用しました！` }
  } catch (error) {
    console.error('トレーナー雇用エラー:', error)
    return { success: false, message: '雇用に失敗しました' }
  }
}

export async function updateTrainerStatus(trainerId: string, status: string) {
  try {
    const { error } = await supabase
      .from('trainers')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', trainerId)
    
    if (error) throw error
    
    revalidatePath('/dashboard/trainers')
    return { success: true }
  } catch (error) {
    console.error('トレーナーステータス更新エラー:', error)
    return { success: false, message: 'ステータス更新に失敗しました' }
  }
}

// 派遣関連アクション
export async function createExpedition(formData: FormData) {
  const userId = formData.get('userId') as string
  const expeditionData = JSON.parse(formData.get('expeditionData') as string)
  
  try {
    const { error } = await supabase
      .from('expeditions')
      .insert({
        user_id: userId,
        name: expeditionData.name,
        location: expeditionData.location,
        duration: expeditionData.duration,
        difficulty: expeditionData.difficulty,
        required_skills: expeditionData.requiredSkills,
        rewards: expeditionData.rewards,
        assigned_trainers: expeditionData.assignedTrainers,
        assigned_pokemon: expeditionData.assignedPokemon,
        status: 'pending',
        start_time: expeditionData.startTime,
        created_at: new Date().toISOString()
      })
    
    if (error) throw error
    
    revalidatePath('/dashboard/expeditions')
    return { success: true, message: '派遣を作成しました！' }
  } catch (error) {
    console.error('派遣作成エラー:', error)
    return { success: false, message: '派遣作成に失敗しました' }
  }
}

export async function updateExpeditionStatus(expeditionId: string, status: string) {
  try {
    const { error } = await supabase
      .from('expeditions')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', expeditionId)
    
    if (error) throw error
    
    revalidatePath('/dashboard/expeditions')
    return { success: true }
  } catch (error) {
    console.error('派遣ステータス更新エラー:', error)
    return { success: false, message: 'ステータス更新に失敗しました' }
  }
}

// 施設関連アクション
export async function upgradeFacility(formData: FormData) {
  const userId = formData.get('userId') as string
  const facilityId = formData.get('facilityId') as string
  const cost = parseInt(formData.get('cost') as string)
  
  try {
    // 施設アップグレード
    const { data: facility, error: fetchError } = await supabase
      .from('facilities')
      .select('*')
      .eq('user_id', userId)
      .eq('facility_id', facilityId)
      .single()
    
    if (fetchError) throw fetchError
    
    const { error: updateError } = await supabase
      .from('facilities')
      .update({
        level: (facility.level || 1) + 1,
        status: 'upgrading',
        updated_at: new Date().toISOString()
      })
      .eq('id', facility.id)
    
    if (updateError) throw updateError
    
    // 経済記録
    await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'expense',
        category: 'facility',
        amount: cost,
        description: `施設アップグレード: ${facilityId}`,
        reference_id: facilityId,
        created_at: new Date().toISOString()
      })
    
    revalidatePath('/dashboard/facilities')
    return { success: true, message: '施設のアップグレードを開始しました！' }
  } catch (error) {
    console.error('施設アップグレードエラー:', error)
    return { success: false, message: 'アップグレードに失敗しました' }
  }
}

// 研究関連アクション
export async function startResearch(formData: FormData) {
  const userId = formData.get('userId') as string
  const projectId = formData.get('projectId') as string
  const cost = parseInt(formData.get('cost') as string)
  
  try {
    const { error } = await supabase
      .from('research_projects')
      .insert({
        user_id: userId,
        project_id: projectId,
        research_points: 0,
        status: 'researching',
        started_at: new Date().toISOString()
      })
    
    if (error) throw error
    
    // 研究費支払い
    await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'expense',
        category: 'research',
        amount: cost,
        description: `研究プロジェクト: ${projectId}`,
        reference_id: projectId,
        created_at: new Date().toISOString()
      })
    
    revalidatePath('/dashboard/facilities')
    return { success: true, message: '研究を開始しました！' }
  } catch (error) {
    console.error('研究開始エラー:', error)
    return { success: false, message: '研究開始に失敗しました' }
  }
}

// 経済関連アクション
export async function recordTransaction(formData: FormData) {
  const userId = formData.get('userId') as string
  const transactionData = JSON.parse(formData.get('transactionData') as string)
  
  try {
    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: transactionData.type,
        category: transactionData.category,
        amount: transactionData.amount,
        description: transactionData.description,
        reference_id: transactionData.referenceId,
        created_at: new Date().toISOString()
      })
    
    if (error) throw error
    
    revalidatePath('/dashboard/economy')
    return { success: true }
  } catch (error) {
    console.error('取引記録エラー:', error)
    return { success: false, message: '取引記録に失敗しました' }
  }
}

// ゲーム進行状況更新
export async function updateGameProgress(formData: FormData) {
  const userId = formData.get('userId') as string
  const progressData = JSON.parse(formData.get('progressData') as string)
  
  try {
    const { error } = await supabase
      .from('game_progress')
      .upsert({
        user_id: userId,
        level: progressData.level,
        experience: progressData.experience,
        next_level_exp: progressData.nextLevelExp,
        total_play_time: progressData.totalPlayTime,
        achievement_points: progressData.achievementPoints,
        unlocked_features: progressData.unlockedFeatures,
        difficulty: progressData.difficulty,
        updated_at: new Date().toISOString()
      })
    
    if (error) throw error
    
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('進行状況更新エラー:', error)
    return { success: false, message: '進行状況更新に失敗しました' }
  }
}

// リアルタイム介入アクション
export async function resolveIntervention(formData: FormData) {
  const userId = formData.get('userId') as string
  const interventionData = JSON.parse(formData.get('interventionData') as string)
  
  try {
    const { error } = await supabase
      .from('interventions')
      .insert({
        user_id: userId,
        expedition_id: interventionData.expeditionId,
        event_type: interventionData.eventType,
        decision: interventionData.decision,
        outcome: interventionData.outcome,
        rewards: interventionData.rewards,
        resolved_at: new Date().toISOString()
      })
    
    if (error) throw error
    
    // 報酬があれば取引記録
    if (interventionData.rewards?.money > 0) {
      await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'income',
          category: 'expedition',
          amount: interventionData.rewards.money,
          description: `介入報酬: ${interventionData.eventType}`,
          reference_id: interventionData.expeditionId,
          created_at: new Date().toISOString()
        })
    }
    
    revalidatePath('/dashboard/expeditions')
    return { success: true, message: '介入を解決しました！' }
  } catch (error) {
    console.error('介入解決エラー:', error)
    return { success: false, message: '介入解決に失敗しました' }
  }
}

// AI分析結果保存
export async function saveAIAnalysis(formData: FormData) {
  const userId = formData.get('userId') as string
  const analysisData = JSON.parse(formData.get('analysisData') as string)
  
  try {
    const { error } = await supabase
      .from('ai_analysis')
      .insert({
        user_id: userId,
        analysis_type: analysisData.type,
        game_level: analysisData.gameLevel,
        efficiency_score: analysisData.efficiencyScore,
        profit_score: analysisData.profitScore,
        recommendations: analysisData.recommendations,
        predicted_outcomes: analysisData.predictions,
        optimization_suggestions: analysisData.optimizations,
        created_at: new Date().toISOString()
      })
    
    if (error) throw error
    
    revalidatePath('/dashboard/analytics')
    return { success: true }
  } catch (error) {
    console.error('AI分析保存エラー:', error)
    return { success: false, message: 'AI分析保存に失敗しました' }
  }
}

// バックアップ作成
export async function createBackup(userId: string) {
  try {
    const timestamp = new Date().toISOString()
    
    // 全データを取得
    const [pokemon, trainers, expeditions, facilities, transactions] = await Promise.all([
      supabase.from('pokemon').select('*').eq('user_id', userId),
      supabase.from('trainers').select('*').eq('user_id', userId),
      supabase.from('expeditions').select('*').eq('user_id', userId),
      supabase.from('facilities').select('*').eq('user_id', userId),
      supabase.from('transactions').select('*').eq('user_id', userId)
    ])
    
    const backupData = {
      timestamp,
      pokemon: pokemon.data,
      trainers: trainers.data,
      expeditions: expeditions.data,
      facilities: facilities.data,
      transactions: transactions.data
    }
    
    // バックアップを保存
    const { error } = await supabase
      .from('backups')
      .insert({
        user_id: userId,
        backup_data: backupData,
        created_at: timestamp
      })
    
    if (error) throw error
    
    return { success: true, message: 'バックアップを作成しました！' }
  } catch (error) {
    console.error('バックアップエラー:', error)
    return { success: false, message: 'バックアップに失敗しました' }
  }
}

// データ復元
export async function restoreBackup(formData: FormData) {
  const userId = formData.get('userId') as string
  const backupId = formData.get('backupId') as string
  
  try {
    // バックアップデータ取得
    const { data: backup, error: fetchError } = await supabase
      .from('backups')
      .select('backup_data')
      .eq('id', backupId)
      .eq('user_id', userId)
      .single()
    
    if (fetchError) throw fetchError
    
    const backupData = backup.backup_data
    
    // 既存データを削除
    await Promise.all([
      supabase.from('pokemon').delete().eq('user_id', userId),
      supabase.from('trainers').delete().eq('user_id', userId),
      supabase.from('expeditions').delete().eq('user_id', userId),
      supabase.from('facilities').delete().eq('user_id', userId),
      supabase.from('transactions').delete().eq('user_id', userId)
    ])
    
    // バックアップデータを復元
    if (backupData.pokemon?.length > 0) {
      await supabase.from('pokemon').insert(backupData.pokemon)
    }
    if (backupData.trainers?.length > 0) {
      await supabase.from('trainers').insert(backupData.trainers)
    }
    if (backupData.expeditions?.length > 0) {
      await supabase.from('expeditions').insert(backupData.expeditions)
    }
    if (backupData.facilities?.length > 0) {
      await supabase.from('facilities').insert(backupData.facilities)
    }
    if (backupData.transactions?.length > 0) {
      await supabase.from('transactions').insert(backupData.transactions)
    }
    
    revalidatePath('/dashboard')
    return { success: true, message: 'データを復元しました！' }
  } catch (error) {
    console.error('復元エラー:', error)
    return { success: false, message: 'データ復元に失敗しました' }
  }
}