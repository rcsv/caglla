## アイコン移行計画（Emoji → SVG）

目的: 国旗（例: `getCountryFlag()`）を除く、UIに表示されるカラフルな絵文字アイコンを、`/components/common/icons/` 配下の再利用可能な SVG に置き換える。アイコンは多言語対応と一貫性のため、単色SVGを基本とする。

更新対象外: 国旗（`lib/utils/country-flags.ts` 経由）

最終更新日: 2025-10-17

---

### 1) 既存SVGアイコン（再利用候補）

- `BookmarkIcon.tsx`
- `CalendarIcon.tsx`
- `ClockIcon.tsx`
- `CloseIcon.tsx`
- `CloudIcon.tsx`
- `CollapseIcon.tsx`
- `ExpandIcon.tsx`
- `LocationIcon.tsx`
- `MenuIcon.tsx`
- `MoneyIcon.tsx`
- `PieChartIcon.tsx`
- `PinIcon.tsx`
- `PlannerIcon.tsx`
- `PublicAccessBadge.tsx`（内部に lock/unlock のSVG含む）
- `SummaryIcon.tsx`


---

### 2) アイコン使用箇所のリストアップ（UIに表示される絵文字のみ／抜粋）

アプリUI（実ユーザー表示）
- `app/[userSlug]/page.tsx`
  - 空状態: ✈️（公開旅行なし）
  - プロフィール情報: 📍（住所）、📧（メール）、⚠️（注意）、👋（初回バナー）、👨/👩/👤（性別）
- `components/tripcard/NextTripCard.tsx`
  - ヒーロー: ✈️（大きめ表示）
- `components/tripcard/TripCard.tsx`
  - メタ情報: 📅（日付）
- `components/trip/TripItineraryView.tsx`
  - セクション見出し: 📅（大きめ表示）
- `components/trip/TripChecklistView.tsx`
  - セクション見出し: ✈️ 行動系準備, 🎒 パッキング系
- `components/modals/POIDialog.tsx`
  - ボタン `leftIcon`: 📞, 🌐, 🗺️
  - 出典表示: 🗺️（google）, 📍（foursquare）
- `app/page.tsx`
  - ヒーロー: 🗺️（大きめ表示）
- `app/subscription/page.tsx`
  - セクション見出し: 🗺️, 🚀
- `components/gonnause/PremiumFeature.tsx`
  - 強調アイコン: 🚀

データ定義（UIに伝播する可能性が高い）
- `lib/data/activity-categories.ts`
  - 多数のカテゴリー `icon: '…'` に絵文字（例: ✈️, 🚆, 🚌, 🚗, ⛴️, 🍽️, ☕, 🍺, 🍷, 🍜, 🏨, ⛺, 🏖️, 🏛️, 🎒, 🧳 など）
  - 使用箇所（例）: `components/trip/ActivityTagSelector.tsx`, `components/stats/ActivityStatsDisplay.tsx`

ドキュメント／ログ（対象外）
- `README.md`、`docs/**`、`scripts/**`、`logger.debug()` などは、UIの置換対象外


---

### 3) 用途別の層別（どこで、どう使うか）

- ナビゲーション／ヘッダー／バッジ
  - 既に SVG（`PlannerIcon`, `PublicAccessBadge` など）を使用。新規絵文字はなし。
- ヒーロー／空状態／大きめ見出し
  - 例: ✈️, 🗺️ を大きく表示して強調（`NextTripCard`, `app/page.tsx`, `TripItineraryView` の見出し）
- カード／リストのメタ情報
  - 例: 📅 日付（`TripCard`）
- モーダル／ダイアログ内のボタン・出典ラベル
  - 例: 📞, 🌐, 🗺️, 📍（`POIDialog`）
- チェックリスト／タグ／カテゴリ表示
  - 例: セクション見出し（✈️, 🎒）、カテゴリー `icon`（`activity-categories`）


---

### 4) 置換ポリシーと選定（再利用優先 / 新規必要）

基本方針
- まず既存の `icons/` を再利用（カラーパレットは `currentColor` ベース）
- 既存にないものは単色SVGを追加（`24x24`, `stroke=1.8` 目安、`role="img"`）
- 国旗は現状の `getCountryFlag()` を継続使用

推奨マッピング（抜粋）
- 📅 → `CalendarIcon`
- 🗺️ → `PlannerIcon`（地図表現）
- 📍 → `PinIcon`（ピン）、または用途に応じ `LocationIcon`
- ✈️ → 新規 `AirplaneIcon`（要追加）
- 🚀 → 新規 `RocketIcon`（要追加、マーケ用途）
- 🎒 → 新規 `BackpackIcon`（要追加、パッキング）
- 🏨 → 新規 `HotelIcon`（要追加、宿泊）
- ☕ / 🍺 / 🍷 / 🍜 → 新規 `CafeIcon` / `BeerIcon` / `WineIcon` / `RamenIcon`
- 🚆 / 🚌 / 🚗 / ⛴️ → 新規 `TrainIcon` / `BusIcon` / `CarIcon` / `FerryIcon`
- ⛺ / 🏖️ / 🏛️ → 新規 `TentIcon` / `BeachIcon` / `MuseumIcon`
- 🧳 → 新規 `LuggageIcon`
- 📞 / 🌐 / 📧 / ⚠️ → 新規 `PhoneIcon` / `GlobeIcon` / `MailIcon` / `WarningIcon`
- 👨 / 👩 / 👤 → 新規 `UserIcon`（1種に統一）


