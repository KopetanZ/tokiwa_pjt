'use client'

import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { PixelProgressBar } from '../ui/PixelProgressBar'
import { PokemonInstance } from '../../lib/schemas/pokemon'
import { pokemonTrainingFacility, TrainingFacility, TrainingSlot } from '../../lib/pokemon/PokemonTrainingFacility'
import { pokemonGrowthSystem, TrainingSession } from '../../lib/pokemon/PokemonGrowthSystem'

interface PokemonTrainingInterfaceProps {
  pokemon: PokemonInstance[]
  onTrainingComplete?: (pokemon: PokemonInstance, results: any) => void
  gameContext: any
  className?: string
}

export function PokemonTrainingInterface({
  pokemon,
  onTrainingComplete,
  gameContext,
  className = ''
}: PokemonTrainingInterfaceProps) {
  const [selectedFacility, setSelectedFacility] = useState<TrainingFacility | null>(null)
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonInstance | null>(null)
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null)
  const [activeSessions, setActiveSessions] = useState<TrainingSlot[]>([])
  const [availableFacilities, setAvailableFacilities] = useState<TrainingFacility[]>([])
  const [trainingPrograms, setTrainingPrograms] = useState<TrainingSession[]>([])

  useEffect(() => {
    // Load available facilities and programs
    const facilities = pokemonTrainingFacility.getAvailableFacilities(gameContext)
    const programs = pokemonGrowthSystem.getTrainingPrograms()
    
    setAvailableFacilities(facilities)
    setTrainingPrograms(programs)
    
    // Update active sessions
    const sessions = pokemonTrainingFacility.getActiveSessions()
    setActiveSessions(sessions)
  }, [gameContext])

  useEffect(() => {
    // Update training sessions every second
    const interval = setInterval(() => {
      const completedSessions = pokemonTrainingFacility.updateTrainingSessions()
      
      if (completedSessions.length > 0) {
        // Handle completed training sessions
        completedSessions.forEach(session => {
          handleTrainingComplete(session)
        })
      }
      
      // Update active sessions
      const sessions = pokemonTrainingFacility.getActiveSessions()
      setActiveSessions(sessions)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleTrainingComplete = async (session: TrainingSlot) => {
    try {
      const result = pokemonTrainingFacility.completeTraining(session.id, gameContext)
      if (result.success && result.result) {
        onTrainingComplete?.(result.result.pokemon, result.result)
      }
    } catch (error) {
      console.error('Failed to complete training:', error)
    }
  }

  const startTraining = () => {
    if (!selectedPokemon || !selectedFacility || !selectedProgram) return

    const result = pokemonTrainingFacility.startTraining(
      selectedPokemon,
      selectedFacility.id,
      selectedProgram,
      gameContext
    )

    if (result.success) {
      setActiveSessions(prev => [...prev, result.trainingSlot!])
      setSelectedPokemon(null)
      setSelectedProgram(null)
    } else {
      alert(result.error)
    }
  }

  const cancelTraining = (sessionId: string) => {
    // TODO: Implement cancel training method
    setActiveSessions(prev => prev.filter(s => s.id !== sessionId))
  }

  const getFacilitySpecializationColor = (specialization: string): string => {
    const colors = {
      'strength': 'text-red-600',
      'endurance': 'text-green-600',
      'speed': 'text-blue-600',
      'technique': 'text-purple-600',
      'intelligence': 'text-yellow-600',
      'balanced': 'text-gray-600'
    }
    return colors[specialization as keyof typeof colors] || colors.balanced
  }

  const getPokemonForTraining = () => {
    return pokemon.filter(p => 
      !activeSessions.some(session => session.pokemonId === p.id && session.status === 'active')
    )
  }

  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  return (
    <div className={clsx('pokemon-training-interface', className)}>
      <div className="bg-retro-gb-light border border-retro-gb-dark p-4">
        <h2 className="font-pixel text-lg text-retro-gb-dark mb-4">ポケモン訓練施設</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Training Setup */}
          <div className="space-y-4">
            <h3 className="font-pixel text-md text-retro-gb-dark">訓練開始</h3>
            
            {/* Facility Selection */}
            <div>
              <label className="font-pixel text-sm text-retro-gb-mid block mb-2">
                訓練施設
              </label>
              <div className="space-y-2">
                {availableFacilities.map(facility => (
                  <div
                    key={facility.id}
                    className={clsx(
                      'border-2 p-3 cursor-pointer',
                      selectedFacility?.id === facility.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-retro-gb-mid hover:bg-retro-gb-light'
                    )}
                    onClick={() => setSelectedFacility(facility)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-pixel text-sm text-retro-gb-dark">
                          {facility.name}
                        </h4>
                        <p className="font-pixel text-xs text-retro-gb-mid">
                          {facility.description}
                        </p>
                        <div className="flex items-center mt-1 space-x-2">
                          <span className={clsx(
                            'font-pixel text-xs',
                            getFacilitySpecializationColor(facility.specialization)
                          )}>
                            {facility.specialization}
                          </span>
                          <span className="font-pixel text-xs text-retro-gb-mid">
                            Lv.{facility.level}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-pixel text-xs text-retro-gb-mid">
                          容量: {pokemonTrainingFacility.getActiveSessions(facility.id).length}/{facility.capacity}
                        </div>
                        <div className="font-pixel text-xs text-retro-gb-mid">
                          維持費: {facility.maintenanceCost}G
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pokemon Selection */}
            {selectedFacility && (
              <div>
                <label className="font-pixel text-sm text-retro-gb-mid block mb-2">
                  ポケモン選択
                </label>
                <select
                  value={selectedPokemon?.id || ''}
                  onChange={(e) => {
                    const pokemon = getPokemonForTraining().find(p => p.id === e.target.value)
                    setSelectedPokemon(pokemon || null)
                  }}
                  className="w-full p-2 border border-retro-gb-mid font-pixel text-sm"
                >
                  <option value="">選択してください</option>
                  {getPokemonForTraining().map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Lv.{p.level})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Program Selection */}
            {selectedPokemon && (
              <div>
                <label className="font-pixel text-sm text-retro-gb-mid block mb-2">
                  訓練プログラム
                </label>
                <div className="space-y-2">
                  {trainingPrograms
                    .filter(program => program.type === selectedFacility?.specialization || selectedFacility?.specialization === 'balanced')
                    .map(program => (
                    <div
                      key={`${program.type}_${program.intensity}`}
                      className={clsx(
                        'border-2 p-2 cursor-pointer',
                        selectedProgram === `${program.type}_${program.intensity}`
                          ? 'border-green-500 bg-green-50'
                          : 'border-retro-gb-mid hover:bg-retro-gb-light'
                      )}
                      onClick={() => setSelectedProgram(`${program.type}_${program.intensity}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-pixel text-sm text-retro-gb-dark capitalize">
                            {program.intensity} {program.type} Training
                          </h5>
                          <div className="font-pixel text-xs text-retro-gb-mid">
                            時間: {program.duration}分 | 費用: {program.cost}G
                          </div>
                          <div className="font-pixel text-xs text-green-600">
                            経験値倍率: x{program.expMultiplier}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Start Training Button */}
            <button
              onClick={startTraining}
              disabled={!selectedPokemon || !selectedFacility || !selectedProgram}
              className={clsx(
                'w-full py-3 font-pixel text-sm border-2',
                selectedPokemon && selectedFacility && selectedProgram
                  ? 'bg-green-500 text-white border-green-600 hover:bg-green-600'
                  : 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed'
              )}
            >
              訓練開始
            </button>
          </div>

          {/* Active Training Sessions */}
          <div className="space-y-4">
            <h3 className="font-pixel text-md text-retro-gb-dark">進行中の訓練</h3>
            
            {activeSessions.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 border border-gray-200">
                <div className="font-pixel text-sm text-retro-gb-mid">
                  現在進行中の訓練はありません
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSessions.map(session => {
                  const sessionPokemon = pokemon.find(p => p.id === session.pokemonId)
                  const facility = availableFacilities.find(f => f.id === session.facilityId)
                  const remainingTime = Math.max(0, session.endTime - Date.now())
                  
                  return (
                    <div key={session.id} className="border border-retro-gb-mid p-3 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-pixel text-sm text-retro-gb-dark">
                            {sessionPokemon?.name || 'Unknown'} (Lv.{sessionPokemon?.level})
                          </h4>
                          <p className="font-pixel text-xs text-retro-gb-mid">
                            {facility?.name} - {session.programId}
                          </p>
                        </div>
                        <button
                          onClick={() => cancelTraining(session.id)}
                          className="font-pixel text-xs text-red-600 hover:text-red-800"
                        >
                          中止
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        <PixelProgressBar
                          value={session.progress}
                          max={100}
                          color="progress"
                          showLabel={true}
                        />
                        
                        <div className="flex justify-between font-pixel text-xs text-retro-gb-mid">
                          <span>残り時間:</span>
                          <span>{formatTime(remainingTime)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}