# Profile Avatar Change Control Collapses on Mobile

- **Priority**: P1（操作不能、ユーザーデータ編集不可）
- **URL**: `/[userSlug]/profile`
- **Viewport**: width < 640px
- **Component**: `app/[userSlug]/profile/page.tsx` の画像変更コンポーネント
- **Epic**: Profile page responsive layout

## ステータス

- ✅ Fixed (2025-11-11) — アバターアップロードを縦並びレイアウト＋タップ領域拡大でモバイル対応

## 現象

プロフィール編集ページで画像変更コンポーネントが横幅の制約を受けて潰れ、ボタンと画像プレビューが重なってしまう。アップロード領域が極端に小さく、操作しづらい。

## 再現手順

1. ログインしプロフィールページに遷移。
2. ビューポートをモバイル幅へ縮める。
3. 「Change Image」ボタン周辺の表示を確認する。

## 期待結果

モバイルでもボタンとプレビュー領域が縦並びなどで整理され、タップしやすいサイズが確保される。

## 実際の結果

コンテナ幅が固定で、プレビュー画像とボタンが重なって見切れる。

## 原因仮説

- 画像プレビューとボタンが `flex-row` で横並びになっている。
- プレビュー画像の `width` や `height` が固定値で、モバイルで縮まらない。
- ボタンのタップ領域が小さく、`min-h-[44px] min-w-[44px]` が適用されていない。

## 受け入れ基準

- [ ] 640px 未満ではプレビュー画像とボタンを縦並び（`flex-col`）で表示
- [ ] プレビュー画像は `aspect-ratio: 1/1` を維持し、画面幅の 50% 以下に収まる
- [ ] 「Change Image」ボタンのタップ領域は 44x44px 以上
- [ ] 画像削除ボタン（×）のタップ領域は 44x44px 以上
- [ ] ボタンと画像の間隔は 16px 以上

## アクセシビリティ

- ボタンは `<button>` 要素で実装し、`aria-label="Change profile image"` を付与。
- 画像削除ボタンも `aria-label="Remove profile image"` で明示。
- フォーカスリングが視認できるよう `focus:ring-2` を適用。

## メモ

- `flex` 方向や `aspect-ratio` の調整が必要。
- 画像削除ボタンもタップ領域が小さい。
- デスクトップでは横並び、モバイルでは縦並びにする条件分岐が必要。
- 対応PR: `components/ui/AvatarUpload.tsx` を `flex-col` レイアウトに変更し、ボタン最小サイズを 44px 以上に統一。
