# 予約テンプレート機能

**実装日**: 2025-10-21  
**バージョン**: v1.9.0候補  
**難易度**: 🟡 中

---

## 📋 概要

よく使う予約情報をテンプレートとして保存・再利用できる機能を実装しました。繰り返し使う予約情報（いつもの航空便、ホテル、レンタカー等）を効率的に管理できます。

---

## ✨ 実装した機能

### 1. テンプレート管理
- **作成**: 新規テンプレート作成
- **編集**: 既存テンプレート編集
- **削除**: テンプレート削除
- **一覧**: ユーザーのテンプレート一覧表示

### 2. テンプレートの内容
- **基本情報**
  - テンプレート名（例: "いつものANA便"）
  - 説明（用途や特徴）
  - 予約タイプ（飛行機/ホテル/レンタカー/食事/その他）
  
- **デフォルト値**
  - 予約サイト
  - 航空会社（飛行機の場合）
  - 出発空港・到着空港（飛行機の場合）
  - デフォルトメモ

### 3. 使用統計
- **使用回数**: テンプレート使用回数を自動カウント
- **最終使用日時**: 最後に使用した日時を記録
- **並び順**: 更新日時順で表示

### 4. ユーザーインターフェース
- **テンプレートボタン**: 予約情報入力モーダルのヘッダーに配置
- **テンプレートモーダル**: 一覧表示・作成・編集・削除
- **ワンクリック適用**: テンプレート選択でフォームに自動入力

---

## 🏗️ 実装内容

### 新規作成ファイル

#### 1. `lib/core/types/reservation-template.ts`
テンプレートの型定義：

```typescript
export interface ReservationTemplate {
  id: string
  user_id: string
  name: string
  description?: string
  type: ReservationType
  reservation_site?: ReservationSite
  airline?: string
  departure_airport?: string
  arrival_airport?: string
  notes?: string
  use_count?: number
  last_used_at?: FirestoreDate
  created_at: FirestoreDate
  updated_at: FirestoreDate
}
```

#### 2. `app/api/reservation-templates/route.ts`
テンプレート一覧取得・作成API：
- `GET /api/reservation-templates` - ユーザーのテンプレート一覧
- `POST /api/reservation-templates` - 新規テンプレート作成

#### 3. `app/api/reservation-templates/[templateId]/route.ts`
テンプレート個別操作API：
- `PUT /api/reservation-templates/[templateId]` - テンプレート更新
- `DELETE /api/reservation-templates/[templateId]` - テンプレート削除
- `POST /api/reservation-templates/[templateId]/use` - 使用統計更新

#### 4. `components/modals/ReservationTemplateModal.tsx`
テンプレート管理モーダル：
- テンプレート一覧表示
- 新規作成フォーム
- 編集フォーム
- 削除機能
- テンプレート適用

### 修正ファイル

#### 1. `components/modals/ReservationInfoModal.tsx`
- テンプレートボタン追加（ヘッダー）
- `handleLoadTemplate` 関数追加
- `ReservationTemplateModal` 統合

#### 2. `lib/core/types/index.ts`
- `reservation-template` 型のエクスポート追加

#### 3. `firestore.rules`
- `reservation_templates` コレクションのセキュリティルール追加

---

## 🎨 使い方

### 1. テンプレート作成
1. 予約情報を入力する画面で **"テンプレート"** ボタンをクリック
2. **"新規テンプレート作成"** ボタンをクリック
3. テンプレート情報を入力
   - テンプレート名
   - 予約タイプ
   - 予約サイト、航空会社、空港コード等
4. **"作成"** ボタンでテンプレート保存

### 2. テンプレート使用
1. 予約情報を入力する画面で **"テンプレート"** ボタンをクリック
2. 使いたいテンプレートを選択（✓ボタン）
3. フォームに自動入力されます
4. 必要に応じて詳細を編集
5. 保存

### 3. テンプレート編集
1. テンプレートモーダルで編集したいテンプレートの **"編集"** ボタン（鉛筆アイコン）をクリック
2. 内容を編集
3. **"更新"** ボタンで保存

### 4. テンプレート削除
1. テンプレートモーダルで削除したいテンプレートの **"削除"** ボタン（ゴミ箱アイコン）をクリック
2. 確認ダイアログで **"OK"**

---

## 📊 テンプレート例

### 飛行機テンプレート例
```
テンプレート名: いつものANA便 羽田→伊丹
予約タイプ: 飛行機
予約サイト: ANA
航空会社: ANA
出発空港: HND
到着空港: ITM
メモ: マイレージ登録を忘れずに
```

### ホテルテンプレート例
```
テンプレート名: Booking.com 定宿
予約タイプ: ホテル
予約サイト: Booking.com
メモ: チェックイン: 15:00 / チェックアウト: 11:00
```

### レンタカーテンプレート例
```
テンプレート名: トヨタレンタカー
予約タイプ: レンタカー
予約サイト: その他
メモ: 免許証・クレジットカード持参
```

---

## 💡 活用例

### 1. 定期的な出張
- いつも使う航空便をテンプレート化
- 空港コードや航空会社を毎回入力する手間を削減

### 2. お気に入りホテル
- よく泊まるホテルをテンプレート化
- 予約サイトやチェックイン時刻をプリセット

### 3. 旅行パターン化
- 「国内旅行セット」「海外旅行セット」等のテンプレート群
- 同じパターンの旅行計画を効率化

### 4. メモのプリセット
- チェックイン時の注意事項
- 持ち物リスト
- 予約時の確認事項

---

## 🔧 技術的詳細

### データモデル

**Firestoreコレクション**: `reservation_templates`

**ドキュメント構造**:
```json
{
  "user_id": "userId123",
  "name": "いつものANA便",
  "description": "羽田→伊丹の定期便",
  "type": "flight",
  "reservation_site": "ana",
  "airline": "ANA",
  "departure_airport": "HND",
  "arrival_airport": "ITM",
  "notes": "マイレージ登録",
  "use_count": 5,
  "last_used_at": "2025-10-21T12:00:00Z",
  "created_at": "2025-10-01T08:00:00Z",
  "updated_at": "2025-10-21T12:00:00Z"
}
```

### セキュリティルール

```
match /reservation_templates/{templateId} {
  // ユーザーは自分のテンプレートのみ読み書き可能
  allow read, write: if request.auth.uid == resource.data.user_id;
  allow create: if request.auth.uid == request.resource.data.user_id;
}
```

### API仕様

#### GET /api/reservation-templates
ユーザーのテンプレート一覧を取得（更新日時順）

**レスポンス**:
```json
{
  "templates": [...]
}
```

#### POST /api/reservation-templates
新規テンプレート作成

**リクエスト**:
```json
{
  "name": "テンプレート名",
  "type": "flight",
  "airline": "ANA",
  ...
}
```

#### PUT /api/reservation-templates/[templateId]
テンプレート更新

#### DELETE /api/reservation-templates/[templateId]
テンプレート削除

#### POST /api/reservation-templates/[templateId]/use
使用統計更新（use_count++、last_used_at更新）

---

## 🚀 今後の拡張

### テンプレート共有
- チーム内でテンプレート共有
- 公開テンプレートライブラリ

### カテゴリ・タグ
- テンプレートのカテゴリ分類
- タグによる検索

### インポート/エクスポート
- テンプレートのバックアップ
- 他のユーザーとテンプレート共有

### AI提案
- よく使うパターンからテンプレート提案
- 過去の予約情報から自動生成

---

**最終更新**: 2025-10-21

