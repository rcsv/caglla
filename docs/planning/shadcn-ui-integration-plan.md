## shadcn/ui 導入計画（このリポジトリ版）

この文書は、現状の構成（Next.js App Router / Tailwind CSS v4 / 既存 `components/` 大規模）に **shadcn/ui** を導入するための段取りと判断ポイントをまとめたものです。

- **狙い**: UIの共通部品（Dialog / Dropdown / Form など）を Radix ベースの堅牢な実装に寄せ、スタイルは Tailwind で統一する
- **前提**: 既存の UI を一気に置換しない（段階導入）
- **要注意**: 現状 `app/globals.css` が独自の色・背景・Z-Index 管理を持つため、shadcn の「CSS変数トークン」との整合が最重要

参考: [shadcn/ui](https://ui.shadcn.com/)

---

## 現状把握（このリポジトリで効いている前提）

- **Next.js**: `next@16.0.7`（App Router）
- **React**: `react@19.2.1`
- **Tailwind**: `tailwindcss@4.1.17`（`app/globals.css` は `@import "tailwindcss";` 方式）
- **アイコン方針**: `components/common/icons/AGENTS.md`（`currentColor` / 24px / stroke 2 / round cap&join）
- **アイコン実装の現実**: `@iconify/react` は導入済み。Lucide/Tabler の適合調査も `docs/features/iconify-adoption-study.md` に存在
- **Z-index**: `app/globals.css` の CSS 変数＆クラスで一元管理（`z-[9999]` などの乱用を避ける方針）

---

## 主要な設計判断（先に決める）

### 1) 生成物の配置
shadcn/ui はコンポーネントを“コピペ管理”する思想なので、置き場所を固定します。

- **UIコンポーネント置き場**: `components/ui/*`
- **ユーティリティ（`cn`）置き場**: `lib/utils.ts`
  - このリポジトリには `lib/utils/` ディレクトリがあるため、shadcn 既定の `lib/utils.ts`（ファイル）と混同しないよう注意

### 2) ダークモード戦略
現状は `@media (prefers-color-scheme: dark)` が存在し、`dark:` 変種は **Tailwind の既定（media）** で動かせます。

- **推奨（影響小）**: Tailwind の `darkMode` は `media` のまま（= 既定）
- **将来の選択肢**: テーマ切替（`class` + `next-themes`）にしたい場合は別途フェーズを切る

### 3) アイコン戦略（Lucide をどう扱うか）
shadcn/ui は標準で `lucide-react` を使いがちですが、当リポジトリは既に **自作SVG/Iconify** の運用があるため、次のいずれかに寄せます。

- **A: shadcn 部品内だけ lucide-react を許可**（最短）
- **B: shadcn 部品から lucide を排し、既存の `components/common/icons` / Iconify に置換**（方針整合が高い）

段階導入を考えると、最初は A で進めて、主要画面で UI が固まったら B を検討するのが安全です。

---

## 導入の段取り（フェーズ方式）

### フェーズ0: 事前チェック（導入前に“割れ”を潰す）
- `pnpm install`
- `pnpm lint`
- `pnpm test`
- 可能なら `pnpm build` まで通して現状のベースラインを確認

目的: shadcn 導入による差分で壊れたのか、元から壊れていたのかを切り分ける。

### フェーズ1: shadcn CLI で初期化（生成物の最小導入）
1. CLI 実行（pnpm 想定）

```bash
pnpm dlx shadcn@latest init
```

2. 対話設定の目安（このリポジトリ向け）
- **framework**: Next.js
- **tsx**: yes
- **rsc**: yes（App Router 前提）
- **tailwind config**: `tailwind.config.ts`
- **global css**: `app/globals.css`
- **components dir**: `components/ui`
- **utils**: `lib/utils.ts`
- **alias**: `@/*`（既に `tsconfig.json` で設定済み）

成果物（想定）
- `components.json`
- `lib/utils.ts`（`cn` 実装など）
- `components/ui/*`（※この段階ではまだ空でも良い）
- Tailwind/グローバルCSSへの追記（環境により内容が変わる）

### フェーズ2: CSSトークンの整合（ここが一番重要）
shadcn/ui は以下のような CSS 変数（例: `--background`, `--foreground`, `--primary` など）を前提にします。

このリポジトリでは `tailwind.config.ts` が既に `background: "var(--background)"` などを定義している一方、`app/globals.css` に `--background` が未定義です。

やること（方針）
- `app/globals.css` の `:root` に **shadcn のトークン一式**を追加
- 既存の
  - `--foreground-rgb` / `--background-*-rgb`
  - Z-index 変数と `.zidx-*` クラス
  - 既存のボタン・フォームの `@layer components`
  を壊さない

注意点
- 既存の `body { background: linear-gradient(...) }` は shadcn の `bg-background` と競合し得るため、
  - 「ページ単位で背景を決める」方針に寄せるか
  - `body` 背景を shadcn のトークン参照に寄せるか
  をどこかで統一する（段階導入なら当面は現状維持でも可）

### フェーズ3: Tailwind 設定の最小追加
shadcn コンポーネントを追加していくと以下が必要になりがちです。

- 依存パッケージ（コンポーネント追加時に自動導入される想定）
  - `tailwindcss-animate`
  - `class-variance-authority`
  - `clsx`, `tailwind-merge`
  - `@radix-ui/react-*`（追加した部品に応じて）
  - `lucide-react`（アイコン方針 A の場合）

- `tailwind.config.ts`
  - `plugins` に `tailwindcss-animate`（必要になった時点で）
  - `content` は既に `app/` `components/` を含むため基本OK

### フェーズ4: 最小コンポーネントの追加（PoC）
まずはアプリ全体の“横断利用”が多く、置換効果が大きいものから入れます。

推奨の初手セット
- `button`
- `input`
- `dialog`
- `dropdown-menu`

追加例（イメージ）

```bash
pnpm dlx shadcn@latest add button input dialog dropdown-menu
```

確認観点
- 既存画面で CSS が崩れない（特に `z-index`、`body` 背景、フォームの見た目）
- ビルドが通る（RSC/Client 境界の警告が増えない）
- アイコン（lucide）が方針と衝突しない

### フェーズ5: 既存UIの段階置換（“作業単位”を決めて進める）
置換の単位は「ページ」ではなく「UIパターン」がおすすめです。

例
- 全モーダルを `Dialog` に寄せる
- 全ドロップダウン/メニューを `DropdownMenu` に寄せる
- ボタンのバリアントを `cva` に寄せる（既存 `.btn-*` と共存させるかは要検討）

置換時のルール案
- 既存の `zidx-*` クラスを優先（Radix の Portal 要素に z-index が必要なら、`globals.css` 側のクラスを適用）
- アイコンは既存の `components/common/icons` を第一候補（統一感・i18n方針と整合）

---

## リスクと回避策

- **CSSの競合（最重要）**
  - 回避: まずトークン導入（フェーズ2）だけを入れて、主要画面を目視確認してからコンポーネント追加

- **`lib/utils` のパス衝突**
  - 回避: shadcn の utils は `lib/utils.ts`（ファイル）に固定し、既存の `lib/utils/*` はそのまま維持

- **アイコン方針のブレ**
  - 回避: “当面はA（shadcn内のみlucide許可）”など、運用ルールを明文化しておく

- **フォーマッタ差（Biome と shadcn 生成コード）**
  - 回避: 生成後に Biome/ESLint の自動整形をかける前提で進める（差分は増えるが一度揃える）

---

## 完了条件（最低ライン）

- `components.json` が追加され、`components/ui` と `lib/utils.ts` が導入済み
- `button/dialog/dropdown-menu` の追加ができ、少なくとも1箇所で利用して動作確認できる
- `pnpm lint` と `pnpm test` が通る（可能なら `pnpm build` も）

---

## 次にやると良いこと（導入後の運用）

- `components/ui` の利用ルール（どこまで shadcn を許可するか、既存コンポーネントの扱い）を `docs/` に追記
- 重要画面（Planner系）から、モーダル/ドロップダウンの置換を優先して UX と保守性を改善
