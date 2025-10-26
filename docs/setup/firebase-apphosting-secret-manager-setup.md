# Firebase App Hosting + Google Cloud Secret Manager セットアップマニュアル

このドキュメントでは、Firebase App HostingでGoogle Cloud Secret Managerを使用して環境変数を安全に管理するための完全なセットアップ手順を説明します。

## 📋 前提条件

- Google Cloud プロジェクト (`caglla-fb`)
- Firebase プロジェクト (同じプロジェクトID)
- ローカル開発環境 (Linux/macOS/Windows)

## 🛠️ ステップ1: Google Cloud SDK インストール

### Linux (Ubuntu/Debian)
```bash
# Snapを使用したインストール (推奨)
sudo snap install google-cloud-cli

# または、公式リポジトリを使用
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
echo "deb https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
sudo apt update
sudo apt install google-cloud-cli
```

### macOS
```bash
# Homebrewを使用
brew install google-cloud-sdk

# または、公式インストーラー
curl https://sdk.cloud.google.com | bash
```

### Windows
```bash
# Chocolateyを使用
choco install gcloudsdk

# または、公式インストーラーをダウンロード
# https://cloud.google.com/sdk/docs/install
```

## 🔐 ステップ2: Google Cloud 認証設定

```bash
# 1. Google Cloudにログイン
gcloud auth login

# 2. プロジェクトを設定
gcloud config set project caglla-fb

# 3. Application Default Credentials (ADC) を設定
gcloud auth application-default login

# 4. 認証確認
gcloud auth list
gcloud config list
```

## 🔑 ステップ3: Secret Manager シークレット作成

### Firebase CLI を使用したセットアップ（最推奨）

Firebase CLIの`apphosting:secrets:set`コマンドを使用することで、シークレットの作成と同時にFirebase App Hostingサービスアカウントへの権限付与も自動的に行われます：

```bash
# Firebase CLIでシークレットを設定（推奨）
firebase apphosting:secrets:set NEXT_PUBLIC_FIREBASE_API_KEY
# プロンプトに従って値を入力し、サービスアカウントへの権限付与を承認してください

# 他の環境変数も同様に実行
firebase apphosting:secrets:set NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
firebase apphosting:secrets:set NEXT_PUBLIC_FIREBASE_PROJECT_ID
firebase apphosting:secrets:set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
firebase apphosting:secrets:set NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
firebase apphosting:secrets:set NEXT_PUBLIC_FIREBASE_APP_ID
firebase apphosting:secrets:set NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
firebase apphosting:secrets:set NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
firebase apphosting:secrets:set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
firebase apphosting:secrets:set NEXT_PUBLIC_GOOGLE_MAP_ID
firebase apphosting:secrets:set FIREBASE_PROJECT_ID
firebase apphosting:secrets:set FIREBASE_CLIENT_EMAIL
firebase apphosting:secrets:set FIREBASE_PRIVATE_KEY
```

**メリット:**
- シークレット作成と権限付与が同時に実行される
- ステップ4の手動IAM権限設定が不要
- Firebase App Hostingとの連携が最適化される

### 自動セットアップ（代替手段）

プロジェクトルートで以下のコマンドを実行して、環境変数を自動的にSecret Managerに登録します：

```bash
pnpm run setup-secrets
```

このスクリプトは、`.env.local`ファイルから環境変数を読み取り、`firebase apphosting:secrets:set`コマンドを使用してGoogle Cloud Secret Managerに自動的に登録します。

### 手動セットアップ（gcloud CLI使用）

```bash
# 各環境変数を個別に作成
gcloud secrets create NEXT_PUBLIC_FIREBASE_API_KEY --data-file=- <<< "your-api-key"
gcloud secrets create NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN --data-file=- <<< "your-auth-domain"
gcloud secrets create NEXT_PUBLIC_FIREBASE_PROJECT_ID --data-file=- <<< "your-project-id"
# ... 他の環境変数も同様に作成
```

## 🔒 ステップ4: Firebase App Hosting サービスアカウント権限設定

**注意**: ステップ3で`firebase apphosting:secrets:set`コマンドを使用した場合、このステップは自動的に実行されるため、手動での権限設定は不要です。`gcloud secrets create`を使用した場合や、何らかの理由で権限が不足している場合にのみ実行してください。

```bash
# サービスアカウント名を設定
SA="firebase-app-hosting-compute@caglla-fb.iam.gserviceaccount.com"

# Secret Manager アクセス権を付与
gcloud projects add-iam-policy-binding caglla-fb \
  --member="serviceAccount:${SA}" \
  --role="roles/secretmanager.secretAccessor" \
  --condition="expression=true,title=fa-secret-accessor,description=Unconditional access for App Hosting"

gcloud projects add-iam-policy-binding caglla-fb \
  --member="serviceAccount:${SA}" \
  --role="roles/secretmanager.secretVersionManager" \
  --condition="expression=true,title=fa-secret-versioner,description=Unconditional access for App Hosting"
```

## 📝 ステップ5: apphosting.yaml 設定

