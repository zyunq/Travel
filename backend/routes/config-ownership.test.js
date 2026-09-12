const test = require('node:test')
const assert = require('node:assert/strict')
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const { signToken } = require('../utils/auth')
const prisma = require('../prisma/client')
const router = require('./config')

function response() { return { statusCode: 200, body: undefined, status(c) { this.statusCode = c; return this }, json(v) { this.body = v; return this } } }
async function dispatch({ method, path, user, body = {} }) {
  const req = { method, url: path, originalUrl: path, path, body, headers: { authorization: `Bearer ${signToken(user)}` }, app: { locals: { prisma: { user: { findUnique: async ({ where }) => ({ id: where.id, username: user.username, name: user.name, role: 'user', active: true }) } } } } }
  const res = response()
  await new Promise((resolve, reject) => { const original = res.json.bind(res); res.json = (v) => { original(v); resolve(); return res }; router.handle(req, res, (e) => e ? reject(e) : resolve()); setTimeout(resolve, 300) })
  return res
}

test('config reads and writes the authenticated user config, ignoring client ids', async () => {
  const originalFind = prisma.feeConfig.findUnique
  const originalUpsert = prisma.feeConfig.upsert
  let findArgs, upsertArgs
  prisma.feeConfig.findUnique = async (args) => { findArgs = args; return { id: 7, userId: 2, serviceFee: 3, refundServiceFee: 0, foreignIdVerify: 0, electronicInvoice: 0 } }
  prisma.feeConfig.upsert = async (args) => { upsertArgs = args; return { id: 8, userId: 2, ...args.update } }
  try {
    const user = { id: 2, username: 'bob', name: 'Bob', role: 'user', active: true }
    const getRes = await dispatch({ method: 'GET', path: '/', user })
    assert.equal(getRes.statusCode, 200)
    assert.deepEqual(findArgs.where, { userId: 2 })
    await dispatch({ method: 'PUT', path: '/', user, body: { id: 1, userId: 1, serviceFee: 9, refundServiceFee: 4, foreignIdVerify: 2, electronicInvoice: 1 } })
    assert.deepEqual(upsertArgs.where, { userId: 2 })
    assert.equal(upsertArgs.create.userId, 2)
  } finally { prisma.feeConfig.findUnique = originalFind; prisma.feeConfig.upsert = originalUpsert }
})
