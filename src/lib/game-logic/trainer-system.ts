// トレーナーレベルアップシステム
import { gameRandom } from './random-system'
import { soundSystem } from './sound-system'

export interface TrainerStats {
  level: number
  experience: number
  name: string
  job: TrainerJob
  specialization: string[]
  skills: TrainerSkills
  trust_level: number
  personality: TrainerPersonality
  hire_date: string
  salary_base: number
  performance_bonus: number
  total_expeditions: number
  successful_expeditions: number
  pokemon_caught: number
  total_money_earned: number
  injuries_sustained: number
  favorite_location_types: string[]
}

export interface TrainerSkills {
  pokemon_handling: number // ポケモンの扱い (1-100)
  navigation: number       // ナビゲーション (1-100)  
  survival: number         // サバイバル (1-100)
  battle_tactics: number   // バトル戦術 (1-100)
  research: number         // 研究 (1-100)
  leadership: number       // リーダーシップ (1-100)
}

export interface TrainerPersonality {
  courage: number          // 勇敢さ (-10 ～ +10)
  caution: number         // 慎重さ (-10 ～ +10)
  curiosity: number       // 好奇心 (-10 ～ +10)
  teamwork: number        // チームワーク (-10 ～ +10)
  independence: number    // 独立性 (-10 ～ +10)
  compliance: number      // アドバイス遵守 (-10 ～ +10)
}

export type TrainerJob = 'ranger' | 'breeder' | 'researcher' | 'battler' | 'medic'

export interface LevelUpResult {
  newLevel: number
  skillsImproved: Array<{
    skill: keyof TrainerSkills
    oldValue: number
    newValue: number
    improvement: number
  }>
  newAbilities: string[]
  salaryIncrease: number
  specialBonuses: string[]
}

export class TrainerSystem {
  // 経験値テーブル（レベル毎に必要な累計経験値）
  private static EXPERIENCE_TABLE: number[] = [
    0,     // Lv.1
    1000,  // Lv.2
    2500,  // Lv.3
    4500,  // Lv.4
    7000,  // Lv.5
    10000, // Lv.6
    13500, // Lv.7
    17500, // Lv.8
    22000, // Lv.9
    27000, // Lv.10
    32500, // Lv.11
    38500, // Lv.12
    45000, // Lv.13
    52000, // Lv.14
    59500, // Lv.15
    67500, // Lv.16
    76000, // Lv.17
    85000, // Lv.18
    94500, // Lv.19
    104500, // Lv.20
    115000, // Lv.21
    126000, // Lv.22
    137500, // Lv.23
    149500, // Lv.24
    162000, // Lv.25
    // ... 必要に応じて拡張
  ]

  // 職業ごとのスキル成長倍率
  private static JOB_SKILL_MULTIPLIERS: Record<TrainerJob, Partial<TrainerSkills>> = {
    ranger: {
      pokemon_handling: 1.5,
      navigation: 1.3,
      survival: 1.4,
      battle_tactics: 1.0,
      research: 0.8,
      leadership: 1.1
    },
    breeder: {
      pokemon_handling: 1.5,
      navigation: 1.0,
      survival: 1.2,
      battle_tactics: 0.8,
      research: 1.1,
      leadership: 1.1
    },
    researcher: {
      pokemon_handling: 1.2,
      navigation: 0.9,
      survival: 0.8,
      battle_tactics: 0.7,
      research: 1.6,
      leadership: 1.0
    },
    battler: {
      pokemon_handling: 1.4,
      navigation: 1.0,
      survival: 1.1,
      battle_tactics: 1.6,
      research: 0.6,
      leadership: 1.2
    },
    medic: {
      pokemon_handling: 1.2,
      navigation: 1.0,
      survival: 1.3,
      battle_tactics: 0.7,
      research: 1.2,
      leadership: 1.3
    }
  }

  // 経験値からレベル計算
  static calculateLevel(experience: number): number {
    for (let i = TrainerSystem.EXPERIENCE_TABLE.length - 1; i >= 0; i--) {
      if (experience >= TrainerSystem.EXPERIENCE_TABLE[i]) {
        return i + 1
      }
    }
    return 1
  }

  // 次のレベルまでの必要経験値計算
  static getExperienceToNextLevel(currentExp: number): {
    currentLevel: number
    nextLevel: number
    expForNext: number
    expForCurrent: number
    remaining: number
    progress: number
  } {
    const currentLevel = this.calculateLevel(currentExp)
    const nextLevel = currentLevel + 1
    
    const expForCurrent = this.EXPERIENCE_TABLE[currentLevel - 1] || 0
    const expForNext = this.EXPERIENCE_TABLE[nextLevel - 1] || (expForCurrent + 10000)
    
    const remaining = expForNext - currentExp
    const progress = (currentExp - expForCurrent) / (expForNext - expForCurrent)
    
    return {
      currentLevel,
      nextLevel,
      expForNext,
      expForCurrent,
      remaining,
      progress: Math.max(0, Math.min(1, progress))
    }
  }

