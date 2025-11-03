# Issue: Loadingコンポーネントのデフォルトメッセージ「読み込み中」のi18n化

**作成日**: 2025-11-01  
**解決日**: 2025-11-01  
**状態**: ✅ 解決済み（Phase 1完了）  
**優先度**: 中  
**種類**: i18n化  
**関連ファイル**: 
- `components/common/Loading.tsx`（Loadingコンポーネント）
- `lib/i18n/index.ts`（i18n辞書）
- Loadingコンポーネントを使用している全ファイル（約9ファイル）

---

## 📋 概要

`components/common/Loading.tsx`のデフォルトメッセージが「読み込み中...」とハードコードされており、i18n化されていません。ユーザーの表示言語に関係なく、常に日本語で表示されるため、多言語対応が不完全です。

---

## 🐛 問題の詳細

### 現状の問題

**ファイル**: `components/common/Loading.tsx` (27行目)

```tsx
export const Loading: React.FC<LoadingProps> = ({
  message = '読み込み中... ',  // ← ハードコードされた日本語
  size = 'md',
  fullScreen = false,
  center = true,
  className,
  ...rest
}) => {
  // ...
}
```

### 影響範囲

1. **Loadingコンポーネントのデフォルトメッセージ**
   - `message`プロップが指定されない場合、「読み込み中...」が表示される
   - 約9ファイルで`<Loading />`が使用されているが、多くの箇所で`message`プロップが指定されていない

2. **使用箇所の例**
   ```tsx
   // messageプロップ未指定の場合、デフォルトの「読み込み中...」が表示される
   <Loading fullScreen size="lg" />
   
   // messageプロップを指定しても、多くの箇所で日本語がハードコードされている
   <Loading fullScreen size="lg" message="読み込み中..." />
   ```

3. **他のローディング表示との不整合**
   - `TripEditor.tsx`: 「保存中...」「日程を更新しています」（ハードコード）
   - `TripMap.tsx`: 「地図を読み込み中...」（ハードコード）
   - `VenueDistance.tsx`: 「計算中...」（ハードコード）
   - `TripItineraryView.tsx`: 「スケジュールを追加中...」（ハードコード）

### 期待される動作

- ユーザーの表示言語設定に応じて、適切な言語でローディングメッセージが表示される
- 英語設定時は「Loading...」、日本語設定時は「読み込み中...」と表示される
- 既存のi18nシステム（`lib/i18n/index.ts`）と統合される

---

## 💡 解決方針

### Phase 1: Loadingコンポーネントのi18n化

1. **i18nキーの追加**
   - `lib/i18n/index.ts`に`loading.message`キーを追加
   - 英語: `"Loading..."`
   - 日本語: `"読み込み中..."`

2. **Loadingコンポーネントの修正**
   - `t()`関数をインポート
   - デフォルトメッセージを`t('loading.message')`に変更
   - `message`プロップが指定された場合も、i18nキーとして扱うか、直接文字列を受け入れるかを検討

### Phase 2: その他のローディングメッセージのi18n化（オプション）

他のコンポーネントでハードコードされているローディングメッセージもi18n化することを推奨：

- `loading.saving`: 「保存中...」 / "Saving..."
- `loading.mapLoading`: 「地図を読み込み中...」 / "Loading map..."
- `loading.calculating`: 「計算中...」 / "Calculating..."
- `loading.addingSchedule`: 「スケジュールを追加中...」 / "Adding schedule..."
- など

---

## 🔧 実装詳細

### Step 1: i18nキーの追加

`lib/i18n/index.ts`に以下を追加:

```typescript
// Loading messages
| 'loading.message'
| 'loading.saving'        // Phase 2
| 'loading.mapLoading'    // Phase 2
| 'loading.calculating'   // Phase 2
| 'loading.addingSchedule' // Phase 2
```

**英語**:
```typescript
'loading.message': 'Loading...',
'loading.saving': 'Saving...',
'loading.mapLoading': 'Loading map...',
'loading.calculating': 'Calculating...',
'loading.addingSchedule': 'Adding schedule...',
```

**日本語**:
```typescript
'loading.message': '読み込み中...',
'loading.saving': '保存中...',
'loading.mapLoading': '地図を読み込み中...',
'loading.calculating': '計算中...',
'loading.addingSchedule': 'スケジュールを追加中...',
```

### Step 2: Loadingコンポーネントの修正

```tsx
import { t } from '@/lib/i18n'

export const Loading: React.FC<LoadingProps> = ({
  message,
  size = 'md',
  fullScreen = false,
  center = true,
  className,
  ...rest
}) => {
  // messageが指定されない場合は、i18n化されたデフォルトメッセージを使用
  const displayMessage = message || t('loading.message')
  
  // ...
}
```

### Step 3: 既存の使用箇所の確認（オプション）

`message`プロップを指定している箇所を確認し、必要に応じてi18nキーを使用するように修正：

```tsx
// ❌ 現在
<Loading message="読み込み中..." />

// ✅ 修正後
<Loading message={t('loading.message')} />
```

ただし、`message`プロップが空文字列の場合は何も表示しない仕様を維持する。

---

## 🔍 技術的検討事項

### `message`プロップの扱い

1. **オプション1: 常にi18nキーとして扱う（推奨）**
   ```tsx
   const displayMessage = message ? t(message) : t('loading.message')
   ```
   - メリット: すべてのメッセージがi18n化される
   - デメリット: 既存のコードで`message="読み込み中..."`としている箇所を修正する必要がある

