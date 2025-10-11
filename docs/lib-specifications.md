# ライブラリ仕様書

## 概要

Caglla Travel Managerのライブラリ（lib/）配下のユーティリティとヘルパー関数の仕様書です。TypeScriptで実装された再利用可能な機能を詳細に記載しています。

## ディレクトリ構成

```
lib/
├── api/           # API関連のヘルパー
├── contexts/      # React Context
├── core/          # コア機能
├── firebase/      # Firebase関連
├── storage/       # ストレージ関連
├── subscription/  # サブスクリプション関連
├── travel/        # 旅行関連のユーティリティ
└── utils/         # 汎用ユーティリティ
```

## 1. API関連 (lib/api/)

### Google Places API (lib/api/google/places.ts)

#### placesApiHelpers
Google Places APIとの連携を提供するヘルパー関数群

**主要メソッド:**

```typescript
// 場所を検索
async searchPlaces(query: string): Promise<PlaceSearchResult[]>

// 場所の詳細情報を取得
async getPlaceDetails(placeId: string): Promise<PlaceDetailsResult>

// 写真のURLを生成
getPhotoUrl(photoReference: string, maxWidth?: number): string

// 場所の種類を日本語に変換
getTypeLabel(type: string): string

// 価格レベルを日本語に変換
getPriceLevelLabel(priceLevel: number): string
```

**使用例:**
```typescript
import { placesApiHelpers } from '@/lib/api/google/places'

// 場所を検索
const results = await placesApiHelpers.searchPlaces('東京タワー')

// 詳細情報を取得
const details = await placesApiHelpers.getPlaceDetails('place_id')

// 写真URLを生成
const photoUrl = placesApiHelpers.getPhotoUrl('photo_reference', 400)
```

### Google Geocoding API (lib/api/google/geocoding.ts)

#### geocodingApiHelpers
住所と座標の相互変換を提供

**主要メソッド:**
```typescript
// 住所を座標に変換
async geocode(address: string): Promise<GeocodingResult[]>

// 座標を住所に変換
async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult[]>
```

### Google Distance API (lib/api/google/distance.ts)

#### distanceApiHelpers
距離・時間の計算を提供

**主要メソッド:**
```typescript
// 2点間の距離を計算
async calculateDistance(
  origins: string[],
  destinations: string[]
): Promise<DistanceMatrixResponse>

// バッチで距離を計算
async calculateDistanceBatch(
  requests: Array<{
    origins: string[]
    destinations: string[]
  }>
): Promise<DistanceMatrixResponse[]>
```

### Google Maps Loader (lib/api/google/maps-loader.ts)

#### loadGoogleMapsAPI
Google Maps APIの読み込みを管理

```typescript
async function loadGoogleMapsAPI(): Promise<void>
```

**機能:**
- APIキーの検証
- 重複読み込みの防止
- エラーハンドリング

### API ヘルパー (lib/api/helpers.ts)

#### makeAuthenticatedRequest
認証付きAPIリクエストのヘルパー

```typescript
async function makeAuthenticatedRequest(
  url: string,
  options?: RequestInit
): Promise<Response>
```

**機能:**
- Firebase IDトークンの自動付与
- エラーハンドリング
- リトライ機能

## 2. コア機能 (lib/core/)

### 型定義 (lib/core/types.ts)

#### 主要な型定義

```typescript
// ユーザー情報
interface User {
  id: string
  google_id: string
  name: string
  email: string
  slug?: string
  profile_image_url?: string
  preferences?: UserPreferences
  created_at: FirestoreDate
  updated_at: FirestoreDate
  planId: 'season_traveler' | 'backpacker' | 'globetrotter' | 'planner_pro' | 'enterprise'
  storageUsage?: StorageUsage
}

// 旅行情報
interface Trip {
  id: string
  user_id: string
  title: string
  slug?: string
  description?: string
  destination?: string
  destination_place_id?: string
  destination_place?: PlaceData
  start_date?: FirestoreDate
  end_date?: FirestoreDate
  status: string
  access_level: 'private' | 'public'
  image_url?: string
  created_at: FirestoreDate
  updated_at: FirestoreDate
  days?: Day[]
  creator?: User
}

// 旅程情報
interface Itinerary {
  id: string
  day_id: string
  sort_number: number
  title: string
  description?: string
  location?: string
  place_id?: string | null
  place_data?: PlaceData | null
  start_time?: string
  end_time?: string
  timezone?: string
  cost_amount?: number | null
  cost_currency?: string
  created_at: FirestoreDate
  updated_at: FirestoreDate
}

// 場所情報
interface PlaceData {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  address_components?: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>
  photos?: Array<{
    photo_reference: string
    height: number
    width: number
  }>
  rating?: number
  user_ratings_total?: number
  price_level?: number
  types?: string[]
  opening_hours?: {
    open_now: boolean
    weekday_text: string[]
  }
  international_phone_number?: string
  website?: string
  editorial_summary?: {
    overview: string
  }
}
```

