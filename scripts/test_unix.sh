#!/bin/sh
# Build and run the application for testing on Unix-like systems.
# Compiles TypeScript and SCSS, then runs npm build and start.
set -e

# Load environment variables from .env if it exists
if [ -f .env ]; then
  echo "Loading environment variables from .env"
  # export variables defined in .env
  set -a
  . ./.env
  set +a
fi

# Clean existing modules and reinstall dependencies
if [ -d node_modules ]; then
  echo "Removing existing node_modules directory..."
  rm -rf node_modules
fi

echo "Installing dependencies..."
npm install

echo "Compiling TypeScript..."
# compile TypeScript source
npx tsc

echo "Compiling SCSS..."
# If an scss directory exists, compile it to public/css
if [ -d scss ]; then
  npx sass scss:public/css
else
  echo "No scss directory found, skipping SCSS compilation."
fi

echo "Setting up MySQL tables..."
if command -v mysql >/dev/null; then
  mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" <<'EOF'
CREATE TABLE IF NOT EXISTS travels (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255),
  title VARCHAR(255)
);
CREATE TABLE IF NOT EXISTS itineraries (
  id VARCHAR(255) PRIMARY KEY,
  travel_id VARCHAR(255),
  title VARCHAR(255),
  content TEXT
);
EOF
else
  echo "mysql command not found, skipping database setup."
fi

echo "Running build and starting server..."
# Build the project (again, to ensure dist is up to date) and start
npm run build && npm start
