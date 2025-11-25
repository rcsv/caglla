# Place Cache エンリッチメント戦略

## 問題の整理

### 現状の課題

1. **キャッシュの情報不足**
   - Venue検索（`searchPlaces`）で作成されたキャッシュは`price_level`などの詳細情報が含まれない
   - Place Search APIの結果には`rating`や`price_level`が含まれる可能性があるが、詳細情報（`editorial_summary`、`reviews`、`opening_hours`など）は含まれない

2. **キャッシュ更新のトリガー不足**
   - 現在のキャッシュ戦略は「データが存在したらクエリしない」
   - 一度キャッシュが作成されると、詳細情報が不足していても更新されない
   - POIDialogで薄い情報しか表示されないジレンマ

3. **APIコストとのバランス**
   - 闇雲にPlace Details APIを呼び出すとコストが増大
   - `price_level`等の特定フィールドに限定して詳細を問い合わせたい

### 現在のキャッシュ戦略

```typescript
// lib/api/places-cache.ts
export async function getPlaceFromCache(
  placeId: string,
  language: SupportedLanguage
): Promise<PlacesCache | null> {
  // キャッシュが存在すれば即座に返す
  // 存在チェックのみで、情報の完全性は確認しない
}
```

```typescript
// app/api/places/details/route.ts
if (cached) {
  // キャッシュヒット時は即座に返す
  // Soft TTL（14日）でバックグラウンド更新はあるが、
  // 情報の完全性は考慮されていない
  return NextResponse.json({ status: 'OK', result: cached })
}
```

## 対策案

### 案1: キャッシュの情報完全性チェック（推奨）

**概要**: キャッシュが存在しても、必要なフィールドが不足している場合はPlace Details APIを呼び出す

**メリット**:
- 既存のキャッシュロジックを最小限の変更で拡張可能
- APIコストを抑えつつ、必要な情報を取得できる
- 段階的な情報取得が可能

**デメリット**:
- キャッシュチェックのロジックが複雑化
- どのフィールドが「必須」かを定義する必要がある

**実装方針**:

```typescript
// lib/api/places-cache.ts に追加

/**
 * キャッシュの情報完全性をチェック
 * 
 * @param cached - キャッシュデータ
 * @param requiredFields - 必須フィールドのリスト
 * @returns 不足しているフィールドのリスト
 */
export function checkCacheCompleteness(
  cached: PlacesCache,
  requiredFields: (keyof PlacesCache)[]
): (keyof PlacesCache)[] {
  const missingFields: (keyof PlacesCache)[] = []
  
  for (const field of requiredFields) {
    const value = cached[field]
    // undefined、null、空配列、空文字列を「不足」とみなす
    if (value === undefined || value === null || 
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'string' && value === '')) {
      missingFields.push(field)
    }
  }
  
  return missingFields
}

/**
 * キャッシュから場所データを取得（情報完全性チェック付き）
 * 
 * @param placeId - Google Places API の place_id
 * @param language - 言語コード
 * @param requiredFields - 必須フィールドのリスト（デフォルト: ['price_level', 'rating']）
 * @returns キャッシュされた場所データ、存在しないか不完全な場合は null
 */
export async function getPlaceFromCacheWithCompleteness(
  placeId: string,
  language: SupportedLanguage,
  requiredFields: (keyof PlacesCache)[] = ['price_level', 'rating']
): Promise<PlacesCache | null> {
  const cached = await getPlaceFromCache(placeId, language)
  
  if (!cached) {
    return null
  }
  
  // 情報完全性チェック
  const missingFields = checkCacheCompleteness(cached, requiredFields)
  
  if (missingFields.length > 0) {
    logger.info('Cache incomplete, missing fields:', { 
      placeId, 
      language, 
      missingFields 
    })
    return null // 不完全なキャッシュは「キャッシュミス」として扱う
  }
  
  return cached
}
```

**使用例**:

```typescript
// app/api/places/details/route.ts
export const POST = async (request: NextRequest, ctx) => {
  const { placeId, language } = ctx.body
  
  // POIDialogで表示する場合は詳細情報が必要
  const requiredFields: (keyof PlacesCache)[] = [
    'price_level',
    'rating',
    'user_ratings_total',
    'editorial_summary'
  ]
  
  // 情報完全性チェック付きでキャッシュを取得
  const cached = await getPlaceFromCacheWithCompleteness(
    placeId, 
    language, 
    requiredFields
  )
  
  if (cached) {
    return NextResponse.json({ status: 'OK', result: cached })
  }
  
  // キャッシュミスまたは不完全な場合、APIから取得
  const placeData = await fetchPlaceDetailsFromAPI(placeId, language, apiKey)
  await savePlaceToCache(placeData, language)
  
  return NextResponse.json({ status: 'OK', result: placeData })
}
```

### 案2: キャッシュの段階的エンリッチメント

**概要**: キャッシュに「情報レベル」を記録し、必要に応じて段階的に詳細情報を取得

