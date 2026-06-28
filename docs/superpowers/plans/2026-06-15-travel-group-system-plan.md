# 旅游团火车票记录系统实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建旅行社内部火车票管理系统，支持旅游团管理、人员明细导入、费用计算和信息复制。

**Architecture:** 前后端分离架构，Vue 3 + Element Plus 前端，Node.js + Express 后端，SQLite 数据库配合 Prisma ORM。

**Tech Stack:** Vue 3, Element Plus, Node.js, Express, SQLite, Prisma, xlsx

---

## 项目文件结构

```
C:/project/Travel/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # 数据库模型定义
│   ├── routes/
│   │   ├── groups.js              # 旅游团路由
│   │   ├── members.js             # 人员路由
│   │   └── config.js              # 配置路由
│   ├── utils/
│   │   ├── ticketType.js          # 票型判断工具
│   │   └── excelParser.js         # Excel解析工具
│   ├── app.js                     # Express应用入口
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── views/
│   │   │   ├── GroupList.vue      # 团列表页
│   │   │   ├── GroupDetail.vue    # 团详情页
│   │   │   └── Config.vue         # 配置页
│   │   ├── components/
│   │   │   ├── GroupSummary.vue   # 团汇总组件
│   │   │   ├── MemberTable.vue    # 人员表格组件
│   │   │   └── ImportDialog.vue   # 导入对话框
│   │   ├── api/
│   │   │   └── index.js           # API请求封装
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   └── package.json
└── docs/
    └── superpowers/
        ├── specs/
        └── plans/
```

---

## Task 1: 初始化后端项目

**Files:**
- Create: `backend/package.json`
- Create: `backend/app.js`

- [ ] **Step 1: 创建后端目录并初始化项目**

```bash
cd C:/project/Travel
mkdir backend
cd backend
npm init -y
```

- [ ] **Step 2: 安装后端依赖**

```bash
npm install express cors multer xlsx
npm install prisma --save-dev
```

- [ ] **Step 3: 创建 Express 应用入口**

创建文件 `backend/app.js`:

```javascript
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 路由将在后续任务中添加
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

- [ ] **Step 4: 测试服务启动**

```bash
node app.js
```

访问 http://localhost:3000/api/health 应返回 `{"status":"ok"}`

- [ ] **Step 5: 提交代码**

```bash
git add backend/
git commit -m "chore: init backend project with express"
```

---

## Task 2: 配置 Prisma 数据库

**Files:**
- Create: `backend/prisma/schema.prisma`

- [ ] **Step 1: 初始化 Prisma**

```bash
cd C:/project/Travel/backend
npx prisma init
```

- [ ] **Step 2: 编写数据库模型**

修改 `backend/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model Group {
  id            Int      @id @default(autoincrement())
  name          String
  departDate    String
  returnDate    String
  trainNo       String
  route         String
  adultPrice    Float
  childPrice    Float
  verifyCount   Int      @default(0)
  invoiceCount  Int      @default(0)
  members       Member[]
}

model Member {
  id            Int     @id @default(autoincrement())
  groupId       Int
  idType        String
  name          String
  idNumber      String
  date          String
  trainNo       String
  departStation String
  arriveStation String
  seatClass     String
  carriage      String
  seatNo        String
  price         Float
  orderNo       String
  ticketType    String  @default("成人")
  status        String  @default("正常")
  needInvoice   Boolean @default(false)
  group         Group   @relation(fields: [groupId], references: [id], onDelete: Cascade)
}

model FeeConfig {
  id                Int   @id @default(1)
  serviceFee        Float @default(10)
  refundServiceFee  Float @default(20)
  foreignIdVerify   Float @default(8)
  electronicInvoice Float @default(3)
}
```

- [ ] **Step 3: 生成数据库**

```bash
npx prisma migrate dev --name init
```

- [ ] **Step 4: 创建 Prisma 客户端工具**

创建文件 `backend/prisma/client.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
module.exports = prisma;
```

- [ ] **Step 5: 提交代码**

```bash
git add backend/prisma/
git commit -m "feat: add prisma schema and database setup"
```

---

## Task 3: 实现费用配置 API

**Files:**
- Create: `backend/routes/config.js`

- [ ] **Step 1: 创建配置路由**

创建文件 `backend/routes/config.js`:

```javascript
const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');

// 获取费用配置
router.get('/', async (req, res) => {
  let config = await prisma.feeConfig.findUnique({ where: { id: 1 } });
  if (!config) {
    config = await prisma.feeConfig.create({ data: { id: 1 } });
  }
  res.json(config);
});

// 修改费用配置
router.put('/', async (req, res) => {
  const { serviceFee, refundServiceFee, foreignIdVerify, electronicInvoice } = req.body;
  const config = await prisma.feeConfig.upsert({
    where: { id: 1 },
    update: {
      serviceFee,
      refundServiceFee,
      foreignIdVerify,
      electronicInvoice
    },
    create: {
      id: 1,
      serviceFee,
      refundServiceFee,
      foreignIdVerify,
      electronicInvoice
    }
  });
  res.json(config);
});

