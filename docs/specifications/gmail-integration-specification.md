# Gmail連携自動予約抽出機能 仕様書

**対象バージョン**: v1.12.0  
**作成日**: 2025-10-20  
**ステータス**: 設計中

---

## 📌 エグゼクティブサマリー

### 概要
Gmail APIを利用して予約確認メールを自動検出し、予約情報を抽出してCagllaの予約管理システムに自動登録する機能。

### 目的
- ユーザーの手動入力の手間を削減
- 予約情報の正確性向上
- 予約管理の一元化

### 主要機能
- **自動メール検出**: 予約確認メールの自動識別
- **情報抽出**: AI/正規表現による予約情報の自動抽出
- **自動登録**: 抽出した情報を予約管理システムに自動登録
- **確認・編集**: ユーザーによる内容確認と手動編集

---

## 🎯 ユーザーストーリー

### AS-IS（現状）
1. ユーザーは予約サイトで航空券・ホテルを予約
2. 予約確認メールが届く
3. メールの内容を見ながら、手動でCagllaに予約情報を入力
4. 手間がかかり、入力ミスも発生しやすい

### TO-BE（理想）
1. ユーザーは予約サイトで航空券・ホテルを予約
2. 予約確認メールが届く
3. **Cagllaが自動でメールを検出し、予約情報を抽出**
4. **ユーザーは内容を確認してワンクリックで登録**

---

## 🏗️ 技術スタック

### Google API
- **Gmail API**: メール取得・検索
- **OAuth 2.0**: Google認証

### AI/NLP
- **OpenAI GPT-4**: 自然言語処理による情報抽出
- **正規表現**: パターンマッチング（フォールバック）

### Firebase
- **Firestore**: 抽出済み予約情報の一時保存
- **Cloud Functions**: バックグラウンド処理
- **Authentication**: ユーザー認証

---

## 📊 データモデル

### 1. Gmail連携設定（Firestoreコレクション: `users/{userId}/gmail_settings`）

```typescript
interface GmailSettings {
  userId: string
  isEnabled: boolean
  lastSyncTimestamp: number
  syncInterval: 'manual' | 'hourly' | 'daily' | 'weekly'
  autoRegister: boolean // 自動登録ON/OFF
  notificationEnabled: boolean // 新規検出時の通知
  accessToken: string // 暗号化保存
  refreshToken: string // 暗号化保存
  tokenExpiresAt: number
  connectedAt: number
  lastErrorMessage?: string
}
```

### 2. 抽出済み予約情報（Firestoreコレクション: `users/{userId}/extracted_reservations`）

```typescript
interface ExtractedReservation {
  id: string
  userId: string
  emailId: string // Gmail Message ID
  emailSubject: string
  emailFrom: string
  emailDate: number
  extractedAt: number
  status: 'pending' | 'confirmed' | 'rejected' | 'expired'
  confidence: number // 0-100: 抽出精度
  
  // 抽出された予約情報
  reservationData: {
    type: 'flight' | 'hotel' | 'train' | 'car' | 'dining' | 'activity' | 'other'
    confirmationNumber?: string
    bookingSite?: string
    bookingUrl?: string
    
    // 航空券
    flightNumber?: string
    airline?: string
    departureAirport?: string
    arrivalAirport?: string
    departureTime?: number
    arrivalTime?: number
    seatNumber?: string
    
    // ホテル
    hotelName?: string
    checkInDate?: number
    checkOutDate?: number
    roomType?: string
    guestName?: string
    
    // 共通
    totalPrice?: number
    currency?: string
    passengerName?: string
    contactEmail?: string
    contactPhone?: string
    
    // その他
    notes?: string
    attachments?: string[]
  }
  
  // メタデータ
  extractionMethod: 'ai' | 'regex' | 'manual'
  rawEmailBody?: string // デバッグ用
  linkedTripId?: string // 紐付けられた旅行
  linkedItineraryId?: string // 紐付けられた旅程
  
  createdAt: number
  updatedAt: number
}
```

---

## 🔧 API設計

### 1. Gmail連携API

#### `POST /api/gmail/connect`
Gmail連携を開始（OAuth認証）

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

#### `POST /api/gmail/callback`
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

#### `POST /api/gmail/disconnect`
Gmail連携を解除

**Response:**
```typescript
{
  success: boolean
  message: string
}
```

