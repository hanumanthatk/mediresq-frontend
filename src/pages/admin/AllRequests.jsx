import { useState, useEffect, useCallback } from 'react'
import Layout from '../../components/common/Layout'
import { StatusBadge, PriorityBadge, PageLoader, EmptyState } from '../../components/common/UI'
import { adminApi } from '../../api/adminApi'
import {
  Activity, Search, RefreshCw, Clock, MapPin,
  Hospital, User, ChevronDown, ChevronUp, Ambulance
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import toast from 'react-hot-toast'

export default function AllRequests() {
  const [requests,  setRequests]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [status,    setStatus]    = useState('ALL')
  const [priority,  setPriority]  = useState('ALL')
  const [expanded,  setExpanded]  = useState(null)
  const [sortBy,    setSortBy]    = useState('newest')

  const load = useCallback(async () => {
    try { const { data } = await adminApi.getAllRequests(); setRequests(data) }
    catch { toast.error('Failed to load requests') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = requests
    .filter(r => {
      const q = search.toLowerCase()
      const matchSearch = !search ||
        r.requestNumber?.toLowerCase().includes(q) ||
        r.patientName?.toLowerCase().includes(q) ||
        r.hospitalName?.toLowerCase().includes(q)
      const matchStatus   = status   === 'ALL' || r.status   === status
      const matchPriority = priority === 'ALL' || r.priority === priority
      return matchSearch && matchStatus && matchPriority
    })
    .sort((a, b) => {
      if (sortBy === 'newest')   return new Date(b.createdAt) - new Date(a.createdAt)
      if (sortBy === 'oldest')   return new Date(a.createdAt) - new Date(b.createdAt)
      if (sortBy === 'priority') {
        const p = { CRITICAL:0, HIGH:1, MEDIUM:2, LOW:3 }
        return (p[a.priority]??3) - (p[b.priority]??3)
      }
      return 0
    })

  const STATUSES   = ['ALL','PENDING','ACCEPTED','DISPATCHED','EN_ROUTE','COMPLETED','CANCELLED','REJECTED']
  const PRIORITIES = ['ALL','CRITICAL','HIGH','MEDIUM','LOW']

  if (loading) return <Layout><PageLoader /></Layout>

  return (
    <Layout>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="page-title">All Requests</h1>
          <p className="page-subtitle">{requests.length} total · {requests.filter(r => r.status === 'PENDING').length} pending</p>
        </div>
        <button onClick={load} className="btn-icon mt-1"><RefreshCw className="w-4 h-4 text-gray-400" /></button>
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="input pl-10" placeholder="Search by request #, patient, hospital…" />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input sm:w-40">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priority">By Priority</option>
          </select>
        </div>

        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all
                ${status === s ? 'bg-brand-950 border-brand-700 text-brand-300' :
                'bg-gray-800/50 border-gray-800 text-gray-500 hover:border-gray-700'}`}>
              {s}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          {PRIORITIES.map(p => (
            <button key={p} onClick={() => setPriority(p)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all
                ${priority === p ? 'bg-orange-950 border-orange-700 text-orange-300' :
                'bg-gray-800/50 border-gray-800 text-gray-500 hover:border-gray-700'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-gray-600 mb-4">{filtered.length} results</p>

      {filtered.length === 0
        ? <EmptyState icon={Activity} title="No requests found" />
        : (
          <div className="space-y-3">
            {filtered.map(req => {
              const isOpen = expanded === req.id
              return (
                <div key={req.id}
                  className={`card transition-all cursor-pointer hover:border-gray-700
                    ${req.priority === 'CRITICAL' ? 'border-red-900/40 bg-red-950/5' : ''}`}
                  onClick={() => setExpanded(isOpen ? null : req.id)}>

                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                      ${req.isEmergency ? 'bg-red-950 text-red-400' : 'bg-gray-800 text-gray-400'}`}>
                      <Activity className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-brand-400 font-semibold">{req.requestNumber}</span>
                        <StatusBadge status={req.status} />
                        <PriorityBadge priority={req.priority} />
                        {req.isEmergency && <span className="badge-red text-[10px]">SOS</span>}
                      </div>
                      <div className="flex items-center gap-4 mt-1 flex-wrap text-xs text-gray-500">
                        <span className="flex items-center gap-1 text-gray-300">
                          <User className="w-3 h-3" />{req.patientName}
                        </span>
                        {req.hospitalName && (
                          <span className="flex items-center gap-1">
                            <Hospital className="w-3 h-3" />{req.hospitalName}
                          </span>
                        )}
                        {req.patientAddress && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{req.patientAddress}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {req.createdAt ? formatDistanceToNow(new Date(req.createdAt), { addSuffix: true }) : ''}
                        </span>
                      </div>
                    </div>

                    <button className="btn-icon flex-shrink-0">
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {isOpen && (
                    <div className="mt-4 pt-4 border-t border-gray-800 animate-fade-in">
                      <div className="grid sm:grid-cols-3 gap-x-6 gap-y-2 mb-3">
                        {[
                          ['Patient',      req.patientName],
                          ['Phone',        req.patientPhone],
                          ['Hospital',     req.hospitalName || '—'],
                          ['Ambulance',    req.ambulanceNumber || '—'],
                          ['Request Type', req.requestType?.replace('_',' ')],
                          ['Created',      req.createdAt ? format(new Date(req.createdAt),'dd MMM yyyy HH:mm') : '—'],
                          ['Completed',    req.completedAt ? format(new Date(req.completedAt),'dd MMM yyyy HH:mm') : '—'],
                          ['ETA',          req.estimatedArrivalMinutes ? `${req.estimatedArrivalMinutes} min` : '—'],
                        ].map(([l, v]) => (
                          <div key={l} className="flex gap-2">
                            <span className="text-xs text-gray-600 w-24 flex-shrink-0">{l}</span>
                            <span className="text-xs text-gray-300 font-medium truncate">{v}</span>
                          </div>
                        ))}
                      </div>
                      {req.patientCondition && (
                        <div className="bg-gray-800/40 rounded-xl p-3">
                          <p className="text-xs text-gray-500 mb-1">Condition</p>
                          <p className="text-sm text-gray-300">{req.patientCondition}</p>
                        </div>
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
