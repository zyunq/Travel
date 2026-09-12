const test = require('node:test')
const assert = require('node:assert/strict')
process.env.JWT_SECRET = 'test-secret'
const { signToken } = require('../utils/auth')
const { requireAuth } = require('./auth')
function response() { return { statusCode: 200, body: undefined, status(code) { this.statusCode = code; return this }, json(body) { this.body = body; return this } } }
test('requireAuth rejects a missing bearer header with 401', () => { const res = response(); let called = false; requireAuth({ headers: {} }, res, () => { called = true }); assert.equal(res.statusCode, 401); assert.equal(called, false) })
test('requireAuth rejects an inactive user with 401', () => { const res = response(); let called = false; const token = signToken({ id: 7, username: 'alice', name: 'Alice', role: 'user', active: false }); requireAuth({ headers: { authorization: `Bearer ${token}` } }, res, () => { called = true }); assert.equal(res.statusCode, 401); assert.equal(called, false) })
test('requireAuth attaches active user claims and calls next', () => { const user = { id: 7, username: 'alice', name: 'Alice', role: 'user', active: true }; const req = { headers: { authorization: `Bearer ${signToken(user)}` } }; const res = response(); let called = false; requireAuth(req, res, () => { called = true }); assert.equal(called, true); assert.deepEqual(req.user, user) })
test('requireAuth reloads the current database user and rejects deactivated accounts', async () => {
  const token = signToken({ id: 7, username: 'alice', name: 'Alice', role: 'user', active: true })
  const req = {
    headers: { authorization: `Bearer ${token}` },
    app: { locals: { prisma: { user: { findUnique: async () => ({ id: 7, username: 'alice', name: 'Alice', role: 'user', active: false }) } } } }
  }
  const res = response()
  let called = false
  await requireAuth(req, res, () => { called = true })
  assert.equal(res.statusCode, 401)
  assert.equal(called, false)
})
