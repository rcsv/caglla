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

**⚠️ 重要な留意点: 意図的な欠損とフィールドマスキングの対応**

Place Details APIで特定のフィールド（例：`reviews`）を要求しても、その場所がその情報を持たない場合（例：レビューが0件の新しい店舗）、APIレスポンスからそのフィールドが**意図的に欠落**して返されることがあります。

- APIから情報が得られなかった欠損（`undefined`や`null`）を、永遠に「不足」と見なしてクエリし続けると、無駄なAPIコールが発生する可能性があります。
- 一度Place Details APIを完全なフィールドセットで呼び出した結果、特定のフィールドが欠損していた場合、その欠損は**永続的**である可能性が高いです。

**改善案: 永続的な欠損フラグの導入**

| キャッシュフィールド | 説明 |
| :--- | :--- |
| `is_complete` | キャッシュが一度でもフルセットでAPIから取得されたかを示すブール値。 |
| `missing_data_flags` | `{ editorial_summary: true, reviews: false }` のように、APIをフルコールした際に**データがなかった**フィールドを記録するマップ。 |

**実装方針**:

```typescript
// lib/core/types/place.ts に追加
export interface PlacesCache {
  // ... 既存フィールド ...
  
  // 永続的な欠損フラグ（新規追加）
  is_complete?: boolean // 一度でもフルセットでAPIから取得されたか
  missing_data_flags?: Record<string, boolean> // データが存在しないフィールドの記録
}

// lib/api/places-cache.ts に追加

/**
 * キャッシュの情報完全性をチェック
 * 
 * @param cached - キャッシュデータ
 * @param requiredFields - 必須フィールドのリスト
 * @returns 不足しているフィールドのリスト（永続的な欠損は除外）
 */
export function checkCacheCompleteness(
  cached: PlacesCache,
  requiredFields: (keyof PlacesCache)[]
): (keyof PlacesCache)[] {
  const missingFields: (keyof PlacesCache)[] = []
  
  for (const field of requiredFields) {
    const value = cached[field]
    
    // 永続的な欠損フラグをチェック
    // 一度APIを呼び出してデータが存在しなかった場合は、再度クエリしない
    if (cached.missing_data_flags?.[field as string] === true) {
      // このフィールドは永続的に欠損しているため、不足として扱わない
      continue
    }
    
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
 * APIレスポンスから永続的な欠損フラグを更新
 * 
 * @param cached - 既存のキャッシュデータ
 * @param apiResponse - APIレスポンス
 * @returns 更新された欠損フラグ
 */
export function updateMissingDataFlags(
  cached: PlacesCache | null,
  apiResponse: PlaceDetailsResult
): Record<string, boolean> {
  const missingFlags: Record<string, boolean> = { ...(cached?.missing_data_flags || {}) }
  
  // APIレスポンスで欠損しているフィールドを記録
  const fieldsToCheck: (keyof PlaceDetailsResult)[] = [
    'price_level',
    'rating',
    'user_ratings_total',
    'editorial_summary',
    'reviews',
    'opening_hours',
    'website',
    'formatted_phone_number'
  ]
  
  for (const field of fieldsToCheck) {
    const value = apiResponse[field]
    if (value === undefined || value === null ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'string' && value === '')) {
      // APIレスポンスに含まれていない = データが存在しない
      missingFlags[field as string] = true
    } else {
      // データが存在する場合は、欠損フラグを削除
      delete missingFlags[field as string]
    }
  }
  
  return missingFlags
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

### 案3: 用途別のキャッシュ取得関数（改善版）

**概要**: 用途（Venue検索、POIDialog表示など）に応じて異なるキャッシュ取得関数を提供

**⚠️ 改善提案: リクエストパラメータでの要求フィールドの伝達**

現在のアーキテクチャでは、クライアント（`POIDialog.tsx`）がプロキシ（`app/api/places/details/route.ts`）を呼び出し、プロキシがキャッシュとAPIコールを管理しています。

- `POIDialog.tsx` からの呼び出し時に、**「どのフィールドが必要か」**を明示的にプロキシに伝達することが、最もシンプルでコストを制御しやすい方法です。
- ヘッダーではなく、リクエストボディで必要なフィールドのリストを渡す方が、RESTfulな設計に近く、プロキシ側でそのままフィールドマスキングのパラメータとして利用できます。

**メリット**:
- 用途ごとに最適化された取得が可能
- 実装が明確
- プロキシ側が常に完全性チェックとフィールドマスキングのロジックを担う
- クライアントの役割がシンプル

**デメリット**:
- スキーマ変更が必要（`requiredFields`をリクエストボディに追加）

**実装方針**:

```typescript
// lib/schemas/place.ts に追加
export const PlaceDetailsSchema = z.object({
  placeId: z.string().min(1),
  language: z.string().optional().default(DEFAULT_LANGUAGE),
  // ★ 新規追加: 必須フィールドのリスト ★
  requiredFields: z.array(z.string()).optional().default([])
})

