import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const adminStaffNav = [
    { to: '/dashboard',  label: 'Dashboard',  icon: '◈' },
    { to: '/students',   label: 'Students',   icon: '◉' },
    { to: '/subjects',   label: 'Subjects',   icon: '◑' },
    { to: '/sections',   label: 'Sections',   icon: '⊞' },
    { to: '/enrollment', label: 'Enrollment', icon: '✦' },
    { to: '/users',      label: 'Users',      icon: '◍' },
  ]

  const studentNav = [
    { to: '/my-enrollment', label: 'My Enrollment', icon: '✦' },
  ]

  const navItems = user?.role === 'student' ? studentNav : adminStaffNav

  return (
    <aside className="w-56 min-w-56 bg-gray-900 border-r border-gray-800 flex flex-col h-screen sticky top-0">

      {/* Logo */}
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-black text-sm">E</div>
          <div>
            <div className="text-white font-bold text-sm">EnrollHub</div>
            <div className="text-gray-500 text-xs">Enrollment System</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider px-2 py-2">Menu</p>
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-amber-500/10 text-amber-400 font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {/* Profile always visible for everyone */}
        <div className="pt-2 border-t border-gray-800 mt-2">
          <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider px-2 py-2">Account</p>
          <NavLink to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-amber-500/10 text-amber-400 font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <span className="text-base">◎</span> My Profile
          </NavLink>
        </div>
      </nav>

      {/* User */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-800/50 mb-2">
          {/* ✅ Show profile image if available, otherwise initials */}
          {user?.profile_image ? (
            <img src={user.profile_image} alt="Profile"
              className="w-7 h-7 rounded-lg object-cover border border-gray-700"/>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-medium truncate">{user?.first_name} {user?.last_name}</div>
            <div className="text-gray-500 text-xs capitalize">{user?.role}</div>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full text-left px-3 py-2 text-gray-400 hover:text-red-400 text-xs rounded-lg hover:bg-gray-800 transition-colors">
          Sign out
        </button>
      </div>
    </aside>
  )
}