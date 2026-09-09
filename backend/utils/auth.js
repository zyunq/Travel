const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

function signToken(user) {
  return jwt.sign({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    active: user.active !== false
  }, JWT_SECRET, { expiresIn: '7d' })
}

function verifyToken(token) {
  const payload = jwt.verify(token, JWT_SECRET)
  return {
    id: payload.id,
    username: payload.username,
    name: payload.name,
    role: payload.role,
    active: payload.active === true
  }
}

module.exports = { signToken, verifyToken }