#### `GET /api/gmail/settings`
Gmail連携設定を取得

**Response:**
```typescript
{
  settings: GmailSettings
}
```

#### `PATCH /api/gmail/settings`
Gmail連携設定を更新

**Request:**
```typescript
{
  syncInterval?: 'manual' | 'hourly' | 'daily' | 'weekly'
  autoRegister?: boolean
  notificationEnabled?: boolean
}
```

---

### 2. 予約抽出API

#### `POST /api/gmail/sync`
メールから予約情報を抽出（手動同期）

**Response:**
```typescript
{
  success: boolean
  extractedCount: number
  newReservations: ExtractedReservation[]
}
```

#### `GET /api/gmail/extracted-reservations`
抽出済み予約情報の一覧取得

**Query Parameters:**
- `status`: 'pending' | 'confirmed' | 'rejected' | 'expired'
- `limit`: number
- `offset`: number

**Response:**
```typescript
{
  reservations: ExtractedReservation[]
  total: number
  hasMore: boolean
}
```

#### `POST /api/gmail/extracted-reservations/{id}/confirm`
抽出済み予約を承認・登録

**Request:**
```typescript
{
  tripId: string // 紐付ける旅行ID
  itineraryId?: string // 紐付ける旅程ID（オプション）
  editedData?: Partial<ExtractedReservation['reservationData']> // 編集内容
}
```

**Response:**
```typescript
{
  success: boolean
  reservationId: string // 登録された予約情報のID
}
```

#### `POST /api/gmail/extracted-reservations/{id}/reject`
抽出済み予約を拒否

**Response:**
```typescript
{
  success: boolean
}
```

---

## 🤖 情報抽出ロジック

### 抽出戦略（優先順位順）

#### 1. **パターンベース抽出（正規表現）**
- **対象**: 主要予約サイトの定型メール
- **対応サイト**:
  - 航空券: ANA、JAL、Peach、Jetstar、Skyscanner、Expedia
  - ホテル: Booking.com、Agoda、楽天トラベル、じゃらん
  - 交通: JR東日本、えきねっと、Omio
  - レンタカー: トヨタレンタカー、ニッポンレンタカー
- **メリット**: 高速・低コスト・高精度
- **デメリット**: 新サイト対応に開発コスト

#### 2. **AI抽出（OpenAI GPT-4）**
- **対象**: パターンマッチング失敗時のフォールバック
- **プロンプト例**:
```
以下の予約確認メールから、予約情報を抽出してJSON形式で返してください。

【メール内容】
{emailBody}

【抽出項目】
- type: 予約種別（flight, hotel, train, car, dining, activity, other）
- confirmationNumber: 予約確認番号
- bookingSite: 予約サイト名
- （その他必要項目）

【出力形式】JSON
```

- **メリット**: 柔軟な対応・新サイト自動対応
- **デメリット**: コスト・レスポンス時間

#### 3. **ハイブリッド方式（推奨）**
- パターンマッチングで高速処理
- 失敗時のみAI抽出
- AI抽出結果から新パターン学習（将来）

---

## 🔍 メール検出戦略

### Gmail検索クエリ

```javascript
const searchQueries = [
  // 航空券
  'subject:(予約確認 OR 航空券 OR flight confirmation OR booking confirmed) from:(ana.co.jp OR jal.co.jp OR skyscanner OR expedia)',
  
  // ホテル
  'subject:(宿泊予約 OR hotel confirmation OR reservation confirmed) from:(booking.com OR agoda.com OR rakuten.co.jp OR jalan.net)',
  
  // 交通
  'subject:(乗車券 OR きっぷ OR train ticket) from:(eki-net.com OR jreast.co.jp)',
  
  // レンタカー
  'subject:(レンタカー OR car rental) from:(toyota-rentacar OR nipponrentacar)',
  
  // 汎用
  'subject:(予約確認 OR confirmation OR reservation) newer_than:30d'
]
```

### 検出頻度
- **手動同期**: ユーザーが「同期」ボタンをクリック
- **自動同期**: 設定に基づいて定期実行
  - `hourly`: 1時間ごと（Cloud Scheduler）
  - `daily`: 1日1回（午前8時）
  - `weekly`: 週1回（月曜午前8時）

---

## 🔐 セキュリティ・プライバシー

