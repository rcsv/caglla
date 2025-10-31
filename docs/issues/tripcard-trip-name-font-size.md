# Issue: TripCardの旅行名をより大胆に・大きくする

**作成日**: 2025-10-31  
**状態**: 🔴 未解決  
**優先度**: 中  
**関連ファイル**:
- `components/tripcard/TripCard.tsx`

---

## 📋 概要

TripCardコンポーネントに表示される旅行名（`trip.title`）のフォントサイズと太さが、ユーザーの期待よりも小さい。より大胆で大きなフォントにすることで、視認性とインパクトを高めたい。

---

## 🐛 現状の問題

### 現在の実装

#### `imageFull`バリアント（62行目）
```tsx
<h3 className="text-2xl font-semibold drop-shadow-sm line-clamp-2">{trip.title}</h3>
```
- フォントサイズ: `text-2xl` (1.5rem / 24px)
- フォントウェイト: `font-semibold` (600)

#### `standard`バリアント（131行目）
```tsx
<h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{trip.title}</h3>
```
- フォントサイズ: `text-lg` (1.125rem / 18px)
- フォントウェイト: `font-semibold` (600)

### 課題
- 旅行名がカード内で目立たない可能性がある
- 特に`standard`バリアントでは`text-lg`と比較的小さい
- `font-semibold`（600）では十分に大胆ではない可能性がある

### 原因究明（詳細調査完了）

#### 現状の実装詳細
```typescript:components/tripcard/TripCard.tsx
// 62行目: imageFullバリアント
<h3 className="text-2xl font-semibold drop-shadow-sm line-clamp-2">{trip.title}</h3>
// → text-2xl = 1.5rem (24px), font-semibold = 600

// 131行目: standardバリアント
<h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{trip.title}</h3>
// → text-lg = 1.125rem (18px), font-semibold = 600
```

#### 比較: 他の主要テキスト要素
- **説明文**: `text-sm` (0.875rem / 14px) - 旅行名の約58%（standard）
- **タグ**: `text-xs` (0.75rem / 12px) - 旅行名の約67%（standard）
- **目的地**: `text-sm` (0.875rem / 14px)

**問題点**:
1. `standard`バリアントでは旅行名が説明文とそれほど大きくない（18px vs 14px）
2. カード全体で見たときに、旅行名が最も重要な要素であるにもかかわらず視覚的階層が弱い
3. `drop-shadow-sm`は`imageFull`のみで、`standard`にはない（コントラスト不足の可能性）

#### 既存のデザインパターン
- ホームページのヒーロー: `text-[clamp(3.5rem,10vw,9rem)]`（非常に大きい）
- プロフィールページの名前: `text-3xl font-bold`（30px、700）
- セクション見出し: `text-xl font-semibold`（20px、600）または`text-2xl font-bold`（24px、700）

**推論**: TripCardの旅行名は、セクション見出しレベル（`text-xl`以上）またはプロフィール名レベル（`text-2xl`以上）にすべき

---

## 💡 期待される動作

1. **フォントサイズの拡大**
   - `imageFull`: `text-2xl` → `text-3xl` または `text-4xl`
   - `standard`: `text-lg` → `text-xl` または `text-2xl`

2. **フォントウェイトの強化**
   - `font-semibold`（600）→ `font-bold`（700）または `font-extrabold`（800）

3. **レスポンシブ対応**
   - モバイルでは少し小さめ、デスクトップでは大きめに調整
   - `text-3xl md:text-4xl` のようなレスポンシブクラスの使用

4. **デザインバランスの維持**
   - カード全体のレイアウトとの調和
   - 他の要素（説明文、タグなど）との視覚的階層

---

## 🔧 実装方針

### Phase 1: フォントサイズ・太さの調整

#### `imageFull`バリアント
```tsx
// 案1: より大きく、より太く
<h3 className="text-3xl md:text-4xl font-bold drop-shadow-md line-clamp-2">{trip.title}</h3>

// 案2: 大きくするが控えめに
<h3 className="text-3xl font-bold drop-shadow-sm line-clamp-2">{trip.title}</h3>
```

