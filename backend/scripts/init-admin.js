const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// MD5 加密函数
function md5(text) {
  return crypto.createHash('md5').update(text).digest('hex');
}

async function main() {
  // 检查是否已存在管理员
  const existingAdmin = await prisma.user.findUnique({
    where: { username: 'admin' }
  });

  if (existingAdmin) {
    console.log('管理员账户已存在');
    return;
  }

  // 创建默认管理员账户
  // 用户名: admin, 密码: admin123
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: md5('admin123'),
      name: '管理员',
      role: 'admin'
    }
  });

  console.log('管理员账户创建成功！');
  console.log('用户名: admin');
  console.log('密码: admin123');
  console.log('');
  console.log('请登录后立即修改密码！');
}

main()
  .catch((e) => {
    console.error('创建失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
