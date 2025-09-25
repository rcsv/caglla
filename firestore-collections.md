# Firebase Firestore コレクション設計

## 📋 コレクション構造

### 1. `users` コレクション
ユーザー情報を格納

```json
{
  "id": "auto-generated-doc-id",
  "google_id": "google-oauth-user-id",
  "name": "田中太郎",
  "email": "tanaka@example.com",
  "preferred_currency": "JPY",
  "skip_confirm_delete": false,
  "created_at": "2024-12-01T00:00:00Z",
  "updated_at": "2024-12-01T00:00:00Z"
}
```

### 2. `trips` コレクション
旅行情報を格納

```json
{
  "id": "auto-generated-doc-id",
  "user_id": "user-doc-id",
  "title": "沖縄旅行",
  "description": "家族での沖縄旅行。美しい海と美味しい料理を楽しみます。",
  "destination": "沖縄県那覇市",
  "start_date": "2024-12-15T00:00:00Z",
  "end_date": "2024-12-18T00:00:00Z",
  "access_level": "private",
  "created_at": "2024-12-01T00:00:00Z",
  "updated_at": "2024-12-01T00:00:00Z"
}
```

### 3. `days` コレクション
旅行の日程を格納

```json
{
  "id": "auto-generated-doc-id",
  "trip_id": "trip-doc-id",
  "day_number": 1,
  "date": "2024-12-15T00:00:00Z",
  "description": "那覇空港到着、ホテルチェックイン、国際通り散策",
  "created_at": "2024-12-01T00:00:00Z",
  "updated_at": "2024-12-01T00:00:00Z"
}
```

### 4. `itineraries` コレクション
日程の詳細な旅程を格納

```json
{
  "id": "auto-generated-doc-id",
  "day_id": "day-doc-id",
  "sort_number": 1,
  "title": "那覇空港到着",
  "description": "ANA便で那覇空港に到着。レンタカーを借りてホテルへ向かう",
  "location": "那覇空港",
  "start_time": "14:30",
  "end_time": "15:30",
  "created_at": "2024-12-01T00:00:00Z",
  "updated_at": "2024-12-01T00:00:00Z"
}
```

### 5. `trip_users` コレクション
旅行の共有ユーザーを格納

```json
{
  "id": "auto-generated-doc-id",
  "trip_id": "trip-doc-id",
  "user_id": "user-doc-id",
  "created_at": "2024-12-01T00:00:00Z"
}
```

## 🗂️ Firestore コンソールでの手動作成手順

### 1. Firebase Console にアクセス
- https://console.firebase.google.com/
- プロジェクトを選択
- 「Firestore Database」をクリック

### 2. コレクションの作成

#### `users` コレクション
1. 「コレクションを開始」をクリック
2. コレクションID: `users`
3. 最初のドキュメントID: `auto` (自動生成)
4. フィールドを追加:
   - `google_id`: string, `google-oauth-user-id`
   - `name`: string, `田中太郎`
   - `email`: string, `tanaka@example.com`
   - `preferred_currency`: string, `JPY`
   - `skip_confirm_delete`: boolean, `false`
   - `created_at`: timestamp, `2024-12-01T00:00:00Z`
   - `updated_at`: timestamp, `2024-12-01T00:00:00Z`

#### `trips` コレクション
1. 「コレクションを開始」をクリック
2. コレクションID: `trips`
3. 最初のドキュメントID: `auto` (自動生成)
4. フィールドを追加:
   - `user_id`: string, `usersドキュメントのID`
   - `title`: string, `沖縄旅行`
   - `description`: string, `家族での沖縄旅行`
   - `destination`: string, `沖縄県那覇市`
   - `start_date`: timestamp, `2024-12-15T00:00:00Z`
   - `end_date`: timestamp, `2024-12-18T00:00:00Z`
   - `access_level`: string, `private`
   - `created_at`: timestamp, `2024-12-01T00:00:00Z`
   - `updated_at`: timestamp, `2024-12-01T00:00:00Z`

#### `days` コレクション
1. 「コレクションを開始」をクリック
2. コレクションID: `days`
3. 最初のドキュメントID: `auto` (自動生成)
4. フィールドを追加:
   - `trip_id`: string, `tripsドキュメントのID`
   - `day_number`: number, `1`
   - `date`: timestamp, `2024-12-15T00:00:00Z`
   - `description`: string, `那覇空港到着、ホテルチェックイン`
   - `created_at`: timestamp, `2024-12-01T00:00:00Z`
   - `updated_at`: timestamp, `2024-12-01T00:00:00Z`

#### `itineraries` コレクション
1. 「コレクションを開始」をクリック
2. コレクションID: `itineraries`
3. 最初のドキュメントID: `auto` (自動生成)
4. フィールドを追加:
   - `day_id`: string, `daysドキュメントのID`
   - `sort_number`: number, `1`
   - `title`: string, `那覇空港到着`
   - `description`: string, `ANA便で那覇空港に到着`
   - `location`: string, `那覇空港`
   - `start_time`: string, `14:30`
   - `end_time`: string, `15:30`
   - `created_at`: timestamp, `2024-12-01T00:00:00Z`
   - `updated_at`: timestamp, `2024-12-01T00:00:00Z`

#### `trip_users` コレクション
1. 「コレクションを開始」をクリック
2. コレクションID: `trip_users`
3. 最初のドキュメントID: `auto` (自動生成)
4. フィールドを追加:
   - `trip_id`: string, `tripsドキュメントのID`
   - `user_id`: string, `usersドキュメントのID`
   - `created_at`: timestamp, `2024-12-01T00:00:00Z`

## 📝 サンプルデータの例

### 完全な旅行データの例

1. **ユーザー作成**
   - `users` コレクションにユーザー情報を追加

2. **旅行作成**
   - `trips` コレクションに旅行情報を追加
   - `user_id` に作成したユーザーのIDを設定

3. **日程作成**
   - `days` コレクションに各日の情報を追加
   - `trip_id` に作成した旅行のIDを設定
   - `day_number` で日数を管理

4. **旅程作成**
   - `itineraries` コレクションに各日の詳細なスケジュールを追加
   - `day_id` に作成した日程のIDを設定
   - `sort_number` で時間順を管理

5. **共有設定**（オプション）
   - `trip_users` コレクションに共有ユーザーを追加

## 🔗 リレーションシップ

- `users` → `trips` (1対多)
- `trips` → `days` (1対多)
- `days` → `itineraries` (1対多)
- `trips` ↔ `users` (多対多, `trip_users`経由)

## ⚠️ 注意事項

1. **ドキュメントID**: 自動生成を使用することを推奨
2. **タイムスタンプ**: `created_at` と `updated_at` は必ず設定
3. **リレーション**: 外部キーはドキュメントIDを使用
4. **インデックス**: クエリに応じてFirestoreが自動でインデックスを作成
5. **セキュリティルール**: 本番環境では適切なセキュリティルールを設定
