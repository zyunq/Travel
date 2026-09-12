const express = require('express')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')
const { signToken } = require('../utils/auth')
const { requireAuth } = require('../middleware/auth')

function md5(value) {
  return crypto.createHash('md5').update(value).digest('hex')
}

function sanitizeUser(user) {
  return { id: user.id, username: user.username, name: user.name, role: user.role, active: user.active !== false }
}

function createAuthRouter({ prisma } = {}) {
  const db = prisma || new PrismaClient()
  const router = express.Router()

  router.post('/login', async (req, res, next) => {
    try {
      const { username, password } = req.body || {}
      if (!username || !password) return res.status(400).json({ error: '请输入用户名和密码' })
      const user = await db.user.findUnique({ where: { username } })
      if (!user || user.active === false) return res.status(401).json({ error: '用户名或密码错误' })
      const stored = String(user.password || '')
      let valid = false
      if (/^\$2[aby]?\$/.test(stored)) valid = await bcrypt.compare(password, stored)
      else if (/^[a-f0-9]{32}$/i.test(stored)) {
        valid = md5(password).toLowerCase() === stored.toLowerCase()
        if (valid) {
          const upgraded = await bcrypt.hash(password, 12)
          await db.user.update({ where: { id: user.id }, data: { password: upgraded } })
          user.password = upgraded
        }
      }
      if (!valid) return res.status(401).json({ error: '用户名或密码错误' })
      const safeUser = sanitizeUser(user)
      return res.json({ token: signToken(safeUser), user: safeUser })
    } catch (error) { return next(error) }
  })

  router.get('/me', requireAuth, async (req, res, next) => {
    try {
      const current = await db.user.findUnique({ where: { id: req.user.id } })
      if (!current || current.active === false) return res.status(401).json({ error: '未授权' })
      return res.json(sanitizeUser(current))
    } catch (error) { return next(error) }
  })

  router.put('/password', requireAuth, async (req, res, next) => {
    try {
      const { oldPassword, newPassword } = req.body || {}
      if (!oldPassword || !newPassword) return res.status(400).json({ error: '请填写完整信息' })
      const user = await db.user.findUnique({ where: { id: req.user.id } })
      if (!user || user.active === false) return res.status(401).json({ error: '未授权' })
      const stored = String(user.password || '')
      const valid = /^\$2[aby]?\$/.test(stored)
        ? await bcrypt.compare(oldPassword, stored)
        : /^[a-f0-9]{32}$/i.test(stored) && md5(oldPassword).toLowerCase() === stored.toLowerCase()
      if (!valid) return res.status(400).json({ error: '原密码错误' })
      await db.user.update({ where: { id: req.user.id }, data: { password: await bcrypt.hash(newPassword, 12) } })
      return res.json({ success: true })
    } catch (error) { return next(error) }
  })

  router.prisma = db
  return router
}

const defaultPrisma = new PrismaClient()
const router = createAuthRouter({ prisma: defaultPrisma })
module.exports = router
module.exports.createAuthRouter = createAuthRouter
module.exports.sanitizeUser = sanitizeUser
module.exports.prisma = defaultPrisma
