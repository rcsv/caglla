# Issue: [userSlug]/[tripSlug]/page.tsxのボタンテイストが一致していない

**作成日**: 2025-10-31  
**解決日**: 2025-10-31  
**状態**: ✅ 解決済み  
**優先度**: 低  
**関連ファイル**: `app/[userSlug]/[tripSlug]/page.tsx`, `components/trip/TripEditor.tsx`, `components/trip/TripChecklistView.tsx`, `components/trip/TripItineraryView.tsx`, `components/trip/DailyRouteOptimizer.tsx`, `components/trip/VenueInsertButton.tsx`, `components/trip/VenueDistance.tsx`

---

## 📋 概要

旅行詳細ページ（`/[userSlug]/[tripSlug]/page.tsx`）で使用されているコンポネント内のボタンのスタイルが統一されていない。プロフィールページやAboutページで使用されているemerald色のテイストと一致させたい。

---

## 🐛 問題の詳細

### 現状
- 旅行詳細ページ内のボタンに複数のスタイルが混在している
- emerald色の統一デザインが適用されていない可能性

### 期待される動作
- すべてのボタンが統一されたスタイル（emerald色）を使用
- Aboutページやプロフィールページとデザインが一致

---

## 🔍 調査が必要な項目

1. 旅行詳細ページで使用されているボタンコンポーネントの特定
2. 現在のボタンスタイルの確認
3. 統一すべきスタイルの定義

---

## 💡 解決方針

### Phase 1: 現状確認
1. 旅行詳細ページのボタンをリストアップ
2. 各ボタンの現在のスタイルを確認
3. 統一すべきスタイルを決定

### Phase 2: スタイル統一
1. emerald色のボタンスタイルを適用
2. ボタンコンポーネントの統一（可能であれば）
3. ホバー状態やdisabled状態も統一

---

## 🔗 関連ファイル

- `app/[userSlug]/[tripSlug]/page.tsx` - 旅行詳細ページ
- `components/common/Button.tsx` - ボタンコンポーネント（推測）
- プロフィールページやAboutページのボタン実装（参考）

---

## ✅ 解決内容

### 実装した変更

以下のコンポーネントのボタンスタイルをemerald色（`bg-emerald-600` / `hover:bg-emerald-700`）に統一しました：

1. **TripEditor.tsx**
   - 保存ボタン: `bg-blue-600` → `bg-emerald-600`

2. **TripChecklistView.tsx**
   - 「プリセットを適用」ボタン: `bg-gray-600` → `bg-emerald-600`
   - 「マイプリセット」ボタン: `bg-gray-600` → `bg-emerald-600`
   - 「プリセットとして保存」ボタン: `bg-green-600` → `bg-emerald-600`
   - 「チェックリストを再生成」ボタン: `bg-blue-600` → `bg-emerald-600`

3. **TripItineraryView.tsx**
   - 「全て展開」ボタン: `bg-green-600` → `bg-emerald-600`
   - 「全て折りたたみ」ボタン: `bg-gray-600` → `bg-emerald-600`
   - 「Venueを追加」ボタン（複数箇所）: `bg-blue-600/500` → `bg-emerald-600/500`
   - 「日程を追加」ボタン: `bg-blue-600` → `bg-emerald-600`

4. **DailyRouteOptimizer.tsx**
   - 「ルート最適化」ボタン: `bg-blue-600` → `bg-emerald-600`
   - 「この順序を適用」ボタン: `bg-green-600` → `bg-emerald-600`
   - 「キャンセル」ボタン: `bg-gray-600` → `bg-emerald-600`

5. **VenueInsertButton.tsx**
   - 「間にVenueを追加」ボタン: `bg-blue-500/600` → `bg-emerald-500/600`

6. **VenueDistance.tsx**
   - 「間にVenueを追加」ボタン: `bg-blue-500/600` → `bg-emerald-500/600`

### 統一されたスタイル

プロフィールページやAboutページと同様のスタイルに統一：
- `bg-emerald-600` / `hover:bg-emerald-700`
- `font-semibold`（適切な箇所）
- `transition-colors`

### 除外したボタン

- **削除ボタン**: 危険操作を示すため、`bg-red-600`のまま維持

---

## 📝 参考

プロフィールページで使用されているボタンスタイル：
- `bg-emerald-600` / `hover:bg-emerald-700`
- `font-semibold`
- `transition-colors`

