import { useState, useEffect, useCallback } from 'react'
import Layout from '../../components/common/Layout'
import { StatusBadge, PriorityBadge, PageLoader, EmptyState } from '../../components/common/UI'
import { hospitalApi } from '../../api/hospitalApi'
import { useWebSocket } from '../../context/WebSocketContext'
import {
  AlertTriangle, CheckCircle, XCircle, Ambulance, Clock,
  RefreshCw, Phone, MapPin, Filter, ChevronDown, ChevronUp, Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

const NEXT_ACTIONS = {
  PENDING:    [{ status: 'ACCEPTED', label: 'Accept',   icon: CheckCircle, cls: 'btn-success' },
               { status: 'REJECTED', label: 'Reject',   icon: XCircle,     cls: 'btn-danger'  }],
  ACCEPTED:   [{ status: 'DISPATCHED', label: 'Dispatch Ambulance', icon: Ambulance, cls: 'btn-primary' }],
  DISPATCHED: [{ status: 'EN_ROUTE',   label: 'Mark En Route', icon: Ambulance, cls: 'btn-secondary' }],
  EN_ROUTE:   [{ status: 'ARRIVED',    label: 'Mark Arrived',  icon: CheckCircle, cls: 'btn-success'  }],
  ARRIVED:    [{ status: 'IN_TREATMENT', label: 'In Treatment', icon: CheckCircle, cls: 'btn-success'  }],
  IN_TREATMENT:[{ status: 'COMPLETED', label: 'Complete',  icon: CheckCircle, cls: 'btn-success'      }],
}

function RejectModal({ open, onConfirm, onCancel }) {
  const [reason, setReason] = useState('')
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="card max-w-sm w-full animate-slide-in">
        <h3 className="font-display font-semibold text-white mb-3">Reject Request</h3>
        <div className="input-group mb-4">
          <label className="label">Reason for rejection *</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)}
            className="input resize-none" rows={3} placeholder="Provide a clear reason…" />
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => { if (!reason.trim()) return toast.error('Reason required'); onConfirm(reason); setReason('') }}
            className="btn-danger flex-1">Confirm Reject</button>
        </div>
      </div>
    </div>
  )
}