  // トレーナーレベルアップ処理
  static processLevelUp(trainer: TrainerStats, expGained: number): {
    leveledUp: boolean
    result?: LevelUpResult
  } {
    const oldLevel = trainer.level
    const oldExp = trainer.experience
    const newExp = oldExp + expGained
    
    trainer.experience = newExp
    const newLevel = this.calculateLevel(newExp)
    
    if (newLevel <= oldLevel) {
      return { leveledUp: false }
    }
    
    trainer.level = newLevel
    const levelsGained = newLevel - oldLevel
    
    // スキル向上計算
    const skillsImproved: LevelUpResult['skillsImproved'] = []
    const jobMultipliers = this.JOB_SKILL_MULTIPLIERS[trainer.job]
    
    Object.keys(trainer.skills).forEach(skillName => {
      const skill = skillName as keyof TrainerSkills
      const oldValue = trainer.skills[skill]
      const multiplier = jobMultipliers[skill] || 1.0
      
      // レベルアップ毎に基本2-5ポイント、職業補正と個人差を適用
      const baseIncrease = gameRandom.integer(2, 5) * levelsGained
      const personalityBonus = this.getPersonalitySkillBonus(trainer.personality, skill)
      const jobMultipliedIncrease = Math.floor(baseIncrease * multiplier)
      const finalIncrease = Math.max(1, jobMultipliedIncrease + personalityBonus)
      
      const newValue = Math.min(100, oldValue + finalIncrease)
      
      if (newValue > oldValue) {
        trainer.skills[skill] = newValue
        skillsImproved.push({
          skill,
          oldValue,
          newValue,
          improvement: newValue - oldValue
        })
      }
    })

    // 新能力の獲得
    const newAbilities = this.checkNewAbilities(trainer, oldLevel, newLevel)
    
    // 給与アップ計算
    const salaryIncrease = Math.floor(trainer.salary_base * 0.1 * levelsGained)
    trainer.salary_base += salaryIncrease
    
    // 特別ボーナスの判定
    const specialBonuses = this.checkSpecialBonuses(trainer, oldLevel, newLevel)
    
    // レベルアップ音を再生
    console.log('🔊 レベルアップ音を再生')
    
    console.log(`🌟 ${trainer.name} がLv.${oldLevel} → Lv.${newLevel} にレベルアップ！`)
    
    return {
      leveledUp: true,
      result: {
        newLevel,
        skillsImproved,
        newAbilities,
        salaryIncrease,
        specialBonuses
      }
    }
  }

  // 性格によるスキルボーナス計算
  private static getPersonalitySkillBonus(personality: TrainerPersonality, skill: keyof TrainerSkills): number {
    const bonusMap: Record<keyof TrainerSkills, (p: TrainerPersonality) => number> = {
      pokemon_handling: (p) => Math.floor(p.teamwork * 0.2),
      navigation: (p) => Math.floor(p.caution * 0.2),
      survival: (p) => Math.floor(p.courage * 0.2),
      battle_tactics: (p) => Math.floor((p.courage + p.independence) * 0.1),
      research: (p) => Math.floor(p.curiosity * 0.2),
      leadership: (p) => Math.floor((p.teamwork + p.independence) * 0.1)
    }
    
    return bonusMap[skill]?.(personality) || 0
  }

  // 新能力の獲得チェック
  private static checkNewAbilities(trainer: TrainerStats, oldLevel: number, newLevel: number): string[] {
    const newAbilities: string[] = []
    
    // レベル5: 専門化選択
    if (oldLevel < 5 && newLevel >= 5) {
      newAbilities.push('専門分野の選択が可能')
    }
    
    // レベル10: アドバイス能力向上
    if (oldLevel < 10 && newLevel >= 10) {
      newAbilities.push('より詳細なアドバイスが可能')
      trainer.trust_level += 10
    }
    
    // レベル15: パーティリーダー
    if (oldLevel < 15 && newLevel >= 15) {
      newAbilities.push('パーティリーダーとして活動可能')
    }
    
    // レベル20: エキスパート
    if (oldLevel < 20 && newLevel >= 20) {
      newAbilities.push('エキスパートレベルに到達')
      trainer.trust_level += 15
    }
    
    // 特定スキル値に応じた能力解放
    if (trainer.skills.pokemon_handling >= 80 && !trainer.specialization.includes('pokemon_master')) {
      trainer.specialization.push('pokemon_master')
      newAbilities.push('ポケモンマスター：ポケモンの特殊能力を引き出せる')
    }
    
    if (trainer.skills.research >= 90 && !trainer.specialization.includes('field_researcher')) {
      trainer.specialization.push('field_researcher')
      newAbilities.push('フィールド研究者：新発見の確率が上昇')
    }
    
    return newAbilities
  }

