// 施設改良・アップグレードシステム
import { gameRandom } from './random-system'
import { economySystem } from './economy-system'
import { soundSystem } from './sound-system'

export interface Facility {
  id: string
  name: string
  category: FacilityCategory
  description: string
  level: number
  maxLevel: number
  effects: FacilityEffect[]
  upgradeCost: number
  maintenanceCost: number
  constructionTime: number // 時間（分）
  requirements: FacilityRequirement[]
  unlockLevel: number
  isUnlocked: boolean
  isActive: boolean
  lastMaintenanceDate: string
  condition: number // 0-100 (コンディション)
}

export interface FacilityEffect {
  type: EffectType
  value: number
  description: string
  global: boolean // 全体効果かどうか
}

export interface FacilityRequirement {
  type: 'trainer_level' | 'facility_level' | 'money' | 'pokemon_count' | 'expedition_count'
  targetId?: string
  value: number
  description: string
}

export interface UpgradeProject {
  id: string
  facilityId: string
  startTime: string
  completionTime: string
  cost: number
  newLevel: number
  status: 'in_progress' | 'completed' | 'cancelled'
}

export type FacilityCategory = 
  | 'training' 
  | 'medical' 
  | 'research' 
  | 'storage' 
  | 'accommodation' 
  | 'security'
  | 'utility'

export type EffectType = 
  | 'expedition_success_rate'
  | 'pokemon_recovery_rate' 
  | 'trainer_experience_bonus'
  | 'pokemon_experience_bonus'
  | 'item_storage_capacity'
  | 'pokemon_storage_capacity'
  | 'maintenance_cost_reduction'
  | 'construction_time_reduction'
  | 'injury_prevention'
  | 'research_speed_bonus'

export class FacilitySystem {
  private facilities: Map<string, Facility> = new Map()
  private upgradeProjects: Map<string, UpgradeProject> = new Map()

  constructor() {
    this.initializeBaseFacilities()
  }

