# i18n（多言語化）対応仕様

## 📌 さっと結論（エグゼクティブサマリー）

### ✅ 採用する設計

**Option A（`{place_id}_{language}` を複合キーにする方式）を採用**

- **理由**: シンプル、高速、既存コードへの影響最小
- **実装コスト**: 低（1-2週間で導入可能）
- **パフォーマンス**: 1回のクエリで取得完了
- **運用コスト**: 低（月額約$85削減）

### ⚠️ 実装前の必須確認事項

1. **🚨 Google Places API 利用規約の確認（最重要）**
   - データ保存の制約（保持期間、キャッシュ方法）
   - レビュー・個人情報の保存可否
   - **実装開始前に必ず確認してください**

2. **📊 保守的なコスト見積もり**
   - キャッシュヒット率は30-40%で計画（70%は過大評価）
   - デプロイ後1週間は毎日コスト確認

3. **🛡️ 本番環境での注意点**
   - マイグレーションはCloud Run Job / Cloud Functions推奨（ローカル実行はタイムアウトリスク）
   - レースコンディション対策（`merge: true`使用）
   - TTL / ガベージコレクション必須（120日未アクセスで削除）

### 🎯 短期 vs 長期戦略

**短期（v1.7.1）**: Option A で速攻導入
- 複合キー方式でシンプルに実装
- 言語依存データと非依存データの重複は許容

**中長期（v1.8.0以降）**: ハイブリッド設計に移行を検討
- 頻出の非言語依存データ（座標、写真参照、評価等）をマスター化
- データ重複を減らし、ストレージコストをさらに最適化

### 💰 コスト影響（現実的な見積もり）

| 項目 | 金額 | 備考 |
|------|------|------|
| Firestoreストレージ増加 | +$0.14/月 | 9言語 × 10,000件 |
| Places APIコスト削減 | -$85/月 | ヒット率40%想定 |
| **純益** | **+$84.86/月** | 約12,000円/月の削減 |

⚠️ **注意**: 
- ヒット率は運用開始後に実測し、30%を下回る場合はプリキャッシュ戦略を検討
- **Google Places API利用規約**: すべてのキャッシュデータは30日以内の保持のみ許可

---

## 🌍 概要

Caglla Travel Managerの多言語化対応における設計仕様。特にGoogle Places APIの言語別キャッシュ戦略について定義する。

## 🎯 基本方針

### UIの多言語化について

**結論: 当面はUIの多言語化は行わない**

- **アイコン優先設計**: 現在の設計思想として、ラベルに相当する文字はなるべく採用せず、アイコンのみで表現することを最優先としている（`AGENTS.md`参照）
- **メンテナンスコスト**: UI全体の翻訳とメンテナンスには多大なコストがかかる
- **ユーザー層**: 当面のターゲットユーザーは日本語話者が中心
- **段階的対応**: まずはPlaces APIのデータの多言語対応を優先し、UIの多言語化は将来の検討事項とする

### Places APIデータの多言語化について

**結論: 言語ごとのキャッシュが必要**

Google Places APIは`languageCode`パラメータによって以下のデータが言語ごとに変化する：

| データ項目 | 言語依存性 | 例 |
|----------|----------|---|
| `name` | ✅ 変化する | "Tokyo Tower" / "東京タワー" |
| `formatted_address` | ✅ 変化する | "Japan, Tokyo" / "日本、東京" |
| `editorial_summary.overview` | ✅ 変化する | 説明文が翻訳される |
| `reviews[].text` | ✅ 変化する | レビューが翻訳される場合がある |
| `opening_hours.weekday_text` | ✅ 変化する | "Monday: 9AM-5PM" / "月曜日: 9:00-17:00" |
| `place_id` | ❌ 変化しない | 常に同じID |
| `geometry.location` | ❌ 変化しない | 座標は不変 |
| `rating` | ❌ 変化しない | 評価値は不変 |

**問題点**:
- 現在の実装では`place_id`のみをキーとしてキャッシュしている
- Places APIのリクエストで`languageCode: 'ja'`がハードコードされている（`app/api/places/search/route.ts`）
- 英語ユーザーがアクセスしても日本語のデータしか返せない

## 🏗️ 設計方針

### 1. Places Cache の拡張

#### 現在のスキーマ
```typescript
interface PlacesCache {
  format_version: string
  place_id: string  // ドキュメントID
  name: string
  formatted_address: string
  // ... その他のフィールド
  cached_at: FirestoreDate
  last_accessed: FirestoreDate
  access_count: number
}
```

#### 新しいスキーマ（提案）

**Option A: 言語フィールドを追加し、複合キーで管理**

