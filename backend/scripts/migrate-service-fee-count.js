// 迁移脚本：初始化 serviceFeeCount
// 运行方式：node scripts/migrate-service-fee-count.js

const prisma = require('../prisma/client');

async function migrate() {
  console.log('开始迁移...');

  // 获取所有团
  const groups = await prisma.group.findMany({
    include: { members: true }
  });

  console.log(`找到 ${groups.length} 个团`);

  for (const group of groups) {
    // 将 serviceFeeCount 设置为当前成员数量
    await prisma.group.update({
      where: { id: group.id },
      data: { serviceFeeCount: group.members.length }
    });
    console.log(`更新团 ${group.name}: serviceFeeCount = ${group.members.length}`);
  }

  console.log('迁移完成！');
  process.exit(0);
}

migrate().catch(console.error);
