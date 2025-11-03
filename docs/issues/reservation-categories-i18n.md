# Issue: 予約カテゴリー（ReservationType/ReservationSite）のラベルが日本語ハードコード

**作成日**: 2025-11-01  
**状態**: ✅ 解決済み  
**優先度**: 中  
**解決日**: 2025-11-01  
**種類**: i18n化  
**関連ファイル**: 
- `lib/utils/reservation-utils.ts`（予約タイプ・サイトのラベル関数）
- `components/modals/ReservationInfoModal.tsx`（予約情報モーダル）
- `components/stats/TripReservationDisplay.tsx`（予約情報表示）
- `lib/i18n/index.ts`（i18n辞書）

---

## 📋 概要

予約カテゴリー（ReservationType: flight, hotel, rental_car, dining, other）と予約サイト（ReservationSite: expedia, booking_com, agoda, など）のラベルが日本語でハードコードされており、i18n化されていない。ユーザーの表示言語に関係なく、常に日本語で表示されるため、多言語対応が不完全。

アクティビティカテゴリー（`activity-categories-i18n.md`）と同じパターンの問題が発生している。

---

## 🐛 問題の詳細

### 現状の問題

#### 1. ReservationTypeのラベル

**ファイル**: `lib/utils/reservation-utils.ts` (122-131行目)

```typescript
export function getReservationTypeLabel(type: ReservationType): string {
  const labels: Record<ReservationType, string> = {
    flight: '飛行機',
    rental_car: 'レンタカー',
    hotel: 'ホテル',
    dining: '食事',
    other: 'その他'
  }
  return labels[type] || type
}
```

**ファイル**: `components/modals/ReservationInfoModal.tsx` (34-40行目)

```typescript
const RESERVATION_TYPES: { value: ReservationType; label: string; icon: string }[] = [
  { value: 'flight', label: '飛行機', icon: '✈️' },
  { value: 'rental_car', label: 'レンタカー', icon: '🚗' },
  { value: 'hotel', label: 'ホテル', icon: '🏨' },
  { value: 'dining', label: '食事', icon: '🍽️' },
  { value: 'other', label: 'その他', icon: '📋' }
]
```

#### 2. ReservationSiteのラベル

**ファイル**: `lib/utils/reservation-utils.ts` (136-156行目)

```typescript
export function getReservationSiteLabel(site: ReservationSite): string {
  const labels: Record<ReservationSite, string> = {
    expedia: 'Expedia',
    booking_com: 'Booking.com',
    agoda: 'Agoda',
    trivago: 'Trivago',
    airbnb: 'Airbnb',
    kayak: 'Kayak',
    skyscanner: 'Skyscanner',
    tripadvisor: 'TripAdvisor',
    opentable: 'OpenTable',
    tabelog: '食べログ',        // ❌ 日本語
    hot_pepper: 'ホットペッパー', // ❌ 日本語
    ana: 'ANA',
    jal: 'JAL',
    rakuten_travel: '楽天トラベル', // ❌ 日本語
    jalan: 'じゃらん',         // ❌ 日本語
    other: 'その他'            // ❌ 日本語
  }
  return labels[site] || site
}
```

**ファイル**: `components/modals/ReservationInfoModal.tsx` (42-59行目)

```typescript
const RESERVATION_SITES: { value: ReservationSite; label: string }[] = [
  { value: 'expedia', label: 'Expedia' },
  { value: 'booking_com', label: 'Booking.com' },
  { value: 'agoda', label: 'Agoda' },
  { value: 'trivago', label: 'Trivago' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'kayak', label: 'Kayak' },
  { value: 'skyscanner', label: 'Skyscanner' },
  { value: 'tripadvisor', label: 'TripAdvisor' },
  { value: 'opentable', label: 'OpenTable' },
  { value: 'tabelog', label: '食べログ' },        // ❌ 日本語
  { value: 'hot_pepper', label: 'ホットペッパー' }, // ❌ 日本語
  { value: 'ana', label: 'ANA' },
  { value: 'jal', label: 'JAL' },
  { value: 'rakuten_travel', label: '楽天トラベル' }, // ❌ 日本語
  { value: 'jalan', label: 'じゃらん' },         // ❌ 日本語
  { value: 'other', label: 'その他' }             // ❌ 日本語
]
```

### 影響範囲

- **ReservationType**: 5種類（flight, rental_car, hotel, dining, other）
- **ReservationSite**: 約17種類（一部日本語あり）
- **表示コンポーネント**: 
  - `ReservationInfoModal`（予約タイプ・サイトの選択肢）
  - `TripReservationDisplay`（予約情報の表示）
- **使用関数**: 
  - `getReservationTypeLabel()`
  - `getReservationSiteLabel()`

### 期待される動作

- **英語設定時**: "Flight", "Hotel", "Rental Car", "Dining", "Other" など英語で表示
- **日本語設定時**: "飛行機", "ホテル", "レンタカー", "食事", "その他" など日本語で表示

---

## 💡 解決方針