export default function EmergencyManagement() {
  const { subscribe }  = useWebSocket()
  const [requests,  setRequests]  = useState([])
  const [ambulances,setAmbulances]= useState([])
  const [loading,   setLoading]   = useState(true)
  const [updating,  setUpdating]  = useState({})
  const [expanded,  setExpanded]  = useState(null)
  const [filter,    setFilter]    = useState('ACTIVE')
  const [rejectId,  setRejectId]  = useState(null)

  const load = useCallback(async () => {
    try {
      const [allRes, ambRes] = await Promise.all([
        hospitalApi.getAllRequests(),
        hospitalApi.getAmbulances(),
      ])
      setRequests(allRes.data)
      setAmbulances(ambRes.data?.filter(a => a.status === 'AVAILABLE') ?? [])
    } catch { toast.error('Failed to load requests') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const unsub = subscribe?.('hospital-emergency', (req) => {
      setRequests(prev => {
        const idx = prev.findIndex(r => r.id === req.id)
        if (idx >= 0) { const u = [...prev]; u[idx] = req; return u }
        return [req, ...prev]
      })
      if (req.status === 'PENDING') {
        toast(`🚨 New ${req.priority} request!`, { duration: 8000 })
      }
    })
    return unsub
  }, [subscribe])

  const updateStatus = async (requestId, status, extra = {}) => {
    setUpdating(u => ({ ...u, [requestId]: true }))
    try {
      const { data } = await hospitalApi.updateRequestStatus(requestId, { status, ...extra })
      setRequests(prev => prev.map(r => r.id === requestId ? data : r))
      toast.success(`Request → ${status}`)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed')
    } finally { setUpdating(u => ({ ...u, [requestId]: false })) }
  }

  const handleReject = async (reason) => {
    await updateStatus(rejectId, 'REJECTED', { rejectionReason: reason })
    setRejectId(null)
  }

  const handleDispatch = async (requestId) => {
    const amb = ambulances[0]
    await updateStatus(requestId, 'DISPATCHED', {
      ambulanceId: amb?.id,
      estimatedArrivalMinutes: 15
    })
  }

  const ACTIVE_STATUSES = ['PENDING','ACCEPTED','DISPATCHED','EN_ROUTE','ARRIVED','IN_TREATMENT']
  const filtered = filter === 'ACTIVE'
    ? requests.filter(r => ACTIVE_STATUSES.includes(r.status))
    : filter === 'ALL' ? requests
    : requests.filter(r => r.status === filter)

  if (loading) return <Layout><PageLoader /></Layout>

  return (
    <Layout>
      <RejectModal open={!!rejectId} onConfirm={handleReject} onCancel={() => setRejectId(null)} />

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="page-title">Emergency Queue</h1>
          <p className="page-subtitle">
            {requests.filter(r => ACTIVE_STATUSES.includes(r.status)).length} active ·{' '}
            {requests.filter(r => r.priority === 'CRITICAL').length} critical
          </p>
        </div>
        <button onClick={load} className="btn-icon mt-1"><RefreshCw className="w-4 h-4 text-gray-400" /></button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {['ACTIVE','PENDING','ACCEPTED','DISPATCHED','COMPLETED','REJECTED','ALL'].map(f => {
          const count = f === 'ACTIVE'
            ? requests.filter(r => ACTIVE_STATUSES.includes(r.status)).length
            : f === 'ALL' ? requests.length
            : requests.filter(r => r.status === f).length
          return (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
                ${filter === f
                  ? 'bg-brand-950 border-brand-700 text-brand-300'
                  : 'bg-gray-800/50 border-gray-800 text-gray-500 hover:border-gray-700'}`}>
              {f} <span className="ml-1 opacity-60">{count}</span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0
        ? <EmptyState icon={CheckCircle} title={filter === 'ACTIVE' ? 'Queue is clear!' : 'No requests'}
            message={filter === 'ACTIVE' ? 'No active emergency requests at this time' : `No ${filter} requests`} />
        : (
          <div className="space-y-4">
            {filtered
              .sort((a, b) => {
                const p = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
                return (p[a.priority] ?? 3) - (p[b.priority] ?? 3)
              })
              .map(req => {
                const isOpen  = expanded === req.id
                const actions = NEXT_ACTIONS[req.status] || []
                const isBusy  = !!updating[req.id]
                return (
                  <div key={req.id} className={`card transition-all
                    ${req.priority === 'CRITICAL' ? 'border-red-900/60 bg-red-950/10' :
                      req.status === 'PENDING'   ? 'border-yellow-900/30' : 'border-gray-800'}`}>

                    {/* Main row */}
                    <div className="flex items-start gap-3 cursor-pointer"
                      onClick={() => setExpanded(isOpen ? null : req.id)}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                        ${req.priority === 'CRITICAL' ? 'bg-red-950 text-red-400' :
                          req.priority === 'HIGH'     ? 'bg-orange-950 text-orange-400' :
                          'bg-gray-800 text-gray-500'}`}>
                        {req.priority === 'CRITICAL'
                          ? <AlertTriangle className="w-5 h-5" />
                          : <Ambulance className="w-5 h-5" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-brand-400 font-semibold">{req.requestNumber}</span>
                          <StatusBadge status={req.status} />
                          <PriorityBadge priority={req.priority} />
                          {req.isEmergency && <span className="badge-red text-[10px]">SOS</span>}
                        </div>
                        <p className="text-sm font-semibold text-white mt-1">{req.patientName}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {req.patientCondition || req.requestType?.replace('_', ' ')}
                        </p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {req.patientAddress && (
                            <span className="text-xs text-gray-600 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{req.patientAddress}
                            </span>
                          )}
                          <span className="text-xs text-gray-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {req.createdAt ? formatDistanceToNow(new Date(req.createdAt), { addSuffix: true }) : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-2">
                        {actions.length > 0 && !isBusy && (
                          <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                            {actions.map(({ status, label, icon: Icon, cls }) => (
                              <button key={status}
                                className={`${cls} btn-sm text-xs`}
                                onClick={() => {
                                  if (status === 'REJECTED') setRejectId(req.id)
                                  else if (status === 'DISPATCHED') handleDispatch(req.id)
                                  else updateStatus(req.id, status)
                                }}>
                                <Icon className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        {isBusy && <Loader2 className="w-4 h-4 animate-spin text-brand-400" />}
                        <button className="btn-icon flex-shrink-0">
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded */}
                    {isOpen && (
                      <div className="mt-4 pt-4 border-t border-gray-800 animate-fade-in">
                        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mb-4">
                          {[
                            ['Phone',       req.patientPhone],
                            ['Request Type',req.requestType?.replace('_', ' ')],
                            ['Ambulance',   req.ambulanceNumber || 'Not assigned'],
                            ['ETA',         req.estimatedArrivalMinutes ? `${req.estimatedArrivalMinutes} min` : '—'],
                          ].map(([l, v]) => (
                            <div key={l} className="flex gap-2">
                              <span className="text-xs text-gray-600 w-28 flex-shrink-0">{l}</span>
                              <span className="text-xs text-gray-300 font-medium">{v || '—'}</span>
                            </div>
                          ))}
                        </div>
                        {req.symptoms && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {req.symptoms.split(',').map(s => (
                              <span key={s} className="badge-gray text-[10px]">{s.trim()}</span>
                            ))}
                          </div>
                        )}
                        {req.patientPhone && (
                          <a href={`tel:${req.patientPhone}`} className="btn-secondary btn-sm inline-flex">
                            <Phone className="w-3.5 h-3.5" /> Call Patient
                          </a>
                        )}
                        {req.rejectionReason && (
                          <p className="text-xs text-red-400 mt-2">Rejected: {req.rejectionReason}</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        )}
    </Layout>
  )
}
