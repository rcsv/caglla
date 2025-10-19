# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> バージョニング方針: 本プロジェクトはSemVerに準拠します。詳細は `docs/development/versioning.md` を参照してください。

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