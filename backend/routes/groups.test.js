const test = require('node:test')
const assert = require('node:assert/strict')

const groupsRouter = require('./groups')

test('delete group handler forwards database failures to Express', async () => {
  const error = new Error('database unavailable')
  const handler = groupsRouter.createDeleteGroupHandler({
    group: {
      delete: async () => {
        throw error
      }
    }
  })
  let forwardedError

  await handler(
    { params: { id: '20' } },
    { json: () => assert.fail('must not send a success response') },
    (receivedError) => {
      forwardedError = receivedError
    }
  )

  assert.equal(forwardedError, error)
})
