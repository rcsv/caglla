# Google Calendar 連携機能

## 🎯 概要

Caglla Travel ManagerとGoogle Calendarを連携し、旅行スケジュールの自動同期とカレンダーからのインポート機能を実現する。旅行計画と日常のスケジュールをシームレスに統合し、より効率的な旅行管理を可能にする。

## 🚀 実装可能な連携機能

### 1. 旅行日程の自動カレンダー同期
**機能**: Caglla上の旅行日程をGoogle Calendarに自動で同期
- 旅行期間を全日イベントとして登録
- 旅行タイトル・説明・場所を自動設定
- カレンダーの色分け（旅行ごとに異なる色）
- リアルタイム同期（編集時に自動更新）

**実装難易度**: ⭐⭐⭐ (中)

**技術要件**:
- Google Calendar API v3
- OAuth 2.0認証（Googleアカウント連携）
- Webhook/リアルタイム同期

### 2. Itineraryの詳細スケジュール同期
**機能**: 各Itineraryを個別のカレンダーイベントとして登録
- 開始時刻・終了時刻の自動設定
- 場所情報（Google Places連携）
- アクティビティタグに基づくカテゴリ設定
- 予約情報（ReservationInfo）の自動追加
- 移動時間の自動計算・表示

**実装難易度**: ⭐⭐⭐⭐ (難)

**技術要件**:
- 時刻データの管理強化
- タイムゾーン対応（旅行先の現地時刻）
- ルート最適化との連携

### 3. カレンダーからの旅行予定インポート
**機能**: Google Calendarの既存イベントをCagllaにインポート
- カレンダーイベントの選択的インポート
- 場所情報の自動認識・Places API連携
- 日程・Itineraryの自動生成
- フライト情報の自動抽出（Gmail連携）

**実装難易度**: ⭐⭐⭐⭐ (難)

**技術要件**:
- Google Calendar API（読み取り）
- Gmail API（フライト情報抽出）
- 自然言語処理（イベント情報の解析）

### 4. リマインダー・通知機能
**機能**: 旅行前・予定前のリマインダー通知
- 出発前の通知（1週間前、3日前、前日）
- Itinerary開始前の通知（1時間前、30分前）
- チェックリスト未完了項目の通知
- 天気予報アラート（悪天候時）
- カレンダーアプリ・メール・プッシュ通知対応

**実装難易度**: ⭐⭐⭐⭐ (難)

**技術要件**:
- Firebase Cloud Messaging（プッシュ通知）
- Cloud Functions（スケジュール実行）
- ユーザー通知設定の管理

### 5. 共同編集者とのカレンダー共有
**機能**: 旅行メンバーとカレンダーを自動共有
- 共同編集者のGoogleアカウントに自動共有
- 閲覧権限・編集権限の管理
- 共有リンクの生成
- カレンダー購読（iCal形式）

**実装難易度**: ⭐⭐⭐ (中)

**技術要件**:
- Google Calendar ACL管理
- iCal形式エクスポート
- 権限管理システムとの連携

### 6. タイムゾーン対応の強化
**機能**: 旅行先のタイムゾーンに対応したカレンダー表示
- 現地時刻での自動表示
- 複数タイムゾーンの並列表示
- 時差の自動計算・表示
- 飛行機移動時のタイムゾーン変更対応

**実装難易度**: ⭐⭐⭐ (中)

**技術要件**:
- 既存のtimezone-utilsの活用
- Google Calendar API（タイムゾーン設定）
- IANA Timezone Database

## 🛠️ 技術実装アプローチ

### 認証・権限管理
```typescript
interface CalendarIntegrationConfig {
  enabled: boolean
  syncMode: 'manual' | 'auto' | 'realtime'
  calendarId: string
  syncItineraries: boolean
  syncReservations: boolean
  reminderSettings: ReminderSettings
}

interface ReminderSettings {
  tripReminders: boolean // 旅行前通知
  itineraryReminders: boolean // Itinerary開始前通知
  checklistReminders: boolean // チェックリスト通知
  weatherAlerts: boolean // 天気予報アラート
  customTimings: number[] // カスタム通知タイミング（分）
}
```

