/**
 * 派遣システム統合テストコンポーネント
 * 派遣システム全体の動作確認とデバッグ用
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Play,
  TestTube,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  Database,
  Settings,
  BarChart3,
  RefreshCw,
  Bug,
  Zap
} from 'lucide-react'
import {
  useExpeditionSystem,
  useExpeditionProgress,
  useExpeditionEvents,
  useExpeditionIntervention,
  useGameCore,
  useErrorHandling
} from '@/lib/hooks'
import { expeditionSystemManager } from '@/lib/expedition'
import type { Expedition, Trainer } from '@/lib/game-state/types'

interface TestResult {
  name: string
  status: 'pending' | 'running' | 'passed' | 'failed'
  message: string
  duration?: number
  error?: any
}

interface ExpeditionSystemTestProps {
  className?: string
}

export function ExpeditionSystemTest({ className }: ExpeditionSystemTestProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [mockExpeditionId, setMockExpeditionId] = useState<string | null>(null)

  const { systemState, isHealthy, performHealthCheck } = useExpeditionSystem()
  const gameCore = useGameCore()
  const { handleError } = useErrorHandling()

  // 基本的なテストスイート
  const testSuite = [
    {
      name: 'システム初期化テスト',
      test: async () => {
        expeditionSystemManager.initialize()
        const health = performHealthCheck()
        if (health.status === 'healthy') {
          return { success: true, message: 'システムが正常に初期化されました' }
        }
        throw new Error(`システム異常: ${health.status}`)
      }
    },
    {
      name: 'データアクセステスト',
      test: async () => {
        const trainers = gameCore.trainers
        const pokemon = gameCore.pokemon
        const expeditions = gameCore.expeditions
        
        if (trainers.length === 0) throw new Error('トレーナーデータがありません')
        if (pokemon.length === 0) throw new Error('ポケモンデータがありません')
        
        return { 
          success: true, 
          message: `データ確認完了: トレーナー${trainers.length}名, ポケモン${pokemon.length}匹, 派遣${expeditions.length}件` 
        }
      }
    },
    {
      name: 'モック派遣作成テスト',
      test: async () => {
        const availableTrainer = gameCore.trainers.find(t => t.status === 'available')
        if (!availableTrainer) throw new Error('利用可能なトレーナーがいません')

        const mockExpedition: Expedition = {
          id: `test_expedition_${Date.now()}`,
          trainerId: availableTrainer.id,
          locationId: 1,
          mode: 'balanced',
          targetDuration: 2, // 2時間
          strategy: ['cautious'],
          status: 'preparing',
          startTime: new Date().toISOString(),
          estimatedEndTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          currentProgress: 0,
          events: [],
          interventions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        setMockExpeditionId(mockExpedition.id)
        
        return { 
          success: true, 
          message: `モック派遣作成完了: ${mockExpedition.id}` 
        }
      }
    },
    {
      name: 'システム統計テスト',
      test: async () => {
        const stats = expeditionSystemManager.getSystemStatistics()
        
        if (typeof stats.activeExpeditions !== 'number') {
          throw new Error('統計データが不正です')
        }
        
        return { 
          success: true, 
          message: `統計取得完了: アクティブ派遣${stats.activeExpeditions}件` 
        }
      }
    },
    {
      name: 'エラーハンドリングテスト',
      test: async () => {
        try {
          // 意図的にエラーを発生させる
          throw new Error('テスト用エラー')
        } catch (error) {
          await handleError(error as Error, { context: 'test_error_handling' })
          return { 
            success: true, 
            message: 'エラーハンドリングが正常に動作しました' 
          }
        }
      }
    }
  ]

  const runTests = async () => {
    setIsRunningTests(true)
    setTestResults([])
    
    for (const testCase of testSuite) {
      const startTime = Date.now()
      
      // テスト実行中状態に設定
      setTestResults(prev => [...prev, {
        name: testCase.name,
        status: 'running',
        message: '実行中...'
      }])
      
      try {
        const result = await testCase.test()
        const duration = Date.now() - startTime
        
        // 成功状態に更新
        setTestResults(prev => prev.map(test => 
          test.name === testCase.name 
            ? { 
                ...test, 
                status: 'passed', 
                message: result.message,
                duration 
              }
            : test
        ))
      } catch (error) {
        const duration = Date.now() - startTime
        
        // 失敗状態に更新
        setTestResults(prev => prev.map(test => 
          test.name === testCase.name 
            ? { 
                ...test, 
                status: 'failed', 
                message: error instanceof Error ? error.message : 'Unknown error',
                duration,
                error 
              }
            : test
        ))
      }
      
      // テスト間の間隔
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setIsRunningTests(false)
  }

  const getTestSummary = () => {
    const total = testResults.length
    const passed = testResults.filter(t => t.status === 'passed').length
    const failed = testResults.filter(t => t.status === 'failed').length
    const running = testResults.filter(t => t.status === 'running').length
    
    return { total, passed, failed, running }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダー */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              派遣システム統合テスト
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={isHealthy ? 'default' : 'destructive'}>
                {isHealthy ? 'システム正常' : 'システム異常'}
              </Badge>
              <Button 
                onClick={runTests} 
                disabled={isRunningTests}
                className="flex items-center gap-2"
              >
                {isRunningTests ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    テスト実行中
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    テスト実行
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {!isHealthy && (
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                システムに問題があります。テスト実行前にシステムの状態を確認してください。
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* メインコンテンツ */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="tests">テスト結果</TabsTrigger>
          <TabsTrigger value="system">システム状態</TabsTrigger>
          <TabsTrigger value="debug">デバッグ情報</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <TestOverview 
            systemState={systemState} 
            gameCore={gameCore}
            testSummary={getTestSummary()}
          />
        </TabsContent>

        <TabsContent value="tests" className="space-y-6">
          <TestResultsPanel testResults={testResults} />
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <SystemStatePanel systemState={systemState} gameCore={gameCore} />
        </TabsContent>

        <TabsContent value="debug" className="space-y-6">
          <DebugPanel 
            mockExpeditionId={mockExpeditionId}
            systemState={systemState}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * テスト概要パネル
 */
function TestOverview({ 
  systemState, 
  gameCore, 
  testSummary 
}: { 
  systemState: any
  gameCore: any
  testSummary: { total: number; passed: number; failed: number; running: number }
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* テスト概要 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            テスト概要
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{testSummary.total}</p>
              <p className="text-sm text-blue-600">総テスト数</p>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{testSummary.passed}</p>
              <p className="text-sm text-green-600">成功</p>
            </div>
            
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{testSummary.failed}</p>
              <p className="text-sm text-red-600">失敗</p>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{testSummary.running}</p>
              <p className="text-sm text-orange-600">実行中</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* システム状態概要 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            システム状態
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>システムヘルス</span>
            <Badge variant={systemState.systemHealth === 'healthy' ? 'default' : 'destructive'}>
              {systemState.systemHealth}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span>アクティブ派遣</span>
            <span className="font-medium">{systemState.activeExpeditions.length}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>利用可能トレーナー</span>
            <span className="font-medium">
              {gameCore.trainers?.filter((t: Trainer) => t.status === 'available').length || 0}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>総ポケモン数</span>
            <span className="font-medium">{gameCore.pokemon?.length || 0}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * テスト結果パネル
 */
function TestResultsPanel({ testResults }: { testResults: TestResult[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>テスト結果詳細</CardTitle>
      </CardHeader>
      <CardContent>
        {testResults.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <TestTube className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>テストを実行してください</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <TestResultItem key={index} result={result} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * テスト結果アイテム
 */
function TestResultItem({ result }: { result: TestResult }) {
  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return 'border-green-200 bg-green-50'
      case 'failed': return 'border-red-200 bg-red-50'
      case 'running': return 'border-blue-200 bg-blue-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}>
      <div className="flex items-center gap-2 mb-2">
        {getStatusIcon(result.status)}
        <h4 className="font-medium">{result.name}</h4>
        {result.duration && (
          <Badge variant="outline" className="text-xs">
            {result.duration}ms
          </Badge>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground">{result.message}</p>
      
      {result.error && (
        <details className="mt-2">
          <summary className="text-xs text-red-600 cursor-pointer">エラー詳細</summary>
          <pre className="text-xs text-red-500 mt-1 p-2 bg-red-100 rounded overflow-auto">
            {JSON.stringify(result.error, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}

/**
 * システム状態パネル
 */
function SystemStatePanel({ systemState, gameCore }: { systemState: any; gameCore: any }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            データ状態
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm">
            <div className="flex justify-between">
              <span>トレーナー:</span>
              <span>{gameCore.trainers?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>ポケモン:</span>
              <span>{gameCore.pokemon?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>派遣:</span>
              <span>{gameCore.expeditions?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>プレイヤー資金:</span>
              <span>{gameCore.player?.money?.toLocaleString() || 0}円</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            システム設定
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm">
            <div className="flex justify-between">
              <span>システムヘルス:</span>
              <Badge variant={systemState.systemHealth === 'healthy' ? 'default' : 'destructive'}>
                {systemState.systemHealth}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>アクティブ派遣:</span>
              <span>{systemState.activeExpeditions.length}</span>
            </div>
            <div className="flex justify-between">
              <span>エラーレート:</span>
              <span>0%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * デバッグパネル
 */
function DebugPanel({ 
  mockExpeditionId, 
  systemState 
}: { 
  mockExpeditionId: string | null
  systemState: any 
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          デバッグ情報
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">モック派遣ID</h4>
            <code className="text-sm bg-muted p-2 rounded block">
              {mockExpeditionId || 'なし'}
            </code>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">システム状態</h4>
            <ScrollArea className="h-32">
              <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                {JSON.stringify(systemState, null, 2)}
              </pre>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ExpeditionSystemTest