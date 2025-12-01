# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> バージョニング方針: 本プロジェクトはSemVerに準拠します。詳細は `docs/development/versioning.md` を参照してください。

## [3.1.0] - 2025-12-01

### Added
- iCalendarエクスポート機能の改善
  - すべてのイベントに30分前のアラーム（VALARM）を追加
  - DESCRIPTIONフィールドに旅行タイトルを追加
  - DESCRIPTIONフィールドの末尾に「by Caglla」を表示

### Changed
- iCalendarのPRODIDを`-//rcsv//Caglla Travel Manager//EN`に変更

## [3.0.1] - 2025-11-30

### Added
- Notificationコンポーネント（Success/Warning/Errorタイプ）
- ConfirmDialogコンポーネント（Warning/Info/Dangerタイプ）
- NotificationProviderとuseNotificationフック
- 通知・ダイアログ用アニメーション（slideInFromTop, fadeIn, slideInScale）
- i18nキー追加（unpublishConfirmTitle, unpublishConfirmMessage, unpublishSuccess, unpublishFailed, pdfExportSuccess）

### Changed
- Publish/Unpublish機能の通知を`alert()`からNotificationコンポーネントに置き換え
- Publish/Unpublish確認を`confirm()`からConfirmDialogコンポーネントに置き換え
- PDF Export機能の通知を`alert()`からNotificationコンポーネントに置き換え
- Replicate機能のエラー表示を`alert()`からNotificationコンポーネントに置き換え

### Fixed
- Unpublish APIエンドポイントの404エラーを修正（`/unpublish`から`/publish`（DELETE）に変更）

## [3.0.0] - 2025-01-XX

### Added
- SNS機能（いいね、コメント、フォロー）の追加
- Parallel Routes実装（@timeline, @map, @socialスロット）
- Route Groups導入（(planner), (discover), (profile)）
- フィード機能（公開フィード、トレンドフィード、フォロー中フィード）
- 認証プロバイダーマルチ対応の基盤構築
- Branded Typesによる識別子型システム
- 権限管理システム（`lib/core/permissions.ts`）
- SNS関連型定義（`TripSocialStats`, `TripLike`, `TripComment`, `UserFollow`）
- 新規APIエンドポイント12個（SNS機能関連）
- Firestoreスキーマ拡張（`social_stats`フィールド、新規コレクション3個）

### Changed
- Next.js 15.5.6 / React 19.0.0へアップグレード
- Route Handlerの`params`型を`Promise`型に対応
- `composeMiddleware`で`params: Promise`を自動解決
- 認証システムを`auth_uid`ベースに移行（後方互換性維持）
- Trip詳細ページのレイアウトをParallel Routes構造に変更
- エラーハンドリングの統一（`handleApiError`の使用）

### Fixed
- Next.js 15の`useSearchParams`に`Suspense`バウンダリを追加
- Route Handlerの型安全性向上
- 各種APIエンドポイントでの`handleApiError`インポート漏れを修正
- `Day`型のインポート漏れを修正
- `getUserByAuthUid`の誤用を修正（ドキュメントIDでの直接取得に変更）

### Technical
- Server Components最適化による初期表示の高速化
- Composite Indexesの追加によるクエリ最適化
- テストカバレッジ80%以上を達成
- 型安全性の大幅な向上

## [2.2.0] - 2025-11-12

### Added
- 予約テンプレート保存フローとモーダル改善（エメラルドテーマ統一、テンプレート呼び出し強化）
- 交通系アクティビティタグ（`personal_car` / `parking`）と専用チェックリストルールの追加
- 予約サイトロゴ等のローカルアセットを `/public/imgs` に追加

### Changed
- Next.js 15 / React 19 へアップグレードし、`pnpm-lock.yaml` を更新
- 予約カードレイアウトを2列表示に変更し、アクティビティアイコンを画像右下にオーバーレイ
- `ScheduleCard`・`InlineTimeEditor`・`ReservationInfoModal` など入力系コンポーネントの配色をエメラルドに統一

### Fixed
- `/api/trips/[tripSlug]/checklist/generate` で `tripSlug` 解決と `day_id` ベースの旅程取得を行い、チェックリスト生成失敗を解消
- 旅程カード間のスペース確保やタイムゾーン再設定問題など、旅程表示まわりの不具合を修正

## [1.8.0] - 2025-10-19

### Added
- **バージョニング方針の策定**
  - Semantic Versioning 2.0.0（SemVer）への正式準拠
  - `docs/development/versioning.md` の新規作成
  - Public APIの範囲定義（API Routes、URLスキーマ、Firestoreスキーマ、環境変数）
  - 変更種別の判定基準（MAJOR/MINOR/PATCHの明確化）

- **リリースロードマップの再編**
  - v1.9.0: Places多言語対応（旧v1.7.1計画）
  - v1.10.0: 検索・エクスポート（旧v1.7.3計画）
  - v1.11.0: 通知・共有・テンプレート（旧v1.8.0計画）
  - リリースノート v1.9.0, v1.10.0, v1.11.0 の整備

