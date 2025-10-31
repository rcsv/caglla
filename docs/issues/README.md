# Issues List

このディレクトリには、Caglla Travel Managerで発見された問題や機能要望のIssueを管理しています。

---

## 📋 Issue一覧

### 🔴 高優先度

| Issue | 状態 | 作成日 |
|-------|------|--------|
| [ビルドの動作確認が必要](build-verification-needed.md) | 未解決 | 2025-10-31 |
| [言語切り替えのフォールバック処理による問題](language-switching-fallback-issue.md) | 未解決 | 2025-10-31 |
| [旅行日程文字列のi18n化とライブラリ統一](trip-date-string-i18n-unification.md) | 未解決 | 2025-10-31 |

### 🟡 中優先度

| Issue | 状態 | 作成日 |
|-------|------|--------|
| [プロフィールページでPrivate Tripsが表示されない](profile-private-trips-not-displaying.md) | 未解決 | 2025-10-31 |
| [/home/page.tsxで使用しているコンポーネントがi18n化されていない](home-page-components-i18n.md) | 未解決 | 2025-10-31 |
| [HeaderのDev Toolsをデバッグ時のみ表示に](header-dev-tools-visibility.md) | 未解決 | 2025-10-31 |
| [Checklistの再生成ボタンが動作しない](trip-slug-checklist-regenerate-not-working.md) | 未解決 | 2025-10-31 |
| [Feature: マイ・チェックリスト機能](feature-my-checklist.md) | 未実装 | 2025-10-31 |
| [LandingFooter の Products 欄にトップへ戻るリンクを追加](landing-footer-products-home-link.md) | 未解決 | 2025-10-31 |
| [i18n辞書の分割運用（ドメイン別＋型安全＋遅延ロード）](i18n-namespace-splitting-and-typed-loader.md) | 未解決 | 2025-10-31 |
| [/memories ページでの警告・エラーの多発](memories-page-warnings.md) | 未解決 | 2025-10-31 |
| [TripCardで国旗の表示が不安定（出る/出ない）](tripcard-country-flag-inconsistency.md) | 未解決 | 2025-10-31 |
| [Itinerary Cardの通貨推測（Venue→通貨）が弱い](itinerary-currency-inference-weak.md) | 未解決 | 2025-10-31 |
| [ルート最適化ボタンを押しても順序が変化しない](route-optimization-no-order-change.md) | 未解決 | 2025-10-31 |
| [POIクリック時に地図が元位置へ戻ってしまいPOIDialogと不一致](map-poi-dialog-focus-conflict.md) | 未解決 | 2025-10-31 |
| [地図上のItineraryマーカークリック時にメインコンテンツのCardまで自動スクロール](map-marker-click-scroll-to-card.md) | 未解決 | 2025-10-31 |
| [Feature(Backlog): POIDialogへの外部POI API統合（TripAdvisor / Foursquare）](poi-dialog-external-apis-backlog.md) | 未実装 | 2025-10-31 |
| [Feature: プロフィールページにアクティビティタグ統計を表示](profile-activity-tag-statistics.md) | 未実装 | 2025-10-31 |

### 🟢 低優先度

| Issue | 状態 | 作成日 |
|-------|------|--------|
| [プロフィールページにFooterがない](profile-footer-missing.md) | 未解決 | 2025-10-31 |
| [Feature: マイ・チェックリスト共有機能](feature-checklist-sharing.md) | 未実装 | 2025-10-31 |
| [[userSlug]/[tripSlug]/page.tsxのボタンテイストが一致していない](trip-slug-page-button-styling-inconsistent.md) | 未解決 | 2025-10-31 |
| [Headerのユーザー名横に言語選択状態を示す国旗アイコンを表示](header-language-flag-indicator.md) | 未解決 | 2025-10-31 |

---

## 📊 統計

- **総Issue数**: 21件
- **未解決**: 17件
- **未実装（Feature）**: 4件
- **高優先度**: 3件
- **中優先度**: 14件
- **低優先度**: 4件

---

## 🎯 解決の方向性

### 段階的アプローチ
1. **ビルド確認とリグレッション防止**（最優先）
   - ビルドエラーの確認・修正
   - コンポーネントの動作確認

2. **言語切り替え問題の解決**（高優先度）
   - ユーザー体験に直接影響
   - プロフィール設定の優先順位を明確化

3. **i18n化の完了**（中優先度）
   - ホームページのコンポーネントi18n化
   - 一貫した多言語対応

4. **機能追加**（中・低優先度）
   - マイ・チェックリスト機能
   - UIの統一

---

## 📝 Issue管理のルール

### 状態管理
- 🔴 **未解決** / **未実装**: 問題が存在する、または機能が未実装
- 🟡 **調査中**: 原因調査・実装検討中
- 🟢 **修正中**: 対応中
- ✅ **解決済み**: 問題が解決、または機能が実装済み

### 優先度の基準
- **高**: ビルドエラー、ユーザー体験への重大な影響、セキュリティ問題
- **中**: 機能の欠如、UIの不統一、影響範囲が限定的
- **低**: デザインの統一、将来の改善、影響が少ない

### Issue作成時の注意
- 問題の詳細な説明
- 再現手順（可能であれば）
- 期待される動作
- 関連ファイルの特定
- 解決方針の検討

---

## 🔗 関連ドキュメント

- [開発ガイドライン](../development/)
- [リファクタリング計画](../refactoring/)
- [仕様書](../specifications/)

