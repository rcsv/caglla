# データエクスポート機能（CSV/JSON/iCal）

**実装日**: 2025-10-21  
**バージョン**: v1.9.0候補  
**難易度**: 🟢 低

---

## 📋 概要

Trip全体のデータおよび予約情報をCSV/JSON/iCal形式でエクスポートする機能を実装しました。バックアップ、データ分析、カレンダー連携、他ツールとの連携に活用できます。

---

## ✨ 実装した機能

### 1. エクスポート形式
- **JSON形式**: 完全なデータ構造を保持（Trip、Day、Itinerary、予約情報）
- **CSV形式**: Excel等の表計算ソフトで開ける形式
- **iCal形式**: Google Calendar、Apple Calendar等のカレンダーアプリに取り込める形式

### 2. エクスポート種類
- **旅程全体**: Trip全体のデータ（日程、Itinerary、予約情報を含む）
- **予約情報のみ**: 飛行機、ホテル、レンタカー等の予約情報のみ

### 3. ユーザーインターフェース
- **エクスポートボタン**: Tripページのタイトルバーに配置
- **エクスポートモーダル**: データタイプとファイル形式を選択
- **ワンクリックダウンロード**: ブラウザで直接ダウンロード

### 4. iCalendar機能
- **RFC 5545準拠**: 標準仕様に準拠したiCalendar形式
- **イベント情報**: タイトル、説明、場所、日時を含む
- **アラーム機能**: 飛行機・ホテル予約の24時間前に自動通知
- **タイムゾーン対応**: UTC形式での日時管理

---

## 🏗️ 実装内容

### 新規作成ファイル

#### 1. `lib/utils/export-helpers.ts`
エクスポート処理の中核となるユーティリティ関数群：

**主要関数:**
- `exportTripToJson(trip)`: Trip全体をJSON形式で変換
- `exportReservationsToJson(trip)`: 予約情報のみをJSON形式で変換
- `exportTripToItineraryCSV(trip)`: Itinerary一覧をCSV形式で変換
- `exportReservationsToCSV(trip)`: 予約情報をCSV形式で変換
- `exportTripToICal(trip)`: Trip全体をiCal形式で変換
- `exportReservationsToICal(trip)`: 予約情報のみをiCal形式で変換
- `downloadTripAsJson(trip)`: Trip全体をJSON形式でダウンロード
- `downloadTripAsCSV(trip)`: Trip全体をCSV形式でダウンロード
- `downloadTripAsICal(trip)`: Trip全体をiCal形式でダウンロード
- `downloadReservationsAsJson(trip)`: 予約情報をJSON形式でダウンロード
- `downloadReservationsAsCSV(trip)`: 予約情報をCSV形式でダウンロード
- `downloadReservationsAsICal(trip)`: 予約情報をiCal形式でダウンロード

**特徴:**
- CSVエスケープ処理（カンマ、改行、ダブルクォート対応）
- iCalエスケープ処理（RFC 5545準拠）
- Firestoreタイムスタンプの自動変換（ISO 8601形式）
- UTF-8対応

#### 2. `components/modals/ExportDataModal.tsx`
エクスポート設定を選択するモーダルダイアログ：

**機能:**
- データタイプ選択（旅程全体 / 予約情報のみ）
- ファイル形式選択（JSON / CSV / iCal）
- 説明テキスト表示
- エクスポート実行

**UIデザイン:**
- Iconifyアイコン使用
- ラジオボタンによる選択
- ホバー効果
- レスポンシブデザイン

### 修正ファイル

#### 1. `components/planner/FloatingTitleBar.tsx`
- `actions` プロップを追加（追加アクションボタンを表示可能に）

#### 2. `components/trip/TripPageLayout.tsx`
- `titleBarActions` プロップを追加（タイトルバーにカスタムアクションを渡せるように）

#### 3. `app/[userSlug]/[tripSlug]/page.tsx`
- `showExportModal` state追加
- `ExportDataModal` コンポーネント追加
- エクスポートボタン追加（タイトルバー内）

---

## 📦 エクスポートされるデータ

### JSON形式（旅程全体）
```json
{
  "trip": {
    "id": "...",
    "title": "東京旅行",
    "description": "...",
    "start_date": "2025-10-01T00:00:00.000Z",
    "end_date": "2025-10-03T23:59:59.999Z",
    ...
  },
  "days": [
    {
      "id": "...",
      "day_number": 1,
      "date": "2025-10-01T00:00:00.000Z",
      "itineraries": [
        {
          "id": "...",
          "title": "浅草寺",
          "description": "...",
          "start_time": "09:00",
          "end_time": "11:00",
          "cost_amount": 0,
          "cost_currency": "JPY",
          "reservation": { ... }
        }
      ]
    }
  ],
  "exported_at": "2025-10-21T12:00:00.000Z"
}
```

