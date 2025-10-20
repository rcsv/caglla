# Google Calendar連携機能 仕様書

**対象バージョン**: v1.12.0  
**作成日**: 2025-10-20  
**ステータス**: 設計中

---

## 📌 エグゼクティブサマリー

### 概要
Google Calendar APIを利用して、Cagllaの旅程をGoogleカレンダーに同期し、既存のカレンダーイベントと統合する双方向連携機能。

### 目的
- 旅程をカレンダーで一元管理
- スマホのカレンダーアプリで旅程確認
- 既存の予定との重複チェック
- リマインダー・通知の活用

### 主要機能
- **Caglla → Calendar**: 旅程をカレンダーイベントとして自動エクスポート
- **Calendar → Caglla**: カレンダーの予定を旅程にインポート
- **双方向同期**: 変更を自動で相互反映
- **スマート提案**: カレンダーから旅行期間を自動検出

---

## 🎯 ユーザーストーリー

### ストーリー1: 旅程のカレンダー同期
1. ユーザーがCagllaで旅程を作成
2. 「カレンダーに追加」ボタンをクリック
3. Googleカレンダーに旅程が自動追加される
4. スマホのカレンダーアプリで旅程を確認できる

### ストーリー2: カレンダーからインポート
1. ユーザーがGoogleカレンダーに「東京出張」という予定を作成
2. Cagllaで「カレンダーから取り込み」をクリック
3. 「東京出張」が旅行候補として表示される
4. ワンクリックで新規旅行として作成

### ストーリー3: 双方向同期
1. Cagllaで旅程の時間を変更
2. 自動でGoogleカレンダーのイベントも更新される
3. 逆に、カレンダーで時間変更した場合もCagllaに反映される

---

## 🏗️ 技術スタック

### Google API
- **Google Calendar API v3**: カレンダーイベント操作
- **OAuth 2.0**: Google認証

### Firebase
- **Firestore**: 同期状態管理
- **Cloud Functions**: Webhook受信・バックグラウンド同期
- **Authentication**: ユーザー認証

### その他
- **Push Notifications**: カレンダー変更通知（Google Calendar Push Notifications）

---

## 📊 データモデル

### 1. Calendar連携設定（Firestoreコレクション: `users/{userId}/calendar_settings`）

```typescript
interface CalendarSettings {
  userId: string
  isEnabled: boolean
  
  // OAuth
  accessToken: string // 暗号化保存
  refreshToken: string // 暗号化保存
  tokenExpiresAt: number
  
  // 同期設定
  syncDirection: 'one-way-export' | 'one-way-import' | 'two-way'
  syncCalendarId: string // 'primary' or カスタムカレンダーID
  syncEnabled: boolean
  autoSync: boolean // 変更時自動同期
  
  // 通知設定
  notificationEnabled: boolean
  reminderMinutesBefore: number[] // [1440, 60, 15] = 1日前、1時間前、15分前
  
  // Webhook
  webhookChannelId?: string
  webhookResourceId?: string
  webhookExpiresAt?: number
  
  // 同期履歴
  lastSyncTimestamp: number
  lastSyncStatus: 'success' | 'error'
  lastErrorMessage?: string
  
  createdAt: number
  updatedAt: number
}
```

### 2. カレンダー同期マッピング（Firestoreコレクション: `users/{userId}/calendar_mappings`）

```typescript
interface CalendarMapping {
  id: string // カスタムID: `${tripId}_${itineraryId || 'trip'}`
  userId: string
  
  // Caglla側
  tripId: string
  tripSlug: string
  itineraryId?: string // nullの場合は旅行全体
  
  // Google Calendar側
  calendarEventId: string
  calendarId: string
  
  // 同期メタデータ
  lastSyncedAt: number
  lastModifiedAt: number
  lastModifiedBy: 'caglla' | 'calendar' | 'manual'
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error'
  conflictData?: {
    cagllaData: any
    calendarData: any
  }
  
  createdAt: number
  updatedAt: number
}
```

### 3. カレンダーイベント（Google Calendar API形式）

```typescript
interface CalendarEvent {
  id: string
  summary: string // タイトル
  description?: string // 説明
  location?: string // 場所
  start: {
    dateTime?: string // ISO 8601形式
    date?: string // 終日イベント用
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  reminders?: {
    useDefault: boolean
    overrides?: Array<{
      method: 'email' | 'popup'
      minutes: number
    }>
  }
  colorId?: string // イベントの色
  visibility?: 'default' | 'public' | 'private'
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus?: 'needsAction' | 'accepted' | 'declined' | 'tentative'
  }>
  extendedProperties?: {
    private?: {
      cagllaId?: string // Cagllaの識別子
      cagllaType?: 'trip' | 'itinerary'
    }
  }
}
```

