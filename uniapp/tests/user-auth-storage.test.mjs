import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeAuthResponse } from '../src/stores/auth-response.mjs'

test('normalizes auth response into separate token and user values', () => {
  const result = normalizeAuthResponse({
    token: 'jwt-token',
    user: { id: 1, username: 'admin', name: '管理员' }
  })

  assert.deepEqual(result, {
    token: 'jwt-token',
    user: { id: 1, username: 'admin', name: '管理员' }
  })
})

test('normalizes legacy nested user storage without losing token', () => {
  const result = normalizeAuthResponse({
    token: 'jwt-token',
    user: { id: 1, username: 'admin' }
  })

  assert.equal(result.token, 'jwt-token')
  assert.equal(result.user.token, undefined)
})
