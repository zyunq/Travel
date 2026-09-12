const bcrypt = require('bcryptjs')
const prismaDefault = require('../prisma/client')

async function createUser({ prisma = prismaDefault, username, password, name }) {
  if (!username || !password || !name) throw new Error('username, password and name are required')
  const run = async (db) => {
    const existing = await db.user.findUnique({ where: { username } })
    if (existing) throw new Error(`user ${username} already exists`)
    const hash = await bcrypt.hash(password, 10)
    try {
      const user = await db.user.create({ data: { username, password: hash, name, role: 'user', active: true } })
      await db.feeConfig.create({ data: { userId: user.id, serviceFee: 0, refundServiceFee: 0, foreignIdVerify: 0, electronicInvoice: 0 } })
      const { password: _password, ...sanitized } = user
      return sanitized
    } catch (error) {
      if (error && error.code === 'P2002') throw new Error(`user ${username} already exists`)
      throw error
    }
  }
  return prisma.$transaction ? prisma.$transaction(run) : run(prisma)
}

if (require.main === module) {
  const [username, name, suppliedPassword] = process.argv.slice(2)
  const readPassword = suppliedPassword
    ? Promise.resolve(suppliedPassword)
    : new Promise((resolve) => {
      const readline = require('readline')
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
      rl.question('Password: ', (answer) => { rl.close(); resolve(answer) })
    })
  readPassword.then((password) => createUser({ username, password, name })).then((user) => {
    console.log(`created user ${user.username} (id=${user.id})`)
  }).catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  }).finally(() => prismaDefault.$disconnect?.())
}

module.exports = { createUser }
