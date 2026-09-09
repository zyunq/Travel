#!/bin/bash

# 旅游团火车票管理系统 - 一键部署脚本
# 适用于 CentOS 7/8

set -e

echo "========================================="
echo "旅游团火车票管理系统 - 生产环境部署"
echo "========================================="
echo ""

# 配置变量
DOMAIN="api.zyqing.xyz"
SERVER_IP="101.34.71.12"
APP_ID="wx42e86a2134e6d842"

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
  echo "请使用 root 用户运行此脚本"
  exit 1
fi

# 1. 更新系统
echo ">>> 步骤 1/10: 更新系统..."
yum update -y

# 2. 安装 Node.js
echo ">>> 步骤 2/10: 安装 Node.js 18.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs
fi
echo "Node 版本: $(node -v)"
echo "NPM 版本: $(npm -v)"

# 3. 安装 PM2
echo ">>> 步骤 3/10: 安装 PM2..."
npm install -g pm2

# 4. 安装 Nginx
echo ">>> 步骤 4/10: 安装 Nginx..."
if ! command -v nginx &> /dev/null; then
    yum install -y epel-release
    yum install -y nginx
    systemctl start nginx
    systemctl enable nginx
fi

# 5. 配置防火墙
echo ">>> 步骤 5/10: 配置防火墙..."
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-port=80/tcp
    firewall-cmd --permanent --add-port=443/tcp
    firewall-cmd --permanent --add-port=3000/tcp
    firewall-cmd --reload
    echo "防火墙已配置"
else
    echo "未检测到 firewalld，跳过防火墙配置"
fi

# 6. 创建项目目录
echo ">>> 步骤 6/10: 创建项目目录..."
mkdir -p /var/www/travel
mkdir -p /var/www/travel/backend/logs
mkdir -p /var/www/travel/backend/uploads

# 7. 安装 Certbot 并申请 SSL 证书
echo ">>> 步骤 7/10: 安装 Certbot 并申请 SSL 证书..."
if ! command -v certbot &> /dev/null; then
    yum install -y certbot python3-certbot-nginx
fi

echo ""
echo "⚠️  重要提示："
echo "请确保域名 $DOMAIN 已经解析到服务器 IP: $SERVER_IP"
echo "如果已完成解析，按 Enter 继续，否则按 Ctrl+C 退出脚本"
read -p ""

# 申请证书（交互式）
certbot --nginx -d $DOMAIN || {
    echo "SSL 证书申请失败，请检查域名解析是否正确"
    echo "可以稍后手动执行: certbot --nginx -d $DOMAIN"
}

# 8. 配置 Nginx
echo ">>> 步骤 8/10: 配置 Nginx..."
cat > /etc/nginx/conf.d/travel.conf << 'EOF'
# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name api.zyqing.xyz zyqing.xyz;

    location /.well-known/acme-challenge/ {
        root /usr/share/nginx/html;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS 主配置
server {
    listen 443 ssl http2;
    server_name api.zyqing.xyz zyqing.xyz;

    ssl_certificate /etc/letsencrypt/live/api.zyqing.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.zyqing.xyz/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS';
        add_header Access-Control-Allow-Headers 'Content-Type,Authorization';

        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    location / {
        root /var/www/travel/frontend;
        try_files $uri $uri/ /index.html;
    }

    access_log /var/log/nginx/travel_access.log;
    error_log /var/log/nginx/travel_error.log;
}
EOF

# 测试并重载 Nginx
nginx -t && systemctl reload nginx

# 9. 创建 PM2 配置文件
echo ">>> 步骤 9/10: 创建 PM2 配置..."
cat > /var/www/travel/backend/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'travel-backend',
    cwd: '/var/www/travel/backend',
    script: 'app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/www/travel/backend/logs/pm2-error.log',
    out_file: '/var/www/travel/backend/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
}
EOF

# 10. 设置文件权限
echo ">>> 步骤 10/10: 设置文件权限..."
chown -R nginx:nginx /var/www/travel
chmod -R 755 /var/www/travel

echo ""
echo "========================================="
echo "✅ 服务器环境部署完成！"
echo "========================================="
echo ""
echo "接下来的步骤："
echo ""
echo "1. 上传后端代码到服务器："
echo "   scp -r backend/* root@${SERVER_IP}:/var/www/travel/backend/"
echo ""
echo "2. 在服务器上执行："
echo "   cd /var/www/travel/backend"
echo "   npm install"
echo "   npx prisma generate"
echo "   npx prisma migrate deploy"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 startup"
echo "   pm2 save"
echo ""
echo "3. 在微信公众平台配置域名："
echo "   request 合法域名: https://${DOMAIN}"
echo ""
echo "4. 编译并上传小程序："
echo "   cd uniapp"
echo "   npm run build:mp-weixin"
echo "   使用微信开发者工具上传代码"
echo ""
echo "部署文档: deploy/README.md"
echo ""
