// 施設管理システム
import { economySystem } from './economy'
import { supabase } from './supabase'

// 施設タイプ定義
export interface Facility {
  id: string
  name: string
  nameJa: string
  type: 'training' | 'research' | 'medical' | 'storage' | 'utility' | 'expansion'
  level: number
  maxLevel: number
  capacity: number
  currentUsage: number
  efficiency: number // 効率倍率
  maintenanceCost: number // 月次維持費
  upgradeRequirements: {
    cost: number
    materials?: string[]
    prerequisite?: string[]
    time: number // アップグレード時間（分）
  }
  effects: {
    trainerEfficiency?: number
    pokemonRecovery?: number
    researchSpeed?: number
    storageCapacity?: number
    incomeBonus?: number
  }
  status: 'active' | 'upgrading' | 'maintenance' | 'inactive'
  description: string
  unlockCondition?: {
    requiredLevel?: number
    requiredFacilities?: string[]
    requiredResearch?: string[]
  }
}

// 施設アップグレード進行状況
export interface FacilityUpgrade {
  facilityId: string
  targetLevel: number
  startTime: Date
  endTime: Date
  cost: number
  materials: string[]
  progress: number // 0-100
}

// 研究プロジェクト
export interface ResearchProject {
  id: string
  name: string
  nameJa: string
  category: 'efficiency' | 'pokemon' | 'training' | 'economy' | 'expedition'
  researchPoints: number
  maxResearchPoints: number
  cost: number
  duration: number // 日数
  researchers: number // 必要研究者数
  effects: {
    description: string
    trainerEfficiency?: number
    pokemonGrowth?: number
    expeditionSuccess?: number
    incomeMultiplier?: number
    facilityEfficiency?: number
  }
  status: 'available' | 'researching' | 'completed' | 'locked'
  prerequisites?: string[]
}

// 施設管理システムクラス
class FacilityManagementSystem {
  private facilities: Map<string, Facility> = new Map()
  private upgrades: Map<string, FacilityUpgrade> = new Map()
  private researchProjects: Map<string, ResearchProject> = new Map()
  private totalResearchPoints: number = 0
  private userId: string | null = null
  
  constructor() {
    this.initializeBaseFacilities()
    this.initializeResearchProjects()
    this.loadUserData()
  }
  
