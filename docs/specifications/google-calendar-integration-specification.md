# Google Calendar連携機能 仕様書

**対象バージョン**: v1.12.0  
**作成日**: 2025-10-20  
**ステータス**: 設計中（概要のみ）

---

## 📌 エグゼクティブサマリー

### 概要
Google Calendar APIを利用して、Cagllaの旅程をGoogleカレンダーに同期し、既存のカレンダーイベントと統合する双方向連携機能。

### 主要機能
- **Caglla → Calendar**: 旅程を自動エクスポート
- **Calendar → Caglla**: カレンダー予定をインポート
- **双方向同期**: リアルタイム相互反映
- **競合解決**: 自動検出と解決UI

### 同期方向
1. One-Way Export（Caglla → Calendar）
2. One-Way Import（Calendar → Caglla）
3. Two-Way Sync（双方向、推奨）

### 技術スタック
- Google Calendar API v3
- OAuth 2.0
- Push Notifications（Webhook）
- Firestore

### プラン別制限
- **Season Traveler**: One-Way Exportのみ、手動同期のみ
- **Backpacker**: すべての同期方向、1時間ごと自動同期
- **Globetrotter**: フル機能、リアルタイム同期、競合解決UI

### コスト
月額ほぼ0円（無料枠内）

### 実装期間
約9週間（2.25ヶ月）

---

**詳細仕様は実装時に追記予定**
