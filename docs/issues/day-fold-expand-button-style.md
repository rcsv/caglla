# Issue: DaysのFold/Expandボタンのスタイルを控えめにする

**作成日**: 2025-11-03  
**状態**: ✅ 解決済み  
**優先度**: 低（UI微調整）  
**解決日**: 2025-11-03  
**種類**: UI/スタイル調整  

---

## 概要

DaysのFold / Expandスイッチ（一覧上部の「全て展開 / 全て折りたたみ」）が現在は濃い緑の塗りつぶしボタンになっており、視覚的に強すぎるため、アイコンのみのフラットなボタンに変更し、ホバー時のみ背景色がわずかに濃くなるトーンに調整します。

---

## 現状

対象ファイル: `components/trip/TripItineraryView.tsx`

```172:189:components/trip/TripItineraryView.tsx
          <div className="flex items-center gap-2">
              {trip.days && trip.days.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={expandAllDays}
                    className="p-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                    title={t('trip.itineraryView.expandAll')}
                  >
                    <Icon icon="mdi:unfold-more-horizontal" className="w-5 h-5" />
                  </button>
                  <button
                    onClick={collapseAllDays}
                    className="p-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                    title={t('trip.itineraryView.collapseAll')}
                  >
                    <Icon icon="mdi:unfold-less-horizontal" className="w-5 h-5" />
                  </button>
                </div>
              )}
```

- べた塗りの`bg-emerald-600`で、他の操作（追加/保存等）より強く目立つ
- 常時背景色がつくため、情報の優先度に対して視覚コントラストが過剰

---

## 目標（デザイン方針）

- 常時は「アイコンのみ・背景は透明（または超薄いグレー）」
- ホバー時にのみ背景色がわずかに濃くなる（例: `hover:bg-gray-100`）
- フォーカスリングを明確化（キーボード操作対応）
- アクセシビリティ: `title`は維持、`aria-label`付与
- 既存のz-indexポリシーには影響なし（`globals.css`のZ-Indexレイヤーは未使用のまま）

---

## 提案実装（Tailwindクラス差し替え）

- 置換ポリシー（共通化できる場合は`IconButton`化を検討、今回は最小変更）

修正後クラス案:
- ベース: `inline-flex items-center justify-center p-2 rounded-md text-gray-600`
- ホバー: `hover:bg-gray-100 hover:text-gray-800`
- フォーカス: `focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2`
- トランジション: `transition-colors`

コード例（置換後）:

```172:189:components/trip/TripItineraryView.tsx
<button
  onClick={expandAllDays}
  className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-colors"
  title={t('trip.itineraryView.expandAll')}
  aria-label={t('trip.itineraryView.expandAll')}
>
  <Icon icon="mdi:unfold-more-horizontal" className="w-5 h-5" />
</button>
<button
  onClick={collapseAllDays}
  className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-colors"
  title={t('trip.itineraryView.collapseAll')}
  aria-label={t('trip.itineraryView.collapseAll')}
>
  <Icon icon="mdi:unfold-less-horizontal" className="w-5 h-5" />
</button>
```

---

## 実装手順

1) `components/trip/TripItineraryView.tsx`
- 上記2つのボタンの`className`を上記案に差し替え
- `aria-label`を追加

2) スナップショット確認
- 英語/日本語で`title`が正しく出ること
- ホバー時のみ背景色が変化すること
- フォーカスリングが表示されること（Tab操作）

---

## 影響範囲 / リスク

- 視覚的コントラストが弱くなり過ぎるリスク → `text-gray-700`への微調整で対応可能
- マウスホバーが使えない環境でもフォーカスリングで可視化を担保
- レイアウト影響は最小（サイズ・配置は不変）

---

## 受け入れ条件（AC）

- 常時はアイコンのみで、背景は透明〜超薄いグレー
- ホバー時に背景が`gray-100`程度でわずかに濃くなる
- フォーカス時にリング表示がある
- i18nの`title`/`aria-label`が適切に表示される
- 既存機能（展開/折りたたみ）は従来通りに動作

---

## フォローアップ（任意）

- 汎用`IconButton`コンポーネント化（`size`, `variant='ghost'|'solid'`, `aria-label`必須）
- 左メニュー等の他の強い色ボタンのトーンダウンも横展開
