# POIDialogのハードコードされた日本語文字列のi18n化

## 問題

POIDialogで以下の日本語文字列がハードコードされていた：
- イメージギャラリーの「+9枚」
- レビュー件数の「947件」

また、`language`変数が複数箇所で定義されていた。

## 原因

- 「+9枚」: `gallery.photoCount`のi18nキーは既に存在していたが、実装が確認されていなかった
- 「947件」: `user_ratings_total`の表示が直接`toLocaleString()`で表示されていた
- `language`変数: 147行目と394行目で同じスコープで定義されていた

## 解決方法

1. **`language`変数の重複定義を削除**: 394行目の定義を削除（147行目で既に定義済み）
2. **`user_ratings_total`のi18n化**: `t('poi.reviewCount', language)`を使用
3. **`gallery.photoCount`の確認**: 既にi18n化されていたことを確認

## 修正ファイル

- `components/modals/POIDialog.tsx`

## 変更内容

```typescript
// 変更前（394行目）
const language = getUserLanguage(user) // 重複定義

// 変更後
// 削除（147行目で既に定義済み）

// 変更前（613行目）
{placeDetails.user_ratings_total && (
  <span className="text-gray-500 text-xs">
    ({placeDetails.user_ratings_total.toLocaleString()})
  </span>
)}

// 変更後
{placeDetails.user_ratings_total && (
  <span className="text-gray-500 text-xs">
    ({t('poi.reviewCount', language).replace('{count}', placeDetails.user_ratings_total.toLocaleString())})
  </span>
)}
```

## 動作確認

- ✅ `language`変数の重複定義エラーが解消されたことを確認
- ✅ レビュー件数が言語に応じて表示されることを確認（日本語: 「947件」、英語: 「947 reviews」）
- ✅ 画像ギャラリーの「+9枚」が既にi18n化されていることを確認（日本語: 「+9枚」、英語: 「+9 photos」）

## 関連i18nキー

- `poi.reviewCount`: レビュー件数の表示（英語: `{count} reviews`、日本語: `{count}件`）
- `gallery.photoCount`: 画像数の表示（英語: `+{count} photos`、日本語: `+{count}枚`）

