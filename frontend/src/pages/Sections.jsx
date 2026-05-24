import { useEffect, useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import Topbar from '../components/layout/Topbar'
import api from '../api/axios'

const EMPTY = { code:'', subjects:[], max_capacity:40, academic_year:'2025-2026', semester:1 }

export default function Sections() {
  const [sections,  setSections]  = useState([])
  const [subjects,  setSubjects]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [editItem,  setEditItem]  = useState(null)
  const [form,      setForm]      = useState(EMPTY)
  const [error,     setError]     = useState('')
  const [saving,    setSaving]    = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([api.get('/sections/'), api.get('/subjects/')])
      .then(([s, sub]) => {
        setSections(s.data.results || s.data)
        setSubjects(sub.data.results || sub.data)
      }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditItem(null); setForm(EMPTY); setError(''); setShowForm(true) }

  const openEdit = (s) => {
    setEditItem(s)
    setForm({
      code:          s.code,
      subjects:      s.subjects || [],
      max_capacity:  s.max_capacity,
      academic_year: s.academic_year,
      semester:      s.semester,
    })
    setError(''); setShowForm(true)
  }

  const toggleSubject = (id) => {
    setForm(f => ({
      ...f,
      subjects: f.subjects.includes(id)
        ? f.subjects.filter(s => s !== id)
        : [...f.subjects, id]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.subjects.length === 0) { setError('Please select at least one subject.'); return }
    setError(''); setSaving(true)
    try {
      if (editItem) {
        await api.patch(`/sections/${editItem.id}/`, form)
      } else {
        await api.post('/sections/', form)
      }
      setShowForm(false); load()
    } catch (err) {
      const d = err.response?.data
      setError(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Failed.')
    } finally { setSaving(false) }
  }

  const capacityColor = (s) => {
    const pct = s.max_capacity > 0 ? (s.enrolled_count / s.max_capacity) * 100 : 0
    if (pct >= 100) return { bar:'bg-red-500',   badge:'bg-red-500/10 text-red-400',     label:'Full' }
    if (pct >= 80)  return { bar:'bg-amber-500', badge:'bg-amber-500/10 text-amber-400', label:'Near Full' }
    return              { bar:'bg-teal-500',  badge:'bg-teal-500/10 text-teal-400',   label:'Open' }
  }

  return (
    <DashboardLayout>
      <Topbar title="Sections" subtitle={`${sections.length} sections`}
        actions={
          <button onClick={openAdd}
            className="bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-4 py-2 rounded-lg">
            + Create Section
          </button>
        }
      />
      <div className="p-6">
        {loading ? <p className="text-gray-500 text-sm">Loading...</p> : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Section','Subjects & Schedules','Capacity','Status','Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sections.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-600 text-sm">No sections yet</td></tr>
                )}
                {sections.map(s => {
                  const c   = capacityColor(s)
                  const pct = s.max_capacity > 0
                    ? Math.min(Math.round((s.enrolled_count / s.max_capacity) * 100), 100)
                    : 0
                  return (
                    <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3 text-white font-semibold text-sm">{s.code}</td>
                      <td className="px-5 py-3">
                        <div className="space-y-1">
                          {s.subjects_detail?.length > 0 ? s.subjects_detail.map(sub => (
                            <div key={sub.id} className="flex items-center gap-2">
                              <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2 py-0.5 rounded-full font-mono">{sub.code}</span>
                              {sub.schedule && (
                                <span className="text-gray-500 text-xs">🕐 {sub.schedule}</span>
                              )}
                            </div>
                          )) : (
                            <span className="text-gray-600 text-xs">No subjects</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 min-w-36">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className={`h-full ${c.bar} rounded-full`} style={{ width:`${pct}%` }}/>
                          </div>
                          <span className="text-gray-400 text-xs whitespace-nowrap">{s.enrolled_count}/{s.max_capacity}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.badge}`}>{c.label}</span>
                      </td>
                      <td className="px-5 py-3 flex gap-3">
                        <button onClick={() => openEdit(s)}
                          className="text-indigo-400 hover:text-indigo-300 text-xs font-medium">Edit</button>
                        <button onClick={async () => {
                          if(confirm('Delete section?')) { await api.delete(`/sections/${s.id}/`); load() }
                        }} className="text-gray-600 hover:text-red-400 text-xs">Delete</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">{editItem ? 'Edit Section' : 'Create Section'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white text-xl">×</button>
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg px-3 py-2 mb-4">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-gray-400 text-xs block mb-1">Section code</label>
                <input required value={form.code} onChange={e => setForm({...form, code:e.target.value})}
                  placeholder="BSCS-1A"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"/>
              </div>

              <div>
                <label className="text-gray-400 text-xs block mb-1">
                  Subjects <span className="text-amber-500">({form.subjects.length} selected)</span>
                  <span className="text-gray-600 ml-1">— schedules are set per subject</span>
                </label>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 max-h-52 overflow-y-auto space-y-1">
                  {subjects.length === 0 && (
                    <p className="text-gray-600 text-xs p-2">No subjects yet. Add subjects first.</p>
                  )}
                  {subjects.map(s => (
                    <label key={s.id}
                      className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.subjects.includes(s.id)}
                        onChange={() => toggleSubject(s.id)}
                        className="accent-amber-500"
                      />
                      <div className="flex-1">
                        <span className="text-white text-xs font-medium">{s.code}</span>
                        <span className="text-gray-400 text-xs"> — {s.name}</span>
                        {s.schedule && (
                          <span className="text-indigo-400 text-xs ml-1">({s.schedule})</span>
                        )}
                      </div>
                      <span className="text-amber-400 text-xs">{s.units} units</span>
                    </label>
                  ))}
                </div>
                {form.subjects.length > 0 && (
                  <p className="text-teal-400 text-xs mt-1">
                    Total units: {subjects
                      .filter(s => form.subjects.includes(s.id))
                      .reduce((sum, s) => sum + s.units, 0)
                    }
                  </p>
                )}
              </div>

              <div>
                <label className="text-gray-400 text-xs block mb-1">Max capacity</label>
                <input required type="number" min="1" value={form.max_capacity}
                  onChange={e => setForm({...form, max_capacity:Number(e.target.value)})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Academic year</label>
                  <input value={form.academic_year}
                    onChange={e => setForm({...form, academic_year:e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"/>
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Semester</label>
                  <select value={form.semester} onChange={e => setForm({...form, semester:Number(e.target.value)})}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500">
                    <option value={1}>1st Semester</option>
                    <option value={2}>2nd Semester</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm py-2.5 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-semibold py-2.5 rounded-lg">
                  {saving ? 'Saving...' : editItem ? 'Save Changes' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}