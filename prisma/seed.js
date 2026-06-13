require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10)

  const owner = await prisma.user.upsert({
    where: { email: 'admin@flowerstore.com' },
    update: {},
    create: {
      name: 'Chủ shop',
      email: 'admin@flowerstore.com',
      passwordHash,
      role: 'OWNER',
    },
  })

  console.log('✅ Seed hoàn tất')
  console.log(`   Email:    admin@flowerstore.com`)
  console.log(`   Password: admin123`)
  console.log(`   Role:     OWNER`)
  console.log(`   ID:       ${owner.id}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