```typescript
interface PlacesCache {
  format_version: string
  place_id: string          // Google Places ID
  language: string          // 言語コード（例: 'ja', 'en', 'zh'）
  name: string              // 言語依存
  formatted_address: string // 言語依存
  editorial_summary?: {     // 言語依存
    overview: string
  }
  opening_hours?: {
    open_now?: boolean
    weekday_text?: string[] // 言語依存
  }
  reviews?: Array<{         // 言語依存
    author_name: string
    rating: number
    text: string
    time: number
  }>
  // ... その他のフィールド
  cached_at: FirestoreDate
  last_accessed: FirestoreDate
  access_count: number
}
```

**Firestore ドキュメント構造**:
```
places_cache/
  ├─ {place_id}_ja/        # 日本語版
  ├─ {place_id}_en/        # 英語版
  ├─ {place_id}_zh/        # 中国語版
  └─ ...
```

**メリット**:
- シンプルな実装
- 既存のキャッシュロジックを最小限の変更で対応可能
- クエリが高速（ドキュメントIDで直接アクセス）

**デメリット**:
- ドキュメント数が言語数 × 場所数に増える
- 言語に依存しないデータ（座標、評価など）が重複する

**Option B: 言語別のサブコレクションを使用**

```typescript
// メインドキュメント（言語非依存データ）
interface PlacesCacheMaster {
  format_version: string
  place_id: string
  geometry: {
    location: { lat: number; lng: number }
  }
  rating?: number
  user_ratings_total?: number
  price_level?: number
  types?: string[]
  photos?: Array<{
    photo_reference: string
    height: number
    width: number
  }>
  created_at: FirestoreDate
  last_accessed: FirestoreDate
  access_count: number
}

// サブコレクション（言語依存データ）
interface PlacesCacheLanguage {
  language: string
  name: string
  formatted_address: string
  editorial_summary?: { overview: string }
  opening_hours?: { weekday_text?: string[] }
  reviews?: Array<{ ... }>
  cached_at: FirestoreDate
}
```

**Firestore ドキュメント構造**:
```
places_cache/
  ├─ {place_id}/                      # メインドキュメント
  │   ├─ languages/                   # サブコレクション
  │   │   ├─ ja/                      # 日本語版
  │   │   ├─ en/                      # 英語版
  │   │   └─ zh/                      # 中国語版
```

**メリット**:
- データの重複を最小化
- 言語非依存データと言語依存データを明確に分離
- 将来的な拡張性が高い

**デメリット**:
- 実装が複雑（2回のクエリが必要）
- 読み取りコストが増加（メインドキュメント + 言語ドキュメント）
- 既存コードの大幅な変更が必要

### 2. 推奨アーキテクチャ

**Option A（複合キー方式）を推奨**

理由：
1. **シンプルさ**: 実装が単純で既存コードへの影響が少ない
2. **パフォーマンス**: 1回のクエリで全データを取得可能
3. **コスト**: Firestoreの読み取りコストは低いため、データ重複のコストは許容範囲
4. **Places APIのコスト削減**: Places APIのコストは高い（$17/1,000件）ため、Firestoreのストレージコスト増加は相対的に小さい

### 3. 言語コードの管理

#### サポートする言語

当初は以下の主要言語をサポート：

```typescript
export type SupportedLanguage = 
  | 'ja'  // 日本語
  | 'en'  // 英語
  | 'zh'  // 中国語（簡体字）
  | 'ko'  // 韓国語
  | 'es'  // スペイン語
  | 'fr'  // フランス語
  | 'de'  // ドイツ語
  | 'it'  // イタリア語
  | 'pt'  // ポルトガル語

// デフォルト言語
export const DEFAULT_LANGUAGE: SupportedLanguage = 'ja'

// 言語名の表示用マッピング
export const LANGUAGE_NAMES: Record<SupportedLanguage, { en: string; native: string }> = {
  ja: { en: 'Japanese', native: '日本語' },
  en: { en: 'English', native: 'English' },
  zh: { en: 'Chinese (Simplified)', native: '简体中文' },
  ko: { en: 'Korean', native: '한국어' },
  es: { en: 'Spanish', native: 'Español' },
  fr: { en: 'French', native: 'Français' },
  de: { en: 'German', native: 'Deutsch' },
  it: { en: 'Italian', native: 'Italiano' },
  pt: { en: 'Portuguese', native: 'Português' }
}
```

#### 言語の決定ロジック

```typescript
/**
 * ユーザーの言語設定を取得する優先順位
 * 1. ユーザープリファレンス（user.preferences.language）
 * 2. ブラウザの言語設定（navigator.language）
 * 3. デフォルト言語（'ja'）
 */
export function getUserLanguage(user?: User): SupportedLanguage {
  // 1. ユーザープリファレンスを優先
  if (user?.preferences?.language) {
    const lang = user.preferences.language.split('-')[0]
    if (isSupportedLanguage(lang)) {
      return lang as SupportedLanguage
    }
  }
  
  // 2. ブラウザ設定
  if (typeof window !== 'undefined') {
    const browserLang = (navigator.language || 'ja').split('-')[0]
    if (isSupportedLanguage(browserLang)) {
      return browserLang as SupportedLanguage
    }
  }
  
  // 3. デフォルト
  return DEFAULT_LANGUAGE
}

export function isSupportedLanguage(lang: string): boolean {
  return ['ja', 'en', 'zh', 'ko', 'es', 'fr', 'de', 'it', 'pt'].includes(lang)
}
```

