const test = require('node:test')
const assert = require('node:assert/strict')

const { appendGroupNote } = require('./groupNotes')

test('appendGroupNote appends an add record to an existing note', () => {
  assert.equal(
    appendGroupNote('已收定金', 'add', '张三', 164),
    '已收定金\n新增：张三，票价：164元'
  )
})

test('appendGroupNote appends a refund record and keeps history', () => {
  assert.equal(
    appendGroupNote('新增：张三，票价：164元', 'refund', '张三', 164),
    '新增：张三，票价：164元\n张三退票，票价：164元'
  )
})

test('appendGroupNote trims blank notes and formats decimal prices', () => {
  assert.equal(
    appendGroupNote('  ', 'add', '李四', 82.5),
    '新增：李四，票价：82.5元'
  )
})
