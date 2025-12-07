# i18n辞書の分割と型の自動生成システム、Gemini API無効化

## 概要

i18n辞書のメンテナンス性を向上させるため、辞書ファイルの分割と型の自動生成システムを実装しました。また、無料枠の制限によりGemini APIを一時的に無効化し、longDescriptionはi18nキーから取得する方式に変更しました。

## 主な変更内容

### 1. i18n辞書の分割

- `lib/i18n/en.ts` (2,144行) を `lib/i18n/en/` ディレクトリに分割
  - `en/index.ts`: その他のキー（約1,660行）
  - `en/checklist.ts`: checklist関連のキー（484個、約500行）
- ファイルサイズを削減し、メンテナンス性を向上

### 2. 型の自動生成システムの実装

- **問題**: `lib/i18n/types.ts`に手動管理のUnion型が1,838行もあり、メンテナンスが困難
- **解決**: 型の自動生成システムを実装
  - `lib/i18n/types-utils.ts`に`FlattenKeys`型ユーティリティを追加
  - `TranslationKey`型を辞書オブジェクトから自動生成
  - 手動管理の1,838行のUnion型を削除
  - 新規キー追加時に型が自動的に更新される

### 3. i18n変数置換の修正

- `{count}`形式の変数置換に対応（従来は`{{variable}}`形式のみ対応）
- `ChecklistItem`型に`variables`フィールドを追加
- `checklist-generator.ts`で`count`と`duration`を`variables`として保存
- `resolveChecklistItemText`で変数を`t()`に渡すように修正

### 4. checklist-rulesファイルとの整合性確保

- checklist-rulesファイルから使用されているi18nキーを抽出（1,012個）
- 不足していた622個のキーを`en/checklist.ts`に追加（TODOプレースホルダー付き）
- すべてのchecklist-rulesファイルのキーがi18nに登録されていることを確認

### 5. Gemini APIの一時的な無効化

- 無料枠の制限により、Gemini APIによるlongDescription生成を一時的に無効化
- longDescriptionはi18nキーから取得する方式に変更
- Gemini関連のコードはコメントアウトして将来の再活用に備える
- 来月以降、旅行の説明などのサポート機能で再活用予定

## 技術的な詳細

### 型の自動生成

```typescript
// lib/i18n/types-utils.ts
export type FlattenKeys<T, P extends string = ""> = 
  T extends string ? P : 
  T extends object ? {
    [K in keyof T]: K extends string
      ? FlattenKeys<T[K], `${P}${P extends "" ? "" : "."}${K}`>
      : never;
  }[keyof T] : P;

// lib/i18n/types.ts
export type TranslationKey = FlattenKeys<typeof en>;
```

### 変数置換の対応

```typescript
// 単一波括弧 {count} と二重波括弧 {{variable}} の両方に対応
translation = translation.replace(
  new RegExp(`\\{${escapedKey}\\}`, "g"),
  String(varValue),
);
translation = translation.replace(
  new RegExp(`\\{\\{${escapedKey}\\}\\}`, "g"),
  String(varValue),
);
```

## 影響範囲

- ✅ 既存のコードとの互換性を維持
- ✅ 型安全性を向上（自動生成により型の不整合を防止）
- ✅ ビルドエラーなし（`pnpm build`成功）
- ✅ デプロイ可能な状態

## テスト

- [x] `pnpm build`が成功することを確認
- [x] checklist-rulesファイルのすべてのキーがi18nに登録されていることを確認
- [x] 型の自動生成が正しく動作することを確認

## 今後の予定

- [ ] Gemini APIを再活用（来月以降、旅行の説明などのサポート機能）
- [ ] 他の言語ファイル（`ja.ts`など）も同様に分割を検討
- [ ] 不足しているlongDescriptionの翻訳を追加

## 関連コミット

- `refactor: i18n辞書の分割と型の自動生成システムを実装`
- `fix: i18n変数置換の修正 - {count}形式に対応`
- `chore: Gemini APIを一時的に無効化、shopping.tsをコミット、en.ts.backupをdocsに移動`
- `fix: checklist-i18n.tsのvariables重複定義を修正`

