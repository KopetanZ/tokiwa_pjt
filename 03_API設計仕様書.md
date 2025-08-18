# API設計仕様書
**トキワシティ訓練所**

---

## 1. API概要

### 1.1 技術仕様
- **プラットフォーム**: Vercel Functions
- **ランタイム**: Edge Runtime (軽量処理) + Node.js Runtime (重処理)
- **認証**: Supabase Auth + JWT
- **データベース**: Supabase (PostgreSQL)
- **外部API**: PokeAPI
- **リアルタイム**: Supabase Realtime + Server-Sent Events

### 1.2 API設計原則
- **RESTful**: 標準的なHTTPメソッドとステータスコード
- **統一レスポンス**: 一貫したJSON構造
- **エラーハンドリング**: 詳細なエラー情報とログ
- **キャッシュ戦略**: 適切なCache-Control設定
- **レート制限**: DDoS防止とリソース保護

### 1.3 ベースURL構成
```
https://tokiwa-trainer-school.vercel.app/api/v1/
├── auth/          # 認証関連
├── users/         # ユーザー管理
├── trainers/      # トレーナー管理
├── pokemon/       # ポケモン管理
├── expeditions/   # 派遣システム
├── facilities/    # 施設管理
├── economy/       # 経済管理
├── interventions/ # リアルタイム介入
├── notifications/ # 通知システム
├── assets/        # ドット絵アセット配信
└── external/      # 外部API連携
```

---

## 2. 認証・ユーザー管理API

### 2.1 認証API

#### POST /api/v1/auth/guest-login
ゲストユーザーでのログイン
```typescript
// Request
interface GuestLoginRequest {
  guestName: string;    // 3-20文字
  schoolName: string;   // 3-50文字
  uiTheme?: string;     // デフォルト: 'retro_red'
}

// Response
interface GuestLoginResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      guestName: string;
      schoolName: string;
      currentMoney: number;
      totalReputation: number;
      uiTheme: string;
      createdAt: string;
    };
    session: {
      accessToken: string;
      refreshToken: string;
      expiresAt: string;
    };
  };
}
```

#### POST /api/v1/auth/refresh
トークンのリフレッシュ
```typescript
// Request
interface RefreshTokenRequest {
  refreshToken: string;
}

// Response (同じくGuestLoginResponse型)
```

### 2.2 ユーザー管理API

#### GET /api/v1/users/profile
現在のユーザー情報取得
```typescript
// Response
interface UserProfileResponse {
  success: boolean;
  data: {
    id: string;
    guestName: string;
    schoolName: string;
    currentMoney: number;
    totalReputation: number;
    uiTheme: string;
    settings: Record<string, any>;
    statistics: {
      totalExpeditions: number;
      successfulExpeditions: number;
      totalPokemonCaught: number;
      activeTrainers: number;
      schoolLevel: number;
    };
  };
}
```

#### PATCH /api/v1/users/profile
ユーザー情報更新
```typescript
// Request
interface UpdateUserRequest {
  guestName?: string;
  schoolName?: string;
  uiTheme?: string;
  settings?: Record<string, any>;
}
```

---

## 3. トレーナー管理API

### 3.1 トレーナー一覧・詳細

#### GET /api/v1/trainers
トレーナー一覧取得
```typescript
// Query Parameters
interface TrainersListQuery {
  status?: 'available' | 'on_expedition' | 'injured' | 'training';
  jobId?: number;
  limit?: number;
  offset?: number;
}

// Response
interface TrainersListResponse {
  success: boolean;
  data: {
    trainers: TrainerSummary[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

interface TrainerSummary {
  id: string;
  name: string;
  job: {
    id: number;
    name: string;
    nameJa: string;
    level: number;
    experience: number;
  };
  status: string;
  party: {
    pokemonCount: number;
    totalLevel: number;
    averageLevel: number;
  };
  spritePath: string;
}
```

#### GET /api/v1/trainers/{trainerId}
トレーナー詳細取得
```typescript
// Response
interface TrainerDetailResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    job: {
      id: number;
      name: string;
      nameJa: string;
      level: number;
      experience: number;
      nextLevelExp: number;
      specializations: Record<string, number>;
    };
    preferences: Record<string, number>; // バイアス値
    complianceRate: number;
    trustLevel: number;
    personality: string;
    status: string;
    salary: number;
    totalEarned: number;
    party: PokemonInstance[];
    currentExpedition?: ExpeditionSummary;
    statistics: {
      expeditionsCompleted: number;
      successRate: number;
      pokemonCaught: number;
      totalEarnings: number;
    };
    spritePath: string;
  };
}
```

