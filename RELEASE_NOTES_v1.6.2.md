# Release Notes - v1.6.2

**リリース日**: 2025年10月17日

## 📝 概要

v1.6.2では、UI/UXの大幅な改善として絵文字アイコンからSVGアイコンへの移行を実施しました。また、プロフィールページの刷新、国旗表示機能の追加、ドキュメントの充実化を行いました。

---

## ✨ 主な変更点

### 🎨 SVGアイコンシステムの導入

**多言語対応を見据えた大規模なアイコン移行**

- **新しいSVGアイコンコンポーネント追加**
  - ✈️ → `AirplaneIcon`
  - 🎒 → `BackpackIcon`
  - 📊 → `ChartIcon`
  - 📋 → `ClipboardIcon`
  - 🍴 → `DiningIcon`
  - 🏨 → `HotelIcon`
  - 💡 → `LightBulbIcon`
  - 🚫 → `ProhibitionIcon`
  - 🔍 → `SearchIcon`
  - 🛍️ → `ShoppingIcon`
  - 🚂 → `TrainIcon`
  - ⚠️ → `WarningIcon`
  - 🚀 → `RocketIcon`
  - 📧 → `MailIcon`
  - 👤 → `UserIcon`
  - 📅 → `CalendarIcon`
  - 📍 → `PinIcon`

- **アイコン移行を実施したコンポーネント**
  - `TripCard`: 旅行日付表示
  - `TripItineraryView`: 旅程ビュー
  - `TripChecklistView`: チェックリスト
  - `POIDialog`: POI詳細ダイアログ
  - `NextTripCard`: 次の旅行カード
  - `ActivityStatsDisplay`: アクティビティ統計
  - `ActivityTagSelector`: アクティビティタグ選択
  - `PlanLimitsDisplay`: プラン制限表示
  - `StorageUsageDisplay`: ストレージ使用量表示
  - `PremiumFeature`: プレミアム機能表示
  - プロフィールページ
  - サブスクリプションページ
  - トップページ

- **UX改善**
  - 必須フィールドの⚠️絵文字を赤いアスタリスク（*）に変更
  - 警告レベルに応じた色分け（黄色、赤）
  - `currentColor`を使用した一貫したテーマ対応

- **包括的なドキュメント追加**
  - `components/common/icons/AGENTS.md`: SVGアイコンガイドライン
  - デザイン原則、使用パターン、ベストプラクティス
  - アイコン作成テンプレートと絵文字からの移行ガイド
  - メンテナンスとテストのガイドライン

### 👤 プロフィールページの刷新

**スラッグベースルーティングへの移行と機能改善**

- **新しいプロフィールページ**: `/app/[userSlug]/page.tsx`
  - IDベースから`userSlug`ベースのURLに移行
  - 初回セットアップ機能の追加
    - bio（自己紹介）の入力
    - 居住地域の選択（Google Places API統合）
    - 性別の選択
  - プロフィール情報の表示・編集
    - プロフィール画像
    - bio
    - 性別
    - 居住国情報

- **HomeHeaderの改善**
  - プロフィールリンクを追加
  - 各ページから`UserSettingsModal`を削除し、プロフィールページに統合

- **バグ修正**
  - `User`型に`bio`と`gender`フィールドを追加
  - `/api/users` POSTエンドポイントで`bio`と`gender`を正しく処理
  - `adminUserOperations.createOrUpdateUser`で`bio`と`gender`の更新を追加
  - 既存ユーザーの`bio`と`gender`がFirestoreに正しく保存されるように修正

### 🏳️ 国旗表示機能の追加

**視覚的に魅力的な国別情報表示**

- **包括的な国情報マップ**: `lib/utils/country-flags.ts`
  - 200以上の国と地域の情報
  - 国名（日本語・英語）
  - 国コード（ISO 3166-1 alpha-2）
  - Unicode Regional Indicator Symbolsを使用した国旗絵文字生成

- **国旗表示の実装箇所**
  - 国別統計（`CountryStats`, `CountryStatsSimple`）
  - 旅行カード（`TripCard`）
  - 次の旅行マップ（`NextTripMap`）

### 📚 ドキュメントの充実化

**開発者体験の向上**

- **UI設計ガイドライン**: `AGENTS.md`に追加
  - 多言語化対応のためのアイコン優先設計方針
  - SVGアイコンの使用推奨
  - 開発ワークフローのガイドライン

- **アイコン移行計画**: `docs/development/icon-migration-plan.md`
  - 段階的な移行戦略
  - 優先順位付き移行リスト
  - 実装ガイドライン

### 🐛 GitHub Issues対応

**コミュニティ貢献の促進**