---

## 🔧 API設計

### 1. Calendar連携API

#### `POST /api/calendar/connect`
Google Calendar連携を開始（OAuth認証）

**Request:**
```typescript
{
  redirectUri: string
}
```

**Response:**
```typescript
{
  authUrl: string // Google OAuthのURL
}
```

#### `POST /api/calendar/callback`
OAuth認証後のコールバック処理

**Request:**
```typescript
{
  code: string // OAuth認証コード
  state: string
}
```

**Response:**
```typescript
{
  success: boolean
  message: string
}
```

#### `POST /api/calendar/disconnect`
Calendar連携を解除

**Response:**
```typescript
{
  success: boolean
  message: string
}
```

#### `GET /api/calendar/settings`
Calendar連携設定を取得

**Response:**
```typescript
{
  settings: CalendarSettings
}
```

#### `PATCH /api/calendar/settings`
Calendar連携設定を更新

**Request:**
```typescript
{
  syncDirection?: 'one-way-export' | 'one-way-import' | 'two-way'
  syncCalendarId?: string
  autoSync?: boolean
  notificationEnabled?: boolean
  reminderMinutesBefore?: number[]
}
```

---

### 2. 同期API

#### `POST /api/calendar/sync/export-trip`
旅行をカレンダーにエクスポート

**Request:**
```typescript
{
  tripId: string
  includeItineraries: boolean // 個別旅程も同期するか
  calendarId?: string // 指定しない場合はプライマリカレンダー
}
```

**Response:**
```typescript
{
  success: boolean
  tripEventId: string
  itineraryEventIds: string[]
  mappings: CalendarMapping[]
}
```

#### `POST /api/calendar/sync/import-events`
カレンダーイベントを旅行としてインポート

**Request:**
```typescript
{
  calendarId?: string
  startDate: string // ISO 8601
  endDate: string // ISO 8601
  query?: string // 検索キーワード
}
```

**Response:**
```typescript
{
  success: boolean
  events: Array<{
    eventId: string
    summary: string
    start: string
    end: string
    location?: string
    description?: string
  }>
}
```

#### `POST /api/calendar/sync/create-trip-from-event`
カレンダーイベントから旅行を作成

**Request:**
```typescript
{
  eventId: string
  calendarId: string
}
```

**Response:**
```typescript
{
  success: boolean
  tripId: string
  tripSlug: string
  mapping: CalendarMapping
}
```

#### `POST /api/calendar/sync/manual-sync`
手動同期実行

**Response:**
```typescript
{
  success: boolean
  syncedCount: number
  conflicts: CalendarMapping[]
}
```

#### `POST /api/calendar/sync/resolve-conflict`
同期競合の解決

**Request:**
```typescript
{
  mappingId: string
  resolution: 'use-caglla' | 'use-calendar' | 'merge'
  mergedData?: any // resolution='merge'の場合
}
```

**Response:**
```typescript
{
  success: boolean
  mapping: CalendarMapping
}
```

---

### 3. Webhook API

#### `POST /api/calendar/webhook`
Google Calendarからの変更通知を受信

**Request (Google Calendar Push Notification):**
```typescript
{
  'X-Goog-Channel-ID': string
  'X-Goog-Resource-State': 'sync' | 'exists' | 'not_exists'
  'X-Goog-Resource-ID': string
  'X-Goog-Message-Number': string
}
```

**Response:**
```typescript
{
  success: boolean
}
```

---

## 🔄 同期ロジック

### 同期方向

#### 1. **One-Way Export（Caglla → Calendar）**
- Cagllaでの変更のみをカレンダーに反映
- カレンダー側で変更しても無視（上書きされる）
- **用途**: カレンダーを「読み取り専用ビュー」として使用

#### 2. **One-Way Import（Calendar → Caglla）**
- カレンダーの予定を定期的にCagllaに取り込み
- Caglla側で変更してもカレンダーに反映されない
- **用途**: 既存カレンダーからの初期データ移行

#### 3. **Two-Way Sync（双方向同期）**
- 両方向の変更を相互に反映
- 競合検出・解決機能あり
- **用途**: 完全な同期環境（推奨）

---

### 同期タイミング

#### 自動同期
- **Caglla側の変更時**: リアルタイム同期（debounce 3秒）
- **Calendar側の変更時**: Webhook通知 → 即座に同期
- **定期同期**: 1時間ごと（Cloud Scheduler）

#### 手動同期
- ユーザーが「今すぐ同期」ボタンをクリック

