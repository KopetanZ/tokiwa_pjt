'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Star, 
  Coins, 
  Heart, 
  Zap,
  MapPin,
  Clock,
  User,
  Trophy,
  Target
} from "lucide-react"
import { ExpeditionResult, ExpeditionEvent } from "@/lib/game-logic/expedition-system"

interface ExpeditionResultModalProps {
  result: ExpeditionResult | null
  expedition: {
    location: string
    trainerName: string
    strategy: string
    duration: number
    startTime: string
  } | null
  isOpen: boolean
  onClose: () => void
  onViewHistory?: () => void
}

export function ExpeditionResultModal({
  result,
  expedition,
  isOpen,
  onClose,
  onViewHistory
}: ExpeditionResultModalProps) {
  if (!result || !expedition) return null

  const getEventIcon = (type: ExpeditionEvent['type']) => {
    const iconMap = {
      pokemon_encounter: Star,
      battle: Target,
      discovery: MapPin,
      danger: AlertTriangle,
      rare_find: Trophy
    }
    return iconMap[type] || Star
  }

  const getEventColor = (outcome: ExpeditionEvent['outcome']) => {
    const colorMap = {
      success: 'text-green-600',
      failure: 'text-red-600',
      partial: 'text-yellow-600'
    }
    return colorMap[outcome] || 'text-gray-600'
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}時間${mins}分`
  }

  const successRateColor = result.successRate >= 70 ? 'text-green-600' : 
                          result.successRate >= 40 ? 'text-yellow-600' : 'text-red-600'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600" />
            )}
            派遣結果 - {expedition.location}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">概要</TabsTrigger>
            <TabsTrigger value="events">出来事</TabsTrigger>
            <TabsTrigger value="rewards">報酬</TabsTrigger>
            <TabsTrigger value="trainer">トレーナー</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* 基本情報 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    結果
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge 
                      variant={result.success ? "default" : "destructive"}
                      className="text-lg px-4 py-2"
                    >
                      {result.success ? "成功" : "失敗"}
                    </Badge>
                    <div className="text-sm text-gray-600">
                      成功率: <span className={successRateColor}>{result.successRate.toFixed(1)}%</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      最終スコア: {result.finalScore}点
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    時間
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-lg font-medium">
                      {formatDuration(result.duration)}
                    </div>
                    <div className="text-sm text-gray-600">
                      予定: {formatDuration(expedition.duration * 60)}
                    </div>
                    <div className="text-xs text-gray-500">
                      開始: {new Date(expedition.startTime).toLocaleString('ja-JP')}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="w-4 h-4" />
                    詳細
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    <div>担当: {expedition.trainerName}</div>
                    <div>戦略: {expedition.strategy}</div>
                    <div>場所: {expedition.location}</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 成功率の詳細 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">成功要因分析</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>基本成功率</span>
                      <span>65%</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>トレーナー補正</span>
                      <span>+8%</span>
                    </div>
                    <Progress value={73} className="h-2" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>パーティ戦力</span>
                      <span>+5%</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>戦略効果</span>
                      <span>-3%</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>最終成功率</span>
                      <span className={successRateColor}>{result.successRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={result.successRate} className="h-2 mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            {result.events.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-gray-500">
                    特別な出来事は発生しませんでした
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {result.events.map((event, index) => {
                  const Icon = getEventIcon(event.type)
                  const colorClass = getEventColor(event.outcome)
                  
                  return (
                    <Card key={event.id || index}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Icon className={`w-5 h-5 ${colorClass} flex-shrink-0 mt-1`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{event.title}</h4>
                              <Badge 
                                variant={event.outcome === 'success' ? 'default' : 
                                        event.outcome === 'failure' ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {event.outcome === 'success' ? '成功' :
                                 event.outcome === 'failure' ? '失敗' : '部分成功'}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3">
                              {event.description}
                            </p>
                            
                            {/* 効果の表示 */}
                            {Object.keys(event.effects).length > 0 && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                {event.effects.money && (
                                  <div className="flex items-center gap-1">
                                    <Coins className="w-3 h-3 text-yellow-600" />
                                    <span>¥{event.effects.money.toLocaleString()}</span>
                                  </div>
                                )}
                                
                                {event.effects.experience && (
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-blue-600" />
                                    <span>EXP {event.effects.experience}</span>
                                  </div>
                                )}
                                
                                {event.effects.health && (
                                  <div className="flex items-center gap-1">
                                    <Heart className={`w-3 h-3 ${event.effects.health > 0 ? 'text-green-600' : 'text-red-600'}`} />
                                    <span>HP {event.effects.health > 0 ? '+' : ''}{event.effects.health}</span>
                                  </div>
                                )}
                                
                                {event.effects.items && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-purple-600" />
                                    <span>{event.effects.items.length}個アイテム</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rewards" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 金銭報酬 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Coins className="w-4 h-4 text-yellow-600" />
                    金銭報酬
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600 mb-2">
                    ¥{result.rewards.money.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    基本報酬に成功率とボーナスを適用
                  </div>
                </CardContent>
              </Card>

              {/* 経験値報酬 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Star className="w-4 h-4 text-blue-600" />
                    経験値報酬
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {result.rewards.experience} EXP
                  </div>
                  <div className="text-sm text-gray-600">
                    トレーナーとポケモンが成長
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* アイテム */}
            {result.rewards.items.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-600" />
                    獲得アイテム
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {result.rewards.items.map((item, index) => (
                      <Badge key={index} variant="outline">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ポケモン捕獲 */}
            {result.rewards.pokemonCaught.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-green-600" />
                    捕獲したポケモン
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.rewards.pokemonCaught.map((pokemon, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">ポケモン #{pokemon.species_id}</div>
                          <div className="text-sm text-gray-600">
                            Lv.{pokemon.level} | {pokemon.location}で捕獲
                          </div>
                        </div>
                        <Badge variant="secondary">
                          新規捕獲
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="trainer" className="space-y-4">
            {/* トレーナー状態変化 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    体力変化
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-medium text-red-500">
                    -{result.trainerStatus.healthLoss}
                  </div>
                  <div className="text-sm text-gray-600">
                    派遣の疲労による消耗
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Star className="w-4 h-4 text-blue-600" />
                    経験値獲得
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-medium text-blue-600">
                    +{result.trainerStatus.experienceGained}
                  </div>
                  <div className="text-sm text-gray-600">
                    派遣で得た貴重な経験
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-600" />
                    レベル変化
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.trainerStatus.levelUp ? (
                    <>
                      <div className="text-xl font-medium text-yellow-600">
                        レベルアップ！
                      </div>
                      <div className="text-sm text-gray-600">
                        新しい能力を習得
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-xl font-medium text-gray-500">
                        変化なし
                      </div>
                      <div className="text-sm text-gray-600">
                        さらなる経験が必要
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* レベルアップ詳細 */}
            {result.trainerStatus.levelUp && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-600" />
                    レベルアップ詳細
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-green-600">
                      🎉 {expedition.trainerName} がレベルアップしました！
                    </div>
                    <div className="text-sm text-gray-600">
                      • 派遣成功率が向上します
                    </div>
                    <div className="text-sm text-gray-600">
                      • より高難易度の派遣先を選択できます
                    </div>
                    <div className="text-sm text-gray-600">
                      • 給与が上昇しました
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-4">
          {onViewHistory && (
            <Button variant="outline" onClick={onViewHistory}>
              派遣履歴を見る
            </Button>
          )}
          <Button onClick={onClose} className="flex-1">
            閉じる
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}