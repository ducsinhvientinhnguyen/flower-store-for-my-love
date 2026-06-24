const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

app.get('/api/health', (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV, ts: Date.now() })
})

app.use('/api/auth', require('./routes/auth'))
app.use('/api/products', require('./routes/products'))

app.use((err, req, res, next) => {
  console.error('[API Error]', err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

module.exports = app
