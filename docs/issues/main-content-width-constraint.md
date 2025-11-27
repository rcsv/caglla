# メインコンテンツの横幅制約問題

## 問題の概要

メインコンテンツ（Timeline エリア）の横幅が期待通りに広がらない。
- **期待値**: 740px まで広がる
- **実際の値**: 約 558px で止まってしまう

## 原因の特定

### 1. CSS の設定（`app/globals.css`）

```css
/* メインコンテンツエリアの最大幅制限 */
.main-content-scrollable {
  max-width: 740px;
  min-width: 400px;
}
```

`max-width: 740px` は設定されているが、これは「740px を超えない」という上限を設定するだけで、「740px まで広げる」という意味ではない。

### 2. HTML 構造（`TripClientLayout.tsx`）

```tsx
{/* Main Content Area */}
<div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
  {/* Left Content (Timeline) */}
  <div className="flex flex-col overflow-hidden main-content-scrollable lg:flex-shrink-0">
    {/* Timeline Slot */}
    <div className="flex-1 overflow-y-auto relative scrollbar-hide main-content-shadow">
      {timeline}
      {children}
      {social}
    </div>
  </div>

  {/* Map Panel (Desktop only) - Takes remaining space */}
  <div className="hidden lg:block lg:flex-1 border-l border-gray-200 h-full overflow-hidden">
    {map}
  </div>
</div>
```

#### 問題点の詳細

**167行目**: Left Content (Timeline) の `div`
- `lg:flex-shrink-0` が指定されているが、これは「縮小しない」という意味
- **明示的な幅指定がない**ため、コンテンツの幅に応じて決まる
- flexbox のデフォルト動作: `flex-basis: auto` + `flex-grow: 0` + `flex-shrink: 0`
  - これは「コンテンツの幅を維持する」という意味になる

**165行目**: 親要素
- `flex-1 flex flex-col lg:flex-row` が指定
- `lg:flex-row` により、lg 以上では横並びのレイアウトになる
- Timeline と Map が flexbox で並ぶ

**185行目**: Map Panel
- `lg:flex-1` が指定されており、**残りのスペースを全て占有する**
- Timeline の幅が決まった後、残りのスペースを Map が取る

### 3. なぜ 558px になるのか？

1. Timeline の内容（TripItineraryView など）のコンテンツ幅が約 558px
2. `lg:flex-shrink-0` により、Timeline はコンテンツ幅を維持
3. Map が `lg:flex-1` で残りのスペースを占有
4. 結果として、Timeline は約 558px で固定される

**`max-width: 740px` は効いていない理由**:
- `max-width` は「これ以上大きくならない」という制限
- Timeline の実際の幅（約558px）が `max-width` より小さいため、制約として機能していない

## 解決策

### 方法1: 明示的に幅を指定する（推奨）

```tsx
<div className="flex flex-col overflow-hidden main-content-scrollable lg:flex-shrink-0 lg:w-[740px]">
```

`lg:w-[740px]` を追加することで、lg 以上では Timeline の幅を 740px に固定する。

### 方法2: flex-basis を使用する

```tsx
<div className="flex flex-col overflow-hidden main-content-scrollable lg:flex-shrink-0 lg:flex-basis-[740px]">
```

`lg:flex-basis-[740px]` により、flexbox の基準幅を 740px に設定する。

### 方法3: flex-grow を追加する（非推奨）

```tsx
<div className="flex flex-col overflow-hidden main-content-scrollable lg:flex-grow lg:flex-shrink-0">
```

`lg:flex-grow` により、Timeline が伸びるようにする。しかし、これは Map とのスペース配分が不明確になるため非推奨。

## 推奨される修正

**方法1（明示的な幅指定）** を推奨します。理由：
- 意図が明確（「Timeline は 740px にする」）
- `max-width: 740px` との整合性が取れる
- レイアウトが予測可能

### 修正コード

```tsx
{/* Left Content (Timeline) */}
<div className="flex flex-col overflow-hidden main-content-scrollable lg:flex-shrink-0 lg:w-[740px]">
  {/* Floating Title Bar */}
  {trip && (
    <FloatingTitleBar 
      title={trip.title} 
      accessLevel={trip.access_level === 'private' ? 'private' : 'public'} 
    />
  )}

  {/* Timeline Slot */}
  <div className="flex-1 overflow-y-auto relative scrollbar-hide main-content-shadow">
    <Fragment key="timeline-slot">{timeline}</Fragment>
    <Fragment key="children-slot">{children}</Fragment>
    <Fragment key="social-slot">{social}</Fragment>
  </div>
</div>
```

```tsx
{/* Map Panel (Desktop only) - Takes remaining space */}
<div className="hidden lg:block lg:flex-1 lg:min-w-[400px] border-l border-gray-200 h-full overflow-hidden">
  {map}
</div>
```

## ⚠️ 実装前の留意点（重要）

### 1. 固定幅（`lg:w-[740px]`）の副作用

`lg:w-[740px]` は強力なルールで、以下の副作用が起きやすい：

#### 起きる可能性のある問題
- **ウィンドウ幅が 1200px 前後のとき**
  - Map パネルがギチギチに細くなる or 消えたように見える
  - Timeline: 740px + Map: 460px = 合計 1200px でギリギリ
- **Padding や gap を後から追加したとき**
  - 合計幅が親要素を超えて、overflow や wrap の問題が発生
  - Navigation Menu (188px) + Timeline (740px) + Map (?) = レイアウト崩れ

