# Issue: チェックリスト関連コンポーネントのi18n化

**作成日**: 2025-10-31  
**状態**: 🔴 未解決  
**優先度**: 中  
**種類**: i18n（国際化）  
**関連ファイル**:
- `components/trip/TripChecklistView.tsx`（メインコンポーネント）
- `components/modals/ChecklistPresetModal.tsx`（プリセット保存モーダル）
- `components/modals/MyPresetsModal.tsx`（マイプリセットモーダル）
- `components/modals/PresetLibraryModal.tsx`（プリセットライブラリモーダル）
- `lib/i18n/index.ts`（i18n辞書）

---

## 📋 概要

チェックリスト関連のコンポーネント（`TripChecklistView`とその関連モーダル）で使用されている日本語テキストが多言語化されていない。ボタンラベル、メッセージ、プレースホルダーなど、すべてのユーザー向けテキストをi18n化する必要がある。

---

## 🐛 問題の詳細

### 未i18n化のテキスト一覧

#### `components/trip/TripChecklistView.tsx`

**ボタンラベル:**
- "プリセットを適用"
- "マイプリセット"
- "プリセットとして保存"
- "チェックリストを再生成" / "生成中..."

**UIテキスト:**
- "読み込み中..."
- "行動系準備（Preparing）"
- "パッキング系（Packing）"
- "該当項目はありません"
- "カスタム項目を追加"
- "追加"

**メッセージ:**
- `alert('プリセットを保存しました')`
- `alert('プリセットを適用しました')`

**その他:**
- "削除"（カスタムアイテムの削除ボタン）

#### `components/modals/ChecklistPresetModal.tsx`

**モーダルタイトル:**
- "チェックリストをプリセットとして保存"

**フォームラベル:**
- "タイトル"
- "説明"
- "タグ（カンマ区切り）"

**プレースホルダー:**
- "例: 冬の北海道旅行"
- "例: スキー・温泉旅行向けのチェックリスト"
- "例: winter, hokkaido, skiing"

**チェックボックス:**
- "公開する（他のユーザーが利用可能）"

**ボタン:**
- "キャンセル"
- "保存" / "保存中..."

**エラーメッセージ:**
- `alert('タイトルを入力してください')`
- `alert('プリセットの保存に失敗しました')`

#### `components/modals/MyPresetsModal.tsx`

**モーダルタイトル:**
- "マイプリセット"

**UIテキスト:**
- "読み込み中..."
- "プリセットがありません"
- "公開" / "非公開"
- "使用回数: {count}回"
- "{count}項目"

**ボタン:**
- "削除"
- "閉じる"

**メッセージ:**
- `confirm('このプリセットを削除しますか？')`
- `alert('削除に失敗しました')`

#### `components/modals/PresetLibraryModal.tsx`

**モーダルタイトル:**
- "チェックリストプリセットを選択"

**UIテキスト:**
- "キーワード、タグで検索..."
- "人気順" / "新着順"
- "読み込み中..."
- "プリセットが見つかりません"
- "使用回数: {count}回"
- "{count}項目"

**ボタン:**
- "適用"
- "閉じる"

**エラーメッセージ:**
- `alert('プリセットの適用に失敗しました')`

---

## 💡 解決方針

### Phase 1: i18nキーの定義

`lib/i18n/index.ts`に以下のキーを追加：

```typescript
// チェックリスト関連
| 'checklist.title'
| 'checklist.loading'
| 'checklist.noItems'
| 'checklist.category.preparing'
| 'checklist.category.packing'
| 'checklist.preset.apply'
| 'checklist.preset.myPresets'
| 'checklist.preset.saveAsPreset'
| 'checklist.preset.regenerate'
| 'checklist.preset.regenerating'
| 'checklist.custom.add'
| 'checklist.custom.placeholder'
| 'checklist.custom.addButton'
| 'checklist.delete'
| 'checklist.preset.saveSuccess'
| 'checklist.preset.applySuccess'
| 'checklist.preset.save.title'
| 'checklist.preset.save.form.title'
| 'checklist.preset.save.form.titleLabel'
| 'checklist.preset.save.form.titlePlaceholder'
| 'checklist.preset.save.form.description'
| 'checklist.preset.save.form.descriptionLabel'
| 'checklist.preset.save.form.descriptionPlaceholder'
| 'checklist.preset.save.form.tags'
| 'checklist.preset.save.form.tagsLabel'
| 'checklist.preset.save.form.tagsPlaceholder'
| 'checklist.preset.save.form.isPublic'
| 'checklist.preset.save.form.isPublicLabel'
| 'checklist.preset.save.button.cancel'
| 'checklist.preset.save.button.save'
| 'checklist.preset.save.button.saving'
| 'checklist.preset.save.error.titleRequired'
| 'checklist.preset.save.error.saveFailed'
| 'checklist.preset.my.title'
| 'checklist.preset.my.loading'
| 'checklist.preset.my.empty'
| 'checklist.preset.my.public'
| 'checklist.preset.my.private'
| 'checklist.preset.my.usageCount'
| 'checklist.preset.my.itemsCount'
| 'checklist.preset.my.delete'
| 'checklist.preset.my.deleteConfirm'
| 'checklist.preset.my.deleteFailed'
| 'checklist.preset.my.close'
| 'checklist.preset.library.title'
| 'checklist.preset.library.searchPlaceholder'
| 'checklist.preset.library.sort.popular'
| 'checklist.preset.library.sort.recent'
| 'checklist.preset.library.loading'
| 'checklist.preset.library.empty'
| 'checklist.preset.library.usageCount'
| 'checklist.preset.library.itemsCount'
| 'checklist.preset.library.apply'
| 'checklist.preset.library.applyFailed'
| 'checklist.preset.library.close'
```

