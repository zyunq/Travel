const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// ============ 日志系统 ============
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 获取当前时间戳
function getTimestamp() {
  return new Date().toISOString();
}

// 格式化日志
function formatLog(level, message, data = {}) {
  const logEntry = {
    timestamp: getTimestamp(),
    level,
    message,
    ...data
  };
  return JSON.stringify(logEntry) + '\n';
}

// 写入日志文件
function writeLog(filename, content) {
  const logFile = path.join(logsDir, filename);
  const date = new Date().toISOString().split('T')[0];
  const dailyLogFile = path.join(logsDir, `${filename.replace('.log', '')}-${date}.log`);

  fs.appendFileSync(dailyLogFile, content, 'utf8');
}

// 全局 Logger 对象
global.logger = {
  info(message, data = {}) {
    const log = formatLog('INFO', message, data);
    console.log(log.trim());
    writeLog('app.log', log);
  },
  error(message, data = {}) {
    const log = formatLog('ERROR', message, data);
    console.error(log.trim());
    writeLog('error.log', log);
  },
  warn(message, data = {}) {
    const log = formatLog('WARN', message, data);
    console.warn(log.trim());
    writeLog('app.log', log);
  },
  request(req, res, duration) {
    const log = formatLog('HTTP', `${req.method} ${req.url}`, {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
    writeLog('request.log', log);
  }
};

// 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    global.logger.request(req, res, duration);
  });

  next();
});

// ============ 原有配置 ============

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

// ============ 错误处理中间件 ============

// 404 处理
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

// 全局错误处理
app.use((err, req, res, next) => {
  const status = err.status || 500;

  // 记录错误日志
  global.logger.error('Unhandled Error', {
    status,
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params
  });

  res.status(status).json({
    success: false,
    error: err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// 未捕获的 Promise 异常
process.on('unhandledRejection', (reason, promise) => {
  global.logger.error('Unhandled Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack
  });
});

// 未捕获的异常
process.on('uncaughtException', (error) => {
  global.logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack
  });
  process.exit(1);
});

const PORT = 3000;
app.listen(PORT, () => {
  global.logger.info(`Server started`, { port: PORT });
  console.log(`Server running on port ${PORT}`);
});