module.exports = router;
```

- [ ] **Step 2: 在 app.js 中注册路由**

修改 `backend/app.js`，在路由注释处添加:

```javascript
const configRouter = require('./routes/config');
app.use('/api/config', configRouter);
```

- [ ] **Step 3: 测试 API**

```bash
# 获取配置
curl http://localhost:3000/api/config

# 修改配置
curl -X PUT http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{"serviceFee":15,"refundServiceFee":25,"foreignIdVerify":10,"electronicInvoice":5}'
```

- [ ] **Step 4: 提交代码**

```bash
git add backend/routes/
git commit -m "feat: add fee config API"
```

---

## Task 4: 实现票型判断工具

**Files:**
- Create: `backend/utils/ticketType.js`

- [ ] **Step 1: 创建票型判断函数**

创建文件 `backend/utils/ticketType.js`:

```javascript
/**
 * 根据证件类型和票价判断票型（成人/儿童）
 * @param {string} idType - 证件类型：二代/外护
 * @param {string} idNumber - 证件号码
 * @param {number} price - 票价
 * @param {number} adultPrice - 成人票价参考
 * @returns {string} - 成人/儿童
 */
function determineTicketType(idType, idNumber, price, adultPrice) {
  if (idType === '二代') {
    // 中国身份证：根据证件号计算年龄
    const birthYear = parseInt(idNumber.substring(6, 10));
    const birthMonth = parseInt(idNumber.substring(10, 12));
    const birthDay = parseInt(idNumber.substring(12, 14));

    const now = new Date();
    const birthDate = new Date(birthYear, birthMonth - 1, birthDay);

    let age = now.getFullYear() - birthYear;
    const monthDiff = now.getMonth() - (birthMonth - 1);
    const dayDiff = now.getDate() - birthDay;

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    // 6周岁 ≤ 年龄 < 14周岁 为儿童
    if (age >= 6 && age < 14) {
      return '儿童';
    }
    return '成人';
  } else {
    // 外国护照：根据票价判断
    if (price <= adultPrice * 0.5) {
      return '儿童';
    }
    return '成人';
  }
}

module.exports = { determineTicketType };
```

- [ ] **Step 2: 提交代码**

```bash
git add backend/utils/
git commit -m "feat: add ticket type determination utility"
```

---

## Task 5: 实现旅游团 API

**Files:**
- Create: `backend/routes/groups.js`

- [ ] **Step 1: 创建旅游团路由**

创建文件 `backend/routes/groups.js`:

```javascript
const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');

// 获取旅游团列表
router.get('/', async (req, res) => {
  const groups = await prisma.group.findMany({
    orderBy: { id: 'desc' },
    include: {
      _count: { select: { members: true } }
    }
  });
  res.json(groups);
});

// 新增旅游团
router.post('/', async (req, res) => {
  const { name, departDate, returnDate, trainNo, route, adultPrice, childPrice, verifyCount, invoiceCount } = req.body;
  const group = await prisma.group.create({
    data: { name, departDate, returnDate, trainNo, route, adultPrice, childPrice, verifyCount, invoiceCount }
  });
  res.json(group);
});

// 获取团详情（含费用汇总）
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const group = await prisma.group.findUnique({
    where: { id: parseInt(id) },
    include: { members: true }
  });

  if (!group) {
    return res.status(404).json({ error: '团不存在' });
  }

  // 计算汇总数据
  const adultCount = group.members.filter(m => m.ticketType === '成人' && m.status === '正常').length;
  const childCount = group.members.filter(m => m.ticketType === '儿童' && m.status === '正常').length;
  const refundCount = group.members.filter(m => m.status === '退票').length;
  const invoiceCount = group.members.filter(m => m.needInvoice).length;

  // 获取费用配置
  const config = await prisma.feeConfig.findUnique({ where: { id: 1 } });

  // 计算费用
  const ticketTotal = adultCount * group.adultPrice + childCount * group.childPrice;
  const serviceFee = (adultCount + childCount) * (config?.serviceFee || 10);
  const refundFee = refundCount * (config?.refundServiceFee || 20);
  const verifyFee = group.verifyCount * (config?.foreignIdVerify || 8);
  const invoiceFee = invoiceCount * (config?.electronicInvoice || 3);
  const total = ticketTotal + serviceFee + refundFee + verifyFee + invoiceFee;

  res.json({
    ...group,
    summary: {
      adultCount,
      childCount,
      refundCount,
      invoiceCount,
      ticketTotal,
      serviceFee,
      refundFee,
      verifyFee,
      invoiceFee,
      total
    }
  });
});

