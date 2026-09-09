# 旅游团火车票管理系统 - 生产环境部署文档

## 部署信息

- **域名**: zyqing.xyz
- **API域名**: api.zyqing.xyz
- **小程序AppID**: wx42e86a2134e6d842
- **服务器IP**: 101.34.71.12
- **后端端口**: 3000

## 一、服务器环境准备

### 1.1 安装 Node.js (CentOS)

```bash
# 更新系统
sudo yum update -y

# 安装 Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 验证安装
node -v
npm -v
```

### 1.2 安装 PM2 进程管理器

```bash
sudo npm install -g pm2
```

### 1.3 安装 Nginx

```bash
# CentOS
sudo yum install -y epel-release
sudo yum install -y nginx

# Ubuntu
# sudo apt update
# sudo apt install -y nginx

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 1.4 配置防火墙

```bash
# 开放 HTTP 和 HTTPS 端口
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# 如果是云服务器，还需要在安全组中开放这些端口
```

## 二、域名解析配置

### 2.1 DNS 解析设置

在您的域名服务商控制台（阿里云/腾讯云/Cloudflare等）添加以下解析记录：

| 记录类型 | 主机记录 | 记录值 |
|---------|---------|--------|
| A | api | 101.34.71.12 |
| A | @ | 101.34.71.12 |

配置完成后，等待 DNS 生效（通常 10 分钟到 2 小时）

验证解析：
```bash
ping api.zyqing.xyz
ping zyqing.xyz
```

## 三、SSL 证书申请

### 3.1 使用 Certbot 申请免费 SSL 证书

```bash
# 安装 Certbot
sudo yum install -y certbot python3-certbot-nginx

# 申请证书（会自动验证域名）
sudo certbot --nginx -d api.zyqing.xyz -d zyqing.xyz

# 按照提示输入邮箱地址，同意服务条款

# 测试自动续期
sudo certbot renew --dry-run
```

证书文件位置：
- 证书: `/etc/letsencrypt/live/api.zyqing.xyz/fullchain.pem`
- 私钥: `/etc/letsencrypt/live/api.zyqing.xyz/privkey.pem`

## 四、Nginx 配置

### 4.1 创建 Nginx 配置文件

```bash
sudo vi /etc/nginx/conf.d/travel.conf
```

粘贴以下内容（已在 `deploy/nginx/travel.conf` 中准备好）：

```nginx
# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name api.zyqing.xyz zyqing.xyz;

    # Let's Encrypt 验证路径
    location /.well-known/acme-challenge/ {
        root /usr/share/nginx/html;
    }

    # 其他请求重定向到 HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS 主配置
server {
    listen 443 ssl http2;
    server_name api.zyqing.xyz zyqing.xyz;

    # SSL 证书配置
    ssl_certificate /etc/letsencrypt/live/api.zyqing.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.zyqing.xyz/privkey.pem;

    # SSL 优化配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API 代理
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

        # CORS 配置
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS';
        add_header Access-Control-Allow-Headers 'DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization';

        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # 静态文件服务（可选，用于前端）
    location / {
        root /var/www/travel/frontend;
        try_files $uri $uri/ /index.html;
    }

    # 日志
    access_log /var/log/nginx/travel_access.log;
    error_log /var/log/nginx/travel_error.log;
}
```

### 4.2 测试并重载 Nginx

```bash
# 测试配置
sudo nginx -t

# 重载配置
sudo systemctl reload nginx
```

## 五、部署后端代码

### 5.1 创建项目目录

```bash
sudo mkdir -p /var/www/travel
sudo chown -R $USER:$USER /var/www/travel
cd /var/www/travel
```

### 5.2 上传代码

**方式一：使用 Git（推荐）**

```bash
git clone <您的代码仓库地址> .
```

**方式二：使用 SCP 上传**

在本地电脑执行：
```bash
scp -r backend/ user@101.34.71.12:/var/www/travel/
```

**方式三：使用 FTP/SFTP 工具**

使用 FileZilla、WinSCP 等工具上传 `backend` 目录

### 5.3 安装依赖并初始化数据库

```bash
cd /var/www/travel/backend

# 安装依赖
npm install

# 初始化数据库
npx prisma generate
npx prisma migrate deploy

# 创建日志目录
mkdir -p logs
mkdir -p uploads
```

### 5.4 配置环境变量（可选）

```bash
vi .env
```

添加以下内容：
```env
NODE_ENV=production
PORT=3000
```

### 5.5 使用 PM2 启动服务

```bash
# 复制 PM2 配置文件
cp deploy/pm2/ecosystem.config.js .

# 启动服务
pm2 start ecosystem.config.js

# 查看服务状态
pm2 status

# 查看日志
pm2 logs travel-backend