## 📝 実装タスク

### Phase 1: 基礎インフラ整備

#### 1.1 型定義の追加（`lib/core/types.ts`）

```typescript
// Places Cache の更新
export interface PlacesCache {
  format_version: string
  place_id: string
  language: string  // 追加
  // ... 既存フィールド
}

// 言語関連の型
export type SupportedLanguage = 'ja' | 'en' | 'zh' | 'ko' | 'es' | 'fr' | 'de' | 'it' | 'pt'
```

#### 1.2 言語ユーティリティの作成（`lib/utils/language.ts`）

```typescript
import type { User, SupportedLanguage } from '@/lib/core/types'

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  'ja', 'en', 'zh', 'ko', 'es', 'fr', 'de', 'it', 'pt'
]

export const DEFAULT_LANGUAGE: SupportedLanguage = 'ja'

export const LANGUAGE_NAMES: Record<SupportedLanguage, { en: string; native: string }> = {
  // ... 定義
}

export function getUserLanguage(user?: User): SupportedLanguage {
  // ... 実装
}

export function isSupportedLanguage(lang: string): boolean {
  // ... 実装
}

export function getCacheKey(placeId: string, language: SupportedLanguage): string {
  return `${placeId}_${language}`
}

export function parseCacheKey(cacheKey: string): { placeId: string; language: SupportedLanguage } {
  const [placeId, language] = cacheKey.split('_')
  return {
    placeId,
    language: (language || DEFAULT_LANGUAGE) as SupportedLanguage
  }
}
```

### Phase 2: Places API の更新

#### 2.1 API エンドポイントの更新

**`app/api/places/search/route.ts`**:
```typescript
export async function POST(request: NextRequest) {
  const { query, language = 'ja' } = await request.json()
  
  // 言語コードのバリデーション
  const validLanguage = isSupportedLanguage(language) ? language : 'ja'
  
  const response = await fetch(GOOGLE_PLACES_API_URL_NEW, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': '...'
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: validLanguage,  // 動的に設定
      // regionCode は削除（言語によって地域を固定しない）
      maxResultCount: 20
    })
  })
  
  // ...
}
```

**`app/api/places/details/route.ts`**:
```typescript
export async function POST(request: NextRequest) {
  const { placeId, language = 'ja' } = await request.json()
  
  // 言語コードのバリデーション
  const validLanguage = isSupportedLanguage(language) ? language : 'ja'
  
  // キャッシュキーの生成
  const cacheKey = getCacheKey(placeId, validLanguage)
  
  // 1. キャッシュを確認
  const cached = await getPlaceFromCache(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }
  
  // 2. Google Places API を呼び出し
  const response = await fetch(`${GOOGLE_PLACES_API_URL}/details/json`, {
    // ...
    body: JSON.stringify({
      place_id: placeId,
      language: validLanguage,
      // ...
    })
  })
  
  // 3. キャッシュに保存
  const placeData = await response.json()
  await savePlaceToCache(cacheKey, { ...placeData, language: validLanguage })
  
  return NextResponse.json(placeData)
}
```

#### 2.2 Places API ヘルパーの更新

**`lib/api/google/places.ts`**:
```typescript
export const placesApiHelpers = {
  async searchPlaces(query: string, language: SupportedLanguage = 'ja'): Promise<PlaceSearchResult[]> {
    const response = await fetch('/api/places/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, language })
    })
    // ...
  },
  
  async getPlaceDetails(placeId: string, language: SupportedLanguage = 'ja'): Promise<PlaceDetailsResult> {
    const response = await fetch('/api/places/details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placeId, language })
    })
    // ...
  },
  
  // ...
}
```

### Phase 3: キャッシュシステムの更新

#### 3.1 Firestore キャッシュ関数の更新

