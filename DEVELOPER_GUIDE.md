# 🛠️ Developer Guide - トキワシティ訓練所

## 📋 目次
1. [プロジェクト概要](#プロジェクト概要)
2. [開発環境セットアップ](#開発環境セットアップ)  
3. [アーキテクチャ](#アーキテクチャ)
4. [ゲームシステム詳細](#ゲームシステム詳細)
5. [API Reference](#api-reference)
6. [テスト](#テスト)
7. [デプロイメント](#デプロイメント)
8. [トラブルシューティング](#トラブルシューティング)

---

## 🎯 プロジェクト概要

### 技術スタック
- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Styling**: Tailwind CSS, Radix UI
- **State Management**: Zustand, React Query
- **Testing**: Jest, Testing Library
- **External APIs**: PokeAPI

### ディレクトリ構造
```
tokiwa-trainer-school/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── dashboard/          # メインゲーム画面
│   │   └── auth/              # 認証関連
│   ├── components/            # Reactコンポーネント
│   │   ├── expeditions/       # 派遣関連UI
│   │   ├── pokemon/           # ポケモン関連UI
│   │   ├── facilities/        # 施設関連UI
│   │   └── ui/               # 汎用UIコンポーネント
│   ├── lib/                  # ユーティリティライブラリ
│   │   ├── game-logic/       # ゲームロジック
│   │   ├── pokeapi.ts        # PokeAPI連携
│   │   └── utils.ts          # 汎用ユーティリティ
│   ├── contexts/             # React Context
│   ├── hooks/                # カスタムHooks
│   ├── types/                # TypeScript型定義
│   └── __tests__/            # テストファイル
├── public/                   # 静的ファイル
├── docs/                     # ドキュメント
└── scripts/                  # ビルド・運用スクリプト
```

---

## 🚀 開発環境セットアップ

### 必要な環境
- Node.js 18.0.0以上
- npm または yarn
- Git

### セットアップ手順

1. **リポジトリクローン**
```bash
git clone <repository-url>
cd tokiwa-trainer-school
```

2. **依存関係インストール**
```bash
npm install
```

3. **環境変数設定**
```bash
cp .env.example .env.local
# .env.localを編集してSupabase認証情報を設定
```

4. **開発サーバー起動**
```bash
npm run dev
```

5. **テスト実行**
```bash
npm test
```

### 必要な環境変数
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 🏗️ アーキテクチャ

### システム全体図
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   UI Components │◄──►│  GameController  │◄──►│   Supabase DB   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │  Game Systems    │
                    │ ・ExpeditionSys  │
                    │ ・PokemonSys     │    ┌─────────────────┐
                    │ ・EconomySys     │◄──►│    PokeAPI      │
                    │ ・FacilitySys    │    └─────────────────┘
                    │ ・TrainerSys     │
                    │ ・SoundSys       │    ┌─────────────────┐
                    └──────────────────┘◄──►│  Web Audio API  │
                                             └─────────────────┘
```

### ゲームループフロー
```
User Action → UI Component → GameController → Game Systems → Database/API
     ▲                                                              │
     └──────────────────── UI Update ◄─── Event/State ◄───────────┘
```

---

## 🎮 ゲームシステム詳細

### 1. GameController (`src/lib/game-logic/index.ts`)

**責任**: 全システムの統合・協調制御

```typescript
class GameController {
  // システム初期化
  async initialize(): Promise<void>
  
  // 派遣実行（メインゲームループ）
  async executeExpedition(params: ExpeditionParams): Promise<ExpeditionResult>
  
  // 経済状況取得
  getEconomicStatus(): FinancialStatus
  
  // 施設情報取得
  getFacilities(): Map<string, Facility>
}
```

### 2. ExpeditionSystem (`src/lib/game-logic/expedition-system.ts`)

**責任**: 派遣ミッション管理

**主要メソッド**:
```typescript
// 成功率計算
calculateExpeditionSuccess(
  trainer: Trainer,
  location: ExpeditionLocation, 
  party: Pokemon[],
  strategy: string,
  advice: PlayerAdvice[]
): number

// 派遣実行
async executeExpedition(params: ExpeditionParams): Promise<ExpeditionResult>
```

**成功率計算要素**:
- ベース成功率（場所の難易度）
- トレーナーレベル補正
- パーティ戦力
- 戦略補正（バランス/攻撃的/防御的/探索）
- プレイヤーアドバイス効果
- 職業補正

### 3. PokemonSystem (`src/lib/game-logic/pokemon-system.ts`)

**責任**: ポケモン管理・捕獲システム

**遭遇システム**:
```typescript
// 野生ポケモン遭遇
async generateWildPokemonEncounter(
  location: ExpeditionLocation
): Promise<PokemonSpecies | null>

// 捕獲試行
attemptCapture(attempt: CaptureAttempt): CaptureResult
```

**特徴**:
- PokeAPI連携によるリアルデータ
- 地域別出現率設定
- 個体値・性格・シャイニー判定
- キャッシングによるパフォーマンス最適化

### 4. EconomySystem (`src/lib/game-logic/economy-system.ts`)

**責任**: 経済・財務管理

```typescript
// 収入記録
recordIncome(category: string, amount: number, description: string): boolean

// 支出記録 
recordExpense(category: string, amount: number, description: string): boolean

// 月次レポート生成
generateMonthlyReport(): MonthlyReport

// 予算配分
calculateBudgetAllocation(availableFunds: number, priorities: string[]): BudgetAllocation
```

### 5. FacilitySystem (`src/lib/game-logic/facility-system.ts`)

**責任**: 施設建設・管理

```typescript
// 施設建設
async buildFacility(facilityType: string, location: string): Promise<BuildResult>

// アップグレード
async startUpgrade(facilityId: string): Promise<UpgradeResult>

// 効果計算
calculateFacilityEffects(): FacilityEffect[]
```

**施設カテゴリ**:
- `training`: 訓練施設（成功率+10%）
- `medical`: 医療施設（安全性+15%）  
- `research`: 研究施設（経験値+20%）
- `storage`: 保管施設（容量+50%）
- `accommodation`: 宿泊施設（疲労-25%）
- `security`: 警備施設（事故率-30%）
- `utility`: 公共施設（全体効率+5%）

### 6. TrainerSystem (`src/lib/game-logic/trainer-system.ts`)

**責任**: トレーナー育成管理

```typescript
// レベルアップ処理
static processLevelUp(trainer: Trainer, gainedExp: number): LevelUpResult

// 次レベル必要経験値計算
static getExpToNextLevel(currentLevel: number): number

// トレーナー生成
static generateTrainer(config: TrainerConfig): Trainer
```

**職業システム**:
- `ranger`: バランス型（標準給与）
- `breeder`: 繁殖専門（給与+10%、ポケモン関連+20%）
- `battler`: 戦闘専門（給与+20%、戦闘+25%）
- `researcher`: 研究者（給与+30%、経験値+15%）
- `medic`: 医療担当（給与+40%、安全性+20%）
- `economist`: 経済専門（給与+15%、収入+10%）
- `explorer`: 探索家（給与+20%、探索+30%）

### 7. SoundSystem (`src/lib/game-logic/sound-system.ts`)

**責任**: 音響効果管理

```typescript
// 効果音再生
playSFX(type: SoundType, intensity?: number): void

// BGM再生
playBGM(track: string): void

// イベント音再生
playExpeditionStartSound(): void
playLevelUpSound(): void
playPokemonCatchSound(): void
```

---

## 📡 API Reference

### GameController Events

```typescript
// 派遣完了イベント
gameController.on('expeditionComplete', (result: ExpeditionResult) => {
  // UI更新処理
})

// レベルアップイベント  
gameController.on('levelUp', (trainer: Trainer) => {
  // レベルアップ処理
})

// エラーイベント
gameController.on('error', (error: GameError) => {
  // エラーハンドリング
})
```

### REST API Endpoints

```typescript
// PokeAPI連携
GET /api/pokemon/{id}        # ポケモン詳細取得
GET /api/pokemon/species/{id} # 種族情報取得

// Supabase RPC
CALL get_user_progress()     # ユーザー進捗取得  
CALL update_expedition_log() # 派遣ログ更新
CALL calculate_rankings()    # ランキング計算
```

---

## 🧪 テスト

### テスト実行
```bash
# 全テスト実行
npm test

# ウォッチモード
npm run test:watch  

# カバレッジレポート
npm run test:coverage
```

### テストファイル構造
```
src/__tests__/
├── game-systems.test.ts    # 統合テスト
├── components/             # コンポーネントテスト
│   ├── ExpeditionCard.test.tsx
│   └── PokemonModal.test.tsx
└── utils/                  # ユーティリティテスト
    └── gameLogic.test.ts
```

### モックデータ
```typescript
// jest.setup.js
global.fetch = jest.fn() // PokeAPI
global.AudioContext = jest.fn() // Web Audio API
```

### テストカテゴリ
- **Unit Tests**: 個別システムの動作確認
- **Integration Tests**: システム間連携テスト  
- **E2E Tests**: エンドツーエンドユーザー体験
- **Performance Tests**: 負荷・応答速度測定

---

## 🚀 デプロイメント

### ビルド設定
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start", 
    "export": "next export",
    "analyze": "cross-env ANALYZE=true next build"
  }
}
```

### 環境別設定
```bash
# 開発環境
npm run dev

# ステージング環境  
npm run build && npm run start

# 本番環境
npm run build && npm run export
```

### Vercel デプロイ
```bash
# Vercel CLI使用
vercel --prod

# または GitHub Actions自動デプロイ
git push origin main
```

---

## 🔧 トラブルシューティング

### よくある問題

#### 1. PokeAPI接続エラー
```typescript
// 原因: レート制限またはネットワークエラー
// 解決: キャッシュ確認 + リトライ実装
```

#### 2. Web Audio API初期化失敗
```typescript
// 原因: ブラウザポリシー（ユーザーインタラクション必要）
// 解決: クリック後に初期化実行
```

#### 3. Supabase認証エラー
```typescript
// 原因: 環境変数設定ミス
// 解決: .env.localの確認
```

#### 4. テスト失敗
```bash
# Jest設定確認
npm run test -- --verbose

# キャッシュクリア
npm run test -- --clearCache
```

### デバッグ手法

#### 1. ゲームシステムデバッグ
```typescript
// GameControllerにデバッグモード追加
const gameController = new GameController({ debug: true })

// ログ出力
console.log('Expedition Result:', JSON.stringify(result, null, 2))
```

#### 2. パフォーマンス分析
```typescript
// React DevTools Profiler
// Performance API
performance.mark('expedition-start')
// 処理実行
performance.measure('expedition-time', 'expedition-start')
```

#### 3. ネットワーク監視
```typescript
// PokeAPI呼び出し追跡
console.log('PokeAPI Call:', url, response.status)
```

---

## 📚 参考資料

### 公式ドキュメント
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [PokeAPI Documentation](https://pokeapi.co/docs/v2)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

### 学習リソース
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### コミュニティ
- [Next.js GitHub Discussions](https://github.com/vercel/next.js/discussions)
- [Supabase Discord](https://discord.supabase.com/)

---

## 🤝 コントリビューション

### 開発フロー
1. Issue作成またはFeature Request
2. ブランチ作成 (`feature/feature-name`)
3. 実装・テスト追加
4. Pull Request作成
5. コードレビュー・マージ

### コーディング規約
- **TypeScript**: 厳密な型定義
- **ESLint**: コード品質チェック
- **Prettier**: コードフォーマット
- **Conventional Commits**: コミットメッセージ規約

### テスト要件
- 新機能には必ずテスト追加
- カバレッジ80%以上維持
- E2Eテストでユーザーストーリー確認

---

*🚀 Happy Coding! Let's build amazing games together!*