### 3.2 トレーナー管理

#### POST /api/v1/trainers
新しいトレーナーを雇用
```typescript
// Request
interface HireTrainerRequest {
  name: string;
  jobId: number;
  initialSalary?: number;
}

// Response: TrainerDetailResponse
```

#### PATCH /api/v1/trainers/{trainerId}
トレーナー情報更新
```typescript
// Request
interface UpdateTrainerRequest {
  name?: string;
  salary?: number;
  preferences?: Record<string, number>;
}
```

#### POST /api/v1/trainers/{trainerId}/advice
トレーナーにアドバイスを送信
```typescript
// Request
interface GiveAdviceRequest {
  adviceType: 'immediate' | 'persistent';
  category: 'party_composition' | 'battle_strategy' | 'exploration_focus';
  advice: {
    priority: string;
    modifier: number; // -15 ~ +15
    duration?: number; // persistentの場合
  };
  message?: string; // プレイヤーメッセージ
}

// Response
interface AdviceResponse {
  success: boolean;
  data: {
    accepted: boolean;
    complianceRate: number;
    trustLevelChange: number;
    estimatedEffect: string;
  };
}
```

---

## 4. ポケモン管理API

### 4.1 ポケモン検索・管理

#### GET /api/v1/pokemon/species
ポケモン種族一覧
```typescript
// Query Parameters
interface PokemonSpeciesQuery {
  search?: string;        // 名前検索
  types?: string[];       // タイプフィルター
  rarityTier?: number;    // レア度フィルター
  generation?: string;    // 世代フィルター
  limit?: number;
  offset?: number;
}

// Response
interface PokemonSpeciesResponse {
  success: boolean;
  data: {
    species: PokemonSpecies[];
    pagination: PaginationInfo;
  };
}

interface PokemonSpecies {
  id: number;
  name: string;
  nameJa: string;
  types: string[];
  baseStats: Record<string, number>;
  height: number;
  weight: number;
  catchRate: number;
  rarityTier: number;
  sprites: {
    front: string;
    back: string;
    icon: string;
    retro: string;
  };
}
```

#### GET /api/v1/pokemon/instances
ユーザーの所持ポケモン一覧
```typescript
// Query Parameters
interface PokemonInstancesQuery {
  trainerId?: string;     // 特定トレーナーのポケモン
  speciesId?: number;     // 特定種族
  inParty?: boolean;      // パーティ所属のみ
  minLevel?: number;
  maxLevel?: number;
  status?: string;        // 状態フィルター
  limit?: number;
  offset?: number;
}

// Response
interface PokemonInstancesResponse {
  success: boolean;
  data: {
    pokemon: PokemonInstance[];
    pagination: PaginationInfo;
  };
}

interface PokemonInstance {
  id: string;
  species: PokemonSpecies;
  nickname?: string;
  level: number;
  experience: number;
  nextLevelExp: number;
  individualValues: Record<string, number>;
  currentHp: number;
  maxHp: number;
  statusCondition: string;
  partyPosition?: number;
  moves: Move[];
  caughtAt: string;
  caughtLocation: string;
  caughtByTrainer: TrainerSummary;
}
```

### 4.2 パーティ管理

#### PATCH /api/v1/trainers/{trainerId}/party
パーティ編成変更
```typescript
// Request
interface UpdatePartyRequest {
  party: {
    position: number; // 1-6
    pokemonId: string | null; // nullで空にする
  }[];
}

// Response
interface UpdatePartyResponse {
  success: boolean;
  data: {
    updatedParty: PokemonInstance[];
    partyStats: {
      totalLevel: number;
      averageLevel: number;
      typeBalance: Record<string, number>;
      totalCp: number; // 戦闘力
    };
  };
}
```

---

## 5. 派遣システムAPI

### 5.1 派遣先・派遣管理

