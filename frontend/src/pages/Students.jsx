import { useEffect, useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import Topbar from '../components/layout/Topbar'
import api from '../api/axios'

const EMPTY_FORM = { email:'', first_name:'', last_name:'', student_id:'', course:'', year_level:1, max_units:24 }

export default function Students() {
  const [students,  setStudents]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [showForm,  setShowForm]  = useState(false)
  const [editItem,  setEditItem]  = useState(null)   // null = add mode, object = edit mode
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [error,     setError]     = useState('')
  const [saving,    setSaving]    = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/students/').then(r => setStudents(r.data.results || r.data)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.student_id?.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => {
    setEditItem(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  const openEdit = (s) => {
    setEditItem(s)
    setForm({
      first_name: s.user?.first_name || '',
      last_name:  s.user?.last_name  || '',
      email:      s.user?.email      || '',
      student_id: s.student_id,
      course:     s.course,
      year_level: s.year_level,
      max_units:  s.max_units,
    })
    setError('')
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      if (editItem) {
        // EDIT — update student fields + user fields separately
        await api.patch(`/students/${editItem.id}/`, {
          student_id: form.student_id,
          course:     form.course,
          year_level: form.year_level,
          max_units:  form.max_units,
        })
        // update user name via /auth/me/ won't work here — update via admin or extend API
        // For now patch the student model fields
      } else {
        // ADD
        await api.post('/students/', form)
      }
      setShowForm(false)
      load()
    } catch (err) {
      const d = err.response?.data
      setError(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Failed to save.')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this student? This cannot be undone.')) return
    await api.delete(`/students/${id}/`)
    load()
  }

  return (
    <DashboardLayout>
      <Topbar title="Students" subtitle={`${students.length} total`}
        actions={
          <button onClick={openAdd}
            className="bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            + Add Student
          </button>
        }
      />
      <div className="p-6 space-y-4">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or student ID…"
          className="w-full max-w-sm bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500"/>

        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Student ID','Name','Course','Year','Units','Status','Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-600 text-sm">Loading...</td></tr>}
                {!loading && filtered.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-600 text-sm">No students found</td></tr>}
                {filtered.map(s => (
                  <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3 text-amber-400 text-sm font-mono font-medium">{s.student_id}</td>
                    <td className="px-5 py-3 text-white text-sm font-medium">{s.full_name}</td>
                    <td className="px-5 py-3 text-gray-400 text-sm">{s.course}</td>
                    <td className="px-5 py-3 text-gray-400 text-sm">Year {s.year_level}</td>
                    <td className="px-5 py-3 text-sm">
                      <span className="text-amber-400 font-semibold">{s.total_enrolled_units}</span>
                      <span className="text-gray-600"> / {s.max_units}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="bg-green-500/10 text-green-400 text-xs px-2 py-0.5 rounded-full font-medium">Active</span>
                    </td>
                    <td className="px-5 py-3 flex gap-3">
                      <button onClick={() => openEdit(s)}
                        className="text-indigo-400 hover:text-indigo-300 text-xs transition-colors font-medium">Edit</button>
                      <button onClick={() => handleDelete(s.id)}
                        className="text-gray-600 hover:text-red-400 text-xs transition-colors">Delete</button>
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
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">{editItem ? 'Edit Student' : 'Add Student'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white text-xl">×</button>
            </div>
            {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg px-3 py-2 mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-3">
              {!editItem && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-400 text-xs block mb-1">First name</label>
                      <input required value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"/>
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs block mb-1">Last name</label>
                      <input required value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"/>
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs block mb-1">Email</label>
                    <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"/>
                  </div>
                </>
              )}
              <div>
                <label className="text-gray-400 text-xs block mb-1">Student ID</label>
                <input required value={form.student_id} onChange={e => setForm({...form, student_id: e.target.value})}
                  placeholder="e.g. 2024-0001"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"/>
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">Course</label>
                <input required value={form.course} onChange={e => setForm({...form, course: e.target.value})}
                  placeholder="e.g. BSCS"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Year level</label>
                  <select value={form.year_level} onChange={e => setForm({...form, year_level: Number(e.target.value)})}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500">
                    {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Max units</label>
                  <input type="number" value={form.max_units} onChange={e => setForm({...form, max_units: Number(e.target.value)})}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"/>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium py-2.5 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-semibold py-2.5 rounded-lg">
                  {saving ? 'Saving...' : editItem ? 'Save Changes' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}