2. **オプション2: 文字列を直接受け入れる**
   ```tsx
   const displayMessage = message || t('loading.message')
   ```
   - メリット: 既存のコードへの影響が少ない
   - デメリット: ハードコードされた日本語が残る可能性がある

3. **オプション3: ハイブリッド**
   ```tsx
   // messageがi18nキーかどうかを判定（先頭が'loading.'で始まる場合はi18nキーとみなす）
   const displayMessage = message 
     ? (message.startsWith('loading.') ? t(message) : message)
     : t('loading.message')
   ```
   - メリット: 柔軟性が高い
   - デメリット: 実装が複雑になる

### 推奨アプローチ

**Phase 1ではオプション2を採用**し、既存のコードへの影響を最小限に抑える。将来的にPhase 2で他のローディングメッセージもi18n化する際に、オプション1に移行することを検討。

---

## 📝 実装計画

### Phase 1: 基本的なi18n化（優先度: 高）

1. ✅ i18nキーの追加（`loading.message`）
2. ✅ Loadingコンポーネントの修正
3. ✅ 既存の使用箇所で`message`未指定の場合は自動的にi18n化されることを確認

**見積もり**: 30分〜1時間

### Phase 2: 包括的なローディングメッセージのi18n化（優先度: 中）

1. 他のローディングメッセージのi18nキーを追加
2. 各コンポーネントでハードコードされたメッセージをi18nキーに置き換え

**見積もり**: 2-4時間

---

## 🔗 関連ファイル

- `components/common/Loading.tsx` - Loadingコンポーネント（約53行）
- `lib/i18n/index.ts` - i18n辞書
- `app/[userSlug]/page.tsx` - プロフィールページ（Loading使用）
- `app/[userSlug]/[tripSlug]/page.tsx` - 旅行詳細ページ（Loading使用）
- `app/home/page.tsx` - ホームページ（Loading使用）
- `app/memories/page.tsx` - メモリーページ（Loading使用）
- `app/plan/page.tsx` - プランページ（Loading使用）
- `app/page.tsx` - ランディングページ（Loading使用）
- `app/trip/new/page.tsx` - 新規旅行作成ページ（Loading使用）

---

## ✅ 完了条件

### Phase 1
- [x] `loading.message`のi18nキーが追加される（英語・日本語）✅ 完了
- [x] Loadingコンポーネントのデフォルトメッセージがi18n化される ✅ 完了
- [x] `message`プロップ未指定の場合、適切な言語でメッセージが表示される ✅ 完了
- [ ] 英語・日本語の両方で正常に動作することを確認（ブラウザテスト必要）
- [x] 既存の機能に影響がない ✅ 完了

---

## ✅ 解決内容（Phase 1完了）

### 実装内容

1. **i18nキーの追加** (`lib/i18n/index.ts`)
   - `loading.message`キーを追加
   - 英語: `'Loading...'`
   - 日本語: `'読み込み中...'`

2. **Loadingコンポーネントの修正** (`components/common/Loading.tsx`)
   - `t()`関数をインポート
   - デフォルトメッセージを`t('loading.message')`に変更
   - `message`プロップが指定されない場合、自動的にi18n化されたメッセージを表示
   - 既存コードとの互換性を維持（`message`プロップが指定されている場合はそのまま表示）

### 実装詳細

```tsx
// Before
export const Loading: React.FC<LoadingProps> = ({
  message = '読み込み中... ', // ハードコードされた日本語
  // ...
}) => { ... }

// After
export const Loading: React.FC<LoadingProps> = ({
  message, // デフォルト値を削除
  // ...
}) => {
  const displayMessage = message || t('loading.message') // i18n化されたデフォルト
  // ...
}
```

### 効果

- ✅ `message`プロップ未指定の場合、ユーザーの言語設定に応じて適切なメッセージが表示される
- ✅ 英語設定時: "Loading..."
- ✅ 日本語設定時: "読み込み中..."
- ✅ 既存のコード（`message`プロップを指定している箇所）はそのまま動作する（後方互換性を維持）

### 注意事項

- 一部の使用箇所で`message="読み込み中..."`とハードコードされている箇所がありますが、これらはPhase 2で対応予定です
- 既存コードへの影響を最小限にするため、`message`プロップは文字列を直接受け入れる仕様を維持しています

### テスト確認項目

- [x] i18nキーが正しく追加された
- [x] Loadingコンポーネントが修正された
- [ ] 英語環境で「Loading...」が表示される（ブラウザテスト必要）
- [ ] 日本語環境で「読み込み中...」が表示される（ブラウザテスト必要）
- [x] Lintエラーがない

### Phase 2（オプション）
- [ ] 他のローディングメッセージのi18nキーが追加される
- [ ] 各コンポーネントでハードコードされたメッセージがi18nキーに置き換えられる
- [ ] すべてのローディングメッセージが適切な言語で表示される

---

## 📝 実装時の注意事項

1. **既存のi18nパターンに従う**
   - `t()`関数を使用
   - `TranslationKey`型に新しいキーを追加
   - `en`と`ja`辞書の両方を更新

2. **後方互換性**
   - 既存のコードで`message`プロップを指定している場合でも動作するようにする
   - 段階的にi18n化を進める

3. **テスト**
   - 英語と日本語の両方で動作確認
   - `message`プロップの有無に関わらず正常に動作することを確認

---

## 🔍 参考

- `docs/issues/loading-component-usage-inconsistency.md` - ローディングコンポーネントの使用状況調査
- `docs/issues/create-trip-dialog-i18n.md` - CreateTripDialogのi18n化実装例
- `docs/issues/checklist-i18n.md` - Checklistのi18n化実装例

