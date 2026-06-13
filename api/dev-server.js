require('dotenv').config()
const app = require('./index')
const port = process.env.API_PORT || 3001
app.listen(port, () => console.log(`API server running on http://localhost:${port}`))
