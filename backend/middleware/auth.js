const { verifyToken } = require('../utils/auth')

function unauthorized(res) {
  return res.status(401).json({ error: '未授权' })
}

function requireAuth(req, res, next) {
  const header = req.headers && (req.headers.authorization || req.headers.Authorization)
  if (!header || !/^Bearer\s+\S+$/i.test(header)) return unauthorized(res)

  try {
    const token = header.replace(/^Bearer\s+/i, '')
    const user = verifyToken(token)
    if (!user.active) return unauthorized(res)
    req.user = user
    return next()
  } catch (error) {
    return unauthorized(res)
  }
}

module.exports = { requireAuth }
