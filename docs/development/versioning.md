# バージョニング方針

## 📋 概要

このドキュメントでは、Cagllaプロジェクトにおけるバージョニング方針を定義します。
本プロジェクトは **Semantic Versioning 2.0.0**（SemVer）に準拠し、
一貫性のあるバージョン管理とリリースプロセスを実現します。

---

## 🎯 目的

### なぜバージョニング方針が必要か

- **互換性の明示**: ユーザーや開発者に対して変更の影響範囲を明確に伝達
- **予測可能なリリース**: 計画的な開発とリリーススケジュールの管理
- **依存関係の管理**: パッケージ・API利用者が適切なバージョンを選択可能
- **サポート範囲の明確化**: どのバージョンがサポート対象かを明示

---

## 📏 Semantic Versioning 2.0.0

### バージョン番号の形式

```
MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]
```

**例**:
- `1.8.0` - 通常リリース
- `1.9.0-beta.1` - プレリリース
- `1.8.2+20251021` - ビルドメタデータ付き

---

## 🔢 バージョン番号の変更ルール

### MAJOR（メジャー）バージョン

**変更条件**: 互換性を破壊する変更（Breaking Changes）

**対象となる変更**:
- ✅ API仕様の非互換変更（Request/Responseの破壊的変更）
- ✅ URLスキーマの破壊（既存のURLルーティング規約の変更）
- ✅ Firestoreスキーマの非互換変更（データ移行が必要な変更）
- ✅ 環境変数の必須化または削除
- ✅ サポートするNode.jsバージョンの変更

**例**:
```
v1.8.0 → v2.0.0
- /api/itineraries のレスポンス形式を変更
- /trip/[id] から /[userSlug]/[tripSlug] への完全移行
- Firebase Auth v9 から v10 への移行
```

**リリース条件**:
- ⚠️ 重大な変更のため、リリースノートに詳細な移行ガイドを記載
- ⚠️ 可能な限り後方互換層を提供
- ⚠️ 事前にアナウンス期間を設ける

---

### MINOR（マイナー）バージョン

**変更条件**: 後方互換性を保った機能追加

**対象となる変更**:
- ✅ 新しいAPI Routeの追加
- ✅ 既存APIに任意パラメータの追加（デフォルト値あり）
- ✅ 新しいUIコンポーネントの追加
- ✅ 大規模なUI刷新（互換性を維持）
- ✅ 新しい環境変数の追加（オプショナル）
- ✅ 新しい機能モジュールの追加

**例**:
```
v1.8.0 → v1.9.0
- Places API多言語対応機能の追加
- チェックリスト機能の追加
- ルート最適化機能の追加（新プラン導入）
```

**リリース条件**:
- ✅ 既存機能に影響を与えない
- ✅ 既存のテストが全てパスする
- ✅ リリースノートに新機能の説明を記載

---

### PATCH（パッチ）バージョン

**変更条件**: バグ修正・内部改善（契約不変）

**対象となる変更**:
- ✅ バグ修正（クラッシュ、データ不整合、UIエラー）
- ✅ セキュリティパッチ
- ✅ パフォーマンス最適化
- ✅ 依存関係のマイナーアップデート
- ✅ ドキュメント修正
- ✅ 内部リファクタリング（外部影響なし）

**例**:
```
v1.8.1 → v1.8.2
- API認証の脆弱性修正
- Firestore timestamp型の安全化
- メモリリークの修正
```

**リリース条件**:
- ✅ 既存機能の動作を変更しない
- ✅ 外部から見える挙動は不変
- ⚠️ セキュリティパッチは迅速にリリース

---

## 🏷️ プレリリース・ビルドメタデータ

### プレリリースバージョン（-PRERELEASE）

**形式**: `MAJOR.MINOR.PATCH-PRERELEASE`

**用途**:
- アルファ版（`alpha.1`, `alpha.2`, ...）
- ベータ版（`beta.1`, `beta.2`, ...）
- リリース候補（`rc.1`, `rc.2`, ...）