// components/modals/POIDialog.tsx (クライアント)
const response = await fetch('/api/places/details', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    placeId: currentPlaceId,
    language: language,
    // ★ 必須フィールドを明示的に渡す ★
    requiredFields: ['price_level', 'rating', 'editorial_summary', 'user_ratings_total']
  })
})
```

## 推奨実装: 案1 + 案3 + コスト最適化のハイブリッド

### 実装ステップ

1. **情報完全性チェック関数の追加**（案1）
   - `checkCacheCompleteness()`: キャッシュの完全性をチェック（意図的な欠損を考慮）
   - 永続的な欠損フラグ（`is_complete`, `missing_data_flags`）の導入

2. **リクエストベースのフィールド要求**（案3の改善版）
   - クライアントから`requiredFields`をリクエストボディで渡す
   - プロキシ側でフィールドマスキングを最適化

3. **フィールドマスキングの最適化**
   - 不足しているフィールドのみをPlace Details APIに要求
   - キャッシュの統合更新（エンリッチメント）

4. **既存コードの更新**
   - `app/api/places/details/route.ts`: `requiredFields`を受け取り、フィールドマスキングを最適化
   - `components/modals/POIDialog.tsx`: `requiredFields`をリクエストボディで渡す

5. **段階的エンリッチメントの検討**（将来的）
   - 案2の`information_level`フィールドを追加
   - キャッシュの状態を明確に管理

### 実装例: 最終的な推奨実装（案1 + 案3 + コスト最適化）

| ステップ | 処理内容 | コスト効果 |
| :--- | :--- | :--- |
| **1. クライアント要求** | クライアントは必要な情報（`price_level`、`rating`など）を `requiredFields` としてプロキシに渡す。 | UXに応じて要求を限定。 |
| **2. キャッシュ完全性チェック** | プロキシは、キャッシュ内のデータが `requiredFields` の要件を満たしているかチェックする。 | **キャッシュヒット率向上**（不完全でも利用可能なら利用）。 |
| **3. APIコール（エンリッチメント）** | キャッシュが不完全な場合、**不足しているフィールドのみ**を Place Details APIに要求する。 | **フィールドマスキングの最適化**。二度目の呼び出しでも無駄なフィールドは要求しない。 |
| **4. キャッシュの統合更新** | APIレスポンスと既存のキャッシュをマージし、不足していたフィールドを補完する（エンリッチメント）。 | キャッシュの情報を徐々に「充実」させる。 |

```typescript
// lib/schemas/place.ts に追加
export const PlaceDetailsSchema = z.object({
  placeId: z.string().min(1),
  language: z.string().optional().default(DEFAULT_LANGUAGE),
  // ★ 新規追加: 必須フィールドのリスト ★
  requiredFields: z.array(z.string()).optional().default([])
})

// lib/api/places-cache.ts

/**
 * キャッシュの情報完全性をチェック（永続的な欠損を考慮）
 */
