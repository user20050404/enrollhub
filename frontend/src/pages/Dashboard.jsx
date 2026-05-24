import { useEffect, useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import Topbar from '../components/layout/Topbar'
import StatCard from '../components/common/StatCard'
import api from '../api/axios'

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [sections, setSections]       = useState([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/enrollments/summary/'),
      api.get('/enrollments/?limit=5'),
      api.get('/sections/'),
    ]).then(([s, e, sec]) => {
      setSummary(s.data)
      setEnrollments(e.data.results || e.data)
      setSections((sec.data.results || sec.data).slice(0, 5))
    }).finally(() => setLoading(false))
  }, [])

  const statusBadge = (status) => {
    const map = {
      enrolled: 'bg-green-500/10 text-green-400',
      pending:  'bg-amber-500/10 text-amber-400',
      dropped:  'bg-gray-500/10  text-gray-400',
      blocked:  'bg-red-500/10   text-red-400',
    }
    return `text-xs px-2 py-0.5 rounded-full font-medium ${map[status] || map.pending}`
  }

  return (
    <DashboardLayout>
      <Topbar title="Dashboard" subtitle="Academic Year 2025–2026" />

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="text-gray-500 text-sm">Loading...</div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Students"      value={summary?.total_students  ?? 0} icon="🎓" color="amber"  sub="Registered students" />
              <StatCard label="Active Enrollments"  value={summary?.total_enrolled  ?? 0} icon="📋" color="teal"   sub="Currently enrolled" />
              <StatCard label="Pending Approvals"   value={summary?.total_pending   ?? 0} icon="⏳" color="rose"   sub="Needs action" />
              <StatCard label="Sections"            value={sections.length}               icon="🏫" color="indigo" sub="Open sections" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent enrollments */}
              <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                  <h2 className="text-white font-semibold text-sm">Recent Enrollments</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left px-5 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Student</th>
                        <th className="text-left px-5 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Section</th>
                        <th className="text-left px-5 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Units</th>
                        <th className="text-left px-5 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.length === 0 && (
                        <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-600 text-sm">No enrollments yet</td></tr>
                      )}
                      {enrollments.map(e => (
                        <tr key={e.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                          <td className="px-5 py-3 text-white text-sm font-medium">{e.student_detail?.full_name}</td>
                          <td className="px-5 py-3 text-gray-400 text-sm">{e.section_detail?.code}</td>
                          <td className="px-5 py-3 text-amber-400 text-sm font-semibold">{e.section_detail?.subject_detail?.units}</td>
                          <td className="px-5 py-3"><span className={statusBadge(e.status)}>{e.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section capacity */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-800">
                  <h2 className="text-white font-semibold text-sm">Section Capacity</h2>
                </div>
                <div className="p-4 space-y-3">
                  {sections.length === 0 && <p className="text-gray-600 text-sm text-center py-4">No sections yet</p>}
                  {sections.map(s => {
                    const pct = Math.round((s.enrolled_count / s.max_capacity) * 100)
                    const barColor = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-teal-500'
                    return (
                      <div key={s.id}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-white text-xs font-medium">{s.code}</span>
                          <span className="text-gray-500 text-xs">{s.enrolled_count}/{s.max_capacity}</span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}