`apphosting.yaml` ファイルを作成・更新:

```yaml
# Firebase App Hosting Configuration
appConfig:
  name: caglla
  version: 1.8.2
  description: Travel management app inspired by wanderlog
  private: true

runConfig:
  runtime: nodejs22
  env:
    # Firebase設定（完全なリソース名を使用）
    - variable: NEXT_PUBLIC_FIREBASE_API_KEY
      secret: projects/caglla-fb/secrets/NEXT_PUBLIC_FIREBASE_API_KEY/versions/latest
    - variable: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
      secret: projects/caglla-fb/secrets/NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN/versions/latest
    - variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID
      secret: projects/caglla-fb/secrets/NEXT_PUBLIC_FIREBASE_PROJECT_ID/versions/latest
    - variable: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      secret: projects/caglla-fb/secrets/NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET/versions/latest
    - variable: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
      secret: projects/caglla-fb/secrets/NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID/versions/latest
    - variable: NEXT_PUBLIC_FIREBASE_APP_ID
      secret: projects/caglla-fb/secrets/NEXT_PUBLIC_FIREBASE_APP_ID/versions/latest
    
    # 注意: 同じプロジェクト内のシークレットであれば、以下の簡潔な形式も使用可能
    # - variable: NEXT_PUBLIC_FIREBASE_API_KEY
    #   secret: NEXT_PUBLIC_FIREBASE_API_KEY
    
    # Firebase Admin設定
    - variable: FIREBASE_PROJECT_ID
      secret: projects/caglla-fb/secrets/FIREBASE_PROJECT_ID/versions/latest
    - variable: FIREBASE_CLIENT_EMAIL
      secret: projects/caglla-fb/secrets/FIREBASE_CLIENT_EMAIL/versions/latest
    - variable: FIREBASE_PRIVATE_KEY
      secret: projects/caglla-fb/secrets/FIREBASE_PRIVATE_KEY/versions/latest
    
    # Google APIs設定
    - variable: NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
      secret: projects/caglla-fb/secrets/NEXT_PUBLIC_GOOGLE_PLACES_API_KEY/versions/latest
    - variable: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      secret: projects/caglla-fb/secrets/NEXT_PUBLIC_GOOGLE_MAPS_API_KEY/versions/latest
    - variable: NEXT_PUBLIC_GOOGLE_MAP_ID
      secret: projects/caglla-fb/secrets/NEXT_PUBLIC_GOOGLE_MAP_ID/versions/latest
    
    # アプリケーション設定
    - variable: NEXT_PUBLIC_APP_URL
      secret: projects/caglla-fb/secrets/NEXT_PUBLIC_APP_URL/versions/latest
    
    # 外部API設定
    - variable: NEXT_PUBLIC_UNSPLASH_APP_ID
      secret: projects/caglla-fb/secrets/NEXT_PUBLIC_UNSPLASH_APP_ID/versions/latest
    - variable: NEXT_PUBLIC_UNSPLASH_ACCESS_KEY
      secret: projects/caglla-fb/secrets/NEXT_PUBLIC_UNSPLASH_ACCESS_KEY/versions/latest
    - variable: UNSPLASH_SECRET_KEY
      secret: projects/caglla-fb/secrets/UNSPLASH_SECRET_KEY/versions/latest
    - variable: TRIPADVISOR_API_KEY
      secret: projects/caglla-fb/secrets/TRIPADVISOR_API_KEY/versions/latest
    - variable: FOURSQUARE_API_KEY
      secret: projects/caglla-fb/secrets/FOURSQUARE_API_KEY/versions/latest
    - variable: SELECTPDF_API_KEY
      secret: projects/caglla-fb/secrets/SELECTPDF_API_KEY/versions/latest
    - variable: SENDGRID_API_KEY
      secret: projects/caglla-fb/secrets/SENDGRID_API_KEY/versions/latest

buildConfig:
  buildCommand: pnpm install --no-frozen-lockfile && pnpm run build
  outputDirectory: .next
  nodeVersion: 22
  # pnpmVersion: 10.18.3  # 特定のバージョンが必要な場合のみ指定
  dependencies:
    - "@google-cloud/secret-manager"
    - "@next/bundle-analyzer"
    - "@types/node"
    - "@types/react"
    - "@types/react-dom"
    - "autoprefixer"
    - "eslint"
    - "eslint-config-next"
    - "firebase"
    - "firebase-admin"
    - "next"
    - "postcss"
    - "react"
    - "react-dom"
    - "tailwindcss"
    - "typescript"
  scripts:
    - "build"
    - "dev"
    - "lint"
    - "start"
    - "setup-secrets"

# Firebase App Hosting バックエンド設定
backend:
  id: caglla
  rootDir: /
  ignore:
    - node_modules
    - .git
    - firebase-debug.log
    - firebase-debug.*.log
    - functions
```

## 🚀 ステップ6: Firebase App Hosting デプロイ

