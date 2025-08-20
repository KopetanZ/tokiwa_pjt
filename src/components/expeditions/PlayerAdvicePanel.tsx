'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { 
  Lightbulb, 
  Target, 
  Shield, 
  Zap, 
  Heart,
  AlertTriangle,
  Info,
  TrendingUp,
  Users,
  Map
} from "lucide-react"
import { PlayerAdvice } from '@/lib/game-logic/expedition-system'

interface PlayerAdvicePanelProps {
  trainer: {
    name: string
    level: number
    trust_level: number
    compliance: number
    specialization: string[]
  }
  location: {
    name: string
    dangerLevel: number
    encounterTypes: string[]
    requiredLevel: number
  }
  party: any[]
  onAdviceChange: (advices: PlayerAdvice[]) => void
}

export function PlayerAdvicePanel({
  trainer,
  location,
  party,
  onAdviceChange
}: PlayerAdvicePanelProps) {
  const [advices, setAdvices] = useState<PlayerAdvice[]>([])
  const [activeTab, setActiveTab] = useState('pokemon')

  // アドバイス項目のテンプレート
  const adviceTemplates = {
    pokemon: [
      {
        type: 'pokemon_priority' as const,
        label: 'ポケモン優先タイプ',
        description: '特定タイプのポケモンを優先して探すよう指示',
        options: ['fire', 'water', 'grass', 'electric', 'psychic', 'fighting', 'rock', 'bug']
      }
    ],
    safety: [
      {
        type: 'safety_level' as const,
        label: '安全レベル',
        description: 'どの程度のリスクを取るか指示（1=超慎重、10=積極的）',
        range: [1, 10]
      }
    ],
    exploration: [
      {
        type: 'exploration_focus' as const,
        label: '探索重点',
        description: '何に重点を置いて探索するか',
        options: ['pokemon_catching', 'item_collection', 'experience_gain', 'money_earning', 'area_mapping']
      }
    ],
    battle: [
      {
        type: 'battle_strategy' as const,
        label: 'バトル戦略',
        description: '野生ポケモンとのバトル時の戦略',
        options: ['aggressive', 'defensive', 'capture_focus', 'quick_victory', 'exp_farming']
      }
    ]
  }

  const addAdvice = (type: PlayerAdvice['type'], value: string | number, description: string) => {
    const newAdvice: PlayerAdvice = {
      type,
      value,
      description
    }
    
    // 同じタイプのアドバイスがある場合は更新
    const updatedAdvices = advices.filter(advice => advice.type !== type)
    updatedAdvices.push(newAdvice)
    
    setAdvices(updatedAdvices)
    onAdviceChange(updatedAdvices)
  }

  const removeAdvice = (type: PlayerAdvice['type']) => {
    const updatedAdvices = advices.filter(advice => advice.type !== type)
    setAdvices(updatedAdvices)
    onAdviceChange(updatedAdvices)
  }

  const getAdviceValue = (type: PlayerAdvice['type']) => {
    const advice = advices.find(a => a.type === type)
    return advice?.value
  }

  const hasAdvice = (type: PlayerAdvice['type']) => {
    return advices.some(a => a.type === type)
  }

  const calculateComplianceRate = () => {
    const baseTrust = trainer.trust_level || 50
    const complianceBonus = trainer.compliance || 0
    const adviceCount = advices.length
    
    // アドバイス数が多いと遵守率が下がる
    const adviceCountPenalty = Math.max(0, adviceCount - 2) * 5
    
    return Math.min(95, Math.max(20, baseTrust + complianceBonus - adviceCountPenalty))
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      fire: 'bg-red-500',
      water: 'bg-blue-500',
      grass: 'bg-green-500',
      electric: 'bg-yellow-400',
      psychic: 'bg-pink-500',
      fighting: 'bg-red-700',
      rock: 'bg-yellow-800',
      bug: 'bg-green-400'
    }
    return colors[type] || 'bg-gray-400'
  }

  const formatOptionLabel = (option: string, category: string) => {
    const labels: Record<string, Record<string, string>> = {
      pokemon_priority: {
        fire: 'ほのお',
        water: 'みず', 
        grass: 'くさ',
        electric: 'でんき',
        psychic: 'エスパー',
        fighting: 'かくとう',
        rock: 'いわ',
        bug: 'むし'
      },
      exploration_focus: {
        pokemon_catching: 'ポケモン捕獲',
        item_collection: 'アイテム収集',
        experience_gain: '経験値重視',
        money_earning: '収益重視',
        area_mapping: 'エリア調査'
      },
      battle_strategy: {
        aggressive: '積極攻撃',
        defensive: '守備重視',
        capture_focus: '捕獲重視',
        quick_victory: '速攻',
        exp_farming: '経験値稼ぎ'
      }
    }
    
    return labels[category]?.[option] || option
  }

  const complianceRate = calculateComplianceRate()
  const effectivenessScore = advices.length > 0 ? Math.floor(complianceRate * advices.length / 10) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          プレイヤーアドバイス
        </CardTitle>
        <div className="text-sm text-gray-600">
          {trainer.name}に具体的な指示を出してより良い結果を目指しましょう
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* トレーナー信頼度表示 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-gray-600">信頼度</div>
            <div className="text-xl font-bold text-blue-600">{trainer.trust_level}/100</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">遵守率予想</div>
            <div className={`text-xl font-bold ${complianceRate >= 70 ? 'text-green-600' : complianceRate >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
              {complianceRate}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">効果予想</div>
            <div className="text-xl font-bold text-purple-600">{effectivenessScore}点</div>
          </div>
        </div>

        {/* アドバイスタブ */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pokemon" className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              ポケモン
            </TabsTrigger>
            <TabsTrigger value="safety" className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              安全性
            </TabsTrigger>
            <TabsTrigger value="exploration" className="flex items-center gap-1">
              <Map className="w-3 h-3" />
              探索
            </TabsTrigger>
            <TabsTrigger value="battle" className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              バトル
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pokemon" className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">優先ポケモンタイプ</label>
                {hasAdvice('pokemon_priority') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAdvice('pokemon_priority')}
                  >
                    削除
                  </Button>
                )}
              </div>
              <Select
                value={getAdviceValue('pokemon_priority') as string || ''}
                onValueChange={(value) => addAdvice('pokemon_priority', value, `${formatOptionLabel(value, 'pokemon_priority')}タイプを優先して探索`)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="優先するタイプを選択" />
                </SelectTrigger>
                <SelectContent>
                  {location.encounterTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${getTypeColor(type)}`}></div>
                        {formatOptionLabel(type, 'pokemon_priority')}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-gray-500 mt-1">
                この場所で出現する可能性があるタイプから選択
              </div>
            </div>
          </TabsContent>

          <TabsContent value="safety" className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">安全レベル設定</label>
                {hasAdvice('safety_level') && (
                  <Button
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeAdvice('safety_level')}
                  >
                    削除
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <Slider
                  value={[getAdviceValue('safety_level') as number || 5]}
                  onValueChange={(value) => 
                    addAdvice('safety_level', value[0], `安全レベル${value[0]}で行動（${value[0] <= 3 ? '超慎重' : value[0] <= 7 ? '標準' : '積極的'}）`)
                  }
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>超慎重</span>
                  <span>標準</span>
                  <span>積極的</span>
                </div>
              </div>
              {location.dangerLevel >= 4 && (
                <div className="flex items-center gap-2 p-2 bg-amber-50 rounded text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-700">
                    この場所は危険度が高いため、安全レベルを低めに設定することを推奨します
                  </span>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="exploration" className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">探索重点項目</label>
                {hasAdvice('exploration_focus') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAdvice('exploration_focus')}
                  >
                    削除
                  </Button>
                )}
              </div>
              <Select
                value={getAdviceValue('exploration_focus') as string || ''}
                onValueChange={(value) => 
                  addAdvice('exploration_focus', value, `${formatOptionLabel(value, 'exploration_focus')}を重点的に実行`)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="重点項目を選択" />
                </SelectTrigger>
                <SelectContent>
                  {adviceTemplates.exploration[0].options.map(option => (
                    <SelectItem key={option} value={option}>
                      {formatOptionLabel(option, 'exploration_focus')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="battle" className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">バトル戦略</label>
                {hasAdvice('battle_strategy') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAdvice('battle_strategy')}
                  >
                    削除
                  </Button>
                )}
              </div>
              <Select
                value={getAdviceValue('battle_strategy') as string || ''}
                onValueChange={(value) => 
                  addAdvice('battle_strategy', value, `${formatOptionLabel(value, 'battle_strategy')}でバトルを実行`)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="戦略を選択" />
                </SelectTrigger>
                <SelectContent>
                  {adviceTemplates.battle[0].options.map(option => (
                    <SelectItem key={option} value={option}>
                      {formatOptionLabel(option, 'battle_strategy')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>

        {/* 現在のアドバイス一覧 */}
        {advices.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              設定中のアドバイス ({advices.length}/4)
            </h4>
            <div className="space-y-2">
              {advices.map((advice, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{advice.description}</div>
                    <div className="text-xs text-gray-600">
                      {advice.type} = {advice.value}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAdvice(advice.type)}
                  >
                    削除
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 効果予測 */}
        {advices.length > 0 && (
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              効果予測
            </h4>
            <div className="space-y-1 text-sm text-green-700">
              <div>✓ アドバイス遵守率: {complianceRate}%</div>
              <div>✓ 成功率への影響: +{Math.floor(effectivenessScore / 2)}%</div>
              <div>✓ 特化効果: {advices.length}種類のボーナス</div>
            </div>
          </div>
        )}

        {/* 注意事項 */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>• アドバイスが多すぎると遵守率が下がります</div>
          <div>• トレーナーの信頼度が高いほど、アドバイスに従いやすくなります</div>
          <div>• 危険度の高い場所では安全重視のアドバイスが効果的です</div>
        </div>
      </CardContent>
    </Card>
  )
}