# 数据库迁移说明

新增了 `serviceFeeCount` 字段（累计购票张数），需要运行以下命令：

```bash
cd backend
npx prisma migrate dev --name add_service_fee_count
```

或者如果只是开发环境，可以直接推送：

```bash
cd backend
npx prisma db push
```

然后重启后端服务：

```bash
npm run dev
```

## 对于已存在的数据

如果已有数据，需要手动更新 `serviceFeeCount` 为当前成员数量：

```sql
UPDATE "Group" SET "serviceFeeCount" = (SELECT COUNT(*) FROM "Member" WHERE "Member"."groupId" = "Group"."id");
```

或者通过 Prisma Studio 操作：

```bash
npx prisma studio
```