  // 特別ボーナスチェック
  private static checkSpecialBonuses(trainer: TrainerStats, oldLevel: number, newLevel: number): string[] {
    const bonuses: string[] = []
    
    // 連続成功ボーナス
    if (trainer.successful_expeditions > 50 && trainer.successful_expeditions / trainer.total_expeditions > 0.85) {
      bonuses.push('高成功率ボーナス：派遣成功率+5%')
    }
    
    // 大量捕獲ボーナス
    if (trainer.pokemon_caught > 100) {
      bonuses.push('捕獲エキスパート：ポケモン捕獲率+10%')
    }
    
    // 安全記録ボーナス
    if (trainer.total_expeditions > 30 && trainer.injuries_sustained === 0) {
      bonuses.push('安全第一：怪我をする確率-50%')
    }
    
    // 高収益ボーナス
    if (trainer.total_money_earned > 500000) {
      bonuses.push('収益エキスパート：報酬+15%')
    }
    
    return bonuses
  }

  // トレーナー生成（新規雇用用）
  static generateTrainer(job: TrainerJob, level: number = 1): TrainerStats {
    const baseExp = this.EXPERIENCE_TABLE[level - 1] || 0
    const names = ['タケシ', 'カスミ', 'マチス', 'エリカ', 'ナツメ', 'カツラ', 'サカキ', 'グリーン']
    
    const baseSkills = this.generateBaseSkills(job, level)
    const personality = this.generatePersonality()
    
    return {
      level,
      experience: baseExp,
      name: gameRandom.choice(names),
      job,
      specialization: [],
      skills: baseSkills,
      trust_level: gameRandom.integer(30, 60),
      personality,
      hire_date: new Date().toISOString(),
      salary_base: this.calculateBaseSalary(job, level),
      performance_bonus: 0,
      total_expeditions: 0,
      successful_expeditions: 0,
      pokemon_caught: 0,
      total_money_earned: 0,
      injuries_sustained: 0,
      favorite_location_types: []
    }
  }

  // 基本スキル生成
  private static generateBaseSkills(job: TrainerJob, level: number): TrainerSkills {
    const multipliers = this.JOB_SKILL_MULTIPLIERS[job]
    const baseValue = 20 + (level * 2) // レベルに応じた基本値
    
    return {
      pokemon_handling: Math.floor(baseValue * (multipliers.pokemon_handling || 1.0) + gameRandom.integer(-5, 5)),
      navigation: Math.floor(baseValue * (multipliers.navigation || 1.0) + gameRandom.integer(-5, 5)),
      survival: Math.floor(baseValue * (multipliers.survival || 1.0) + gameRandom.integer(-5, 5)),
      battle_tactics: Math.floor(baseValue * (multipliers.battle_tactics || 1.0) + gameRandom.integer(-5, 5)),
      research: Math.floor(baseValue * (multipliers.research || 1.0) + gameRandom.integer(-5, 5)),
      leadership: Math.floor(baseValue * (multipliers.leadership || 1.0) + gameRandom.integer(-5, 5))
    }
  }

  // 性格生成
  private static generatePersonality(): TrainerPersonality {
    return {
      courage: gameRandom.integer(-10, 10),
      caution: gameRandom.integer(-10, 10),
      curiosity: gameRandom.integer(-10, 10),
      teamwork: gameRandom.integer(-10, 10),
      independence: gameRandom.integer(-10, 10),
      compliance: gameRandom.integer(-10, 10)
    }
  }

  // 基本給計算
  private static calculateBaseSalary(job: TrainerJob, level: number): number {
    const baseSalaries: Record<TrainerJob, number> = {
      ranger: 25000,
      breeder: 28000,
      researcher: 30000,
      battler: 27000,
      medic: 32000
    }
    
    return baseSalaries[job] + (level * 2000)
  }

