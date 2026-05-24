import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import Topbar from '../components/layout/Topbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Profile() {
  const { user, setUser } = useAuth()
  const navigate          = useNavigate()
  const fileRef           = useRef()

  const [form, setForm]           = useState({
    first_name: user?.first_name || '',
    last_name:  user?.last_name  || '',
  })
  const [pwForm, setPwForm]       = useState({ old_password:'', new_password:'', confirm:'' })
  const [preview, setPreview]     = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [saving, setSaving]       = useState(false)
  const [savingPw, setSavingPw]   = useState(false)
  const [success, setSuccess]     = useState('')
  const [error, setError]         = useState('')
  const [pwError, setPwError]     = useState('')
  const [pwSuccess, setPwSuccess] = useState('')

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setSaving(true)
    try {
      const formData = new FormData()
      formData.append('first_name', form.first_name)
      formData.append('last_name',  form.last_name)
      if (imageFile) formData.append('profile_image', imageFile)

      await api.patch('/auth/me/update/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      // Re-fetch fresh user data to get full Cloudinary URL
      const fresh = await api.get('/auth/me/')
      setUser(fresh.data)
      setSuccess('Profile updated successfully!')
      setImageFile(null)
      setPreview(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile.')
    } finally { setSaving(false) }
  }

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    setPwError(''); setPwSuccess('')
    if (pwForm.new_password !== pwForm.confirm) {
      setPwError('New passwords do not match.'); return
    }
    setSavingPw(true)
    try {
      await api.post('/auth/change-password/', {
        old_password: pwForm.old_password,
        new_password: pwForm.new_password,
      })
      setPwSuccess('Password changed successfully!')
      setPwForm({ old_password:'', new_password:'', confirm:'' })
    } catch (err) {
      setPwError(err.response?.data?.error || 'Failed to change password.')
    } finally { setSavingPw(false) }
  }

  const profileImage = preview || (user?.profile_image ? user.profile_image : null)
  const initials     = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`

  return (
    <DashboardLayout>
      <Topbar title="My Profile" subtitle="Manage your account details" />

      <div className="p-6 max-w-3xl space-y-6">

        {/* Profile card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-semibold text-sm mb-5">Profile Information</h2>

          {success && <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-xs rounded-lg px-4 py-3 mb-4">{success}</div>}
          {error   && <div className="bg-red-500/10   border border-red-500/30   text-red-400   text-xs rounded-lg px-4 py-3 mb-4">{error}</div>}

          <form onSubmit={handleProfileSave}>
            {/* Avatar */}
            <div className="flex items-center gap-5 mb-6">
              <div className="relative">
                {profileImage ? (
                  <img
                    src={`${profileImage}?t=${Date.now()}`}
                    alt="Profile"
                    className="w-20 h-20 rounded-xl object-cover border-2 border-gray-700"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold border-2 border-gray-700">
                    {initials}
                  </div>
                )}
                <button type="button" onClick={() => fileRef.current.click()}
                  className="absolute -bottom-2 -right-2 w-7 h-7 bg-amber-500 hover:bg-amber-400 rounded-full flex items-center justify-center text-black text-xs font-bold transition-colors">
                  ✎
                </button>
              </div>
              <div>
                <div className="text-white font-semibold">{user?.first_name} {user?.last_name}</div>
                <div className="text-gray-500 text-xs capitalize mt-0.5">{user?.role}</div>
                <button type="button" onClick={() => fileRef.current.click()}
                  className="text-amber-500 hover:text-amber-400 text-xs mt-1.5 transition-colors">
                  Change photo
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange}/>
            </div>

            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">First name</label>
                <input value={form.first_name} onChange={e => setForm({...form, first_name:e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"/>
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">Last name</label>
                <input value={form.last_name} onChange={e => setForm({...form, last_name:e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"/>
              </div>
            </div>

            {/* Read-only fields */}
            <div className="mb-4">
              <label className="text-gray-400 text-xs block mb-1.5">Email address</label>
              <input value={user?.email || ''} disabled
                className="w-full bg-gray-800/50 border border-gray-700 text-gray-500 rounded-lg px-4 py-2.5 text-sm cursor-not-allowed"/>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">Role</label>
                <input value={user?.role || ''} disabled
                  className="w-full bg-gray-800/50 border border-gray-700 text-gray-500 rounded-lg px-4 py-2.5 text-sm cursor-not-allowed capitalize"/>
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">Email verified</label>
                <input value={user?.is_verified ? 'Verified ✓' : 'Not verified'} disabled
                  className="w-full bg-gray-800/50 border border-gray-700 text-gray-500 rounded-lg px-4 py-2.5 text-sm cursor-not-allowed"/>
              </div>
            </div>

            <button type="submit" disabled={saving}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change password card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-semibold text-sm mb-5">Change Password</h2>

          {pwSuccess && <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-xs rounded-lg px-4 py-3 mb-4">{pwSuccess}</div>}
          {pwError   && <div className="bg-red-500/10   border border-red-500/30   text-red-400   text-xs rounded-lg px-4 py-3 mb-4">{pwError}</div>}

          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div>
              <label className="text-gray-400 text-xs block mb-1.5">Current password</label>
              <input type="password" value={pwForm.old_password}
                onChange={e => setPwForm({...pwForm, old_password:e.target.value})} required
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">New password</label>
                <input type="password" value={pwForm.new_password}
                  onChange={e => setPwForm({...pwForm, new_password:e.target.value})} required
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"/>
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">Confirm new password</label>
                <input type="password" value={pwForm.confirm}
                  onChange={e => setPwForm({...pwForm, confirm:e.target.value})} required
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"/>
              </div>
            </div>
            <button type="submit" disabled={savingPw}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors">
              {savingPw ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>

      </div>
    </DashboardLayout>
  )
}