// 编辑旅游团
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, departDate, returnDate, trainNo, route, adultPrice, childPrice, verifyCount, invoiceCount } = req.body;
  const group = await prisma.group.update({
    where: { id: parseInt(id) },
    data: { name, departDate, returnDate, trainNo, route, adultPrice, childPrice, verifyCount, invoiceCount }
  });
  res.json(group);
});

// 删除旅游团
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.group.delete({ where: { id: parseInt(id) } });
  res.json({ success: true });
});

// 复制团信息
router.get('/:id/copy', async (req, res) => {
  const { id } = req.params;
  const group = await prisma.group.findUnique({
    where: { id: parseInt(id) },
    include: { members: true }
  });

  if (!group) {
    return res.status(404).json({ error: '团不存在' });
  }

  const adultCount = group.members.filter(m => m.ticketType === '成人' && m.status === '正常').length;
  const childCount = group.members.filter(m => m.ticketType === '儿童' && m.status === '正常').length;
  const refundCount = group.members.filter(m => m.status === '退票').length;
  const invoiceCount = group.members.filter(m => m.needInvoice).length;

  const config = await prisma.feeConfig.findUnique({ where: { id: 1 } });

  const ticketTotal = adultCount * group.adultPrice + childCount * group.childPrice;
  const serviceFee = (adultCount + childCount) * (config?.serviceFee || 10);
  const refundFee = refundCount * (config?.refundServiceFee || 20);
  const verifyFee = group.verifyCount * (config?.foreignIdVerify || 8);
  const invoiceFee = invoiceCount * (config?.electronicInvoice || 3);
  const total = ticketTotal + serviceFee + refundFee + verifyFee + invoiceFee;

  const text = `团名：${group.name}
车次：${group.trainNo}
行程：${group.route}
出发日期：${group.departDate}
返回日期：${group.returnDate}

成人票：${adultCount}张 × ${group.adultPrice}元 = ${adultCount * group.adultPrice}元
儿童票：${childCount}张 × ${group.childPrice}元 = ${childCount * group.childPrice}元
────────────────────
票价小计：${ticketTotal}元
购票服务费：${adultCount + childCount}张 × ${config?.serviceFee || 10}元 = ${serviceFee}元
退票服务费：${refundCount}张 × ${config?.refundServiceFee || 20}元 = ${refundFee}元
核验费：${group.verifyCount}次 × ${config?.foreignIdVerify || 8}元 = ${verifyFee}元
电子发票费：${invoiceCount}次 × ${config?.electronicInvoice || 3}元 = ${invoiceFee}元
────────────────────
共计：${total}元`;

  res.json({ text });
});

module.exports = router;
```

- [ ] **Step 2: 在 app.js 中注册路由**

修改 `backend/app.js`:

```javascript
const groupsRouter = require('./routes/groups');
app.use('/api/groups', groupsRouter);
```

- [ ] **Step 3: 提交代码**

```bash
git add backend/routes/groups.js
git commit -m "feat: add groups API with summary calculation"
```

---

## Task 6: 实现 Excel 解析工具

**Files:**
- Create: `backend/utils/excelParser.js`

- [ ] **Step 1: 创建 Excel 解析工具**

创建文件 `backend/utils/excelParser.js`:

```javascript
const xlsx = require('xlsx');
const { determineTicketType } = require('./ticketType');

/**
 * 解析 Excel 文件并返回人员数据
 * @param {string} filePath - Excel 文件路径
 * @param {number} adultPrice - 成人票价参考
 * @returns {Array} - 人员数据数组
 */
function parseExcel(filePath, adultPrice) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);

  return data.map(row => ({
    idType: row['证件'] || '',
    name: row['姓名'] || '',
    idNumber: row['证件号码'] || '',
    date: row['日期'] || '',
    trainNo: row['车次'] || '',
    departStation: row['发站'] || '',
    arriveStation: row['到站'] || '',
    seatClass: row['席别'] || '',
    carriage: String(row['车厢'] || ''),
    seatNo: String(row['座号'] || ''),
    price: parseFloat(row['票价']) || 0,
    orderNo: row['订单号'] || '',
    ticketType: determineTicketType(
      row['证件'] || '',
      row['证件号码'] || '',
      parseFloat(row['票价']) || 0,
      adultPrice
    ),
    status: '正常',
    needInvoice: false
  }));
}

module.exports = { parseExcel };
```

- [ ] **Step 2: 创建 uploads 目录**

```bash
mkdir -p backend/uploads
```

- [ ] **Step 3: 提交代码**

```bash
git add backend/utils/excelParser.js
git commit -m "feat: add Excel parser utility"
```

---

## Task 7: 实现人员 API

**Files:**
- Create: `backend/routes/members.js`

- [ ] **Step 1: 创建人员路由**

创建文件 `backend/routes/members.js`:

```javascript
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const prisma = require('../prisma/client');
const { parseExcel } = require('../utils/excelParser');
const { determineTicketType } = require('../utils/ticketType');

