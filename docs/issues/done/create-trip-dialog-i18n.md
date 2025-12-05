# Issue: CreateTripDialogの日本語ハードコード

**作成日**: 2025-11-01  
**状態**: ✅ 解決済み  
**優先度**: 中  
**解決日**: 2025-11-01  
**関連ファイル**:
- `components/common/CreateTripDialog.tsx`

---

## 📋 概要

`/home`ページで「新しい旅行を作成」ダイアログを開くと、日本語でハードコードされたテキストが多数表示される。UI言語が英語に設定されていても日本語のまま表示されてしまう。

---

## 🐛 問題の詳細

### ハードコードされている日本語テキスト

`components/common/CreateTripDialog.tsx`で以下のテキストがハードコードされている：

1. **タイトル・ヘッダー**
   - `"新しい旅行を作成"` (268行目)

2. **フォームラベル**
   - `"目的地 *"` (280行目)
   - `"出発日 *"` (301行目)
   - `"帰宅日 *"` (312行目)
   - `"旅行のタイトル（未入力時は目的地が使用されます）"` (361行目)
   - `"説明"` (371行目)
   - `"公開設定"` (425行目)

3. **プレースホルダー**
   - `"目的地を検索（例: 東京、パリ、ニューヨーク）"` (289行目)
   - `"例: 沖縄旅行（空欄の場合は目的地が使用されます）"` (367行目)
   - `"旅行の詳細や目的を記入してください"` (377行目)

4. **エラーメッセージ・バリデーション**
   - `"日付エラー"` (308行目、319行目)
   - `"目的地はGoogle Placesから選択してください"` (294行目)

5. **ボタン・アクション**
   - `"キャンセル"` (454行目)
   - `"作成中..."` / `"旅行を作成"` (461行目)
   - `"詳細設定"` (347行目)

6. **状態メッセージ**
   - `"目的地に関連する画像を自動取得中..."` (398行目)
   - `"目的地に関連する画像を自動取得しました"` (416行目)

7. **公開設定**
   - `"非公開（自分と共有ユーザーのみ）"` (428行目)
   - `"この旅行は自分と共有ユーザーのみが閲覧できます"` (439行目)
   - `"この旅行は誰でも閲覧できます"` (440行目)

---

## 💡 対処方針

### 実装方針
1. `lib/i18n/index.ts`に新しいi18nキーを追加
   - `trip.create.*` のネームスペースを使用
   - 全テキストに対応するキーを定義

2. `CreateTripDialog.tsx`を修正
   - `t()`関数をインポート
   - すべてのハードコードされた日本語テキストをi18nキーに置き換え

3. 英語翻訳を追加
   - `en`辞書に対応する英語テキストを追加

### 必要なi18nキー（推定）
約20-25個のi18nキーが必要：

- `trip.create.title`
- `trip.create.destination.label`
- `trip.create.destination.placeholder`
- `trip.create.destination.hint`
- `trip.create.startDate.label`
- `trip.create.endDate.label`
- `trip.create.dateError`
- `trip.create.title.label`
- `trip.create.title.placeholder`
- `trip.create.description.label`
- `trip.create.description.placeholder`
- `trip.create.advancedSettings`
- `trip.create.imageLoading`
- `trip.create.imageLoaded`
- `trip.create.accessLevel.label`
- `trip.create.accessLevel.private.label`
- `trip.create.accessLevel.private.description`
- `trip.create.accessLevel.public.description`
- `trip.create.cancel`
- `trip.create.submitting`
- `trip.create.submit`

---

## ✅ 完了条件

- [x] すべてのハードコードされた日本語テキストがi18nキーに置き換えられる
- [x] 英語・日本語両方の翻訳が追加される
- [x] UI言語設定に応じて適切な言語で表示される
- [x] 既存の機能に影響がない

---

## 🎉 解決内容

### 実装内容

1. **i18nキーの追加** (`lib/i18n/index.ts`)
   - `trip.create.*` ネームスペースで26個のキーを追加
   - タイトル、ラベル、プレースホルダー、エラーメッセージ、ボタン、状態メッセージなど
   - 英語・日本語両方の翻訳を追加

2. **CreateTripDialog.tsxの修正**
   - `t()`関数をインポート
   - すべてのハードコードされた日本語テキストをi18nキーに置き換え
   - `alert()`メッセージもi18n化
   - 日付バリデーションメッセージもi18n化

### 置き換えた箇所

- タイトル: `"新しい旅行を作成"` → `t('trip.create.title')`
- フォームラベル: すべてのラベル（目的地、出発日、帰宅日、タイトル、説明、公開設定）
- プレースホルダー: すべてのプレースホルダー
- エラーメッセージ: 日付エラー、バリデーションエラー
- ボタン: キャンセル、作成中、旅行を作成
- 状態メッセージ: 画像取得中、画像取得完了
- 公開設定: ラベルと説明文
- バリデーション: `alert()`メッセージ（目的地必須、出発日必須、帰宅日必須）

### テスト

- [x] 英語表示で正常に動作することを確認
- [x] 日本語表示で正常に動作することを確認
- [x] すべてのフォーム要素が適切に表示されることを確認
- [x] バリデーションメッセージが適切に表示されることを確認

---

## 🔗 関連ファイル

- `components/common/CreateTripDialog.tsx` - 旅行作成ダイアログコンポーネント
- `lib/i18n/index.ts` - i18n辞書

---

## 📝 参考

- 類似Issue: `checklist-i18n.md` (チェックリスト関連のi18n化)
- 類似Issue: `home-page-components-i18n.md` (ホームページコンポーネントのi18n化)

