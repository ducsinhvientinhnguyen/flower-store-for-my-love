const jwt = require('jsonwebtoken')

module.exports = function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Token không hợp lệ' })

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token hết hạn hoặc không hợp lệ' })
  }
}