### 環境変数検証 (lib/core/env-validation.ts)

#### validateClientEnvironment
クライアント側の環境変数を検証

```typescript
function validateClientEnvironment(): RequiredEnvVars
```

#### validateServerEnvironment
サーバー側の環境変数を検証

```typescript
function validateServerEnvironment(): RequiredEnvVars & OptionalEnvVars
```

**必要な環境変数:**
- `NEXT_PUBLIC_FIREBASE_*`: Firebase設定
- `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`: Google Places API
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps API
- `FIREBASE_PROJECT_ID`: Firebase Admin SDK
- `FIREBASE_CLIENT_EMAIL`: Firebase Admin SDK
- `FIREBASE_PRIVATE_KEY`: Firebase Admin SDK

### ロガー (lib/core/logger.ts)

#### logger
統一されたログ出力機能

```typescript
const logger = {
  debug: (message: string, data?: any) => void
  info: (message: string, data?: any) => void
  warn: (message: string, data?: any) => void
  error: (message: string, error?: any) => void
}
```

**使用例:**
```typescript
import logger from '@/lib/core/logger'

logger.debug('デバッグ情報', { userId: '123' })
logger.error('エラーが発生しました', error)
```

### エラーハンドラー (lib/core/error-handler.ts)

#### ErrorHandler
統一されたエラー処理

```typescript
class ErrorHandler {
  static handle(error: Error, context?: string): void
  static logError(error: Error, context?: string): void
  static formatError(error: Error): string
}
```

### Z-Index管理 (lib/core/z-index.ts)

#### getZIndexClass
Z-Indexクラスを取得

```typescript
function getZIndexClass(layer: ZIndexLayer): string
```

**利用可能なレイヤー:**
- `MAP`: 地図（最下層）
- `MAIN_CONTENT`: メインコンテンツ
- `LEFT_PANEL`: 左メニュー
- `TOP_MENU`: トップメニュー
- `POPUP_MENU`: ポップアップメニュー
- `FLOAT_MODAL`: モーダルダイアログ
- `USER_SETTINGS`: ユーザー設定ダイアログ

## 3. Firebase関連 (lib/firebase/)

### Firestore操作 (lib/firebase/firestore.ts)

#### COLLECTIONS
Firestoreコレクション名の定数

```typescript
export const COLLECTIONS = {
  USERS: 'users',
  TRIPS: 'trips',
  DAYS: 'days',
  ITINERARIES: 'itineraries',
  TRIP_USERS: 'trip_users',
  PLACES_CACHE: 'places_cache'
} as const
```

#### updateDay
日程の更新

```typescript
async function updateDay(dayId: string, updates: Partial<Day>): Promise<Day>
```

### Firebase Admin (lib/firebase/admin.ts)

#### adminAuth
Firebase Admin SDKの認証

```typescript
export const adminAuth = getAuth()
```

#### adminDb
Firebase Admin SDKのFirestore

```typescript
export const adminDb = getFirestore()
```

### Firebase Client (lib/firebase/client.ts)

#### clientApp
Firebaseクライアントアプリ

```typescript
export const clientApp = initializeApp(firebaseConfig)
```

### ストレージ (lib/firebase/storage.ts)

#### storageHelpers
Firebase Storageの操作

```typescript
export const storageHelpers = {
  uploadFile: (file: File, path: string) => Promise<string>
  deleteFile: (path: string) => Promise<void>
  getDownloadURL: (path: string) => Promise<string>
}
```

## 4. 旅行関連ユーティリティ (lib/travel/)

### ルート最適化 (lib/travel/route-optimization.ts)

#### RouteOptimizer
ルート最適化のメインクラス

```typescript
class RouteOptimizer {
  // デバウンス付きルート計算
  async calculateRouteDebounced(
    key: RouteCacheKey,
    directionsService: any,
    callback: (result: any, status: any) => void
  ): Promise<void>

  // サーバーサイド最適化
  async calculateRouteOptimized(
    request: RouteOptimizationRequest,
    callback: (result: RouteOptimizationResponse | null, status: string) => void
  ): Promise<void>

  // キャッシュのクリア
  clearCache(): void

  // キャッシュ統計の取得
  getCacheStats(): {
    size: number
    maxSize: number
    hitRate: number
  }
}
```

#### optimizeWaypoints
waypointの最適化

