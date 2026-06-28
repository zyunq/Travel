@echo off
chcp 65001 >nul
echo ================================
echo 前端服务启动脚本
echo ================================
cd frontend

if not exist "node_modules" (
    echo 首次运行，正在安装依赖...
    call npm install
)

echo.
echo 启动前端服务 (端口: 5173)...
echo 访问地址: http://localhost:5173
echo.
npm run dev

pause
