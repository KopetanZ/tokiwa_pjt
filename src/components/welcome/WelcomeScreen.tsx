'use client'

import { useState } from 'react'
import { PixelButton } from '@/components/ui/PixelButton'
import { PixelInput } from '@/components/ui/PixelInput'
import { useAuth } from '@/components/providers/AuthProvider'
import { useToast } from '@/components/providers/ToastProvider'

export function WelcomeScreen() {
  const [guestName, setGuestName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { login, isAuthenticated } = useAuth()
  const { addToast } = useToast()

  const handleLogin = async () => {
    if (!guestName.trim() || !schoolName.trim()) {
      addToast({
        type: 'warning',
        message: 'プレイヤー名とスクール名を入力してください'
      })
      return
    }

    if (guestName.length < 3 || guestName.length > 20) {
      addToast({
        type: 'error',
        message: 'プレイヤー名は3-20文字で入力してください'
      })
      return
    }

    if (schoolName.length < 3 || schoolName.length > 50) {
      addToast({
        type: 'error',
        message: 'スクール名は3-50文字で入力してください'
      })
      return
    }

    setIsLoading(true)
    try {
      await login(guestName, schoolName)
      addToast({
        type: 'success',
        message: `${schoolName}へようこそ、${guestName}館長！`
      })
      // ダッシュボードにリダイレクト
      window.location.href = '/dashboard'
    } catch (error) {
      addToast({
        type: 'error',
        message: 'ログインに失敗しました'
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isAuthenticated) {
    return (
      <div className="text-center space-y-6">
        <div className="font-pixel-xl text-retro-gb-dark">
          トキワシティ訓練所
        </div>
        <div className="font-pixel text-retro-gb-mid">
          ダッシュボードをロード中...
        </div>
        <div className="animate-pulse">
          <div className="w-16 h-2 bg-retro-gb-mid mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-8 p-6">
      {/* タイトル */}
      <div className="text-center space-y-4">
        <div className="font-pixel-xl text-retro-gb-dark">
          トキワシティ訓練所
        </div>
        <div className="font-pixel text-retro-gb-mid">
          〜 ポケモントレーナー育成シミュレーション 〜
        </div>
      </div>

      {/* ピカチュウのアスキーアート風 */}
      <div className="text-center font-pixel text-xs text-retro-gb-mid leading-tight">
        <pre>{`
    ∩───∩
   ( ◕     ◕ )
  /           \\
 (  ○  ___  ○  )
  \\      ___     /
   ────────────
        `}</pre>
      </div>

      {/* 説明文 */}
      <div className="space-y-2 text-center">
        <div className="font-pixel text-xs text-retro-gb-dark">
          あなたはトキワシティの
        </div>
        <div className="font-pixel text-xs text-retro-gb-dark">
          トレーナーズスクールの館長です
        </div>
        <div className="font-pixel text-xs text-retro-gb-mid">
          トレーナーを雇い、ポケモンを捕まえ
        </div>
        <div className="font-pixel text-xs text-retro-gb-mid">
          最強のスクールを作り上げましょう！
        </div>
      </div>

      {/* 入力フォーム */}
      <div className="space-y-4">
        <div>
          <label className="block font-pixel text-xs text-retro-gb-dark mb-2">
            プレイヤー名 (3-20文字)
          </label>
          <PixelInput
            type="text"
            placeholder="サトシ"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            maxLength={20}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block font-pixel text-xs text-retro-gb-dark mb-2">
            スクール名 (3-50文字)
          </label>
          <PixelInput
            type="text"
            placeholder="マサラタウン育成学校"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            maxLength={50}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* スタートボタン */}
      <div className="text-center">
        <PixelButton
          onClick={handleLogin}
          disabled={isLoading}
          loading={isLoading}
          size="lg"
        >
          {isLoading ? 'ロード中...' : 'ゲームスタート！'}
        </PixelButton>
      </div>

      {/* 注意書き */}
      <div className="text-center space-y-1">
        <div className="font-pixel text-xs text-retro-gb-mid opacity-80">
          このゲームは完全に無料です
        </div>
        <div className="font-pixel text-xs text-retro-gb-mid opacity-80">
          データはブラウザに保存されます
        </div>
      </div>
    </div>
  )
}