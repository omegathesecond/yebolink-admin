import { useRef } from 'react'
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  LogOut,
  ShieldCheck,
  MessageSquare,
  Settings,
  Menu,
  X,
  ArrowUpRight
} from 'lucide-react'
import { YeboLogo } from './YeboLogo'

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Workspaces', href: '/workspaces', icon: Users },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Settings & review', href: '/settings', icon: Settings }
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const drawer = useRef(null)
  const title =
    navigation.find((item) => location.pathname.startsWith(item.href))?.name || 'Workspace'
  const logout = () => {
    localStorage.removeItem('ybk_admin_key')
    navigate('/')
  }
  const links = () =>
    navigation.map((item) => (
      <NavLink
        key={item.href}
        to={item.href}
        onClick={() => drawer.current?.close()}
        className={({ isActive }) => `admin-nav-link ${isActive ? 'is-active' : ''}`}
      >
        <item.icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
        {item.name}
      </NavLink>
    ))

  return (
    <div className="admin-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="admin-sidebar">
        <Link to="/dashboard" className="admin-brand">
          <YeboLogo />
        </Link>
        <nav aria-label="Main navigation" className="flex-1 px-4 py-7">
          <p className="eyebrow mb-4 px-3">Platform management</p>
          {links()}
        </nav>
        <div className="m-4 rounded-lg border border-rule bg-surface p-4">
          <ShieldCheck className="mb-3 h-5 w-5 text-brick" />
          <p className="text-sm font-medium">A little care. A better platform.</p>
          <p className="mt-2 text-xs leading-relaxed text-mute">
            Manage workspaces, monitor messages, and review sender requests.
          </p>
        </div>
        <button className="admin-nav-link mx-4 mb-5" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
        <p className="eyebrow px-7 pb-5">An Omevision company</p>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="p-2 lg:hidden"
              aria-label="Open navigation"
              aria-haspopup="dialog"
              onClick={() => drawer.current?.showModal()}
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="hidden sm:inline text-mute">Platform</span>
            <span className="hidden sm:inline text-mute/50">/</span>
            <span className="text-sm font-medium">{title}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-rule px-3 py-2 text-[10px] font-mono uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5 text-brick" />
              Admin
            </span>
            <a
              href="https://yebolink.com"
              target="_blank"
              rel="noreferrer"
              className="p-2"
              aria-label="Open public website"
            >
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="admin-content">
          <Outlet />
        </main>
      </div>
      <dialog ref={drawer} className="admin-drawer" aria-label="Admin navigation">
        <div className="flex items-center justify-between border-b border-rule p-5">
          <YeboLogo />
          <button
            type="button"
            onClick={() => drawer.current?.close()}
            className="p-3"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav aria-label="Mobile navigation" className="p-4">
          {links()}
        </nav>
        <button type="button" onClick={logout} className="admin-nav-link m-4">
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </dialog>
    </div>
  )
}