  // 新規トレーナーの雇用
  static hireNewTrainer(
    name: string,
    job: TrainerJob,
    initialLevel: number = 1
  ): { trainer: TrainerStats; hireCost: number } {
    const personality = this.generatePersonality()
    const skills = this.generateBaseSkills(job, initialLevel)
    const baseSalary = this.calculateBaseSalary(job, initialLevel)
    
    // 雇用コストの計算（基本給の3-5倍）
    const hireCostMultiplier = gameRandom.range(3.0, 5.0)
    const hireCost = Math.floor(baseSalary * hireCostMultiplier)
    
    const trainer: TrainerStats = {
      level: initialLevel,
      experience: this.EXPERIENCE_TABLE[initialLevel - 1] || 0,
      name,
      job,
      specialization: [],
      skills,
      trust_level: gameRandom.integer(30, 60), // 初期信頼度
      personality,
      hire_date: new Date().toISOString(),
      salary_base: baseSalary,
      performance_bonus: 0,
      total_expeditions: 0,
      successful_expeditions: 0,
      pokemon_caught: 0,
      total_money_earned: 0,
      injuries_sustained: 0,
      favorite_location_types: []
    }
    
    return { trainer, hireCost }
  }

  // 利用可能なトレーナー候補の生成
  static generateTrainerCandidates(): Array<{
    name: string
    job: TrainerJob
    jobNameJa: string
    level: number
    hireCost: number
    specialty: string
    preview: {
      estimatedSkills: Partial<TrainerSkills>
      personality: string
      expectedSalary: number
    }
  }> {
    const candidateNames = [
      'エリカ', 'ナツメ', 'カツラ', 'キョウ', 'アンズ', 'シバ', 
      'イブキ', 'ハヤト', 'ツクシ', 'アカネ', 'マツバ', 'ミカン'
    ]
    
    const jobInfo: Record<TrainerJob, { nameJa: string; specialty: string }> = {
      ranger: { nameJa: 'レンジャー', specialty: '捕獲特化' },
      breeder: { nameJa: 'ブリーダー', specialty: '育成特化' },
      researcher: { nameJa: 'リサーチャー', specialty: '発見特化' },
      battler: { nameJa: 'バトラー', specialty: '戦闘特化' },
      medic: { nameJa: 'メディック', specialty: '治療特化' }
    }
    
    const jobs: TrainerJob[] = ['ranger', 'breeder', 'researcher', 'battler', 'medic']
    const candidates = []
    
    for (let i = 0; i < Math.min(candidateNames.length, 6); i++) {
      const name = candidateNames[i]
      const job = jobs[gameRandom.integer(0, jobs.length - 1)]
      const level = gameRandom.integer(1, 3)
      const { trainer, hireCost } = this.hireNewTrainer(name, job, level)
      
      candidates.push({
        name,
        job,
        jobNameJa: jobInfo[job].nameJa,
        level,
        hireCost,
        specialty: jobInfo[job].specialty,
        preview: {
          estimatedSkills: {
            pokemon_handling: trainer.skills.pokemon_handling,
            navigation: trainer.skills.navigation,
            battle_tactics: trainer.skills.battle_tactics
          },
          personality: this.getPersonalityDescription(trainer.personality),
          expectedSalary: trainer.salary_base
        }
      })
    }
    
    return candidates
  }

  // 性格の説明テキスト生成
  private static getPersonalityDescription(personality: TrainerPersonality): string {
    const traits = []
    
    if (personality.courage > 5) traits.push('勇敢')
    else if (personality.courage < -5) traits.push('慎重')
    
    if (personality.curiosity > 5) traits.push('好奇心旺盛')
    else if (personality.curiosity < -5) traits.push('保守的')
    
    if (personality.teamwork > 5) traits.push('協調性あり')
    else if (personality.independence > 5) traits.push('独立志向')
    
    return traits.length > 0 ? traits.join('・') : 'バランス型'
  }

  // トレーナーの詳細ステータス表示用フォーマット
  static formatTrainerDetails(trainer: TrainerStats): string {
    const expInfo = this.getExperienceToNextLevel(trainer.experience)
    const successRate = trainer.total_expeditions > 0 ? 
      (trainer.successful_expeditions / trainer.total_expeditions * 100).toFixed(1) : '0.0'
    
    return `
【${trainer.name}】Lv.${trainer.level} ${trainer.job}
経験値: ${trainer.experience} (次のレベルまで: ${expInfo.remaining})
信頼度: ${trainer.trust_level}/100
成功率: ${successRate}% (${trainer.successful_expeditions}/${trainer.total_expeditions})

スキル:
- ポケモンハンドリング: ${trainer.skills.pokemon_handling}
- ナビゲーション: ${trainer.skills.navigation}  
- サバイバル: ${trainer.skills.survival}
- バトル戦術: ${trainer.skills.battle_tactics}
- 研究: ${trainer.skills.research}
- リーダーシップ: ${trainer.skills.leadership}

専門分野: ${trainer.specialization.join(', ') || 'なし'}
給与: ¥${trainer.salary_base.toLocaleString()}/月
    `.trim()
  }
}

// システムインスタンス
export const trainerSystem = TrainerSystem