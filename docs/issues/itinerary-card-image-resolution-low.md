# Itinerary Cardの画像解像度が低い問題

## 問題

Itinerary Cardの端に表示される画像が低解像度で、POIDialogの画像ギャラリーと比較して画質が劣っていた。

## 原因

`ScheduleCardImage.tsx`でNext.jsの`Image`コンポーネントに`width={128} height={72}`を指定していたため、Next.jsが画像を128x72pxに最適化してしまっていた。

一方、POIDialogの画像ギャラリーは通常の`<img>`タグを使用しており、高解像度の画像がそのまま表示されていた。

## 解決方法

`ScheduleCardImage.tsx`を以下のように修正：

1. **`fill`プロップを使用**: 親要素のサイズに合わせて表示しつつ、高解像度画像を読み込む
2. **`sizes="256px"`を設定**: Retinaディスプレイ（2倍）対応で、より高解像度の画像を読み込む
3. **`quality={90}`を追加**: 画像品質を向上（デフォルト75→90）

## 修正ファイル

- `components/trip/ScheduleCardImage.tsx`

## 変更内容

```typescript
// 変更前
<Image
  src={photoUrl}
  alt={title}
  width={128}
  height={72}
  className="w-full h-full object-cover"
/>

// 変更後
<Image
  src={photoUrl}
  alt={title}
  fill
  sizes="256px"
  className="object-cover"
  quality={90}
/>
```

## 動作確認

- ✅ Itinerary Cardのサムネイル画像が高解像度で表示されることを確認
- ✅ POIDialogの画像ギャラリーと同等の画質になったことを確認

## 関連

- `ScheduleCard.tsx`では既に高解像度（最大1600px）で画像を取得していたが、表示時に最適化されていた
