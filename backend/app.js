const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// 配置 CORS，允许前端访问所有响应头
app.use(cors({
  origin: '*',
  exposedHeaders: ['Content-Disposition'] // 暴露 Content-Disposition 头
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 路由注册
const configRouter = require('./routes/config');
const groupsRouter = require('./routes/groups');
const membersRouter = require('./routes/members');
const authRouter = require('./routes/auth');

app.use('/api/config', configRouter);
app.use('/api/groups', groupsRouter);
app.use('/api', membersRouter);
app.use('/api/auth', authRouter);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