  // 基本施設の初期化
  private initializeBaseFacilities(): void {
    const baseFacilities: Facility[] = [
      // 訓練施設
      {
        id: 'training_ground',
        name: '訓練場',
        category: 'training',
        description: 'トレーナーとポケモンの訓練を行う基本的な施設',
        level: 1,
        maxLevel: 10,
        effects: [
          {
            type: 'trainer_experience_bonus',
            value: 10,
            description: 'トレーナー経験値+10%',
            global: true
          },
          {
            type: 'pokemon_experience_bonus',
            value: 5,
            description: 'ポケモン経験値+5%',
            global: true
          }
        ],
        upgradeCost: 10000,
        maintenanceCost: 500,
        constructionTime: 120,
        requirements: [],
        unlockLevel: 1,
        isUnlocked: true,
        isActive: true,
        lastMaintenanceDate: new Date().toISOString(),
        condition: 100
      },

      // 医療施設
      {
        id: 'medical_center',
        name: 'ポケモンセンター',
        category: 'medical',
        description: 'ポケモンの回復と治療を行う施設',
        level: 1,
        maxLevel: 8,
        effects: [
          {
            type: 'pokemon_recovery_rate',
            value: 25,
            description: 'ポケモン回復速度+25%',
            global: true
          },
          {
            type: 'injury_prevention',
            value: 10,
            description: '怪我防止効果+10%',
            global: true
          }
        ],
        upgradeCost: 15000,
        maintenanceCost: 800,
        constructionTime: 180,
        requirements: [
          {
            type: 'trainer_level',
            value: 5,
            description: 'プレイヤーレベル5以上'
          }
        ],
        unlockLevel: 5,
        isUnlocked: false,
        isActive: false,
        lastMaintenanceDate: new Date().toISOString(),
        condition: 100
      },

      // 研究施設
      {
        id: 'research_lab',
        name: '研究施設',
        category: 'research',
        description: 'ポケモンの研究と新技術の開発を行う施設',
        level: 0,
        maxLevel: 12,
        effects: [
          {
            type: 'research_speed_bonus',
            value: 20,
            description: '研究速度+20%',
            global: true
          },
          {
            type: 'expedition_success_rate',
            value: 5,
            description: '派遣成功率+5%',
            global: true
          }
        ],
        upgradeCost: 25000,
        maintenanceCost: 1200,
        constructionTime: 360,
        requirements: [
          {
            type: 'trainer_level',
            value: 10,
            description: 'プレイヤーレベル10以上'
          },
          {
            type: 'facility_level',
            targetId: 'training_ground',
            value: 3,
            description: '訓練場レベル3以上'
          }
        ],
        unlockLevel: 10,
        isUnlocked: false,
        isActive: false,
        lastMaintenanceDate: new Date().toISOString(),
        condition: 100
      },

      // 倉庫
      {
        id: 'storage_warehouse',
        name: '倉庫',
        category: 'storage',
        description: 'アイテムとポケモンを保管する施設',
        level: 1,
        maxLevel: 15,
        effects: [
          {
            type: 'item_storage_capacity',
            value: 50,
            description: 'アイテム保管数+50',
            global: true
          },
          {
            type: 'pokemon_storage_capacity',
            value: 10,
            description: 'ポケモン保管数+10',
            global: true
          }
        ],
        upgradeCost: 8000,
        maintenanceCost: 300,
        constructionTime: 90,
        requirements: [],
        unlockLevel: 3,
        isUnlocked: false,
        isActive: false,
        lastMaintenanceDate: new Date().toISOString(),
        condition: 100
      },

      // 宿泊施設
      {
        id: 'trainer_lodge',
        name: 'トレーナー宿舎',
        category: 'accommodation',
        description: 'トレーナーが休息を取る宿泊施設',
        level: 0,
        maxLevel: 6,
        effects: [
          {
            type: 'trainer_experience_bonus',
            value: 15,
            description: 'トレーナー経験値+15%',
            global: true
          },
          {
            type: 'maintenance_cost_reduction',
            value: 10,
            description: '維持費-10%',
            global: true
          }
        ],
        upgradeCost: 20000,
        maintenanceCost: 600,
        constructionTime: 240,
        requirements: [
          {
            type: 'trainer_level',
            value: 8,
            description: 'プレイヤーレベル8以上'
          },
          {
            type: 'expedition_count',
            value: 20,
            description: '派遣実行20回以上'
          }
        ],
        unlockLevel: 8,
        isUnlocked: false,
        isActive: false,
        lastMaintenanceDate: new Date().toISOString(),
        condition: 100
      },

      // セキュリティ施設
      {
        id: 'security_system',
        name: 'セキュリティシステム',
        category: 'security',
        description: '施設の安全を守るセキュリティシステム',
        level: 0,
        maxLevel: 8,
        effects: [
          {
            type: 'injury_prevention',
            value: 20,
            description: '怪我防止効果+20%',
            global: true
          },
          {
            type: 'maintenance_cost_reduction',
            value: 5,
            description: '維持費-5%',
            global: true
          }
        ],
        upgradeCost: 18000,
        maintenanceCost: 400,
        constructionTime: 200,
        requirements: [
          {
            type: 'trainer_level',
            value: 12,
            description: 'プレイヤーレベル12以上'
          },
          {
            type: 'money',
            value: 50000,
            description: '50,000円以上の資金'
          }
        ],
        unlockLevel: 12,
        isUnlocked: false,
        isActive: false,
        lastMaintenanceDate: new Date().toISOString(),
        condition: 100
      }
    ]

    baseFacilities.forEach(facility => {
      this.facilities.set(facility.id, facility)
    })
  }

  // 全施設取得
  getAllFacilities(): Facility[] {
    return Array.from(this.facilities.values())
  }

  // 利用可能な施設取得
  getAvailableFacilities(): Facility[] {
    return Array.from(this.facilities.values()).filter(f => f.isUnlocked)
  }

  // アップグレード可能な施設取得
  getUpgradeableFacilities(): Facility[] {
    return Array.from(this.facilities.values()).filter(f => 
      f.isUnlocked && f.level < f.maxLevel && this.canUpgrade(f.id)
    )
  }

  // 施設取得
  getFacility(facilityId: string): Facility | null {
    return this.facilities.get(facilityId) || null
  }

  // アップグレード可能判定
  canUpgrade(facilityId: string): boolean {
    const facility = this.facilities.get(facilityId)
    if (!facility || facility.level >= facility.maxLevel) return false

    // 資金チェック
    const currentMoney = economySystem.getCurrentMoney()
    const upgradeCost = this.calculateUpgradeCost(facility)
    if (currentMoney < upgradeCost) return false

    // 要求条件チェック
    return this.checkRequirements(facility.requirements)
  }

