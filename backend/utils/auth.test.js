const test = require('node:test')
const assert = require('node:assert/strict')
process.env.JWT_SECRET = 'test-secret'
const { signToken, verifyToken } = require('./auth')
const user = { id: 7, username: 'alice', name: 'Alice', role: 'user', active: true }
test('signToken and verifyToken round-trip the authenticated user claims', () => { assert.deepEqual(verifyToken(signToken(user)), user) })
test('verifyToken rejects malformed tokens', () => { assert.throws(() => verifyToken('not-a-jwt'), /jwt malformed/i) })
test('verifyToken rejects expired tokens', () => { const jwt = require('jsonwebtoken'); const expired = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: -1 }); assert.throws(() => verifyToken(expired), /jwt expired/i) })