**新規ファイル: `lib/api/places-cache.ts`**:
```typescript
import { db } from '@/lib/firebase/admin'
import { getCacheKey } from '@/lib/utils/language'
import type { PlacesCache, SupportedLanguage } from '@/lib/core/types'

const PLACES_CACHE_COLLECTION = 'places_cache'

/**
 * キャッシュから場所データを取得
 */
export async function getPlaceFromCache(
  placeId: string,
  language: SupportedLanguage
): Promise<PlacesCache | null> {
  try {
    const cacheKey = getCacheKey(placeId, language)
    const docRef = db.collection(PLACES_CACHE_COLLECTION).doc(cacheKey)
    const doc = await docRef.get()
    
    if (!doc.exists) {
      return null
    }
    
    // アクセス統計を更新
    await docRef.update({
      last_accessed: new Date(),
      access_count: (doc.data()?.access_count || 0) + 1
    })
    
    return doc.data() as PlacesCache
  } catch (error) {
    logger.error('Error getting place from cache:', error)
    return null
  }
}

/**
 * キャッシュに場所データを保存
 */
export async function savePlaceToCache(
  placeData: PlacesCache
): Promise<void> {
  try {
    const cacheKey = getCacheKey(placeData.place_id, placeData.language)
    const docRef = db.collection(PLACES_CACHE_COLLECTION).doc(cacheKey)
    
    await docRef.set({
      ...placeData,
      format_version: '2.0.0',  // 言語対応版
      cached_at: new Date(),
      last_accessed: new Date(),
      access_count: 1
    })
  } catch (error) {
    logger.error('Error saving place to cache:', error)
    throw error
  }
}

/**
 * 複数の言語でキャッシュを一括取得
 */
export async function getPlaceMultiLanguage(
  placeId: string,
  languages: SupportedLanguage[]
): Promise<Record<SupportedLanguage, PlacesCache | null>> {
  const results: Record<string, PlacesCache | null> = {}
  
  await Promise.all(
    languages.map(async (lang) => {
      results[lang] = await getPlaceFromCache(placeId, lang)
    })
  )
  
  return results as Record<SupportedLanguage, PlacesCache | null>
}
```

### Phase 4: 既存キャッシュのマイグレーション

#### 4.1 マイグレーションスクリプト

**新規ファイル: `scripts/migrate-places-cache-i18n.ts`**:
```typescript
import { db } from '@/lib/firebase/admin'
import { getCacheKey, DEFAULT_LANGUAGE } from '@/lib/utils/language'

/**
 * 既存のplaces_cacheドキュメントを言語対応版にマイグレーション
 * 
 * 既存ドキュメント: places_cache/{place_id}
 * 新ドキュメント: places_cache/{place_id}_ja
 */
async function migratePlacesCacheToI18n() {
  const snapshot = await db.collection('places_cache').get()
  
  const batch = db.batch()
  let count = 0
  
  for (const doc of snapshot.docs) {
    const data = doc.data()
    const oldId = doc.id
    
    // 既に言語サフィックスがある場合はスキップ
    if (oldId.includes('_')) {
      console.log(`Skipping already migrated: ${oldId}`)
      continue
    }
    
    // 新しいID（デフォルト言語を追加）
    const newId = getCacheKey(oldId, DEFAULT_LANGUAGE)
    
    // 新しいドキュメントを作成
    const newDocRef = db.collection('places_cache').doc(newId)
    batch.set(newDocRef, {
      ...data,
      place_id: oldId,  // 元のplace_idを保持
      language: DEFAULT_LANGUAGE,
      format_version: '2.0.0',
      migrated_at: new Date()
    })
    
    // 古いドキュメントを削除
    batch.delete(doc.ref)
    
    count++
    
    // Firestoreのバッチ制限（500件）に達したらコミット
    if (count >= 500) {
      await batch.commit()
      console.log(`Migrated ${count} documents`)
      count = 0
    }
  }
  
  // 残りをコミット
  if (count > 0) {
    await batch.commit()
    console.log(`Migrated final ${count} documents`)
  }
  
  console.log('Migration completed!')
}

// 実行
migratePlacesCacheToI18n()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
```

#### 4.2 マイグレーション実行手順

```bash
# 1. バックアップを取得（重要！）
# Firestoreコンソールでplaces_cacheコレクションをエクスポート

# 2. マイグレーションスクリプトを実行
npx tsx scripts/migrate-places-cache-i18n.ts

# 3. 検証
# - ドキュメント数が変わっていないか確認
# - 新しいキー形式（{place_id}_ja）でアクセスできるか確認
# - アプリケーションが正常に動作するか確認
```

## 🧪 テスト戦略

### 1. ユニットテスト

```typescript
// lib/utils/language.test.ts
describe('Language Utils', () => {
  test('getCacheKey generates correct format', () => {
    expect(getCacheKey('ChIJ123', 'ja')).toBe('ChIJ123_ja')
    expect(getCacheKey('ChIJ123', 'en')).toBe('ChIJ123_en')
  })
  
  test('parseCacheKey parses correctly', () => {
    expect(parseCacheKey('ChIJ123_ja')).toEqual({ 
      placeId: 'ChIJ123', 
      language: 'ja' 
    })
  })
  
  test('getUserLanguage returns correct priority', () => {
    const user = { preferences: { language: 'en' } } as User
    expect(getUserLanguage(user)).toBe('en')
    
    expect(getUserLanguage()).toBe('ja') // default
  })
})
```

### 2. 統合テスト

