'use client'

import { useState } from 'react'
import { PixelButton } from '@/components/ui/PixelButton'
import { PixelInput } from '@/components/ui/PixelInput'
import { useAuth } from '@/contexts/GameContext'
import { supabase } from '@/lib/supabase'
import { useNotifications } from '@/contexts/GameContext'

export function AuthWelcomeScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [trainerName, setTrainerName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { user, isAuthenticated, enableMockMode } = useAuth()
  const { addNotification } = useNotifications()
  const isDevelopment = process.env.NODE_ENV === 'development'

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim() || !trainerName.trim() || !schoolName.trim()) {
      addNotification({
        type: 'warning',
        message: 'すべての項目を入力してください'
      })
      return
    }

    if (password.length < 6) {
      addNotification({
        type: 'error', 
        message: 'パスワードは6文字以上で入力してください'
      })
      return
    }

    if (!email.includes('@')) {
      addNotification({
        type: 'error',
        message: '正しいメールアドレスを入力してください'
      })
      return
    }

    setIsLoading(true)
    try {
      console.log('🔧 サインアップを試行中...', { email: email.trim(), isDevelopment })

      if (!supabase) {
        throw new Error('Supabase client is not initialized')
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            trainer_name: trainerName.trim(),
            school_name: schoolName.trim()
          }
        }
      })

      if (error) {
        console.error('🚨 サインアップエラー詳細:', {
          message: error.message,
          status: error.status,
          name: error.name
        })

        // 開発環境では詳細なエラー情報を表示
        if (isDevelopment) {
          addNotification({
            type: 'error',
            message: `開発環境エラー: ${error.message}`
          })
          
          // データベースエラーの場合は代替手段を提示
          if (error.message.includes('Database error') || error.message.includes('saving new user')) {
            addNotification({
              type: 'info',
              message: 'データベース設定が必要です。クイックスタートをお試しください。'
            })
          }
        } else {
          addNotification({
            type: 'error',
            message: 'サインアップに失敗しました'
          })
        }
        return
      }

      if (data.user) {
        addNotification({
          type: 'success',
          message: `${schoolName}へようこそ、${trainerName}館長！`
        })
        
        // メール確認が必要な場合
        if (!data.session) {
          addNotification({
            type: 'info',
            message: 'メールを確認してアカウントを有効化してください'
          })
        } else {
          // セッションがある場合は即座にダッシュボードへ
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 1500)
        }
      }
    } catch (error: any) {
      console.error('🚨 予期しないサインアップエラー:', error)
      addNotification({
        type: 'error',
        message: isDevelopment ? `開発エラー: ${error.message}` : 'サインアップに失敗しました'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      addNotification({
        type: 'warning',
        message: 'メールアドレスとパスワードを入力してください'
      })
      return
    }

    setIsLoading(true)
    try {
      console.log('🔧 サインインを試行中...', { email: email.trim(), isDevelopment })

      if (!supabase) {
        throw new Error('Supabase client is not initialized')
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      })

      if (error) {
        console.error('🚨 サインインエラー詳細:', {
          message: error.message,
          status: error.status,
          name: error.name
        })

        // 開発環境では詳細なエラー情報を表示
        if (isDevelopment) {
          addNotification({
            type: 'error',
            message: `開発環境エラー: ${error.message}`
          })
          
          // 認証情報が無効な場合は代替手段を提示
          if (error.message.includes('Invalid login credentials')) {
            addNotification({
              type: 'info',
              message: 'まだアカウントが作成されていない可能性があります。クイックスタートをお試しください。'
            })
          }
        } else {
          addNotification({
            type: 'error',
            message: 'ログインに失敗しました。メールアドレスとパスワードを確認してください。'
          })
        }
        return
      }

      if (data.user) {
        console.log('✅ サインイン成功:', data.user.email)
        addNotification({
          type: 'success',
          message: `おかえりなさい！`
        })
        
        // ダッシュボードにリダイレクト
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1000)
      }
    } catch (error: any) {
      console.error('🚨 予期しないサインインエラー:', error)
      addNotification({
        type: 'error',
        message: isDevelopment ? `開発エラー: ${error.message}` : 'ログインに失敗しました'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickStart = () => {
    console.log('🎮 開発環境クイックスタート - モックモード有効化')
    
    // モックモードを有効化
    enableMockMode()
    
    // 通知を表示
    addNotification({
      type: 'success',
      message: '🎮 開発モードでゲームを開始しました！'
    })
    
    // ダッシュボードへリダイレクト
    setTimeout(() => {
      window.location.href = '/dashboard'
    }, 500)
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