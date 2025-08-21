/**
 * 統一APIクライアントシステム
 * 一貫したAPI呼び出しとエラーハンドリングを提供
 */

import { supabase } from './supabase'
import { GameError, ErrorHandler, ERROR_CODES, createGameError } from './unified-error-handling'
import { API } from '@/config/app'
import { 
  Pokemon, 
  Trainer, 
  Expedition, 
  Facility, 
  Transaction, 
  UserProfile,
  GameProgress
} from './state-management'

// =============================================================================
// 基本型定義
// =============================================================================

export type ApiResponse<T = any> = 
  | {
      success: true
      data: T
      message?: string
      metadata?: {
        total?: number
        page?: number
        limit?: number
        hasNext?: boolean
      }
    }
  | {
      success: false
      error: GameError
      message: string
    }

export interface ApiRequestOptions {
  timeout?: number
  retries?: number
  headers?: Record<string, string>
  signal?: AbortSignal
}

export interface QueryOptions {
  select?: string
  where?: Record<string, any>
  order?: { column: string; ascending?: boolean }[]
  limit?: number
  offset?: number
}

// =============================================================================
// ベースAPIクライアント
// =============================================================================

export abstract class BaseApiClient {
  protected timeout: number
  protected retries: number
  
  constructor(options: { timeout?: number; retries?: number } = {}) {
    this.timeout = options.timeout || API.TIMEOUT
    this.retries = options.retries || API.RETRY_ATTEMPTS
  }
  
  protected async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeout = this.timeout
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      )
    ])
  }
  
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    retries = this.retries
  ): Promise<T> {
    let lastError: any
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw lastError
  }
  
  protected handleSupabaseResponse<T>(response: {
    data: T | null
    error: any
  }): ApiResponse<T> {
    if (response.error) {
      const gameError = ErrorHandler.handle(response.error)
      return {
        success: false,
        error: gameError,
        message: gameError.userMessage,
      }
    }
    
    return {
      success: true,
      data: response.data as T,
    }
  }

  protected handleVoidResponse(response: {
    data: any
    error: any
  }): ApiResponse<void> {
    if (response.error) {
      const gameError = ErrorHandler.handle(response.error)
      return {
        success: false,
        error: gameError,
        message: gameError.userMessage,
      }
    }
    
    return {
      success: true,
      data: undefined as any,
    }
  }
  
  protected buildQuery(tableName: string, options: QueryOptions = {}): any {
    if (!supabase) {
      throw createGameError.databaseError('Supabase client not available')
    }
    
    let query = supabase.from(tableName).select(options.select || '*')
    
    // Where条件
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value)
        } else if (value === null) {
          query = query.is(key, null)
        } else {
          query = query.eq(key, value)
        }
      })
    }
    
    // ソート
    if (options.order) {
      options.order.forEach(({ column, ascending = true }) => {
        query = query.order(column, { ascending })
      })
    }
    
    // ページネーション
    if (options.limit) {
      query = query.limit(options.limit)
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }
    
    return query
  }
}

// =============================================================================
// ポケモンAPIクライアント
// =============================================================================

export class PokemonApiClient extends BaseApiClient {
  async list(userId: string, options: QueryOptions = {}): Promise<ApiResponse<Pokemon[]>> {
    return this.executeWithTimeout(async () => {
      const query = this.buildQuery('pokemon', {
        ...options,
        where: { ...options.where, user_id: userId }
      })
      
      const response = await query
      return this.handleSupabaseResponse<Pokemon[]>(response)
    })
  }
  
  async get(id: string): Promise<ApiResponse<Pokemon>> {
    return this.executeWithTimeout(async () => {
      const response = await supabase!.from('pokemon').select('*').eq('id', id).single()
      return this.handleSupabaseResponse(response)
    })
  }
  
