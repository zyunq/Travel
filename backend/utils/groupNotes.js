function appendGroupNote(existing, action, name, price) {
  const label = action === 'refund'
    ? `${name}退票，票价：${price}元`
    : `新增：${name}，票价：${price}元`
  const previous = typeof existing === 'string' ? existing.trim() : ''
  return previous ? `${previous}\n${label}` : label
}

function appendGroupNotes(existing, entries) {
  return entries.reduce(
    (notes, entry) => appendGroupNote(notes, entry.action, entry.name, entry.price),
    existing
  )
}

module.exports = { appendGroupNote, appendGroupNotes }
