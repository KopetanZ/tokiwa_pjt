'use client'

import { useState, useEffect } from 'react'
import { PixelButton } from '@/components/ui/PixelButton'
import { PixelInput } from '@/components/ui/PixelInput'
import { useAuthProviderSafe } from '../providers/AuthProvider'

// SSRを無効化
export const dynamic = 'force-dynamic'
export const ssr = false

function AuthWelcomeScreenClient() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [trainerName, setTrainerName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null)
  
  // 安全にuseAuthProviderを使用
  const { user, isAuthenticated, isLoading, signUp, signIn, createGuestSession, forceSignOut, error } = useAuthProviderSafe()
  const isDevelopment = process.env.NODE_ENV === 'development'

  // エラー表示の監視
  useEffect(() => {
    if (error) {
      showNotification('error', error)
    }
  }, [error])

  // 認証済みの場合はダッシュボードにリダイレクト
  if (isAuthenticated && user) {
    return (
      <div className="text-center space-y-6">
        <div className="font-pixel-xl text-retro-gb-dark">
          トキワシティ訓練所
        </div>
        <div className="font-pixel text-retro-gb-mid">
          既にログインしています: {user.guestName}
        </div>
        <div className="space-y-4">
          <PixelButton
            onClick={() => window.location.href = '/dashboard'}
            size="lg"
          >
            ダッシュボードへ
          </PixelButton>
          
          {isDevelopment && (
            <div className="space-y-2">
              <div className="font-pixel text-xs text-yellow-600">
                開発環境専用
              </div>
              <PixelButton
                onClick={forceSignOut}
                variant="secondary"
                size="sm"
                className="bg-red-300 hover:bg-red-400 text-red-800 border-red-600"
              >
                🔄 強制ログアウト
              </PixelButton>
            </div>
          )}
        </div>
      </div>
    )
  }

  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim() || !trainerName.trim() || !schoolName.trim()) {
      showNotification('warning', 'すべての項目を入力してください')
      return
    }

    if (password.length < 6) {
      showNotification('error', 'パスワードは6文字以上で入力してください')
      return
    }

    if (!email.includes('@')) {
      showNotification('error', '正しいメールアドレスを入力してください')
      return
    }

    try {
      if (signUp) {
        await signUp(email, password, trainerName, schoolName)
        if (!error) {
          showNotification('success', `${schoolName}へようこそ、${trainerName}館長！`)
        }
      } else {
        showNotification('error', '認証システムが利用できません')
      }
    } catch (err) {
      // エラーはAuthProviderで処理される
    }
  }

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      showNotification('warning', 'メールアドレスとパスワードを入力してください')
      return
    }

    try {
      if (signIn) {
        await signIn(email, password)
        if (!error) {
          showNotification('success', 'おかえりなさい！')
        }
      } else {
        showNotification('error', '認証システムが利用できません')
      }
    } catch (err) {
      // エラーはAuthProviderで処理される
    }
  }

  const handleQuickStart = async () => {
    try {
      console.log('🎮 クイックスタート開始')
      
      // 既存セッションを強制的にクリア
      if (forceSignOut) {
        console.log('🔄 既存セッションをクリア中...')
        await forceSignOut()
        // forceSignOutはページをリロードするので、ここで処理は終了
        return
      }
      
      if (createGuestSession) {
        await createGuestSession('開発者', 'テスト学校')
        showNotification('success', '🎮 開発モードでゲームを開始しました！')
      } else {
        showNotification('error', '認証システムが利用できません')
      }
    } catch (err) {
      console.error('🎮 クイックスタートエラー:', err)
      showNotification('error', '開発モードの開始に失敗しました')
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-8 p-6">
      {/* 通知表示 */}
      {notification && (
        <div className={`p-3 border-2 text-center font-pixel text-sm ${
          notification.type === 'success' ? 'bg-green-100 border-green-500 text-green-800' :
          notification.type === 'error' ? 'bg-red-100 border-red-500 text-red-800' :
          notification.type === 'warning' ? 'bg-yellow-100 border-yellow-500 text-yellow-800' :
          'bg-blue-100 border-blue-500 text-blue-800'
        }`}>
          {notification.message}
        </div>
      )}

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
        <pre>{`    ∩───∩
   ( ◕     ◕ )
  /           \\
 (  ○  ___  ○  )
  \\      ⌒     /
   ∪─────────∪`}</pre>
      </div>

      {/* モード切り替え */}
      <div className="flex space-x-2">
        <PixelButton
          onClick={() => setMode('signup')}
          variant={mode === 'signup' ? 'primary' : 'secondary'}
          size="sm"
          className="flex-1"
        >
          新規登録
        </PixelButton>
        <PixelButton
          onClick={() => setMode('signin')}
          variant={mode === 'signin' ? 'primary' : 'secondary'}
          size="sm"
          className="flex-1"
        >
          ログイン
        </PixelButton>
      </div>

      {/* フォーム */}
      <div className="space-y-4">
        <div>
          <label className="block font-pixel text-xs text-retro-gb-dark mb-2">
            メールアドレス
          </label>
          <PixelInput
            type="email"
            placeholder="trainer@tokiwa.school"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block font-pixel text-xs text-retro-gb-dark mb-2">
            パスワード
          </label>
          <PixelInput
            type="password"
            placeholder="6文字以上"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {mode === 'signup' && (
          <>
            <div>
              <label className="block font-pixel text-xs text-retro-gb-dark mb-2">
                館長名 (3-20文字)
              </label>
              <PixelInput
                type="text"
                placeholder="サトシ"
                value={trainerName}
                onChange={(e) => setTrainerName(e.target.value)}
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
          </>
        )}
      </div>

      {/* アクションボタン */}
      <div className="text-center space-y-4">
        <PixelButton
          onClick={mode === 'signup' ? handleSignUp : handleSignIn}
          disabled={isLoading}
          loading={isLoading}
          size="lg"
        >
          {isLoading ? '処理中...' : mode === 'signup' ? 'スクール開設！' : 'ログイン'}
        </PixelButton>
        
        {/* 開発環境専用クイックスタート */}
        {isDevelopment && (
          <div className="space-y-3 p-4 border-2 border-dashed border-yellow-400 bg-yellow-50 rounded-lg">
            <div className="text-center space-y-1">
              <div className="font-pixel text-sm text-yellow-800">
                🔧 開発環境専用
              </div>
              <div className="font-pixel text-xs text-yellow-600">
                Supabaseの設定が完了していない場合は<br />
                クイックスタートをご利用ください
              </div>
            </div>
            <PixelButton
              onClick={handleQuickStart}
              variant="secondary"
              size="lg"
              className="w-full bg-yellow-300 hover:bg-yellow-400 text-yellow-800 border-yellow-600"
            >
              🎮 クイックスタート（認証スキップ）
            </PixelButton>
          </div>
        )}
      </div>

      {/* 注意書き */}
      <div className="text-center space-y-1">
        <div className="font-pixel text-xs text-retro-gb-mid opacity-80">
          ※ このゲームは完全無料です
        </div>
        <div className="font-pixel text-xs text-retro-gb-mid opacity-60">
          レトロゲーム風シミュレーション
        </div>
      </div>
    </div>
  )
}

export function AuthWelcomeScreen() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // クライアントサイドでのみレンダリング
  if (!isClient) {
    return (
      <div className="text-center space-y-6">
        <div className="font-pixel-xl text-retro-gb-dark">
          トキワシティ訓練所
        </div>
        <div className="font-pixel text-retro-gb-mid">
          読み込み中...
        </div>
        <div className="animate-pulse">
          <div className="w-16 h-2 bg-retro-gb-mid mx-auto"></div>
        </div>
      </div>
    )
  }

  return <AuthWelcomeScreenClient />
}