  async create(pokemon: Omit<Pokemon, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Pokemon>> {
    return this.executeWithRetry(async () => {
      const response = await supabase!
        .from('pokemon')
        .insert(pokemon)
        .select()
        .single()
      
      return this.handleSupabaseResponse(response)
    })
  }
  
  async update(id: string, updates: Partial<Pokemon>): Promise<ApiResponse<Pokemon>> {
    return this.executeWithRetry(async () => {
      const response = await supabase!
        .from('pokemon')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      
      return this.handleSupabaseResponse(response)
    })
  }
  
  async delete(id: string): Promise<ApiResponse<void>> {
    return this.executeWithRetry(async () => {
      const response = await supabase!.from('pokemon').delete().eq('id', id)
      return this.handleVoidResponse(response)
    })
  }
  
  async updateStatus(id: string, status: Pokemon['status']): Promise<ApiResponse<Pokemon>> {
    return this.update(id, { status })
  }
  
  async getAvailable(userId: string): Promise<ApiResponse<Pokemon[]>> {
    return this.list(userId, { 
      where: { status: 'available' },
      order: [{ column: 'level', ascending: false }]
    })
  }
}

// =============================================================================
// トレーナーAPIクライアント
// =============================================================================

export class TrainerApiClient extends BaseApiClient {
  async list(userId: string, options: QueryOptions = {}): Promise<ApiResponse<Trainer[]>> {
    return this.executeWithTimeout(async () => {
      const query = this.buildQuery('trainers', {
        ...options,
        where: { ...options.where, user_id: userId }
      })
      
      const response = await query
      return this.handleSupabaseResponse(response)
    })
  }
  
  async get(id: string): Promise<ApiResponse<Trainer>> {
    return this.executeWithTimeout(async () => {
      const response = await supabase!.from('trainers').select('*').eq('id', id).single()
      return this.handleSupabaseResponse<Trainer>(response)
    })
  }
  
  async create(trainer: Omit<Trainer, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Trainer>> {
    return this.executeWithRetry(async () => {
      const response = await supabase!
        .from('trainers')
        .insert(trainer)
        .select()
        .single()
      
      return this.handleSupabaseResponse(response)
    })
  }
  
  async update(id: string, updates: Partial<Trainer>): Promise<ApiResponse<Trainer>> {
    return this.executeWithRetry(async () => {
      const response = await supabase!
        .from('trainers')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      
      return this.handleSupabaseResponse(response)
    })
  }
  
  async delete(id: string): Promise<ApiResponse<void>> {
    return this.executeWithRetry(async () => {
      const response = await supabase!.from('trainers').delete().eq('id', id)
      return this.handleVoidResponse(response)
    })
  }
  
  async updateStatus(id: string, status: Trainer['status']): Promise<ApiResponse<Trainer>> {
    return this.update(id, { status })
  }
  
  async getAvailable(userId: string): Promise<ApiResponse<Trainer[]>> {
    return this.list(userId, { 
      where: { status: 'available' },
      order: [{ column: 'job_level', ascending: false }]
    })
  }
  
  async assignToExpedition(id: string, expeditionId: string): Promise<ApiResponse<Trainer>> {
    return this.update(id, { 
      status: 'on_expedition',
      current_expedition_id: expeditionId
    })
  }
  
  async completeExpedition(id: string): Promise<ApiResponse<Trainer>> {
    return this.update(id, { 
      status: 'available',
      current_expedition_id: null
    })
  }
}

// =============================================================================
// 派遣APIクライアント
// =============================================================================

export class ExpeditionApiClient extends BaseApiClient {
  async list(userId: string, options: QueryOptions = {}): Promise<ApiResponse<Expedition[]>> {
    return this.executeWithTimeout(async () => {
      const query = this.buildQuery('expeditions', {
        ...options,
        where: { ...options.where, user_id: userId },
        order: options.order || [{ column: 'created_at', ascending: false }]
      })
      
      const response = await query
      return this.handleSupabaseResponse(response)
    })
  }
  
