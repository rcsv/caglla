# 本番環境デプロイ セキュリティガイド

**作成日**: 2025年10月9日  
**対象**: Caglla Travel Manager プロジェクト  
**目的**: 本番環境デプロイ時のセキュリティ設定チェックリスト

---

## 📋 デプロイ前チェックリスト

### ✅ 必須項目

- [ ] すべての環境変数が正しく設定されている
- [ ] Firebase APIキーにドメイン制限が設定されている
- [ ] Google Maps/Places APIキーにHTTPリファラー制限が設定されている
- [ ] Firebase Security Rulesが適切に設定されている
- [ ] Firebase Storageのセキュリティルールが設定されている
- [ ] 本番用のFirebase Admin SDK認証情報が設定されている
- [ ] ログレベルが本番環境用に設定されている
- [ ] エラーレスポンスで機密情報が漏洩しないことを確認
- [ ] CORS設定が適切に設定されている
- [ ] セキュリティヘッダーが設定されている

---

## 🔐 Firebase セキュリティ設定

### 1. Firebase Authentication 設定

#### Google OAuth プロバイダー設定
1. **Firebase Console** → **Authentication** → **Sign-in method**
2. **Google** プロバイダーを有効化
3. **承認済みドメイン**に本番ドメインを追加

```
例:
- caglla.com
- www.caglla.com
```

#### 認証設定の強化
```
- メールリンク認証を有効化（推奨）
- パスワードリセットのタイムアウトを設定
- ログイン試行回数の制限を有効化
```

---

### 2. Firebase API キー制限設定

#### アプリケーション制限
1. **Google Cloud Console** → **APIs & Services** → **Credentials**
2. **Web API Key**（Firebase API Key）を選択
3. **Application restrictions** → **HTTP referrers (web sites)** を選択
4. 以下のドメインを追加:

```
HTTPリファラー（ウェブサイト）:
- https://caglla.travel/*
- https://www.caglla.travel/*
- http://localhost:3000/*
- https://localhost:3000/*
- https://*.firebaseapp.com/*
```

**重要**: Firebase Authentication は `*.firebaseapp.com` ドメインを経由して認証フローを処理するため、このドメインを許可リストに含める必要があります。`firebaseapp.com` を除外すると、`localhost:3000` からのログインが失敗し、"The requested action is invalid." エラーが発生します。

#### API制限
有効にするAPI:
- Identity Toolkit API（Firebase Authentication用）
- Token Service API
- Firebase Installations API

---

### 3. Firestore Security Rules

本番環境用のセキュリティルールを設定してください。

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザーデータへのアクセス制御
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 旅行データへのアクセス制御
    match /trips/{tripId} {
      allow read: if request.auth != null && 
                     (resource.data.userId == request.auth.uid || 
                      resource.data.isPublic == true);
      allow write: if request.auth != null && 
                      resource.data.userId == request.auth.uid;
    }
    
    // 日別スケジュールへのアクセス制御
    match /days/{dayId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/trips/$(resource.data.tripId)).data.userId == request.auth.uid;
    }
    
    // 旅程アイテムへのアクセス制御
    match /itineraries/{itineraryId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/days/$(resource.data.dayId)).data.tripId != null;
    }
    
    // 場所データへのアクセス制御（キャッシュ用）
    match /places/{placeId} {
      allow read: if request.auth != null;
      allow write: if false; // サーバーサイドのみ書き込み可能
    }
  }
}
```

---

### 4. Firebase Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // ユーザーごとの画像アップロード制限
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      request.auth.uid == userId &&
                      request.resource.size < 5 * 1024 * 1024 && // 5MB制限
                      request.resource.contentType.matches('image/.*');
    }
    
    // 旅行画像のアップロード制限
    match /trips/{tripId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                      request.resource.size < 10 * 1024 * 1024 && // 10MB制限
                      request.resource.contentType.matches('image/.*');
    }
  }
}
```

---

## 🗺️ Google Maps API セキュリティ設定

### 1. Google Cloud Console 設定

#### APIキーの作成と制限
1. **Google Cloud Console** → **APIs & Services** → **Credentials**
2. 新しいAPIキーを作成または既存のキーを編集
3. **Application restrictions**を設定

```
HTTPリファラー（ウェブサイト）:
- https://caglla.com/*
- https://www.caglla.com/*
```

#### 有効化が必要なAPI
```
✅ 必須:
- Maps JavaScript API
- Places API
- Geocoding API
- Distance Matrix API

📍 推奨:
- Directions API（ルート計算用）
- Route Optimization API（最適化機能用）
```

---

### 2. APIキーの使用制限設定

#### 日次使用量の制限設定
1. **APIs & Services** → **Quotas**
2. 各APIの使用量上限を設定

```
推奨設定:
- Maps JavaScript API: 10,000リクエスト/日
- Places API: 5,000リクエスト/日
- Geocoding API: 5,000リクエスト/日
- Distance Matrix API: 5,000リクエスト/日
```

#### 請求アラートの設定
1. **Billing** → **Budgets & alerts**
2. 予算アラートを設定

