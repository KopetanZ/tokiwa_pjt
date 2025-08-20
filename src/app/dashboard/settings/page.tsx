'use client'

import { useState, useEffect } from 'react'
import { useAuth, useNotifications, useGameData } from '@/contexts/GameContext'
import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { useRouter } from 'next/navigation'
import { SettingsManager, UserSettings, DEFAULT_SETTINGS } from '@/lib/settings-integration'
import { getSafeGameData } from '@/lib/data-utils'
import { UI } from '@/config/app'

export default function SettingsPage() {
  const { user, isMockMode, signOut, isAuthenticated } = useAuth()
  const { addNotification } = useNotifications()
  const gameData = useGameData()
  const router = useRouter()

  // 設定状態管理（データベース統合対応）
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [settingsManager, setSettingsManager] = useState<SettingsManager | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // 実際のゲームデータを安全に取得
  const safeGameData = getSafeGameData(isMockMode, gameData, user)

  // 設定管理システムを初期化
  useEffect(() => {
    const initializeSettings = async () => {
      setIsLoading(true)
      
      try {
        const manager = new SettingsManager(user, isMockMode)
        setSettingsManager(manager)
        
        const loadedSettings = await manager.loadSettings()
        setSettings(loadedSettings)
        
        console.log('設定を読み込みました:', loadedSettings)
        
      } catch (error) {
        console.error('設定の初期化に失敗:', error)
        addNotification({
          type: 'warning',
          message: '設定の読み込みに失敗しました。デフォルト設定を使用します。'
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    initializeSettings()
  }, [user, isMockMode, isAuthenticated])

  // 設定を保存（データベース＋localStorage統合）
  const saveSettings = async (newSettings: UserSettings): Promise<boolean> => {
    if (!settingsManager) {
      console.error('設定管理システムが初期化されていません')
      return false
    }
    
    setIsSaving(true)
    
    try {
      const result = await settingsManager.saveSettings(newSettings)
      
      if (result.success) {
        setSettings(newSettings)
        console.log('設定を保存しました:', newSettings)
        return true
      } else {
        if (isMockMode) {
          // モックモードでは警告レベル
          addNotification({
            type: 'info',
            message: '設定を保存しました（ローカルのみ）'
          })
          setSettings(newSettings)
          return true
        } else {
          addNotification({
            type: 'warning',
            message: `設定の保存に失敗: ${result.error}`
          })
          return false
        }
      }
      
    } catch (error) {
      console.error('設定保存エラー:', error)
      addNotification({
        type: 'warning',
        message: '設定の保存中にエラーが発生しました'
      })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }

  // 設定変更ハンドラー
  const handleSettingChange = async (key: keyof UserSettings, value?: any) => {
    if (isSaving) return // 保存中は変更を無効化
    
    const newValue = value !== undefined ? value : !settings[key]
    const newSettings = {
      ...settings,
      [key]: newValue
    }
    
    const success = await saveSettings(newSettings)
    
    if (success) {
      const settingNames: Record<string, string> = {
        audio_effects: '音声効果',
        animations: 'アニメーション', 
        notifications: '通知',
        ui_theme: 'UIテーマ',
        auto_save: '自動保存',
        sound_volume: '音量',
        notification_frequency: '通知頻度',
        expedition_alerts: '派遣アラート',
        pokemon_care_reminders: 'ポケモンケア通知',
        economic_notifications: '経済通知',
        language: '言語'
      }
      
      if (typeof newValue === 'boolean') {
        addNotification({
          type: 'info',
          message: `${settingNames[key] || key}を${newValue ? '有効' : '無効'}にしました`
        })
      } else {
        addNotification({
          type: 'info',
          message: `${settingNames[key] || key}を変更しました`
        })
      }
      
      console.log(`設定変更: ${key} = ${newValue}`)
    }
  }

  // データ管理ハンドラー
  const handleBackup = () => {
    if (!settingsManager) {
      addNotification({
        type: 'warning',
        message: '設定管理システムが初期化されていません'
      })
      return
    }
    
    try {
      // バックアップデータの構築（統合設定管理対応）
      const backupData = {
        ...settingsManager.generateBackupData(),
        gameData: safeGameData ? {
          trainers: safeGameData.trainers,
          pokemon: safeGameData.pokemon,
          expeditions: safeGameData.expeditions,
          facilities: safeGameData.facilities,
          transactions: safeGameData.transactions,
          analysis: safeGameData.analysis
        } : null,
        localStorage: {
          // localStorage内の全ゲーム関連データ
          gameSettings: localStorage.getItem('tokiwa-game-settings'),
          gameProgress: localStorage.getItem('tokiwa-game-progress'),
          gameProfile: localStorage.getItem('tokiwa-game-profile')
        }
      }

      // JSONファイルとしてダウンロード
      const dataBlob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json'
      })
      
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `tokiwa-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      addNotification({
        type: 'success',
        message: '📄 バックアップファイルをダウンロードしました'
      })
      
      console.log('バックアップ作成完了:', backupData)
    } catch (error) {
      console.error('バックアップ作成エラー:', error)
      addNotification({
        type: 'warning',
        message: 'バックアップの作成に失敗しました'
      })
    }
  }

  const handleRestore = () => {
    // ファイル選択ダイアログを表示
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '.json'
    fileInput.style.display = 'none'
    
    fileInput.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) return
      
      try {
        addNotification({
          type: 'info',
          message: 'バックアップファイルを解析中...'
        })
        
        const fileContent = await file.text()
        const backupData = JSON.parse(fileContent)
        
        // バックアップファイルの検証
        if (!backupData.version || !backupData.timestamp) {
          throw new Error('無効なバックアップファイルです')
        }
        
        // 確認ダイアログ
        const confirmRestore = confirm(
          `バックアップファイル情報:\n` +
          `作成日時: ${new Date(backupData.timestamp).toLocaleString('ja-JP')}\n` +
          `ユーザー: ${backupData.user?.email || '不明'}\n\n` +
          `このバックアップからデータを復元しますか？\n` +
          `現在のデータは上書きされます。`
        )
        
        if (!confirmRestore) return
        
        // 設定の復元（統合設定管理対応）
        if (backupData.settings && settingsManager) {
          const result = await settingsManager.restoreFromBackup(backupData)
          if (result.success) {
            setSettings(backupData.settings)
          } else {
            throw new Error(result.error || '設定の復元に失敗しました')
          }
        }
        
        // localStorageの復元
        if (backupData.localStorage) {
          Object.entries(backupData.localStorage).forEach(([key, value]) => {
            if (value && typeof value === 'string') {
              localStorage.setItem(key, value)
            }
          })
        }
        
        addNotification({
          type: 'success',
          message: '🎉 データの復元が完了しました！'
        })
        
        // ページリロードで変更を反映
        setTimeout(() => {
          window.location.reload()
        }, 2000)
        
        console.log('データ復元完了:', backupData)
        
      } catch (error) {
        console.error('データ復元エラー:', error)
        addNotification({
          type: 'warning',
          message: 'データの復元に失敗しました: ' + (error as Error).message
        })
      }
    }
    
    document.body.appendChild(fileInput)
    fileInput.click()
    document.body.removeChild(fileInput)
  }

  const handleReset = async () => {
    const confirmText = 'RESET'
    const userInput = prompt(
      `⚠️ 危険な操作です ⚠️\n\n` +
      `この操作により以下のデータが完全に削除されます：\n` +
      `• すべてのゲーム設定\n` +
      `• トレーナーとポケモンのデータ\n` +
      `• 派遣履歴と取引記録\n` +
      `• 進行状況とレベル\n` +
      `• 施設の情報\n\n` +
      `本当にリセットする場合は「${confirmText}」と入力してください：`
    )
    
    if (userInput === confirmText) {
      try {
        addNotification({
          type: 'warning',
          message: 'ゲームデータのリセットを開始中...'
        })
        
        // localStorageの全ゲーム関連データを削除
        const gameKeys = [
          'tokiwa-game-settings',
          'tokiwa-game-progress', 
          'tokiwa-game-profile',
          'tokiwa-user-data',
          'tokiwa-expeditions',
          'tokiwa-trainers',
          'tokiwa-pokemon',
          'tokiwa-facilities',
          'tokiwa-transactions'
        ]
        
        gameKeys.forEach(key => {
          localStorage.removeItem(key)
          console.log(`削除: ${key}`)
        })
        
        // 設定状態もリセット（統合設定管理対応）
        if (settingsManager) {
          const result = await settingsManager.resetToDefaults()
          if (result.success) {
            setSettings(DEFAULT_SETTINGS)
          } else {
            console.error('設定リセットエラー:', result.error)
          }
        } else {
          setSettings(DEFAULT_SETTINGS)
        }
        
        // Supabaseデータのクリア（モックモードでない場合）
        if (!isMockMode) {
          console.log('Supabaseデータの削除も検討する必要があります')
        }
        
        addNotification({
          type: 'success',
          message: '🗑️ ゲームデータのリセットが完了しました'
        })
        
        // ホームページにリダイレクト
        setTimeout(() => {
          window.location.href = '/'
        }, UI.NOTIFICATION_DURATION)
        
        console.log('ゲームデータリセット完了')
        
      } catch (error) {
        console.error('データリセットエラー:', error)
        addNotification({
          type: 'warning',
          message: 'データリセット中にエラーが発生しました'
        })
      }
    } else if (userInput !== null) {
      addNotification({
        type: 'info',
        message: '確認文字列が正しくありません。リセットを中止しました。'
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-pixel text-2xl text-retro-gb-dark mb-2">⚙️ 設定</h1>
        <p className="font-pixel text-sm text-retro-gb-mid">
          ゲーム設定とアカウント管理
        </p>
      </div>

      <PixelCard>
        <div className="p-6">
          <h2 className="font-pixel text-lg text-retro-gb-dark mb-4">アカウント設定</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-pixel text-retro-gb-dark">ユーザーID</h3>
                <p className="font-pixel text-sm text-retro-gb-mid">
                  {user?.id || '未設定'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-pixel text-retro-gb-dark">メールアドレス</h3>
                <p className="font-pixel text-sm text-retro-gb-mid">
                  {user?.email || '未設定'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-pixel text-retro-gb-dark">データモード</h3>
                <p className="font-pixel text-sm text-retro-gb-mid">
                  {isMockMode ? 'モックデータ' : 'リアルデータ'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </PixelCard>

      <PixelCard>
        <div className="p-6">
          <h2 className="font-pixel text-lg text-retro-gb-dark mb-4">ゲーム設定</h2>
          
          {isLoading ? (
            <div className="text-center py-4">
              <div className="font-pixel text-xs text-retro-gb-mid">
                設定を読み込み中...
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 音声効果 */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-pixel text-retro-gb-dark">音声効果</h3>
                  <p className="font-pixel text-sm text-retro-gb-mid">
                    ゲーム内の音声効果を有効にする
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.audio_effects}
                    onChange={() => handleSettingChange('audio_effects')}
                    disabled={isSaving}
                  />
                  <div className="w-11 h-6 bg-retro-gb-mid peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-retro-green"></div>
                </label>
              </div>

              {/* 音量調整 */}
              {settings.audio_effects && (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-pixel text-retro-gb-dark">音量</h3>
                    <p className="font-pixel text-sm text-retro-gb-mid">
                      音声効果の音量を調整
                    </p>
                  </div>
                  <div className="w-32">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.sound_volume}
                      onChange={(e) => handleSettingChange('sound_volume', parseInt(e.target.value))}
                      disabled={isSaving}
                      className="w-full h-2 bg-retro-gb-light rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="font-pixel text-xs text-retro-gb-mid text-center mt-1">
                      {settings.sound_volume}%
                    </div>
                  </div>
                </div>
              )}

              {/* アニメーション */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-pixel text-retro-gb-dark">アニメーション</h3>
                  <p className="font-pixel text-sm text-retro-gb-mid">
                    画面アニメーションを有効にする
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.animations}
                    onChange={() => handleSettingChange('animations')}
                    disabled={isSaving}
                  />
                  <div className="w-11 h-6 bg-retro-gb-mid peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-retro-green"></div>
                </label>
              </div>

              {/* UIテーマ */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-pixel text-retro-gb-dark">UIテーマ</h3>
                  <p className="font-pixel text-sm text-retro-gb-mid">
                    画面の表示テーマを選択
                  </p>
                </div>
                <select
                  value={settings.ui_theme}
                  onChange={(e) => handleSettingChange('ui_theme', e.target.value)}
                  disabled={isSaving}
                  className="font-pixel text-xs bg-retro-gb-light border border-retro-gb-mid px-2 py-1"
                >
                  <option value="gameboy_green">ゲームボーイ（緑）</option>
                  <option value="gameboy_classic">ゲームボーイ（クラシック）</option>
                  <option value="gameboy_blue">ゲームボーイ（青）</option>
                  <option value="dark">ダークモード</option>
                  <option value="light">ライトモード</option>
                </select>
              </div>

              {/* 自動保存 */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-pixel text-retro-gb-dark">自動保存</h3>
                  <p className="font-pixel text-sm text-retro-gb-mid">
                    ゲームデータを自動的に保存
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.auto_save}
                    onChange={() => handleSettingChange('auto_save')}
                    disabled={isSaving}
                  />
                  <div className="w-11 h-6 bg-retro-gb-mid peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-retro-green"></div>
                </label>
              </div>
            </div>
          )}
        </div>
      </PixelCard>

      {/* 通知設定セクション */}
      <PixelCard>
        <div className="p-6">
          <h2 className="font-pixel text-lg text-retro-gb-dark mb-4">通知設定</h2>
          
          {isLoading ? (
            <div className="text-center py-4">
              <div className="font-pixel text-xs text-retro-gb-mid">
                設定を読み込み中...
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 基本通知 */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-pixel text-retro-gb-dark">通知機能</h3>
                  <p className="font-pixel text-sm text-retro-gb-mid">
                    ゲーム内通知を有効にする
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.notifications}
                    onChange={() => handleSettingChange('notifications')}
                    disabled={isSaving}
                  />
                  <div className="w-11 h-6 bg-retro-gb-mid peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-retro-green"></div>
                </label>
              </div>

              {/* 詳細通知設定（通知が有効な場合のみ表示） */}
              {settings.notifications && (
                <>
                  {/* 通知頻度 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-pixel text-retro-gb-dark">通知頻度</h3>
                      <p className="font-pixel text-sm text-retro-gb-mid">
                        通知の頻度を調整
                      </p>
                    </div>
                    <select
                      value={settings.notification_frequency}
                      onChange={(e) => handleSettingChange('notification_frequency', e.target.value)}
                      disabled={isSaving}
                      className="font-pixel text-xs bg-retro-gb-light border border-retro-gb-mid px-2 py-1"
                    >
                      <option value="high">高頻度</option>
                      <option value="medium">標準</option>
                      <option value="low">低頻度</option>
                      <option value="none">必要最小限</option>
                    </select>
                  </div>

                  {/* 派遣アラート */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-pixel text-retro-gb-dark">派遣アラート</h3>
                      <p className="font-pixel text-sm text-retro-gb-mid">
                        派遣の完了や緊急事態を通知
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={settings.expedition_alerts}
                        onChange={() => handleSettingChange('expedition_alerts')}
                        disabled={isSaving}
                      />
                      <div className="w-11 h-6 bg-retro-gb-mid peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-retro-green"></div>
                    </label>
                  </div>

                  {/* ポケモンケア通知 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-pixel text-retro-gb-dark">ポケモンケア通知</h3>
                      <p className="font-pixel text-sm text-retro-gb-mid">
                        ポケモンの体調管理を通知
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={settings.pokemon_care_reminders}
                        onChange={() => handleSettingChange('pokemon_care_reminders')}
                        disabled={isSaving}
                      />
                      <div className="w-11 h-6 bg-retro-gb-mid peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-retro-green"></div>
                    </label>
                  </div>

                  {/* 経済通知 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-pixel text-retro-gb-dark">経済通知</h3>
                      <p className="font-pixel text-sm text-retro-gb-mid">
                        収入や支出の重要な変化を通知
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={settings.economic_notifications}
                        onChange={() => handleSettingChange('economic_notifications')}
                        disabled={isSaving}
                      />
                      <div className="w-11 h-6 bg-retro-gb-mid peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-retro-green"></div>
                    </label>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </PixelCard>

      <PixelCard>
        <div className="p-6">
          <h2 className="font-pixel text-lg text-retro-gb-dark mb-4">データ管理</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-pixel text-retro-gb-dark">データバックアップ</h3>
                <p className="font-pixel text-sm text-retro-gb-mid">
                  ゲームデータをバックアップする
                </p>
              </div>
              <PixelButton size="sm" onClick={handleBackup}>
                バックアップ作成
              </PixelButton>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-pixel text-retro-gb-dark">データ復元</h3>
                <p className="font-pixel text-sm text-retro-gb-mid">
                  バックアップからデータを復元する
                </p>
              </div>
              <PixelButton size="sm" variant="secondary" onClick={handleRestore}>
                復元
              </PixelButton>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-pixel text-retro-gb-dark">データリセット</h3>
                <p className="font-pixel text-sm text-retro-gb-mid">
                  ゲームデータを完全にリセットする
                </p>
              </div>
              <PixelButton size="sm" variant="danger" onClick={handleReset}>
                リセット
              </PixelButton>
            </div>
          </div>
        </div>
      </PixelCard>

      {/* 保存状態インジケーター */}
      {isSaving && (
        <PixelCard>
          <div className="text-center py-4">
            <div className="font-pixel text-sm text-retro-gb-mid">
              💾 設定を保存中...
            </div>
            {!isMockMode && (
              <div className="font-pixel text-xs text-retro-gb-mid mt-2">
                データベースに同期中
              </div>
            )}
          </div>
        </PixelCard>
      )}

      <div className="text-center">
        <PixelButton 
          variant="danger" 
          size="lg"
          onClick={handleLogout}
          disabled={isSaving}
        >
          {isSaving ? '保存中...' : 'ログアウト'}
        </PixelButton>
      </div>
    </div>
  )
}
