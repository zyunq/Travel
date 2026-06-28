@echo off
chcp 65001 >nul
title Travel System - Start All
echo ================================
echo Travel System - Start All
echo ================================
echo.

:: Get current directory
set "ROOT_DIR=%~dp0"

:: [1/3] Start Backend
echo [1/3] Starting Backend...
cd /d "%ROOT_DIR%backend"
echo Backend running on port 3000...
start "Backend - Port 3000" cmd /k "cd /d %ROOT_DIR%backend && npm run dev"

:: Wait 3 seconds
ping -n 4 127.0.0.1 >nul

:: [2/3] Start Frontend
echo.
echo [2/3] Starting Frontend...
cd /d "%ROOT_DIR%frontend"
echo Frontend running on port 5173...
start "Frontend - Port 5173" cmd /k "cd /d %ROOT_DIR%frontend && npm run dev"

:: Wait 3 seconds
ping -n 4 127.0.0.1 >nul

:: [3/3] Start UniApp
echo.
echo [3/3] Starting UniApp...
cd /d "%ROOT_DIR%uniapp"
echo UniApp compiling to mp-weixin...
start "UniApp - mp-weixin" cmd /k "cd /d %ROOT_DIR%uniapp && npm run dev:mp-weixin"

echo.
echo ================================
echo All services started!
echo ================================
echo.
echo Backend:   http://localhost:3000
echo Frontend:  http://localhost:5173
echo UniApp:    %ROOT_DIR%uniapp\dist\dev\mp-weixin
echo.
echo Press any key to close this window...
echo (Services will continue in separate windows)
pause >nul
