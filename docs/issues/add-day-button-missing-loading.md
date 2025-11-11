# Add Day Button Lacks Loading Feedback

- **Priority**: P1（体験改善・操作ミス防止）
- **URL**: `/[userSlug]/[tripSlug]?view=itinerary`
- **Component**: `components/trip/TripItineraryView.tsx`, `app/[userSlug]/[tripSlug]/page.tsx`
- **Epic**: Trip builder UX 改善

## ステータス

- ❌ 未対応（2025-11-11）

## 現象

「Add Day」ボタンを押下しても即時フィードバックがなく、FireStore への書き込み待機中に UI が静止したまま。回線状況によっては 1〜2 秒のラグが発生し、ユーザーは失敗したと勘違いして二度押し・ページリロードしてしまう。

## 再現手順

1. `/[userSlug]/[tripSlug]` → `Itinerary` タブに移動。
2. 下部の「Add Day」ボタンをクリック。
3. 新しい Day が追加されるまで状態表示が一切ないことを確認（ボタンは押下可能状態のまま）。

## 期待結果

- ボタン押下直後にローディングスピナーまたはプログレス状態（`aria-busy`) を表示。
- API 完了までボタンを disable し、二重リクエストを防ぐ。
- 成功時はトースト/スクロール等でユーザーに追加を明示する。

## 実際の結果

- `TripItineraryView` > `onAddDay` が実行される間、UI 変化がない。
- `app/[userSlug]/[tripSlug]/page.tsx` 内でもローディング state が管理されておらず、楽観 lock / disable 処理が未実装。

## 原因仮説

- `onAddDay` ハンドラが単純に `await addDay()` を呼ぶだけで、状態管理ロジックを保持していない。
- UX 調整の優先度が低く、実装タイミングを逃した。
- フォームバリデーション・トラックが未整備で、UIメッセージの設計がされていない。

## 受け入れ基準

- [ ] ボタン押下後直ちにローディングインジケーターが表示される（テキスト置換 or スピナー）。
- [ ] リクエスト中はボタンが `disabled` になり、再クリックできない。
- [ ] リクエスト失敗時にエラーメッセージ（toast or inline）が表示される。
- [ ] 成功時に自動スクロールまたはハイライトで追加された Day を強調。
- [ ] 状態変化がスクリーンリーダーでも認識できる（`aria-live`）。

## 解決方針（案）

1. `TripItineraryView` に `isAddingDay` state を追加し、`onAddDay` 呼び出しで true/false を制御。
2. コンポーネント側で `isAddingDay` に応じて UI を切り替え（スピナー + `cursor-wait`）。
3. 失敗時は catch して `toast.error` など共通通知コンポーネントで案内。
4. Optimistic UI として即座に空 day を挿入し、API 完了後に ID を同期する案も検討。

## アクセシビリティ

- ローディングは `role="status"` と `aria-live="polite"` な要素で表示。
- ボタンラベルを `Add Day (loading...)` のように書き換え、スクリーンリーダーに状態を伝える。
- カラースピナーのみではなくテキストも併用。

## メモ

- 同時に「Add Schedule」など他の非同期操作にもローディング導線を展開すると一貫性が高まる。
- 過去のサポート問い合わせで二重日程が作られるケースがあり、改善優先度を上げたい。