```
推奨アラート:
- 50%達成時にメール通知
- 90%達成時にメール通知
- 100%達成時に緊急通知
```

---

## 🔧 環境変数の設定

### 1. 必須環境変数の確認

本番環境で以下の環境変数が正しく設定されていることを確認してください：

```bash
# Firebase クライアント設定
NEXT_PUBLIC_FIREBASE_API_KEY=your-production-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin SDK 設定（サーバーサイド）
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Google APIs 設定
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your-places-api-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-api-key
NEXT_PUBLIC_GOOGLE_MAP_ID=your-map-id # オプション

# Unsplash API 設定
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your-unsplash-access-key
UNSPLASH_ACCESS_KEY=your-unsplash-access-key
UNSPLASH_SECRET_KEY=your-unsplash-secret-key

# Node環境設定
NODE_ENV=production
```

### 2. 環境変数の検証

デプロイ前に環境変数が正しく設定されているか検証してください：

```bash
# 開発環境でのテスト
npm run build

# 環境変数の確認（本番環境）
node -e "console.log(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)"
```

---

## 🛡️ セキュリティヘッダーの設定

### Next.js の設定（next.config.js）

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 既存の設定...
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
```

---

## 📊 モニタリングとアラート設定

### 1. Firebase モニタリング

#### Firebase Performance Monitoring
1. **Firebase Console** → **Performance**
2. パフォーマンス監視を有効化
3. アラートルールを設定

```
推奨アラート:
- アプリ起動時間 > 3秒
- API応答時間 > 2秒
- エラー率 > 5%
```

#### Firebase Crashlytics（オプション）
```bash
# Crashlyticsの有効化
npm install @firebase/crashlytics
```

---

### 2. Google Cloud モニタリング

#### API使用量の監視
1. **Cloud Console** → **APIs & Services** → **Dashboard**
2. 各APIの使用状況を確認
3. 異常なスパイクを検出

#### コスト監視
1. **Billing** → **Reports**
2. 日次/月次のコストレポートを確認
3. 予算超過のアラートを設定

---

## 🔍 デプロイ後の検証

### 1. セキュリティチェック

```bash
# SSL証明書の確認
curl -I https://caglla.com

# セキュリティヘッダーの確認
curl -I https://caglla.com | grep -i "x-frame-options\|strict-transport"

# CSPヘッダーの確認
curl -I https://caglla.com | grep -i "content-security-policy"
```

### 2. 機能テスト

- [ ] ログイン機能の動作確認
- [ ] 旅行プラン作成機能の確認
- [ ] 地図表示の確認
- [ ] 画像アップロード機能の確認
- [ ] ルート最適化機能の確認（有料プラン）

### 3. パフォーマンステスト

```bash
# Lighthouseスコアの確認
npx lighthouse https://caglla.com --view

# Core Web Vitalsの確認
# - LCP (Largest Contentful Paint) < 2.5s
# - FID (First Input Delay) < 100ms
# - CLS (Cumulative Layout Shift) < 0.1
```

---

## 🚨 インシデント対応

### APIキーの漏洩時の対応

1. **即座に無効化**
   - Firebase Console / Google Cloud Console でAPIキーを無効化
   
2. **新しいキーの作成**
   - 新しいAPIキーを作成し、適切な制限を設定
   
3. **環境変数の更新**
   - 新しいキーで環境変数を更新
   - アプリケーションを再デプロイ
   
4. **影響範囲の調査**
   - 使用ログを確認し、不正使用がないか確認
   - 必要に応じてFirebaseプロジェクトのセキュリティ監査を実施

### 不正アクセスの検知時の対応

1. **アクセスのブロック**
   - Firestore Security Rulesを強化
   - 疑わしいIPアドレスをブロック
   
2. **ログの分析**
   - Firebase Authentication のログを確認
   - 異常なアクセスパターンを特定
   
3. **ユーザーへの通知**
   - 影響を受けたユーザーに通知
   - パスワードリセットを推奨

---

## 📚 参考リソース

### 公式ドキュメント
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Google Maps API Security Best Practices](https://developers.google.com/maps/api-security-best-practices)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)

### セキュリティチェックツール
- [Mozilla Observatory](https://observatory.mozilla.org/)
- [SecurityHeaders.com](https://securityheaders.com/)
- [SSL Labs](https://www.ssllabs.com/ssltest/)

---

## ✅ デプロイ完了チェックリスト

- [ ] すべての環境変数が設定されている
- [ ] Firebase Security Rulesが適用されている
- [ ] APIキー制限が設定されている
- [ ] セキュリティヘッダーが正しく返される
- [ ] SSL証明書が有効である
- [ ] モニタリングとアラートが設定されている
- [ ] ログレベルが本番用に設定されている
- [ ] エラーレスポンスで機密情報が漏洩しない
- [ ] パフォーマンスが基準を満たしている
- [ ] バックアップ戦略が確立されている

---

**最終更新**: 2025年10月9日  
**次回レビュー予定**: 2025年11月9日