---

### 競合解決戦略

#### 競合検出
- **最終更新時刻を比較**: `lastModifiedAt`
- **変更内容をハッシュ化**: 実質的な変更があるか判定

#### 解決オプション
1. **最新を優先**: 最後に変更した方を採用
2. **Cagllaを優先**: Cagllaのデータで上書き
3. **Calendarを優先**: Calendarのデータで上書き
4. **手動解決**: ユーザーに選択させる

#### 競合UI
```tsx
<ConflictDialog>
  <DialogHeader>同期の競合が発生しました</DialogHeader>
  
  <DialogBody>
    <ComparisonTable>
      <thead>
        <tr>
          <th>項目</th>
          <th>Caglla</th>
          <th>Googleカレンダー</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>タイトル</td>
          <td>{cagllaData.title}</td>
          <td>{calendarData.summary}</td>
        </tr>
        <tr>
          <td>開始時刻</td>
          <td>{cagllaData.startTime}</td>
          <td>{calendarData.start.dateTime}</td>
        </tr>
      </tbody>
    </ComparisonTable>
  </DialogBody>
  
  <DialogFooter>
    <Button onClick={() => resolve('use-caglla')}>Cagllaを採用</Button>
    <Button onClick={() => resolve('use-calendar')}>カレンダーを採用</Button>
    <Button onClick={() => resolve('merge')}>手動でマージ</Button>
  </DialogFooter>
</ConflictDialog>
```

---

## 🎨 イベント変換ロジック

### Caglla → Googleカレンダー

#### 旅行全体
```typescript
function tripToCalendarEvent(trip: Trip): CalendarEvent {
  return {
    summary: `🌍 ${trip.title}`,
    description: generateTripDescription(trip),
    location: trip.countries.join(', '),
    start: {
      date: trip.startDate, // 終日イベント
      timeZone: trip.timezone || 'Asia/Tokyo'
    },
    end: {
      date: trip.endDate,
      timeZone: trip.timezone || 'Asia/Tokyo'
    },
    colorId: '9', // ブルー（旅行カラー）
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 1440 }, // 1日前
        { method: 'popup', minutes: 60 }    // 1時間前
      ]
    },
    extendedProperties: {
      private: {
        cagllaId: trip.id,
        cagllaType: 'trip'
      }
    }
  }
}
```

#### 個別旅程
```typescript
function itineraryToCalendarEvent(itinerary: Itinerary, trip: Trip): CalendarEvent {
  const activityIcon = getActivityIcon(itinerary.activityType)
  
  return {
    summary: `${activityIcon} ${itinerary.title}`,
    description: generateItineraryDescription(itinerary),
    location: itinerary.place?.name || itinerary.vicinity,
    start: {
      dateTime: new Date(itinerary.startTime).toISOString(),
      timeZone: trip.timezone || 'Asia/Tokyo'
    },
    end: {
      dateTime: new Date(itinerary.endTime).toISOString(),
      timeZone: trip.timezone || 'Asia/Tokyo'
    },
    colorId: getColorIdByActivity(itinerary.activityType),
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 15 }
      ]
    },
    extendedProperties: {
      private: {
        cagllaId: itinerary.id,
        cagllaType: 'itinerary'
      }
    }
  }
}
```

### 説明文生成

```typescript
function generateTripDescription(trip: Trip): string {
  const lines = [
    `📅 旅行期間: ${formatDateRange(trip.startDate, trip.endDate)}`,
    `🌏 訪問国: ${trip.countries.join(', ')}`,
    ``,
    `📝 メモ:`,
    trip.memo || 'なし',
    ``,
    `🔗 Cagllaで詳細を見る:`,
    `${getBaseUrl()}/${trip.userSlug}/${trip.slug}`
  ]
  return lines.join('\n')
}

function generateItineraryDescription(itinerary: Itinerary): string {
  const lines = [
    `⏰ 時間: ${formatTime(itinerary.startTime)} - ${formatTime(itinerary.endTime)}`,
    `📍 場所: ${itinerary.place?.name || itinerary.vicinity || '未設定'}`,
  ]
  
  if (itinerary.reservationInfo?.confirmationNumber) {
    lines.push(`🎫 予約番号: ${itinerary.reservationInfo.confirmationNumber}`)
  }
  
  if (itinerary.cost) {
    lines.push(`💰 費用: ${formatCost(itinerary.cost)}`)
  }
  
  if (itinerary.memo) {
    lines.push(``, `📝 メモ:`, itinerary.memo)
  }
  
  lines.push(``, `🔗 Cagllaで詳細を見る:`, getItineraryUrl(itinerary))
  
  return lines.join('\n')
}
```

