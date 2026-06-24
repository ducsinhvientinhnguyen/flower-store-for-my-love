import { Navigate, Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useQueryClient } from '@tanstack/react-query'

const NAV_ITEMS = [
  { path: '/app',            label: 'Bán hàng',  icon: '🛒', roles: ['OWNER', 'STAFF'] },
  { path: '/app/inventory',  label: 'Kho',       icon: '📦', roles: ['OWNER', 'STAFF'] },
  { path: '/app/pre-orders', label: 'Đặt trước', icon: '📅', roles: ['OWNER', 'STAFF'] },
  { path: '/app/customers',  label: 'Khách',     icon: '🧑', roles: ['OWNER', 'STAFF'] },
  { path: '/app/reports',    label: 'Báo cáo',   icon: '📊', roles: ['OWNER'] },
  { path: '/app/expenses',   label: 'Sổ quỹ',   icon: '💸', roles: ['OWNER'] },
]

export default function Layout() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  if (!user) return <Navigate to="/login" replace />

  const visibleNav = NAV_ITEMS.filter(item => item.roles.includes(user.role))

  function handleLogout() {
    queryClient.clear()
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-cream text-charcoal flex">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex flex-col w-32 bg-cream border-r border-charcoal/10 fixed inset-y-0">
        <div className="flex items-center justify-center h-14 border-b border-charcoal/10">
          <span className="text-xl">🌸</span>
        </div>
        <nav className="flex-1 flex flex-col gap-1 p-2 mt-2">
          {visibleNav.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/app'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-2 py-3 rounded-lg text-xs transition-colors ${
                  isActive
                    ? 'bg-gold text-cream'
                    : 'text-charcoal-soft hover:bg-gold/10 hover:text-gold'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t border-charcoal/10">
          <div className="text-xs text-charcoal-soft text-center mb-2 truncate px-1">{user.name}</div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-xs text-charcoal-soft hover:text-gold py-2 rounded transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-32 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 bg-cream border-b border-charcoal/10 sticky top-0 z-10">
          <span className="text-lg">🌸</span>
          <span className="text-sm text-charcoal-soft">{user.name}</span>
          <button type="button" onClick={handleLogout} className="text-xs text-charcoal-soft hover:text-gold">
            Đăng xuất
          </button>
        </header>

        <div className="flex-1 p-4 pb-20 md:pb-4">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav — mobile only */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-cream border-t border-charcoal/10 flex">
        {visibleNav.slice(0, 5).map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/app'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                isActive ? 'text-gold' : 'text-charcoal-soft'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
