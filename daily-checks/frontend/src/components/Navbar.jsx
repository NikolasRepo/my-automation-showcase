import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
 
const navLinks = [
  { to: '/dashboard', label: 'Dashboard', roles: ['operator', 'leader', 'admin'] },
  { to: '/inspect', label: 'New Inspection', roles: ['operator', 'admin'] },
  { to: '/history', label: 'History', roles: ['operator', 'leader', 'admin'] },
  { to: '/alerts', label: 'Alerts', roles: ['leader', 'admin'] },
  { to: '/reports', label: 'Reports', roles: ['leader', 'admin'] },
  { to: '/admin', label: 'Admin', roles: ['admin'] },
]
 
export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
 
  const handleLogout = () => { logout(); navigate('/login') }
  const visibleLinks = navLinks.filter(l => l.roles.includes(user?.role))
 
  return (
    <nav className="bg-white border-b border-surface-200 shadow-card sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <div className="flex items-center gap-8">
          <span className="font-semibold text-brand-700 tracking-tight text-base">
            &#9642; Place Holder
          </span>
          <div className="hidden sm:flex items-center gap-1">
            {visibleLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  pathname.startsWith(link.to)
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-500 hover:text-ink-900 hover:bg-surface-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-400 hidden sm:block">
            {user?.full_name} &middot; <span className="capitalize">{user?.role}</span>
          </span>
          <button onClick={handleLogout} className="btn-secondary text-sm py-1.5 px-3">
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}