// ゲーム用乱数生成システム
// 再現可能で決定論的な乱数を提供

export class GameRandom {
  private seed: number
  private state: number
  
  constructor(seed?: number) {
    this.seed = seed || Date.now()
    this.state = this.seed
  }
  
  // Linear Congruential Generator
  next(): number {
    this.state = (this.state * 1664525 + 1013904223) % Math.pow(2, 32)
    return this.state / Math.pow(2, 32)
  }
  
  // 範囲指定ランダム
  range(min: number, max: number): number {
    return min + this.next() * (max - min)
  }
  
  // 整数ランダム
  integer(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1))
  }
  
  // 確率判定
  chance(probability: number): boolean {
    return this.next() < probability
  }
  
  // 重み付き選択
  weightedChoice<T>(choices: Array<{item: T, weight: number}>): T {
    const totalWeight = choices.reduce((sum, choice) => sum + choice.weight, 0)
    let random = this.next() * totalWeight
    
    for (const choice of choices) {
      random -= choice.weight
      if (random <= 0) {
        return choice.item
      }
    }
    
    return choices[choices.length - 1].item
  }
  
  // 配列からランダム選択
  choice<T>(array: T[]): T {
    return array[this.integer(0, array.length - 1)]
  }
  
  // 配列をシャッフル
  shuffle<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = this.integer(0, i)
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
  
  // ガウシアン分布（Box-Muller変換）
  gaussian(mean: number = 0, stdDev: number = 1): number {
    if (this.hasSpare) {
      this.hasSpare = false
      return this.spare * stdDev + mean
    }
    
    this.hasSpare = true
    const u = this.next()
    const v = this.next()
    const mag = stdDev * Math.sqrt(-2 * Math.log(u))
    this.spare = mag * Math.cos(2 * Math.PI * v)
    
    return mag * Math.sin(2 * Math.PI * v) + mean
  }
  
  // ポアソン分布（イベント発生に有用）
  poisson(lambda: number): number {
    const L = Math.exp(-lambda)
    let k = 0
    let p = 1
    
    do {
      k++
      p *= this.next()
    } while (p > L)
    
    return k - 1
  }
  
  // シードをリセット
  setSeed(seed: number): void {
    this.seed = seed
    this.state = seed
  }
  
  // 現在のシード値を取得
  getSeed(): number {
    return this.seed
  }
  
  private hasSpare: boolean = false
  private spare: number = 0
}

// グローバルインスタンス
export const gameRandom = new GameRandom()