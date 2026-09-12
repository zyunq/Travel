const test = require('node:test')
const assert = require('node:assert/strict')
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const { signToken } = require('../utils/auth')
const prisma = require('../prisma/client')
const router = require('./members')

function response() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
    send(body) { this.body = body; return this }
  }
}

async function dispatch({ method, path, user, body = {}, headers } = {}) {
  const req = {
    method, url: path, originalUrl: path, path, body,
    headers: headers || (user ? { authorization: `Bearer ${signToken(user)}` } : {}),
    app: { locals: { prisma: { user: { findUnique: async ({ where }) => ({ id: where.id, username: user?.username || 'u', name: 'User', role: 'user', active: true }) } } } }
  }
  const res = response()
  await new Promise((resolve, reject) => {
    const original = res.json.bind(res)
    res.json = value => { original(value); resolve(); return res }
    router.handle(req, res, err => err ? reject(err) : resolve())
    setTimeout(resolve, 300)
  })
  return res
}

test('member operations require authentication', async () => {
  const res = await dispatch({ method: 'GET', path: '/groups/1/members' })
  assert.equal(res.statusCode, 401)
})

test('member list for another owner returns 404', async () => {
  const original = prisma.group.findFirst
  prisma.group.findFirst = async () => null
  try {
    const res = await dispatch({ method: 'GET', path: '/groups/99/members', user: { id: 1, username: 'alice', active: true } })
    assert.equal(res.statusCode, 404)
  } finally { prisma.group.findFirst = original }
})

test('member mutation for another owner returns 404', async () => {
  const originalMember = prisma.member.findUnique
  const originalGroup = prisma.group.findFirst
  prisma.member.findUnique = async () => ({ id: 7, groupId: 99, name: 'Secret' })
  prisma.group.findFirst = async () => null
  try {
    const res = await dispatch({ method: 'PUT', path: '/members/7', user: { id: 1, username: 'alice', active: true }, body: { name: 'Changed' } })
    assert.equal(res.statusCode, 404)
  } finally {
    prisma.member.findUnique = originalMember
    prisma.group.findFirst = originalGroup
  }
})

test('refund for another owner returns 404', async () => {
  const originalTransaction = prisma.$transaction
  prisma.$transaction = async callback => callback({
    member: { findUnique: async () => ({ id: 7, groupId: 99, status: '正常', name: 'Secret', price: 10 }) },
    group: { findFirst: async () => null }
  })
  try {
    const res = await dispatch({ method: 'PUT', path: '/members/7/refund', user: { id: 1, username: 'alice', active: true } })
    assert.equal(res.statusCode, 404)
  } finally { prisma.$transaction = originalTransaction }
})

