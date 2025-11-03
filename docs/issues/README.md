# Issues List

このディレクトリには、Caglla Travel Managerで発見された問題や機能要望のIssueを管理しています。

---

## 📋 Issue一覧

### 🔴 高優先度

| Issue | 状態 | 作成日 |
|-------|------|--------|
| [ビルドの動作確認が必要](build-verification-needed.md) | ✅ 確認済み | 2025-11-01 |
| [言語切り替えのフォールバック処理による問題](language-switching-fallback-issue.md) | 解決済み | 2025-11-01 |
| [旅行日程文字列のi18n化とライブラリ統一](trip-date-string-i18n-unification.md) | 未解決 | 2025-10-31 |

### 🟡 中優先度

| Issue | 状態 | 作成日 |
|-------|------|--------|
| [プロフィールページでPrivate Tripsが表示されない](profile-private-trips-not-displaying.md) | 未解決 | 2025-10-31 |
| [/home/page.tsxで使用しているコンポーネントがi18n化されていない](home-page-components-i18n.md) | 解決済み | 2025-10-31 |
| [プロフィールページで編集画面にならないと表示言語の選択ができない](profile-language-selector-visibility.md) | 解決済み | 2025-11-01 |
| [Checklistの再生成ボタンが動作しない](trip-slug-checklist-regenerate-not-working.md) | 解決済み | 2025-10-31 |
| [i18n辞書の分割運用（ドメイン別＋型安全＋遅延ロード）](i18n-namespace-splitting-and-typed-loader.md) | 未解決 | 2025-10-31 |
| [/memories ページでの警告・エラーの多発](memories-page-warnings.md) | 未解決 | 2025-10-31 |
| [TripCardで国旗の表示が不安定（出る/出ない）](tripcard-country-flag-inconsistency.md) | 解決済み | 2025-10-31 |
| [Itinerary Cardの通貨推測（Venue→通貨）が弱い](itinerary-currency-inference-weak.md) | 未解決 | 2025-10-31 |
| [Itinerary Cardの予約ボタン/表示に視覚的フィードバックがない](itinerary-card-reservation-visual-feedback.md) | 解決済み | 2025-10-31 |
| [Itinerary Cardの画像解像度がplaces_cacheの画像より低い](itinerary-card-image-resolution-low.md) | 未解決 | 2025-10-31 |
| [Weather Forecast APIが過去の日付でエラーを返す](weather-api-past-date-error.md) | 解決済み | 2025-11-01 |
| [ルート最適化ボタンを押しても順序が変化しない](route-optimization-no-order-change.md) | 未解決 | 2025-10-31 |
| [POIクリック時に地図が元位置へ戻ってしまいPOIDialogと不一致](map-poi-dialog-focus-conflict.md) | 未解決 | 2025-10-31 |
| [地図上のItineraryマーカークリック時にメインコンテンツのCardまで自動スクロール](map-marker-click-scroll-to-card.md) | 未解決 | 2025-10-31 |
| [Feature(Backlog): POIDialogへの外部POI API統合（TripAdvisor / Foursquare）](poi-dialog-external-apis-backlog.md) | 未実装 | 2025-10-31 |
| [チェックリスト関連コンポーネントのi18n化](checklist-i18n-missing.md) | 未解決 | 2025-10-31 |
| [左メニューのSummaryセクションでtitleとsubtitleが重複表示される](navigation-menu-duplicate-subtitle.md) | 解決済み | 2025-11-01 |
| [天気予報の解析結果を英語に修正する](weather-forecast-i18n.md) | 未解決 | 2025-11-01 |
| [気温表記方法・距離単位の設定項目機能](temperature-distance-unit-settings.md) | 未解決 | 2025-11-01 |
| [予約情報表示が日本語ハードコード](reservation-display-i18n.md) | 解決済み | 2025-11-01 |
| [旅行費用表示が日本語ハードコード](travel-cost-display-i18n.md) | 部分的解決 | 2025-11-01 |
| [Activity Analysis表示が日本語ハードコード](activity-analysis-display-i18n.md) | 解決済み | 2025-11-01 |
| [総移動距離表示が日本語ハードコード](distance-display-i18n.md) | 解決済み | 2025-11-01 |
| [アクティビティカテゴリーのラベルが日本語ハードコード](activity-categories-i18n.md) | 未解決 | 2025-11-01 |
| [予約カテゴリー（ReservationType/ReservationSite）のラベルが日本語ハードコード](reservation-categories-i18n.md) | 解決済み | 2025-11-01 |
| [Checklist関連の日本語ハードコード](checklist-i18n.md) | 解決済み | 2025-11-01 |
| [CreateTripDialogの日本語ハードコード](create-trip-dialog-i18n.md) | 解決済み | 2025-11-01 |
| [PDF Preview機能の通常機能化](pdf-preview-promote-to-normal-feature.md) | 未解決 | 2025-11-01 |
| [言語設定保存後にAutoに戻る問題](language-settings-save-reverts-to-auto.md) | 解決済み | 2025-11-01 |

