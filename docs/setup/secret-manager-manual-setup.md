# Firebase App Hosting用 Secret Manager シークレット一覧

## 必要なシークレット（Google Cloud Consoleで手動作成）

### Firebase Configuration (クライアント側)
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN  
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID

### Firebase Admin SDK Configuration (サーバー側)
- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY

### Google APIs Configuration
- NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
- NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
- NEXT_PUBLIC_GOOGLE_MAP_ID

### App URL
- NEXT_PUBLIC_APP_URL

### Optional APIs
- NEXT_PUBLIC_UNSPLASH_APP_ID
- NEXT_PUBLIC_UNSPLASH_ACCESS_KEY
- UNSPLASH_SECRET_KEY

### External APIs
- TRIPADVISOR_API_KEY
- FOURSQUARE_API_KEY
- SELECTPDF_API_KEY

### SendGrid Configuration
- SENDGRID_API_KEY

## 手順

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクト `caglla-fb` を選択
3. 左側メニュー → 「シークレット マネージャー」
4. 「シークレットを作成」をクリック
5. 上記の各シークレット名で作成（値は.env.localから取得）

## サービスアカウント権限設定

1. Google Cloud Console → IAMと管理 → IAM
2. `firebase-app-hosting-compute@caglla-fb.iam.gserviceaccount.com` を探す
3. 「編集」→「ロールを追加」で以下を追加：
   - Secret Manager シークレット アクセサー
   - Secret Manager シークレット バージョン マネージャー