  // ユーザーデータ読み込み
  private async loadUserData(): Promise<void> {
    try {
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          this.userId = user.id
          await this.syncWithDatabase()
        }
      }
    } catch (error) {
      console.error('ユーザーデータ読み込みエラー:', error)
    }
  }
  
  // データベース同期
  private async syncWithDatabase(): Promise<void> {
    if (!this.userId || !supabase) return
    
    try {
      // 施設データ読み込み
      const { data: facilitiesData } = await supabase
        .from('facilities')
        .select('*')
        .eq('user_id', this.userId)
      
      if (facilitiesData) {
        facilitiesData.forEach((facilityData: any) => {
          const facility = this.facilities.get(facilityData.facility_id)
          if (facility) {
            facility.level = facilityData.level
            facility.status = facilityData.status
            facility.currentUsage = facilityData.current_usage
            this.updateFacilityEffects(facility)
          }
        })
      }
      
      // 研究プロジェクトデータ読み込み
      const { data: researchData } = await supabase
        .from('research_projects')
        .select('*')
        .eq('user_id', this.userId)
      
      if (researchData) {
        researchData.forEach((projectData: any) => {
          const project = this.researchProjects.get(projectData.project_id)
          if (project) {
            project.researchPoints = projectData.research_points
            project.status = projectData.status
          }
        })
      }
      
    } catch (error) {
      console.error('データベース同期エラー:', error)
    }
  }
  
  // 施設データ保存
  private async saveFacilityData(facilityId: string): Promise<void> {
    if (!this.userId || !supabase) return
    
    const facility = this.facilities.get(facilityId)
    if (!facility) return
    
    try {
      const { error } = await supabase
        .from('facilities')
        .upsert({
          user_id: this.userId,
          facility_id: facilityId,
          level: facility.level,
          status: facility.status,
          current_usage: facility.currentUsage,
          efficiency: facility.efficiency,
          updated_at: new Date().toISOString()
        })
      
      if (error) throw error
    } catch (error) {
      console.error('施設データ保存エラー:', error)
    }
  }
  
  // 研究プロジェクトデータ保存
  private async saveResearchData(projectId: string): Promise<void> {
    if (!this.userId || !supabase) return
    
    const project = this.researchProjects.get(projectId)
    if (!project) return
    
    try {
      const { error } = await supabase
        .from('research_projects')
        .upsert({
          user_id: this.userId,
          project_id: projectId,
          research_points: project.researchPoints,
          status: project.status,
          updated_at: new Date().toISOString()
        })
      
      if (error) throw error
    } catch (error) {
      console.error('研究データ保存エラー:', error)
    }
  }
  
  // 基本施設初期化
  private initializeBaseFacilities(): void {
    const baseFacilities: Facility[] = [
      {
        id: 'training_ground',
        name: 'training_ground',
        nameJa: '訓練場',
        type: 'training',
        level: 1,
        maxLevel: 10,
        capacity: 5,
        currentUsage: 2,
        efficiency: 1.0,
        maintenanceCost: 1500,
        upgradeRequirements: {
          cost: 8000,
          materials: ['wood', 'metal'],
          time: 120 // 2時間
        },
        effects: {
          trainerEfficiency: 1.1,
          pokemonRecovery: 1.05
        },
        status: 'active',
        description: 'トレーナーとポケモンの基本訓練を行う施設。レベルアップで効率向上。'
      },
      {
        id: 'pokemon_center',
        name: 'pokemon_center',
        nameJa: 'ポケモンセンター',
        type: 'medical',
        level: 1,
        maxLevel: 8,
        capacity: 10,
        currentUsage: 3,
        efficiency: 1.0,
        maintenanceCost: 2000,
        upgradeRequirements: {
          cost: 12000,
          materials: ['medical_supplies', 'technology'],
          time: 180
        },
        effects: {
          pokemonRecovery: 1.25
        },
        status: 'active',
        description: '負傷したポケモンの治療と回復を行う医療施設。'
      },
      {
        id: 'research_lab',
        name: 'research_lab',
        nameJa: '研究所',
        type: 'research',
        level: 0,
        maxLevel: 12,
        capacity: 3,
        currentUsage: 0,
        efficiency: 1.0,
        maintenanceCost: 3000,
        upgradeRequirements: {
          cost: 25000,
          materials: ['technology', 'books', 'specimens'],
          prerequisite: ['training_ground_3'],
          time: 360 // 6時間
        },
        effects: {
          researchSpeed: 1.5
        },
        status: 'inactive',
        description: '新技術や効率向上の研究を行う先進施設。未建設。',
        unlockCondition: {
          requiredLevel: 3,
          requiredFacilities: ['training_ground']
        }
      },
      {
        id: 'storage_warehouse',
        name: 'storage_warehouse',
        nameJa: '倉庫',
        type: 'storage',
        level: 1,
        maxLevel: 6,
        capacity: 100,
        currentUsage: 25,
        efficiency: 1.0,
        maintenanceCost: 800,
        upgradeRequirements: {
          cost: 5000,
          materials: ['wood', 'metal'],
          time: 90
        },
        effects: {
          storageCapacity: 1.5
        },
        status: 'active',
        description: 'アイテム、資材、ポケモン用品の保管施設。'
      },
      {
        id: 'dormitory',
        name: 'dormitory',
        nameJa: 'トレーナー寮',
        type: 'utility',
        level: 1,
        maxLevel: 8,
        capacity: 8,
        currentUsage: 3,
        efficiency: 1.0,
        maintenanceCost: 1200,
        upgradeRequirements: {
          cost: 15000,
          materials: ['wood', 'furniture'],
          time: 240
        },
        effects: {
          trainerEfficiency: 1.05,
          incomeBonus: 1.1
        },
        status: 'active',
        description: 'トレーナーの居住施設。快適性が作業効率に影響。'
      },
      {
        id: 'breeding_center',
        name: 'breeding_center',
        nameJa: '育成センター',
        type: 'training',
        level: 0,
        maxLevel: 10,
        capacity: 15,
        currentUsage: 0,
        efficiency: 1.0,
        maintenanceCost: 2500,
        upgradeRequirements: {
          cost: 30000,
          materials: ['specialized_equipment', 'medical_supplies'],
          prerequisite: ['pokemon_center_3', 'research_lab_2'],
          time: 480 // 8時間
        },
        effects: {
          pokemonRecovery: 1.3,
          trainerEfficiency: 1.15
        },
        status: 'inactive',
        description: '高度なポケモン育成と繁殖を行う特殊施設。',
        unlockCondition: {
          requiredLevel: 5,
          requiredFacilities: ['pokemon_center', 'research_lab'],
          requiredResearch: ['advanced_breeding']
        }
      }
    ]
    
    baseFacilities.forEach(facility => {
      this.facilities.set(facility.id, facility)
    })
  }
  
  // 研究プロジェクト初期化
  private initializeResearchProjects(): void {
    const projects: ResearchProject[] = [
      {
        id: 'efficiency_boost',
        name: 'efficiency_boost',
        nameJa: '作業効率向上研究',
        category: 'efficiency',
        researchPoints: 0,
        maxResearchPoints: 100,
        cost: 5000,
        duration: 7,
        researchers: 1,
        effects: {
          description: '全トレーナーの作業効率が10%向上',
          trainerEfficiency: 1.1
        },
        status: 'available'
      },
      {
        id: 'pokemon_nutrition',
        name: 'pokemon_nutrition',
        nameJa: 'ポケモン栄養学',
        category: 'pokemon',
        researchPoints: 0,
        maxResearchPoints: 150,
        cost: 8000,
        duration: 10,
        researchers: 2,
        effects: {
          description: 'ポケモンの成長速度が25%向上',
          pokemonGrowth: 1.25
        },
        status: 'available'
      },
      {
        id: 'expedition_optimization',
        name: 'expedition_optimization',
        nameJa: '派遣戦略最適化',
        category: 'expedition',
        researchPoints: 0,
        maxResearchPoints: 200,
        cost: 12000,
        duration: 14,
        researchers: 2,
        effects: {
          description: '派遣成功率が15%向上',
          expeditionSuccess: 1.15
        },
        status: 'locked',
        prerequisites: ['efficiency_boost']
      },
      {
        id: 'advanced_breeding',
        name: 'advanced_breeding',
        nameJa: '高度育成技術',
        category: 'training',
        researchPoints: 0,
        maxResearchPoints: 300,
        cost: 20000,
        duration: 21,
        researchers: 3,
        effects: {
          description: '育成センター解放、ポケモン成長+50%',
          pokemonGrowth: 1.5,
          facilityEfficiency: 1.2
        },
        status: 'locked',
        prerequisites: ['pokemon_nutrition', 'efficiency_boost']
      },
      {
        id: 'economic_strategy',
        name: 'economic_strategy',
        nameJa: '経済戦略研究',
        category: 'economy',
        researchPoints: 0,
        maxResearchPoints: 180,
        cost: 15000,
        duration: 12,
        researchers: 2,
        effects: {
          description: '全収入が20%増加',
          incomeMultiplier: 1.2
        },
        status: 'locked',
        prerequisites: ['efficiency_boost']
      }
    ]
    
    projects.forEach(project => {
      this.researchProjects.set(project.id, project)
    })
  }
  
  // 施設一覧取得
  getFacilities(): Facility[] {
    return Array.from(this.facilities.values())
  }
  
  // 特定施設取得
  getFacility(id: string): Facility | null {
    return this.facilities.get(id) || null
  }
  
  // 施設アップグレード開始
  startUpgrade(facilityId: string): { success: boolean; message: string } {
    const facility = this.facilities.get(facilityId)
    if (!facility) {
      return { success: false, message: '施設が見つかりません' }
    }
    
    if (facility.level >= facility.maxLevel) {
      return { success: false, message: '既に最大レベルです' }
    }
    
    if (facility.status === 'upgrading') {
      return { success: false, message: '既にアップグレード中です' }
    }
    
    const requirements = facility.upgradeRequirements
    
    // 資金チェック
    if (!economySystem.canAfford(requirements.cost)) {
      return { success: false, message: '資金が不足しています' }
    }
    
    // 前提条件チェック
    if (requirements.prerequisite) {
      for (const prereq of requirements.prerequisite) {
        const [facilityId, level] = prereq.split('_')
        const prereqFacility = this.facilities.get(facilityId)
        if (!prereqFacility || prereqFacility.level < parseInt(level)) {
          return { success: false, message: `前提条件が満たされていません: ${prereq}` }
        }
      }
    }
    
    // 支払い実行
    const paymentSuccess = economySystem.makePayment(
      'facility',
      requirements.cost,
      `${facility.nameJa} アップグレード Lv.${facility.level} → ${facility.level + 1}`,
      facilityId
    )
    
    if (!paymentSuccess) {
      return { success: false, message: '支払いに失敗しました' }
    }
    
    // アップグレード開始
    const startTime = new Date()
    const endTime = new Date(startTime.getTime() + requirements.time * 60 * 1000)
    
    const upgrade: FacilityUpgrade = {
      facilityId,
      targetLevel: facility.level + 1,
      startTime,
      endTime,
      cost: requirements.cost,
      materials: requirements.materials || [],
      progress: 0
    }
    
    this.upgrades.set(facilityId, upgrade)
    facility.status = 'upgrading'
    
    // アップグレード完了タイマー
    setTimeout(() => {
      this.completeUpgrade(facilityId)
    }, requirements.time * 60 * 1000)
    
    return { success: true, message: `${facility.nameJa}のアップグレードを開始しました` }
  }
  
  // アップグレード完了
  private async completeUpgrade(facilityId: string): Promise<void> {
    const facility = this.facilities.get(facilityId)
    const upgrade = this.upgrades.get(facilityId)
    
    if (!facility || !upgrade) return
    
    // レベルアップ
    facility.level = upgrade.targetLevel
    facility.status = 'active'
    
    // 効果更新
    this.updateFacilityEffects(facility)
    
    // アップグレード記録削除
    this.upgrades.delete(facilityId)
    
    // データベース保存
    await this.saveFacilityData(facilityId)
    
    // 収入記録
    economySystem.recordIncome(
      'facility',
      0,
      `${facility.nameJa} アップグレード完了 (Lv.${facility.level})`,
      facilityId
    )
  }
  
  // 施設効果更新
  private updateFacilityEffects(facility: Facility): void {
    // レベルに応じた効果向上
    const levelMultiplier = 1 + (facility.level - 1) * 0.1 // レベル毎に10%向上
    
    facility.efficiency = levelMultiplier
    facility.capacity = Math.floor(facility.capacity * 1.2) // 容量20%増加
    facility.maintenanceCost = Math.floor(facility.maintenanceCost * 1.15) // 維持費15%増加
    
    // 次レベルのアップグレード要件更新
    facility.upgradeRequirements.cost = Math.floor(facility.upgradeRequirements.cost * 1.5)
    facility.upgradeRequirements.time = Math.floor(facility.upgradeRequirements.time * 1.2)
  }
  
  // 研究プロジェクト開始
  startResearch(projectId: string): { success: boolean; message: string } {
    const project = this.researchProjects.get(projectId)
    if (!project) {
      return { success: false, message: '研究プロジェクトが見つかりません' }
    }
    
    if (project.status !== 'available') {
      return { success: false, message: '研究を開始できません' }
    }
    
    // 研究所チェック
    const researchLab = this.facilities.get('research_lab')
    if (!researchLab || researchLab.level === 0) {
      return { success: false, message: '研究所が必要です' }
    }
    
    // 資金チェック
    if (!economySystem.canAfford(project.cost)) {
      return { success: false, message: '研究資金が不足しています' }
    }
    
    // 前提研究チェック
    if (project.prerequisites) {
      for (const prereq of project.prerequisites) {
        const prereqProject = this.researchProjects.get(prereq)
        if (!prereqProject || prereqProject.status !== 'completed') {
          return { success: false, message: `前提研究が完了していません: ${prereq}` }
        }
      }
    }
    
    // 支払い実行
    const paymentSuccess = economySystem.makePayment(
      'research',
      project.cost,
      `研究プロジェクト: ${project.nameJa}`,
      projectId
    )
    
    if (!paymentSuccess) {
      return { success: false, message: '支払いに失敗しました' }
    }
    
    // 研究開始
    project.status = 'researching'
    
    // 研究進行シミュレーション
    this.startResearchProgress(projectId)
    
    return { success: true, message: `${project.nameJa}の研究を開始しました` }
  }
  
  // 研究進行シミュレーション
  private startResearchProgress(projectId: string): void {
    const project = this.researchProjects.get(projectId)
    if (!project) return
    
    const researchLab = this.facilities.get('research_lab')
    const baseSpeed = researchLab ? researchLab.level * 2 : 1
    
    const progressInterval = setInterval(() => {
      if (project.status !== 'researching') {
        clearInterval(progressInterval)
        return
      }
      
      // 研究ポイント増加（1時間毎）
      const pointsPerHour = baseSpeed * project.researchers
      project.researchPoints = Math.min(
        project.maxResearchPoints,
        project.researchPoints + pointsPerHour
      )
      
      // 完了チェック
      if (project.researchPoints >= project.maxResearchPoints) {
        this.completeResearch(projectId)
        clearInterval(progressInterval)
      }
    }, 60 * 60 * 1000) // 1時間毎
  }
  
  // 研究完了
  private async completeResearch(projectId: string): Promise<void> {
    const project = this.researchProjects.get(projectId)
    if (!project) return
    
    project.status = 'completed'
    this.totalResearchPoints += project.maxResearchPoints
    
    // 研究効果適用
    this.applyResearchEffects(project)
    
    // 新しい研究プロジェクト解放
    this.unlockNewResearch()
    
    // データベース保存
    await this.saveResearchData(projectId)
    
    // 成果記録
    economySystem.recordIncome(
      'research',
      0,
      `研究完了: ${project.nameJa}`,
      projectId
    )
  }
  
  // 研究効果適用
  private applyResearchEffects(project: ResearchProject): void {
    // グローバル効果をここで適用
    // 実際の実装では他のシステムと連携する必要がある
    console.log(`研究効果適用: ${project.nameJa}`, project.effects)
  }
  
  // 新研究プロジェクト解放
  private unlockNewResearch(): void {
    this.researchProjects.forEach(project => {
      if (project.status === 'locked' && project.prerequisites) {
        const allPrereqsCompleted = project.prerequisites.every(prereqId => {
          const prereq = this.researchProjects.get(prereqId)
          return prereq && prereq.status === 'completed'
        })
        
        if (allPrereqsCompleted) {
          project.status = 'available'
        }
      }
    })
  }
  
  // 施設効率取得
  getFacilityEfficiency(facilityId: string): number {
    const facility = this.facilities.get(facilityId)
    return facility ? facility.efficiency : 1.0
  }
  
  // 総維持費計算
  getTotalMaintenanceCost(): number {
    return Array.from(this.facilities.values())
      .filter(f => f.status === 'active')
      .reduce((total, f) => total + f.maintenanceCost, 0)
  }
  
  // アップグレード状況取得
  getUpgrades(): FacilityUpgrade[] {
    return Array.from(this.upgrades.values())
  }
  
  // 研究プロジェクト一覧取得
  getResearchProjects(): ResearchProject[] {
    return Array.from(this.researchProjects.values())
  }
  
  // 研究ポイント総計取得
  getTotalResearchPoints(): number {
    return this.totalResearchPoints
  }
}

export const facilitySystem = new FacilityManagementSystem()