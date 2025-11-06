# Issue: 旅行データにデフォルト通貨を設定できるようにする

**作成日**: 2025-11-06  
**状態**: ✅ 実装完了  
**優先度**: 中  
**関連ファイル**:
- `lib/core/types/trip.ts`（Trip型定義）
- `components/trip/ScheduleCard.tsx`（通貨推測ロジック使用箇所）
- `lib/utils/currency.ts`（通貨推測関数）
- `app/api/trips/route.ts`（旅行作成API）
- `components/common/CreateTripDialog.tsx`（旅行作成ダイアログ）
- `app/api/itineraries/route.ts`（Itinerary作成API）

---

## 📋 概要

現在、Itinerary Cardで費用入力時に通貨を自動推測する機能が実装されているが、通信コストが高い割に精度が悪い。この機能を無効化し、代わりに旅行データ作成時にデフォルト通貨を設定できるようにする。

---

## 🐛 現状の問題

1. **通貨推測の精度が低い**
   - Venueの`address_components`から国コードを取得して通貨を推測しているが、誤推測が発生する
   - 例：West Virginia, USAの場所でJPYが推測される

2. **通信コストが高い**
   - `place_data`を取得するためにGoogle Places APIを呼び出す必要がある
   - 推測のためだけにAPIコールが発生し、コストが無駄に増える
   - Itinerary Cardを生成する頻度に比べて、旅行作成時の通貨推定は遥かに少ない回数

3. **ユーザー体験が悪い**
   - 推測結果が不正確なため、ユーザーが手動で修正する必要がある
   - 推測ロジックが複雑で、ユーザーが期待する通貨が設定されない

---

## 💡 解決方針

### 1. Trip型に`default_currency`フィールドを追加

```typescript
// lib/core/types/trip.ts
export interface Trip {
  // ... 既存フィールド
  default_currency?: string // デフォルト通貨コード（例: 'USD', 'JPY', 'EUR'）
}
```

### 2. Create Trip Dialogで目的地選択時に通貨を自動推定

- **旅行作成時**: `components/common/CreateTripDialog.tsx`で`destinationPlace`が選択された瞬間に通貨を推定
  - `destinationPlace.place_id`から詳細情報を取得（`placesApiHelpers.getPlaceDetails`）
  - `address_components`から国コードを取得
  - 国コードから通貨を推定（`getCurrencyByCountryCode`）
  - 推定した通貨を`default_currency`として自動設定
  - ユーザーが手動で変更可能（将来的にUIを追加）

- **旅行編集時**: 旅行編集画面に通貨選択UIを追加（既存の旅行にも設定可能）
  - 手動で通貨を選択・変更できるようにする
  - 自動推定は行わない（編集時は手動設定のみ）

### 3. Itinerary Cardでの通貨推測ロジックを削除

- `ScheduleCard.tsx`の通貨推測`useEffect`（156-189行目）を削除
- `getCurrencyFromPlaceEnhanced`関数は残す（将来的にオプション化する可能性を考慮）

### 4. Itinerary作成時の通貨設定

- Itinerary作成時に`cost_currency`が未設定の場合、Tripの`default_currency`を使用
- `ScheduleCard.tsx`で通貨が未設定の場合、Tripの`default_currency`を初期値として表示

---

## 🔧 実装内容

### Phase 1: データモデルの拡張 ✅

- [x] `lib/core/types/trip.ts`に`default_currency?: string`フィールドを追加
- [x] `app/api/trips/route.ts`のPOSTエンドポイントで`default_currency`を受け取るように修正

### Phase 2: UI実装 ✅

- [x] `components/common/CreateTripDialog.tsx`で目的地選択時に通貨を自動推定
  - `destinationPlace`が選択された瞬間に`placesApiHelpers.getPlaceDetails`を呼び出し
  - `address_components`から国コードを取得
  - `getCurrencyByCountryCode`で通貨を推定
  - 推定した通貨を`default_currency`として自動設定
- [x] 旅行作成時に`defaultCurrency`をAPIに送信

### Phase 3: 通貨推測ロジックの無効化 ✅

- [x] `components/trip/ScheduleCard.tsx`の通貨推測`useEffect`を削除
- [x] `getCurrencyFromPlaceEnhanced`関数は残す（将来的にオプション化する可能性を考慮）

### Phase 4: Itinerary作成時の通貨設定 ✅

- [x] `app/api/itineraries/route.ts`でItinerary作成時に`cost_currency`が未設定の場合、Tripの`default_currency`を使用
- [x] `ScheduleCard.tsx`で通貨が未設定の場合、Tripの`default_currency`を初期値として表示

### Phase 5: 既存データへの対応 ✅

- [x] 既存のTripデータには`default_currency`が未設定の可能性がある
- [x] `default_currency`が未設定の場合は、既存のデフォルト（JPY）を使用

---

## ✅ 完了条件

- [x] Trip型に`default_currency`フィールドが追加されている
- [x] 旅行作成時に目的地選択時に通貨が自動推定される
- [x] 通貨推測ロジックが無効化されている
- [x] Itinerary作成時にTripの`default_currency`が使用される
- [x] 既存の旅行データでも通貨を設定できる（PUTエンドポイントで対応）

---

## 🔗 関連

- `docs/CURRENCY_INFERENCE_IMPROVEMENTS.md`（既存の通貨推測改善ドキュメント）
- `docs/issues/itinerary-currency-inference-weak.md`（既存のIssue）
- `lib/utils/currency.ts`（通貨推測関数）

---

## 📝 実装メモ

- Create Trip Dialogで目的地選択時に通貨を自動推定することで、通信コストを大幅に削減
- Itinerary Cardでの通貨推測ロジックを削除することで、精度の問題を解決
- 将来的に通貨選択UIを追加することで、ユーザーが手動で変更可能にする