### Phase 2: コンポーネントの修正

1. **TripChecklistView.tsx**
   - `t()`関数をインポート
   - すべてのハードコードされた日本語テキストを`t()`で置き換え
   - `alert()`メッセージもi18n化

2. **ChecklistPresetModal.tsx**
   - `t()`関数をインポート
   - フォームラベル、プレースホルダー、ボタンをi18n化
   - `alert()`メッセージもi18n化

3. **MyPresetsModal.tsx**
   - `t()`関数をインポート
   - すべてのUIテキストをi18n化
   - `confirm()`と`alert()`メッセージもi18n化

4. **PresetLibraryModal.tsx**
   - `t()`関数をインポート
   - すべてのUIテキストをi18n化
   - `alert()`メッセージもi18n化

### Phase 3: 翻訳の追加

`lib/i18n/index.ts`の`en`と`ja`辞書に翻訳を追加。

---

## 🔧 実装詳細

### 必要なi18nキー（簡略版）

```typescript
// チェックリスト基本
'checklist.title': 'Travel Checklist' / 'チェックリスト'
'checklist.loading': 'Loading...' / '読み込み中...'
'checklist.noItems': 'No items' / '該当項目はありません'

// カテゴリ
'checklist.category.preparing': 'Preparing' / '行動系準備（Preparing）'
'checklist.category.packing': 'Packing' / 'パッキング系（Packing）'

// ボタン
'checklist.preset.apply': 'Apply Preset' / 'プリセットを適用'
'checklist.preset.myPresets': 'My Presets' / 'マイプリセット'
'checklist.preset.saveAsPreset': 'Save as Preset' / 'プリセットとして保存'
'checklist.preset.regenerate': 'Regenerate Checklist' / 'チェックリストを再生成'
'checklist.preset.regenerating': 'Generating...' / '生成中...'
'checklist.custom.addButton': 'Add' / '追加'
'checklist.delete': 'Delete' / '削除'

// カスタム追加
'checklist.custom.add': 'Add Custom Item' / 'カスタム項目を追加'
'checklist.custom.placeholder': 'Add custom item' / 'カスタム項目を追加'

// メッセージ
'checklist.preset.saveSuccess': 'Preset saved' / 'プリセットを保存しました'
'checklist.preset.applySuccess': 'Preset applied' / 'プリセットを適用しました'

// プリセット保存モーダル
'checklist.preset.save.title': 'Save Checklist as Preset' / 'チェックリストをプリセットとして保存'
'checklist.preset.save.form.titleLabel': 'Title' / 'タイトル'
'checklist.preset.save.form.titlePlaceholder': 'e.g., Winter Hokkaido Trip' / '例: 冬の北海道旅行'
'checklist.preset.save.form.descriptionLabel': 'Description' / '説明'
'checklist.preset.save.form.descriptionPlaceholder': 'e.g., Checklist for ski and hot spring trip' / '例: スキー・温泉旅行向けのチェックリスト'
'checklist.preset.save.form.tagsLabel': 'Tags (comma-separated)' / 'タグ（カンマ区切り）'
'checklist.preset.save.form.tagsPlaceholder': 'e.g., winter, hokkaido, skiing' / '例: winter, hokkaido, skiing'
'checklist.preset.save.form.isPublicLabel': 'Make public (available to other users)' / '公開する（他のユーザーが利用可能）'
'checklist.preset.save.button.cancel': 'Cancel' / 'キャンセル'
'checklist.preset.save.button.save': 'Save' / '保存'
'checklist.preset.save.button.saving': 'Saving...' / '保存中...'
'checklist.preset.save.error.titleRequired': 'Please enter a title' / 'タイトルを入力してください'
'checklist.preset.save.error.saveFailed': 'Failed to save preset' / 'プリセットの保存に失敗しました'

// マイプリセットモーダル
'checklist.preset.my.title': 'My Presets' / 'マイプリセット'
'checklist.preset.my.loading': 'Loading...' / '読み込み中...'
'checklist.preset.my.empty': 'No presets' / 'プリセットがありません'
'checklist.preset.my.public': 'Public' / '公開'
'checklist.preset.my.private': 'Private' / '非公開'
'checklist.preset.my.usageCount': 'Usage: {count} times' / '使用回数: {count}回'
'checklist.preset.my.itemsCount': '{count} items' / '{count}項目'
'checklist.preset.my.delete': 'Delete' / '削除'
'checklist.preset.my.deleteConfirm': 'Delete this preset?' / 'このプリセットを削除しますか？'
'checklist.preset.my.deleteFailed': 'Failed to delete' / '削除に失敗しました'
'checklist.preset.my.close': 'Close' / '閉じる'

// プリセットライブラリモーダル
'checklist.preset.library.title': 'Select Checklist Preset' / 'チェックリストプリセットを選択'
'checklist.preset.library.searchPlaceholder': 'Search by keyword or tag...' / 'キーワード、タグで検索...'
'checklist.preset.library.sort.popular': 'Popular' / '人気順'
'checklist.preset.library.sort.recent': 'Recent' / '新着順'
'checklist.preset.library.loading': 'Loading...' / '読み込み中...'
'checklist.preset.library.empty': 'No presets found' / 'プリセットが見つかりません'
'checklist.preset.library.usageCount': 'Usage: {count} times' / '使用回数: {count}回'
'checklist.preset.library.itemsCount': '{count} items' / '{count}項目'
'checklist.preset.library.apply': 'Apply' / '適用'
'checklist.preset.library.applyFailed': 'Failed to apply preset' / 'プリセットの適用に失敗しました'
'checklist.preset.library.close': 'Close' / '閉じる'
```

