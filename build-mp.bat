@echo off
chcp 65001 >nul
echo ================================
echo 小程序编译启动脚本
echo ================================
echo.

cd uniapp

echo [步骤 1] 检查并诊断...
node diagnose.js 2>nul

echo.
echo [步骤 2] 启动小程序编译...
echo.
echo ================================
echo   微信小程序开发模式
echo ================================
echo.
echo 编译完成后，请在微信开发者工具中导入项目：
echo.
echo 项目路径：%CD%\dist\dev\mp-weixin
echo.
echo ================================
echo.

npm run dev:mp-weixin

pause