export function checkCacheCompleteness(
  cached: PlacesCache,
  requiredFields: (keyof PlacesCache)[]
): (keyof PlacesCache)[] {
  const missingFields: (keyof PlacesCache)[] = []
  
  for (const field of requiredFields) {
    const value = cached[field]
    
    // 永続的な欠損フラグをチェック
    if (cached.missing_data_flags?.[field as string] === true) {
      // このフィールドは永続的に欠損しているため、不足として扱わない
      continue
    }
    
    if (value === undefined || value === null || 
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'string' && value === '')) {
      missingFields.push(field)
    }
  }
  
  return missingFields
}

/**
 * APIレスポンスから永続的な欠損フラグを更新
 */
export function updateMissingDataFlags(
  cached: PlacesCache | null,
  apiResponse: PlaceDetailsResult
): Record<string, boolean> {
  const missingFlags: Record<string, boolean> = { ...(cached?.missing_data_flags || {}) }
  
  const fieldsToCheck: (keyof PlaceDetailsResult)[] = [
    'price_level', 'rating', 'user_ratings_total', 'editorial_summary',
    'reviews', 'opening_hours', 'website', 'formatted_phone_number'
  ]
  
  for (const field of fieldsToCheck) {
    const value = apiResponse[field]
    if (value === undefined || value === null ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'string' && value === '')) {
      missingFlags[field as string] = true
    } else {
      delete missingFlags[field as string]
    }
  }
  
  return missingFlags
}

/**
 * キャッシュをエンリッチメント（既存データとマージ）
 */
export async function enrichPlaceCache(
  placeId: string,
  language: SupportedLanguage,
  newData: PlaceDetailsResult
): Promise<void> {
  const existing = await getPlaceFromCache(placeId, language)
  
  // 既存のキャッシュと新しいデータをマージ
  const enrichedData: PlacesCacheInput = {
    ...(existing || {}),
    ...newData,
    place_id: placeId,
    language: language,
    format_version: CACHE_FORMAT_VERSION,
    is_complete: true, // フルセットで取得したことを記録
    missing_data_flags: updateMissingDataFlags(existing, newData),
    cached_at: existing?.cached_at ? toDateOrNull(existing.cached_at) || new Date() : new Date(),
    last_accessed: new Date(),
    access_count: (existing?.access_count || 0) + 1
  }
  
  await savePlaceToCache(enrichedData, language)
}
```

```typescript
// app/api/places/details/route.ts の更新

/**
 * Google Places APIから場所詳細を取得（フィールドマスキング対応）
 */
