import { useEffect, useState, useRef } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import Topbar from '../components/layout/Topbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function MyEnrollment() {
  const { user }                        = useAuth()
  const [data, setData]                 = useState(null)
  const [sections, setSections]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [showForm, setShowForm]         = useState(false)
  const [selectedSection, setSelected] = useState('')
  const [preview, setPreview]           = useState(null)
  const [enrolling, setEnrolling]       = useState(false)
  const [error, setError]               = useState('')
  const [success, setSuccess]           = useState('')
  const printRef                        = useRef()

  const load = async () => {
    setLoading(true)
    try {
      const [me, sec] = await Promise.all([
        api.get('/enrollments/me/'),
        api.get('/sections/'),
      ])
      setData(me.data)
      setSections(sec.data.results || sec.data)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const handleSectionChange = (id) => {
    setSelected(id)
    setError('')
    if (!id) { setPreview(null); return }
    const sec = sections.find(s => String(s.id) === String(id))
    setPreview(sec || null)
  }

  const handleEnroll = async (e) => {
    e.preventDefault()
    if (!selectedSection) { setError('Please select a section.'); return }
    setError(''); setSuccess(''); setEnrolling(true)
    try {
      const res = await api.post('/enrollments/self-enroll/', { section: selectedSection })
      setSuccess(res.data.message)
      setShowForm(false)
      setSelected('')
      setPreview(null)
      load()
    } catch (err) {
      const d = err.response?.data
      setError(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Enrollment failed.')
    } finally {
      setEnrolling(false)
    }
  }

  // ✅ Print COR
  const handlePrint = () => {
    const printContents = printRef.current.innerHTML
    const win = window.open('', '_blank')
    win.document.write(`
      <html>
        <head>
          <title>Certificate of Registration — ${student?.student_id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #111; font-size: 13px; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            h2 { font-size: 14px; font-weight: normal; color: #555; margin-bottom: 24px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px; }
            .info-box { border: 1px solid #ddd; border-radius: 6px; padding: 10px; }
            .info-box .label { font-size: 11px; color: #888; margin-bottom: 4px; }
            .info-box .value { font-weight: bold; font-size: 14px; }
            .section-block { margin-bottom: 20px; }
            .section-header { background: #f5f5f5; padding: 8px 12px; border-radius: 6px 6px 0 0; border: 1px solid #ddd; display: flex; justify-content: space-between; }
            .section-header .code { font-weight: bold; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; border: 1px solid #ddd; border-top: none; }
            th { background: #fafafa; text-align: left; padding: 8px 12px; font-size: 11px; color: #666; border-bottom: 1px solid #ddd; }
            td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 12px; }
            .footer { margin-top: 32px; border-top: 1px solid #ddd; padding-top: 16px; font-size: 11px; color: #aaa; }
            @media print { body { padding: 16px; } }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `)
    win.document.close()
    win.focus()
    win.print()
    win.close()
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

  // Group enrollments by section
  const grouped = {}
  data?.enrollments?.forEach(e => {
    const code = e.section_detail?.code || 'Unknown'
    if (!grouped[code]) grouped[code] = { section: e.section_detail, subjects: [] }
    grouped[code].subjects.push(e)
  })

  const student    = data?.student
  const totalUnits = student?.total_enrolled_units || 0

  const enrolledSectionIds = [...new Set(data?.enrollments?.map(e => e.section) || [])]
  const availableSections  = sections.filter(s => !enrolledSectionIds.includes(s.id) && !s.is_full)

  return (
    <DashboardLayout>
      <Topbar
        title="My Enrollment"
        subtitle="Your current semester"
        actions={
          <div className="flex gap-2">
            {/* ✅ Print COR button — only show if enrolled */}
            {Object.keys(grouped).length > 0 && (
              <button onClick={handlePrint}
                className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                🖨 Print COR
              </button>
            )}
            <button
              onClick={() => { setShowForm(true); setError(''); setSuccess('') }}
              className="bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              + Enroll in Section
            </button>
          </div>
        }
      />

      <div className="p-6 space-y-5">
        {loading ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : (
          <>
            {success && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3">
                {success}
              </div>
            )}

            {/* Student summary cards */}
            {student && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label:'Student ID',     value: student.student_id,                     color:'text-amber-400' },
                  { label:'Course',         value: student.course,                         color:'text-white' },
                  { label:'Year Level',     value: `Year ${student.year_level}`,            color:'text-white' },
                  { label:'Enrolled Units', value: `${totalUnits} / ${student.max_units}`, color:'text-teal-400' },
                ].map(item => (
                  <div key={item.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="text-gray-500 text-xs mb-1">{item.label}</div>
                    <div className={`font-bold text-lg ${item.color}`}>{item.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Unit progress bar */}
            {student && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white text-sm font-medium">Unit Load</span>
                  <span className="text-gray-400 text-xs">{totalUnits} / {student.max_units} units</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500 transition-all"
                    style={{ width:`${Math.min((totalUnits / student.max_units) * 100, 100)}%` }}/>
                </div>
              </div>
            )}

            {/* Enrollment table — screen view */}
            {Object.keys(grouped).length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
                <p className="text-gray-600 text-sm">You have no enrollments yet.</p>
                <p className="text-gray-700 text-xs mt-1">Click "Enroll in Section" to get started.</p>
              </div>
            ) : (
              Object.entries(grouped).map(([code, group]) => (
                <div key={code} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  {/* Section header */}
                  <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between bg-gray-800/40">
                    <span className="text-amber-400 font-bold text-sm">{code}</span>
                    <span className="text-teal-400 text-xs font-semibold">
                      {group.subjects.reduce((s, e) => s + (e.subject_detail?.units || 0), 0)} units
                    </span>
                  </div>

                  {/* ✅ Added Schedule and Room columns */}
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        {['Code','Subject Name','Units','Schedule','Room','Status'].map(h => (
                          <th key={h} className="text-left px-5 py-2.5 text-gray-500 text-xs font-semibold uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {group.subjects.map(e => (
                        <tr key={e.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                          <td className="px-5 py-3 text-amber-400 text-sm font-mono font-medium">
                            {e.subject_detail?.code}
                          </td>
                          <td className="px-5 py-3 text-white text-sm">{e.subject_detail?.name}</td>
                          <td className="px-5 py-3 text-teal-400 text-sm font-semibold">{e.subject_detail?.units}</td>
                          {/* ✅ Schedule and Room from subject_detail */}
                          <td className="px-5 py-3 text-gray-400 text-sm">
                            {e.subject_detail?.schedule || <span className="text-gray-700">—</span>}
                          </td>
                          <td className="px-5 py-3 text-gray-400 text-sm">
                            {e.subject_detail?.room || <span className="text-gray-700">—</span>}
                          </td>
                          <td className="px-5 py-3">
                            <span className={statusBadge(e.status)}>{e.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* ✅ Hidden printable COR */}
      <div className="hidden">
        <div ref={printRef}>
          <h1>EnrollHub — Certificate of Registration</h1>
          <h2>Academic Year {new Date().getFullYear()} — {new Date().getFullYear() + 1}</h2>

          {student && (
            <div className="info-grid">
              <div className="info-box">
                <div className="label">Student ID</div>
                <div className="value">{student.student_id}</div>
              </div>
              <div className="info-box">
                <div className="label">Full Name</div>
                <div className="value">{student.full_name}</div>
              </div>
              <div className="info-box">
                <div className="label">Course</div>
                <div className="value">{student.course}</div>
              </div>
              <div className="info-box">
                <div className="label">Year Level</div>
                <div className="value">Year {student.year_level}</div>
              </div>
            </div>
          )}

          {Object.entries(grouped).map(([code, group]) => (
            <div className="section-block" key={code}>
              <div className="section-header">
                <span className="code">Section: {code}</span>
                <span>{group.subjects.reduce((s, e) => s + (e.subject_detail?.units || 0), 0)} units</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Subject Name</th>
                    <th>Units</th>
                    <th>Schedule</th>
                    <th>Room</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {group.subjects.map(e => (
                    <tr key={e.id}>
                      <td>{e.subject_detail?.code}</td>
                      <td>{e.subject_detail?.name}</td>
                      <td>{e.subject_detail?.units}</td>
                      <td>{e.subject_detail?.schedule || '—'}</td>
                      <td>{e.subject_detail?.room || '—'}</td>
                      <td>{e.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {student && (
            <div className="info-box" style={{marginTop: '16px'}}>
              <div className="label">Total Enrolled Units</div>
              <div className="value">{totalUnits} / {student.max_units} units</div>
            </div>
          )}

          <div className="footer">
            Printed on {new Date().toLocaleDateString()} · EnrollHub Enrollment System
          </div>
        </div>
      </div>

      {/* Enroll modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">Enroll in a Section</h2>
              <button onClick={() => { setShowForm(false); setPreview(null); setSelected('') }}
                className="text-gray-500 hover:text-white text-xl">×</button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg px-3 py-2 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleEnroll} className="space-y-4">
              <div>
                <label className="text-gray-400 text-xs block mb-1">Select Section</label>
                <select required value={selectedSection}
                  onChange={e => handleSectionChange(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500">
                  <option value="">Choose a section…</option>
                  {availableSections.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.available_slots} slots left
                    </option>
                  ))}
                </select>
                {availableSections.length === 0 && (
                  <p className="text-gray-600 text-xs mt-1">No available sections right now.</p>
                )}
              </div>

              {/* Subject preview */}
              {preview && (
                <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
                  <div className="flex justify-between mb-3">
                    <p className="text-white text-xs font-semibold">Subjects you will be enrolled in:</p>
                    <span className="text-teal-400 text-xs font-bold">{preview.total_units} total units</span>
                  </div>
                  {preview.subjects_detail?.length > 0 ? (
                    <div className="space-y-2">
                      {preview.subjects_detail.map(sub => (
                        <div key={sub.id} className="bg-gray-800 rounded-lg px-3 py-2">
                          <div className="flex justify-between">
                            <div>
                              <span className="text-amber-400 text-xs font-mono font-bold">{sub.code}</span>
                              <span className="text-gray-300 text-xs ml-2">{sub.name}</span>
                            </div>
                            <span className="text-teal-400 text-xs font-semibold">{sub.units} units</span>
                          </div>
                          {/* ✅ Show schedule and room in preview too */}
                          {(sub.schedule || sub.room) && (
                            <div className="mt-1 flex gap-3">
                              {sub.schedule && <span className="text-indigo-400 text-xs">🕐 {sub.schedule}</span>}
                              {sub.room     && <span className="text-gray-400 text-xs">📍 {sub.room}</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-xs">This section has no subjects yet.</p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button"
                  onClick={() => { setShowForm(false); setPreview(null); setSelected('') }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm py-2.5 rounded-lg">
                  Cancel
                </button>
                <button type="submit" disabled={enrolling || !preview?.subjects_detail?.length}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-semibold py-2.5 rounded-lg">
                  {enrolling ? 'Enrolling...' : `Enroll in ${preview?.subjects_detail?.length || 0} Subject(s)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}