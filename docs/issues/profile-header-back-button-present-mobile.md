# Profile Header Back Button Visible on Mobile

- **Priority**: ✅ 問題なし（正常動作を確認）
- **URL**: `/[userSlug]/profile`
- **Viewport**: width < 640px
- **Component**: `app/[userSlug]/profile/page.tsx` のヘッダー

## 観察

モバイル幅でもヘッダー左上に戻るボタンが表示されており、 `/home` へ復帰できる。今回確認した範囲では機能に問題なし。

## 受け入れ基準（既に満たしている）

- [x] 640px 未満でも戻るボタンが表示される
- [x] ボタンのタップ領域は 44x44px 以上
- [x] 戻るボタンをタップすると `/home` へ遷移する
- [x] ボタンのアイコンが視認できる（矢印など）

## アクセシビリティ

- ボタンは `<button>` または `<Link>` で実装され、キーボードで到達可能。
- `aria-label="Go back to home"` などで役割を明示。

## メモ

- ボタンサイズは指で押せる程度に維持されている。
- 他のヘッダー要素（タイトル等）は別途要検討。
- この実装をベストプラクティスとして、他ページのヘッダーにも適用する。
