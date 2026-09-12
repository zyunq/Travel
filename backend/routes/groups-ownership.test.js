const test = require('node:test')
const assert = require('node:assert/strict')
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const { signToken } = require('../utils/auth')
const prisma = require('../prisma/client')
const router = require('./groups')

function response() {
  return { statusCode: 200, body: undefined,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
    send(body) { this.body = body; return this } }
}

async function dispatch({ method, path, user, body = {} }) {
  const req = {
    method, url: path, originalUrl: path, path, body,
    headers: { authorization: `Bearer ${signToken(user)}` },
    app: { locals: { prisma: { user: { findUnique: async ({ where }) => ({ id: where.id, username: user.username, name: user.name, role: 'user', active: true }) } } } }
  }
  const res = response()
  await new Promise((resolve, reject) => {
    const original = res.json.bind(res)
    res.json = (value) => { original(value); resolve(); return res }
    router.handle(req, res, (err) => err ? reject(err) : resolve())
    setTimeout(resolve, 300)
  })
  return res
}

test('group list is filtered by authenticated owner', async () => {
  const original = prisma.group.findMany
  let where
  prisma.group.findMany = async (args) => { where = args.where; return [{ id: 1, ownerId: 1, groupName: 'same' }] }
  try {
    const res = await dispatch({ method: 'GET', path: '/', user: { id: 1, username: 'alice', name: 'Alice', role: 'user', active: true } })
    assert.equal(res.statusCode, 200)
    assert.deepEqual(where, { ownerId: 1 })
  } finally { prisma.group.findMany = original }
})

test('group detail for another owner returns 404', async () => {
  const original = prisma.group.findFirst
  prisma.group.findFirst = async () => null
  try {
    const res = await dispatch({ method: 'GET', path: '/99', user: { id: 1, username: 'alice', name: 'Alice', role: 'user', active: true } })
    assert.equal(res.statusCode, 404)
  } finally { prisma.group.findFirst = original }
})
