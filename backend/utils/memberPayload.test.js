const test = require('node:test')
const assert = require('node:assert/strict')

const { normalizeMemberPrice } = require('./memberPayload')

test('normalizeMemberPrice converts mini-program string prices to numbers', () => {
  assert.equal(normalizeMemberPrice('553'), 553)
  assert.equal(normalizeMemberPrice(' 553.5 '), 553.5)
})

test('normalizeMemberPrice defaults empty values to zero', () => {
  assert.equal(normalizeMemberPrice(''), 0)
  assert.equal(normalizeMemberPrice(null), 0)
})

test('normalizeMemberPrice rejects invalid or negative prices', () => {
  assert.throws(() => normalizeMemberPrice('abc'), /票价必须是有效的非负数字/)
  assert.throws(() => normalizeMemberPrice(-1), /票价必须是有效的非负数字/)
})
