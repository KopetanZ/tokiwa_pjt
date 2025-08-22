'use client'

import { useGameState } from '@/lib/game-state/hooks'
import { PixelCard } from '@/components/ui/PixelCard'

export default function EventsPage() {
  const { gameData } = useGameState()

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-pixel text-2xl text-retro-gb-dark mb-2">🎪 イベント</h1>
        <p className="font-pixel text-sm text-retro-gb-mid">
          トキワシティ訓練所の特別イベント
        </p>
      </div>

      <PixelCard>
        <div className="p-6">
          <h2 className="font-pixel text-lg text-retro-gb-dark mb-4">開催予定イベント</h2>
          
          <div className="space-y-4">
            <div className="border border-retro-gb-mid rounded p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-pixel text-retro-gb-dark">ポケモン捕獲大会</h3>
                  <p className="font-pixel text-sm text-retro-gb-mid">
                    期間: 2024年1月15日 - 1月20日
                  </p>
                </div>
                <span className="bg-retro-green text-white px-3 py-1 rounded font-pixel text-sm">
                  開催中
                </span>
              </div>
            </div>

            <div className="border border-retro-gb-mid rounded p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-pixel text-retro-gb-dark">トレーナー研修プログラム</h3>
                  <p className="font-pixel text-sm text-retro-gb-mid">
                    期間: 2024年2月1日 - 2月15日
                  </p>
                </div>
                <span className="bg-retro-gb-mid text-white px-3 py-1 rounded font-pixel text-sm">
                  準備中
                </span>
              </div>
            </div>

            <div className="border border-retro-gb-mid rounded p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-pixel text-retro-gb-dark">施設拡張セール</h3>
                  <p className="font-pixel text-sm text-retro-gb-mid">
                    期間: 2024年3月1日 - 3月31日
                  </p>
                </div>
                <span className="bg-retro-gb-mid text-white px-3 py-1 rounded font-pixel text-sm">
                  準備中
                </span>
              </div>
            </div>
          </div>
        </div>
      </PixelCard>

      <PixelCard>
        <div className="p-6">
          <h2 className="font-pixel text-lg text-retro-gb-dark mb-4">過去のイベント</h2>
          
          <div className="space-y-4">
            <div className="border border-retro-gb-mid rounded p-4 opacity-60">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-pixel text-retro-gb-dark">開所記念イベント</h3>
                  <p className="font-pixel text-sm text-retro-gb-mid">
                    期間: 2023年12月1日 - 12月31日
                  </p>
                </div>
                <span className="bg-retro-gb-dark text-white px-3 py-1 rounded font-pixel text-sm">
                  終了
                </span>
              </div>
            </div>
          </div>
        </div>
      </PixelCard>
    </div>
  )
}
