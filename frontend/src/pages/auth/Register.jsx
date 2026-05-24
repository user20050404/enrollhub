import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'

export default function Register() {
  const [form, setForm]       = useState({ email:'', first_name:'', last_name:'', password:'', password2:'', role:'student' })
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/register/', form)
      setSuccess('Registration successful! Check your email (or terminal) for the verification link.')
    } catch (err) {
      const data = err.response?.data
      setError(typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center font-bold text-black text-lg">E</div>
          <div>
            <div className="text-white font-bold text-xl">EnrollHub</div>
            <div className="text-gray-500 text-xs">Create your account</div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h1 className="text-white text-2xl font-bold mb-6">Create account</h1>

          {error   && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
          {success && <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3 mb-4">{success}</div>}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-sm block mb-1.5">First name</label>
                  <input name="first_name" value={form.first_name} onChange={handleChange} required
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"/>
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1.5">Last name</label>
                  <input name="last_name" value={form.last_name} onChange={handleChange} required
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"/>
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1.5">Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"/>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1.5">Role</label>
                <select name="role" value={form.role} onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500">
                  <option value="student">Student</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1.5">Password</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} required
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"/>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1.5">Confirm password</label>
                <input type="password" name="password2" value={form.password2} onChange={handleChange} required
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"/>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold rounded-lg py-2.5 text-sm transition-colors">
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          )}

          <p className="text-gray-500 text-sm text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-amber-500 hover:text-amber-400">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}