# ブランチ戦略

## 📋 概要

このプロジェクトでは、Git Flowをベースにしたブランチ戦略を採用しています。
安定版のサポートと新機能開発を並行して進めるため、サポートブランチを活用します。

---

## 🌳 ブランチ種別

### 1. `main` ブランチ（メイン開発ブランチ）

**目的**: 
- 最新の安定版コード
- 新機能開発の基盤

**マージ元**:
- `feature/*` ブランチ
- `refactor/*` ブランチ
- `docs/*` ブランチ

**保護設定**:
- ✅ Direct push禁止
- ✅ Pull Request必須
- ✅ レビュー必須

---

### 2. `support/v1.x` ブランチ（長期サポートブランチ）

**目的**:
- 特定のメジャー/マイナーバージョンの長期サポート
- セキュリティパッチとバグ修正のみ
- 新機能は追加しない

**現在のサポートブランチ**:
- `support/v1.8` - v1.8系のセキュリティ・バグ修正

**作業方法**:
- `support/v1.8` ブランチ上で直接実装
- コミット後にタグ作成（例: `v1.8.2`）

**リリースフロー**:
```
support/v1.8 → 修正実装 → コミット → push → v1.8.2タグ作成 → リリース
```

**保護設定**:
- ✅ 管理者のみpush可能
- ✅ 重要な変更はレビュー推奨
- ✅ タグ作成は慎重に実施

---

### 3. `feature/*` ブランチ（機能開発）

**命名規則**: `feature/機能名` または `feature/issue番号-機能名`

**例**:
- `feature/gmail-integration`
- `feature/calendar-sync`
- `feature/123-route-optimization`

**作成元**: `main`  
**マージ先**: `main`

**ライフサイクル**:
1. `main`からブランチ作成
2. 機能開発
3. Pull Request作成
4. レビュー・マージ
5. ブランチ削除

---

### 4. hotfix（緊急修正）

**実装場所**: `support/v1.x` ブランチ上で直接作業

**例**:
- `support/v1.8` で v1.8.2 のセキュリティパッチを実装
- `support/v1.8` で v1.8.3 の緊急バグ修正を実装

**ワークフロー**:
1. `support/v1.x`ブランチをcheckout
2. 修正実装・コミット
3. push & タグ作成（例: `v1.8.2`）
4. GitHub Releaseの作成
5. `main`に反映（必要に応じてcherry-pick）

**cherry-pickポリシー**:

**必須** - 即座にmainへcherry-pick:
- ✅ セキュリティパッチ（Critical/High）
- ✅ データ破損を引き起こすバグ修正
- ✅ 広範囲に影響するバグ修正

**任意** - ケースバイケースで判断:
- ⚠️ UIの軽微なバグ修正
- ⚠️ パフォーマンス最適化
- ⚠️ ドキュメント修正

