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

推奨ディレクトリ構成（例）:

```text
lib/i18n/
  index.ts                // t(), getDictionary(), 言語判定（最小限のみ）
  loader.ts               // 名前空間ローダ（同期/非同期両対応）
  locales/
    en/
      common.json
      trips.json
      checklist.json
      weather.json
      reservation.json
      components/
        loading.json
        tripCard.json
        tripHeroSection.json
    ja/
      common.json
      trips.json
      checklist.json
      weather.json
      reservation.json
      components/
        loading.json
        tripCard.json
        tripHeroSection.json
```

### 2) 型安全（キーの型生成）
- 生成スクリプトで「全言語のキー集合」を統合し `TranslationKey` を自動生成
- 片言語のみ存在するキーはCIで検出（差分チェック）
- `t(key: TranslationKey, lang?: SupportedLanguage)` で型安全を維持

具体策:
- `scripts/generate-i18n-types.ts` で `locales/**/*.json` を走査し、`namespace.path.key` のユニオン型を生成
- `git diff --name-only` を使った変更差分に対する高速チェックをCIで実施
- 未翻訳キーはビルドを落とさずに警告（PR時に必須チェック）

### 3) 遅延ロード（必要namespaceのみ）
- ページ/レイアウトで `loadNamespaces(['common','profile'])` のように宣言
- Next.jsのdynamic importで該当JSONだけ読み込む（SSR/CSR両対応）
- 未ロードのキーは `common→英語` の順にフォールバック＋ログで検知

API案（擬似コード）:

```ts
// lib/i18n/loader.ts
export async function loadNamespaces(namespaces: string[], lang: SupportedLanguage) {
  const dicts = await Promise.all(namespaces.map(ns => import(`./locales/${lang}/${ns}.json`)));
  return Object.assign({}, ...dicts);
}

export function mergeDictionaries(...dicts: Array<Record<string, string>>) {
  return Object.assign({}, ...dicts);
}
```

使用例（App Routerの`layout.tsx`／サーバー側）:

```ts
const dict = await loadNamespaces(['common','trips','components/loading'], currentLang)
// Providerへ供給して `t()` が参照
```

---

## 🔧 実装ステップ（段階導入案）

### Phase 1（最小導入）
- `home`/`profile`/`common`の3分割から開始
- `lib/i18n/index.ts`に簡易ローダーを実装（同期JSON importでも可）
- コード中のキーを `namespace.key` に順次置換

追加で行うこと（現状の肥大化対応の即効策）:
- `weather`, `reservation`, `checklist`, `trips`, `components/loading` を先行分割（差分が大きい領域）
- 既存巨大ファイルから該当セクションを切り出し、`index.ts` 側で暫定マージ（後にloaderへ移行）

### Phase 2（型＆ローダー強化）
- 生成スクリプトで`TranslationKey`自動生成
- `loadNamespaces`のユーティリティ化（SSR/CSR両対応）
- CIに「キー欠落/未使用検出」を追加

この段階でのAPI変更:
- `t(key)` は内部で現在の`namespace→dict`テーブルを見る。未ロード時は`common`→英語にフォールバックし、`logger.warn`を出す。
- 置換が必要なメッセージ（`{name}` 等）は、現行は `.replace()` を推奨。将来的にICU対応を検討。

### Phase 3（全面適用）
- 全ページ・コンポーネントのキーをnamespace化
- 既存の巨大辞書を廃止し、分割辞書へ完全移行

運用ポリシー:
- 新規キーは必ず`namespace.key`で追加。`common`は横断再利用のみ。
- 名前衝突回避のため、コンポーネント直下は `components/<ComponentName>.json` に格納。
- 大量キー（例: アクティビティカテゴリ ~160）は専用`activity-categories.json`に分離。

---

## ✅ 受け入れ条件
- [ ] `home`/`profile`/`common`の3分割が導入され、表示に影響なし
- [ ] `t()`は`TranslationKey`で型安全化（コンパイル時にキー誤り検出）
- [ ] ページで必要namespaceのみ読み込む仕組みが提供されている
- [ ] CIで片言語のみのキー・未使用キー検出が作動
- [ ] ドキュメントに運用ルール（命名規則・配置規則）が記載

追加の受け入れ条件（パフォーマンス/ビルド）:
- [ ] 主要ページの初回バンドルから不要辞書が除外される（Bundle Analyzerで確認）
- [ ] SSR/CSR双方で言語切替後も正しく辞書が適用される
- [ ] 既存ページでの回帰がない（主要導線E2E通過）

---

## 📄 ドキュメント/タスク
- ガイド: `docs/specifications/i18n-implementation-checklist.md` に分割運用の章を追記
- スクリプト: `scripts/generate-i18n-types.ts`（キー型生成）
- ルール: ESLintルール/カスタムスクリプトでハードコード日本語検知

追加タスク:
- `docs/specifications/i18n-specification.md` に「namespace運用・命名・フォールバック」の規約を追記
- `scripts/verify-i18n-coverage.ts` を追加し、言語間のキー整合性レポートを出力
- `pnpm i18n:types` と `pnpm i18n:verify` スクリプトを`package.json`へ追加

---

## 備考
- ICUメッセージが必要な場合は `@formatjs/intl` の採用も検討
- i18nextを利用する場合はnamespace単位のロードをそのまま活用可能

補足（今回の背景と影響予測）:
- 現在 `lib/i18n/index.ts` は約2000行。英独西追加で急拡大が見込まれるため、分割と遅延ロードは必須。
- 分割によりレビュー粒度が小さくなり、翻訳差分レビューが容易に。
- 型生成によりキーの取りこぼし/タイポをビルド前に検出可能。
