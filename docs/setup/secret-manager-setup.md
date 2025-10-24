# Google Cloud Secret Manager + Firebase App Hosting セットアップガイド

## 🎯 概要

Firebase App Hostingで環境変数を安全に管理するために、Google Cloud Secret Managerと連携する方法です。

## 📋 前提条件

- Google Cloud プロジェクト: `caglla-fb`
- Firebase CLI がインストール済み
- Google Cloud CLI がインストール済み
- 適切な権限（Secret Manager Admin, Firebase Admin）

## 🔧 セットアップ手順

### 1. Google Cloud Secret Managerでシークレットを作成

#### 方法A: 自動セットアップスクリプトを使用（推奨）

```bash
# .env.localファイルに環境変数を設定
cp env.example .env.local
# .env.localを編集して必要な環境変数を設定

# Secret Managerにシークレットを自動登録
pnpm run setup-secrets
```

#### 方法B: 手動でGoogle Cloud Consoleから作成

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクト `caglla-fb` を選択
3. 左側メニュー → 「シークレット マネージャー」
4. 「シークレットを作成」をクリック
5. 各環境変数について以下を設定：
   - **名前**: `NEXT_PUBLIC_FIREBASE_API_KEY` など
   - **シークレットの値**: 実際のAPIキーなど

### 2. Firebase App Hostingサービスアカウントに権限を付与

1. [Google Cloud Console](https://console.cloud.google.com/) → IAMと管理 → IAM
2. `firebase-app-hosting-compute@caglla-fb.iam.gserviceaccount.com` を探す
3. 「編集」をクリック
4. 「ロールを追加」で以下を追加：
   - `Secret Manager シークレット アクセサー`
   - `Secret Manager シークレット バージョン マネージャー`

### 3. Firebase CLIでシークレットアクセス権を設定

```bash
# Firebase CLIでシークレットアクセス権を設定
firebase apphosting:secrets:set NEXT_PUBLIC_FIREBASE_API_KEY
firebase apphosting:secrets:set FIREBASE_PROJECT_ID
firebase apphosting:secrets:set NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
# ... 他の環境変数についても同様に実行
```

### 4. apphosting.yamlの設定確認

`apphosting.yaml`ファイルで以下のようにシークレットを参照：

```yaml
runConfig:
  env:
    - variable: NEXT_PUBLIC_FIREBASE_API_KEY
      secret: projects/caglla-fb/secrets/NEXT_PUBLIC_FIREBASE_API_KEY/versions/latest
    - variable: FIREBASE_PROJECT_ID
      secret: projects/caglla-fb/secrets/FIREBASE_PROJECT_ID/versions/latest
    # ... 他の環境変数
```

### 5. デプロイと動作確認

```bash
# Firebase App Hostingにデプロイ
firebase apphosting:backends:deploy

# デプロイ後の動作確認
# アプリケーションが正常に動作し、環境変数が正しく読み込まれていることを確認
```

## 🔍 トラブルシューティング

### よくある問題

1. **権限エラー**
   - Firebase App Hostingサービスアカウントに適切な権限が付与されているか確認
   - `firebase apphosting:secrets:set` コマンドでアクセス権を再設定

2. **シークレットが見つからない**
   - Secret Managerでシークレットが正しく作成されているか確認
   - `apphosting.yaml`のシークレットパスが正しいか確認

3. **ビルドエラー**
   - ビルド時の環境変数検証がスキップされているか確認
   - `lib/core/env-validation.ts`の設定を確認

### デバッグコマンド

```bash
# Secret Managerのシークレット一覧を確認
gcloud secrets list --project=caglla-fb

# 特定のシークレットの詳細を確認
gcloud secrets describe NEXT_PUBLIC_FIREBASE_API_KEY --project=caglla-fb

# Firebase App Hostingのバックエンド状態を確認
firebase apphosting:backends:list
```

## 📚 参考資料

- [Firebase App Hosting ドキュメント](https://firebase.google.com/docs/app-hosting)
- [Google Cloud Secret Manager ドキュメント](https://cloud.google.com/secret-manager/docs)
- [Firebase App Hosting 環境変数設定](https://firebase.google.com/docs/app-hosting/configure#environment-variables)
