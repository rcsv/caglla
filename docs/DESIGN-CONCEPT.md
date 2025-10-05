# 🌴 Tropical Joy UI Design Guide

**ドキュメント種別:** UIコンポーネント設計指針
**対象:** デザイナー / フロントエンド開発者 / 生成AI / QA
**適用範囲:** `tabi4.me` および関連旅行サービスの全ボタンUI

---

## 1. テーマコンセプト

| 要素    | コンセプト                                           | 色イメージ              |
| ----- | ----------------------------------------------- | ------------------ |
| テーマ名  | **Tropical Joy**                                | 南国の空と海、自然、太陽、エネルギー |
| 主目的   | 明るく冒険的ながらも信頼感を維持するUI                            |                    |
| カラー基調 | **Emerald / Lime / Sky / Blue / Orange / Rose** |                    |
| キーワード | Fresh, Relax, Positive, Natural                 |                    |

---

## 2. ボタン構造ルール

### 2.1 ベース構造

全バリアント共通のクラス構成：

```css
.btn-base {
  @apply inline-flex items-center justify-center font-semibold rounded-xl
    shadow-md hover:shadow-lg transition active:scale-[0.99]
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    disabled:opacity-60 disabled:cursor-not-allowed
    [&>svg]:-ms-0.5 [&>svg]:me-1.5;
}
```

### 2.2 サイズ定義

```css
.btn-sm { @apply h-9 px-3 text-sm; }
.btn-md { @apply h-10 px-4 text-sm; }
.btn-lg { @apply h-12 px-6 text-base; }
```

---

## 3. カラーバリアント定義

| Variant       | 用途             | Tailwindクラス例                                                                                                                       |
| ------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Primary**   | 主要CTA（新規作成・保存） | `bg-gradient-to-r from-emerald-500 to-lime-500 text-white hover:from-emerald-600 hover:to-lime-600 focus-visible:ring-emerald-500` |
| **Secondary** | 補助CTA（詳細・次へ）   | `bg-gradient-to-r from-sky-400 to-blue-500 text-white hover:from-sky-500 hover:to-blue-600 focus-visible:ring-sky-500`             |
| **Accent**    | 強調CTA（シェア・予約）  | `bg-gradient-to-r from-orange-400 to-rose-500 text-white hover:from-orange-500 hover:to-rose-600 focus-visible:ring-rose-500`      |
| **Outline**   | 控えめアクション       | `border border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-50 focus-visible:ring-emerald-500`                           |
| **Ghost**     | テキストリンク的アクション  | `bg-transparent text-emerald-700 hover:bg-emerald-50 focus-visible:ring-emerald-500`                                               |
| **Soft**      | 補助タグや軽アクション    | `bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-400`                                               |
| **Danger**    | 削除・警告          | `bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 focus-visible:ring-red-500`             |
| **Disabled**  | 無効状態           | `bg-gray-200 text-gray-500 shadow-none`                                                                                            |

---

## 4. 実装例

```html
<button class="btn-base btn-md btn-primary">旅を計画する</button>
<button class="btn-base btn-md btn-secondary">詳細を見る</button>
<button class="btn-base btn-md btn-accent">今すぐ予約</button>

<button class="btn-base btn-sm btn-outline">下書きに保存</button>
<button class="btn-base btn-sm btn-ghost">あとで</button>
<button class="btn-base btn-sm btn-soft">家族旅行</button>

<button class="btn-base btn-md btn-danger">削除する</button>
<button class="btn-base btn-md btn-disabled" disabled>処理中...</button>
```

React用の共通コンポーネントも用意しています。

```tsx
// components/Button.tsx
// 使い方例
import { Button } from '@/components/Button'

export default function Example() {
  return (
    <div className="space-x-2">
      <Button variant="primary">旅を計画する</Button>
      <Button variant="secondary">詳細を見る</Button>
      <Button variant="accent">今すぐ予約</Button>
      <Button variant="outline">下書きに保存</Button>
      <Button variant="ghost">あとで</Button>
      <Button variant="soft">家族旅行</Button>
      <Button variant="danger">削除する</Button>
      <Button variant="disabled" disabled>
        処理中...
      </Button>
    </div>
  )
}
```

---

## 5. 配色ガイドライン

| 要素       | 配色方針                                          |
| -------- | --------------------------------------------- |
| 背景       | `slate-50`〜`gray-100`（高コントラストを避ける）            |
| 文字       | `gray-700`（可読性優先）                             |
| CTA      | **Primaryは1ページに1種のみ**、Secondary・Accentは補助的に使用 |
| Disabled | すべて統一トーン（グレー）で統一感を維持                          |

---

## 6. ダークモード指針（任意）

```css
.dark .btn-outline { @apply border-emerald-400 text-emerald-200 hover:bg-emerald-900/30; }
.dark .btn-ghost   { @apply text-emerald-200 hover:bg-emerald-900/30; }
.dark .btn-soft    { @apply bg-emerald-900/40 text-emerald-200 hover:bg-emerald-900/60; }
```

背景は `dark:bg-slate-900` を基本とする。

---

## 7. 運用ルール

1. **Primaryは1画面に1個まで**。他のCTAより目立つ配色にする。
2. 削除・キャンセル等の危険操作は必ず`btn-danger`。
3. 二次的操作（キャンセル、戻る）は`btn-outline`または`btn-ghost`。
4. 無効状態はすべて`disabled`属性で制御。個別カラー指定は禁止。
5. `Soft`や`Ghost`ボタンはテキストリンク的UIで乱用しない。
6. 新規バリアントを追加する場合は、**テーマ感（Tropical Joy）を維持する暖色または自然色グラデーションのみ許可**。

---

## 8. Tailwind設定拡張（任意）

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        tj: {
          primary: { from: '#10b981', to: '#84cc16' }, // emerald→lime
          secondary: { from: '#38bdf8', to: '#3b82f6' }, // sky→blue
          accent: { from: '#fb923c', to: '#f43f5e' }, // orange→rose
        },
      },
    },
  },
}
```

→ `from-tj-primary-from to-tj-primary-to` のようなカスタムグラデーションも可能。

---

## 9. メンテナンス方針

| 項目      | 更新基準                                  |
| ------- | ------------------------------------- |
| 配色      | 季節やキャンペーンテーマと競合しない限り固定                |
| スタイル調整  | Tailwindバージョン変更時に検証                   |
| バリアント追加 | UIレビュー承認後のみ（`btn-`接頭辞必須）              |
| 自動生成    | 生成AIは本ガイドラインを参照し、既存クラスを流用。新色生成は要レビュー。 |

---

## 10. ドキュメント管理情報

| 項目      | 内容                                       |
| ------- | ---------------------------------------- |
| ドキュメント名 | Tropical Joy Button Design System        |
| バージョン   | 1.0                                      |
| 最終更新    | 2025-10-05                               |
| 作成者     | ともさん（設計） / ChatGPT (GPT-5)（整備）           |
| 適用範囲    | Next.js / Bubble.io / Tailwind CSSベースのUI |
