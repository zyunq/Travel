@echo off
chcp 65001 >nul
echo ================================
echo 后端服务启动脚本
echo ================================
cd backend

if not exist "node_modules" (
    echo 首次运行，正在安装依赖...
    call npm install
    call npx prisma generate
)

echo.
echo 启动后端服务 (端口: 3000)...
echo API 地址: http://localhost:3000
echo.
npm run dev

pause
