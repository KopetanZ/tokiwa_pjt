/**
 * 派遣進行状況ビュー（簡素化版）
 * 基本的な進行状況表示のみ提供
 */

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin, Users } from 'lucide-react'

interface ExpeditionProgressViewProps {
  expeditionId: string
  className?: string
}

export function ExpeditionProgressView({ 
  expeditionId, 
  className 
}: ExpeditionProgressViewProps) {
  
  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            派遣進行状況
            <Badge variant="outline">簡素化版</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>全体進行度</span>
              <span>0%</span>
            </div>
            <Progress value={0} className="h-2" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                経過時間: 0分
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                参加トレーナー: 0人
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">現在のステージ: </span>
                <span>準備中</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">リスクレベル: </span>
                <Badge variant="secondary">低</Badge>
              </div>
            </div>
          </div>
          
          <div className="text-center text-sm text-muted-foreground py-4">
            派遣システムは簡素化されており、実際の進行データは表示されません
          </div>
        </CardContent>
      </Card>
    </div>
  )
}