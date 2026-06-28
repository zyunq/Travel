# 旅游团火车票记录系统

## 系统概述

这是一个旅行社内部火车票管理系统，用于记录旅游团的票务信息、人员明细和费用计算。

## 技术栈

- 前端：Vue 3 + Element Plus
- 后端：Node.js + Express
- 数据库：SQLite (Prisma ORM)

## 快速启动

### 1. 启动后端
```bash
cd backend
node app.js
```
后端服务运行在 http://localhost:3000

### 2. 启动前端
```bash
cd frontend
npm run dev
```
前端服务运行在 http://localhost:5173

## 功能特点

- ✅ 旅游团管理（分类、搜索、合并）
- ✅ 行程管理（去程/返程）
- ✅ 人员管理（添加、导入、退票）
- ✅ 费用自动计算
- ✅ 座位表导出
- ✅ 团信息复制

## 文档

详细设计文档请查看：
- [系统设计文档](docs/superpowers/specs/2026-06-15-travel-group-system-design.md)
- [实施计划](docs/superpowers/plans/2026-06-15-travel-group-system-plan.md)