# 设置开机自启
pm2 startup
pm2 save
```

## 六、微信公众平台配置

### 6.1 配置服务器域名

1. 登录微信公众平台：https://mp.weixin.qq.com
2. 进入「开发管理」→「开发设置」→「服务器域名」
3. 点击「修改」，添加以下域名：

**request 合法域名：**
```
https://api.zyqing.xyz
```

**uploadFile 合法域名：**
```
https://api.zyqing.xyz
```

**downloadFile 合法域名：**
```
https://api.zyqing.xyz
```

### 6.2 其他配置

- **业务域名**：如果需要在小程序中打开网页，添加 `https://zyqing.xyz`
- **UDP 域名**：如有特殊需求可配置

## 七、编译上传小程序

### 7.1 安装依赖

```bash
cd uniapp
npm install
```

### 7.2 编译小程序

```bash
npm run build:mp-weixin
```

编译后的代码在：`uniapp/dist/build/mp-weixin/`

### 7.3 上传代码

**方式一：使用微信开发者工具**

1. 打开微信开发者工具
2. 导入项目：`uniapp/dist/build/mp-weixin`
3. 点击右上角「上传」
4. 填写版本号和备注
5. 上传成功

**方式二：使用命令行上传（需要配置）**

```bash
# 安装 miniprogram-ci
npm install -g miniprogram-ci

# 上传（需要先在公众平台配置上传密钥）
miniprogram-ci upload \
  --pp ./dist/build/mp-weixin \
  --pkp ./private.wx42e86a2134e6d842.key \
  --appid wx42e86a2134e6d842 \
  -r 1 \
  --uv 1.0.0 \
  --desc "初始版本"
```

### 7.4 提交审核

1. 登录微信公众平台
2. 进入「版本管理」
3. 找到刚上传的版本，点击「提交审核」
4. 填写审核信息
5. 等待审核通过

## 八、测试验证

### 8.1 测试 API 接口

```bash
# 测试健康检查
curl https://api.zyqing.xyz/api/health

# 测试配置接口
curl https://api.zyqing.xyz/api/config

# 测试登录（需要先创建用户）
curl -X POST https://api.zyqing.xyz/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 8.2 测试小程序

1. 在微信开发者工具中打开项目
2. 测试登录功能
3. 测试数据加载
4. 测试各个功能模块

### 8.3 真机测试

1. 扫描体验版二维码
2. 在手机微信中测试所有功能
3. 检查网络请求是否正常

## 九、常见问题排查

### 9.1 小程序网络请求失败

**检查项：**
1. ✅ 域名是否已备案
2. ✅ SSL 证书是否有效（访问 https://api.zyqing.xyz 检查）
3. ✅ 微信公众平台是否已配置域名白名单
4. ✅ 服务器防火墙是否开放端口
5. ✅ Nginx 配置是否正确
6. ✅ 后端服务是否运行（`pm2 status`）

**调试方法：**
```bash
# 查看后端日志
pm2 logs travel-backend

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/travel_error.log

# 检查端口占用
sudo netstat -tlnp | grep :3000
```

### 9.2 SSL 证书问题

```bash
# 检查证书有效期
sudo certbot certificates

# 手动续期
sudo certbot renew

# 重新申请
sudo certbot --nginx -d api.zyqing.xyz --force-renewal
```

### 9.3 后端服务异常

```bash
# 重启服务
pm2 restart travel-backend

# 查看详细信息
pm2 describe travel-backend

# 查看实时日志
pm2 logs --lines 100
```

## 十、维护命令

### 10.1 日常维护

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs travel-backend

# 重启服务
pm2 restart travel-backend

# 停止服务
pm2 stop travel-backend

# 重载 Nginx
sudo systemctl reload nginx

# 查看 Nginx 状态
sudo systemctl status nginx
```

### 10.2 更新代码

```bash
cd /var/www/travel/backend

# 使用 Git 更新
git pull origin main

# 安装新依赖
npm install

# 数据库迁移
npx prisma migrate deploy

# 重启服务
pm2 restart travel-backend
```

### 10.3 备份数据

```bash
# 备份数据库
cp /var/www/travel/backend/prisma/dev.db /backup/dev-$(date +%Y%m%d).db

# 备份上传文件
tar -czf /backup/uploads-$(date +%Y%m%d).tar.gz /var/www/travel/backend/uploads/
```

## 十一、安全建议

1. **修改默认管理员密码**（首次登录后立即修改）
2. **定期备份数据库**
3. **定期更新系统和依赖包**
4. **配置防火墙规则**
5. **启用日志监控**
6. **设置文件权限**

## 联系支持

如遇问题，请检查：
1. 后端日志：`/var/www/travel/backend/logs/`
2. Nginx 日志：`/var/log/nginx/travel_error.log`
3. PM2 日志：`pm2 logs travel-backend`
