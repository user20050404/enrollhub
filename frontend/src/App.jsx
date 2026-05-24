import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login        from './pages/auth/Login'
import Register     from './pages/auth/Register'
import Dashboard    from './pages/Dashboard'
import Students     from './pages/Students'
import Subjects     from './pages/Subjects'
import Sections     from './pages/Sections'
import Enrollment   from './pages/Enrollment'
import MyEnrollment from './pages/MyEnrollment'
import Profile      from './pages/Profile'
import Users from './pages/Users'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-amber-500 text-sm">Loading EnrollHub...</div>
    </div>
  )
  return user ? children : <Navigate to="/login" />
}

// Blocks students from accessing admin/staff pages
function AdminStaffRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" />
  if (user.role === 'student') return <Navigate to="/my-enrollment" />
  return children
}

// Redirects to correct home based on role
function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" />
  return <Navigate to={user.role === 'student' ? '/my-enrollment' : '/dashboard'} />
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin + Staff only */}
      <Route path="/dashboard"  element={<AdminStaffRoute><Dashboard /></AdminStaffRoute>} />
      <Route path="/students"   element={<AdminStaffRoute><Students /></AdminStaffRoute>} />
      <Route path="/subjects"   element={<AdminStaffRoute><Subjects /></AdminStaffRoute>} />
      <Route path="/sections"   element={<AdminStaffRoute><Sections /></AdminStaffRoute>} />
      <Route path="/enrollment" element={<AdminStaffRoute><Enrollment /></AdminStaffRoute>} />
      <Route path="/users" element={<AdminStaffRoute><Users /></AdminStaffRoute>} />

      {/* Student only */}
      <Route path="/my-enrollment" element={<ProtectedRoute><MyEnrollment /></ProtectedRoute>} />

      {/* Everyone */}
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      {/* Default redirect based on role */}
      <Route path="/"  element={<HomeRedirect />} />
      <Route path="*"  element={<HomeRedirect />} />
    </Routes>
  )
}