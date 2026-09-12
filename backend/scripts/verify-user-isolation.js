const prisma = require('../prisma/client')

async function verify({ db = prisma } = {}) {
  const users = await db.user.findMany({ select: { id: true, username: true } })
  if (users.length < 2) throw new Error('need at least two users')
  const [a, b] = users
  const [ga, gb] = await Promise.all([
    db.group.findMany({ where: { ownerId: a.id }, select: { id: true, groupName: true } }),
    db.group.findMany({ where: { ownerId: b.id }, select: { id: true, groupName: true } })
  ])
  if (ga.some(x => gb.some(y => y.id === x.id))) throw new Error('group ownership overlap')
  const [ca, cb] = await Promise.all([
    db.feeConfig.findUnique({ where: { userId: a.id } }),
    db.feeConfig.findUnique({ where: { userId: b.id } })
  ])
  if (ca && cb && ca.userId === cb.userId) throw new Error('fee config ownership overlap')
  return { users: users.length, groups: ga.length + gb.length }
}

if (require.main === module) verify().then(r => console.log(JSON.stringify(r))).catch(e => { console.error(e.message); process.exitCode = 1 }).finally(() => prisma.$disconnect())
module.exports = { verify }
