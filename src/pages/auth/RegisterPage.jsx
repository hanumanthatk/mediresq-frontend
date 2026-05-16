import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Heart, Eye, EyeOff, Loader2, User, Hospital, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLES = [
  { value: 'PATIENT',  label: 'Patient',  icon: User,     desc: 'Find hospitals & request ambulance' },
  { value: 'HOSPITAL', label: 'Hospital', icon: Hospital, desc: 'Manage beds, staff & emergency queue' },
]

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate     = useNavigate()

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', role: 'PATIENT', bloodGroup: '',
    address: '', emergencyContact: ''
  })
  const [show, setShow]       = useState(false)
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const isHospital = form.role === 'HOSPITAL'

  const submit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.phone || !form.password)
      return toast.error('Please fill all required fields')
    if (isHospital && !form.firstName)
      return toast.error('Hospital name is required')
    if (!isHospital && (!form.firstName || !form.lastName))
      return toast.error('First and last name are required')
    if (form.password.length < 8)
      return toast.error('Password must be at least 8 characters')

    setLoading(true)
    try {
      const payload = isHospital
        ? {
            ...form,
            lastName: 'Hospital',
            bloodGroup: '',        // ← clear this for hospital
            address: form.address,
          }
        : form

      const data = await register(payload)
      toast.success('Account created! Welcome 🎉')
      navigate(
        data.role === 'HOSPITAL' ? '/hospital/setup' : '/patient/dashboard',
        { replace: true }
      )
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4"
         style={{ backgroundImage: 'radial-gradient(ellipse at 70% 60%, rgba(229,29,29,0.05) 0%, transparent 60%)' }}>

      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center
                          shadow-[0_0_20px_rgba(229,29,29,0.4)]">
            <Heart className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <div>
            <p className="font-display font-bold text-white text-sm">Smart Emergency System</p>
            <p className="text-gray-600 text-xs">Create your account</p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-display font-semibold text-white mb-6">Register</h2>

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {ROLES.map(({ value, label, icon: Icon, desc }) => (
              <button key={value} type="button"
                onClick={() => setForm(f => ({ ...f, role: value, firstName: '', lastName: '' }))}
                className={`flex flex-col items-start gap-2 p-4 rounded-xl border transition-all text-left
                  ${form.role === value
                    ? 'border-brand-600 bg-brand-950/40 shadow-[0_0_20px_rgba(229,29,29,0.15)]'
                    : 'border-gray-800 bg-gray-800/30 hover:border-gray-700'}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center
                  ${form.role === value ? 'bg-brand-900 text-brand-400' : 'bg-gray-800 text-gray-500'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className={`font-semibold text-sm ${form.role === value ? 'text-white' : 'text-gray-400'}`}>
                    {label}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">{desc}</p>
                </div>
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">

            {/* PATIENT fields */}
            {!isHospital && (
              <div className="grid grid-cols-2 gap-3">
                <div className="input-group">
                  <label className="label">First Name *</label>
                  <input name="firstName" value={form.firstName} onChange={handle}
                         className="input" placeholder="Arjun" />
                </div>
                <div className="input-group">
                  <label className="label">Last Name *</label>
                  <input name="lastName" value={form.lastName} onChange={handle}
                         className="input" placeholder="Sharma" />
                </div>
              </div>
            )}

            {/* HOSPITAL fields */}
            {isHospital && (
  <>
    <div className="input-group">
      <label className="label">Hospital Name *</label>
      <input name="firstName" value={form.firstName} onChange={handle}
             className="input" placeholder="City General Hospital" />
    </div>
    <div className="input-group">
      <label className="label">City</label>
      <input name="address" value={form.address} onChange={handle}
             className="input" placeholder="Bengaluru" />
    </div>
  </>
)}

            {/* Common fields */}
            <div className="input-group">
              <label className="label">Email *</label>
              <input name="email" type="email" value={form.email} onChange={handle}
                     className="input" placeholder="you@example.com" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="input-group">
                <label className="label">Phone *</label>
                <input name="phone" value={form.phone} onChange={handle}
                       className="input" placeholder="9876543210" />
              </div>

              {/* Blood group for patient only */}
              {!isHospital && (
                <div className="input-group">
                  <label className="label">Blood Group</label>
                  <select name="bloodGroup" value={form.bloodGroup} onChange={handle} className="input">
                    <option value="">Select</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="input-group">
              <label className="label">Password *</label>
              <div className="relative">
                <input name="password" type={show ? 'text' : 'password'}
                       value={form.password} onChange={handle}
                       className="input pr-11"
                       placeholder="Min 8 chars with uppercase, number & symbol" />
                <button type="button" onClick={() => setShow(!show)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isHospital && (
              <div className="input-group">
                <label className="label">Address</label>
                <input name="address" value={form.address} onChange={handle}
                       className="input" placeholder="123 Main St, Bengaluru" />
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
                : <><ArrowRight className="w-4 h-4" />
                    {isHospital ? 'Register Hospital' : 'Create Account'}</>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already registered?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}