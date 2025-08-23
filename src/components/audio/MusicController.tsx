'use client'

import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { useMusic } from '@/lib/hooks/useMusic'

interface MusicControllerProps {
  className?: string
  compact?: boolean
  showDetails?: boolean
}

export function MusicController({ className, compact = false, showDetails = false }: MusicControllerProps) {
  const {
    isInitialized,
    currentTrack,
    isEnabled,
    volume,
    applicableRules,
    setVolume,
    toggleMute,
    toggleBGM,
    toggleSFX,
    getMusicInfo,
    getMusicStatus
  } = useMusic()

  const [isExpanded, setIsExpanded] = useState(false)
  const [musicDetails, setMusicDetails] = useState<any>(null)

  // 音楽詳細の定期更新
  useEffect(() => {
    if (!showDetails && !isExpanded) return

    const updateDetails = () => {
      const info = getMusicInfo()
      const status = getMusicStatus()
      setMusicDetails({ ...info, ...status })
    }

    updateDetails()
    const interval = setInterval(updateDetails, 5000)

    return () => clearInterval(interval)
  }, [showDetails, isExpanded, getMusicInfo, getMusicStatus])

  if (!isInitialized) {
    return (
      <div className={clsx('flex items-center gap-2 p-2 opacity-50', className)}>
        <span className="font-pixel text-xs">音楽読み込み中...</span>
      </div>
    )
  }

  if (compact) {
    return (
      <div className={clsx('flex items-center gap-1', className)}>
        <button
          onClick={toggleMute}
          className={clsx(
            'w-8 h-8 flex items-center justify-center border-2 transition-colors',
            isEnabled 
              ? 'bg-blue-500 border-blue-600 text-white hover:bg-blue-600' 
              : 'bg-gray-300 border-gray-400 text-gray-600 hover:bg-gray-400'
          )}
          title={isEnabled ? '音楽オン' : '音楽オフ'}
        >
          <span className="font-pixel text-xs">
            {isEnabled ? '♪' : '🔇'}
          </span>
        </button>
        
        {isEnabled && (
          <input
            type="range"
            min="0"
            max="100"
            value={volume * 100}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            className="w-16 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            title={`音量: ${Math.round(volume * 100)}%`}
          />
        )}
      </div>
    )
  }

  return (
    <div className={clsx('bg-white border-2 border-retro-gb-dark p-3 space-y-3', className)}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h3 className="font-pixel text-sm text-retro-gb-dark">
          🎵 音楽制御
        </h3>
        {showDetails && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="font-pixel text-xs text-retro-gb-mid hover:text-retro-gb-dark"
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        )}
      </div>

      {/* 現在の再生状況 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-pixel text-xs text-retro-gb-mid">再生中:</span>
          <span className="font-pixel text-xs text-retro-gb-dark">
            {currentTrack ? getTrackDisplayName(currentTrack) : 'なし'}
          </span>
        </div>
        
        {applicableRules.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-pixel text-xs text-retro-gb-mid">適用中:</span>
            <span className="font-pixel text-xs text-retro-gb-dark">
              {applicableRules[0]}
            </span>
          </div>
        )}
      </div>

      {/* メイン制御 */}
      <div className="space-y-2">
        {/* 音量制御 */}
        <div className="flex items-center gap-2">
          <span className="font-pixel text-xs text-retro-gb-dark w-12">音量:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={volume * 100}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            disabled={!isEnabled}
          />
          <span className="font-pixel text-xs text-retro-gb-mid w-8">
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* オン/オフ制御 */}
        <div className="flex gap-2">
          <button
            onClick={toggleMute}
            className={clsx(
              'flex-1 px-3 py-2 border-2 font-pixel text-xs transition-colors',
              isEnabled
                ? 'bg-green-500 border-green-600 text-white hover:bg-green-600'
                : 'bg-red-500 border-red-600 text-white hover:bg-red-600'
            )}
          >
            {isEnabled ? '🔊 音楽オン' : '🔇 音楽オフ'}
          </button>
        </div>

        {/* 詳細制御 */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={toggleBGM}
            className="px-2 py-1 border-2 border-retro-gb-dark font-pixel text-xs hover:bg-retro-gb-light transition-colors"
            disabled={!isEnabled}
          >
            BGM切替
          </button>
          <button
            onClick={toggleSFX}
            className="px-2 py-1 border-2 border-retro-gb-dark font-pixel text-xs hover:bg-retro-gb-light transition-colors"
            disabled={!isEnabled}
          >
            効果音切替
          </button>
        </div>
      </div>

      {/* 詳細情報（展開時） */}
      {isExpanded && musicDetails && (
        <div className="border-t-2 border-gray-200 pt-3 space-y-2">
          <h4 className="font-pixel text-xs text-retro-gb-dark">📊 詳細情報</h4>
          
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="font-pixel text-retro-gb-mid">ルール数:</span>
              <span className="font-pixel text-retro-gb-dark">{musicDetails.rulesCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-pixel text-retro-gb-mid">プレイリスト:</span>
              <span className="font-pixel text-retro-gb-dark">{musicDetails.playlistsCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-pixel text-retro-gb-mid">最終更新:</span>
              <span className="font-pixel text-retro-gb-dark">{musicDetails.lastUpdate}</span>
            </div>
          </div>

          {applicableRules.length > 1 && (
            <div>
              <h5 className="font-pixel text-xs text-retro-gb-dark mb-1">適用可能ルール:</h5>
              <div className="space-y-1">
                {applicableRules.slice(0, 3).map((rule, index) => (
                  <div key={index} className="font-pixel text-xs text-retro-gb-mid">
                    • {rule}
                  </div>
                ))}
                {applicableRules.length > 3 && (
                  <div className="font-pixel text-xs text-retro-gb-mid">
                    ...他 {applicableRules.length - 3} 件
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// トラック表示名の取得
function getTrackDisplayName(trackId: string): string {
  const trackNames: Record<string, string> = {
    'bgm_main': 'メインテーマ',
    'bgm_dashboard': 'ダッシュボード',
    'bgm_pokemon_center': 'ポケモンセンター',
    'bgm_expedition': '派遣冒険',
    'bgm_training': 'トレーニング',
    'bgm_breeding': '育て屋',
    'bgm_research': '研究所',
    'bgm_morning': '朝のテーマ',
    'bgm_afternoon': '昼のテーマ',
    'bgm_evening': '夕方のテーマ',
    'bgm_night': '夜のテーマ',
    'bgm_achievement': 'アチーブメント',
    'bgm_seasonal_spring': '春のテーマ',
    'bgm_seasonal_summer': '夏のテーマ',
    'bgm_seasonal_autumn': '秋のテーマ',
    'bgm_seasonal_winter': '冬のテーマ'
  }

  return trackNames[trackId] || trackId
}

// フローティング音楽制御ボタン
export function FloatingMusicButton() {
  const { isEnabled, toggleMute } = useMusic()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 3秒後に表示
    const timer = setTimeout(() => setIsVisible(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <button
      onClick={toggleMute}
      className={clsx(
        'fixed top-4 right-4 z-50 w-12 h-12 rounded-full border-2 transition-all duration-300 shadow-lg',
        'flex items-center justify-center font-pixel text-lg',
        isEnabled
          ? 'bg-blue-500 border-blue-600 text-white hover:bg-blue-600 hover:scale-110'
          : 'bg-gray-400 border-gray-500 text-gray-200 hover:bg-gray-500 hover:scale-110'
      )}
      title={isEnabled ? '音楽をミュート' : '音楽をオン'}
    >
      {isEnabled ? '♪' : '🔇'}
    </button>
  )
}

// 設定画面用の詳細音楽制御
export function DetailedMusicController() {
  const music = useMusic()
  const [selectedTrack, setSelectedTrack] = useState('')

  const tracks = [
    { id: 'bgm_main', name: 'メインテーマ' },
    { id: 'bgm_dashboard', name: 'ダッシュボード' },
    { id: 'bgm_pokemon_center', name: 'ポケモンセンター' },
    { id: 'bgm_expedition', name: '派遣冒険' },
    { id: 'bgm_training', name: 'トレーニング' },
    { id: 'bgm_morning', name: '朝のテーマ' },
    { id: 'bgm_afternoon', name: '昼のテーマ' },
    { id: 'bgm_evening', name: '夕方のテーマ' },
    { id: 'bgm_night', name: '夜のテーマ' }
  ]

  return (
    <div className="space-y-4">
      <MusicController showDetails />
      
      <div className="bg-white border-2 border-retro-gb-dark p-3">
        <h3 className="font-pixel text-sm text-retro-gb-dark mb-3">🎵 手動再生</h3>
        
        <div className="space-y-2">
          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value)}
            className="w-full p-2 border-2 border-retro-gb-dark font-pixel text-xs"
          >
            <option value="">トラックを選択...</option>
            {tracks.map(track => (
              <option key={track.id} value={track.id}>
                {track.name}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => selectedTrack && music.playTrack(selectedTrack)}
            disabled={!selectedTrack || !music.isEnabled}
            className="w-full px-3 py-2 bg-blue-500 border-2 border-blue-600 text-white font-pixel text-xs hover:bg-blue-600 disabled:bg-gray-300 disabled:border-gray-400 disabled:text-gray-600"
          >
            選択した音楽を再生
          </button>
        </div>
      </div>
    </div>
  )
}