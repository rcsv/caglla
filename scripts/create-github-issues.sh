#!/bin/bash

# GitHub Issue作成スクリプト
# 使用方法: ./scripts/create-github-issues.sh [issue-file.md]

set -e

ISSUE_FILE="$1"
REPO="rcsv/caglla"

if [ -z "$ISSUE_FILE" ]; then
  echo "使用方法: $0 <issue-file.md>"
  echo "例: $0 docs/issues/trip-editor-delete-button-not-working.md"
  exit 1
fi

if [ ! -f "$ISSUE_FILE" ]; then
  echo "エラー: ファイルが見つかりません: $ISSUE_FILE"
  exit 1
fi

# Markdownファイルからタイトルと本文を抽出
TITLE=$(head -n 1 "$ISSUE_FILE" | sed 's/^# //')
BODY=$(cat "$ISSUE_FILE")

# 状態を確認（未解決のIssueのみ作成）
if echo "$BODY" | grep -q "状態.*解決済み\|状態.*✅"; then
  echo "スキップ: このIssueは既に解決済みです"
  exit 0
fi

# ラベルを決定（ファイル名から推測）
LABELS=""
if echo "$ISSUE_FILE" | grep -q "i18n\|internationalization"; then
  LABELS="$LABELS,i18n"
fi
if echo "$ISSUE_FILE" | grep -q "feature"; then
  LABELS="$LABELS,enhancement"
fi
if echo "$ISSUE_FILE" | grep -q "bug\|error\|fix"; then
  LABELS="$LABELS,bug"
fi

# ラベルの先頭のカンマを削除
LABELS=$(echo "$LABELS" | sed 's/^,//')

echo "GitHub Issueを作成します..."
echo "タイトル: $TITLE"
echo "ラベル: ${LABELS:-なし}"

# GitHub CLIでIssueを作成
if [ -n "$LABELS" ]; then
  gh issue create \
    --repo "$REPO" \
    --title "$TITLE" \
    --body "$BODY" \
    --label "$LABELS"
else
  gh issue create \
    --repo "$REPO" \
    --title "$TITLE" \
    --body "$BODY"
fi

echo "✅ GitHub Issueを作成しました！"

