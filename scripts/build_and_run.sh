#!/usr/bin/env bash
# Build and run the application safely from any working directory (macOS/Linux).
set -e

echoprefix="[build & run] "

# ───────────────────────────────
# Prepare logs directory and logfile
# ───────────────────────────────
timestamp=$(date +"%Y%m%d_%H%M")
logdir="logs"
logfile="$logdir/build_${timestamp}.log"

mkdir -p "$logdir"

echo "$echoprefix Logging to $logfile..."
exec > >(tee -i "$logfile") 2>&1

echo "$echoprefix Starting build and run script..."

# ───────────────────────────────
# Resolve script location → project root
# ───────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"
echo "$echoprefix Working from: $PROJECT_ROOT"

# ───────────────────────────────
# Load environment variables (.env)
# ───────────────────────────────
load_dotenv() {
  echo "$echoprefix Loading environment variables from $1"
  while IFS='=' read -r key value; do
    if [ -z "$key" ] || echo "$key" | grep -qE '^\s*#'; then
      continue
    fi
    # export しない行をスキップ（keyが空とかスペースのみ）
    if ! echo "$key" | grep -qE '^[A-Za-z_][A-Za-z0-9_]*$'; then
      echo "$echoprefix ⚠ Invalid .env line skipped: $key"
      continue
    fi
    value=$(printf '%s' "$value" | sed -E 's/^"(.*)"$/\1/')
    value=$(printf '%s' "$value" | sed -E "s/^'(.*)'$/\1/")
    export "$key=$value"
  done < "$1"
}

if [ -f "$PROJECT_ROOT/.env" ]; then
  load_dotenv "$PROJECT_ROOT/.env"
else
  echo "$echoprefix Warning: .env file not found."
fi

# ───────────────────────────────
# Dependency installation
# ───────────────────────────────
if [ -d node_modules ]; then
  echo "$echoprefix Removing existing node_modules..."
  rm -rf node_modules
fi

echo "$echoprefix Installing dependencies..."
npm install

# ───────────────────────────────
# Build steps: TypeScript, SCSS
# ───────────────────────────────
echo "$echoprefix Compiling TypeScript..."
npx tsc

echo "$echoprefix Compiling SCSS..."
if [ -d scss ]; then
  npx sass scss:public/css
else
  echo "$echoprefix No scss directory found. Skipping."
fi

# ───────────────────────────────
# MySQL migrations
# ───────────────────────────────
echo "$echoprefix Applying SQL migrations..."
if command -v mysql >/dev/null; then
  for file in "$SCRIPT_DIR"/migrations/*.sql; do
    if [ -f "$file" ]; then
      echo "$echoprefix → $file"
      mysql --host="$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$file"
    fi
  done
else
  echo "$echoprefix mysql not found. Skipping DB migration."
fi

# ───────────────────────────────
# Final build & run
# ───────────────────────────────
echo "$echoprefix Running build and starting server..."
npm run build && npm start