### Changed
- **`AGENTS.md`**: ロードマップをSemVerに整合
- **`CHANGELOG.md`**: SemVer準拠の注記を追加
- **リリース計画**: 版番号の再編成と整理

### Technical
- **バージョニング基準の確立**
  - MAJOR: 互換破壊（API/URL/保存形式の非互換変更）
  - MINOR: 後方互換のある機能追加・大規模UI刷新（互換維持）
  - PATCH: バグ修正・内部改善（契約不変）

## [1.7.2] - 2024-12-19

### Added
- **航空チケット風デザイン**
  - 飛行機予約にANAチケット風の特別レイアウトを適用
  - 空港コードの強調表示（`text-3xl`サイズ）
  - フライト番号の階層化（`text-2xl`サイズ、青色強調）
  - 飛行機アイコンの中央配置
  - 出発・到着時刻の左右分離表示

- **情報階層の最適化**
  - 左寄せレイアウトの採用（センタリング回避）
  - ラベル付き表示（Flight、Departure、Arrival、Confirmation）
  - 青色の統一（主要情報の視認性向上）

- **住所表示の改善**
  - Google Places APIの`vicinity`フィールド対応
  - フォールバック処理（`formatted_address`の最初の部分を表示）
  - 住所の簡略化（カンマ区切りで最初の要素のみ）

- **企業名表示の改善**
  - 予約サイト名のフッター配置
  - ボタンと企業名の重なり解消
  - 主要予約サイトのロゴ画像対応
  - footnote風デザインの採用

### Changed
- **UI/UX改善**
  - カードサイズの拡大（220px → 280px）
  - 画像高さの調整（24px → 28px）
  - パディングの最適化（より余裕のあるレイアウト）

- **API修正**
  - `itineraries/route.ts`と`insert/route.ts`で`vicinity`フィールドを正しく保存・返却
  - Places Cacheに`vicinity`フィールドを追加
  - 既存データとの互換性を確保

### Technical
- **型定義**
  - `vicinity`フィールドの型安全性確保
  - フォールバック処理の型定義

- **コンポーネント**
  - `TripReservationDisplay`の大幅リファクタリング
  - 予約タイプ別の条件分岐レイアウト
  - レスポンシブデザインの改善

## [1.7.0] - 2024-12-19

### Added
- **予約情報管理機能**
  - Itineraryに予約情報（ReservationInfo）を紐付け可能
  - 予約タイプ: 飛行機、ホテル、レンタカー、食事、その他
  - 飛行機予約: 便名、出発・到着空港、出発・到着日時、航空会社
  - その他予約: 開始・終了日時、確認番号、予約サイト、URL
  - 予約サイトURLのバリデーション（HTTPS必須、許可ドメイン制限）
  - 予約情報のCRUD操作（作成・編集・削除）

- **ReservationInfoModal**
  - 予約情報の入力・編集モーダル
  - 予約タイプ別の入力フィールド
  - 日時入力のUX改善（終了日時は開始日時以降のみ選択可能）
  - Itinerary Cardからの情報継承（予約タイプ、日時）
  - ローカル時刻での表示（UTC問題を解決）

- **TripReservationDisplay**
  - Summaryビューに予約情報一覧を表示
  - 予約タイプ別のグループ化表示
  - Vertical Card風レイアウト（220px幅）
  - 時刻表示ルール（同じ日は時刻のみ、異なる日は日付+時刻）
  - place_cache画像をヘッダー背景に表示
  - Iconifyアイコンによる統一されたUI

- **日付入力UX改善**
  - Trip作成・編集時の帰宅日自動設定
  - 出発日以前の日付選択を無効化
  - ReservationInfoModalでの日時入力改善

### Changed
- **アイコンシステム**
  - 予約カテゴリアイコンをIconify（Tabler）に統一
  - 絵文字からSVGアイコンへの移行
  - UnifiedIconコンポーネントの活用

- **UI/UX改善**
  - 予約カードのホバーエフェクト
  - レスポンシブグリッドレイアウト
  - 情報の階層化と視覚的整理

### Technical
- **型定義**
  - ReservationInfo、ReservationType、ReservationSite型の追加
  - 予約情報のバリデーション関数
  - Firestore用の変換関数

- **API統合**
  - Google Places API写真URL生成
  - 予約情報のCRUD API
  - 画像キャッシュシステムとの連携

- **コンポーネント**
  - ScheduleCardからReservationInfoModal呼び出し
  - TripSummaryViewに予約情報セクション追加
  - プロップドリリングの最適化

## [1.0.0] - 2024-12-01

### Added
- 初期リリース
- 基本的な旅行管理機能
- Firebase認証・Firestore連携
- Google Places API統合
- 旅程管理（Trip、Day、Itinerary）
- アクティビティタグシステム
- 天気予報表示
- 費用管理
- 距離計算
- 統計表示