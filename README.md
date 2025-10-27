# Caglla Travel Manager

Next.js + TypeScript + Firebase で構築された旅行管理アプリケーションです。
wanderlogのような機能を提供し、個人の旅行計画を管理できます。

## 🚀 技術スタック

- **フロントエンド**: Next.js 14 (App Router), React 18, TypeScript
- **認証**: Firebase Authentication (Google OAuth)
- **データベース**: Firebase Firestore
- **ストレージ**: Firebase Storage
- **スタイリング**: Tailwind CSS
- **デプロイ**: Vercel (推奨)

## 📋 機能

- 🔐 Firebase Google OAuth認証
- ✈️ 旅行の作成・編集・削除
- 📅 日程管理（日別スケジュール）
- 🗺️ 旅程管理（アクティビティ）
- 📍 Google Places API連携（場所検索・詳細情報取得）
- 👤 ユーザープロフィール管理
- 🖼️ 画像アップロード（Firebase Storage）
- 👥 旅行の共有機能（公開/非公開）
- ✅ チェックリスト機能（準備・パッキング管理、プリセット共有）
- 📱 レスポンシブデザイン
- ⚡ SPA機能（リアルタイム編集）

## 🛠️ セットアップ

### 1. 依存関係のインストール

```bash
pnpm install
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

# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY=your_service_account_private_key

# Google Places API
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
```

### 3. Firebase プロジェクトの設定

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成
2. Authentication で Google プロバイダーを有効化
3. Firestore Database を作成
4. Storage を有効化
5. サービスアカウントキーをダウンロードして環境変数に設定

### 4. 開発サーバーの起動

```bash
pnpm dev
```

アプリケーションは http://localhost:3000 で起動します。

## 📁 プロジェクト構造

```
├── app/                    # Next.js App Router
│   ├── api/               # API ルート
│   │   ├── migrate/       # マイグレーション
│   │   ├── places/        # Google Places API
│   │   ├── trip/          # 旅行管理API
│   │   ├── trips/         # 旅行一覧API
│   │   └── users/         # ユーザーAPI
│   ├── home/              # ホームページ
│   ├── trip/              # 旅行管理ページ
│   ├── user/              # ユーザープロフィール
│   └── user-settings/     # ユーザー設定
├── components/             # React コンポーネント
│   └── common/             # 基本UI（Button/Input/Select/Textarea/Toggle）
│   ├── AvatarUpload.tsx   # アバターアップロード
│   ├── ImageUpload.tsx    # 画像アップロード
│   ├── PlaceSearchInput.tsx # 場所検索
│   ├── TripEditor.tsx     # 旅行編集
│   └── UserSettingsModal.tsx # ユーザー設定モーダル
├── lib/                   # ユーティリティ・設定
│   ├── auth-context.tsx   # 認証コンテキスト
│   ├── firebase.ts        # Firebase設定
│   ├── firebase-admin.ts  # Firebase Admin設定
│   ├── firestore.ts       # Firestore操作
│   ├── firestore-admin-operations.ts # Admin操作
│   ├── places-api.ts      # Google Places API
│   └── image-upload.ts    # 画像アップロード
├── docs/                  # ドキュメント
└── firebase.json          # Firebase設定
```

## 🗄️ Firestore コレクション構造

### users (ユーザー)
- `uid`: Firebase UID
- `name`: ユーザー名
- `email`: メールアドレス
- `photoURL`: プロフィール画像URL
- `preferredCurrency`: 通貨設定
- `createdAt`: 作成日時
- `updatedAt`: 更新日時

### trips (旅行)
- `id`: 旅行ID
- `userId`: ユーザーID
- `title`: 旅行タイトル
- `description`: 説明
- `destination`: 目的地
- `destinationPlace`: 目的地のPlace情報
- `startDate`: 出発日
- `endDate`: 帰宅日
- `accessLevel`: 公開レベル (private/public)
- `imageUrl`: 旅行画像URL
- `createdAt`: 作成日時
- `updatedAt`: 更新日時

### days (日程)
- `id`: 日程ID
- `tripId`: 旅行ID
- `dayNumber`: 日数
- `date`: 日付
- `description`: 説明
- `createdAt`: 作成日時
- `updatedAt`: 更新日時