### 変数置換の処理

`usageCount`や`itemsCount`など、変数を含むメッセージは`.replace()`またはテンプレートリテラルを使用：

```typescript
// 例
t('checklist.preset.my.usageCount').replace('{count}', String(preset.usage_count || 0))
```

---

## 🔗 関連ファイル

- `components/trip/TripChecklistView.tsx` - メインコンポーネント
- `components/modals/ChecklistPresetModal.tsx` - プリセット保存モーダル
- `components/modals/MyPresetsModal.tsx` - マイプリセットモーダル
- `components/modals/PresetLibraryModal.tsx` - プリセットライブラリモーダル
- `lib/i18n/index.ts` - i18n辞書と型定義
- `lib/utils/language.ts` - 言語ユーティリティ（`getUserLanguage`など）

---

## ✅ 完了条件

- [ ] すべてのボタンラベルがi18n化されている
- [ ] すべてのUIテキスト（ラベル、プレースホルダーなど）がi18n化されている
- [ ] `alert()`、`confirm()`メッセージがi18n化されている
- [ ] 変数を含むメッセージ（使用回数、項目数など）が適切に処理されている
- [ ] 英語と日本語の両方で翻訳が定義されている
- [ ] 既存のi18nパターンと一貫性がある
- [ ] ビルドエラーがない
- [ ] ブラウザで動作確認済み（英語/日本語切り替え）

---

## 📝 実装時の注意事項

1. **既存のi18nパターンに従う**
   - `t()`関数を使用
   - `TranslationKey`型に新しいキーを追加
   - `en`と`ja`辞書の両方を更新

2. **変数置換**
   - カウント表示など、変数を含むメッセージは`.replace()`を使用
   - または、将来的にi18nライブラリの変数置換機能を検討

3. **メッセージダイアログ**
   - `alert()`や`confirm()`のメッセージもi18n化
   - 将来的には、カスタムモーダルコンポーネントに置き換えることを検討

4. **プレースホルダーの例**
   - プレースホルダーの例文も言語に応じて変更（英語の場合は英語の例、日本語の場合は日本語の例）

5. **テスト**
   - 英語と日本語の両方で動作確認
   - すべてのボタンとメッセージが正しく表示されることを確認

---

## 🔍 参考

- 他のコンポーネントでのi18n実装例（例: `app/[userSlug]/page.tsx`）
- `lib/i18n/index.ts`の既存のキー定義パターン
- `/home/page.tsx`のi18n化（参考実装）

---

## 💡 拡張アイデア（将来）

1. **カスタムモーダルコンポーネント**
   - `alert()`や`confirm()`をカスタムモーダルに置き換え
   - i18n対応とより良いUXを実現

2. **i18nライブラリの導入**
   - 変数置換機能を持つi18nライブラリ（例: `react-i18next`）を検討
   - より高度な多言語対応機能を実現