const upload = multer({ dest: 'uploads/' });

// 获取人员列表
router.get('/groups/:groupId/members', async (req, res) => {
  const { groupId } = req.params;
  const members = await prisma.member.findMany({
    where: { groupId: parseInt(groupId) },
    orderBy: { id: 'asc' }
  });
  res.json(members);
});

// 新增人员
router.post('/groups/:groupId/members', async (req, res) => {
  const { groupId } = req.params;
  const group = await prisma.group.findUnique({ where: { id: parseInt(groupId) } });

  const { idType, name, idNumber, date, trainNo, departStation, arriveStation, seatClass, carriage, seatNo, price, orderNo, needInvoice } = req.body;

  const ticketType = determineTicketType(idType, idNumber, price, group.adultPrice);

  const member = await prisma.member.create({
    data: {
      groupId: parseInt(groupId),
      idType,
      name,
      idNumber,
      date,
      trainNo,
      departStation,
      arriveStation,
      seatClass,
      carriage,
      seatNo,
      price,
      orderNo,
      ticketType,
      status: '正常',
      needInvoice: needInvoice || false
    }
  });
  res.json(member);
});

// 批量导入人员
router.post('/groups/:groupId/members/import', upload.single('file'), async (req, res) => {
  const { groupId } = req.params;
  const group = await prisma.group.findUnique({ where: { id: parseInt(groupId) } });

  if (!req.file) {
    return res.status(400).json({ error: '请上传文件' });
  }

  const members = parseExcel(req.file.path, group.adultPrice);

  const result = await prisma.member.createMany({
    data: members.map(m => ({
      ...m,
      groupId: parseInt(groupId)
    }))
  });

  res.json({ imported: result.count });
});

// 编辑人员
router.put('/members/:id', async (req, res) => {
  const { id } = req.params;
  const { idType, name, idNumber, date, trainNo, departStation, arriveStation, seatClass, carriage, seatNo, price, orderNo, ticketType, needInvoice } = req.body;

  const member = await prisma.member.update({
    where: { id: parseInt(id) },
    data: { idType, name, idNumber, date, trainNo, departStation, arriveStation, seatClass, carriage, seatNo, price, orderNo, ticketType, needInvoice }
  });
  res.json(member);
});

// 删除人员
router.delete('/members/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.member.delete({ where: { id: parseInt(id) } });
  res.json({ success: true });
});

// 人员退票
router.put('/members/:id/refund', async (req, res) => {
  const { id } = req.params;
  const member = await prisma.member.update({
    where: { id: parseInt(id) },
    data: { status: '退票' }
  });
  res.json(member);
});

module.exports = router;
```

- [ ] **Step 2: 在 app.js 中注册路由**

修改 `backend/app.js`:

```javascript
const membersRouter = require('./routes/members');
app.use('/api', membersRouter);
```

- [ ] **Step 3: 提交代码**

```bash
git add backend/routes/members.js
git commit -m "feat: add members API with Excel import"
```

---

## Task 8: 初始化前端项目

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/index.html`
- Create: `frontend/src/main.js`
- Create: `frontend/src/App.vue`

- [ ] **Step 1: 创建前端项目**

```bash
cd C:/project/Travel
npm create vite@latest frontend -- --template vue
cd frontend
npm install
npm install element-plus axios vue-router
```

- [ ] **Step 2: 配置 Element Plus**

修改 `frontend/src/main.js`:

```javascript
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(ElementPlus)
app.use(router)
app.mount('#app')
```

- [ ] **Step 3: 创建路由配置**

创建文件 `frontend/src/router/index.js`:

```javascript
import { createRouter, createWebHistory } from 'vue-router'
import GroupList from '../views/GroupList.vue'
import GroupDetail from '../views/GroupDetail.vue'
import Config from '../views/Config.vue'

const routes = [
  { path: '/', name: 'GroupList', component: GroupList },
  { path: '/group/:id', name: 'GroupDetail', component: GroupDetail },
  { path: '/config', name: 'Config', component: Config }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
```

- [ ] **Step 4: 修改 App.vue**

修改 `frontend/src/App.vue`:

```vue
<template>
  <div id="app">
    <el-container>
      <el-header>
        <div class="header-content">
          <h1>旅游团火车票记录系统</h1>
          <el-menu mode="horizontal" router>
            <el-menu-item index="/">旅游团管理</el-menu-item>
            <el-menu-item index="/config">费用配置</el-menu-item>
          </el-menu>
        </div>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<style>
#app {
  font-family: 'Microsoft YaHei', sans-serif;
}

.el-header {
  background-color: #409EFF;
  color: white;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
}

.header-content h1 {
  font-size: 20px;
  margin: 0;
}

.el-menu--horizontal {
  background-color: transparent;
  border-bottom: none;
}

.el-menu--horizontal .el-menu-item {
  color: white;
}
</style>
```

