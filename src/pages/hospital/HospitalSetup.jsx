import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { hospitalApi } from '../../api/hospitalApi'
import { Heart, Hospital, MapPin, Phone, Loader2, CheckCircle, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

const HOSPITAL_TYPES = ['GOVERNMENT','PRIVATE','SEMI_GOVERNMENT','CHARITABLE']
const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra',
  'Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu',
  'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi']

const STEPS = ['Basic Info','Location & Contact','Capacity','Review']

export default function HospitalSetup() {
  const navigate = useNavigate()
  const [step,    setStep]    = useState(0)
  const [loading, setLoading] = useState(false)
  const [locating,setLocating]= useState(false)
  const [done,    setDone]    = useState(false)

  const [form, setForm] = useState({
    name: '', registrationNumber: '', type: 'GOVERNMENT',
    specialization: '', description: '', establishedYear: '',
    address: '', city: '', state: 'Karnataka', pincode: '',
    latitude: '', longitude: '',
    phone: '', emergencyPhone: '', email: '', website: '',
    totalBeds: '', totalIcuBeds: '',
  })

  const h = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const getLocation = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm(f => ({ ...f, latitude: coords.latitude.toFixed(6), longitude: coords.longitude.toFixed(6) }))
        toast.success('Location captured!')
        setLocating(false)
      },
      () => { toast.error('Location access denied'); setLocating(false) }
    )
  }

  const next = () => {
    if (step === 0 && (!form.name || !form.registrationNumber)) return toast.error('Name and registration number required')
    if (step === 1 && (!form.address || !form.city || !form.phone)) return toast.error('Address and phone required')
    setStep(s => s + 1)
  }

  const submit = async () => {
    setLoading(true)
    try {
      await hospitalApi.createProfile({
        ...form,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        totalBeds: form.totalBeds ? parseInt(form.totalBeds) : 0,
        totalIcuBeds: form.totalIcuBeds ? parseInt(form.totalIcuBeds) : 0,
        establishedYear: form.establishedYear ? parseInt(form.establishedYear) : null,
      })
      setDone(true)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Setup failed')
    } finally { setLoading(false) }
  }

  if (done) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="card max-w-md w-full text-center py-12">
        <div className="w-16 h-16 rounded-full bg-emerald-950 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-display font-bold text-white">Profile Submitted!</h2>
        <p className="text-gray-400 mt-2 text-sm">
          Your hospital profile is pending admin verification. You'll be notified once approved.
        </p>
        <button onClick={() => navigate('/hospital/dashboard')} className="btn-primary mt-6">
          Go to Dashboard <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4"
         style={{ backgroundImage: 'radial-gradient(ellipse at 50% 30%, rgba(59,130,246,0.05) 0%, transparent 60%)' }}>
      <div className="w-full max-w-2xl">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center
                          shadow-[0_0_20px_rgba(229,29,29,0.4)]">
            <Heart className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <div>
            <p className="font-display font-bold text-white">Hospital Registration</p>
            <p className="text-xs text-gray-500">Complete your hospital profile to go live</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2
                  ${i < step  ? 'bg-emerald-500 border-emerald-500 text-white' :
                    i === step ? 'bg-brand-600 border-brand-500 text-white shadow-[0_0_15px_rgba(229,29,29,0.4)]' :
                    'bg-gray-800 border-gray-700 text-gray-500'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-[10px] hidden sm:block ${i === step ? 'text-brand-400' : 'text-gray-600'}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mb-5 mx-1 ${i < step ? 'bg-emerald-500' : 'bg-gray-800'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="card">
          {/* Step 0: Basic Info */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-display font-semibold text-white mb-6">Basic Information</h2>
              <div className="input-group">
                <label className="label">Hospital Name *</label>
                <input name="name" value={form.name} onChange={h} className="input" placeholder="City General Hospital" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="label">Registration Number *</label>
                  <input name="registrationNumber" value={form.registrationNumber} onChange={h} className="input" placeholder="HOS2024001" />
                </div>
                <div className="input-group">
                  <label className="label">Hospital Type</label>
                  <select name="type" value={form.type} onChange={h} className="input">
                    {HOSPITAL_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="label">Specialization</label>
                  <input name="specialization" value={form.specialization} onChange={h} className="input" placeholder="Multi-Specialty, Cardiology…" />
                </div>
                <div className="input-group">
                  <label className="label">Established Year</label>
                  <input name="establishedYear" type="number" value={form.establishedYear} onChange={h} className="input" placeholder="1985" />
                </div>
              </div>
              <div className="input-group">
                <label className="label">Description</label>
                <textarea name="description" value={form.description} onChange={h} rows={3}
                  className="input resize-none" placeholder="Brief description of your hospital…" />
              </div>
            </div>
          )}

          {/* Step 1: Location & Contact */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-display font-semibold text-white mb-6">Location & Contact</h2>
              <div className="input-group">
                <label className="label">Full Address *</label>
                <textarea name="address" value={form.address} onChange={h} rows={2}
                  className="input resize-none" placeholder="123 Medical Street, Koramangala" />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="input-group">
                  <label className="label">City *</label>
                  <input name="city" value={form.city} onChange={h} className="input" placeholder="Bengaluru" />
                </div>
                <div className="input-group">
                  <label className="label">State</label>
                  <select name="state" value={form.state} onChange={h} className="input">
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="label">Pincode</label>
                  <input name="pincode" value={form.pincode} onChange={h} className="input" placeholder="560034" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="label">Latitude</label>
                  <input name="latitude" value={form.latitude} onChange={h} className="input" placeholder="12.9352" />
                </div>
                <div className="input-group">
                  <label className="label">Longitude</label>
                  <div className="flex gap-2">
                    <input name="longitude" value={form.longitude} onChange={h} className="input" placeholder="77.6245" />
                    <button type="button" onClick={getLocation} disabled={locating}
                      className="btn-secondary flex-shrink-0 px-3">
                      <MapPin className={`w-4 h-4 ${locating ? 'animate-bounce' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="label">Phone *</label>
                  <input name="phone" value={form.phone} onChange={h} className="input" placeholder="080-12345678" />
                </div>
                <div className="input-group">
                  <label className="label">Emergency Phone</label>
                  <input name="emergencyPhone" value={form.emergencyPhone} onChange={h} className="input" placeholder="080-99999999" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="label">Email</label>
                  <input name="email" type="email" value={form.email} onChange={h} className="input" />
                </div>
                <div className="input-group">
                  <label className="label">Website</label>
                  <input name="website" value={form.website} onChange={h} className="input" placeholder="https://" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Capacity */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-display font-semibold text-white mb-6">Hospital Capacity</h2>
              <p className="text-sm text-gray-500">Enter total bed capacity. You can update live availability from the dashboard.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="label">Total General Beds</label>
                  <input name="totalBeds" type="number" value={form.totalBeds} onChange={h} className="input" placeholder="200" />
                </div>
                <div className="input-group">
                  <label className="label">Total ICU Beds</label>
                  <input name="totalIcuBeds" type="number" value={form.totalIcuBeds} onChange={h} className="input" placeholder="30" />
                </div>
              </div>
              <div className="bg-blue-950/40 border border-blue-900/40 rounded-xl p-4 text-sm text-blue-300">
                💡 After setup, go to <strong>Bed Management</strong> to set live available counts for each bed type (ICU, CCU, Emergency, etc.)
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-display font-semibold text-white mb-6">Review & Submit</h2>
              <div className="space-y-3">
                {[
                  ['Hospital Name',      form.name],
                  ['Reg. Number',        form.registrationNumber],
                  ['Type',               form.type],
                  ['City / State',       `${form.city}, ${form.state}`],
                  ['Phone',              form.phone],
                  ['Total Beds',         form.totalBeds || '0'],
                  ['ICU Beds',           form.totalIcuBeds || '0'],
                  ['Specialization',     form.specialization || '—'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2 border-b border-gray-800 last:border-0">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className="text-sm text-gray-200 font-medium text-right max-w-xs truncate">{value}</span>
                  </div>
                ))}
              </div>
              <div className="bg-yellow-950/40 border border-yellow-900/40 rounded-xl p-3 text-xs text-yellow-400">
                ⚠️ After submission, your profile will be reviewed by the system admin before going live.
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex-1">
                Back
              </button>
            )}
            {step < STEPS.length - 1
              ? <button onClick={next} className="btn-primary flex-1">Next <ArrowRight className="w-4 h-4" /></button>
              : <button onClick={submit} disabled={loading} className="btn-primary flex-1">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Submit for Approval'}
                </button>
            }
          </div>
        </div>
      </div>
    </div>
  )
}
