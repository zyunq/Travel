@echo off
chcp 65001 >nul
echo ================================
echo 小程序快速修复脚本
echo ================================
echo.

cd uniapp

echo [步骤 1] 清理编译缓存...
if exist "dist\dev\mp-weixin" (
    echo 删除旧的编译输出...
    rmdir /s /q "dist\dev\mp-weixin" 2>nul
)
if exist ".vite" (
    echo 删除 Vite 缓存...
    rmdir /s /q ".vite" 2>nul
)

echo.
echo [步骤 2] 重新安装依赖...
call npm install

echo.
echo [步骤 3] 重新编译小程序...
echo.
echo ================================
echo 启动小程序开发服务
echo ================================
echo.

npm run dev:mp-weixin

pause
