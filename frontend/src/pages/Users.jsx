import { useEffect, useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import Topbar from '../components/layout/Topbar'
import api from '../api/axios'

export default function Users() {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.get('/auth/users/').then(r => setUsers(r.data.results || r.data)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const activate = async (id) => {
    try {
      await api.patch(`/auth/users/${id}/activate/`)
      // Instantly update UI without waiting for refetch
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: true } : u))
      load() // still sync fresh data from backend in background
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to activate user.'
      alert(msg)
    }
  }

  const roleBadge = (role) => {
    const m = {
      admin:   'bg-amber-500/10 text-amber-400',
      staff:   'bg-indigo-500/10 text-indigo-400',
      student: 'bg-teal-500/10 text-teal-400',
    }
    return `text-xs px-2 py-0.5 rounded-full font-medium capitalize ${m[role] || m.student}`
  }

  return (
    <DashboardLayout>
      <Topbar title="User Accounts" subtitle="Manage and activate user accounts" />

      <div className="p-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Name','Email','Role','Verified','Active','Joined','Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-600 text-sm">Loading...</td></tr>
                )}
                {!loading && users.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-600 text-sm">No users found</td></tr>
                )}
                {users.map(u => (
                  <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3 text-white font-medium text-sm">
                      {u.first_name} {u.last_name}
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-sm">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={roleBadge(u.role)}>{u.role}</span>
                    </td>
                    <td className="px-5 py-3">
                      {u.is_verified
                        ? <span className="text-green-400 text-xs font-medium">✓ Yes</span>
                        : <span className="text-gray-600 text-xs">✗ No</span>
                      }
                    </td>
                    <td className="px-5 py-3">
                      {u.is_active
                        ? <span className="bg-green-500/10 text-green-400 text-xs px-2 py-0.5 rounded-full font-medium">Active</span>
                        : <span className="bg-red-500/10 text-red-400 text-xs px-2 py-0.5 rounded-full font-medium">Inactive</span>
                      }
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {new Date(u.date_joined).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      {!u.is_active && (
                        <button onClick={() => activate(u.id)}
                          className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                          Activate
                        </button>
                      )}
                      {u.is_active && (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}