#### GET /api/v1/expeditions/locations
派遣先一覧
```typescript
// Query Parameters
interface ExpeditionLocationsQuery {
  region?: string;
  distanceLevel?: number;
  unlocked?: boolean;
  search?: string;
}

// Response
interface ExpeditionLocationsResponse {
  success: boolean;
  data: {
    locations: ExpeditionLocation[];
  };
}

interface ExpeditionLocation {
  id: number;
  locationName: string;
  locationNameJa: string;
  region: string;
  distanceLevel: number;
  travelCost: number;
  travelTimeHours: number;
  riskLevel: number;
  baseRewardMoney: number;
  rewardMultiplier: number;
  encounterSpecies: number[];
  backgroundImage: string;
  mapIcon: string;
  isUnlocked: boolean;
  unlockRequirements?: Record<string, any>;
}
```

#### POST /api/v1/expeditions
新しい派遣を開始
```typescript
// Request
interface StartExpeditionRequest {
  trainerId: string;
  locationId: number;
  expeditionMode: 'exploration' | 'safe' | 'aggressive' | 'balanced';
  targetDurationHours: number;
  adviceGiven?: {
    category: string;
    priority: string;
    message?: string;
  }[];
}

// Response
interface StartExpeditionResponse {
  success: boolean;
  data: {
    expedition: {
      id: string;
      trainerId: string;
      locationId: number;
      status: string;
      startedAt: string;
      expectedReturn: string;
      estimatedResults: {
        successProbability: number;
        expectedMoney: number;
        expectedExp: number;
        riskFactors: string[];
      };
    };
  };
}
```

#### GET /api/v1/expeditions/{expeditionId}
派遣詳細取得
```typescript
// Response
interface ExpeditionDetailResponse {
  success: boolean;
  data: {
    id: string;
    trainer: TrainerSummary;
    location: ExpeditionLocation;
    expeditionMode: string;
    targetDurationHours: number;
    status: string;
    startedAt: string;
    expectedReturn: string;
    actualReturn?: string;
    currentProgress: number; // 0.0-1.0
    interventionOpportunities: InterventionEvent[];
    interventionResponses: Record<string, any>;
    resultSummary?: ExpeditionResult;
    liveUpdates: ExpeditionUpdate[];
  };
}

interface ExpeditionResult {
  money: number;
  experience: number;
  pokemonCaught: PokemonInstance[];
  items: Item[];
  successRate: number;
  eventsSummary: string[];
}
```

### 5.2 進行中派遣管理

#### GET /api/v1/expeditions/active
進行中の派遣一覧
```typescript
// Response
interface ActiveExpeditionsResponse {
  success: boolean;
  data: {
    expeditions: ExpeditionSummary[];
  };
}

interface ExpeditionSummary {
  id: string;
  trainer: TrainerSummary;
  location: ExpeditionLocation;
  status: string;
  currentProgress: number;
  expectedReturn: string;
  hasInterventionRequired: boolean;
  estimatedReward: number;
}
```

#### POST /api/v1/expeditions/{expeditionId}/recall
派遣の緊急呼び戻し
```typescript
// Request
interface RecallExpeditionRequest {
  reason?: string;
  emergencyLevel: 'low' | 'medium' | 'high';
}

// Response
interface RecallExpeditionResponse {
  success: boolean;
  data: {
    recallCost: number;
    estimatedReturnTime: string;
    partialResults?: Partial<ExpeditionResult>;
  };
}
```

---

## 6. リアルタイム介入API

### 6.1 介入イベント管理

#### GET /api/v1/interventions/pending
対応待ち介入イベント一覧
```typescript
// Response
interface PendingInterventionsResponse {
  success: boolean;
  data: {
    interventions: InterventionEvent[];
  };
}

interface InterventionEvent {
  id: string;
  expeditionId: string;
  eventType: string;
  eventData: Record<string, any>;
  choices: InterventionChoice[];
  status: string;
  responseDeadline: string;
  timeRemaining: number; // 秒
}

interface InterventionChoice {
  id: number;
  text: string;
  description?: string;
  risk: 'low' | 'medium' | 'high';
  expectedOutcome: {
    money?: number;
    experience?: number;
    pokemonChance?: number;
    injuryRisk?: number;
  };
}
```

#### POST /api/v1/interventions/{interventionId}/respond
介入イベントへの回答
```typescript
// Request
interface InterventionResponseRequest {
  choiceId: number;
  additionalData?: Record<string, any>;
}

// Response
interface InterventionResponseResponse {
  success: boolean;
  data: {
    outcome: {
      immediate: Record<string, any>;
      expeditionImpact: {
        progressChange: number;
        riskChange: number;
        rewardChange: number;
      };
    };
    nextEvents?: InterventionEvent[];
  };
}
```

