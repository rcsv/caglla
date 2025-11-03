# Issue: 左メニュー概況が住所ではなく緯度経度になる（場所名優先にしたい）

**作成日**: 2025-11-03  
**状態**: 🔴 未解決  
**優先度**: 中  
**種類**: 表示整備 / UX改善  

---

## 概要

Map上のマーカーをクリック → POIDialog から Itinerary へ登録した直後、左メニュー（Itinerary 概況）で各行のサブテキストが「住所」ではなく「緯度経度（例: `34.8573624,136.8107...`）」になってしまうケースがある。緯度経度はユーザー向け表示としては不適切。最優先は「場所名」、次に「住所」、最後の最後に緯度経度という優先順位にしたい。

---

## 現状

- 事象: POIDialog経由での追加直後、左メニューの行サブテキストが`lat,lng`で表示されることがある
- 想定原因:
  - `itinerary.place_data`の`name`/`formatted_address`が未設定のタイミングでレンダリングされ、`location`のみから派生した表示文字列を使っている
  - もしくは表示用のフォールバック優先順位が`lat,lng`を先に見ている

---

## 望ましい表示優先順位（フォールバックポリシー）

1. `itinerary.place_data.name`（場所名）
2. `itinerary.place_data.formatted_address`（住所）
3. `itinerary.title`（タイトルが手で入っていれば採用）
4. `trip.destination` もしくは `day`のサマリ等、文脈表示（任意）
5. 最後のフォールバックとしてのみ`lat,lng`（ただしUIでは灰色小さめに）

---

## 対象・関連箇所（想定）

- 左メニューのItinerary概況表示: `components/planner/NavigationMenu.tsx`
- 追加起点: `components/trip/POIDialog.tsx` → Itinerary作成API → クライアント状態反映
- 表示用テキストの決定ロジックをヘルパー化すると安全
  - 例: `lib/travel/ui-format.ts` に `getPlaceDisplayText(itinerary)` を追加し、全呼び出しを共通化

---

## 提案実装

- 新規ヘルパー: `getPlaceDisplayText(itinerary: Itinerary): string`
  - 上記の優先順位で文字列を返す
  - 取得できない場合は空文字列（呼び出し側で場所未設定の表示に切り替え）
- `NavigationMenu.tsx`の概況表示で、従来の直書きロジックを上記ヘルパーへ置き換え
- POIDialog追加直後に`place_data`が非同期で埋まる場合を考慮
  - 表示は一時的にスケルトン or "Loading..." を出し、`place_data`が揃い次第`name`/`address`に差し替え

---

## 受け入れ条件（AC）

- POIDialogからItineraryを追加した直後でも、左メニューのサブテキストは場所名（取得済みの場合）を表示する
- 場所名が未取得の場合は住所を表示、住所も未取得の場合は緯度経度を表示するが、最終フォールバックのみである
- 緯度経度表示は控えめなスタイル（小さめ・グレー）で、ユーザー向けに不自然でない
- 既存の他の表示箇所での文字列も同ポリシーに統一可能な設計（ヘルパー化）

---

## リスク・留意点

- データ到着順序によって一瞬フォールバックが見える可能性 → スケルトン表示で緩和
- 既存表示との整合性（他の一覧/カード）→ 影響箇所の横展開は別Issueで段階導入

---

## フォローアップ（任意）

- Itinerary作成APIのレスポンスで確実に`place_data.name`と`formatted_address`を含める（可能なら追加ラウンドトリップを減らす）
- 既存データのクレンジング（`place_data`欠落のItineraryを補完）
