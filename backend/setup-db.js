const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function md5(text) {
  return crypto.createHash('md5').update(text).digest('hex');
}

async function setup() {
  try {
    // 检查表是否存在，不存在则创建
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS User (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        name TEXT,
        role TEXT DEFAULT 'user'
      )
    `);
    console.log('User 表已就绪');

    // 创建管理员
    const passwordHash = md5('admin123');
    try {
      const user = await prisma.user.create({
        data: {
          username: 'admin',
          password: passwordHash,
          name: '管理员',
          role: 'admin'
        }
      });
      console.log('管理员账户创建成功！');
      console.log('用户名: admin');
      console.log('密码: admin123');
    } catch (e) {
      if (e.code === 'P2002') {
        console.log('管理员账户已存在');
      } else {
        throw e;
      }
    }
  } catch (error) {
    console.error('设置失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setup();
