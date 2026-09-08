function normalizeMemberPrice(value) {
  if (value === '' || value === null || value === undefined) {
    return 0
  }

  const price = typeof value === 'number' ? value : Number(String(value).trim())
  if (!Number.isFinite(price) || price < 0) {
    const error = new Error('票价必须是有效的非负数字')
    error.status = 400
    throw error
  }

  return price
}

module.exports = { normalizeMemberPrice }