**不要** - cherry-pickしない:
- ❌ 既にmainで修正済み
- ❌ support/*専用の後方互換対応
- ❌ 旧バージョン固有の問題

**注意**: 
- support/*ブランチは保護されているため、直接pushには権限が必要
- 小規模なパッチに適している
- 大規模な変更の場合は別途feature branchを検討

---

### 5. `refactor/*` ブランチ（リファクタリング）

**命名規則**: `refactor/対象範囲`

**例**:
- `refactor/type-safety-phase1`
- `refactor/component-structure`

**作成元**: `main`  
**マージ先**: `main`

---

### 6. `docs/*` ブランチ（ドキュメント）

**命名規則**: `docs/内容`

**例**:
- `docs/v1.12.0-specifications`
- `docs/api-documentation`

**作成元**: `main`  
**マージ先**: `main`

---

## 📊 バージョン管理とブランチの関係

### セマンティックバージョニング（SemVer）

```
v1.8.2
│ │ │
│ │ └─ PATCH: バグ修正、セキュリティパッチ
│ └─── MINOR: 新機能（後方互換）
└───── MAJOR: 破壊的変更
```

### ブランチとバージョンの対応

| バージョンタイプ | 開発ブランチ | リリースブランチ |
|-----------------|-------------|-----------------|
| MAJOR (v2.0.0) | `main` | `main` |
| MINOR (v1.9.0) | `main` | `main` |
| PATCH (v1.8.2) | `support/v1.8` | `support/v1.8` |

---

## 🔄 典型的なワークフロー

### 新機能開発（MINOR）

```bash
# 1. mainから機能ブランチを作成
git checkout main
git pull
git checkout -b feature/gmail-integration

# 2. 開発
git add .
git commit -m "feat: Gmail連携機能の実装"

# 3. Push & PR作成
git push -u origin feature/gmail-integration

# 4. レビュー・マージ後
git checkout main
git pull
git branch -d feature/gmail-integration
```

### セキュリティパッチ（PATCH）

```bash
# 1. サポートブランチをcheckout
git checkout support/v1.8
git pull

# 2. 修正実装
git add .
git commit -m "security: API認証・認可の実装"

# 3. Push
git push

# 4. タグ作成
git tag v1.8.2
git push origin v1.8.2

# 5. GitHub Releaseの作成（GitHubウェブUI）

# 6. mainにも反映（必要に応じて）
git checkout main
git cherry-pick <commit-hash>
git push
```

---

## 🎯 v1.8サポートブランチの運用

### 対象範囲

- **v1.8.0**: 初回リリース（2025-10-19）
- **v1.8.1**: 型安全性改善（2025-10-21）
- **v1.8.2**: セキュリティパッチ（予定）
- **v1.8.x**: 今後のバグ修正・セキュリティパッチ

### サポート期間

- **開始**: 2025年10月19日（v1.8.0リリース）
- **終了**: v1.10.0リリース時または2026年4月（いずれか早い方）

### 許可される変更

✅ **許可**:
- セキュリティパッチ
- バグ修正
- ドキュメント更新
- 型安全性改善（既存機能の範囲内）

❌ **禁止**:
- 新機能の追加
- 破壊的変更
- 大規模なリファクタリング

---

## 🚀 リリースプロセス

### MINOR/MAJOR リリース（mainから）

1. **準備**
   - `package.json`のバージョン更新
   - リリースノート作成（`docs/releases/vX.Y.0.md`）
   - `AGENTS.md`更新

2. **リリース**
   - mainブランチからタグ作成
   - GitHub Releaseの作成
   - デプロイ

3. **サポートブランチ作成**（必要に応じて）
   - `support/vX.Y`ブランチを作成

### PATCH リリース（support/v1.xから）

1. **準備**
   - hotfixブランチで修正実装
   - `package.json`のバージョン更新
   - リリースノート作成

2. **リリース**
   - support/v1.xブランチへマージ
   - タグ作成
   - GitHub Releaseの作成
   - デプロイ

3. **mainへの反映**（必要に応じて）
   - cherry-pickまたはマージ

---

## 📝 ベストプラクティス

### コミットメッセージ

Conventional Commitsに従う：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type**:
- `feat`: 新機能
- `fix`: バグ修正
- `security`: セキュリティ修正
- `refactor`: リファクタリング
- `docs`: ドキュメント
- `test`: テスト
- `chore`: その他

**例**:
```bash
security: API認証・認可の実装

app/api/itineraries/route.tsに以下を追加:
- Bearer token検証
- day → trip 所有権確認
- 適切なエラーハンドリング

Closes #26
```

### ブランチの保護

**保護すべきブランチ**:
- `main`
- `support/v*`

**保護設定**:
- Require pull request before merging
- Require approvals (1+)
- Require status checks to pass
- Require conversation resolution before merging
- Do not allow bypassing the above settings

---

## 🔗 関連リンク

### 内部ドキュメント
- **EOLポリシー**: `docs/development/eol-policy.md` - サポートブランチのライフサイクル管理
- **バージョニング方針**: `docs/development/versioning.md` - セマンティックバージョニング詳細
- **リリースプロセス**: `docs/development/release-process.md` - リリース手順（作成予定）

### 外部リファレンス
- **セマンティックバージョニング**: https://semver.org/
- **Git Flow**: https://nvie.com/posts/a-successful-git-branching-model/
- **Conventional Commits**: https://www.conventionalcommits.org/
- **GitHub Flow**: https://guides.github.com/introduction/flow/

---

**最終更新**: 2025年10月21日  
**管理者**: リポジトリオーナー

