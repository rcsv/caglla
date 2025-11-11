# Trip Page Mobile Main Content Requires Left Menu Interaction

- **Priority**: P0（操作性低下、離脱増加）
- **URL**: `/[userSlug]/[tripSlug]`
- **Viewport**: width < 640px
- **Component**: `components/trip/TripPageLayout.tsx`, `app/[userSlug]/[tripSlug]/page.tsx`
- **Epic**: Trip mobile IA/ナビゲーション再設計

## ステータス

- ✅ Fixed (2025-11-11) — ビュー切替時の自動クローズとモバイル用タブ UI を追加

## 現象

モバイルでトリップページを開くと、初回ロード時に左メニューを閉じないとメインコンテンツがほぼ見えない。さらに別ビューへ遷移した後もメニュー開閉が必須で、操作が煩雑。

## 再現手順

1. モバイル幅でトリップページを開く。
2. 初期表示（`summary`）で左メニューが覆い被さっているのを確認。
3. `Itinerary` などへ移動すると再度メニュー表示が必要。

## 期待結果

メインコンテンツが常に閲覧可能で、メニュー開閉は任意の補助操作に留まる。

## 実際の結果

メニューが閉じた状態で遷移できず、ユーザーは頻繁にハンバーガー操作を強いられる。

## 原因仮説

- 初回ロード時に `mobileMenuOpen` が `true` で初期化されている。
- ビュー切替時にメニュー状態がリセットされない。
- オーバーレイがメインコンテンツを覆い、タップ操作を妨げる。

## 受け入れ基準

- [ ] 初回ロード時、モバイルメニューは閉じた状態（`mobileMenuOpen: false`）
- [ ] メニュー項目をタップしてビュー切替時、メニューが自動クローズする
- [ ] メインコンテンツが常に閲覧・操作可能（オーバーレイで遮られない）
- [ ] メニュー開閉のアニメーションが滑らか（300ms 以内）

## 解決方針

1. `mobileMenuOpen` の初期値を `false` に変更
2. `NavigationMenu` の項目クリック時に `onToggleMobileMenu()` を自動実行
3. オーバーレイクリックでもメニューを閉じる（既存実装を維持）
4. ビュー切替時（`currentView` 変更時）に `setMobileMenuOpen(false)` を実行

## アクセシビリティ

- メニューが開いている時、フォーカスはメニュー内に閉じ込める（フォーカストラップ）。
- Escape キーでメニューを閉じる。

## メモ

- ビュー切替時にメニューを自動クローズする、またはレイアウトを上下分割に変えることを検討。
- iOS Safari では `position: fixed` のオーバーレイでスクロールが効かない問題に注意。
- 対応PR: `app/[userSlug]/[tripSlug]/page.tsx` にモバイルタブバーとメニュー自動クローズ処理を実装。