**メリット**:
- キャッシュの状態を明確に管理できる
- 用途に応じて必要な情報のみ取得できる
- APIコストを最適化できる

**デメリット**:
- スキーマ変更が必要
- 実装が複雑

**実装方針**:

```typescript
// lib/core/types/place.ts に追加
export interface PlacesCache {
  // ... 既存フィールド ...
  
  // 情報レベル（新規追加）
  // 'basic': Place Search APIの結果のみ（無料）
  // 'standard': Basic + Contact Data（$3.00/1,000件）
  // 'full': Basic + Contact + Atmosphere Data（$5.00/1,000件）
  information_level?: 'basic' | 'standard' | 'full'
}

// lib/api/places-cache.ts に追加
export async function enrichPlaceCache(
  placeId: string,
  language: SupportedLanguage,
  targetLevel: 'standard' | 'full' = 'full'
): Promise<PlacesCache> {
  const cached = await getPlaceFromCache(placeId, language)
  
  // 既に目標レベル以上の情報があればそのまま返す
  if (cached && cached.information_level) {
    const levels = ['basic', 'standard', 'full']
    const currentLevel = levels.indexOf(cached.information_level)
    const targetLevelIndex = levels.indexOf(targetLevel)
    
    if (currentLevel >= targetLevelIndex) {
      return cached
    }
  }
  
  // 不足している情報を取得
  const placeData = await fetchPlaceDetailsFromAPI(placeId, language, apiKey)
  
  // 既存のキャッシュとマージ
  const enrichedCache: PlacesCacheInput = {
    ...(cached || {}),
    ...placeData,
    information_level: targetLevel,
    cached_at: new Date(),
    last_accessed: new Date(),
    access_count: (cached?.access_count || 0) + 1
  }
  
  await savePlaceToCache(enrichedCache, language)
  return enrichedCache
}
```

### 案3: 用途別のキャッシュ取得関数

**概要**: 用途（Venue検索、POIDialog表示など）に応じて異なるキャッシュ取得関数を提供

**メリット**:
- 用途ごとに最適化された取得が可能
- 実装が明確

**デメリット**:
- 関数が増える
- 用途の定義が必要

**実装方針**:

```typescript
// lib/api/places-cache.ts に追加

/**
 * POIDialog表示用の場所データを取得
 * 詳細情報（price_level, rating, editorial_summary等）が必要
 */
export async function getPlaceForPOIDialog(
  placeId: string,
  language: SupportedLanguage
): Promise<PlacesCache | null> {
  const cached = await getPlaceFromCache(placeId, language)
  
  // 詳細情報が不足している場合はAPIから取得
  if (!cached || !cached.price_level || !cached.rating) {
    logger.info('Cache incomplete for POI dialog, fetching details', { placeId, language })
    const placeData = await fetchPlaceDetailsFromAPI(placeId, language, apiKey)
    await savePlaceToCache(placeData, language)
    return placeData as PlacesCache
  }
  
  return cached
}

/**
 * Venue検索用の場所データを取得
 * 基本的な情報（name, address, geometry）のみで十分
 */
export async function getPlaceForVenueSearch(
  placeId: string,
  language: SupportedLanguage
): Promise<PlacesCache | null> {
  // 既存のgetPlaceFromCacheで十分
  return await getPlaceFromCache(placeId, language)
}
```

## 推奨実装: 案1 + 案3のハイブリッド

### 実装ステップ

1. **情報完全性チェック関数の追加**（案1）
   - `checkCacheCompleteness()`: キャッシュの完全性をチェック
   - `getPlaceFromCacheWithCompleteness()`: 完全性チェック付きキャッシュ取得

2. **用途別の取得関数の追加**（案3）
   - `getPlaceForPOIDialog()`: POIDialog表示用（詳細情報必須）
   - `getPlaceForVenueSearch()`: Venue検索用（基本情報のみ）

3. **既存コードの更新**
   - `app/api/places/details/route.ts`: POIDialogからのリクエスト時は`getPlaceForPOIDialog()`を使用
   - `components/modals/POIDialog.tsx`: 詳細情報が必要な場合は`getPlaceForPOIDialog()`を使用

4. **段階的エンリッチメントの検討**（将来的）
   - 案2の`information_level`フィールドを追加
   - キャッシュの状態を明確に管理

### 実装例