### 1. OAuth認証
- **Gmail API スコープ**: `https://www.googleapis.com/auth/gmail.readonly`（読み取り専用）
- **トークン管理**: Firebase Admin SDKで暗号化保存
- **アクセス制限**: ユーザー自身のメールのみアクセス

### 2. データ保護
- **メール本文**: 抽出後は保存しない（デバッグ時のみ一時保存、24時間後自動削除）
- **トークン暗号化**: AES-256による暗号化
- **アクセスログ**: すべてのAPI呼び出しをログに記録

### 3. ユーザー制御
- **連携解除**: いつでも連携解除可能
- **データ削除**: 連携解除時に抽出データも削除
- **透明性**: どのメールを処理したか表示

---

## 📱 UI/UX設計

### 1. Gmail連携設定画面

**場所**: ユーザー設定 > 連携サービス > Gmail

**UI要素**:
```tsx
<GmailIntegrationPanel>
  {/* 未連携時 */}
  <ConnectButton>
    <Icon name="gmail" />
    Gmailと連携して予約情報を自動取得
  </ConnectButton>
  
  {/* 連携済み */}
  <ConnectedStatus>
    <Icon name="check" color="green" />
    Gmail連携中: {email}
    <DisconnectButton>連携解除</DisconnectButton>
  </ConnectedStatus>
  
  {/* 設定 */}
  <SyncSettings>
    <Select label="同期頻度" value={syncInterval}>
      <option value="manual">手動のみ</option>
      <option value="hourly">1時間ごと</option>
      <option value="daily">1日1回</option>
      <option value="weekly">週1回</option>
    </Select>
    
    <Toggle label="自動登録" checked={autoRegister} />
    <Toggle label="新規検出時に通知" checked={notificationEnabled} />
  </SyncSettings>
  
  <SyncButton>今すぐ同期</SyncButton>
  <LastSyncTime>最終同期: {lastSyncTimestamp}</LastSyncTime>
</GmailIntegrationPanel>
```

### 2. 抽出済み予約一覧画面

**場所**: 旅行詳細ページ > 予約管理 > Gmail検出予約

**UI要素**:
```tsx
<ExtractedReservationsList>
  {reservations.map(reservation => (
    <ExtractedReservationCard key={reservation.id}>
      {/* ヘッダー */}
      <CardHeader>
        <TypeIcon type={reservation.reservationData.type} />
        <EmailInfo>
          <Subject>{reservation.emailSubject}</Subject>
          <From>{reservation.emailFrom}</From>
          <Date>{formatDate(reservation.emailDate)}</Date>
        </EmailInfo>
        <ConfidenceBadge confidence={reservation.confidence} />
      </CardHeader>
      
      {/* 抽出内容 */}
      <CardBody>
        <ReservationDataDisplay data={reservation.reservationData} />
        <EditButton>編集</EditButton>
      </CardBody>
      
      {/* アクション */}
      <CardFooter>
        <ConfirmButton onClick={() => handleConfirm(reservation.id)}>
          旅行に追加
        </ConfirmButton>
        <RejectButton onClick={() => handleReject(reservation.id)}>
          無視
        </RejectButton>
      </CardFooter>
    </ExtractedReservationCard>
  ))}
</ExtractedReservationsList>
```

### 3. 確認ダイアログ

**UI要素**:
```tsx
<ConfirmReservationDialog>
  <DialogHeader>予約情報を追加</DialogHeader>
  
  <DialogBody>
    <TripSelector label="追加先の旅行" value={tripId} />
    <ItinerarySelector label="追加先の日程" value={itineraryId} optional />
    
    <EditableReservationForm data={editedData} onChange={setEditedData} />
  </DialogBody>
  
  <DialogFooter>
    <CancelButton>キャンセル</CancelButton>
    <ConfirmButton>追加</ConfirmButton>
  </DialogFooter>
</ConfirmReservationDialog>
```

---

## 💰 コスト試算

### Gmail API
- **料金**: 無料（クォータ内）
- **クォータ**: 1日あたり10億リクエスト（十分）

### OpenAI GPT-4
- **料金**: $0.03/1K tokens（入力）、$0.06/1K tokens（出力）
- **予想トークン数**: 1メールあたり500 tokens（入力） + 200 tokens（出力）
- **コスト**: 1メールあたり約$0.027（約4円）
- **月間想定**: 100ユーザー × 10メール = 1000メール → **$27/月（約4,000円）**

