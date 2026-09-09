import test from 'node:test'
import assert from 'node:assert/strict'

import * as groupDetail from '../src/utils/group-detail.mjs'

const { parseTripId, requestGroupDetail } = groupDetail

test('parseTripId accepts a positive integer route parameter', () => {
  assert.equal(parseTripId({ id: '20' }), 20)
})

test('parseTripId rejects missing or malformed route parameters', () => {
  assert.equal(parseTripId(), null)
  assert.equal(parseTripId({}), null)
  assert.equal(parseTripId({ id: '0' }), null)
  assert.equal(parseTripId({ id: '20abc' }), null)
})

test('requestGroupDetail returns the detail from a successful response', async () => {
  let requestedUrl = ''
  const request = (options) => {
    requestedUrl = options.url
    options.success({
      statusCode: 200,
      data: { id: 20, groupName: '长沙团', members: [{ id: 1 }] }
    })
  }

  const detail = await requestGroupDetail({
    request,
    baseUrl: 'https://api.zyqing.xyz/api',
    tripId: 20
  })

  assert.equal(requestedUrl, 'https://api.zyqing.xyz/api/groups/20')
  assert.equal(detail.id, 20)
  assert.equal(detail.members.length, 1)
})

test('requestGroupDetail rejects non-success HTTP responses', async () => {
  const request = (options) => {
    options.success({ statusCode: 404, data: { error: '团不存在' } })
  }

  await assert.rejects(
    requestGroupDetail({
      request,
      baseUrl: 'https://api.zyqing.xyz/api',
      tripId: 999
    }),
    /团不存在/
  )
})

test('requestAddMember posts the passenger to the selected trip', async () => {
  const passenger = {
    name: '张三',
    idNumber: '430102199001011234',
    ticketType: '成人',
    price: '553'
  }

  const request = (options) => {
    assert.equal(
      options.url,
      'https://api.zyqing.xyz/api/groups/20/members'
    )
    assert.equal(options.method, 'POST')
    assert.deepEqual(options.data, { ...passenger, price: 553 })
    options.success({
      statusCode: 200,
      data: { id: 8, groupId: 20, ...passenger }
    })
  }

  const member = await groupDetail.requestAddMember({
    request,
    baseUrl: 'https://api.zyqing.xyz/api',
    tripId: 20,
    member: passenger
  })

  assert.equal(member.id, 8)
  assert.equal(member.groupId, 20)
})

test('requestAddMember rejects non-success HTTP responses', async () => {
  const request = (options) => {
    options.success({ statusCode: 500, data: { error: '新增成员失败' } })
  }

  await assert.rejects(
    groupDetail.requestAddMember({
      request,
      baseUrl: 'https://api.zyqing.xyz/api',
      tripId: 20,
      member: { name: '张三' }
    }),
    /新增成员失败/
  )
})

test('requestDeleteGroup deletes only the selected trip', async () => {
  const request = (options) => {
    assert.equal(
      options.url,
      'https://api.zyqing.xyz/api/groups/20'
    )
    assert.equal(options.method, 'DELETE')
    options.success({
      statusCode: 200,
      data: { success: true }
    })
  }

  const result = await groupDetail.requestDeleteGroup({
    request,
    baseUrl: 'https://api.zyqing.xyz/api',
    tripId: 20
  })

  assert.deepEqual(result, { success: true })
})

test('requestDeleteGroup exposes a failed deletion response', async () => {
  const request = (options) => {
    options.success({ statusCode: 500, data: { error: '删除行程失败' } })
  }

  await assert.rejects(
    groupDetail.requestDeleteGroup({
      request,
      baseUrl: 'https://api.zyqing.xyz/api',
      tripId: 20
    }),
    /删除行程失败/
  )
})

test('buildDeleteTripConfirmation identifies the exact destructive target', () => {
  assert.equal(
    groupDetail.buildDeleteTripConfirmation({
      groupName: '长沙团',
      tripType: '去程',
      trainNo: 'G123',
      memberCount: 8
    }),
    '确定删除“长沙团”的去程（G123）吗？该行程及其 8 名乘客将被永久删除，此操作无法撤销。'
  )
})
