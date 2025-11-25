#!/bin/bash

# ファイルの行数をカウントし、多い順に並べるスクリプト
# Usage: ./scripts/count-lines.sh [options]
#
# Options:
#   --all       すべてのファイルを対象にする（gitignoreされたファイルも含む）
#   --ext EXT   特定の拡張子のみを対象にする（例: --ext ts,tsx,js）
#   --min NUM   指定行数以上のファイルのみ表示（例: --min 100）
#   --top NUM   上位N件のみ表示（例: --top 20）
#   --help      ヘルプを表示

set -e

# デフォルト設定
USE_GIT=true
EXTENSION=""
MIN_LINES=0
TOP_N=0
SHOW_TOTAL=true

# 色設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ヘルプ表示
show_help() {
    echo -e "${CYAN}ファイル行数カウンター${NC}"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --all           すべてのファイルを対象にする（gitignoreされたファイルも含む）"
    echo "  --ext EXT       特定の拡張子のみを対象にする（カンマ区切り、例: --ext ts,tsx,js）"
    echo "  --min NUM       指定行数以上のファイルのみ表示（例: --min 100）"
    echo "  --top NUM       上位N件のみ表示（例: --top 20）"
    echo "  --no-total      合計行数を表示しない"
    echo "  --help          このヘルプを表示"
    echo ""
    echo "Examples:"
    echo "  $0                          # Git管理下のすべてのファイルをカウント"
    echo "  $0 --ext ts,tsx             # TypeScriptファイルのみカウント"
    echo "  $0 --min 100 --top 10       # 100行以上のファイルの上位10件を表示"
    echo "  $0 --all --ext js,ts        # gitignore無視でJS/TSファイルをカウント"
    exit 0
}

# オプション解析
while [[ $# -gt 0 ]]; do
    case $1 in
        --all)
            USE_GIT=false
            shift
            ;;
        --ext)
            EXTENSION="$2"
            shift 2
            ;;
        --min)
            MIN_LINES="$2"
            shift 2
            ;;
        --top)
            TOP_N="$2"
            shift 2
            ;;
        --no-total)
            SHOW_TOTAL=false
            shift
            ;;
        --help)
            show_help
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# プロジェクトルートに移動
cd "$(dirname "$0")/.."

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📊 ファイル行数カウンター${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ファイルリスト取得
if [ "$USE_GIT" = true ]; then
    echo -e "${BLUE}🔍 Git管理下のファイルを検索中...${NC}"
    FILE_LIST=$(git ls-files)
else
    echo -e "${BLUE}🔍 すべてのファイルを検索中...${NC}"
    FILE_LIST=$(find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/.next/*" | sed 's|^\./||')
fi

# 拡張子フィルタリング
if [ -n "$EXTENSION" ]; then
    echo -e "${BLUE}🎯 対象拡張子: ${YELLOW}${EXTENSION}${NC}"
    # カンマ区切りを | 区切りに変換してgrepパターンを作成
    EXT_PATTERN=$(echo "$EXTENSION" | sed 's/,/\\|/g')
    FILE_LIST=$(echo "$FILE_LIST" | grep "\.\($EXT_PATTERN\)$" || true)
fi

# 一時ファイル作成
TEMP_FILE=$(mktemp)
trap "rm -f $TEMP_FILE" EXIT

# ファイルごとに行数をカウント
echo -e "${BLUE}📝 行数をカウント中...${NC}"
echo ""

TOTAL_LINES=0
FILE_COUNT=0

# ロックファイルと.mdファイルを除外
FILE_LIST=$(echo "$FILE_LIST" | grep -v lock | grep -v '\.md$' | grep -v '\.jpg$' | grep -v '\.png$' | grep -v '\.jpeg$' || true)

while IFS= read -r file; do
    if [ -f "$file" ]; then
        lines=$(wc -l < "$file" 2>/dev/null || echo 0)
        if [ "$lines" -ge "$MIN_LINES" ]; then
            echo "$lines $file" >> "$TEMP_FILE"
            TOTAL_LINES=$((TOTAL_LINES + lines))
            FILE_COUNT=$((FILE_COUNT + 1))
        fi
    fi
done <<< "$FILE_LIST"

# ソート（行数の多い順）
sort -rn "$TEMP_FILE" > "${TEMP_FILE}.sorted"

# 結果表示
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📋 結果${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ヘッダー
printf "${CYAN}%-10s${NC}  ${CYAN}%s${NC}\n" "行数" "ファイル"
printf "${CYAN}%-10s${NC}  ${CYAN}%s${NC}\n" "----------" "----------------------------------------"

# ファイル一覧表示
COUNT=0
while IFS= read -r line; do
    COUNT=$((COUNT + 1))
    if [ "$TOP_N" -gt 0 ] && [ "$COUNT" -gt "$TOP_N" ]; then
        break
    fi
    
    lines=$(echo "$line" | awk '{print $1}')
    file=$(echo "$line" | cut -d' ' -f2-)
    
    # 色分け（行数に応じて）
    if [ "$lines" -ge 1000 ]; then
        COLOR=$RED
    elif [ "$lines" -ge 500 ]; then
        COLOR=$YELLOW
    elif [ "$lines" -ge 200 ]; then
        COLOR=$MAGENTA
    else
        COLOR=$NC
    fi
    
    printf "${COLOR}%-10s${NC}  %s\n" "$lines" "$file"
done < "${TEMP_FILE}.sorted"

# 統計情報
if [ "$SHOW_TOTAL" = true ]; then
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📊 統計情報${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "総ファイル数: ${YELLOW}${FILE_COUNT}${NC} ファイル"
    echo -e "総行数:       ${YELLOW}${TOTAL_LINES}${NC} 行"
    
    if [ "$FILE_COUNT" -gt 0 ]; then
        AVG_LINES=$((TOTAL_LINES / FILE_COUNT))
        echo -e "平均行数:     ${YELLOW}${AVG_LINES}${NC} 行/ファイル"
    fi
    
    if [ "$TOP_N" -gt 0 ] && [ "$FILE_COUNT" -gt "$TOP_N" ]; then
        echo -e "${BLUE}※ 上位${TOP_N}件のみ表示しています${NC}"
    fi
fi

echo ""

