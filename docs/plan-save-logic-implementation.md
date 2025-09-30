# プラン保存ロジック実装ガイド

## 概要

ユーザーにプラン情報を保存するための包括的なロジックを実装しました。この実装により、旅行プラン（Trip）、日程（Day）、旅程（Itinerary）を効率的に管理できます。

## 実装内容

### 1. プラン保存操作クラス (`lib/plan-save-operations.ts`)

#### 主要機能

- **完全なプランの一括保存**: 旅行、日程、旅程を一度に保存
- **プランの更新**: 既存プランの完全な更新
- **プランの複製**: 既存プランの複製
- **テンプレート機能**: プランをテンプレートとして保存・利用

#### 主要メソッド

```typescript
// 完全なプランを保存
await planSaveOperations.saveCompletePlan(userId, planData)

// 既存プランを更新
await planSaveOperations.updateCompletePlan(tripId, planData)

// プランを複製
await planSaveOperations.duplicatePlan(sourceTripId, userId, newTitle)

// テンプレートとして保存
await planSaveOperations.saveAsTemplate(tripId, templateName)

// テンプレートからプラン作成
await planSaveOperations.createFromTemplate(templateId, userId, customizations)
```

### 2. APIエンドポイント

#### `/api/plans` - プランの保存・更新

**POST** - 新しいプランを保存
```json
{
  "trip": {
    "title": "沖縄旅行",
    "description": "家族での沖縄旅行",
    "start_date": "2024-12-15",
    "end_date": "2024-12-18",
    "access_level": "private",
    "destination": "沖縄県那覇市"
  },
  "days": [
    {
      "day": {
        "day_number": 1,
        "description": "那覇空港到着、ホテルチェックイン"
      },
      "itineraries": [
        {
          "title": "那覇空港到着",
          "description": "ANA便で那覇空港に到着",
          "location": "那覇空港",
          "start_time": "14:30",
          "end_time": "15:30"
        }
      ]
    }
  ]
}
```

**PUT** - 既存プランを更新
```json
{
  "tripId": "trip-id-here",
  "planData": {
    // 上記と同じ構造
  }
}
```

#### `/api/plans/[id]/duplicate` - プランの複製

**POST**
```json
{
  "newTitle": "沖縄旅行 (コピー)"
}
```

#### `/api/plans/[id]/template` - テンプレート保存

**POST**
```json
{
  "templateName": "沖縄旅行テンプレート"
}
```

#### `/api/templates` - テンプレート管理

**GET** - テンプレート一覧取得
**POST** - テンプレートからプラン作成
```json
{
  "templateId": "template-id-here",
  "customizations": {
    "title": "カスタマイズされたタイトル",
    "start_date": "2024-12-20"
  }
}
```

## 使用例

### フロントエンドでの使用

```typescript
// プランの保存
const savePlan = async (planData: PlanSaveData) => {
  const response = await fetch('/api/plans', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify(planData)
  })
  
  const result = await response.json()
  if (result.success) {
    console.log('プランが保存されました:', result.data)
  }
}

// プランの複製
const duplicatePlan = async (tripId: string, newTitle?: string) => {
  const response = await fetch(`/api/plans/${tripId}/duplicate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({ newTitle })
  })
  
  const result = await response.json()
  if (result.success) {
    console.log('プランが複製されました:', result.data)
  }
}

// テンプレートとして保存
const saveAsTemplate = async (tripId: string, templateName: string) => {
  const response = await fetch(`/api/plans/${tripId}/template`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({ templateName })
  })
  
  const result = await response.json()
  if (result.success) {
    console.log('テンプレートとして保存されました')
  }
}
```

## データ構造

### PlanSaveData
```typescript
interface PlanSaveData {
  trip: TripFormData
  days: Array<{
    day: DayFormData
    itineraries: ItineraryFormData[]
  }>
}
```

### TripFormData
```typescript
interface TripFormData {
  title: string
  description?: string
  start_date: string
  end_date: string
  access_level: 'private' | 'public'
  image_url?: string
  destination?: string
}
```

### DayFormData
```typescript
interface DayFormData {
  day_number: number
  description?: string
}
```

### ItineraryFormData
```typescript
interface ItineraryFormData {
  title: string
  description?: string
  location?: string
  place_data?: PlaceData | null
  start_time?: string
  end_time?: string
  cost_amount?: number | null
  cost_currency?: string
}
```

## エラーハンドリング

すべてのAPIエンドポイントは適切なエラーレスポンスを返します：

- **401 Unauthorized**: 認証が必要
- **400 Bad Request**: リクエストデータが不正
- **500 Internal Server Error**: サーバーエラー

## セキュリティ

- Firebase Authenticationを使用した認証
- Firestoreセキュリティルールによるアクセス制御
- ユーザーは自分のプランのみ操作可能

## パフォーマンス

- バッチ処理による効率的なデータ保存
- トランザクションを使用した整合性保証
- 適切なインデックス設定

## 今後の拡張

- プランのバージョン管理
- プランの共有機能
- プランのエクスポート/インポート機能
- プランの統計・分析機能
