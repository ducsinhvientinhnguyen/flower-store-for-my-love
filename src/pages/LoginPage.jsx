import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { api } from '../lib/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore(s => s.setAuth)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await api.post('/auth/login', { email, password })
      if (res.ok) {
        const data = await res.json()
        setAuth(data.user, data.accessToken)
        navigate('/app')
      } else {
        setError('Email hoặc mật khẩu không đúng')
      }
    } catch {
      setError('Không thể kết nối đến máy chủ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl p-8 shadow-xl border border-charcoal/10">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌸</div>
          <h1 className="text-2xl font-serif font-bold text-charcoal">Flower Store</h1>
          <p className="text-charcoal-soft text-sm mt-1">Quản lý cửa hàng hoa</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-charcoal-soft mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-cream text-charcoal rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold placeholder-charcoal-soft/50 border border-charcoal/10"
              placeholder="admin@flowerstore.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-charcoal-soft mb-1">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-cream text-charcoal rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold border border-charcoal/10"
              required
            />
          </div>

          {error && (
            <p className="text-red-700 text-sm bg-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed text-cream rounded-lg px-4 py-2.5 font-medium transition-colors"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  )
}
