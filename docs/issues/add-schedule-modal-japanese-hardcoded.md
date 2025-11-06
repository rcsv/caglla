# Issue: AddScheduleModalの日本語ハードコード問題

**作成日**: 2025-11-05  
**解決日**: 2025-11-05  
**状態**: ✅ 解決済み  
**優先度**: 中  
**種類**: Bug（i18n）  
**関連ファイル**: 
- `components/modals/AddScheduleModal.tsx`

---

## 📋 概要

Venue / Point of Interest を追加するDialog（`AddScheduleModal`）に、日本語がハードコードされている箇所が複数存在します。これにより、英語環境で日本語が表示され、一貫性のないユーザー体験が発生しています。

---

## 🐛 問題の詳細

### 現在の実装

`components/modals/AddScheduleModal.tsx`で以下の箇所が日本語ハードコードされています：

1. **タイトル（162行目）**
   ```tsx
   <h2 className="text-lg font-semibold text-gray-900">
     Venue / Point of Interest を追加
   </h2>
   ```

2. **検索ラベル（173行目）**
   ```tsx
   <label className="block text-sm font-medium text-gray-700 mb-2">
     場所を検索
   </label>
   ```

3. **プレースホルダー（181行目）**
   ```tsx
   placeholder="例: 東京タワー, 浅草寺, 銀座..."
   ```

4. **検索ボタン（190行目）**
   ```tsx
   {isSearching ? '検索中...' : '検索'}
   ```

5. **検索結果見出し（198行目）**
   ```tsx
   <h3 className="text-sm font-medium text-gray-700 mb-2">検索結果</h3>
   ```

### 影響範囲

- **ユーザー体験**: 英語環境のユーザーが日本語のテキストを見ることになり、一貫性のないUI体験
- **保守性**: 多言語対応の一貫性が損なわれる
- **アクセシビリティ**: スクリーンリーダーが不適切な言語で読み上げる可能性

---

## 💡 解決方針

### Phase 1: i18nキーの追加

`lib/i18n/index.ts`に以下のキーを追加します：

```typescript
// TranslationKey型に追加
| 'addScheduleModal.title'
| 'addScheduleModal.searchLabel'
| 'addScheduleModal.searchPlaceholder'
| 'addScheduleModal.searchButton'
| 'addScheduleModal.searching'
| 'addScheduleModal.searchResults'

// 英語翻訳
'addScheduleModal.title': 'Add Venue / Point of Interest'
'addScheduleModal.searchLabel': 'Search place'
'addScheduleModal.searchPlaceholder': 'e.g., Tokyo Tower, Senso-ji Temple, Ginza...'
'addScheduleModal.searchButton': 'Search'
'addScheduleModal.searching': 'Searching...'
'addScheduleModal.searchResults': 'Search Results'

// 日本語翻訳
'addScheduleModal.title': 'Venue / Point of Interest を追加'
'addScheduleModal.searchLabel': '場所を検索'
'addScheduleModal.searchPlaceholder': '例: 東京タワー, 浅草寺, 銀座...'
'addScheduleModal.searchButton': '検索'
'addScheduleModal.searching': '検索中...'
'addScheduleModal.searchResults': '検索結果'
```

### Phase 2: コンポーネントの更新

`components/modals/AddScheduleModal.tsx`で以下の変更を行います：

1. **タイトルをi18n化**
   ```tsx
   <h2 className="text-lg font-semibold text-gray-900">
     {t('addScheduleModal.title')}
   </h2>
   ```

2. **検索ラベルをi18n化**
   ```tsx
   <label className="block text-sm font-medium text-gray-700 mb-2">
     {t('addScheduleModal.searchLabel')}
   </label>
   ```

3. **プレースホルダーをi18n化**
   ```tsx
   placeholder={t('addScheduleModal.searchPlaceholder')}
   ```

4. **検索ボタンをi18n化**
   ```tsx
   {isSearching ? t('addScheduleModal.searching') : t('addScheduleModal.searchButton')}
   ```

5. **検索結果見出しをi18n化**
   ```tsx
   <h3 className="text-sm font-medium text-gray-700 mb-2">
     {t('addScheduleModal.searchResults')}
   </h3>
   ```

---

## 🔗 関連ファイル

- `components/modals/AddScheduleModal.tsx` - Venue/POI追加モーダル（約238行）
- `lib/i18n/index.ts` - i18n辞書（日本語ハードコード箇所の修正）

---

## ✅ 完了条件

- [x] `lib/i18n/index.ts`に`addScheduleModal.*`のi18nキーを追加（英語・日本語）
- [x] `AddScheduleModal.tsx`のタイトルを`t('addScheduleModal.title')`に置き換え
- [x] `AddScheduleModal.tsx`の検索ラベルを`t('addScheduleModal.searchLabel')`に置き換え
- [x] `AddScheduleModal.tsx`のプレースホルダーを`t('addScheduleModal.searchPlaceholder')`に置き換え
- [x] `AddScheduleModal.tsx`の検索ボタンを`t('addScheduleModal.searchButton')`と`t('addScheduleModal.searching')`に置き換え
- [x] `AddScheduleModal.tsx`の検索結果見出しを`t('addScheduleModal.searchResults')`に置き換え
- [ ] 英語環境で英語テキストが表示されることを確認
- [ ] 日本語環境で日本語テキストが表示されることを確認

## ✅ 解決内容

### 2025-11-05 実装完了

以下のi18nキーを追加し、`AddScheduleModal.tsx`の日本語ハードコードをすべてi18n化しました：

**追加したi18nキー（6個）**:
- `addScheduleModal.title` - モーダルタイトル
- `addScheduleModal.searchLabel` - 検索ラベル
- `addScheduleModal.searchPlaceholder` - プレースホルダー
- `addScheduleModal.searchButton` - 検索ボタン
- `addScheduleModal.searching` - 検索中ボタン
- `addScheduleModal.searchResults` - 検索結果見出し

**変更ファイル**:
- `lib/i18n/index.ts` - i18nキー追加（TranslationKey型、英語翻訳、日本語翻訳）
- `components/modals/AddScheduleModal.tsx` - 5箇所の日本語ハードコードを`t()`呼び出しに置き換え

**参考**: CodeRabbitからの提案内容と一致する実装を完了しました。

---

## 🔍 実装時の注意事項

1. **既存のi18nキーの確認**
   - `addScheduleModal.tryDifferentKeyword`は既に存在しているため、命名規則を統一する
   - 既存の`trip.schedule.saveFailed`などはそのまま使用

2. **プレースホルダーの例示**
   - 英語版では具体的な場所名を例示する（例: Tokyo Tower, Senso-ji Temple, Ginza）
   - 日本語版では既存の例（東京タワー, 浅草寺, 銀座）を維持

3. **既存のi18n使用箇所**
   - 230-231行目の`t('placeSearch.noResults')`と`t('addScheduleModal.tryDifferentKeyword')`は既にi18n化されているため変更不要

---

## 📚 参考

### 類似実装パターン

他のモーダルコンポーネントでは既にi18n化が完了しています：

- `ReservationInfoModal.tsx` - 予約情報モーダル（完全にi18n化済み）
- `POIDialog.tsx` - POI詳細ダイアログ（完全にi18n化済み）
- `ExportDataModal.tsx` - データエクスポートモーダル（完全にi18n化済み）

これらの実装パターンを参考に、`AddScheduleModal.tsx`も同様にi18n化します。

---

## 🔗 関連Issue

- i18n化の一貫性確保のため、他のコンポーネントも同様の問題がないか確認が必要