#### `standard`バリアント
```tsx
// 案1: 大きく、太く
<h3 className="text-xl md:text-2xl font-bold text-gray-900 line-clamp-2">{trip.title}</h3>

// 案2: 控えめに拡大
<h3 className="text-xl font-bold text-gray-900 line-clamp-2">{trip.title}</h3>
```

### Phase 2: レスポンシブ対応
- モバイル: `text-2xl md:text-3xl`（imageFull）、`text-xl md:text-2xl`（standard）
- デスクトップ: さらに大きなサイズを検討

### Phase 3: 視覚的階層の最適化
- `drop-shadow`の調整（`drop-shadow-sm` → `drop-shadow-md`）
- 行間の調整（必要に応じて）
- カード全体のパディング調整

---

## 📝 技術的実装詳細

### 変更箇所

1. **`components/tripcard/TripCard.tsx`**
   - 62行目: `imageFull`バリアントの`<h3>`タグ
   - 131行目: `standard`バリアントの`<h3>`タグ

### Tailwind CSSクラス

#### フォントサイズ
- `text-3xl`: 1.875rem (30px)
- `text-4xl`: 2.25rem (36px)
- `text-xl`: 1.25rem (20px)
- `text-2xl`: 1.5rem (24px)

#### フォントウェイト
- `font-bold`: 700
- `font-extrabold`: 800

#### レスポンシブ
- `text-3xl md:text-4xl`: モバイルで`text-3xl`、md以上で`text-4xl`

---

## 🔗 関連ファイル

- `components/tripcard/TripCard.tsx` - メインのTripCardコンポーネント
- `components/tripcard/NextTripMap.tsx` - 次の旅行カード（別コンポーネント）
- `app/home/page.tsx` - ホームページ（TripCardを使用）
- `app/[userSlug]/page.tsx` - プロフィールページ（TripCardを使用）
- `app/memories/page.tsx` - 思い出ページ（TripCardを使用）

---

## ✅ 完了条件

- [ ] `imageFull`バリアントの旅行名がより大きく、より太字になっている
- [ ] `standard`バリアントの旅行名がより大きく、より太字になっている
- [ ] レスポンシブデザインが適切に機能している
- [ ] カード全体のデザインバランスが保たれている
- [ ] 他の要素（説明文、タグなど）との視覚的階層が適切である
- [ ] すべてのデバイスサイズで視認性が向上している

---

## 💡 推奨実装

### `imageFull`バリアント
```tsx
<h3 className="text-3xl md:text-4xl font-bold drop-shadow-md line-clamp-2">{trip.title}</h3>
```
- `text-3xl`（モバイル）→ `text-4xl`（デスクトップ）
- `font-bold`（700）
- `drop-shadow-md`（より強い影）

### `standard`バリアント
```tsx
<h3 className="text-xl md:text-2xl font-bold text-gray-900 line-clamp-2">{trip.title}</h3>
```
- `text-xl`（モバイル）→ `text-2xl`（デスクトップ）
- `font-bold`（700）

---

## 🔍 実装時の注意事項

1. **カード全体のバランス**
   - 旅行名が大きくなりすぎて、説明文やタグが目立たなくならないようにする
   - カードの高さやパディングを調整する必要がある場合がある

2. **長い旅行名の処理**
   - `line-clamp-2`で2行に制限されているが、フォントが大きくなると改行が増える可能性
   - 必要に応じて`line-clamp-3`に変更する

3. **過去の旅行（`isPastTrip`）との一貫性**
   - 過去の旅行でも同じスタイルを適用する
   - `isPastTrip`によるスタイル変更と競合しないようにする

4. **アクセシビリティ**
   - フォントサイズが大きくなっても、コントラスト比（WCAG基準）を満たす
   - スクリーンリーダーでの読み上げに影響がない

