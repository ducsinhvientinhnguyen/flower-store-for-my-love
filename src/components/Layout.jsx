import { Navigate, Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const NAV_ITEMS = [
  { path: '/',           label: 'Bán hàng',  icon: '🛒', roles: ['OWNER', 'STAFF'] },
  { path: '/inventory',  label: 'Kho',       icon: '📦', roles: ['OWNER', 'STAFF'] },
  { path: '/pre-orders', label: 'Đặt trước', icon: '📅', roles: ['OWNER', 'STAFF'] },
  { path: '/customers',  label: 'Khách',     icon: '🧑', roles: ['OWNER', 'STAFF'] },
  { path: '/reports',    label: 'Báo cáo',   icon: '📊', roles: ['OWNER'] },
  { path: '/expenses',   label: 'Sổ quỹ',   icon: '💸', roles: ['OWNER'] },
]

export default function Layout() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  if (!user) return <Navigate to="/login" replace />

  const visibleNav = NAV_ITEMS.filter(item => item.roles.includes(user.role))

  function handleLogout() {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex flex-col w-32 bg-slate-800 border-r border-slate-700 fixed inset-y-0">
        <div className="flex items-center justify-center h-14 border-b border-slate-700">
          <span className="text-xl">🌸</span>
        </div>
        <nav className="flex-1 flex flex-col gap-1 p-2 mt-2">
          {visibleNav.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-2 py-3 rounded-lg text-xs transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t border-slate-700">
          <div className="text-xs text-slate-500 text-center mb-2 truncate px-1">{user.name}</div>
          <button
            onClick={handleLogout}
            className="w-full text-xs text-slate-400 hover:text-red-400 py-2 rounded transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-32 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
          <span className="text-lg">🌸</span>
          <span className="text-sm text-slate-300">{user.name}</span>
          <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-red-400">
            Đăng xuất
          </button>
        </header>

        <div className="flex-1 p-4 pb-20 md:pb-4">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav — mobile only */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-slate-800 border-t border-slate-700 flex">
        {visibleNav.slice(0, 5).map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                isActive ? 'text-indigo-400' : 'text-slate-500'
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