### Google Calendar API連携
```typescript
interface CalendarSyncService {
  // 基本同期
  syncTrip(tripId: string): Promise<void>
  syncItinerary(itineraryId: string): Promise<void>
  
  // インポート
  importFromCalendar(calendarId: string, dateRange: DateRange): Promise<Trip>
  
  // リマインダー
  setReminders(eventId: string, reminders: ReminderSettings): Promise<void>
  
  // 共有
  shareCalendar(calendarId: string, emails: string[]): Promise<void>
}
```

### イベント変換ロジック
```typescript
interface CalendarEvent {
  summary: string // Trip/Itinerary名
  description: string // 詳細情報・予約情報
  location: string // 場所情報（Google Places連携）
  start: DateTime // 開始時刻（タイムゾーン対応）
  end: DateTime // 終了時刻（タイムゾーン対応）
  colorId: string // カラーコード（旅行ごと）
  reminders: Reminder[] // リマインダー設定
  attendees: Attendee[] // 共同編集者
}
```

## 📋 実装優先順位

### Phase 1: 基本同期（中程度）
1. **旅行日程の自動カレンダー同期** ⭐⭐⭐
   - 最も基本的な機能
   - ユーザーが即座に価値を実感できる
   - OAuth認証基盤の構築

**実装時期**: v1.12.0（2025年11月予定）

### Phase 2: 詳細スケジュール（難しい）
2. **Itineraryの詳細スケジュール同期** ⭐⭐⭐⭐
   - 時刻管理機能の強化が必要
   - タイムゾーン対応の実装
   - ルート最適化との統合

**実装時期**: v1.13.0（2025年12月予定）

### Phase 3: 共有機能（中程度）
3. **共同編集者とのカレンダー共有** ⭐⭐⭐
   - 既存の共同編集機能との連携
   - 権限管理の実装

**実装時期**: v1.14.0（2026年1月予定）

### Phase 4: 高度な機能（難しい）
4. **カレンダーからのインポート** ⭐⭐⭐⭐
   - 自然言語処理の実装
   - Gmail API連携（フライト情報）
   
5. **リマインダー・通知機能** ⭐⭐⭐⭐
   - プッシュ通知基盤の構築
   - Cloud Functionsの実装

**実装時期**: v1.15.0以降（2026年2月以降予定）

## 🎨 UI/UX の改善点

### 設定画面
- **Google Calendar連携設定**
  - 連携ON/OFF切り替え
  - 同期モード選択（手動/自動/リアルタイム）
  - 同期対象の選択（旅行全体/Itinerary/予約情報）
  - カレンダー選択（複数カレンダー対応）

### 同期状態の表示
- **同期インジケーター**
  - 最終同期時刻の表示
  - 同期中のローディング表示
  - エラー時の警告表示
  - 手動同期ボタン

### カレンダープレビュー
- **埋め込みカレンダー表示**
  - Trip詳細画面にカレンダービューを追加
  - 月表示・週表示・日表示の切り替え
  - Itineraryのドラッグ&ドロップ編集（カレンダー上）

## 🔧 実装時の注意点

### パフォーマンス
- **API呼び出しの最適化**
  - バッチ処理の活用（複数イベントの一括更新）
  - キャッシュの活用（同期済みイベントの管理）
  - レート制限対策（Google Calendar API: 1,000,000 req/day）

### セキュリティ
- **OAuth認証の管理**
  - アクセストークンの安全な保存
  - リフレッシュトークンの自動更新
  - スコープの最小化（必要な権限のみ）
  - ユーザーによる連携解除機能

### エラーハンドリング
- **同期エラーの処理**
  - ネットワークエラー（リトライ機能）
  - 認証エラー（再認証フロー）
  - API制限エラー（待機・警告）
  - カレンダー削除エラー（孤立イベントの処理）

