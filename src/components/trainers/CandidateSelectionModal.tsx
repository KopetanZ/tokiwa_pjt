'use client'

import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { useState } from 'react'

interface TrainerCandidate {
  name: string
  job: string
  jobNameJa: string
  specialty: string
  level: number
  hireCost: number
  preview: {
    personality: string
    expectedSalary: number
    specialAbilities: string[]
  }
}

interface CandidateSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onHire: (candidate: TrainerCandidate) => void
  candidates: TrainerCandidate[]
  disabled?: boolean
}

export function CandidateSelectionModal({
  isOpen,
  onClose,
  onHire,
  candidates,
  disabled = false
}: CandidateSelectionModalProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<TrainerCandidate | null>(null)

  if (!isOpen) return null

  const handleHire = () => {
    if (selectedCandidate) {
      onHire(selectedCandidate)
      setSelectedCandidate(null)
      onClose()
    }
  }

  const handleClose = () => {
    setSelectedCandidate(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <PixelCard title="雇用可能なトレーナー">
          <div className="space-y-4">
            <div className="font-pixel text-sm text-retro-gb-dark">
              雇用するトレーナーを選択してください
            </div>

            {candidates.length === 0 ? (
              <div className="text-center py-4">
                <div className="font-pixel text-sm text-retro-gb-mid mb-4">
                  現在雇用可能なトレーナーがいません
                </div>
                <div className="font-pixel text-xs text-retro-gb-mid">
                  時間を置いて再度確認してください
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {candidates.map((candidate, index) => (
                  <div
                    key={index}
                    className={`border-2 p-4 cursor-pointer transition-colors ${
                      selectedCandidate === candidate
                        ? 'border-retro-gb-dark bg-retro-gb-light'
                        : 'border-retro-gb-mid bg-retro-gb-lightest hover:border-retro-gb-dark'
                    }`}
                    onClick={() => setSelectedCandidate(candidate)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-pixel text-sm text-retro-gb-dark">
                            {candidate.name}
                          </div>
                          <div className="font-pixel text-xs text-retro-gb-mid">
                            {candidate.jobNameJa} | Lv.{candidate.level}
                          </div>
                        </div>
                        <div className="w-4 h-4 border border-retro-gb-dark flex items-center justify-center">
                          {selectedCandidate === candidate && (
                            <div className="w-2 h-2 bg-retro-gb-dark"></div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <div className="font-pixel text-xs text-retro-gb-mid">専門分野</div>
                          <div className="font-pixel text-xs text-retro-gb-dark">
                            {candidate.specialty}
                          </div>
                        </div>
                        
                        <div>
                          <div className="font-pixel text-xs text-retro-gb-mid">性格</div>
                          <div className="font-pixel text-xs text-retro-gb-dark">
                            {candidate.preview.personality}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="font-pixel text-xs text-retro-gb-mid">雇用費</div>
                            <div className="font-pixel text-sm text-retro-gb-dark">
                              ₽{candidate.hireCost.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="font-pixel text-xs text-retro-gb-mid">月給</div>
                            <div className="font-pixel text-sm text-retro-gb-dark">
                              ₽{candidate.preview.expectedSalary.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {candidate.preview.specialAbilities && candidate.preview.specialAbilities.length > 0 && (
                          <div>
                            <div className="font-pixel text-xs text-retro-gb-mid">特殊能力</div>
                            <div className="flex flex-wrap gap-1">
                              {candidate.preview.specialAbilities.map((ability, i) => (
                                <span key={i} className="bg-retro-gb-mid text-retro-gb-lightest px-2 py-1 font-pixel text-xs">
                                  {ability}
                                </span>
                              ))}
                            </div>
                          </div>
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
                onClick={handleHire}
                disabled={disabled || !selectedCandidate || candidates.length === 0}
              >
                {disabled ? '処理中...' : '雇用する'}
              </PixelButton>
            </div>

            {selectedCandidate && (
              <div className="bg-retro-gb-light p-3 border border-retro-gb-mid">
                <div className="font-pixel text-xs text-retro-gb-dark">
                  選択中: {selectedCandidate.name} ({selectedCandidate.jobNameJa})
                </div>
                <div className="font-pixel text-xs text-retro-gb-mid">
                  雇用費: ₽{selectedCandidate.hireCost.toLocaleString()} | 
                  月給: ₽{selectedCandidate.preview.expectedSalary.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </PixelCard>
      </div>
    </div>
  )
}