### 6.2 リアルタイム通信

#### GET /api/v1/realtime/events (Server-Sent Events)
リアルタイムイベントストリーム
```typescript
// Event Types
interface RealtimeEvent {
  type: 'expedition_progress' | 'intervention_required' | 'expedition_complete' | 'notification';
  data: Record<string, any>;
  timestamp: string;
}

// Usage Example (Client)
const eventSource = new EventSource('/api/v1/realtime/events');
eventSource.addEventListener('intervention_required', (event) => {
  const data = JSON.parse(event.data);
  showInterventionDialog(data);
});
```

---

## 7. 施設・経済管理API

### 7.1 施設管理

#### GET /api/v1/facilities
施設一覧取得
```typescript
// Response
interface FacilitiesResponse {
  success: boolean;
  data: {
    facilities: Facility[];
    totalMaintenanceCost: number;
    nextMaintenanceDate: string;
  };
}

interface Facility {
  id: string;
  facilityType: string;
  level: number;
  maxLevel: number;
  effects: Record<string, number>;
  maintenanceCost: number;
  status: string;
  spritePath: string;
  upgradeOptions?: {
    cost: number;
    timeHours: number;
    newEffects: Record<string, number>;
  };
}
```

#### POST /api/v1/facilities/{facilityId}/upgrade
施設アップグレード
```typescript
// Request
interface UpgradeFacilityRequest {
  confirmCost: number; // 確認用
}

// Response
interface UpgradeFacilityResponse {
  success: boolean;
  data: {
    facility: Facility;
    constructionTime: number;
    totalCost: number;
    newEffects: Record<string, number>;
  };
}
```

### 7.2 経済管理

#### GET /api/v1/economy/summary
経済サマリー取得
```typescript
// Response
interface EconomySummaryResponse {
  success: boolean;
  data: {
    currentBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    netIncome: number;
    breakdown: {
      expeditionRewards: number;
      facilityMaintenance: number;
      trainerSalaries: number;
      upgradeCosts: number;
      other: number;
    };
    projectedBalance: number; // 来月予測
    recommendations: string[];
  };
}
```

#### GET /api/v1/economy/transactions
取引履歴取得
```typescript
// Query Parameters
interface TransactionsQuery {
  transactionType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// Response
interface TransactionsResponse {
  success: boolean;
  data: {
    transactions: EconomicTransaction[];
    summary: {
      totalIncome: number;
      totalExpenses: number;
      netChange: number;
    };
    pagination: PaginationInfo;
  };
}

interface EconomicTransaction {
  id: string;
  transactionType: string;
  amount: number;
  description: string;
  balanceAfter: number;
  transactionDate: string;
  relatedEntity?: {
    type: string;
    id: string;
    name: string;
  };
}
```

---

## 8. ドット絵アセット配信API

### 8.1 アセット管理

#### GET /api/v1/assets/pokemon/{speciesId}
ポケモンスプライト取得
```typescript
// Query Parameters
interface PokemonAssetQuery {
  style?: 'front' | 'back' | 'icon' | 'retro';
  generation?: 'gen1' | 'gen2' | 'custom';
  format?: 'png' | 'gif';
}

// Response: 直接画像ファイル or JSON
interface PokemonAssetResponse {
  success: boolean;
  data: {
    sprites: {
      front: string;
      back: string;
      icon: string;
      retro: string;
    };
    metadata: {
      dimensions: string;
      palette: string;
      generation: string;
    };
  };
}
```

#### GET /api/v1/assets/trainers/{jobId}
トレーナースプライト取得
```typescript
// Response
interface TrainerAssetResponse {
  success: boolean;
  data: {
    sprites: {
      idle: string;
      walking: string;
      victory: string;
    };
    animations?: {
      idle: string; // GIF
      walking: string;
    };
  };
}
```

### 8.2 アセットキャッシュ管理

#### POST /api/v1/assets/preload
アセットプリロード
```typescript
// Request
interface PreloadAssetsRequest {
  assetTypes: ('pokemon' | 'trainers' | 'facilities' | 'ui')[];
  priority: 'high' | 'medium' | 'low';
}

// Response
interface PreloadAssetsResponse {
  success: boolean;
  data: {
    cacheUrls: string[];
    totalSize: number;
    estimatedLoadTime: number;
  };
}
```