### データ整合性
- **双方向同期の管理**
  - 競合解決（Caglla vs Calendar）
  - 削除イベントの同期
  - 重複防止（同一イベントの識別）
  - 同期履歴の管理

## 📊 期待される効果

### ユーザビリティ向上
- ✅ 旅行スケジュールと日常スケジュールの統合
- ✅ カレンダーアプリでの旅行予定確認
- ✅ リマインダーによる予定忘れ防止
- ✅ 共同編集者との予定共有が容易

### 機能的価値
- ✅ 旅行計画の可視化
- ✅ タイムゾーン対応による混乱防止
- ✅ 既存カレンダーからのインポートで入力効率化
- ✅ 他のカレンダーアプリとの互換性

### ビジネス価値
- ✅ 有料プラン（Backpacker以上）の魅力向上
- ✅ ユーザーエンゲージメントの向上
- ✅ 競合サービスとの差別化
- ✅ エンタープライズプランの訴求力向上

## 🔗 関連機能との連携

### 既存機能との統合
- **タイムゾーン管理** (`lib/utils/timezone.ts`)
  - 既存のtimezone-utilsを活用
  - 旅行先の現地時刻での表示

- **ルート最適化** (`lib/route-optimization.ts`)
  - 移動時間をカレンダーに反映
  - 最適化されたスケジュールの同期

- **予約情報管理** (`components/modals/ReservationInfoModal.tsx`)
  - 予約情報をカレンダーイベントに追加
  - 予約番号・連絡先の表示

- **チェックリスト** (`components/trip/TripChecklistView.tsx`)
  - チェックリストのリマインダー連携
  - 未完了項目の通知

### サブスクリプションプランとの統合

| プラン | カレンダー連携機能 |
|--------|-------------------|
| Season Traveler (無料) | ❌ カレンダー連携なし |
| Backpacker (¥480/月) | ✅ 基本同期（旅行日程のみ） |
| Globetrotter (¥980/月) | ✅ 詳細同期（Itinerary・予約情報）<br>✅ リマインダー機能<br>✅ カレンダー共有 |
| Planner Pro (¥2,480/月) | ✅ Globetrotterの全機能<br>✅ 顧客カレンダーへの直接同期<br>✅ ブランドカレンダー |
| Enterprise (¥5,000/月) | ✅ Planner Proの全機能<br>✅ API連携（カレンダー自動生成）<br>✅ カスタム同期ルール |

## 🧪 テスト戦略

### 単体テスト
- Google Calendar API連携のモック
- イベント変換ロジックのテスト
- タイムゾーン処理のテスト
- エラーハンドリングのテスト

### 統合テスト
- OAuth認証フローのテスト
- 双方向同期のテスト
- 競合解決のテスト
- API制限対策のテスト

### ユーザーテスト
- β版での限定公開
- フィードバック収集
- A/Bテスト（同期モード）

## 📚 参考資料

### Google APIs
- [Google Calendar API v3](https://developers.google.com/calendar/api/v3/reference)
- [Google Calendar API Quickstart](https://developers.google.com/calendar/api/quickstart)
- [OAuth 2.0 for Client-side Web Apps](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)

### 競合サービスの実装例
- TripIt（カレンダー同期機能）
- Wanderlog（Googleカレンダー連携）
- Roadtrippers（カレンダーエクスポート）

## 🚀 次のステップ

1. **Phase 1の技術調査**
   - Google Calendar API v3の詳細調査
   - OAuth 2.0認証フローの設計
   - 既存のFirebase Authenticationとの統合方法

2. **プロトタイプ作成**
   - 基本的な同期機能のデモ実装
   - UI/UXのモックアップ作成
   - ユーザーフィードバックの収集

3. **Phase 1の実装開始**
   - OAuth認証基盤の構築
   - 旅行日程の自動カレンダー同期
   - 設定画面の実装

4. **段階的機能追加**
   - Phase 2以降の実装
   - ユーザーフィードバックに基づく改善

---

*このドキュメントは、Caglla Travel ManagerのGoogle Calendar連携機能の実装計画をまとめたものです。*

