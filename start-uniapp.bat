@echo off
chcp 65001 >nul
echo ================================
echo 小程序启动脚本
echo ================================
cd uniapp

if not exist "node_modules" (
    echo 首次运行，正在安装依赖...
    call npm install
)

echo.
echo [1/2] 检查文件编码...
node fix-encoding.js 2>nul

echo.
echo [2/2] 启动小程序开发服务...
echo 编译输出路径: uniapp\dist\dev\mp-weixin
echo.
echo ⚠️  请在微信开发者工具中导入项目：
echo    项目路径：%CD%\dist\dev\mp-weixin
echo.
npm run dev:mp-weixin

pause
