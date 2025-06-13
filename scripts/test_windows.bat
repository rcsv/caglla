@echo off
REM Build and run the application for testing on Windows.
REM Compiles TypeScript and SCSS, then runs npm build and start.

echo Compiling TypeScript...
call npx tsc

echo Compiling SCSS...
IF EXIST scss (
    call npx sass scss:public/css
) ELSE (
    echo No scss directory found, skipping SCSS compilation.
)

echo Running build and starting server...
call npm run build && npm start
