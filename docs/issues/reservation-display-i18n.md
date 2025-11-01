# Issue: 予約情報表示が日本語ハードコード

**作成日**: 2025-11-01  
**状態**: 🔴 未解決  
**優先度**: 中  
**種類**: i18n不備  
**関連ファイル**: 
- `components/stats/TripReservationDisplay.tsx`（予約情報表示コンポーネント）

---

## 📋 概要

予約情報表示コンポーネント（`TripReservationDisplay`）で、タイトルやメッセージが日本語ハードコードされており、英語設定時でも日本語が表示される。

---

## 🐛 問題の詳細

### 日本語ハードコード箇所

**ファイル**: `components/stats/TripReservationDisplay.tsx`

#### 1. タイトル
- 37行目: `予約情報`（予約がない場合のCardタイトル）
- 152行目: `予約情報 ({reservations.length}件)`（予約がある場合のCardタイトル）

#### 2. 空状態メッセージ
- 44行目: `予約情報がありません`
- 45行目: `Itineraryに予約情報を追加してください`（部分的に英語だが、文脈が日本語）

#### 3. その他の日本語文字列
- 287行目: `〜 {timeInfo.end}`（時刻区切り文字）

---

## 💡 解決方針

### Phase 1: i18nキーの追加

`lib/i18n/index.ts`に以下のキーを追加:

```typescript
// Reservation Display
| 'reservation.title'
| 'reservation.empty'
| 'reservation.empty.description'
| 'reservation.count'
| 'reservation.timeRange'
```

### Phase 2: TripReservationDisplayのi18n化

**ファイル**: `components/stats/TripReservationDisplay.tsx`

```typescript
import { t } from '@/lib/i18n'

// タイトル
<Card 
  title={
    <div className="text-lg font-medium text-gray-800 flex items-center">
      <IconRenderer iconName="reservation" className="w-5 h-5 mr-2" color="#8B5CF6" />
      {t('reservation.title')}
    </div>
  } 
>

// 空状態
<p>{t('reservation.empty')}</p>
<p className="text-sm">{t('reservation.empty.description')}</p>

// 予約数表示
{t('reservation.title')} ({reservations.length}{t('reservation.count')})

// 時刻範囲
〜 {timeInfo.end} → {t('reservation.timeRange')} {timeInfo.end}
```

### Phase 3: i18n辞書の実装

```typescript
// en辞書
'reservation.title': 'Reservations',
'reservation.empty': 'No reservations',
'reservation.empty.description': 'Add reservation information to your Itinerary',
'reservation.count': ' items',
'reservation.timeRange': '-',

// ja辞書
'reservation.title': '予約情報',
'reservation.empty': '予約情報がありません',
'reservation.empty.description': 'Itineraryに予約情報を追加してください',
'reservation.count': '件',
'reservation.timeRange': '〜',
```

---

## 🔗 関連ファイル

- `components/stats/TripReservationDisplay.tsx` - 予約情報表示コンポーネント（約381行）
- `lib/i18n/index.ts` - i18n辞書（約1200行）

---

## ✅ 完了条件

- [ ] `TripReservationDisplay`の全日本語文字列がi18n化される
- [ ] 英語設定時に全て英語で表示される
- [ ] 日本語設定時に全て日本語で表示される
- [ ] ビルドエラーがない
- [ ] ブラウザで動作確認済み（英語・日本語切り替えテスト）

---

## 📝 実装時の注意事項

1. **予約数の表示**
   - `{reservations.length}件` → `{reservations.length}{t('reservation.count')}`
   - 英語では"items"、日本語では"件"

2. **時刻範囲の表示**
   - `〜` は日本語の文字だが、英語では `-` を使用
   - `t('reservation.timeRange')`で切り替え

3. **既存のi18nキーとの整合性**
   - `trip.schedule.reservation`など、既存のキーと重複しないよう注意

