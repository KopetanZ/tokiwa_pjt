/**
 * 派遣システムテスト（簡素化版）
 * 基本的な表示のみ提供
 */

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Activity, Settings } from 'lucide-react'

interface ExpeditionSystemTestProps {
  className?: string
}

export function ExpeditionSystemTest({ className }: ExpeditionSystemTestProps) {
  
  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            派遣システムテスト
            <Badge variant="outline">簡素化版</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* システム状態 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">システム状態</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <Badge variant="secondary">正常</Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">アクティブ派遣数</span>
              <Badge variant="outline">0</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">システムヘルス</span>
              <Badge variant="secondary" className="text-green-600">
                健全
              </Badge>
            </div>
          </div>

          {/* 簡素化メッセージ */}
          <Alert>
            <Activity className="h-4 w-4" />
            <AlertDescription>
              派遣システムは簡素化されました。高度な機能は利用できません。
            </AlertDescription>
          </Alert>

          {/* テストボタン（無効化） */}
          <div className="space-y-2">
            <Button disabled className="w-full" variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              システムヘルスチェック（無効）
            </Button>
            
            <Button disabled className="w-full" variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              パフォーマンステスト（無効）
            </Button>
          </div>
          
          <div className="text-center text-xs text-muted-foreground">
            テスト機能は簡素化により無効化されています
          </div>
        </CardContent>
      </Card>
    </div>
  )
}