- **GitHubイシューテンプレートの追加**
  - バグレポートテンプレート（日本語）
  - 機能リクエストテンプレート
  - 質問テンプレート
  - イシューテンプレート設定ファイル

---

## 🔄 技術的な改善

### アイコンシステム

- **IconRenderer**: 動的アイコン解決システム
- `iconName`フィールドのサポート（アクティビティカテゴリー）
- 既存の絵文字アイコンとの後方互換性維持

### プロフィールシステム

- Google Places API統合による居住地域の自動選択
- Firestore操作の最適化

### 国情報システム

- 統一された国情報管理
- パフォーマンスを考慮した効率的なマッピング

---

## 📦 影響範囲

### 変更されたコンポーネント（18コンポーネント）

- `TripCard`
- `TripItineraryView`
- `TripChecklistView`
- `TripWeatherDisplay`
- `POIDialog`
- `NextTripCard`
- `ActivityStatsDisplay`
- `ActivityTagSelector`
- `PlanLimitsDisplay`
- `StorageUsageDisplay`
- `PremiumFeature`
- `TripEditor`
- `CreateTripDialog`
- `PlaceSearchInput`
- `CountryStats`
- `CountryStatsSimple`
- `NextTripMap`
- プロフィールページ

### 追加されたファイル

- `components/common/icons/` (15の新しいSVGアイコン)
- `components/common/icons/AGENTS.md`
- `lib/utils/country-flags.ts`
- `app/[userSlug]/page.tsx`
- `.github/ISSUE_TEMPLATE/` (3つのテンプレート)

### 削除されたファイル

- `app/user/[id]/page.tsx` (旧プロフィールページ)

---

## 🚀 アップグレードガイド

### 既存ユーザーへの影響

- **プロフィールページURL**: `/user/[id]` → `/[userSlug]`
  - 旧URLから新URLへのリダイレクトは自動的に処理されます
  - `userSlug`が未設定のユーザーは初回アクセス時に設定画面が表示されます

- **見た目の変更**: 絵文字アイコンがSVGアイコンに置き換わります
  - 機能的な変更はありません
  - より洗練された一貫性のあるUIになります

### 開発者向け

- **新しいアイコンを使用する場合**
  ```tsx
  import { AirplaneIcon } from '@/components/common/icons/AirplaneIcon'
  
  <AirplaneIcon className="w-6 h-6 text-blue-500" />
  ```

- **国旗を表示する場合**
  ```typescript
  import { getCountryFlag } from '@/lib/utils/country-flags'
  
  const flag = getCountryFlag('Japan') // 🇯🇵
  ```

- **プロフィールページへのリンク**
  ```tsx
  <Link href={`/${user.slug}`}>プロフィール</Link>
  ```

---

## 🎯 次のバージョンに向けて

### 今後の予定

- 残りの絵文字アイコンのSVG移行
- 多言語化（i18n）の本格導入
- アクセシビリティの更なる改善
- パフォーマンス最適化

---

## 📊 統計

- **コミット数**: 18
- **変更されたファイル**: 40+
- **追加された行**: 2000+
- **削除された行**: 500+

---

## 🙏 謝辞

このリリースは、ユーザーからのフィードバックと、より良いユーザーエクスペリエンスを追求する継続的な努力の結果です。ご利用いただき、ありがとうございます！

---

## 📝 完全な変更履歴

```
1396e20 docs: add SVG icon guidelines documentation
b4ecaf8 refactor: improve trip editing UX and replace remaining emoji icons
f942838 refactor: replace emoji icons with SVG in checklist and warning components
354ceca refactor: replace emoji icons with SVG in activity components
fa583dd feat: add new SVG icon components
4ef5476 refactor: replace emoji icons with SVG components
231b23d ドキュメントチェックイン
d88a9f6 Add question issue template for GitHub
37c91ea Delete .github/ISSUE_TEMPLATE/question.md
2d393b5 Delete .github/ISSUE_TEMPLATE/feature_request.md
2d993d3 Add feature request issue template
033c0e9 Delete .github/ISSUE_TEMPLATE/bug_report.md
40de6a4 Add bug report template in Japanese
a89a8ba Add issue template configuration for GitHub
084c6e1 Update issue templates
342bb1e docs: UI設計ガイドラインをAGENTS.mdに追加
4e2d085 fix: ユーザープロフィールのbioとgenderフィールドの保存を修正
7ad814a feat: プロフィールページを改善しスラッグベースルーティングに移行
ace5732 feat: 国旗表示機能を追加
```

---

**Previous Version**: [v1.6.1](./RELEASE_NOTES_v1.6.1.md)  
**Next Version**: TBD

