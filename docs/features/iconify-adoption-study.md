### Iconify 採用検討（代替候補とスタイル適合性）

この文書は、`components/common/icons` にある自作 SVG アイコンを Iconify ベースのアイコンに置き換えられるかを評価した結果です。目的は「同じテイスト（線幅・丸み・24px グリッド・currentColor 運用）」を維持したまま、保守性と網羅性を高めることです。

---

### 結論（サマリ）
- **最有力セット**: Tabler Icons（`tabler:`）/ Lucide（`lucide:`）
  - いずれも 24×24、アウトライン、`stroke-width: 2`、丸端（round cap/join）が基本で、既存ガイドラインと高い適合性。
- **補助セット**: Heroicons（`heroicons-outline:`）
  - 24×24、アウトラインだが既定の線幅が 1.5。全体置換の場合は相対的に軽量に見えるため、混用は避けたい。
- テイストは Tabler/Lucide のどちらでも揃えられる感触。カバレッジと名前のわかりやすさで Tabler を第一候補、Lucide を第二候補とするのが現実的。

---

### 既存スタイル要件とセット特性の一致
- **既存仕様（`AGENTS.md`）**
  - 24×24 ViewBox、アウトライン、`strokeWidth=2`、`strokeLinecap="round"` `strokeLinejoin="round"`、色は `currentColor`
- **Tabler**
  - 24×24、stroke 2、round、currentColor 前提。線質・密度が安定。交通/旅行ドメインの語彙も比較的豊富。
- **Lucide**
  - 24×24、stroke 2、round、Feather 由来でミニマル。抽象的 UI アイコンが揃い、汎用度高。
- **Heroicons（outline）**
  - 24×24、stroke 1.5、round。全置換時に細身に見えやすく、既存の 2px 前提 UI に混在させると不揃い感が出やすい。

---

### 代替マッピング（代表案）
下記は `components/common/icons` の各アイコンに対する Iconify 候補名です。左が第一候補（Tabler）、右が第二候補（Lucide）。

- AirplaneIcon: `tabler:plane` / `lucide:plane`
- TrainIcon: `tabler:train` / `lucide:train`
- HotelIcon: `tabler:bed` / `lucide:bed`
- DiningIcon: `tabler:fork-knife` / `lucide:utensils`
- ShoppingIcon: `tabler:shopping-bag` / `lucide:shopping-bag`
- BackpackIcon: `tabler:backpack` / `lucide:backpack`
- BookmarkIcon: `tabler:bookmark` / `lucide:bookmark`
- CalendarIcon: `tabler:calendar` / `lucide:calendar`
- ChartIcon: `tabler:chart-bar` / `lucide:bar-chart-3`
- PieChartIcon: `tabler:chart-pie` / `lucide:pie-chart`
- ClipboardIcon: `tabler:clipboard-list` / `lucide:clipboard-list`
- ClockIcon: `tabler:clock` / `lucide:clock`
- CloseIcon: `tabler:x` / `lucide:x`
- CloudIcon: `tabler:cloud` / `lucide:cloud`
- ExpandIcon: `tabler:chevron-down` / `lucide:chevron-down`
- CollapseIcon: `tabler:chevron-up` / `lucide:chevron-up`
- LightBulbIcon: `tabler:bulb` / `lucide:lightbulb`
- LocationIcon: `tabler:map-pin` / `lucide:map-pin`
- MailIcon: `tabler:mail` / `lucide:mail`
- MenuIcon: `tabler:menu` / `lucide:menu`
- MoneyIcon: `tabler:coins`（用途により `tabler:currency-yen` も可） / `lucide:coins`
- PieChartIcon: 既出
- PinIcon: `tabler:pin` / `lucide:pin`
- PlannerIcon: `tabler:clipboard-text` / `lucide:clipboard-list`
- ProhibitionIcon: `tabler:ban` / `lucide:ban`
- PublicAccessBadge: `tabler:world` / `lucide:globe`
- RocketIcon: `tabler:rocket` / `lucide:rocket`
- SearchIcon: `tabler:search` / `lucide:search`
- SummaryIcon: `tabler:list-details` / `lucide:list`
- UserIcon: `tabler:user` / `lucide:user`
- WarningIcon: `tabler:alert-triangle` / `lucide:alert-triangle`

補足:
- 金額表現は通貨依存のため、価格 UI 周辺では `tabler:currency-yen`（日本ローカル）/ `tabler:currency-dollar` などへ差し替え判断。
- `PublicAccessBadge` が「バッジ＋地球」の複合表現なら、単独アイコン（world/globe）で足りるか UI で再確認。

---

### テイスト検証（差分と対処）
- 同線幅: Tabler/Lucide は既定 2px で一致。既存と違和感なし。
- 当たり判定/余白: 個別アイコンで内側パディング差がある場合、`className` 側の `w/h` で調整可能。必要なら `viewBox` 依存の CSS 調整を検討。
- 線端・角: いずれも round 前提。稀に個別アイコンが square の場合は別候補を選択。
- 色: `currentColor` で統一できるため既存のカラールールに追従可。

---

### 導入方針（PoC 案）
インストールはこの文書の合意後に進める。置換の互換層として薄いラッパーを用意し、既存 `className`/`color` API を温存する。

```tsx
// 提案: Iconify ラッパ（新規）
import { Icon } from '@iconify/react'

interface UnifiedIconProps {
  icon: string // 例: 'tabler:train'
  className?: string // 例: 'w-4 h-4'
  color?: string // 例: '#3b82f6'（未指定は currentColor）
}

export function UnifiedIcon({ icon, className = 'w-4 h-4', color }: UnifiedIconProps) {
  return (
    <Icon icon={icon} className={className} color={color} />
  )
}
```

`IconRenderer` 互換（名前→Iconify 名へのマップ）

```tsx
const iconMap: Record<string, string> = {
  train: 'tabler:train',
  shopping: 'tabler:shopping-bag',
  dining: 'tabler:fork-knife',
  hotel: 'tabler:bed',
  search: 'tabler:search',
  airplane: 'tabler:plane',
}

// 既存の呼び出し側は iconName を渡すだけで動作
```

---

### リスクと回避
- 既存 SVG の細かな形状差による UI の微妙なズレ
  - 対処: 主要画面で A/B 比較し、必要箇所のみ `w/h` 微調整。
- 一部アイコンの語彙差（例: Planner/Summary 等）
  - 対処: 名称ではなく「意味」で選定。候補を上記から選び UI で最終確認。
- ライセンス
  - Tabler/Lucide は OSS ライセンス（MIT 系）。Iconify 経由利用も一般に商用可。念のため各セットの LICENSE を最終確認。

---

### 次アクション（同じテイストの手応え確認）
1) `@iconify/react` の導入と PoC ラッパ作成（別 PR）
2) 代表 3 点差し替え（例: `TrainIcon`/`SearchIcon`/`WarningIcon`）で UI 並びを確認
3) 問題なければマッピング拡充 → 既存 SVG コンポーネントを段階置換

---

最終更新: 2025-10-18
作成: 開発チーム（調査担当）


