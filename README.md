# 🎮 トキワシティ訓練所 (Tokiwa Trainer School)

**ポケモントレーナー管理ゲーム - 完全実装版**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 📋 概要

トキワシティ訓練所は、ポケモントレーナーの成長と施設管理をテーマにした本格的なシミュレーションゲームです。プレイヤーはトレーナー育成施設の運営者として、トレーナーの派遣、ポケモンの収集、経済管理、施設拡張を通じて、最高の訓練所を築き上げます。

### 🎯 ゲームの特徴

- **🗺️ 戦略的派遣システム**: 8つの多様な探索エリア
- **🔥 リアルポケモン連携**: PokeAPI活用で本物のポケモンデータ
- **💰 本格経済シミュレーション**: 詳細な収支管理と経営分析
- **🏗️ 施設建設・管理**: 7カテゴリの専門施設でパワーアップ
- **🎵 没入型音響システム**: Web Audio APIによる高品質サウンド
- **📊 データ分析**: 月次レポートによる戦略的意思決定

---

## 🚀 クイックスタート

### 必要環境
- Node.js 18.0.0以上
- Git

### インストール

```bash
# リポジトリクローン
git clone https://github.com/your-username/tokiwa-trainer-school.git
cd tokiwa-trainer-school

# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env.local
# .env.localにSupabase認証情報を記入

# 開発サーバー起動
npm run dev
```

ブラウザで `http://localhost:3000` を開いてゲーム開始！

### 設定が必要な環境変数

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 🎮 実装済み全システム (14システム完全実装)

#### 🏠 **基本システム**
- ✅ ダッシュボード (リアルタイム統計)
- ✅ 認証システム (ゲストログイン対応)
- ✅ Game Boy風UI (ピクセルパーフェクト)

#### 👨‍🏫 **トレーナー管理**
- ✅ 15職業システム (レンジャー・ブリーダー・バトラー等)
- ✅ 経験値・レベル・給与システム
- ✅ 専門スキル・効率ボーナス

#### 🗺️ **派遣管理**
- ✅ 従来派遣システム (履歴・場所選択)
- ✅ **リアルタイム介入** (1秒更新・30秒判断制限)
- ✅ 動的イベント生成 (遭遇・バトル・緊急事態)

#### 🎾 **ポケモン管理**
- ✅ ポケモン管理 (ステータス・パーティ編成)
- ✅ **PokeAPI図鑑** (1010匹・日英対応)
- ✅ **野生捕獲システム** (確率計算・色違い・クリティカル)

#### 💰 **経済システム**
- ✅ 高度財務管理 (収支・予算・バーンレート)
- ✅ 自動取引記録 (カテゴリ別・関連ID追跡)
- ✅ AI分析レポート (改善提案・投資シミュレーション)

#### 🏢 **施設管理**
- ✅ 6種類施設 (訓練場・研究所・ポケセン・倉庫・寮・育成センター)
- ✅ 10レベルアップグレード (効率・容量向上)
- ✅ 5研究プロジェクト (効率向上・新機能解放)

#### 🧠 **ゲームロジック**
- ✅ **AI動的バランス** (難易度・経済・効率自動調整)
- ✅ 緊急イベント生成 (自然災害・経済危機・ポケモン大量発生)
- ✅ 成果報酬計算 (レベル・価値連動)

#### 📊 **分析システム**
- ✅ **総合スコア** (S-Dランク評価)
- ✅ リアルタイム指標 (14種類の詳細メトリクス)
- ✅ AI推奨エンジン (自動改善提案)

## 🚀 技術スタック

- **Frontend**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + カスタムレトロテーマ
- **Backend**: Vercel Functions
- **Database**: Supabase (PostgreSQL)
- **External API**: PokeAPI
- **Deploy**: Vercel
- **State Management**: Zustand + React Query

## 🛠️ 開発環境セットアップ

### 1. プロジェクトクローン
```bash
git clone <repository-url>
cd tokiwa-trainer-school
```

### 2. 依存関係インストール
```bash
npm install
```