```typescript
// app/api/places/details/route.test.ts
describe('Places Details API', () => {
  test('returns Japanese data with ja language code', async () => {
    const response = await fetch('/api/places/details', {
      method: 'POST',
      body: JSON.stringify({ 
        placeId: 'ChIJ51cu8IcbXWARiRtXIothAS4',  // 東京タワー
        language: 'ja' 
      })
    })
    
    const data = await response.json()
    expect(data.name).toBe('東京タワー')
    expect(data.formatted_address).toContain('日本')
  })
  
  test('returns English data with en language code', async () => {
    const response = await fetch('/api/places/details', {
      method: 'POST',
      body: JSON.stringify({ 
        placeId: 'ChIJ51cu8IcbXWARiRtXIothAS4', 
        language: 'en' 
      })
    })
    
    const data = await response.json()
    expect(data.name).toBe('Tokyo Tower')
    expect(data.formatted_address).toContain('Japan')
  })
  
  test('uses cache on second request', async () => {
    // 1回目（API呼び出し）
    await fetch('/api/places/details', {
      method: 'POST',
      body: JSON.stringify({ 
        placeId: 'ChIJ51cu8IcbXWARiRtXIothAS4', 
        language: 'ja' 
      })
    })
    
    // 2回目（キャッシュから取得）
    const start = Date.now()
    const response = await fetch('/api/places/details', {
      method: 'POST',
      body: JSON.stringify({ 
        placeId: 'ChIJ51cu8IcbXWARiRtXIothAS4', 
        language: 'ja' 
      })
    })
    const duration = Date.now() - start
    
    expect(response.ok).toBe(true)
    expect(duration).toBeLessThan(100) // キャッシュなら100ms以下
  })
})
```

## 💰 コスト影響分析

### キャッシュストレージコスト

**前提条件**:
- 1つの場所データ: 約10KB
- サポート言語数: 9言語
- ユニーク場所数: 10,000件

**ストレージ使用量**:
- 従来: 10KB × 10,000件 = 100MB
- 新方式: 10KB × 10,000件 × 9言語 = 900MB
- **増加分**: 800MB

**Firestore ストレージコスト**:
- $0.18/GB/月
- 800MB = 0.8GB
- **月額コスト増加**: $0.144/月（約20円/月）

### Places APIコスト削減

**キャッシュヒット率50%と仮定**:
- 月間リクエスト: 10,000件
- キャッシュミス: 5,000件
- 削減されたAPIコール: 5,000件

**Places APIコスト削減**:
- Places Details: $17/1,000件
- 削減額: $17 × 5 = **$85/月削減**（約12,000円/月削減）

**結論**: ストレージコスト増加（$0.144/月）に対してAPIコスト削減（$85/月）が圧倒的に大きい

## 📊 パフォーマンス影響

### 1. レスポンス時間

| シナリオ | 従来 | 新方式 | 影響 |
|---------|------|-------|------|
| キャッシュヒット（日本語） | 50ms | 50ms | 変化なし |
| キャッシュヒット（英語） | N/A | 50ms | 新機能 |
| キャッシュミス | 500ms | 500ms | 変化なし |

### 2. Firestore 読み取りコスト

| シナリオ | 読み取り数 | コスト |
|---------|----------|-------|
| 場所検索（10件） | 10ドキュメント | $0.000006 |
| 詳細表示（1件） | 1ドキュメント | $0.0000006 |

**結論**: パフォーマンスへの悪影響はほぼなし

## 🚀 ロールアウト計画

### Phase 1: インフラ整備（Week 1）
- [ ] 言語ユーティリティの実装
- [ ] 型定義の更新
- [ ] ユニットテストの作成

### Phase 2: API更新（Week 2）
- [ ] Places API エンドポイントの更新
- [ ] Places API ヘルパーの更新
- [ ] キャッシュシステムの実装
- [ ] 統合テストの作成

### Phase 3: マイグレーション（Week 3）
- [ ] マイグレーションスクリプトの作成
- [ ] ステージング環境でのテスト実行
- [ ] 本番環境でのマイグレーション実行
- [ ] 動作確認

### Phase 4: UI統合（Week 4）
- [ ] ユーザー設定に言語選択を追加
- [ ] Places検索・表示で言語設定を適用
- [ ] E2Eテストの実施
- [ ] 本番デプロイ

### Phase 5: モニタリング（Week 5-6）
- [ ] キャッシュヒット率の監視
- [ ] APIコスト削減の測定
- [ ] ユーザーフィードバックの収集
- [ ] パフォーマンスの最適化

## ⚠️ 実装前に必ず確認すべき事項

### 🚨 最重要：Google Places API 利用規約

**✅ 確認済み・対応済み**：

1. **データ保存に関する制約**
   - [Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms)
   - **✅ 確認済み**: 緯度・経度は最大30日間のキャッシュが許可
   - **✅ 対応済み**: すべてのPlaces APIデータを30日以内で管理