---

## 💰 コスト試算

### Google Calendar API
- **料金**: 無料（クォータ内）
- **クォータ**: 
  - 1ユーザーあたり100リクエスト/秒
  - 1プロジェクトあたり100,000リクエスト/日
- **予想使用量**: 1ユーザーあたり50リクエスト/日 → 無料枠内で十分

### Firebase
- **Firestore**: 同期マッピング保存 → 微小コスト
- **Cloud Functions**: Webhook処理 → 無料枠内

### 総コスト
- **月額ほぼ0円**（無料枠内）

---

## 📊 プラン別制限

### Season Traveler（無料プラン）
- Calendar連携: ⚠️ 制限付き
- 同期方向: One-Way Export（Caglla → Calendar）のみ
- 自動同期: ❌ 無効（手動のみ）
- 旅程同期: 旅行全体のみ（個別旅程は同期しない）

### Backpacker（月額480円）
- Calendar連携: ✅ 利用可能
- 同期方向: すべて選択可能
- 自動同期: ✅ 有効（1時間ごと）
- 旅程同期: 個別旅程も同期可能

### Globetrotter（月額980円）
- Calendar連携: ✅ フル機能
- 同期方向: すべて選択可能
- 自動同期: ✅ 有効（リアルタイム）
- 旅程同期: 個別旅程も同期可能
- 高度な機能: 複数カレンダー対応、競合解決UI

---

## 🔐 セキュリティ・プライバシー

### OAuth認証
- **スコープ**: `https://www.googleapis.com/auth/calendar`（カレンダー読み書き）
- **トークン管理**: Firebase Admin SDKで暗号化保存
- **アクセス制限**: ユーザー自身のカレンダーのみ

### データ保護
- **トークン暗号化**: AES-256
- **Webhook検証**: Google署名検証
- **アクセスログ**: すべてのAPI呼び出しを記録

### ユーザー制御
- **連携解除**: いつでも連携解除可能
- **データ削除**: 連携解除時にカレンダーイベントも削除（オプション）
- **プライバシー設定**: カレンダーイベントの公開範囲を選択可能

---

## 📱 UI/UX設計

### 1. Calendar連携設定画面

**場所**: ユーザー設定 > 連携サービス > Googleカレンダー

**UI要素**:
```tsx
<CalendarIntegrationPanel>
  {/* 未連携時 */}
  <ConnectButton>
    <Icon name="calendar" />
    Googleカレンダーと連携
  </ConnectButton>
  
  {/* 連携済み */}
  <ConnectedStatus>
    <Icon name="check" color="green" />
    カレンダー連携中
    <DisconnectButton>連携解除</DisconnectButton>
  </ConnectedStatus>
  
  {/* 同期設定 */}
  <SyncSettings>
    <RadioGroup label="同期方向">
      <Radio value="one-way-export">Caglla → カレンダー（一方向）</Radio>
      <Radio value="one-way-import">カレンダー → Caglla（一方向）</Radio>
      <Radio value="two-way">双方向同期</Radio>
    </RadioGroup>
    
    <Select label="同期先カレンダー" value={syncCalendarId}>
      <option value="primary">プライマリカレンダー</option>
      {calendars.map(cal => (
        <option value={cal.id}>{cal.summary}</option>
      ))}
    </Select>
    
    <Toggle label="自動同期" checked={autoSync} />
    <Toggle label="通知を有効化" checked={notificationEnabled} />
    
    <ReminderSettings label="リマインダー">
      <Checkbox value={1440}>1日前</Checkbox>
      <Checkbox value={60}>1時間前</Checkbox>
      <Checkbox value={15}>15分前</Checkbox>
    </ReminderSettings>
  </SyncSettings>
  
  <SyncButton>今すぐ同期</SyncButton>
  <LastSyncTime>最終同期: {lastSyncTimestamp}</LastSyncTime>
</CalendarIntegrationPanel>
```

### 2. 旅行詳細ページの同期ボタン

**場所**: 旅行詳細ページ > ヘッダー

**UI要素**:
```tsx
<TripHeaderActions>
  <CalendarSyncButton onClick={handleExportToCalendar}>
    <Icon name="calendar-plus" />
    カレンダーに追加
  </CalendarSyncButton>
  
  {isSynced && (
    <SyncStatus>
      <Icon name="sync" color="green" />
      カレンダーと同期済み
    </SyncStatus>
  )}
</TripHeaderActions>
```

### 3. カレンダーインポートダイアログ