**例**:
```
v1.9.0-alpha.1  # 初期アルファ版
v1.9.0-beta.1   # ベータ版
v1.9.0-rc.1     # リリース候補
v1.9.0          # 正式リリース
```

**特徴**:
- ⚠️ 本番環境での利用は非推奨
- ⚠️ 破壊的変更が含まれる可能性あり
- ✅ 開発・検証環境でのテストに最適

---

### ビルドメタデータ（+BUILD）

**形式**: `MAJOR.MINOR.PATCH+BUILD`

**用途**:
- ビルド日時（`+20251021`）
- コミットハッシュ（`+g1a2b3c4`）
- CI/CDビルド番号（`+build.123`）

**例**:
```
v1.8.2+20251021
v1.8.2+g1a2b3c4
v1.8.2+build.456
```

**特徴**:
- ℹ️ バージョン比較には影響しない
- ℹ️ デバッグ・追跡のための補足情報

---

## 🚀 リリースブランチとタギングプロセス

### リリースフロー

#### 1. 通常リリース（MINOR/MAJOR）

```bash
# 1. mainブランチで開発
git checkout main
git pull origin main

# 2. 機能開発完了後、リリース準備
# - CHANGELOG.md更新
# - package.jsonのバージョン更新
# - リリースノート作成（docs/releases/v1.9.0.md）

# 3. コミット・プッシュ
git add .
git commit -m "chore: release v1.9.0"
git push origin main

# 4. タグ作成
git tag -a v1.9.0 -m "Release v1.9.0 - Places多言語対応"
git push origin v1.9.0

# 5. GitHub Releaseの作成
# - GitHubのReleasesページで新規作成
# - タグ: v1.9.0
# - リリースノートを添付
```

---

#### 2. パッチリリース（PATCH）

```bash
# 1. サポートブランチにチェックアウト
git checkout support/v1.8
git pull origin support/v1.8

# 2. バグ修正・セキュリティパッチを実装
# - 修正コード
# - テスト追加

# 3. コミット・プッシュ
git add .
git commit -m "fix: セキュリティパッチ - API認証の追加"
git push origin support/v1.8

# 4. タグ作成
git tag -a v1.8.2 -m "Release v1.8.2 - Security Patch"
git push origin v1.8.2

# 5. mainへの反映（必要に応じて）
git checkout main
git cherry-pick <commit-hash>
git push origin main
```

---

#### 3. プレリリース

```bash
# 1. mainブランチで開発
git checkout main

# 2. プレリリースの準備
git add .
git commit -m "chore: pre-release v1.9.0-beta.1"
git push origin main

# 3. プレリリースタグ作成
git tag -a v1.9.0-beta.1 -m "Pre-release v1.9.0-beta.1"
git push origin v1.9.0-beta.1

# 4. GitHub Releaseで「This is a pre-release」をチェック
```

---

## 📊 変更種別の判定チェックリスト

### 変更を分類する

| 変更内容                        | MAJOR | MINOR | PATCH |
|--------------------------------|-------|-------|-------|
| API Request/Responseの変更    | ✅     |       |       |
| API任意パラメータの追加          |       | ✅     |       |
| 新しいAPI Routeの追加           |       | ✅     |       |
| URLルーティングの変更            | ✅     |       |       |
| Firestoreスキーマの非互換変更   | ✅     |       |       |
| 環境変数の必須化                | ✅     |       |       |
| 環境変数のオプション追加         |       | ✅     |       |
| 新機能追加（UI/UX含む）         |       | ✅     |       |
| バグ修正                        |       |       | ✅     |
| セキュリティパッチ              |       |       | ✅     |
| パフォーマンス最適化            |       |       | ✅     |
| 内部リファクタリング            |       |       | ✅     |
| ドキュメント修正                |       |       | ✅     |
| 依存関係マイナー更新            |       |       | ✅     |

---

## 🛠️ 実践例

### 例1: セキュリティパッチ

**シナリオ**: API認証の脆弱性を発見

**判定**:
- 外部から見える挙動は不変（認証チェックは本来あるべき動作）
- バグ修正に相当
- → **PATCH版アップ**

