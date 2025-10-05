# 🌴 Tropical Joy UI Design Guide

**ドキュメント種別:** UIコンポーネント設計指針
**対象:** デザイナー / フロントエンド開発者 / 生成AI / QA
**適用範囲:** `tabi4.me` および関連旅行サービスの全UI（ボタン + フォーム要素）

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

## 3. ボタンバリアント

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

## 4. フォーム要素デザイン（Input / Select / Textarea / Toggle）

### 4.1 テキスト入力（Input）

```html
<input type="text" class="tj-input" placeholder="例: 行き先を入力" />
```

```css
.tj-input {
  @apply w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-gray-800
    placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400
    transition disabled:bg-gray-100 disabled:text-gray-500;
}
```

* **Hover:** `hover:border-emerald-400`
* **Error:** `border-rose-400 focus:ring-rose-400`
* **Success:** `border-lime-400 focus:ring-lime-400`

### 4.2 セレクトボックス（Select）

```html
<select class="tj-select">
  <option>国内旅行</option>
  <option>海外旅行</option>
</select>
```

```css
.tj-select {
  @apply w-full rounded-lg border border-sky-300 bg-white px-3 py-2 text-gray-800
    appearance-none bg-[url('data:image/svg+xml;utf8,<svg fill=\\'none\\' stroke=\\'%2366c2ff\\' stroke-width=\\'2\\' viewBox=\\'0 0 24 24\\'><path d=\\'M6 9l6 6 6-6\\'/></svg>')] bg-no-repeat bg-right-3 bg-center-right
    focus:ring-2 focus:ring-sky-400 focus:border-sky-400 hover:border-sky-400;
}
```

### 4.3 テキストエリア（Textarea）

```html
<textarea class="tj-textarea" rows="4" placeholder="旅の目的を記入"></textarea>
```

```css
.tj-textarea {
  @apply w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-gray-800 resize-y
    focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 hover:border-emerald-400;
}
```

### 4.4 トグルスイッチ（Toggle）

```html
<label class="tj-toggle">
  <input type="checkbox" />
  <span class="slider"></span>
</label>
```

```css
.tj-toggle {
  @apply relative inline-block w-12 h-6;
}
.tj-toggle input {
  @apply opacity-0 w-0 h-0;
}
.tj-toggle .slider {
  @apply absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 rounded-full transition;
}
.tj-toggle input:checked + .slider {
  @apply bg-gradient-to-r from-emerald-500 to-lime-500;
}
.tj-toggle .slider::before {
  content: "";
  @apply absolute h-5 w-5 left-0.5 bottom-0.5 bg-white rounded-full transition;
}
.tj-toggle input:checked + .slider::before {
  @apply translate-x-6;
}
```

### 4.5 チェックボックス / ラジオボタン

* 枠線：`border-emerald-400`
* チェック色：`bg-emerald-500`
* フォーカスリング：`ring-emerald-400`
* 無効状態：`bg-gray-100 text-gray-400`

---

## 5. フォーム系のアクセントカラー運用

| 用途  | カラー系統         | 備考        |
| --- | ------------- | --------- |
| 正常  | `emerald-400` | 入力完了・有効状態 |
| 注意  | `orange-400`  | 軽微な警告や入力中 |
| エラー | `rose-500`    | バリデーション失敗 |
| 補助  | `sky-400`     | 補足情報・選択状態 |

---

## 6. ダークモード指針（フォーム）

```css
.dark .tj-input, .dark .tj-select, .dark .tj-textarea {
  @apply bg-slate-800 text-gray-100 border-slate-600 placeholder-gray-500;
}
.dark .tj-input:focus, .dark .tj-select:focus, .dark .tj-textarea:focus {
  @apply border-emerald-400 ring-emerald-400;
}
```

---

## 7. 運用ルール

1. **フォーム内での主張度はボタンより低く保つ。** 視覚ノイズを避けるため、色は1トーン明るめの同系色。
2. **入力エラーと成功状態は明確に区別。** 色のみで判断できるように。
3. **必須項目には `*` 表示ではなく、`(必須)` のラベルを推奨。**
4. **フォームとボタンの隣接時は余白を 16px 以上確保。**
5. **入力例・補足説明は `text-sm text-gray-500` で統一。**

---

## 8. メンテナンス方針

| 項目        | 更新基準                             |
| --------- | -------------------------------- |
| コンポーネント追加 | UIレビュー後に `.tj-*` プレフィックスで統一命名    |
| フォーカスリング  | Tailwindバージョン更新時に挙動を確認           |
| 色味変更      | `Tropical Joy` のトーンに反しないことを条件に許可 |

---

## 9. ドキュメント管理情報

| 項目      | 内容                                       |
| ------- | ---------------------------------------- |
| ドキュメント名 | Tropical Joy Button & Form Design System |
| バージョン   | 1.1                                      |
| 最終更新    | 2025-10-05                               |
| 作成者     | ともさん（設計） / ChatGPT (GPT-5)（整備）           |
| 適用範囲    | Next.js / Bubble.io / Tailwind CSSベースのUI |
