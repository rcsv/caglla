# API仕様書

## 概要

Caglla Travel ManagerのAPIエンドポイント仕様書です。Next.js App Routerを使用したRESTful APIを提供しています。

## 認証

すべてのAPIエンドポイントはFirebase AuthenticationのIDトークンによる認証が必要です。

```http
Authorization: Bearer <ID_TOKEN>
```

## エンドポイント一覧

### 1. 旅行管理 (Trips)

#### GET /api/trips
ユーザーの旅行一覧を取得します。

**クエリパラメータ:**
- `groupByCountry` (boolean, optional): 国別にグループ化するかどうか

**レスポンス:**
```json
{
  "trips": [
    {
      "id": "trip_id",
      "title": "旅行タイトル",
      "slug": "trip-slug",
      "destination": "目的地",
      "destination_place_id": "place_id",
      "destination_place": { /* PlaceData */ },
      "start_date": "2024-01-01",
      "end_date": "2024-01-07",
      "access_level": "private",
      "status": "PLANNING",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "creator": { /* User */ }
    }
  ],
  "grouped": false,
  "totalTrips": 5,
  "totalCountries": 3
}
```

#### POST /api/trips
新しい旅行を作成します。

**リクエストボディ:**
```json
{
  "title": "旅行タイトル",
  "description": "旅行の説明",
  "destination": "目的地",
  "destinationPlace": { /* PlaceData */ },
  "destinationPlaceId": "place_id",
  "startDate": "2024-01-01",
  "endDate": "2024-01-07",
  "accessLevel": "private",
  "imageUrl": "https://example.com/image.jpg"
}
```

**レスポンス:**
```json
{
  "id": "trip_id",
  "title": "旅行タイトル",
  "slug": "trip-slug",
  "destination": "目的地",
  "destination_place_id": "place_id",
  "destination_place": { /* PlaceData */ },
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2024-01-07T00:00:00Z",
  "access_level": "private",
  "status": "PLANNING",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "creator": { /* User */ }
}
```

### 2. 旅程管理 (Itineraries)

#### GET /api/itineraries
指定された日の旅程を取得します。

**クエリパラメータ:**
- `day_id` (string, required): 日ID

