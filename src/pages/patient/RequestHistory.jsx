import { useState, useEffect, useCallback } from 'react'
import Layout from '../../components/common/Layout'
import { StatusBadge, PriorityBadge, PageLoader, EmptyState, ConfirmModal } from '../../components/common/UI'
import { emergencyApi } from '../../api/emergencyApi'
import { useWebSocket } from '../../context/WebSocketContext'
import {
  ClipboardList, MapPin, Clock, Ambulance, Hospital,
  ChevronDown, ChevronUp, XCircle, RefreshCw, Phone
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDistanceToNow, format } from 'date-fns'

const STATUS_STEPS = ['PENDING','ACCEPTED','DISPATCHED','EN_ROUTE','ARRIVED','IN_TREATMENT','COMPLETED']

function StatusTimeline({ status }) {
  const current = STATUS_STEPS.indexOf(status)
  const isCancelled = status === 'CANCELLED' || status === 'REJECTED'
  return (
    <div className="flex items-center gap-0 mt-3 overflow-x-auto pb-1">
      {STATUS_STEPS.map((s, i) => (
        <div key={s} className="flex items-center flex-shrink-0">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
              ${isCancelled ? 'border-gray-700 bg-gray-800' :
                i < current  ? 'border-emerald-500 bg-emerald-500' :
                i === current ? 'border-brand-500 bg-brand-500 shadow-[0_0_10px_rgba(229,29,29,0.5)]' :
                'border-gray-700 bg-gray-800'}`}>
              {i < current && !isCancelled && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
            <span className={`text-[9px] font-medium whitespace-nowrap
              ${i === current && !isCancelled ? 'text-brand-400' :
                i < current && !isCancelled   ? 'text-emerald-500' : 'text-gray-600'}`}>
              {s.replace('_', ' ')}
            </span>
          </div>
          {i < STATUS_STEPS.length - 1 && (
            <div className={`h-0.5 w-8 mx-1 mb-4 flex-shrink-0 transition-all
              ${!isCancelled && i < current ? 'bg-emerald-500' : 'bg-gray-700'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function RequestHistory() {
  const { subscribe }   = useWebSocket()
  const [requests, setRequests] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [cancelId, setCancelId] = useState(null)
  const [filter,   setFilter]   = useState('ALL')

  const load = useCallback(async () => {
    try {
      const { data } = await emergencyApi.getMyRequests()
      setRequests(data)
    } catch { toast.error('Failed to load requests') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const unsub = subscribe?.('emergency', (upd) => {
      setRequests(prev => {
        const idx = prev.findIndex(r => r.id === upd.id)
        if (idx >= 0) { const u = [...prev]; u[idx] = upd; return u }
        return [upd, ...prev]
      })
      toast(`Request #${upd.requestNumber} → ${upd.status}`, { icon: '🔔' })
    })
    return unsub
  }, [subscribe])

  const handleCancel = async () => {
    try {
      const { data } = await emergencyApi.cancelRequest(cancelId)
      setRequests(prev => prev.map(r => r.id === cancelId ? data : r))
      toast.success('Request cancelled')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Cannot cancel request')
    } finally { setCancelId(null) }
  }

  const FILTERS = ['ALL','PENDING','ACCEPTED','DISPATCHED','COMPLETED','CANCELLED','REJECTED']
  const filtered = filter === 'ALL' ? requests : requests.filter(r => r.status === filter)

  if (loading) return <Layout><PageLoader /></Layout>

  return (
    <Layout>
      <ConfirmModal
        open={!!cancelId} danger
        title="Cancel Request"
        message="Are you sure you want to cancel this emergency request?"
        confirmLabel="Yes, Cancel"
        onConfirm={handleCancel}
        onCancel={() => setCancelId(null)} />

      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">My Requests</h1>
          <p className="page-subtitle">{requests.length} total requests · live tracking enabled</p>
        </div>
        <button onClick={load} className="btn-icon mt-1">
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
              ${filter === f
                ? 'bg-brand-950 border-brand-700 text-brand-300'
                : 'bg-gray-800/50 border-gray-800 text-gray-500 hover:border-gray-700'}`}>
            {f}
            {f !== 'ALL' && (
              <span className="ml-1.5 opacity-60">
                {requests.filter(r => r.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0
        ? <EmptyState icon={ClipboardList} title="No requests found"
            message={filter === 'ALL' ? "You haven't made any emergency requests yet" : `No ${filter.toLowerCase()} requests`} />
        : (
          <div className="space-y-4">
            {filtered.map(req => {
              const isOpen = expanded === req.id
              const canCancel = ['PENDING'].includes(req.status)
              return (
                <div key={req.id} className={`card transition-all
                  ${req.isEmergency ? 'border-brand-900/50' : ''}`}>

                  {/* Header row */}
                  <div className="flex items-start gap-3 cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : req.id)}>

                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                      ${req.requestType === 'SOS' ? 'bg-brand-950 text-brand-400' :
                        req.requestType === 'AMBULANCE' ? 'bg-orange-950 text-orange-400' :
                        'bg-blue-950 text-blue-400'}`}>
                      {req.requestType === 'AMBULANCE' ? <Ambulance className="w-5 h-5" /> :
                       req.requestType === 'SOS'       ? <span className="font-bold text-xs">SOS</span> :
                       <Hospital className="w-5 h-5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-brand-400 font-semibold">{req.requestNumber}</span>
                        <StatusBadge status={req.status} />
                        <PriorityBadge priority={req.priority} />
                        {req.isEmergency && <span className="badge-red">🚨 EMERGENCY</span>}
                      </div>
                      <p className="text-sm text-gray-300 mt-1 truncate">
                        {req.patientCondition || req.requestType?.replace('_', ' ')}
                      </p>
                      <div className="flex items-center gap-4 mt-1 flex-wrap">
                        {req.hospitalName && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Hospital className="w-3 h-3" />{req.hospitalName}
                          </span>
                        )}
                        {req.patientAddress && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{req.patientAddress}
                          </span>
                        )}
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {req.createdAt
                            ? formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })
                            : '—'}
                        </span>
                      </div>
                    </div>

                    <button className="btn-icon ml-2 flex-shrink-0">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Status timeline */}
                  <StatusTimeline status={req.status} />

                  {/* Expanded details */}
                  {isOpen && (
                    <div className="mt-4 pt-4 border-t border-gray-800 animate-fade-in space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <InfoRow label="Request Type"  value={req.requestType?.replace('_', ' ')} />
                          <InfoRow label="Priority"      value={req.priority} />
                          <InfoRow label="Hospital"      value={req.hospitalName || 'Not assigned'} />
                          <InfoRow label="Ambulance"     value={req.ambulanceNumber || 'Not assigned'} />
                        </div>
                        <div className="space-y-2">
                          <InfoRow label="Submitted"
                            value={req.createdAt ? format(new Date(req.createdAt), 'dd MMM yyyy, HH:mm') : '—'} />
                          {req.estimatedArrivalMinutes && (
                            <InfoRow label="ETA" value={`${req.estimatedArrivalMinutes} minutes`} />
                          )}
                          {req.completedAt && (
                            <InfoRow label="Completed"
                              value={format(new Date(req.completedAt), 'dd MMM yyyy, HH:mm')} />
                          )}
                          {req.rejectionReason && (
                            <InfoRow label="Rejection Reason" value={req.rejectionReason} error />
                          )}
                        </div>
                      </div>

                      {req.symptoms && (
                        <div>
                          <p className="text-xs text-gray-600 mb-2">Symptoms</p>
                          <div className="flex flex-wrap gap-2">
                            {req.symptoms.split(',').map(s => (
                              <span key={s} className="badge-gray">{s.trim()}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {req.notes && (
                        <div className="bg-gray-800/40 rounded-xl p-3">
                          <p className="text-xs text-gray-500 mb-1">Notes</p>
                          <p className="text-sm text-gray-300">{req.notes}</p>
                        </div>
                      )}

                      <div className="flex gap-2 justify-end">
                        {req.hospitalPhone && (
                          <a href={`tel:${req.hospitalPhone}`} className="btn-secondary btn-sm">
                            <Phone className="w-3.5 h-3.5" /> Call Hospital
                          </a>
                        )}
                        {canCancel && (
                          <button onClick={() => setCancelId(req.id)} className="btn-danger btn-sm">
                            <XCircle className="w-3.5 h-3.5" /> Cancel Request
                          </button>
                        )}
                      </div>
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

function InfoRow({ label, value, error }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-gray-600 w-32 flex-shrink-0">{label}</span>
      <span className={`text-xs font-medium ${error ? 'text-red-400' : 'text-gray-300'}`}>{value}</span>
    </div>
  )
}
