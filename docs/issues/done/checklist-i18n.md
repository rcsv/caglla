# Issue: チェックリスト関連の日本語ハードコード

**作成日**: 2025-11-01  
**状態**: ✅ 解決済み  
**優先度**: 中  
**解決日**: 2025-11-01  
**種類**: i18n化  
**関連ファイル**: 
- `components/trip/TripChecklistView.tsx`（チェックリストメイン表示）
- `components/planner/NavigationMenu.tsx`（左メニューのチェックリスト項目）
- `components/modals/ChecklistPresetModal.tsx`（プリセット保存モーダル）
- `components/modals/MyPresetsModal.tsx`（マイプリセットモーダル）
- `components/modals/PresetLibraryModal.tsx`（プリセットライブラリモーダル）
- `lib/i18n/index.ts`（i18n辞書）

---

## 📋 概要

チェックリスト機能のUI要素（ボタン、ラベル、メッセージ、モーダル）に日本語がハードコードされており、多言語対応が不完全。ユーザーの表示言語設定に関係なく、常に日本語で表示される。

---

## 🐛 問題の詳細

### 現状の問題

#### 1. TripChecklistView.tsx（チェックリストメイン表示）

**ボタンラベル:**
- `'プリセットを適用'` (125行目)
- `'マイプリセット'` (131行目)
- `'プリセットとして保存'` (137行目)
- `'生成中...'` / `'チェックリストを再生成'` (144行目)
- `'追加'` (243行目)

**セクションタイトル:**
- `'行動系準備（Preparing）'` (157行目)
- `'パッキング系（Packing）'` (191行目)

**メッセージ:**
- `'読み込み中...'` (150行目)
- `'該当項目はありません'` (182行目)
- `'カスタム項目を追加'` (236行目 - placeholder)
- `'プリセットを保存しました'` (257行目 - alert)
- `'プリセットを適用しました'` (283行目 - alert)
- `'削除'` (176行目, 210行目 - カスタム項目削除ボタン)

#### 2. NavigationMenu.tsx（左メニュー）

**サブタイトル:**
- `'行動系のこと'` (143行目 - Preparingのサブタイトル)
- `'持っていくものの準備系'` (152行目 - Packingのサブタイトル)

#### 3. ChecklistPresetModal.tsx（プリセット保存モーダル）

**タイトル・ラベル:**
- `'チェックリストをプリセットとして保存'` (75行目)
- `'タイトル'` (81行目)
- `'説明'` (94行目)
- `'タグ（カンマ区切り）'` (107行目)
- `'公開する（他のユーザーが利用可能）'` (127行目)

**プレースホルダー:**
- `'例: 冬の北海道旅行'` (87行目)
- `'例: スキー・温泉旅行向けのチェックリスト'` (99行目)
- `'例: winter, hokkaido, skiing'` (113行目)

**ボタン:**
- `'キャンセル'` (137行目)
- `'保存中...'` / `'保存'` (144行目)

**エラーメッセージ:**
- `'タイトルを入力してください'` (29行目 - alert)
- `'プリセットの保存に失敗しました'` (64行目 - alert)

#### 4. MyPresetsModal.tsx（マイプリセットモーダル）

**タイトル:**
- `'マイプリセット'` (66行目)

**メッセージ:**
- `'読み込み中...'` (70行目)
- `'プリセットがありません'` (72行目)

**ラベル:**
- `'公開'` / `'非公開'` (93行目)
- `'使用回数:'` (94行目)
- `'回'` (94行目)
- `'項目'` (95行目)

**ボタン:**
- `'削除'` (102行目)
- `'閉じる'` (115行目)

**確認メッセージ:**
- `'このプリセットを削除しますか？'` (42行目 - confirm)

**エラーメッセージ:**
- `'削除に失敗しました'` (56行目 - alert)

#### 5. PresetLibraryModal.tsx（プリセットライブラリモーダル）

**タイトル:**
- `'チェックリストプリセットを選択'` (82行目)

**プレースホルダー:**
- `'キーワード、タグで検索...'` (90行目)

**ソートオプション:**
- `'人気順'` (98行目)
- `'新着順'` (99行目)

**メッセージ:**
- `'読み込み中...'` (105行目)
- `'プリセットが見つかりません'` (107行目)

**ラベル:**
- `'使用回数:'` (127行目)
- `'回'` (127行目)
- `'項目'` (128行目)

**ボタン:**
- `'適用'` (135行目)
- `'閉じる'` (148行目)

**エラーメッセージ:**
- `'プリセットの適用に失敗しました'` (69行目, 72行目 - alert)

### 影響範囲

- **コンポーネント数**: 5つ（TripChecklistView, NavigationMenu, ChecklistPresetModal, MyPresetsModal, PresetLibraryModal）
- **日本語ハードコード箇所**: 約50箇所以上
- **ユーザー体験**: 英語設定時でも日本語が表示され、一貫性がない

### 期待される動作

- ユーザーの表示言語設定に応じて、チェックリスト関連のUIが適切な言語で表示される
- 英語設定時は英語、日本語設定時は日本語で表示
- 既存のi18nシステム（`lib/i18n/index.ts`）と統合

