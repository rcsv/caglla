# Caglla Travel Manager

Next.js + TypeScript + Firebase で構築された旅行管理アプリケーションです。
wanderlogのような機能を提供し、個人の旅行計画を管理できます。

## 🚀 技術スタック

- **フロントエンド**: Next.js 14 (App Router), React 18, TypeScript
- **認証**: Firebase Authentication (Google OAuth)
- **データベース**: MySQL
- **スタイリング**: Tailwind CSS
- **デプロイ**: Vercel (推奨)

## 📋 機能

- 🔐 Firebase Google OAuth認証
- ✈️ 旅行の作成・編集・削除
- 📅 日程管理（日別スケジュール）
- 🗺️ 旅程管理（アクティビティ）
- 👥 旅行の共有機能（公開/非公開）
- 📱 レスポンシブデザイン
- ⚡ SPA機能（リアルタイム編集）

## 🛠️ セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成し、以下の変数を設定してください：

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Database Configuration
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=caglla_db
```

### 3. データベースの初期化

```bash
# マイグレーションの実行
curl -X POST http://localhost:3000/api/migrate
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは http://localhost:3000 で起動します。

## 📁 プロジェクト構造

```
├── app/                    # Next.js App Router
│   ├── api/               # API ルート
│   ├── home/              # ホームページ
│   ├── trip/              # 旅行管理ページ
│   └── user/              # ユーザープロフィール
├── components/             # React コンポーネント
├── lib/                   # ユーティリティ・設定
│   ├── auth-context.tsx   # 認証コンテキスト
│   ├── database.ts        # データベース接続
│   └── firebase.ts        # Firebase設定
└── scripts/migrations/    # データベースマイグレーション
```

## 🗄️ データベーススキーマ

### users (ユーザー)
- `google_id`: GoogleアカウントID
- `name`: ユーザー名
- `email`: メールアドレス
- `preferred_currency`: 通貨設定
- `skip_confirm_delete`: 削除確認スキップ設定

### trips (旅行)
- `id`: 旅行ID
- `user_id`: ユーザーID
- `title`: 旅行タイトル
- `description`: 説明
- `destination`: 目的地
- `start_date`: 出発日
- `end_date`: 帰宅日
- `access_level`: 公開レベル (private/public)

### days (日程)
- `id`: 日程ID
- `trip_id`: 旅行ID
- `day_number`: 日数
- `date`: 日付
- `description`: 説明

### itineraries (旅程)
- `id`: 旅程ID
- `day_id`: 日程ID
- `sort_number`: 並び順
- `title`: タイトル
- `description`: 説明
- `location`: 場所
- `start_time`: 開始時間
- `end_time`: 終了時間

### trip_user (旅行共有)
- `trip_id`: 旅行ID
- `user_id`: ユーザーID

## 🔗 API エンドポイント

- `GET /api/trips` - 旅行一覧取得
- `POST /api/trips` - 旅行作成
- `GET /api/trip/[id]` - 旅行詳細取得
- `PUT /api/trip/[id]` - 旅行更新
- `DELETE /api/trip/[id]` - 旅行削除
- `GET /api/trip/[id]/day` - 日程一覧取得
- `POST /api/trip/[id]/day` - 日程作成

## 🚀 デプロイ

### Vercel (推奨)

1. GitHubリポジトリをVercelに接続
2. 環境変数を設定
3. 自動デプロイが開始されます

### その他のプラットフォーム

- **Netlify**: Next.js対応
- **Railway**: データベース込みでデプロイ可能
- **AWS/GCP**: カスタムサーバー環境

---

## 📘 Data Schema Overview

The application follows the same data structure as the original [tabi4.me](https://tabi4.me) project.

### 🧳 travels (旅行情報)

| Field               | Type          | Description                            |
|--------------------|---------------|----------------------------------------|
| `id`               | UUID / INT    | Primary key                            |
| `title`            | TEXT          | Trip name                              |
| `trip_purpose`     | TEXT          | Purpose of trip (shown in PDF)         |
| `start_date`       | DATE          | Start date                             |
| `end_date`         | DATE          | End date                               |
| `primary_transportation` | ENUM     | 徒歩 / バス / 電車 / 車 / 飛行機 / フェリー / 自転車 / その他 |
| `allowed_users`    | JSON or FK[]  | Users with access permissions          |

---

### 📅 activities (旅程アクティビティ = itinerary)

All types of travel plans are unified here.

| Field           | Type       | Description                                |
|----------------|------------|--------------------------------------------|
| `id`           | UUID       | Primary key                                |
| `trip_id`      | FK         | Linked trip                                |
| `title`        | TEXT       | Activity title                             |
| `start_time`   | DATETIME   | Start time                                 |
| `end_time`     | DATETIME   | End time                                   |
| `location_name`| TEXT       | Display name of location                   |
| `place_id`     | TEXT       | Google Place ID                            |
| `category`     | ENUM       | flight / car_rental / hotel / dining / etc |
| `cost_amount`  | DECIMAL    | Expense amount (in local currency)         |
| `cost_currency`| TEXT       | ISO currency code (e.g., JPY, USD)         |

---

### 🧑‍🤝‍🧑 companions (同行者)

| Field         | Type     | Description                            |
|--------------|----------|----------------------------------------|
| `id`         | UUID     | Primary key                            |
| `trip_id`    | FK       | Related trip                           |
| `person_id`  | FK       | Linked to `persons` table              |

---

### 🧑 persons (人物プロフィール)

| Field            | Type     | Description                         |
|------------------|----------|-------------------------------------|
| `id`             | UUID     | Primary key                         |
| `first_name`     | TEXT     | First name                          |
| `last_name`      | TEXT     | Last name                           |
| `date_of_birth`  | DATE     | DOB (for age-based checklist)       |
| `passport_code`  | TEXT     | Passport number                     |
| `it_is_myself`   | BOOLEAN  | If this is the logged-in user       |

---

## 📄 Page Layouts (UI 構成)

### index / home / dashboard

- Status grouping:
  - **BOARDING**: 次に出発する旅行（直前チェックリストあり）
  - **ITINERARY INK**: 未来の旅行（一覧形式）
  - **MEMORIES**: 過去の旅行（カード形式）

### Trip Detail

- 旅行名、目的、期間、主な交通手段（with icon）
- 同行者一覧
- 旅程（日毎、時系列表示）

### PDF Output (旅のしおり)

- 表紙、目次、チェックリスト、予約情報、日程表、緊急連絡先、メモページを含む構成
- SelectPDF による WYSIWYG レンダリング（1024×1449px）

---

## ✈️ Future Extensions

- Google Calendar 同期（手動 → 自動化予定）
- Place API による POI 情報補完
- Trip invitation / 共有機能
- 迷子札生成（PDF付録）