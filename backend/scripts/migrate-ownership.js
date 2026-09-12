const prismaDefault = require('../prisma/client')
const bcrypt = require('bcryptjs')

/** Backfill ownership for legacy rows. Safe to run repeatedly. */
async function migrateOwnership({ prisma = prismaDefault } = {}) {
  const run = async (db) => {
    const admin = await db.user.findUnique({ where: { username: 'admin' } })
    const resolvedAdmin = admin || await db.user.create({
      data: {
        username: 'admin',
        password: await bcrypt.hash('admin123', 10),
        name: '管理员',
        role: 'admin',
        active: true
      }
    })

    const groupsResult = await db.group.updateMany({
      where: { ownerId: null },
      data: { ownerId: resolvedAdmin.id }
    })

    let configUpdated = 0
    const adminConfig = await db.feeConfig.findUnique({ where: { userId: resolvedAdmin.id } })
    if (!adminConfig) {
      const legacy = await db.feeConfig.findFirst({ where: { userId: null } })
      if (legacy) {
        await db.feeConfig.update({ where: { id: legacy.id }, data: { userId: resolvedAdmin.id } })
        configUpdated = 1
      } else {
        await db.feeConfig.create({
          data: {
            userId: resolvedAdmin.id,
            serviceFee: 0,
            refundServiceFee: 0,
            foreignIdVerify: 0,
            electronicInvoice: 0
          }
        })
        configUpdated = 1
      }
    }
    return { adminId: resolvedAdmin.id, groupsUpdated: groupsResult.count || 0, configUpdated }
  }
  return prisma.$transaction ? prisma.$transaction(run) : run(prisma)
}

if (require.main === module) {
  migrateOwnership().then((result) => {
    console.log(JSON.stringify(result))
  }).catch((error) => {
    console.error(error)
    process.exitCode = 1
  }).finally(() => prismaDefault.$disconnect?.())
}

module.exports = { migrateOwnership }
