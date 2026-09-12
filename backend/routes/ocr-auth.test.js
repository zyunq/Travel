const test = require('node:test')
const assert = require('node:assert/strict')
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const router = require('./ocr')

test('OCR operations require authentication', async () => {
  const req = { method: 'GET', url: '/types', originalUrl: '/types', path: '/types', headers: {}, app: { locals: {} } }
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this },
    json(value) { this.body = value; return this }
  }
  await new Promise(resolve => {
    router.handle(req, res, resolve)
    setTimeout(resolve, 300)
  })
  assert.equal(res.statusCode, 401)
})
