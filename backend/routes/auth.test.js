const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('crypto')

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const bcrypt = require('bcryptjs')
const { signToken } = require('../utils/auth')
const { createAuthRouter } = require('./auth')

function md5(value) {
  return crypto.createHash('md5').update(value).digest('hex')
}

function response() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
  }
}

async function dispatch(router, { method, path, body = {}, headers = {}, user } = {}) {
  const req = { method, url: path, originalUrl: path, path, body, headers, user }
  const res = response()
  await new Promise((resolve, reject) => {
    const originalJson = res.json.bind(res)
    res.json = (body) => { originalJson(body); resolve(); return res }
    router.handle(req, res, (error) => error ? reject(error) : resolve())
    setTimeout(resolve, 1000)
  })
  return res
}

function makePrisma(users) {
  return {
    user: {
      findUnique: async ({ where }) => users.find((u) => where.id !== undefined ? u.id === where.id : u.username === where.username) || null,
      update: async ({ where, data }) => {
        const user = users.find((u) => u.id === where.id)
        Object.assign(user, data)
        return user
      },
    },
  }
}

test('login returns a bearer token and sanitized user for bcrypt credentials', async () => {
  const user = { id: 1, username: 'alice', name: 'Alice', role: 'user', active: true, password: await bcrypt.hash('secret', 4) }
  const router = createAuthRouter({ prisma: makePrisma([user]) })
  const res = await dispatch(router, { method: 'POST', path: '/login', body: { username: 'alice', password: 'secret' } })
  assert.equal(res.statusCode, 200)
  assert.equal(typeof res.body.token, 'string')
  assert.deepEqual(res.body.user, { id: 1, username: 'alice', name: 'Alice', role: 'user', active: true })
  assert.equal(res.body.user.password, undefined)
})

test('legacy MD5 login upgrades the password hash to bcrypt once', async () => {
  const user = { id: 1, username: 'alice', name: 'Alice', role: 'user', active: true, password: md5('secret') }
  const router = createAuthRouter({ prisma: makePrisma([user]) })
  const res = await dispatch(router, { method: 'POST', path: '/login', body: { username: 'alice', password: 'secret' } })
  assert.equal(res.statusCode, 200)
  assert.match(user.password, /^\$2[aby]?\$/)
  assert.equal(await bcrypt.compare('secret', user.password), true)
})

test('invalid credentials and inactive users return 401', async () => {
  const users = [
    { id: 1, username: 'alice', name: 'Alice', role: 'user', active: true, password: md5('secret') },
    { id: 2, username: 'disabled', name: 'Disabled', role: 'user', active: false, password: md5('secret') },
  ]
  const router = createAuthRouter({ prisma: makePrisma(users) })
  assert.equal((await dispatch(router, { method: 'POST', path: '/login', body: { username: 'alice', password: 'wrong' } })).statusCode, 401)
  assert.equal((await dispatch(router, { method: 'POST', path: '/login', body: { username: 'disabled', password: 'secret' } })).statusCode, 401)
})

test('me requires a token and returns the current user', async () => {
  const user = { id: 1, username: 'alice', name: 'Alice', role: 'user', active: true, password: md5('secret') }
  const router = createAuthRouter({ prisma: makePrisma([user]) })
  const missing = await dispatch(router, { method: 'GET', path: '/me' })
  assert.equal(missing.statusCode, 401)
  const token = signToken(user)
  const ok = await dispatch(router, { method: 'GET', path: '/me', headers: { authorization: `Bearer ${token}` } })
  assert.equal(ok.statusCode, 200)
  assert.deepEqual(ok.body, { id: 1, username: 'alice', name: 'Alice', role: 'user', active: true })
})

test('password changes use the authenticated user rather than a client userId', async () => {
  const users = [
    { id: 1, username: 'alice', name: 'Alice', role: 'user', active: true, password: md5('old') },
    { id: 2, username: 'bob', name: 'Bob', role: 'user', active: true, password: md5('bob-old') },
  ]
  const router = createAuthRouter({ prisma: makePrisma(users) })
  const token = signToken(users[0])
  const res = await dispatch(router, {
    method: 'PUT', path: '/password',
    headers: { authorization: `Bearer ${token}` },
    body: { userId: 2, oldPassword: 'old', newPassword: 'new' },
  })
  assert.equal(res.statusCode, 200)
  assert.equal(await bcrypt.compare('new', users[0].password), true)
  assert.equal(users[1].password, md5('bob-old'))
})
