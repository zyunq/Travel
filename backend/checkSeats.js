const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // 查询所有车厢
    const carriages = await prisma.member.findMany({
      select: {
        carriage: true,
        seatNo: true,
        name: true,
        groupId: true
      },
      take: 100
    });

    console.log('========================================');
    console.log('数据库中的座位数据样本（前100条）:');
    console.log('========================================\n');

    // 按车厢分组统计
    const carriageStats = {};
    carriages.forEach(m => {
      const carriage = m.carriage || '未知';
      if (!carriageStats[carriage]) {
        carriageStats[carriage] = [];
      }
      carriageStats[carriage].push(m);
    });

    console.log('车厢统计:');
    Object.keys(carriageStats).sort().forEach(carriage => {
      const members = carriageStats[carriage];
      console.log(`\n${carriage}号车厢: ${members.length} 人`);

      // 显示前5个座位号
      const samples = members.slice(0, 5);
      samples.forEach(m => {
        console.log(`  - ${m.name}: 座位号="${m.seatNo}" (类型: ${typeof m.seatNo}, 长度: ${m.seatNo ? m.seatNo.length : 0})`);
      });

      if (members.length > 5) {
        console.log(`  ... 还有 ${members.length - 5} 人`);
      }
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('查询失败:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
