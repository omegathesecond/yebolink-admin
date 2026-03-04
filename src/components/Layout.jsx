import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, LogOut, Zap, Lock } from 'lucide-react'

export default function Layout() {
  const navigate = useNavigate()
  const key = localStorage.getItem('ybk_admin_key') || ''

  const logout = () => {
    localStorage.removeItem('ybk_admin_key')
    navigate('/')
  }

  const navClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-indigo-600 text-white' : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
    }`

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col" style={{ background: '#1e1b4b' }}>
        {/* Logo */}
        <div className="px-6 py-5 border-b border-indigo-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-500 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">YeboLink</p>
              <p className="text-indigo-300 text-xs">Admin Dashboard</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink to="/dashboard" className={navClass}>
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </NavLink>
          <NavLink to="/workspaces" className={navClass}>
            <Users className="w-4 h-4" /> Workspaces
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-indigo-800 space-y-2">
          <div className="flex items-center gap-2 px-4 py-2 text-xs text-indigo-400">
            <Lock className="w-3 h-3" />
            <span className="font-mono truncate">{key.slice(0, 12)}…</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-indigo-300 hover:bg-red-900/30 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