### Phase 1: i18nキーの追加

`lib/i18n/index.ts`に以下のキーを追加:

```typescript
// Reservation Types (5種類)
| 'reservation.type.flight'
| 'reservation.type.rental_car'
| 'reservation.type.hotel'
| 'reservation.type.dining'
| 'reservation.type.other'

// Reservation Sites (約17種類)
| 'reservation.site.expedia'
| 'reservation.site.booking_com'
| 'reservation.site.agoda'
| 'reservation.site.trivago'
| 'reservation.site.airbnb'
| 'reservation.site.kayak'
| 'reservation.site.skyscanner'
| 'reservation.site.tripadvisor'
| 'reservation.site.opentable'
| 'reservation.site.tabelog'
| 'reservation.site.hot_pepper'
| 'reservation.site.ana'
| 'reservation.site.jal'
| 'reservation.site.rakuten_travel'
| 'reservation.site.jalan'
| 'reservation.site.other'
```

### Phase 2: getReservationTypeLabelのi18n化

**ファイル**: `lib/utils/reservation-utils.ts`

```typescript
import { t } from '@/lib/i18n'

export function getReservationTypeLabel(type: ReservationType): string {
  return t(`reservation.type.${type}` as TranslationKey)
}
```

### Phase 3: getReservationSiteLabelのi18n化

**ファイル**: `lib/utils/reservation-utils.ts`

```typescript
export function getReservationSiteLabel(site: ReservationSite): string {
  return t(`reservation.site.${site}` as TranslationKey)
}
```

### Phase 4: ReservationInfoModalのi18n化

**ファイル**: `components/modals/ReservationInfoModal.tsx`

```typescript
import { t } from '@/lib/i18n'

// RESERVATION_TYPESを動的に生成
const RESERVATION_TYPES: { value: ReservationType; label: string; icon: string }[] = [
  { value: 'flight', label: t('reservation.type.flight'), icon: '✈️' },
  { value: 'rental_car', label: t('reservation.type.rental_car'), icon: '🚗' },
  { value: 'hotel', label: t('reservation.type.hotel'), icon: '🏨' },
  { value: 'dining', label: t('reservation.type.dining'), icon: '🍽️' },
  { value: 'other', label: t('reservation.type.other'), icon: '📋' }
]

// RESERVATION_SITESも同様に動的に生成
// または、useMemoを使用してコンポーネント内で生成
```

ただし、`RESERVATION_TYPES`と`RESERVATION_SITES`はコンポーネントのトップレベルで定義されているため、`t()`関数を使用するには、コンポーネント内で`useMemo`を使用するか、関数として定義する必要がある。

**推奨アプローチ**: コンポーネント内で`useMemo`を使用:

```typescript
const RESERVATION_TYPES = useMemo(() => [
  { value: 'flight', label: t('reservation.type.flight'), icon: '✈️' },
  { value: 'rental_car', label: t('reservation.type.rental_car'), icon: '🚗' },
  { value: 'hotel', label: t('reservation.type.hotel'), icon: '🏨' },
  { value: 'dining', label: t('reservation.type.dining'), icon: '🍽️' },
  { value: 'other', label: t('reservation.type.other'), icon: '📋' }
], [t])
```

### Phase 5: i18n辞書の実装

```typescript
// en辞書
'reservation.type.flight': 'Flight',
'reservation.type.rental_car': 'Rental Car',
'reservation.type.hotel': 'Hotel',
'reservation.type.dining': 'Dining',
'reservation.type.other': 'Other',
'reservation.site.expedia': 'Expedia',
'reservation.site.booking_com': 'Booking.com',
'reservation.site.agoda': 'Agoda',
'reservation.site.trivago': 'Trivago',
'reservation.site.airbnb': 'Airbnb',
'reservation.site.kayak': 'Kayak',
'reservation.site.skyscanner': 'Skyscanner',
'reservation.site.tripadvisor': 'TripAdvisor',
'reservation.site.opentable': 'OpenTable',
'reservation.site.tabelog': 'Tabelog',
'reservation.site.hot_pepper': 'Hot Pepper',
'reservation.site.ana': 'ANA',
'reservation.site.jal': 'JAL',
'reservation.site.rakuten_travel': 'Rakuten Travel',
'reservation.site.jalan': 'Jalan',
'reservation.site.other': 'Other',

// ja辞書
'reservation.type.flight': '飛行機',
'reservation.type.rental_car': 'レンタカー',
'reservation.type.hotel': 'ホテル',
'reservation.type.dining': '食事',
'reservation.type.other': 'その他',
'reservation.site.expedia': 'Expedia',
'reservation.site.booking_com': 'Booking.com',
'reservation.site.agoda': 'Agoda',
'reservation.site.trivago': 'Trivago',
'reservation.site.airbnb': 'Airbnb',
'reservation.site.kayak': 'Kayak',
'reservation.site.skyscanner': 'Skyscanner',
'reservation.site.tripadvisor': 'TripAdvisor',
'reservation.site.opentable': 'OpenTable',
'reservation.site.tabelog': '食べログ',
'reservation.site.hot_pepper': 'ホットペッパー',
'reservation.site.ana': 'ANA',
'reservation.site.jal': 'JAL',
'reservation.site.rakuten_travel': '楽天トラベル',
'reservation.site.jalan': 'じゃらん',
'reservation.site.other': 'その他',
```

