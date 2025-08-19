'use client'

import { useState } from 'react'
import { PixelButton } from '@/components/ui/PixelButton'
import { PixelInput } from '@/components/ui/PixelInput'
import { useAuth } from '@/contexts/GameContext'
// import { useToast } from '@/components/providers/ToastProvider'

export function WelcomeScreen() {
  const [guestName, setGuestName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { user, isAuthenticated } = useAuth()
  // const { addToast } = useToast()
  const isDevelopment = process.env.NODE_ENV === 'development'

  console.log('🎮 WelcomeScreen: レンダリング', { isAuthenticated, isLoading, user, isDevelopment })

  const handleLogin = async () => {
    console.log('🎮 WelcomeScreen: ログイン処理開始', { guestName, schoolName })
    
    if (!guestName.trim() || !schoolName.trim()) {
      console.log('プレイヤー名とスクール名を入力してください')
      return
    }

    if (guestName.length < 3 || guestName.length > 20) {
      console.log('プレイヤー名は3-20文字で入力してください')
      return
    }

    if (schoolName.length < 3 || schoolName.length > 50) {
      console.log('スクール名は3-50文字で入力してください')
      return
    }

    setIsLoading(true)
    try {
      console.log('🎮 WelcomeScreen: login関数を呼び出し')
      // await login(guestName, schoolName)
      console.log('🎮 WelcomeScreen: ログイン成功')
      console.log(`${schoolName}へようこそ、${guestName}館長！`)
      // ダッシュボードにリダイレクト
      console.log('🎮 WelcomeScreen: ダッシュボードにリダイレクト')
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('🎮 WelcomeScreen: ログイン失敗', error)
      console.log('ログインに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // 開発環境用クイックスタート
  const handleQuickStart = () => {
    console.log('🎮 WelcomeScreen: 開発環境クイックスタート')
    window.location.href = '/dashboard'
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
      <div className="text-center space-y-4">
        <PixelButton
          onClick={handleLogin}
          disabled={isLoading}
          loading={isLoading}
          size="lg"
        >
          {isLoading ? 'ロード中...' : 'ゲームスタート！'}
        </PixelButton>
        
        {/* 開発環境専用クイックスタート */}
        {isDevelopment && (
          <div className="space-y-2">
            <div className="font-pixel text-xs text-retro-gb-mid">
              開発環境専用
            </div>
            <PixelButton
              onClick={handleQuickStart}
              variant="secondary"
              size="sm"
            >
              クイックスタート（認証スキップ）
            </PixelButton>
          </div>
        )}
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

      {/* デバッグ用ボタン（開発環境のみ） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-center space-y-2 pt-4 border-t border-retro-gb-mid">
          <div className="font-pixel text-xs text-retro-gb-mid">デバッグ情報</div>
          
          {/* 認証方法の表示 */}
          <div className="font-pixel text-xs text-retro-gb-mid">
            認証方法: {process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Supabase' : 'ローカルストレージ'}
          </div>
          
          {/* 環境変数の状態 */}
          <div className="font-pixel text-xs text-retro-gb-mid">
            SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '設定済み' : '未設定'}
          </div>
          <div className="font-pixel text-xs text-retro-gb-mid">
            SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '設定済み' : '未設定'}
          </div>
          
          <div className="flex gap-2 justify-center">
            <PixelButton 
              size="sm" 
              variant="secondary"
              onClick={() => {
                const user = localStorage.getItem('tokiwa_user')
                console.log('🔍 ローカルストレージ:', user)
                alert(`ローカルストレージ: ${user || 'なし'}`)
              }}
            >
              ストレージ確認
            </PixelButton>
            <PixelButton 
              size="sm" 
              variant="secondary"
              onClick={() => {
                localStorage.removeItem('tokiwa_user')
                console.log('🧹 ローカルストレージをクリア')
                alert('ローカルストレージをクリアしました')
                window.location.reload()
              }}
            >
              ストレージクリア
            </PixelButton>
          </div>
        </div>
      )}
    </div>
  )
}