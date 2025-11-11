# Plan Change Page Mobile Review Deferred

- **Priority**: ⏸️ 保留（v3.0 範囲外）
- **URL**: `/settings/plan`（仮）
- **Viewport**: width < 640px
- **Component**: `app/settings/plan/page.tsx`（未実装）
- **Epic**: Plan change & billing (post-Stripe integration)
- **Milestone**: v3.1 以降

## 観察

現時点では Stripe 連携が未実装であり、ページ全体のデザインも他画面とテイストが異なる。モバイル向け最適化は v3.0 の範囲外として後回しにする方針。

## 方針

- v3.0 では対応しない（他ページのモバイル対応を優先）
- Stripe 実装完了後、UI 改修とモバイル対応をまとめて実施
- v3.1 以降のマイルストーンで対応予定

## 今後の対応内容（仮）

- プラン比較表のモバイル最適化（横スクロールまたはアコーディオン）
- 決済フォームのタッチ UI 対応
- プラン選択ボタンのタップ領域確保（44x44px 以上）

## メモ

- Stripe 実装後に UI 改修をまとめて行う。
- 他ページのモバイル対応が一段落したら改めて調査する。
- Stripe ダッシュボードとの連携テストもモバイルで必要。
