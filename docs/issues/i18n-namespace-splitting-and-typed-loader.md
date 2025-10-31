# Issue: i18n辞書の分割運用（ドメイン別＋型安全＋遅延ロード）

**作成日**: 2025-10-31  
**状態**: 🔴 未解決  
**優先度**: 中  
**関連ファイル**:
- `lib/i18n/index.ts`
- `lib/i18n/storage.ts`
- `lib/i18n/`（新ディレクトリ構成の追加想定）
- 各ページ・コンポーネントの`t()`呼び出し箇所

---

## 📋 概要

現行のi18n辞書（`lib/i18n/index.ts`）が肥大化し、人間の管理限界を超え始めている。ドメイン（ページ/領域）単位のファイル分割と型安全なキー管理、ページ単位の遅延ロードを導入して、運用コスト・可読性・ビルド負荷を改善する。

---

## 🐛 現状の問題

1. 単一巨大辞書での管理コスト上昇（衝突・重複・レビュー負荷）
2. 型安全の担保が難しく、キーのタイポや片言語だけ存在などの検出が困難
3. すべての辞書を常時読み込むため、初回ロードやビルド時の効率が悪い

---

## 💡 提案（方針）

### 1) ディレクトリ分割（ドメイン/名前空間）
- 例:
  - `lib/i18n/locales/en/{common,home,profile,trips,components,errors}.json`
  - `lib/i18n/locales/ja/{common,home,profile,trips,components,errors}.json`
- 横断文言は`common`へ、ページ固有は各namespaceへ配置
- 参照は `t('profile.title')` のように `namespace.key` 形式

### 2) 型安全（キーの型生成）
- 生成スクリプトで「全言語のキー集合」を統合し `TranslationKey` を自動生成
- 片言語のみ存在するキーはCIで検出（差分チェック）
- `t(key: TranslationKey, lang?: SupportedLanguage)` で型安全を維持

### 3) 遅延ロード（必要namespaceのみ）
- ページ/レイアウトで `loadNamespaces(['common','profile'])` のように宣言
- Next.jsのdynamic importで該当JSONだけ読み込む（SSR/CSR両対応）
- 未ロードのキーは `common→英語` の順にフォールバック＋ログで検知

---

## 🔧 実装ステップ（段階導入案）

### Phase 1（最小導入）
- `home`/`profile`/`common`の3分割から開始
- `lib/i18n/index.ts`に簡易ローダーを実装（同期JSON importでも可）
- コード中のキーを `namespace.key` に順次置換

### Phase 2（型＆ローダー強化）
- 生成スクリプトで`TranslationKey`自動生成
- `loadNamespaces`のユーティリティ化（SSR/CSR両対応）
- CIに「キー欠落/未使用検出」を追加

### Phase 3（全面適用）
- 全ページ・コンポーネントのキーをnamespace化
- 既存の巨大辞書を廃止し、分割辞書へ完全移行

---

## ✅ 受け入れ条件
- [ ] `home`/`profile`/`common`の3分割が導入され、表示に影響なし
- [ ] `t()`は`TranslationKey`で型安全化（コンパイル時にキー誤り検出）
- [ ] ページで必要namespaceのみ読み込む仕組みが提供されている
- [ ] CIで片言語のみのキー・未使用キー検出が作動
- [ ] ドキュメントに運用ルール（命名規則・配置規則）が記載

---

## 📄 ドキュメント/タスク
- ガイド: `docs/specifications/i18n-implementation-checklist.md` に分割運用の章を追記
- スクリプト: `scripts/generate-i18n-types.ts`（キー型生成）
- ルール: ESLintルール/カスタムスクリプトでハードコード日本語検知

---

## 備考
- ICUメッセージが必要な場合は `@formatjs/intl` の採用も検討
- i18nextを利用する場合はnamespace単位のロードをそのまま活用可能
