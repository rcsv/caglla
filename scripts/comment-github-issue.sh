#!/bin/bash

# GitHub Issueにコメントを追加するスクリプト
# 使用方法: ./scripts/comment-github-issue.sh <issue-number> <comment-text>
# または: ./scripts/comment-github-issue.sh <issue-number> -f <comment-file.md>

set -e

ISSUE_NUMBER="$1"
REPO="rcsv/caglla"

if [ -z "$ISSUE_NUMBER" ]; then
  echo "使用方法: $0 <issue-number> <comment-text>"
  echo "または: $0 <issue-number> -f <comment-file.md>"
  echo "例: $0 44 \"CodeRabbitの提案を実装しました\""
  echo "例: $0 44 -f docs/issues/implementation-note.md"
  exit 1
fi

# コメント本文の取得
if [ "$2" = "-f" ] && [ -n "$3" ]; then
  # ファイルから読み込み
  if [ ! -f "$3" ]; then
    echo "エラー: ファイルが見つかりません: $3"
    exit 1
  fi
  COMMENT_BODY=$(cat "$3")
elif [ -n "$2" ]; then
  # 直接テキスト
  COMMENT_BODY="$2"
else
  echo "エラー: コメント本文を指定してください"
  exit 1
fi

# GitHub CLIが利用可能か確認
if ! command -v gh &> /dev/null; then
  echo "エラー: GitHub CLI (gh) がインストールされていません"
  echo "インストール方法: https://cli.github.com/"
  exit 1
fi

# 認証確認
if ! gh auth status &> /dev/null; then
  echo "エラー: GitHub CLIが認証されていません"
  echo "認証方法: gh auth login"
  exit 1
fi

echo "GitHub Issue #${ISSUE_NUMBER}にコメントを追加します..."
echo ""

# 一時ファイルを作成してコメント本文を保存
TEMP_FILE=$(mktemp /tmp/gh-issue-comment-XXXXXX.txt)
trap "rm -f $TEMP_FILE" EXIT
echo "$COMMENT_BODY" > "$TEMP_FILE"

# コメントを追加
if gh issue comment "$ISSUE_NUMBER" --repo "$REPO" --body-file "$TEMP_FILE"; then
  echo "✅ GitHub Issue #${ISSUE_NUMBER}にコメントを追加しました"
  echo "URL: https://github.com/${REPO}/issues/${ISSUE_NUMBER}"
else
  echo "❌ コメントの追加に失敗しました"
  exit 1
fi