### itineraries (旅程)
- `id`: 旅程ID
- `dayId`: 日程ID
- `sortNumber`: 並び順
- `title`: タイトル
- `description`: 説明
- `location`: 場所
- `placeId`: Google Place ID
- `startTime`: 開始時間
- `endTime`: 終了時間
- `createdAt`: 作成日時
- `updatedAt`: 更新日時

## 🔗 API エンドポイント

### 旅行管理
- `GET /api/trips` - 旅行一覧取得
- `POST /api/trips` - 旅行作成
- `GET /api/trip/[id]` - 旅行詳細取得
- `PUT /api/trip/[id]` - 旅行更新
- `DELETE /api/trip/[id]` - 旅行削除
- `GET /api/trip/[id]/day` - 日程一覧取得
- `POST /api/trip/[id]/day` - 日程作成

### 場所検索
- `GET /api/places/search` - 場所検索
- `GET /api/places/details` - 場所詳細情報取得

### ユーザー管理
- `GET /api/users` - ユーザー情報取得
- `PUT /api/users` - ユーザー情報更新

### マイグレーション
- `POST /api/migrate` - データベース初期化

## 🚀 デプロイ

### Vercel (推奨)

1. GitHubリポジトリをVercelに接続
2. 環境変数を設定
3. 自動デプロイが開始されます

### その他のプラットフォーム

- **Netlify**: Next.js対応
- **Railway**: データベース込みでデプロイ可能
- **AWS/GCP**: カスタムサーバー環境

## 🔧 開発・デバッグ

### Firebase エミュレーター

```bash
# Firebase エミュレーターの起動
firebase emulators:start
```

### ログ確認

```bash
# 開発サーバーのログ
pnpm dev

# Firebase ログ
firebase functions:log
```

## 📱 主要機能

### 認証フロー
1. Google OAuth でログイン
2. Firebase Authentication でユーザー管理
3. Firestore でユーザー情報を保存

### 旅行管理フロー
1. 旅行の作成（タイトル、目的地、期間）
2. 日程の自動生成（開始日〜終了日）
3. 旅程の追加・編集
4. Google Places API で場所情報を取得

### 画像管理
1. Firebase Storage で画像をアップロード
2. 旅行画像・プロフィール画像の管理
3. 自動リサイズ・最適化

## 📚 ドキュメント

### 変更履歴
- [CHANGELOG.md](CHANGELOG.md) - 全バージョンの変更履歴
- [リリースノート](docs/releases/) - 各バージョンの詳細なリリースノート

### 仕様書
- [チェックリスト機能仕様書](docs/specifications/checklist-feature-specification.md) - 旅行チェックリスト機能の詳細仕様
- [チェックリスト機能 改善提案仕様書](docs/specifications/checklist-improvements.md) - 検索性・状態保持・UX/運用の改善案
- [スラッグ生成仕様](docs/slug-generation-specification.md) - URL生成のためのスラッグシステムの詳細仕様

### 開発ガイド
- [チェックリスト実装ガイド](docs/development/checklist-implementation-guide.md) - チェックリスト機能の実装手順と技術的な詳細
- [アクティビティタグシステム開発ログ](docs/development/activity-tag-system-development-log.md) - アクティビティタグシステムの開発経緯

### アーキテクチャ
- [Google Maps Integration](docs/architecture/google-maps-integration.md) - Google Maps APIの統合方法
- [Photo Caching Strategy](docs/architecture/photo-caching-strategy.md) - 写真キャッシング戦略
- [Places API Cache Architecture](docs/architecture/places-api-cache-architecture.md) - Places APIのキャッシュアーキテクチャ

### Firebase
- [Firestore Collections](docs/firebase/firestore-collections.md) - Firestoreコレクション構造
- [Firestore Setup Guide](docs/firebase/firestore-setup-guide.md) - Firestoreのセットアップ手順

## 🚀 今後の拡張予定

- ✅ チェックリスト機能（準備・パッキング管理）
- Google Calendar 同期
- 旅行の共有・招待機能
- PDF エクスポート機能
- モバイルアプリ対応
- リアルタイム協力編集