- [ ] **Step 5: 提交代码**

```bash
git add frontend/
git commit -m "chore: init frontend project with Vue 3 and Element Plus"
```

---

## Task 9: 实现 API 请求封装

**Files:**
- Create: `frontend/src/api/index.js`

- [ ] **Step 1: 创建 API 封装**

创建文件 `frontend/src/api/index.js`:

```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api'
})

// 旅游团 API
export const groupApi = {
  getList: () => api.get('/groups'),
  getDetail: (id) => api.get(`/groups/${id}`),
  create: (data) => api.post('/groups', data),
  update: (id, data) => api.put(`/groups/${id}`, data),
  delete: (id) => api.delete(`/groups/${id}`),
  copyInfo: (id) => api.get(`/groups/${id}/copy`)
}

// 人员 API
export const memberApi = {
  getList: (groupId) => api.get(`/groups/${groupId}/members`),
  create: (groupId, data) => api.post(`/groups/${groupId}/members`, data),
  update: (id, data) => api.put(`/members/${id}`, data),
  delete: (id) => api.delete(`/members/${id}`),
  refund: (id) => api.put(`/members/${id}/refund`),
  import: (groupId, formData) => api.post(`/groups/${groupId}/members/import`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 配置 API
export const configApi = {
  get: () => api.get('/config'),
  update: (data) => api.put('/config', data)
}

export default api
```

- [ ] **Step 2: 提交代码**

```bash
git add frontend/src/api/
git commit -m "feat: add API request wrapper"
```

---

## Task 10: 实现团列表页

**Files:**
- Create: `frontend/src/views/GroupList.vue`

- [ ] **Step 1: 创建团列表页**

创建文件 `frontend/src/views/GroupList.vue`:

```vue
<template>
  <div class="group-list">
    <div class="toolbar">
      <el-button type="primary" @click="showAddDialog = true">新增旅游团</el-button>
    </div>

    <el-table :data="groups" stripe style="width: 100%">
      <el-table-column prop="name" label="团名" min-width="150" />
      <el-table-column prop="trainNo" label="车次" width="100" />
      <el-table-column prop="route" label="行程" width="150" />
      <el-table-column prop="departDate" label="出发日期" width="120" />
      <el-table-column prop="returnDate" label="返回日期" width="120" />
      <el-table-column label="人数" width="80">
        <template #default="{ row }">{{ row._count?.members || 0 }}人</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="goDetail(row.id)">详情</el-button>
          <el-button type="primary" link @click="editGroup(row)">编辑</el-button>
          <el-button type="danger" link @click="deleteGroup(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="showAddDialog" :title="editingGroup ? '编辑旅游团' : '新增旅游团'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="团名">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="车次">
          <el-input v-model="form.trainNo" />
        </el-form-item>
        <el-form-item label="行程">
          <el-input v-model="form.route" placeholder="如：北京-上海" />
        </el-form-item>
        <el-form-item label="出发日期">
          <el-date-picker v-model="form.departDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="返回日期">
          <el-date-picker v-model="form.returnDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="成人票价">
          <el-input-number v-model="form.adultPrice" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="儿童票价">
          <el-input-number v-model="form.childPrice" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="核验数">
          <el-input-number v-model="form.verifyCount" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="电子发票数">
          <el-input-number v-model="form.invoiceCount" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveGroup">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { groupApi } from '../api'

const router = useRouter()
const groups = ref([])
const showAddDialog = ref(false)
const editingGroup = ref(null)

const form = reactive({
  name: '',
  trainNo: '',
  route: '',
  departDate: '',
  returnDate: '',
  adultPrice: 0,
  childPrice: 0,
  verifyCount: 0,
  invoiceCount: 0
})

const loadGroups = async () => {
  const { data } = await groupApi.getList()
  groups.value = data
}

const goDetail = (id) => {
  router.push(`/group/${id}`)
}

const editGroup = (group) => {
  editingGroup.value = group
  Object.assign(form, group)
  showAddDialog.value = true
}

const saveGroup = async () => {
  if (editingGroup.value) {
    await groupApi.update(editingGroup.value.id, form)
    ElMessage.success('修改成功')
  } else {
    await groupApi.create(form)
    ElMessage.success('新增成功')
  }
  showAddDialog.value = false
  editingGroup.value = null
  resetForm()
  loadGroups()
}

const deleteGroup = async (id) => {
  await ElMessageBox.confirm('确定删除该旅游团？', '提示', { type: 'warning' })
  await groupApi.delete(id)
  ElMessage.success('删除成功')
  loadGroups()
}

const resetForm = () => {
  Object.assign(form, {
    name: '',
    trainNo: '',
    route: '',
    departDate: '',
    returnDate: '',
    adultPrice: 0,
    childPrice: 0,
    verifyCount: 0,
    invoiceCount: 0
  })
}

onMounted(loadGroups)
</script>

<style scoped>
.group-list {
  max-width: 1200px;
  margin: 0 auto;
}

.toolbar {
  margin-bottom: 20px;
}
</style>
```

