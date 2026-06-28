# Uni-app 旅游团管理系统

跨平台版本，支持 H5 和微信小程序。

## 项目结构

```
uniapp/
├── pages/              # 页面
│   ├── login/          # 登录页
│   ├── index/          # 首页（旅游团列表）
│   ├── config/         # 配置页
│   └── group/          # 团详情页
├── stores/             # Pinia 状态管理
│   └── user.js         # 用户状态
├── utils/              # 工具
│   └── api.js          # API 接口
├── static/             # 静态资源
│   └── tabbar/         # TabBar 图标
├── App.vue             # 应用入口
├── main.js             # 主入口
├── pages.json          # 页面配置
├── manifest.json       # 应用配置
└── package.json        # 依赖配置
```

## 开发运行

### 1. 安装依赖

```bash
cd uniapp
npm install
```

### 2. 运行 H5 版本

```bash
npm run dev:h5
```

访问: http://localhost:5174

### 3. 运行微信小程序

```bash
npm run dev:mp-weixin
```

然后用微信开发者工具打开 `dist/dev/mp-weixin` 目录。

## 构建发布

### H5 版本

```bash
npm run build:h5
```

### 微信小程序

```bash
npm run build:mp-weixin
```

## 数据同步

- H5 和小程序共用同一个后端 API (http://localhost:3000)
- 数据实时同步，任何一端操作，另一端刷新即可看到

## 微信小程序配置

1. 在 `manifest.json` 中填写你的 AppID
2. 后端需要添加微信登录接口 `/api/auth/wx-login`
3. 配置服务器域名白名单

## 功能特性

- ✅ 账号密码登录 (H5)
- ✅ 微信一键登录 (小程序)
- ✅ 旅游团列表管理
- ✅ 分类管理
- ✅ 费用配置
- ✅ 座位表导出
- ✅ 信息复制