```typescript
// lib/api/places-cache.ts

/**
 * キャッシュの情報完全性をチェック
 */
export function checkCacheCompleteness(
  cached: PlacesCache,
  requiredFields: (keyof PlacesCache)[]
): (keyof PlacesCache)[] {
  const missingFields: (keyof PlacesCache)[] = []
  
  for (const field of requiredFields) {
    const value = cached[field]
    if (value === undefined || value === null || 
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'string' && value === '')) {
      missingFields.push(field)
    }
  }
  
  return missingFields
}

/**
 * POIDialog表示用の場所データを取得
 * 詳細情報（price_level, rating, editorial_summary等）が必要
 */
export async function getPlaceForPOIDialog(
  placeId: string,
  language: SupportedLanguage
): Promise<PlacesCache | null> {
  const cached = await getPlaceFromCache(placeId, language)
  
  // POIDialogで必要なフィールド
  const requiredFields: (keyof PlacesCache)[] = [
    'price_level',
    'rating',
    'user_ratings_total',
    'editorial_summary'
  ]
  
  if (cached) {
    const missingFields = checkCacheCompleteness(cached, requiredFields)
    
    if (missingFields.length === 0) {
      // 必要な情報が揃っている
      return cached
    }
    
    logger.info('Cache incomplete for POI dialog, missing fields:', { 
      placeId, 
      language, 
      missingFields 
    })
  }
  
  // キャッシュが存在しない、または不完全な場合はAPIから取得
  // 注意: この関数内でfetchPlaceDetailsFromAPIを直接呼び出すのは循環依存になる可能性があるため、
  // 呼び出し側で処理するか、別のヘルパー関数を作成する
  return null // 呼び出し側でAPI取得を実行
}

/**
 * Venue検索用の場所データを取得
 * 基本的な情報（name, address, geometry）のみで十分
 */
export async function getPlaceForVenueSearch(
  placeId: string,
  language: SupportedLanguage
): Promise<PlacesCache | null> {
  return await getPlaceFromCache(placeId, language)
}
```

```typescript
// app/api/places/details/route.ts の更新

export const POST = composeMiddleware(
  withGooglePlacesKey(),
  withBodyValidation(PlaceDetailsSchema)
)(async (request: NextRequest, ctx) => {
  const { placeId, language } = ctx.body
  const validLanguage: SupportedLanguage = language && isSupportedLanguage(language) 
    ? language 
    : DEFAULT_LANGUAGE

  // POIDialogからのリクエストかどうかを判定（リクエストヘッダーやクエリパラメータで判定）
  const isForPOIDialog = request.headers.get('X-Request-Purpose') === 'poi-dialog'
  
  let cached: PlacesCache | null = null
  
  if (isForPOIDialog) {
    // POIDialog用: 詳細情報が必要
    cached = await getPlaceForPOIDialog(placeId, validLanguage)
    
    // 不完全なキャッシュの場合はnullが返される
    if (cached) {
      return NextResponse.json({ status: 'OK', result: cached })
    }
  } else {
    // 通常のリクエスト: 既存のロジック
    cached = await getPlaceFromCache(placeId, validLanguage)
    
    if (cached) {
      const isStale = isCacheStale(cached, SOFT_TTL_MS)
      
      if (isStale) {
        refreshPlaceInBackground(placeId, validLanguage, GOOGLE_PLACES_API_KEY).catch(err => {
          logger.warn('Background refresh failed:', err)
        })
      }
      
      return NextResponse.json({ status: 'OK', result: cached })
    }
  }

  // キャッシュミスまたは不完全な場合、APIから取得
  logger.info('Cache miss or incomplete, fetching from API', { placeId, language: validLanguage })
  const placeData = await fetchPlaceDetailsFromAPI(placeId, validLanguage, GOOGLE_PLACES_API_KEY)
  
  try {
    await savePlaceToCache(placeData, validLanguage)
  } catch (cacheError) {
    logger.warn('Failed to save to cache:', cacheError)
  }
  
  return NextResponse.json({ status: 'OK', result: placeData })
})
```

```typescript
// components/modals/POIDialog.tsx の更新

const fetchPlaceDetails = useCallback(async () => {
  if (!currentPlaceId) return
  
  setLoading(true)
  
  try {
    // POIDialog用のリクエストであることを示すヘッダーを追加
    const response = await fetch('/api/places/details', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Purpose': 'poi-dialog' // 新規追加
      },
      body: JSON.stringify({
        placeId: currentPlaceId,
        language: language
      })
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch place details: ${response.status}`)
    }
    
    const data = await response.json()
    const details = data.result
    
    setPlaceDetails(details)
    // ... 既存の処理 ...
  } catch (error) {
    logger.error('Error fetching place details:', error)
  } finally {
    setLoading(false)
  }
}, [currentPlaceId, language])
```

## 今後の拡張

### 段階的エンリッチメントの実装

将来的には、案2の`information_level`フィールドを追加して、キャッシュの状態を明確に管理することを検討する。

```typescript
// lib/core/types/place.ts
export interface PlacesCache {
  // ... 既存フィールド ...
  information_level?: 'basic' | 'standard' | 'full'
}

// lib/api/places-cache.ts
export async function enrichPlaceCacheToLevel(
  placeId: string,
  language: SupportedLanguage,
  targetLevel: 'standard' | 'full'
): Promise<PlacesCache> {
  // 実装...
}
```

## まとめ

- **即座に実装可能**: 案1 + 案3のハイブリッド
- **段階的な改善**: まずは情報完全性チェックを実装し、用途別関数を追加
- **将来的な拡張**: `information_level`フィールドを追加して段階的エンリッチメントを実装

この戦略により、APIコストを抑えつつ、必要な情報を適切に取得できるようになる。