---

## 9. 外部API連携

### 9.1 PokeAPI連携

#### POST /api/v1/external/pokemon/sync
PokeAPIからデータ同期
```typescript
// Request
interface SyncPokemonRequest {
  speciesIds?: number[]; // 指定された種族のみ同期
  forceUpdate?: boolean;
  batchSize?: number;
}

// Response
interface SyncPokemonResponse {
  success: boolean;
  data: {
    synced: number;
    skipped: number;
    errors: number;
    syncedSpecies: number[];
    syncDuration: number;
  };
}
```

#### GET /api/v1/external/pokemon/search/{query}
PokeAPI検索プロキシ
```typescript
// Response
interface PokemonSearchResponse {
  success: boolean;
  data: {
    results: {
      id: number;
      name: string;
      nameJa: string;
      types: string[];
      sprite: string;
    }[];
    cached: boolean;
    source: 'local' | 'pokeapi';
  };
}
```

---

## 10. エラーハンドリング・共通仕様

### 10.1 統一レスポンス形式

#### 成功レスポンス
```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}
```

#### エラーレスポンス
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;           // 'INVALID_TRAINER_ID'
    message: string;        // ユーザー向けメッセージ
    details?: any;          // 詳細情報
    timestamp: string;
    requestId: string;
  };
}

// 標準HTTPステータスコード
// 200: 成功
// 201: 作成成功
// 400: バリデーションエラー
// 401: 認証エラー
// 403: 認可エラー
// 404: リソース見つからず
// 409: 競合エラー
// 429: レート制限
// 500: サーバーエラー
```

### 10.2 バリデーション

#### リクエストバリデーション
```typescript
// 共通バリデーションルール
interface ValidationRules {
  trainerName: string;      // 3-20文字、英数字+一部記号
  schoolName: string;       // 3-50文字
  money: number;            // 0以上
  level: number;            // 1-100
  expeditionDuration: number; // 1-72時間
}

// バリデーションエラーレスポンス
interface ValidationErrorResponse extends ErrorResponse {
  error: {
    code: 'VALIDATION_ERROR';
    message: string;
    details: {
      field: string;
      rule: string;
      value: any;
    }[];
  };
}
```

### 10.3 レート制限

```typescript
// レート制限設定
interface RateLimits {
  '/api/v1/auth/*': '10 req/min';
  '/api/v1/expeditions/start': '5 req/min';
  '/api/v1/interventions/respond': '30 req/min';
  '/api/v1/assets/*': '100 req/min';
  'default': '60 req/min';
}

// レート制限ヘッダー
// X-RateLimit-Limit: 60
// X-RateLimit-Remaining: 45
// X-RateLimit-Reset: 1640995200
```

---

## 11. セキュリティ仕様

### 11.1 認証・認可
```typescript
// JWT Payload
interface JWTPayload {
  sub: string;              // user.id
  iat: number;              // issued at
  exp: number;              // expires at
  aud: string;              // audience
  iss: string;              // issuer
  role: 'guest' | 'admin';
  metadata: {
    schoolName: string;
    guestName: string;
  };
}

// APIキー（管理機能用）
// Authorization: Bearer <jwt_token>
// X-API-Key: <admin_api_key> (管理機能のみ)
```

### 11.2 CORS設定
```typescript
// CORS設定
const corsConfig = {
  origin: [
    'https://tokiwa-trainer-school.vercel.app',
    'http://localhost:3000' // 開発環境
  ],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
```

---

## 12. パフォーマンス・モニタリング

### 12.1 キャッシュ戦略
```typescript
// Cache-Control設定
interface CacheStrategy {
  '/api/v1/pokemon/species': 'public, max-age=3600';    // 1時間
  '/api/v1/assets/*': 'public, max-age=86400';          // 24時間
  '/api/v1/expeditions/locations': 'public, max-age=1800'; // 30分
  '/api/v1/users/profile': 'private, max-age=300';       // 5分
  '/api/v1/interventions/*': 'no-cache';                 // キャッシュなし
}
```

### 12.2 ログ・メトリクス
```typescript
// ログ形式
interface APILog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  endpoint: string;
  method: string;
  userId?: string;
  responseTime: number;
  statusCode: number;
  userAgent?: string;
  ip?: string;
  requestId: string;
  error?: {
    message: string;
    stack?: string;
  };
}
```