'use client'

import { useState, useEffect } from 'react'
import { useAuth, useNotifications, useGameData } from '@/contexts/GameContext'
import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const { user, isMockMode, signOut } = useAuth()
  const { addNotification } = useNotifications()
  const gameData = useGameData()
  const router = useRouter()

  // 設定状態管理（localStorage対応）
  const [settings, setSettings] = useState({
    audioEffects: true,
    animations: true,
    notifications: true
  })

  // 設定をlocalStorageから読み込み
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('tokiwa-game-settings')
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings)
          setSettings(prev => ({
            ...prev,
            ...parsed
          }))
          console.log('設定を読み込みました:', parsed)
        }
      } catch (error) {
        console.error('設定の読み込みに失敗:', error)
      }
    }

    loadSettings()
  }, [])

  // 設定をlocalStorageに保存
  const saveSettings = (newSettings: typeof settings) => {
    try {
      localStorage.setItem('tokiwa-game-settings', JSON.stringify(newSettings))
      console.log('設定を保存しました:', newSettings)
    } catch (error) {
      console.error('設定の保存に失敗:', error)
      addNotification({
        type: 'warning',
        message: '設定の保存に失敗しました'
      })
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
  const handleSettingChange = (key: keyof typeof settings) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key]
    }
    
    setSettings(newSettings)
    saveSettings(newSettings)
    
    const settingNames = {
      audioEffects: '音声効果',
      animations: 'アニメーション',
      notifications: '通知'
    }
    
    addNotification({
      type: 'info',
      message: `${settingNames[key]}を${!settings[key] ? '有効' : '無効'}にしました`
    })
    
    console.log(`設定変更: ${key} = ${!settings[key]}`)
  }

  // データ管理ハンドラー
  const handleBackup = () => {
    try {
      // バックアップデータの構築
      const backupData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        user: {
          id: user?.id,
          email: user?.email
        },
        settings: settings,
        gameData: gameData ? {
          trainers: gameData.trainers,
          pokemon: gameData.pokemon,
          expeditions: gameData.expeditions,
          facilities: gameData.facilities,
          transactions: gameData.transactions,
          analysis: gameData.analysis
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
        
        // 設定の復元
        if (backupData.settings) {
          setSettings(backupData.settings)
          saveSettings(backupData.settings)
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

  const handleReset = () => {
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
        
        // 設定状態もリセット
        const defaultSettings = {
          audioEffects: true,
          animations: true,
          notifications: true
        }
        setSettings(defaultSettings)
        saveSettings(defaultSettings)
        
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
        }, 3000)
        
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
          
          <div className="space-y-4">
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
                  checked={settings.audioEffects}
                  onChange={() => handleSettingChange('audioEffects')}
                />
                <div className="w-11 h-6 bg-retro-gb-mid peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-retro-green"></div>
              </label>
            </div>

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
                />
                <div className="w-11 h-6 bg-retro-gb-mid peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-retro-green"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-pixel text-retro-gb-dark">通知</h3>
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
                />
                <div className="w-11 h-6 bg-retro-gb-mid peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-retro-green"></div>
              </label>
            </div>
          </div>
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

      <div className="text-center">
        <PixelButton 
          variant="danger" 
          size="lg"
          onClick={handleLogout}
        >
          ログアウト
        </PixelButton>
      </div>
    </div>
  )
}
