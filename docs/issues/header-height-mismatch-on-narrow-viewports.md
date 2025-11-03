# Issue: 狭いビューポート時にヘッダーのタイトルエリアとロゴエリアの縦幅が不一致

- 作成日: 2025-11-03
- 状態: 未着手
- 種別: UI/レイアウト
- 優先度: 低〜中（視覚的一貫性）

---

## 現象
スマホ相当の横幅（例: 360–420px）まで縮めると、ヘッダー内で「ロゴ＋ブランド名（左）」と「タイトル/ナビゲーション（右/中央）」の縦方向の高さに差が生じ、上下が揃わないケースがある。

対象と想定コンポーネント:
- `components/common/LandingHeader.tsx`
  - コンテナ: `container mx-auto px-6 py-4`
  - 左側: `<CagllaLogo className="w-8 h-8" /> + <span className="text-xl ...">Caglla</span>`
- `components/common/HomeHeader.tsx`
  - コンテナ: `container mx-auto px-4 py-4`
  - 左側: `<CagllaLogo className="w-8 h-8" /> + appName`
  - 右側: ユーザー名/プラン/アバター（複数行/折り返しの可能性）

原因の可能性:
- 左右ブロックとも`py-4`を使用しているが、右側のテキストが折り返したり`leading`の差で行高が増え、視覚的な高さが不揃いに見える
- ロゴは固定の`h-8`（32px）で、テキストの行高や複数行により実効高さが拡張される
- `items-center`で揃えているが、ブロック全体の`min-height`が未定義で各要素の高さに依存

---

## 計測（Tailwindクラスからの推定）
- ヘッダー全体の上下パディング: `py-4` → 32px（上下合計で64px）
- ロゴ: `h-8` → 32px
- タイトル/ユーザー情報:
  - `text-xl`のline-heightは約1.25 → 20px前後、複数行やサブ行があると40px超える可能性
  - 右側のユーザー名+プランは2行構成かつフォント/line-height差により38〜48px程度に増加し得る

---

## 望ましい仕様
- 狭幅時にもヘッダー行の「視覚的な高さ」を統一し、上下中央揃えを保証
- テキスト折り返し時の高さ増加を吸収できるよう、ブレークポイントに応じた`min-h`の明示

---

## 解決案
1) 共通の最小高さを設定
- ヘッダー行に`min-h-14`（56px）または`min-h-16`（64px）を付与
- 例: `<div className="flex items-center justify-between min-h-14">`

2) テキストの折り返し抑制
- ブランド名/ナビ項目に`whitespace-nowrap`を付与（超狭幅ではテキストが溢れないよう`hidden md:inline`などで非表示）
- 例: `<span className="text-xl font-bold whitespace-nowrap">Caglla</span>`

3) 行間の統一
- タイトル/ユーザー名などに`leading-none`または`leading-tight`を適用し、行間差での高さブレを抑制

4) 極小幅時の簡略化
- `sm`未満でブランド名テキストを非表示（ロゴのみ）、右側の補助行（プラン名など）も`hidden sm:block`に

---

## 具体的提案（最小編集）
- `LandingHeader.tsx`
  - 変更例: `py-4`は維持しつつ、内部の行コンテナに`min-h-14`を付与
  - ブランド名に`whitespace-nowrap leading-none`

- `HomeHeader.tsx`
  - 変更例: ルート行に`min-h-14`, 右側情報ブロックに`leading-tight`、プラン名を`hidden xs:block`（Tailwind構成に合わせて`sm:block`など）

---

## 受け入れ基準
- 360px幅で左右の縦高さが視覚的に一致して見える
- ヘッダー内の要素が上下中央に揃う
- 主要ブレークポイント（sm, md）で崩れがない
- LighthouseのCLSに悪影響を与えない（高さが安定）

---

## 影響範囲
- `components/common/LandingHeader.tsx`
- `components/common/HomeHeader.tsx`
- 付随的に、超狭幅時のナビゲーション表示制御（非表示/折り返し）

---

## 実装見積
- 実装: 30–45分
- 動作確認（モバイルシミュレーター含む）: 15–30分
