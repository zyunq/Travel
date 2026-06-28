const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const prisma = new (require('@prisma/client').PrismaClient)();

// MD5 加密函数
function md5(text) {
  return crypto.createHash('md5').update(text).digest('hex');
}

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '请输入用户名和密码' });
    }

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const passwordHash = md5(password);
    if (user.password !== passwordHash) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 返回用户信息（不包含密码）
    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// 注册（仅用于创建初始用户）
router.post('/register', async (req, res) => {
  try {
    const { username, password, name, role } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const passwordHash = md5(password);

    const user = await prisma.user.create({
      data: {
        username,
        password: passwordHash,
        name,
        role: role || 'user'
      }
    });

    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

// 获取当前用户信息
router.get('/me', async (req, res) => {
  // 简单实现：前端存储用户信息，这里仅作验证
  res.json({ message: 'Session-based auth' });
});

// 修改密码
router.put('/password', async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;

    if (!userId || !oldPassword || !newPassword) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    if (user.password !== md5(oldPassword)) {
      return res.status(400).json({ error: '原密码错误' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { password: md5(newPassword) }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: '修改密码失败' });
  }
});

module.exports = router;