#### 回避策（必要に応じて）
柔軟な幅指定が必要な場合：
```tsx
lg:max-w-[740px] lg:w-full lg:flex-basis-[740px]
```
- "740px を目標とするが、足りない場合は縮む" という柔軟な指定
- ただし、今回の要件が **「とにかく 740px 使え」** なら固定幅が正しい

### 2. Map パネルの最小幅ガード

現状では：
- Timeline: 幅 740px で確保（優先度高）
- Map: 残り全部（縮むしかない）

**推奨**: Map 側に最小幅を設定
```tsx
lg:min-w-[400px]
```
- 将来、Map に大きな UI を追加した際の保険
- Timeline に押し負けて Map が使い物にならなくなるのを防ぐ

### 3. CSS と Tailwind の責務の整理

`main-content-scrollable` の CSS と Tailwind が混在している：
- **CSS 側**: `max-width: 740px` / `min-width: 400px`
- **Tailwind 側**: `lg:w-[740px]`

#### 問題点
- どちらが最終的な勝者か不明確
- 責務の管理が曖昧
- 将来の保守性が低い

#### 推奨される整理
**Tailwind で幅を固定するなら、CSS 側の幅制約は削除する**

```css
/* 修正前 */
.main-content-scrollable {
  max-width: 740px;
  min-width: 400px;
}

/* 修正後 */
.main-content-scrollable {
  /* 幅制約は Tailwind 側で管理 */
  /* 他のスタイルのみ残す */
}
```

### 4. レスポンシブ対応の確認

`lg:` プレフィックスで囲っているためスマホには影響ないはずだが：
- **確認必須**: スマホ〜タブレット〜デスクトップでの動作
- Breakpoints を跨ぐ flex レイアウトはブラウザの再現性が低い
- 特に iPad サイズ（1024px 前後）で問題が起きやすい

#### テスト対象画面幅
- Mobile: 375px, 414px
- Tablet: 768px, 1024px
- Desktop: 1280px, 1440px, 1920px
- **要注意**: 1200px 前後（Timeline + Map がギリギリ）

### 5. Timeline 内部コンテンツの幅制約確認

**重要**: レイアウト側で 740px を保証しても、中の子コンポーネントの幅指定がボトルネックになっている可能性がある。

#### 確認すべきコンポーネント
- `TripItineraryView`
- `TripSummaryView`
- その他 Timeline 内にレンダリングされる全コンポーネント

#### チェック項目
```tsx
// ❌ これらが原因で幅が広がらない可能性
max-w-[560px]
w-fit
inline-block
gap や padding で実質的な幅制限
```

#### 確認方法
1. ブラウザの開発者ツールで Timeline 内のコンテンツを検査
2. 実際の computed width を確認
3. 740px に広がっているか、それとも内部で制約されているか

**→ レイアウト修正後、実際に 740px まで広がっていない場合は、Timeline 内部のコンポーネントの調査が必要**

## 実装チェックリスト

修正を適用する際の確認事項：

- [ ] **Timeline に `lg:w-[740px]` を追加**
  - ファイル: `TripClientLayout.tsx` (167行目)
  - 追加: `lg:w-[740px]`

- [ ] **Map に `lg:min-w-[400px]` を追加**
  - ファイル: `TripClientLayout.tsx` (185行目)
  - 追加: `lg:min-w-[400px]`

- [ ] **CSS の幅制約を削除または整理**
  - ファイル: `app/globals.css` (206-209行目)
  - `.main-content-scrollable` から `max-width` / `min-width` を削除

- [ ] **レスポンシブ動作確認**
  - [ ] Mobile (375px, 414px)
  - [ ] Tablet (768px, 1024px)
  - [ ] Desktop (1280px, 1440px, 1920px)
  - [ ] 要注意: 1200px 前後

- [ ] **Timeline 内部コンテンツの幅確認**
  - [ ] `TripItineraryView` の実際の幅
  - [ ] `TripSummaryView` の実際の幅
  - [ ] 開発者ツールで computed width を確認

- [ ] **Map の表示確認**
  - [ ] 1200px 前後で Map が窮屈になっていないか
  - [ ] Map の最小幅が確保されているか

## 補足情報

### Flexbox の動作

- `flex-shrink: 0`: 縮小しない
- `flex-grow: 0` (デフォルト): 伸長しない
- `flex-basis: auto` (デフォルト): コンテンツの幅に応じる

Timeline に `lg:flex-shrink-0` だけを指定すると：
- 縮小はしないが、伸長もしない
- コンテンツの幅（約558px）を維持する
- `max-width: 740px` は効かない（既にそれより小さいため）

### レイアウトの意図

元々の設計意図は：
- Timeline: 最大 740px まで広げたい
- Map: 残りのスペースを占有したい

しかし、実装では Timeline の幅が明示されていなかったため、コンテンツ幅に依存してしまっていた。

### 固定幅 vs 柔軟な幅

| 方法 | メリット | デメリット |
|------|---------|-----------|
| `lg:w-[740px]`（固定） | 意図が明確、予測可能 | 画面幅が狭い場合に問題 |
| `lg:max-w-[740px] lg:w-full`（柔軟） | レスポンシブ、縮む | 意図が不明確、予測困難 |

**今回の要件**: "740px まで広げる" → **固定幅が正しい選択**

## 参考

- ファイル: `app/(planner)/[userSlug]/[tripSlug]/TripClientLayout.tsx` (167行目, 185行目)
- CSS: `app/globals.css` (206-209行目)
- Tailwind CSS Flexbox: https://tailwindcss.com/docs/flex
- Tailwind CSS Width: https://tailwindcss.com/docs/width

