# Firebase App Hosting 環境変数設定ガイド

## 📋 現在の状況

Secret Managerの設定が複雑だったため、`apphosting.yaml`に環境変数を直接設定する方法に変更しました。

## 🔧 設定手順

### 1. .env.localから実際の値を取得

```bash
# .env.localファイルの内容を確認
cat .env.local
```

### 2. apphosting.yamlの環境変数を更新

`apphosting.yaml`の以下の箇所を実際の値に置き換えてください：

```yaml
env:
  # Firebase Configuration (クライアント側)
  - variable: NEXT_PUBLIC_FIREBASE_API_KEY
    value: "実際のFirebase API Key"
  - variable: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    value: "caglla-fb.firebaseapp.com"
  - variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID
    value: "caglla-fb"
  - variable: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    value: "caglla-fb.appspot.com"
  - variable: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    value: "実際のMessaging Sender ID"
  - variable: NEXT_PUBLIC_FIREBASE_APP_ID
    value: "実際のFirebase App ID"
  
  # Firebase Admin SDK Configuration (サーバー側)
  - variable: FIREBASE_PROJECT_ID
    value: "caglla-fb"
  - variable: FIREBASE_CLIENT_EMAIL
    value: "実際のService Account Email"
  - variable: FIREBASE_PRIVATE_KEY
    value: "実際のPrivate Key"
  
  # Google APIs Configuration
  - variable: NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
    value: "実際のGoogle Places API Key"
  - variable: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    value: "実際のGoogle Maps API Key"
  - variable: NEXT_PUBLIC_GOOGLE_MAP_ID
    value: "実際のGoogle Map ID"
  
  # App URL
  - variable: NEXT_PUBLIC_APP_URL
    value: "https://実際のアプリURL.com"
  
  # Optional APIs
  - variable: NEXT_PUBLIC_UNSPLASH_APP_ID
    value: "実際のUnsplash App ID"
  - variable: NEXT_PUBLIC_UNSPLASH_ACCESS_KEY
    value: "実際のUnsplash Access Key"
  - variable: UNSPLASH_SECRET_KEY
    value: "実際のUnsplash Secret Key"
  
  # External APIs
  - variable: TRIPADVISOR_API_KEY
    value: "実際のTripAdvisor API Key"
  - variable: FOURSQUARE_API_KEY
    value: "実際のFoursquare API Key"
  - variable: SELECTPDF_API_KEY
    value: "実際のSelectPDF API Key"
  
  # SendGrid Configuration
  - variable: SENDGRID_API_KEY
    value: "実際のSendGrid API Key"
```

### 3. デプロイテスト

```bash
# Firebase App Hostingにデプロイ
firebase apphosting:backends:deploy

# デプロイ後の動作確認
# アプリケーションが正常に動作することを確認
```

## ⚠️ セキュリティ注意事項

- この方法は開発・テスト用です
- 本番環境ではSecret Managerの使用を推奨します
- APIキーなどの機密情報は適切に管理してください

## 🔄 将来的な改善

後でSecret Managerの設定が完了したら、以下のように戻すことができます：

```yaml
env:
  - variable: NEXT_PUBLIC_FIREBASE_API_KEY
    secret: projects/caglla-fb/secrets/NEXT_PUBLIC_FIREBASE_API_KEY/versions/latest
```
