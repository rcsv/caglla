# GitHub Issueへの投稿方法

このドキュメントでは、`docs/issues/`ディレクトリにあるIssueファイルをGitHub Issueとして投稿する方法を説明します。

---

## 📋 前提条件

### 1. GitHub CLIのインストール

```bash
# Ubuntu/Debian
sudo snap install gh

# または、公式サイトからインストール
# https://cli.github.com/
```

### 2. GitHub CLIの認証

```bash
# 初回認証
gh auth login

# 認証状態の確認
gh auth status
```

---

## 🚀 使用方法

### 方法1: 単一のIssueを投稿

```bash
# 特定のIssueファイルをGitHubに投稿
./scripts/create-github-issues.sh docs/issues/trip-editor-delete-button-not-working.md
```

### 方法2: 未解決のIssueを一括投稿

```bash
# docs/issues/内の未解決のIssueをすべてGitHubに投稿
./scripts/batch-create-github-issues.sh
```

**注意**: このスクリプトは以下のIssueをスキップします：
- `README.md`と`DIFFICULTY_RANKING.md`
- 状態が「解決済み」または「✅」とマークされているIssue
- `done/`ディレクトリ内のIssue

---

## 🔧 スクリプトの動作

### `create-github-issues.sh`
- 単一のIssueファイルを受け取る
- Markdownファイルからタイトルと本文を抽出
- 解決済みのIssueはスキップ
- ファイル名から自動的にラベルを推測（i18n, bug, enhancement, security）

### `batch-create-github-issues.sh`
- `docs/issues/`ディレクトリ内のすべての`.md`ファイルを処理
- 未解決のIssueのみを投稿
- レート制限を避けるために各Issue作成後に1秒待機

---

## 🏷️ ラベルの自動付与

スクリプトはファイル名からラベルを自動的に推測します：

| ファイル名に含まれる文字列 | ラベル |
|---------------------------|--------|
| `i18n`, `internationalization` | `i18n` |
| `feature` | `enhancement` |
| `bug`, `error`, `fix`, `not.*working`, `失敗` | `bug` |
| `security` | `security` |

---

## ⚠️ 注意事項

1. **重複投稿の防止**
   - スクリプトは既存のGitHub Issueをチェックしません
   - 手動で重複を確認してください

2. **レート制限**
   - GitHub APIにはレート制限があります
   - 大量のIssueを一括投稿する場合は、時間をかけて実行してください

3. **解決済みIssueの処理**
   - 解決済みのIssueは自動的にスキップされます
   - GitHub Issueとして投稿する必要がある場合は、Markdownファイルの状態を一時的に変更してください

4. **認証**
   - GitHub CLIの認証が必要です
   - `gh auth login`を実行して認証してください

---

## 📝 手動での投稿方法

GitHub CLIが使えない場合、以下の方法で手動で投稿できます：

1. GitHubのリポジトリページに移動: https://github.com/rcsv/caglla
2. 「Issues」タブをクリック
3. 「New issue」をクリック
4. Markdownファイルの内容をコピー&ペースト
5. 適切なラベルを付与
6. 「Submit new issue」をクリック

---

## 🔍 トラブルシューティング

### GitHub CLIが見つからない
```bash
# インストール確認
which gh

# インストール
sudo snap install gh
```

### 認証エラー
```bash
# 認証状態を確認
gh auth status

# 再認証
gh auth login
```

### レート制限エラー
- 時間を置いてから再実行してください
- または、手動で投稿してください

---

## 📚 関連ドキュメント

- [GitHub CLI公式ドキュメント](https://cli.github.com/manual/)
- [GitHub Issues API](https://docs.github.com/en/rest/issues/issues)

