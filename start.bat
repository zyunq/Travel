@echo off
chcp 65001 >nul
echo ========================================
echo 旅游团火车票记录系统启动脚本
echo ========================================
echo.

echo [1/2] 启动后端服务器...
start cmd /k "cd backend && node app.js"
timeout /t 2 /nobreak >nul

echo [2/2] 启动前端服务器...
start cmd /k "cd frontend && npm run dev"
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo 系统启动完成！
echo ========================================
echo.
echo 后端服务: http://localhost:3000
echo 前端服务: http://localhost:5173 (或查看新窗口中的端口)
echo.
echo 请在新打开的命令行窗口中查看详细日志
echo ========================================
pause
