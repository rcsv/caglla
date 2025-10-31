# Issue: Itinerary Cardの予約ボタン/表示に視覚的フィードバックがない

**作成日**: 2025-10-31  
**状態**: 🔴 未解決  
**優先度**: 中  
**関連ファイル**:
- `components/trip/ScheduleCard.tsx`（Itinerary Cardの実装）
- `components/trip/SortableItineraryCard.tsx`
- `components/modals/ReservationInfoModal.tsx`（予約情報入力モーダル）
- `lib/core/types/reservation.ts`（ReservationInfo型定義）

---

## 📋 概要

Itinerary Cardの「予約」ボタンを押して予約情報を入力すると、Summary側には表示されるが、Itinerary Card側の「予約」部分に視覚的な変化がないため、予約情報が入力されたかどうかが分からない。背景色の変更や予約番号の表示などの視覚的フィードバックを追加したい。

---

## 🐛 問題の詳細

### 現状の動作
1. Itinerary Cardの「予約」ボタンをクリック
2. ReservationInfoModalが開き、予約情報を入力できる
3. 予約情報を入力・保存
4. Summary側（TripReservationDisplayなど）には予約情報が表示される
5. **しかし、Itinerary Card側の「予約」ボタン/表示は何も変化しない**

### 期待される動作
- 予約情報が入力された場合、Itinerary Cardの「予約」部分に視覚的な変化がある
- 具体的には：
  1. **背景色の変更**: 予約情報がある場合は背景色を変更（例: エメラルド色の背景）
  2. **予約番号の表示**: 予約番号が入力されている場合は、予約番号を表示
  3. **アイコンの変更**: 予約済みの場合はアイコンを変更（例: チェックマーク）
  4. **テキストの変更**: 「予約」→「予約済み」など

---

## 🔍 技術的調査

### ReservationInfo型の確認
- `lib/core/types/reservation.ts`で`ReservationInfo`型が定義されている
- 予約番号（`confirmation_number`など）のフィールドを確認
- 必須フィールドとオプショナルフィールドの確認

### 既存の実装確認
1. **ScheduleCard.tsx**
   - 「予約」ボタンの実装箇所
   - 予約情報の取得方法
   - 現在のスタイリング

2. **ReservationInfoModal.tsx**
   - 予約情報の保存処理
   - 保存後のコールバック

3. **Itinerary型**
   - `itinerary.reservation`フィールドの構造
   - 予約情報の有無の判定方法

---

## 💡 実装方針

### Phase 1: 予約状態の視覚的表示
1. **予約情報の有無を判定**
   ```typescript
   const hasReservation = itinerary.reservation !== null && itinerary.reservation !== undefined
   ```

2. **背景色の変更**
   ```typescript
   className={hasReservation 
     ? "bg-emerald-50 border-emerald-200" 
     : "bg-white border-gray-200"}
   ```

3. **アイコンの変更**
   - 予約済み: チェックマークアイコン
   - 未予約: 予約アイコン（既存）

4. **テキストの変更**
   - 予約済み: 「予約済み」または「予約あり」
   - 未予約: 「予約」または「予約する」

### Phase 2: 予約番号の表示
1. **予約番号の取得**
   ```typescript
   const confirmationNumber = itinerary.reservation?.confirmation_number
   ```

2. **予約番号の表示**
   - ボタン内に小さく予約番号を表示
   - または、ホバー時にツールチップで表示
   - 長い番号の場合は省略表示（例: "ABC123...XYZ"）

3. **予約番号のコピー機能**（オプション）
   - クリックで予約番号をクリップボードにコピー

### Phase 3: その他の情報表示（オプション）
1. **予約ステータス**
   - 予約確認済み/未確認の表示
   - ステータスに応じた色分け

2. **予約日時**
   - 予約日時が設定されている場合、小さく表示

3. **予約詳細へのクイックアクセス**
   - クリックでReservationInfoModalを開く

---

## 🎨 UIデザイン案

### 案1: 背景色 + 予約番号表示
```
[予約済み] ← エメラルド色背景
ABC123XYZ  ← 予約番号を小さく表示
```

### 案2: アイコン変更 + 予約番号
```
✓ 予約済み
ABC123XYZ
```

### 案3: バッジ形式
```
[予約] → [予約済み ABC123]
```

---

## 🔗 関連ファイル

- `components/trip/ScheduleCard.tsx` - Itinerary Card（予約ボタンの実装箇所）
- `components/trip/SortableItineraryCard.tsx` - ソート可能なItinerary Card
- `components/modals/ReservationInfoModal.tsx` - 予約情報入力モーダル
- `lib/core/types/reservation.ts` - ReservationInfo型定義
- `lib/core/types/trip.ts` - Itinerary型（reservationフィールド）

---

## ✅ 完了条件

- [ ] 予約情報が入力されている場合、Itinerary Cardの「予約」部分の背景色が変更される
- [ ] 予約番号が入力されている場合、予約番号が表示される（または省略表示）
- [ ] 予約済みの場合は、アイコンやテキストが適切に変更される
- [ ] 既存の予約情報入力機能に影響しない
- [ ] i18n対応（「予約済み」などのテキスト）
- [ ] アクセシビリティ対応（`aria-label`など）
- [ ] モバイル表示でも適切に表示される

---

## 📝 技術的検討事項

### 予約情報の判定
- `itinerary.reservation !== null` で判定するか
- 必須フィールド（予約番号など）がある場合のみ「予約済み」と表示するか

### パフォーマンス
- 大量のItineraryがある場合のレンダリングパフォーマンス
- 予約情報の取得方法（キャッシュなど）

### デザイン一貫性
- エメラルド色を基調としたデザインとの整合性
- 他の状態表示（選択状態の赤いボーダーなど）との調和

---

## 🔍 実装可能性の評価

### 可能性: 高
- ReservationInfo型は既に定義されている
- Itineraryにreservationフィールドが存在する
- ScheduleCardコンポーネントでの実装が可能

### 課題
- 予約情報が部分的に入力されている場合の扱い
- 予約番号が長い場合の表示方法
- 複数の予約情報がある場合の表示（現在は1つずつの想定？）

