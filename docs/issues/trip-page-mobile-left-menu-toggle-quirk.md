# Trip Page Mobile Left Menu Toggle Behaves Unexpectedly

- **Priority**: P0（操作不能、ナビゲーション断絶）
- **URL**: `/[userSlug]/[tripSlug]`
- **Viewport**: width < 640px
- **Component**: `components/trip/TripHeroSection.tsx`, `components/planner/FloatingTitleBar.tsx`
- **Epic**: Trip mobile IA/ナビゲーション再設計

## ステータス

- ✅ Fixed (2025-11-11) — `FloatingTitleBar` にモバイル用ハンバーガーボタンを追加し、すべてのビューでナビゲーション可能に

## 現象

モバイル幅では左メニューを開くハンバーガーが `TripHeroSection` 内に固定されているため、`summary` ビュー以外へ遷移するとトグルが消えてメニューを再表示できなくなる。

## 再現手順

1. トリップページを開き、モバイル幅に縮小。
2. 画面上部のハンバーガーを押してメニューを開閉。
3. `Itinerary` タブへ切り替えるとハンバーガーが消え、再びメニューを開けない。

## 期待結果

どのビューでもメニュー開閉トグルが常に利用できる。

## 実際の結果

ハンバーガーが `summary` ビュー専用のため、他ビューでメニューを開けない。

## 原因仮説

- ハンバーガーボタンが `TripHeroSection` 内に実装されている。
- `currentView === 'summary'` の条件で `TripHeroSection` 全体が非表示になる。
- `FloatingTitleBar` にはハンバーガーが実装されていない。

## 受け入れ基準

- [ ] 640px 未満では `FloatingTitleBar` 左端にハンバーガーボタンを常設
- [ ] ハンバーガーのタップ領域は 44x44px 以上
- [ ] すべてのビュー（`summary`, `itinerary`, `checklist`）でハンバーガーが利用可能
- [ ] メニュー開閉時のアニメーションが滑らか（`transform` 300ms）
- [ ] メニュー開閉状態が URL やローカルストレージに保存されない（毎回閉じた状態で開始）

## 解決方針

1. `TripHeroSection` のハンバーガーを削除
2. `FloatingTitleBar` にモバイル専用のハンバーガーボタンを追加（`md:hidden` で制御）
3. `onToggleMobileMenu` を `FloatingTitleBar` の props として受け取る
4. ビュー切替時にメニューを自動クローズする（UX 改善）

## アクセシビリティ

- ハンバーガーボタンは `<button>` 要素で実装。
- `aria-label="Open navigation menu"` または `"Close navigation menu"` で状態を明示。
- `aria-expanded={mobileMenuOpen}` で開閉状態を伝える。

## メモ

- `FloatingTitleBar` など常時表示コンポーネントへトグルを移設する案が必要。
- 既存の Profile ページの戻るボタンと同じ位置に配置すると統一感が出る。
- 対応PR: `components/planner/FloatingTitleBar.tsx` にトグルボタンを追加し、`TripPageLayout` 経由で制御。
