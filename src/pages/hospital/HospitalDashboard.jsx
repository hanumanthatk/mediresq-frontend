import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/common/Layout'
import { StatCard, StatusBadge, PriorityBadge, PageLoader, EmptyState } from '../../components/common/UI'
import { hospitalApi }  from '../../api/hospitalApi'
import { useWebSocket } from '../../context/WebSocketContext'
import { useAuth }      from '../../context/AuthContext'
import {
  BedDouble, Ambulance, Activity, AlertTriangle, Clock,
  TrendingUp, Users, CheckCircle, ChevronRight, RefreshCw
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

const BED_COLORS = {
  GENERAL:'#3b82f6', ICU:'#ef4444', CCU:'#f97316',
  NICU:'#a855f7', EMERGENCY:'#10b981', HDU:'#eab308'
}

export default function HospitalDashboard() {
  const { user }      = useAuth()
  const { subscribe } = useWebSocket()
  const navigate      = useNavigate()

  const [hospital,  setHospital]  = useState(null)
  const [requests,  setRequests]  = useState([])
  const [loading,   setLoading]   = useState(true)

  const load = useCallback(async () => {
    try {
      const [hospRes, reqRes] = await Promise.all([
        hospitalApi.getDashboard(),
        hospitalApi.getActiveRequests(),
      ])
      setHospital(hospRes.data)
      setRequests(reqRes.data)
    } catch (e) {
      if (e.response?.status === 404) navigate('/hospital/setup')
      else toast.error('Failed to load dashboard')
    } finally { setLoading(false) }
  }, [navigate])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const unsubE = subscribe?.('hospital-emergency', (req) => {
      setRequests(prev => {
        const idx = prev.findIndex(r => r.id === req.id)
        if (idx >= 0) { const u = [...prev]; u[idx] = req; return u }
        return [req, ...prev]
      })
      toast(`🚨 New ${req.priority} request`, { duration: 6000 })
    })
    const unsubB = subscribe?.('beds-update', (bed) => {
      setHospital(prev => prev ? {
        ...prev,
        beds: prev.beds?.map(b => b.id === bed.id ? bed : b) ?? [bed]
      } : prev)
    })
    return () => { unsubE?.(); unsubB?.() }
  }, [subscribe])

  if (loading) return <Layout><PageLoader /></Layout>

  if (!hospital) return (
    <Layout>
      <EmptyState icon={AlertTriangle} title="Hospital profile not set up"
        action={<button onClick={() => navigate('/hospital/setup')} className="btn-primary">Complete Setup</button>} />
    </Layout>
  )

  const totalBeds     = hospital.beds?.reduce((s, b) => s + (b.totalCount || 0), 0) ?? 0
  const availableBeds = hospital.beds?.reduce((s, b) => s + (b.availableCount || 0), 0) ?? 0
  const occupancyPct  = totalBeds > 0 ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100) : 0
  const critical      = requests.filter(r => r.priority === 'CRITICAL').length
  const bedChartData  = hospital.beds?.map(b => ({
    name: b.bedType, available: b.availableCount, occupied: b.occupiedCount,
  })) ?? []

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="page-title">{hospital.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${hospital.isVerified ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
            <p className="text-gray-500 text-sm">
              {hospital.isVerified ? 'Verified & Active' : 'Pending Verification'} · {hospital.city}
            </p>
            {critical > 0 && (
              <span className="badge-red animate-pulse-fast">
                🚨 {critical} CRITICAL
              </span>
            )}
          </div>
        </div>
        <button onClick={load} className="btn-icon"><RefreshCw className="w-4 h-4 text-gray-400" /></button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Beds"       value={totalBeds}                  icon={BedDouble}   color="blue"   />
        <StatCard label="Available Beds"   value={availableBeds}              icon={CheckCircle} color="green"
          sub={`${occupancyPct}% occupied`} />
        <StatCard label="Active Requests"  value={requests.length}            icon={Activity}    color="orange" />
        <StatCard label="Ambulances Ready" value={hospital.availableAmbulances ?? 0} icon={Ambulance} color="brand" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Bed availability chart */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white">Bed Availability</h2>
            <button onClick={() => navigate('/hospital/beds')} className="text-xs text-brand-400 flex items-center gap-1">
              Manage <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {bedChartData.length === 0
            ? <EmptyState title="No bed data" message="Add bed counts in Bed Management" />
            : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={bedChartData} barGap={4}>
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '12px', fontSize: '12px' }}
                    labelStyle={{ color: '#f9fafb' }} />
                  <Bar dataKey="available" name="Available" radius={[6, 6, 0, 0]}>
                    {bedChartData.map((entry, i) => (
                      <Cell key={i} fill={BED_COLORS[entry.name] || '#6b7280'} fillOpacity={0.9} />
                    ))}
                  </Bar>
                  <Bar dataKey="occupied" name="Occupied" radius={[6, 6, 0, 0]} fill="#374151" />
                </BarChart>
              </ResponsiveContainer>
            )}

          {/* Bed cards */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-4">
            {hospital.beds?.map(b => (
              <div key={b.bedType} className="bg-gray-800/50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">{b.bedType}</p>
                <p className={`font-display font-bold text-xl ${b.availableCount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {b.availableCount}
                </p>
                <p className="text-[10px] text-gray-600">/ {b.totalCount}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Active emergency queue */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white">Emergency Queue</h2>
            <button onClick={() => navigate('/hospital/emergency')}
              className="text-xs text-brand-400 flex items-center gap-1">
              Full view <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {requests.length === 0
            ? <EmptyState icon={CheckCircle} title="Queue is clear" message="No active emergency requests" />
            : (
              <div className="space-y-3">
                {requests.slice(0, 6).map(req => (
                  <div key={req.id}
                    className={`p-3 rounded-xl border transition-all cursor-pointer hover:border-gray-700
                      ${req.priority === 'CRITICAL' ? 'border-red-900/50 bg-red-950/20' : 'border-gray-800 bg-gray-800/30'}`}
                    onClick={() => navigate('/hospital/emergency')}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-[10px] text-brand-400">{req.requestNumber}</span>
                      <PriorityBadge priority={req.priority} />
                    </div>
                    <p className="text-xs text-gray-300 truncate">{req.patientName}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {req.patientCondition || req.requestType}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <StatusBadge status={req.status} />
                      <span className="text-[10px] text-gray-600 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {req.createdAt
                          ? formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })
                          : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        {[
          { label: 'Update Beds',       icon: BedDouble,     to: '/hospital/beds',        color: 'blue'   },
          { label: 'Manage Ambulances', icon: Ambulance,     to: '/hospital/ambulances',  color: 'orange' },
          { label: 'Emergency Queue',   icon: AlertTriangle, to: '/hospital/emergency',   color: 'brand'  },
          { label: 'All Requests',      icon: Activity,      to: '/hospital/emergency',   color: 'green'  },
        ].map(({ label, icon: Icon, to, color }) => (
          <button key={label} onClick={() => navigate(to)}
            className="card-hover flex flex-col items-center gap-3 p-4 text-center">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center
              bg-${color === 'brand' ? 'brand' : color}-950 text-${color === 'brand' ? 'brand' : color}-400`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-gray-400">{label}</span>
          </button>
        ))}
      </div>
    </Layout>
  )
}