**対応**:
```bash
# support/v1.8で修正
git checkout support/v1.8
# 修正実装
git commit -m "fix: API認証の追加"
git tag v1.8.2
```

---

### 例2: Places多言語対応

**シナリオ**: Google Places APIの多言語対応機能を追加

**判定**:
- 新しい機能追加
- 既存の挙動には影響なし（オプション）
- → **MINOR版アップ**

**対応**:
```bash
# mainで開発
git checkout main
# 機能開発
git commit -m "feat: Places API多言語対応"
git tag v1.9.0
```

---

### 例3: URL移行

**シナリオ**: `/trip/[id]` から `/[userSlug]/[tripSlug]` への完全移行

**判定**:
- 既存のURLが無効化される
- 互換性破壊
- → **MAJOR版アップ**

**対応**:
```bash
# mainで実装
git checkout main
# URL移行 + 移行ガイド作成
git commit -m "feat!: URL移行 - スラッグベースに統一"
git tag v2.0.0
```

---

## 🔄 EOL・メンテナンスルール

### サポート期間

| バージョン種別 | アクティブサポート期間 | セキュリティサポート期間 | EOL後の扱い |
|--------------|---------------------|---------------------|-----------|
| MAJOR        | 次のMAJORまで        | +90日               | アーカイブ |
| MINOR        | 次のMINORまで        | +30日               | アーカイブ |
| PATCH        | 次のPATCHまで        | なし                | 即座に非推奨 |

**詳細**: `docs/development/eol-policy.md` を参照

---

### EOL後の対応

**ブランチ**:
- ✅ 削除せず保持（アーカイブ）
- ✅ ブランチ保護を解除
- ⚠️ 新規コミットは推奨しない

**タグ**:
- ✅ 全て保持
- ✅ GitHub Releaseにアーカイブ表示

**ドキュメント**:
- ⚠️ README.mdに「Archived」表示
- ℹ️ 移行先バージョンの案内

---

## 📚 Public APIの定義

### 本プロジェクトにおける「Public API」

Cagllaプロジェクトでは、以下を「Public API」として定義します：

#### 1. REST API Routes
- **場所**: `app/api/**/route.ts`
- **対象**: Request/Responseの仕様
- **例**: `/api/itineraries`, `/api/trips/[tripId]/route.ts`

#### 2. URLスキーマ
- **対象**: ルーティング規約
- **例**: `/[userSlug]/[tripSlug]`, `/user-settings`

#### 3. Firestoreスキーマ
- **対象**: 外部互換を要するコレクション・ドキュメント構造
- **例**: `users`, `trips`, `days`, `itineraries`

#### 4. 環境変数
- **対象**: 公開ドキュメント化された設定値
- **例**: `NEXT_PUBLIC_FIREBASE_API_KEY`, `FIREBASE_PROJECT_ID`

---

### Public APIに含まれないもの

- ❌ 内部関数・ユーティリティ（`lib/utils/`）
- ❌ コンポーネントのprops（UIの実装詳細）
- ❌ 内部データフロー（stateの管理方法）
- ❌ ビルド設定（webpack, Next.js config）

---

## 🎯 まとめ

### バージョニングの原則

1. **Semantic Versioning 2.0.0に準拠**
   - MAJOR: 互換破壊
   - MINOR: 機能追加
   - PATCH: バグ修正

2. **明確なリリースプロセス**
   - mainブランチ: MINOR/MAJOR開発
   - support/*ブランチ: PATCH専用

3. **透明性のあるEOL管理**
   - サポート期間の明示
   - 移行ガイドの提供

4. **Public APIの範囲定義**
   - REST API Routes
   - URLスキーマ
   - Firestoreスキーマ
   - 環境変数

---

## 🔗 関連ドキュメント

- **ブランチ戦略**: `docs/development/branch-strategy.md` - Git Flowベースのブランチ運用
- **EOLポリシー**: `docs/development/eol-policy.md` - サポートブランチのライフサイクル管理
- **リリースノート**: `docs/releases/` - 各バージョンの変更履歴

---

**最終更新**: 2025-10-21  
**適用開始**: v1.8.0以降