**UI要素**:
```tsx
<ImportFromCalendarDialog>
  <DialogHeader>カレンダーから取り込み</DialogHeader>
  
  <DialogBody>
    <DateRangePicker
      label="取り込み期間"
      startDate={startDate}
      endDate={endDate}
      onChange={(start, end) => { setStartDate(start); setEndDate(end) }}
    />
    
    <SearchInput
      label="キーワード検索"
      value={query}
      onChange={setQuery}
      placeholder="例: 出張、旅行"
    />
    
    <Button onClick={handleSearch}>検索</Button>
    
    <EventsList>
      {events.map(event => (
        <EventCard key={event.id}>
          <EventInfo>
            <Title>{event.summary}</Title>
            <DateRange>{formatDateRange(event.start, event.end)}</DateRange>
            <Location>{event.location}</Location>
          </EventInfo>
          <ImportButton onClick={() => handleImport(event.id)}>
            取り込む
          </ImportButton>
        </EventCard>
      ))}
    </EventsList>
  </DialogBody>
  
  <DialogFooter>
    <CancelButton>キャンセル</CancelButton>
  </DialogFooter>
</ImportFromCalendarDialog>
```

---

## 🧪 テスト戦略

### 1. ユニットテスト
- イベント変換ロジックのテスト
- 競合検出ロジックのテスト
- トークン暗号化/復号化のテスト

### 2. 統合テスト
- Google Calendar API連携のテスト（OAuth認証フロー）
- 同期処理の一連のフロー
- Webhook受信・処理のテスト

### 3. E2Eテスト
- ユーザーがカレンダー連携を設定
- 旅程をカレンダーにエクスポート
- カレンダー側で変更 → Cagllaに反映確認
- 競合発生 → 解決のフロー

---

## 🚀 実装ステップ

### Phase 1: 基礎実装（2週間）
- [ ] Google Calendar API連携（OAuth認証）
- [ ] カレンダーイベント取得・作成・更新・削除
- [ ] Firestoreスキーマ実装
- [ ] 基本的なAPI実装

### Phase 2: One-Way Export（1週間）
- [ ] 旅行→カレンダーイベント変換ロジック
- [ ] 手動エクスポート機能
- [ ] 自動エクスポート機能

### Phase 3: One-Way Import（1週間）
- [ ] カレンダーイベント検索・取得
- [ ] イベント→旅行変換ロジック
- [ ] インポートUI実装

### Phase 4: Two-Way Sync（2週間）
- [ ] Webhook設定・受信処理
- [ ] 競合検出ロジック
- [ ] 競合解決UI

### Phase 5: UI実装（1週間）
- [ ] カレンダー連携設定画面
- [ ] 旅行詳細ページの同期ボタン
- [ ] インポートダイアログ
- [ ] 競合解決ダイアログ

### Phase 6: テスト・デバッグ（1週間）
- [ ] ユニットテスト作成
- [ ] 統合テスト
- [ ] E2Eテスト

### Phase 7: ドキュメント・リリース（1週間）
- [ ] ユーザーガイド作成
- [ ] API仕様書更新
- [ ] リリースノート作成

**総工数**: 約9週間（2.25ヶ月）

---

## ⚠️ リスク・課題

### 技術的リスク
1. **Webhook遅延**: カレンダー変更通知が遅れる可能性 → 定期同期でバックアップ
2. **競合頻発**: 両方で同時編集すると競合多発 → UIで分かりやすく誘導
3. **タイムゾーン問題**: 異なるタイムゾーンでの時刻ずれ → 厳密な変換処理必須

### ビジネスリスク
1. **ユーザー混乱**: 双方向同期の挙動が分かりにくい → 丁寧なオンボーディング
2. **プライバシー**: カレンダーアクセスへの抵抗感 → 透明性確保・任意機能

---

## 🔄 将来の拡張

### v1.13.0以降
- **Apple Calendar対応**: iCloudカレンダー連携
- **Outlook Calendar対応**: Microsoft 365連携
- **複数カレンダー同期**: カレンダーごとに旅行を振り分け
- **スマートリマインダー**: 天候・交通情報に基づく動的通知
- **共有カレンダー対応**: チーム旅行のカレンダー共有

---

## 📚 参考資料

### 公式ドキュメント
- [Google Calendar API Documentation](https://developers.google.com/calendar/api/v3/reference)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Push Notifications](https://developers.google.com/calendar/api/guides/push)

### 既存実装
- `lib/firebase/auth.ts`: Firebase認証の実装
- `lib/utils/timezone.ts`: タイムゾーン変換ユーティリティ
- `lib/utils/date.ts`: 日付フォーマット

---

**このドキュメントは実装開始前に関係者のレビューを受けてください。**