async function fetchPlaceDetailsFromAPI(
  placeId: string,
  language: SupportedLanguage,
  apiKey: string,
  // ★ ここがキー: 必要なフィールドのみを指定 ★
  fields: string[] = []
): Promise<PlaceDetailsResult> {
  // フィールドマスクを構築（fieldsが指定されていない場合は全フィールド）
  const defaultFields = [
    'id', 'displayName', 'formattedAddress', 'location', 'addressComponents',
    'types', 'businessStatus', 'photos', 'googleMapsUri', 'shortFormattedAddress',
    'nationalPhoneNumber', 'internationalPhoneNumber', 'websiteUri', 'regularOpeningHours',
    'rating', 'userRatingCount', 'priceLevel', 'editorialSummary', 'reviews'
  ]
  
  const fieldsToFetch = fields.length > 0 ? fields : defaultFields
  const fieldMask = fieldsToFetch.join(',')
  
  // ... 既存のAPI呼び出しロジック ...
  const response = await fetch(
    `${GOOGLE_PLACES_API_URL}/${placeId}?languageCode=${language}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask, // ★ フィールドマスキング ★
        'Accept-Language': language
      }
    }
  )
  
  // ... レスポンス処理 ...
}

export const POST = composeMiddleware(
  withGooglePlacesKey(),
  withBodyValidation(PlaceDetailsSchema)
)(async (request: NextRequest, ctx) => {
  const GOOGLE_PLACES_API_KEY = ctx.apiKeys!.GOOGLE_PLACES!
  const body = ctx.body as z.infer<typeof PlaceDetailsSchema>
  const { placeId, language, requiredFields = [] } = body
  
  const validLanguage: SupportedLanguage = language && isSupportedLanguage(language) 
    ? language 
    : DEFAULT_LANGUAGE

  logger.debug('Getting place details', { placeId, language: validLanguage, requiredFields })

  // 1. キャッシュを確認
  const cached = await getPlaceFromCache(placeId, validLanguage)
  
  if (cached) {
    // 2. キャッシュ完全性チェック
    if (requiredFields.length > 0) {
      const missingFields = checkCacheCompleteness(cached, requiredFields as (keyof PlacesCache)[])
      
      if (missingFields.length === 0) {
        // 必要な情報が揃っている
        logger.info('Cache hit (complete)', { placeId, language: validLanguage })
        return NextResponse.json({ status: 'OK', result: cached })
      }
      
      // 3. 不足しているフィールドのみをAPIに要求
      logger.info('Cache incomplete, enriching with missing fields', { 
        placeId, 
        language: validLanguage,
        missingFields 
      })
      
      // 不足しているフィールドをGoogle Places APIのフィールド名に変換
      const fieldsToFetch = missingFields.map(field => {
        const fieldMap: Record<string, string> = {
          'price_level': 'priceLevel',
          'rating': 'rating',
          'user_ratings_total': 'userRatingCount',
          'editorial_summary': 'editorialSummary',
          'reviews': 'reviews',
          'opening_hours': 'regularOpeningHours',
          'website': 'websiteUri',
          'formatted_phone_number': 'nationalPhoneNumber'
        }
        return fieldMap[field as string] || field
      })
      
      // 基本フィールドも含める（place_id, name等は常に必要）
      const allFields = ['id', 'displayName', 'formattedAddress', 'location', ...fieldsToFetch]
      
      const placeData = await fetchPlaceDetailsFromAPI(placeId, validLanguage, GOOGLE_PLACES_API_KEY, allFields)
      
      // 4. キャッシュの統合更新（エンリッチメント）
      await enrichPlaceCache(placeId, validLanguage, placeData)
      
      // エンリッチメント後のキャッシュを取得して返す
      const enrichedCache = await getPlaceFromCache(placeId, validLanguage)
      return NextResponse.json({ status: 'OK', result: enrichedCache })
    } else {
      // requiredFieldsが指定されていない場合は既存のロジック
      const isStale = isCacheStale(cached, SOFT_TTL_MS)
      
      if (isStale) {
        refreshPlaceInBackground(placeId, validLanguage, GOOGLE_PLACES_API_KEY).catch(err => {
          logger.warn('Background refresh failed:', err)
        })
      }
      
      return NextResponse.json({ status: 'OK', result: cached })
    }
  }

  // キャッシュミス: APIから取得
  logger.info('Cache miss, fetching from API', { placeId, language: validLanguage })
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
    // ★ requiredFieldsをリクエストボディで渡す ★
    const response = await fetch('/api/places/details', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        placeId: currentPlaceId,
        language: language,
        // ★ 必須フィールドを明示的に渡す ★
        requiredFields: ['price_level', 'rating', 'editorial_summary', 'user_ratings_total']
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

### 最終的な推奨実装（改訂版）

**🎯 方針: 案1 + 案3のシンプル化版**

- **情報完全性チェック**: 必要なフィールドのみをチェック（PlacesCache全体ではない）
- **リクエストベースのフィールド要求**: クライアントから`requiredFields`を明示的に渡す
- **永続的な欠損フラグ**: **本当に使う7個だけ**に限定（全フィールドには適用しない）
- **フィールドマスキングの最適化**: 不足しているフィールドのみをAPIに要求

### ⚠️ 重要な設計原則

1. **missing_data_flagsは限定的に使う**
   - 対象フィールドは「本当に使うものだけ」の7個に固定
   - むやみに増やさない（Googleのフィールド変更に対する耐性を保つ）

2. **完全性チェックは必要なフィールドのみ**
   - `requiredFields`だけをチェック
   - PlacesCache全体の完全性は要求しない

3. **案2（information_level）は不要**
   - 段階的エンリッチメントで十分
   - 複雑化を避ける

### 実装の優先順位

**Phase 1（即座に実装）**:
- `requiredFields`をリクエストボディで受け取る
- `checkCacheCompleteness()`の実装（7個のフィールドのみ対象）
- `fetchPlaceDetailsFromAPI()`に`fields`パラメータを追加
- `enrichPlaceCache()`の実装（キャッシュの統合更新）

**Phase 2（将来的に検討）**:
- 使用頻度の分析に基づいてフィールド対象の調整
- キャッシュヒット率のモニタリング

### 期待される効果

| カテゴリ | 効果 |
| :--- | :--- |
| **UX** | POIDialogで必要な情報が確実に表示される |
| **APIコスト** | 不足フィールドのみ要求 + レビュー0件の再問い合わせ防止 |
| **キャッシュ** | 徐々にエンリッチされる「学習するキャッシュ」 |
| **コード管理** | シンプルで保守しやすい設計 |

この戦略により、Google Places APIのコストと情報不足という**トレードオフを適切に解決**し、コスト効率とUX向上の両面で最善策を実現できます。

---

## 実装詳細

### 対象フィールドの定数定義

```typescript
// lib/api/places-cache.ts

/**
 * 永続的な欠損フラグを管理する対象フィールド
 * 
 * ⚠️ 注意: むやみに増やさない！
 * Googleが頻繁に変更・追加するフィールドは含めない
 */
export const MISSING_FLAG_TARGETS = [
  'editorial_summary',
  'reviews',
  'opening_hours',
  'website',
  'formatted_phone_number',
  'rating',
  'price_level'
] as const

export type MissingFlagTarget = typeof MISSING_FLAG_TARGETS[number]
```

### 型定義の追加

```typescript
// lib/core/types/place.ts

export interface PlacesCache {
  // ... 既存フィールド ...
  
  // 永続的な欠損フラグ（7個のフィールドのみ対象）
  missing_data_flags?: Record<string, boolean>
}
```

---

## 実装完了

### ✅ 実装済みファイル

以下のファイルが更新され、Place Cacheエンリッチメント戦略が実装されました：

1. **`lib/core/types/place.ts`** - `missing_data_flags`フィールドの追加
2. **`lib/api/places-cache.ts`** - 完全性チェックとエンリッチメント関数の追加
   - `MISSING_FLAG_TARGETS`: 対象フィールドの定義（7個）
   - `checkCacheCompleteness()`: キャッシュ完全性チェック
   - `updateMissingDataFlags()`: 永続的な欠損フラグの更新
   - `enrichPlaceCache()`: キャッシュの統合更新（エンリッチメント）

3. **`lib/schemas/place.ts`** - `PlaceDetailsSchema`に`requiredFields`パラメータを追加
4. **`app/api/places/details/route.ts`** - プロキシサーバーの更新
   - `requiredFields`の受け取り
   - キャッシュ完全性チェック
   - 不足フィールドのみをAPIに要求
   - フィールドマスキングの最適化
   - キャッシュの統合更新

5. **`lib/api/google/places.ts`** - `getPlaceDetails()`に`requiredFields`パラメータを追加
6. **`components/modals/POIDialog.tsx`** - POIDialogで必要なフィールドを明示的に要求

### 使用例

#### クライアント側（POIDialog）

```typescript
// POIDialogで必要なフィールドを明示的に要求
const requiredFields = [
  'price_level',
  'rating',
  'user_ratings_total',
  'editorial_summary',
  'reviews',
  'opening_hours',
  'website',
  'formatted_phone_number'
]

const details = await placesApiHelpers.getPlaceDetails(
  currentPlaceId, 
  language,
  requiredFields
)
```

#### プロキシサーバー（`app/api/places/details/route.ts`）

```typescript
// 1. キャッシュを確認
const cached = await getPlaceFromCache(placeId, validLanguage)

if (cached) {
  // 2. キャッシュ完全性チェック
  if (requiredFields.length > 0) {
    const missingFields = checkCacheCompleteness(cached, requiredFields)
    
    if (missingFields.length === 0) {
      // 必要な情報が揃っている
      return NextResponse.json({ status: 'OK', result: cached })
    }
    
    // 3. 不足しているフィールドのみをAPIに要求
    const placeData = await fetchPlaceDetailsFromAPI(
      placeId, 
      validLanguage, 
      GOOGLE_PLACES_API_KEY, 
      allFields
    )
    
    // 4. キャッシュの統合更新（エンリッチメント）
    await enrichPlaceCache(placeId, validLanguage, placeData)
    
    // エンリッチメント後のキャッシュを取得して返す
    const enrichedCache = await getPlaceFromCache(placeId, validLanguage)
    return NextResponse.json({ status: 'OK', result: enrichedCache })
  }
}
```

### テスト方法

1. **POIDialogを開く**
   - マップ上のマーカーをクリックしてPOIDialogを開く
   - 初回表示時はAPIが呼び出される

2. **キャッシュヒット**
   - 同じ場所を再度開くと、キャッシュがヒットする
   - ログに「Cache hit (complete)」が表示される

3. **キャッシュエンリッチメント**
   - 不完全なキャッシュがある場合、不足フィールドのみがAPIに要求される
   - ログに「Cache incomplete, enriching with missing fields」が表示される
   - エンリッチメント後のキャッシュが返却される

4. **永続的な欠損**
   - レビュー0件の場所を開く
   - 2回目以降は`reviews`フィールドが永続的に欠損としてマークされる
   - ログに「missing_data_flags」が記録される

### ログの確認方法

```bash
# 開発環境でログを確認
pnpm dev

# ブラウザのコンソールでログを確認
# "Cache hit (complete)" - 完全なキャッシュヒット
# "Cache incomplete, enriching with missing fields" - エンリッチメント
# "Cache miss, fetching from API" - キャッシュミス
```

### 期待される効果

| カテゴリ | 効果 | 実装状況 |
| :--- | :--- | :--- |
| **UX** | POIDialogで必要な情報が確実に表示される | ✅ 完了 |
| **APIコスト** | 不足フィールドのみ要求 + レビュー0件の再問い合わせ防止 | ✅ 完了 |
| **キャッシュ** | 徐々にエンリッチされる「学習するキャッシュ」 | ✅ 完了 |
| **コード管理** | シンプルで保守しやすい設計 | ✅ 完了 |

### 今後の拡張

- キャッシュヒット率のモニタリング
- 使用頻度の分析に基づいてフィールド対象の調整
- UI側のフォールバック戦略（「レビューがありません」表示）

---

## UI側のフォールバック戦略（将来の実装）

### 「レビューがありません」の表示例

```typescript
// components/modals/POIDialog.tsx

// レビューの表示
{placeDetails.reviews && placeDetails.reviews.length > 0 ? (
  <div className="reviews-section">
    {/* レビュー表示 */}
  </div>
) : (
  <div className="no-reviews">
    <p className="text-sm text-gray-500">
      {t('poi.noReviews')} {/* 「レビューがありません」 */}
    </p>
  </div>
)}

// 営業時間の表示
{placeDetails.opening_hours ? (
  <div className="opening-hours-section">
    {/* 営業時間表示 */}
  </div>
) : (
  <div className="no-opening-hours">
    <p className="text-sm text-gray-500">
      {t('poi.noOpeningHours')} {/* 「営業時間情報がありません」 */}
    </p>
  </div>
)}
```

### 価格レベルの表示例

```typescript
// 価格レベルの表示（永続的な欠損を考慮）
{placeDetails.price_level !== undefined ? (
  <div className="price-level-section">
    <span className="price-level">
      {'$'.repeat(placeDetails.price_level + 1)}
    </span>
  </div>
) : placeDetails.missing_data_flags?.price_level ? (
  <div className="no-price-info">
    <p className="text-sm text-gray-500">
      {t('poi.noPriceInfo')} {/* 「価格情報がありません」 */}
    </p>
  </div>
) : (
  <div className="loading-price-info">
    <p className="text-sm text-gray-400">
      {t('poi.loadingPriceInfo')} {/* 「価格情報を読み込み中...」 */}
    </p>
  </div>
)}
```

この実装により、Google Places APIのコストと情報不足という**トレードオフを適切に解決**し、コスト効率とUX向上の両面で最善策を実現できます。

