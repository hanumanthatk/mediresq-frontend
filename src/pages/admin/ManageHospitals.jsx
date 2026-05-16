import { useState, useEffect, useCallback } from 'react'
import Layout from '../../components/common/Layout'
import { PageLoader, EmptyState, ConfirmModal } from '../../components/common/UI'
import { adminApi } from '../../api/adminApi'
import {
  Hospital, Search, CheckCircle, XCircle, ToggleLeft, ToggleRight,
  MapPin, Phone, BedDouble, RefreshCw, Star
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function ManageHospitals() {
  const [hospitals, setHospitals] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState('ALL')
  const [confirmId, setConfirmId] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)

  const load = useCallback(async () => {
    try { const { data } = await adminApi.getHospitals(); setHospitals(data) }
    catch { toast.error('Failed to load hospitals') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleVerify = async (id, verified) => {
    try {
      const { data } = await adminApi.verifyHospital(id, verified)
      setHospitals(prev => prev.map(h => h.id === id ? data : h))
      toast.success(`Hospital ${verified ? 'verified' : 'unverified'}`)
    } catch { toast.error('Action failed') }
    setConfirmId(null)
  }

  const handleToggle = async (id) => {
    try {
      const { data } = await adminApi.toggleHospital(id)
      setHospitals(prev => prev.map(h => h.id === id ? data : h))
      toast.success(`Hospital ${data.isActive ? 'activated' : 'deactivated'}`)
    } catch { toast.error('Action failed') }
    setConfirmId(null)
  }

  const filtered = hospitals.filter(h => {
    const matchSearch = !search ||
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.city.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'ALL'          ? true :
      filter === 'VERIFIED'     ? h.isVerified :
      filter === 'PENDING'      ? !h.isVerified :
      filter === 'INACTIVE'     ? !h.isActive : true
    return matchSearch && matchFilter
  })

  if (loading) return <Layout><PageLoader /></Layout>

  return (
    <Layout>
      <ConfirmModal
        open={!!confirmId}
        title={confirmAction?.title || 'Confirm Action'}
        message={confirmAction?.message || ''}
        confirmLabel={confirmAction?.label}
        danger={confirmAction?.danger}
        onConfirm={() => confirmAction?.fn()}
        onCancel={() => { setConfirmId(null); setConfirmAction(null) }} />

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="page-title">Manage Hospitals</h1>
          <p className="page-subtitle">{hospitals.length} registered · {hospitals.filter(h => !h.isVerified).length} pending verification</p>
        </div>
        <button onClick={load} className="btn-icon mt-1"><RefreshCw className="w-4 h-4 text-gray-400" /></button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-10" placeholder="Search hospitals…" />
        </div>
        <div className="flex gap-2">
          {['ALL','VERIFIED','PENDING','INACTIVE'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all
                ${filter === f ? 'bg-brand-950 border-brand-700 text-brand-300' :
                'bg-gray-800/50 border-gray-800 text-gray-500 hover:border-gray-700'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0
        ? <EmptyState icon={Hospital} title="No hospitals found" />
        : (
          <div className="space-y-3">
            {filtered.map(h => (
              <div key={h.id} className="card hover:border-gray-700 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Logo */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 font-display font-bold text-lg
                    ${h.isVerified ? 'bg-blue-950 text-blue-400' : 'bg-yellow-950 text-yellow-400'}`}>
                    {h.name[0]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-display font-semibold text-white">{h.name}</h3>
                      <span className={`badge ${h.isVerified ? 'badge-green' : 'badge-yellow'}`}>
                        {h.isVerified ? '✓ Verified' : '⏳ Pending'}
                      </span>
                      <span className={`badge ${h.isActive ? 'badge-green' : 'badge-red'}`}>
                        {h.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="badge-gray">{h.type}</span>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap text-xs text-gray-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{h.city}, {h.state}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{h.phone}</span>
                      <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />
                        {h.beds?.reduce((s, b) => s + (b.availableCount || 0), 0) ?? 0} beds available
                      </span>
                      {h.rating > 0 && (
                        <span className="flex items-center gap-1 text-yellow-400">
                          <Star className="w-3 h-3 fill-current" />{h.rating}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!h.isVerified ? (
                      <button
                        onClick={() => {
                          setConfirmId(h.id)
                          setConfirmAction({
                            title: 'Verify Hospital',
                            message: `Verify "${h.name}"? It will become publicly visible.`,
                            label: 'Verify',
                            fn: () => handleVerify(h.id, true),
                          })
                        }}
                        className="btn-success btn-sm">
                        <CheckCircle className="w-3.5 h-3.5" /> Verify
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setConfirmId(h.id)
                          setConfirmAction({
                            title: 'Revoke Verification',
                            message: `Remove verification from "${h.name}"?`,
                            label: 'Revoke', danger: true,
                            fn: () => handleVerify(h.id, false),
                          })
                        }}
                        className="btn-secondary btn-sm">
                        <XCircle className="w-3.5 h-3.5" /> Revoke
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setConfirmId(h.id)
                        setConfirmAction({
                          title: h.isActive ? 'Deactivate Hospital' : 'Activate Hospital',
                          message: `${h.isActive ? 'Deactivate' : 'Activate'} "${h.name}"?`,
                          label: h.isActive ? 'Deactivate' : 'Activate',
                          danger: h.isActive,
                          fn: () => handleToggle(h.id),
                        })
                      }}
                      className="btn-icon">
                      {h.isActive
                        ? <ToggleRight className="w-4 h-4 text-emerald-400" />
                        : <ToggleLeft className="w-4 h-4 text-gray-500" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </Layout>
  )
}
