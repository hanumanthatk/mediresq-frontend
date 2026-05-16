import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/common/Layout'
import { PageLoader } from '../../components/common/UI'
import { emergencyApi } from '../../api/emergencyApi'
import { hospitalApi }  from '../../api/hospitalApi'
import { AlertTriangle, Ambulance, BedDouble, Phone, MapPin, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const REQUEST_TYPES = [
  { value: 'SOS',             icon: AlertTriangle, label: 'SOS Emergency',     desc: 'Immediate life-threatening emergency',  color: 'brand' },
  { value: 'AMBULANCE',       icon: Ambulance,     label: 'Ambulance Request',  desc: 'Request ambulance to your location',   color: 'orange' },
  { value: 'BED_RESERVATION', icon: BedDouble,     label: 'Bed Reservation',    desc: 'Reserve a hospital bed in advance',    color: 'blue' },
]

const PRIORITIES = ['CRITICAL','HIGH','MEDIUM','LOW']
const SYMPTOMS_LIST = ['Chest pain','Difficulty breathing','Severe bleeding','Unconscious',
  'High fever','Stroke symptoms','Fracture','Severe burns','Allergic reaction','Trauma']

export default function EmergencyRequest() {
  const navigate = useNavigate()
  const [hospitals, setHospitals] = useState([])
  const [loadingHosp, setLoadingHosp] = useState(true)
  const [submitting, setSubmitting]   = useState(false)
  const [submitted, setSubmitted]     = useState(false)

  const [form, setForm] = useState({
    requestType: 'AMBULANCE', priority: 'HIGH', hospitalId: '',
    patientCondition: '', symptoms: [], patientAddress: '',
    patientLatitude: null, patientLongitude: null, notes: '', isEmergency: false,
  })

  useEffect(() => {
    hospitalApi.getAll()
      .then(r => setHospitals(r.data))
      .finally(() => setLoadingHosp(false))

    // Auto-fill location
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => setForm(f => ({
        ...f,
        patientLatitude: coords.latitude,
        patientLongitude: coords.longitude,
      }))
    )
  }, [])

  const toggleSymptom = (s) => {
    setForm(f => ({
      ...f,
      symptoms: f.symptoms.includes(s)
        ? f.symptoms.filter(x => x !== s)
        : [...f.symptoms, s]
    }))
  }

  const submit = async () => {
    if (!form.patientCondition && form.symptoms.length === 0)
      return toast.error('Please describe the condition or select symptoms')

    setSubmitting(true)
    try {
      const payload = {
        ...form,
        hospitalId: form.hospitalId ? Number(form.hospitalId) : null,
        symptoms: form.symptoms.join(', '),
        isEmergency: form.requestType === 'SOS',
      }
      await emergencyApi.createRequest(payload)
      setSubmitted(true)
      toast.success('Emergency request submitted!')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) return (
    <Layout>
      <div className="max-w-md mx-auto mt-20 flex flex-col items-center gap-6 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-950 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Request Submitted!</h2>
          <p className="text-gray-400 mt-2">Your emergency request has been sent. You'll receive updates shortly.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/patient/history')} className="btn-primary">
            Track Request
          </button>
          <button onClick={() => setSubmitted(false)} className="btn-secondary">
            New Request
          </button>
        </div>
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="page-header">
          <h1 className="page-title">Emergency Request</h1>
          <p className="page-subtitle">Fill the form below — we'll connect you with help immediately</p>
        </div>

        <div className="space-y-6">
          {/* Request type */}
          <div className="card">
            <h2 className="font-display font-semibold text-white mb-4">Request Type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {REQUEST_TYPES.map(({ value, icon: Icon, label, desc, color }) => (
                <button key={value} type="button"
                  onClick={() => setForm(f => ({ ...f, requestType: value }))}
                  className={`flex flex-col items-start gap-2 p-4 rounded-xl border transition-all text-left
                    ${form.requestType === value
                      ? 'border-brand-600 bg-brand-950/40'
                      : 'border-gray-800 bg-gray-800/20 hover:border-gray-700'}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center
                    ${form.requestType === value
                      ? 'bg-brand-900 text-brand-400'
                      : 'bg-gray-800 text-gray-500'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${form.requestType === value ? 'text-white' : 'text-gray-400'}`}>{label}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Priority + Hospital */}
          <div className="card">
            <h2 className="font-display font-semibold text-white mb-4">Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="input-group">
                <label className="label">Priority Level</label>
                <div className="grid grid-cols-4 gap-2">
                  {PRIORITIES.map(p => (
                    <button key={p} type="button"
                      onClick={() => setForm(f => ({ ...f, priority: p }))}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition-all
                        ${form.priority === p
                          ? p === 'CRITICAL' ? 'bg-red-900 border-red-700 text-red-300'
                            : p === 'HIGH'   ? 'bg-orange-900 border-orange-700 text-orange-300'
                            : p === 'MEDIUM' ? 'bg-yellow-900 border-yellow-700 text-yellow-300'
                            : 'bg-blue-900 border-blue-700 text-blue-300'
                          : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label className="label">Select Hospital (optional)</label>
                <select value={form.hospitalId} onChange={e => setForm(f => ({ ...f, hospitalId: e.target.value }))}
                  className="input">
                  <option value="">Auto-assign nearest</option>
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id}>{h.name} — {h.city}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="input-group mt-4">
              <label className="label">Patient Condition / Description *</label>
              <textarea value={form.patientCondition}
                onChange={e => setForm(f => ({ ...f, patientCondition: e.target.value }))}
                className="input resize-none" rows={3}
                placeholder="Describe the emergency situation in detail…" />
            </div>

            <div className="input-group mt-4">
              <label className="label">Address / Location</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                <input value={form.patientAddress}
                  onChange={e => setForm(f => ({ ...f, patientAddress: e.target.value }))}
                  className="input pl-10" placeholder="Enter address or use GPS location" />
              </div>
              {form.patientLatitude && (
                <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  GPS: {form.patientLatitude.toFixed(4)}, {form.patientLongitude.toFixed(4)}
                </p>
              )}
            </div>
          </div>

          {/* Symptoms */}
          <div className="card">
            <h2 className="font-display font-semibold text-white mb-4">Symptoms (select all that apply)</h2>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS_LIST.map(s => (
                <button key={s} type="button" onClick={() => toggleSymptom(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                    ${form.symptoms.includes(s)
                      ? 'bg-brand-950 border-brand-700 text-brand-300'
                      : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="input-group">
              <label className="label">Additional Notes</label>
              <textarea value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="input resize-none" rows={2}
                placeholder="Any additional information for the medical team…" />
            </div>
          </div>

          {/* Submit */}
          <button onClick={submit} disabled={submitting}
            className={`btn w-full py-4 text-base font-display font-bold
              ${form.requestType === 'SOS'
                ? 'btn-primary shadow-[0_0_40px_rgba(229,29,29,0.4)]'
                : 'btn-primary'}`}>
            {submitting
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</>
              : form.requestType === 'SOS'
              ? <><AlertTriangle className="w-5 h-5" /> SEND SOS EMERGENCY</>
              : <><Ambulance className="w-5 h-5" /> Submit Request</>}
          </button>
        </div>
      </div>
    </Layout>
  )
}