```typescript
async function optimizeWaypoints(
  waypoints: Array<string | { lat: number; lng: number }>,
  origin: string | { lat: number; lng: number },
  destination: string | { lat: number; lng: number },
  options: {
    travelMode?: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT'
    avoidHighways?: boolean
    avoidTolls?: boolean
    avoidFerries?: boolean
  } = {}
): Promise<{
  optimizedWaypoints: Array<string | { lat: number; lng: number }>
  optimizedOrder: number[]
  totalDistance: { meters: number; text: string }
  totalDuration: { seconds: number; text: string }
  costEstimate: { apiCalls: number; estimatedCost: number; currency: string }
} | null>
```

### 費用集計 (lib/travel/cost-aggregation.ts)

#### aggregateCostsByCurrency
通貨別の費用集計

```typescript
function aggregateCostsByCurrency(itineraries: Itinerary[]): TripCostSummary
```

#### formatMultipleCostSummaries
複数通貨の表示フォーマット

```typescript
function formatMultipleCostSummaries(costs: CostSummary[]): string
```

### 場所キャッシュ (lib/travel/places-cache.ts)

#### placesCacheHelpers
Places APIのキャッシュ管理

```typescript
export const placesCacheHelpers = {
  // キャッシュから場所情報を取得
  getCachedPlace: (placeId: string) => Promise<PlacesCache | null>
  
  // 場所情報をキャッシュに保存
  savePlaceToCache: (placeData: PlaceData) => Promise<void>
  
  // キャッシュの更新
  updateCacheAccess: (placeId: string) => Promise<void>
}
```

### スラッグヘルパー (lib/travel/slug-helpers.ts)

#### slugHelpers
スラッグ関連のヘルパー

```typescript
export const slugHelpers = {
  // 旅行用スラッグの生成
  generateTripSlug: (title: string, existingSlugs: string[]) => string
  
  // ユーザー用スラッグの生成
  generateUserSlug: (name: string, existingSlugs: string[]) => string
  
  // スラッグの検証
  validateSlug: (slug: string) => { isValid: boolean; error?: string }
}
```

## 5. ユーティリティ (lib/utils/)

### スラッグ生成 (lib/utils/slug.ts)

#### generateSlug
URL-safeなスラッグを生成

```typescript
function generateSlug(text: string): string
```

**機能:**
- 日本語のひらがな・カタカナをローマ字に変換
- 英数字以外をハイフンに変換
- 最大50文字に制限
- 空の場合はハッシュ文字列を生成

#### generateUniqueSlug
重複しないスラッグを生成

```typescript
function generateUniqueSlug(baseText: string, existingSlugs: string[]): string
```

### 通貨ユーティリティ (lib/utils/currency.ts)

#### currencyUtils
通貨関連のユーティリティ

```typescript
export const currencyUtils = {
  // 通貨コードから情報を取得
  getCurrencyInfo: (code: string) => CurrencyInfo | null
  
  // 金額をフォーマット
  formatAmount: (amount: number, currency: string) => string
  
  // 通貨の変換
  convertCurrency: (amount: number, from: string, to: string) => Promise<number>
}
```

### 日付ユーティリティ (lib/utils/date.ts)

#### dateUtils
日付関連のユーティリティ

```typescript
export const dateUtils = {
  // 日付のフォーマット
  formatDate: (date: Date, format?: string) => string
  
  // 日付の比較
  isSameDay: (date1: Date, date2: Date) => boolean
  
  // 日付の加算
  addDays: (date: Date, days: number) => Date
  
  // 日付の差分
  getDaysDifference: (date1: Date, date2: Date) => number
}
```

### タイムゾーンユーティリティ (lib/utils/timezone.ts)

#### timezoneUtils
タイムゾーン関連のユーティリティ

```typescript
export const timezoneUtils = {
  // 都市名からタイムゾーンを取得
  getTimezoneFromCity: (city: string) => string | null
  
  // タイムゾーンのオフセットを取得
  getTimezoneOffset: (timezone: string) => number
  
  // 日付をタイムゾーンで変換
  convertToTimezone: (date: Date, timezone: string) => Date
}
```

### ブラウザユーティリティ (lib/utils/browser.ts)

#### browserUtils
ブラウザ関連のユーティリティ

```typescript
export const browserUtils = {
  // ブラウザ情報を取得
  getBrowserInfo: () => BrowserInfo
  
  // ローカルストレージの操作
  setLocalStorage: (key: string, value: any) => void
  getLocalStorage: (key: string) => any
  
  // クッキーの操作
  setCookie: (name: string, value: string, days: number) => void
  getCookie: (name: string) => string | null
}
```

## 6. サブスクリプション関連 (lib/subscription/)

### プラン制限 (lib/subscription/plan-limits.ts)

