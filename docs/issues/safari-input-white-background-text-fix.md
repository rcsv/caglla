# Safariでinput要素の背景と文字が両方白になる問題

## 問題の概要
Safari（macOS）でinput要素を使用した際に、背景色とテキスト色が両方とも白になり、文字が見えなくなる現象が発生している。

## 影響範囲
- すべての `.tj-input` クラスが適用されたinput要素
- Safari（macOS）のみで発生
- 他のブラウザでは正常に動作

## 原因の特定

### 1. Safariの自動補完機能（-webkit-autofill）
Safariは入力フィールドに自動補完が有効な場合、`-webkit-autofill` 疑似クラスを自動的に適用します。この疑似クラスは独自のスタイルを持っており、CSSで定義された背景色やテキスト色を上書きする可能性があります。

### 2. @applyディレクティブの問題
Tailwind CSSの `@apply` ディレクティブが、Safariで正しく適用されない場合があります。特に `text-gray-800` などのテキスト色指定が効かないことがあります。

### 3. 親要素からのスタイル継承
親要素でテキスト色が白に設定されている場合、input要素にも継承される可能性があります。

## 現在のコード

```css
.tj-input {
  @apply w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition disabled:bg-gray-100 disabled:text-gray-500;
}
```

## 修正方法

### 方法1: -webkit-autofillのスタイルを明示的に上書き（推奨）

```css
.tj-input {
  @apply w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition disabled:bg-gray-100 disabled:text-gray-500;
}

/* Safariの自動補完スタイルを上書き */
.tj-input:-webkit-autofill,
.tj-input:-webkit-autofill:hover,
.tj-input:-webkit-autofill:focus,
.tj-input:-webkit-autofill:active {
  -webkit-text-fill-color: #1f2937 !important; /* text-gray-800 */
  -webkit-box-shadow: 0 0 0px 1000px white inset !important;
  box-shadow: 0 0 0px 1000px white inset !important;
  background-color: white !important;
  color: #1f2937 !important;
}
```

### 方法2: colorプロパティを明示的に指定

```css
.tj-input {
  @apply w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition disabled:bg-gray-100 disabled:text-gray-500;
  color: #1f2937; /* text-gray-800 を明示的に指定 */
}
```

### 方法3: @applyを使わずに通常のCSSで記述

```css
.tj-input {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid #6ee7b7; /* border-emerald-300 */
  background-color: white;
  padding: 0.5rem 0.75rem;
  color: #1f2937; /* text-gray-800 */
  /* ... 他のスタイル */
}
```

## 推奨される修正（方法1と方法2の組み合わせ）

最も確実な修正方法は、`-webkit-autofill` のスタイルを明示的に上書きし、さらに `color` プロパティを明示的に指定することです。

```css
.tj-input {
  @apply w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition disabled:bg-gray-100 disabled:text-gray-500;
  color: #1f2937; /* text-gray-800 を明示的に指定 */
}

/* Safariの自動補完スタイルを上書き */
.tj-input:-webkit-autofill,
.tj-input:-webkit-autofill:hover,
.tj-input:-webkit-autofill:focus,
.tj-input:-webkit-autofill:active {
  -webkit-text-fill-color: #1f2937 !important;
  -webkit-box-shadow: 0 0 0px 1000px white inset !important;
  box-shadow: 0 0 0px 1000px white inset !important;
  background-color: white !important;
  color: #1f2937 !important;
}
```

## 同様の修正を適用する要素
- `.tj-select`
- `.tj-textarea`

## ダークモードへの対応

ダークモードでも同様の問題が発生する可能性があるため、ダークモード用のスタイルも追加します：

```css
.dark .tj-input:-webkit-autofill,
.dark .tj-input:-webkit-autofill:hover,
.dark .tj-input:-webkit-autofill:focus,
.dark .tj-input:-webkit-autofill:active {
  -webkit-text-fill-color: #f3f4f6 !important; /* text-gray-100 */
  -webkit-box-shadow: 0 0 0px 1000px #1e293b inset !important; /* bg-slate-800 */
  box-shadow: 0 0 0px 1000px #1e293b inset !important;
  background-color: #1e293b !important;
  color: #f3f4f6 !important;
}
```

## テスト項目
1. Safari（macOS）でinput要素に入力できること
2. 自動補完を使用してもテキストが読み取れること
3. フォーカス時にスタイルが正しく適用されること
4. ダークモードでも正常に表示されること
5. 他のブラウザ（Chrome、Firefox）で既存の動作に影響がないこと

## 参考リンク
- [MDN: -webkit-autofill](https://developer.mozilla.org/en-US/docs/Web/CSS/:autofill)
- [Tailwind CSS: @apply directive](https://tailwindcss.com/docs/functions-and-directives#apply)

