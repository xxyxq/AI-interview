@echo off
chcp 65001 >nul
title AI求职助手 - Cloudflare Tunnel
echo ============================================
echo   AI 求职助手 - Cloudflare Tunnel
echo ============================================
echo.
echo 正在启动隧道，请稍候...
echo 隧道启动后会显示一个公网链接（https://xxx.trycloudflare.com）
echo 把这个链接发给别人就可以访问了！
echo.
echo 按 Ctrl+C 可停止隧道（Docker 服务不会停止）
echo ============================================
echo.
cd /d "%~dp0"
.\cloudflared.exe tunnel --url http://localhost:8080
pause