---

### 5) 変更対象ファイル（優先度順 / 最小差分での置換）

P1: 既存SVGで確実に置換できる箇所
- `components/tripcard/TripCard.tsx`（📅 → `CalendarIcon`）
- `components/trip/TripItineraryView.tsx`（📅 → `CalendarIcon`）
- `components/modals/POIDialog.tsx`（🗺️/📍 → `PlannerIcon`/`PinIcon`、📞/🌐 → 新規作成まで一時テキスト or 代替SVG）
- `app/page.tsx`（🗺️ → `PlannerIcon`）

P2: 空状態・ヒーローの強調アイコン（新規追加が望ましい）
- `components/tripcard/NextTripCard.tsx`（✈️ → `AirplaneIcon`）
- `app/[userSlug]/page.tsx`（✈️ → `AirplaneIcon`）
- `app/subscription/page.tsx` / `components/gonnause/PremiumFeature.tsx`（🚀 → `RocketIcon`）

P3: プロフィールや注意表示
- `app/[userSlug]/page.tsx`（📍 → `PinIcon`、📧 → `MailIcon`、⚠️ → `WarningIcon`、👨/👩/👤 → `UserIcon`）

P4: チェックリスト/タグ/カテゴリ（段階導入）
- `components/trip/TripChecklistView.tsx`（セクション: ✈️, 🎒 → `AirplaneIcon`, `BackpackIcon`）
- `lib/data/activity-categories.ts`（各カテゴリー `icon` の絵文字 → 単色SVGの型参照へ移行、または `iconName` など文字列ID化）
  - 利用箇所（`ActivityTagSelector`, `ActivityStatsDisplay`）側でSVGを解決するレイヤに切り出し


---

### 6) 実装手順（段階的）

1. P1を一括対応（既存 `CalendarIcon`/`PlannerIcon`/`PinIcon` への置換）
   - Buttonの `leftIcon`/`rightIcon` にSVGノードを渡す
2. 不足アイコンの追加（P2/P3）
   - `AirplaneIcon`, `RocketIcon`, `BackpackIcon`, `HotelIcon`, `PhoneIcon`, `GlobeIcon`, `MailIcon`, `WarningIcon`, `UserIcon` など
3. カテゴリ表示の抽象化（P4）
   - `activity-categories` の `icon` を絵文字から `iconName` に変更
   - `iconName` → コンポーネント解決のマップ（例: `iconRegistry`）を `icons/` で提供
4. UI差分確認 & 回帰テスト
   - 空状態/見出しのサイズ・色が意図通りか
   - コントラスト/可読性/アクセシビリティ（`aria-label`）


---

### 7) リスクと回避策

- 視覚的トーン変化（絵文字→単色）
  - 解決: セクション見出しのサイズや周辺余白で強調を補う
- カテゴリ本数が多く、新規SVGの作成負荷が高い
  - 解決: 高頻度カテゴリから段階導入、残りは汎用 `CategoryIcon` の暫定使用
- 外部データ（レビュー文など）内の絵文字
  - 対象外: ユーザー生成テキストの絵文字は変更しない


---

### 8) 対応チェックリスト（ドラフト）

- [ ] P1: `TripCard` の 📅 を `CalendarIcon` に置換
- [ ] P1: `TripItineraryView` の 📅 を `CalendarIcon` に置換
- [ ] P1: `POIDialog` の 🗺️/📍 を `PlannerIcon`/`PinIcon` に置換
- [ ] P1: `app/page.tsx` の 🗺️ を `PlannerIcon` に置換
- [ ] P2: `NextTripCard` の ✈️ を `AirplaneIcon` 追加後に置換
- [ ] P2: `app/[userSlug]/page.tsx` の ✈️ を `AirplaneIcon` 追加後に置換
- [ ] P2: `subscription`/`PremiumFeature` の 🚀 を `RocketIcon` 追加後に置換
- [ ] P3: `app/[userSlug]/page.tsx` の 📍/📧/⚠️/👨/👩/👤 をSVG化
- [ ] P4: `activity-categories` を絵文字直書きから `iconName` 化
- [ ] P4: カテゴリ用SVG群を順次追加し `iconRegistry` で解決


---

### 9) 備考

- Z-Index 管理は `app/globals.css` の定義クラスを使用（本移行では z-index 値を直書きしない）
- 環境変数アクセスは `lib/env-validation.ts` を通す
- ルーティング/スラッグ生成は既存の `lib/slug-utils.ts` を使用


