'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Shield, 
  Sword, 
  Target, 
  Compass, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  Star
} from "lucide-react"

interface StrategyOption {
  id: string
  name: string
  nameEn: string
  icon: any
  description: string
  characteristics: {
    success_modifier: number
    safety_modifier: number
    reward_modifier: number
    time_modifier: number
    special_effects: string[]
  }
  best_for: string[]
  avoid_when: string[]
  color: string
}

interface StrategySelectorProps {
  selectedStrategy: string
  onStrategyChange: (strategy: string) => void
  location: {
    name: string
    dangerLevel: number
    encounterTypes: string[]
    requiredLevel: number
  }
  trainer: {
    name: string
    level: number
    specialization: string[]
  }
  party: any[]
}

const STRATEGIES: StrategyOption[] = [
  {
    id: 'balanced',
    name: 'バランス型',
    nameEn: 'balanced',
    icon: Target,
    description: 'リスクと報酬のバランスを取った安定した戦略',
    characteristics: {
      success_modifier: 0,
      safety_modifier: 0,
      reward_modifier: 0,
      time_modifier: 0,
      special_effects: ['安定した結果', '予測しやすい展開']
    },
    best_for: ['初心者トレーナー', '未知の場所', '標準的な派遣'],
    avoid_when: [],
    color: 'blue'
  },
  {
    id: 'aggressive',
    name: '積極的',
    nameEn: 'aggressive',
    icon: Sword,
    description: '高いリスクを取って大きな報酬を狙う戦略',
    characteristics: {
      success_modifier: 20,
      safety_modifier: -20,
      reward_modifier: 30,
      time_modifier: -10,
      special_effects: ['レアポケモン遭遇率アップ', '大きな報酬の可能性', '短時間で完了']
    },
    best_for: ['経験豊富なトレーナー', '低危険度エリア', '収益重視'],
    avoid_when: ['高危険度エリア', 'パーティが弱い', 'トレーナーが負傷中'],
    color: 'red'
  },
  {
    id: 'defensive',
    name: '防御的',
    nameEn: 'defensive', 
    icon: Shield,
    description: '安全性を最優先に考えた慎重な戦略',
    characteristics: {
      success_modifier: -10,
      safety_modifier: 30,
      reward_modifier: -20,
      time_modifier: 15,
      special_effects: ['怪我のリスクを大幅軽減', '確実な帰還', 'トレーナー経験値アップ']
    },
    best_for: ['高危険度エリア', '新人トレーナー', 'パーティが弱い'],
    avoid_when: ['時間制限がある', '高収益が必要'],
    color: 'green'
  },
  {
    id: 'exploration',
    name: '探索重視',
    nameEn: 'exploration',
    icon: Compass,
    description: '新発見や珍しいアイテムの発見に特化した戦略',
    characteristics: {
      success_modifier: -20,
      safety_modifier: -10,
      reward_modifier: 40,
      time_modifier: 25,
      special_effects: ['アイテム発見率アップ', '隠しエリア発見', '研究データ収集']
    },
    best_for: ['研究目的', '新しいエリア', 'アイテム収集'],
    avoid_when: ['時間が限られている', '安全性が最重要'],
    color: 'purple'
  }
]

