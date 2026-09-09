#!/bin/bash

# 部署诊断脚本 - 检查所有配置是否正确

echo "========================================="
echo "旅游团火车票系统 - 部署诊断"
echo "========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_pass() {
    echo -e "${GREEN}✓ $1${NC}"
}

check_fail() {
    echo -e "${RED}✗ $1${NC}"
}

check_warn() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# 1. 检查域名解析
echo ">>> 1. 检查域名解析"
DOMAIN_IP=$(dig +short api.zyqing.xyz | tail -n1)
if [ "$DOMAIN_IP" = "101.34.71.12" ]; then
    check_pass "域名解析正确: api.zyqing.xyz -> 101.34.71.12"
else
    check_fail "域名解析错误: api.zyqing.xyz -> $DOMAIN_IP"
    echo "   期望: 101.34.71.12"
fi
echo ""

# 2. 检查端口
echo ">>> 2. 检查端口监听"
if netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
    check_pass "后端服务运行中 (端口 3000)"
else
    check_fail "后端服务未运行 (端口 3000)"
    echo "   启动命令: pm2 start ecosystem.config.js"
fi

if netstat -tlnp 2>/dev/null | grep -q ":80 "; then
    check_pass "Nginx HTTP 运行中 (端口 80)"
else
    check_fail "Nginx HTTP 未运行 (端口 80)"
fi

if netstat -tlnp 2>/dev/null | grep -q ":443 "; then
    check_pass "Nginx HTTPS 运行中 (端口 443)"
else
    check_fail "Nginx HTTPS 未运行 (端口 443)"
fi
echo ""

# 3. 检查 SSL 证书
echo ">>> 3. 检查 SSL 证书"
if [ -f "/etc/letsencrypt/live/api.zyqing.xyz/fullchain.pem" ]; then
    check_pass "SSL 证书文件存在"

    # 检查证书有效期
    EXPIRE_DATE=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/api.zyqing.xyz/fullchain.pem | cut -d= -f2)
    EXPIRE_EPOCH=$(date -d "$EXPIRE_DATE" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$EXPIRE_DATE" +%s)
    CURRENT_EPOCH=$(date +%s)
    DAYS_LEFT=$(( (EXPIRE_EPOCH - CURRENT_EPOCH) / 86400 ))

    if [ $DAYS_LEFT -gt 7 ]; then
        check_pass "SSL 证书有效 (剩余 $DAYS_LEFT 天)"
    else
        check_warn "SSL 证书即将过期 (剩余 $DAYS_LEFT 天)"
        echo "   续期命令: sudo certbot renew"
    fi
else
    check_fail "SSL 证书不存在"
    echo "   申请命令: sudo certbot --nginx -d api.zyqing.xyz"
fi
echo ""

# 4. 检查服务状态
echo ">>> 4. 检查服务状态"
if command -v pm2 &> /dev/null; then
    PM2_STATUS=$(pm2 jlist 2>/dev/null | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ "$PM2_STATUS" = "online" ]; then
        check_pass "PM2 服务在线"
    else
        check_fail "PM2 服务状态: $PM2_STATUS"
    fi
else
    check_fail "PM2 未安装"
fi

if systemctl is-active --quiet nginx; then
    check_pass "Nginx 服务运行中"
else
    check_fail "Nginx 服务未运行"
    echo "   启动命令: sudo systemctl start nginx"
fi
echo ""

# 5. 测试 API 响应
echo ">>> 5. 测试 API 接口"

# 测试本地接口
if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
    check_pass "本地 API 响应正常 (http://localhost:3000/api/health)"
else
    check_fail "本地 API 无响应"
fi

# 测试 HTTPS 接口
if curl -sf https://api.zyqing.xyz/api/health > /dev/null 2>&1; then
    check_pass "HTTPS API 响应正常 (https://api.zyqing.xyz/api/health)"
else
    check_fail "HTTPS API 无响应"
    echo "   检查项:"
    echo "   - Nginx 配置是否正确"
    echo "   - SSL 证书是否有效"
    echo "   - 防火墙是否开放端口"
fi
echo ""

# 6. 检查防火墙
echo ">>> 6. 检查防火墙"
if command -v firewall-cmd &> /dev/null; then
    if firewall-cmd --list-ports | grep -q "80/tcp"; then
        check_pass "防火墙已开放端口 80"
    else
        check_warn "防火墙未开放端口 80"
        echo "   开放命令: sudo firewall-cmd --permanent --add-port=80/tcp"
    fi

    if firewall-cmd --list-ports | grep -q "443/tcp"; then
        check_pass "防火墙已开放端口 443"
    else
        check_warn "防火墙未开放端口 443"
        echo "   开放命令: sudo firewall-cmd --permanent --add-port=443/tcp"
    fi
else
    check_warn "firewalld 未运行，跳过防火墙检查"
fi
echo ""

# 7. 检查文件权限
echo ">>> 7. 检查文件权限"
PROJECT_DIR="/var/www/travel/backend"
if [ -d "$PROJECT_DIR" ]; then
    if [ -f "$PROJECT_DIR/app.js" ]; then
        check_pass "后端代码存在"
    else
        check_fail "后端代码不存在"
        echo "   请上传代码到: $PROJECT_DIR"
    fi

    if [ -f "$PROJECT_DIR/prisma/dev.db" ]; then
        check_pass "数据库文件存在"
    else
        check_warn "数据库文件不存在"
        echo "   初始化命令: cd $PROJECT_DIR && npx prisma migrate deploy"
    fi

    if [ -d "$PROJECT_DIR/node_modules" ]; then
        check_pass "依赖已安装"
    else
        check_fail "依赖未安装"
        echo "   安装命令: cd $PROJECT_DIR && npm install"
    fi
else
    check_fail "项目目录不存在: $PROJECT_DIR"
fi
echo ""

# 8. 检查日志
echo ">>> 8. 检查最近的错误日志"
if [ -f "$PROJECT_DIR/logs/pm2-error.log" ]; then
    ERROR_COUNT=$(grep -c "error\|Error\|ERROR" "$PROJECT_DIR/logs/pm2-error.log" 2>/dev/null || echo "0")
    if [ "$ERROR_COUNT" -gt 0 ]; then
        check_warn "发现 $ERROR_COUNT 条错误日志"
        echo "   查看命令: pm2 logs travel-backend --err"
    else
        check_pass "无错误日志"
    fi
else
    check_pass "错误日志文件不存在（可能没有错误）"
fi
echo ""

# 9. 小程序配置检查
echo ">>> 9. 小程序配置"
echo "AppID: wx42e86a2134e6d842"
echo "API 地址: https://api.zyqing.xyz/api"
echo ""
echo "⚠️  请确认以下配置："
echo "   1. 微信公众平台已配置服务器域名: https://api.zyqing.xyz"
echo "   2. 小程序代码已更新 AppID"
echo "   3. 小程序已重新编译上传"
echo ""

# 总结
echo "========================================="
echo "诊断完成"
echo "========================================="
echo ""
echo "如果所有检查都通过，请："
echo "1. 在微信公众平台配置域名白名单"
echo "2. 编译并上传小程序"
echo "3. 测试小程序功能"
echo ""
echo "如有问题，请查看："
echo "- 后端日志: pm2 logs travel-backend"
echo "- Nginx 日志: tail -f /var/log/nginx/travel_error.log"
echo "- 部署文档: deploy/README.md"
