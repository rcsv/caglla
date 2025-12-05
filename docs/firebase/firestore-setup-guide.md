# Firebase Firestore セットアップガイド

## 🚀 初期設定手順

### 1. Firebase プロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを作成」をクリック
3. プロジェクト名: `caglla-travel-manager`
4. Google Analytics の設定（オプション）
5. プロジェクトを作成

### 2. Firestore Database の有効化

1. プロジェクトダッシュボードで「Firestore Database」をクリック
2. 「データベースを作成」をクリック
3. セキュリティルール: 「テストモードで開始」（後で変更）
4. ロケーション: `asia-northeast1` (東京)
5. 「完了」をクリック

### 3. 認証の設定

1. 左メニューから「Authentication」をクリック
2. 「始める」をクリック
3. 「Sign-in method」タブをクリック
4. 「Google」を有効化
5. プロジェクトのサポートメールを設定
6. 「保存」をクリック

#### 承認済みドメインの設定（重要）

開発環境で `localhost:3000` からログインできるようにするには、承認済みドメインに `localhost` を追加する必要があります：

1. **Authentication** → **Settings** タブをクリック
2. **Authorized domains** セクションを確認
3. `localhost` が含まれていない場合は、「Add domain」をクリック
4. `localhost` を入力して「Add」をクリック

**注意**: `localhost` は通常デフォルトで含まれていますが、何らかの理由で削除された場合は手動で追加する必要があります。エラー "The requested action is invalid." が表示される場合は、この設定を確認してください。

### 4. 環境変数の取得

1. プロジェクト設定（歯車アイコン）をクリック
2. 「全般」タブの「マイアプリ」セクション
3. 「</>」アイコンをクリック（Web アプリを追加）
4. アプリ名: `caglla-web`
5. 「アプリを登録」をクリック
6. 設定オブジェクトをコピー

### 5. 環境変数の設定

`.env.local` ファイルを作成:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 6. Firebase API キーの制限設定（重要）

Firebase API Key にウェブサイト制限を設定する場合、**必ず `*.firebaseapp.com` ドメインを含める**必要があります。

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials?project=caglla-fb) にアクセス
2. Firebase API Key（`NEXT_PUBLIC_FIREBASE_API_KEY` の値）を選択
3. **Application restrictions** → **HTTP referrers (web sites)** を選択
4. 以下のドメインを追加:
   - `http://localhost:3000/*`
   - `https://localhost:3000/*`
   - `https://*.firebaseapp.com/*` ← **必須**
   - 本番ドメイン（例: `https://caglla.travel/*`）

**なぜ必要か**: Firebase Authentication は認証フロー中に `*.firebaseapp.com` ドメインを使用します。このドメインを許可リストから除外すると、`localhost:3000` からのログインが失敗し、"The requested action is invalid." エラーが発生します。

## 📋 コレクションの手動作成

### 手順1: users コレクション

1. Firestore Database で「コレクションを開始」をクリック
2. コレクションID: `users`
3. ドキュメントID: `auto` (自動生成)
4. フィールドを追加:

| フィールド | タイプ | 値 |
|-----------|--------|-----|
| google_id | string | `google-oauth-user-id-123` |
| name | string | `田中太郎` |
| email | string | `tanaka@example.com` |
| preferred_currency | string | `JPY` |
| skip_confirm_delete | boolean | `false` |
| created_at | timestamp | `2024-12-01T00:00:00Z` |
| updated_at | timestamp | `2024-12-01T00:00:00Z` |

### 手順2: trips コレクション

1. 「コレクションを開始」をクリック
2. コレクションID: `trips`
3. ドキュメントID: `auto` (自動生成)
4. フィールドを追加:

| フィールド | タイプ | 値 |
|-----------|--------|-----|
| user_id | string | `usersドキュメントのID` |
| title | string | `沖縄旅行` |
| description | string | `家族での沖縄旅行` |
| destination | string | `沖縄県那覇市` |
| start_date | timestamp | `2024-12-15T00:00:00Z` |
| end_date | timestamp | `2024-12-18T00:00:00Z` |
| access_level | string | `private` |
| created_at | timestamp | `2024-12-01T00:00:00Z` |
| updated_at | timestamp | `2024-12-01T00:00:00Z` |

### 手順3: days コレクション

1. 「コレクションを開始」をクリック
2. コレクションID: `days`
3. ドキュメントID: `auto` (自動生成)
4. フィールドを追加:

| フィールド | タイプ | 値 |
|-----------|--------|-----|
| trip_id | string | `tripsドキュメントのID` |
| day_number | number | `1` |
| date | timestamp | `2024-12-15T00:00:00Z` |
| description | string | `那覇空港到着、ホテルチェックイン` |
| created_at | timestamp | `2024-12-01T00:00:00Z` |
| updated_at | timestamp | `2024-12-01T00:00:00Z` |

### 手順4: itineraries コレクション

1. 「コレクションを開始」をクリック
2. コレクションID: `itineraries`
3. ドキュメントID: `auto` (自動生成)
4. フィールドを追加:

| フィールド | タイプ | 値 |
|-----------|--------|-----|
| day_id | string | `daysドキュメントのID` |
| sort_number | number | `1` |
| title | string | `那覇空港到着` |
| description | string | `ANA便で那覇空港に到着` |
| location | string | `那覇空港` |
| start_time | string | `14:30` |
| end_time | string | `15:30` |
| created_at | timestamp | `2024-12-01T00:00:00Z` |
| updated_at | timestamp | `2024-12-01T00:00:00Z` |

### 手順5: trip_users コレクション

1. 「コレクションを開始」をクリック
2. コレクションID: `trip_users`
3. ドキュメントID: `auto` (自動生成)
4. フィールドを追加:

| フィールド | タイプ | 値 |
|-----------|--------|-----|
| trip_id | string | `tripsドキュメントのID` |
| user_id | string | `usersドキュメントのID` |
| created_at | timestamp | `2024-12-01T00:00:00Z` |

## 🔒 セキュリティルールの設定

1. Firestore Database で「ルール」タブをクリック
2. `firestore.rules` ファイルの内容をコピー&ペースト
3. 「公開」をクリック

## 📊 インデックスの設定

1. Firestore Database で「インデックス」タブをクリック
2. 「複合インデックスを作成」をクリック
3. `firestore.indexes.json` の内容に基づいてインデックスを作成

## 🧪 テストデータの投入

1. `sample-data.json` の内容を参考にサンプルデータを作成
2. 各コレクションに手動でドキュメントを追加
3. リレーションシップを正しく設定

## ✅ 動作確認

1. Next.js アプリケーションを起動: `npm run dev`
2. http://localhost:3000 にアクセス
3. Google認証でログイン
4. 旅行データが正しく表示されることを確認

## 🚨 注意事項

- **本番環境**: セキュリティルールを適切に設定
- **バックアップ**: 定期的にデータをエクスポート
- **コスト**: Firestore の読み書き回数に注意
- **制限**: ドキュメントサイズは1MB以下
- **インデックス**: 複合クエリにはインデックスが必要