export function StrategySelector({
  selectedStrategy,
  onStrategyChange,
  location,
  trainer,
  party
}: StrategySelectorProps) {
  const [showDetails, setShowDetails] = useState(false)

  const getStrategyRecommendation = (strategy: StrategyOption) => {
    let score = 0
    let reasons: string[] = []

    // 危険度に基づく推奨
    if (location.dangerLevel >= 4) {
      if (strategy.id === 'defensive') {
        score += 30
        reasons.push('高危険度エリアに最適')
      } else if (strategy.id === 'aggressive') {
        score -= 20
        reasons.push('危険すぎる可能性')
      }
    } else if (location.dangerLevel <= 2) {
      if (strategy.id === 'aggressive') {
        score += 20
        reasons.push('低危険度で積極的に')
      } else if (strategy.id === 'defensive') {
        score -= 10
        reasons.push('過度に慎重')
      }
    }

    // トレーナーレベルに基づく推奨
    if (trainer.level >= 15) {
      if (strategy.id === 'aggressive' || strategy.id === 'exploration') {
        score += 15
        reasons.push('経験豊富なトレーナーに適合')
      }
    } else if (trainer.level <= 5) {
      if (strategy.id === 'defensive' || strategy.id === 'balanced') {
        score += 15
        reasons.push('新人トレーナーに安全')
      }
    }

    // パーティの強さに基づく推奨
    const avgPartyLevel = party.length > 0 ? 
      party.reduce((sum, p) => sum + (p.level || 5), 0) / party.length : 5
    
    if (avgPartyLevel >= 20) {
      if (strategy.id === 'aggressive') {
        score += 10
        reasons.push('強力なパーティ')
      }
    } else if (avgPartyLevel <= 10) {
      if (strategy.id === 'defensive') {
        score += 10
        reasons.push('パーティ強化が必要')
      }
    }

    // 特殊化に基づく推奨
    if (trainer.specialization.includes('explorer') && strategy.id === 'exploration') {
      score += 25
      reasons.push('探索専門家')
    }
    if (trainer.specialization.includes('battler') && strategy.id === 'aggressive') {
      score += 25
      reasons.push('戦闘専門家')
    }

    return { score, reasons }
  }

  const getRecommendationLevel = (score: number): 'high' | 'medium' | 'low' | 'avoid' => {
    if (score >= 30) return 'high'
    if (score >= 10) return 'medium'
    if (score >= -10) return 'low'
    return 'avoid'
  }

  const getRecommendationColor = (level: string) => {
    const colors = {
      high: 'text-green-600',
      medium: 'text-blue-600',
      low: 'text-gray-600',
      avoid: 'text-red-600'
    }
    return colors[level as keyof typeof colors] || 'text-gray-600'
  }

  const getRecommendationText = (level: string) => {
    const texts = {
      high: '強く推奨',
      medium: '推奨',
      low: '可能',
      avoid: '非推奨'
    }
    return texts[level as keyof typeof texts] || '不明'
  }

  const selectedStrategyData = STRATEGIES.find(s => s.id === selectedStrategy)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          派遣戦略選択
        </CardTitle>
        <div className="text-sm text-gray-600">
          状況に応じて最適な戦略を選択してください
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 戦略オプション */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STRATEGIES.map((strategy) => {
            const recommendation = getStrategyRecommendation(strategy)
            const recommendationLevel = getRecommendationLevel(recommendation.score)
            const isSelected = selectedStrategy === strategy.id
            const Icon = strategy.icon

            return (
              <Card 
                key={strategy.id} 
                className={`cursor-pointer transition-all ${
                  isSelected 
                    ? `border-${strategy.color}-500 bg-${strategy.color}-50` 
                    : 'hover:shadow-md'
                }`}
                onClick={() => onStrategyChange(strategy.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 text-${strategy.color}-600`} />
                      <span className="font-medium">{strategy.name}</span>
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-3">
                    {strategy.description}
                  </p>

                  {/* 効果インジケーター */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span>成功率</span>
                      <div className="flex items-center gap-1">
                        {strategy.characteristics.success_modifier > 0 ? (
                          <TrendingUp className="w-3 h-3 text-green-600" />
                        ) : strategy.characteristics.success_modifier < 0 ? (
                          <TrendingDown className="w-3 h-3 text-red-600" />
                        ) : (
                          <span className="w-3 h-3" />
                        )}
                        <span>{strategy.characteristics.success_modifier > 0 ? '+' : ''}{strategy.characteristics.success_modifier}%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span>安全性</span>
                      <div className="flex items-center gap-1">
                        {strategy.characteristics.safety_modifier > 0 ? (
                          <TrendingUp className="w-3 h-3 text-green-600" />
                        ) : strategy.characteristics.safety_modifier < 0 ? (
                          <TrendingDown className="w-3 h-3 text-red-600" />
                        ) : (
                          <span className="w-3 h-3" />
                        )}
                        <span>{strategy.characteristics.safety_modifier > 0 ? '+' : ''}{strategy.characteristics.safety_modifier}%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span>報酬</span>
                      <div className="flex items-center gap-1">
                        {strategy.characteristics.reward_modifier > 0 ? (
                          <TrendingUp className="w-3 h-3 text-green-600" />
                        ) : strategy.characteristics.reward_modifier < 0 ? (
                          <TrendingDown className="w-3 h-3 text-red-600" />
                        ) : (
                          <span className="w-3 h-3" />
                        )}
                        <span>{strategy.characteristics.reward_modifier > 0 ? '+' : ''}{strategy.characteristics.reward_modifier}%</span>
                      </div>
                    </div>
                  </div>

                  {/* 推奨レベル */}
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant={recommendationLevel === 'high' ? 'default' : 
                              recommendationLevel === 'medium' ? 'secondary' :
                              recommendationLevel === 'avoid' ? 'destructive' : 'outline'}
                    >
                      {getRecommendationText(recommendationLevel)}
                    </Badge>
                    
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs">{Math.max(0, recommendation.score)}pt</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* 選択された戦略の詳細 */}
        {selectedStrategyData && (
          <Card className="bg-gray-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <selectedStrategyData.icon className={`w-4 h-4 text-${selectedStrategyData.color}-600`} />
                {selectedStrategyData.name}戦略の詳細
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* 特殊効果 */}
              <div>
                <h4 className="text-sm font-medium mb-2">特殊効果</h4>
                <div className="space-y-1">
                  {selectedStrategyData.characteristics.special_effects.map((effect, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <span>{effect}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 推奨条件 */}
              {selectedStrategyData.best_for.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-green-700">適用推奨</h4>
                  <div className="space-y-1">
                    {selectedStrategyData.best_for.map((condition, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        <span>{condition}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 注意条件 */}
              {selectedStrategyData.avoid_when.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-red-700">注意が必要</h4>
                  <div className="space-y-1">
                    {selectedStrategyData.avoid_when.map((condition, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{condition}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI推奨理由 */}
              {(() => {
                const recommendation = getStrategyRecommendation(selectedStrategyData)
                return recommendation.reasons.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-blue-700">この戦略が選ばれた理由</h4>
                    <div className="space-y-1">
                      {recommendation.reasons.map((reason, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-blue-600">
                          <Info className="w-3 h-3" />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        )}

        {/* 状況分析 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="w-4 h-4" />
              現在の状況分析
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="font-medium text-gray-700">派遣先情報</div>
                <div className="space-y-1 text-gray-600">
                  <div>場所: {location.name}</div>
                  <div>危険度: {location.dangerLevel}/5</div>
                  <div>必要レベル: {location.requiredLevel}</div>
                  <div>出現タイプ: {location.encounterTypes.join(', ')}</div>
                </div>
              </div>
              
              <div>
                <div className="font-medium text-gray-700">戦力状況</div>
                <div className="space-y-1 text-gray-600">
                  <div>トレーナー: {trainer.name} (Lv.{trainer.level})</div>
                  <div>パーティ: {party.length}/6体</div>
                  <div>平均レベル: {
                    party.length > 0 ? 
                    Math.round(party.reduce((sum, p) => sum + (p.level || 5), 0) / party.length) : 0
                  }</div>
                  <div>特殊化: {trainer.specialization.join(', ') || 'なし'}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}