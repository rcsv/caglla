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

echo Setting up MySQL tables...
where mysql >nul 2>&1
IF %ERRORLEVEL%==0 (
    mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% -e "CREATE TABLE IF NOT EXISTS travels (id VARCHAR(255) PRIMARY KEY, user_id VARCHAR(255), title VARCHAR(255)); CREATE TABLE IF NOT EXISTS itineraries (id VARCHAR(255) PRIMARY KEY, travel_id VARCHAR(255), title VARCHAR(255), content TEXT);"
) ELSE (
    echo mysql command not found, skipping database setup.
)

echo Running build and starting server...
call npm run build && npm start
