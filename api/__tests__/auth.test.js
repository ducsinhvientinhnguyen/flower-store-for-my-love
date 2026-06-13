const request = require('supertest')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

process.env.JWT_SECRET = 'test-secret'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'
process.env.NODE_ENV = 'test'

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockFindUnique = jest.fn()
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: { findUnique: mockFindUnique },
    })),
    _mockFindUnique: mockFindUnique,
  }
})

const { _mockFindUnique } = require('@prisma/client')
const app = require('../index')

describe('POST /api/auth/login', () => {
  const passwordHash = bcrypt.hashSync('password123', 10)
  const mockUser = {
    id: 'user-1',
    name: 'Chủ shop',
    email: 'owner@test.com',
    passwordHash,
    role: 'OWNER',
    isActive: true,
  }

  beforeEach(() => jest.clearAllMocks())

  it('trả về accessToken khi đúng credentials', async () => {
    _mockFindUnique.mockResolvedValue(mockUser)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@test.com', password: 'password123' })

    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeDefined()
    expect(res.body.user.role).toBe('OWNER')
    expect(res.body.user.passwordHash).toBeUndefined()
    expect(res.headers['set-cookie']).toBeDefined()
  })

  it('trả về 401 khi sai mật khẩu', async () => {
    _mockFindUnique.mockResolvedValue(mockUser)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@test.com', password: 'wrong' })

    expect(res.status).toBe(401)
  })

  it('trả về 401 khi email không tồn tại', async () => {
    _mockFindUnique.mockResolvedValue(null)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'password123' })

    expect(res.status).toBe(401)
  })

  it('trả về 401 khi tài khoản bị vô hiệu hóa', async () => {
    _mockFindUnique.mockResolvedValue({ ...mockUser, isActive: false })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@test.com', password: 'password123' })

    expect(res.status).toBe(401)
  })
})

describe('POST /api/auth/refresh', () => {
  const mockUser = {
    id: 'user-1',
    name: 'Chủ shop',
    email: 'owner@test.com',
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'OWNER',
    isActive: true,
  }

  beforeEach(() => jest.clearAllMocks())

  it('trả về accessToken mới với đủ payload {id,role,name}', async () => {
    _mockFindUnique.mockResolvedValue(mockUser)
    const refreshToken = jwt.sign({ id: 'user-1' }, 'test-refresh-secret', { expiresIn: '7d' })

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refreshToken=${refreshToken}`)

    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeDefined()
    const decoded = jwt.verify(res.body.accessToken, 'test-secret')
    expect(decoded.role).toBe('OWNER')
    expect(decoded.name).toBe('Chủ shop')
  })

  it('trả về 401 khi không có refreshToken', async () => {
    const res = await request(app).post('/api/auth/refresh')
    expect(res.status).toBe(401)
  })
})
