# Issue: POIクリックでPOIDialogは切り替わるが地図が主導で元位置に戻ってしまう

**作成日**: 2025-10-31  
**状態**: 🔴 未解決  
**優先度**: 中  
**関連ファイル**:
- `components/trip/TripMap.tsx`（地図・中心移動・同期）
- `components/trip/TripItineraryView.tsx`（メインコンテンツ側の選択・スクロール連動）
- `components/trip/POIDialog.tsx`（POI詳細ダイアログ）
- `hooks/useItineraryEditor.ts`（選択状態・同期ロジック）

---

## 📋 概要

メインコンテンツ連動で地図がItineraryのVenueを中心にしている状態で、地図側で別のPOIをクリックするとPOIDialogは新しいVenue情報を表示する一方、地図はメインコンテンツの選択に引っ張られて再度元の場所へパンしてしまう。結果としてPOIDialogと地図のフォーカスが一致しない。

---

## 🐛 再現手順
1. メインコンテンツ（Itineraryリスト）であるアイテナリを選択 → 地図がそのVenueへセンタリング
2. 地図上で別のPOI（ピン）をクリック → POIDialogがそのPOIの情報を表示
3. 数百ms以内に地図が自動で元のItinerary Venueへパンしてしまう（メインコンテンツ側の同期が勝つ）

---

## 🔍 想定原因
- 地図センタリングの`useEffect`が「選択Itinerary変更」以外の依存でも発火している
- スクロール連動（メイン→地図）のタイマー/デバウンスが短く、地図操作（地図→メイン）を上書き
- グローバルな`selectedItineraryId`が常にメイン側の状態を優先し、POIクリックによる一時選択を反映するチャネルがない
- 地図操作中フラグ（`isMapInteracting`）が存在しない、または適用範囲が狭い

---

## 💡 解決方針（提案）

### 1) インタラクション優先度の制御
- `isMapInteracting`（mousedown/touchstart～mouseup/touchendまでtrue）を導入し、その間はメイン→地図の自動センタリングを抑止
- タイムアウト（例: 2〜5秒）で解除、またはユーザー操作が終わるまで抑制

### 2) 選択状態の二系統化
- `selectedItineraryId`（メイン主導）と`selectedPoiId`（地図主導）を分離し、地図が主導の場合は地図を優先
- POIDialog表示中は`selectedPoiId`を優先し、センタリングもPOI基準に固定

### 3) デバウンス/スロットリング
- メイン→地図のセンタリングは`debounce(500-800ms)`で抑制し、地図の直近操作がある場合はスキップ

### 4) 双方向同期のルール化
- 直近の操作元（メイン or 地図）を記録し、一定時間はその側を優先
- POIDialogクローズ時にメイン側の選択へ復帰

---

## ✅ 完了条件
- [ ] 地図でPOIをクリックした際、POIDialogと地図中心が一致して維持される
- [ ] POIDialog表示中に地図が勝手に元位置へ戻らない
- [ ] メインコンテンツで別のItineraryを選択した場合は期待通りに地図が追従
- [ ] 既存のスクロール連動・センタリング挙動にリグレッションがない

---

## 🔗 参考
- `components/trip/TripMap.tsx` の`useEffect`依存関係（選択変更時のパン）
- `useItineraryEditor.ts`の選択/同期ロジック
- `POIDialog.tsx`の開閉・対象切替トリガ
