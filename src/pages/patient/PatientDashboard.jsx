import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/common/Layout'
import { StatCard, StatusBadge, PriorityBadge, PageLoader, EmptyState } from '../../components/common/UI'
import { emergencyApi } from '../../api/emergencyApi'
import { hospitalApi }  from '../../api/hospitalApi'
import { adminApi }     from '../../api/adminApi'
import { useAuth }      from '../../context/AuthContext'
import { useWebSocket } from '../../context/WebSocketContext'
import {
  AlertTriangle, Activity, BedDouble, Heart, Bell, MapPin,
  Ambulance, Clock, CheckCircle2, XCircle, ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

export default function PatientDashboard() {
  const { user }      = useAuth()
  const { subscribe } = useWebSocket()
  const navigate      = useNavigate()

  const [requests,  setRequests]  = useState([])
  const [hospitals, setHospitals] = useState([])
  const [notifs,    setNotifs]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [sosLoading, setSosLoading] = useState(false)

  const load = useCallback(async () => {
    try {
      const [reqRes, hospRes, notifRes] = await Promise.all([
        emergencyApi.getMyRequests(),
        hospitalApi.getAll(),
        adminApi.getNotifications(),
      ])
      setRequests(reqRes.data?.slice(0, 5) ?? [])
      setHospitals(hospRes.data?.slice(0, 4) ?? [])
      setNotifs(notifRes.data?.filter(n => !n.isRead)?.slice(0, 5) ?? [])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // Real-time: receive emergency updates
  useEffect(() => {
    const unsub = subscribe?.('emergency', (data) => {
      if (data.patientId === user?.id) {
        setRequests(prev => {
          const idx = prev.findIndex(r => r.id === data.id)
          if (idx >= 0) { const u = [...prev]; u[idx] = data; return u }
          return [data, ...prev]
        })
        toast(`Request ${data.requestNumber} → ${data.status}`, { icon: '🔔' })
      }
    })
    return unsub
  }, [subscribe, user?.id])

  const handleSOS = async () => {
    if (sosLoading) return
    setSosLoading(true)
    try {
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          try {
            await emergencyApi.sendSOS(coords.latitude, coords.longitude, '')
            toast.success('🚨 SOS sent! Help is on the way.')
            navigate('/patient/history')
          } catch { toast.error('SOS failed. Please try again.') }
          finally { setSosLoading(false) }
        },
        async () => {
          try {
            await emergencyApi.sendSOS(null, null, 'Location unavailable')
            toast.success('🚨 SOS sent without location.')
            navigate('/patient/history')
          } catch { toast.error('SOS failed.') }
          finally { setSosLoading(false) }
        }
      )
    } catch { setSosLoading(false) }
  }

  if (loading) return <Layout><PageLoader /></Layout>

  const active  = requests.filter(r => !['COMPLETED','CANCELLED','REJECTED'].includes(r.status))
  const totalAvailableBeds = hospitals.reduce((s, h) =>
    s + (h.beds?.reduce((b, bed) => b + (bed.availableCount || 0), 0) ?? 0), 0)

  return (
    <Layout>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">
          Welcome back, <span className="text-brand-400">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="page-subtitle">Your health dashboard — real-time hospital & emergency status</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Nearby Hospitals"  value={hospitals.length}    icon={Heart}       color="brand"  />
        <StatCard label="Available Beds"    value={totalAvailableBeds}  icon={BedDouble}   color="green"  />
        <StatCard label="Active Requests"   value={active.length}       icon={Activity}    color="orange" />
        <StatCard label="Notifications"     value={notifs.length}       icon={Bell}        color="blue"   />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* SOS Panel */}
        <div className="lg:col-span-1">
          <div className="card flex flex-col items-center text-center gap-6 py-8">
            <div>
              <p className="font-display font-bold text-white text-lg">Emergency SOS</p>
              <p className="text-gray-500 text-sm mt-1">Press and hold for instant emergency alert</p>
            </div>
            <button onClick={handleSOS} disabled={sosLoading}
              className="sos-btn" title="Send SOS">
              {sosLoading ? '...' : 'SOS'}
            </button>
            <div className="flex gap-2 w-full">
              <button onClick={() => navigate('/patient/emergency')}
                className="btn-secondary flex-1 text-sm">
                <Ambulance className="w-4 h-4" /> Request Ambulance
              </button>
            </div>
          </div>

          {/* Unread notifications */}
          {notifs.length > 0 && (
            <div className="card mt-4">
              <p className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
                <Bell className="w-4 h-4 text-brand-400" /> Recent Alerts
              </p>
              <div className="space-y-2">
                {notifs.map(n => (
                  <div key={n.id} className="flex items-start gap-2 p-2 rounded-xl bg-gray-800/40">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-300">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent requests */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-white">Recent Requests</h2>
              <button onClick={() => navigate('/patient/history')}
                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {requests.length === 0
              ? <EmptyState title="No requests yet"
                  message="Use the SOS button or request an ambulance"
                  action={<button onClick={() => navigate('/patient/emergency')}
                    className="btn-primary btn-sm">Make Request</button>} />
              : (
                <div className="space-y-3">
                  {requests.map(req => (
                    <div key={req.id}
                      className="flex items-start gap-3 p-3 rounded-xl bg-gray-800/40 hover:bg-gray-800/60 transition-colors cursor-pointer"
                      onClick={() => navigate('/patient/history')}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                        ${req.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-400' :
                          req.status === 'REJECTED' || req.status === 'CANCELLED' ? 'bg-red-950 text-red-400' :
                          'bg-orange-950 text-orange-400'}`}>
                        {req.status === 'COMPLETED'
                          ? <CheckCircle2 className="w-4 h-4" />
                          : req.status === 'REJECTED'
                          ? <XCircle className="w-4 h-4" />
                          : <Activity className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-brand-400">{req.requestNumber}</span>
                          <StatusBadge status={req.status} />
                          <PriorityBadge priority={req.priority} />
                        </div>
                        <p className="text-sm text-gray-300 mt-1 truncate">
                          {req.patientCondition || req.requestType}
                        </p>
                        {req.hospitalName && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {req.hospitalName}
                          </p>
                        )}
                        <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {req.createdAt ? formatDistanceToNow(new Date(req.createdAt), { addSuffix: true }) : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* Nearby hospitals quick view */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-white">Nearby Hospitals</h2>
              <button onClick={() => navigate('/patient/hospitals')}
                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                Find more <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {hospitals.map(h => (
                <div key={h.id}
                  className="p-3 rounded-xl bg-gray-800/40 hover:bg-gray-800/70 transition-colors cursor-pointer"
                  onClick={() => navigate('/patient/hospitals')}>
                  <p className="font-semibold text-sm text-white truncate">{h.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{h.city} • {h.type}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {h.beds?.map(b => (
                      <span key={b.bedType} className={`text-xs font-medium
                        ${b.availableCount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {b.bedType}: {b.availableCount}/{b.totalCount}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
