import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/common/Layout'
import { StatCard, PageLoader, SectionHeader } from '../../components/common/UI'
import { adminApi } from '../../api/adminApi'
import {
  Hospital, Users, BedDouble, Ambulance, Activity,
  AlertTriangle, CheckCircle, Clock, TrendingUp, RefreshCw
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import toast from 'react-hot-toast'

const CHART_COLORS = ['#e51d1d','#3b82f6','#10b981','#f97316','#a855f7','#eab308']

const TOOLTIP_STYLE = {
  contentStyle: { background:'#1f2937', border:'1px solid #374151', borderRadius:'12px', fontSize:'12px' },
  labelStyle:   { color:'#f9fafb' },
}

export default function AdminDashboard() {
  const navigate        = useNavigate()
  const [stats,    setStats]    = useState(null)
  const [requests, setRequests] = useState([])
  const [hospitals,setHospitals]= useState([])
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    try {
      const [statsRes, reqRes, hospRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getAllRequests(),
        adminApi.getHospitals(),
      ])
      setStats(statsRes.data)
      setRequests(reqRes.data)
      setHospitals(hospRes.data)
    } catch { toast.error('Failed to load dashboard') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <Layout><PageLoader /></Layout>

  // ── Derived chart data ─────────────────────────────────
  const statusCounts = ['PENDING','ACCEPTED','DISPATCHED','COMPLETED','CANCELLED','REJECTED']
    .map(s => ({ name: s, value: requests.filter(r => r.status === s).length }))

  const priorityData = ['CRITICAL','HIGH','MEDIUM','LOW']
    .map(p => ({ name: p, count: requests.filter(r => r.priority === p).length }))

  const hospitalBedData = hospitals.slice(0, 6).map(h => ({
    name: h.name.split(' ').slice(0, 2).join(' '),
    available: h.beds?.reduce((s, b) => s + (b.availableCount || 0), 0) ?? 0,
    occupied:  h.beds?.reduce((s, b) => s + (b.occupiedCount || 0), 0) ?? 0,
  }))

  // Last 7 days requests (mock daily from existing)
  const today = new Date()
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (6 - i))
    const label = d.toLocaleDateString('en', { weekday: 'short' })
    const count = requests.filter(r => {
      if (!r.createdAt) return false
      const rd = new Date(r.createdAt)
      return rd.getDate() === d.getDate() && rd.getMonth() === d.getMonth()
    }).length
    return { day: label, requests: count }
  })

  return (
    <Layout>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">System-wide analytics and monitoring</p>
        </div>
        <button onClick={load} className="btn-icon mt-1"><RefreshCw className="w-4 h-4 text-gray-400" /></button>
      </div>

      {/* Top KPI stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Hospitals"   value={stats?.totalHospitals}    icon={Hospital}      color="blue"   sub={`${stats?.activeHospitals} active`} />
        <StatCard label="Total Users"       value={stats?.totalUsers}         icon={Users}         color="purple" sub={`${stats?.totalPatients} patients`} />
        <StatCard label="Available Gen. Beds" value={stats?.availableGeneralBeds} icon={BedDouble} color="green" />
        <StatCard label="Available ICU Beds" value={stats?.availableIcuBeds}  icon={BedDouble}     color="red"   />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Requests"    value={stats?.totalRequests}      icon={Activity}      color="orange" />
        <StatCard label="Pending"           value={stats?.pendingRequests}     icon={Clock}         color="yellow" />
        <StatCard label="Today's Requests"  value={stats?.todayRequests}       icon={TrendingUp}    color="brand"  />
        <StatCard label="Completed"         value={stats?.completedRequests}   icon={CheckCircle}   color="green"  />
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Weekly requests area chart */}
        <div className="lg:col-span-2 card">
          <SectionHeader title="Requests This Week" />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#e51d1d" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#e51d1d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill:'#6b7280', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#6b7280', fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="requests" stroke="#e51d1d" strokeWidth={2}
                fill="url(#reqGrad)" dot={{ fill:'#e51d1d', r:3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Request status pie */}
        <div className="card">
          <SectionHeader title="By Status" />
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusCounts.filter(d => d.value > 0)}
                dataKey="value" nameKey="name"
                cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                {statusCounts.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {statusCounts.filter(d => d.value > 0).map((s, i) => (
              <span key={s.name} className="flex items-center gap-1 text-[10px] text-gray-500">
                <span className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                {s.name}: {s.value}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Hospital bed availability */}
        <div className="card">
          <SectionHeader title="Hospital Bed Availability"
            action={<button onClick={() => navigate('/admin/hospitals')} className="text-xs text-brand-400">View all</button>} />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hospitalBedData} barGap={4}>
              <XAxis dataKey="name" tick={{ fill:'#6b7280', fontSize:10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#6b7280', fontSize:10 }} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize:11, color:'#6b7280' }} />
              <Bar dataKey="available" name="Available" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="occupied"  name="Occupied"  fill="#374151" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Priority distribution */}
        <div className="card">
          <SectionHeader title="Requests by Priority" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={priorityData} layout="vertical" barGap={4}>
              <XAxis type="number" tick={{ fill:'#6b7280', fontSize:10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill:'#6b7280', fontSize:10 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="count" name="Requests" radius={[0,4,4,0]}>
                {priorityData.map((entry, i) => (
                  <Cell key={i} fill={
                    entry.name === 'CRITICAL' ? '#ef4444' :
                    entry.name === 'HIGH'     ? '#f97316' :
                    entry.name === 'MEDIUM'   ? '#eab308' : '#3b82f6'
                  } />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Manage Hospitals', icon: Hospital,      to:'/admin/hospitals', color:'blue'   },
          { label:'Manage Users',     icon: Users,          to:'/admin/users',     color:'purple' },
          { label:'All Requests',     icon: Activity,       to:'/admin/requests',  color:'orange' },
          { label:'Critical Alerts',  icon: AlertTriangle,  to:'/admin/requests',  color:'brand'  },
        ].map(({ label, icon: Icon, to, color }) => (
          <button key={label} onClick={() => navigate(to)}
            className="card-hover flex flex-col items-center gap-3 p-5 text-center group">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center
              bg-${color === 'brand' ? 'brand' : color}-950 text-${color === 'brand' ? 'brand' : color}-400
              group-hover:scale-110 transition-transform`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-gray-400">{label}</span>
          </button>
        ))}
      </div>
    </Layout>
  )
}
