# 🚀 快速部署指南

## 部署信息概览

| 项目 | 值 |
|------|-----|
| 域名 | zyqing.xyz |
| API域名 | api.zyqing.xyz |
| 小程序AppID | wx42e86a2134e6d842 |
| 服务器IP | 101.34.71.12 |

---

## ⚡ 3步快速部署

### 步骤 1：服务器环境部署（首次部署）

**在服务器上执行：**

```bash
# 下载并运行部署脚本
curl -o install.sh https://raw.githubusercontent.com/your-repo/deploy/install.sh
chmod +x install.sh
sudo ./install.sh
```

或者手动执行：

```bash
# 1. 安装 Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 2. 安装 PM2
sudo npm install -g pm2

# 3. 安装 Nginx
sudo yum install -y epel-release nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 4. 申请 SSL 证书
sudo yum install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.zyqing.xyz

# 5. 配置 Nginx（复制 deploy/nginx/travel.conf）
sudo cp deploy/nginx/travel.conf /etc/nginx/conf.d/
sudo nginx -t && sudo systemctl reload nginx
```

### 步骤 2：部署后端代码

**上传代码到服务器：**

```bash
# 方式一：使用 SCP
scp -r backend/* root@101.34.71.12:/var/www/travel/backend/

# 方式二：使用 Git（推荐）
ssh root@101.34.71.12
cd /var/www/travel
git clone <您的仓库地址> .
```

**在服务器上执行：**

```bash
cd /var/www/travel/backend

# 安装依赖
npm install

# 初始化数据库
npx prisma generate
npx prisma migrate deploy

# 创建必要目录
mkdir -p logs uploads

# 使用 PM2 启动
pm2 start deploy/pm2/ecosystem.config.js

# 设置开机自启
pm2 startup
pm2 save
```

### 步骤 3：配置微信公众平台并上传小程序

**3.1 配置域名白名单：**

1. 登录：https://mp.weixin.qq.com
2. 开发管理 → 开发设置 → 服务器域名
3. 添加 `https://api.zyqing.xyz`

**3.2 编译并上传小程序：**

```bash
# 本地编译
cd uniapp
npm install
npm run build:mp-weixin
```

**3.3 使用开发者工具上传：**

1. 打开微信开发者工具
2. 导入项目：`uniapp/dist/build/mp-weixin`
3. 填写 AppID：`wx42e86a2134e6d842`
4. 点击「上传」

---

## ✅ 验证部署

### 测试 API

```bash
# 健康检查
curl https://api.zyqing.xyz/api/health

# 测试配置接口
curl https://api.zyqing.xyz/api/config
```

### 测试小程序

1. 微信开发者工具中测试
2. 扫描体验版二维码
3. 真机测试所有功能

---

## 🔧 常用维护命令

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs travel-backend

# 重启服务
pm2 restart travel-backend

# 更新代码后
git pull
npm install
npx prisma migrate deploy
pm2 restart travel-backend

# 查看 Nginx 日志
tail -f /var/log/nginx/travel_error.log
```

---

## 🆘 故障排查

### 问题：小程序网络请求失败

**检查清单：**
- [ ] 域名是否已解析到服务器IP
- [ ] SSL 证书是否有效（访问 https://api.zyqing.xyz）
- [ ] 微信公众平台是否已配置域名
- [ ] 后端服务是否运行（`pm2 status`）
- [ ] 防火墙是否开放端口

### 问题：SSL 证书问题

```bash
# 检查证书
sudo certbot certificates

# 续期证书
sudo certbot renew
```

### 问题：后端服务异常

```bash
# 查看详细日志
pm2 logs travel-backend --lines 200

# 重启服务
pm2 restart travel-backend
```

---

## 📁 目录结构

```
/var/www/travel/
├── backend/
│   ├── app.js
│   ├── prisma/
│   ├── routes/
│   ├── logs/
│   ├── uploads/
│   └── ecosystem.config.js
└── frontend/  (可选)
```

---

## 📞 获取帮助

详细部署文档：`deploy/README.md`
