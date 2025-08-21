'use client'

import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { useState } from 'react'

interface Trainer {
  id: string
  name: string
  job: string
  level: number
  status: string
  avatar?: string
}

interface TrainerSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (trainerId: string) => void
  trainers: Trainer[]
  locationName: string
  disabled?: boolean
}

export function TrainerSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  trainers,
  locationName,
  disabled = false
}: TrainerSelectionModalProps) {
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>('')

  if (!isOpen) return null

  const handleConfirm = () => {
    if (selectedTrainerId) {
      onConfirm(selectedTrainerId)
      setSelectedTrainerId('')
    }
  }

  const handleClose = () => {
    setSelectedTrainerId('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="max-w-md w-full">
        <PixelCard title={`${locationName}への派遣`}>
          <div className="space-y-4">
            <div className="font-pixel text-sm text-retro-gb-dark">
              派遣するトレーナーを選択してください
            </div>

            {trainers.length === 0 ? (
              <div className="text-center py-4">
                <div className="font-pixel text-sm text-retro-gb-mid mb-4">
                  利用可能なトレーナーがいません
                </div>
                <div className="font-pixel text-xs text-retro-gb-mid">
                  トレーナーを雇用するか、派遣中のトレーナーの帰還をお待ちください
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {trainers.map((trainer) => (
                  <div
                    key={trainer.id}
                    className={`border-2 p-3 cursor-pointer transition-colors ${
                      selectedTrainerId === trainer.id
                        ? 'border-retro-gb-dark bg-retro-gb-light'
                        : 'border-retro-gb-mid bg-retro-gb-lightest hover:border-retro-gb-dark'
                    }`}
                    onClick={() => setSelectedTrainerId(trainer.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-pixel text-sm text-retro-gb-dark">
                          {trainer.name}
                        </div>
                        <div className="font-pixel text-xs text-retro-gb-mid">
                          {trainer.job} | Lv.{trainer.level}
                        </div>
                      </div>
                      <div className="w-4 h-4 border border-retro-gb-dark flex items-center justify-center">
                        {selectedTrainerId === trainer.id && (
                          <div className="w-2 h-2 bg-retro-gb-dark"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <PixelButton
                variant="secondary"
                className="flex-1"
                onClick={handleClose}
                disabled={disabled}
              >
                キャンセル
              </PixelButton>
              <PixelButton
                className="flex-1"
                onClick={handleConfirm}
                disabled={disabled || !selectedTrainerId || trainers.length === 0}
              >
                {disabled ? '処理中...' : '派遣開始'}
              </PixelButton>
            </div>
          </div>
        </PixelCard>
      </div>
    </div>
  )
}