- [ ] **Step 2: 提交代码**

```bash
git add frontend/src/views/GroupList.vue
git commit -m "feat: add group list page"
```

---

## Task 11: 实现团汇总组件

**Files:**
- Create: `frontend/src/components/GroupSummary.vue`

- [ ] **Step 1: 创建团汇总组件**

创建文件 `frontend/src/components/GroupSummary.vue`:

```vue
<template>
  <el-card class="group-summary">
    <template #header>
      <div class="card-header">
        <span>团信息汇总</span>
        <el-button type="primary" size="small" @click="copyInfo">复制团信息</el-button>
      </div>
    </template>

    <el-descriptions :column="2" border>
      <el-descriptions-item label="车次">{{ group.trainNo }}</el-descriptions-item>
      <el-descriptions-item label="行程">{{ group.route }}</el-descriptions-item>
      <el-descriptions-item label="出发日期">{{ group.departDate }}</el-descriptions-item>
      <el-descriptions-item label="返回日期">{{ group.returnDate }}</el-descriptions-item>
    </el-descriptions>

    <el-divider />

    <div class="fee-detail">
      <div class="fee-row">
        <span>成人票：{{ summary.adultCount }}张 × {{ group.adultPrice }}元 = {{ summary.adultCount * group.adultPrice }}元</span>
      </div>
      <div class="fee-row">
        <span>儿童票：{{ summary.childCount }}张 × {{ group.childPrice }}元 = {{ summary.childCount * group.childPrice }}元</span>
      </div>
      <el-divider />
      <div class="fee-row">
        <span>票价小计：{{ summary.ticketTotal }}元</span>
      </div>
      <div class="fee-row">
        <span>购票服务费：{{ summary.adultCount + summary.childCount }}张 × {{ config.serviceFee }}元 = {{ summary.serviceFee }}元</span>
      </div>
      <div class="fee-row">
        <span>退票服务费：{{ summary.refundCount }}张 × {{ config.refundServiceFee }}元 = {{ summary.refundFee }}元</span>
      </div>
      <div class="fee-row">
        <span>核验费：{{ group.verifyCount }}次 × {{ config.foreignIdVerify }}元 = {{ summary.verifyFee }}元</span>
      </div>
      <div class="fee-row">
        <span>电子发票费：{{ summary.invoiceCount }}次 × {{ config.electronicInvoice }}元 = {{ summary.invoiceFee }}元</span>
      </div>
      <el-divider />
      <div class="fee-row total">
        <span>共计：{{ summary.total }}元</span>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  group: { type: Object, default: () => ({}) },
  summary: { type: Object, default: () => ({}) },
  config: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['copy'])

const copyInfo = async () => {
  emit('copy')
}
</script>

<style scoped>
.group-summary {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.fee-detail {
  font-size: 14px;
}

.fee-row {
  padding: 8px 0;
}

.fee-row.total {
  font-size: 18px;
  font-weight: bold;
  color: #409EFF;
}
</style>
```

- [ ] **Step 2: 提交代码**

```bash
git add frontend/src/components/GroupSummary.vue
git commit -m "feat: add group summary component"
```

---

## Task 12: 实现人员表格组件

**Files:**
- Create: `frontend/src/components/MemberTable.vue`

- [ ] **Step 1: 创建人员表格组件**

创建文件 `frontend/src/components/MemberTable.vue`:

```vue
<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>人员明细</span>
        <div>
          <el-button type="primary" size="small" @click="$emit('add')">添加人员</el-button>
          <el-button type="success" size="small" @click="$emit('import')">批量导入</el-button>
        </div>
      </div>
    </template>

    <el-table :data="members" stripe style="width: 100%">
      <el-table-column prop="name" label="姓名" width="100" />
      <el-table-column prop="idType" label="证件类型" width="80" />
      <el-table-column prop="ticketType" label="票型" width="80" />
      <el-table-column prop="trainNo" label="车次" width="100" />
      <el-table-column label="行程" width="150">
        <template #default="{ row }">{{ row.departStation }}-{{ row.arriveStation }}</template>
      </el-table-column>
      <el-table-column prop="seatClass" label="席别" width="80" />
      <el-table-column label="座位" width="100">
        <template #default="{ row }">{{ row.carriage }}车{{ row.seatNo }}</template>
      </el-table-column>
      <el-table-column prop="price" label="票价" width="80" />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === '退票' ? 'warning' : 'success'">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发票" width="60">
        <template #default="{ row }">{{ row.needInvoice ? '✓' : '✗' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="$emit('edit', row)">编辑</el-button>
          <el-button v-if="row.status !== '退票'" type="warning" link @click="$emit('refund', row)">退票</el-button>
          <el-button type="danger" link @click="$emit('delete', row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup>
defineProps({
  members: { type: Array, default: () => [] }
})

defineEmits(['add', 'import', 'edit', 'refund', 'delete'])
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.el-table .el-tag--warning {
  background-color: #fdf6ec;
  border-color: #faecd8;
  color: #e6a23c;
}
</style>
```