  async get(id: string): Promise<ApiResponse<Expedition>> {
    return this.executeWithTimeout(async () => {
      const response = await supabase!.from('expeditions').select('*').eq('id', id).single()
      return this.handleSupabaseResponse(response)
    })
  }
  
  async create(expedition: Omit<Expedition, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Expedition>> {
    return this.executeWithRetry(async () => {
      const response = await supabase!
        .from('expeditions')
        .insert(expedition)
        .select()
        .single()
      
      return this.handleSupabaseResponse(response)
    })
  }
  
  async update(id: string, updates: Partial<Expedition>): Promise<ApiResponse<Expedition>> {
    return this.executeWithRetry(async () => {
      const response = await supabase!
        .from('expeditions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      
      return this.handleSupabaseResponse(response)
    })
  }
  
  async delete(id: string): Promise<ApiResponse<void>> {
    return this.executeWithRetry(async () => {
      const response = await supabase!.from('expeditions').delete().eq('id', id)
      return this.handleVoidResponse(response)
    })
  }
  
  async start(id: string): Promise<ApiResponse<Expedition>> {
    return this.update(id, { 
      status: 'active',
      started_at: new Date().toISOString()
    })
  }
  
  async complete(id: string, results: any): Promise<ApiResponse<Expedition>> {
    return this.update(id, { 
      status: 'completed',
      actual_return: new Date().toISOString(),
      current_progress: 1.0,
    })
  }
  
  async getActive(userId: string): Promise<ApiResponse<Expedition[]>> {
    return this.list(userId, { where: { status: 'active' } })
  }
}

// =============================================================================
// 施設APIクライアント
// =============================================================================

export class FacilityApiClient extends BaseApiClient {
  async list(userId: string, options: QueryOptions = {}): Promise<ApiResponse<Facility[]>> {
    return this.executeWithTimeout(async () => {
      const query = this.buildQuery('facilities', {
        ...options,
        where: { ...options.where, user_id: userId }
      })
      
      const response = await query
      return this.handleSupabaseResponse(response)
    })
  }
  
  async get(id: string): Promise<ApiResponse<Facility>> {
    return this.executeWithTimeout(async () => {
      const response = await supabase!.from('facilities').select('*').eq('id', id).single()
      return this.handleSupabaseResponse(response)
    })
  }
  
  async create(facility: Omit<Facility, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Facility>> {
    return this.executeWithRetry(async () => {
      const response = await supabase!
        .from('facilities')
        .insert(facility)
        .select()
        .single()
      
      return this.handleSupabaseResponse(response)
    })
  }
  
  async update(id: string, updates: Partial<Facility>): Promise<ApiResponse<Facility>> {
    return this.executeWithRetry(async () => {
      const response = await supabase!
        .from('facilities')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      
      return this.handleSupabaseResponse(response)
    })
  }
  
  async upgrade(id: string): Promise<ApiResponse<Facility>> {
    const facility = await this.get(id)
    if (!facility.success || !facility.data) {
      return facility
    }
    
    return this.update(id, {
      level: facility.data.level + 1,
      status: 'under_construction',
      construction_started: new Date().toISOString()
    })
  }
}

// =============================================================================
// 取引APIクライアント
// =============================================================================

export class TransactionApiClient extends BaseApiClient {
  async list(userId: string, options: QueryOptions = {}): Promise<ApiResponse<Transaction[]>> {
    return this.executeWithTimeout(async () => {
      const query = this.buildQuery('transactions', {
        ...options,
        where: { ...options.where, user_id: userId },
        order: options.order || [{ column: 'created_at', ascending: false }]
      })
      
      const response = await query
      return this.handleSupabaseResponse(response)
    })
  }
  
  async create(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<ApiResponse<Transaction>> {
    return this.executeWithRetry(async () => {
      const response = await supabase!
        .from('transactions')
        .insert(transaction)
        .select()
        .single()
      
      return this.handleSupabaseResponse(response)
    })
  }
  
  async getRecent(userId: string, limit = 20): Promise<ApiResponse<Transaction[]>> {
    return this.list(userId, { limit })
  }
  
  async getByCategory(userId: string, category: string): Promise<ApiResponse<Transaction[]>> {
    return this.list(userId, { where: { category } })
  }
}

// =============================================================================
// 統合ゲームAPIクライアント
// =============================================================================

export class GameApiClient {
  public readonly pokemon: PokemonApiClient
  public readonly trainers: TrainerApiClient
  public readonly expeditions: ExpeditionApiClient
  public readonly facilities: FacilityApiClient
  public readonly transactions: TransactionApiClient
  
  constructor(options: { timeout?: number; retries?: number } = {}) {
    this.pokemon = new PokemonApiClient(options)
    this.trainers = new TrainerApiClient(options)
    this.expeditions = new ExpeditionApiClient(options)
    this.facilities = new FacilityApiClient(options)
    this.transactions = new TransactionApiClient(options)
  }
  
  // 複合操作
  async hireTrainer(
    userId: string, 
    trainerData: Omit<Trainer, 'id' | 'created_at' | 'updated_at' | 'user_id'>,
    cost: number
  ): Promise<ApiResponse<{ trainer: Trainer; transaction: Transaction }>> {
    try {
      // トランザクション記録
      const transactionResult = await this.transactions.create({
        user_id: userId,
        type: 'expense',
        category: 'salary',
        amount: cost,
        description: `${trainerData.name} 雇用費用`,
        reference_id: null,
      })
      
      if (!transactionResult.success) {
        return { success: false, error: transactionResult.error, message: transactionResult.error.userMessage }
      }
      
      // トレーナー作成
      const trainerResult = await this.trainers.create({
        ...trainerData,
        user_id: userId,
      })
      
      if (!trainerResult.success) {
        return { success: false, error: trainerResult.error, message: trainerResult.error.userMessage }
      }
      
      return {
        success: true,
        data: {
          trainer: trainerResult.data!,
          transaction: transactionResult.data!,
        }
      }
    } catch (error) {
      const gameError = ErrorHandler.handle(error)
      return {
        success: false,
        error: gameError,
        message: gameError.userMessage
      }
    }
  }
  
  async startExpedition(
    userId: string,
    trainerId: string,
    locationId: number,
    expeditionData: Partial<Expedition>
  ): Promise<ApiResponse<{ expedition: Expedition; trainer: Trainer }>> {
    try {
      // 派遣作成
      const expeditionResult = await this.expeditions.create({
        user_id: userId,
        trainer_id: trainerId,
        location_id: locationId,
        expedition_mode: 'balanced',
        target_duration_hours: 2,
        status: 'planning',
        started_at: null,
        expected_return: null,
        actual_return: null,
        current_progress: 0,
        ...expeditionData,
      })
      
      if (!expeditionResult.success) {
        return { success: false, error: expeditionResult.error, message: expeditionResult.error.userMessage }
      }
      
      // トレーナーステータス更新
      const trainerResult = await this.trainers.assignToExpedition(
        trainerId,
        expeditionResult.data!.id
      )
      
      if (!trainerResult.success) {
        return { success: false, error: trainerResult.error, message: trainerResult.error.userMessage }
      }
      
      return {
        success: true,
        data: {
          expedition: expeditionResult.data!,
          trainer: trainerResult.data!,
        }
      }
    } catch (error) {
      const gameError = ErrorHandler.handle(error)
      return {
        success: false,
        error: gameError,
        message: gameError.userMessage
      }
    }
  }
}

// =============================================================================
// シングルトンインスタンス
// =============================================================================

export const gameApiClient = new GameApiClient({
  timeout: API.TIMEOUT,
  retries: API.RETRY_ATTEMPTS,
})