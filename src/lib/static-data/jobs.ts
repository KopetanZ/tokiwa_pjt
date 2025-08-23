import type { JobDefinition, TrainerJob } from './types'

/**
 * トレーナー職業定義データ
 * 各職業の特性、成長率、雇用条件を定義
 */

export const JOB_DEFINITIONS: Record<TrainerJob, JobDefinition> = {
  ranger: {
    id: 'ranger',
    name: 'Ranger',
    nameJa: 'レンジャー',
    description: 'Wild pokemon capture and exploration specialist',
    
    baseSalary: 3500,
    startingLevel: 1,
    levelMultiplier: 1.2,
    
    skillAffinities: {
      capture: 3,      // 優秀
      exploration: 2,  // 良い
      battle: 0,       // 平均
      research: -1,    // やや苦手
      healing: -1      // やや苦手
    },
    
    personalityTendencies: {
      courage: 2,      // 勇敢
      caution: -1,     // やや大胆
      curiosity: 1,    // 好奇心旺盛
      teamwork: 0,     // 普通
      independence: 1, // やや独立的
      compliance: -1   // やや自由奔放
    },
    
    specialAbilities: [
      'wild_pokemon_tracking',
      'terrain_navigation',
      'capture_rate_bonus',
      'exploration_speed_bonus'
    ],
    
    growthRates: {
      experienceMultiplier: 1.1,
      skillGrowthRate: 1.2,
      trustGrowthRate: 1.0
    },
    
    hireCost: 15000,
    minimumReputation: 0,
    unlockConditions: [],
    
    flavor: {
      personalityDescription: '自然を愛し、野生のポケモンとの出会いを大切にする冒険家',
      workStyle: '直感的で行動力があり、危険を恐れず未知の領域を探索する',
      motivations: [
        '新しいポケモンとの出会い',
        '未踏の地の探索',
        '自然環境の保護'
      ],
      catchphrases: [
        '次はどんなポケモンに会えるかな？',
        'この先に何があるか見てみよう！',
        '野生のポケモンの声が聞こえる...'
      ]
    }
  },

  breeder: {
    id: 'breeder',
    name: 'Breeder',
    nameJa: 'ブリーダー',
    description: 'Pokemon care and nurturing specialist',
    
    baseSalary: 3000,
    startingLevel: 1,
    levelMultiplier: 1.0,
    
    skillAffinities: {
      capture: -1,     // やや苦手
      exploration: -1, // やや苦手
      battle: -2,      // 苦手
      research: 2,     // 良い
      healing: 3       // 優秀
    },
    
    personalityTendencies: {
      courage: -1,     // やや慎重
      caution: 2,      // 慎重
      curiosity: 1,    // 好奇心旺盛
      teamwork: 2,     // 協調的
      independence: -1,// やや依存的
      compliance: 1    // 規則正しい
    },
    
    specialAbilities: [
      'pokemon_health_monitoring',
      'healing_efficiency_bonus',
      'status_ailment_treatment',
      'pokemon_happiness_boost'
    ],
    
    growthRates: {
      experienceMultiplier: 0.9,
      skillGrowthRate: 1.0,
      trustGrowthRate: 1.3
    },
    
    hireCost: 12000,
    minimumReputation: 0,
    unlockConditions: [],
    
    flavor: {
      personalityDescription: 'ポケモンの健康と幸福を第一に考える優しい心の持ち主',
      workStyle: '慎重で丁寧、ポケモン一匹一匹と深い絆を築く',
      motivations: [
        'ポケモンの健康管理',
        'より良いケア方法の研究',
        'ポケモンとの絆の深化'
      ],
      catchphrases: [
        'みんな元気にしてるかな？',
        'このポケモンには特別なケアが必要ね',
        '健康第一よ！'
      ]
    }
  },

  researcher: {
    id: 'researcher',
    name: 'Researcher',
    nameJa: 'リサーチャー',
    description: 'Pokemon biology and ecology research specialist',
    
    baseSalary: 3800,
    startingLevel: 2,
    levelMultiplier: 1.1,
    
    skillAffinities: {
      capture: 0,      // 平均
      exploration: 1,  // 良い
      battle: -2,      // 苦手
      research: 3,     // 優秀
      healing: 1       // 良い
    },
    
    personalityTendencies: {
      courage: -1,     // やや慎重
      caution: 1,      // 慎重
      curiosity: 2,    // 非常に好奇心旺盛
      teamwork: 1,     // 協調的
      independence: 0, // 普通
      compliance: 2    // 規則正しい
    },
    
    specialAbilities: [
      'pokemon_data_analysis',
      'research_efficiency_bonus',
      'rare_discovery_boost',
      'scientific_documentation'
    ],
    
    growthRates: {
      experienceMultiplier: 1.0,
      skillGrowthRate: 1.1,
      trustGrowthRate: 0.9
    },
    
    hireCost: 18000,
    minimumReputation: 20,
    unlockConditions: ['completed_expeditions_10'],
    
    flavor: {
      personalityDescription: '科学的思考を持ち、ポケモンの生態解明に情熱を注ぐ研究者',
      workStyle: '論理的で体系的、データ収集と分析を重視する',
      motivations: [
        'ポケモンの生態解明',
        '新しい発見',
        '科学的知見の蓄積'
      ],
      catchphrases: [
        '興味深いデータですね...',
        'これは新しい発見かもしれません！',
        '仮説を検証してみましょう'
      ]
    }
  },

  battler: {
    id: 'battler',
    name: 'Battler',
    nameJa: 'バトラー',
    description: 'Pokemon battle and combat specialist',
    
    baseSalary: 4000,
    startingLevel: 1,
    levelMultiplier: 1.3,
    
    skillAffinities: {
      capture: 1,      // 良い
      exploration: 0,  // 平均
      battle: 3,       // 優秀
      research: -1,    // やや苦手
      healing: 0       // 平均
    },
    
    personalityTendencies: {
      courage: 2,      // 勇敢
      caution: -2,     // 大胆
      curiosity: 0,    // 普通
      teamwork: -1,    // やや個人主義
      independence: 2, // 独立的
      compliance: -1   // やや自由奔放
    },
    
    specialAbilities: [
      'battle_strategy_optimization',
      'combat_experience_bonus',
      'aggressive_capture_tactics',
      'danger_zone_navigation'
    ],
    
    growthRates: {
      experienceMultiplier: 1.2,
      skillGrowthRate: 1.3,
      trustGrowthRate: 0.8
    },
    
    hireCost: 20000,
    minimumReputation: 10,
    unlockConditions: [],
    
    flavor: {
      personalityDescription: '戦闘に情熱を燃やし、強さを追求する熱血漢',
      workStyle: '積極的で攻撃的、困難な状況でも諦めない',
      motivations: [
        '強いポケモンとの戦い',
        '自身の成長',
        '勝利の追求'
      ],
      catchphrases: [
        '燃えてきたぞ！',
        '強敵ほど燃える！',
        '勝負だ！'
      ]
    }
  },

  medic: {
    id: 'medic',
    name: 'Medic',
    nameJa: 'メディック',
    description: 'Pokemon medical care and emergency response specialist',
    
    baseSalary: 4200,
    startingLevel: 2,
    levelMultiplier: 1.0,
    
    skillAffinities: {
      capture: -1,     // やや苦手
      exploration: 0,  // 平均
      battle: 1,       // 良い
      research: 2,     // 良い
      healing: 3       // 優秀
    },
    
    personalityTendencies: {
      courage: 1,      // 勇敢
      caution: 2,      // 慎重
      curiosity: 1,    // 好奇心旺盛
      teamwork: 2,     // 協調的
      independence: 0, // 普通
      compliance: 2    // 規則正しい
    },
    
    specialAbilities: [
      'emergency_medical_response',
      'critical_care_expertise',
      'medical_equipment_mastery',
      'team_health_coordination'
    ],
    
    growthRates: {
      experienceMultiplier: 0.9,
      skillGrowthRate: 1.0,
      trustGrowthRate: 1.4
    },
    
    hireCost: 25000,
    minimumReputation: 30,
    unlockConditions: ['facility_healing_center', 'completed_expeditions_20'],
    
    flavor: {
      personalityDescription: '冷静で責任感が強く、緊急時に頼りになる医療の専門家',
      workStyle: '計画的で慎重、チーム全体の安全を最優先に考える',
      motivations: [
        'ポケモンの生命を救う',
        '医療技術の向上',
        'チームの安全確保'
      ],
      catchphrases: [
        '安全第一です',
        '適切な処置が必要ですね',
        'みんなの健康が私の使命です'
      ]
    }
  }
}

