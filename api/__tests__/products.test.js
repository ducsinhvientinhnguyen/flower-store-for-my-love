process.env.NODE_ENV = 'test'

jest.mock('@prisma/client', () => {
  const mockFindMany = jest.fn()
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      product: { findMany: mockFindMany },
    })),
    _mockFindMany: mockFindMany,
  }
})

const { _mockFindMany } = require('@prisma/client')
const request = require('supertest')
const app = require('../index')

describe('GET /api/products/featured', () => {
  beforeEach(() => jest.clearAllMocks())

  it('trả về sản phẩm active, không cần token', async () => {
    _mockFindMany.mockResolvedValue([
      { id: '1', name: 'Bó Hồng', category: 'Hoa hồng', basePrice: 350000, imageUrl: 'https://x/y.jpg' },
    ])

    const res = await request(app).get('/api/products/featured')

    expect(res.status).toBe(200)
    expect(res.body).toEqual([
      { id: '1', name: 'Bó Hồng', category: 'Hoa hồng', basePrice: 350000, imageUrl: 'https://x/y.jpg' },
    ])
  })

  it('chỉ truy vấn sản phẩm isActive true, tối đa 6, chỉ field công khai', async () => {
    _mockFindMany.mockResolvedValue([])

    await request(app).get('/api/products/featured')

    expect(_mockFindMany).toHaveBeenCalledWith({
      where: { isActive: true },
      take: 6,
      select: { id: true, name: true, category: true, basePrice: true, imageUrl: true },
    })
  })
})