- [ ] **Step 2: 提交代码**

```bash
git add frontend/src/components/MemberTable.vue
git commit -m "feat: add member table component"
```

---

## Task 13: 实现导入对话框组件

**Files:**
- Create: `frontend/src/components/ImportDialog.vue`

- [ ] **Step 1: 创建导入对话框组件**

创建文件 `frontend/src/components/ImportDialog.vue`:

```vue
<template>
  <el-dialog v-model="visible" title="批量导入人员" width="500px">
    <el-upload
      drag
      :auto-upload="false"
      :limit="1"
      accept=".xlsx,.xls"
      :on-change="handleFileChange"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">
        将 Excel 文件拖到此处，或<em>点击上传</em>
      </div>
      <template #tip>
        <div class="el-upload__tip">只能上传 xlsx/xls 文件</div>
      </template>
    </el-upload>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleImport" :loading="loading">导入</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'import'])

const visible = ref(props.modelValue)
const selectedFile = ref(null)
const loading = ref(false)

const handleFileChange = (file) => {
  selectedFile.value = file.raw
}

const handleImport = async () => {
  if (!selectedFile.value) {
    return
  }
  loading.value = true
  emit('import', selectedFile.value, () => {
    loading.value = false
    visible.value = false
    selectedFile.value = null
  })
}
</script>
```

- [ ] **Step 2: 提交代码**

```bash
git add frontend/src/components/ImportDialog.vue
git commit -m "feat: add import dialog component"
```

---

## Task 14: 实现团详情页

**Files:**
- Create: `frontend/src/views/GroupDetail.vue`

- [ ] **Step 1: 创建团详情页**

创建文件 `frontend/src/views/GroupDetail.vue`:

```vue
<template>
  <div class="group-detail">
    <el-page-header @back="goBack" :title="group.name" />

    <GroupSummary
      :group="group"
      :summary="summary"
      :config="config"
      @copy="handleCopy"
    />

    <MemberTable
      :members="members"
      @add="showAddMember = true"
      @import="showImport = true"
      @edit="editMember"
      @refund="handleRefund"
      @delete="handleDelete"
    />

    <!-- 添加/编辑人员对话框 -->
    <el-dialog v-model="showAddMember" :title="editingMember ? '编辑人员' : '添加人员'" width="600px">
      <el-form :model="memberForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名">
              <el-input v-model="memberForm.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="证件类型">
              <el-select v-model="memberForm.idType" style="width: 100%">
                <el-option label="二代" value="二代" />
                <el-option label="外护" value="外护" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="证件号码">
              <el-input v-model="memberForm.idNumber" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="日期">
              <el-date-picker v-model="memberForm.date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车次">
              <el-input v-model="memberForm.trainNo" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="发站">
              <el-input v-model="memberForm.departStation" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="到站">
              <el-input v-model="memberForm.arriveStation" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="席别">
              <el-input v-model="memberForm.seatClass" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="车厢">
              <el-input v-model="memberForm.carriage" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="座号">
              <el-input v-model="memberForm.seatNo" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="票价">
              <el-input-number v-model="memberForm.price" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="订单号">
              <el-input v-model="memberForm.orderNo" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="开电子发票">
          <el-switch v-model="memberForm.needInvoice" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddMember = false">取消</el-button>
        <el-button type="primary" @click="saveMember">保存</el-button>
      </template>
    </el-dialog>

    <!-- 导入对话框 -->
    <ImportDialog v-model="showImport" @import="handleImport" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { groupApi, memberApi, configApi } from '../api'
import GroupSummary from '../components/GroupSummary.vue'
import MemberTable from '../components/MemberTable.vue'
import ImportDialog from '../components/ImportDialog.vue'

const route = useRoute()
const router = useRouter()

const group = ref({})
const members = ref([])
const config = ref({})
const showAddMember = ref(false)
const showImport = ref(false)
const editingMember = ref(null)

const summary = computed(() => group.value.summary || {})

const memberForm = reactive({
  idType: '二代',
  name: '',
  idNumber: '',
  date: '',
  trainNo: '',
  departStation: '',
  arriveStation: '',
  seatClass: '',
  carriage: '',
  seatNo: '',
  price: 0,
  orderNo: '',
  needInvoice: false
})

const loadGroup = async () => {
  const { data } = await groupApi.getDetail(route.params.id)
  group.value = data
  members.value = data.members || []
}

const loadConfig = async () => {
  const { data } = await configApi.get()
  config.value = data
}

const goBack = () => {
  router.push('/')
}

const handleCopy = async () => {
  const { data } = await groupApi.copyInfo(route.params.id)
  await navigator.clipboard.writeText(data.text)
  ElMessage.success('已复制到剪贴板')
}

const editMember = (member) => {
  editingMember.value = member
  Object.assign(memberForm, member)
  showAddMember.value = true
}

const saveMember = async () => {
  if (editingMember.value) {
    await memberApi.update(editingMember.value.id, memberForm)
    ElMessage.success('修改成功')
  } else {
    await memberApi.create(route.params.id, memberForm)
    ElMessage.success('添加成功')
  }
  showAddMember.value = false
  editingMember.value = null
  resetMemberForm()
  loadGroup()
}

const handleRefund = async (member) => {
  await ElMessageBox.confirm('确定将该人员标记为退票？', '提示', { type: 'warning' })
  await memberApi.refund(member.id)
  ElMessage.success('已标记退票')
  loadGroup()
}

const handleDelete = async (member) => {
  await ElMessageBox.confirm('确定删除该人员？', '提示', { type: 'warning' })
  await memberApi.delete(member.id)
  ElMessage.success('删除成功')
  loadGroup()
}

const handleImport = async (file, done) => {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await memberApi.import(route.params.id, formData)
  ElMessage.success(`成功导入 ${data.imported} 条记录`)
  done()
  loadGroup()
}

const resetMemberForm = () => {
  Object.assign(memberForm, {
    idType: '二代',
    name: '',
    idNumber: '',
    date: '',
    trainNo: '',
    departStation: '',
    arriveStation: '',
    seatClass: '',
    carriage: '',
    seatNo: '',
    price: 0,
    orderNo: '',
    needInvoice: false
  })
}

onMounted(() => {
  loadGroup()
  loadConfig()
})
</script>

<style scoped>
.group-detail {
  max-width: 1200px;
  margin: 0 auto;
}

.el-page-header {
  margin-bottom: 20px;
}
</style>
```

