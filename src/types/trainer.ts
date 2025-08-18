export interface TrainerJob {
  id: number
  name: string
  nameJa: string
  level: number
  experience: number
  nextLevelExp: number
  specializations: Record<string, number>
}

export interface TrainerParty {
  pokemonCount: number
  totalLevel: number
  averageLevel: number
}

export interface TrainerSummary {
  id: string
  name: string
  job: TrainerJob
  status: 'available' | 'on_expedition' | 'training' | 'injured' | 'busy'
  party: TrainerParty
  trustLevel: number
  salary: number
  spritePath: string
}

export interface TrainerDetail extends TrainerSummary {
  preferences: Record<string, number>
  complianceRate: number
  personality: string
  totalEarned: number
  statistics: {
    expeditionsCompleted: number
    successRate: number
    pokemonCaught: number
    totalEarnings: number
  }
}