### CSV形式（旅程全体）
| Trip Title | Day Number | Date | Sort Number | Itinerary Title | Description | Location | Start Time | End Time | Cost Amount | Cost Currency | Activity Tag | Has Reservation |
|-----------|-----------|------|------------|----------------|------------|---------|-----------|---------|------------|--------------|-------------|----------------|
| 東京旅行 | 1 | 2025-10-01 | 1 | 浅草寺 | ... | 浅草 | 09:00 | 11:00 | 0 | JPY | sightseeing | No |

### CSV形式（予約情報）
| Trip Title | Day Number | Itinerary Title | Reservation Type | Confirmation Number | Reservation Site | Flight Number | Departure Airport | Arrival Airport | ... |
|-----------|-----------|----------------|-----------------|-------------------|-----------------|--------------|------------------|----------------|-----|
| 東京旅行 | 1 | 羽田空港へ | flight | ABC123 | ana | ANA123 | HND | ITM | ... |

---

## 🎨 UI/UX

### エクスポートボタン
- **配置**: Tripページのタイトルバー右側
- **アイコン**: `mdi:download`
- **ラベル**: "Export"（モバイルでは非表示）
- **スタイル**: グレー系、ホバーで明るく

### エクスポートモーダル
- **データタイプ選択**: カード形式のラジオボタン
  - 旅程全体（🗺️ アイコン）
  - 予約情報のみ（🎫 アイコン）
- **ファイル形式選択**: 2カラムのラジオボタン
  - JSON（💜 アイコン）
  - CSV（🟢 アイコン）
- **説明テキスト**: 選択内容に応じた説明を表示
- **アクション**: キャンセル / エクスポートボタン

---

## 🧪 使用方法

### 基本的な使い方
1. Tripページにアクセス
2. タイトルバーの "Export" ボタンをクリック
3. エクスポートモーダルで設定を選択：
   - データタイプ（旅程全体 or 予約情報のみ）
   - ファイル形式（JSON or CSV）
4. "エクスポート" ボタンをクリック
5. ファイルが自動ダウンロードされます

### ファイル名規則
- **旅程全体（JSON）**: `{trip_slug}_trip.json`
- **旅程全体（CSV）**: `{trip_slug}_itinerary.csv`
- **予約情報（JSON）**: `{trip_slug}_reservations.json`
- **予約情報（CSV）**: `{trip_slug}_reservations.csv`

---

## 💡 活用例

### 1. データバックアップ
- 定期的にJSON形式でエクスポート
- 重要な旅行計画のバックアップ

### 2. データ分析
- CSV形式でエクスポート
- Excel/Google Sheetsで分析
- 旅行費用の集計
- 訪問地の統計

### 3. 他ツールとの連携
- JSON形式でエクスポート
- 他のアプリケーションにインポート
- データ移行・統合

### 4. 印刷・共有
- CSV形式でエクスポート
- Excelで整形・印刷
- 旅行メンバーと共有

---

## 🔧 技術的詳細

### CSV エスケープ処理
```typescript
function escapeCsvValue(value: any): string {
  const str = String(value)
  // カンマ、改行、ダブルクォートを含む場合はエスケープ
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}
```

### Firestoreタイムスタンプ変換
```typescript
function formatDate(date: any): string {
  // Firestoreタイムスタンプ
  if (date.toDate && typeof date.toDate === 'function') {
    return date.toDate().toISOString()
  }
  // Date オブジェクト
  if (date instanceof Date) {
    return date.toISOString()
  }
  return String(date)
}
```

### ダウンロード処理
```typescript
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
```

---

## 🚀 今後の拡張

### iCalエクスポート
- カレンダーアプリ連携（.ics形式）
- 予約日時をカレンダーイベントとして追加
- 通知・リマインダー設定

### PDFエクスポート
- 旅程レポート生成
- 航空チケット風デザイン
- 印刷最適化

### エクスポート設定の保存
- よく使う設定を保存
- デフォルト設定の選択

---

## 📝 制限事項

- エクスポートはクライアントサイドで実行（サーバーAPI不要）
- 大量データの場合、ブラウザのメモリ制限に注意
- 画像データは含まれません（URLのみ）

---

**最終更新**: 2025-10-21