/**
 * 職業データへのアクセス関数
 */
export const getJobDefinition = (job: TrainerJob): JobDefinition => {
  return JOB_DEFINITIONS[job]
}

export const getAllJobs = (): JobDefinition[] => {
  return Object.values(JOB_DEFINITIONS)
}

export const getJobsByUnlockStatus = (playerLevel: number, reputation: number, unlockedConditions: string[]): {
  unlocked: JobDefinition[]
  locked: JobDefinition[]
} => {
  const all = getAllJobs()
  const unlocked: JobDefinition[] = []
  const locked: JobDefinition[] = []
  
  all.forEach(job => {
    const canUnlock = 
      reputation >= job.minimumReputation &&
      job.unlockConditions.every(condition => unlockedConditions.includes(condition))
    
    if (canUnlock) {
      unlocked.push(job)
    } else {
      locked.push(job)
    }
  })
  
  return { unlocked, locked }
}

export const calculateTrainerSalary = (job: TrainerJob, level: number): number => {
  const jobDef = getJobDefinition(job)
  return Math.floor(jobDef.baseSalary * Math.pow(jobDef.levelMultiplier, level - 1))
}

export const getJobSkillBonus = (job: TrainerJob, skill: keyof JobDefinition['skillAffinities']): number => {
  return getJobDefinition(job).skillAffinities[skill]
}

export const getJobPersonalityTendency = (job: TrainerJob, trait: keyof JobDefinition['personalityTendencies']): number => {
  return getJobDefinition(job).personalityTendencies[trait]
}