```bash
# 1. Firebase CLI インストール (未インストールの場合)
npm install -g firebase-tools

# 2. Firebase にログイン
firebase login

# 3. プロジェクトを設定
firebase use caglla-fb

# 4. App Hosting にデプロイ
firebase apphosting:backends:deploy caglla

# 5. デプロイ状況確認
firebase apphosting:releases:list --backend=caglla
```

## ✅ ステップ7: 動作確認

```bash
# 1. デプロイ完了後、アプリケーションURLを確認
firebase apphosting:backends:get caglla

# 2. ヘルスチェックエンドポイントをテスト
curl https://your-app-url/api/health

# 期待される応答:
# {"status":"ok","timestamp":"2025-01-24T01:00:00.000Z"}
```

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. 認証エラー
```bash
# エラー: Could not load the default credentials
# 解決方法:
gcloud auth application-default login
gcloud config set project caglla-fb
```

#### 2. 権限エラー
```bash
# エラー: Permission denied for Secret Manager
# 解決方法: サービスアカウント権限を再確認
gcloud projects get-iam-policy caglla-fb --flatten="bindings[].members" --format="table(bindings.role)" --filter="bindings.members:firebase-app-hosting-compute@caglla-fb.iam.gserviceaccount.com"
```

#### 3. ビルドエラー
```bash
# エラー: Environment validation failed
# 解決方法: ビルド時環境変数検証スキップが有効か確認
# ご自身のプロジェクトにおける環境変数バリデーションロジックをご確認ください
# 例: lib/core/env-validation.ts で isBuildTime() 関数が正しく動作しているか確認
```

#### 4. シークレットが見つからない
```bash
# エラー: Secret not found
# 解決方法: シークレット一覧を確認
gcloud secrets list --project=caglla-fb
```

## 🌍 環境別設定（オプション）

Firebase App Hostingは、環境固有の設定ファイルをサポートしています：

```bash
# 環境別設定ファイルの例
apphosting.staging.yaml    # ステージング環境用
apphosting.production.yaml # 本番環境用
```

**使用例:**
```yaml
# apphosting.staging.yaml
appConfig:
  name: caglla-staging
  version: 1.8.2-staging

runConfig:
  runtime: nodejs22
  env:
    - variable: NEXT_PUBLIC_APP_URL
      secret: projects/caglla-fb/secrets/NEXT_PUBLIC_APP_URL_STAGING/versions/latest
```

**デプロイコマンド:**
```bash
# ステージング環境にデプロイ
firebase apphosting:backends:deploy caglla-staging --config=apphosting.staging.yaml

# 本番環境にデプロイ
firebase apphosting:backends:deploy caglla --config=apphosting.production.yaml
```

## 📚 参考資料

- [Firebase App Hosting Documentation](https://firebase.google.com/docs/app-hosting)
- [Google Cloud Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [Firebase App Hosting Environment Variables](https://firebase.google.com/docs/app-hosting/environment-variables)
- [Google Cloud IAM Documentation](https://cloud.google.com/iam/docs)
- [Firebase CLI App Hosting Commands](https://firebase.google.com/docs/cli/apphosting)

## 🎯 次のステップ

1. **監視設定**: Google Cloud Monitoringでアプリケーション監視を設定
2. **ログ管理**: Google Cloud Loggingでログ集約・分析を設定
3. **セキュリティ**: Cloud Security Command Centerでセキュリティ監視を設定
4. **パフォーマンス**: Firebase Performance Monitoringでパフォーマンス監視を設定
5. **CI/CD**: GitHub ActionsやCloud Buildで自動デプロイパイプラインを構築

## ❓ よくある質問

### Q: `firebase apphosting:secrets:set`コマンドの詳細な動作について教えてください
A: このコマンドは以下の処理を自動的に実行します：
- シークレットの作成（存在しない場合）
- シークレットバージョンの追加
- Firebase App Hostingサービスアカウントへの`secretmanager.secretAccessor`権限の付与
- プロジェクト内でのシークレット参照の設定

### Q: 複数の環境（開発、ステージング、本番）で異なる環境変数を管理する際のベストプラクティスは？
A: 以下の方法を推奨します：
1. **環境別シークレット**: `NEXT_PUBLIC_API_KEY_STAGING`, `NEXT_PUBLIC_API_KEY_PRODUCTION`のように環境名をサフィックスに追加
2. **環境別設定ファイル**: `apphosting.staging.yaml`, `apphosting.production.yaml`を使用
3. **命名規則**: 一貫した命名規則を採用し、環境を明確に区別

### Q: `apphosting.yaml`の`buildConfig`セクションで`dependencies`と`scripts`を明示的に記述するメリットは？
A: 以下のメリットがあります：
- **依存関係の明確化**: 必要なパッケージが明示的に定義される
- **ビルドの最適化**: Firebase App Hostingが依存関係を事前に把握できる
- **デバッグの容易さ**: ビルドエラー時の原因特定が簡単
- **セキュリティ**: 不要なパッケージのインストールを防止

---

**注意**: このマニュアルは `caglla-fb` プロジェクト用に作成されています。他のプロジェクトで使用する場合は、プロジェクトIDとサービスアカウント名を適切に変更してください。
