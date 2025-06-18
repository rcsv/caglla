@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

:: ───────────────────────────────
:: Prepare logs directory and logfile
:: ───────────────────────────────
set LOGDIR=logs
if not exist "%LOGDIR%" (
  mkdir "%LOGDIR%"
)

:: ───────────────────────────────
:: Safe TIMESTAMP using time/date parsing
:: ───────────────────────────────
for /f "tokens=1-4 delims=/:. " %%a in ("%TIME%") do (
  set "hh=%%a"
  set "mm=%%b"
)
for /f "tokens=1-3 delims=/- " %%x in ("%DATE%") do (
  set "yyyy=%%x"
  set "mmdd=%%y%%z"
)
set "TIMESTAMP=%yyyy%%mmdd%_%hh%%mm%"
set "LOGFILE=%LOGDIR%\build_%TIMESTAMP%.log"

set echoprefix="[build & run]"
echo %echoprefix% Logging to: %LOGFILE%
echo %echoprefix% Starting script... > "%LOGFILE%"

:: ───────────────────────────────
:: Change to project root
:: ───────────────────────────────
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..
cd /d "%PROJECT_ROOT%"
echo %echoprefix% Working from: %CD% >> "%LOGFILE%"

:: ───────────────────────────────
:: Load environment variables from .env
:: ───────────────────────────────
if exist ".env" (
  echo %echoprefix% Loading .env >> "%LOGFILE%"
  for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
    set "line=%%A"
    echo !line! | findstr /r "^[ ]*#" >nul
    if errorlevel 1 (
      set "key=%%A"
      set "value=%%B"
      set "value=!value:"=!"
      set "value=!value:'=!"
      call set "%key%=!value!"
    )
  )
) else (
  echo %echoprefix% Warning: .env file not found. >> "%LOGFILE%"
)


:: ───────────────────────────────
:: Dependencies
:: ───────────────────────────────
if exist "node_modules" (
  echo %echoprefix% Removing node_modules... >> "%LOGFILE%"
  rmdir /s /q node_modules
)

echo %echoprefix% Installing dependencies... >> "%LOGFILE%"
call npm install >> "%LOGFILE%" 2>&1
if errorlevel 1 goto :error

:: ───────────────────────────────
:: TypeScript
:: ───────────────────────────────
echo %echoprefix% Compiling TypeScript... >> "%LOGFILE%"
call npx tsc >> "%LOGFILE%" 2>&1
if errorlevel 1 goto :error

:: ───────────────────────────────
:: SCSS
:: ───────────────────────────────
if exist "scss" (
  echo %echoprefix% Compiling SCSS... >> "%LOGFILE%"
  call npx sass scss:public/css >> "%LOGFILE%" 2>&1
) else (
  echo %echoprefix% No scss directory found. Skipping. >> "%LOGFILE%"
)

:: ───────────────────────────────
:: MySQL migrations
:: ───────────────────────────────
where mysql >nul 2>nul
if %errorlevel%==0 (
  echo %echoprefix% Running migrations... >> "%LOGFILE%"
  for %%F in ("%SCRIPT_DIR%migrations\*.sql") do (
    if exist "%%F" (
      echo %echoprefix% → %%F >> "%LOGFILE%"
      mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% < "%%F" >> "%LOGFILE%" 2>&1
    )
  )
) else (
  echo %echoprefix% mysql not found. Skipping DB migration. >> "%LOGFILE%"
)

:: ───────────────────────────────
:: Final build and run
:: ───────────────────────────────
echo %echoprefix% Final build and run... >> "%LOGFILE%"
call npm run build >> "%LOGFILE%" 2>&1
if errorlevel 1 goto :error

call npm start >> "%LOGFILE%" 2>&1
goto :eof

:error
echo %echoprefix% ❌ An error occurred. Check %LOGFILE% for details.
echo %echoprefix% ❌ An error occurred. Check %LOGFILE% for details. >> "%LOGFILE%"
exit /b 1

