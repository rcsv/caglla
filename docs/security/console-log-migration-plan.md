# console.log → logger 移行計画

**作成日**: 2025年10月9日  
**対象プロジェクト**: Caglla Travel Manager  
**目的**: 直接的な console 出力を logger ユーティリティに移行

---

## 📊 現状分析

### 統計情報

| カテゴリ | ファイル数 | console使用箇所 | 平均密度 |
|---------|-----------|----------------|---------|
| **app/api/** | 34 | 170 | 5.0箇所/ファイル |
| **lib/** | 24 | 224 | 9.3箇所/ファイル |
| **components/** | 27 | 144 | 5.3箇所/ファイル |
| **app/pages/** | 9 | 39 | 4.3箇所/ファイル |
| **合計** | 94 | 577 | 6.1箇所/ファイル |

**注**: ドキュメント、テストファイル、logger.ts自体は除外

---

## 🎯 優先度分類

### 🔴 優先度A（最優先）: APIルート - 本番環境で実行

サーバーサイドで実行され、本番環境でログが出力される可能性が高い

| ファイル | 箇所数 | 理由 |
|---------|-------|------|
| `app/api/trip/[id]/route.ts` | 28 | 旅行データCRUD、頻繁にアクセス |
| `app/api/trips/route.ts` | 19 | 旅行リスト取得、頻繁にアクセス |
| `app/api/users/migrate/route.ts` | 16 | マイグレーションロジック、重要 |
| `app/api/trips/recommended/route.ts` | 12 | レコメンド機能、データ分析 |
| `app/api/debug/auth/route.ts` | 11 | 認証デバッグ、機密情報含む |
| `app/api/itineraries/insert/route.ts` | 10 | 旅程挿入、複雑なロジック |
| `app/api/itineraries/route.ts` | 9 | 旅程CRUD、頻繁にアクセス |
| `app/api/trips/[id]/route.ts` | 8 | 個別旅行取得、頻繁にアクセス |
| `app/api/users/route.ts` | 6 | ユーザーCRUD |
| `app/api/itineraries/reorder/route.ts` | 5 | 旅程並び替え |

**小計**: 10ファイル、124箇所

---

### 🟡 優先度B（高）: lib/ - 共通ユーティリティ

複数箇所から呼び出され、本番環境でも実行される

| ファイル | 箇所数 | 理由 |
|---------|-------|------|
| `lib/places-cache.ts` | 30 | Places APIキャッシュ、頻繁に使用 |
| `lib/image-upload.ts` | 29 | 画像アップロード、エラーハンドリング重要 |
| `lib/weather-api.ts` | 21 | 外部API統合、エラー処理 |
| `lib/country-utils.ts` | 20 | 国別ユーティリティ |
| `lib/slug-data-helpers.ts` | 15 | スラッグベースデータ取得、重要 |
| `lib/route-optimization.ts` | 12 | ルート最適化、複雑なロジック |
| `lib/timezone-utils.ts` | 10 | タイムゾーン処理 |
| `lib/itinerary-reorder.ts` | 8 | 旅程並び替えロジック |
| `lib/firebase-admin.ts` | 7 | Firebase Admin SDK、既に一部対応済み |
| `lib/storage-management.ts` | 7 | ストレージ管理 |

**小計**: 10ファイル、159箇所

---

### 🟢 優先度C（中）: components/ - UI コンポーネント

クライアントサイドで実行、ユーザーのブラウザコンソールに出力

| ファイル | 箇所数 | 理由 |
|---------|-------|------|
| `components/trip/ScheduleCard.tsx` | 22 | スケジュールカード、ユーザー操作 |
| `components/ui/ImageUpload.tsx` | 14 | 画像アップロードUI |
| `components/trip/VenueDistance.tsx` | 12 | 距離計算表示 |
| `components/tripcard/NextTripMap.tsx` | 11 | 地図表示 |
| `components/trip/TripEditor.tsx` | 9 | 旅行編集UI |
| `components/modals/POIDialog.tsx` | 9 | POIダイアログ |
| `components/common/CreateTripDialog.tsx` | 9 | 旅行作成ダイアログ |
| `components/modals/AddScheduleModal.tsx` | 8 | スケジュール追加モーダル |
| `components/trip/TripMap.tsx` | 7 | 旅行地図メイン |
| `components/modals/UserSettingsModal.tsx` | 7 | ユーザー設定 |

**小計**: 10ファイル、108箇所

---

### 🔵 優先度D（低）: app/pages/ - ページコンポーネント

ページレベルのコンポーネント、主にクライアントサイド

| ファイル | 箇所数 | 理由 |
|---------|-------|------|
| `app/[userSlug]/[tripSlug]/page.tsx` | 11 | メイン旅行ページ |
| `app/trip/new/page.tsx` | 14 | 新規旅行作成 |
| `app/test/*` | 9 | テストページ（本番には含まれない） |

**小計**: 主要3ファイル、34箇所

---

## 📋 段階的移行計画

### Phase 1: 最優先（今週中） - APIルート

**目標**: サーバーサイドでの機密情報漏洩を防ぐ

#### 1-1. 認証・ユーザー関連API（2-3時間）
- [ ] `app/api/debug/auth/route.ts` (11箇所) ⚠️ 機密情報含む
- [ ] `app/api/users/route.ts` (6箇所)
- [ ] `app/api/users/migrate/route.ts` (16箇所)

#### 1-2. 旅行データCRUD API（3-4時間）
- [ ] `app/api/trip/[id]/route.ts` (28箇所)
- [ ] `app/api/trips/route.ts` (19箇所)
- [ ] `app/api/trips/[id]/route.ts` (8箇所)

#### 1-3. 旅程データAPI（2-3時間）
- [ ] `app/api/itineraries/route.ts` (9箇所)
- [ ] `app/api/itineraries/insert/route.ts` (10箇所)
- [ ] `app/api/itineraries/reorder/route.ts` (5箇所)

#### 1-4. その他重要API（1-2時間）
- [ ] `app/api/trips/recommended/route.ts` (12箇所)

**Phase 1 合計**: 10ファイル、124箇所、8-12時間

---

### Phase 2: 高優先（来週中） - lib/ ユーティリティ

**目標**: 共通ロジックでのログ品質向上

#### 2-1. 外部API統合（3-4時間）
- [ ] `lib/places-cache.ts` (30箇所)
- [ ] `lib/weather-api.ts` (21箇所)
- [ ] `lib/places-api.ts` (5箇所)
- [ ] `lib/geocoding-api.ts` (4箇所)

#### 2-2. データ処理・ビジネスロジック（3-4時間）
- [ ] `lib/slug-data-helpers.ts` (15箇所)
- [ ] `lib/route-optimization.ts` (12箇所)
- [ ] `lib/itinerary-reorder.ts` (8箇所)

#### 2-3. ユーティリティ（2-3時間）
- [ ] `lib/image-upload.ts` (29箇所)
- [ ] `lib/storage-management.ts` (7箇所)
- [ ] `lib/timezone-utils.ts` (10箇所)

#### 2-4. 国別・通貨ユーティリティ（2-3時間）
- [ ] `lib/country-utils.ts` (20箇所)
- [ ] `lib/currency-utils.ts` (6箇所)

**Phase 2 合計**: 12ファイル、167箇所、10-14時間

---

### Phase 3: 中優先（2週間以内） - components/

**目標**: ユーザー体験向上、デバッグ容易性

#### 3-1. 重要UIコンポーネント（4-5時間）
- [ ] `components/trip/ScheduleCard.tsx` (22箇所)
- [ ] `components/ui/ImageUpload.tsx` (14箇所)
- [ ] `components/trip/VenueDistance.tsx` (12箇所)
- [ ] `components/trip/TripEditor.tsx` (9箇所)

#### 3-2. モーダル・ダイアログ（3-4時間）
- [ ] `components/modals/POIDialog.tsx` (9箇所)
- [ ] `components/common/CreateTripDialog.tsx` (9箇所)
- [ ] `components/modals/AddScheduleModal.tsx` (8箇所)
- [ ] `components/modals/UserSettingsModal.tsx` (7箇所)

#### 3-3. 地図関連コンポーネント（2-3時間）
- [ ] `components/tripcard/NextTripMap.tsx` (11箇所)
- [ ] `components/trip/TripMap.tsx` (7箇所)
- [ ] `components/trip/CountryMap.tsx` (4箇所)

**Phase 3 合計**: 11ファイル、112箇所、9-12時間

---

### Phase 4: 低優先（3週間以内） - その他

#### 4-1. ページコンポーネント（2-3時間）
- [ ] `app/[userSlug]/[tripSlug]/page.tsx` (11箇所)
- [ ] `app/trip/new/page.tsx` (14箇所)

#### 4-2. その他コンポーネント（3-4時間）
- [ ] 残りの components/ ファイル（約50箇所）

#### 4-3. その他APIルート（2-3時間）
- [ ] 残りの app/api/ ファイル（約46箇所）

**Phase 4 合計**: 約20ファイル、約110箇所、7-10時間

---

## 🔧 移行パターン

### パターン1: console.log → logger.debug

**使用ケース**: デバッグ情報、開発時のみ必要

**変更前**:
```typescript
console.log('User data:', userData)
console.log(`Processing trip: ${tripId}`)
```

**変更後**:
```typescript
import logger from '@/lib/logger'

logger.debug('User data:', userData)
logger.debug(`Processing trip: ${tripId}`)
```

---

### パターン2: console.error → logger.error

**使用ケース**: エラーハンドリング

**変更前**:
```typescript
} catch (error) {
  console.error('Failed to fetch trip:', error)
  return NextResponse.json({ error: 'Failed to fetch trip' }, { status: 500 })
}
```

**変更後**:
```typescript
import logger from '@/lib/logger'

} catch (error) {
  logger.error('Failed to fetch trip', error)
  return NextResponse.json({ error: 'Failed to fetch trip' }, { status: 500 })
}
```

---

### パターン3: console.warn → logger.warn

**使用ケース**: 警告メッセージ

**変更前**:
```typescript
if (!placeData) {
  console.warn('Place data not found:', placeId)
}
```

**変更後**:
```typescript
import logger from '@/lib/logger'

if (!placeData) {
  logger.warn('Place data not found:', placeId)
}
```

---

### パターン4: console.info → logger.info

**使用ケース**: 情報メッセージ（本番でも記録したい）

**変更前**:
```typescript
console.log('✅ Trip created successfully:', tripId)
```

**変更後**:
```typescript
import logger from '@/lib/logger'

logger.info('Trip created successfully', { tripId })
```

---

### パターン5: API呼び出しログ

**使用ケース**: 外部API呼び出し

**変更前**:
```typescript
console.log('Calling Places API:', placeId)
const response = await fetch(url)
console.log('Places API response:', response.status)
```

**変更後**:
```typescript
import logger from '@/lib/logger'

logger.apiCall('GET', url, { placeId })
const response = await fetch(url)
logger.apiResponse('GET', url, response.status)
```

---

### パターン6: 機密情報を含むログ（削除または隠蔽）

**変更前**:
```typescript
console.log('Auth token:', token)
console.log('API key:', apiKey)
console.log('User credentials:', credentials)
```

**変更後**:
```typescript
import logger from '@/lib/logger'

// logger は自動的にサニタイズするが、可能な限り機密情報はログに出力しない
logger.debug('Auth token received') // 値は出力しない
logger.debug('API key configured') // 値は出力しない

// または logger を使用（自動的に ***REDACTED*** に置き換えられる）
logger.debug('User credentials:', credentials) // 自動サニタイズ
```

---

## 📝 移行チェックリスト（ファイル単位）

各ファイルの移行時に以下を確認：

### 1. import文の追加
```typescript
import logger from '@/lib/logger'
```

### 2. console 呼び出しの置き換え
- [ ] `console.log` → `logger.debug` または `logger.info`
- [ ] `console.error` → `logger.error`
- [ ] `console.warn` → `logger.warn`
- [ ] `console.debug` → `logger.debug`
- [ ] `console.info` → `logger.info`

### 3. ログレベルの適切な選択
- [ ] **DEBUG**: 開発時のみ必要な詳細情報
- [ ] **INFO**: 本番でも記録したい重要な情報
- [ ] **WARN**: 警告（処理は継続）
- [ ] **ERROR**: エラー（処理失敗）

### 4. 機密情報のチェック
- [ ] トークン、APIキー、パスワードが含まれていないか確認
- [ ] 必要であれば logger の自動サニタイズに依存

### 5. テスト
- [ ] 開発環境で正常に動作することを確認
- [ ] ログが適切に出力されることを確認

---

## 🧪 テスト方法

### 1. 開発環境でのログ出力確認

```bash
# 開発サーバー起動
npm run dev

# ブラウザコンソールまたはターミナルでログを確認
# DEBUGレベルのログが表示されるはず
```

### 2. 本番環境シミュレーション

```bash
# 本番ビルド
NODE_ENV=production npm run build

# 本番モードで起動
NODE_ENV=production npm start

# ERRORレベルのログのみが表示されるはず
```

### 3. ログレベル動作確認

```typescript
// lib/logger.ts のテスト
import logger, { LogLevel } from '@/lib/logger'

logger.setLevel(LogLevel.DEBUG)
logger.debug('This should appear') // 表示される

logger.setLevel(LogLevel.ERROR)
logger.debug('This should not appear') // 表示されない
logger.error('This should appear') // 表示される
```

---

## 📊 進捗管理

### 週次目標

| 週 | Phase | 目標ファイル数 | 目標箇所数 | 担当者 |
|----|-------|--------------|-----------|--------|
| 1週目 | Phase 1 | 10 | 124 | TBD |
| 2週目 | Phase 2 | 12 | 167 | TBD |
| 3週目 | Phase 3 | 11 | 112 | TBD |
| 4週目 | Phase 4 | 20 | 110 | TBD |

### 進捗トラッキング

```
Phase 1: [          ] 0/10 ファイル (0%)
Phase 2: [          ] 0/12 ファイル (0%)
Phase 3: [          ] 0/11 ファイル (0%)
Phase 4: [          ] 0/20 ファイル (0%)

全体: [          ] 0/53 ファイル (0%)
      [          ] 0/513 箇所 (0%)
```

---

## 🎯 期待される効果

### セキュリティ面
- ✅ 本番環境での機密情報漏洩リスク削減
- ✅ エラーログからのシステム情報露出防止
- ✅ 自動サニタイズによる安全性向上

### 運用面
- ✅ ログレベルによる適切なログ管理
- ✅ 本番環境でのログノイズ削減
- ✅ パフォーマンス向上（不要なログ出力削減）

### 開発面
- ✅ 統一されたログフォーマット
- ✅ デバッグの容易性向上
- ✅ タイムスタンプ付きログ

---

## 📚 関連ドキュメント

- `lib/logger.ts` - ロガーユーティリティ実装
- `docs/security/security-fix-summary.md` - セキュリティ修正サマリー
- `docs/security/production-deployment-guide.md` - 本番環境デプロイガイド

---

**作成者**: AI Assistant (Claude Sonnet 4.5)  
**最終更新**: 2025年10月9日  
**次回レビュー**: Phase 1完了時

