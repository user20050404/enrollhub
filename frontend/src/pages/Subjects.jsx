import { useEffect, useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import Topbar from '../components/layout/Topbar'
import api from '../api/axios'

const EMPTY = {
  code:         '',
  name:         '',
  units:        3,
  instructor:   '',
  schedule:     '',
  room:         '',
  description:  '',
  department:   '',
  subject_type: 'lecture'
}

const COLORS = [
  'bg-indigo-500/10 text-indigo-400',
  'bg-teal-500/10 text-teal-400',
  'bg-amber-500/10 text-amber-400',
  'bg-rose-500/10 text-rose-400',
  'bg-purple-500/10 text-purple-400'
]

export default function Subjects() {
  const [subjects,  setSubjects]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [editItem,  setEditItem]  = useState(null)
  const [form,      setForm]      = useState(EMPTY)
  const [error,     setError]     = useState('')
  const [saving,    setSaving]    = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/subjects/')
      .then(r => setSubjects(r.data.results || r.data))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditItem(null)
    setForm(EMPTY)
    setError('')
    setShowForm(true)
  }

  const openEdit = (s) => {
    setEditItem(s)
    setForm({
      code:         s.code,
      name:         s.name,
      units:        s.units,
      instructor:   s.instructor   || '',
      schedule:     s.schedule     || '',
      room:         s.room         || '',
      description:  s.description  || '',
      department:   s.department   || '',
      subject_type: s.subject_type || 'lecture',
    })
    setError('')
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (editItem) {
        await api.patch(`/subjects/${editItem.id}/`, form)
      } else {
        await api.post('/subjects/', form)
      }
      setShowForm(false)
      load()
    } catch (err) {
      const d = err.response?.data
      setError(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this subject? This cannot be undone.')) return
    await api.delete(`/subjects/${id}/`)
    load()
  }

  return (
    <DashboardLayout>
      <Topbar
        title="Subjects"
        subtitle={`${subjects.length} subjects`}
        actions={
          <button
            onClick={openAdd}
            className="bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + Add Subject
          </button>
        }
      />

      <div className="p-6">
        {loading ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.length === 0 && (
              <p className="text-gray-600 text-sm col-span-3">No subjects yet. Add one to get started.</p>
            )}
            {subjects.map((s, i) => (
              <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">

                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${COLORS[i % COLORS.length]}`}>
                    {s.code}
                  </span>
                  <span className="text-amber-400 text-sm font-bold">{s.units} units</span>
                </div>

                {/* Subject name */}
                <h3 className="text-white font-semibold text-sm mb-1">{s.name}</h3>

                {/* Department + type */}
                <p className="text-gray-500 text-xs mb-2">
                  {s.department} · {s.subject_type.replace('_', ' ')}
                </p>

                {/* Instructor */}
                {s.instructor && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-gray-600 text-xs">👤</span>
                    <span className="text-gray-300 text-xs">{s.instructor}</span>
                  </div>
                )}

                {/* Schedule */}
                {s.schedule && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-gray-600 text-xs">🕐</span>
                    <span className="text-indigo-400 text-xs">{s.schedule}</span>
                  </div>
                )}

                {/* Room */}
                {s.room && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-gray-600 text-xs">📍</span>
                    <span className="text-teal-400 text-xs">{s.room}</span>
                  </div>
                )}

                {/* Description */}
                {s.description && (
                  <p className="text-gray-600 text-xs mb-3 line-clamp-2">{s.description}</p>
                )}

                {/* Actions */}
                <div className="flex gap-3 mt-3 pt-3 border-t border-gray-800">
                  <button
                    onClick={() => openEdit(s)}
                    className="text-indigo-400 hover:text-indigo-300 text-xs font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-gray-700 hover:text-red-400 text-xs transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">

            {/* Modal header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">
                {editItem ? 'Edit Subject' : 'Add Subject'}
              </h2>
              <button
                onClick={() => { setShowForm(false); setError('') }}
                className="text-gray-500 hover:text-white text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg px-3 py-2 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">

              {/* Code + Units */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Subject Code</label>
                  <input
                    required
                    value={form.code}
                    onChange={e => setForm({...form, code: e.target.value})}
                    placeholder="e.g. CS101"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Units</label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="6"
                    value={form.units}
                    onChange={e => setForm({...form, units: Number(e.target.value)})}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Subject name */}
              <div>
                <label className="text-gray-400 text-xs block mb-1">Subject Name</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="e.g. Introduction to Computer Science"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Department */}
              <div>
                <label className="text-gray-400 text-xs block mb-1">Department</label>
                <input
                  required
                  value={form.department}
                  onChange={e => setForm({...form, department: e.target.value})}
                  placeholder="e.g. Computer Science"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Type */}
              <div>
                <label className="text-gray-400 text-xs block mb-1">Type</label>
                <select
                  value={form.subject_type}
                  onChange={e => setForm({...form, subject_type: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="lecture">Lecture</option>
                  <option value="lab">Laboratory</option>
                  <option value="lec_lab">Lecture + Lab</option>
                </select>
              </div>

              {/* Instructor */}
              <div>
                <label className="text-gray-400 text-xs block mb-1">Instructor</label>
                <input
                  value={form.instructor}
                  onChange={e => setForm({...form, instructor: e.target.value})}
                  placeholder="e.g. Prof. Juan Dela Cruz"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Schedule + Room */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Schedule</label>
                  <input
                    value={form.schedule}
                    onChange={e => setForm({...form, schedule: e.target.value})}
                    placeholder="e.g. MWF 7:30–9:00"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Room</label>
                  <input
                    value={form.room}
                    onChange={e => setForm({...form, room: e.target.value})}
                    placeholder="e.g. Lab 204"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-gray-400 text-xs block mb-1">Description (optional)</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  rows={2}
                  placeholder="Brief description of the subject..."
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setError('') }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-semibold py-2.5 rounded-lg transition-colors"
                >
                  {saving ? 'Saving...' : editItem ? 'Save Changes' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}