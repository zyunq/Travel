const test = require('node:test')
const assert = require('node:assert/strict')
const { verify } = require('./verify-user-isolation')
test('verify detects disjoint group and fee ownership', async () => {
  const db = { user: { findMany: async () => [{ id: 1 }, { id: 2 }] }, group: { findMany: async ({ where }) => [{ id: where.ownerId, groupName: 'same' }] }, feeConfig: { findUnique: async ({ where }) => ({ userId: where.userId }) } }
  assert.deepEqual(await verify({ db }), { users: 2, groups: 2 })
})
