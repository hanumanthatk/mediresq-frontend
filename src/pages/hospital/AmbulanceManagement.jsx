import { useState, useEffect, useCallback } from 'react'
import Layout from '../../components/common/Layout'
import { PageLoader, EmptyState } from '../../components/common/UI'
import { hospitalApi } from '../../api/hospitalApi'
import { Ambulance, RefreshCw, Phone, User, CheckCircle, Clock, Wrench, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  AVAILABLE:      { color: 'emerald', icon: CheckCircle, label: 'Available' },
  DISPATCHED:     { color: 'orange',  icon: Ambulance,   label: 'Dispatched' },
  ON_DUTY:        { color: 'blue',    icon: Clock,        label: 'On Duty' },
  MAINTENANCE:    { color: 'yellow',  icon: Wrench,       label: 'Maintenance' },
  OUT_OF_SERVICE: { color: 'red',     icon: XCircle,      label: 'Out of Service' },
}

const ALL_STATUSES = Object.keys(STATUS_CONFIG)

export default function AmbulanceManagement() {
  const [ambulances, setAmbulances] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [updating,   setUpdating]   = useState({})

  const load = useCallback(async () => {
    try {
      const { data } = await hospitalApi.getAmbulances()
      setAmbulances(data)
    } catch { toast.error('Failed to load ambulances') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id, status) => {
    setUpdating(u => ({ ...u, [id]: true }))
    try {
      const { data } = await hospitalApi.updateAmbulanceStatus(id, status)
      setAmbulances(prev => prev.map(a => a.id === id ? data : a))
      toast.success(`Ambulance status → ${status}`)
    } catch { toast.error('Status update failed') }
    finally { setUpdating(u => ({ ...u, [id]: false })) }
  }

  const summary = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = ambulances.filter(a => a.status === s).length
    return acc
  }, {})

  if (loading) return <Layout><PageLoader /></Layout>

  return (
    <Layout>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="page-title">Ambulance Fleet</h1>
          <p className="page-subtitle">{ambulances.length} ambulances · real-time status management</p>
        </div>
        <button onClick={load} className="btn-icon mt-1"><RefreshCw className="w-4 h-4 text-gray-400" /></button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-8">
        {ALL_STATUSES.map(s => {
          const { color, label } = STATUS_CONFIG[s]
          return (
            <div key={s} className="card text-center py-4">
              <p className={`text-2xl font-display font-bold text-${color}-400`}>{summary[s]}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wide">{label}</p>
            </div>
          )
        })}
      </div>

      {ambulances.length === 0
        ? <EmptyState icon={Ambulance} title="No ambulances registered"
            message="Contact admin to register ambulances for your hospital" />
        : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {ambulances.map(amb => {
              const cfg = STATUS_CONFIG[amb.status] || STATUS_CONFIG.AVAILABLE
              const Icon = cfg.icon
              return (
                <div key={amb.id} className={`card transition-all
                  ${amb.status === 'AVAILABLE' ? 'border-emerald-900/30' :
                    amb.status === 'DISPATCHED' ? 'border-orange-900/30 bg-orange-950/5' :
                    'border-gray-800'}`}>

                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                        bg-${cfg.color}-950 text-${cfg.color}-400`}>
                        <Ambulance className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-display font-bold text-white font-mono">{amb.vehicleNumber}</p>
                        <p className="text-xs text-gray-500">{amb.ambulanceType}</p>
                      </div>
                    </div>
                    <span className={`badge bg-${cfg.color}-950 text-${cfg.color}-400 border-${cfg.color}-900`}>
                      <Icon className="w-3 h-3" /> {cfg.label}
                    </span>
                  </div>

                  {/* Staff info */}
                  <div className="space-y-2 mb-4">
                    {amb.driverName && (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <User className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                        <span>Driver: {amb.driverName}</span>
                        {amb.driverPhone && (
                          <a href={`tel:${amb.driverPhone}`} className="ml-auto text-brand-400">
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    )}
                    {amb.paramedicName && (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <User className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                        <span>Paramedic: {amb.paramedicName}</span>
                      </div>
                    )}
                  </div>

                  {/* Status selector */}
                  <div className="input-group">
                    <label className="label text-[10px]">Update Status</label>
                    <select
                      value={amb.status}
                      onChange={e => updateStatus(amb.id, e.target.value)}
                      disabled={updating[amb.id]}
                      className="input text-sm py-2">
                      {ALL_STATUSES.map(s => (
                        <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                      ))}
                    </select>
                  </div>

                  {updating[amb.id] && (
                    <p className="text-xs text-gray-500 mt-2 animate-pulse">Updating…</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
    </Layout>
  )
}