#### PlanLimitChecker
プラン制限のチェック

```typescript
class PlanLimitChecker {
  // 旅行データ数の制限チェック
  static checkTravelCountLimit(plan: SubscriptionPlan, currentTravelCount: number): LimitCheckResult
  
  // 旅行日数の制限チェック
  static checkTravelDaysLimit(plan: SubscriptionPlan, totalTravelDays: number): LimitCheckResult
  
  // ストレージ容量の制限チェック
  static checkStorageLimit(plan: SubscriptionPlan, storageUsedGB: number): LimitCheckResult
  
  // 写真アップロード数の制限チェック
  static checkPhotosLimit(plan: SubscriptionPlan, photosPerTrip: number): LimitCheckResult
  
  // 複数の制限を一括チェック
  static checkAllLimits(plan: SubscriptionPlan, usage: UsageStats): {
    travelCount: LimitCheckResult
    travelDays: LimitCheckResult
    storage: LimitCheckResult
    photos: LimitCheckResult
    hasAnyLimitExceeded: boolean
  }
}
```

### 支払いサービス (lib/subscription/payment-service.ts)

#### PaymentService
支払い処理のサービス

```typescript
class PaymentService {
  // プランの取得
  async getPlans(): Promise<SubscriptionPlan[]>
  
  // プランの変更
  async changePlan(planId: string): Promise<void>
  
  // 支払い履歴の取得
  async getPaymentHistory(): Promise<PaymentHistory[]>
  
  // 支払いの実行
  async processPayment(amount: number, currency: string): Promise<PaymentResult>
}
```

## 7. ストレージ関連 (lib/storage/)

### 画像アップロード (lib/storage/image-upload.ts)

#### imageUploadHelpers
画像アップロードのヘルパー

```typescript
export const imageUploadHelpers = {
  // 画像をアップロード
  uploadImage: (file: File, path: string) => Promise<string>
  
  // 画像を削除
  deleteImage: (url: string) => Promise<void>
  
  // 画像のリサイズ
  resizeImage: (file: File, maxWidth: number, maxHeight: number) => Promise<File>
  
  // 画像の圧縮
  compressImage: (file: File, quality: number) => Promise<File>
}
```

## 8. React Context (lib/contexts/)

### 認証コンテキスト (lib/contexts/auth.tsx)

#### AuthContext
認証状態の管理

```typescript
interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

export const AuthProvider: React.FC<{ children: React.ReactNode }>
export const useAuth: () => AuthContextType
```

### ユーザーデータコンテキスト (lib/contexts/user-data.tsx)

#### UserDataContext
ユーザーデータの管理

```typescript
interface UserDataContextType {
  user: User | null
  trips: Trip[]
  loading: boolean
  refreshUser: () => Promise<void>
  refreshTrips: () => Promise<void>
}

export const UserDataProvider: React.FC<{ children: React.ReactNode }>
export const useUserData: () => UserDataContextType
```

### サブスクリプションコンテキスト (lib/contexts/subscription.tsx)

#### SubscriptionContext
サブスクリプション状態の管理

```typescript
interface SubscriptionContextType {
  plan: SubscriptionPlan | null
  usage: UsageStats | null
  loading: boolean
  canUseRouteOptimization: boolean
  checkPlanLimits: (usage: UsageStats) => boolean
  upgradePlan: (planId: string) => Promise<void>
}

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }>
export const useSubscription: () => SubscriptionContextType
```

## 使用例

### 基本的な使用例

```typescript
import { placesApiHelpers } from '@/lib/api/google/places'
import { generateSlug } from '@/lib/utils/slug'
import { dateUtils } from '@/lib/utils/date'
import { PlanLimitChecker } from '@/lib/subscription/plan-limits'

// 場所を検索
const places = await placesApiHelpers.searchPlaces('東京タワー')

// スラッグを生成
const slug = generateSlug('東京旅行')

// 日付をフォーマット
const formattedDate = dateUtils.formatDate(new Date(), 'YYYY-MM-DD')

// プラン制限をチェック
const limitCheck = PlanLimitChecker.checkTravelCountLimit(plan, 5)
```

### エラーハンドリング

```typescript
import logger from '@/lib/core/logger'
import { ErrorHandler } from '@/lib/core/error-handler'

try {
  const result = await someAsyncOperation()
} catch (error) {
  logger.error('操作に失敗しました', error)
  ErrorHandler.handle(error, 'someAsyncOperation')
}
```

### 環境変数の検証

```typescript
import { validateClientEnvironment } from '@/lib/core/env-validation'

try {
  const env = validateClientEnvironment()
  const apiKey = env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
} catch (error) {
  console.error('環境変数の設定が不正です:', error)
}
```