### 3. 環境変数設定
`.env.local.example`をコピーして`.env.local`を作成し、Supabase認証情報を設定:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Supabaseセットアップ
1. [Supabase](https://supabase.com)でプロジェクト作成
2. SQL Editorで`supabase/migrations/001_initial_schema.sql`を実行
3. 認証設定でゲストログイン有効化

### 5. 開発サーバー起動
```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く

## 📁 プロジェクト構成

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # ルートレイアウト
│   ├── page.tsx          # ホームページ
│   └── globals.css       # グローバルスタイル
├── components/            # UIコンポーネント
│   ├── layout/           # レイアウトコンポーネント
│   ├── providers/        # Context Providers
│   ├── ui/              # 基本UIコンポーネント
│   └── welcome/         # ウェルカム画面
├── config/              # 設定ファイル
│   └── gameBalance.ts   # ゲームバランス設定
├── lib/                 # ユーティリティ
│   ├── supabase.ts     # Supabaseクライアント
│   └── utils.ts        # 共通ユーティリティ
└── types/              # TypeScript型定義
    ├── auth.ts         # 認証関連型
    └── database.ts     # データベース型
```

## 🎨 UI/UXデザイン

### レトロテーマ
- **Game Boy Original**: 4色グリーンパレット
- **Game Boy Color**: 拡張カラーパレット（赤・青・黄）
- **ピクセルフォント**: Press Start 2P
- **ドット絵**: image-rendering: pixelated

### コンポーネント設計
- `PixelButton`: ドット絵風3Dボタン
- `PixelInput`: レトロ入力フィールド
- `PixelDialog`: 初代ポケモン風メッセージボックス
- `PixelToast`: レトロ通知システム

## 🗄️ データベース設計

### 主要テーブル
- `users`: ユーザー情報
- `trainers`: トレーナー管理
- `trainer_jobs`: 職業定義
- `pokemon_species`: ポケモン種族データ
- `pokemon_instances`: 個体管理
- `expeditions`: 派遣履歴
- `expedition_locations`: 派遣先
- `facilities`: 施設管理
- `economic_transactions`: 経済取引

### セキュリティ
- Row Level Security (RLS) 有効
- ユーザーごとのデータ分離
- ゲストログイン対応

## 🎯 ゲームシステム

### 派遣システム
1. **トレーナー選択**: 職業・レベル・パーティ構成
2. **派遣先選択**: 距離・リスク・報酬のバランス
3. **自動進行**: バックグラウンドでシミュレーション
4. **リアルタイム介入**: 重要な選択肢でプレイヤー判断
5. **結果回収**: 経験値・お金・ポケモン獲得

### トレーナー職業
- **レンジャー**: 捕獲特化
- **ブリーダー**: 育成特化
- **バトラー**: 戦闘特化
- **リサーチャー**: 発見特化
- **メディック**: 回復特化

### 経済システム
- **収入**: 派遣報酬、施設見学料、寄付
- **支出**: トレーナー給与、施設維持費、派遣経費
- **投資**: 施設強化、装備購入

## 🚀 デプロイ

### Vercelデプロイ
1. GitHubリポジトリ連携
2. 環境変数設定
3. 自動デプロイ

### 環境設定
- **Production**: 本番環境
- **Preview**: プレビュー環境（PR）
- **Development**: ローカル開発

## 📝 開発ガイドライン

### コードスタイル
- TypeScript Strict Mode
- ESLint + Prettier
- Conventional Commits

### コンポーネント規約
- 'use client' ディレクティブ必要時のみ
- Props型定義必須
- レトロテーマ準拠

### API設計
- RESTful設計
- 統一エラーハンドリング
- レスポンス型定義

## 🧪 テスト

```bash
# 型チェック
npm run type-check

# リント
npm run lint

# ビルド確認
npm run build
```

## 📄 ライセンス

このプロジェクトはプライベート使用目的で作成されています。

## 🤝 コントリビューション

現在、外部からのコントリビューションは受け付けていません。

## 📞 サポート

技術的な問題や質問については、プロジェクトのIssueを作成してください。