const router = require('express').Router()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

router.get('/featured', async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      take: 6,
      select: { id: true, name: true, category: true, basePrice: true, imageUrl: true },
    })

    res.json(products.map(p => ({ ...p, basePrice: Number(p.basePrice) })))
  } catch (err) {
    next(err)
  }
})

module.exports = router
