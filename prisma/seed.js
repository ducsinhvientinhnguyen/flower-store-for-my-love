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

  const SEED_PRODUCTS = [
    {
      id: '11111111-1111-1111-1111-111111111101',
      name: 'Bó Hồng Hỗn Hợp',
      category: 'Hoa hồng',
      basePrice: 350000,
      imageUrl: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=800&q=80&auto=format&fit=crop',
    },
    {
      id: '11111111-1111-1111-1111-111111111102',
      name: 'Bó Hoa Cưới Trắng',
      category: 'Hoa cưới',
      basePrice: 650000,
      imageUrl: 'https://images.unsplash.com/photo-1523693916903-027d144a2b7d?w=800&q=80&auto=format&fit=crop',
    },
    {
      id: '11111111-1111-1111-1111-111111111103',
      name: 'Bó Hoa Pastel',
      category: 'Hoa hỗn hợp',
      basePrice: 420000,
      imageUrl: 'https://images.unsplash.com/photo-1572454591674-2739f30d8c40?w=800&q=80&auto=format&fit=crop',
    },
    {
      id: '11111111-1111-1111-1111-111111111104',
      name: 'Bó Hoa Sinh Nhật',
      category: 'Hoa hỗn hợp',
      basePrice: 380000,
      imageUrl: 'https://images.unsplash.com/photo-1589095181425-c038b3871b6a?w=800&q=80&auto=format&fit=crop',
    },
    {
      id: '11111111-1111-1111-1111-111111111105',
      name: 'Bó Hướng Dương',
      category: 'Hướng dương',
      basePrice: 320000,
      imageUrl: 'https://images.unsplash.com/photo-1593026238161-ac5f86e5ef79?w=800&q=80&auto=format&fit=crop',
    },
    {
      id: '11111111-1111-1111-1111-111111111106',
      name: 'Bó Mẫu Đơn (Peony)',
      category: 'Mẫu đơn',
      basePrice: 590000,
      imageUrl: 'https://images.unsplash.com/photo-1557926005-012bd4382a0d?w=800&q=80&auto=format&fit=crop',
    },
  ]

  for (const product of SEED_PRODUCTS) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {},
      create: product,
    })
  }

  console.log(`✅ Seed ${SEED_PRODUCTS.length} sản phẩm mẫu`)

  console.log('✅ Seed hoàn tất')
  console.log(`   Email:    admin@flowerstore.com`)
  console.log(`   Password: admin123`)
  console.log(`   Role:     OWNER`)
  console.log(`   ID:       ${owner.id}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