2. **採用した方針**
   - ✅ **すべてのデータを30日保持**: 保守的アプローチで安全性を最優先
   - ✅ **Soft TTL: 14日**: 14日経過でバックグラウンド更新
   - ✅ **Hard TTL: 30日**: 30日経過で自動削除（Cloud Scheduler）
   - ✅ **詳細**: `docs/specifications/google-places-api-terms-summary.md` 参照

3. **実装済みの対策**
   - ✅ キャッシュAPI: デフォルトTTLを30日に設定
   - ✅ クリーンアップスクリプト: デフォルト30日で自動削除
   - ✅ 監視: 古いキャッシュの検知とアラート

### 🔒 GDPR / 個人情報保護

1. **PII（個人情報）の取り扱い**
   - `reviews[].author_name`: レビュー投稿者名
   - `reviews[].text`: レビュー内容
   - 上記を保存する場合は適切な同意とデータ保持期間を設定

2. **推奨対応**
   - レビューは保存しない、または匿名化
   - データ保持期間を設定（例：90日）
   - ユーザーからのデータ削除リクエストに対応

## 🎯 実装チェックリスト

### Phase 1: 準備・調査（実装開始前）

- [ ] **Google Places API利用規約の確認**
  - [ ] データ保存に関する制約を確認
  - [ ] レビュー保存の可否を確認
  - [ ] キャッシュ期間制限を確認
  - [ ] 法務部門への確認（企業の場合）

- [ ] **コスト見積もりの精緻化**
  - [ ] 現在のPlaces API使用量を測定
  - [ ] 想定キャッシュヒット率を算出（保守的に30-50%）
  - [ ] Firestoreストレージコストを再計算

- [ ] **既存システムの棚卸し**
  - [ ] Places APIを呼び出している全箇所をリストアップ
  - [ ] `place_id`を扱っている全コンポーネントを特定
  - [ ] データベースの既存`places_cache`件数を確認

### Phase 2: インフラ整備

- [ ] **型定義の追加**
  - [ ] `SupportedLanguage`型の定義
  - [ ] `PlacesCache`に`language`フィールド追加
  - [ ] `format_version`を`2.0.0`に更新

- [ ] **言語ユーティリティの実装**
  - [ ] `getUserLanguage()`関数
  - [ ] `getCacheKey()`関数（統一実装）
  - [ ] `isSupportedLanguage()`関数
  - [ ] ユニットテスト作成

- [ ] **Places キャッシュAPI の実装**
  - [ ] `getPlaceFromCache()`関数
  - [ ] `savePlaceToCache()`関数
  - [ ] **レースコンディション対策**（`merge: true`使用）
  - [ ] **エラーハンドリング**（API障害時のフォールバック）
  - [ ] 統合テスト作成

### Phase 3: API更新

- [ ] **Places Search APIの更新**
  - [ ] `language`パラメータの追加
  - [ ] バリデーション実装
  - [ ] **レート制限対策**（指数バックオフ）
  - [ ] **同時リクエスト制御**（同一placeId連続リクエスト抑制）

- [ ] **Places Details APIの更新**
  - [ ] `language`パラメータの追加
  - [ ] キャッシュロジックの統合
  - [ ] **soft TTL実装**（30日経過後はバックグラウンド更新）
  - [ ] **API障害時の耐性**（キャッシュ返却を優先）

- [ ] **API クライアントの更新**
  - [ ] `placesApiHelpers`に言語パラメータ追加
  - [ ] 既存呼び出し箇所の更新

### Phase 4: マイグレーション

- [ ] **マイグレーションスクリプトの作成**
  - [ ] 500件ごとのバッチコミット実装
  - [ ] **失敗ログの保存**（別コレクションに記録）
  - [ ] **段階的実行**（1,000件ずつテスト）
  - [ ] ドライラン機能（実際には書き込まない）

- [ ] **実行環境の準備**
  - [ ] ❌ ローカル実行（タイムアウトリスク）
  - [ ] ✅ **Cloud Run Job または Cloud Functions推奨**
  - [ ] Pub/Sub経由で並列処理
  - [ ] リトライ機構の実装

- [ ] **バックアップと検証**
  - [ ] **Firestoreエクスポート**（必須！）
  - [ ] ステージング環境で小ロット実行（100件）
  - [ ] 検証：ドキュメント数、データ整合性
  - [ ] ロールバック手順の確認

- [ ] **本番マイグレーション**
  - [ ] メンテナンスウィンドウの設定
  - [ ] 段階的実行（1,000件 → 10,000件 → 全件）
  - [ ] 各段階でアプリケーション動作確認
  - [ ] 失敗ドキュメントのリトライ

### Phase 5: 監視・運用準備