### Firestore
- **ストレージ**: 1予約あたり約5KB → 1000予約で5MB（微小）
- **読み取り/書き込み**: 月間10,000回 → 無料枠内

### 総コスト
- **月額約4,000円**（ユーザー100人想定）
- **ユーザー1人あたり約40円/月**

---

## 📊 プラン別制限

### Season Traveler（無料プラン）
- Gmail連携: ❌ 利用不可
- 理由: AIコストが高いため

### Backpacker（月額480円）
- Gmail連携: ⚠️ 制限付き
- 月間抽出上限: **10メール/月**
- 自動同期: 週1回のみ

### Globetrotter（月額980円）
- Gmail連携: ✅ フル機能
- 月間抽出上限: **無制限**
- 自動同期: すべての頻度選択可能

---

## 🧪 テスト戦略

### 1. ユニットテスト
- 正規表現パターンマッチングのテスト
- AI抽出結果のバリデーション
- トークン暗号化/復号化のテスト

### 2. 統合テスト
- Gmail API連携のテスト（OAuth認証フロー）
- メール検出→抽出→登録の一連のフロー
- エラーハンドリング（トークン期限切れ等）

### 3. E2Eテスト
- ユーザーがGmail連携を設定
- 予約確認メールを送信（テスト用メールアドレス）
- 自動検出→抽出→確認→登録の完全フロー

### 4. 手動テスト
- 主要予約サイトの実際のメールでテスト
- 各プランでの制限動作確認

---

## 🚀 実装ステップ

### Phase 1: 基礎実装（2週間）
- [ ] Gmail API連携（OAuth認証）
- [ ] メール検索・取得機能
- [ ] Firestoreスキーマ実装
- [ ] 基本的なAPI実装

### Phase 2: 情報抽出（2週間）
- [ ] 正規表現パターン作成（主要5サイト）
- [ ] OpenAI API統合
- [ ] 抽出ロジック実装
- [ ] 精度検証

### Phase 3: UI実装（1週間）
- [ ] Gmail連携設定画面
- [ ] 抽出済み予約一覧画面
- [ ] 確認・編集ダイアログ
- [ ] 通知UI

### Phase 4: 自動同期（1週間）
- [ ] Cloud Scheduler設定
- [ ] バックグラウンド処理実装
- [ ] エラーハンドリング

### Phase 5: テスト・デバッグ（1週間）
- [ ] ユニットテスト作成
- [ ] 統合テスト
- [ ] 本番環境テスト

### Phase 6: ドキュメント・リリース（1週間）
- [ ] ユーザーガイド作成
- [ ] API仕様書更新
- [ ] リリースノート作成

**総工数**: 約8週間（2ヶ月）

---

## ⚠️ リスク・課題

### 技術的リスク
1. **Gmail API制限**: クォータ超過の可能性 → モニタリング必須
2. **AI抽出精度**: サイトによって精度にばらつき → パターン追加で対応
3. **メールフォーマット変更**: 予約サイトがフォーマット変更 → 定期メンテナンス必須

### ビジネスリスク
1. **AIコスト**: ユーザー増加でコスト増 → プラン制限で抑制
2. **プライバシー懸念**: メール読み取りへの抵抗感 → 透明性確保・任意機能
3. **競合優位性**: 他サービスも同様機能追加の可能性 → 精度で差別化

---

## 🔄 将来の拡張

### v1.13.0以降
- **他メールサービス対応**: Outlook、Yahoo!メール
- **添付ファイル解析**: PDF予約確認書からの抽出
- **学習機能**: ユーザー修正から新パターン学習
- **予約変更検出**: 変更・キャンセルメールの自動反映
- **カレンダー統合**: 抽出した予約をGoogleカレンダーに自動追加

---

## 📚 参考資料

### 公式ドキュメント
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [OpenAI API Documentation](https://platform.openai.com/docs)

### 既存実装
- `lib/firebase/auth.ts`: Firebase認証の実装
- `lib/subscription/plan-limits.ts`: プラン制限チェック
- `components/modals/ReservationInfoModal.tsx`: 予約情報入力UI

---

**このドキュメントは実装開始前に関係者のレビューを受けてください。**