### Feature要望

| Issue | 状態 | 作成日 |
|-------|------|--------|
| [Feature: マイ・チェックリスト機能](feature-my-checklist.md) | 未実装 | 2025-10-31 |
| [Feature: プロフィールページにアクティビティタグ統計を表示](profile-activity-tag-statistics.md) | 未実装 | 2025-10-31 |
| [Feature: 旅行費用サマリーにItinerary明細を表示](feature-trip-cost-itemized-breakdown.md) | 未実装 | 2025-10-31 |
| [Feature: マイ・チェックリスト共有機能](feature-checklist-sharing.md) | 未実装 | 2025-10-31 |

### ✅ 解決済み

| Issue | 解決日 |
|-------|--------|
| [[userSlug]/[tripSlug]/page.tsxのボタンテイストが一致していない](trip-slug-page-button-styling-inconsistent.md) | 2025-10-31 |
| [Headerのユーザー名横に言語選択状態を示す国旗アイコンを表示](header-language-flag-indicator.md) | 2025-10-31 |
| [Cagllaロゴアイコンの再デザイン](logo-icon-redesign.md) | 2025-10-31 |
| [左メニューのSummaryセクションでtitleとsubtitleが重複表示される](navigation-menu-duplicate-subtitle.md) | 2025-11-01 |
| [予約情報表示が日本語ハードコード](reservation-display-i18n.md) | 2025-11-01 |
| [Activity Analysis表示が日本語ハードコード](activity-analysis-display-i18n.md) | 2025-11-01 |
| [総移動距離表示が日本語ハードコード](distance-display-i18n.md) | 2025-11-01 |
| [旅行費用表示が日本語ハードコード（メッセージ・ラベル）](travel-cost-display-i18n.md) | 2025-11-01 |
| [ビルドの動作確認](build-verification-needed.md) | 2025-11-01 |
| [Weather Forecast API過去日付エラー](weather-api-past-date-error.md) | 2025-11-01 |
| [言語設定保存時のAutoに戻る問題](language-settings-save-reverts-to-auto.md) | 2025-11-01 |
| [言語切り替えのフォールバック処理による問題](language-switching-fallback-issue.md) | 2025-11-01 |
| [/home/page.tsxのコンポーネントi18n化](home-page-components-i18n.md) | 2025-10-31 |
| [プロフィールページの言語選択表示](profile-language-selector-visibility.md) | 2025-11-01 |
| [Checklistの再生成ボタンが動作しない](trip-slug-checklist-regenerate-not-working.md) | 2025-11-01 |
| [TripCardで国旗の表示が不安定（出る/出ない）](tripcard-country-flag-inconsistency.md) | 2025-11-01 |

### 🟡 部分的解決

| Issue | 状態 |
|-------|------|
| [旅行費用表示が日本語ハードコード（通貨名は未対応）](travel-cost-display-i18n.md) | 通貨名のi18n化は未対応 |

---

## 📊 統計

- **総Issue数**: 40件
- **未解決**: 10件
- **確認済み**: 1件
- **部分的解決**: 2件
- **解決済み**: 20件
- **未実装（Feature）**: 4件
- **高優先度**: 1件（残り2件は確認済み/部分的解決）
- **中優先度**: 27件
- **Feature要望**: 4件

## ✅ 進捗サマリー（2025-11-01）

本日の対応完了:
- ✅ 高優先度Issueを3件解決（言語設定、ビルド確認、フォールバック問題）
- ✅ 6件のi18n化実装（Activity Analysis、総移動距離、予約情報、旅行費用、Summaryセクション、home-pageコンポーネント）
- ✅ Weather Forecast API過去日付エラー修正
- ✅ プロフィールページの言語選択表示対応
- ✅ ビルド確認完了（ビルド成功、型エラー36件残存）

残りの主要Issue:
- 🔴 天気予報のi18n化（約50のi18nキー追加が必要、大規模、一時保留）
- 🔴 アクティビティカテゴリーのi18n化（約160のi18nキー追加が必要、大規模）
- 🔴 予約カテゴリーのi18n化（大規模）
- 🔴 チェックリストのi18n化（約50-60のi18nキー追加が必要、大規模）
- 🔴 通貨名のi18n化（大規模）
- 🔴 旅行日程文字列のi18n化とライブラリ統一（一時中断）

**進捗**: 総Issue数39件のうち16件解決済み（約41%完了）

本日の対応完了:
- ✅ Checklist再生成ボタンの修正
- ✅ TripCardの国旗表示問題修正（根本原因: /api/tripsでのdestination_place解決処理を追加）

本日の対応失敗:
- ❌ Private Tripsの表示問題（難易度をアップして継続調査が必要）

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
   - 天気予報、予約情報、旅行費用、総移動距離、Activity Analysisのi18n化
   - アクティビティカテゴリー、予約カテゴリーのi18n化
   - チェックリスト関連のi18n化
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

