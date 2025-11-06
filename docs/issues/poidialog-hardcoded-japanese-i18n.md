# POIDialogの日本語ハードコード文字列のi18n化

## 問題

POIDialogに以下の日本語文字列がハードコードされていた：

1. **画像ギャラリー**: `+{count}枚` - 画像枚数の単位
2. **レビュー件数**: `{count}件` - レビュー件数の単位（2箇所）

## 原因

これらの単位文字列がi18n化されていなかった。

## 解決方法

以下のi18nキーを追加し、コードを修正：

1. **`gallery.photoCount`**: 画像枚数の単位
   - 英語: `+{count} photos`
   - 日本語: `+{count}枚`

2. **`poi.reviewCount`**: レビュー件数の単位
   - 英語: `{count} reviews`
   - 日本語: `{count}件`

## 修正ファイル

- `components/modals/POIDialog.tsx`
- `lib/i18n/index.ts`

## 変更内容

### POIDialog.tsx

```typescript
// 変更前
({aggregatedData.aggregatedRating.totalReviews.toLocaleString()} 件)
title={`${source.source}: ${source.rating} (${source.reviewCount}件)`}
+{placeDetails.photos.length - 1}枚

// 変更後
({t('poi.reviewCount', language).replace('{count}', aggregatedData.aggregatedRating.totalReviews.toLocaleString())})
title={`${source.source}: ${source.rating} ${t('poi.reviewCount', language).replace('{count}', source.reviewCount.toString())}`}
{t('gallery.photoCount', language).replace('{count}', (placeDetails.photos.length - 1).toString())}
```

### lib/i18n/index.ts

- `gallery.photoCount`キーを追加（英語・日本語）
- `poi.reviewCount`キーを追加（英語・日本語）

## 動作確認

- ✅ 画像ギャラリーの「+9枚」が英語環境で「+9 photos」と表示されることを確認
- ✅ レビュー件数の「947件」が英語環境で「947 reviews」と表示されることを確認
- ✅ 日本語環境では従来通り「+9枚」「947件」と表示されることを確認

