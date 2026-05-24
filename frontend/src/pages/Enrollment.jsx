import { useEffect, useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import Topbar from '../components/layout/Topbar'
import api from '../api/axios'

export default function Enrollment() {
  const [enrollments, setEnrollments] = useState([])
  const [students,    setStudents]    = useState([])
  const [sections,    setSections]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showForm,    setShowForm]    = useState(false)
  const [editItem,    setEditItem]    = useState(null)
  const [form,        setForm]        = useState({ student:'', section:'', remarks:'' })
  const [preview,     setPreview]     = useState(null)   // subjects preview
  const [error,       setError]       = useState('')
  const [saving,      setSaving]      = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/enrollments/'),
      api.get('/students/'),
      api.get('/sections/'),
    ]).then(([e, st, sec]) => {
      setEnrollments(e.data.results || e.data)
      setStudents(st.data.results   || st.data)
      setSections(sec.data.results  || sec.data)
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditItem(null)
    setForm({ student:'', section:'', remarks:'' })
    setPreview(null)
    setError(''); setShowForm(true)
  }

  const openEdit = (e) => {
    setEditItem(e)
    setForm({ status: e.status, remarks: e.remarks || '' })
    setPreview(null)
    setError(''); setShowForm(true)
  }

  // When section is selected — auto-fill subject preview
  const handleSectionChange = (sectionId) => {
    setForm(f => ({ ...f, section: sectionId }))
    if (!sectionId) { setPreview(null); return }
    const selected = sections.find(s => String(s.id) === String(sectionId))
    setPreview(selected || null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      if (editItem) {
        await api.patch(`/enrollments/${editItem.id}/`, {
          status:  form.status,
          remarks: form.remarks,
        })
      } else {
        await api.post('/enrollments/create/', {
          student: form.student,
          section: form.section,
          remarks: form.remarks,
        })
      }
      setShowForm(false); load()
    } catch (err) {
      const d = err.response?.data
      setError(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Enrollment failed.')
    } finally { setSaving(false) }
  }

  const statusBadge = (s) => {
    const m = {
      enrolled: 'bg-green-500/10 text-green-400',
      pending:  'bg-amber-500/10 text-amber-400',
      dropped:  'bg-gray-500/10  text-gray-400',
      blocked:  'bg-red-500/10   text-red-400',
    }
    return `text-xs px-2 py-0.5 rounded-full font-medium ${m[s] || m.pending}`
  }

  return (
    <DashboardLayout>
      <Topbar title="Enrollment" subtitle={`${enrollments.length} records`}
        actions={
          <button onClick={openAdd}
            className="bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-4 py-2 rounded-lg">
            + New Enrollment
          </button>
        }
      />
      <div className="p-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Student','Section','Subject','Units','Date','Status','Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-600 text-sm">Loading...</td></tr>}
                {!loading && enrollments.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-600 text-sm">No enrollments yet</td></tr>
                )}
                {enrollments.map(e => (
                  <tr key={e.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3 text-white font-medium text-sm">{e.student_detail?.full_name}</td>
                    <td className="px-5 py-3 text-amber-400 text-sm font-mono">{e.section_detail?.code}</td>
                    <td className="px-5 py-3 text-gray-300 text-sm">
                      <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2 py-0.5 rounded-full">
                        {e.subject_detail?.code}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-teal-400 text-sm font-semibold">{e.subject_detail?.units}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{new Date(e.enrolled_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3"><span className={statusBadge(e.status)}>{e.status}</span></td>
                    <td className="px-5 py-3 flex gap-3">
                      <button onClick={() => openEdit(e)} className="text-indigo-400 hover:text-indigo-300 text-xs font-medium">Edit</button>
                      <button onClick={async () => { if(confirm('Delete enrollment?')) { await api.delete(`/enrollments/${e.id}/`); load() }}}
                        className="text-gray-600 hover:text-red-400 text-xs">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">{editItem ? 'Edit Enrollment' : 'New Enrollment'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white text-xl">×</button>
            </div>
            {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg px-3 py-2 mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!editItem ? (
                <>
                  {/* Student selector */}
                  <div>
                    <label className="text-gray-400 text-xs block mb-1">Student</label>
                    <select required value={form.student} onChange={e => setForm({...form, student:e.target.value})}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500">
                      <option value="">Select student…</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.student_id} — {s.full_name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Section selector */}
                  <div>
                    <label className="text-gray-400 text-xs block mb-1">Section</label>
                    <select required value={form.section} onChange={e => handleSectionChange(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500">
                      <option value="">Select section…</option>
                      {sections.map(s => (
                        <option key={s.id} value={s.id} disabled={s.is_full}>
                          {s.code} — {s.available_slots} slots left {s.is_full ? '(Full)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Auto-filled subjects preview */}
                  {preview && (
                    <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-white text-xs font-semibold">
                          Subjects that will be enrolled:
                        </p>
                        <span className="text-teal-400 text-xs font-bold">
                          {preview.total_units} total units
                        </span>
                      </div>
                      {preview.subjects_detail?.length > 0 ? (
                        <div className="space-y-2">
                          {preview.subjects_detail.map(sub => (
                            <div key={sub.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                              <div>
                                <span className="text-amber-400 text-xs font-mono font-bold">{sub.code}</span>
                                <span className="text-gray-300 text-xs ml-2">{sub.name}</span>
                              </div>
                              <span className="text-teal-400 text-xs font-semibold">{sub.units} units</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-600 text-xs">This section has no subjects assigned yet.</p>
                      )}
                      <p className="text-gray-500 text-xs mt-3">
                        Schedule: <span className="text-white">{preview.schedule}</span> &nbsp;·&nbsp;
                        Room: <span className="text-white">{preview.room}</span>
                      </p>
                    </div>
                  )}
                </>
              ) : (
                /* Edit mode — only status */
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status:e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500">
                    <option value="enrolled">Enrolled</option>
                    <option value="pending">Pending</option>
                    <option value="dropped">Dropped</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-gray-400 text-xs block mb-1">Remarks (optional)</label>
                <textarea value={form.remarks} onChange={e => setForm({...form, remarks:e.target.value})} rows={2}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 resize-none"/>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm py-2.5 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving || (!editItem && !preview?.subjects_detail?.length)}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-semibold py-2.5 rounded-lg">
                  {saving ? 'Enrolling...' : editItem ? 'Save Changes' : `Enroll in ${preview?.subjects_detail?.length || 0} Subject(s)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}