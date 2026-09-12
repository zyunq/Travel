const test = require('node:test')
const assert = require('node:assert/strict')

const { migrateOwnership } = require('./migrate-ownership')
const { createUser } = require('./create-user')

function makePrisma() {
  const state = {
    users: [{ id: 1, username: 'admin', name: 'Admin', role: 'admin', active: true }],
    groups: [{ id: 10, name: 'Legacy', ownerId: null }, { id: 11, name: 'Owned', ownerId: 1 }],
    feeConfigs: [{ id: 1, userId: null, serviceFee: 12, refundServiceFee: 23, foreignIdVerify: 8, electronicInvoice: 3 }]
  }
  const prisma = {
    user: {
      findUnique: async ({ where }) => state.users.find(u => u.username === where.username || u.id === where.id) || null,
      create: async ({ data }) => { const user = { id: state.users.length + 1, ...data }; state.users.push(user); return user }
    },
    group: {
      updateMany: async ({ where, data }) => { const rows = state.groups.filter(g => where.ownerId === null ? g.ownerId == null : g.ownerId === where.ownerId); rows.forEach(g => Object.assign(g, data)); return { count: rows.length } }
    },
    feeConfig: {
      findFirst: async ({ where } = {}) => state.feeConfigs.find(c => where.userId === undefined || c.userId === where.userId) || null,
      findUnique: async ({ where }) => state.feeConfigs.find(c => c.userId === where.userId) || null,
      update: async ({ where, data }) => { const c = state.feeConfigs.find(c => c.id === where.id); Object.assign(c, data); return c },
      create: async ({ data }) => { const c = { id: state.feeConfigs.length + 1, ...data }; state.feeConfigs.push(c); return c }
    },
    $transaction: async (fn) => typeof fn === 'function' ? fn(prisma) : Promise.all(fn)
  }
  return { prisma, state }
}

test('migrateOwnership backfills legacy rows and preserves fee values', async () => {
  const { prisma, state } = makePrisma()
  const result = await migrateOwnership({ prisma })
  assert.deepEqual(result, { adminId: 1, groupsUpdated: 1, configUpdated: 1 })
  assert.equal(state.groups[0].ownerId, 1)
  assert.equal(state.feeConfigs[0].userId, 1)
  assert.equal(state.feeConfigs[0].serviceFee, 12)
})

test('migrateOwnership is idempotent', async () => {
  const { prisma } = makePrisma()
  await migrateOwnership({ prisma })
  const result = await migrateOwnership({ prisma })
  assert.deepEqual(result, { adminId: 1, groupsUpdated: 0, configUpdated: 0 })
})

test('createUser hashes password and creates zeroed fee config atomically', async () => {
  const { prisma, state } = makePrisma()
  const user = await createUser({ prisma, username: 'alice', password: 'secret', name: 'Alice' })
  assert.equal(user.username, 'alice')
  assert.equal(user.password, undefined)
  assert.notEqual(state.users.find(u => u.id === user.id).password, 'secret')
  assert.equal(state.feeConfigs.at(-1).userId, user.id)
  assert.equal(state.feeConfigs.at(-1).serviceFee, 0)
})

test('createUser rejects duplicate usernames', async () => {
  const { prisma } = makePrisma()
  await assert.rejects(() => createUser({ prisma, username: 'admin', password: 'x', name: 'X' }), /already exists|duplicate/i)
})
