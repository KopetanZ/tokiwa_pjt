'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CheckCircle, 
  XCircle, 
  Calendar, 
  MapPin, 
  User, 
  Coins, 
  TrendingUp,
  Filter,
  Eye,
  BarChart3,
  Clock
} from "lucide-react"
import { ExpeditionResultModal } from "@/components/expeditions/ExpeditionResultModal"

interface ExpeditionHistoryItem {
  id: string
  date: string
  location: string
  trainerName: string
  strategy: string
  duration: number
  success: boolean
  successRate: number
  rewards: {
    money: number
    experience: number
    items: string[]
    pokemonCaught: any[]
  }
  result: any
}

export default function ExpeditionHistoryPage() {
  const [history, setHistory] = useState<ExpeditionHistoryItem[]>([])
  const [filteredHistory, setFilteredHistory] = useState<ExpeditionHistoryItem[]>([])
  const [selectedExpedition, setSelectedExpedition] = useState<ExpeditionHistoryItem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterTrainer, setFilterTrainer] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date')
  const [loading, setLoading] = useState(true)

  const loadHistory = useCallback(async () => {
    setLoading(true)
    try {
      // モックデータを生成
      const mockHistory = generateMockHistory()
      setHistory(mockHistory)
    } catch (error) {
      console.error('派遣履歴の読み込みに失敗:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const generateMockHistory = (): ExpeditionHistoryItem[] => {
    const locations = ['トキワの森', '22番道路', 'ニビジム', 'おつきみ山', 'ハナダの洞窟']
    const trainers = ['タケシ', 'カスミ', 'マチス', 'エリカ']
    const strategies = ['balanced', 'aggressive', 'defensive', 'exploration']
    
    return Array.from({ length: 50 }, (_, i) => {
      const success = Math.random() > 0.3
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      
      return {
        id: `exp_${i}`,
        date: date.toISOString(),
        location: locations[Math.floor(Math.random() * locations.length)],
        trainerName: trainers[Math.floor(Math.random() * trainers.length)],
        strategy: strategies[Math.floor(Math.random() * strategies.length)],
        duration: Math.floor(Math.random() * 480) + 120, // 2-10時間
        success,
        successRate: Math.random() * 100,
        rewards: {
          money: success ? Math.floor(Math.random() * 5000) + 1000 : Math.floor(Math.random() * 1000),
          experience: success ? Math.floor(Math.random() * 200) + 50 : Math.floor(Math.random() * 50),
          items: success ? ['モンスターボール', 'キズぐすり'].slice(0, Math.floor(Math.random() * 3)) : [],
          pokemonCaught: success && Math.random() > 0.7 ? [{ species_id: Math.floor(Math.random() * 151) + 1 }] : []
        },
        result: {
          success,
          successRate: Math.random() * 100,
          finalScore: Math.floor(Math.random() * 100),
          rewards: {
            money: success ? Math.floor(Math.random() * 5000) + 1000 : Math.floor(Math.random() * 1000),
            experience: success ? Math.floor(Math.random() * 200) + 50 : Math.floor(Math.random() * 50),
            items: success ? ['モンスターボール', 'キズぐすり'].slice(0, Math.floor(Math.random() * 3)) : [],
            pokemonCaught: success && Math.random() > 0.7 ? [{ species_id: Math.floor(Math.random() * 151) + 1 }] : []
          },
          events: [],
          trainerStatus: {
            healthLoss: Math.floor(Math.random() * 20) + 5,
            experienceGained: Math.floor(Math.random() * 100) + 20,
            levelUp: Math.random() > 0.9
          },
          duration: Math.floor(Math.random() * 480) + 120
        }
      }
    })
  }

  const applyFilters = useCallback(() => {
    let filtered = [...history]

    // 検索フィルター
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.trainerName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // ステータスフィルター
    if (filterStatus !== 'all') {
      filtered = filtered.filter(item =>
        filterStatus === 'success' ? item.success : !item.success
      )
    }

    // トレーナーフィルター
    if (filterTrainer !== 'all') {
      filtered = filtered.filter(item => item.trainerName === filterTrainer)
    }

    // ソート
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case 'success_rate':
          return b.successRate - a.successRate
        case 'money':
          return b.rewards.money - a.rewards.money
        case 'duration':
          return b.duration - a.duration
        default:
          return 0
      }
    })

    setFilteredHistory(filtered)
  }, [history, searchTerm, filterStatus, filterTrainer, sortBy])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const getUniqueTrainers = () => {
    return Array.from(new Set(history.map(item => item.trainerName)))
  }

  const calculateStats = () => {
    const total = history.length
    const successful = history.filter(item => item.success).length
    const totalMoney = history.reduce((sum, item) => sum + item.rewards.money, 0)
    const totalPokemon = history.reduce((sum, item) => sum + item.rewards.pokemonCaught.length, 0)
    
    return {
      total,
      successful,
      successRate: total > 0 ? (successful / total * 100).toFixed(1) : '0.0',
      totalMoney,
      totalPokemon,
      avgMoney: total > 0 ? Math.floor(totalMoney / total) : 0
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}時間${mins}分`
  }

  const formatStrategy = (strategy: string) => {
    const strategyMap: Record<string, string> = {
      balanced: 'バランス型',
      aggressive: '積極的',
      defensive: '防御的',
      exploration: '探索重視'
    }
    return strategyMap[strategy] || strategy
  }

  const stats = calculateStats()

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">派遣履歴</h1>
        <Button variant="outline" onClick={() => window.location.href = '/dashboard/expeditions'}>
          派遣画面に戻る
        </Button>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">履歴一覧</TabsTrigger>
          <TabsTrigger value="analytics">統計・分析</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          {/* 統計サマリー */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">総派遣回数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">成功率</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.successRate}%</div>
                <div className="text-sm text-gray-600">{stats.successful}/{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">総収益</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">¥{stats.totalMoney.toLocaleString()}</div>
                <div className="text-sm text-gray-600">平均 ¥{stats.avgMoney.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">捕獲総数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.totalPokemon}</div>
                <div className="text-sm text-gray-600">ポケモン</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">平均時間</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {formatDuration(Math.floor(history.reduce((sum, item) => sum + item.duration, 0) / Math.max(history.length, 1)))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* フィルター・検索 */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Input
                  placeholder="場所やトレーナー名で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="結果でフィルター" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="success">成功のみ</SelectItem>
                    <SelectItem value="failure">失敗のみ</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterTrainer} onValueChange={setFilterTrainer}>
                  <SelectTrigger>
                    <SelectValue placeholder="トレーナー" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全トレーナー</SelectItem>
                    {getUniqueTrainers().map(trainer => (
                      <SelectItem key={trainer} value={trainer}>{trainer}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="並び順" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">日付順</SelectItem>
                    <SelectItem value="success_rate">成功率順</SelectItem>
                    <SelectItem value="money">収益順</SelectItem>
                    <SelectItem value="duration">時間順</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center justify-center">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="ml-2 text-sm text-gray-600">
                    {filteredHistory.length}件表示
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 履歴リスト */}
          <div className="space-y-3">
            {filteredHistory.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4">
                      <div className="flex items-center gap-2">
                        {item.success ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <Badge variant={item.success ? "default" : "destructive"}>
                          {item.success ? "成功" : "失敗"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">
                          {new Date(item.date).toLocaleDateString('ja-JP')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{item.location}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{item.trainerName}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{formatDuration(item.duration)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium">
                          ¥{item.rewards.money.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedExpedition(item)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      詳細
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredHistory.length === 0 && (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-gray-500">
                  条件に一致する派遣履歴が見つかりません
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                派遣分析ダッシュボード
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* トレーナー別成績 */}
                <div>
                  <h3 className="font-medium mb-3">トレーナー別成績</h3>
                  <div className="space-y-2">
                    {getUniqueTrainers().map(trainer => {
                      const trainerHistory = history.filter(item => item.trainerName === trainer)
                      const successRate = trainerHistory.length > 0 ? 
                        (trainerHistory.filter(item => item.success).length / trainerHistory.length * 100).toFixed(1) : '0.0'
                      const totalMoney = trainerHistory.reduce((sum, item) => sum + item.rewards.money, 0)
                      
                      return (
                        <div key={trainer} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">{trainer}</span>
                          <div className="text-right text-sm">
                            <div>成功率: {successRate}%</div>
                            <div className="text-gray-600">¥{totalMoney.toLocaleString()}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 場所別成績 */}
                <div>
                  <h3 className="font-medium mb-3">派遣先別成績</h3>
                  <div className="space-y-2">
                    {Array.from(new Set(history.map(item => item.location))).map(location => {
                      const locationHistory = history.filter(item => item.location === location)
                      const successRate = locationHistory.length > 0 ? 
                        (locationHistory.filter(item => item.success).length / locationHistory.length * 100).toFixed(1) : '0.0'
                      const avgMoney = locationHistory.length > 0 ?
                        Math.floor(locationHistory.reduce((sum, item) => sum + item.rewards.money, 0) / locationHistory.length) : 0
                      
                      return (
                        <div key={location} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">{location}</span>
                          <div className="text-right text-sm">
                            <div>成功率: {successRate}%</div>
                            <div className="text-gray-600">平均¥{avgMoney.toLocaleString()}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium mb-3">改善提案</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">🎯 成功率向上</h4>
                    <p className="text-sm text-blue-700">
                      低成功率の派遣先では防御的戦略を、高成功率の場所では積極的戦略を試してみましょう。
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">💰 収益最適化</h4>
                    <p className="text-sm text-green-700">
                      高収益の派遣先により多くのリソースを集中させることで、総収益を向上できます。
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 詳細モーダル */}
      {selectedExpedition && (
        <ExpeditionResultModal
          result={selectedExpedition.result}
          expedition={{
            location: selectedExpedition.location,
            trainerName: selectedExpedition.trainerName,
            strategy: formatStrategy(selectedExpedition.strategy),
            duration: selectedExpedition.duration / 60,
            startTime: selectedExpedition.date
          }}
          isOpen={!!selectedExpedition}
          onClose={() => setSelectedExpedition(null)}
        />
      )}
    </div>
  )
}