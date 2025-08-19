'use client'

import { useAuth } from '@/contexts/GameContext'
import { PixelCard } from '@/components/ui/PixelCard'
import { PixelButton } from '@/components/ui/PixelButton'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const { user, isMockMode, signOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('ログアウトエラー:', error)
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
                <input type="checkbox" className="sr-only peer" defaultChecked />
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
                <input type="checkbox" className="sr-only peer" defaultChecked />
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
                <input type="checkbox" className="sr-only peer" defaultChecked />
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
              <PixelButton size="sm">
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
              <PixelButton size="sm" variant="secondary">
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
              <PixelButton size="sm" variant="danger">
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
