/**
 * 派遣管理ダッシュボード（簡素化版）
 * 過剰実装を削除し、基本的な表示のみ提供
 */

'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Activity, 
  MapPin, 
  Clock, 
  CheckCircle,
  Users
} from 'lucide-react'
import { useGameCore } from '@/lib/hooks'

interface ExpeditionDashboardProps {
  className?: string
}

export function ExpeditionDashboard({ className }: ExpeditionDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const gameCore = useGameCore()
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* システム概要 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">アクティブ派遣</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">進行中の派遣</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">利用可能トレーナー</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gameCore.trainers.length}</div>
            <p className="text-xs text-muted-foreground">派遣可能</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">システム状態</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">正常</div>
            <p className="text-xs text-muted-foreground">すべてのシステムが動作中</p>
          </CardContent>
        </Card>
      </div>

      {/* 簡素化されたメッセージ */}
      <Alert>
        <Activity className="h-4 w-4" />
        <AlertDescription>
          派遣システムは簡素化されました。基本的な表示機能のみ利用可能です。
        </AlertDescription>
      </Alert>
      
      {/* 派遣開始ボタン（ダミー） */}
      <Card>
        <CardHeader>
          <CardTitle>新しい派遣を開始</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">派遣場所</label>
              <select className="w-full p-2 border rounded" disabled>
                <option>派遣場所を選択...</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">トレーナー</label>
              <select className="w-full p-2 border rounded" disabled>
                <option>トレーナーを選択...</option>
              </select>
            </div>
          </div>
          <Button disabled className="w-full">
            派遣開始（簡素化により無効）
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}