  // 要求条件チェック
  private checkRequirements(requirements: FacilityRequirement[]): boolean {
    // 簡易実装 - 実際は各システムから情報を取得
    return true
  }

  // アップグレードコスト計算
  private calculateUpgradeCost(facility: Facility): number {
    const baseMultiplier = Math.pow(1.5, facility.level)
    const categoryMultiplier = this.getCategoryMultiplier(facility.category)
    return Math.floor(facility.upgradeCost * baseMultiplier * categoryMultiplier)
  }

  // カテゴリ別コスト倍率
  private getCategoryMultiplier(category: FacilityCategory): number {
    const multipliers: Record<FacilityCategory, number> = {
      training: 1.0,
      medical: 1.2,
      research: 1.5,
      storage: 0.8,
      accommodation: 1.1,
      security: 1.3,
      utility: 0.9
    }
    return multipliers[category] || 1.0
  }

  // アップグレード開始
  async startUpgrade(facilityId: string): Promise<{
    success: boolean
    message: string
    projectId?: string
  }> {
    const facility = this.facilities.get(facilityId)
    if (!facility) {
      return { success: false, message: '施設が見つかりません' }
    }

    const upgradeCost = this.calculateUpgradeCost(facility)
    if (economySystem.getCurrentMoney() < upgradeCost) {
      return { success: false, message: '資金が不足しています' }
    }
    
    if (!this.canUpgrade(facilityId)) {
      return { success: false, message: 'アップグレード条件を満たしていません' }
    }
    
    // 資金消費
    const paymentResult = economySystem.recordExpense(
      'upgrade',
      upgradeCost,
      `${facility.name} アップグレード`,
      'upgrade'
    )

    if (!paymentResult) {
      return { success: false, message: '資金が不足しています' }
    }

    // アップグレードプロジェクト作成
    const projectId = `upgrade_${facilityId}_${Date.now()}`
    const startTime = new Date()
    const completionTime = new Date(startTime.getTime() + facility.constructionTime * 60 * 1000)

    const project: UpgradeProject = {
      id: projectId,
      facilityId,
      startTime: startTime.toISOString(),
      completionTime: completionTime.toISOString(),
      cost: upgradeCost,
      newLevel: facility.level + 1,
      status: 'in_progress'
    }

    this.upgradeProjects.set(projectId, project)

    // アップグレード開始音
    console.log('🔊 アップグレード開始音を再生')

    console.log(`🏗️ ${facility.name} のアップグレードを開始: Lv.${facility.level} → Lv.${facility.level + 1}`)
    
    return { 
      success: true, 
      message: `${facility.name}のアップグレードを開始しました`,
      projectId 
    }
  }

  // 即座完了（デバッグ用）
  async completeUpgradeInstantly(projectId: string): Promise<boolean> {
    const project = this.upgradeProjects.get(projectId)
    if (!project || project.status !== 'in_progress') return false

    return this.completeUpgrade(projectId)
  }

  // アップグレード完了
  private completeUpgrade(projectId: string): boolean {
    const project = this.upgradeProjects.get(projectId)
    if (!project || project.status !== 'in_progress') return false

    const facility = this.facilities.get(project.facilityId)
    if (!facility) return false

    // レベルアップ
    facility.level = project.newLevel
    
    // 効果値の更新（レベルに応じて）
    facility.effects.forEach(effect => {
      effect.value = Math.floor(effect.value * 1.2) // 20%向上
    })

    // アップグレードコスト更新
    facility.upgradeCost = this.calculateUpgradeCost(facility)
    facility.condition = 100 // 新品状態

    // プロジェクト完了
    project.status = 'completed'

    // 完了音
    console.log('🔊 アップグレード完了音を再生')

    console.log(`✅ ${facility.name} アップグレード完了: Lv.${facility.level}`)
    
    return true
  }

  // アップグレード進行状況チェック
  checkUpgradeProgress(): void {
    const currentTime = new Date()
    
    for (const [projectId, project] of Array.from(this.upgradeProjects.entries())) {
      if (project.status === 'in_progress') {
        const completionTime = new Date(project.completionTime)
        if (currentTime >= completionTime) {
          this.completeUpgrade(projectId)
        }
      }
    }
  }

  // 進行中のプロジェクト取得
  getActiveProjects(): UpgradeProject[] {
    return Array.from(this.upgradeProjects.values())
      .filter(p => p.status === 'in_progress')
  }

  // 施設のロック解除
  unlockFacility(facilityId: string): boolean {
    const facility = this.facilities.get(facilityId)
    if (!facility || facility.isUnlocked) return false

    if (!this.checkRequirements(facility.requirements)) return false

    facility.isUnlocked = true
    facility.isActive = facility.level > 0
    
    console.log(`🔓 施設ロック解除: ${facility.name}`)
    return true
  }

  // 全体効果計算
  calculateGlobalEffects(): Record<EffectType, number> {
    const effects: Partial<Record<EffectType, number>> = {}
    
    for (const facility of Array.from(this.facilities.values())) {
      if (facility.isActive && facility.level > 0) {
        for (const effect of facility.effects) {
          if (effect.global) {
            effects[effect.type] = (effects[effect.type] || 0) + effect.value
          }
        }
      }
    }
    
    return effects as Record<EffectType, number>
  }

  // 月次メンテナンス
  performMonthlyMaintenance(): {
    totalCost: number
    facilitiesServiced: number
    conditionImprovement: number
  } {
    let totalCost = 0
    let facilitiesServiced = 0
    let totalConditionImprovement = 0

    for (const facility of Array.from(this.facilities.values())) {
      if (facility.isActive && facility.level > 0) {
        const maintenanceCost = facility.maintenanceCost * facility.level
        const globalEffects = this.calculateGlobalEffects()
        const costReduction = globalEffects.maintenance_cost_reduction || 0
        const actualCost = Math.floor(maintenanceCost * (1 - costReduction / 100))
        
        economySystem.recordExpense(
          'maintenance',
          actualCost,
          `${facility.name} 月次メンテナンス`,
          'maintenance'
        )
        
        totalCost += actualCost
        facilitiesServiced++
        
        // コンディション改善
        const conditionGain = gameRandom.integer(10, 20)
        facility.condition = Math.min(100, facility.condition + conditionGain)
        totalConditionImprovement += conditionGain
        
        facility.lastMaintenanceDate = new Date().toISOString()
      }
    }

    return {
      totalCost,
      facilitiesServiced,
      conditionImprovement: Math.floor(totalConditionImprovement / Math.max(facilitiesServiced, 1))
    }
  }

  // 施設ステータス取得
  getFacilityStatus(): {
    total: number
    active: number
    upgrading: number
    averageLevel: number
    averageCondition: number
    monthlyMaintenanceCost: number
  } {
    const activeFacilities = Array.from(this.facilities.values()).filter(f => f.isActive)
    const upgradingCount = this.getActiveProjects().length
    
    const averageLevel = activeFacilities.length > 0 ?
      activeFacilities.reduce((sum, f) => sum + f.level, 0) / activeFacilities.length : 0
    
    const averageCondition = activeFacilities.length > 0 ?
      activeFacilities.reduce((sum, f) => sum + f.condition, 0) / activeFacilities.length : 100

    const monthlyMaintenanceCost = activeFacilities.reduce((sum, f) => 
      sum + (f.maintenanceCost * f.level), 0)

    return {
      total: this.facilities.size,
      active: activeFacilities.length,
      upgrading: upgradingCount,
      averageLevel: Math.round(averageLevel * 10) / 10,
      averageCondition: Math.round(averageCondition),
      monthlyMaintenanceCost
    }
  }

  // デバッグ用：施設レベル強制設定
  debugSetFacilityLevel(facilityId: string, level: number): boolean {
    const facility = this.facilities.get(facilityId)
    if (!facility) return false

    facility.level = Math.min(level, facility.maxLevel)
    facility.isActive = facility.level > 0
    facility.isUnlocked = true
    
    return true
  }

  // デバッグ用：全施設ロック解除
  debugUnlockAllFacilities(): void {
    for (const facility of Array.from(this.facilities.values())) {
      facility.isUnlocked = true
    }
  }
}

// システムインスタンス
export const facilitySystem = new FacilitySystem()

// 定期的なアップグレードチェック（1分毎）
// テスト環境では実行しない
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    facilitySystem.checkUpgradeProgress()
  }, 60000)
}