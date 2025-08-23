'use client'

import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { TutorialModal } from './TutorialModal'
import { tutorialSystem, TutorialStep } from '../../lib/tutorial/TutorialSystem'

export function TutorialFloatingButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(null)
  const [activeStepsCount, setActiveStepsCount] = useState(0)
  const [isNewUser, setIsNewUser] = useState(false)

  useEffect(() => {
    // 初期化とアクティブステップの確認
    const activeSteps = tutorialSystem.getActiveSteps()
    const completedSteps = tutorialSystem.getCompletedSteps()
    
    setActiveStepsCount(activeSteps.length)
    setCurrentStep(activeSteps[0] || null)
    
    // 新規ユーザーの判定（完了ステップが0かつアクティブステップが0）
    if (completedSteps.length === 0 && activeSteps.length === 0) {
      setIsNewUser(true)
      tutorialSystem.initializeForNewUser()
      const initialStep = tutorialSystem.getActiveSteps()[0]
      if (initialStep) {
        setCurrentStep(initialStep)
        setActiveStepsCount(1)
      }
    }
  }, [])

  const handleStepComplete = (stepId: string) => {
    const activeSteps = tutorialSystem.getActiveSteps()
    setActiveStepsCount(activeSteps.length)
    setCurrentStep(activeSteps[0] || null)
    
    if (activeSteps.length === 0) {
      setIsNewUser(false)
    }
  }

  const handleOpenTutorial = () => {
    setIsOpen(true)
    setIsNewUser(false) // 一度開いたら新規ユーザーフラグを解除
  }

  return (
    <>
      {/* Floating Tutorial Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={handleOpenTutorial}
          className={clsx(
            'relative flex items-center justify-center w-16 h-16 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all duration-300',
            isNewUser && 'animate-bounce',
            activeStepsCount > 0 && 'ring-4 ring-yellow-300 ring-opacity-75'
          )}
        >
          <span className="font-pixel text-xl">📚</span>
          
          {/* Active Steps Counter */}
          {activeStepsCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
              <span className="font-pixel text-xs">{activeStepsCount}</span>
            </div>
          )}
          
          {/* New User Indicator */}
          {isNewUser && (
            <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 rounded-full w-8 h-8 flex items-center justify-center">
              <span className="font-pixel text-xs">NEW</span>
            </div>
          )}
        </button>
        
        {/* Tutorial Tooltip */}
        {(isNewUser || activeStepsCount > 0) && (
          <div className="absolute bottom-20 right-0 bg-white border-2 border-retro-gb-dark p-3 max-w-xs shadow-lg">
            <div className="font-pixel text-sm text-retro-gb-dark">
              {isNewUser ? (
                <>
                  🎉 <strong>ようこそ！</strong><br />
                  チュートリアルでゲームの遊び方を学びましょう
                </>
              ) : (
                <>
                  📋 <strong>進行中のタスク: {activeStepsCount}件</strong><br />
                  {currentStep && `次: ${currentStep.title}`}
                </>
              )}
            </div>
            <div className="absolute bottom-0 right-4 transform translate-y-full">
              <div className="border-l-8 border-r-8 border-t-8 border-transparent border-t-retro-gb-dark"></div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions Panel (for active steps) */}
      {currentStep && !isOpen && (
        <div className="fixed bottom-28 right-6 z-30 bg-white border-2 border-retro-gb-dark p-3 max-w-sm shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-pixel text-sm text-retro-gb-dark mb-1">
                🎯 現在のタスク
              </h4>
              <p className="font-pixel text-xs text-retro-gb-mid mb-2">
                {currentStep.title}
              </p>
              <p className="font-pixel text-xs text-gray-600">
                {currentStep.objectives[0]}
              </p>
            </div>
            <button
              onClick={() => handleStepComplete(currentStep.id)}
              className="ml-2 px-2 py-1 bg-green-500 text-white font-pixel text-xs hover:bg-green-600"
            >
              完了
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-2">
            <div className="w-full bg-gray-200 h-2">
              <div 
                className="bg-blue-500 h-2 transition-all duration-300"
                style={{ 
                  width: `${(tutorialSystem.getProgressStats().completionPercentage)}%` 
                }}
              />
            </div>
            <div className="font-pixel text-xs text-gray-500 mt-1 text-right">
              {tutorialSystem.getProgressStats().completedSteps}/
              {tutorialSystem.getProgressStats().totalSteps} 完了
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Modal */}
      <TutorialModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onStepComplete={handleStepComplete}
        currentStep={currentStep || undefined}
      />
    </>
  )
}