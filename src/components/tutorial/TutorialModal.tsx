'use client'

import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { tutorialSystem, TutorialStep, TutorialGuide } from '../../lib/tutorial/TutorialSystem'
import { useMusic } from '../providers/MusicProvider'

interface TutorialModalProps {
  isOpen: boolean
  onClose: () => void
  onStepComplete: (stepId: string) => void
  currentStep?: TutorialStep
}

export function TutorialModal({
  isOpen,
  onClose,
  onStepComplete,
  currentStep
}: TutorialModalProps) {
  const [selectedGuide, setSelectedGuide] = useState<TutorialGuide | null>(null)
  const [allGuides, setAllGuides] = useState<TutorialGuide[]>([])
  const [progressStats, setProgressStats] = useState({
    totalSteps: 0,
    completedSteps: 0,
    activeSteps: 0,
    completionPercentage: 0
  })

  const { updateGameContext, playGameEvent } = useMusic()

  useEffect(() => {
    if (isOpen) {
      setAllGuides(tutorialSystem.getAllGuides())
      setProgressStats(tutorialSystem.getProgressStats())
    }
  }, [isOpen])

  const handleStepComplete = (stepId: string) => {
    tutorialSystem.completeStep(stepId)
    onStepComplete(stepId)
    setProgressStats(tutorialSystem.getProgressStats())
    
    // チュートリアル完了時の音楽イベント
    playGameEvent('achievement')
    
    // チュートリアル完了による音楽コンテキストの更新
    const newStats = tutorialSystem.getProgressStats()
    if (newStats.completionPercentage === 100) {
      // 全チュートリアル完了
      updateGameContext({ mood: 'happy' })
    }
  }

  const formatContent = (content: string) => {
    // Markdownライクな書式を簡単なHTMLに変換
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/^(\d+)\. (.*$)/gim, '<li>$2</li>')
      .replace(/💡 \*\*ヒント：\*\* (.*$)/gim, '<div class="tutorial-hint">💡 <strong>ヒント:</strong> $1</div>')
      .replace(/⚠️ (.*$)/gim, '<div class="tutorial-warning">⚠️ $1</div>')
      .replace(/🚨 (.*$)/gim, '<div class="tutorial-danger">🚨 $1</div>')
      .replace(/💰 (.*$)/gim, '<div class="tutorial-money">💰 $1</div>')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border-4 border-retro-gb-dark max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-retro-gb-dark text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="font-pixel text-lg">📚 チュートリアル</h2>
            <div className="bg-white bg-opacity-20 px-3 py-1 rounded">
              <span className="font-pixel text-sm">
                進行度: {progressStats.completedSteps}/{progressStats.totalSteps} 
                ({progressStats.completionPercentage}%)
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="font-pixel text-lg hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* Current Active Step */}
          {currentStep && (
            <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-pixel text-lg text-blue-800">
                  🎯 現在のステップ: {currentStep.title}
                </h3>
                {!currentStep.isCompleted && (
                  <button
                    onClick={() => handleStepComplete(currentStep.id)}
                    className="px-4 py-2 bg-green-500 text-white font-pixel text-sm hover:bg-green-600"
                  >
                    完了にする
                  </button>
                )}
              </div>
              
              <div className="tutorial-content">
                <div
                  dangerouslySetInnerHTML={{ 
                    __html: formatContent(currentStep.content) 
                  }}
                />
              </div>

              <div className="mt-4">
                <h4 className="font-pixel text-sm text-blue-700 mb-2">達成目標:</h4>
                <ul className="space-y-1">
                  {currentStep.objectives.map((objective, index) => (
                    <li key={index} className="font-pixel text-sm text-blue-600 flex items-center">
                      <span className="mr-2">📋</span>
                      {objective}
                    </li>
                  ))}
                </ul>
              </div>

              {currentStep.rewards && (
                <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300">
                  <h5 className="font-pixel text-xs text-yellow-800 mb-1">完了報酬:</h5>
                  <div className="font-pixel text-xs text-yellow-700">
                    {currentStep.rewards.money && `💰 ${currentStep.rewards.money}円 `}
                    {currentStep.rewards.experience && `⭐ ${currentStep.rewards.experience}経験値`}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Guide Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {allGuides.map(guide => (
              <div
                key={guide.id}
                className={clsx(
                  'border-2 p-4 cursor-pointer transition-all',
                  selectedGuide?.id === guide.id 
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-retro-gb-mid hover:bg-retro-gb-light'
                )}
                onClick={() => setSelectedGuide(selectedGuide?.id === guide.id ? null : guide)}
              >
                <h3 className="font-pixel text-md text-retro-gb-dark mb-2">
                  {guide.title}
                </h3>
                <p className="font-pixel text-sm text-retro-gb-mid mb-3">
                  {guide.description}
                </p>
                
                <div className="flex justify-between items-center">
                  <div className="font-pixel text-xs text-retro-gb-mid">
                    🕐 約{guide.estimatedTime}分
                  </div>
                  <div className={clsx(
                    'font-pixel text-xs px-2 py-1',
                    guide.difficulty === 'beginner' && 'bg-green-100 text-green-800',
                    guide.difficulty === 'intermediate' && 'bg-yellow-100 text-yellow-800',
                    guide.difficulty === 'advanced' && 'bg-red-100 text-red-800'
                  )}>
                    {guide.difficulty === 'beginner' && '初心者'}
                    {guide.difficulty === 'intermediate' && '中級者'}
                    {guide.difficulty === 'advanced' && '上級者'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Guide Details */}
          {selectedGuide && (
            <div className="border-2 border-retro-gb-dark p-4">
              <h3 className="font-pixel text-lg text-retro-gb-dark mb-4">
                📖 {selectedGuide.title} の詳細
              </h3>
              
              <div className="space-y-3">
                {selectedGuide.steps.map((stepId, index) => {
                  const step = tutorialSystem.getStep(stepId)
                  if (!step) return null

                  return (
                    <div
                      key={stepId}
                      className={clsx(
                        'flex items-center p-3 border',
                        step.isCompleted && 'bg-green-50 border-green-300',
                        step.isActive && !step.isCompleted && 'bg-blue-50 border-blue-300',
                        !step.isActive && !step.isCompleted && 'bg-gray-50 border-gray-300'
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-3">
                          <span className="font-pixel text-sm text-gray-500">
                            {index + 1}.
                          </span>
                          <div>
                            <h4 className="font-pixel text-sm text-retro-gb-dark">
                              {step.title}
                            </h4>
                            <p className="font-pixel text-xs text-retro-gb-mid">
                              {step.objectives[0]}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {step.isCompleted && (
                            <span className="text-green-500">✅</span>
                          )}
                          {step.isActive && !step.isCompleted && (
                            <span className="text-blue-500">🔄</span>
                          )}
                          {!step.isActive && !step.isCompleted && (
                            <span className="text-gray-400">⏸️</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={() => {
                tutorialSystem.initializeForNewUser()
                setProgressStats(tutorialSystem.getProgressStats())
              }}
              className="px-4 py-2 bg-yellow-500 text-white font-pixel text-sm hover:bg-yellow-600"
            >
              🔄 チュートリアルをリセット
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white font-pixel text-sm hover:bg-gray-600"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>

      {/* Tutorial Styles */}
      <style jsx>{`
        .tutorial-content {
          line-height: 1.8;
        }
        .tutorial-content strong {
          font-weight: bold;
          color: #1f2937;
        }
        .tutorial-content em {
          font-style: italic;
          color: #374151;
        }
        .tutorial-content li {
          margin: 0.5rem 0;
          padding-left: 1rem;
          list-style: none;
          position: relative;
        }
        .tutorial-content li:before {
          content: "•";
          position: absolute;
          left: 0;
          color: #6b7280;
        }
        .tutorial-hint {
          margin: 1rem 0;
          padding: 0.75rem;
          background-color: #dbeafe;
          border-left: 4px solid #3b82f6;
          font-size: 0.875rem;
        }
        .tutorial-warning {
          margin: 1rem 0;
          padding: 0.75rem;
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          font-size: 0.875rem;
        }
        .tutorial-danger {
          margin: 1rem 0;
          padding: 0.75rem;
          background-color: #fee2e2;
          border-left: 4px solid #ef4444;
          font-size: 0.875rem;
        }
        .tutorial-money {
          margin: 1rem 0;
          padding: 0.75rem;
          background-color: #ecfdf5;
          border-left: 4px solid #10b981;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  )
}