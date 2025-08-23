/**
 * パフォーマンス最適化ユーティリティ
 * データアクセスの最適化、キャッシュ、メモ化機能を提供
 */

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // time to live in milliseconds
  accessCount: number
  lastAccess: number
}

export interface CacheStats {
  hitCount: number
  missCount: number
  hitRate: number
  totalEntries: number
  totalSize: number
  oldestEntry: number
  newestEntry: number
}

/**
 * LRUキャッシュ実装
 */
export class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private maxSize: number
  private defaultTTL: number
  private stats = {
    hitCount: 0,
    missCount: 0
  }
  
  constructor(maxSize: number = 100, defaultTTL: number = 5 * 60 * 1000) {
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
  }
  
  /**
   * データを取得
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key)
    const now = Date.now()
    
    if (!entry) {
      this.stats.missCount++
      return undefined
    }
    
    // TTL確認
    if (now > entry.timestamp + entry.ttl) {
      this.cache.delete(key)
      this.stats.missCount++
      return undefined
    }
    
    // アクセス情報を更新
    entry.accessCount++
    entry.lastAccess = now
    
    // LRU: 最近使用されたものを最後に移動
    this.cache.delete(key)
    this.cache.set(key, entry)
    
    this.stats.hitCount++
    return entry.data
  }
  
  /**
   * データを設定
   */
  set(key: string, data: T, ttl?: number): void {
    const now = Date.now()
    
    // 容量オーバーの場合、最も古いエントリを削除
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: now,
      ttl: ttl || this.defaultTTL,
      accessCount: 0,
      lastAccess: now
    })
  }
  
  /**
   * データを削除
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }
  
  /**
   * キャッシュをクリア
   */
  clear(): void {
    this.cache.clear()
    this.stats.hitCount = 0
    this.stats.missCount = 0
  }
  
  /**
   * 期限切れエントリをクリーンアップ
   */
  cleanup(): number {
    const now = Date.now()
    let removed = 0
    
    this.cache.forEach((entry, key) => {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key)
        removed++
      }
    });
    
    return removed
  }
  
  /**
   * 統計情報を取得
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values())
    const totalRequests = this.stats.hitCount + this.stats.missCount
    
    return {
      hitCount: this.stats.hitCount,
      missCount: this.stats.missCount,
      hitRate: totalRequests > 0 ? this.stats.hitCount / totalRequests : 0,
      totalEntries: this.cache.size,
      totalSize: this.cache.size,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : 0,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : 0
    }
  }
  
  /**
   * サイズを取得
   */
  get size(): number {
    return this.cache.size
  }
  
  /**
   * キーの存在確認
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    
    const now = Date.now()
    if (now > entry.timestamp + entry.ttl) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }
}

/**
 * メモ化デコレーター
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string,
  ttl?: number
): T & { cache: LRUCache<ReturnType<T>>; clearCache: () => void } {
  const cache = new LRUCache<ReturnType<T>>(50, ttl)
  
  const memoizedFn = ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)
    
    let result = cache.get(key)
    if (result === undefined) {
      result = fn(...args)
      if (result !== undefined) {
        cache.set(key, result)
      }
    }
    
    return result!
  }) as T & { cache: LRUCache<ReturnType<T>>; clearCache: () => void }
  
  memoizedFn.cache = cache
  memoizedFn.clearCache = () => cache.clear()
  
  return memoizedFn
}

/**
 * 非同期メモ化デコレーター
 */
export function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string,
  ttl?: number
): T & { cache: LRUCache<ReturnType<T>>; clearCache: () => void } {
  const cache = new LRUCache<ReturnType<T>>(50, ttl)
  const pendingCache = new Map<string, ReturnType<T>>()
  
  const memoizedFn = (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)
    
    // キャッシュから確認
    let result = cache.get(key)
    if (result !== undefined) {
      return result as Awaited<ReturnType<T>>
    }
    
    // 実行中の処理があるかチェック
    if (pendingCache.has(key)) {
      return pendingCache.get(key)! as Awaited<ReturnType<T>>
    }
    
    // 新しい処理を開始
    const promise = fn(...args)
    pendingCache.set(key, promise as ReturnType<T>)
    
    try {
      result = await promise
      if (result !== undefined) {
        cache.set(key, result)
      }
      return result as Awaited<ReturnType<T>>
    } finally {
      pendingCache.delete(key)
    }
  }) as T & { cache: LRUCache<ReturnType<T>>; clearCache: () => void }
  
  memoizedFn.cache = cache
  memoizedFn.clearCache = () => {
    cache.clear()
    pendingCache.clear()
  }
  
  return memoizedFn
}

