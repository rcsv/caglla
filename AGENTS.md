# AGENTS.md

This repository, **Caglla Travel Manager**, is a Node.js + TypeScript web application designed to manage personal travel itineraries. It is inspired by the features of [tabi4.me](https://tabi4.me) and serves as its GitHub-hosted replica.

---

## 🧭 Purpose

This project aims to support the creation, editing, and sharing of travel plans. Users can log in using Google accounts and manage their travel data, including trips, itineraries, and detailed activities like lodging, flights, dining, and more.

---

## 📁 Directory Structure (Simplified)

| Path                  | Purpose                                                |
|-----------------------|--------------------------------------------------------|
| `app/`                | Next.js App Router (pages and API routes)             |
| `app/api/`            | API route handlers (REST API endpoints)               |
| `components/`         | React components                                       |
| `lib/`                | Utilities, configurations, and shared logic          |
| `docs/`               | Documentation and guides                               |
| `public/`             | Static assets                                          |

### 📚 Important Documentation

- **スラッグ生成仕様**: `docs/slug-generation-specification.md` - URL生成のためのスラッグシステムの詳細仕様
- **SVGアイコンガイドライン**: `components/common/icons/AGENTS.md` - SVGアイコンの作成・使用・管理に関する包括的なガイドライン
- **i18n多言語対応仕様**: `docs/specifications/i18n-specification.md` - Google Places API多言語対応の詳細仕様
- **i18n実装チェックリスト**: `docs/specifications/i18n-implementation-checklist.md` - 多言語対応の実装タスク管理
- **リリースノート**: `docs/releases/` - 各バージョンのリリースノートとロードマップ

### 🚀 Release Roadmap

#### **v1.7.0** ✅ Released (2024-12-19)
- **予約情報管理機能**: ReservationInfoModal、TripReservationDisplay
- **Iconify統合**: 絵文字からSVGアイコンへの刷新
- **日付入力UX改善**: 自動設定・バリデーション
- **リリースノート**: `docs/releases/v1.7.0.md`

#### **v1.7.2** ✅ Released (2024-12-19)
- **予約情報表示改善**: 航空チケット風デザイン、vicinity対応ほか
- **リリースノート**: `docs/releases/v1.7.2.md`

#### **v1.8.0** ✅ Released (2025-10-19)
- **バージョニング方針の策定**: SemVer準拠の詳細仕様
- **リリースロードマップ再編**: 新しいバージョン体系への移行
- **ドキュメント整備**: versioning.md、リリースノート更新
- **リリースノート**: `docs/releases/v1.8.0.md`

#### **v1.9.0** 🌍 Planned
- **Google Places API 多言語対応**: 9言語でのPlaces情報取得・表示
- **言語別キャッシュシステム**: 複合キー方式での効率的なキャッシュ管理
- **ユーザー言語設定**: 言語選択・自動検出機能
- **リリースノート**: `docs/releases/v1.9.0.md`

#### **v1.10.0** 🔍 Planned
- **検索・フィルタリング**: 予約情報の検索・絞り込み機能
- **エクスポート機能**: PDF、CSV、JSON、iCal形式でのエクスポート
- **リリースノート**: `docs/releases/v1.10.0.md`

#### **v1.11.0** 🔔 Planned
- **予約リマインダー**: 出発前のスマート通知機能
- **予約共有**: 旅行メンバーとの予約情報共有
- **予約テンプレート**: よく使う予約情報のテンプレート化
- **リリースノート**: `docs/releases/v1.11.0.md`

---

---

## 🎨 UI Design Guidelines

### Multi-language Support & Icon-First Design
- **アイコン優先**: UIは多言語化した際に編集箇所が少なくなるよう、ラベルに相当する文字はなるべく採用せずアイコンのみで表現することを最優先で検討する
- **SVGアイコン**: アイコンはカラフルなものを使用するとUI全体がゴテゴテするので、SVGでスッキリさせる
- **一貫性**: 同じ機能には同じアイコンを使用し、ユーザーの学習コストを下げる

### Development Workflow
- **テスト完了までローカル保持**: 大幅な編集をした際は、remoteにpushせずテストが完了するまでローカルに留める
- **段階的デプロイ**: 小さな変更を積み重ねて安定性を確保する

---

## 🔐 Authentication

- Firebase Authentication with Google OAuth is used for login.
- User profile information is stored in Firestore `users` collection.
- No local password handling is implemented (Firebase Auth only).

---

## 🗃️ Data Model (Simplified)

Entities and their relationships are stored in Firebase Firestore collections:

- `users` — user identity (Firebase Auth-based)
- `trips` — each travel plan (one-to-many with users)
- `days` — daily schedules within a trip
- `itineraries` — detailed scheduled events linked to a day
- `places` — location data with Google Places integration

_Note: This is a Next.js + Firebase application, not a traditional MySQL-based system._

---

## 💡 Agent Instructions (Codex, Copilot, etc.)

### When adding a new REST endpoint:
- Define the route in `app/api/` using Next.js App Router.
- Add handler logic directly in the route file.
- If Firestore access is needed, use existing Firestore helpers in `lib/firestore.ts`.

### When creating new data structures:
- Define TypeScript interfaces in `lib/core/types.ts`.
- Use Firestore collections instead of SQL tables.
- Follow Firestore best practices for data modeling.

### For data migrations:
- Use Firestore Admin SDK for bulk operations.
- Create migration scripts in `app/api/migrate/` if needed.
- Test migrations in development environment first.

### Naming Conventions:
- Firestore document fields use `camelCase`.
- Document IDs should be descriptive and unique.
- Collection names use plural forms (e.g., `users`, `trips`, `days`).

### Slug Generation System:
- **ALWAYS** use the centralized slug generation system in `lib/slug-utils.ts`
- **NEVER** implement custom slug generation logic
- Use `generateSlug()` for basic slug generation
- Use `generateUniqueSlug()` for unique slug generation with duplicate handling
- **ALWAYS** handle Japanese characters (kanji-only strings generate hash-based slugs)
- **ALWAYS** use slug-based URLs for new features: `/[userSlug]/[tripSlug]`
- **NEVER** use ID-based URLs for new features: `/trip/[id]` (legacy only)

**Slug Generation Examples:**
```typescript
// ✅ Correct
import { generateSlug, generateUniqueSlug } from '@/lib/slug-utils'
const slug = generateSlug('Tokyo') // 'tokyo'
const slug = generateSlug('長野市') // '024319ab' (hash fallback)
const uniqueSlug = generateUniqueSlug('Tokyo', existingSlugs)

// ❌ Wrong
const customSlug = text.toLowerCase().replace(/\s+/g, '-') // Custom logic
const idBasedUrl = `/trip/${tripId}` // ID-based URL
```

### Z-Index Layer Management System:
- **ALWAYS** use the centralized z-index management system defined in `app/globals.css`
- **NEVER** use hardcoded z-index values like `z-[9999]` or `z-50`
- **NEVER** use Tailwind CSS's `getZIndexClass()` function as it has compatibility issues
- Use predefined CSS classes from `globals.css` for consistent z-index management

**Available Z-Index Classes:**
- `.zidx-map` (0): 地図（最下層）
- `.zidx-main` (100): メインコンテンツ
- `.zidx-main-content` (150): メインコンテンツ詳細
- `.zidx-left-panel` (200): 左メニュー
- `.zidx-left-panel-content` (250): 左メニュー詳細
- `.zidx-map-button` (300): マップボタン
- `.zidx-map-overlay` (350): マップオーバーレイ
- `.zidx-top-menu` (400): トップメニュー
- `.zidx-top-menu-content` (450): トップメニュー詳細
- `.zidx-popup-menu` (500): ポップアップメニュー
- `.zidx-popup-menu-content` (550): ポップアップメニュー詳細
- `.zidx-float-modal` (600): モーダルダイアログ
- `.zidx-float-modal-content` (650): モーダルダイアログ詳細
- `.zidx-dialog-popup` (700): ダイアログ内ポップアップ
- `.zidx-dialog-overlay` (750): ダイアログ内オーバーレイ
- `.zidx-user-settings` (800): ユーザー設定ダイアログ
- `.zidx-user-settings-content` (850): ユーザー設定ダイアログ詳細

**Usage Examples:**
```typescript
// ✅ Correct - globals.cssのz-indexクラスを使用
<div className="zidx-popup-menu">ポップアップメニュー</div>
<div className="zidx-float-modal">モーダルダイアログ</div>
<div className="zidx-top-menu-content">トップメニューコンテンツ</div>

// ❌ Wrong - Tailwind CSSのz-index戦略
const menuClass = getZIndexClass('POPUP_MENU') // 廃止された関数
const menuClass = 'z-[9999]' // ハードコードされた値
```

### Environment Variable Management System:
- **ALWAYS** use the centralized environment validation in `lib/env-validation.ts`
- **NEVER** access `process.env` directly without validation
- Use `validateClientEnvironment()` for client-side validation
- Use `validateServerEnvironment()` for server-side validation

**Required Environment Variables:**
- Firebase: `NEXT_PUBLIC_FIREBASE_*` (API_KEY, AUTH_DOMAIN, PROJECT_ID, etc.)
- Google APIs: `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Firebase Admin: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

**Usage Examples:**
```typescript
// ✅ Correct
import { validateClientEnvironment } from '@/lib/env-validation'
const env = validateClientEnvironment()
const apiKey = env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

// ❌ Wrong
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY // Direct access
```

### Required Google APIs:
- **ALWAYS** ensure all required Google APIs are enabled in Google Cloud Console
- **NEVER** use Google APIs without proper API key configuration

**Required Google APIs:**
- **Google Places API**: 場所検索・詳細情報取得 (`NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`)
- **Google Maps JavaScript API**: 地図表示・マーカー・ルート表示 (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)
- **Google Geocoding API**: 住所↔座標変換 (Places APIキーと共用)
- **Google Distance Matrix API**: 距離・時間計算 (Places APIキーと共用)

**Optional Google APIs:**
- **Google Maps Platform Map ID**: 高度なマーカー表示 (`NEXT_PUBLIC_GOOGLE_MAP_ID`)
- **Google Directions API**: ルート計算・最適化 (Places APIキーと共用)
- **Google Route Optimization API**: 高度なルート最適化 (Places APIキーと共用)

**API Setup Requirements:**
1. **Google Cloud Console**でプロジェクトを作成
2. **APIとサービス**で以下のAPIを有効化:
   - Places API
   - Maps JavaScript API
   - Geocoding API
   - Distance Matrix API
   - Directions API (ルート最適化機能用)
   - Route Optimization API (高度なルート最適化用)
3. **認証情報**でAPIキーを作成
4. **APIキーの制限**を設定（HTTPリファラー制限推奨）

**Usage Examples:**
```typescript
// ✅ Correct - APIヘルパーを使用
import { placesApiHelpers } from '@/lib/api/google/places'
const results = await placesApiHelpers.searchPlaces('Tokyo')

// ✅ Correct - ルート最適化APIを使用
import { optimizeWaypoints } from '@/lib/route-optimization'
const optimized = await optimizeWaypoints(waypoints, origin, destination, {
  travelMode: 'DRIVING',
  avoidHighways: false
})

// ✅ Correct - 環境変数検証済み
import { validateClientEnvironment } from '@/lib/env-validation'
const env = validateClientEnvironment()
const apiKey = env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

// ❌ Wrong - 直接API呼び出し
const response = await fetch('https://maps.googleapis.com/maps/api/place/...')
```

### Route Optimization System:
- **ALWAYS** use the centralized route optimization system in `lib/route-optimization.ts`
- **NEVER** implement custom route optimization logic
- Use `RouteOptimizer` class for debounced route calculations
- Use `optimizeWaypoints()` function for waypoint optimization

**Available Route Optimization Features:**
- **Waypoint Optimization**: 複数地点の最適な訪問順序を計算
- **Travel Mode Support**: DRIVING, WALKING, BICYCLING, TRANSIT
- **Avoid Options**: highways, tolls, ferries の回避設定
- **Cost Estimation**: API呼び出しコストの見積もり
- **Caching**: 同じルートの重複計算を防止

**Route Optimization Components:**
- `RouteOptimizationDisplay`: ルート最適化結果の表示
- `DailyRouteOptimizer`: 日別旅程の最適化
- `RouteCostEstimator`: ルートコストの見積もり

**Usage Examples:**
```typescript
// ✅ Correct - RouteOptimizerクラスを使用
import { RouteOptimizer } from '@/lib/route-optimization'
const optimizer = new RouteOptimizer()
await optimizer.calculateRouteOptimized(request, callback)

// ✅ Correct - optimizeWaypoints関数を使用
import { optimizeWaypoints } from '@/lib/route-optimization'
const result = await optimizeWaypoints(waypoints, origin, destination, {
  travelMode: 'DRIVING',
  avoidHighways: true
})

// ❌ Wrong - 独自の最適化ロジック
const customOptimization = (waypoints) => { /* custom logic */ }
```

### Type Definition Management System:
- **ALWAYS** use centralized type definitions in `lib/core/types.ts`
- **NEVER** define duplicate interfaces across files
- All shared types should be exported from `lib/core/types.ts`

**Key Type Categories:**
- User & Authentication: `User`, `UserPreferences`
- Travel Data: `Trip`, `Day`, `Itinerary`, `PlaceData`
- API Responses: `PlaceSearchResult`, `GeocodingResult`, `WeatherData`
- Environment: `RequiredEnvVars`, `OptionalEnvVars`

### API Integration Management System:
- **ALWAYS** use centralized API helpers instead of direct API calls
- **NEVER** make direct API calls to external services

**Available API Helpers:**
- `placesApiHelpers` (`lib/places-api.ts`): Google Places API integration
- `geocodingApiHelpers` (`lib/geocoding-api.ts`): Google Geocoding API integration
- `weatherApiHelpers` (`lib/weather-api.ts`): Weather API integration
- `makeAuthenticatedRequest` (`lib/api-helpers.ts`): Authenticated API requests

**Usage Examples:**
```typescript
// ✅ Correct
import { placesApiHelpers } from '@/lib/api/google/places'
const results = await placesApiHelpers.searchPlaces('Tokyo')

// ❌ Wrong
const response = await fetch('https://maps.googleapis.com/maps/api/place/...')
```

### Subscription & Plan Management System:
- **ALWAYS** use the centralized subscription system in `lib/subscription-context.tsx`
- **NEVER** hardcode plan limits or features
- Use `PlanLimitChecker` (`lib/plan-limits.ts`) for limit validation

**Available Plans:**
- `season_traveler`: 無料プラン（基本機能）
- `backpacker`: 月額480円（ルート最適化、カスタム機能）
- `globetrotter`: 月額980円（全機能、無制限）

**Usage Examples:**
```typescript
// ✅ Correct
import { useSubscription } from '@/lib/subscription-context'
const { canUseRouteOptimization, checkPlanLimits } = useSubscription()

// ❌ Wrong
const canOptimize = user.plan === 'premium' // Hardcoded check
```

### Timezone Management System:
- **ALWAYS** use the centralized timezone utilities in `lib/timezone-utils.ts`
- **NEVER** hardcode timezone mappings
- Use `CITY_TIMEZONE_MAP` for city-to-timezone conversion

**Usage Examples:**
```typescript
// ✅ Correct
import { timezoneUtils } from '@/lib/utils/timezone'
const timezone = timezoneUtils.getTimezoneFromCity('Tokyo')

// ❌ Wrong
const timezone = 'Asia/Tokyo' // Hardcoded timezone
```

---

## 📦 Setup Notes

- Install dependencies: `npm install`
- Environment vars required:
  - Firebase: `NEXT_PUBLIC_FIREBASE_*` (API_KEY, AUTH_DOMAIN, PROJECT_ID, etc.)
  - Google APIs: `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
  - Firebase Admin: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- Start dev server: `npm run dev`
- Firebase project setup required (Authentication, Firestore, Storage).

---

## 🧪 Future Support for Agents

- Linting: ESLint + Prettier
- Unit testing: Mocha or Jest (planned)
- PDF Export (via server-side Puppeteer or SelectPDF): TBD

---

## 🙋 Questions for Human Developers?

If you are unsure about:
- Firestore data modeling and collection structure
- Firebase Authentication integration
- Google Places API usage
- Next.js App Router patterns
→ Please consult `README.md` or contact the repo owner.

---

## 🧪 Development Environment

This is a Next.js application with Firebase backend. To set up the development environment:

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
   - Copy `env.example` to `.env.local`
   - Configure Firebase and Google API keys

3. **Start development server**:
```bash
npm run dev
```

4. **Firebase setup**:
   - Create Firebase project
   - Enable Authentication (Google provider)
   - Create Firestore database
   - Enable Storage

> ❗ Make sure Firebase project is properly configured before running the application.