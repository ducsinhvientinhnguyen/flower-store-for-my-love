const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email và mật khẩu là bắt buộc' })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' })
  }

  const accessToken = jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  )
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  )

  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)
  res.json({
    accessToken,
    user: { id: user.id, name: user.name, role: user.role },
  })
})

router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refreshToken
  if (!token) return res.status(401).json({ error: 'Không có refresh token' })

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
    const user = await prisma.user.findUnique({ where: { id: payload.id } })
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Tài khoản không hợp lệ' })
    }
    const accessToken = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    )
    res.json({ accessToken })
  } catch {
    res.status(401).json({ error: 'Refresh token hết hạn' })
  }
})

router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', COOKIE_OPTIONS)
  res.json({ ok: true })
})

module.exports = router