---

## 🎉 解決内容

### 実装内容

1. **i18nキーの追加** (`lib/i18n/index.ts`)
   - `reservation.type.*` ネームスペースで5個のキーを追加（flight, rentalCar, hotel, dining, other）
   - `reservation.site.*` ネームスペースで17個のキーを追加（expedia, bookingCom, agoda, trivago, airbnb, kayak, skyscanner, tripadvisor, opentable, tabelog, hotPepper, ana, jal, rakutenTravel, jalan, other）
   - `reservation.selectSite`, `reservation.notSet` を追加
   - 英語・日本語両方の翻訳を追加

2. **予約ユーティリティ関数の修正** (`lib/utils/reservation-utils.ts`)
   - `getReservationTypeLabel()` 関数をi18n対応に修正
   - `getReservationSiteLabel()` 関数をi18n対応に修正
   - `t()`関数をインポートして使用

3. **コンポーネントの修正**
   - `components/modals/ReservationInfoModal.tsx`: `RESERVATION_TYPES`と`RESERVATION_SITES`を関数化し、i18nキーを使用
   - `components/modals/ReservationTemplateModal.tsx`: 同様に関数化してi18n化
   - 「選択してください」「未設定」プレースホルダーもi18n化

### 置き換えた箇所

- **ReservationType**: 飛行機、レンタカー、ホテル、食事、その他
- **ReservationSite**: Expedia, Booking.com, Agoda, Trivago, Airbnb, Kayak, Skyscanner, TripAdvisor, OpenTable, 食べログ, ホットペッパー, ANA, JAL, 楽天トラベル, じゃらん, その他
- **プレースホルダー**: 選択してください、未設定

### テスト

- [x] 英語表示で正常に動作することを確認
- [x] 日本語表示で正常に動作することを確認
- [x] ReservationInfoModalで予約タイプ・サイトが適切に表示されることを確認
- [x] ReservationTemplateModalで適切に表示されることを確認
- [x] TripReservationDisplayで`getReservationTypeLabel()`が適切に動作することを確認

---

## 🔗 関連ファイル

- `lib/utils/reservation-utils.ts` - 予約タイプ・サイトのラベル関数（約242行）
- `components/modals/ReservationInfoModal.tsx` - 予約情報モーダル（約505行）
- `components/stats/TripReservationDisplay.tsx` - 予約情報表示コンポーネント（約381行）
- `lib/i18n/index.ts` - i18n辞書（約1200行）
- `lib/core/types/reservation.ts` - 予約関連の型定義

---

## ✅ 完了条件

- [ ] `getReservationTypeLabel()`がi18n化される
- [ ] `getReservationSiteLabel()`がi18n化される
- [ ] `ReservationInfoModal`の`RESERVATION_TYPES`がi18n化される
- [ ] `ReservationInfoModal`の`RESERVATION_SITES`がi18n化される
- [ ] 英語設定時に全て英語で表示される
- [ ] 日本語設定時に全て日本語で表示される
- [ ] ビルドエラーがない
- [ ] ブラウザで動作確認済み（英語・日本語切り替えテスト）

---

## 📝 実装時の注意事項

1. **コンポーネント内での動的生成**
   - `RESERVATION_TYPES`と`RESERVATION_SITES`はコンポーネントのトップレベルで定義されている
   - `t()`関数を使用するには、コンポーネント内で`useMemo`を使用する必要がある
   - または、関数として定義し、必要な時に呼び出す

2. **型安全性**
   - `TranslationKey`型に全ての予約タイプ・サイトキーを追加する
   - TypeScriptの型チェックで未定義キーを検出できるようにする

3. **パフォーマンス**
   - `useMemo`を使用して、言語が変更されない限り再計算を避ける

4. **後方互換性**
   - 既存の`getReservationTypeLabel()`と`getReservationSiteLabel()`を使用している箇所は自動的にi18n化される
   - 既存コードへの影響は最小限

5. **サイト名の扱い**
   - 一部のサイト名（Expedia, Booking.comなど）は英語が正式名称のため、日本語でも英語のまま表示する
   - 日本のサイト（食べログ、ホットペッパーなど）は日本語で表示する

---

## 🔗 関連Issue

- `activity-categories-i18n.md` - アクティビティカテゴリーのi18n化（同じパターンの問題）
- `reservation-display-i18n.md` - 予約情報表示のi18n化（解決済み）

---

## 💡 参考

- アクティビティカテゴリーのi18n化と同様のアプローチを採用
- `getReservationTypeLabel()`と`getReservationSiteLabel()`は複数の箇所で使用されているため、これらの関数をi18n化することで一括対応可能

