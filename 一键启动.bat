@echo off
chcp 65001 >nul
title AI求职助手 - 一键启动
echo ============================================
echo   AI 求职助手 - 一键启动全部服务
echo ============================================
echo.
cd /d "%~dp0"

echo [1/2] 启动 Docker 服务...
docker compose --env-file .env.production up -d
if %errorlevel% neq 0 (
    echo.
    echo Docker 启动失败！请确保 Docker Desktop 已打开。
    pause
    exit /b 1
)

echo.
echo [2/2] 等待后端就绪...
:wait_loop
timeout /t 3 /nobreak >nul
curl -sf http://localhost:8080/health >nul 2>&1
if %errorlevel% neq 0 goto wait_loop

echo.
echo ============================================
echo   Docker 服务全部就绪！
echo   正在打开 Cloudflare Tunnel...
echo ============================================
echo.

start "AI求职助手 - Tunnel" cmd /c "cd /d "%~dp0" && .\cloudflared.exe tunnel --url http://localhost:8080"

echo 隧道已在单独窗口中启动，请查看弹出的窗口获取公网链接。
echo.
echo 提示：
echo   - 关闭此窗口不影响 Docker 服务运行
echo   - 关闭隧道窗口会断开公网链接
echo   - 访问 http://localhost:8080 可本地使用
echo.
pause
