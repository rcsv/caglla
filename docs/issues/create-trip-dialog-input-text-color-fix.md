# Create New Tripダイアログで文字が読めない問題（Safari/Edge）

## 問題の概要
Create New Tripダイアログ内の入力フィールド（特に`PlaceSearchInput`）で文字を入力した際に、SafariとEdgeで文字が読めなくなる問題が発生していました。

## 影響範囲
- `components/common/PlaceSearchInput.tsx` - 目的地検索入力フィールド
- `components/trip/MapSearchOverlay.tsx` - マップ上の検索オーバーレイ

## 原因の特定

### 1. テキスト色の未指定
`PlaceSearchInput`と`MapSearchOverlay`のinput要素には、テキスト色（`text-gray-800`など）が明示的に指定されていませんでした。そのため、SafariとEdgeで親要素から色が正しく継承されない場合、デフォルトの色が適用されずに文字が見えなくなることがありました。

### 2. tj-inputクラスが使用されていない
これらのコンポーネントは独自のスタイルを使用しており、`.tj-input`クラスを使用していません。そのため、先ほど修正した`.tj-input`のSafari対応スタイルが適用されていませんでした。

### 3. 親要素からのスタイル継承の問題
ダイアログの背景が`bg-white`で、親要素のテキスト色が指定されていない場合、SafariとEdgeで色が正しく継承されないことがあります。

## 修正内容

### PlaceSearchInput.tsx
```tsx
<input
  // ... 他のプロパティ
  className="... bg-white text-gray-800"  // bg-white と text-gray-800 を追加
  style={{ color: "#1f2937" }} // text-gray-800 を明示的に指定（Safari/Edge対応）
/>
```

### MapSearchOverlay.tsx
```tsx
<input
  // ... 他のプロパティ
  className="... bg-white text-gray-800"  // bg-white と text-gray-800 を追加
  style={{ color: "#1f2937" }} // text-gray-800 を明示的に指定（Safari/Edge対応）
/>
```

## 修正方法の選択理由

### 1. classNameに`text-gray-800`を追加
Tailwind CSSのクラスとして`text-gray-800`を追加することで、通常の状態でのテキスト色を確保します。

### 2. style属性で`color`を明示的に指定
インラインスタイルで`color`プロパティを明示的に指定することで、SafariとEdgeでも確実にテキスト色が適用されるようにします。これはCSSの優先度の問題を回避するための対策です。

### 3. `bg-white`を追加
背景色を明示的に指定することで、親要素からの継承に依存しないようにします。

## テスト項目
1. Safari（macOS）でCreate New Tripダイアログを開き、目的地入力欄に文字を入力できること
2. Edge（Windows）でCreate New Tripダイアログを開き、目的地入力欄に文字を入力できること
3. マップ上の検索オーバーレイでも同様に文字が読めること
4. 他のブラウザ（Chrome、Firefox）で既存の動作に影響がないこと
5. 自動補完機能を使用してもテキストが読み取れること

## 関連する修正
- [Safariでinput要素の背景と文字が両方白になる問題](./safari-input-white-background-text-fix.md)

## 参考
- Tailwind CSS: `text-gray-800` = `#1f2937`
- SafariとEdgeでは、CSS変数や親要素からの継承が正しく動作しない場合があるため、明示的な指定が推奨されます

