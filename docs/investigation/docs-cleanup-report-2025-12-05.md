# docsディレクトリ整理レポート

**調査日**: 2025-12-05  
**調査対象**: `/docs` ディレクトリ（267ファイル）  
**保存場所**: `docs/investigation/docs-cleanup-report-2025-12-05.md`

---

## 📊 調査結果サマリー

### ファイル数内訳
- **全Markdownファイル**: 267ファイル
- **issues/**: 117ファイル（全体の44%）
- **planning/**: 23ファイル
- **refactoring/**: 19ファイル
- **releases/**: 18ファイル
- **specifications/**: 20ファイル
- **その他**: 70ファイル

### 主な問題点

#### 1. **重複ドキュメント**
- `CHANGES_SUMMARY.md` / `CHANGES_DETAILED.md` / `CHANGELOG.md`
  - **問題**: 同じ変更内容が3つのファイルに重複記載
  - **推奨**: `CHANGES_SUMMARY.md`と`CHANGES_DETAILED.md`は一時的なコミット計画用のため、実装完了後は削除またはアーカイブを検討
  - **影響**: メンテナンスコスト増、情報の不整合リスク

#### 2. **解決済みIssueの未整理**
- **問題**: `issues/`ディレクトリに117ファイルあるが、`issues/done/`に移動されているのは4ファイルのみ
- **推奨**: 解決済みのIssueファイルを`done/`ディレクトリに移動
- **影響**: アクティブなIssueと解決済みIssueの区別が困難

#### 3. **実装済み計画書の残存**
- **問題**: v3.0.0は既にリリース済み（2025年1月）だが、以下の計画書が残存
  - `planning/v3-architecture-vision.md` - v3.0.0のアーキテクチャ構想（実装済み）
  - `planning/v3-implementation-order.md` - 実装順序（実装済み）
  - `planning/v3-phase2-ui-implementation.md` - Phase 2実装計画（実装済み）
  - `planning/v3-trip-detail-ux.md` - UX方針（実装済み）
  - `planning/v3-api-testing-plan.md` - APIテスト計画（実装済み）
  - `planning/v3-testing-vs-implementation-priority.md` - 優先順位分析（実装済み）
- **推奨**: 実装済みの計画書は`planning/archive/`に移動、または削除を検討
- **影響**: 現在の計画と過去の計画の区別が困難

#### 4. **一時的なドキュメントの残存**
- **問題**: 以下のファイルは一時的な作業用ドキュメントの可能性
  - `COMMIT_PLAN.md` - コミット計画（実装完了後は不要）
  - `PULL_REQUEST_v1.8.2.md` - 古いPR用ドキュメント（v1.8.2は既にリリース済み）
  - `PULL_REQUEST_v3.1.md` - 最新のPR用ドキュメント（v3.1.0は既にリリース済み）
  - `BUILD_ERROR_INVESTIGATION.md` - ビルドエラー調査（解決済みの可能性）
- **推奨**: 実装完了後は削除または`docs/archive/`に移動
- **影響**: 不要なファイルが残り、検索性が低下

#### 5. **古いリリースノート**
- **問題**: v1.6.2, v1.6.3, v1.7.0, v1.7.1, v1.7.2など古いバージョンのリリースノートが残存
- **推奨**: 最新3-5バージョンのみ保持、古いものは`releases/archive/`に移動
- **影響**: 検索性は低下するが、履歴としての価値はある

---

## 🎯 整理推奨事項

### 優先度: 高

#### 1. 解決済みIssueの整理
- **アクション**: `issues/README.md`に記載されている「解決済み」Issueを`issues/done/`に移動
- **対象ファイル数**: 約26-30ファイル（README.mdの統計より）
- **効果**: アクティブなIssueの可視性向上

#### 2. 重複ドキュメントの統合
- **アクション**: 
  - `CHANGES_SUMMARY.md`と`CHANGES_DETAILED.md`を削除または`docs/archive/`に移動
  - `CHANGELOG.md`のみを正式な変更履歴として保持
- **効果**: メンテナンスコスト削減、情報の一貫性向上

#### 3. 実装済み計画書のアーカイブ
- **アクション**: v3.0.0関連の実装済み計画書を`planning/archive/`に移動
- **対象ファイル**: 6ファイル（v3-*で始まるplanning/内のファイル）
- **効果**: 現在の計画と過去の計画の区別が明確に

### 優先度: 中

#### 4. 一時的なドキュメントの整理
- **アクション**: 
  - `COMMIT_PLAN.md`を削除またはアーカイブ
  - 古いPR用ドキュメント（`PULL_REQUEST_v1.8.2.md`など）を`docs/archive/`に移動
  - `BUILD_ERROR_INVESTIGATION.md`を確認し、解決済みならアーカイブ
- **効果**: 検索性向上

#### 5. 古いリリースノートのアーカイブ
- **アクション**: v1.x系のリリースノートを`releases/archive/`に移動（最新5バージョンのみ保持）
- **効果**: 検索性向上（ただし、履歴としての価値は維持）

### 優先度: 低

#### 6. リファクタリング計画書の整理
- **アクション**: `refactoring/`ディレクトリ内の実装済み計画書を確認し、アーカイブ
- **注意**: 実装状況を確認してから判断

---

## 📈 期待される効果

### ファイル数削減
- **現在**: 267ファイル
- **削減見込み**: 約30-40ファイル（11-15%削減）
- **アーカイブ見込み**: 約20-30ファイル

### メンテナンス性向上
- アクティブなドキュメントとアーカイブの明確な分離
- 重複情報の削減による更新コスト削減
- 検索性の向上

### 情報の一貫性向上
- 単一の情報源（Single Source of Truth）の確立
- 古い情報と新しい情報の混在を防止

---

## 🔍 詳細分析

### issues/ディレクトリの詳細

#### 解決済みIssue（移動推奨）
`issues/README.md`によると、以下のIssueが解決済みと記載：
- `home-page-components-i18n.md`
- `trip-slug-page-button-styling-inconsistent.md`
- `profile-language-selector-visibility.md`
- `checklist-i18n.md`
- `itinerary-card-reservation-visual-feedback.md`
- `distance-display-i18n.md`
- `reservation-display-i18n.md`
- その他約20ファイル

#### 未解決Issue（保持）
- `profile-private-trips-not-displaying.md`
- `i18n-namespace-splitting-and-typed-loader.md`
- `itinerary-currency-inference-weak.md`
- その他約8ファイル

### planning/ディレクトリの詳細

#### 実装済み計画書（アーカイブ推奨）
- `v3-architecture-vision.md` - v3.0.0実装済み
- `v3-implementation-order.md` - v3.0.0実装済み
- `v3-phase2-ui-implementation.md` - v3.0.0実装済み
- `v3-trip-detail-ux.md` - v3.0.0実装済み
- `v3-api-testing-plan.md` - v3.0.0実装済み
- `v3-testing-vs-implementation-priority.md` - v3.0.0実装済み

#### 未実装計画書（保持）
- `validation-phase4-options.md` - 未実装
- `auth-provider-migration-plan.md` - v3.0.0で一部実装済みだが、完全移行は未完了
- その他

---

## 📝 実装手順（推奨）

### ステップ1: アーカイブディレクトリの作成
```bash
mkdir -p docs/archive
mkdir -p docs/issues/archive
mkdir -p docs/planning/archive
mkdir -p docs/releases/archive
```

### ステップ2: 解決済みIssueの移動
```bash
# 方法1: issues/README.mdに記載されている解決済みIssueを確認し、done/に移動
# （手動で確認が必要）

# 方法2: ファイル内に "解決済み" や "Status: Done" が含まれるIssueを検索
grep -l "解決済み\|Status: Done\|Status: ✅" docs/issues/*.md | xargs -I {} mv {} docs/issues/done/

# 注意: 移動前に内容を確認すること
```

### ステップ3: 重複ドキュメントの整理
```bash
mv docs/CHANGES_SUMMARY.md docs/archive/
mv docs/CHANGES_DETAILED.md docs/archive/
# CHANGELOG.mdは保持
```

### ステップ4: 実装済み計画書のアーカイブ
```bash
mv docs/planning/v3-*.md docs/planning/archive/
```

### ステップ5: 一時的なドキュメントの整理
```bash
# 重複CHANGES系の整理
mv docs/CHANGES_SUMMARY.md docs/archive/
mv docs/CHANGES_DETAILED.md docs/archive/

# 一時的なコミット計画
mv docs/COMMIT_PLAN.md docs/archive/

# 古いPR用ドキュメント
mv docs/PULL_REQUEST_v1.8.2.md docs/archive/
# PULL_REQUEST_v3.1.mdは最新のため、保持またはアーカイブを検討

# 調査レポート（解決済みの場合）
# mv docs/BUILD_ERROR_INVESTIGATION.md docs/archive/
```

### ステップ6: 一括コマンド（注意して実行）
```bash
# ⚠️ 実行前に各ファイルの内容を確認すること

# v3関連計画書の一括アーカイブ
mv docs/planning/v3-*.md docs/planning/archive/

# 解決済みIssueの移動（Status: Done が含まれるファイル）
grep -l "解決済み\|Status: Done\|Status: ✅" docs/issues/*.md 2>/dev/null | \
  xargs -I {} sh -c 'mv {} docs/issues/done/ 2>/dev/null || true'
```

---

## 📋 運用ルールの定義

### アーカイブ（Archive）とは

**Archive とは：**
- 情報としての利用頻度が低い
- 現行仕様/現行計画とは直接関係しない
- 参照価値はある（履歴として）
  → 以上すべて満たす場合のみ `archive/` に移動

**アーカイブの目的**:
- アクティブなドキュメントと過去のドキュメントを明確に分離
- 検索性を維持しながら、現在の開発を妨げない状態を保つ
- 履歴としての価値を保持（削除しない）

---

### 削除 vs アーカイブの仕分け基準

| 状態 | 処理 | 理由 |
|------|------|------|
| 実装計画のように「事後に価値が薄いメモ」 | **削除でOK** | 実装完了後は参照頻度が極めて低い |
| 仕様の転換点になった計画 | **archive/** | 設計判断の履歴として価値がある |
| バグ報告（issues/） | **すべて archive/**、削除しない | 問題解決の経緯として重要 |
| リリースノート | **最新5バージョンのみ保持、古いものは archive/** | 履歴としての価値は高い |
| 一時的なコミット計画（CHANGES_*） | **削除または archive/** | 実装完了後は CHANGELOG.md に統合済み |
| 調査レポート（BUILD_ERROR_INVESTIGATION.md など） | **解決済みなら archive/** | 同様の問題発生時に参考になる |

**判断の目安**:
- 「2年後の自分がこのファイルを参照する可能性は？」→ あるなら archive/
- 「このファイルがなくなっても困らない？」→ 困らないなら削除可

---

### CI による検知（推奨）

未来の「整理漏れ」を防ぐため、GitHub Actions で以下のチェックを追加することを推奨：

```yaml
# .github/workflows/docs-check.yml
name: Docs Quality Check

on:
  pull_request:
    paths:
      - 'docs/**'

jobs:
  check-duplicate-changes:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 2
      
      - name: Check for duplicate change logs
        run: |
          if git diff --name-only HEAD~1 | grep -E "CHANGES_(SUMMARY|DETAILED)\.md"; then
            echo "::warning::重複変更ログが追加されました。CHANGELOG.md に統合してください。"
            exit 1
          fi
      
      - name: Check for new issues in wrong location
        run: |
          if git diff --name-only HEAD~1 | grep -E "^docs/issues/[^/]+\.md$" && ! git diff --name-only HEAD~1 | grep -E "^docs/issues/done/"; then
            echo "::info::新しいIssueが追加されました。解決後は issues/done/ に移動してください。"
          fi
```

**検知項目**:
- `CHANGES_SUMMARY.md` / `CHANGES_DETAILED.md` の追加 → 警告
- `docs/issues/` に新規Issue追加 → 情報通知（解決後は `done/` に移動を促す）
- `planning/` に実装済み計画書が残存 → 手動チェック推奨

---

## ⚠️ 注意事項

1. **削除前の確認**: 削除する前に、各ファイルが本当に不要かどうかを確認
2. **Git履歴の保持**: 削除してもGit履歴には残るため、必要に応じて復元可能
3. **外部参照の確認**: 他のドキュメントやコードから参照されているファイルは削除しない
4. **段階的な実施**: 一度にすべてを整理せず、段階的に実施することを推奨
5. **アーカイブの定期見直し**: 年1回程度、アーカイブの内容を見直し、本当に不要なものは削除を検討

---

## 📊 整理後の予想構成

```
docs/
├── archive/                    # アーカイブ（新規作成）
│   ├── CHANGES_SUMMARY.md
│   ├── CHANGES_DETAILED.md
│   ├── COMMIT_PLAN.md
│   └── PULL_REQUEST_v1.8.2.md
├── issues/
│   ├── done/                  # 解決済みIssue（4→30ファイルに増加予定）
│   ├── archive/               # 古いIssue（新規作成、オプション）
│   └── [アクティブなIssue]    # 約8-10ファイル
├── planning/
│   ├── archive/               # 実装済み計画書（新規作成）
│   │   └── v3-*.md            # 6ファイル
│   └── [アクティブな計画書]    # 約17ファイル
├── releases/
│   ├── archive/               # 古いリリースノート（新規作成、オプション）
│   └── [最新5バージョン]       # 約5ファイル
└── [その他のディレクトリ]      # 変更なし
```

---

## 📚 情報分類表

`docs/` ディレクトリ内のドキュメントは、以下の分類軸で管理します：

| 分類 | ディレクトリ | 説明 | ライフサイクル |
|------|------------|------|--------------|
| **仕様（現行）** | `specifications/` | 現在実装されている機能の仕様書 | 機能が存在する限り保持 |
| **決定（Decision Log）** | `architecture/` | アーキテクチャの決定事項 | 決定事項として保持 |
| **計画（planning）** | `planning/` | 実装予定の計画書 | 実装完了後7日以内に archive/ へ移動 |
| **変更履歴（CHANGELOG）** | `CHANGELOG.md` | 公式の変更履歴 | 永続的に保持 |
| **問題追跡（issues）** | `issues/` | バグ報告・機能要望 | 解決後は `issues/done/` へ移動 |
| **調査レポート（investigation）** | `investigation/` | 問題調査の記録 | 解決後は archive/ へ移動 |
| **リリースノート** | `releases/` | バージョン別のリリースノート | 最新5バージョンのみ保持、古いものは archive/ |
| **アーカイブ** | `archive/` | 過去のドキュメント | 参照頻度が低いが履歴として保持 |

**分類の原則**:
- 1つのドキュメントは1つの分類に属する
- 分類が曖昧な場合は、最も参照頻度が高い分類を選択
- 実装完了後は、計画書は必ず archive/ に移動

---

## 🔄 継続的なメンテナンス

### 定期チェック（推奨）

- **週次**: 新規追加されたドキュメントの分類確認
- **月次**: 解決済みIssueの `done/` への移動
- **四半期**: 実装済み計画書の archive/ への移動
- **年次**: アーカイブの見直し（本当に不要なものは削除検討）

### 整理のタイミング

- **実装完了時**: 計画書を即座に archive/ へ移動
- **Issue解決時**: 解決済みIssueを `done/` へ移動
- **リリース時**: 古いリリースノートを archive/ へ移動（最新5バージョンのみ保持）

---

**最終更新**: 2025-12-05  
**作成者**: AI Assistant  
**保存場所**: このレポートは `docs/investigation/` に保存することを推奨（メンテした人の意図が残る）