**レスポンス:**
```json
[
  {
    "id": "itinerary_id",
    "day_id": "day_id",
    "sort_number": 1,
    "title": "スケジュールタイトル",
    "description": "説明",
    "location": "場所",
    "place_id": "place_id",
    "place_data": { /* PlaceData */ },
    "start_time": "09:00",
    "end_time": "12:00",
    "timezone": "Asia/Tokyo",
    "cost_amount": 1000,
    "cost_currency": "JPY",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

#### POST /api/itineraries
新しい旅程を作成します。

**リクエストボディ:**
```json
{
  "day_id": "day_id",
  "place_id": "place_id",
  "place_data": { /* PlaceData */ },
  "title": "スケジュールタイトル",
  "description": "説明",
  "location": "場所"
}
```

**レスポンス:**
```json
{
  "id": "itinerary_id",
  "day_id": "day_id",
  "sort_number": 1,
  "title": "スケジュールタイトル",
  "description": "説明",
  "location": "場所",
  "place_id": "place_id",
  "place_data": { /* PlaceData */ },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### POST /api/itineraries/insert
指定位置に旅程を挿入します。

**リクエストボディ:**
```json
{
  "day_id": "day_id",
  "place_id": "place_id",
  "place_data": { /* PlaceData */ },
  "title": "スケジュールタイトル",
  "description": "説明",
  "location": "場所",
  "insert_after_index": 2
}
```

### 3. 場所検索 (Places)

#### POST /api/places/search
場所を検索します。

**リクエストボディ:**
```json
{
  "query": "検索クエリ"
}
```

**レスポンス:**
```json
{
  "status": "OK",
  "results": [
    {
      "place_id": "place_id",
      "name": "場所名",
      "formatted_address": "住所",
      "geometry": {
        "location": {
          "lat": 35.6762,
          "lng": 139.6503
        }
      },
      "types": ["tourist_attraction"],
      "rating": 4.5,
      "price_level": 2,
      "photos": [
        {
          "photo_reference": "photo_ref",
          "height": 400,
          "width": 400
        }
      ]
    }
  ]
}
```

#### POST /api/places/details
場所の詳細情報を取得します。

**リクエストボディ:**
```json
{
  "placeId": "place_id"
}
```

**レスポンス:**
```json
{
  "status": "OK",
  "result": {
    "place_id": "place_id",
    "name": "場所名",
    "formatted_address": "住所",
    "address_components": [
      {
        "long_name": "日本",
        "short_name": "JP",
        "types": ["country"]
      }
    ],
    "geometry": {
      "location": {
        "lat": 35.6762,
        "lng": 139.6503
      }
    },
    "types": ["tourist_attraction"],
    "rating": 4.5,
    "price_level": 2,
    "photos": [
      {
        "photo_reference": "photo_ref",
        "height": 400,
        "width": 400
      }
    ],
    "opening_hours": {
      "open_now": true,
      "weekday_text": ["月曜日: 9:00 AM – 5:00 PM"]
    },
    "international_phone_number": "+81-3-1234-5678",
    "website": "https://example.com",
    "editorial_summary": {
      "overview": "場所の概要"
    }
  }
}
```

### 4. ルート最適化 (Route Optimization)

#### POST /api/route-optimization
ルートの最適化を実行します。

**リクエストボディ:**
```json
{
  "origin": "35.6762,139.6503",
  "destination": "35.6581,139.7414",
  "waypoints": [
    "35.6762,139.6503",
    "35.6581,139.7414"
  ],
  "travelMode": "DRIVING",
  "optimizeWaypoints": true,
  "avoidHighways": false,
  "avoidTolls": false,
  "avoidFerries": false
}
```

**レスポンス:**
```json
{
  "routes": [
    {
      "legs": [
        {
          "distance": {
            "text": "10.5 km",
            "value": 10500
          },
          "duration": {
            "text": "25 分",
            "value": 1500
          }
        }
      ]
    }
  ],
  "status": "OK",
  "optimizedOrder": [0, 1],
  "totalDistance": {
    "meters": 10500,
    "text": "10.5 km"
  },
  "totalDuration": {
    "seconds": 1500,
    "text": "25 分"
  },
  "costEstimate": {
    "apiCalls": 1,
    "estimatedCost": 0.005,
    "currency": "USD"
  }
}
```

#### GET /api/route-optimization
ルート最適化のコスト見積もりを取得します。

**クエリパラメータ:**
- `waypoints` (number, required): 経由地点の数

**レスポンス:**
```json
{
  "waypointCount": 5,
  "requestsNeeded": 1,
  "estimatedCost": "$0.005",
  "currency": "USD",
  "suggestions": [
    "多数の地点があります。日程別に分けて表示すると料金を削減できます。"
  ]
}
```

### 5. ユーザー管理 (Users)

#### GET /api/users
認証されたユーザーの情報を取得します。

**レスポンス:**
```json
{
  "user": {
    "id": "user_id",
    "google_id": "google_id",
    "name": "ユーザー名",
    "email": "user@example.com",
    "slug": "user-slug",
    "profile_image_url": "https://example.com/avatar.jpg",
    "preferences": {
      "currency": "JPY",
      "timezone": "Asia/Tokyo",
      "language": "ja"
    },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "planId": "season_traveler"
  }
}
```

#### POST /api/users
ユーザー情報を作成または更新します。

**リクエストボディ:**
```json
{
  "name": "ユーザー名",
  "email": "user@example.com",
  "profile_image_url": "https://example.com/avatar.jpg",
  "preferences": {
    "currency": "JPY",
    "timezone": "Asia/Tokyo",
    "language": "ja"
  }
}
```

### 6. ストレージ管理 (Storage)

#### GET /api/storage/usage
ユーザーのストレージ使用量を取得します。

**レスポンス:**
```json
{
  "usage": {
    "totalBytes": 1048576,
    "fileCount": 10,
    "lastUpdated": "2024-01-01T00:00:00Z",
    "files": [
      {
        "id": "file_id",
        "fileName": "image.jpg",
        "fileSize": 1048576,
        "fileType": "image/jpeg",
        "storagePath": "users/user_id/trips/trip_id/image.jpg",
        "downloadUrl": "https://storage.googleapis.com/...",
        "uploadedAt": "2024-01-01T00:00:00Z",
        "tripId": "trip_id",
        "isAvatar": false
      }
    ]
  }
}
```

#### GET /api/storage/quota
プラン別のストレージクォータを取得します。

**レスポンス:**
```json
{
  "quota": {
    "planId": "season_traveler",
    "maxBytes": 1073741824,
    "maxFiles": 100,
    "description": "1GB、100ファイルまで"
  }
}
```

### 7. 地理情報 (Geocoding)

#### POST /api/geocoding/geocode
住所を座標に変換します。

**リクエストボディ:**
```json
{
  "address": "東京都渋谷区"
}
```

**レスポンス:**
```json
{
  "status": "OK",
  "results": [
    {
      "place_id": "place_id",
      "formatted_address": "東京都渋谷区",
      "address_components": [
        {
          "long_name": "渋谷区",
          "short_name": "渋谷区",
          "types": ["administrative_area_level_2"]
        }
      ],
      "geometry": {
        "location": {
          "lat": 35.6581,
          "lng": 139.7414
        }
      },
      "types": ["administrative_area_level_2"]
    }
  ]
}
```

#### POST /api/geocoding/reverse
座標を住所に変換します。

**リクエストボディ:**
```json
{
  "lat": 35.6581,
  "lng": 139.7414
}
```

### 8. 距離計算 (Distance)

#### POST /api/distance
2点間の距離を計算します。

**リクエストボディ:**
```json
{
  "origins": ["35.6762,139.6503"],
  "destinations": ["35.6581,139.7414"]
}
```

**レスポンス:**
```json
{
  "destination_addresses": ["東京都渋谷区"],
  "origin_addresses": ["東京都千代田区"],
  "rows": [
    {
      "elements": [
        {
          "distance": {
            "text": "10.5 km",
            "value": 10500
          },
          "duration": {
            "text": "25 分",
            "value": 1500
          },
          "status": "OK"
        }
      ]
    }
  ],
  "status": "OK"
}
```

#### POST /api/distance/batch
複数地点間の距離を一括計算します。

## エラーレスポンス

すべてのAPIエンドポイントは以下の形式でエラーを返します：

```json
{
  "error": "エラーメッセージ"
}
```

**HTTPステータスコード:**
- `400`: リクエストが不正
- `401`: 認証が必要
- `404`: リソースが見つからない
- `500`: サーバーエラー

## レート制限

- Google Places API: 1日10,000リクエスト
- Google Directions API: 1日2,500リクエスト
- Google Geocoding API: 1日40,000リクエスト

## データ型定義

### PlaceData
```typescript
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

### User
```typescript
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
```

### Trip
```typescript
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
```

### Itinerary
```typescript
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
```

### Day
```typescript
interface Day {
  id: string
  trip_id: string
  day_number: number
  date: FirestoreDate
  description?: string
  created_at: FirestoreDate
  updated_at: FirestoreDate
  itineraries?: Itinerary[]
}
```