---

## 💡 解決方針

### Phase 1: i18nキーの設計

#### 1.1: i18nキーの命名規則

チェックリスト関連のi18nキーを以下の命名規則で設計:

```
checklist.{component}.{element}
```

例:
- `checklist.view.title` - "Travel Checklist"
- `checklist.view.button.applyPreset` - "プリセットを適用"
- `checklist.view.button.myPresets` - "マイプリセット"
- `checklist.view.button.savePreset` - "プリセットとして保存"
- `checklist.view.button.regenerate` - "チェックリストを再生成"
- `checklist.view.section.preparing` - "行動系準備"
- `checklist.view.section.packing` - "パッキング系"
- `checklist.view.message.empty` - "該当項目はありません"
- `checklist.view.message.addCustom` - "カスタム項目を追加"
- `checklist.nav.preparing` - "行動系のこと"
- `checklist.nav.packing` - "持っていくものの準備系"
- `checklist.preset.save.title` - "チェックリストをプリセットとして保存"
- `checklist.preset.save.label.title` - "タイトル"
- `checklist.preset.save.button.save` - "保存"
- `checklist.myPresets.title` - "マイプリセット"
- `checklist.myPresets.empty` - "プリセットがありません"
- `checklist.library.title` - "チェックリストプリセットを選択"
- `checklist.library.search.placeholder` - "キーワード、タグで検索..."
- `checklist.library.sort.popular` - "人気順"
- `checklist.library.sort.recent` - "新着順"
```

#### 1.2: i18nキーの追加

`lib/i18n/index.ts`に約50-60個のi18nキーを追加:
- チェックリスト表示: 約15個
- ナビゲーションメニュー: 2個
- プリセット保存モーダル: 約15個
- マイプリセットモーダル: 約10個
- プリセットライブラリモーダル: 約10個
- 共通メッセージ（読み込み中、削除、閉じるなど）: 約5-10個

### Phase 2: コンポーネントの更新

#### 2.1: TripChecklistView.tsx

- ボタンラベルをすべてi18n化
- セクションタイトルをi18n化
- メッセージ、プレースホルダーをi18n化
- `alert()`メッセージもi18n化

#### 2.2: NavigationMenu.tsx

- チェックリストサブメニューの`subtitle`をi18n化
- 既に`t()`関数はインポート済みなので、`subtitle: t('checklist.nav.preparing')`のように変更

#### 2.3: ChecklistPresetModal.tsx

- タイトル、ラベルをi18n化
- プレースホルダーをi18n化
- ボタン、エラーメッセージをi18n化
- `alert()`メッセージもi18n化

#### 2.4: MyPresetsModal.tsx

- タイトル、メッセージをi18n化
- ラベル、ボタンをi18n化
- `confirm()`、`alert()`メッセージもi18n化

#### 2.5: PresetLibraryModal.tsx

- タイトル、プレースホルダーをi18n化
- ソートオプションをi18n化
- メッセージ、ボタンをi18n化
- `alert()`メッセージもi18n化

### Phase 3: i18n辞書の作成

#### 3.1: 英語翻訳の追加

全チェックリスト関連の英語翻訳を`lib/i18n/index.ts`の`en`辞書に追加

#### 3.2: 日本語翻訳の追加

既存の日本語文字列を`ja`辞書に追加（現状と同じ値を維持）

---

## 🎉 解決内容

### 実装内容

1. **i18nキーの追加** (`lib/i18n/index.ts`)
   - `checklist.*` ネームスペースで52個のキーを追加
   - TripChecklistView、ChecklistPresetModal、MyPresetsModal、PresetLibraryModal、NavigationMenuの全テキストに対応
   - 英語・日本語両方の翻訳を追加

2. **コンポーネントの修正**
   - `components/trip/TripChecklistView.tsx`: ボタンラベル、セクションタイトル、メッセージ、プレースホルダーをi18n化
   - `components/modals/ChecklistPresetModal.tsx`: モーダルタイトル、フォームラベル、プレースホルダー、ボタン、エラーメッセージをi18n化
   - `components/modals/MyPresetsModal.tsx`: タイトル、メッセージ、ボタン、confirm/alertメッセージをi18n化
   - `components/modals/PresetLibraryModal.tsx`: タイトル、プレースホルダー、ソートオプション、ボタン、エラーメッセージをi18n化
   - `components/planner/NavigationMenu.tsx`: チェックリストサブタイトルをi18n化

### 置き換えた箇所

- **TripChecklistView**: タイトル、ボタンラベル（プリセットを適用、マイプリセット、プリセットとして保存、生成中/チェックリストを再生成）、読み込み中、セクションタイトル（行動系準備、パッキング系）、該当項目なし、削除ボタン、プレースホルダー、追加ボタン、alertメッセージ
- **ChecklistPresetModal**: モーダルタイトル、フォームラベル、プレースホルダー、チェックボックスラベル、ボタン、エラーメッセージ
- **MyPresetsModal**: タイトル、読み込み中、空状態、公開/非公開、使用回数、項目数、削除ボタン、閉じるボタン、confirm/alertメッセージ
- **PresetLibraryModal**: タイトル、検索プレースホルダー、ソートオプション、読み込み中、空状態、適用ボタン、閉じるボタン、エラーメッセージ
- **NavigationMenu**: チェックリストのサブタイトル（行動系のこと、持っていくものの準備系）

### テスト

- [x] 英語表示で正常に動作することを確認
- [x] 日本語表示で正常に動作することを確認
- [x] すべてのモーダルが適切に表示されることを確認
- [x] alert/confirmメッセージが適切に表示されることを確認

---

## 🔗 関連ファイル

- `components/trip/TripChecklistView.tsx` - チェックリストメイン表示（約288行）
- `components/planner/NavigationMenu.tsx` - 左メニュー（約431行）
- `components/modals/ChecklistPresetModal.tsx` - プリセット保存モーダル（約152行）
- `components/modals/MyPresetsModal.tsx` - マイプリセットモーダル（約123行）
- `components/modals/PresetLibraryModal.tsx` - プリセットライブラリモーダル（約156行）
- `lib/i18n/index.ts` - i18n辞書（約1200行）

---

## ✅ 完了条件

- [ ] `TripChecklistView.tsx`の全日本語ハードコードをi18n化
  - [ ] ボタンラベル（プリセットを適用、マイプリセット、プリセットとして保存、チェックリストを再生成、追加）
  - [ ] セクションタイトル（行動系準備、パッキング系）
  - [ ] メッセージ（読み込み中、該当項目はありません、カスタム項目を追加、削除）
  - [ ] alertメッセージ（プリセットを保存しました、プリセットを適用しました）

- [ ] `NavigationMenu.tsx`のチェックリストサブメニューをi18n化
  - [ ] Preparingのサブタイトル（行動系のこと）
  - [ ] Packingのサブタイトル（持っていくものの準備系）

- [ ] `ChecklistPresetModal.tsx`の全日本語ハードコードをi18n化
  - [ ] タイトル、ラベル、プレースホルダー
  - [ ] ボタン、エラーメッセージ

- [ ] `MyPresetsModal.tsx`の全日本語ハードコードをi18n化
  - [ ] タイトル、メッセージ、ラベル
  - [ ] ボタン、confirm/alertメッセージ

- [ ] `PresetLibraryModal.tsx`の全日本語ハードコードをi18n化
  - [ ] タイトル、プレースホルダー、ソートオプション
  - [ ] メッセージ、ボタン、エラーメッセージ

- [ ] 英語と日本語の翻訳が追加される（約50-60個のi18nキー）
- [ ] ビルドエラーがない
- [ ] ブラウザで動作確認済み（英語・日本語切り替えテスト）
- [ ] alert、confirmメッセージもi18n化されている

---

## 📝 実装時の注意事項

1. **alert/confirmメッセージのi18n化**
   - `alert()`、`confirm()`のメッセージもi18n化が必要
   - 例: `alert(t('checklist.preset.save.success'))`

2. **プレースホルダーのi18n化**
   - HTMLの`placeholder`属性もi18n化
   - 例: `placeholder={t('checklist.view.addCustomPlaceholder')}`

3. **動的メッセージ**
   - 「使用回数: 5回」のような動的メッセージは、`.replace('{count}', String(count))`を使用
   - 例: `t('checklist.myPresets.usageCount').replace('{count}', String(preset.usage_count))`

4. **既存のi18n実装との整合性**
   - 既存のi18nキー命名規則に従う
   - `trip.*`, `nav.*`など既存のパターンを参考にする

5. **段階的実装**
   - 一度に全てを変更せず、コンポーネントごとに順次実装
   - 動作確認しながら進める

6. **Loadingメッセージ**
   - 「読み込み中...」は複数箇所で使用されているため、共通キー（例: `common.loading`）の使用を検討

7. **共通ボタン/アクション**
   - 「削除」「閉じる」「保存」「キャンセル」などは他のコンポーネントでも使用されている可能性があるため、共通キーの使用を検討

---

## 🔍 参考

- 既存のi18n実装例:
  - `components/trip/ScheduleInfoDisplay.tsx` - `t('trip.schedule.time')`など
  - `components/trip/ActivityTagSelector.tsx` - `t('trip.schedule.activity')`など
  - `components/planner/NavigationMenu.tsx` - `t('nav.reservation')`など

- 類似Issue:
  - `docs/issues/activity-categories-i18n.md` - アクティビティカテゴリーのi18n化（参考）

---

## 💡 拡張アイデア（将来）

1. **チェックリスト項目のi18n化**
   - 現在、チェックリスト項目自体（`ChecklistItem.title`）は日本語でハードコードされていないが、自動生成される項目名が多言語対応されていない可能性
   - 将来的に、自動生成されるチェックリスト項目名もi18n対応する必要がある

2. **プリセットのタイトル・説明の多言語対応**
   - ユーザーが作成するプリセットのタイトル・説明を複数言語で保存できる機能
   - プリセット公開時の多言語対応

