#!/bin/bash

# 複数のIssueを一括でGitHubに投稿するスクリプト
# 使用方法: ./scripts/batch-create-github-issues.sh

set -e

REPO="rcsv/caglla"
ISSUES_DIR="docs/issues"

# GitHub CLIがインストールされているか確認
if ! command -v gh &> /dev/null; then
  echo "エラー: GitHub CLI (gh) がインストールされていません"
  echo "インストール方法: sudo snap install gh"
  echo "または: https://cli.github.com/"
  exit 1
fi

# GitHub認証を確認
if ! gh auth status &> /dev/null; then
  echo "GitHub CLIの認証が必要です"
  echo "実行: gh auth login"
  exit 1
fi

echo "未解決のIssueをGitHubに投稿します..."
echo ""

# done/ディレクトリを除外して、未解決のIssueを検索
for issue_file in "$ISSUES_DIR"/*.md; do
  # README.mdとDIFFICULTY_RANKING.mdをスキップ
  if [[ "$(basename "$issue_file")" == "README.md" ]] || \
     [[ "$(basename "$issue_file")" == "DIFFICULTY_RANKING.md" ]]; then
    continue
  fi

  # 解決済みのIssueをスキップ
  if grep -q "状態.*解決済み\|状態.*✅" "$issue_file" 2>/dev/null; then
    echo "⏭️  スキップ: $(basename "$issue_file") (解決済み)"
    continue
  fi

  # タイトルを抽出
  TITLE=$(head -n 1 "$issue_file" | sed 's/^# //')
  
  # 本文を取得
  BODY=$(cat "$issue_file")

  # ラベルを決定
  LABELS=""
  if echo "$issue_file" | grep -q "i18n\|internationalization"; then
    LABELS="$LABELS,i18n"
  fi
  if echo "$issue_file" | grep -q "feature"; then
    LABELS="$LABELS,enhancement"
  fi
  if echo "$issue_file" | grep -q "bug\|error\|fix\|not.*working\|失敗"; then
    LABELS="$LABELS,bug"
  fi
  if echo "$issue_file" | grep -q "security"; then
    LABELS="$LABELS,security"
  fi

  # ラベルの先頭のカンマを削除
  LABELS=$(echo "$LABELS" | sed 's/^,//')

  echo "📝 作成中: $TITLE"
  
  # GitHub CLIでIssueを作成
  if [ -n "$LABELS" ]; then
    gh issue create \
      --repo "$REPO" \
      --title "$TITLE" \
      --body "$BODY" \
      --label "$LABELS" \
      --quiet || echo "⚠️  エラー: $(basename "$issue_file")"
  else
    gh issue create \
      --repo "$REPO" \
      --title "$TITLE" \
      --body "$BODY" \
      --quiet || echo "⚠️  エラー: $(basename "$issue_file")"
  fi

  # レート制限を避けるために少し待機
  sleep 1
done

echo ""
echo "✅ 完了しました！"