- [ ] **監視ダッシュボードの作成**
  - [ ] `cache_hit_ratio`: キャッシュヒット率
  - [ ] `api_success_rate`: API成功率
  - [ ] `api_error_rate`: APIエラー率（アラート設定）
  - [ ] `avg_response_time`: 平均レスポンス時間
  - [ ] `firestore_reads`: Firestore読み取り数
  - [ ] `firestore_writes`: Firestore書き込み数
  - [ ] `api_costs_daily`: 日次APIコスト

- [ ] **アラート設定**
  - [ ] APIエラー率 > 5%
  - [ ] キャッシュヒット率 < 30%
  - [ ] レスポンス時間 > 1秒
  - [ ] 日次コスト > 予算の120%

- [ ] **TTL / ガベージコレクション**
  - [ ] 未アクセス期間を基準にした削除ポリシー（**30日** - Google利用規約準拠）
  - [ ] Cloud Schedulerで定期実行（**毎日** - 30日超過データを自動削除）
  - [ ] 削除前のアーカイブ（オプション）

- [ ] **運用ドキュメント**
  - [ ] 障害対応手順書
  - [ ] キャッシュクリア手順
  - [ ] マイグレーションリトライ手順
  - [ ] コスト異常時の対応

### Phase 6: デプロイ

- [ ] **カナリアデプロイ**
  - [ ] API更新を5%のトラフィックでテスト
  - [ ] 24時間監視（エラー率、レスポンス時間）
  - [ ] 問題なければ段階的に拡大（10% → 50% → 100%）

- [ ] **本番デプロイ**
  - [ ] デプロイ前の最終チェック
  - [ ] ロールバック準備
  - [ ] デプロイ後24時間は集中監視

- [ ] **検証**
  - [ ] 各言語でのPlaces検索テスト
  - [ ] キャッシュヒット確認
  - [ ] パフォーマンステスト
  - [ ] コスト確認（翌日）

## 🛡️ 絶対にハマるポイント（失敗事例）

### 1. レースコンディション

**問題**：同一`placeId`に対して複数言語を同時リクエストした場合、キャッシュ更新が競合

```typescript
// ❌ 悪い例
await docRef.set(placeData)  // 上書き競合の可能性

// ✅ 良い例
await docRef.set(placeData, { merge: true })  // マージで安全に更新
```

### 2. API クォータ枯渇

**問題**：キャッシュミス時にAPIを連続呼び出し、クォータ超過で503エラー

**対策**：
```typescript
// ✅ 良い例：指数バックオフとレート制限
import pRetry from 'p-retry'

const fetchWithRetry = async (placeId: string) => {
  return pRetry(
    async () => {
      const response = await fetch(GOOGLE_PLACES_API_URL, {...})
      if (response.status === 429) throw new Error('Rate limit')
      return response
    },
    {
      retries: 3,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 10000
    }
  )
}

// 同一placeIdへの連続リクエスト抑制
const pendingRequests = new Map<string, Promise<PlaceData>>()

async function getPlaceWithDedup(placeId: string, lang: string) {
  const key = `${placeId}_${lang}`
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)  // 既存リクエストを待つ
  }
  
  const promise = fetchPlaceData(placeId, lang)
  pendingRequests.set(key, promise)
  
  try {
    return await promise
  } finally {
    pendingRequests.delete(key)
  }
}
```

### 3. マイグレーションのタイムアウト

**問題**：大量ドキュメント（10万件以上）を一度にマイグレーション、タイムアウトで中断

**対策**：
```typescript
// ✅ Cloud Run Job での段階的処理
export async function migrateInBatches() {
  const BATCH_SIZE = 500
  let lastDoc = null
  
  while (true) {
    let query = db.collection('places_cache')
      .where('format_version', '!=', '2.0.0')
      .limit(BATCH_SIZE)
    
    if (lastDoc) {
      query = query.startAfter(lastDoc)
    }
    
    const snapshot = await query.get()
    if (snapshot.empty) break
    
    const batch = db.batch()
    snapshot.docs.forEach(doc => {
      // マイグレーション処理
    })
    
    await batch.commit()
    lastDoc = snapshot.docs[snapshot.docs.length - 1]
    
    // 進捗ログ
    logger.info(`Migrated ${snapshot.size} documents`)
    
    // レート制限回避のため小休止
    await sleep(1000)
  }
}
```

### 4. キャッシュヒット率の過大評価

**問題**：見積もりで70%のヒット率を想定したが、実際は30%以下でコスト増

**対策**：
- 保守的な見積もり（30-40%）で計画
- デプロイ後1週間は毎日コスト確認
- ヒット率が低い場合はプリキャッシュ戦略を検討

### 5. 古いキャッシュデータの蓄積

**問題**：使われない言語版が溜まり、Firestoreコスト増加
**Google利用規約**：30日を超えるデータは削除が必須

