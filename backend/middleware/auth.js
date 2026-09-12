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

    // In the running application, refresh the identity from the database so
    // deactivated users are rejected immediately. Unit callers that do not
    // provide app.locals.prisma retain the original synchronous interface.
    const prisma = req.app && req.app.locals && req.app.locals.prisma
    if (prisma && prisma.user && typeof prisma.user.findUnique === 'function') {
      return Promise.resolve(prisma.user.findUnique({ where: { id: user.id } }))
        .then(current => {
          if (!current || current.active === false) return unauthorized(res)
          req.user = {
            id: current.id,
            username: current.username,
            name: current.name,
            role: current.role,
            active: current.active !== false
          }
          return next()
        })
        .catch(() => unauthorized(res))
    }
    req.user = user
    return next()
  } catch (error) {
    return unauthorized(res)
  }
}

module.exports = { requireAuth }
