@echo off
REM ============================================================
REM   AI Interview Project - One-click Startup
REM ============================================================

set PROJECT_DIR=%~dp0
set PG_BIN=D:\study\postgres\pgsql\bin
set PG_DATA=D:\study\postgres\pgdata
set PG_LOG=D:\study\postgres\pg_log.txt
set NPM=D:\node\npm.cmd

echo.
echo ============================================================
echo   AI Interview - Starting all services...
echo ============================================================
echo.

REM ---------- 1. Start PostgreSQL ----------
echo [1/3] Checking PostgreSQL...
"%PG_BIN%\pg_ctl.exe" -D "%PG_DATA%" status >nul 2>&1
if %ERRORLEVEL%==0 (
    echo       PostgreSQL is already running ^(port 5432^)
) else (
    echo       Starting PostgreSQL...
    "%PG_BIN%\pg_ctl.exe" -D "%PG_DATA%" -l "%PG_LOG%" start -w -t 30 >nul
    if %ERRORLEVEL%==0 (
        echo       PostgreSQL started OK ^(port 5432^)
    ) else (
        echo       [WARNING] PostgreSQL FAILED to start. Check %PG_LOG%
    )
)
timeout /t 2 /nobreak >nul

REM ---------- 2. Start Backend (new window) ----------
echo.
echo [2/3] Starting Backend ^(FastAPI :8000^)...
start "AI-Backend" /d "%PROJECT_DIR%backend" cmd /k ".\venv\Scripts\python.exe main.py"
timeout /t 3 /nobreak >nul

REM ---------- 3. Start Frontend (new window) ----------
echo.
echo [3/3] Starting Frontend ^(Next.js :3000^)...
start "AI-Frontend" /d "%PROJECT_DIR%web" cmd /k "%NPM% run dev"
timeout /t 3 /nobreak >nul

echo.
echo ============================================================
echo   All services launched!
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:8000/docs
echo.
echo   To stop: close the 3 windows, or Ctrl+C in each.
echo ============================================================
echo.
pause