**対策**：
```typescript
// ✅ TTL による自動削除（Google利用規約準拠）
async function cleanupOldCache() {
  const DAYS_THRESHOLD = 30  // Google Places API利用規約: 30日以内のみ許可
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - DAYS_THRESHOLD)
  
  const snapshot = await db.collection('places_cache')
    .where('last_accessed', '<', cutoffDate)
    .limit(1000)
    .get()
  
  const batch = db.batch()
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref)
  })
  
  await batch.commit()
  logger.info(`Deleted ${snapshot.size} old cache entries`)
}
```

## 🔧 実装改善案（即座に役立つ）

### 1. ハイブリッド設計（将来対応）

**短期**：Option A（複合キー）で速攻導入
**中長期**：頻出の非言語依存データをマスター化

```typescript
// 将来的な設計（Phase 2）
interface PlacesMaster {
  place_id: string
  geometry: { location: { lat: number; lng: number } }
  rating?: number
  photos?: Array<{ photo_reference: string; ... }>
  // 言語非依存データのみ
}

interface PlacesLanguage {
  place_id: string
  language: string
  name: string
  formatted_address: string
  // 言語依存データのみ
}
```

### 2. キャッシュ更新戦略（soft TTL）

**Google Places API利用規約準拠**：すべてのデータは30日以内のみ保持

```typescript
async function getPlaceWithSoftTTL(placeId: string, lang: string) {
  const cached = await getPlaceFromCache(placeId, lang)
  
  if (!cached) {
    // キャッシュミス：同期で取得
    return await fetchAndCache(placeId, lang)
  }
  
  const age = Date.now() - cached.cached_at.getTime()
  const SOFT_TTL = 14 * 24 * 60 * 60 * 1000  // 14日（Google利用規約準拠）
  const HARD_TTL = 30 * 24 * 60 * 60 * 1000  // 30日（必ず削除）
  
  if (age > HARD_TTL) {
    // 30日超過：削除してAPIから再取得
    await deletePlaceCache(placeId, lang)
    return await fetchAndCache(placeId, lang)
  }
  
  if (age > SOFT_TTL) {
    // 14日経過：バックグラウンドで更新
    refreshCacheInBackground(placeId, lang)
  }
  
  // キャッシュを返す（UX優先）
  return cached
}

function refreshCacheInBackground(placeId: string, lang: string) {
  // Pub/Subにメッセージを送信、非同期で更新
  pubsub.topic('places-refresh').publish({
    placeId,
    language: lang,
    timestamp: Date.now()
  })
}
```

### 3. フォールバック言語

```typescript
export async function getPlaceWithFallback(
  placeId: string, 
  preferredLang: SupportedLanguage
): Promise<PlacesCache | null> {
  // 優先言語で試行
  let data = await getPlaceFromCache(placeId, preferredLang)
  if (data) return data
  
  // 英語でフォールバック
  if (preferredLang !== 'en') {
    data = await getPlaceFromCache(placeId, 'en')
    if (data) return data
  }
  
  // 日本語でフォールバック
  if (preferredLang !== 'ja') {
    data = await getPlaceFromCache(placeId, 'ja')
    if (data) return data
  }
  
  // 全て失敗：APIから取得
  return await fetchAndCache(placeId, preferredLang)
}
```

### 4. 監視実装例

```typescript
// lib/monitoring/places-cache-metrics.ts
import { logger } from '@/lib/core/logger'

class PlacesCacheMetrics {
  private hits = 0
  private misses = 0
  private apiErrors = 0
  
  recordHit() {
    this.hits++
    this.flush()
  }
  
  recordMiss() {
    this.misses++
    this.flush()
  }
  
  recordApiError() {
    this.apiErrors++
    this.flush()
  }
  
  private flush() {
    // Cloud Monitoring / Grafana に送信
    if ((this.hits + this.misses) % 100 === 0) {
      const hitRatio = this.hits / (this.hits + this.misses)
      logger.info('Places cache metrics', {
        hits: this.hits,
        misses: this.misses,
        hitRatio: hitRatio.toFixed(2),
        apiErrors: this.apiErrors
      })
    }
  }
}

export const metrics = new PlacesCacheMetrics()
```

## 📝 備考

### 将来の拡張案

1. **自動言語検出**:
   - ユーザーのブラウザ設定から言語を自動検出
   - 旅行先の国に応じて言語を自動切り替え

2. **混合言語サポート**:
   - UIは日本語、Places APIは英語など、個別設定を可能にする

3. **機械翻訳の統合**:
   - Places APIでサポートされていない言語向けに機械翻訳を提供
   - Google Cloud Translation APIの利用を検討

4. **キャッシュの最適化**:
   - 使用頻度の低い言語のキャッシュを自動削除
   - 人気の場所は全言語をプリキャッシュ

### 参考資料

- [Google Places API - Localization](https://developers.google.com/maps/documentation/places/web-service/localization)
- [Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [i18n Best Practices](https://www.i18next.com/principles/best-practices)

