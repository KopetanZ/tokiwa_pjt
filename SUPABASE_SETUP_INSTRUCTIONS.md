# Supabaseセットアップ手順

## 1. 認証設定の有効化

Supabaseダッシュボード（https://icivwdanvyhjrjkfpitq.supabase.co）にアクセスして以下を設定：

### Authentication → Settings
1. **Email** を有効にする
2. **Confirm email** を無効にする（開発中のため）
3. **Enable signup** を有効にする

## 2. データベースセットアップ

### Database → SQL Editor で以下を実行：

```sql
-- setup-database-now.sqlの内容をコピー&ペーストして実行
```

または、**setup-database-now.sql**ファイルの内容をSQL Editorに貼り付けて実行してください。

## 3. テスト用ユーザー作成

ブラウザで http://localhost:3000 にアクセスして：

1. **新規登録**タブを選択
2. 以下の情報を入力：
   - メールアドレス: `test@tokiwa.school`
   - パスワード: `password123`
   - 館長名: `サトシ`
   - スクール名: `トキワシティ訓練所`
3. **スクール開設！**ボタンをクリック

## 4. 動作確認

- 認証が成功すればダッシュボードページにリダイレクトされます
- エラーが発生した場合はブラウザの開発者コンソールを確認

## 現在の状況

✅ AuthWelcomeScreenに置き換え完了
⏳ Supabaseダッシュボードでの設定が必要
⏳ データベーステーブル作成が必要