/**
 * 重い処理を遅延実行する
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null
  
  const debouncedFn = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }) as T & { cancel: () => void }
  
  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }
  
  return debouncedFn
}

/**
 * 処理を間引く
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  interval: number
): T & { cancel: () => void } {
  let lastCall = 0
  let timeoutId: NodeJS.Timeout | null = null
  
  const throttledFn = ((...args: Parameters<T>) => {
    const now = Date.now()
    
    if (now - lastCall >= interval) {
      lastCall = now
      fn(...args)
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now()
        fn(...args)
        timeoutId = null
      }, interval - (now - lastCall))
    }
  }) as T & { cancel: () => void }
  
  throttledFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }
  
  return throttledFn
}

/**
 * バッチ処理
 */
export class BatchProcessor<T, R> {
  private batch: T[] = []
  private timer: NodeJS.Timeout | null = null
  private processor: (items: T[]) => Promise<R[]>
  private batchSize: number
  private delay: number
  
  constructor(
    processor: (items: T[]) => Promise<R[]>,
    batchSize: number = 10,
    delay: number = 100
  ) {
    this.processor = processor
    this.batchSize = batchSize
    this.delay = delay
  }
  
  /**
   * アイテムを追加
   */
  add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      const batchItem = { item, resolve, reject }
      this.batch.push(batchItem as any)
      
      // バッチサイズに達したらすぐ処理
      if (this.batch.length >= this.batchSize) {
        this.flush()
      } else {
        // タイマーがない場合は設定
        if (!this.timer) {
          this.timer = setTimeout(() => this.flush(), this.delay)
        }
      }
    })
  }
  
  /**
   * バッチを即座に処理
   */
  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    
    if (this.batch.length === 0) return
    
    const currentBatch = this.batch
    this.batch = []
    
    try {
      const items = currentBatch.map((b: any) => b.item)
      const results = await this.processor(items)
      
      currentBatch.forEach((batchItem: any, index) => {
        batchItem.resolve(results[index])
      })
    } catch (error) {
      currentBatch.forEach((batchItem: any) => {
        batchItem.reject(error)
      })
    }
  }
  
  /**
   * 待機中のバッチをクリア
   */
  clear(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    
    this.batch.forEach((batchItem: any) => {
      batchItem.reject(new Error('Batch cleared'))
    })
    
    this.batch = []
  }
}

/**
 * パフォーマンス測定
 */
export class PerformanceMonitor {
  private measurements = new Map<string, number[]>()
  
  /**
   * 処理時間を測定
   */
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const end = performance.now()
    
    this.recordMeasurement(name, end - start)
    return result
  }
  
  /**
   * 非同期処理時間を測定
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    const result = await fn()
    const end = performance.now()
    
    this.recordMeasurement(name, end - start)
    return result
  }
  
  /**
   * 測定結果を記録
   */
  private recordMeasurement(name: string, duration: number): void {
    if (!this.measurements.has(name)) {
      this.measurements.set(name, [])
    }
    
    const measurements = this.measurements.get(name)!
    measurements.push(duration)
    
    // 最新100件のみ保持
    if (measurements.length > 100) {
      measurements.splice(0, measurements.length - 100)
    }
  }
  
  /**
   * 統計情報を取得
   */
  getStats(name: string) {
    const measurements = this.measurements.get(name) || []
    if (measurements.length === 0) {
      return null
    }
    
    const sorted = [...measurements].sort((a, b) => a - b)
    const sum = measurements.reduce((a, b) => a + b, 0)
    
    return {
      count: measurements.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      average: sum / measurements.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    }
  }
  
  /**
   * 全ての統計情報を取得
   */
  getAllStats() {
    const stats: Record<string, any> = {}
    Array.from(this.measurements.keys()).forEach(name => {
      stats[name] = this.getStats(name)
    })
    return stats
  }
  
  /**
   * 測定結果をクリア
   */
  clear(name?: string): void {
    if (name) {
      this.measurements.delete(name)
    } else {
      this.measurements.clear()
    }
  }
}

// シングルトンインスタンス
export const performanceMonitor = new PerformanceMonitor()

/**
 * 遅延ローディング
 */
export class LazyLoader<T> {
  private loader: () => Promise<T>
  private cache: T | null = null
  private loading = false
  private loadPromise: Promise<T> | null = null
  
  constructor(loader: () => Promise<T>) {
    this.loader = loader
  }
  
  /**
   * データを遅延ロード
   */
  async load(): Promise<T> {
    if (this.cache !== null) {
      return this.cache
    }
    
    if (this.loading && this.loadPromise) {
      return this.loadPromise
    }
    
    this.loading = true
    this.loadPromise = this.loader()
    
    try {
      this.cache = await this.loadPromise
      return this.cache
    } finally {
      this.loading = false
      this.loadPromise = null
    }
  }
  
  /**
   * キャッシュをクリア
   */
  clear(): void {
    this.cache = null
  }
  
  /**
   * キャッシュの状態を確認
   */
  get isLoaded(): boolean {
    return this.cache !== null
  }
  
  /**
   * ローディング中かどうか
   */
  get isLoading(): boolean {
    return this.loading
  }
}