- [ ] **Step 2: 提交代码**

```bash
git add frontend/src/views/GroupDetail.vue
git commit -m "feat: add group detail page"
```

---

## Task 15: 实现费用配置页

**Files:**
- Create: `frontend/src/views/Config.vue`

- [ ] **Step 1: 创建配置页**

创建文件 `frontend/src/views/Config.vue`:

```vue
<template>
  <div class="config-page">
    <el-card>
      <template #header>
        <span>费用配置</span>
      </template>

      <el-form :model="form" label-width="120px" style="max-width: 400px">
        <el-form-item label="购票服务费">
          <el-input-number v-model="form.serviceFee" :min="0" :precision="2" />
          <span class="unit">元/张</span>
        </el-form-item>
        <el-form-item label="退票服务费">
          <el-input-number v-model="form.refundServiceFee" :min="0" :precision="2" />
          <span class="unit">元/张</span>
        </el-form-item>
        <el-form-item label="外国证件核验费">
          <el-input-number v-model="form.foreignIdVerify" :min="0" :precision="2" />
          <span class="unit">元/次</span>
        </el-form-item>
        <el-form-item label="电子发票费">
          <el-input-number v-model="form.electronicInvoice" :min="0" :precision="2" />
          <span class="unit">元/次</span>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveConfig">保存配置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { configApi } from '../api'

const form = reactive({
  serviceFee: 10,
  refundServiceFee: 20,
  foreignIdVerify: 8,
  electronicInvoice: 3
})

const loadConfig = async () => {
  const { data } = await configApi.get()
  Object.assign(form, data)
}

const saveConfig = async () => {
  await configApi.update(form)
  ElMessage.success('保存成功')
}

onMounted(loadConfig)
</script>

<style scoped>
.config-page {
  max-width: 1200px;
  margin: 0 auto;
}

.unit {
  margin-left: 10px;
  color: #909399;
}
</style>
```

- [ ] **Step 2: 提交代码**

```bash
git add frontend/src/views/Config.vue
git commit -m "feat: add config page"
```

---

## Task 16: 最终测试与集成

- [ ] **Step 1: 启动后端服务**

```bash
cd C:/project/Travel/backend
node app.js
```

- [ ] **Step 2: 启动前端服务**

```bash
cd C:/project/Travel/frontend
npm run dev
```

- [ ] **Step 3: 测试核心功能**

1. 访问 http://localhost:5173
2. 新增一个旅游团
3. 进入团详情，批量导入人员（使用测试 Excel）
4. 查看费用汇总
5. 标记退票，查看费用变化
6. 复制团信息，验证剪贴板内容
7. 修改费用配置，验证计算结果

- [ ] **Step 4: 最终提交**

```bash
git add .
git commit -m "feat: complete travel group train ticket system"
```
