#!/bin/sh
# Build and run the application for testing on Unix-like systems.
# Compiles TypeScript and SCSS, then runs npm build and start.
set -e

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

echo "Running build and starting server..."
# Build the project (again, to ensure dist is up to date) and start
npm run build && npm start
