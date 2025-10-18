# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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